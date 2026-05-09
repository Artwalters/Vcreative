/* Print width × height + aspect ratio for every case asset, grouped per
   case folder. Used to decide which photo fits which container best. */

import {readdirSync, statSync} from 'node:fs'
import {join} from 'node:path'
import sharp from 'sharp'

const ROOT = new URL('../public/cases/', import.meta.url).pathname.replace(/^\//, '')

const cases = readdirSync(ROOT, {withFileTypes: true})
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

for (const slug of cases) {
  console.log(`\n=== ${slug} ===`)
  const dir = join(ROOT, slug)
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()
  for (const file of files) {
    const full = join(dir, file)
    const {width, height} = await sharp(full).metadata()
    if (!width || !height) continue
    const ratio = width / height
    const orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square'
    const sizeKB = (statSync(full).size / 1024).toFixed(0)
    console.log(
      `  ${file.padEnd(12)} ${String(width).padStart(5)}×${String(height).padEnd(5)} ` +
      `ratio ${ratio.toFixed(2).padStart(5)}  ${orientation.padEnd(9)} ${sizeKB} KB`,
    )
  }
}
