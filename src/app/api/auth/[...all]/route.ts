import { initAuth } from "@/lib/auth";

export const POST = async (req: Request) => {
  const auth = await initAuth();

  return auth.handler(req);
};

export const GET = async (req: Request) => {
  const auth = await initAuth();

  return auth.handler(req);
};
