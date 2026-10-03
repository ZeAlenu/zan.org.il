import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { Resvg } from "@resvg/resvg-js";
import { pages, site } from "../data/site";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const width = 1200;
const height = 630;

const enamel = "#003090";
const orange = "#f05400";
const sheet = "#ffffff";
const tint = "#ffe4d4";

const fonts = [
  "node_modules/@fontsource/secular-one/files/secular-one-hebrew-400-normal.woff",
  "node_modules/@fontsource/secular-one/files/secular-one-latin-400-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-hebrew-400-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-hebrew-700-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-latin-400-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-latin-700-normal.woff",
].map((file) => join(root, file));

type Card = (typeof pages)[keyof typeof pages]["card"];

function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function words(text: string, attrs: string): string {
  return `<text ${attrs} direction="rtl" unicode-bidi="plaintext">${escape(text)}</text>`;
}

function latin(text: string, attrs: string): string {
  return `<text ${attrs} direction="ltr">${escape(text)}</text>`;
}

async function markHref(): Promise<string> {
  const png = await readFile(join(root, "public/brand/logo-star-transparent.png"));
  return `data:image/png;base64,${png.toString("base64")}`;
}

function sheetCard(x: number, y: number, size: number, href: string): string {
  const inset = 18;
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="${sheet}"/>
    <image href="${href}" x="${x + inset}" y="${y + inset}" width="${size - inset * 2}" height="${size - inset * 2}"/>
  `;
}

function field(fill: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${fill}"/>
  ${body}
</svg>`;
}

async function svgFor(card: Card, mark: string): Promise<string> {
  const logo = sheetCard(516, 72, 168, mark);
  const domain = latin(
    site.host,
    `x="600" y="572" text-anchor="middle" font-family="Rubik" font-size="28" font-weight="700" fill="${sheet}" opacity="0.72"`,
  );

  if (card === "home") {
    return field(enamel, `
      ${logo}
      ${words(site.name, `x="600" y="360" text-anchor="middle" font-family="Secular One" font-size="92" fill="${sheet}"`)}
      ${words(site.line, `x="600" y="448" text-anchor="middle" font-family="Rubik" font-size="42" font-weight="400" fill="${tint}"`)}
      ${domain}
    `);
  }

  if (card === "vision") {
    return field(enamel, `
      ${logo}
      ${words(site.line, `x="600" y="380" text-anchor="middle" font-family="Secular One" font-size="72" fill="${sheet}"`)}
      ${words(site.name, `x="600" y="470" text-anchor="middle" font-family="Rubik" font-size="36" font-weight="700" fill="${tint}"`)}
      ${domain}
    `);
  }

  if (card === "about") {
    return field(enamel, `
      ${logo}
      ${words(pages.about.headline, `x="600" y="360" text-anchor="middle" font-family="Secular One" font-size="84" fill="${sheet}"`)}
      ${words(site.line, `x="600" y="448" text-anchor="middle" font-family="Rubik" font-size="42" font-weight="400" fill="${tint}"`)}
      ${domain}
    `);
  }

  if (card === "contact") {
    return field(enamel, `
      ${logo}
      ${words(site.contactTitle, `x="600" y="348" text-anchor="middle" font-family="Secular One" font-size="84" fill="${sheet}"`)}
      ${latin(site.email, `x="600" y="430" text-anchor="middle" font-family="Rubik" font-size="36" font-weight="700" fill="${sheet}"`)}
      ${latin(site.xHandle, `x="600" y="486" text-anchor="middle" font-family="Rubik" font-size="32" font-weight="700" fill="${tint}"`)}
      ${domain}
    `);
  }

  if (card === "join") {
    return field(orange, `
      ${logo}
      ${words(site.joinTitle, `x="600" y="368" text-anchor="middle" font-family="Secular One" font-size="84" fill="${sheet}"`)}
      ${words(site.joinCall, `x="600" y="456" text-anchor="middle" font-family="Rubik" font-size="36" font-weight="700" fill="${sheet}"`)}
      ${domain}
    `);
  }

  return field(enamel, `
    ${logo}
    ${words(site.mapKicker, `x="600" y="320" text-anchor="middle" font-family="Rubik" font-size="30" font-weight="700" fill="${tint}"`)}
    ${words(site.mapLiberty, `x="1040" y="430" text-anchor="end" font-family="Secular One" font-size="68" fill="${sheet}"`)}
    ${latin("vs.", `x="600" y="424" text-anchor="middle" font-family="Rubik" font-size="36" font-weight="700" fill="${tint}"`)}
    <rect x="72" y="372" width="380" height="68" rx="14" fill="${sheet}"/>
    ${words(site.mapOther, `x="262" y="418" text-anchor="middle" font-family="Rubik" font-size="28" font-weight="700" fill="${enamel}"`)}
    ${domain}
  `);
}

export async function writeShareImages(outDir = join(root, "public/share")): Promise<void> {
  const mark = await markHref();
  await mkdir(outDir, { recursive: true });

  const cards = [...new Set(Object.values(pages).map((page) => page.card))];
  for (const card of cards) {
    const svg = await svgFor(card, mark);
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      font: {
        fontFiles: fonts,
        defaultFontFamily: "Rubik",
        defaultFontStyle: "Regular",
        loadSystemFonts: false,
      },
    })
      .render()
      .asPng();

    if (png.byteLength > 600_000) {
      throw new Error(`share/${card}.png is ${png.byteLength} bytes; WhatsApp wants under 600KB`);
    }

    await writeFile(join(outDir, `${card}.png`), png);
  }
}

export function shareImages(): AstroIntegration {
  return {
    name: "share-images",
    hooks: {
      "astro:config:setup": async ({ command }) => {
        if (command === "build" || command === "dev" || command === "preview") {
          await writeShareImages();
        }
      },
    },
  };
}
