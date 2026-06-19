# Spec ingestion — normalizing any input format

Specs arrive in many shapes: a markdown file, an HTML mockup, a PDF, a screenshot or Figma export, a `.docx`, a URL, or just pasted text. Before gap analysis, normalize whatever was given into an analyzable working spec — and, for visual formats, preserve the layout/visual cues that the UI layer will need.

## Detect the format

Look at what the user provided:
- **File path** → read its extension and sniff contents.
- **Pasted text** → markdown/plain, or raw HTML, or a table — treat inline.
- **URL** → web page, Figma, Notion, Google Doc, etc.
- **Image attached** → screenshot/diagram/mockup.

Never assume `.md`. Ask only if the input is genuinely unidentifiable.

## Read each format

| Format | How to read | Notes |
|--------|-------------|-------|
| Markdown / text | Read directly | simplest case |
| HTML / mockup | Read the file (it is text); extract the meaningful content and structure. If it is an interactive mockup, also open it in a browser (Playwright / preview) to capture rendered states | **keep layout/visual cues** — class names, sections, component structure inform the UI layer |
| PDF | Read tool with `pages` | for >10 pages, page through in batches |
| Image (screenshot, Figma export, diagram) | Read the image (vision) | transcribe text AND describe layout, states, components, annotations |
| `.docx` | the `docx` skill | extract text, tables, comments |
| URL (web/Figma/Notion/Doc) | WebFetch; for Figma/interactive, render in browser | follow links the spec depends on |
| Mixed / multiple files | ingest each, then merge into one working spec | note which source each requirement came from |

## Normalize

Produce a single **working spec**: the requirements as analyzable text, section by section, with a pointer back to each source. This is the input to gap analysis (Phase 2) — not a rewrite the user must approve (that is the Resolved Spec, the resolved spec, which comes after gaps are resolved).

**Persist two things:**

1. **Archive the original, verbatim** — copy what the user provided into `docs/spec-to-code/<slug>/source/<date>-original.<ext>`: a pasted spec saved as `.md`, a file copied as-is, an image copied in, a URL saved as its fetched/rendered snapshot (record the URL too). The user's own file stays where it is — this is a *copy*, so the no-touch rule still holds. Each run adds its original; never delete prior ones. Without this, a transient paste or a later-changed Figma/URL leaves nothing to verify normalization against or to re-normalize from.
2. **Save the normalized working spec** to `01-working-spec.md`, with a header pointing to the archived original it was derived from.

**Diff baseline = `01-working-spec.md` (normalized), not the raw originals** — run-to-run the original format may differ (PDF this time, HTML next), so only the normalized form is reliably comparable. On an update, diff the new normalized spec against the saved `01-working-spec.md`, then overwrite it (git history keeps the prior). The archived originals are there for fidelity-checking, re-normalization, and — when two runs share a format — a direct original-vs-original sanity diff.

For **visual sources** (HTML, images, Figma), additionally capture a **visual notes** block: layout, spacing intent, component hierarchy, explicit and implied states, and any annotations. This feeds both gap analysis (e.g. "what does the error state look like?") and the UI/appearance layers later.

## Watch for

- **Lossy formats** — a screenshot may omit behavior entirely; an HTML mockup shows the happy path but not error/empty states. These omissions ARE gaps — feed them straight to gap analysis.
- **Multiple conflicting sources** — a PDF spec plus a newer Figma may disagree. Record the conflict as a gap; do not silently pick one.
- **Visual-only specs** — when the only input is an image/mockup, nearly all behavior is unstated. Expect a large gap list; that is correct, not a failure.
- **Keep the originals reachable** — reference the source files/links in the resolved spec so the user can check your reading against them.
