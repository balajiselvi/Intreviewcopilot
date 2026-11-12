# Verified-content entry schema (mechanism)

Status values: `VERIFIED` | `NEEDS_REVIEW` | `DEPRECATED`

Only human approval may set `VERIFIED`. Cursor drafts `NEEDS_REVIEW` only.

```json
{
  "id": "string",
  "domain": "string",
  "product": "string",
  "version_scope": "string",
  "claims": [{ "id": "string", "text": "string", "kind": "definition|procedure|integration|numeric|regulatory" }],
  "sources": [{ "url": "string", "section": "string", "retrieved_on": "YYYY-MM-DD" }],
  "verification_status": "NEEDS_REVIEW",
  "reviewer": null,
  "verified_on": null,
  "expiry": null,
  "recheck_date": "YYYY-MM-DD",
  "spoken_answer": "string|null",
  "conflicts": ["string"],
  "notes": "string"
}
```
