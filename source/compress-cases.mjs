/* One-shot compressor for case JPG/PNG assets that arrived raw from the
   camera. Anything > 2 MB gets re-encoded in place: width capped at 2400px,
   JPEG quality 85, PNG palette/level 9. Idempotent — re-running on already
   compressed files is harmless because they fall under the size threshold.

   Usage: node source/compress-cases.mjs */

import {readdirSync, statSync, renameSync, unlinkSync} from 'node:fs'
import {join} from 'node:path'
import sharp from 'sharp'

const ROOT = new URL('../public/cases/', import.meta.url).pathname.replace(/^\//, '')
const MAX_BYTES = 2 * 1024 * 1024
const MAX_WIDTH = 2400

const walk = (dir) => {
  const out = []
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const isJpg = (f) => /\.jpe?g$/i.test(f)
const isPng = (f) => /\.png$/i.test(f)

const files = walk(ROOT).filter((f) => isJpg(f) || isPng(f))
let totalSavedBytes = 0
let touched = 0

for (const file of files) {
  const before = statSync(file).size
  if (before < MAX_BYTES) continue

  const tmp = `${file}.tmp`
  let pipeline = sharp(file).rotate().resize({width: MAX_WIDTH, withoutEnlargement: true})

  if (isJpg(file)) pipeline = pipeline.jpeg({quality: 85, mozjpeg: true})
  else pipeline = pipeline.png({compressionLevel: 9, palette: true})

  await pipeline.toFile(tmp)

  const after = statSync(tmp).size
  if (after >= before) {
    unlinkSync(tmp)
    console.log(`= ${file.replace(ROOT, '')} (${(before / 1024 / 1024).toFixed(2)} MB) — already smaller`)
    continue
  }

  unlinkSync(file)
  renameSync(tmp, file)
  totalSavedBytes += before - after
  touched++
  console.log(
    `✓ ${file.replace(ROOT, '')} ${(before / 1024 / 1024).toFixed(2)} → ${(after / 1024 / 1024).toFixed(2)} MB`,
  )
}

console.log(
  `\nDone. ${touched} file(s) compressed, ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB saved.`,
)
