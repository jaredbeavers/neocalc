# NeoCalc

Neonatal quick reference, installable as a mobile web app.

| Tab | Content | Needs |
| --- | --- | --- |
| **CODE** | Resuscitation (from `NEOCODE`) | weight (GA for maintenance rate) |
| **RSI** | ETT size and depth, premedication, surfactant | weight (GA for lorazepam guidance) |
| **Meds** | Searchable NICU drug compendium with doses for the patient | weight; GA + day of life for age-based regimens |
| More → **Fluids** | Total fluid goal (from `totalfluidcalculator`) | weight, GA, day of life |
| More → **Feeds** | Enteral feeds (from `enteralfeeds`) | weight |
| More → **GIR** | GIR and total fluid intake (from `gircalculator`) | weight |
| More → **Calcs** | BSA, blood volume, exchange transfusions, OI, compliance, anion gap, FENa, Ca-Phos, osmolality | varies |

Enter weight (kg or g), gestational age at birth (weeks + days) and day of life once on the **Patient** screen; every tab uses them.
Day of life 1 is the day of birth (postnatal age = DOL − 1). Inputs are kept only for the current app session and are cleared with **New patient**.

> Reference tool only. Verify all calculations against institutional protocols.

## Data copied from the NICU Guidebook

RSI, Meds and Calcs use reference data **copied** from the NICU Guidebook project. NeoCalc keeps its own copies and never reads
the guidebook's files, so the two projects can change independently.

| File | Contents | Guidebook source |
| --- | --- | --- |
| `data/guidebook-rsi.js` | ETT table, premedication, surfactant | data table 51, calculators 300005–6, entries 200155, 394, 200142, 470 |
| `data/guidebook-meds.js` | 158 published drug entries, tables and age/weight dose rules | `nicu.db` (schema v2), copied 2026-10-18 |
| `data/guidebook-calcs.js` | 11 calculators | calculators 300001, 300004, 300010–300018 |

`js/dosing.js` is NeoCalc's own copy of the dose-matching and per-kg arithmetic. `js/sections.js` draws the RSI, Meds and Calcs screens.

## Files to publish

```
index.html
manifest.webmanifest
sw.js
data/   (3 files)
js/     (2 files)
icons/  (4 files)
```

## Host on GitHub Pages

1. On github.com, create a new **public** repository (e.g. `neocalc`).
2. **Add file → Upload files**, drag in the files and folders above, and commit.
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
4. After about a minute the app is live at `https://<your-username>.github.io/neocalc/`.

## Install on a phone

- **iPhone (Safari):** open the link → Share → **Add to Home Screen**.
- **Android (Chrome):** open the link → ⋮ menu → **Install app** / **Add to Home screen**.

It opens full-screen like a native app and works offline after the first visit.

## Updating

Edit and re-upload the changed files. To make installed copies refresh promptly, also bump `CACHE` in `sw.js`
(e.g. `neocalc-v2` → `neocalc-v3`).
