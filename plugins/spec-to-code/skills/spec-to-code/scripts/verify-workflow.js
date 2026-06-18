export const meta = {
  name: 'spec-to-code-verify',
  description: 'Phase-10 comprehensive verification: audit spec-conformance, traceability coverage, and logic/UI separation in parallel, then adversarially verify each finding.',
  phases: [
    { title: 'Audit', detail: 'conformance / coverage / separation as parallel dimensions' },
    { title: 'Verify', detail: 'adversarially re-check each finding' },
  ],
}

// Adapt before running: pass paths + commands via `args` from the skill, e.g.
//   { resolvedSpec, testDoc, traceability, testCmd, e2eCmd, changedFiles: [...] }
const a = args || {}
const ctx = `
Resolved Spec (A): ${a.resolvedSpec || 'docs/spec-to-code/<slug>/A-resolved-spec.md'}
Test Doc (D):      ${a.testDoc || 'docs/spec-to-code/<slug>/D-test-doc.md'}
Traceability (B):  ${a.traceability || 'docs/spec-to-code/<slug>/B-traceability.md'}
Test command:      ${a.testCmd || '(detect from package.json)'}
E2E command:       ${a.e2eCmd || '(detect: playwright test)'}
Changed files:     ${(a.changedFiles || []).join(', ') || '(use git diff)'}
`

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { enum: ['blocker', 'major', 'minor'] },
          claim: { type: 'string' },
          evidence: { type: 'string' },
          location: { type: 'string' },
        },
        required: ['id', 'severity', 'claim', 'evidence'],
      },
    },
  },
  required: ['dimension', 'findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    real: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['id', 'real', 'reason'],
}

const DIMENSIONS = [
  {
    key: 'conformance',
    prompt: `Audit SPEC CONFORMANCE. For every case in the Resolved Spec (A), confirm a test or screenshot actually exercises it AND asserts the expected result (reject hollow always-pass tests). Report each case that is uncovered, weakly covered, or contradicted by the code.\n${ctx}`,
  },
  {
    key: 'coverage',
    prompt: `Audit TRACEABILITY COVERAGE. Read the Traceability Matrix (B) and the Test Doc (D). Report every row that is TODO/empty/—, every spec case in A missing from B, and every test in D not tracing to an A case. Run the test command and report pass/fail/flake counts.\n${ctx}`,
  },
  {
    key: 'separation',
    prompt: `Audit LOGIC/UI SEPARATION. Inspect the changed files. Report logic modules that import UI/DOM/framework rendering, UI components carrying business rules that belong in logic, and anything that would make the logic untestable without a DOM.\n${ctx}`,
  },
]

phase('Audit')
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, { label: `audit:${d.key}`, phase: 'Audit', schema: FINDINGS_SCHEMA }),
  (review, dim) =>
    parallel(
      (review?.findings || []).map(f => () =>
        agent(
          `Adversarially verify this ${dim.key} finding. Default to real=false unless the evidence clearly holds. Finding: ${f.claim}\nEvidence: ${f.evidence}\nLocation: ${f.location || 'n/a'}\nContext:${ctx}`,
          // agentType: 'spec-verifier' is used when the plugin is installed; harmless to omit if running the skill standalone.
          { label: `verify:${dim.key}:${f.id}`, phase: 'Verify', schema: VERDICT_SCHEMA, agentType: 'spec-verifier' }
        ).then(v => ({ ...f, dimension: dim.key, verdict: v }))
      )
    )
)

const confirmed = results.flat().filter(Boolean).filter(f => f.verdict?.real)
return {
  confirmed,
  blockers: confirmed.filter(f => f.severity === 'blocker'),
  summary: `${confirmed.length} confirmed issue(s); ${confirmed.filter(f => f.severity === 'blocker').length} blocker(s).`,
}
