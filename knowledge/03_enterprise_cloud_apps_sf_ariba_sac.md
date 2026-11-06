# SuccessFactors RBP, SAC, and Ariba Security

Plane 5 enterprise cloud apps. Never answer these with PFCG/`AGR_*` as the primary model.

## 1. SAP SuccessFactors — Role-Based Permissions (RBP)

### Three-pillar architecture

| Pillar | Meaning | Interview precision |
|---|---|---|
| **Permission Roles** | *What* — capabilities granted (EC, Recruiting, Comp, Admin tools, etc.) | Role definition ≠ dynamic population |
| **Permission Groups** | *Who* — static or dynamic/attribute-based membership (department, country, job code, custom filters) | Dynamic groups change as HR attributes change |
| **Target Populations** | *Upon whom* — which employee population the granted permissions apply to | Same admin capability scoped to different populations = different risk |

**MDF object permissions** govern Metadata Framework objects separately — field-level and object-level access for custom MDF. Effective-dated Employee Central security means as-of-date views must respect RBP; “can see today” ≠ “can see historical compensation.”

### HR-driven JML with IPS / IDM / GRC

1. EC employment event (hire / transfer / terminate) is authoritative for workforce status.  
2. **IPS** (or IDM on hybrids) transforms attributes → target accounts / groups / business roles.  
3. **GRC / IAG** simulate SoD when SAP or connected apps are in the risk engine.  
4. SF RBP still enforces in-suite access — provisioning a user ID without RBP roles yields empty UX, not “PFCG missing.”

**Leaver control:** Terminate in EC → IPS disable/remove → RBP group exit → target deprovision. SOX cares about same-day privileged leavers.

**Validation:** Dynamic group membership flips on attribute change; target population prevents cross-country HR admin; API/integration user is least-privilege and not a personal Dialog clone.

---

## 2. SAP Analytics Cloud (SAC)

### Application roles vs model security

| Layer | Controls | Example |
|---|---|---|
| **Application roles / permissions** | What the user can do in SAC (Admin, BI Content Creator, Viewer, Planner-related rights) | Create models vs consume stories |
| **Model-level Data Access Control (DAC)** | Read/Write locks on dimension members | User sees only Company Code 1000 members |

**Live connection (BW / S/4):** Backend authorizations often **pass through** (BW analysis authorizations / S/4 auth). SAC app role alone does not invent backend row access. Troubleshoot empty live data in **RSECADMIN / S/4 auth**, not only SAC admin.

**Import / acquired models:** Security is more SAC-side (DAC + folder/share + roles). Broader app privileges can override naive assumptions about DAC — design explicit tests.

**Identity:** IAS / corporate IdP SSO into SAC; team membership maps to collaboration scopes.

**Validation:** Twin users — same story, different DAC → different member visibility; live connection user denied in BW still denied in SAC live.

---

## 3. SAP Ariba — groups vs document access

### Core Administration user groups

Global / functional capability groups in Ariba Administration control what buyers/admins can configure (templates, user admin, realm settings). These are **capability** grants — not the same as being on a sourcing project.

### Project team & document-level controls

Sourcing / Contracts projects use **project team roles** and **document-level** ACLs. A user in a powerful admin group may still be unable to open a confidential RFP document without project/document membership. Conversely, project owner access does not equal realm administrator.

### Buyer vs supplier identity

- Buyers: usually corporate IdP → IAS → Ariba.  
- Suppliers: supplier-side identity governance; avoid shared supplier logins; leaver/offboarding on supplier contacts.  
- **IPS / CIS** provisioning for buyer identities; supplier lifecycle often separate process with audit evidence.

**SoD examples:** Award decision + supplier master maintenance; contract legal approve + commercial edit — encode in GRC/IAG where Ariba is connected, plus Ariba-native project controls.

**Validation:** Admin group without project team → cannot open restricted contract; project member without admin group → cannot change realm config.

---

## Interview hooks

- “RBP is roles + groups + target populations — missing any pillar breaks the story.”  
- “SAC app role ≠ DAC ≠ live backend auth.”  
- “Ariba group capability ≠ project/document ACL.”
