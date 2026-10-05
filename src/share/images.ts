import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { Resvg } from "@resvg/resvg-js";
import { pages, site } from "../data/site.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const width = 1200;
const height = 630;
const enamel = "#003090";
const sheet = "#ffffff";
const tint = "#ffe4d4";
const pad = 56;
const gap = 40;
const plateRadius = 18;
const platePadX = 14;
const platePadY = 12;
const lockupHeight = 450;
const logoSize = 1254;
const crop = { x: 120, y: 160, w: 1014, h: 920 };
const whatsAppMaxBytes = 600_000;

const fonts = [
  "node_modules/@fontsource/secular-one/files/secular-one-hebrew-400-normal.woff",
  "node_modules/@fontsource/secular-one/files/secular-one-latin-400-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-hebrew-400-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-hebrew-700-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-latin-400-normal.woff",
  "node_modules/@fontsource/rubik/files/rubik-latin-700-normal.woff",
].map((file) => join(root, file));

type Card = (typeof pages)[keyof typeof pages]["card"];

type Line = {
  text: string;
  size: number;
  fill?: string;
  family?: string;
  weight?: number;
  latin?: boolean;
  leading?: number;
  gap?: number;
};

function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function hebrew(text: string, attrs: string): string {
  return `<text ${attrs} direction="rtl" unicode-bidi="plaintext">${escape(text)}</text>`;
}

function latin(text: string, attrs: string): string {
  return `<text ${attrs} direction="ltr">${escape(text)}</text>`;
}

function lineHeight(line: Line): number {
  return line.size * (line.leading ?? 0.92);
}

function estimateWidth(text: string, size: number): number {
  return text.length * size * 0.62;
}

function wrapLine(line: Line, maxWidth: number): Line[] {
  if (estimateWidth(line.text, line.size) <= maxWidth) {
    return [line];
  }

  const words = line.text.split(" ");
  if (words.length === 1) {
    const size = Math.max(28, Math.floor(maxWidth / (line.text.length * 0.62)));
    return [{ ...line, size }];
  }

  const lines: Line[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (estimateWidth(trial, line.size) > maxWidth && current) {
      lines.push({ ...line, text: current });
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) {
    lines.push({ ...line, text: current });
  }
  return lines;
}

function poster(lines: Line[], x: number): string {
  const block = lines.reduce((sum, line, index) => {
    const after = index === lines.length - 1 ? 0 : (line.gap ?? 16);
    return sum + lineHeight(line) + after;
  }, 0);
  let top = (height - block) / 2;

  return lines
    .map((line, index) => {
      const baseline = top + line.size * 0.78;
      top += lineHeight(line) + (index === lines.length - 1 ? 0 : (line.gap ?? 16));
      const family = line.family ?? "Secular One";
      const fill = line.fill ?? sheet;
      const weight = line.weight ? ` font-weight="${line.weight}"` : "";
      const attrs = `x="${x}" y="${baseline.toFixed(1)}" text-anchor="end" font-family="${family}" font-size="${line.size}"${weight} fill="${fill}"`;
      return line.latin ? latin(line.text, attrs) : hebrew(line.text, attrs);
    })
    .join("\n");
}

function plate(href: string): { svg: string; namesX: number; namesWidth: number } {
  const scale = lockupHeight / crop.h;
  const imageWidth = crop.w * scale;
  const plateWidth = imageWidth + platePadX * 2;
  const plateHeight = lockupHeight + platePadY * 2;
  const plateX = pad;
  const plateY = (height - plateHeight) / 2;
  const imageX = plateX + platePadX;
  const imageY = plateY + platePadY;
  const namesX = width - pad;
  const namesWidth = namesX - (plateX + plateWidth + gap);

  if (namesWidth < 360) {
    throw new Error(`share names column is ${namesWidth.toFixed(0)}px; the lockup left no room for the page name`);
  }

  const svg = `
    <defs>
      <filter id="lift" x="-8%" y="-8%" width="116%" height="124%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#081746" flood-opacity="0.1"/>
      </filter>
      <clipPath id="lockup">
        <rect x="${imageX.toFixed(1)}" y="${imageY.toFixed(1)}" width="${imageWidth.toFixed(1)}" height="${lockupHeight}"/>
      </clipPath>
    </defs>
    <rect x="${plateX.toFixed(1)}" y="${plateY.toFixed(1)}" width="${plateWidth.toFixed(1)}" height="${plateHeight.toFixed(1)}" rx="${plateRadius}" fill="${sheet}" filter="url(#lift)"/>
    <image href="${href}" x="${(imageX - crop.x * scale).toFixed(1)}" y="${(imageY - crop.y * scale).toFixed(1)}" width="${(logoSize * scale).toFixed(1)}" height="${(logoSize * scale).toFixed(1)}" clip-path="url(#lockup)" preserveAspectRatio="xMidYMid meet"/>
  `;

  return { svg, namesX, namesWidth };
}

function linesFor(card: Card): Line[] {
  if (card === "map") {
    return [
      { text: site.mapLiberty, size: 108, leading: 0.88, gap: 8 },
      { text: "vs.", size: 28, family: "Rubik", fill: tint, latin: true, leading: 1, gap: 12 },
      { text: site.mapOther, size: 46, leading: 0.92 },
    ];
  }

  if (card === "home") {
    return [
      { text: site.name, size: 96, gap: 14 },
      { text: site.line, size: 32, family: "Rubik", fill: tint, leading: 1.2 },
    ];
  }

  if (card === "vision") {
    return [
      { text: site.line, size: 64, gap: 14 },
      { text: site.name, size: 32, family: "Rubik", weight: 700, fill: tint, leading: 1.2 },
    ];
  }

  if (card === "about") {
    return [
      { text: pages.about.headline, size: 84, gap: 14 },
      { text: site.line, size: 32, family: "Rubik", fill: tint, leading: 1.2 },
    ];
  }

  if (card === "join") {
    return [
      ...site.joinTitle.split(" ").map((text, index, all) => ({
        text,
        size: 84,
        gap: index === all.length - 1 ? 14 : 4,
      })),
      { text: site.joinCall, size: 32, family: "Rubik", weight: 700, fill: tint, leading: 1.2 },
    ];
  }

  return [{ text: site.contactTitle, size: 72 }];
}

async function logoHref(): Promise<string> {
  const png = await readFile(join(root, "public/brand/logo.png"));
  return `data:image/png;base64,${png.toString("base64")}`;
}

function svgFor(card: Card, href: string): string {
  const lockup = plate(href);
  const lines = linesFor(card).flatMap((line) => wrapLine(line, lockup.namesWidth));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${enamel}"/>
  ${lockup.svg}
  ${poster(lines, lockup.namesX)}
</svg>`;
}

function raster(svg: string): Buffer {
  return Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      font: {
        fontFiles: fonts,
        defaultFontFamily: "Rubik",
        defaultFontStyle: "Regular",
        loadSystemFonts: false,
      },
    })
      .render()
      .asPng(),
  );
}

export async function writeShareImages(outDir = join(root, "public/share")): Promise<void> {
  const href = await logoHref();
  await mkdir(outDir, { recursive: true });

  const cards = [...new Set(Object.values(pages).map((page) => page.card))];
  for (const card of cards) {
    const png = raster(svgFor(card, href));
    if (png.byteLength > whatsAppMaxBytes) {
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

if (process.argv[1]?.includes("share/images")) {
  await writeShareImages();
}
