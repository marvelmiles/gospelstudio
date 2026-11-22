import express, {
  type ErrorRequestHandler,
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  RELAY_PATHS,
  sessionIdSchema,
  sessionTokenSchema,
  setDestinationsRequestSchema,
} from "../../../src/features/liveStream/lib/liveRelayContract";
import { isOriginAllowed } from "../config/relayEnv";
import { RelayError, sessionNotFound } from "../errors";
import type { Logger } from "../logger";
import type { GuardDestination } from "../media/destinationGuard";
import type { LiveSession } from "../sessions/liveSession";
import type { SessionRegistry } from "../sessions/sessionRegistry";

const JSON_BODY_LIMIT = "32kb";
const SESSION_CREATION_WINDOW_MS = 10 * 60 * 1000;
const SESSION_CREATIONS_PER_WINDOW = 30;
const REQUESTS_PER_MINUTE = 600;
const PREFLIGHT_MAX_AGE_SECONDS = 600;

export interface RelayAppOptions {
  registry: SessionRegistry;
  allowedOrigins: readonly string[];
  guardDestination: GuardDestination;
  trustProxyHops: number;
  logger: Logger;
}

type SessionLocals = { session: LiveSession };

const bearerSchema = z
  .string()
  .max(300)
  .regex(/^Bearer \S+$/);

const sendError = (response: Response, error: RelayError): void => {
  if (error.code === "unauthorized")
    response.setHeader("WWW-Authenticate", 'Bearer realm="live-relay"');
  response
    .status(error.status)
    .json({ error: { code: error.code, message: error.message } });
};

const parseBody = <S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): z.output<S> => {
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new RelayError(
      400,
      "invalid_request",
      parsed.error.issues[0]?.message ?? "The request is not valid.",
    );
  return parsed.data;
};

const securityHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  next();
};

const corsFor =
  (allowedOrigins: readonly string[]): RequestHandler =>
  (request, response, next) => {
    const origin = request.headers.origin;
    const isAllowed = isOriginAllowed(allowedOrigins, origin);
    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    if (!isAllowed) {
      sendError(
        response,
        new RelayError(
          403,
          "forbidden_origin",
          `This site (${origin}) is not allowed to use the streaming relay. Add it to ALLOWED_ORIGINS on the relay server.`,
        ),
      );
      return;
    }
    if (request.method === "OPTIONS") {
      response.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      response.setHeader(
        "Access-Control-Allow-Headers",
        "Authorization, Content-Type",
      );
      response.setHeader(
        "Access-Control-Max-Age",
        String(PREFLIGHT_MAX_AGE_SECONDS),
      );
      response.status(204).end();
      return;
    }
    next();
  };

const limiter = (windowMs: number, limit: number): RequestHandler =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_request, response) =>
      sendError(
        response,
        new RelayError(
          429,
          "rate_limited",
          "Too many requests from this network. Wait a moment and try again.",
        ),
      ),
  });

const requireJson: RequestHandler = (request, _response, next) => {
  if (!request.is("application/json"))
    throw new RelayError(
      415,
      "unsupported_media_type",
      "Send the request as JSON.",
    );
  next();
};

const sessionAuth =
  (registry: SessionRegistry): RequestHandler =>
  (request, response, next) => {
    const sessionId = sessionIdSchema.safeParse(request.params.sessionId);
    const session = sessionId.success
      ? registry.find(sessionId.data)
      : undefined;
    if (!session) throw sessionNotFound();
    const authorization = bearerSchema.safeParse(request.headers.authorization);
    const token = authorization.success
      ? sessionTokenSchema.safeParse(authorization.data.slice("Bearer ".length))
      : null;
    if (!token?.success || !session.verifyToken(token.data))
      throw new RelayError(
        401,
        "unauthorized",
        "This request is missing its live session key.",
      );
    (response.locals as SessionLocals).session = session;
    next();
  };

const sessionOf = (response: Response): LiveSession =>
  (response.locals as SessionLocals).session;

const methodNotAllowed =
  (allowed: string): RequestHandler =>
  (_request, response) => {
    response.setHeader("Allow", allowed);
    sendError(
      response,
      new RelayError(
        405,
        "method_not_allowed",
        "This method is not supported here.",
      ),
    );
  };

export const createRelayApp = ({
  registry,
  allowedOrigins,
  guardDestination,
  trustProxyHops,
  logger,
}: RelayAppOptions): Express => {
  const app = express();
  const requireSession = sessionAuth(registry);
  app.disable("x-powered-by");
  app.set("trust proxy", trustProxyHops);
  app.use(securityHeaders);
  app.use(corsFor(allowedOrigins));
  app.use(limiter(60 * 1000, REQUESTS_PER_MINUTE));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.get(RELAY_PATHS.health, (_request, response) => {
    response.json({
      data: {
        status: "ok",
        sessions: registry.size,
        capacity: registry.capacity,
      },
    });
  });

  app.post(
    RELAY_PATHS.sessions,
    limiter(SESSION_CREATION_WINDOW_MS, SESSION_CREATIONS_PER_WINDOW),
    (_request, response) => {
      const { credentials } = registry.create();
      logger.info("Session created", { sessionId: credentials.sessionId });
      response.status(201).json({ data: credentials });
    },
  );
  app.all(RELAY_PATHS.sessions, methodNotAllowed("POST"));

  const sessionPath = RELAY_PATHS.session(":sessionId");
  app.get(sessionPath, requireSession, (_request, response) => {
    response.json({ data: sessionOf(response).snapshot() });
  });
  app.delete(sessionPath, requireSession, (_request, response) => {
    const session = sessionOf(response);
    session.end();
    logger.info("Session ended by the studio", { sessionId: session.id });
    response.json({ data: session.snapshot() });
  });
  app.all(sessionPath, methodNotAllowed("GET, DELETE"));

  const destinationsPath = RELAY_PATHS.destinations(":sessionId");
  app.put(
    destinationsPath,
    requireSession,
    requireJson,
    async (request: Request, response: Response) => {
      const session = sessionOf(response);
      const { destinations } = parseBody(
        setDestinationsRequestSchema,
        request.body,
      );
      await Promise.all(destinations.map(({ url }) => guardDestination(url)));
      if (session.hasEnded) throw sessionNotFound();
      response.json({ data: session.setDestinations(destinations) });
    },
  );
  app.all(destinationsPath, methodNotAllowed("PUT"));

  app.use((_request: Request, response: Response) => {
    sendError(response, new RelayError(404, "not_found", "Unknown endpoint."));
  });

  const handleErrors: ErrorRequestHandler = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof RelayError) {
      sendError(response, error);
      return;
    }
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : 500;
    if (status === 413) {
      sendError(
        response,
        new RelayError(413, "payload_too_large", "The request is too large."),
      );
      return;
    }
    if (status === 400) {
      sendError(
        response,
        new RelayError(
          400,
          "invalid_request",
          "The request body is not valid JSON.",
        ),
      );
      return;
    }
    logger.error("Unexpected relay error", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    sendError(
      response,
      new RelayError(
        500,
        "internal_error",
        "Something went wrong on the streaming relay.",
      ),
    );
  };
  app.use(handleErrors);

  return app;
};
