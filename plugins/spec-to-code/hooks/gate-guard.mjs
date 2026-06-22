#!/usr/bin/env node
// spec-to-code gate guard (PreToolUse: Edit|Write|MultiEdit)
//
// Staged enforcement — blocks edits until the required gate docs are approved.
// Stages (in .spec-to-code-state.json):
//   (stage 0) 02-resolved-spec.md → blocked until 00-gap-analysis.md exists in the same
//             v<N>/ dir (Phase-2 enumeration must precede the Gate-1 contract; presence-only)
//   designApproved=false → block ALL code & test files (only docs editable)
//   designApproved=true, testsApproved=false → allow TEST files, block impl files
//   testsApproved=true → code/tests allowed
//   reviewApproved=false → block writing 07-verify.md / 08-completion.md
//                          (can't advance to comprehensive-verify / Gate 2 until the
//                           latest review round is approved by the user)
// Always allows: the state file, the doc home (except the two review-gated docs),
// .claude/. Fail OPEN on any error.
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join, sep, basename } from 'node:path'

function readStdin() { try { return readFileSync(0, 'utf8') } catch { return '' } }
function findStateFrom(startDir) {
  let dir = startDir
  for (;;) {
    const p = join(dir, '.spec-to-code-state.json')
    if (existsSync(p)) return p
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}
function within(child, parent) { return child === parent || (child + sep).startsWith(parent + sep) }
function isTestFile(abs) {
  const b = basename(abs)
  return /\.(test|spec)\.[cm]?[jt]sx?$/i.test(b) ||
         /(^|[\/])(tests?|__tests__|spec|specs)([\/]|$)/i.test(abs) ||
         /_test\.[a-z]+$/i.test(b) || /^test_/i.test(b)
}

try {
  const input = JSON.parse(readStdin() || '{}')
  const filePath = input?.tool_input?.file_path
  const cwd = input?.cwd || process.cwd()
  if (!filePath) process.exit(0)

  const targetAbs = resolve(cwd, filePath)
  const statePath = findStateFrom(dirname(targetAbs)) || findStateFrom(resolve(cwd))
  if (!statePath) process.exit(0)

  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  if (!state.active) process.exit(0)

  const root = dirname(statePath)
  if (targetAbs === resolve(root, '.spec-to-code-state.json')) process.exit(0)
  if (within(targetAbs, resolve(root, '.claude'))) process.exit(0)

  const docHome = state.docHome || 'docs/spec-to-code/<slug>'
  const inDocHome = within(targetAbs, resolve(root, state.docHome || 'docs/spec-to-code'))

  // Stage 3: the comprehensive-verify (07) and completion (08) docs are the artifacts
  // that move the flow PAST the review loop. Block them until the latest review round
  // is approved — otherwise the run can silently skip the Review-loop 🔴 stop.
  const isReviewGatedDoc = /^0?7-verify\.md$/i.test(basename(targetAbs)) ||
                           /^0?8-completion\.md$/i.test(basename(targetAbs))
  if (inDocHome && isReviewGatedDoc && !state.reviewApproved) {
    process.stderr.write(
      `⛔ spec-to-code: '${state.slug || '?'}' — the latest REVIEW round is NOT approved yet.\n` +
      `The review loop is a hard stop: run an independent reviewer, write ${docHome}/v<N>/06-review/r<k>.md, ` +
      `let the USER disposition each finding and approve the round (note: "fix all" is a disposition, NOT round approval). ` +
      `Only then set reviewApproved=true in .spec-to-code-state.json — and only then write 07-verify.md / 08-completion.md.\n`
    )
    process.exit(2)
  }

  // Stage 0: the resolved spec (02, the Gate-1 contract) may not be written until the
  // gap-analysis grid (00) exists in the SAME version dir. This makes Phase-2 enumeration
  // structurally un-skippable — you cannot reach the contract without first producing the
  // filled decision-table / state×event matrix. (Presence only; completeness is the
  // critic's + the exit checklist's job — a hook cannot judge it.)
  const isResolvedSpec = /^0?2-resolved-spec\.md$/i.test(basename(targetAbs))
  if (inDocHome && isResolvedSpec) {
    const gapDoc = join(dirname(targetAbs), '00-gap-analysis.md')
    if (!existsSync(gapDoc)) {
      process.stderr.write(
        `⛔ spec-to-code: '${state.slug || '?'}' — gap analysis (00) is missing.\n` +
        `Write ${docHome}/v<N>/00-gap-analysis.md FIRST: list the axes, build the decision table(s) / ` +
        `state×event matrix(es) with EVERY cell decided (no empty cells), apply branch-complement to every ` +
        `conditional, and run the adversarial completeness critic. Only then write 02-resolved-spec.md.\n` +
        `(Enumeration is unconditional — not gated on spec size. See references/gap-analysis.md.)\n`
      )
      process.exit(2)
    }
  }

  // All other doc-home writes are always allowed (specs, design, tests doc, reviews…).
  if (inDocHome) process.exit(0)

  // Stage 1: design (and the spec it builds on) must be approved before ANY code/test.
  if (!state.designApproved) {
    process.stderr.write(
      `⛔ spec-to-code: '${state.slug || '?'}' — DESIGN is NOT approved yet.\n` +
      `Write the complete dev doc ${docHome}/DESIGN.md (files, function list, full behavior spec), ` +
      `hand the user the path, and get approval. Set designApproved=true in .spec-to-code-state.json before any code or tests.\n` +
      `(Unrelated edit? set "active": false in .spec-to-code-state.json.)\n`
    )
    process.exit(2)
  }
  // Stage 2: implementation files need the tests approved first; test files are allowed now.
  if (!state.testsApproved && !isTestFile(targetAbs)) {
    process.stderr.write(
      `⛔ spec-to-code: '${state.slug || '?'}' — design approved, but TESTS are not approved yet.\n` +
      `Write the RED tests first, record them in ${docHome}/D-test-doc.md, get the user's approval, ` +
      `then set testsApproved=true before writing implementation.\n`
    )
    process.exit(2)
  }
  process.exit(0)
} catch {
  process.exit(0)
}
