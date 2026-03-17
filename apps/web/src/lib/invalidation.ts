import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { trpc } from "@/utils/trpc";

async function invalidateProjectContext(queryClient: QueryClient, projectId: string) {
	await Promise.all([
		queryClient.invalidateQueries(trpc.sources.list.queryFilter({ projectId })),
		queryClient.invalidateQueries(trpc.projects.byId.queryFilter({ projectId })),
		queryClient.invalidateQueries(trpc.projects.list.queryFilter()),
	]);
}

export function useSourceInvalidation(projectId: string) {
	const queryClient = useQueryClient();
	return useCallback(async () => {
		await Promise.all([
			invalidateProjectContext(queryClient, projectId),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		]);
	}, [queryClient, projectId]);
}

export function useArtifactInvalidation(projectId: string, artifactId?: string) {
	const queryClient = useQueryClient();
	return useCallback(async () => {
		const invalidations = [
			queryClient.invalidateQueries(trpc.artifacts.list.queryFilter({ projectId })),
			invalidateProjectContext(queryClient, projectId),
			queryClient.invalidateQueries(trpc.files.list.queryFilter({ projectId })),
		];

		if (artifactId) {
			invalidations.push(
				queryClient.invalidateQueries(
					trpc.artifacts.byId.queryFilter({ projectId, artifactId }),
				),
			);
		}

		await Promise.all(invalidations);
	}, [artifactId, queryClient, projectId]);
}
