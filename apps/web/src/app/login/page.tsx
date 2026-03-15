"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@openbooklm/ui/components/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import GoogleAuthButton from "@/components/google-auth-button";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(true);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session?.user]);

  if (isPending || session?.user) {
    return <Loader />;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{showSignIn ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            Sign in with Google or use your email and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <GoogleAuthButton />
          <p className="text-xs/relaxed text-muted-foreground">
            Or continue with email and password below.
          </p>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
