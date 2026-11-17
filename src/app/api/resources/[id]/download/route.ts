import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId) || resourceId < 1) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const resource = db
    .prepare("SELECT file_name, storage_key FROM resources WHERE id = ?")
    .get(resourceId) as { file_name: string | null; storage_key: string | null } | undefined;

  if (!resource?.storage_key || !resource.file_name) {
    return NextResponse.json({ error: "This sample resource has no downloadable file." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "data", "uploads", path.basename(resource.storage_key));
  let contents: Buffer;
  try {
    contents = await readFile(filePath);
  } catch (error) {
    console.error(`Could not read uploaded resource ${resourceId}.`, error);
    return NextResponse.json({ error: "The resource file is unavailable." }, { status: 500 });
  }

  return new Response(new Uint8Array(contents), {
    headers: {
      "Content-Type": resource.file_name.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${resource.file_name.replace(/["\\\r\n]/g, "_")}"`,
      "Content-Length": String(contents.length),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
