import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/auth/login-screen";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-background text-foreground">
      <LoginScreen />
    </div>
  );
}
