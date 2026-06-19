#!/usr/bin/env node
// spec-to-code gate guard (PreToolUse: Edit|Write|MultiEdit)
//
// Enforces the flow's checkpoint: while a spec-to-code run is ACTIVE but the gate
// is NOT yet approved, block edits to code/test files. Allow the state file,
// the doc home (artifacts), and .claude. Fail OPEN on anything unexpected so it
// can never brick normal editing.
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join, sep } from 'node:path'

function readStdin() {
  try { return readFileSync(0, 'utf8') } catch { return '' }
}

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

function within(child, parent) {
  return child === parent || (child + sep).startsWith(parent + sep)
}

try {
  const input = JSON.parse(readStdin() || '{}')
  const filePath = input?.tool_input?.file_path
  const cwd = input?.cwd || process.cwd()
  if (!filePath) process.exit(0)

  const targetAbs = resolve(cwd, filePath)
  const statePath = findStateFrom(dirname(targetAbs)) || findStateFrom(resolve(cwd))
  if (!statePath) process.exit(0) // no active flow anywhere → allow

  const state = JSON.parse(readFileSync(statePath, 'utf8'))
  if (!state.active || state.gateApproved) process.exit(0) // not gating → allow

  const root = dirname(statePath)
  // Always allow: the state file itself, the doc home (artifacts), .claude/
  if (targetAbs === resolve(root, '.spec-to-code-state.json')) process.exit(0)
  if (within(targetAbs, resolve(root, state.docHome || 'docs/spec-to-code'))) process.exit(0)
  if (within(targetAbs, resolve(root, '.claude'))) process.exit(0)

  // Block code/test edits before the gate is approved.
  const gate = state.tier === 'lite' ? 'lite L2 confirm' : 'Gate 1'
  process.stderr.write(
    `⛔ spec-to-code: feature '${state.slug || '?'}' is mid-flow and ${gate} is NOT approved yet.\n` +
    `Resolve the spec gaps and write the resolved spec (${state.docHome || 'docs/spec-to-code/<slug>'}/A-resolved-spec.md), ` +
    `get the user's approval, then set gateApproved=true in .spec-to-code-state.json before editing code/tests.\n` +
    `If this edit is unrelated to spec-to-code, set "active": false in .spec-to-code-state.json (or delete it).\n`
  )
  process.exit(2) // block; stderr is fed back to Claude
} catch {
  process.exit(0) // fail open — never block on guard errors
}
