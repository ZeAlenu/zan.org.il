import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const hook = fileURLToPath(new URL("./userland-punycode.cjs", import.meta.url));
const bins = {
  astro: path.join(root, "node_modules/astro/bin/astro.mjs"),
  wrangler: path.join(root, "node_modules/wrangler/bin/wrangler.js"),
};

const [name, ...args] = process.argv.slice(2);
const bin = bins[name];
if (!bin) {
  console.error(`Unknown command ${name ?? ""}`);
  process.exit(1);
}

const prior = process.env.NODE_OPTIONS ?? "";
if (!prior.includes("userland-punycode.cjs")) {
  process.env.NODE_OPTIONS = `--require ${hook}${prior ? ` ${prior}` : ""}`;
}

const child = spawn(process.execPath, [bin, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
