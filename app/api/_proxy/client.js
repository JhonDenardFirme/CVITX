// app/api/_proxy/client.js
import { cookies } from "next/headers";

const BASE = process.env.CVX_API_BASE_URL;
const API_KEY = process.env.CVX_API_KEY || "";
const SESSION_COOKIE = process.env.CVX_SESSION_COOKIE || "cvx_session";

export async function apiFetch(path, opts = {}) {
    if (!BASE) throw new Error("CVX_API_BASE_URL is not set");

    // ⬇️ MUST await cookies() in this Next version
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;

    const baseHeaders = {};
    if (API_KEY) baseHeaders["X-API-Key"] = API_KEY;
    if (token) baseHeaders.Authorization = `Bearer ${token}`;

    const hasJsonBody = opts.body && typeof opts.body !== "string";

    const res = await fetch(`${BASE}${path}`, {
        method: opts.method || "GET",
        headers: {
            ...baseHeaders,
            ...(opts.headers || {}),
            ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.body
            ? hasJsonBody
                ? JSON.stringify(opts.body)
                : opts.body
            : undefined,
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`[proxy] ${opts.method || "GET"} ${BASE}${path} -> ${res.status} ${text || ""}`.trim());
        throw new Response(text || `Upstream error: ${res.status}`, { status: res.status });
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
}
