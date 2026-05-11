# GridMaster Edu

Interaktiv læringsarena for fagskolestudenter innen elektrisk kraft.
Fagkode: 00TE13I — Elektrisk kraftproduksjon og distribusjon
Skole: Malakoff Videregående skole

---

## Kom i gang

**Arbeidsmappe:** `D:\Claude\GridMaster\gridmaster-edu\`

```powershell
cd D:\Claude\GridMaster\gridmaster-edu
npm install
npm run dev
```

Åpne nettleseren på `http://localhost:5173`

---

## Tilgjengelige kommandoer

```powershell
# Start utviklingsserver (hot-reload)
npm run dev

# Kjør Vitest-tester
$env:TEMP = "D:\Claude\GridMaster\gridmaster-edu\node_modules\.tmp"
npm test

# TypeScript type-sjekk
npx tsc -b

# Produksjonsbygg
npm run build
```

> **NB om npm test på Windows 10:** Vitest v4 forsøker å skrive til `C:\Windows\Temp\`
> som er UAC-begrenset. Sett `$env:TEMP` til lokal mappe før `npm test` (se over).

---

## Teknisk stack

| Teknologi | Versjon | Bruk |
|-----------|---------|------|
| Vite | 8+ | Build og dev-server |
| React | 19 | UI-rammeverk |
| TypeScript | 6 (strict) | Typesikkerhet |
| React Flow | 11 | Enlinjeskjema-canvas |
| Zustand | 5 | Global state |
| Tailwind CSS | 4 | Mørkt tema (navy/cyan) |
| Vitest | 4 | Unit-testing av beregningskjerne |
| sharp | 0.34 | Bildebehandling (vannmerke-fjerning) |

---

## Mappestruktur

```
gridmaster-edu/
├── public/
│   ├── logo.png
│   ├── splash.png
│   └── icons/          # bus-slack, bus-pq, transformer, generator, capacitor, overhead-line, cable
├── src/
│   ├── types/
│   │   └── index.ts    # Alle GmxProject-typer (enkelt eksportpunkt)
│   ├── core/
│   │   ├── math.ts     # Komplekse talloperasjoner (cadd/csub/cmul/cdiv/cabs/carg/cconj/cpolar)
│   │   └── math.test.ts
│   ├── store/
│   │   └── useNetworkStore.ts  # Zustand store
│   ├── components/
│   │   ├── canvas/     # NetworkCanvas, BusNode, LineEdge
│   │   └── toolbar/    # Toolbar (lagre/laste/importer)
│   ├── io/
│   │   └── gmx.ts      # saveProject, loadProject, validateProject, importLegacyGmx
│   └── scenarios/      # 3 Gemini-testscenarier (Gemini-feltformat)
├── CHANGELOG.md
├── DEVLOG.md
└── README.md           # denne filen
```

---

## Prosjektfil (.gmx)

Prosjekter lagres som `.gmx`-filer (ren UTF-8 JSON). Bruk **Lagre .gmx** i toolbar.
For å laste inn Gemini-scenarier (feltformat avviker), bruk **Importer scenario**.

---

## Fargepalett

| Token | Hex | Bruk |
|-------|-----|------|
| navy | `#0D3B66` | Bakgrunn for ikoner, knapperammer |
| blue | `#1565C0` | Kantkant for linjer, knapper |
| cyan | `#4FC3F7` | Aksentfarge, spenningsetiketter |
| green | `#1A5C3A` | Import-knapp |
| surface | `#1A2A3A` | Panel-bakgrunn |
| text | `#E8F0FE` | Brødtekst |

---

## Sprintplan

| Sprint | Innhold | Status |
|--------|---------|--------|
| 1 | Infrastruktur, canvas, .gmx I/O | ✓ v1.0.0 |
| 2 | Newton-Raphson, Y-bussmatrise | Neste |
| 3 | Fasekompensering, effekttrekant | — |
| 4–12 | Se GridMaster_Edu_Spec_v1.0.docx | — |
