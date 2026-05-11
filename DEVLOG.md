# DEVLOG — GridMaster Edu

Tekniske beslutninger og begrunnelser. Oppdateres ved hvert viktig valg.

---

## 2026-05-11 — Sprint 1

### BESLUTNING 1: Complex = [number, number] tuple, ikke klasse/objekt
**Begrunnelse:** Y-bussmatrisen i Sprint 2 vil inneholde potensielt 100×100 komplekse tall. En tuple `[re, im]` er direkte destrukturerbar, serialiserbar til JSON uten spesialbehandling, og eliminerer class-overhead i hot-paths. `mathjs` Complex-objekter ville krevd wrapper-funksjoner for all aritmetikk. Ulempe: ingen `.real`/`.imag` property-syntax — men JSDoc-navngivning kompenserer.

### BESLUTNING 2: Zustand istedenfor Redux
**Begrunnelse:** GridMaster Edu har én global nettmodell uten kompleks async-logikk. Redux + Toolkit ville gitt ~3× mer boilerplate (actions/reducers/selectors) uten gevinst. Zustand gir samme type-safety med direkte mutasjonsmønster via immer-lik API. Bytte til Redux er mulig uten breaking changes i Sprint 3+ ved behov for devtools/tid-reise-debugging.

### BESLUTNING 3: Vitest temp-dir overkjøres via $env:TEMP
**Begrunnelse:** Vitest v4 forsøker å skrive til `C:\Windows\Temp\` som er begrenset av UAC på Windows 10. Løst ved å sette `$env:TEMP` til lokal prosjektmappe og legge `cache.dir` i `node_modules/.vitest`. Alternativet (kjøre som admin) ble avvist — aldri kjør devtools som admin uten behov.

### BESLUTNING 4: importLegacyGmx() kaster eksplisitt feil ved manglende påkrevde felt
**Begrunnelse:** Scenario-filer fra Gemini mangler sporadisk felt. `requireField<T>()` helper kaster `Error('importLegacyGmx: required field "<navn>" is missing in <context>')`. Dette gjør det umiddelbart synlig HVILKE felt som mangler, uten at brukeren ser en kryptisk undefined-feil i konsollen. Kritisk for pedagogisk bruk.

### BESLUTNING 5: ratingMVA beregnes fra I_max_A × Vn_kV × √3 / 1000
**Begrunnelse:** Gemini bruker amperebegrensning (`I_max_A`) mens GmxProject bruker MVA-begrensning (`ratingMVA`). Konvertering: S = √3 × U × I gir korrekt trefase-MVA. Vn hentes fra `fromBusId`-bussen. Null-fallback sikrer ingen divisjon-feil.

### BESLUTNING 6: Vannmerke-cropping med sharp (60px fra høyre og bunn)
**Begrunnelse:** Gemini Imagen 3 legger automatisk til et stjerne-vannmerke i hjørnet (ca 60×60px) på alle genererte bilder. `sharp.extract()` er raskere og mer presis enn canvas-basert løsning for batch-prosessering. Script kjøres én gang ved setup — resulterende ikoner er 1988×1988px (ned fra 2048×2048).

### BESLUTNING 7: @tailwindcss/vite brukt istedenfor PostCSS-plugin
**Begrunnelse:** Tailwind CSS v4 anbefaler `@tailwindcss/vite` som Vite-plugin fremfor den tradisjonelle PostCSS-tilnærmingen. Dette eliminerer behov for `tailwind.config.js` og `postcss.config.js` — konfigurasjonen skjer direkte i CSS via `@import "tailwindcss"`.
