"use client";

import { GoogleSignInButton } from "./google-sign-in-button";

export const LoginScreen = () => (
  <main className="relative flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-20 sm:min-h-[80vh] sm:py-24">
    <div className="flex w-full max-w-md flex-col text-center gap-7">
      <div className="space-y-3">
        <h1 className="text-balance text-3xl text-foreground tracking-tight sm:text-4xl font-semibold">
          Welcome back
        </h1>
        <p className="mx-auto max-w-sm text-muted-foreground text-sm leading-relaxed sm:text-base">
          Sign in with Google to open your workspace and pick up where you left
          off.
        </p>
      </div>
      <GoogleSignInButton />
    </div>
  </main>
);
