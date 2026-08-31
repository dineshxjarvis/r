# Wave 8 — Statutory Reporting Whole-System Gap Audit

## A. Outcome and boundary

Outcome: produce, attest, submit and reconstruct each required return from governed source facts, while proving exactly what the receiving authority acknowledged or decided. Reporting owns compilation/filing; source domains, compliance, documents, identity, integration and authorities retain their decisions.

## B. Real-world actor/accountability map

Report policy/legal owner defines; source custodians own facts; preparer compiles; reviewer validates; statutory appointment/authorized signatory attests; filing officer/adapter submits; integration operator reconciles; receiving authority acknowledges/accepts/returns; compliance verifier decides obligation satisfaction. Vacancy/absence routes only to independently authorized posts.

## C. Authoritative records and ownership

Definition/version, filing obligation, compilation/content, source manifest, validation, attestation, rendering/package, submission/attempt, receipt, authority status and reconciliation are distinct. PDF is an artifact; portal response is an external record; dashboard status is projection.

## D. Lifecycle and handoff trace

```text
obligation/definition → source freeze → compile → validate/reconcile → review
→ signer preview/consent/attestation → immutable package → transport attempt
→ correlated receipt → authority acknowledgement/acceptance/return
→ compliance verification or corrected/superseding filing
```

## E. Physical/device/offline model

Signing may require approved DSC/eSign/portal e-authentication and network/provider access. Manual/hybrid filing captures exact package hash and two-person receipt confirmation. Private keys/PINs never enter Strata. Portal outage and timeout preserve attempt evidence and do not trigger blind resend.

## F. Authority and separation-of-duties matrix

Definition author cannot alone publish high-risk policy. Preparer cannot correct sources or sign by implication. Reviewer approval is not signature. Delegate cannot inherit statutory signing. Adapter cannot declare authority acceptance. Compliance verifier remains separate from filing transport.

## G. Failure, abuse and recovery scenarios

Tested: missing/stale source, false zero, contradictory NIL, source change after signature, expired/revoked signer, template migration, portal outage, timeout-after-send, duplicate retry, manual receipt fraud, authority return, late correction, external value discrepancy, attachment malware and unauthorized package read.

## H. Upstream/downstream dependency impacts

Upstream: obligations, identity/signing, documents/evidence, production, environment, incidents, attendance, contractors and GIS. Downstream: compliance verification, applications/cases, adapters, dashboards, search, analytics and audit. Wave 12 implements channels; Wave 15 hardens signing/audit/retention.

## I. Gap register

### GAP-08-001

- **Gap:** no canonical distinction among definition, filing obligation, report content, artifact, package and submission.
- **Impact:** one mutable PDF becomes both source and legal status.
- **Resolution:** separated versioned records and ownership.
- **Status:** `RESOLVED`.

### GAP-08-002

- **Gap:** report fields lacked exact source/version/transformation/coverage manifest.
- **Impact:** figures cannot be reproduced or impacted when facts change.
- **Resolution:** typed field provenance and immutable source manifest.
- **Status:** `RESOLVED`.

### GAP-08-003

- **Gap:** missing data, zero, NIL and incomplete coverage could be conflated.
- **Impact:** false statutory declarations and misleading clean reports.
- **Resolution:** explicit missing/coverage states and signed predicate-based NIL contradiction gates.
- **Status:** `RESOLVED`.

### GAP-08-004

- **Gap:** review, approval, signature mechanism and signing authority were conflated/hard-coded.
- **Impact:** unauthorized or technically invalid attestation.
- **Resolution:** definition-specific current authority, signer preview/challenge, configurable CCA/portal mechanism and immutable signature evidence.
- **Status:** `RESOLVED`.

### GAP-08-005

- **Gap:** generated/transmitted/acknowledged/accepted/compliant states were conflated.
- **Impact:** HTTP/email success could appear as legal compliance.
- **Resolution:** separate report, attempt, receipt, authority and obligation-verification lifecycles.
- **Status:** `RESOLVED`.

### GAP-08-006

- **Gap:** timeout, duplicate, manual filing, return and correction recovery were undefined.
- **Impact:** duplicate or lost filings and destroyed original history.
- **Resolution:** idempotency/correlation, unknown-outcome reconciliation, two-person manual proof and immutable correction chains.
- **Status:** `RESOLVED`.

### GAP-08-007

- **Gap:** source/definition/evidence change after attestation had no downstream impact path.
- **Impact:** known-invalid filing remains silently trusted.
- **Resolution:** impact cases enumerate drafts, signatures and filings; no retroactive mutation.
- **Status:** `RESOLVED`.

### GAP-08-008

- **Gap:** exact authority schemas, signature/e-authentication profiles, APIs and acknowledgement semantics are not uniformly published/available.
- **Impact:** Strata cannot claim live national filing interoperability from architecture alone.
- **Resolution:** effective channel/profile contract fixed; Wave 12/onboarding supplies approved adapters and credentials.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Legal/report owner approves each definition, applicability, NIL and correction rule.
2. Receiving-authority/integration owner approves schema/channel/receipt/acceptance semantics.
3. Identity/security owner approves signature/e-authentication, certificate/status/timestamp and secret boundary.
4. Records/privacy owners approve classification, recipient projection and retention.

## K. Canonical documents that must change

Feature, logical model, API/indexes, authorization, glossary, capability/inventory, decisions, compliance/signature/integration boundaries and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** Requirements and signed-manifest fragments existed, but no canonical report/filing lifecycle or acknowledgement proof contract existed.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-08-001 through 007 are resolved. GAP-08-008 remains an explicit Wave 12/onboarding dependency.
