// lib/imageAnalysis.mock.js
// Mock data + API shims that match your real imageAnalysis.js surface.
// Toggle usage from lib/imageAnalysis.js (re-export from here while offline).

const WID = "8cdc46f9-12eb-4e07-ac44-f84dd1fdfb96";
const MB = 1024 * 1024;

// Helpers
const now = (offsetMin = 0) =>
  new Date(Date.now() - offsetMin * 60 * 1000).toISOString();

function parentOf(show) {
  return {
    id: show.id,
    workspace_id: show.workspace_id,
    analysis_no: show.analysis_no,
    title: show.title ?? null,
    description: show.description ?? null,
    input_image_s3_key:
      show.input_image?.s3_key ?? show.input_image_s3_key ?? null,
    content_type: show.content_type ?? "image/jpeg",
    size_bytes: show.size_bytes ?? 600 * 1024,
    status: show.status,
    error_msg: show.error_msg ?? null,
    created_at: show.created_at,
    // Optional convenience for the table (ok if absent in real API):
    results: show.results ?? undefined,
    input_image: show.input_image ?? undefined,
  };
}

// ===== Five full "show" payloads (complete Baseline & CMT, richer parts/colors) =====
const SHOW = [
  {
    id: "ia-001",
    workspace_id: WID,
    analysis_no: 101,
    title: "Red Toyota Fortuner – Daylight",
    description: "Front 3/4 shot on EDSA",
    content_type: "image/jpeg",
    size_bytes: 804_221,
    created_at: now(5),
    status: "done",
    input_image: {
      s3_key: `imageanalysis/${WID}/101/original/fortuner.jpg`,
      url: "https://via.placeholder.com/640x360?text=Original+101",
    },
    results: {
      baseline: {
        type: "CAR",
        type_conf: 0.88,
        make: "TOYOTA",
        make_conf: 0.83,
        model: "FORTUNER",
        model_conf: 0.78,
        parts: [
          { name: "HEADLIGHT", conf: 0.93 },
          { name: "BUMPER", conf: 0.76 },
          { name: "GRILLE", conf: 0.71 },
          { name: "HOOD", conf: 0.69 },
          { name: "FOG_LAMP", conf: 0.64 },
        ],
        colors: ["RED", "BLACK"],
        plate_text: "ABC1234",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/101/baseline/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=Baseline+101",
        },
        latency_ms: 79,
        gflops: 2.1,
        status: "ready",
        error_msg: null,
      },
      cmt: {
        type: "CAR",
        type_conf: 0.92,
        make: "TOYOTA",
        make_conf: 0.90,
        model: "FORTUNER",
        model_conf: 0.87,
        parts: [
          { name: "HEADLIGHT", conf: 0.95 },
          { name: "GRILLE", conf: 0.84 },
          { name: "BUMPER", conf: 0.79 },
          { name: "FENDER", conf: 0.73 },
          { name: "HOOD", conf: 0.71 },
          { name: "SIDE_MIRROR", conf: 0.68 },
        ],
        colors: ["RED", "BLACK"],
        plate_text: "ABC1234",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/101/cmt/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=CMT+101",
        },
        latency_ms: 81,
        gflops: 2.3,
        status: "ready",
        error_msg: null,
      },
    },
  },

  {
    id: "ia-002",
    workspace_id: WID,
    analysis_no: 102,
    title: "White Sedan – Overcast",
    description: null,
    content_type: "image/jpeg",
    size_bytes: 611_004,
    created_at: now(15),
    status: "done",
    input_image: {
      s3_key: `imageanalysis/${WID}/102/original/sedan.jpg`,
      url: "https://via.placeholder.com/640x360?text=Original+102",
    },
    results: {
      baseline: {
        type: "CAR",
        type_conf: 0.74,
        make: "HONDA",
        make_conf: 0.71,
        model: "CIVIC",
        model_conf: 0.64,
        parts: [
          { name: "DOOR", conf: 0.72 },
          { name: "ROOF", conf: 0.66 },
          { name: "TAIL_LIGHT", conf: 0.59 },
        ],
        colors: ["WHITE"],
        plate_text: "NDB5678",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/102/baseline/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=Baseline+102",
        },
        latency_ms: 85,
        gflops: 2.0,
        status: "ready",
        error_msg: null,
      },
      cmt: {
        type: "CAR",
        type_conf: 0.78,
        make: "HONDA",
        make_conf: 0.76,
        model: "CIVIC",
        model_conf: 0.70,
        parts: [
          { name: "DOOR", conf: 0.79 },
          { name: "ROOF", conf: 0.71 },
          { name: "TAIL_LIGHT", conf: 0.67 },
          { name: "SIDE_MIRROR", conf: 0.62 },
        ],
        colors: ["WHITE", "BLACK"],
        plate_text: "NDB5678",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/102/cmt/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=CMT+102",
        },
        latency_ms: 88,
        gflops: 2.1,
        status: "ready",
        error_msg: null,
      },
    },
  },

  {
    id: "ia-003",
    workspace_id: WID,
    analysis_no: 103,
    title: "Blue Truck – Night rain",
    description: "Slight motion blur",
    content_type: "image/jpeg",
    size_bytes: 955_331,
    created_at: now(30),
    status: "done",
    input_image: {
      s3_key: `imageanalysis/${WID}/103/original/truck.jpg`,
      url: "https://via.placeholder.com/640x360?text=Original+103",
    },
    results: {
      baseline: {
        type: "TRUCK",
        type_conf: 0.66,
        make: "ISUZU",
        make_conf: 0.58,
        model: "N-SERIES",
        model_conf: 0.46,
        parts: [
          { name: "CARGO_BED", conf: 0.82 },
          { name: "WHEEL", conf: 0.77 },
          { name: "HEADLIGHT", conf: 0.71 },
          { name: "BUMPER", conf: 0.67 },
          { name: "MUDGUARD", conf: 0.63 },
          { name: "SIDE_STEP", conf: 0.58 },
          { name: "GRILLE", conf: 0.55 },
        ],
        colors: ["BLUE"],
        plate_text: "",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/103/baseline/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=Baseline+103",
        },
        latency_ms: 120,
        gflops: 2.5,
        status: "ready",
        error_msg: null,
      },
      cmt: {
        type: "TRUCK",
        type_conf: 0.71,
        make: "ISUZU",
        make_conf: 0.64,
        model: "N-SERIES",
        model_conf: 0.52,
        parts: [
          { name: "CARGO_BED", conf: 0.86 },
          { name: "WHEEL", conf: 0.81 },
          { name: "HEADLIGHT", conf: 0.75 },
          { name: "BUMPER", conf: 0.72 },
          { name: "MUDGUARD", conf: 0.68 },
          { name: "SIDE_STEP", conf: 0.63 },
          { name: "GRILLE", conf: 0.61 },
          { name: "FENDER", conf: 0.57 },
        ],
        colors: ["BLUE", "BLACK"],
        plate_text: "",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/103/cmt/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=CMT+103",
        },
        latency_ms: 126,
        gflops: 2.7,
        status: "ready",
        error_msg: null,
      },
    },
  },

  {
    id: "ia-004",
    workspace_id: WID,
    analysis_no: 104,
    title: "Black SUV – Mall parking",
    description: "Low light garage",
    content_type: "image/jpeg",
    size_bytes: 702_410,
    created_at: now(60),
    status: "done",
    input_image: {
      s3_key: `imageanalysis/${WID}/104/original/suv.jpg`,
      url: "https://via.placeholder.com/640x360?text=Original+104",
    },
    results: {
      baseline: {
        type: "SUV",
        type_conf: 0.89,
        make: "FORD",
        make_conf: 0.82,
        model: "EVEREST",
        model_conf: 0.77,
        parts: [
          { name: "ROOF_RAIL", conf: 0.66 },
          { name: "HEADLIGHT", conf: 0.92 },
          { name: "BUMPER", conf: 0.74 },
          { name: "GRILLE", conf: 0.79 },
          { name: "DOOR", conf: 0.71 },
          { name: "WINDOW", conf: 0.69 },
          { name: "TAIL_LIGHT", conf: 0.65 },
          { name: "FENDER", conf: 0.63 },
          { name: "SIDE_MIRROR", conf: 0.61 },
        ],
        colors: ["BLACK"],
        plate_text: "TXM2345",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/104/baseline/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=Baseline+104",
        },
        latency_ms: 70,
        gflops: 2.4,
        status: "ready",
        error_msg: null,
      },
      cmt: {
        type: "SUV",
        type_conf: 0.93,
        make: "FORD",
        make_conf: 0.90,
        model: "EVEREST",
        model_conf: 0.85,
        parts: [
          { name: "ROOF_RAIL", conf: 0.74 },
          { name: "HEADLIGHT", conf: 0.95 },
          { name: "BUMPER", conf: 0.78 },
          { name: "GRILLE", conf: 0.84 },
          { name: "DOOR", conf: 0.76 },
          { name: "WINDOW", conf: 0.73 },
          { name: "TAIL_LIGHT", conf: 0.71 },
          { name: "FENDER", conf: 0.68 },
          { name: "SIDE_MIRROR", conf: 0.66 },
        ],
        colors: ["BLACK", "SILVER"],
        plate_text: "TXM2345",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/104/cmt/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=CMT+104",
        },
        latency_ms: 74,
        gflops: 2.6,
        status: "ready",
        error_msg: null,
      },
    },
  },

  {
    id: "ia-005",
    workspace_id: WID,
    analysis_no: 105,
    title: "Motorcycle – Side angle",
    description: null,
    content_type: "image/jpeg",
    size_bytes: 488_100,
    created_at: now(120),
    status: "done",
    input_image: {
      s3_key: `imageanalysis/${WID}/105/original/motorcycle.jpg`,
      url: "https://via.placeholder.com/640x360?text=Original+105",
    },
    results: {
      baseline: {
        type: "MOTORCYCLE",
        type_conf: 0.91,
        make: "YAMAHA",
        make_conf: 0.82,
        model: "MIO",
        model_conf: 0.73,
        parts: [
          { name: "HEADLIGHT", conf: 0.94 },
          { name: "WHEEL", conf: 0.88 },
          { name: "FORK", conf: 0.81 },
          { name: "EXHAUST", conf: 0.74 },
        ],
        colors: ["BLUE"],
        plate_text: "MC-7789",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/105/baseline/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=Baseline+105",
        },
        latency_ms: 62,
        gflops: 1.9,
        status: "ready",
        error_msg: null,
      },
      cmt: {
        type: "MOTORCYCLE",
        type_conf: 0.94,
        make: "YAMAHA",
        make_conf: 0.87,
        model: "MIO",
        model_conf: 0.79,
        parts: [
          { name: "HEADLIGHT", conf: 0.96 },
          { name: "WHEEL", conf: 0.92 },
          { name: "FORK", conf: 0.86 },
          { name: "EXHAUST", conf: 0.78 },
          { name: "SEAT", conf: 0.72 },
        ],
        colors: ["BLUE", "BLACK"],
        plate_text: "MC-7789",
        annotated_image: {
          s3_key: `imageanalysis/${WID}/105/cmt/annotated.jpg`,
          url: "https://via.placeholder.com/640x360?text=CMT+105",
        },
        latency_ms: 66,
        gflops: 2.0,
        status: "ready",
        error_msg: null,
      },
    },
  },
];

// Derive "list" view from full objects (like your backend list endpoint)
let LIST = SHOW.map(parentOf);

// Basic in-memory helpers (for upload mocks)
const nextNo = () =>
  (LIST.reduce((m, r) => Math.max(m, r.analysis_no || 0), 100) || 100) + 1;

function findShow(id) {
  const item = SHOW.find((x) => x.id === id);
  if (!item) throw new Error("Not found");
  return item;
}

// ===== Public mock API =====

export async function iaList(wid) {
  // ignore wid for mock; in real code you filter by workspace
  await delay(150);
  // Sort newest first (analysis_no desc) to mimic your UI
  return [...LIST].sort((a, b) => (b.analysis_no || 0) - (a.analysis_no || 0));
}

export async function iaShow(_wid, analysisId) {
  await delay(120);
  return structuredClone(findShow(analysisId));
}

export async function iaPresign(_wid, { filename, content_type }) {
  await delay(80);
  return {
    key: `imageanalysis/${WID}/${nextNo()}/original/${filename || "image.jpg"}`,
    url: "https://example.invalid/presigned-put-mock", // not actually used
    content_type: content_type || "image/jpeg",
    max_bytes: 25 * MB,
  };
}

// Simulated PUT progress (UI won’t error while offline)
export function putToS3WithProgress(_url, _file, onProgress) {
  return new Promise((resolve) => {
    let p = 0;
    const t = setInterval(() => {
      p += 14 + Math.random() * 12;
      if (typeof onProgress === "function")
        onProgress(Math.min(100, Math.round(p)));
      if (p >= 100) {
        clearInterval(t);
        resolve();
      }
    }, 80);
  });
}

export async function iaCommit(
  _wid,
  { key, content_type, size_bytes, title, description }
) {
  await delay(120);
  const aid = `ia-${Math.random().toString(36).slice(2, 8)}`;
  const no = parseInt(key.split("/")[2], 10) || nextNo();
  const created_at = now();
  const show = {
    id: aid,
    workspace_id: WID,
    analysis_no: no,
    title: title ?? null,
    description: description ?? null,
    content_type: content_type || "image/jpeg",
    size_bytes: size_bytes || 400 * 1024,
    created_at,
    status: "uploaded",
    input_image: {
      s3_key: key,
      url: "https://via.placeholder.com/640x360?text=Original+NEW",
    },
    results: { baseline: null, cmt: null },
  };
  SHOW.push(show);
  LIST.push(parentOf(show));
  return { id: aid, analysis_no: no, status: "uploaded" };
}

export async function iaEnqueue(_wid, analysisId) {
  await delay(100);
  // flip status locally so the table reflects queued/processing
  const p = LIST.find((x) => x.id === analysisId);
  if (p) p.status = "queued";
  const s = SHOW.find((x) => x.id === analysisId);
  if (s) s.status = "queued";
  return {
    ok: true,
    status: "queued",
    baseline_message_id: `b-${analysisId}`,
    cmt_message_id: `c-${analysisId}`,
  };
}

export async function iaListRaw() {
  return LIST;
} // debug helper

// Optional: simple GET mock
export async function putToS3() {
  return;
} // no-op in mock

// utils
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
