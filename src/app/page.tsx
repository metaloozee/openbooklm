import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

import { LoginScreen } from "@/components/auth/login-screen";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuth } from "@/lib/auth/auth";

export default async function Home() {
  const { env } = await getCloudflareContext({ async: true });
  const auth = getAuth(env);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center bg-background text-foreground">
        <LoginScreen />
      </div>
    );
  }

  const displayName = session.user.name?.trim() || session.user.email;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-4 py-16 text-foreground">
      <main className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-lg font-medium">Welcome</h1>
        <p className="min-w-0 max-w-full break-words text-sm text-muted-foreground">
          Signed in as {displayName}
        </p>
        <SignOutButton />
      </main>
    </div>
  );
}
