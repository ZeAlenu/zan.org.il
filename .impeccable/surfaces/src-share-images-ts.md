---
version: 1
slug: "src-share-images-ts"
primary_target: "src/share/images.ts"
related_targets:
  - "src/layouts/Base.astro"
  - "src/data/site.ts"
  - "public/brand/logo.png"
---

# Social share cards

Mode: Persuade. A shared link must show זה עלינו before anyone opens it.

## Scope

Open Graph and Twitter images for every public page. WhatsApp, X, and Facebook read these, not a screenshot of the page. Title and description stay in the crawler text. The picture is the brand.

## Direction contract

THESIS: The share picture is an enamel poster with the full lockup on a white plate, and the page name in display type. It refuses a cropped page, a star-only mark, and a chip that repeats the chat title.

OWN-WORLD: Enamel #003090 fills the 1200×630 field. The real lockup from `public/brand/logo.png` sits on a white plate, 18px radius, one soft sheet shadow. Page names are Secular One in sheet white. vs. and quieter lines are Rubik in bar tint #ffe4d4.

STORY: A person seeing a shared link recognizes זה עלינו from the lockup, then reads which page it is. They already get the title and sentence under the picture.

FIRST VIEWPORT: Enamel edge to edge. The lockup plate is on the physical left, complete, large. The page name is on the physical right: for the map, חירות, vs., ברית אדומה-ירוקה. Other pages keep that split with their own headline.

FORM: Masthead poster, dealt structure 7 of seed 9816d038. Locked from the share-card round.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
