#!/usr/bin/env node
// spec-to-code gate guard (PreToolUse: Edit|Write|MultiEdit)
//
// Staged enforcement — blocks code/test edits until the required gate docs are
// approved. Stages (in .spec-to-code-state.json):
//   designApproved=false → block ALL code & test files (only docs editable)
//   designApproved=true, testsApproved=false → allow TEST files, block impl files
//   testsApproved=true → allow all
// Always allows: the state file, the doc home, .claude/. Fail OPEN on any error.
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
  if (within(targetAbs, resolve(root, state.docHome || 'docs/spec-to-code'))) process.exit(0)
  if (within(targetAbs, resolve(root, '.claude'))) process.exit(0)

  const docHome = state.docHome || 'docs/spec-to-code/<slug>'
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
