# DEVLOG — GridMaster Edu

Tekniske beslutninger og begrunnelser. Oppdateres ved hvert viktig valg.

---

## Sprint 14 — 2026-05-13 (v14.0.0 / v1.1.0)

### BESLUTNING 46: Skylagring fjernet fra UI — arkitektur beholdt

**Problem:** Supabase-skylagring (Sprint 3.5) er implementert uten brukerautentisering. Alle brukere kan se og endre alle prosjekter (ingen row-level isolation i praksis). Sikkerhetsrisiko for elever.

**Løsning:** Fjerne alle UI-inngangspunkter (toolbar-knapper, dialogs, state-variabler) i Toolbar.tsx. `saveToCloud`, `loadFromCloud`, `listCloudProjects` og `CloudProjectSummary` beholdes i `gmx.ts` og `types/index.ts` for reaktivering i v2.x med autentisering. PL gjør hard reset av Supabase-tabell manuelt.

**Valg:** Ingen advarseltid til brukere — det ligger nesten ingenting i tabellen (bekreftet av PL).

### BESLUTNING 47: getFlowColor — tilstandsmaskin basert på strømsign + isOpposing-flag

**Problem:** Sprint 6 viser animerte strømpiler, men fargen er kun basert på lastprosent (grønn/gul/rød). For toveis lastflyt-flow i ringnett trengs retningsinformasjon.

**Løsning:** `src/utils/flow-color.ts` implementerer en fire-tilstands fargelogikk: `idle` (|I| < 0.1 A) → grå, `reversed` (I < 0) → rød stiplet, `opposing` (isOpposing=true) → oransje, `normal` (I > 0) → grønn. `isOpposing` er et eksplisitt flag i `LineEdgeData` som ringnett-analyse kan sette i v2.x. Animasjonsretning (`animDir`) beholdes fra Sprint 6 slik at strømpilene faktisk beveger seg i riktig retning.

**Topologi-analyse utsatt:** `isOpposing`-deteksjon fra ringnett-topologi krever analyse av strøm-signatur per linje mot forventet retning i ringen. Dette er ikke implementert i Sprint 14 — flagget settes fra utsiden når ringnett-panelet eventuelt eksponerer det. Ingen eskalering nødvendig siden eskalerings-terskelen er > 2 timers arbeid.

### BESLUTNING 48: Playwright TEMP-fix

**Problem:** `npm run test:e2e` feiler med `EPERM: operation not permitted, mkdtemp 'C:\Windows\Temp\...'` på Windows fordi Playwright forsøker å opprette tempfiler i `C:\Windows\Temp` (ingen skrivetilgang uten admin).

**Løsning:** `test:e2e`-script fikset med samme `cross-env TEMP=... TMP=...`-mønster som allerede brukes for Vitest. Playwright installeres med `$env:TEMP` satt eksplisitt i PowerShell-sesjonen.

---

## Sprint 13 — 2026-05-12 (SISTE SPRINT — v1.0.0 PRODUKSJONSKLAR)

### BESLUTNING 43: REN-regler — rene funksjoner + prosjektnivå-validator

**Problem:** REN-avvik (spenningsfall, kabelkapasitet, vern, jording) skal sjekkes automatisk etter beregninger og vises på canvas. Regelbasis er Norsk Elektroteknisk Norm (REN blad 4004/6002/7002/9001).

**Løsning:** `ren-rules.ts` eksponerer rene funksjoner (`checkCable`, `checkVoltageDrop`, `checkShortCircuit`, `checkProtectionSelectivity`, `checkEarthing`) som kan testes isolert i Vitest. `validateRen(project, ...)` er prosjektnivå-orchestrator. `RenResult[]` lagres i Zustand-store og brukes av `WarningBadge` og `WarningPanel`.

**Regel for kortslutningsvern:** `Ik3p ≥ 2 × Ia` (sikkerhetsfaktor 2). Grunnen er at REN blad 7002 §2.2 krever at feil kobles fra innen 5 sekunder, og norsk praksis bruker 2× som nedre grense for sikker utløsning med riktig brytertype (type C = 10×In).

### BESLUTNING 44: Onboarding — react-joyride v5 (ny API)

**Problem:** react-joyride v3 (gammel) vs v5 (ny). Ny versjon har endret API: `callback` → `onEvent`, `showProgress`/`showSkipButton` er nå i `options`-prop, `Joyride` er named export (ikke default).

**Løsning:** Migrert direkte til react-joyride v5 API. `onEvent: EventHandler` kalles ved alle hendelser. STATUS.FINISHED/SKIPPED trigger localStorage-flagg og avslutter turen.

**Valg:** Ingen custom tooltip-komponent — bruker innebygd tooltip med tilpasset styling via `styles`-prop (tooltip, tooltipTitle, buttonPrimary, osv.).

### BESLUTNING 45: Playwright ekskluderes fra Vitest

**Problem:** Vitest plukket opp `tests/*.spec.ts` (Playwright-filer) og forsøkte å kjøre dem som unit-tester.

**Løsning:** `vitest.config.ts` eksplisitt `exclude: ['tests/**', 'node_modules/**']`. Playwright kjøres separat via `npm run test:e2e`. Denne separasjonen er nødvendig fordi Playwright bruker `@playwright/test` ikke Vitest runner.

### BESLUTNING 46: v1.0.0 = v13.0.0 — dobbelt-tagging

**Begrunnelse:** Sprint 13 er siste utviklingssprint. Produktet er produksjonsklar for undervisning i 00TE13I. `v13.0.0` følger intern sprint-konvensjon. `v1.0.0` er semantisk versjonering for den første stabile produksjonsversjonen. Begge tagges på samme commit.

---

## Sprint 12 — 2026-05-12

### BESLUTNING 40: PDF-bibliotek — jsPDF + jspdf-autotable + html2canvas

**Problem:** PDF-eksport krever tabeller (autotable), diagrammer (html2canvas) og typesatt tekst (jsPDF). Tre alternativer ble vurdert: (1) jsPDF-stack, (2) pdfmake, (3) server-side (Puppeteer).

**Løsning:** jsPDF + jspdf-autotable + html2canvas. Alle tre er rent klient-sidige, krever ingen server, og fungerer i Vercel static-deploy. jsPDF 4.x + jspdf-autotable 5.x er kompatible.

**Alternativ avvist:** Puppeteer/server-side ville krevd en server-funksjon på Vercel og mer kompleks deployment. pdfmake mangler html2canvas-integrasjon for canvas-screenshot.

### BESLUTNING 41: Per-unit base — S_base=100 MVA, U_base=22 kV som standard

**Problem:** Per-unit normalisering krever en valgt base. Norsk distribusjonsnett opererer typisk på 22 kV.

**Løsning:** Default `S_base=100 MVA`, `U_base=22 kV` (kan endres i PerUnitPanel). Verdiene hentes fra `project.system.sBaseMVA` og et justerbart felt. Z_base = U²_base / S_base = 4.84 Ω ved 22 kV / 100 MVA.

**Pedagogisk verdi:** PerUnitPanel viser Z_base og I_base beregnet i sanntid slik at studenten forstår sammenhengen.

### BESLUTNING 42: Migrasjon — kjedet v1→v12 i ett steg via array av step-funksjoner

**Problem:** Eldre .gmx-filer (v1.0–v3.5) mangler felter som ble lagt til i sprint 3–11. Baklengs-kompatibilitet krever at alle eksisterende filer kan lastes.

**Løsning:** `migration.ts` definerer en array av `{ from, fn }` step-funksjoner. `migrateProject()` itererer og anvender hvert steg der `current < target`. Hvert steg oppdaterer `metadata.version`. UI viser banner i 8 sekunder etter migrasjon.

**Regel:** Aldri migrer baklengs. `needsMigration()` sjekker om `semver(version) < 12`. Originale felter beholdes alltid — steg legger til defaults, fjerner ingenting.

---

## Sprint 11 — 2026-05-12

### BESLUTNING 38: To-rads toolbar fremfor horisontal scrolling i én rad

**Problem:** 15+ knapper på én linje går ut over skjermen på standard 1280px-skjerm.

**Løsning:** Rad 1 (fil/prosjekt, h=46px) er alltid synlig og inneholder kritiske handlinger. Rad 2 (analyse, h=38px) har `overflow-x: auto` og `minWidth: max-content` på inner-div — scroller horisontalt på smale skjermer uten å klippe knapper.

**Alternativ vurdert:** Dropdown-meny for analyseverktøy. Avvist fordi det gjemmer funksjonene for studenter som ikke vet hva de leter etter.

### BESLUTNING 39: Pedagogiske paneler som egne flytende komponenter

**Problem:** Læringsmål, formelark og ordliste kan enten integreres i sidebar eller være egne paneler.

**Løsning:** Egne flytende paneler trigget fra toolbar-knapper. Lar studenter ha formelarket åpent ved siden av beregningsverktøyet (side-by-side læring).

### BESLUTNING 40: HintSystem som passiv observatør (ikke modal)

**Problem:** Kontekstsensitive hints kan vises som popup-modal (blokkerende) eller passivt overlay.

**Løsning:** HintSystem rendres som `position: fixed` nedre høyre hjørne, `pointerEvents: none`. Forstyrrer ikke arbeidsflyten. Forsvinner automatisk når feiltilstanden er ryddet opp.

### BESLUTNING 41: Vitest Windows Temp EPERM — cross-env i npm test

**Problem:** Vitest forsøker å opprette SSR-temp-kataloger under `C:\Windows\Temp` som krever admin-tilgang. Resulterer i `EPERM: operation not permitted` og 0 kjørte tester.

**Løsning:** `npm test` bruker `cross-env` til å sette `TEMP` og `TMP` til `%USERPROFILE%\AppData\Local\Temp` før Vitest starter. `vitest.config.ts` berøres ikke. Løser problemet uten å endre systemkonfigurasjon.

---

## Sprint 10 — 2026-05-12

### BESLUTNING 36: Typisk norsk lastprofil som konstant array

**Problem:** Lastprofilen er ikke dynamisk — den er en normert kurve som representerer typisk norsk husholdning/industri. Verdier fra Statnett-statistikk.

**Løsning:** Eksportert `LOAD_PROFILE_PCT` som konstant array i `timeseries.ts`. Brukes direkte i tester for fasit-verifisering og i `LoadProfileChart` for SVG-rendering. Ikke gjenberegnes per call.

### BESLUTNING 37: NR-integrasjon fordeler P_time likt på alle PQ-busser

**Problem:** Tidsserie-simuleringen vet ikke hvilken buss som har hvilken andel av lasten — det er prosjektavhengig. En enkel fordeling er nødvendig for pedagogisk demonstrasjon.

**Løsning:** `TimeSeriesPanel` fordeler `P_time(t)` og `Q_time(t)` likt på alle PQ-busser (`pPerBus = P_time / nPQ`). Studenten kan justere enkeltbusser manuelt etterpå. Knappen er deaktivert når det ikke finnes PQ-busser.

---

## Sprint 9 — 2026-05-12

### BESLUTNING 33: Parabolsk η-kurve for vannkraft (k-verdi per turbintype)

**Problem:** η er ikke konstant — varierer med Q/Q_n. Spec bruker én felles k=0.3. I praksis er Francis bredere (k=0.30), Pelton bedre ved lav vannføring (k=0.25), Kaplan mellom (k=0.28).

**Løsning:** `calcHydroDetailed` tar k som parameter. `HydroDetailEditor` bruker type-spesifikke k-verdier fra `K_BY_TYPE`. SVG-kurve tegnes for Q/Q_n ∈ [0.2, 1.4].

### BESLUTNING 34: Rayleigh PDF for vindenergi (ikke CF-tabell-oppslag)

**Problem:** Kapasitetsfaktor kan hardkodes, men det gir ingen sammenheng med v_mean. Rayleigh-fordelingen er standard for vind (Weibull k=2).

**Løsning:** `calcWindDetailed` integrerer P(v)·f_Rayleigh(v) numerisk med 0.5 m/s steg fra 0–30 m/s, multiplisert med 8760 h/år. CF beregnes som ratio E/E_max.

### BESLUTNING 35: Månedlig solproduksjon normert mot årssum

**Problem:** Initial implementasjon skalerte monthly med `(f/12) * E_år` som ga feil sum siden Σf = 5.53 ≠ 12.

**Løsning:** `monthly[i] = E_år · (f[i] / Σf)`. Setter sum(monthly) = E_år eksakt. Oppdaget av Vitest-test "monthly sum ≈ annual total".

---

## Sprint 8 — 2026-05-12

### BESLUTNING 32: Versjonbump-regel — alltid bump ved bugfixer

**Problem:** Tidligere sprinter har ikke bumped `package.json`-versjon konsekvent ved bugfixer mellom sprinter. Vercel viser alltid siste build, men versjonsnummeret i UI og `package.json` henger etter.

**Regel:**
- **Bugfix / hotfix** → patch-bump (X.Y.Z += 1), commit `fix:` eller `chore: bump vX.Y.Z`
- **Sprint-leveranse** → minor-bump (X.Y.0, Y += 1), commit `feat(sN):`
- **Ny sprint-serie** → major-bump (X.0.0, X += 1)

**Gjelder fra:** v8.1.0

---

### BESLUTNING 29: Forenklet jordfeilformel (Uf·ω·C₀·L)

**Problem:** IEC-litteraturen bruker `I = 3·Uf·ω·C` (faktor 3 for tre faser). Spec-dokumentet bruker `I = Uf·ω·C₀·L` uten faktor 3.

**Løsning:** Implementerer spec-formelen `Uf·ω·C₀·L`. Dette er den "praktiske" forenklede formen som er standard i norske NVE-retningslinjer for IT-nett beregninger der C₀ allerede er totalkapasitansen per fase, og faktoren 3 er absorbert i konstantleddet.

### BESLUTNING 30: Petersen L_P fasit 1.126 H (ikke 11.26 H)

**Problem:** Spec-dokumentet viser fasit L_P = 11.26 H, men mellomregningen inneholder `ω² = 9870` som er feil (riktig: `(2π·50)² = 98696`). Spec er off by factor 10.

**Løsning:** Implementerer fysisk korrekt formel `L_P = 1/(3·ω²·C₀·L)` som gir 1.126 H. Testtoleransen er justert tilsvarende. Notert i CHANGELOG.

### BESLUTNING 31: Jordfeilpaneler i venstre side av canvas

**Problem:** Alle eksisterende flytende paneler (Kompensasjon, Spenningsfall, Kortslutning) ligger til høyre. Jordfeil-panelene legges til venstre for å unngå visuell krasj.

**Løsning:** `EarthFaultPanel` og `NeutralTreatmentPanel` plasseres i absoluttposisjon `top:12, left:12` på canvas.

---

## Sprint 7 — 2026-05-12

### BESLUTNING 26: Analytisk IEC 60255-151 i stedet for look-up-tabell

**Problem:** Vernkoordinering kan implementeres med forhåndsdefinerte kurvetabeller (interpolasjon) eller via de eksakte IEC 60255-151 analytiske formlene.

**Løsning:** Bruker de analytiske formlene direkte. Fordeler: eksakt resultat, ingen interpolasjonsfeil, pedagogisk transparent (studenten ser formelen i kildekoden).

**Formler implementert:**
- Standard invers: `t = TMS · 0.14 / ((I/Is)^0.02 - 1)`
- Veldig invers: `t = TMS · 13.5 / ((I/Is) - 1)`
- Ekstremt invers: `t = TMS · 80 / ((I/Is)² - 1)`
- Definit tid: `t = TMS` (direkte tidsforsinkelse)

### BESLUTNING 27: Backup-feil gir selective=false

**Problem:** Når backup-vern (prot2) ikke ser kortslutningsstrømmen (Is2 ≥ Ik), returnerer `calcTripTime` Infinity for t2. Spørsmål: er dette "selektivt" (prot1 løser alltid alene) eller "ikke selektivt" (backup feiler)?

**Løsning:** Klassifiseres som `selective: false` — selv om prot1 løser korrekt, er det et koordineringsproblem at backup-vern ALDRI vil tre inn ved en kraftig feil. Riktig vernkoordinering krever at backup reagerer ved høye feilstrømmer.

---

## Sprint 6 — 2026-05-12

### BESLUTNING 24: Analytisk ringnett-løsning ved siden av NR

**Problem:** Newton-Raphson løser automatisk maskede nett, men gir ingen pedagogisk forklaring på strømdeling.

**Løsning:** Implementerer analytisk 3-buss-løsning i `ring-network.ts` basert på KVL rundt sløyfen:
- Symmetrisk: I_A = I_last · Z_CB / Z_total (ren impedansfordeling)
- Asymmetrisk: I_A = (I_last · Z_CB + ΔV) / Z_total (KVL med spenningsdifferanse)

**Valg:** Analytisk løsning brukes for det pedagogiske panelet (RingNetworkPanel/ResultPanel). NR-lastflyt kjøres separat for full nettanalyse. Begge beregninger er tilgjengelige for studenten.

### BESLUTNING 25: CSS stroke-dashoffset for strømpiler

**Problem:** React Flow har ingen innebygd mekanisme for animerte strømpiler med retning og hastighet.

**Løsning:** Overlay en sekundær `<path>` på LineEdge med `stroke-dasharray="12 12"` og `@keyframes` som animerer `stroke-dashoffset` fra 24→0 (normal) eller 0→24 (reverse). Varighet beregnet som 300/I_A sekunder (kappes til 0.5–3 s).

**Valg:** Ren CSS — ingen ekstra bibliotek. Farger (grønn/oransje/rød) følger belastningsprosent fra NR-resultat. Pilene slås på/av via `showFlowDirections`-flag i store.

---

## Sprint 5 — 2026-05-12

### BESLUTNING 22: Z-buss inversjon som Thevenin-ekvivalent

**Problem:** Kortslutningsstrøm krever Thevenin-impedans ved feilsted. For mesh-nett er ikke enkel serieaddisjon korrekt.

**Løsning:** Bygg augmentert Y-buss (nettverk + generatorshunter som p.u.-admittanser), inverter med Gauss-Jordan til Z-buss. Z_thevenin = Z[k][k] (diagonalelement ved feilsted-buss).

**Beregning p.u.:**
- Z_gen_pu = j·x″d·(S_base/S_n) — generator-shunt
- ZBase_linje = Un²/SBase — linje-impedans til p.u.
- Resultat Z_kk [p.u.] → Z_kk_ohm = Z_kk_pu · ZBase_fault

**Valg:** Arbeider i p.u. gjennomgående for konsistens med eksisterende Y-buss. Converter til Ohm på slutten.

**Fasit-verifisering:**
- Gen: x″d=0.15, Sn=10MVA, SBase=100MVA → Z_gen_pu = j·1.5
- Linje: R=3Ω, X=3.5Ω, ZBase=4.84Ω → R_pu=0.6198, X_pu=0.7231
- Z_k_pu = 0.6198 + j2.2231 → |Z_k_pu|=2.308 → Z_k_ohm=11.17Ω ✓

### BESLUTNING 23: Bidrag per generator — superposisjonsmetode

**Problem:** I et nett med N generatorer: hvordan fordeles I′′k3p per kilde?

**Løsning:** Superposisjon — én generator ad gangen. For generator g: beregn Z_thevenin med BARE g's shunt i Y-buss. Dette gir "hva ville strømmen vært om bare g var tilstede?" Pedagogisk nyttig, viser relativ styrke per kilde.

**Merk:** Summen av individuelle bidrag ≈ total I′′k3p, men ikke eksakt (parallell-effekt). For enkeltgenerator-nett: bidrag = 100%.

---

## Sprint 4 — 2026-05-12

### BESLUTNING 19: Pi-modell fasit — 100 km FeAl 95mm², 20MW/8MVAr, 66kV

Beregnet fasit for pi-modell med følgende parametere:
- Linje: 100 km FeAl 95mm² luftlinje
- R = 30 Ω, X = 33 Ω, B = 290 μS
- P = 20 MW, Q = 8 MVAr, U_n = 66 kV

**Trinnvis beregning:**

V_S_phase = 66 000 / √3 = 38 105.1 V (referansefase, reell)

I_R = (P − jQ) / (3 · V_S_phase) = (20·10⁶ − j8·10⁶) / 114 315.3 = 175.05 − j70.02 A

I_C1 = V_S_phase · j(B/2) = 38 105.1 · j·145·10⁻⁶ = j5.525 A

I_linje = 175.05 − j64.49 A

Spenningsfall i serie-impedans: (R + jX) · I_linje
  = (30 + j33)(175.05 − j64.49)
  = [30·175.05 + 33·64.49] + j[33·175.05 − 30·64.49]
  = [5251.5 + 2128.2] + j[5776.7 − 1934.7]
  = 7379.7 + j3842.0 V

V_R_phase = 38 105.1 − 7379.7 − j3842.0 = 30 725.4 − j3842.0 V

|V_R_phase| = √(30 725.4² + 3842.0²) = 30 964.3 V

V_R_LL = 30 964.3 · √3 = 53 618 V

**ΔU = 66 000 − 53 618 = 12 382 V → ΔU% = 18.76%**

Toleranse for test: ±0.1% → akseptert område: 18.66–18.86%.

**Merknad:** Pi-modellen gir ca. 1% lavere tap enn enkel modell (19.8% enkel vs 18.76% pi) på grunn av kapasitiv strøm fra shunt-kondensansen som reduserer netto linjestrøm. Dette er den pedagogiske kjernen i pi-modellen: lengre linjer har merkbar kapasitiv selvkompensering.

### BESLUTNING 20: Automatisk spenningsfallsberegning etter lastflyt

To alternativer vurdert:
1. **Manuelt trigger** — student klikker "Beregn spenningsfall" selv
2. **Automatisk etter konvergens** (valgt) — `runPowerFlow()` kaller `runVoltageDrop()` automatisk ved konvergens

Valgt automatisk fordi: (a) spenningsfall er naturlig sekundærresultat av lastflyt og alltid relevant, (b) reduserer antall klikk for studenten, (c) resultatene er alltid synkroniserte med siste lastflyt.

**Unntak:** VoltageDropPanel viser manuell "Beregn"-knapp for at studenten skal kunne endre modell (Auto/Enkel/Pi) og re-beregne uten ny lastflyt.

### BESLUTNING 21: Modell-auto basert på linjelengde

Terskelverdi 50 km er valgt basert på faglitteratur (Glover/Sarma: "Power Systems Analysis and Design"):
- Under 50 km: kapasitanseffekten er typisk < 1% og kan neglisjeres (enkel modell)
- Over 50 km: kapasitanseffekten er merkbar og bør inkluderes (pi-modell)
- Over 200 km: distribuert parameter-modell anbefales (utenfor scope)

Studenten kan overstyre auto-valget via modell-selector i VoltageDropPanel.

---

## Sprint 3.7 — 2026-05-12

### BESLUTNING 16: Kubisk P(v)-kurve for vindkraft

Tre modellalternativer ble vurdert for vindturbinens effektkurve:

1. **Lineær modell** (`P = Pn · (v - vci) / (vr - vci)`): Enklest å forstå, men unøyaktig — reelle turbiner produserer mye mindre enn lineær ved lave vindhastigheter.
2. **Kubisk modell** (`P = Pn · ((v-vci)/(vr-vci))³`) (valgt): Basert på vindeffektens proporsjonalitet med v³ (fra Betz-loven). Korrekt for den kinetiske energien i vindstrømmen. Godt kjent i faglitteraturen og brukt i IEC 61400-standarden. Enkelt å implementere og pedagogisk verdifullt siden elever kan se sammenhengen mellom kubikk-kurven og v³-avhengigheten direkte.
3. **Tabellinterpolasjon** (reell P(v)-kurve per turbinmodell): Mest presis, men krever turbinspesifikke datatabeller som ikke er tilgjengelige i en pedagogisk kontekst.

**Fasit-test** (v=10 m/s, vci=3, vr=13, Pn=3.0 MW): P = 3.0 × (7/10)³ = 3.0 × 0.343 = 1.029 MW.

**How to apply:** `calcWind()` bruker kubisk interpolasjon. For fremtidige turbinmodeller kan `pvCurve`-feltet i Generator-typen brukes til tabellinterpolasjon.

---

### BESLUTNING 17: Sinusdagsprofil for solkraft

Tre alternativer for solprofil:

1. **Konstant P_peak · 0.5** (statisk snittmodell): Enklest, brukes som fallback, men realistisk bare for dagsgjennomsnittsberegninger.
2. **Sinusprofil** `P = P_peak · sin(π·(t-trise)/(tset-trise))` (valgt): Gir P=0 ved soloppgang og solnedgang, maksimum midt på dagen. Matematisk korrekt nok for pedagogisk bruk og intuitivt riktig — elever kjenner sinusbølgen fra matematikken og kan knytte den til solens bane over himmelen. Ingen parametre krever kalibrering.
3. **Clearsky-modell** (astronomisk beregning med Perez-modell): Presis, men krever geografiske koordinater, skydekke og atmosfæriske parametre — for komplekst for Sprint 3.7.

`t_rise = 6.0`, `t_set = 20.0` er hardkodet som standardverdier (14 timers dagslys, typisk norsk sommer).

**How to apply:** `calcSolar(Ppeak, t, trise, tset)` returnerer 0 utenfor [trise, tset]. For statisk lastflytanalyse: bruk `P_peak · 0.5` som representativ dagsgjennomsnittsverdi (vist i SolarEditor som hjelpetekst).

---

### BESLUTNING 18: runProduction() — integrasjon med Newton-Raphson

To integrasjonsstrategier ble vurdert:

1. **Live-oppdatering** (auto-kjør NR ved hver parameterendring i editor): Responsivt, men NR er computasjonelt tung for store nett og ville forstyrre parameterinntasting (re-render under skriving).
2. **Eksplisitt "Beregn"-knapp** (valgt): Brukeren redigerer produksjonsparametere fritt, bekrefter med "Beregn produksjon + kjør lastflyt". `runProduction()` i storen: (a) kalkulerer P for alle generatorer basert på feltene deres, (b) oppdaterer `generator.pSetMW` og `bus.genMW` for alle PV/slack-busser, (c) kaller `runPowerFlow()` som kjører NR. Pedagogisk fordel: eleven ser eksplisitt at produksjonsberegning og lastflyt er to separate steg.

`runProduction()` er implementert som én atomisk store-action som setter all state i én `set()`-kall før NR starter, for å unngå mellomtilstander som kan trigge unødvendige re-renders.

**How to apply:** "Beregn produksjon"-knappen i ProductionPanel og "Beregn alle"-knappen i ProductionSummaryPanel kaller begge `runProduction()`. Enkeltvis parameteroppdatering (H, Q, etc.) bruker `updateGenerator()` og oppdaterer kun produksjons-parametre uten å kjøre NR.

---

## Sprint 3.6 — 2026-05-12

### Nettbygger: arkitektur og designvalg

**DnD-koordinattransformasjon:**
React Flow bruker `rfInstance.project({ x, y })` (v11) for å konvertere fra screen-koordinater til flow-koordinater. Vi bruker `onInit={setRfInstance}` på `<ReactFlow>` og lagrer instansen i lokal state. `onDrop` bruker `wrapperRef.current.getBoundingClientRect()` for offset.

**Linjetegning Metode B (velg type → klikk):**
State `lineDrawingMode: 'overhead' | 'cable' | null` og `lineDrawingFromId: string | null` i Zustand-storen. `onNodeClick` i NetworkCanvas sjekker mode-state og oppretter linje ved andre klikk. ESC-handler i global `useEffect` nullstiller mode.

**Plassering av busser via panel/toolbar:**
`placingMode: PlacingMode` i storen. `onPaneClick` (klikk på tom canvas) plasserer bussen. Transformer-plassering bruker samme `lineDrawingFromId` som Metode B for å velge to busser.

**Valideringsintegrasjon:**
`runPowerFlow()` kaller `_validateNetwork(project)` først og setter `validationResult` i store. Hvis `!result.valid` returneres tidlig uten å starte lastflyt-beregning. `ValidationPanel` vises mellom canvas og resultatpanel.

**Union-Find for isolert-node-sjekk:**
Enkel Union-Find implementert inline i `network-validator.ts`. Unngår external dependencies. Tid: O(n α(n)) ≈ O(n) for praktiske nett-størrelser.

**GeneratorEditor — "legg til / fjern" mønster:**
Generator er en separat entitet koblet til en buss via `busId`. Editoren vises under BusEditor for PV/Slack-busser. Hvis ingen generator finnes, vises "Legg til generator"-knapp. Bruker `updateGenerator` for patch (ren, ingen remove+add).

**Posisjonspersistering:**
`onNodeDragStop` kaller `updateBus(node.id, { position: node.position })` for å lagre posisjonen permanent i Zustand-storen (og dermed i .gmx-filen). Kompensatornoder ekskluderes (de er avledet fra busposisjoner).

**Slett-bekreftelse:**
Slett buss med tilkoblede linjer krever `confirm()`-dialog med antall tilkoblede kanter. Enkel UX, ingen modal-komponent nødvendig.

**BusNode forenkling:**
Fjernet intern `BusSidebar` og `showPanel`-state fra BusNode. All redigering skjer nå i høyre EditorPanel. BusNode er ren display-komponent med `selected`-prop for visuell markering (glow-effekt).

---

## ⚠ ARKITEKTURREGLER

> Disse reglene er permanente og gjelder alle sprints.

### REGEL: Zustand-selektorer må aldri returnere nye objekt- eller array-instanser direkte

**Alltid:**
```typescript
const x = useStore((s) => s.x) ?? [];
```

**Aldri:**
```typescript
const x = useStore((s) => s.x ?? []);   // ← UENDELIG LØKKE
```

**Hvorfor:** Zustand v5 bruker `useSyncExternalStore` internt. React 18 kaller `getSnapshot()` (selektoren) **to ganger** per render for tearing detection. Hvis selektoren returnerer en ny `[]`- eller `{}`-instans ved hvert kall, vil `Object.is(arr1, arr2) === false` → React tolker dette som at state endret seg midt i render → tvinger ny render → ny tearing-sjekk → ny instans → uendelig løkke fra første mount.

Dette gjelder alle inline-konstruksjoner: `?? []`, `?? {}`, `.map(...)`, `.filter(...)`, `[...spread]`. Flytt alltid slike operasjoner ut av selektoren og inn i komponent-kroppen etter kallet.

**Ref:** commit `1f39734`, Sprint 3 `fix(app): stopp uendelig løkke ved mount`

---

## 2026-05-11 — Sprint 1

### BESLUTNING 1: Complex = [number, number] tuple, ikke klasse/objekt
**Begrunnelse:** Y-bussmatrisen i Sprint 2 vil inneholde potensielt 100×100 komplekse tall. En tuple `[re, im]` er direkte destrukturerbar, serialiserbar til JSON uten spesialbehandling, og eliminerer class-overhead i hot-paths. `mathjs` Complex-objekter ville krevd wrapper-funksjoner for all aritmetikk. Ulempe: ingen `.real`/`.imag` property-syntax — men JSDoc-navngivning kompenserer.

### BESLUTNING 2: Zustand istedenfor Redux
**Begrunnelse:** GridMaster Edu har én global nettmodell uten kompleks async-logikk. Redux + Toolkit ville gitt ~3× mer boilerplate (actions/reducers/selectors) uten gevinst. Zustand gir samme type-safety med direkte mutasjonsmønster via immer-lik API. Bytte til Redux er mulig uten breaking changes i Sprint 3+ ved behov for devtools/tid-reise-debugging.

### BESLUTNING 3: Vitest temp-dir overkjøres via $env:TEMP
**Begrunnelse:** Vitest v4 forsøker å skrive til `C:\Windows\Temp\` som er begrenset av UAC på Windows 10. Løst ved å sette `$env:TEMP` til lokal prosjektmappe og legge `cache.dir` i `node_modules/.vitest`. Alternativet (kjøre som admin) ble avvist — aldri kjør devtools som admin uten behov.

Korrekt kommando for å kjøre tester på dette systemet:
```powershell
$env:TEMP = "D:\Claude\GridMaster\gridmaster-edu\node_modules\.tmp"
npm test
```

### BESLUTNING 8: Arbeidsmappe og PowerShell-syntaks
**Begrunnelse:** Prosjektet kjøres fra `D:\Claude\GridMaster\gridmaster-edu\` på Windows 10. I PowerShell brukes `;` eller separate kommandoer for sekvensielle operasjoner — `&&` er ikke tilgjengelig i Windows PowerShell (kun i PowerShell 7+ / pwsh). Korrekt start-sekvens:
```powershell
cd D:\Claude\GridMaster\gridmaster-edu
npm run dev
```

### BESLUTNING 4: importLegacyGmx() kaster eksplisitt feil ved manglende påkrevde felt
**Begrunnelse:** Scenario-filer fra Gemini mangler sporadisk felt. `requireField<T>()` helper kaster `Error('importLegacyGmx: required field "<navn>" is missing in <context>')`. Dette gjør det umiddelbart synlig HVILKE felt som mangler, uten at brukeren ser en kryptisk undefined-feil i konsollen. Kritisk for pedagogisk bruk.

### BESLUTNING 5: ratingMVA beregnes fra I_max_A × Vn_kV × √3 / 1000
**Begrunnelse:** Gemini bruker amperebegrensning (`I_max_A`) mens GmxProject bruker MVA-begrensning (`ratingMVA`). Konvertering: S = √3 × U × I gir korrekt trefase-MVA. Vn hentes fra `fromBusId`-bussen. Null-fallback sikrer ingen divisjon-feil.

### BESLUTNING 6: Vannmerke-cropping med sharp (60px fra høyre og bunn)
**Begrunnelse:** Gemini Imagen 3 legger automatisk til et stjerne-vannmerke i hjørnet (ca 60×60px) på alle genererte bilder. `sharp.extract()` er raskere og mer presis enn canvas-basert løsning for batch-prosessering. Script kjøres én gang ved setup — resulterende ikoner er 1988×1988px (ned fra 2048×2048).

### BESLUTNING 7: @tailwindcss/vite brukt istedenfor PostCSS-plugin
**Begrunnelse:** Tailwind CSS v4 anbefaler `@tailwindcss/vite` som Vite-plugin fremfor den tradisjonelle PostCSS-tilnærmingen. Dette eliminerer behov for `tailwind.config.js` og `postcss.config.js` — konfigurasjonen skjer direkte i CSS via `@import "tailwindcss"`.

---

## 2026-05-11 — Sprint 2

### BESLUTNING 9: Fasit-avvik — 133 A / 2.1 % er feil for gitte parametere
**Begrunnelse:** Sprint 2-dokumentet og scenario 1-JSON oppgir fasitsvar I ≈ 133 A og ΔU ≈ 2.1 % for 2-buss-radialnett (22 kV, S_base=10 MVA, P=5 MW, Q=2 MVAr, R=3.0 Ω, X=3.5 Ω). Analytisk verifikasjon via lukket-form kvadratisk ligning gir:

```
|y|²·u² − (|y|² + 2·(P·G + Q·B))·u + |S|² = 0
G=6.832, B=7.972 pu (Z_base=48.4 Ω)
u = 0.9062  →  V₂ = 0.9520 p.u.  →  ΔU = 4.80 %
I_pu = 0.5645  →  I = 148.1 A  (I_base = 262.4 A)
```

Newton-Raphson konvergerer til nøyaktig samme verdier (verifisert numerisk). Fasit-verdiene 133 A / 2.1 % samsvarer ikke med noen rimelig tolkning av parameterne og er sannsynligvis produsert med en forenklende håndformel av PL-prosjektet.

**How to apply:** Bruk de korrekte fysiske verdiene i tester (V₂≈0.952, ΔU≈4.8 %, I≈148 A ±5). Rapporter avviket til PL og Gemini-review for Sprint 2.

### BESLUTNING 10: Gauss-eliminasjon (ikke ren LU-dekomposisjon) for Jacobi-inversjon
**Begrunnelse:** Newton-Raphson-løseren i GridMaster Edu bruker Gauss-eliminasjon med partiell pivotering for å løse J·x = b i hvert NR-steg. Rask LU-dekomposisjon (f.eks. LAPACK-stil) er mer effektiv for store matriser (n > 100), men for pedagogiske nett på 2–20 busser er O(n³) Gauss-kost ubetydelig (< 1 ms). Gauss er enklere å forstå og debugge — dette er et undervisningsverktøy, ikke et produksjons-kraftsystemsimuleringsprogram. Bytte til LU kan gjøres i Sprint 8+ ved behov for større nett.

**How to apply:** `gaussSolve()` i `newton-raphson.ts` bruker partiell pivotering og er numerisk stabil for vel-kondisjonerte Jacobi-matriser (typisk nett med balanserte impedanser).

### BESLUTNING 12: Fasit scenario 1 korrigert etter analytisk verifikasjon og PL-godkjenning
**Begrunnelse:** Opprinnelig fasit (133 A, 2.1 %) var feil beregnet av PL-prosjektet. Etter analytisk verifikasjon (kvadratisk ligning, se beslutning 9) og gjennomgang med PL 2026-05-11 er korrekt fasit bekreftet:
- V₂ = 0.952 p.u., ΔU = 4.8 %
- I_linje = 148 A (±3 A)
- Aktive tap = 198 kW (±10 kW)

Teststoleranser oppdatert i `newton-raphson.test.ts`. Newton-Raphson-implementasjonen er uendret og korrekt.

---

## 2026-05-11 — Sprint 3

### BESLUTNING 13: SVG-animasjon via requestAnimationFrame (ikke CSS transitions på geometri)
**Begrunnelse:** PowerTriangle.tsx krever smooth 300 ms-animasjon av SVG-koordinater (Q₂-linjen og S₂-hypotenusens endepunkt) når cosφ₂-slideren endres. To alternative tilnærminger ble vurdert:

1. **CSS transitions på SVG geometry properties (SVG 2-spec)**: Setter x1/y1/x2/y2 som CSS-egenskaper via `style`-objektet (f.eks. `style={{ y2: s2Y } as unknown as React.CSSProperties}`). Virker i Chrome 77+/Firefox 72+ via SVG 2-spec, men krever `as unknown`-cast for TypeScript og er ikke garantert i alle miljøer.

2. **requestAnimationFrame med ease-in-out interpolasjon** (valgt): En liten `useAnimated(target, ms)`-hook animerer verdien i JavaScript og setter React state. Ren TypeScript, fungerer i alle nettlesere, ingen external dependencies, og gir nøyaktig 300 ms ease-in-out som spesifisert. Overhead er ubetydelig for et pedagogisk verktøy med 1–3 animerte verdier.

**How to apply:** `useAnimated()`-hook bor lokalt i `PowerTriangle.tsx`. Animerer `q2MVAr`-verdien; alle avledede SVG-posisjoner beregnes fra denne. Hvis mer avansert animasjon trengs i fremtidige sprints (f.eks. Framer Motion), er hook-grensesnittet lett å bytte ut.

---

## 2026-05-11 — Sprint 3.5

### BESLUTNING 14: Supabase anon-nøkkel er trygg i frontend — service_role er ikke det
**Begrunnelse:** Supabase-klienten i `src/lib/supabase.ts` bruker kun `VITE_SUPABASE_ANON_KEY`. Denne nøkkelen er designet for offentlig bruk og respekterer RLS-policyer på `projects`-tabellen. `service_role`-nøkkelen omgår RLS og må aldri brukes i frontend-kode. Miljøvariabelen `VITE_SUPABASE_ANON_KEY` er trygg å eksponere i klient-bygget siden den ikke gir administratortilgang.

**How to apply:** Aldri legg `service_role`-nøkkelen i `.env.local` eller noen frontend-fil. Den brukes kun i server-side Edge Functions eller backend.

### BESLUTNING 15: `validateProject()` brukes for sky-lasting — samme pipeline som lokal .gmx
**Begrunnelse:** `loadFromCloud()` kaller `validateProject(data.gmx_data)` på dataene fra Supabase. Dette gir identisk validering og null-koalescing av valgfrie arrays (`generators`, `compensators` osv.) som ved lokal filinnlasting. Alternativet (anta at sky-data alltid er korrekt) ville gitt skjult feil hvis et gammelt prosjekt manglet nye felt introdusert i en sprint.

**How to apply:** Alle datakilder (lokal .gmx, sky, legacy-import) skal gjennom `validateProject()` før `storeLoad()` kalles.

### BESLUTNING 11: Fargeterskler for canvasfargekoding — REN 4100-basert
**Begrunnelse:** Spenningsgrenser for fargekoding i `BusNode.tsx` og `ResultPanel.tsx`:
- V > 1.05 p.u. → oransje (høy spenning, utenfor normaldrift iht. EN 50160)
- 0.95–1.05 p.u. → grønn (normal driftssone)
- 0.90–0.95 p.u. → gul (lav spenning, varsel)
- < 0.90 p.u. → rød (kritisk — brudd på REN 4100 §5.3 krav)

Disse grensene tilsvarer EN 50160 ±10 % og REN 4100-retningslinjene for distribusjonsnett i Norge.
