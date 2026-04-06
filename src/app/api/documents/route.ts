import { auth } from "@/lib/auth";

export const maxDuration = 60;

export const POST = async (request: Request): Promise<Response> => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = formData.get("projectId");

  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file upload." }, { status: 400 });
  }

  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return Response.json({ error: "Missing project id." }, { status: 400 });
  }

  // const result ;
  // if (!result.ok) {
  //   return Response.json({ error: result.error }, { status: result.status });
  // }

  return Response.json({ message: "TODO" }, { status: 201 });
};
