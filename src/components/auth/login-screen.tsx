"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import { GoogleSignInButton } from "./google-sign-in-button";

export const LoginScreen = () => (
  <main className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4 py-16">
    <Card className="w-full max-w-sm border-border shadow-none ring-1 ring-border">
      <CardHeader className="gap-2">
        <h1 className="font-heading text-sm font-medium">Sign in</h1>
        <CardDescription>Use your Google account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GoogleSignInButton />
      </CardContent>
    </Card>
  </main>
);
