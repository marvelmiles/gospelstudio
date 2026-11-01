import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "../../lib/utils";

interface MarqueeTrackProps {
  text: string;
  crossSeconds: number;
  style?: CSSProperties;
  className?: string;
}

export const MarqueeTrack = ({
  text,
  crossSeconds,
  style,
  className,
}: MarqueeTrackProps) => {
  const bandRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [duration, setDuration] = useState(0);
  const { fontFamily, fontWeight, fontSize } = style ?? {};

  useEffect(() => {
    const band = bandRef.current;
    const copy = copyRef.current;
    if (!band || !copy) return;

    const measure = () => {
      const bandWidth = band.clientWidth;
      const copyWidth = copy.offsetWidth;
      if (bandWidth <= 0 || copyWidth <= 0) return;
      setDuration((copyWidth / bandWidth) * crossSeconds);
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(band);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [text, crossSeconds, fontFamily, fontWeight, fontSize]);

  return (
    <div
      ref={bandRef}
      className={cn(
        "relative flex size-full items-center overflow-hidden",
        className,
      )}
    >
      <div
        className="relative marquee-track leading-[1.1]"
        style={{
          ...style,
          animationDuration: duration > 0 ? `${duration}s` : undefined,
          animationPlayState: duration > 0 ? "running" : "paused",
        }}
      >
        <span ref={copyRef} className="marquee-copy">
          {text}
        </span>
        <span className="marquee-copy" aria-hidden>
          {text}
        </span>
      </div>
    </div>
  );
};
