import { useId } from "react";
import { cn } from "@/lib/utils";

interface AppIconLoaderProps {
  size?: number;
  label?: string;
  className?: string;
}

const SPIN_AROUND_CENTRE = "origin-center [transform-box:view-box]";
const RING_RADIUS = 236;
const RING_ARC = 380;
const RING_GAP = Math.round(2 * Math.PI * RING_RADIUS) - RING_ARC;

const BLADE_PATHS = {
  a: "M350 256 L209 337.41 Q150.54 371.16 74.11 329.02 A196 196 0 0 0 410.19 377.01 Q408.46 289.75 350 256 Z",
  b: "M209 337.41 L209 174.59 Q209 107.09 283.7 61.97 A196 196 0 0 0 74.11 329.02 Q150.54 371.16 209 337.41 Z",
  c: "M209 174.59 L350 256 Q408.46 289.75 410.19 377.01 A196 196 0 0 0 283.7 61.97 Q209 107.09 209 174.59 Z",
};

const BLADE_SEAMS =
  "M209 337.41 Q150.54 371.16 74.11 329.02 M209 174.59 Q209 107.09 283.7 61.97 M350 256 Q408.46 289.75 410.19 377.01";

const PLAY_PATH = "M226.86 205.53 L314.28 256 L226.86 306.47 Z";

const useSvgIdPrefix = (): string => `app-icon-${useId().replace(/\W/g, "")}`;

export const AppIconLoader = ({
  size = 56,
  label = "Loading",
  className,
}: AppIconLoaderProps) => {
  const prefix = useSvgIdPrefix();
  const ids = {
    bladeA: `${prefix}-blade-a`,
    bladeB: `${prefix}-blade-b`,
    bladeC: `${prefix}-blade-c`,
    ring: `${prefix}-ring`,
    seams: `${prefix}-seams`,
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        aria-hidden
        className="overflow-visible drop-shadow-[0_0_14px_rgb(59_130_246/0.35)]"
      >
        <defs>
          <linearGradient
            id={ids.bladeA}
            gradientUnits="userSpaceOnUse"
            x1="256"
            y1="256"
            x2="216"
            y2="452"
          >
            <stop offset="0" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient
            id={ids.bladeB}
            gradientUnits="userSpaceOnUse"
            x1="256"
            y1="256"
            x2="60"
            y2="216"
          >
            <stop offset="0" stopColor="#4f46e5" />
            <stop offset="1" stopColor="#312e81" />
          </linearGradient>
          <linearGradient
            id={ids.bladeC}
            gradientUnits="userSpaceOnUse"
            x1="256"
            y1="256"
            x2="316"
            y2="60"
          >
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient
            id={ids.ring}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="512"
            y2="512"
          >
            <stop offset="0" stopColor="#67e8f9" />
            <stop offset="0.5" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
          <mask
            id={ids.seams}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="512"
            height="512"
          >
            <rect width="512" height="512" fill="#fff" />
            <path
              d={BLADE_SEAMS}
              fill="none"
              stroke="#000"
              strokeWidth="15"
              strokeLinecap="round"
            />
          </mask>
        </defs>

        <circle
          cx="256"
          cy="256"
          r={RING_RADIUS}
          fill="none"
          stroke={`url(#${ids.ring})`}
          strokeWidth="16"
          opacity="0.3"
        />
        <circle
          cx="256"
          cy="256"
          r={RING_RADIUS}
          fill="none"
          stroke={`url(#${ids.ring})`}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${RING_ARC} ${RING_GAP}`}
          className={cn(
            SPIN_AROUND_CENTRE,
            "animate-app-icon-orbit motion-reduce:animate-none",
          )}
        />
        <g
          mask={`url(#${ids.seams})`}
          className={cn(
            SPIN_AROUND_CENTRE,
            "animate-app-icon-fan motion-reduce:animation-duration-[4s]",
          )}
        >
          <path d={BLADE_PATHS.a} fill={`url(#${ids.bladeA})`} />
          <path d={BLADE_PATHS.b} fill={`url(#${ids.bladeB})`} />
          <path d={BLADE_PATHS.c} fill={`url(#${ids.bladeC})`} />
        </g>
        <path
          d={PLAY_PATH}
          fill="#f8fafc"
          stroke="#f8fafc"
          strokeWidth="24"
          strokeLinejoin="round"
          className={cn(
            SPIN_AROUND_CENTRE,
            "animate-app-icon-pulse motion-reduce:animate-none",
          )}
        />
      </svg>
    </div>
  );
};
