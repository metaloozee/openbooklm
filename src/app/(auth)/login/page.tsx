import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginScreen } from "@/components/auth/login-screen";
import { getAuthSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getAuthSession(await headers());

  if (session) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-background text-foreground">
      <LoginScreen />
    </div>
  );
}
