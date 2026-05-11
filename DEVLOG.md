# DEVLOG — GridMaster Edu

Tekniske beslutninger og begrunnelser. Oppdateres ved hvert viktig valg.

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
