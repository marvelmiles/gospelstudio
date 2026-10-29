import type { ReactNode } from "react";
import { useIntersectionObserver } from "usehooks-ts";

interface LazyMountProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
}

export const LazyMount = ({
  children,
  placeholder,
  rootMargin = "400px",
}: LazyMountProps) => {
  const { ref, isIntersecting } = useIntersectionObserver({ rootMargin });

  return (
    <div ref={ref} className="size-full">
      {isIntersecting ? children : placeholder}
    </div>
  );
};
