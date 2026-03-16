import { publicProcedure, router } from "../index";
import { artifactsRouter } from "./artifacts";
import { filesRouter } from "./files";
import { projectsRouter } from "./projects";
import { sourcesRouter } from "./sources";
import { userSettingsRouter } from "./user-settings";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	projects: projectsRouter,
	sources: sourcesRouter,
	artifacts: artifactsRouter,
	files: filesRouter,
	userSettings: userSettingsRouter,
});
export type AppRouter = typeof appRouter;
