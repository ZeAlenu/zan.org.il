import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import type { JoinDatabase } from "../../join/db";
import { submitJoin, unavailableResponse } from "../../join/submit";

export const prerender = false;

type JoinBindings = {
  JOIN_DB?: JoinDatabase;
  TURNSTILE_SECRET?: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const bindings = env as JoinBindings;
    return await submitJoin({
      request,
      db: bindings.JOIN_DB,
      turnstileSecret: bindings.TURNSTILE_SECRET,
    });
  } catch {
    return unavailableResponse();
  }
};
