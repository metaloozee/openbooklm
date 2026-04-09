import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

const Bullet = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-3 text-sm text-muted-foreground">
    <span
      aria-hidden="true"
      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
    />
    <span>{children}</span>
  </li>
);

export const SettingsOverviewCard = () => (
  <Card className="border border-dashed border-border/80 bg-background">
    <CardHeader className="gap-3 border-b border-dashed border-border/80 pb-5">
      <Badge variant="outline" className="tracking-[0.18em] uppercase">
        Guide
      </Badge>
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium">
          How to Use This Page
        </h2>
        <CardDescription className="text-sm text-muted-foreground">
          Keep the parts of your account that people recognize current, then set
          a default answer style you do not have to repeat every time.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="space-y-5 pt-5">
      <div className="rounded-none border border-dashed border-border/80 bg-muted/30 p-4">
        <p className="text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Good to know
        </p>
        <p className="mt-2 text-sm text-foreground">
          Personalization changes <span className="font-medium">how</span> the
          app presents grounded answers — never what your documents actually
          say.
        </p>
      </div>

      <ul className="space-y-3">
        <Bullet>Profile changes show up in menus and account surfaces.</Bullet>
        <Bullet>
          AI preferences only matter when the app is generating grounded answers
          from your uploaded material.
        </Bullet>
        <Bullet>
          Your email address stays read-only because it comes from your sign-in
          provider.
        </Bullet>
      </ul>
    </CardContent>
  </Card>
);
