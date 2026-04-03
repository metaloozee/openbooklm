import "server-only";
import { and, eq } from "drizzle-orm";

import { getDbAsync } from "@/lib/db";
import { projectDocumentListSelection } from "@/lib/db/project-document-selection";
import { project, projectDocument } from "@/lib/db/schema";
import {
  createDocumentObjectKey,
  getDocumentsBucket,
  resolveDocumentUploadContentType,
} from "@/lib/r2";

type ProjectDocumentRow = typeof projectDocument.$inferSelect;

export type UploadProjectDocumentResult =
  | {
      document: Pick<
        ProjectDocumentRow,
        keyof typeof projectDocumentListSelection
      >;
      ok: true;
    }
  | { error: string; ok: false; status: number };

export const uploadProjectDocumentForOwner = async (input: {
  file: File;
  ownerUserId: string;
  projectId: string;
}): Promise<UploadProjectDocumentResult> => {
  const { file, ownerUserId, projectId } = input;
  const db = await getDbAsync();

  const [ownedProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.ownerUserId, ownerUserId)))
    .limit(1);

  if (!ownedProject) {
    return { error: "Project not found.", ok: false, status: 404 };
  }

  const contentType = resolveDocumentUploadContentType(file.name, file.type);
  if (!contentType) {
    return {
      error: "Unsupported document type. Allowed files: PDF, TXT, MD, DOCX.",
      ok: false,
      status: 400,
    };
  }

  const bucket = await getDocumentsBucket();
  const objectKey = createDocumentObjectKey(file.name);
  let uploadSucceeded = false;

  try {
    await bucket.put(objectKey, file, {
      customMetadata: {
        originalFilename: file.name,
        ownerUserId,
      },
      httpMetadata: { contentType },
    });
    uploadSucceeded = true;

    const now = new Date();
    const [created] = await db
      .insert(projectDocument)
      .values({
        chunkCount: 0,
        contentType,
        id: crypto.randomUUID(),
        ingestionVersion: 1,
        objectKey,
        originalFilename: file.name,
        ownerUserId,
        processedAt: now,
        processingError: null,
        processingStartedAt: null,
        processingStatus: "ready",
        projectId: ownedProject.id,
        sizeBytes: file.size,
        vectorCount: 0,
      })
      .returning(projectDocumentListSelection);

    if (!created) {
      throw new Error("Insert returned no row.");
    }

    return { document: created, ok: true };
  } catch (error) {
    if (uploadSucceeded) {
      try {
        await bucket.delete(objectKey);
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded document after error.", {
          cleanupError,
          objectKey,
          originalError: error,
        });
      }
    }

    return {
      error: "Unable to upload document.",
      ok: false,
      status: 500,
    };
  }
};
