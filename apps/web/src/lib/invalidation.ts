import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { trpc } from "@/utils/trpc";

export function useSourceInvalidation(projectId: string) {
	const queryClient = useQueryClient();
	return useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries(trpc.sources.list.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	}, [queryClient, projectId]);
}

export function useArtifactInvalidation(projectId: string) {
	const queryClient = useQueryClient();
	return useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries(trpc.artifacts.list.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
			queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	}, [queryClient, projectId]);
}
