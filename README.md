# NeoCalc

Neonatal quick reference that combines four earlier tools into one installable mobile web app:

| Tab | Replaces | Needs |
| --- | --- | --- |
| **CODE** | `NEOCODE` | weight (GA for maintenance rate) |
| **Fluids** | `totalfluidcalculator` | weight, GA, day of life |
| **Feeds** | `enteralfeeds` | weight |
| **GIR** | `gircalculator` | weight |

Enter weight (kg or g), gestational age (weeks + days) and day of life once on the **Patient** screen; every tab uses them.
Inputs are kept only for the current app session and are cleared with **New patient**.

> Reference tool only. Verify all calculations against institutional protocols.

## Files to publish

```
index.html
manifest.webmanifest
sw.js
icons/
  icon.svg
  icon-192.png
  icon-512.png
  apple-touch-icon.png
```

## Host on GitHub Pages

1. On github.com, create a new **public** repository (e.g. `neocalc`).
2. **Add file → Upload files**, drag in the files above (keep the `icons` folder), and commit.
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
4. After about a minute the app is live at `https://<your-username>.github.io/neocalc/`.

## Install on a phone

- **iPhone (Safari):** open the link → Share → **Add to Home Screen**.
- **Android (Chrome):** open the link → ⋮ menu → **Install app** / **Add to Home screen**.

It opens full-screen like a native app and works offline after the first visit.

## Updating

Edit and re-upload `index.html`. To make installed copies refresh promptly, also bump `CACHE` in `sw.js`
(e.g. `neocalc-v1` → `neocalc-v2`).
