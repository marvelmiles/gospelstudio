interface GreetingHeaderProps {
  label: string;
  heading: string;
  tag: string;
}

export const GreetingHeader = ({
  label,
  heading,
  tag,
}: GreetingHeaderProps) => (
  <div className="mb-6.5">
    <p className="m-0 text-[13px] font-semibold tracking-[1.2px] text-accent">
      {label}
    </p>
    <h1 className="mt-1.5 mb-0 text-[clamp(28px,5.5vw,44px)] font-semibold tracking-[-0.5px] text-fg">
      {heading}
    </h1>
    <p className="mt-2.5 mb-0 text-[14.5px] text-sub">{tag}</p>
  </div>
);
