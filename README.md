# Policy Gap Analyzer

Paste an information security policy. Get a control-by-control gap assessment against all 93
ISO/IEC 27001:2022 Annex A controls — status, policy evidence, and remediation actions —
exportable as an audit-ready Markdown report or CSV.

Built for ITGC testers, GRC analysts, and anyone doing pre-fieldwork policy adequacy review.

**Live demo:** https://kleckie7.github.io/policy-gap-analyzer/ (bring your own Anthropic API key)

## What it does

1. Accepts a policy as pasted text or a `.txt` / `.md` file (a realistic sample policy is built in)
2. Assesses it against the Annex A catalog — 37 organizational, 8 people, 14 physical, 34 technological controls — in batches via the Claude API
3. Grades each control **Covered / Partial / Missing** with an evidence quote from the policy and a one-line remediation
4. Scores overall coverage as `(Covered + 0.5 × Partial) / total`, rolled up per theme
5. Exports a dated gap-assessment report (`.md`) and raw data (`.csv`)

Grading is deliberately strict: generic policy statements earn *Partial*, not *Covered*.

## Run it

No build, no install — it's one HTML file.

- **Hosted:** open the live demo link above, paste your Anthropic API key (step 0), load the sample policy, click **Analyze policy**.
- **Local:** download `index.html`, open it in any modern browser, same steps.

Your API key is held in the page's memory for the session only. It is sent to `api.anthropic.com`
and nowhere else. Nothing is stored; refresh and it's gone. Get a key at console.anthropic.com —
a full 93-control run costs a few cents.

## Architecture

Single-file vanilla HTML/CSS/JS. The Annex A catalog (control IDs and short titles only) is embedded.
Selected controls are chunked into batches of ≤16; each batch is one Claude API call constrained to a
compact JSON schema. Responses are defensively parsed (fenced/prefixed JSON handled), invalid or missing
items fail safe to *Missing*, and each batch gets one retry before graceful degradation.

Core logic (catalog integrity, batching, parsing, scoring, priority ordering, exports, escaping) is
covered by a 34-case test suite in `test_logic.js` — run with `node test_logic.js`.

## Scope and limitations

- Assesses **policy adequacy** (test of design against control objectives) — not implementation or operating effectiveness
- Text/Markdown input only in v0.1 (PDF/DOCX parsing is on the roadmap)
- Output assists human review. It is **not** an audit opinion, certification assessment, or legal advice — verify findings against the official standard and your Statement of Applicability
- Control titles are referenced for identification; ISO/IEC 27001:2022 text is © ISO/IEC and is not reproduced here

## Roadmap

- v0.2 — PDF/DOCX ingestion, per-control confidence notes
- v0.3 — Statement of Applicability import, multi-policy corpus analysis

## About

Built by [Kent Leckie](https://github.com/kleckie7) — documenting a pivot from professional
photography into GRC, in public. CISA candidate, ISO 27001 Lead Implementer in progress.

License: MIT
