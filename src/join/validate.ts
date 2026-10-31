import { joinTimes, type JoinTime } from "./messages";

export type JoinField = "name" | "contact" | "time" | "profession" | "area" | "phone" | "email";

export type JoinFieldError = {
  error: "required" | "phone" | "email";
  field: JoinField;
};

export type JoinSubmission = {
  name: string;
  phone: string | null;
  email: string | null;
  time: JoinTime;
  profession: string;
  area: string;
};

const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function normalizePhone(input: string): string | null {
  const stripped = input.trim().replace(/[\s\-().]/g, "");
  let national = stripped;
  if (stripped.startsWith("+972")) national = `0${stripped.slice(4)}`;
  else if (stripped.startsWith("972")) national = `0${stripped.slice(3)}`;
  if (!/^0(?:5\d{8}|[23489]\d{7})$/.test(national)) return null;
  return `+972${national.slice(1)}`;
}

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !emailPattern.test(email)) return null;
  return email;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > max) return null;
  if (/[\u0000-\u001F]/.test(text)) return null;
  return text;
}

export function validateJoin(body: Record<string, unknown>): JoinFieldError | JoinSubmission {
  const name = cleanText(body.name, 80);
  if (!name) return { error: "required", field: "name" };

  const time = body.time;
  if (typeof time !== "string" || !joinTimes.includes(time as JoinTime)) {
    return { error: "required", field: "time" };
  }

  const profession = cleanText(body.profession, 120);
  if (!profession) return { error: "required", field: "profession" };

  const area = cleanText(body.area, 120);
  if (!area) return { error: "required", field: "area" };

  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";

  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizePhone(phoneRaw);
    if (!phone) return { error: "phone", field: "phone" };
  }

  let email: string | null = null;
  if (emailRaw) {
    email = normalizeEmail(emailRaw);
    if (!email) return { error: "email", field: "email" };
  }

  if (!phone && !email) return { error: "required", field: "contact" };

  return { name, phone, email, time: time as JoinTime, profession, area };
}

export function isFieldError(value: JoinFieldError | JoinSubmission): value is JoinFieldError {
  return "error" in value;
}
