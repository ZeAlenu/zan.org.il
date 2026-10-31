declare module "cloudflare:workers" {
  const env: {
    JOIN_DB?: import("./join/db").JoinDatabase;
    TURNSTILE_SECRET?: string;
  };
  export { env };
}
