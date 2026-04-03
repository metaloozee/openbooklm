import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getDocumentsVectorIndex = async (): Promise<VectorizeIndex> => {
  const { env } = await getCloudflareContext({ async: true });

  return (
    env as CloudflareEnv & {
      DOCUMENTS_VECTOR_INDEX: VectorizeIndex;
    }
  ).DOCUMENTS_VECTOR_INDEX;
};
