# CHANGELOG — GridMaster Edu

All notable changes are documented here.
Format: v[Sprint].[Revisjon].[Hotfix]

---

## v1.0.0 — 2026-05-11 — Sprint 1: Prosjektinfrastruktur & Canvas

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

## Kommende

### v2.0.0 — Sprint 2
- Newton-Raphson lastflytløser
- Y-bussmatrise bygging
- Per-unit konvertering
- Iterasjonsvisning
