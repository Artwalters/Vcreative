## Styling regels

- Alle sizing (font-size, padding, margin, width, height, gap, border-radius etc.) in `em` — NOOIT vaste `px` waardes
- Figma waardes omrekenen: gedeeld door 16 = em waarde (bijv. 32px in Figma → 2em in code)
- Het Osmo fluid scaling system zit in globals.css — `var(--size-font)` op body, alles schaalt automatisch mee
