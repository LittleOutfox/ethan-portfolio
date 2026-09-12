# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite + React 19 + TypeScript with Three.js and @react-three/fiber for the WebGL layer, chosen because the brief asked for the modern React 3D ecosystem and the site's only dynamic surface is one WebGL scene. Static output, deployed on Vercel at https://www.etiong.com/.

## Users

Primary: recruiters and hiring engineers at companies working in ASIC, FPGA, RTL design, verification, semiconductor hardware, accelerators, high-performance computing, and networking or trading infrastructure. They arrive from a résumé, a LinkedIn profile, or a job application, usually on a laptop, sometimes on a phone, and decide within about thirty seconds whether to read further or move on.

Secondary: peers and engineers who follow a link from GitHub and want to see the work.

## Product Purpose

A personal engineering portfolio for Ethan Tiong, an Electrical Engineering student at the University of Waterloo who designs RTL for ASIC and FPGA. It exists to earn a Winter 2027 co-op interview by showing, quickly and credibly, who he is, what kind of engineer he is, what he has built, where he has worked, how deep the work goes, and how to reach him. Success is a recruiter who understands all six of those within seconds and clicks through to the résumé, GitHub, or email.

## Positioning

Two things a neighbouring portfolio cannot copy: the identity is built from Ethan's own hand-drawn nine-tailed fox line drawings (seven original SVG drawings, no stock or generated art), and the technical content is specific and verifiable (a real UART core with stated parameters, an AXI4-Lite quadrature encoder block, self-checking SystemVerilog testbenches). The site is designed and built by hand, and says so.

## Operating Context

- Content is scanned, not read: the first viewport must answer name, discipline, school, availability, and contact.
- Outbound destinations: GitHub (https://github.com/LittleOutfox), the focus-or-fry repository, LinkedIn (https://www.linkedin.com/in/ethan-tiong/), the résumé as an Overleaf read-only link (kept as is, by decision), a Google Doc for the 2021 teddy-bear project, and email (ethan.tiong@uwaterloo.ca).
- Hosted on Vercel; Web Analytics and Speed Insights beacons are present.
- Viewed on ordinary laptops (often integrated GPUs, 1366×768 to 1440×900) and phones.

## Capabilities and Constraints

- Static single page; no backend, no forms.
- No fabricated metrics, accomplishments, or claims. Facts are taken verbatim from the current site and the focus-or-fry README; descriptions may be re-presented but not changed in meaning.
- Experience is presented as given (year, organization, role) with no invented bullets (confirmed 2026-09-11).
- Content must be reachable immediately: no loading gate, no intro sequence, no scroll hijacking, readable without JavaScript and without WebGL.
- Must perform well on normal hardware; WebGL degrades gracefully and can be paused.
- The "up to 52%" figure in the teddy-bear project is Ethan's own existing claim; keep verbatim unless he changes it.
- Undecided: whether Ethan will later add one factual line per experience entry.

## Brand Commitments

- Name and voice: "Ethan Tiong"; plain, first-person, technically precise; "Designed & built by hand".
- The kitsune / nine-tailed fox is the identity motif, loosely and maturely interpreted; the seven original drawings in `art/kitsune/` are the only fox artwork.
- Visual constraint pinned by the brief (recorded, not expanded here): a moonlit-winter mood of midnight navy and blue-black grounds, icy cyan illumination, soft white highlights, restrained violet or cool-magenta accents, mist and subtle particles, organic flowing forms, and a quiet, mysterious atmosphere. Explicitly not an anime site, game landing page, fantasy splash art, Japanese-theme template, cyberpunk, or neon RGB.
- Chinese characters: only the footer signature 以狐为引 remains, as a quiet aria-hidden mark (confirmed 2026-09-11).

## Evidence on Hand

- Verbatim copy: bio paragraphs, facts (Greater Toronto, open to relocate; RTL for ASIC & FPGA; Open, Winter 2027 co-op), five experience entries, three projects, five skills with one-line descriptions, three hobbies, all in the current `index.html` (preserved in git history on `main`).
- focus-or-fry README facts: end-to-end FPGA telemetry-processing system; UART at 100 MHz system clock, 115200 baud, 8N1, 16× oversampling, 64-entry TX and RX FIFOs, two-flop synchronizer, falling-edge detection, centre-bit sampling, framing-error detection; self-checking SystemVerilog testbenches that terminate with `$fatal`; Xilinx Vivado; Artix-7 on a Digilent Basys 3; STM32F401RE firmware (uart_spammer, uart_echo_led); 11 Verilog modules, 7+ testbenches.
- Artwork: `art/kitsune/{sitting,howling,bowing,walking,standing,descending,diving}.svg` and the baked glow posters.
- Absent, must not be fabricated: experience bullet points, a hosted PDF résumé, photographs, metrics beyond those stated.

## Product Principles

1. Engineer first, fox second: the name and discipline lead every viewport; the fox supports.
2. Prove, don't claim: show real parameters, real interfaces, a real protocol figure; never a vague quantifier.
3. Nothing invented: every fact traceable to Ethan's copy or his repository.
4. Quiet over loud: restraint, composition, and light carry sophistication; not more elements.
5. Works everywhere: readable with JS off, usable by keyboard, respectful of reduced motion, fast on an integrated GPU.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor: semantic landmarks and heading order, a skip link, visible two-tone focus, 44 px targets, body contrast ≥ 4.5:1 measured on rendered pixels, a user-reachable "Pause motion" control for the continuous WebGL field (WCAG 2.2.2), and a `prefers-reduced-motion` path that shows a static formed fox with feedback transitions kept.
