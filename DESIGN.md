---
name: pixijs-3d-labs
description: Hands-on labs for the PixiJS 3D closed beta — a typographic billboard in red phosphor.
colors:
  ink: "#0b0908"
  signal-red: "#e5483c"
  signal-red-bright: "#ff5f4d"
  cream: "#d8cfc7"
  warm-gray: "#8a7e76"
  hairline: "#2a1f1a"
typography:
  display:
    fontFamily: "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
    fontSize: "clamp(44px, 7.5vw, 92px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  ghost:
    fontFamily: "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
    fontSize: "clamp(180px, 30vw, 400px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.05em"
  numeral:
    fontFamily: "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
    fontSize: "clamp(22px, 2.4vw, 32px)"
    fontWeight: 700
  body:
    fontFamily: "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  intro:
    fontFamily: "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', 'Liberation Mono', monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  none: "0"
spacing:
  xs: "14px"
  sm: "22px"
  md: "26px"
  lg: "44px"
  gutter: "48px"
components:
  index-row:
    backgroundColor: "transparent"
    textColor: "{colors.cream}"
    rounded: "{rounded.none}"
    padding: "26px 48px"
  numeral-chip:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "84px"
  status-line:
    backgroundColor: "transparent"
    textColor: "{colors.warm-gray}"
    rounded: "{rounded.none}"
    padding: "14px 48px 18px"
---

# Design System: pixijs-3d-labs

## Overview

**Creative North Star: "The Typographic Billboard"**

The interface is the poster: two lines of poster-scale monospace type carry the whole page, and everything else — a wordmark, one intro line, a pinned status line, a ghost outline numeral — exists to frame them. The mood is warm machine nostalgia: a near-black warm ground (an idle terminal at night, not a void) with Signal Red doing the talking. Nothing here is skeuomorphic chrome; the TUI world arrives as material (mono at scale, phosphor red, blinking block cursors, hairline rules), never as a replica of a terminal window.

Depth does not exist in this system and that is a choice: surfaces answer through full-bleed color inversion, not elevation.

**Key Characteristics:**
- Poster-scale mono type as the only layout device — no cards, no panels, no boxes
- Full-bleed inverse-video bands as the interaction grammar
- One face, one red, one ground; hairlines are the only structure
- Warm nostalgia expressed through color, the blinking cursor, and one orchestrated entrance — not through fake textures

## Colors

A three-voice palette: a warm near-black ground, one red with a bright end, and cream/warm-gray text. Grouped by role; the ground is warm on purpose — never pure black.

### Primary
- **Signal Red** (#e5483c): The state color. Fills numeral chips and entire inverse-video bands when the interface answers (hover, focus, standing demo state); colors links at rest. At rest the page is mostly ground; red speaks on contact.

### Neutral
- **Ink** (#0b0908): The page ground and the text-on-red. Warm, never #000.
- **Cream** (#d8cfc7): Display type and body lit text — the "on" phosphor.
- **Warm Gray** (#8a7e76): Secondary text: intro, suffixes, status line. Never darker than 4.5:1 against Ink.
- **Signal Red Bright** (#ff5f4d): Red's hover end — link hovers, numeral on an inverted band.
- **Hairline** (#2a1f1a): 1px rules: the status line's top border is the only structural line on the page.

### Named Rules
**The Signal Rule.** Red is the voice of state: it fills a whole band when the interface answers you and stays out of the content's way at rest. Cream and Warm Gray carry reading; red carries action.
**The Warm Black Rule.** The ground is #0b0908 — warm and never pure #000; text on it is never pure #fff.

## Typography

**Display Font:** JetBrains Mono (variable, self-hosted woff2; fallback ui-monospace, DejaVu Sans Mono, Liberation Mono)
**Body Font:** JetBrains Mono (same face — one voice at every size)

**Character:** A single monospace voice at extreme scale contrast: the same face at 92px reads as a billboard, at 15px as a terminal line. Warm nostalgia comes from the face's soft terminal forms in red-on-ink, not from any display-serif costume.

### Hierarchy
- **Display** (700, clamp(44px, 7.5vw, 92px), line-height 1, tracking −0.035em): index row names — the page's whole message.
- **Ghost** (800, clamp(180px, 30vw, 400px), 1px red stroke at 14% alpha, fill transparent): the outline "3D" watermark; ornament that must never carry information.
- **Numeral** (700, clamp(22px, 2.4vw, 32px)): lab numbers inside the red squares.
- **Body** (400, 16px, 1.6): base size — suffix metadata on rows (16px) lives here.
- **Intro** (400, 15px, 1.75, ≤62ch; 14px under 720px): the intro paragraph.
- **Label** (400, 13px, 1.6; mobile suffix 12px): status line, github links.

### Named Rules
**The One Voice Rule.** JetBrains Mono is the only face, self-hosted; no second typeface enters the system.

## Layout

Full-bleed vertical stack: bar → intro → index (the poster moment, vertically centered by auto margins) → status line pinned at the bottom edge. No container: rows run edge-to-edge so inverse bands touch the viewport edges. Side gutters are 48px (22px under 720px). Row height is driven by the 84px numeral square plus 26px row padding; the type scale is fluid via clamp() with the caps hit at 1440px. Single breakpoint: 720px, where gutters shrink, the "↵ open" hint hides, and suffixes wrap under bound middots (never opening a line with a separator).

## Elevation & Depth

Flat by conviction. The system carries no shadows at all; depth is expressed as full-bleed color inversion (a row becomes the red band), 1px outline strokes (the ghost watermark), and the blinking cursor's presence/absence. The only "glow" allowed is a ≤12px rgba-red text-shadow on phosphor-lit type, at whisper opacity — and it is optional flavor, never structure.

### Named Rules
**The Flat Phosphor Rule.** No box-shadows, no gradients-as-depth. An element is either on the ground, in a red band, or outlined.
**The One Moment Rule.** Load gets one orchestrated entrance (fade + 8px rise, 60ms stagger, ease-out); every state change after it answers instantly. Motion on hover is gated to fine pointers; the cursor blink is the only loop.

## Shapes

Square corners everywhere (radius 0) — the billboard is a rectangle of type. The only graphic devices are: solid red squares (numeral chips), full-bleed bands, 1px hairlines, 1px dashed focus outlines, and the block cursor (0.55em × 1em rectangle). No strokes, no clip-paths, no iconography.

## Components

### Index Row (signature)
The page's one component: a full-bleed flex row — numeral chip, poster name, suffix metadata.
- **Shape:** no radius, full-bleed; padding 26px 48px; gap 36px
- **Rest:** transparent ground; cream name (clamp 44–92px, 700, −0.035em); red chip with ink numeral (84px square); warm-gray suffix (16px, middots bound with NBSP to their left token)
- **Hover / Focus:** full-bleed Signal Red band; name and suffix flip to ink (suffix at 0.92 alpha over red — ≥4.5:1); chip inverts to ink with bright-red numeral; the inversion alone is the focus indicator — no extra outline on rows (the band is the signal); the footer link keeps the 1px dashed focus outline because color is its only indicator; `:hover` is gated behind `(hover: hover) and (pointer: fine)` — focus and the standing demo state are not
- **Press:** `:active` answers without moving the band — chip `scale(0.94)`, name `opacity: 0.85`, `140ms var(--ease-out)` (press-feedback tier: 100–160ms)
- **Entrance:** on load the page reads top to bottom — intro, then rows (60ms stagger), then the status line; each fades in with an 8px rise, `360ms var(--ease-out)`; the ghost watermark fades only (500ms). Reduced motion: opacity-only, 200ms, no stagger
- **Keyboard:** `↑/↓` moves the standing inversion — and real browser focus — across the rows, cycling infinitely (wraps both ends); the block cursor travels with the active row; Enter opens it through the link's native activation (this is what the status line's `↵ open` promises). The `:focus-visible` dashed rules frame the active band.
- **Standing state:** the last row may rest in its inverted state ("demo"), with a blinking block cursor after its suffix

### Numeral Chip
- **Shape:** square, radius 0; 84px (clamps to 56px on small screens)
- **Color:** Signal Red ground, ink numeral (700, ~32px); inverts on row hover

### Status Line
- **Shape:** full-width flex, 1px Hairline top border, padding 14px 48px 18px
- **Type:** Label 13px in Warm Gray; content: `labs: n · status: beta`, `↵ open` (desktop only), github link — the page's ONLY github link (header carries the wordmark alone) and the page's ONLY cursor lives in the index, not here

### Wordmark
- **Type:** 15–17px, 700, tracking −0.02em; the "3d" in Signal Red
- **Behavior:** links home

### Block Cursor
- **Shape:** 0.55em × 1em rectangle, steps(1) blink at 1.1s
- **Color:** red on ground, ink on red bands; disabled under prefers-reduced-motion

### Ghost Watermark
- **Type:** Ghost role; solid Signal Red 1px stroke (fill transparent), `mix-blend-mode: difference`, fixed upper-right bleeding the edge, above the bands (z-index 2); aria-hidden, pointer-events none
- **The Negative:** over the ink ground the stroke reads Signal Red; where an inverse band crosses it, difference turns the stroke to ink on red — a print-style knockout that follows the band. Re-rooted below the index on mobile
- **Never** carries information; repositioned below the index on mobile

## Do's and Don'ts

### Do:
- **Do** set index content as poster-scale rows (clamp(44px, 7.5vw, 92px), 700, −0.035em) with red numeral chips.
- **Do** express every interactive answer as the full-bleed inverse band, hover and focus included.
- **Do** bind middots in narrow suffix metadata (`token\u00A0·`) so lines never open with a separator.
- **Do** keep the ground #0b0908 and text ≥4.5:1 against it (suffix ink over red at 0.92 alpha minimum).
- **Do** self-host the JetBrains Mono variable woff2 (`/fonts/jetbrains-mono-var.woff2`).
- **Do** gate `:hover` motion behind `(hover: hover) and (pointer: fine)`; `:active` press feedback is ungated (a press is real on touch).

### Don't:
- **Don't** use ASCII/box-drawing art where it carries meaning — it rendered broken in real browsers; graphics are CSS solids or nothing.
- **Don't** add shadows, gradients-as-depth, or border-radius; the system is flat and square.
- **Don't** introduce a second typeface or an icon set; type and red squares are the vocabulary.
- **Don't** soften or remove the standing inversion of the last index row — it is the page's memorable moment.
- **Don't** let red drift to another hue: Signal Red (#e5483c) and its bright end (#ff5f4d) are the only reds.
