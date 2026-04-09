import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const SummaryRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid gap-1 border-t border-dashed border-border pt-4 first:border-t-0 first:pt-0">
    <dt className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
      {label}
    </dt>
    <dd className="text-sm text-foreground">{value}</dd>
  </div>
);

export const AccountSummaryCard = ({
  createdAt,
  emailVerified,
  providerLabel,
  updatedAt,
}: {
  createdAt: string;
  emailVerified: boolean;
  providerLabel: string;
  updatedAt: string;
}) => (
  <Card className="border border-dashed border-border/80 bg-muted/20">
    <CardHeader className="gap-3 border-b border-dashed border-border/80 pb-5">
      <Badge variant="outline" className="tracking-[0.18em] uppercase">
        Account
      </Badge>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium">
          What Stays Fixed Here
        </h2>
        <CardDescription className="max-w-sm text-sm text-muted-foreground">
          Your sign-in provider manages core identity details like email. This
          page is for preferences, not account recovery.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 pt-5">
      <div className="rounded-none border border-dashed border-border/80 bg-background/80 p-4">
        <Badge variant={emailVerified ? "default" : "secondary"}>
          {emailVerified ? "Verified Email" : "Email Not Verified"}
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground">
          Need to change the address attached to this account? Update it through
          <span translate="no"> Google</span>, then sign in again.
        </p>
      </div>

      <dl className="space-y-4">
        <SummaryRow
          label="Sign-In Provider"
          value={<span translate="no">{providerLabel}</span>}
        />
        <SummaryRow
          label="Member Since"
          value={dateFormatter.format(new Date(createdAt))}
        />
        <SummaryRow
          label="Latest Settings Change"
          value={dateFormatter.format(new Date(updatedAt))}
        />
      </dl>
    </CardContent>
  </Card>
);
