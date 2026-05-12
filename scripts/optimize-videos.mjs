import {readdir, stat, rename, unlink} from 'node:fs/promises'
import {spawn} from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'public')

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {stdio: ['ignore', 'pipe', 'pipe']})
    let err = ''
    p.stderr.on('data', d => (err += d.toString()))
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(err.slice(-500)))))
  })
}

const rel = p => path.relative(ROOT, p).replace(/\\/g, '/')

const files = (await walk(ROOT)).filter(f => /\.mp4$/i.test(f))
let savedBytes = 0

for (const file of files) {
  const before = (await stat(file)).size
  const tmp = file.replace(/\.mp4$/i, '.opt.mp4')
  console.log(`encoding ${rel(file)} (${(before / 1024 / 1024).toFixed(1)}MB)...`)
  await run('ffmpeg', [
    '-y',
    '-i',
    file,
    '-vf',
    "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    tmp,
  ])
  const after = (await stat(tmp)).size
  if (after < before) {
    await unlink(file)
    await rename(tmp, file)
    savedBytes += before - after
    console.log(`  -> ${(after / 1024 / 1024).toFixed(1)}MB (-${(((before - after) / before) * 100).toFixed(0)}%)`)
  } else {
    await unlink(tmp)
    console.log('  -> bigger, kept original')
  }
}

console.log('\nvideo saved:', (savedBytes / 1024 / 1024).toFixed(2), 'MB')
