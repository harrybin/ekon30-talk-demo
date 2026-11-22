import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('locked Windows workspace reports partial reset and can be retried', {
  skip: process.platform !== 'win32',
}, async () => {
  const build = join(root, 'build')
  await mkdir(build, { recursive: true })
  const temp = await mkdtemp(join(build, 'reset-test-'))
  let holder
  const stopHolder = async () => {
    if (holder?.pid && holder.exitCode === null && holder.signalCode === null) {
      const stopped = once(holder, 'exit')
      holder.stdin.end()
      await stopped
    }
    holder = undefined
  }
  try {
    for (const name of ['demo.mjs', 'AGENTS.md', 'prd.md', 'spec.md', 'plan.md', 'fixtures', 'context', 'demotime']) {
      await cp(join(root, name), join(temp, name), { recursive: true })
    }
    const runner = join(temp, 'demo.mjs')
    const prepare = () => spawnSync(process.execPath, [runner, 'prepare'], { cwd: temp, encoding: 'utf8' })
    const reset = () => spawnSync(process.execPath, [runner, 'prepare', '--reset', 'RESET'], { cwd: temp, encoding: 'utf8' })
    assert.equal(prepare().status, 0)

    holder = spawn(process.execPath, ['-e', 'console.log("ready"); process.stdin.resume()'], {
      cwd: join(temp, '.run', 'baseline'),
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    await Promise.race([
      once(holder.stdout, 'data'),
      once(holder, 'exit').then(() => { throw new Error('Lock holder exited before becoming ready') }),
    ])
    const failed = reset()
    assert.equal(failed.status, 1)
    assert.match(failed.stderr, /Reset fehlgeschlagen:.*EBUSY/)
    assert.match(failed.stderr, /teilweise gelöscht/)
    assert.match(failed.stderr, /prüfen und bei Bedarf sichern/)
    assert.doesNotMatch(failed.stderr, /triggerUncaughtException/)

    await stopHolder()
    const retried = reset()
    assert.equal(retried.status, 0, retried.stderr)
    assert.deepEqual(
      await readFile(join(temp, '.run', 'baseline', 'SessionCatalog.pas')),
      await readFile(join(root, 'fixtures', 'baseline', 'SessionCatalog.pas')),
    )
    assert.deepEqual(
      await readFile(join(temp, '.run', 'solution', 'SessionCatalog.pas')),
      await readFile(join(root, 'fixtures', 'solution', 'SessionCatalog.pas')),
    )
  } finally {
    await stopHolder()
    await rm(temp, { recursive: true, force: true })
  }
})
