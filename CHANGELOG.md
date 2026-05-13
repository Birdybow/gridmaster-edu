# CHANGELOG — GridMaster Edu

All notable changes are documented here.
Format: v[Sprint].[Revisjon].[Hotfix]

---

## v14.0.0 / v1.1.0 — 2026-05-13 — Sprint 14: Sikkerhets-fiks + toveis lastflyt-flow

### Del A — Fjern skylagring fra UI

- **S14-00** Git branch `sprint14` opprettet
- **S14-01** `package.json` bumped til `14.0.0` (produkt: v1.1.0)
- **S14-02** `Toolbar.tsx` — fjernet "☁ Lagre til sky" og "☁ Åpne fra sky"-knapper, alle cloud-tilstander og dialogen. Importert kun `saveProject`, `loadProject`, `importLegacyGmx`. Sky-funksjonene i `gmx.ts` beholdes urørt for v2.x.
- **S14-03** `OnboardingTour.tsx` — TOUR_KEY bumped til v14, steg-tekst oppdatert: "lokalt (.gmx)" presisert, sky-referanser fjernet
- **S14-04** `HelpPage.tsx` — versjonsfooter v13.0.0 → v14.0.0, hurtigtast-tekst presisert til "Lagre lokalt"
- **S14-05** Verifisert: `saveToCloud`/`loadFromCloud`/`listCloudProjects` kalles ikke fra noe annet sted enn `gmx.ts` (ingen autosave, hints, etc.)

### Del B — Toveis lastflyt-flow med fargekoding

- **S14-08** `src/utils/flow-color.ts` — ny utility: `FlowState` (`normal|opposing|reversed|idle`), `FLOW_COLORS` (grønn/oransje/rød/grå), `getFlowState()`, `getFlowColor()`
- **S14-09** `LineEdge.tsx` — oppgradert med ny farge-logikk: `normal` (grønn #2E7D32), `opposing` (oransje #F57C00, via `isOpposing`-prop), `reversed` (rød stiplet #C62828), `idle` (grå #90A4AE). `isOpposing` lag til `LineEdgeData`.
- **S14-10** `package.json` test:e2e-script fikset: cross-env TEMP-override for Playwright på Windows

### Verifikasjon

- `npx tsc -b` — ingen feil
- Vitest: 260/260 grønne
- Playwright E2E: 11/11 grønne

---

## v13.0.0 / v1.0.0 — 2026-05-12 — Sprint 13: PRODUKSJONSKLAR (siste sprint)

### Lagt til
- **S13-00** Git branch `sprint13` opprettet
- **S13-01** `package.json` bumped til `13.0.0`
- **S13-02** `src/validation/ren-rules.ts` — `RenRule`-grensesnitt med `RenSeverity`, `RenArea`, `RenResult`
- **S13-03** Kabel-regler: `checkCable(ib, in_, iz)` — Ib ≤ In ≤ Iz (REN blad 4004 §3.3)
- **S13-04** Spenningsfall-regler: `checkVoltageDrop(ΔU%)` — <4% OK, 4–10% advarsel, ≥10% feil
- **S13-05** Kortslutning-regler: `checkShortCircuit(ik3pA, iaA)` — Ik3p ≥ 2×Ia (5s-krav)
- **S13-06** Vern-regler: `checkProtectionSelectivity(t_opp, t_ned)` — Δt ≥ 200 ms
- **S13-07** Jordings-regler: `checkEarthing(rOhm, netType)` — IT ≤ 100Ω, TN ≤ 50Ω
- **S13-08** `validateRen(project, vdResults, scResults, selResults)` — prosjektnivå-validering
- **S13-09** `src/components/warnings/WarningBadge.tsx` — badge (rød/gul) for canvas-komponenter
- **S13-10** `src/components/warnings/WarningPanel.tsx` — flytende REN-advarselspanel med område/alvorlighetsgrad
- **S13-11** `runRenValidation()` og `renResults`/`showWarningPanel` lagt til Zustand-store
- **S13-12** `react-joyride` installert (^3.1.0)
- **S13-13** 7 onboarding-steg: velkomst, toolbar-rad1, toolbar-rad2, komponentpanel, canvas, beregninger, eksport
- **S13-14** `src/components/onboarding/OnboardingTour.tsx` — auto-start første besøk (localStorage-flagg)
- **S13-15** Restart-knapp "Vis omvisning" i toolbar-rad1
- **S13-16** `src/components/common/HelpIcon.tsx` — hover-tooltip-komponent
- **S13-17** HelpIcon på 10 paneler: VoltageDropPanel, ShortCircuitPanel, RingNetworkPanel, ProtectionHierarchyPanel, PerUnitPanel, CompensationPanel, EarthFaultPanel, ReportPanel, ExportPanel + mer
- **S13-18** `src/components/help/HelpPage.tsx` — fullskjerms hjelpeside (/help) med formler, REN-regler, fasitsvar
- **S13-19** UI-konsistensgjennomgang: `data-tour`-attributter på toolbar og canvas
- **S13-20** Responsivt testet 1280–2560 px
- **S13-21** Lastetilstand: eksisterende `powerFlowStatus`-indikator
- **S13-22** `vitest.config.ts` ekskluderer `tests/`-katalog (Playwright-separasjon)
- **S13-23** `@playwright/test` installert som devDependency
- **S13-24** `playwright.config.ts` — Chromium, localhost:5173, webServer-integrasjon
- **S13-25** `tests/e2e-build-network.spec.ts` — app laster, toolbar og canvas synlig
- **S13-26** `tests/e2e-migration.spec.ts` — v3.5-fil migreres og viser banner
- **S13-27** `tests/e2e-ren-warnings.spec.ts` — REN-panel åpner, hjelp-knapp fungerer
- **S13-28** `src/docs/intro-video-manus.md` — 30-sceners manus tilpasset XTTS v2, 5–7 min
- **S13-29** `npm test:e2e`-script lagt til package.json
- **S13-30** Vitest: 260 tester (38 nye, alle grønne)

### Fasitsvar (bekreftet i ren-rules.test.ts)
- Kabel: Ib=18, In=20, Iz=22 → advarsel | Ib=21, In=20, Iz=27 → feil
- ΔU: 4.76% → advarsel | 11% → feil
- Kortslutning: 1252A mot 160A → OK | mot 630A → feil
- Selektivitet: Δt=291ms → OK | Δt=91ms → feil
- Jording: R=80Ω IT → OK | R=120Ω IT → feil | R=60Ω TN → feil

---

## v12.0.0 — 2026-05-12 — Sprint 12: Rapport, eksport, per-unit, migrasjon

### Lagt til
- **S12-00** Git branch `sprint12` opprettet
- **S12-01** `package.json` bumped til `12.0.0`
- **S12-02** `jspdf-autotable` installert (jsPDF + html2canvas allerede i avh.)
- **S12-03** `src/report/generateReport.ts` — `generateReport(project, opts, canvasEl)` med A4-portrett, 1 tomme marg
- **S12-04** PDF-forside: tittel, prosjektnavn, dato, studentnavn-felt, grå logo-placeholder (100×100 px)
- **S12-05** Enlinjeskjema-seksjon via html2canvas + `.react-flow__viewport`
- **S12-06** Y-bussmatrise-seksjon (konduktans G, reell del) generert fra prosjekt-topologi
- **S12-07** Lastflyt-seksjon (busser + linjer, konvergensstatus, totale tap)
- **S12-08** Fasekompensering-seksjon (Q_komp ≈ 0.991 MVAr fasit)
- **S12-09** Kortslutning-seksjon (Ik3p=1.252 kA, Ik2p=1.084 kA, ip=2.557 kA)
- **S12-10** Ringnett-seksjon (75 % tap-reduksjon)
- **S12-11** Vernkoordinering-seksjon (SI t=0.429 s, VI t=0.338 s)
- **S12-12** Spenningsfall-seksjon (ΔU=4.76 %, fasit NR)
- **S12-13** Header side 2+: prosjektnavn (venstre), dato (høyre) + footer "Side X av Y"
- **S12-14** `ReportPanel.tsx` — seksjon-toggles, studentnavn-felt, generer-knapp
- **S12-15** `src/export/csv.ts` — `exportYBusCsv(project)` med semikolon + UTF-8 BOM
- **S12-16** `exportLoadFlowCsv`, `exportShortCircuitCsv`, `exportRingNetworkCsv`, `exportVoltageDropCsv`
- **S12-17** `ExportPanel.tsx` — knapper per resultattype, disabled-tilstand hvis ingen data
- **S12-18** `src/core/per-unit.ts` — `zBase`, `zToPU/From`, `vToPU/From`, `pToPU`, `qToPU`, `iToPU`
- **S12-19** `PerUnitPanel.tsx` — flytende panel med justerbar S_base/U_base
- **S12-20** Per-unit buss- og linjeresultater med fargekodet spenningsnivå (rød > 1.05 pu, oransje < 0.95 pu)
- **S12-21** Pedagogisk hint ved første visning: Z_pu-formel, overspennings-definisjon
- **S12-22** `src/io/migration.ts` — kjedet migrasjon v1→v12, ett steg per major-versjon
- **S12-23** `loadProject()` i `gmx.ts` returnerer `LoadResult` med `migrated/fromVersion/toVersion`, migrasjonsbanner vises 8 sek
- **S12-24** `saveProject()` inkluderer `results`-feltet (var allerede i `GmxProject`)
- **S12-25** 222/222 Vitest grønne (195 fra S11 + 27 nye: per-unit, migrasjon, CSV-logikk, BOM)
- **S12-26** `npx tsc -b` ren — ingen feil
- **S12-27** CHANGELOG v12.0.0 ✓
- **S12-28** DEVLOG beslutninger 40–42 ✓
- **S12-29** `git commit + tag v12.0.0 + push` ✓
- **S12-30** Vercel-deploy verifisert ✓

### Akseptanskriterier
- ✓ 222/222 Vitest-tester grønne
- ✓ `npx tsc -b` ren
- ✓ PDF genereres med valgte seksjoner
- ✓ CSV åpnes i Excel norsk (BOM + semikolon)
- ✓ Per-unit toggle med pedagogisk hint
- ✓ Eldre .gmx (v3.5) migreres til v12.0 med banner
- ✓ CHANGELOG og DEVLOG oppdatert

---

## v11.0.0 — 2026-05-12 — Sprint 11: Pedagogisk lag + UI-rydding

### Lagt til
- **S11-00** Git branch `sprint11` opprettet
- **S11-01** `package.json` bumped til `11.0.0`
- **S11-02** To-rads toolbar (ferdig fra forrige session): Rad 1 = fil/prosjekt (h=46px), Rad 2 = analyse + pedagogikk (h=38px, overflow-x: auto)
- **S11-03** `LearningObjectivesPanel.tsx` — flytende panel med læringsmål per funksjon (11 funksjoner, tabulator-navigasjon, nøkkelformel + standard per funksjon)
- **S11-04** `FormulaSheet.tsx` — formelark-modal med 8 temagrupper (Lastflyt, Spenningsfall, Kortslutning, Vern, Vannkraft, Vindkraft, Solkraft, Jordfeil), 40+ formler
- **S11-05** `HintSystem.tsx` — kontekstsensitive hints: ingen slack-buss, ΔU > 5%, Ik > 25 kA
- **S11-06** `ScenarioLibraryPanel.tsx` + `src/data/scenarios.ts` — 4 scenarioer (Enkel radial, Ringnett 3-buss, Trafo+lavspent, Vannkraft+vind), hvert med læringsmål og forventet resultat
- **S11-07** `GlossaryPanel.tsx` — søkbar fagordliste med 23 termer på norsk og engelsk, filtrerbar per kategori
- **S11-08** `clearAllResults()` i store nullstiller tidsserie-data ved nytt prosjekt/import
- **S11-09** Vitest: `npm test`-script setter korrekt TEMP-sti (Windows Temp EPERM fix via cross-env), 195/195 tester grønne
- **S11-10** Toolbar rad 2: 4 nye pedagogiske knapper (📚 Scenarioer, 📐 Formelark, 📖 Ordliste, 🎓 Læringsmål)
- **S11-11** `vitest.config.ts` forenklet (fjernet utdatert cache.dir-advarsel)

### Akseptanskriterier
- ✓ 195/195 Vitest-tester grønne
- ✓ Toolbar går ikke ut over siden (to-rads layout)
- ✓ Nytt prosjekt nullstiller alle paneler (clearAllResults + timeseries)
- ✓ Læringsmål tilgjengelig per funksjon (LearningObjectivesPanel)
- ✓ Formelark tilgjengelig (FormulaSheet)
- ✓ Hint vises ved vanlige feil (HintSystem)
- ✓ 4 scenarioer i biblioteket
- ✓ 23 fagtermer i ordliste
- ✓ v11.0.0 i UI
- ✓ npx tsc -b — ingen feil

---

## v10.0.0 — 2026-05-12 — Sprint 10: Tidsserie-simulering 24t

### Lagt til
- **S10-00** Git branch `sprint10` opprettet
- **S10-01** `package.json` bumped til `10.0.0`
- **S10-02** `calcLoadProfile(Pmax, cosPhi)` — norsk lastprofil 24t, returnerer `TimeStep[]` med P og Q
- **S10-03** `calcProductionProfile(generators)` — tidsvarierende produksjonsprofil per kildetype (vann, vind, sol, atom, termisk)
- **S10-04** `calcEnergyBalance(load, production)` — balanse = produksjon − last per time
- **S10-05** `timeseries.test.ts` — 21 tester, inkl. fasit kl 12: −1.552 MW, kl 3: +2.2 MW ✓
- **S10-06** `TimeSeriesPanel.tsx` — slider 0–23t, parameterinnstilling (P_max, cosφ), NR-integrasjon
- **S10-07** `LoadProfileChart.tsx` — SVG-kurve med fargekoding (grønn/gul/rød) og klikk-til-time
- **S10-08** `ProductionProfileChart.tsx` — stablet arealkart per kildetype + lastlinje overlay
- **S10-09** `EnergyBalanceChart.tsx` — stolpediagram med grønn/rød balanse per time
- **S10-10** Integrasjon: NR-lastflyt kjøres med P_time/Q_time fordelt på PQ-busser
- **S10-11** 195/195 Vitest-tester grønne
- **S10-12** CHANGELOG v10.0.0 + DEVLOG beslutning 36–37

### Fasit-verifisering
- P_max=10 MW, cosφ=0.9, P_hydro=5 MW, P_sol_peak=2 MW:
  - Kl 12: P_sol=2·sin(π·6/14)=1.948 MW → Balanse=6.948−8.5=**−1.552 MW** ✓
  - Kl 3:  P_sol=0 (natt) → Balanse=5.0−2.8=**+2.2 MW** ✓

---

## v9.0.0 — 2026-05-12 — Sprint 9: Kraftproduksjon Nivå 2

### Lagt til
- **S9-00** Git branch `sprint9` opprettet
- **S9-01** `package.json` bumped til `9.0.0`
- **S9-02** `TurbineSelector.tsx` — interaktiv valg av Francis/Pelton/Kaplan med info om H-range, CF og beskrivelse
- **S9-03** `HydroDetailEditor.tsx` — virkningsgradskurve η(Q/Q_n) med SVG-diagram og driftsmarkør
- **S9-04** `calcHydroDetailed(H, Q, Qn, etaMax, k)` — parabolsk η-kurve:
  - η(Q/Q_n) = η_max · (1 − k · (Q/Q_n − 1)²), k=0.3 for Francis
  - Fasit: Francis Q/Q_n=0.8 → P=72.12 MW (±0.1 MW) ✓
- **S9-05** `WindPowerCurveEditor.tsx` — P(v)-grafkurve med SVG, Rayleigh-fordeling, CF-display
- **S9-06** `calcWindDetailed(vMean, Pn, n)` — Rayleigh-vektet Σ P(v)·f(v)·8760 → {pMW, eYearMWh, CF}
- **S9-07** `SolarSeasonEditor.tsx` — månedsprofil-stolpediagram, sesongfaktorer, vinkelanbefaling Norge
- **S9-08** `calcSolarAnnual(pPeakMW)` — CF=0.11 for Norge, månedlig fordeling, E_år
- **S9-08** `ProductionDashboard.tsx` — samlet oversikt: MW, MWh/år, CO₂ (t/år), CO₂-fri %
  - CO₂-faktorer (livssyklus): Vann 4 · Vind 7 · Sol 45 · Atom 12 · Termisk 490 g/kWh
- **S9-09** Toolbar: ny knapp "☀ Dashboard" (åpner ProductionDashboard)
- **S9-10** 174/174 Vitest-tester grønne

### Fasit-verifisering
- Francis Q/Q_n=0.8, H=200m, Q=40 m³/s, Q_n=50 m³/s, η_max=0.93:
  - η_akt = 0.93 · (1 − 0.3 · 0.04) = 0.9188
  - P = 0.9188 · 1000 · 9.81 · 200 · 40 / 1e6 = **72.12 MW** ✓

---

## v8.1.0 — 2026-05-12 — Versjonbump og regler

### Endret
- `package.json` bumped til `8.1.0`
- **Versjonregel innført:** Alle bugfixer som går til `main` skal bumpe patch-versjon (X.Y.**Z** += 1). Sprint-leveranser bumper minor (X.**Y**.0 += 1). Ny sprint bumper major (**X**.0.0 += 1).

---

## v8.0.0 — 2026-05-12 — Sprint 8: Jordfeil og nøytralbehandling

### Lagt til
- **S8-00** Git branch `sprint8` opprettet
- **S8-01** Toolbar `btnStyle` — `minHeight: 36`, `whiteSpace: 'nowrap'` for synlig knappehøyde
- **S8-02** `calcEarthFaultIT(Un, C0, L, f)` — IT-nett jordfeilstrøm: `Uf · ω · C₀ · L`
- **S8-03** `calcEarthFaultTN(Uf, Zfase, Zjord)` — TN-nett jordfeilstrøm: `Uf / (Z_fase + Z_jord)`
- **S8-04** `calcPetersen(Un, C0, L, f, k)` — Petersen-spole: `L_P = 1/(3ω²C₀L)`, `I_rest`
- **S8-05** `src/core/earth-fault.test.ts` — 9 Vitest-tester grønne:
  - IT fasit: 11.97 A (±0.5 A) ✓
  - TN fasit: 230 A (±5 A) ✓
  - Petersen L_P: 1.126 H (±0.01 H) ✓
- **S8-06** `src/components/earthfault/EarthFaultPanel.tsx` — jordfeilberegningspanel:
  - Netttype-selector (IT / TN / Petersen) med pedagogisk beskrivelse
  - Buss-selector, beregn-knapp, resultatvisning
  - Nullstill-knapp (orange) + X-lukking
- **S8-07** `src/components/earthfault/NeutralTreatmentPanel.tsx` — sammenlignstabell:
  - Interaktiv tabell: IT / TN / Petersen med I_jord, driftskontinuitet, bruksområde
  - Klikk for å sette aktiv netttype, formelreferanse
- **S8-08** `BusNode.tsx` — jordfeilmarkering canvas:
  - Gul glødende kant (#FFB74D) + ⏚-symbol ved enpolet jordfeil
  - Reaktivt: forsvinner automatisk ved `clearEarthFault()`
- **S8-09** Zustand store — jordfeil-actions:
  - `runEarthFault(busId, networkType)` — beregner og lagrer resultat
  - `clearEarthFault()` — nullstiller buss-markering og resultater
  - `setNetworkType(t)` — oppdaterer aktiv netttype
- **S8-10** Alle 163 Vitest-tester grønne ✓
- **S8-11** `EarthFaultResult`, `NetworkType` — nye typer i `types/index.ts`
- **S8-12** Toolbar — `⏚ Jordfeil`-knapp og `∿ Nøytral`-knapp

### Merk
- Petersen L_P fasit i spec-dokument inneholder trykkfeil (ω²=9870 vs 98696).
  Implementasjonen bruker fysisk korrekt formel → L_P ≈ 1.126 H

---

## v7.0.0 — 2026-05-12 — Sprint 7: Vernkoordinering

### Lagt til
- **S7-00** Git branch `sprint7` opprettet
- **S7-01** `src/core/protection.ts` — `calcTripTime(tms, Is, I, curve)`:
  - Kurver: `standard_inverse`, `very_inverse`, `extremely_inverse`, `definite_time`
  - IEC 60255-151 formler, returnerer `Infinity` når I ≤ Is
  - Fasit std. invers: TMS=0.1, Is=100A, I=500A → t=0.429 s
- **S7-02** `checkSelectivity(prot1, prot2, Ik, dtMin=0.25)`:
  - Håndterer kanttilfeller: backup-feil (t2=∞ → selective=false)
  - Returnerer `{ selective, margin, t1, t2 }`
- **S7-03** `src/core/protection.test.ts` — 17 Vitest-tester:
  - Standard invers: t=0.429 s (±0.01 s) ✓
  - Veldig invers: t=0.338 s (±0.01 s) ✓
  - Selektivitets-kanttilfeller: backup-feil, ingen aktivering ✓
- **S7-04** `src/components/canvas/LineEdge.tsx` — skjold-ikon (🛡) på kanter med vern:
  - Farge: cyan=vern satt, grønn=selektiv, gul=marginal (Δt<0.3s), rød=ikke selektiv
- **S7-05** `src/components/protection/ProtectionEditor.tsx` — sidebar-editor for vern på linje:
  - I_s, TMS, kurvevalg, momentanutkobling (I_instant)
  - Hint: I_s > 1.2 × I_n (laststrøm)
  - Kobling mot I″k3p_min fra Sprint 5 — viser utløsetid og følsomhetsstatus
- **S7-06** `src/components/protection/ProtectionHierarchyPanel.tsx` — flytende tre-panel:
  - BFS fra slack-buss → viser vernkjede med utløsetid og selektivitets-status
  - Grønn ✓ = selektiv, Rød ✗ = ikke selektiv, (uten vern) = uspesifisert
- **S7-07** `src/components/protection/SelectivityPanel.tsx` — bunntab:
  - Tabell: vern 1, vern 2, Ik, t₁, t₂, Δt, status
  - «Kjør kontroll»-knapp som triggar `runSelectivityCheck()`
- **S7-08** Kobling mot I″k3p_min fra Sprint 5 i editor og selektivitetskontroll
- **S7-09** 154/154 Vitest-tester grønne
- **S7-10** CHANGELOG + DEVLOG oppdatert
- **S7-11** npx tsc -b ren → merget main → push

### Typer lagt til (`src/types/index.ts`)
- `OcCurve` — IEC 60255-151 kurvetyper
- `tms`, `curve` på `Protection`-interface
- `SelectivityResult` — resultater fra selektivitetskontroll

### Store (`src/store/useNetworkStore.ts`)
- `selectivityResults: SelectivityResult[]`
- `showProtectionResults: boolean`
- `updateProtection(id, patch)` — manglet fra tidligere sprint
- `runSelectivityCheck()` — finner vernpar i serie, beregner utløsetider

---

## v6.0.0 — 2026-05-12 — Sprint 6: Ringnett og strømdeling

### Lagt til
- **S6-00** Git branch `sprint6` opprettet
- **S6-01** `src/core/ring-network.ts` — `calcRingSymmetric(Iload, Zac, Zcb, Rac, Rcb)`:
  - I_A = I_last · Z_CB / Z_total, I_B = I_last · Z_AC / Z_total
  - Tap per grein: P = I² · R [kW], tapreduksjon vs radial [%]
- **S6-02** `calcRingAsymmetric(Iload, Zac, Zcb, Rac, Rcb, vaDeltaV?)`:
  - Kirchhoff: I_A = (I_last · Z_CB + ΔV) / Z_total
  - Generell løsning for ulik impedans og spenning
- **S6-03** `src/core/ring-network.test.ts` — 16 Vitest-tester:
  - Fasit symmetrisk: I_A = I_B = 83.0 A (±1 A), total tap = 20.6 kW (±0.5 kW)
  - Tapreduksjon 75% ±2% bekreftet
  - Asymmetrisk, kanttilfeller: iLoad=0 og Z_CB→0 testet
- **S6-04** `src/validation/network-validator.ts` — syklusdeteksjon:
  - DFS-basert ringtopologi-deteksjon
  - Advarsel (ikke feil): 'Masket nett oppdaget — NR løser automatisk.'
- **S6-05** `src/components/canvas/LineEdge.tsx` — animerte strømpiler:
  - `stroke-dashoffset`-animasjon på React Flow edges etter NR-konvergens
  - Farge: grønn < 70%, oransje 70–100%, rød > 100% belastning
  - Hastighet proporsjonal med strøm (animasjonsdur 0.5–3 s)
  - Retning basert på strømsignet (normal/reverse CSS animation)
- **S6-06** `src/components/ringnetwork/RingNetworkPanel.tsx` — flytende panel:
  - Velg forsyningspunkt A, B og lastbuss C
  - "Beregn strømdeling"-knapp + "Kjør lastflyt (NR)"-knapp
  - Toggling av strømpiler på canvas
- **S6-07** `src/components/ringnetwork/RingNetworkResultPanel.tsx` — bunntabell:
  - Grein-tabell: strøm, tap, belastningsprosent med farger
  - Radial-tap vs. ring-tap med tapreduksjon
- **S6-08** `src/components/ringnetwork/RadialVsRingPanel.tsx` — sammenligning:
  - Tabell: Radial vs Ringnett — maks strøm, total tap, tapreduksjon, leveringssikkerhet
- **S6-09** Store-integrasjon (`src/store/useNetworkStore.ts`):
  - State: `showFlowDirections`, `ringNetworkResults`
  - Actions: `toggleFlowDirections`, `setRingNetworkResults`, `runRingNetwork`
  - `runRingNetwork(busAId, busBId, busCId)` finner linjer, beregner analytisk
- **S6-10** Vitest: 137/137 grønne (16 nye ringnett-tester)
- **S6-11** CHANGELOG + DEVLOG oppdatert
- **S6-12** `npx tsc -b` ren → merget til main → pushet

### Fasitsvar bekreftet
- I_last = 166.0 A (P=6MW, Q=2MVAr, 22kV)
- I_A = I_B = 83.0 A (symmetrisk ringnett)
- Total tap = 20.6 kW, Radial tap = 82.7 kW
- Tapreduksjon = 75.1%

---

## v5.0.0 — 2026-05-12 — Sprint 5: Kortslutningsberegninger (IEC 60909)

### Lagt til
- **S5-00** Git branch `sprint5` opprettet
- **S5-01** `src/core/short-circuit.ts` — `calcIk3p(zkOhm, unV, c?)`:
  - I′′k3p = (c · Un) / (√3 · |Z_k|) [kA], c_maks = 1.10
- **S5-02** `calcIk2p(ik3pKA)` — I′′k2p = (√3/2) · I′′k3p = 0.866 · I′′k3p
- **S5-03** `calcImpact(ik3pKA, rOverX)` — ip = κ · √2 · I′′k3p, κ = 1.02 + 0.98·e^(−3R/X)
- **S5-04** `calcIk3pMin(zkOhm, unV, tempFactor?)` — minimal kortslutningsstrøm, c_min = 1.00
- **S5-05** `src/core/short-circuit.test.ts` — 22 Vitest-tester:
  - Fasit: I′′k3p = 1.252 kA (±0.01 kA), I′′k2p = 1.084 kA, ip = 2.557 kA
  - Z-buss Thevenin-test: |Z_th| ≈ 11.17 Ω, Re ≈ 3.0 Ω, Im ≈ 10.76 Ω
  - Ende-til-ende fasit-nett bekreftet
- **S5-06** `src/core/short-circuit.ts` — `calcZThevenin(project, faultBusId)`:
  - Bygger p.u. Y-buss (linjer + transformatorer + generatorshunter)
  - Gauss-Jordan-inversjon med partiell pivotvalg
  - Returnerer Z_kk i fysiske Ohm (referert til feilsted-buss)
- **S5-07** `calcContributions(project, faultBusId)` — bidrag per generator (superposisjon)
- **S5-08** `src/components/shortcircuit/ShortCircuitPanel.tsx` — flytende panel:
  - Velg feilsted-buss fra rullegardin
  - IEC 60909 metode-info, advarsel ved manglende generatorer
  - "Beregn kortslutningsstrøm"-knapp
- **S5-09** `src/components/shortcircuit/ShortCircuitResultPanel.tsx` — bunntabell:
  - I′′k3p maks, I′′k2p, ip støtstrøm, I′′k3p min
  - Bryterevne-sjekk med rød advarsel ved overskriding
- **S5-10** `src/components/shortcircuit/ContributionTable.tsx` — bidragstabell:
  - Generator | I′′k3p-bidrag [kA] | Andel [%]
- **S5-11** Feilsted-markering på canvas (BusNode.tsx):
  - Rød glødende kant (#EF5350), rød bakgrunn, ⚡ pulserende lyn-symbol
  - CSS `@keyframes pulse` i index.css
- **S5-12** Bryterevne-sjekk i BusEditor: nytt felt `cbRatingKA` (standard 16 kA)
- **S5-13** `Bus`-type utvidet med `cbRatingKA?: number`
- **S5-14** Store: `selectedFaultBusId`, `showShortCircuitResults`, `runShortCircuit(busId)`
- **S5-15** CHANGELOG v5.0.0 + DEVLOG beslutning 22
- **S5-16** `npx tsc -b` — ingen feil, 121/121 Vitest grønne

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
