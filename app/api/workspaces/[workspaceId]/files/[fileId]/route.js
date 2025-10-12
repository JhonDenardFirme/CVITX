import { NextResponse } from "next/server";
import { apiFetch } from "../../../../_proxy/client";

export async function DELETE(req, { params }) {
    const out = await apiFetch(
        `/workspaces/${params.workspaceId}/files/${params.fileId}`,
        { method: "DELETE" }
    );
    return NextResponse.json(out);
}
