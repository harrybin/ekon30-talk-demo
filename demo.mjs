import { access, cp, mkdir, realpath, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))
const run = join(root, '.run')
const [action, target, confirmation] = process.argv.slice(2)

function execute(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) {
    console.error(`${command} konnte nicht gestartet werden: ${result.error.message}`)
    process.exit(1)
  }
  return result.status ?? 1
}

if (action === 'prepare') {
  if (target === '--reset' && confirmation !== undefined && confirmation !== 'RESET') {
    console.error('Abgebrochen: Zum vollständigen Zurücksetzen RESET eingeben.')
    process.exit(1)
  }
  let exists = false
  try { await access(run); exists = true } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (exists && target !== '--reset') {
    console.error('.run existiert bereits. Änderungen sichern; nur mit prepare --reset ausdrücklich neu erstellen.')
    process.exit(1)
  }
  if (exists) await rm(run, { recursive: true, force: true })
  for (const name of ['baseline', 'solution']) {
    const destination = join(run, name)
    await mkdir(destination, { recursive: true })
    await cp(join(root, 'fixtures', 'common'), destination, { recursive: true })
    await cp(join(root, 'fixtures', name, 'SessionCatalog.pas'), join(destination, 'SessionCatalog.pas'))
    await cp(join(root, 'AGENTS.md'), join(destination, 'AGENTS.md'))
    for (const file of ['prd.md', 'spec.md', 'plan.md']) await cp(join(root, file), join(destination, file))
    await cp(join(root, 'context'), join(destination, 'context'), { recursive: true })
  }
  await cp(join(root, 'demotime'), join(run, 'baseline', '.demo'), { recursive: true })
  const isolated = execute('git', ['init', '--quiet', join(run, 'baseline')])
  if (isolated !== 0) process.exit(isolated)
  console.log('Demo vorbereitet. .run/baseline als eigenen VS-Code-Ordner öffnen.')
} else if (action === 'reset-baseline') {
  if (target !== undefined && target !== 'RESET') {
    console.error('Abgebrochen: Zum Zurücksetzen der Ausgangsdatei RESET eingeben.')
    process.exit(1)
  }
  const baseline = join(run, 'baseline')
  await access(baseline)
  await cp(join(root, 'fixtures', 'baseline', 'SessionCatalog.pas'), join(baseline, 'SessionCatalog.pas'))
  console.log('Baseline SessionCatalog.pas wiederhergestellt; andere .run-Dateien bleiben unverändert.')
} else if (action === 'init-bmad-commit') {
  if (target !== 'COMMIT') {
    console.error('Abgebrochen: Für den lokalen Initial-Commit COMMIT eingeben.')
    process.exit(1)
  }
  const baseline = join(run, 'baseline')
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: baseline, encoding: 'utf8' })
  if (top.error || top.status !== 0) {
    console.error(`Isoliertes Git-Repository nicht verfügbar: ${top.error?.message ?? top.stderr.trim()}`)
    process.exit(1)
  }
  const actual = await realpath(top.stdout.trim())
  const expected = await realpath(baseline)
  if ((process.platform === 'win32' ? actual.toLowerCase() : actual) !==
      (process.platform === 'win32' ? expected.toLowerCase() : expected)) {
    console.error('Abgebrochen: Der Git-Root ist nicht der isolierte Baseline-Workspace.')
    process.exit(1)
  }
  const head = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: baseline })
  if (head.error || head.status !== 1) {
    console.error(head.error ? `git konnte nicht gestartet werden: ${head.error.message}` :
      'Abgebrochen: Ein Initial-Commit existiert bereits oder HEAD konnte nicht geprüft werden.')
    process.exit(1)
  }
  const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: baseline })
  if (staged.error || staged.status !== 0) {
    console.error(staged.error ? `git konnte nicht gestartet werden: ${staged.error.message}` :
      'Abgebrochen: Der Index ist nicht leer oder konnte nicht geprüft werden.')
    process.exit(1)
  }
  if (execute('git', ['add', '--all'], baseline) !== 0) process.exit(1)
  process.exit(execute('git', [
    '-c', 'user.name=Demo Presenter',
    '-c', 'user.email=demo@example.invalid',
    'commit', '-m', 'chore: prepare isolated demo',
    '--trailer', 'Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>',
  ], baseline))
} else if (action === 'prepare-bmad-ticket') {
  const baseline = join(run, 'baseline')
  const ticket = join(baseline, '_bmad-output', 'backlog', 'ticket-sessions-je-track.md')
  const ticketRelative = '_bmad-output/backlog/ticket-sessions-je-track.md'
  await access(baseline)

  let ticketExists = false
  try { await access(ticket); ticketExists = true } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (!ticketExists) {
    await mkdir(join(baseline, '_bmad-output', 'backlog'), { recursive: true })
    await cp(join(root, 'spec.md'), ticket)
    console.log('Offline-Ticket-Spec nach _bmad-output/backlog kopiert.')
  }

  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: baseline, encoding: 'utf8' })
  if (status.error) {
    console.error(`git status konnte nicht gestartet werden: ${status.error.message}`)
    process.exit(1)
  }
  if (status.status !== 0) process.exit(status.status ?? 1)

  const changes = status.stdout.trim().split(/\r?\n/).filter(Boolean)
  const unexpected = changes.filter((line) => line.slice(3).replaceAll('\\', '/').toLowerCase() !== ticketRelative)
  if (unexpected.length) {
    console.error('Unerwartete Änderungen im BMAD-Workspace. Nur das Ticket darf vor dem Build uncommitted sein.')
    process.exit(1)
  }
  if (changes.length) {
    const staged = execute('git', ['add', '--', ticketRelative], baseline)
    if (staged !== 0) process.exit(staged)
    const committed = execute('git', [
      '-c', 'user.name=Demo Presenter',
      '-c', 'user.email=demo@example.invalid',
      'commit', '--only', '-m', 'docs: add BMad demo ticket',
      '--trailer', 'Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>',
      '--', ticketRelative,
    ], baseline)
    if (committed !== 0) process.exit(committed)
  } else {
    console.log('BMAD-Ticket ist bereits committed.')
  }
} else if (['build', 'run', 'test'].includes(action) && ['baseline', 'solution', 'repository'].includes(target)) {
  const working = target === 'repository' ? join(root, 'fixtures', 'common') : join(run, target)
  const output = target === 'repository' ? join(root, 'build') : join(working, 'build')
  const program = action === 'test' ? 'CatalogTests' : 'CatalogDemo'
  await mkdir(output, { recursive: true })
  const units = target === 'repository' ? [`-Fu${join(root, 'fixtures', 'baseline')}`] : []
  const compiled = execute('fpc', ['-B', '-Mdelphi', '-Sh', '-Cr', '-Co', ...units, `-Fu${working}`,
    `-FU${output}`, `-FE${output}`, join(working, `${program}.lpr`)])
  if (compiled !== 0) process.exit(compiled)
  if (action === 'build') process.exit(0)
  process.exit(execute(join(output, `${program}${process.platform === 'win32' ? '.exe' : ''}`), []))
} else if (action === 'diff') {
  const status = execute('git', ['diff', '--no-index', '--', join(run, 'baseline', 'SessionCatalog.pas'),
    join(run, 'solution', 'SessionCatalog.pas')])
  if (status > 1) process.exit(status)
} else {
  console.error('Verwendung: node demo.mjs prepare [--reset [RESET]] | reset-baseline [RESET] | init-bmad-commit COMMIT | prepare-bmad-ticket | build <baseline|solution|repository> | run <baseline|solution|repository> | test <baseline|solution|repository> | diff')
  process.exit(1)
}
