import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

async function workspace() {
  const build = join(root, 'build')
  await mkdir(build, { recursive: true })
  const temp = await mkdtemp(join(build, 'bmad-init-test-'))
  for (const name of ['demo.mjs', 'AGENTS.md', 'prd.md', 'spec.md', 'plan.md', 'fixtures', 'context', 'demotime']) {
    await cp(join(root, name), join(temp, name), { recursive: true })
  }
  return temp
}

function run(temp, ...args) {
  return spawnSync(process.execPath, [join(temp, 'demo.mjs'), ...args], {
    cwd: temp, encoding: 'utf8', env: { ...process.env, DISABLE_TELEMETRY: '1' },
  })
}

test('BMad init preserves an existing installation and unknown files', async () => {
  const temp = await workspace()
  try {
    assert.equal(run(temp, 'prepare').status, 0)
    const baseline = join(temp, '.run', 'baseline')
    const skill = join(baseline, '.agents', 'skills', 'custom')
    await mkdir(skill, { recursive: true })
    await writeFile(join(skill, 'SKILL.md'), 'keep this skill')
    let result = run(temp, 'init-bmad')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /existiert bereits und wird nicht überschrieben/)
    assert.equal(await readFile(join(skill, 'SKILL.md'), 'utf8'), 'keep this skill')

    await rm(join(baseline, '.agents'), { recursive: true })
    await writeFile(join(baseline, 'notes.txt'), 'keep these notes')
    result = run(temp, 'init-bmad')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Nicht zur Demo gehörende Dateien/)
    assert.equal(await readFile(join(baseline, 'notes.txt'), 'utf8'), 'keep these notes')
    assert.notEqual(spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: baseline }).status, 0)
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})

test('real BMad init preserves the existing ticket and renders both demo skills', {
  skip: process.env.BMAD_INSTALL_TEST !== '1' && 'Set BMAD_INSTALL_TEST=1 for the network integration test',
}, async () => {
  const temp = await workspace()
  try {
    assert.equal(run(temp, 'prepare').status, 0)
    const baseline = join(temp, '.run', 'baseline')
    const ticket = join(baseline, '_bmad-output', 'backlog', 'ticket-sessions-je-track.md')
    await mkdir(dirname(ticket), { recursive: true })
    await writeFile(ticket, 'existing ticket\n')
    const init = run(temp, 'init-bmad')
    assert.equal(init.status, 0, init.stderr)
    assert.equal(await readFile(ticket, 'utf8'), 'existing ticket\n')
    const tracked = spawnSync('git', ['ls-files', '--', '_bmad-output/backlog/ticket-sessions-je-track.md'], { cwd: baseline, encoding: 'utf8' })
    assert.equal(tracked.stdout, '')
    for (const skill of ['bmad-agent-po', 'bmad-build']) {
      const result = spawnSync('uv', ['run', '--no-cache', join('_bmad', 'scripts', 'render_skill.py'),
        '--project-root', baseline, '--skill', join(baseline, '.agents', 'skills', skill),
        '--root', join(baseline, '.agents', 'skills')], { cwd: baseline, encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
      assert.ok(result.stdout.length > 100)
    }
    const ticketResult = run(temp, 'prepare-bmad-ticket')
    assert.equal(ticketResult.status, 0, ticketResult.stderr)
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: baseline, encoding: 'utf8' })
    assert.equal(status.stdout, '')
    assert.equal(await readFile(ticket, 'utf8'), 'existing ticket\n')
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
})
