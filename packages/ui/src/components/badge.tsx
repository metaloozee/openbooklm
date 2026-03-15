import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@openbooklm/ui/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium tracking-tight",
	{
		variants: {
			variant: {
				default: "border-border bg-secondary text-secondary-foreground",
				success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
				warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
				destructive: "border-destructive/20 bg-destructive/10 text-destructive",
				outline: "border-border text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
