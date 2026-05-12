# CHANGELOG — GridMaster Edu

All notable changes are documented here.
Format: v[Sprint].[Revisjon].[Hotfix]

---

## v4.0.0 — 2026-05-12 — Sprint 4: Spenningsfallsberegninger

### Lagt til
- **S4-00** Git branch `sprint4` opprettet
- **S4-01** `src/core/voltage-drop.ts` — enkel modell:
  - `calcVoltageDrop(I, R, X, cosPhi, Un, lineId)` — ΔU = √3·I·(R·cosφ + X·sinφ)
- **S4-02** `src/core/voltage-drop.ts` — pi-modell:
  - `calcVoltageDropPi(P, Q, Vs, R, X, B, Un, lineId)` — kompleks beregning med shunt-kapasitans
  - Fasit 100 km FeAl 95mm²: ΔU% ≈ 18.75% ved 20MW/8MVAr, 66kV (se DEVLOG beslutning 19)
- **S4-03** `src/core/voltage-drop.test.ts` — 12 Vitest-tester:
  - Enkel modell: ΔU% ≈ 4.76% (±0.1%) for I=148A, R=3Ω, X=3.5Ω, cosφ=0.928, Un=22kV
  - ΔU ≈ 1048 V · withinLimits · REN-advarsel · grensetilfeller
  - Pi-modell: ΔU% ≈ 18.75% for 100km FeAl95 · Ferranti-effekt ved nullast
  - Pi < Enkel (kapasitanseffekt) bekreftet
- **S4-04** `src/components/voltagedrop/VoltageDropPanel.tsx` — flytende panel:
  - Modellvalg: Auto / Enkel / Pi med beskrivelse
  - REN 4100-fargeforklaring
  - "Beregn spenningsfall"-knapp (deaktivert uten konvergens)
  - Sammendrag: høyeste ΔU%, linjenavn, modell, ΔU [V], U_mot [kV]
- **S4-05** `src/components/voltagedrop/VoltageDropResultPanel.tsx` — bunntabell:
  - Sortert etter ΔU% (høyest øverst)
  - Kolonner: Linje, Fra, Til, Lengde, Modell, ΔU [V], ΔU [%], U_mot [kV], Status
  - REN 4100-bruddsbanner ved overskriding
  - Fargekodede status-badges (grønn/gul/rød)
- **S4-06** Canvas-fargekoding på linjer:
  - Grønn (#4CAF50): ΔU < 5% · Gul (#FFB74D): 5–10% · Rød (#EF5350): ≥ 10%
  - Standardfarge (cyan/blå) gjenopprettes når ingen beregning foreligger
- **S4-07** REN 4100-varsler med referanse i alle resultathaner
- **S4-08** `src/components/voltagedrop/LineComparisonPanel.tsx` — trasesammenligning:
  - Luftlinje FeAl 95mm² vs jordkabel TSLF 150mm² for valgt linje
  - Side-ved-side: ΔU%, ΔU [V], U_mot [kV], kabelparametere
  - Pedagogisk kommentar om X vs B
  - Vises i LineEditor for valgt linje
- **S4-09** Automatisk spenningsfallsberegning etter konvergens i `runPowerFlow()`
  - Modell-auto: enkel for < 50 km, pi for ≥ 50 km
  - Spenningsfall-knapp i Toolbar (ΔU Spenningsfall)
- **S4-10** Vitest: 99/99 grønne (13 nye tester lagt til)
- **S4-11** CHANGELOG + DEVLOG oppdatert
- **S4-12** `npx tsc -b` ren — ingen feil

### Akseptanskriterier oppfylt
- ΔU% = 4.76% for scenario 1 (±0.1%) ✓
- Linje-fargekoding på canvas ✓
- REN 4100-advarsel ved ΔU ≥ 10% ✓
- Sammenligning luft vs kabel ✓
- `npx tsc -b` ren ✓

---

## v3.7.0 — 2026-05-12 — Sprint 3.7: Kraftproduksjon Nivå 1

### Lagt til
- **S3.7-00** Git branch `sprint3.7` opprettet
- **S3.7-01** Versjonsnummer `v3.7.0` i UI (allerede innført i Sprint 3.6, bumped til 3.7.0)
- **S3.7-02** `GeneratorType` komplett i `src/types/index.ts` — bekreftet: hydro_francis, hydro_pelton, hydro_kaplan, wind, nuclear, thermal, solar
- **S3.7-03** `src/core/production.ts` — fire beregningsfunksjoner:
  - `calcHydro(H, Q, eta)` — P = η·ρ·g·H·Q / 10⁶ [MW]
  - `calcWind(v, vci, vr, vco, Pn, n)` — kubisk P(v)-kurve for n turbiner
  - `calcSolar(Ppeak, t, trise, tset)` — sinusdagsprofil
  - `calcNuclear(Pn)` — konstant baselast
- **S3.7-04** `src/core/production.test.ts` — 12 Vitest-tester med fasitsvar:
  - Francis H=200, Q=50, η=0.92 → 90.252 MW (±0.01)
  - Pelton H=600, Q=10, η=0.90 → 52.974 MW (±0.01)
  - Vind v=10, vci=3, vr=13, Pn=3.0, n=1 → 1.029 MW (±0.001)
  - Grensebetingelser: v<vci=0, v>vco=0, v=vr=Pn, n-skalering
  - Sol: t<soloppgang=0, t>solnedgang=0, t=middag≈Ppeak
  - Atom: P=Pn alltid
- **S3.7-05** `src/components/production/HydroEditor.tsx` — H, Q, η-felt med standardverdier per turbintype (Francis/Pelton/Kaplan), beregnet P vist med formel
- **S3.7-06** `src/components/production/WindEditor.tsx` — v_ci, v_r, v_co, Pn per turbin, antall turbiner, P ved merkevindhastighet vist
- **S3.7-07** `src/components/production/SolarEditor.tsx` — P_peak, simuleringstidspunkt (0–24 t), trise/tset, P(t) live
- **S3.7-08** `src/components/production/NuclearEditor.tsx` — P_n, utnyttelsesgrad (0–100%), driftseffekt vist
- **S3.7-09** `src/components/production/ProductionPanel.tsx` — wrapper i høyre sidebar: viser riktig editor basert på `generatorType`, "Beregn produksjon + kjør lastflyt"-knapp
- **S3.7-10** Fargekodede kildetype-badges på canvas (BusNode.tsx): 💧blå (#1565C0) / 💨grønn (#2E7D32) / ☀gul (#F57F17) / ⚛rød (#B71C1C) / 🔥oransje (#E65100) — nå med PNG-ikoner
- **S3.7-11** NR-integrasjon — `runProduction()` i Zustand: beregner P for alle generatorer, oppdaterer `pSetMW` + tilhørende `bus.genMW`, kaller deretter `runPowerFlow()` automatisk
- **S3.7-12** `src/components/production/ProductionSummaryPanel.tsx` — bunntabell-panel: alle generatorer med kildetype, beregnet P, P satt, diff; "Beregn alle"-knapp
- **S3.7-13** PNG-ikoner fra Gemini prosessert (sharp, 60px vannmerke-crop) og plassert i `public/icons/`: hydro.png, wind.png, solar.png, nuclear.png
- **S3.7-14** CHANGELOG v3.7.0 + DEVLOG beslutninger 16–18
- **S3.7-15** Toolbar: "⚡ Produksjon"-knapp, aktiv når generatorer finnes; ny "Produksjon"-fane i bunntabellen

### Endret
- `src/types/index.ts` — Generator: nye valgfrie felt: `numTurbines`, `windRatedMW`, `solarPeakMW`, `solarHour`, `utilizationPct`
- `src/store/useNetworkStore.ts` — ny action `runProduction()` + import av `calcHydro/calcWind/calcSolar/calcNuclear`
- `src/components/canvas/BusNode.tsx` — kildetype-badge bruker nå PNG-ikoner (`/icons/hydro.png` osv.) i stedet for emoji
- `src/App.tsx` — ProductionPanel i høyre sidebar (under GeneratorEditor), ProductionSummaryPanel som bunntabell-fane
- `src/components/toolbar/Toolbar.tsx` — ⚡ Produksjon-knapp lagt til
- `package.json` — versjon bumped til 3.7.0

### Akseptanskriterier
- ✓ `npm test` — alle produksjonstester grønne: Francis 90.252 MW, Pelton 52.974 MW, Vind 1.029 MW
- ✓ Alle 4 kildetyper har dedikert editor i høyre sidebar
- ✓ PNG-ikoner fra Gemini synlig som badges på canvas-noder
- ✓ NR kjøres automatisk etter `runProduction()`
- ✓ ProductionSummaryPanel viser alle kilder med beregnet vs. satt P
- ✓ Versjonsnummer v3.7.0 synlig i UI
- ✓ `npx tsc --noEmit` — ingen TypeScript-feil
- ✓ Vercel deployer etter push til main

---

## v3.6.0 — 2026-05-12 — Sprint 3.6: Nettbygger

### Lagt til
- **S3.6-00** Git branch `sprint3.6` opprettet
- **S3.6-01** `src/components/builder/ComponentPanel.tsx` — collapsible venstre sidebar (200px), 5 seksjoner: BUSSER / LINJER / STASJONER / PRODUKSJON / KOMPENSERING
- **S3.6-02** Drag-and-drop til canvas — HTML5 DnD via React Flow `onDrop`/`onDragOver`, `rfInstance.project()` for koordinattransformasjon
- **S3.6-03** Toolbar-knapper for Slack/PV/PQ-buss, Luftlinje, Jordkabel og Transformator med aktiv-tilstand
- **S3.6-04** Linjetegning Metode A — React Flow native `onConnect` med standard handles på alle 4 sider av BusNode
- **S3.6-05** Linjetegning Metode B — velg type i panel/toolbar → crosshair-cursor → klikk buss 1 → klikk buss 2 → linje opprettes; ESC avbryter
- **S3.6-06** `src/components/editors/BusEditor.tsx` — parameter-editor med navn, type, spenningsnivå, Last P/Q, Gen P, V sett, V-grenser; grønn/rød indikator + 💡 hint
- **S3.6-07** `src/components/editors/LineEditor.tsx` — editor med lengde, R, X, B, termisk grense + linjebibliotek-dropdown
- **S3.6-08** `src/components/editors/TransformerEditor.tsx` — editor med MVA, HV/LV, vektorgruppe, ek%, kobberlosser, trinnkobler
- **S3.6-09** `src/components/editors/GeneratorEditor.tsx` — editor med type, MVA, kV, cos φ, x"d, P/Q-grenser; legg til / fjern generator
- **S3.6-10** `src/components/editors/CompensatorEditor.tsx` — editor med type, totalMVAr, trinn, aktiv kapasitet
- **S3.6-11** Slett med Delete-tast — handler i `useEffect` med bekreftelsesdialog for busser med tilkoblede linjer
- **S3.6-12** Høyreklikk kontekstmeny — "Rediger komponent" / "Slett komponent" på noder og edges
- **S3.6-13** Slett buss → dialog med antall tilknyttede linjer/trafos → bekreft → slett buss + tilhørende kanter
- **S3.6-14** `src/validation/network-validator.ts` — topologi-validering med Union-Find for isolerte noder; 5 feil-koder + 3 advarsel-koder
- **S3.6-15** `src/components/editors/LineLibrary.tsx` — 6 standardkabler (3 luftlinjer + 3 jordkabler 22kV), dropdown fyller R/X/B automatisk
- **S3.6-16** `src/validation/network-validator.test.ts` — 8 nye Vitest-tester for alle valideringsregler
- **S3.6-17** CHANGELOG v3.6.0 + DEVLOG oppdatert
- **S3.6-18** git commit + push origin sprint3.6

### Endret
- `src/store/useNetworkStore.ts` — ny state: `selectedNodeId`, `selectedEdgeId`, `lineDrawingMode`, `lineDrawingFromId`, `placingMode`, `validationResult`; nye actions: `addBusAtPosition`, `addLineFromConnect`, `addTransformerFromConnect`, `addGeneratorToBus`, `deleteNode`, `deleteEdge`, `validateNetwork`, `updateGenerator`; `runPowerFlow` kjører nå validering før beregning
- `src/components/canvas/BusNode.tsx` — fjernet intern BusSidebar; bruker nå `selected`-prop for visuell markering; 4 handles (alle 4 sider)
- `src/components/canvas/NetworkCanvas.tsx` — komplett omskriving med DnD, onConnect, onNodeClick, onEdgeClick, onNodeDragStop (posisjonspersistering), Delete-key, ESC, context menu
- `src/App.tsx` — ny 3-kolonne layout: ComponentPanel | Canvas | EditorPanel; ValidationPanel mellom canvas og resultatpanel
- `src/components/toolbar/Toolbar.tsx` — komponentknapper for Slack/PV/PQ/Luftlinje/Kabel/Trafo; Beregn-knapp viser valideringsfeil
- `src/types/index.ts` — lagt til `ValidationMessage` og `ValidationResult` typer
- `src/components/builder/ComponentPalette.ts` — ny fil med `PALETTE`, `SECTIONS`, `DRAG_TYPE`, `bySection()`

### Akseptanskriterier
- ✓ Kan bygge Scenario 1 fra scratch (2 busser + 1 linje)
- ✓ Kan bygge Scenario 3 (trafo + lavspent)
- ✓ Drag-and-drop fra panel fungerer
- ✓ Toolbar-knapper fungerer
- ✓ Begge linjetegningsmetoder fungerer
- ✓ Parameter-editorer med hints på alle komponenter
- ✓ Linjebibliotek med 6 standardkabler
- ✓ Slett med Delete og høyreklikk
- ✓ Validering blokkerer beregning ved feil (NO_SLACK, MULTIPLE_SLACK, ISOLATED_NODE, ZERO_LENGTH_LINE, VOLTAGE_MISMATCH)
- ✓ 63+ Vitest-tester (kjøres fra terminal: `npm test`)
- ✓ git push origin sprint3.6

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

## v3.5.0 — 2026-05-11 — Sprint 3.5: Infrastruktur og skylagring

> **Arbeidsmappe:** `D:\Claude\GridMaster\gridmaster-edu\`
> **Branch:** `main` (omdøpt fra `master`)

### Lagt til
- **S3.5-00** Git-branch `master` omdøpt til `main`
- **S3.5-01** GitHub-repository publisert: https://github.com/Birdybow/gridmaster-edu
- **S3.5-02** `.env.local` med Supabase-nøkler (aldri committet, dekket av `*.local` i `.gitignore`)
- **S3.5-03** Supabase-prosjekt satt opp manuelt: https://ynujbkdkapxzshbexazg.supabase.co — `projects`-tabell med RLS og `updated_at`-trigger
- **S3.5-04** `src/lib/supabase.ts` — `createClient()` med `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY`
- **S3.5-05** `CloudProjectSummary`-interface i `src/types/index.ts`
- **S3.5-05** `saveToCloud()` — INSERT til Supabase `projects`, returnerer UUID
- **S3.5-05** `loadFromCloud(id)` — SELECT + `validateProject()` på returnert `gmx_data`
- **S3.5-05** `listCloudProjects()` — SELECT med `ORDER BY updated_at DESC`
- **S3.5-06** Toolbar: **☁ Lagre til sky** — modal med studentnavn-input, bekreftelses-ID
- **S3.5-06** Toolbar: **☁ Åpne fra sky** — modal med prosjektliste, klikk laster inn
- **S3.5-07** Vercel Hobby-deploy: https://gridmaster-edu.vercel.app — automatisk deploy ved `git push origin main`
- **S3.5-11** CHANGELOG v3.5.0 + DEVLOG beslutning 14–15
- **S3.5-12** Git tag `v3.5.0`

### Akseptanskriterier
- ✓ `npm test` — 63/63 tester grønne
- ✓ `npx tsc -b` — ingen TypeScript-feil
- ✓ Kode synlig på GitHub `main`-branch
- ✓ App live på Vercel
- ✓ `saveToCloud()` lagrer prosjekt i Supabase og returnerer UUID
- ✓ `listCloudProjects()` henter prosjektliste sortert på dato
- ✓ `loadFromCloud(id)` laster og validerer prosjekt fra sky
- ✓ Lokal `.gmx`-lagring uendret og fungerende
- ✓ `.env.local` ikke committet til git
