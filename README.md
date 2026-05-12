# GridMaster Edu v1.0.0

**Interaktiv læringsarena for nettberegning i elektrofaget**  
Fagkode: 00TE13I — Elektrisk kraftproduksjon og distribusjon  
Skole: Malakoff Videregående skole  
Versjon: v1.0.0 / v13.0.0 (produksjonsklar)

**Live demo:** [gridmaster-edu.vercel.app](https://gridmaster-edu.vercel.app)

---

## Funksjoner

| Modul | Beskrivelse |
|---|---|
| **Nettbygger** | Bygg kraftnett med busser, linjer og transformatorer på canvas |
| **Lastflyt** | Newton-Raphson (NR) med iterasjonslogg |
| **Spenningsfall** | Enkel formel (< 50 km) og pi-modell (≥ 50 km) |
| **Kortslutning** | IEC 60909 — Ik3p, Ik2p, ip (støtfaktor) |
| **Fasekompensering** | Qkomp-beregning med effekttriangel |
| **Ringnett** | Symmetrisk og asymmetrisk strømdeling, tapsammenligning |
| **Vernkoordinering** | Reléinnstilling, selektivitetssjekk, OC-kurver |
| **Jordfeil** | IT-nett, TN-nett, Petersen-spole |
| **Kraftproduksjon** | Vannkraft (Francis/Pelton/Kaplan), vind, sol, kjernekraft |
| **Tidsserie** | Lastprofil og produksjonsprofil over 24 timer |
| **Per-unit** | Normalisering mot valgbar S_base/U_base |
| **REN-advarsler** | Automatisk sjekk mot REN blad 4004/6002/7002/9001 |
| **PDF-rapport** | A4-rapport med alle beregningsseksjoner (jsPDF) |
| **CSV-eksport** | Semikolonseparert, UTF-8 BOM — Excel-klar |
| **Skylagring** | Supabase-backend for deling mellom enheter |

---

## Kom i gang

```powershell
cd D:\Claude\GridMaster\gridmaster-edu
npm install
npm run dev
```

Åpne nettleseren på `http://localhost:5173`

---

## Faglig bakgrunn

Beregningene er basert på:
- **IEC 60909** — Kortslutningsstrøm i trefasede vekselspenningssystemer
- **IEC 60255-151** — Invers-tid overstrømsrelé (standard/very/extremely inverse)
- **NEK IEC 60038** — Standardspenninger 0.23–420 kV
- **REN blad 4004/6002/7002/9001** — Norsk Elektroteknisk Norm
- Newton-Raphson-metoden for lastflyt (iterativ, polar koordinater)

### Fasitsvar (verifisert i Vitest)

| Beregning | Resultat |
|---|---|
| NR lastflyt | I = 148 A, ΔU = 4.76% |
| Fasekompensering | Qkomp ≈ 0.991 MVAr |
| Vannkraft Francis | P = 90.252 MW (H=200, Q=50, η=0.92) |
| Kortslutning I''k3p | 1.252 kA |
| Kortslutning I''k2p | 1.084 kA |
| Støtfaktor ip | 2.557 kA |
| Ringnett IA = IB | 83 A (symmetrisk) |
| Vernkoordinering SI | t = 0.429 s |
| Vernkoordinering VI | t = 0.338 s |
| Tidsserie kl.12 | −1.552 MW (overskudd) |
| Tidsserie kl.03 | +2.2 MW (underskudd) |

---

## Testing

```powershell
# Unit-tester (Vitest)
npm test
# 260 tester, 16 testfiler

# E2E-tester (Playwright)
npm run test:e2e
```

---

## Teknisk stack

| Lag | Teknologi |
|---|---|
| UI | React 19 + TypeScript + Vite |
| Canvas | React Flow (reactflow) |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (skylagring) |
| PDF | jsPDF + jspdf-autotable + html2canvas |
| Tester | Vitest + Playwright |
| Deploy | Vercel (kontinuerlig fra main) |

---

## Bygg og deploy

```powershell
npx tsc -b    # TypeScript-sjekk (matcher Vercels gate)
npm run build # Produksjonsbygg
```

Push til `main` → automatisk Vercel-deploy.

---

## Lisens og opphavsrett

© 2026 Bård Reinton-Kjellhov  
Malakoff Videregående skole — 00TE13I  
Utviklet med Claude Code (Anthropic)
