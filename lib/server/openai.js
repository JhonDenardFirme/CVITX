// lib/server/openai.js
//
// Centralized OpenAI client for server-side use only.
// Never import this in client components.

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  // We throw early, but also log once so we can see in dev logs.
  // eslint-disable-next-line no-console
  console.error(
    "[openai] OPENAI_API_KEY is not set. Configure it in .env.local and in your deployment environment."
  );
  throw new Error(
    "OPENAI_API_KEY is not set. Configure it in .env.local and in your Vercel project settings."
  );
}

// eslint-disable-next-line no-console
console.log(
  "[openai] OpenAI client initialized. Key length:",
  apiKey.length
);

export const openai = new OpenAI({
  apiKey,
});
