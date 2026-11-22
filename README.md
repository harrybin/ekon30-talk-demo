# EKON 30 · Demo: Sessions je Track zählen

Ein gemeinsamer, bewusst kleiner roter Faden für zwei eigenständige Vorträge:
Ein Konferenzkatalog soll Sessions pro Track zählen. `KI` und `ki` sind dabei unterschiedliche Tracks.
Alle Daten sind synthetisch. Die Anwendung ist Delphi-kompatibles Object Pascal im FPC-Delphi-Modus.

Dieses eigenständige Repository ist ein **Vortragsdemo**, nicht das separate Workshop-Repository.
Die Datei `context/copilot-instructions.md` ist absichtlich ein Demo-Fixture für explizit mitgegebenen Prompt-Kontext, keine Repository-Anweisung.
Die eigenen Dateien stehen unter der [MIT-Lizenz](LICENSE); die dort beschriebenen Ausnahmen für Werke Dritter gelten weiterhin.

## Anwendung direkt starten

Das Repository in VS Code öffnen und **Demo: Starten** über die Tasks ausführen. Die Konsolen-Demo
wird dabei gebaut und zeigt die Track-Zählung der vorbereiteten Ausgangsversion. **Demo: Bauen**
baut sie ohne Start. Beide Tasks benötigen Node.js und FPC im PATH von VS Code; eine `.run`-Vorbereitung
ist dafür nicht nötig. Das Ergebnis liegt im ignorierten Ordner `build/`.

Der direkte Anwendungslauf ist unabhängig vom nachfolgend beschriebenen Live-KI-Ablauf und ändert
keine Quelldateien. Für die Demo-Time-Akte weiterhin den isolierten Workspace vorbereiten.

## Vorbereitung und Bedienung

- Node.js 24+, Free Pascal mit `fpc` im PATH von VS Code und Git; für BMad zusätzlich npm, `uv` und Internet. Für Live-KI außerdem VS Code mit angemeldetem GitHub Copilot. Die Erweiterung **Demo Time** ist optional.
- VS Code empfiehlt Pascal-Sprachunterstützung, Demo Time sowie GitHub Copilot und Copilot Chat im Repository und in den vorbereiteten Demo-Workspaces. Empfehlungen installieren nichts automatisch; FPC und die Copilot-Anmeldung bleiben separate Voraussetzungen.
- In VS Code über **Terminal → Aufgabe ausführen** die Aufgaben mit dem Präfix **Demo:** auswählen. Im Repository gibt es Aufgaben für Vorbereitung, beide Reset-Arten, BMad-Einrichtung, Ticket, Bauen, Starten, Tests und Diff. Die Tasks im vorbereiteten Demo-Workspace bieten die entsprechenden Demo-Schritte ebenfalls an.
- Für den SDD-Akt **Demo: Komplett vorbereiten (mit BMad)** einmal ausführen. Die Aufgabe erstellt bei Bedarf `.run`, installiert BMad in `.run/baseline`, führt das Setup aus und erstellt dort den lokalen Initial-Commit. **Demo: Vorbereiten (bestehende Daten behalten)** bereitet dagegen nur die Offline-Workspaces vor und installiert nichts; wenn `.run` bereits existiert, bricht diese Aufgabe ab und verändert nichts.
- **Demo: Alles zurücksetzen (.run löschen)** ist nur im Repository verfügbar: Er löscht beide Demo-Workspaces samt Änderungen und verlangt die Eingabe `RESET`. Vorher sichern und den Demo-Workspace in VS Code schließen. **Demo: Ausgangsdatei zurücksetzen (überschreiben)** ersetzt dagegen nur die Pascal-Ausgangsdatei und verlangt ebenfalls `RESET`.
- Bei `EBUSY`, `EPERM` oder `EACCES` kann Windows `.run` noch sperren. Der fehlgeschlagene Reset kann bereits Dateien gelöscht haben: verbleibende Inhalte prüfen und bei Bedarf sichern. Den `.run`-Workspace in VS Code sowie eigene Terminals und Programme mit Zugriff darauf schließen. Den Reset-Task erst erneut mit `RESET` bestätigen, wenn das Löschen aller verbleibenden `.run`-Daten gewollt ist; danach BMad wie unten beschrieben erneut einrichten.
- Die Vorbereitung erstellt `.run/baseline` und `.run/solution` aus den versionierten Fixtures, kopiert `AGENTS.md` in beide Arbeitsordner und die beiden Akte aus `demotime/` nach `.run/baseline/.demo/`. Sind die Ordner bereits vorhanden, werden sie nicht überschrieben. Änderungen zuerst sichern; nur `node demo.mjs prepare --reset` löscht `.run` samt Änderungen ausdrücklich und stellt es neu her.
- Für eine komplette Neuinitialisierung `.run/baseline` in VS Code schließen und den bestätigten Reset-Task ausführen. Dieser löscht beide generierten Workspaces und alle dortigen Änderungen; danach BMad mit dem Komplett-Task erneut einrichten.
- Anschließend ausschließlich `.run/baseline` als **eigenen VS-Code-Ordner** öffnen. Im Demo-Time-View den Akt `EKON 30 · Spec-Driven Development` oder `EKON 30 · AI Context Setup` starten.
- `prepare` initialisiert `.run/baseline` als eigenes lokales Git-Repository und setzt `git.openRepositoryInParentFolders` auf `never`. So bleibt die Demo auf den isolierten Arbeitsordner begrenzt und BMad kann dort unabhängig vom äußeren Repository arbeiten.
- Die erste Szene jedes Akts setzt nur `.run/baseline/SessionCatalog.pas` auf die Baseline zurück; andere Dateien bleiben unangetastet. So ist eine Wiederholung ohne Neuaufbau des Workspaces möglich.
- Läuft eine Live-Antwort rechtzeitig ein, die unmittelbar folgende Fallback-Szene überspringen. Nach 45 Sekunden (Fragen, Plan und Context-Stationen) bzw. 60 Sekunden (SDD-Agent-Station) wechselt Demo Time automatisch in den vorbereiteten Fallback. Fallback-Szenen sind jeweils der nächste Schritt und können nach der Erläuterung manuell verlassen werden.
- `node demo.mjs test baseline` muss fehlschlagen: Der absichtlich eingebaute Fehler fasst `KI` und `ki` zusammen.
- `node demo.mjs test solution` muss erfolgreich sein. `node demo.mjs diff` zeigt beide Implementierungen.
- `node demo.mjs run baseline` führt die Konsolen-Demo mit vier Sessions aus und zeigt die tatsächlichen Track-Zahlen neben dem erwarteten Ergebnis. Dies ist ein Anwendungslauf, kein Test.
- In den einzeln geöffneten Workspaces `.run/baseline` und `.run/solution` stehen die VS-Code-Tasks **Demo: Bauen** und **Demo: Starten** bereit. Starten baut die Anwendung erneut und zeigt ihre Ausgabe im Terminal. Node.js und FPC müssen im PATH von VS Code verfügbar sein.
- Die versionierten Akte unter `demotime/` sind Vorlagen; nur die nach `.run/baseline/.demo/` kopierten Akte sind für diesen Workspace bestimmt.
- Demo-Time-Terminalaktionen lösen den Runner über `{DT_WORKSPACE_PATH}` auf; ein Wechsel des Terminalverzeichnisses ist daher unkritisch. `.run/baseline` muss weiterhin der geöffnete VS-Code-Workspace sein.
- Folien und diesen Ablauf offline bereithalten. Copilot-Anmeldung und Antworten vorab überprüfen.

Ein bereits vorhandenes `.run` wird durch `prepare` nicht aktualisiert: Für die neue Anwendung
`fixtures/common/CatalogDemo.lpr`, `fixtures/common/.vscode/tasks.json` und
`fixtures/common/.vscode/extensions.json` in die entsprechenden
Pfade beider Workspaces übernehmen und die beiden Aktvorlagen aus `demotime/` nach `.run/baseline/.demo/`
übertragen. Vorhandene Dateien vorher vergleichen und eigene Änderungen erhalten; kein
`prepare --reset` ohne Sicherung. Ist der Baseline-Workspace bereits initial committet, die dort
übernommenen Dateien nach Prüfung auch lokal committen, damit der BMad-Build wieder mit sauberem
Arbeitsbaum starten kann.

Für den SDD-Akt wird BMad Method ausschließlich im isolierten `.run/baseline` installiert.
Voraussetzungen sind Node.js, npm, Git, `uv` und ein VS-Code-Copilot-Client mit Skill-Unterstützung.
Prüfe die Installationswarnungen und Berechtigungen; installiere die Skills nicht im Repository-Root.
Für einen frischen Checkout oder eine vorbereitete Baseline ohne BMad und ohne Git-Commit
**Demo: Komplett vorbereiten (mit BMad)** wählen oder im Repository ausführen:

```powershell
node demo.mjs init-bmad
```

Der Task installiert die fünf benötigten Skills, führt das BMad-Setup aus und committet die
vorbereiteten Dateien lokal. Ein vorhandenes Ticket unter `_bmad-output/backlog/ticket-sessions-je-track.md`
bleibt unverändert und uncommitted; **Demo: Ticket vorbereiten** übernimmt es später. Bereits
vorhandene Skill- oder BMad-Installationen, ein vorhandener Commit, vorgemerkte oder andere
unbekannte Dateien führen zum Abbruch, statt vorhandene Arbeit zu überschreiben oder mit zu
committen. Bei einem abgebrochenen Download oder Setup können bereits Dateien angelegt worden
sein: diese prüfen und sichern; nicht blind erneut installieren oder löschen. Falls eine neue
BMad-Version Konfigurationsfragen stellt, diese im Copilot-Chat mit `Run bmad setup` beantworten.
Nach dem Setup die installierten Skills und deren Berechtigungen prüfen; VS Code gegebenenfalls
neu laden. Zum Prüfen des Status im Chat:

```text
Run bmad status
```

`bmad-build` erwartet einen frischen Chat und einen sauberen Git-Arbeitsbaum. Der ältere Task
**Demo: BMad Initial-Commit (lokal)** ist nur für die bewusste manuelle Einrichtung vorgesehen:
Er committet nach Bestätigung mit `COMMIT` **alle** Dateien, auch vorhandene Tickets. Vorher
alle Dateien prüfen. Keiner der lokalen Commits wird gepusht.

Im zweiten Schritt sichert `node demo.mjs prepare-bmad-ticket` das Ticket aus Sofias Ausgabe; falls es fehlt,
legt der Befehl die vorbereitete Fallback-Spec an. Er committet ausschließlich diese eine Ticketdatei.
Keiner dieser lokalen Commits wird gepusht. Für eine vollständige Wiederholung `.run` mit
`prepare --reset` neu erstellen und die BMAD-Einrichtung im neuen `.run/baseline` erneut durchführen.

Die `solution` ist eine **vorbereitete Referenzimplementierung**, kein behauptetes Copilot-Ergebnis.
Die Demo-Time-Akte führen die Stationen und Zeitlimits; Die vorbereitete `solution` ist nur Fallback
und Referenz. Versionierte Vorlagen nie in einem Live-Agent-Lauf überschreiben lassen. Für einen
vollständigen Neuaufbau gilt weiterhin ausdrücklich `prepare --reset`; der erste Akt-Schritt setzt
nicht den gesamten Workspace, sondern nur die Baseline-Implementierung zurück.

## Aktdateien

- `demotime/sdd-talk.json` → `.run/baseline/.demo/sdd-talk.json`
- `demotime/context-setup-talk.json` → `.run/baseline/.demo/context-setup-talk.json`

Beide Dateien verwenden Demo-Time-Schema v3 (`scenes`/`moves`). Copilot-Aktionen senden die
vorbereiteten Prompts; `#file:`-Referenzen markieren den vorgesehenen Kontext. Vor dem Vortrag
prüfen, dass Demo Time die Akte lädt, Copilot angemeldet ist und die Referenzen im verwendeten
Copilot-Client als Kontext aufgelöst werden. Wenn nicht, die betreffenden Dateien manuell anfügen.
Aktuelle Referenz: [Demo Time v3 Schema](https://demotime.show/demo-time.schema.json),
[Copilot-Aktionen](https://demotime.show/actions/copilot/), [Datei-Aktionen](https://demotime.show/actions/file/),
[Text-Aktionen](https://demotime.show/actions/text/) und [Terminal-Aktionen](https://demotime.show/actions/terminal/).

## Ohne Demo Time vorführen

Nach der Vorbereitung `.run/baseline` als eigenen VS-Code-Ordner öffnen. Die Tasks laufen dort über
**Terminal → Aufgabe ausführen**; die Aufgaben im Repository können dieselben Befehle auslösen.
Die folgenden Chat-Nachrichten stehen vollständig in den jeweiligen Abschnitten unten.

1. **SDD:** Nach Prüfung und Sicherung vorhandener Änderungen **Demo: Ausgangsdatei zurücksetzen (überschreiben)** wählen. **Demo: Starten** ausführen und die falsche Zählung zeigen; **Demo: Ausgangsversion testen** schlägt erwartungsgemäß fehl.
2. BMad wie oben mit **Demo: Komplett vorbereiten (mit BMad)** einrichten und die installierten Skills prüfen. Im neuen Agent-Chat den Prompt aus **Schritt 1** senden und das Ticket prüfen; bei Timeout `spec.md` als Offline-Fallback zeigen.
3. **Demo: Ticket vorbereiten** ausführen: Ein vorhandenes Ticket wird übernommen, andernfalls die Offline-Spec kopiert; der Task committet ausschließlich das Ticket. Im neuen Agent-Chat den Prompt aus **Schritt 2** senden und vor Änderungen pausieren; bei Timeout `plan.md` zeigen.
4. Den Plan prüfen und den Prompt aus **Schritt 3** im selben Chat senden. Danach **Demo: Ausgangsversion testen** und **Demo: Diff anzeigen** ausführen. Bei Timeout oder falschem Scope den Chat abbrechen, **Demo: Referenzlösung testen** und den Diff zeigen.
5. **AI Context Setup:** Nach Sicherung ggf. **Demo: Ausgangsdatei zurücksetzen (überschreiben)** wählen. In einem neuen Ask-Chat C1 mit `spec.md` und `SessionCatalog.pas` senden; im nächsten Chat denselben Prompt zusätzlich mit `context/copilot-instructions.md` senden. Bei Timeout `context/beobachtung.md` zeigen.
6. Im neuen Ask-Chat die Dateien `context/test-review.prompt.md` und `context/catalog-review/SKILL.md` öffnen und um eine kurze Zuordnung ihrer Rollen bitten. Danach `context/pascal-reviewer.agent.md` zeigen und C3 im neuen Ask-Chat senden. Bei Timeout den Chat abbrechen, `context/beobachtung.md` zeigen und **Demo: Ausgangsversion testen** ausführen.

Nach der Demo Änderungen im isolierten Workspace prüfen und bei Bedarf sichern. Zum vollständigen
Neustart den Workspace schließen und den ausdrücklich bestätigten Reset-Task im Repository verwenden.

## Vortrag 1 · Spec-Driven Development

Der SDD-Akt ist ein zusammenhängender Demo-Faden: dieselbe Story und dasselbe Ticket führen von der Klärung
über den Build-Plan bis zur geprüften Änderung. Nur für die saubere Build-Sitzung wechselt der Chat;
Ticket und fachlicher Scope bleiben erhalten. Die Zeitboxen gelten relativ zum Start des Akts und enthalten Prompt-Wartezeit,
Wechsel, Erläuterung, Test und gegebenenfalls
Fallback; keine Schritte werden zusätzlich eingeplant. Bei Zeitdruck spätestens zum
Ende der jeweiligen Phase wechseln und den Live-Pfad abkürzen.

| Demozeit | Live-Aktion | Abbruch / Fallback |
|---|---|---|
| 0:00–3:00 (3 Min.) | SDD-Akt: Zuerst die Konsolen-Demo ausführen und die falsche Zusammenfassung von `KI` und `ki` zeigen. Danach soll Sofia (`bmad-agent-po`) aus `prd.md` ein Standalone-Ticket für eine Story schreiben. Eine Frage beantworten, dann Ticket-Spec prüfen. | Nach spätestens 45 Sekunden ohne brauchbares Ticket: vorbereitete Ticket-Spec in `spec.md` zeigen. |
| 3:00–6:00 (3 Min.) | Im frischen Chat `bmad-build` mit dem Ticket starten; Vorgehen und Scope prüfen. | Nach 45 Sekunden: den vorbereiteten Offline-Plan in `plan.md` zeigen; keine zusätzliche Live-Generation. |
| 6:00–11:00 (5 Min.) | Build im selben Chat fortsetzen, nur `SessionCatalog.pas` ändern lassen und Ergebnis prüfen. | Nach 60 Sekunden oder bei falschem Scope: Agent abbrechen und vorbereitete Lösung, Test und Diff zeigen. Keine Korrekturschleife live. |

Vor dem Live-Agent-Lauf `node demo.mjs test baseline` ausführen und den absichtlichen Fehler kurz erklären.
Die Tests sind kein vollständiger Beweis für alle möglichen Eingaben; eine Freigabe bleibt beim Menschen.
Die Dateien `spec.md` und `plan.md` sind Offline-Fallbacks; nicht behaupten, dass sie live von BMAD erzeugt wurden.
Nach dem Agent-Lauf die echte Ausgabe und `git diff --no-index .run/solution/SessionCatalog.pas .run/baseline/SessionCatalog.pas` prüfen.
Dieser `git diff --no-index` gibt bei Unterschieden Exit-Code 1 zurück; das ist kein Testlauf.

### Schritt 1 · Sofia schreibt das Ticket

```text
/bmad-agent-po Schreibe aus #file:prd.md ein Standalone-Ticket für genau
eine Story und eine Build-Sitzung unter
_bmad-output/backlog/ticket-sessions-je-track.md. Stelle Rückfragen zu
offenen fachlichen Entscheidungen, statt Annahmen als Fakten einzutragen.
Nicht implementieren.
```

Wenn die Antwort brauchbar ist, Ticket-Spec und Entscheidung prüfen. Vor dem Build das erzeugte
Ticket lokal committen, damit der neue Chat mit sauberem Arbeitsbaum beginnt.

### Schritt 2 · Dasselbe Ticket wird geplant

```text
/bmad-build Baue das Standalone-Ticket „Sessions je Track zählen“ aus
_bmad-output/backlog. Untersuche das Repository, zeige offene Fragen und
deinen Build-Plan und pausiere vor Quellcodeänderungen für meine Freigabe.
Wenn ich den Offline-Fallback verwende, nimm #file:spec.md als Ticket-Spec.
```

### Schritt 3 · Den freigegebenen Plan umsetzen und prüfen

```text
Der Build-Plan für dasselbe Ticket ist freigegeben. Setze die Story nur in
SessionCatalog.pas um; ändere keine Tests oder anderen Dateien.
Bewahre Reihenfolge und Eingaben, führe die vorhandenen Pascal-Checks
aus und reviewe den Diff. Nichts pushen; das Ergebnis bleibt bis zu
meiner Prüfung im Status „built“.
```

`prepare-bmad-ticket` prüft, dass vor dem Build keine fremden Änderungen im Arbeitsbaum liegen.
`bmad-build` kann bei einem kleinen, risikoarmen Vorhaben einen Light-Path ohne ausführlichen Plan
wählen. Die Demo hält trotzdem vor Änderungen für die sichtbare menschliche Entscheidung an.
BMAD markiert den Build als `built`; erst die Person prüft das Ergebnis und markiert die Story `done`.
Offizielle Referenzen: [Installation](https://docs.bmad-method.org/start/install-bmad/),
[How BMad Works](https://docs.bmad-method.org/start/how-bmad-works/),
[Build and Verify](https://docs.bmad-method.org/build/build-and-verify/).

## Vortrag 2 · AI Context Setup

Die Demo-Zeitboxen gelten relativ zum Start des Akts. Die Stationen enthalten Prompt-Wartezeit,
Wechsel, Erläuterung, Test und gegebenenfalls
Fallback; keine Schritte werden zusätzlich eingeplant. Bei Zeitdruck spätestens zum
Stationsende wechseln und den Live-Pfad abkürzen.

Derselbe Katalog, aber eine andere Frage: Welcher Kontext gehört wohin?
Bei Bedarf `node demo.mjs prepare --reset` vor Beginn erneut ausführen.
Die Beispiele unter `context/` sind nur Vorlagen; sie werden nicht automatisch durch Copilot geladen.

| Demozeit | Live-Aktion | Abbruch / Fallback |
|---|---|---|
| 0:00–3:30 (3½ Min.) | Context-Akt: Prompt C1 erst mit `spec.md` und `SessionCatalog.pas`, dann identisch mit zusätzlicher `context/copilot-instructions.md` senden. Beobachtung vergleichen. | Je Antwort maximal 45 Sekunden. Danach `context/beobachtung.md` als vorbereitete Vergleichsfolie lesen. Keine automatische Anwendung oder Verbesserung behaupten. |
| 3:30–7:00 (3½ Min.) | `context/test-review.prompt.md` (Auftrag) und `context/catalog-review/SKILL.md` (Ablaufwissen) öffnen. Copilot um eine knappe Zuordnung bitten; Tool-Unterstützung erklären. | Antwort höchstens 45 Sekunden abwarten, dann die vorbereiteten Dateien vergleichen. Die Vorlagen bleiben außerhalb der aktiven `.github`-Pfade. |
| 7:00–11:00 (4 Min.) | `context/pascal-reviewer.agent.md` zeigen; Prompt C3 im Ask-Modus geben und den vorhandenen Baseline-Fehler testen. | Nach 45 Sekunden abbrechen; vorbereiteten Befund in `context/beobachtung.md` und Testausgabe zeigen. Kein MCP-Server und keine externe Schreibaktion nötig. |

### C1 · Derselbe Auftrag

```text
Prüfe die Track-Zählung anhand der bereitgestellten Dateien.
Nenne einen fachlich relevanten Randfall und einen überprüfbaren Test.
Ändere keine Dateien und starte keine Befehle.
```

Zuerst nur `spec.md` und `SessionCatalog.pas` hinzufügen; im zweiten Durchlauf zusätzlich
`context/copilot-instructions.md`. Falls das UI keine Dateireferenzen unterstützt, Inhalte explizit einfügen.
Antworten können gleich oder unterschiedlich ausfallen: **keinen Effekt und keine Tokenersparnis garantieren**.

### C2 · Prompt und Skill einordnen

```text
Lies #file:context/test-review.prompt.md und #file:context/catalog-review/SKILL.md.
Erkläre kurz, wofür die beiden Dateien jeweils gedacht sind und wann ich sie
einsetzen würde. Ändere keine Dateien und starte keine Befehle.
```

### C3 · Prüfen statt unbemerkt ändern

```text
Lies spec.md, SessionCatalog.pas und CatalogTests.lpr.
Melde höchstens zwei konkrete Abweichungen mit Dateireferenz und
Begründung. Ändere keine Dateien und starte keine Befehle.
```

Die Agent-Datei veranschaulicht eine Reviewer-Rolle; ob Toolgrenzen technisch durchgesetzt werden,
hängt von der verwendeten Copilot-Oberfläche und deren Toolnamen ab. Im Zweifel Ask-Modus
und Berechtigungen prüfen; keinen echten Read-only-Schutz behaupten.
Für Tools/MCP reicht der reale lokale Compileraufruf: `node demo.mjs test baseline`.
Ein MCP-Server wäre nur für zusätzliche externe Fähigkeiten nötig und wird hier nicht gestartet.
