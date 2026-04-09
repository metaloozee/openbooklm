import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 border-b border-dashed border-border py-3 last:border-b-0 last:pb-0 first:pt-0">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="max-w-[60%] break-words text-right font-medium">{value}</dd>
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
  <Card>
    <CardHeader>
      <CardTitle>Account</CardTitle>
      <CardDescription>
        Reference details for how this account is currently managed.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="mb-4">
        <Badge variant={emailVerified ? "default" : "secondary"}>
          {emailVerified ? "Verified email" : "Email not verified"}
        </Badge>
      </div>
      <dl>
        <SummaryRow label="Sign-in provider" value={providerLabel} />
        <SummaryRow
          label="Member since"
          value={dateFormatter.format(new Date(createdAt))}
        />
        <SummaryRow
          label="Last profile update"
          value={dateFormatter.format(new Date(updatedAt))}
        />
      </dl>
    </CardContent>
  </Card>
);
