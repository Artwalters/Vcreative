import {readFile, writeFile} from 'node:fs/promises'

const FILES = [
  'app/page.tsx',
  'app/cases/page.tsx',
  'app/cases/caseData.ts',
  'app/components/LogoMarquee.tsx',
]

// Paths that must remain unchanged (3D textures, models, glb, mp4)
const SKIP_PREFIXES = ['/icons/3D/', '/icons/SVG/', '/noises/']

// Convert refs like /images/x.png or /cases/y/z.jpg to .webp,
// unless under a skip prefix or already webp/glb/mp4/svg.
function rewrite(content) {
  // Match string-quoted paths like '/foo/bar.png' or "/foo/bar.jpg"
  return content.replace(/(['"`])(\/[^'"`\s]+?\.(?:png|jpe?g))\1/gi, (full, q, ref) => {
    if (SKIP_PREFIXES.some(p => ref.startsWith(p))) return full
    const next = ref.replace(/\.(png|jpe?g)$/i, '.webp')
    return `${q}${next}${q}`
  })
}

for (const f of FILES) {
  const src = await readFile(f, 'utf8')
  const out = rewrite(src)
  if (out !== src) {
    await writeFile(f, out)
    console.log('updated', f)
  } else {
    console.log('no change', f)
  }
}
