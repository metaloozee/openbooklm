"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@openbooklm/ui/components/card";
import { useState } from "react";

import GoogleAuthButton from "@/components/google-auth-button";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginCard() {
	const [showSignIn, setShowSignIn] = useState(true);

	return (
		<div className="mx-auto flex min-h-svh w-full max-w-md items-center px-6 py-10">
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
