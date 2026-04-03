import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { DocumentIngestionParams } from "@/lib/ingestion";

export const getDocumentIngestionWorkflow = async (): Promise<
  Workflow<DocumentIngestionParams>
> => {
  const { env } = await getCloudflareContext({ async: true });
  return (
    env as CloudflareEnv & {
      DOCUMENT_INGESTION_WORKFLOW: Workflow<DocumentIngestionParams>;
    }
  ).DOCUMENT_INGESTION_WORKFLOW;
};
