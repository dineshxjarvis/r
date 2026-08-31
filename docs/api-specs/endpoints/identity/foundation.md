# Identity and authority API foundation

The canonical resource, route, and **action** map for identity, organisations, appointments, regulator authority, and jurisdiction. Read this before any dependent contract; nothing elsewhere may override it.

Envelope, query grammar, action envelope, and status codes: [`../../README.md`](../../README.md). Relational contract: [`../../../architecture/foundation-data-model.md`](../../../architecture/foundation-data-model.md). Semantics: [`../../../architecture/identity-authority-model.md`](../../../architecture/identity-authority-model.md).

## Resource ownership

| Resource | Owns | Does not own |
|---|---|---|
| `people` | Human profile | Login status, employment type, role |
| `principals` | Login/service identity and lifecycle | Job title or scope |
| `authentication-methods` | Password/OIDC/passkey bindings | DSC/eSign records |
| `signing-identities` | Certificate/eSign identity | Browser sessions |
| `auth/sessions` | Authentication state and UI context | Authorization grants |
| `tenants` | Data-isolation boundary | Organisation hierarchy |
| `organizations` | Legal/administrative body — operator, contractor, regulator, ministry | Physical mine hierarchy |
| `organization-units` | Recursive administrative hierarchy | Tenant isolation |
| `affiliations` | Person-to-organisation interval | Permission by itself |
| `mines` / `subunits` / `assets` | Physical hierarchy | Administrative hierarchy |
| `asset-responsibilities` | Unit-to-physical-asset link, temporal | Capability |
| `position-templates` | Reusable position definition | Current holder |
| `position-capability-policies` | Capabilities a template confers | Coverage |
| `posts` | Concrete position and holder policy | Person identity |
| `appointments` | Person-to-post authority interval | Jurisdiction by itself |
| `regulatory-authorities` | DGMS/MoEFCC/CPCB/SPCB identity | Officer permissions |
| `authority-units` | Region/zone/state-office hierarchy | Mine coverage by itself |
| `mandates` | Authority capability vocabulary | Jurisdiction |
| `mandate-assignments` | Appointment-to-mandate grant | Coverage |
| `jurisdiction-assignments` | Time-bounded coverage | Capability |
| `contractor-engagements` | Contractor resource scope and restriction | Worker membership |
| `record-parties` | Record-specific historical access | General mine access |
| `responsibility-routes` | Notification/work routing | Legal authority |

## Canonical route map

Four forms only. Read, create, act, history.

```text
# Authentication
POST   /auth/sessions
GET    /auth/sessions
POST   /auth/sessions/{id}/actions          REVOKE · REVOKE_ALL_OTHER
GET    /users/me
PATCH  /users/me

# People and login
GET    /people                POST /people
GET    /people/{id}           PATCH /people/{id}
POST   /people/{id}/actions                 MERGE · DEACTIVATE · REACTIVATE
GET    /people/{id}/history
GET    /affiliations          POST /affiliations
GET    /affiliations/{id}
POST   /affiliations/{id}/actions           REVOKE · SUPERSEDE · EXTEND
GET    /principals            POST /principals
GET    /principals/{id}
POST   /principals/{id}/actions             ACTIVATE · SUSPEND · DISABLE · FORCE_CREDENTIAL_ROTATION · RESEND_INVITATION · ROTATE_SERVICE_SECRET
GET    /authentication-methods              POST /authentication-methods
POST   /authentication-methods/{id}/actions REVOKE
GET    /signing-identities                  POST /signing-identities
POST   /signing-identities/{id}/actions     REVOKE

# Tenancy and organisation
GET    /tenants               POST /tenants
GET    /tenants/{id}          PATCH /tenants/{id}
POST   /tenants/{id}/actions                SUSPEND · RESUME · ARCHIVE
GET    /organizations         POST /organizations
GET    /organizations/{id}    PATCH /organizations/{id}
POST   /organizations/{id}/actions          SUSPEND · DEACTIVATE
GET    /organization-units    POST /organization-units
GET    /organization-units/{id}             PATCH /organization-units/{id}
POST   /organization-units/{id}/actions     MOVE · CLOSE · REOPEN
GET    /asset-responsibilities              POST /asset-responsibilities
POST   /asset-responsibilities/{id}/actions REVOKE · SUPERSEDE

# Physical assets
GET    /mines                 POST /mines
GET    /mines/{id}            PATCH /mines/{id}
POST   /mines/{id}/actions                  COMMISSION · SUSPEND_OPERATIONS · RESUME_OPERATIONS · ABANDON · TRANSFER_OPERATING_UNIT · UPDATE_STATUTORY_IDENTIFIER
GET    /subunits              POST /subunits
GET    /subunits/{id}         PATCH /subunits/{id}
POST   /subunits/{id}/actions               CLOSE · MOVE
GET    /assets                POST /assets
GET    /assets/{id}           PATCH /assets/{id}
POST   /assets/{id}/actions                 TAKE_OUT_OF_SERVICE · RETURN_TO_SERVICE · MOVE · DECOMMISSION · REASSIGN_RESPONSIBLE_POST

# Positions and appointments
GET    /position-templates    POST /position-templates
POST   /position-templates/{id}/actions     DEACTIVATE · ATTACH_CAPABILITY_POLICY
GET    /position-capability-policies        POST /position-capability-policies
POST   /position-capability-policies/{id}/actions  ACTIVATE · SUPERSEDE · REVOKE
GET    /posts                 POST /posts
GET    /posts/{id}            PATCH /posts/{id}
POST   /posts/{id}/actions                  RETIRE · REINSTATE · CHANGE_HOLDER_POLICY · REASSIGN_UNIT
GET    /appointments          POST /appointments
GET    /appointments/{id}
POST   /appointments/{id}/actions           REVOKE · SUPERSEDE · EXTEND · CHANGE_MODE · RECORD_EXCLUSION

# Regulatory authority
GET    /regulatory-authorities              POST /regulatory-authorities
POST   /regulatory-authorities/{id}/actions DEACTIVATE
GET    /authority-units       POST /authority-units
POST   /authority-units/{id}/actions        CLOSE
GET    /mandates              POST /mandates
POST   /mandates/{id}/actions               DEACTIVATE · AMEND_CAPABILITIES
GET    /mandate-assignments   POST /mandate-assignments
POST   /mandate-assignments/{id}/actions    REVOKE · SUPERSEDE · AMEND_RESTRICTIONS
GET    /jurisdiction-assignments            POST /jurisdiction-assignments
POST   /jurisdiction-assignments/{id}/actions  REVOKE · SUPERSEDE

# Contractors and routing
GET    /contractor-engagements              POST /contractor-engagements
GET    /contractor-engagements/{id}         PATCH /contractor-engagements/{id}
POST   /contractor-engagements/{id}/actions ACTIVATE · SUSPEND · RESUME · AMEND · EXTEND · REVOKE
GET    /contractor-engagements?view=record_parties
GET    /responsibility-routes               POST /responsibility-routes
GET    /responsibility-routes/{id}
POST   /responsibility-routes/{id}/actions  RESOLVE · SUPERSEDE · DEACTIVATE

# Registries (read-only, drive client rendering)
GET    /enums                 GET /enums/{name}
GET    /schemas/{object}
GET    /capabilities
GET    /views
GET    /operations/{id}
```

## Reads that used to be routes

| Old shape | Now |
|---|---|
| `GET /posts/{id}/current-holders` | `GET /posts/{id}?expand=current_holders` |
| `GET /people/{id}/appointments` | `GET /appointments?filter[person_id]=…` |
| `GET /principals/{id}/sessions` | `GET /auth/sessions?filter[principal_id]=…` |
| `GET /appointments/{id}/effective-authority` | `GET /appointments/{id}?expand=effective_authority&as_of=…` |
| `GET /mines/{id}/subunits` | `GET /subunits?filter[mine_id]=…` |
| `GET /organizations/{id}/units` | `GET /organization-units?filter[organization_id]=…` |
| `POST /organizations/{id}/units` | `POST /organization-units` with `organization_id` |
| `POST /appointments/{id}/mandates` | `POST /mandate-assignments` with `appointment_id` |
| `POST /appointments/{id}/jurisdictions` | `POST /jurisdiction-assignments` with `appointment_id` |
| `POST /contractor-organizations` | `POST /organizations` with `kind_code: "CONTRACTOR"` |
| Unmanned statutory post report | `GET /posts?filter[vacancy_breach]=true&filter[statutory]=true` |
| Workforce composition report | `GET /people?group_by=affiliation_kind&metrics=count` |

## Capability resolution

For `POST /{collection}/{id}/actions`, the capability is resolved from the **action value**, never the route. `GET /capabilities?resource=capa&id=capa_01H…` returns the caller's permitted action subset for a specific object; the same array is returned inline as `available_actions` on every resource read.

```json
{
  "success": true,
  "data": {
    "resource": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90" },
    "vocabulary": ["ASSIGN", "SUBMIT", "VERIFY", "REJECT", "EXTEND_DEADLINE"],
    "available": ["VERIFY", "REJECT"],
    "denied": [
      { "action": "ASSIGN", "reason": "STATE", "detail": "Not legal from state SUBMITTED" },
      { "action": "SUBMIT", "reason": "STATE", "detail": "Not legal from state SUBMITTED" },
      { "action": "EXTEND_DEADLINE", "reason": "CAPABILITY", "detail": "capa.extend_deadline not held at this scope" }
    ],
    "assurance": { "current": "PASSWORD", "required_for": { "VERIFY": "PASSWORD" } }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-02T10:00:00Z" }
}
```

`denied` separates *"wrong state"* from *"you lack the capability"* — a UI can grey out the first and hide the second without guessing, and neither leaks the existence of anything the caller cannot already see.

## Decision examples

| Request | Result | Reason |
|---|---|---|
| DGMS officer reads covered mine-safety finding | Allow | Current appointment, mandate, and coverage |
| Same officer reviews an EC condition | Deny | No clearance-monitoring mandate |
| MoEFCC officer reads EC condition in jurisdiction | Allow | Correct authority, mandate, and coverage |
| Mine manager closes DGMS finding | Deny | Operator power cannot satisfy regulator closure policy |
| Ministry analyst views assigned portfolio | Allow, clipped, `warnings` records requested vs effective scope | Portfolio capability and assignment |
| Contractor worker after affiliation expiry | Deny current access; `record_party` reads survive | No current affiliation |
| Officer acts on a mine listed in `exclusions` | Deny | Recorded recusal narrows effective coverage |
| Service principal calls an action needing `required_human` | Deny | `principal.kind = SERVICE` |

## Completion criteria

The foundation is complete when every route above returns the documented bodies; every action names a capability, a state precondition, and its effects; every temporal grant defines supersession and revocation; every list defines authorization clipping and reports clipped scope in `warnings`; `available_actions` is policy-evaluated rather than static; and no request trusts cookie workspace, request `tenant_id`, or client `appointment_id` as authority.
