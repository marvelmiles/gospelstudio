import type {
  PlausibleClient,
  PlausibleQuery,
  PlausibleQueryResult,
} from "../plausibleClient";

type Row = PlausibleQueryResult["results"][number];

export interface GoalRow {
  goal: string;
  visitors: number;
  events: number;
}

export interface FakePlausibleData {
  totals: [number, number, number, number, number];
  goals: GoalRow[];
  returningGoals: GoalRow[] | "rejected";
  visitorTypes: { new: number; returning: number } | "rejected";
  uniqueVisitorsForGoals: (goals: string[], returningOnly: boolean) => number;
  timeLabels: string[];
}

const row = (dimensions: (string | number)[], metrics: number[]): Row => ({
  dimensions,
  metrics,
});

export class FakeRejection extends Error {}

const goalsOf = (query: PlausibleQuery): string[] | null =>
  query.filters?.find((filter) => filter[1] === "event:goal")?.[2] ?? null;

const isReturningOnly = (query: PlausibleQuery): boolean =>
  Boolean(
    query.filters?.some((filter) => filter[1] === "event:props:visitor_type"),
  );

export const answerFakeQuery = (
  data: FakePlausibleData,
  query: PlausibleQuery,
): PlausibleQueryResult => {
  const dimension = query.dimensions?.[0];
  const goals = goalsOf(query);
  const returningOnly = isReturningOnly(query);

  if (dimension === "event:goal") {
    const rows = returningOnly ? data.returningGoals : data.goals;
    if (rows === "rejected") throw new FakeRejection();
    return {
      results: rows.map((entry) =>
        row([entry.goal], [entry.visitors, entry.events]),
      ),
    };
  }
  if (dimension === "event:props:visitor_type") {
    if (data.visitorTypes === "rejected") throw new FakeRejection();
    return {
      results: [
        row(["new"], [data.visitorTypes.new]),
        row(["returning"], [data.visitorTypes.returning]),
      ],
    };
  }
  if (dimension?.startsWith("time:"))
    return {
      results: data.timeLabels.map((label, index) =>
        row(
          [label],
          query.metrics.map((_, metric) => index + metric + 1),
        ),
      ),
      meta: { time_labels: data.timeLabels },
    };
  if (dimension?.startsWith("visit:"))
    return {
      results: [row(["Google"], [7, 70]), row([""], [3, 30])],
    };
  if (goals)
    return {
      results: [row([], [data.uniqueVisitorsForGoals(goals, returningOnly)])],
    };
  return { results: [row([], data.totals)] };
};

export const createFakePlausible = (
  data: FakePlausibleData,
  toError: () => Error,
): { client: PlausibleClient; queries: PlausibleQuery[] } => {
  const queries: PlausibleQuery[] = [];
  const client: PlausibleClient = async (query) => {
    queries.push(query);
    try {
      return answerFakeQuery(data, query);
    } catch (error) {
      if (error instanceof FakeRejection) throw toError();
      throw error;
    }
  };
  return { client, queries };
};
