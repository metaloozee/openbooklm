import { auth } from "@openbooklm/auth";
import { db } from "@openbooklm/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		db,
		session,
		userId: session?.user.id ?? null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
