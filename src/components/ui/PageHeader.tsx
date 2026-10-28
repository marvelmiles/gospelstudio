import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const pageClassName =
  "mx-auto max-w-330 px-[clamp(14px,4vw,36px)] py-[clamp(18px,4vw,28px)]";

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3.5">
    <div className="min-w-0 flex-[1_1_220px]">
      <h1 className="m-0 truncate text-[clamp(22px,4vw,30px)] leading-[1.2] font-semibold text-fg">
        {title}
      </h1>
      {subtitle && (
        <p
          title={subtitle}
          className="mt-1 mb-0 truncate text-[13.5px] leading-[1.4] text-sub"
        >
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
    )}
  </div>
);
