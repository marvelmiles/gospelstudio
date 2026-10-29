import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Tabs = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) => (
  <TabsPrimitive.Root
    data-slot="tabs"
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
);

const tabsListVariants = cva("group/tabs-list text-muted-foreground", {
  variants: {
    variant: {
      segmented: "grid gap-1.25 rounded-[14px] border bg-secondary p-1.25",
      pill: "flex flex-wrap items-center gap-1.75",
      line: "flex border-b",
    },
  },
  defaultVariants: {
    variant: "segmented",
  },
});

const TabsList = ({
  className,
  variant = "segmented",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    data-variant={variant}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
);

const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    data-slot="tabs-trigger"
    className={cn(
      "inline-flex min-w-0 items-center justify-center gap-2 border border-transparent text-[12.5px] font-semibold whitespace-nowrap transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:text-subtle-foreground data-[state=active]:text-primary-soft [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.75",
      "group-data-[variant=segmented]/tabs-list:rounded-[10px] group-data-[variant=segmented]/tabs-list:px-3 group-data-[variant=segmented]/tabs-list:py-2.25 group-data-[variant=segmented]/tabs-list:data-[state=active]:border-primary/42 group-data-[variant=segmented]/tabs-list:data-[state=active]:bg-primary/18 group-data-[variant=segmented]/tabs-list:data-[state=active]:shadow-[inset_0_1px_0_rgb(59_130_246/0.2)]",
      "group-data-[variant=pill]/tabs-list:rounded-full group-data-[variant=pill]/tabs-list:border-border group-data-[variant=pill]/tabs-list:px-3.5 group-data-[variant=pill]/tabs-list:py-2 group-data-[variant=pill]/tabs-list:data-[state=active]:border-primary/45 group-data-[variant=pill]/tabs-list:data-[state=active]:bg-primary/16",
      "group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:flex-1 group-data-[variant=line]/tabs-list:border-x-0 group-data-[variant=line]/tabs-list:border-t-0 group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:py-3 group-data-[variant=line]/tabs-list:text-[13px] group-data-[variant=line]/tabs-list:data-[state=active]:border-primary",
      className,
    )}
    {...props}
  />
);

const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    data-slot="tabs-content"
    className={cn("flex-1 outline-none", className)}
    {...props}
  />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
