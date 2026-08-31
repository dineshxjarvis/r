# Backend Standards Log

Append-only record of rules earned from real bugs. Read it before working on the backend.

Hard rules in [`../../backend/AGENTS.md`](../../backend/AGENTS.md) are law. This log is scar tissue built on top: law says what must be true, the log says what already went wrong and why, so the same class of mistake does not recur in a different domain.

**The bar for an entry: would this line have prevented a real bug?** If no, it does not go in. One-off typos and anything already stated as law stay out.

**Push every entry upward — mechanism > law > log.** A lint rule, type or test that makes the mistake impossible beats a line in `AGENTS.md`, which beats a narrative here. Entries are promoted, not deleted.

## Entry format

```
- **<rule — imperative, ≤100 chars, no implementation>** — <why it bit us, one sentence>. `@trigger` _(from <source>, YYYY-MM-DD, <sha>)_
  - Impl: <class names, values, concrete specifics>.
  - ✗ <rejected alternative> — <why it failed>.
```

Lifecycle prefix: *(none)* active · `✓` now mechanically enforced · `⚖` promoted to `AGENTS.md` law · `⚠` rule already existed and was violated anyway.

`@trigger` tags name what you are about to do — `@authz`, `@outbox`, `@tenancy`, `@action`, `@evidence`, `@projection` — never where the code lives.

---

## Entries

- **Never write `:param::type` in a `text()` query — use `CAST(:param AS type)`** — SQLAlchemy's bind-parameter pattern refuses a name followed by a colon, so the PostgreSQL cast swallowed the parameter and the literal string `:mine_id::text` reached the database as SQL. `@raw-sql` _(from the dashboard measures query, 2026-08-31)_
  - Impl: three occurrences, in `dashboard/service.py` and `evidence/service.py`. The failure surfaced as `syntax error at or near ":"` — nothing pointed at the cast.
  - The same rule applies to a bare `:` inside a JSON string literal in `text()`: `'{"x":72}'` binds `:72`. Pass JSON as a parameter with `CAST(:v AS jsonb)`.
  - ✗ Escaping as `\:` — works, but it is invisible in review and the next person writes the unescaped form.

- **Point every enum column at its PostgreSQL type; never map one as a plain string** — a native enum compared against a varchar parameter fails outright with `operator does not exist`, and PostgreSQL will not guess the cast. `@model` _(from the first filtered read of `obligation_instance.status`, 2026-08-31)_
  - Impl: `app/core/db.py:pg_enum()`. It casts on bind and keeps the Python value a plain string, so the migration stays the only definition of the vocabulary and open enums still tolerate unknown values.
  - ✗ `postgresql.ENUM(name=..., create_type=False)` with no members — binds correctly but its result processor rejects every value it reads back with `'OPENCAST' is not among the defined enum values`.
  - ✗ Restating the members in Python — a second definition of a vocabulary that the migration already owns, free to drift.

- **A record that proves a refusal must commit outside the transaction the refusal aborts** — the blocked closure attempt was written in the same transaction as the failing action, so raising rolled the evidence of the block away with it. `@evidence` `@audit` _(from the CAPA closure gate, 2026-08-31)_
  - Impl: `evidence/service.py:_record_attempt()` opens its own `session_scope`. The gate's verdict is a fact about an evaluation that happened, independent of whether the closure proceeded.
  - Trade accepted deliberately: an accepted attempt can survive a later domain failure. An orphan record of a real evaluation is honest; a missing record of a refusal is not.

- **Anything RLS needs before the tenant is known must go through a narrow SECURITY DEFINER function** — login reads the organisation to discover the tenant, but that row is protected by the very tenant it is trying to discover, so every session was created tenant-less and every subsequent read came back empty. `@tenancy` `@authz` _(from the first end-to-end login, 2026-08-31)_
  - Impl: `migrations/sql/0010_login_bootstrap.sql`. Each function takes an id and returns ids only — no row, no name, no other column — so it cannot be turned into a cross-tenant read.
  - The symptom is silence, not an error: RLS returns zero rows, so the bug looks like missing data rather than a policy problem. Suspect it whenever a read is empty but the row demonstrably exists.

- **Coerce query-string filter values to the column's Python type in the compiler** — every value arrives from HTTP as text, and `integer > '0'::varchar` is a type error, not a comparison. `@query` _(from `filter[recurrence_count][gt]=0`, 2026-08-31)_
  - Impl: `kernel/query/compiler.py:_coerce()`, keyed on `column.type.python_type`. The parser cannot do it — it does not know the column types; the compiler is the layer that does.

- **A cross-tenant principal gets a computed resource set, never an absent filter** — treating "portfolio" as `authorized_mine_ids = None` meant no WHERE clause at all, and the honest version is a finite list that can be reported, logged and clipped against. `@authz` `@tenancy` _(from the ministry portfolio read, 2026-08-31)_
  - Impl: `authz/principal.py` populates the list from `resolve_all_mines()`; RLS gains a read-only escape keyed on `app.portfolio` in `0011_portfolio_reads.sql`, while `WITH CHECK` stays tenant-bound so a portfolio session still cannot write across tenants.
  - ✗ Leaving the scope as `None` — indistinguishable from "scope was never computed", which is the failure mode that makes an authorization bug invisible.
