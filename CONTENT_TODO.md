# Content TODO

The portfolio shell is frozen and stable. Everything below is **placeholder**
and needs real content/assets in the final content + storytelling pass. This
file tracks what's outstanding — do not fill it with fake content.

## Copy
- [ ] Final bio / hero tagline and storytelling copy
- [ ] Final project descriptions (`src/data/projects.js` — title, kind, spec, blurb, tags)
- [ ] Final "Notes from the bench" entries (`src/data/notes.js`)
- [ ] Final experience entries — real employer/role/dates (`src/data/experience.js`)
- [ ] Skills review for accuracy (`src/data/skills.js`)
- [ ] About-section narrative (`src/components/About.jsx`)

## Links
- [ ] Real GitHub / LinkedIn / résumé URLs and real email (`src/data/socials.js` — currently `#` and placeholder email)
- [ ] Per-project destination links (repo / live / case study) — none wired yet

## Images / media
- [ ] Real project imagery to replace the technical-plate placeholders (`src/components/Projects.jsx`, `p.img`)
- [ ] Any diagrams / schematics / scope captures for credibility
- [ ] Social share image: 1200×630 `og:image` + set `og:url` once the final hosting URL is known (`index.html`)

## Notes
- Content lives in `src/data/*.js`; the components render whatever is there, so updating data is enough for most copy.
- The ink background, layout, motion, and accessibility are frozen for this pass — content only.
