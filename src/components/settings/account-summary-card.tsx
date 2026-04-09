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
    <CardHeader className="gap-2 border-b border-dashed border-border/80 pb-4">
      <Badge variant="outline" className="tracking-[0.18em] uppercase">
        Account
      </Badge>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium">Account Summary</h2>
        <CardDescription className="text-sm text-muted-foreground">
          Email is managed by your sign-in provider.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 pt-4">
      <div>
        <Badge variant={emailVerified ? "default" : "secondary"}>
          {emailVerified ? "Verified Email" : "Email Not Verified"}
        </Badge>
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
