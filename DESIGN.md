---
name: זה עלינו
description: Enamel and paper sheets on daylight glass.
colors:
  enamel: "#003090"
  route-orange: "#f05400"
  ink: "#0e1d55"
  glass: "#f4f6f8"
  sheet: "#ffffff"
  bar-tint: "#ffe4d4"
typography:
  display:
    fontFamily: "Secular One, Rubik, sans-serif"
    fontSize: "clamp(3.4rem, 5.4vw, 5.6rem)"
    fontWeight: 400
    lineHeight: 0.92
  headline:
    fontFamily: "Secular One, Rubik, sans-serif"
    fontSize: "clamp(2.4rem, 3.6vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 0.92
  title:
    fontFamily: "Secular One, Rubik, sans-serif"
    fontSize: "clamp(1.6rem, 2.2vw, 2.2rem)"
    fontWeight: 400
    lineHeight: 0.92
  body:
    fontFamily: "Rubik, Secular One, sans-serif"
    fontSize: "clamp(1.25rem, 1.8vw, 1.7rem)"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Rubik, Secular One, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.45
rounded:
  sheet: "22px"
  logo: "18px"
  button: "14px"
  stop: "12px"
spacing:
  pad: "20px"
  sheet-gap: "16px"
  mobile-inset: "12px"
components:
  button-action:
    backgroundColor: "{colors.route-orange}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.button}"
    padding: "0.85rem 1.3rem"
  button-action-hover:
    backgroundColor: "#de4e08"
    textColor: "{colors.sheet}"
  button-on-join:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.route-orange}"
    rounded: "{rounded.button}"
    padding: "0.85rem 1.3rem"
  button-on-join-hover:
    backgroundColor: "#fff4ee"
    textColor: "{colors.route-orange}"
  map-button:
    backgroundColor: transparent
    textColor: "{colors.sheet}"
    typography: "{typography.display}"
  map-button-other:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.enamel}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "40px"
  map-button-hover:
    textColor: "{colors.bar-tint}"
  map-button-other-hover:
    textColor: "{colors.route-orange}"
  header:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "0 8px"
    height: "76px"
  bar-sentence:
    textColor: "{colors.bar-tint}"
    fontFamily: "Rubik, Secular One, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.35
  header-link-hover:
    textColor: "{colors.bar-tint}"
  rail:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.enamel}"
    rounded: "{rounded.sheet}"
    padding: "14px 10px"
    width: "168px"
  rail-link:
    textColor: "{colors.enamel}"
    rounded: "{rounded.stop}"
    padding: "11px 6px"
  rail-link-hover:
    backgroundColor: "#eef2f8"
    textColor: "{colors.enamel}"
  rail-join:
    backgroundColor: "{colors.route-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.stop}"
    padding: "11px 6px"
  sheet-join:
    backgroundColor: "{colors.route-orange}"
    textColor: "{colors.sheet}"
    typography: "{typography.display}"
    rounded: "{rounded.sheet}"
    padding: "1.4rem 1.5rem"
  sheet-about:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.sheet}"
    typography: "{typography.headline}"
    rounded: "{rounded.sheet}"
    padding: "1.4rem 1.5rem"
  sheet-paper:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.enamel}"
    typography: "{typography.title}"
    rounded: "{rounded.sheet}"
    padding: "1.4rem 1.5rem"
  sheet-matter:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.enamel}"
    typography: "{typography.title}"
    rounded: "{rounded.sheet}"
    padding: "1.4rem 1.5rem"
  logo-card:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.logo}"
    width: "168px"
    height: "104px"
  reading:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sheet}"
    padding: "clamp(2.5rem, 5vw, 4.5rem)"
---

# Design System: זה עלינו

## Overview

**Creative North Star: "The station case"**

The station case sets a daylight-glass ground. Enamel and paper sheets sit on it, lifted by one soft offset shadow. Route orange fills the join sheet and chips the join stop. The real logo is the only mark. A screen holds a few large sheets.

Route orange is the join voice. It fills the join sheet, the join stop, and the action that leads there. Enamel is the floating header, the about sheet, and the full-bleed line page. Quieter stops stay paper, in enamel type. Hebrew runs right to left. Secular One at 400 carries display. Rubik carries body and the interface.

The station frame floats an enamel header and a white side rail. Interior pages are one reading sheet in that frame. The line page fills the viewport with enamel and leaves the frame. The confirmed rejections are a centered splash and an equal-card grid.

**Key Characteristics:**

- Daylight glass ground
- Enamel and paper sheets
- Route orange as the join voice
- One soft offset shadow
- The real logo is the only mark

## Colors

Daylight glass is the ground. Enamel and route orange are the two voices. Ink is the reading color on paper. Sheet white is the paper.

### Primary

- **Enamel Blue** (`#003090`): The floating header, the about sheet, the about reading page, the line page, enamel type on paper, the current-stop stroke, the scrollbar thumb, and the theme color.

### Secondary

- **Route Orange** (`#f05400`): The join sheet, the join stop, the action, text selection, and the focus outline. On the join reading page the action inverts to sheet white with route-orange type.

### Neutral

- **Ink** (`#0e1d55`): Body text on paper, and the type on the orange join stop.
- **Daylight Glass** (`#f4f6f8`): The page ground behind the floating frame.
- **Sheet White** (`#ffffff`): Paper sheets, the logo card, the rail, the paper chip on the map entry, and a link on enamel or route orange.
- **Bar tint** (`#ffe4d4`): The quieter word on enamel. It colors vs. in the map entry, the hover of a bar link, and a sentence passed into the bar. That sentence is Rubik at 1.02rem, line-height 1.35. Its first line is 700 and the line after it is 400.

### Named Rules

**The Join Voice Rule.** Route orange is the join voice: it fills the join sheet, chips the join stop, and fills the action that leads there. It is not a general enamel substitute.

## Typography

**Display Font:** Secular One (with Rubik, sans-serif)
**Body Font:** Rubik (with Secular One, sans-serif)

**Character:** Secular One is a single weight, used large and tight. Rubik does the reading and every interface label. Hebrew is the primary script; both faces are loaded in Hebrew and Latin at 400, and Rubik also at 700.

### Hierarchy

- **Display** (400, `clamp(3.4rem, 5.4vw, 5.6rem)` on the join sheet, line-height 0.92): The join sheet title. Reading-page titles use the same face at `clamp(3.4rem, 6.4vw, 6rem)`. The line page uses `clamp(3.4rem, 8vw, 7rem)` at line-height 0.9. Under 800px the join title is 2.8rem.
- **Headline** (400, `clamp(2.4rem, 3.6vw, 3.6rem)`, line-height 0.92): The about sheet title. Under 800px it is 2.2rem.
- **Title** (400, `clamp(1.6rem, 2.2vw, 2.2rem)`, line-height 0.92): The logo line on its paper sheet.
- **Body** (400, `clamp(1.25rem, 1.8vw, 1.7rem)`, line-height 1.45): Reading pages, held to about 28ch. The about sheet’s supporting sentence is `clamp(1rem, 1.25vw, 1.25rem)` and about 22ch. The root line-height is 1.45.
- **Label** (700): Rail stops at 1.02rem, with rail line-height 1.2. The map entry’s paper chip is Rubik 700 at 1.02rem; חירות in that entry is Secular One. A sentence in the bar is Rubik at 1.02rem in the bar tint, first line 700 and the next line 400. The action at 1.3rem. The join sheet’s supporting line is Rubik 700 at `clamp(1.2rem, 1.6vw, 1.7rem)`. Email and X sheets are Rubik 700 at `clamp(1.15rem, 1.5vw, 1.55rem)`.

### Named Rules

**The Display Face Rule.** Secular One 400 is the display face. Rubik is body and UI. Do not substitute a system display face.

## Layout

The document is Hebrew, `lang="he"` and `dir="rtl"`. The station frame is inset by 20px. A 76px enamel header floats at that inset. Its box is forced left-to-right so the logo card stays on the physical right and the contact links stay on the physical left; the link row itself is right-to-left, with a gap of `clamp(22px, 2.6vw, 48px)`. The logo card is 168×104 and shares the rail’s 168px column. The white rail starts 164px from the top, directly under the logo.

The home case is a grid with columns `minmax(0, 1.35fr)` and `minmax(0, 0.8fr)`, rows `auto auto`, and a 16px gap. In the RTL grid the wide start column sits beside the rail: the orange join sheet, min-height 380px, spanning both rows and stretching with them. The narrow column stacks the enamel about sheet (row 1, min-height 200px) over a paper matter sheet (row 2, min-height 240px). The matter sheet is the home format for a page that is not join or about: Secular One title, then that page’s public names as Rubik type. The redgreen sheet uses that format — title ברית אדומה־ירוקה, members from `FRAMES` — and links to `/redgreen`. Content clears the frame with 164px top padding and a right inset of the rail plus 16px.

**The Home Sheet Rule.** Every home sheet is one station surface of live HTML. Do not paste a screenshot. Do not nest the destination page’s chrome (map frames, dashed boxes, node pills, genealogy colors, emoji marks). Name the subject in Secular One; list the page’s facts as type; grow and shrink with the case. Facts come from `site.ts` or the same source the target page uses.

Interior station pages (about, join, contact) replace the case with one reading sheet in the same insets, min-height `calc(100vh - 192px)`, text aligned to the start. The line page (vision) uses no header and no rail: a full-viewport enamel field, centered, padded `10vh 8vw`.

Under 800px the inset tightens to 12px, the logo card becomes 116×64, the header wraps, and the rail becomes a horizontal strip. The home case stacks in a column with a 12px gap, and the join sheet leads, then about, then the map sheet.

### Named Rules

**The Station Frame Rule.** Station pages sit under a floating enamel header and a white side rail. The line page leaves that frame and fills the viewport with enamel.

## Elevation & Depth

The system is lifted. Header, logo card, rail, home sheets, and the reading sheet share one soft offset shadow. Depth is that lift against daylight glass. Home sheets rise 2px on hover. The current rail stop is marked with an inset 2px stroke (enamel, or ink on the join stop). That stroke is selection, not a second lift. Focus is a 3px route-orange outline, offset 3px.

### Shadow Vocabulary

- **Sheet lift** (`box-shadow: 0 8px 18px rgba(8, 23, 70, 0.1)`): The header, the logo card, the rail, every home sheet, and the reading sheet.

### Named Rules

**The One Shadow Rule.** Lifted surfaces share one soft offset shadow, 0 8px 18px rgba(8, 23, 70, 0.1). The current stop’s inset stroke is a selection mark, not a second shadow.

## Shapes

Corners are large and shared. The header, the rail, the home sheets, and the reading sheet are 22px. The logo card is 18px. The map entry’s paper chip and the action are 14px. Rail stops are 12px. The header is a full pill-ended bar; the rail is the same radius, stacked as a route card.

### Named Rules

**The Sheet Radius Rule.** The header, the rail, and sheets share a 22px radius. The logo card is 18px. The map entry’s paper chip and the action are 14px. Rail stops are 12px.

## Components

Surfaces are enamel or paper. Route orange is the chip on the join stop and the fill of the join sheet. Interactive color changes are recolors: no extra shadow on hover.

### Buttons

- **Shape:** 14px radius. The action is Rubik 700 at 1.3rem, padding 0.85rem 1.3rem.
- **Primary:** Route-orange fill, sheet-white type. Hover fills `#de4e08`.
- **On the join reading page:** Sheet-white fill, route-orange type. Hover fills `#fff4ee`.
- **Map entry:** Passed into the bar by the homepage. חירות is Secular One in sheet white on the enamel. vs. is the bar tint. ברית אדומה-ירוקה is a paper chip, enamel type, 14px radius, 40px tall. Hover turns חירות to the bar tint and the chip’s type to route orange. A sentence the page passes into the bar is the bar tint, Rubik at 1.02rem, first line 700 and the next line 400. The lines do not wrap; they ellipsize. The bar keeps the same height as on the other pages, so the home mark stays in the same place. The bar itself is the home mark plus what the page passes: a list of links, or one link with its description. On the vision page the field is already enamel, so only the home mark shows, in the same place.

### Chips

- **Join stop:** Route-orange fill, ink type, 12px radius, padding 11px 6px, Rubik 700 at 1.02rem. When it is the current page, an inset 2px ink stroke replaces the enamel stroke.
- **Other stops:** Enamel type on the paper rail. Hover washes `#eef2f8`. The current stop keeps enamel type and adds an inset 2px enamel stroke.

### Cards / Containers

- **Corner Style:** 22px.
- **Join sheet:** Route-orange fill, sheet-white type, centered, padding 1.4rem 1.5rem, min-height 380px (240px under 800px). Display title plus a Rubik 700 supporting line.
- **Enamel sheet:** Enamel fill, sheet-white type, the same padding, min-height 220px (220px under 800px). Headline plus a short body, about 22ch.
- **Matter sheet:** Paper fill, enamel title, the same padding, min-height 240px. Secular One at `clamp(1.8rem, 2.8vw, 2.6rem)` (2rem under 800px), max-width about 8ch so a Hebrew title stacks. Public names from the destination sit under it as Rubik 500, `clamp(1rem, 1.35vw, 1.2rem)`. No inner frame, no nested cards. The redgreen sheet is this format, linking to `/redgreen`.
- **Paper sheets:** Sheet-white fill, enamel type, min-height 96px. The logo line uses the title face. Email and X use Rubik 700.
- **Reading sheet:** Sheet-white fill, ink type, padding `clamp(2.5rem, 5vw, 4.5rem)`, text at the start, display title in enamel. The join reading sheet is route orange with white type and a white action. The about reading sheet is enamel with white type and a route-orange action.
- **Shadow Strategy:** The one sheet lift. Hover translates the home sheet up 2px.
- **Border:** None. Selection on the rail is the inset stroke.
- **Logo card:** Sheet white, 18px, 168×104 (116×64 under 800px). It holds the logo image and links home.

### Navigation

The enamel header carries the map entry toward the logo: חירות in white on the enamel, ברית אדומה-ירוקה on a paper chip. The rail is the route: home, about, vision, join, contact. The logo image is the home mark; the header does not repeat a wordmark.

### Line page

Full-viewport enamel, display at `clamp(3.4rem, 8vw, 7rem)`, line-height 0.9, white body at `clamp(1.2rem, 2vw, 1.6rem)` within 28ch. Exit links are white Rubik 700. The action stays route orange. This page does not use the station frame.

### Named Rules

**The Enamel and Paper Rule.** Surfaces are enamel or paper. Route orange is the chip on the join stop and the fill of the join sheet.

**The Only Mark Rule.** The real logo is the only mark. Do not add a glyph icon or a second lockup.

## Do's and Don'ts

### Do:

- **Do** paint the ground daylight glass and lift the header, logo card, rail, and sheets with the one shadow.
- **Do** keep route orange for the join sheet, the join stop, and the action.
- **Do** set display in Secular One 400 and set body and UI in Rubik.
- **Do** use the real logo as the only mark.
- **Do** round the header, the rail, and sheets to 22px.

### Don't:

- **Don't** center a splash.
- **Don't** lay sheets out as an equal-card grid.
- **Don't** add a second shadow or a hard offset shadow.
- **Don't** add glyph icons or a second mark.
- **Don't** bring the map’s genealogy colors onto the station pages. Those colors stay on the map.
- **Don't** paste a screenshot into a home sheet, and don’t nest another page’s chrome inside one. Home sheets are live HTML in the station type.
