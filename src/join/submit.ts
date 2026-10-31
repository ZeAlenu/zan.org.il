import type { JoinDatabase } from "./db";
import {
  honeypotField,
  joinMessages,
  joinRateLimit,
  joinRateWindowMs,
} from "./messages";
import { turnstileSecretAllowed, verifyTurnstile, type TurnstileCheck } from "./turnstile";
import { isFieldError, validateJoin } from "./validate";

const bodyLimit = 8_000;

export type SubmitJoinOptions = {
  request: Request;
  db: JoinDatabase | undefined;
  turnstileSecret: string | undefined;
  verifyTurnstile?: (check: TurnstileCheck) => Promise<boolean>;
  now?: number;
  rateLimit?: number;
  rateWindowMs?: number;
};

export function unavailableResponse(error: "unavailable" | "turnstile" | "rate_limited" = "unavailable"): Response {
  return json(
    {
      ok: false,
      error,
      message: joinMessages.unavailable,
      fallback: true,
    },
    error === "rate_limited" ? 429 : 503,
  );
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function successResponse(): Response {
  return json({ ok: true }, 200);
}

function fieldResponse(error: "required" | "phone" | "email", field: string): Response {
  const message = error === "phone" ? joinMessages.phone : error === "email" ? joinMessages.email : joinMessages.required;
  return json({ ok: false, error, field, message, fallback: false }, 400);
}

function clientIp(request: Request): string {
  const ip = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  if (!ip || ip.length > 64) return "unknown";
  return ip;
}

function honeypotTripped(body: Record<string, unknown>): boolean {
  const value = body[honeypotField];
  if (value === undefined || value === null) return false;
  if (typeof value !== "string") return true;
  return value.trim() !== "";
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("UNIQUE constraint failed");
}

export async function submitJoin(options: SubmitJoinOptions): Promise<Response> {
  try {
    return await handleJoin(options);
  } catch {
    return unavailableResponse();
  }
}

async function handleJoin(options: SubmitJoinOptions): Promise<Response> {
  const type = options.request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) return unavailableResponse();

  const raw = await options.request.text();
  if (raw.length > bodyLimit) return unavailableResponse();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return unavailableResponse();
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return unavailableResponse();
  const body = parsed as Record<string, unknown>;
  if (honeypotTripped(body)) return successResponse();

  const submission = validateJoin(body);
  if (isFieldError(submission)) return fieldResponse(submission.error, submission.field);

  const db = options.db;
  const secret = options.turnstileSecret;
  if (!db || !secret) return unavailableResponse();

  const hostname = new URL(options.request.url).hostname;
  if (!turnstileSecretAllowed(secret, hostname)) return unavailableResponse();

  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  const ip = clientIp(options.request);
  const verify = options.verifyTurnstile ?? verifyTurnstile;
  const passed = await verify({ secret, token, ip });
  if (!passed) return unavailableResponse("turnstile");

  const existing = await db
    .prepare(
      `SELECT id FROM join_submissions
       WHERE (? IS NOT NULL AND phone = ?)
          OR (? IS NOT NULL AND email = ?)
       LIMIT 1`,
    )
    .bind(submission.phone, submission.phone, submission.email, submission.email)
    .first<{ id: number }>();
  if (existing) return successResponse();

  const limit = options.rateLimit ?? joinRateLimit;
  const windowMs = options.rateWindowMs ?? joinRateWindowMs;
  const now = options.now ?? Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  await db
    .prepare(
      `INSERT INTO join_rate_limits (ip, window_start, hits)
       VALUES (?, ?, 1)
       ON CONFLICT (ip, window_start) DO UPDATE SET hits = hits + 1`,
    )
    .bind(ip, windowStart)
    .run();

  const rate = await db
    .prepare(`SELECT hits FROM join_rate_limits WHERE ip = ? AND window_start = ?`)
    .bind(ip, windowStart)
    .first<{ hits: number }>();
  if (!rate || Number(rate.hits) > limit) return unavailableResponse("rate_limited");

  try {
    await db
      .prepare(
        `INSERT INTO join_submissions (name, phone, email, time, profession, area)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        submission.name,
        submission.phone,
        submission.email,
        submission.time,
        submission.profession,
        submission.area,
      )
      .run();
  } catch (error) {
    if (isUniqueViolation(error)) return successResponse();
    throw error;
  }

  return successResponse();
}
