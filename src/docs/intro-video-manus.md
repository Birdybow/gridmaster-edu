# GridMaster Edu — Intro-video manus
**Versjon:** v13.0.0  
**Målgruppe:** Elektrofagelever, Vg2/Vg3 (00TE13I)  
**Lengde:** 5–7 minutter (30 scener, ~10–15 s per scene)  
**XTTS v2 voice cloning:** Tilpasset Bårds stemme — rolig og pedagogisk tone

---

## Generelle instrukser til voiceover
- Snakk sakte og tydelig
- Bruk fagtermer naturlig, forklar ved første bruk
- Varm og engasjerende tone — ikke for formell
- Norsk bokmål

---

## Scener

### Scene 1 — Velkomst (0:00–0:12)
**Skjerm:** Logoanimasjon + tittelskjerm "GridMaster Edu v1.0"  
**Voiceover:**  
"Velkommen til GridMaster Edu — et interaktivt læringsprogram for nettberegning i elektrofaget. I denne videoen får du en rask gjennomgang av alt programmet kan."

---

### Scene 2 — Startskjermen (0:12–0:25)
**Skjerm:** App starter, canvas er tomt  
**Voiceover:**  
"Når du åpner programmet, ser du arbeidsflaten. Til venstre er komponentpanelet, verktøylinja er øverst, og arbeidsflaten er i midten. La oss bygge et enkelt kraftnett."

---

### Scene 3 — Legge til busser (0:25–0:45)
**Skjerm:** Dra slack-buss og PQ-buss inn på canvas  
**Voiceover:**  
"Dra en slack-buss og en last-buss inn på arbeidsflaten. Slack-bussen er referansepunktet i nettet — den holder spenningen fast mens Newton-Raphson-beregningen kjøres."

---

### Scene 4 — Koble med linje (0:45–1:00)
**Skjerm:** Klikk på linje-knapp, tegn linje mellom bussene  
**Voiceover:**  
"Koble bussene med en linje. Velg linjetypen — luftlinje eller kabel — og sett parametrene: motstand, reaktans og lengde."

---

### Scene 5 — Redigere buss (1:00–1:18)
**Skjerm:** Klikk på buss, editorpanel åpner til høyre  
**Voiceover:**  
"Klikk på en buss for å redigere. Du kan sette lastkraft, reaktivt uttak og spenningsgrenser. Grønn betyr innenfor toleranse, rød betyr brudd."

---

### Scene 6 — Kjøre lastflyt (1:18–1:40)
**Skjerm:** Klikk "Kjør lastflyt", canvas oppdateres med fargekoding  
**Voiceover:**  
"Trykk Kjør lastflyt. Programmet bruker Newton-Raphson-metoden og konvergerer vanligvis på under ti iterasjoner. Bussene farges grønne, gule eller røde basert på spenningsnivå."

---

### Scene 7 — Lese resultater (1:40–1:55)
**Skjerm:** Resultatpanel i bunn — busser og linjer  
**Voiceover:**  
"Resultattabellen viser spenning, aktiv og reaktiv effekt for hver buss, og strøm og tap for hver linje. Her ser du fasitsvaret: strøm 148 ampere og spenningsfall 4,76 prosent."

---

### Scene 8 — Spenningsfall (1:55–2:15)
**Skjerm:** Klikk Spenningsfall, velg linje, se resultat  
**Voiceover:**  
"I spenningsfallsmodulen beregner vi nøyaktig hvor mye spenningen faller langs linjen. For korte linjer brukes enkel formel, for lange linjer over 50 kilometer brukes pi-modellen automatisk."

---

### Scene 9 — REN-regler (2:15–2:35)
**Skjerm:** Klikk REN-knapp, advarselspanel åpner  
**Voiceover:**  
"Trykk på REN-knappen for å sjekke at nettet oppfyller norske elektrotekniske normer. Programmet sjekker spenningsfall, kabelkapasitet, kortslutningsvern og jordfeil automatisk."

---

### Scene 10 — Kortslutning IEC 60909 (2:35–2:55)
**Skjerm:** Velg buss, klikk Kortslutning, se Ik3p  
**Voiceover:**  
"Kortslutningsmodulen beregner trepolet og topolet feil etter IEC 60909. Fasitsvaret her er 1252 ampere for trepolet kortslutning, med støtfaktor på 2,557 kiloampere."

---

### Scene 11 — Vernkoordinering (2:55–3:15)
**Skjerm:** Legg til vern på linje, kjør selektivitetssjekk  
**Voiceover:**  
"I vernmodulen plasserer du over­strømsvern på linjene og definerer TMS-innstillingene. Selektivitetssjekken kontrollerer at det er minimum 200 millisekunder mellom utløsningstidene."

---

### Scene 12 — Ringnett (3:15–3:30)
**Skjerm:** Bygg ringnett, kjør beregning  
**Voiceover:**  
"GridMaster Edu beregner også ringnettverk. Ved symmetrisk 3-buss ringnett er fasitstrømmen 83 ampere i begge retninger, med 75 prosent tapsreduksjon mot radialnettet."

---

### Scene 13 — Fasekompensering (3:30–3:45)
**Skjerm:** Kompenseringspanel, sett cosPhi-mål  
**Voiceover:**  
"Kompenseringspanelet beregner optimal kondensatorbank for å heve effektfaktoren. Fra cosinus-fi 0,85 til 0,95 trenger vi cirka 0,99 megavar."

---

### Scene 14 — Kraftproduksjon (3:45–4:00)
**Skjerm:** Generator-editor, velg Francis, sett H og Q  
**Voiceover:**  
"Produksjonsmodulen støtter vannkraft, vindkraft, solenergi og kjernekraft. En Francis-turbin med 200 meter fallhøyde, 50 kubikkmeter per sekund og 92 prosent virkningsgrad gir 90 megawatt."

---

### Scene 15 — Tidsserie (4:00–4:15)
**Skjerm:** Tidsserieplot over 24 timer  
**Voiceover:**  
"Tidsseriesimuleringen viser last og produksjon over 24 timer. Kl. 12 er det et produksjonsoverskudd på 1,5 megawatt, mens kl. 03 er det underskudd på 2,2 megawatt."

---

### Scene 16 — Per-unit (4:15–4:28)
**Skjerm:** Per-unit panel, normaliser mot 100 MVA / 22 kV  
**Voiceover:**  
"Per-unit-panelet normaliserer alle verdier mot valgt base. Med 100 MVA og 22 kilovolt som base ser du alle impedanser og strømmer som dimensjonsløse størrelser."

---

### Scene 17 — Jordfeil (4:28–4:42)
**Skjerm:** Jordfeilpanel, IT-nett, Petersen-spole  
**Voiceover:**  
"Jordfeilmodulen beregner kapasitiv jordfeilstrøm for IT-nett og Petersen-spole-kompensering. REN blad 9001 krever jordmotstand under 100 ohm for IT-nett."

---

### Scene 18 — CSV-eksport (4:42–4:55)
**Skjerm:** Klikk CSV, last ned fil, åpne i Excel  
**Voiceover:**  
"Eksporter alle resultater til CSV med semikolonseparator og UTF-8-tegnsett — klar til import i Excel og andre regnearkprogrammer."

---

### Scene 19 — PDF-rapport (4:55–5:10)
**Skjerm:** Klikk Rapport, velg seksjoner, generer PDF  
**Voiceover:**  
"PDF-rapporten inneholder alle beregningsseksjoner du velger: énlineskjema, lastflyt, kortslutning og mer. Rapporten er klar til innlevering med prosjektnavn og studentnavn."

---

### Scene 20 — Lagre og åpne prosjekt (5:10–5:22)
**Skjerm:** Lagre .gmx, åpne igjen  
**Voiceover:**  
"Prosjektet lagres som en .gmx-fil som du kan åpne igjen senere. Eldre filer migreres automatisk til nyeste versjon ved åpning."

---

### Scene 21 — Skylagring (5:22–5:33)
**Skjerm:** Lagre til sky, skriv inn navn  
**Voiceover:**  
"Ønsker du å lagre i skyen, kan du bruke sky-funksjonen. Prosjektet ditt er da tilgjengelig fra alle enheter med nettilgang."

---

### Scene 22 — Scenariobibliotek (5:33–5:45)
**Skjerm:** Åpne scenariobibliotek, last inn ferdig nett  
**Voiceover:**  
"I scenariobiblioteket finner du ferdigbygde nettverk for læring. Disse er designet for å øve på ulike beregningsmetoder."

---

### Scene 23 — Formelark (5:45–5:55)
**Skjerm:** Åpne formelark  
**Voiceover:**  
"Formelarket samler alle nøkkelformler gruppert per tema. Nyttig å ha åpen under beregninger eller eksamen."

---

### Scene 24 — Onboarding-tour (5:55–6:05)
**Skjerm:** Klikk Vis omvisning, tour starter  
**Voiceover:**  
"Vil du ha en guidet omvisning i programmet, trykker du på Vis omvisning. Turens sju steg viser deg alle hovedfunksjonene trinn for trinn."

---

### Scene 25 — Hjelpeside (6:05–6:15)
**Skjerm:** Åpne hjelpesiden  
**Voiceover:**  
"Hjelpesiden inneholder formler, REN-regler og fasitsvar for alle scenarier — alltid bare et klikk unna."

---

### Scene 26 — Responsivt design (6:15–6:22)
**Skjerm:** Endre vindusbredde, layout tilpasser seg  
**Voiceover:**  
"GridMaster Edu fungerer på skjermstørrelser fra 1280 piksler og oppover — både bærbar PC og desktop."

---

### Scene 27 — Tilgjengelighetsfunksjoner (6:22–6:30)
**Skjerm:** Vis tooltips på paneler  
**Voiceover:**  
"Alle analysepaneler har hjelpe-ikoner med forklaringer og formler. Hold musepekeren over spørsmålstegnet for å lese."

---

### Scene 28 — Versjon og migrasjon (6:30–6:38)
**Skjerm:** Migrasjonsbanner, versjonsnummer  
**Voiceover:**  
"Programmet er nå i versjon 1.0 og produksjonsklar. Prosjektfiler fra tidligere versjoner migreres automatisk."

---

### Scene 29 — Takk og info (6:38–6:50)
**Skjerm:** Tittelskjerm med logo og kontaktinfo  
**Voiceover:**  
"GridMaster Edu er utviklet ved Malakoff Videregående skole for kurset 00TE13I. God læring — og lykke til med nettberegningene!"

---

### Scene 30 — Sluttkort (6:50–7:00)
**Skjerm:** Logobanner + nettadresse gridmaster-edu.vercel.app  
**Voiceover:**  
"Du finner programmet på gridmaster-edu.vercel.app. Følg med på oppdateringer og nye funksjoner."

---

## Tekniske noter
- Innspilingsoppløsning: 1920×1080
- Skjermopptak: OBS Studio anbefales
- Klippeverktøy: DaVinci Resolve / CapCut
- XTTS v2: Bruk originalt voiceover-opptak av Bård som referanse
- Bakgrunnsmusikk: Rolig ambient, volum −18 dB under voiceover
