# Strata — Identity, Organisation, Authority and Jurisdiction

## 1. Purpose and authority

This is the canonical foundation for authentication and authorisation in Strata. Read it before changing sessions, people, organisations, posts, appointments, regulator access, tenant isolation, or an endpoint's `Auth` rule.

The model keeps six questions separate:

| Question | Canonical concept |
|---|---|
| Who authenticated? | `principal` through a server-side `session` |
| Which human acted? | `person` linked to that principal |
| With whom are they associated? | Time-bounded `affiliation` |
| Which position do they hold? | Time-bounded `appointment` to a `post` |
| Where does authority apply? | Time-bounded `jurisdiction_assignment` |
| What may they do there? | `capability` granted through a mandate or position policy |

Do not collapse these concepts into `person_type`, a cookie role, or a role enum.

## 2. Invariants

1. A cookie identifies a session, never a role, tenant, mine, regulator, or permission.
2. A person may have several concurrent and historical affiliations and appointments.
3. An organisation owns positions; a tenant is an isolation boundary, not an organisation type.
4. Regulators are identified by authority, unit, mandate, jurisdiction, and validity—not generic `INSPECTOR`.
5. A selected workspace affects navigation only. Every request is authorised against its target.
6. Permissions expire when a supporting affiliation, appointment, mandate, jurisdiction, engagement, session, or credential expires.
7. View, inspect, verify evidence, approve action, close a finding, and sign a submission are distinct capabilities.
8. Historical access is derived from the historical record; it is not permanent current membership.
9. PostgreSQL is canonical for relationships. OpenFGA is a derived authorization index updated through the outbox.
10. Missing jurisdiction, mandate, target scope, or current relationship denies the action.

## 3. Tenancy and organisations

### 3.1 Tenant boundary

A `tenant` is the primary operational data-isolation boundary. Expected production tenants include CIL, SCCL, and individual captive or commercial operators. A deployment may host many tenants.

CIL is one tenant by default. Subsidiaries such as SECL are organisational units within it. Ministry and regulator users are platform identities with explicitly governed cross-tenant portfolios; they are not made members of every tenant.

### 3.2 Administrative and physical hierarchies

`organization` represents a legal or administrative body: Ministry of Coal, an operating company, DGMS, MoEFCC, an SPCB, or a contractor.

`organization_unit` is recursive and can represent a subsidiary, area, directorate, regional office, zone, or project office. It must not force every operator into `operator → subsidiary → area`.

The physical hierarchy stays separate:

```text
tenant → organisation units
mine → subunit → asset
```

`asset_responsibility` links an organisation unit to a mine or asset. This prevents fake hierarchy layers for operators that do not use CIL's structure.

### 3.3 Cross-tenant access

Ordinary operator requests select one active tenant context. Cross-tenant endpoints must require a cross-tenant capability, calculate an authorised resource set, query only that set, record requested versus effective scope, and purpose-log regulated reads.

## 4. Identity, credentials, and sessions

### 4.1 Person, principal, and affiliation

`person` describes a human and contains no role, tenant, employment type, or account status. `principal` is an authenticating subject. Human principals link to one person; service principals are separately governed.

`affiliation` records a person's relationship with an organisation over time, such as employee, contractor worker, regulator officer, consultant, or secondee. A person can hold several. Account lifecycle belongs to `principal`; departure belongs to `affiliation`.

### 4.2 Authentication versus signing

Password verifiers, passkeys, and OIDC identities authenticate a principal. DSC, Aadhaar eSign, and certificates attest a signature over a specific payload. They are separate records and workflows.

An OIDC identity is keyed by `(issuer, subject)`, never email. Email is mutable contact data.

### 4.3 Session contract

The browser cookie contains only a high-entropy opaque session ID. Server-side state contains principal ID, issued/idle/absolute expiry, authentication assurance and time, a revocation version, optional selected workspace, and CSRF state.

Required behaviour:

- Rotate the session ID on login and privilege elevation.
- Revoke server state at logout; clearing the cookie alone is insufficient.
- Revoke sessions after account suspension, reset, or compromise.
- Re-evaluate authority on every request; do not cache it for the session lifetime.
- Protect cookie-authenticated mutations against CSRF even with `SameSite=Strict`.
- Security-log login success/failure, logout, reset, credential changes, and session revocation.

### 4.4 Request resolution

```text
request → session → principal → target resource and tenant
        → current assignments and context
        → Check(principal, capability, resource, context)
        → tenant/resource filter → transaction and audit
```

The resource determines scope. Client-supplied tenant, mine, appointment, or workspace identifiers are never proof of authority.

## 5. Positions, appointments, and capabilities

A `position_template` is a reusable position kind such as Mine Manager, Safety Officer, Inspector of Mines, or Regional Officer. A `post` is a concrete position in an organisation unit.

Posts declare `SINGLE_HOLDER` or `MULTI_HOLDER`. Several posts may share a template and scope. Never enforce uniqueness on `(role, scope)` alone.

An `appointment` connects a person to a post for a validity interval and source instrument. Its mode is `REGULAR`, `ACTING`, or `ADDITIONAL_CHARGE`. Notification delegation remains receipt-only and grants no authority.

Appointment authority requires a current appointment, active post/organisation, current required affiliation, and current mandates and jurisdiction. Single-holder overlap is enforced only for a single-holder post.

A capability is an action, not a title. Examples include `mine.read_internal`, `evidence.capture`, `evidence.verify`, `finding.raise`, `finding.close_internal`, `finding.close_regulatory`, `clearance.monitor`, `accident.enquire`, `submission.sign`, `tenant.configure`, and `portfolio.read`.

## 6. Regulatory authority and jurisdiction

`regulatory_authority` identifies DGMS, MoEFCC, CPCB, an SPCB, or another authority. `authority_unit` identifies its headquarters, zone, region, or state office.

A regulator appointment receives `mandate_assignment` rows. For example, a DGMS appointment may receive mine-safety inspection or accident-enquiry mandates, while a MoEFCC appointment may receive environmental-clearance monitoring. Actual grants come from the appointment instrument; the authority name alone grants nothing.

A `jurisdiction_assignment` limits a mandate by explicit mine set, tenant portfolio, organisation unit, state/geography, authority region, or approved platform portfolio. It is time-bounded and superseded, never deleted to represent redistricting.

```text
effective authority = valid appointment
                    ∩ valid mandate
                    ∩ valid jurisdiction
                    ∩ resource policy
```

Regulator-issued records store issuing authority, unit, and appointment where applicable. A boolean `raised_by_regulator` is insufficient. Operator authority never implies regulator closure authority.

## 7. Authorization decision contract

Every protected operation defines its capability, canonical resource, server-derived resource scope, principal, acting person, supporting assignment, purpose where required, authentication assurance, and decision time.

Mutating legal actions persist the exact appointment and mandate that authorised the decision. OpenFGA handles graph relationships; the policy layer handles time, severity, evidence verdict, assurance, purpose, and separation of duties. Handlers must not invent independent role checks.

## 8. Contractor access

Current contractor access requires both a valid person-to-contractor affiliation and a valid contractor-to-resource engagement. Both relationships are time-bounded in OpenFGA or checked by policy.

Historical access is record-specific: the person must have been affiliated during the relevant period and the organisation must be recorded as a responsible or participating party. It does not restore general mine access.

## 9. Tenant enforcement

RLS is defence in depth, not the policy engine. Ordinary requests set one validated `app.tenant_id` with `SET LOCAL`. Cross-tenant portfolio requests use an authorised resource-set path rather than disabling RLS for an `INSPECTOR` or administrator. Platform administration is an explicit capability on a governed platform post.

## 10. Required edge-case tests

1. Concurrent posts at two mines resolve the correct appointment per resource.
2. A workspace names Mine A while a request targets unauthorized Mine B: deny.
3. A DGMS officer cannot perform MoEFCC clearance actions.
4. Officers in one authority unit can hold different mine coverage.
5. A noon jurisdiction change produces correct before/after decisions.
6. Appointment expiry during a session denies the next request.
7. Expired contractor membership denies current access despite an active engagement.
8. Historical contractor read is limited to qualifying historical records.
9. Several inspectors coexist without a uniqueness conflict.
10. A single-holder Mine Manager overlap fails transactionally.
11. Additional charge coexists with a person's regular appointment.
12. Operator authority cannot close a regulator-issued finding.
13. Ministry portfolio access is clipped and its effective scope logged.
14. Account suspension revokes existing sessions.
15. Workspace changes do not change permission.
16. Signing rejects insufficient authentication/signature assurance.

## 11. Prototype and production

The prototype uses the same model with a smaller authority and capability catalogue: one DGMS unit, one environmental authority unit, one Ministry portfolio assignment, and three mines are sufficient. It must not replace the model with hard-coded role switches.

Production adds verified government federation, complete authority catalogues, jurisdiction imports, strong signing identities, policy administration, and highly available authorization infrastructure without changing the relationships above.
