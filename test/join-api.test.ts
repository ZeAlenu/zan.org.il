import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { getPlatformProxy } from "wrangler";
import type { JoinDatabase } from "../src/join/db";
import { joinMessages, joinRateLimit } from "../src/join/messages";
import { submitJoin } from "../src/join/submit";
import { normalizeEmail, normalizePhone } from "../src/join/validate";
import { turnstileTest } from "../src/join/turnstile";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

let db: JoinDatabase;
let dispose: () => Promise<void>;

const verify = async (check: { secret: string; token: string }) =>
  check.secret === turnstileTest.secret && check.token === turnstileTest.token;

function signup(overrides: Record<string, unknown> = {}) {
  return {
    name: "בדיקה לדוגמה",
    phone: "0501234567",
    email: "",
    time: "שעה בשבוע",
    profession: "מורה",
    area: "ירושלים",
    company: "",
    turnstileToken: turnstileTest.token,
    ...overrides,
  };
}

function post(body: unknown, ip = "203.0.113.10", host = "http://preview.example.test") {
  return new Request(`${host}/api/join`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

async function countRows(): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM join_submissions").first<{ count: number }>();
  return Number(row?.count ?? 0);
}

beforeAll(async () => {
  process.env.WRANGLER_SEND_METRICS = "false";
  const proxy = await getPlatformProxy<{ JOIN_DB: JoinDatabase }>({
    configPath: join(root, "wrangler.test.jsonc"),
    remoteBindings: false,
    persist: false,
    envFiles: [],
  });
  db = proxy.env.JOIN_DB;
  dispose = proxy.dispose;
  const sql = readFileSync(join(root, "migrations/0001_join_submissions.sql"), "utf8");
  for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) {
    await db.prepare(statement).run();
  }
});

afterAll(async () => {
  await dispose?.();
});

beforeEach(async () => {
  await db.prepare("DELETE FROM join_submissions").run();
  await db.prepare("DELETE FROM join_rate_limits").run();
});

describe("POST /api/join", () => {
  test("normalizes Israeli phone numbers and email", () => {
    expect(normalizePhone("050-123-4567")).toBe("+972501234567");
    expect(normalizePhone("+972 50 123 4567")).toBe("+972501234567");
    expect(normalizePhone("02-1234567")).toBe("+97221234567");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizeEmail(" Member@Example.com ")).toBe("member@example.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });

  test("accepts each time value", async () => {
    for (const [index, time] of ["שעה בשבוע", "כמה שעות בשבוע", "משימה חד־פעמית"].entries()) {
      const response = await submitJoin({
        request: post(signup({ phone: `052000000${index + 1}`, time }), `203.0.113.4${index}`),
        db,
        turnstileSecret: turnstileTest.secret,
        verifyTurnstile: verify,
      });
      expect(response.status, time).toBe(200);
    }
    expect(await countRows()).toBe(3);
  });

  test("rejects missing and invalid fields", async () => {
    const cases: Array<{ body: Record<string, unknown>; error: string; message: string }> = [
      { body: signup({ name: "  " }), error: "required", message: joinMessages.required },
      { body: signup({ phone: "", email: "" }), error: "required", message: joinMessages.required },
      { body: signup({ time: "מחר" }), error: "required", message: joinMessages.required },
      { body: signup({ area: "" }), error: "required", message: joinMessages.required },
      { body: signup({ phone: "12345" }), error: "phone", message: joinMessages.phone },
      { body: signup({ phone: "", email: "not-an-email" }), error: "email", message: joinMessages.email },
    ];

    for (const item of cases) {
      const response = await submitJoin({
        request: post(item.body),
        db,
        turnstileSecret: turnstileTest.secret,
        verifyTurnstile: verify,
      });
      expect(response.status).toBe(400);
      const payload = await response.json();
      expect(payload).toMatchObject({ ok: false, error: item.error, message: item.message, fallback: false });
    }
    expect(await countRows()).toBe(0);
  });

  test("an empty profession returns 200 and stores one row", async () => {
    const response = await submitJoin({
      request: post(signup({ profession: "" })),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await countRows()).toBe(1);
    const row = await db.prepare("SELECT profession FROM join_submissions").first<{ profession: string }>();
    expect(row?.profession).toBe("");
  });

  test("a honeypot submission stores nothing", async () => {
    const response = await submitJoin({
      request: post(signup({ company: "acme" })),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(await countRows()).toBe(0);
  });

  test("a duplicate sign-up returns success and keeps one row", async () => {
    const first = await submitJoin({
      request: post(signup()),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    const second = await submitJoin({
      request: post(signup({ name: "שם אחר", phone: "050-123-4567", profession: "רופא" })),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true });
    expect(await second.json()).toEqual({ ok: true });
    expect(await countRows()).toBe(1);

    const emailFirst = await submitJoin({
      request: post(signup({ phone: "", email: "Test@Example.com" }), "203.0.113.11"),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    const emailSecond = await submitJoin({
      request: post(signup({ phone: "", email: "test@example.com", name: "אחר" }), "203.0.113.11"),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    expect(emailFirst.status).toBe(200);
    expect(emailSecond.status).toBe(200);
    expect(await countRows()).toBe(2);
  });

  test("the rate limit stops a sixth new sign-up from the same IP", async () => {
    for (let index = 1; index <= joinRateLimit; index += 1) {
      const response = await submitJoin({
        request: post(signup({ phone: `050000000${index}` }), "203.0.113.20"),
        db,
        turnstileSecret: turnstileTest.secret,
        verifyTurnstile: verify,
        now: 1_700_000_000_000,
      });
      expect(response.status).toBe(200);
    }

    const blocked = await submitJoin({
      request: post(signup({ phone: "0500000006" }), "203.0.113.20"),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
      now: 1_700_000_000_000,
    });
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toMatchObject({
      ok: false,
      error: "rate_limited",
      message: joinMessages.unavailable,
      fallback: true,
    });
    expect(await countRows()).toBe(joinRateLimit);

    const retry = await submitJoin({
      request: post(signup({ phone: "0500000001" }), "203.0.113.20"),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
      now: 1_700_000_000_000,
    });
    expect(retry.status).toBe(200);
    expect(await countRows()).toBe(joinRateLimit);

    const otherIp = await submitJoin({
      request: post(signup({ phone: "0500000007" }), "203.0.113.21"),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
      now: 1_700_000_000_000,
    });
    expect(otherIp.status).toBe(200);
    expect(await countRows()).toBe(joinRateLimit + 1);
  });

  test("a missing binding or secret, or a rejected Turnstile token, asks the client to fall back", async () => {
    const missingDb = await submitJoin({
      request: post(signup()),
      db: undefined,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: verify,
    });
    expect(missingDb.status).toBe(503);
    expect(await missingDb.json()).toMatchObject({
      ok: false,
      error: "unavailable",
      message: joinMessages.unavailable,
      fallback: true,
    });

    const missingSecret = await submitJoin({
      request: post(signup()),
      db,
      turnstileSecret: undefined,
      verifyTurnstile: verify,
    });
    expect(missingSecret.status).toBe(503);
    expect(await missingSecret.json()).toMatchObject({ error: "unavailable", fallback: true });

    const rejected = await submitJoin({
      request: post(signup({ turnstileToken: "nope" })),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: async () => false,
    });
    expect(rejected.status).toBe(503);
    expect(await rejected.json()).toMatchObject({
      error: "turnstile",
      message: joinMessages.unavailable,
      fallback: true,
    });
    expect(await countRows()).toBe(0);
  });

  test("the production host refuses the Turnstile test secret", async () => {
    let called = false;
    const response = await submitJoin({
      request: post(signup(), "203.0.113.30", "https://zan.org.il"),
      db,
      turnstileSecret: turnstileTest.secret,
      verifyTurnstile: async () => {
        called = true;
        return true;
      },
    });
    expect(called).toBe(false);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "unavailable", fallback: true });
    expect(await countRows()).toBe(0);
  });
});
