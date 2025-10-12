import { NextResponse } from "next/server";
import { apiFetch } from "../../../../../_proxy/client";

export async function GET(req, { params }) {
  const out = await apiFetch(
    `/workspaces/${params.workspaceId}/files/${params.fileId}/url`
  );
  return NextResponse.json(out);
}
