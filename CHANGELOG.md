# CHANGELOG — GridMaster Edu

All notable changes are documented here.
Format: v[Sprint].[Revisjon].[Hotfix]

---

## v1.0.0 — 2026-05-11 — Sprint 1: Prosjektinfrastruktur & Canvas

> **Arbeidsmappe:** `D:\Claude\GridMaster\gridmaster-edu\`
> **Start:** `cd D:\Claude\GridMaster\gridmaster-edu` → `npm run dev`

### Lagt til
- **S1-00** Git-repository initialisert med `.gitignore`
- **S1-01** Vite + React 18 + TypeScript (strict mode) prosjektoppsett
- **S1-02** Pakkeinstallasjon: reactflow, zustand, mathjs, jspdf, html2canvas, tailwindcss, vitest, sharp m.fl.
- **S1-03** Komplett mappestruktur iht. spesifikasjon (src/types, src/core, src/store, src/components, src/io, src/scenarios)
- **S1-04** `src/types/index.ts` — alle TypeScript-typer fra datamodell v1.0 (Bus, Line, Transformer, Generator, Compensator, Protection, GmxProject, resultater)
- **S1-05** `src/core/math.ts` — komplekse talloperasjoner: cadd, csub, cmul, cdiv, cabs, carg, cconj, cpolar (med JSDoc)
- **S1-06** `src/core/math.test.ts` — 17 Vitest-tester, alle grønne
- **S1-07** `src/store/useNetworkStore.ts` — Zustand store med actions for bus, linje, transformator, generator, kompensator, vern, loadProject, clearProject
- **S1-08** React Flow canvas: `NetworkCanvas.tsx`, `BusNode.tsx` (med ikon, type-badge, sidebar-panel ved klikk), `LineEdge.tsx`
- **S1-09** `src/io/gmx.ts` — saveProject (download), loadProject (File API), validateProject
- **S1-10** `src/components/toolbar/Toolbar.tsx` — Lagre .gmx, Åpne .gmx, Importer scenario (Gemini JSON), Nytt prosjekt
- **S1-11** `importLegacyGmx()` i `src/io/gmx.ts` — konverterer Gemini-feltformat til GmxProject (feltmapping iht. Sprint1 §4)
- **S1-12** CHANGELOG.md og DEVLOG.md
- **S1-G1–G10** Grafiske assets fra Gemini (logo, ikoner, splash, scenario-JSON) — vannmerke fjernet med sharp

### Akseptanskriterier
- ✓ `npm run dev` — ingen feil
- ✓ `npm test` — 17/17 tester grønne
- ✓ `npm run build` — ingen TypeScript-feil
- ✓ Canvas viser busser og linjer med ikoner
- ✓ Sidebar-panel åpner ved klikk på node
- ✓ Lagre/laste .gmx fungerer
- ✓ `importLegacyGmx()` konverterer alle 3 scenario-filer
- ✓ Alle eksporterte funksjoner har JSDoc

---

---

## v2.0.0 — 2026-05-11 — Sprint 2: Newton-Raphson Lastflytanalyse

> **Arbeidsmappe:** `D:\Claude\GridMaster\gridmaster-edu\`
> **Branch:** `sprint2`

### Lagt til
- **S2-00** Git-branch `sprint2` opprettet
- **S2-01** `src/core/ybus.ts` — Y-bussmatrise (pi-modell, transformer-støtte, JSDoc)
- **S2-02** `src/core/ybus.test.ts` — 11 Vitest-tester for Y-buss (diagonal, off-diagonal, KCL, shunt, trafo)
- **S2-03** `src/core/newton-raphson.ts` — Full Newton-Raphson løser med Gauss-eliminasjon, linjeresultater
- **S2-04** `src/core/newton-raphson.test.ts` — 13 Vitest-tester, alle 3 scenarier (konvergens verifisert)
- **S2-05** `src/store/useNetworkStore.ts` — `powerFlowStatus`, `runPowerFlow()` action
- **S2-06** `src/components/results/ResultPanel.tsx` — Tabell med spenning/strøm/tap per buss og linje
- **S2-07** `src/components/results/IterationPanel.tsx` — Pedagogisk iterasjonslogg (mismatch per steg)
- **S2-08** `BusNode.tsx` oppdatert — fargekoding av buss-ikon etter spenningsnivå (grønn/gul/rød/oransje)
- **S2-09** `Toolbar.tsx` — Knapp «Beregn lastflyt» kjører `runPowerFlow()`
- **S2-10** Resultater lagres i `GmxProject.results.powerFlow` og serialiseres i `.gmx`
- **S2-11** Integrasjonstester: alle 3 scenarier verifisert i `newton-raphson.test.ts`
- **S2-12** CHANGELOG v2.0.0 + DEVLOG beslutninger 9–12

### Rettet
- **Fixed:** Scenario 1 fasitsvar korrigert til 148 A / 4.8 % etter analytisk verifikasjon og PL-godkjenning (opprinnelig oppgitt 133 A / 2.1 % var feilaktig håndberegnet)

### Akseptanskriterier
- ✓ `npm test` — 43/43 tester grønne
- ✓ Scenario 1 konvergerer, V₂ ≈ 0.952 p.u., I ≈ 148 A (analytisk bekreftet)
- ✓ Scenario 2 og 3 konvergerer
- ✓ IterationPanel viser konvergensforløp steg-for-steg
- ✓ Canvas fargekoder busser etter spenningsnivå (REN 4100-baserte terskler)
- ✓ Resultater lagres i .gmx og gjenopprettes
- ✓ `npx tsc -b` — ingen TypeScript-feil
- ⚠ Fasit-avvik dokumentert i DEVLOG (se beslutning 9)

---

## v3.0.0 — 2026-05-11 — Sprint 3: Fasekompensering

> **Arbeidsmappe:** `D:\Claude\GridMaster\gridmaster-edu\`
> **Branch:** `sprint3`

### Lagt til
- **S3-00** Git-branch `sprint3` opprettet
- **S3-01** `src/core/compensation.ts` — `calcCompensation()`: Q_komp = P·(tanφ₁−tanφ₂), strøm/tap før-etter, trinnvis cosφ (JSDoc)
- **S3-02** `src/core/compensation.test.ts` — 20 tester: unit (fasit scenario 1), grensetilfeller, integrasjon NR
- **S3-03** `CompensatorNode.tsx` — kondensatorbank på React Flow-canvas med sidebar og Q_komp-display
- **S3-04** `CompensationPanel.tsx` — panel med bussvelger, cosφ₂-slider (0.80–1.00), trinnvelger, Q_komp-beregning live
- **S3-05** `PowerTriangle.tsx` — animert SVG-effekttrekant med P (grønn), Q₁ (grå stiplet), Q₂ (oransje), Q_komp-pil (lilla), S₁ (grå), S₂ (cyan), φ₁/φ₂-buer og alle labels; raf-animasjon 300 ms
- **S3-06** `CompensationResultPanel.tsx` — før/etter sammenlignstabell: Q, S, cosφ, φ, I, tap + reduksjons-bokser
- **S3-07** Trinnvis kompensering — `steppedCosPhi[]` i `calcCompensation`, cosφ per trinn vist i panel
- **S3-08** NR-integrasjon — `runCompensation()` i Zustand: oppdaterer loadMVAr, legger til Compensator-node, kjører NR automatisk, lagrer CompensationResult
- **S3-09** `CompensationResult[]` serialisert i `GmxProject.results.compensation` og lagret i .gmx
- **S3-10** Vitest integrasjonstester for Q_komp fasit og NR-forbedring etter kompensering
- **S3-11** CHANGELOG v3.0.0 + DEVLOG beslutning 13 (SVG-animasjonsmetode)
- **S3-12** Git commit `feat(sprint3): compensation v3.0.0`

### Akseptanskriterier
- ✓ `npm test` — 63/63 tester grønne
- ✓ Q_komp ≈ 0.992 MVAr (±0.01) for cosφ₁=0.928, cosφ₂=0.98, P=5 MW
- ✓ PowerTriangle animerer smooth (300 ms raf) ved cosφ₂-endring
- ✓ Både φ₁ (grå) og φ₂ (cyan) vises simultant i trekanten
- ✓ Q_komp-pil (lilla) synlig i trekanten
- ✓ Kondensatornode på canvas (lilla ramme, capacitor.png-ikon)
- ✓ NR kjøres automatisk på nytt etter kompensering
- ✓ Trinnvis kompensering: cosφ per trinn beregnet og vist
- ✓ Før/etter sammenligning viser strøm- og tapreduksjon [%]
- ✓ Resultater lagres i .gmx og gjenopprettes
- ✓ `npx tsc -b` — ingen TypeScript-feil

---

## Kommende

### v3.5.0 — Sprint 3.5
- GitHub + Vercel + Supabase (deploy)
