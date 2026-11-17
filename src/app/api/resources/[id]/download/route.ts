import { NextResponse } from "next/server";
import { downloadResourceFile, getResourceById } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId) || resourceId < 1) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  let resource;
  try {
    resource = await getResourceById(resourceId);
  } catch (error) {
    console.error(`Could not load resource metadata ${resourceId}.`, error);
    return NextResponse.json({ error: "Resource data is temporarily unavailable." }, { status: 503 });
  }

  if (!resource?.storage_key || !resource.file_name) {
    return NextResponse.json({ error: "This sample resource has no downloadable file." }, { status: 404 });
  }

  let contents: Buffer;
  try {
    contents = await downloadResourceFile(resource.storage_key);
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
