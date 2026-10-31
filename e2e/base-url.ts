const productionHosts = new Set(["zan.org.il", "www.zan.org.il"]);

export function assertE2EBaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("E2E_BASE_URL is required and must not target production");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("E2E_BASE_URL is not a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("E2E_BASE_URL must be http or https");
  }

  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  if (productionHosts.has(host)) {
    throw new Error("E2E_BASE_URL must not target production (zan.org.il)");
  }

  return url.origin;
}
