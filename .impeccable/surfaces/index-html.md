---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/App.tsx"]
---

# Surface brief: the portfolio page (index.html)

Scope: the single-page portfolio, visitor mode Experience (the work leads; the interface recedes), with a hard Persuade duty in the first viewport (a recruiter must know who / what / where / how deep / how to contact within seconds).

Audience and job: recruiters and hiring engineers at ASIC / FPGA / verification / semiconductor / HPC / trading-infrastructure companies deciding in ~30 seconds whether to read on and click through to the résumé, GitHub, or email.

Proof and content: verbatim facts from the current site and the focus-or-fry README (PRODUCT.md, Evidence on Hand). Constraints: no fabricated claims; experience as one line per entry; Overleaf résumé link kept; only the footer signature 以狐为引 in Chinese; content readable with JS and WebGL off; no gate; no scroll hijack; WCAG AA; pause control for the field.

## Direction contract

THESIS: The fox is Ethan's own drawing rebuilt as a field of cold-light points through which light travels like a signal through a net; everything around it is a calmly set document in the grammar a hardware hiring manager reads daily (title block, hairline rows, one plate). It refuses the category default: centred giant wordmark, gradient word, glass cards, particle wallpaper, purple glow, eyebrow labels, section numbers, chapter names.

OWN-WORLD: Ground #070B14, midnight navy plate #0B1220, soft white #E8EEF7 text, blue-grey #A9B6CC secondary, ice #9FD8FF used once as text (the role line) and as the field's halo, violet #B9A7F0 only in tail-tip points and ::selection, ice-tinted 1px hairlines at 14%/28%. Newsreader (opsz) display, Schibsted Grotesk body/UI, Azeret Mono for data only. No cards, no radius above 2px, no gradient text, no blur, one moon wash that moves with scroll, 1.5% grain only where the wash is. With the copy removed the page is still recognisable: a navy sheet, one hairline the fox stands on, a stipple fox of points with faint traces beside a ledger, a moon that has crossed the sky by the bottom.

STORY: A recruiter reads the name and "RTL for ASIC & FPGA" first, the standfirst second, sees the fox looking at the name, finds résumé / GitHub / LinkedIn / email without scrolling, then scrolls into About, Experience, Projects (a real UART figure proves the protocol), Skills, a compact Off the clock, and Contact where the fox gathers again to see them off. They believe: this person is precise, builds real things, and cares about craft.

FIRST VIEWPORT: 1440×900. Nav 64px transparent (wordmark left; About · Experience · Projects · Skills · Contact, Résumé, Pause motion right). Left cols 1–5: h1 "Ethan Tiong" (Newsreader opsz 72, ~80px), role line in ice (22px), standfirst 17px/44ch, run-in dl (Program · Based · Status) with one hairline, actions: outlined "View résumé" (single icon), GitHub · LinkedIn · email as underlined links, navy scrim beneath. Right cols 6–12: the sitting fox point field ~46vw wide, nose toward the name, tails exiting right, standing on a 1px hairline ground rule; poster <img> beneath until WebGL is ready; quiet upper-right; mist band lower quarter; moon wash upper-left. Primary action: "View résumé". Signature interaction: pointer/touch injects a luminance pulse that runs along the strokes; idle pulse every ~6s. Motion grammar: ease-move cubic-bezier(.16,1,.3,1), ease-fade cubic-bezier(.25,1,.5,1), 140/280/720ms; three scrubbed WebGL moments (Resolve, Release, Gather), DOM never animates in.

FORM: The datasheet-in-moonlight direction (my grounded candidate 1, synthesised with the cinematic candidate's fox choreography and the monograph candidate's engineering discipline), chosen by the user after adversarial judging (plan approved 2026-09-11). Seed key afa37613, assigned index 6 (brief-pinned decision beats the roll). Challenger verdicts, all declined on both axes, each with the discipline borrowed as a raise:
- menhera pastel character sheet — declined; raise: one stroke weight for every drawn icon.
- seed packet rack — declined; raise: promise and instructions on one face: the hero shows the role line and the spec dl together.
- vu-meter bridge — declined; raise: needle ballistics: every scrubbed value is integrated with mass and damping (k = 1 − 0.001^dt), never snapped.
- ASCII live scene render — declined; raise: one luminance ramp: tone is point density, the densest overlap is the highlight; no separate glow pass.
- coiled earth tower — declined; raise: each line's measure matches its course: fixed measures per role (44ch hero, 62ch bio, 60ch project).
- pickling brine calendar — declined; raise: thresholds stated in text: the pause control and reduced-motion state are labelled in words, never only styling.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
