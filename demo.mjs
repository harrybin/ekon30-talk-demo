import { access, cp, mkdir, readdir, realpath, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))
const run = join(root, '.run')
const [action, target, confirmation] = process.argv.slice(2)

function execute(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env })
  if (result.error) {
    console.error(`${command} konnte nicht gestartet werden: ${result.error.message}`)
    process.exit(1)
  }
  return result.status ?? 1
}

async function exists(path) {
  try { await access(path); return true } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

async function filesIn(path, prefix = '') {
  const entries = await readdir(path, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await filesIn(join(path, entry.name), relative))
    else files.push(relative)
  }
  return files
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
  if (exists) {
    try {
      await rm(run, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
    } catch (error) {
      if (!['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY'].includes(error.code)) throw error
      console.error(`Reset fehlgeschlagen: .run konnte nicht vollständig entfernt werden (${error.code}: ${error.message}).`)
      console.error('Achtung: Dateien in .run können bereits teilweise gelöscht worden sein.')
      console.error('Den .run-Workspace in VS Code sowie eigene Terminals und Programme mit Zugriff auf .run schließen.')
      console.error('Verbleibende Daten prüfen und bei Bedarf sichern. Reset nur erneut starten, wenn das Löschen aller .run-Daten gewollt ist.')
      process.exit(1)
    }
  }
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
} else if (action === 'init-bmad') {
  if (!await exists(run)) {
    const prepared = execute(process.execPath, [fileURLToPath(import.meta.url), 'prepare'])
    if (prepared !== 0) process.exit(prepared)
  }
  const baseline = join(run, 'baseline')
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: baseline, encoding: 'utf8' })
  if (top.error || top.status !== 0 || !await exists(baseline)) {
    console.error('BMad-Init abgebrochen: Isoliertes Baseline-Git-Repository fehlt.')
    process.exit(1)
  }
  const actual = await realpath(top.stdout.trim())
  const expected = await realpath(baseline)
  if ((process.platform === 'win32' ? actual.toLowerCase() : actual) !==
      (process.platform === 'win32' ? expected.toLowerCase() : expected)) {
    console.error('BMad-Init abgebrochen: Git-Root ist nicht der isolierte Baseline-Workspace.')
    process.exit(1)
  }
  const head = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd: baseline })
  const staged = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: baseline })
  if (head.error || head.status !== 1 || staged.error || staged.status !== 0) {
    console.error('BMad-Init abgebrochen: HEAD oder vorgemerkte Änderungen existieren oder Git konnte sie nicht prüfen. Vorhandene Arbeit prüfen; nichts wurde committet.')
    process.exit(1)
  }
  for (const path of ['.github/skills', '_bmad']) {
    if (await exists(join(baseline, path))) {
      console.error(`BMad-Init abgebrochen: ${path} existiert bereits und wird nicht überschrieben. Vorhandene Installation und Änderungen manuell prüfen.`)
      process.exit(1)
    }
  }
  const skills = ['bmad', 'bmod-core-tools', 'bmod-method', 'bmad-agent-po', 'bmad-build']
  const skillsRoot = join(baseline, '.agents', 'skills')
  const reuseSkills = await exists(skillsRoot)
  if (reuseSkills) {
    const entries = await readdir(skillsRoot, { withFileTypes: true })
    if (entries.length !== skills.length || entries.some(entry => !entry.isDirectory() || !skills.includes(entry.name))) {
      console.error('BMad-Init abgebrochen: .agents/skills enthält eine unvollständige oder zusätzliche Installation und wird nicht überschrieben. Bitte manuell prüfen.')
      process.exit(1)
    }
    for (const skill of skills) {
      if (!await exists(join(skillsRoot, skill, 'SKILL.md')) || !await exists(join(skillsRoot, skill, 'bmod.toml'))) {
        console.error(`BMad-Init abgebrochen: Skill ${skill} ist unvollständig. Bitte manuell prüfen.`)
        process.exit(1)
      }
    }
  } else if (await exists(join(baseline, 'skills-lock.json'))) {
    console.error('BMad-Init abgebrochen: skills-lock.json existiert ohne Skills und wird nicht überschrieben. Bitte manuell prüfen.')
    process.exit(1)
  }
  const allowed = new Set([
    ...await filesIn(join(root, 'fixtures', 'common')),
    ...await filesIn(join(root, 'context'), 'context'),
    ...await filesIn(join(root, 'demotime'), '.demo'),
    'SessionCatalog.pas', 'AGENTS.md', 'prd.md', 'spec.md', 'plan.md',
    '_bmad-output/backlog/ticket-sessions-je-track.md',
  ])
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: baseline, encoding: 'utf8' })
  if (status.error || status.status !== 0) {
    console.error(`BMad-Init abgebrochen: Git-Status konnte nicht geprüft werden: ${status.error?.message ?? status.stderr.trim()}`)
    process.exit(1)
  }
  const unexpected = status.stdout.split(/\r?\n/).filter(Boolean).filter(line => {
    const path = line.slice(3)
    return !allowed.has(path) && !(reuseSkills && (
      path === 'skills-lock.json' || skills.some(skill => path.startsWith(`.agents/skills/${skill}/`))
    ))
  })
  if (unexpected.length) {
    console.error('BMad-Init abgebrochen: Nicht zur Demo gehörende Dateien vorhanden; bitte zuerst prüfen und sichern:\n' + unexpected.join('\n'))
    process.exit(1)
  }
  if (execute('uv', ['--version']) !== 0) process.exit(1)
  if (reuseSkills) {
    console.log('Vorhandene BMad-Skills werden unverändert verwendet und lokal mitcommittet.')
  } else {
    const installArgs = ['skills', 'add', 'bmad-code-org/BMAD-METHOD', '--skill', 'bmad', '--skill', 'bmod-core-tools', '--skill', 'bmod-method', '--skill', 'bmad-agent-po', '--skill', 'bmad-build', '--agent', 'github-copilot', '--copy', '-y']
    const installEnv = { ...process.env, DISABLE_TELEMETRY: '1' }
    const install = process.platform === 'win32'
      ? execute(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', ['npx', '--yes', ...installArgs].join(' ')], baseline, installEnv)
      : execute('npx', ['--yes', ...installArgs], baseline, installEnv)
    if (install !== 0) {
      console.error('BMad-Installation fehlgeschlagen; vorhandene Dateien vor einem erneuten Versuch prüfen. Es wurde kein Commit erstellt.')
      process.exit(install)
    }
  }
  const setupArgs = ['run', '--no-cache', join('.agents', 'skills', 'bmad', 'scripts', 'setup.py'),
    '--project-root', baseline, '--skill', join(baseline, '.agents', 'skills', 'bmad'),
    '--root', join(baseline, '.agents', 'skills')]
  const questions = spawnSync('uv', [...setupArgs, '--list-config-questions'], { cwd: baseline, encoding: 'utf8' })
  if (questions.status !== 0) {
    console.error(`BMad-Konfigurationsfragen konnten nicht geprüft werden: ${questions.error?.message ?? questions.stderr.trim()}`)
    process.exit(1)
  }
  let pending
  try { pending = JSON.parse(questions.stdout) } catch {
    console.error('BMad lieferte ungültige Konfigurationsfragen. Setup abgebrochen.')
    process.exit(1)
  }
  if (!Array.isArray(pending) || pending.length) {
    console.error('BMad benötigt Konfigurationsentscheidungen. Setup manuell in VS Code mit „Run bmad setup“ fortsetzen:\n' + questions.stdout)
    process.exit(1)
  }
  const setup = spawnSync('uv', setupArgs, { cwd: baseline, encoding: 'utf8' })
  if (setup.stderr) process.stderr.write(setup.stderr)
  if (setup.status !== 0) {
    console.error(`BMad-Setup fehlgeschlagen: ${setup.error?.message ?? setup.stdout.trim()}. Vorhandene Dateien vor einem erneuten Versuch prüfen.`)
    process.exit(1)
  }
  let result
  try { result = JSON.parse(setup.stdout) } catch {
    console.error('BMad lieferte ein ungültiges Setup-Ergebnis; bitte die Installation manuell prüfen.')
    process.exit(1)
  }
  if (!result.current || result.problems?.length || result.pending_questions?.length || result.unmet_requirements?.length || result.missing_module_records?.length) {
    console.error('BMad-Setup ist nicht vollständig; bitte die Installation manuell prüfen:\n' + setup.stdout)
    process.exit(1)
  }
  console.log(setup.stdout.trim())
  const added = execute('git', ['add', '--all', '--', '.', ':(exclude)_bmad-output/backlog/ticket-sessions-je-track.md'], baseline)
  if (added !== 0) process.exit(added)
  const committed = execute('git', [
    '-c', 'user.name=Demo Presenter', '-c', 'user.email=demo@example.invalid',
    'commit', '-m', 'chore: prepare isolated demo',
    '--trailer', 'Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>',
  ], baseline)
  if (committed !== 0) {
    console.error('Initial-Commit fehlgeschlagen; der Git-Index kann vorgemerkte Dateien enthalten. Bitte prüfen.')
    process.exit(committed)
  }
  console.log('BMad eingerichtet und lokal initial committet. Ein vorhandenes Demo-Ticket bleibt unverändert und uncommitted.')
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
  console.error('Verwendung: node demo.mjs prepare [--reset [RESET]] | init-bmad | reset-baseline [RESET] | init-bmad-commit COMMIT | prepare-bmad-ticket | build <baseline|solution|repository> | run <baseline|solution|repository> | test <baseline|solution|repository> | diff')
  process.exit(1)
}
