"use client";

import { Button } from "@openbooklm/ui/components/button";
import { Loader2 } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

function GoogleIcon(props: ComponentProps<"svg">) {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
			<path
				d="M21.64 12.2c0-.64-.06-1.25-.18-1.84H12v3.48h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 3-4.34 3-7.2Z"
				fill="#4285F4"
			/>
			<path
				d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.52c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A10 10 0 0 0 12 22Z"
				fill="#34A853"
			/>
			<path
				d="M6.42 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.27.32-1.88v-2.6H3.08A10 10 0 0 0 2 12c0 1.61.38 3.14 1.08 4.48l3.34-2.6Z"
				fill="#FBBC05"
			/>
			<path
				d="M12 6c1.47 0 2.8.5 3.84 1.49l2.88-2.88C16.95 2.97 14.7 2 12 2a10 10 0 0 0-8.92 5.52l3.34 2.6C7.2 7.76 9.4 6 12 6Z"
				fill="#EA4335"
			/>
		</svg>
	);
}

export default function GoogleAuthButton() {
	const [isSigningIn, setIsSigningIn] = useState(false);

	const handleGoogleSignIn = async () => {
		setIsSigningIn(true);

		const { error } = await authClient.signIn.social({
			provider: "google",
			callbackURL: "/login",
			newUserCallbackURL: "/login",
			errorCallbackURL: "/login",
		});

		if (!error) {
			return;
		}

		const message = error.message?.toLowerCase().includes("provider")
			? "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server env."
			: error.message || "Google sign-in failed. Please try again.";

		toast.error(message);
		setIsSigningIn(false);
	};

	return (
		<Button
			type="button"
			className="w-full"
			onClick={handleGoogleSignIn}
			disabled={isSigningIn}
		>
			{isSigningIn ? (
				<Loader2 data-icon="inline-start" className="animate-spin" />
			) : (
				<GoogleIcon data-icon="inline-start" />
			)}
			{isSigningIn ? "Redirecting to Google..." : "Continue with Google"}
		</Button>
	);
}
