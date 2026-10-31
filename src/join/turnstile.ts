/** Cloudflare's published Turnstile dummy keys. They are not a production secret. */
export const turnstileTest = {
  sitekey: "1x00000000000000000000AA",
  secret: "1x0000000000000000000000000000000AA",
  token: "XXXX.DUMMY.TOKEN.XXXX",
} as const;

const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileCheck = {
  secret: string;
  token: string;
  ip: string;
};

type SiteverifyResult = {
  success?: boolean;
  hostname?: string;
};

export function productionHost(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  return host === "zan.org.il" || host === "www.zan.org.il";
}

export function turnstileSecretAllowed(secret: string, hostname: string): boolean {
  if (!secret.trim()) return false;
  if (productionHost(hostname) && secret === turnstileTest.secret) return false;
  return true;
}

export async function verifyTurnstile(
  check: TurnstileCheck,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!check.token || check.token.length > 2048 || !check.secret) return false;

  let response: Response;
  try {
    response = await fetchImpl(siteverifyUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: check.secret,
        response: check.token,
        remoteip: check.ip,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return false;
  }

  if (!response.ok) return false;

  let result: SiteverifyResult;
  try {
    result = (await response.json()) as SiteverifyResult;
  } catch {
    return false;
  }

  if (result.success !== true) return false;
  if (check.secret === turnstileTest.secret) return true;

  const hostname = typeof result.hostname === "string" ? result.hostname : "";
  return productionHost(hostname);
}
