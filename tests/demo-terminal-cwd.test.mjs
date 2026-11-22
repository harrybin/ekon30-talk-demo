import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('all Demo Time terminal commands work from nested directories', {
  skip: process.platform !== 'win32',
}, async () => {
  const build = join(root, 'build')
  await mkdir(build, { recursive: true })
  const temp = await mkdtemp(join(build, 'demo cwd test '))
  try {
    const workspace = join(temp, '.run', 'baseline')
    const nested = join(workspace, 'build', 'subfolder')
    await mkdir(nested, { recursive: true })
    await writeFile(join(temp, 'demo.mjs'), 'console.log(JSON.stringify(process.argv.slice(2)))\n')
    const seen = new Set()
    let count = 0
    for (const name of ['sdd-talk.json', 'context-setup-talk.json']) {
      const act = JSON.parse(await readFile(join(root, 'demotime', name), 'utf8'))
      for (const scene of act.scenes) {
        for (const move of scene.moves.filter(item => item.action === 'executeTerminalCommand')) {
          assert.match(move.command, /\{DT_WORKSPACE_PATH\}/)
          const command = move.command.replaceAll('{DT_WORKSPACE_PATH}', workspace)
          for (const cwd of [dirname(nested), nested]) {
            const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
              cwd,
              encoding: 'utf8',
            })
            assert.equal(result.status, 0, `${name}: ${scene.id}\n${result.stderr}`)
            seen.add(JSON.parse(result.stdout).join(' '))
          }
          count++
        }
      }
    }
    assert.equal(count, 10)
    assert.deepEqual(seen, new Set([
      'reset-baseline', 'run baseline', 'prepare-bmad-ticket', 'test baseline', 'test solution', 'diff',
    ]))
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('prepared act paths exist and ticket scene works from build', {
  skip: process.platform !== 'win32',
}, async () => {
  const build = join(root, 'build')
  await mkdir(build, { recursive: true })
  const temp = await mkdtemp(join(build, 'demo ticket test '))
  try {
    for (const name of ['demo.mjs', 'AGENTS.md', 'prd.md', 'spec.md', 'plan.md', 'fixtures', 'context', 'demotime']) {
      await cp(join(root, name), join(temp, name), { recursive: true })
    }
    for (const args of [['prepare'], ['init-bmad-commit', 'COMMIT']]) {
      const result = spawnSync(process.execPath, [join(temp, 'demo.mjs'), ...args], { cwd: temp, encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
    }
    const workspace = join(temp, '.run', 'baseline')
    const nested = join(workspace, 'build')
    await mkdir(nested, { recursive: true })
    let act
    for (const name of ['sdd-talk.json', 'context-setup-talk.json']) {
      const prepared = JSON.parse(await readFile(join(workspace, '.demo', name), 'utf8'))
      if (name === 'sdd-talk.json') act = prepared
      for (const scene of prepared.scenes) {
        for (const move of scene.moves) {
          for (const key of ['path', 'filePath']) {
            if (!move[key]) continue
            const content = await readFile(join(workspace, move[key]), 'utf8')
            if (move.startPlaceholder) assert.ok(content.includes(move.startPlaceholder), `${name}: ${scene.id} start`)
            if (move.endPlaceholder) assert.ok(content.includes(move.endPlaceholder), `${name}: ${scene.id} end`)
          }
          for (const match of (move.message ?? '').matchAll(/#file:([A-Za-z0-9_/-]+(?:\.[A-Za-z0-9_-]+)+)/g)) {
            await readFile(join(workspace, match[1]))
          }
        }
      }
    }
    const scene = act.scenes.find(item => item.id === 'sdd-s2')
    const move = scene.moves.find(item => item.action === 'executeTerminalCommand')
    const result = spawnSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command', move.command.replaceAll('{DT_WORKSPACE_PATH}', workspace),
    ], { cwd: nested, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(
      await readFile(join(workspace, '_bmad-output', 'backlog', 'ticket-sessions-je-track.md')),
      await readFile(join(temp, 'spec.md')),
    )
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: workspace, encoding: 'utf8' })
    assert.equal(status.status, 0, status.stderr)
    assert.equal(status.stdout, '')
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})
