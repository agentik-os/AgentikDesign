# Zu Agentik Design beitragen

> **Agentik Design** — maintained by [Agentik OS](https://agentik-os.com). Forked from [nexu-io/open-design](https://github.com/nexu-io/open-design) (Apache-2.0). See [NOTICE.md](NOTICE.md).

Danke, dass Sie über einen Beitrag nachdenken. OD ist bewusst klein gehalten — der größte Teil des Werts steckt in **Dateien** (Skills, Designsysteme, Prompt-Fragmente) statt in Framework-Code. Die wirkungsvollsten Beiträge sind deshalb oft ein Ordner, eine Markdown-Datei oder ein PR-großer Adapter.

Dieser Leitfaden zeigt, wo Sie für welche Art Beitrag suchen sollten und welche Messlatte ein PR vor dem Merge erfüllen muss.

<p align="center"><a href="CONTRIBUTING.md">English</a> · <a href="CONTRIBUTING.pt-BR.md">Português (Brasil)</a> · <b>Deutsch</b> · <a href="CONTRIBUTING.fr.md">Français</a> · <a href="CONTRIBUTING.zh-CN.md">简体中文</a> · <a href="CONTRIBUTING.ja-JP.md">日本語</a></p>

---

## Drei Dinge, die Sie an einem Nachmittag liefern können

| Wenn Sie möchten… | Fügen Sie eigentlich hinzu | Ort | Umfang |
|---|---|---|---|
| OD eine neue Artifact-Art rendern lassen (Rechnung, iOS Settings Screen, One-Pager…) | einen **Skill** | [`skills/<your-skill>/`](skills/) | ein Ordner, ca. 2 Dateien |
| OD die visuelle Sprache einer neuen Marke sprechen lassen | ein **Design System** | [`design-systems/<brand>/DESIGN.md`](design-systems/) | eine Markdown-Datei |
| Eine neue coding-agent CLI anbinden | einen **Agent adapter** | [`apps/daemon/src/agents.ts`](apps/daemon/src/agents.ts) | ca. 10 Zeilen in einem Array |
| Feature ergänzen, Bug fixen, UX-Pattern aus [`open-codesign`][ocod] übernehmen | Code | `apps/web/src/`, `apps/daemon/` | normaler PR |
| Dokumentation verbessern, Französisch / Deutsch / 中文 ergänzen, Tippfehler fixen | Dokumentation | `README.md`, `README.fr.md`, `README.de.md`, `README.zh-CN.md`, `docs/`, `QUICKSTART.md` | ein PR |

Wenn Sie nicht sicher sind, in welchen Bereich Ihre Idee fällt, [öffnen Sie zuerst eine Discussion / Issue](https://github.com/agentik-os/AgentikDesign/issues/new). Wir zeigen Ihnen dann die passende Oberfläche.

---

## Lokales Setup

Das vollständige One-Page-Setup steht in [`QUICKSTART.de.md`](QUICKSTART.de.md). TL;DR für Mitwirkende:

```bash
git clone https://github.com/agentik-os/AgentikDesign.git
cd open-design
corepack enable           # wählt das gepinnte pnpm aus packageManager
pnpm install
pnpm tools-dev run web    # daemon + web foreground loop
pnpm typecheck            # tsc -b --noEmit
pnpm --filter @agentik-design/web build  # Web-Paket bei Bedarf bauen
```

Node `~24` und pnpm `10.33.x` sind erforderlich. `nvm` / `fnm` sind optional; nutzen Sie `nvm install 24 && nvm use 24` oder `fnm install 24 && fnm use 24`, wenn Sie Node so verwalten. macOS, Linux und WSL2 sind die primären Pfade. Windows nativ sollte funktionieren, ist aber kein primäres Ziel.

Sie brauchen keine Agent-CLI im `PATH`, um OD selbst zu entwickeln. Der daemon meldet dann "no agents found" und fällt auf den **Anthropic API · BYOK** Pfad zurück, der oft die schnellste Dev-Schleife ist.

---

## Einen neuen Skill hinzufügen

Ein Skill ist ein Ordner unter [`skills/`](skills/) mit `SKILL.md` im Root. Er folgt der Claude Code [`SKILL.md` Konvention][skill] plus optionaler `od:` Erweiterung. **Keine Registrierung nötig.** Ordner ablegen, daemon neu starten, der Picker zeigt ihn an.

### Skill-Ordnerlayout

```text
skills/your-skill/
├── SKILL.md                    # erforderlich
├── assets/template.html        # optional, aber empfohlen — Seed-Datei
├── references/                 # optional — Wissensdateien für den Agent
│   ├── layouts.md
│   ├── components.md
│   └── checklist.md
└── example.html                # stark empfohlen — echtes, handgebautes Beispiel
```

### `SKILL.md` Frontmatter

Die ersten drei Keys sind die Claude Code Basis-Spec: `name`, `description`, `triggers`. Alles unter `od:` ist OD-spezifisch und optional, aber **`od.mode`** bestimmt, in welcher Gruppe der Skill erscheint.

```yaml
---
name: your-skill
description: |
  One-paragraph elevator pitch. The agent reads this verbatim to decide
  if the user's brief matches. Be concrete: surface, audience, what's in
  the artifact, what's not.
triggers:
  - "your trigger phrase"
  - "another phrase"
  - "中文触发词"
od:
  mode: prototype           # prototype | deck | template | design-system
  platform: desktop         # desktop | mobile
  scenario: marketing       # free-form tag for grouping
  featured: 1               # any positive integer surfaces it under "Showcase examples"
  preview:
    type: html              # html | jsx | pptx | markdown
    entry: index.html
  design_system:
    requires: true
    sections: [color, typography, layout, components]
  example_prompt: "A copy-pastable prompt that nicely shows what this skill does."
---

# Your Skill

Body is free-form Markdown describing the workflow the agent should follow…
```

Die vollständige Grammatik — typed inputs, Slider-Parameter, capability gating — steht in [`docs/skills-protocol.md`](docs/skills-protocol.md).

### Merge-Messlatte für einen neuen Skill

1. **Ein echtes `example.html`.** Handgebaut, direkt von Disk öffnend, mit Designer-Qualität. Kein Lorem ipsum, kein `<svg><rect/></svg>` Placeholder-Hero.
2. **Anti-AI-slop Checklist bestehen.** Keine violetten Gradients, keine generischen Emoji-Icons, keine runde Karte mit linkem Border-Akzent, kein Inter als Display-Font, keine erfundenen Zahlen.
3. **Ehrliche Platzhalter.** Wenn der Agent keine echte Zahl hat, schreiben Sie `—` oder einen beschrifteten grauen Block, nicht "10× faster".
4. **`references/checklist.md` mit mindestens P0 Gates.** Format an [`skills/guizang-ppt/references/checklist.md`](skills/guizang-ppt/) oder [`skills/dating-web/references/checklist.md`](skills/dating-web/) anlehnen.
5. **Screenshot unter `docs/screenshots/skills/<skill>.png`**, wenn der Skill featured ist. PNG, ca. 1024×640 retina, aus dem echten `example.html`.
6. **Ein einzelner, in sich geschlossener Ordner.** Keine CDN-Imports außer bereits verwendeten, keine unlizenzierte Fonts, keine Bilder über ca. 250 KB.

Wenn Sie einen vorhandenen Skill forken, behalten Sie LICENSE und Autorenschaft in `references/` und erwähnen Sie es in der PR-Beschreibung.

### Vorhandene Skills zum Nachahmen

- Visuelle Single-Screen-Prototypen: [`skills/dating-web/`](skills/dating-web/), [`skills/digital-eguide/`](skills/digital-eguide/)
- Multi-Frame Mobile-Flows: [`skills/mobile-onboarding/`](skills/mobile-onboarding/), [`skills/gamified-app/`](skills/gamified-app/)
- Dokument / Template: [`skills/pm-spec/`](skills/pm-spec/), [`skills/weekly-update/`](skills/weekly-update/)
- Deck-Modus: [`skills/guizang-ppt/`](skills/guizang-ppt/) und [`skills/simple-deck/`](skills/simple-deck/)

---

## Ein neues Design System hinzufügen

Ein Designsystem ist eine einzelne [`DESIGN.md`](design-systems/README.md) Datei unter `design-systems/<slug>/`. **Eine Datei, kein Code.** Ablegen, daemon neu starten, der Picker gruppiert es nach Kategorie.

### Designsystem-Ordnerlayout

```text
design-systems/your-brand/
└── DESIGN.md
```

### `DESIGN.md` Form

```markdown
# Design System Inspired by YourBrand

> Category: Developer Tools
> One-line summary that shows in the picker preview.

## 1. Visual Theme & Atmosphere
…

## 2. Color
- Primary: `#hex` / `oklch(...)`
- …

## 3. Typography
…

## 4. Spacing & Grid
## 5. Layout & Composition
## 6. Components
## 7. Motion & Interaction
## 8. Voice & Brand
## 9. Anti-patterns
```

Das 9-Section-Schema ist fest — Skill-Bodies greifen darauf per Suche zu. Das erste H1 wird zum Picker-Label (der Prefix `Design System Inspired by` wird entfernt), und `> Category: …` entscheidet die Gruppe. Bestehende Kategorien stehen in [`design-systems/README.md`](design-systems/README.md); nutzen Sie nach Möglichkeit eine vorhandene.

### Merge-Messlatte für ein neues Designsystem

1. **Alle 9 Sections vorhanden.** Leere Bodies sind bei schwer auffindbaren Daten akzeptabel, aber die Headings müssen da sein.
2. **Hex-Codes sind echt.** Direkt von Website oder Produkt sampeln, nicht aus Erinnerung oder AI raten.
3. **OKLch-Werte für Akzentfarben** sind nice-to-have und machen Paletten stabiler.
4. **Kein Marketing-Fluff.** Die Tagline einer Marke ist kein Design Token.
5. **Slug nutzt ASCII** — `linear.app` wird `linear-app`, `x.ai` wird `x-ai`.

Die gelieferten Produktsysteme werden aus [`VoltAgent/awesome-design-md`][acd2] über [`scripts/sync-design-systems.ts`](scripts/sync-design-systems.ts) importiert. Wenn Ihre Marke upstream passt, schicken Sie den PR zuerst dorthin; OD übernimmt ihn beim nächsten Sync.

---

## Eine neue coding-agent CLI hinzufügen

Eine neue Agent-CLI ist ein Eintrag in [`apps/daemon/src/agents.ts`](apps/daemon/src/agents.ts):

```javascript
{
  id: 'foo',
  name: 'Foo Coder',
  bin: 'foo',
  versionArgs: ['--version'],
  buildArgs: (prompt) => ['exec', '-p', prompt],
  streamFormat: 'plain',           // or 'claude-stream-json' if it speaks that
}
```

Der daemon erkennt sie im `PATH`, der Picker zeigt sie an und der Chat-Pfad funktioniert. Wenn die CLI **typed events** ausgibt, ergänzen Sie einen Parser in [`apps/daemon/src/claude-stream.ts`](apps/daemon/src/claude-stream.ts) und setzen `streamFormat`.

Merge-Bar:

1. **Eine echte Session läuft end-to-end** mit dem neuen Agent; fügen Sie den daemon log in die PR-Beschreibung ein.
2. **`docs/agent-adapters.md`** dokumentiert die Eigenheiten der CLI.
3. **Die README-Tabelle "Unterstützte Code-Agenten"** erhält eine Zeile.

---

## Wartung von Lokalisierungen

Deutsch verwendet das formelle `Sie`, weil OD eine gemischte Zielgruppe aus Solo-Creators, Agenturen und Engineering-Teams anspricht; solange Projektfeedback keine informelle `du`-Stimme nahelegt, ist formelles Deutsch die am wenigsten überraschende Vorgabe. Locale-PRs sollen UI-Chrome, zentrale Dokumentation und display-only Gallery-Metadaten in `apps/web/src/i18n/content.ts` übersetzen, aber nicht `skills/`, `design-systems/` oder Prompt-Bodies, die Agents ausführen. Diese Quell-Prompts sind Workflow-Eingaben; eine gemeinsame Quellsprache vermeidet multiplizierte Prompt-QA über alle Locales. Wenn ein Skill, Designsystem oder Prompt Template ergänzt oder umbenannt wird, aktualisieren Sie die deutschen Display-Metadaten und führen `pnpm --filter @agentik-design/web test` aus; `content.test.ts` schlägt fehl, wenn die deutsche Display-Coverage driftet. Daemon-Fehler, Export-Dateinamen und agent-generierte Artifact-Texte sind bekannte Grenzen, sofern ein PR sie nicht ausdrücklich umfasst.

---

## Code Style

Wir sind beim Formatting nicht pedantisch (Prettier on save ist okay), aber zwei Regeln sind nicht verhandelbar:

1. **Single quotes in JS/TS.** Strings sind single-quoted, außer Escaping macht sie hässlich.
2. **Kommentare auf Englisch.** Auch wenn ein PR etwas ins Deutsche oder Chinesische übersetzt, bleiben Code-Kommentare englisch, damit es eine greppable Referenzsprache gibt.

Außerdem:

- **Nicht erzählen.** Kein `// import the module`, kein `// loop through items`.
- **TypeScript** für `apps/web/src/`. Der daemon (`apps/daemon/`) ist plain ESM JavaScript mit JSDoc, wenn Typen wichtig sind.
- **Keine neuen Top-Level Dependencies** ohne Absatz in der PR-Beschreibung, was sie bringen und wie viele Bytes sie kosten.
- **Vor dem Push `pnpm typecheck` ausführen.** CI tut es auch.

---

## Commits & Pull Requests

- **Ein Anliegen pro PR.**
- **Titel ist imperativ + Scope.** `add dating-web skill`, `fix daemon SSE backpressure when CLI hangs`, `docs: clarify .od layout`.
- **Body erklärt das Warum.** Der Diff zeigt oft das Was, aber selten den Grund.
- **Issue referenzieren**, falls vorhanden. Bei nicht-trivialen PRs ohne Issue bitte zuerst eines öffnen.
- **Während Review nicht squashen.** Fixups pushen; wir squashen beim Merge.
- **Kein Force-Push auf Shared Branches**, außer Reviewer fragen danach.

Wir erzwingen kein CLA. Apache-2.0 deckt Beiträge ab; Ihr Beitrag ist unter derselben Lizenz.

---

## Bugs melden

Öffnen Sie ein Issue mit:

- Exaktem `pnpm tools-dev ...` Aufruf.
- Ausgewählter Agent-CLI oder BYOK-Pfad.
- Skill + Designsystem, die den Fehler ausgelöst haben.
- Relevanter **daemon stderr tail**.
- Screenshot, wenn es UI betrifft.

Für Prompt-Stack-Bugs fügen Sie die **vollständige Assistant Message** bei, damit klar ist, ob Modell oder Prompt verletzt wurde.

---

## Fragen stellen

- Architekturfrage, Designfrage, "Bug oder Fehlbenutzung?" → [GitHub Discussions](https://github.com/agentik-os/AgentikDesign/discussions) (bevorzugt, weil suchbar).
- "Wie schreibe ich einen Skill für X?" → Discussion öffnen. Wir beantworten sie und übernehmen fehlende Muster in [`docs/skills-protocol.md`](docs/skills-protocol.md).

---

## Was wir nicht annehmen

Um das Projekt fokussiert zu halten, öffnen Sie bitte keine PRs, die:

- **Eine Model Runtime vendoren.** OD setzt darauf, dass Ihre vorhandene CLI reicht.
- **Das Frontend ohne vorherige Abstimmung aus dem aktuellen Stack reißen.** Next.js 16 App Router + React 18 + TS ist gesetzt.
- **Den daemon durch eine Serverless Function ersetzen.** Der daemon besitzt ein echtes `cwd` und startet echte CLIs.
- **Telemetry / Analytics / Phone-home hinzufügen.** OD ist local-first.
- **Ein Binary bündeln** ohne Lizenzdatei und Autorenschaft direkt daneben.

Wenn Sie nicht sicher sind, ob eine Idee passt, öffnen Sie vor dem Code eine Discussion.

---

## Lizenz

Mit Ihrem Beitrag erklären Sie sich einverstanden, dass er unter der [Apache-2.0-Lizenz](LICENSE) dieses Repositories steht. Ausnahme sind Dateien in [`skills/guizang-ppt/`](skills/guizang-ppt/), die ihre ursprüngliche MIT-Lizenz und Autorenschaft von [op7418](https://github.com/op7418) behalten.

[skill]: https://docs.anthropic.com/en/docs/claude-code/skills
[guizang]: https://github.com/op7418/guizang-ppt-skill
[acd2]: https://github.com/VoltAgent/awesome-design-md
[ocod]: https://github.com/OpenCoworkAI/open-codesign
