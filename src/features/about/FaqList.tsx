import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "../../lib/utils";
import type { Faq, FaqGroup } from "./faqs";

interface FaqListProps {
  groups: FaqGroup[];
}

export const FaqList = ({ groups }: FaqListProps) => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    groups[0]?.faqs[0]?.question ?? null,
  );

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h3 className="mt-0 mb-1 text-[12.5px] font-semibold text-subtle-foreground">
            {group.title}
          </h3>
          <div className="border-t border-border">
            {group.faqs.map((faq) => (
              <FaqItem
                key={faq.question}
                faq={faq}
                open={openQuestion === faq.question}
                onOpenChange={(open) =>
                  setOpenQuestion(open ? faq.question : null)
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

interface FaqItemProps {
  faq: Faq;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FaqItem = ({ faq, open, onOpenChange }: FaqItemProps) => (
  <Collapsible
    open={open}
    onOpenChange={onOpenChange}
    className="border-b border-border"
  >
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between gap-3 border-none bg-transparent px-0.5 py-3.25 text-left text-sm font-semibold",
        open ? "text-primary-soft" : "text-foreground",
      )}
    >
      {faq.question}
      <ChevronDown
        size={17}
        aria-hidden
        className={cn(
          "shrink-0 text-muted-foreground transition-transform duration-200",
          open && "rotate-180",
        )}
      />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <p className="mt-0 mb-3.5 pr-6 text-[13.5px] leading-[1.7] text-muted-foreground">
        {faq.answer}
      </p>
    </CollapsibleContent>
  </Collapsible>
);
