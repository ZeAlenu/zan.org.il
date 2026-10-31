export const joinTimes = ["שעה בשבוע", "כמה שעות בשבוע", "משימה חד־פעמית"] as const;

export type JoinTime = (typeof joinTimes)[number];

export const joinMessages = {
  success: "קיבלנו. נחזור אליך עם צוות ומשימה",
  required: "שדה חובה",
  phone: "מספר טלפון לא תקין",
  email: "כתובת מייל לא תקינה",
  unavailable: "משהו השתבש, נסו שוב",
  whatsapp: "או הצטרפו לקהילת הוואטסאפ",
} as const;

export const joinRateLimit = 5;
export const joinRateWindowMs = 10 * 60 * 1000;

export const honeypotField = "company";
