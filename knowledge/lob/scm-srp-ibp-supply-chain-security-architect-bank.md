# SAP SRM, SCM, IBP & Supply-Chain Application Security Architecture

Spoken architect style: Decision → Mechanism → Governance → Validation.

**Product boundaries:** Supply-chain apps (SRM, SCM, IBP, MM/WM/PP/SD process auths in ERP) have distinct auth models. **IBP** is cloud planning with its own permission/role concepts; **SRM** classic differs from Ariba; ERP MM/SD use PFCG/business roles. Cross-system SoD (buyer vs goods receipt vs invoice) spans tools.

**Anti-surface rule:** Prefer process SoD, plant/org restrictions, planning-area permissions, and integration users over “SCM security.”

## Q1: How do you design procurement-to-pay SoD across SRM/Ariba and S/4 MM?

- **Decision:** Split requisition create, approve, PO maintain, goods receipt, and invoice verify across personas—even when documents originate in different systems.
- **Mechanism:** Map process steps to Ariba/SRM groups and S/4 authorization objects (`M_BEST_*`, `M_RECH_*`, etc. as applicable). Run GRC/IAG cross-system analysis when connectors exist; otherwise maintain compensating matrix. Org restrict by purchasing org/plant.
- **Governance:** Risk owners for P2P SoD. Temporary combined access via Firefighter only.
- **Validation:** Single user fails toxic chain; two-user path succeeds; simulation/matrix evidence retained.

## Q2: How do you authorize inventory and warehouse access without over-broad plant `*`?

- **Decision:** Plant/storage-location restrictions are mandatory for inventory movements; display-only separated from goods-movement change.
- **Mechanism:** PFCG org levels `$WERKS` / storage location objects; Fiori apps paired with BE auth; RF/device technical users scoped to warehouse. Negative test cross-plant transfer.
- **Governance:** Multi-plant `*` requires risk acceptance. Cycle-count vs adjust privileges split where policy requires.
- **Validation:** User posts in plant A only; plant B denied in `STAUTHTRACE`; device user cannot financial-post beyond design.

## Q3: How do you secure production planning and manufacturing authorizations?

- **Decision:** Separate master-data maintain (BOM/routing), order create/release, and confirmation/posting duties.
- **Mechanism:** Authorize PP master vs transactional objects; restrict by plant; batch-user for MRP jobs least privilege. Align MES interface users separately.
- **Governance:** Who releases production orders vs who confirms is SoD-sensitive in some industries—confirm with control owners.
- **Validation:** Planner cannot confirm if split; MRP job user cannot interactive wide MM; trace supports deny.

## Q4: How do you authorize OTC / sales & distribution access with organizational limits?

- **Decision:** Sales org / distribution channel / division restrictions bound to create vs approve vs pricing display.
- **Mechanism:** Org levels `$VKORG` `$VTWEG` `$SPART`; pricing/sensitive condition auths restricted; credit release separated from order create where required.
- **Governance:** Pricing display/change classified sensitive. Cross-company sales access attested.
- **Validation:** User limited to sales org; pricing change denied; credit release dual-path tested.

## Q5: How do you secure SAP IBP roles and planning areas?

- **Decision:** IBP permissions are planning-area and capability based—not PFCG. Separate modeler/admin from planner/business consumer.
- **Mechanism:** Assign IBP roles/permissions for apps (Excel add-in, web); restrict planning areas/attributes; integrate IAS SSO; provision via IPS where used. Protect write to baseline vs what-if versions per design.
- **Governance:** Global IBP admin roster certified. Planning-area access follows data classification.
- **Validation:** Planner writes only allowed area; admin functions denied; SSO user without IBP role cannot plan.

## Q6: How do you treat classic SRM versus Ariba in architecture answers?

- **Decision:** Name the product: classic SRM (ABAP portal/UWL patterns) vs Ariba realm groups—do not interchange security procedures.
- **Mechanism:** SRM: PFCG + enterprise portal iViews/roles as applicable. Ariba: groups/project ACL (see Ariba bank). Integration to S/4 via documented interfaces with technical users.
- **Governance:** Migration programs must remap SRM roles to Ariba groups explicitly.
- **Validation:** Procedure matches product in landscape CMDB; wrong-product steps rejected in review.

## Q7: How do you secure embedded vs decentralized supply-chain landscapes?

- **Decision:** Decentral WM/EWM/TM add system boundaries—authorize locally and harden integration identities between systems.
- **Mechanism:** Roles per system; RFC/OData between ERP and decentral; org mapping consistency; batch queues monitored.
- **Governance:** Cross-system admin SoD. Interface failures do not justify granting SAP_ALL.
- **Validation:** Decentral user lacks ERP finance; interface user scoped; end-to-end goods movement tested.

## Q8: How do you provision and revoke supply-chain access for movers (plant changes)?

- **Decision:** Plant/sales-org derived access must update with HR/org events via IPS/IDM/GRC—stale plant access is a control failure.
- **Mechanism:** Derived roles / Public restrictions / IBP area membership updated by provisioning; certify critical plants. Firefighter for temporary multi-plant support.
- **Governance:** Mover SLA for warehouse critical access. Quarterly plant-role reconcile.
- **Validation:** Mover loses old plant, gains new; query/IBP slice follows; reconcile report clean.

## Q9: How do you troubleshoot “user can open app but cannot post movement / see supply plan”?

- **Decision:** Layer check: launchpad/tile → org restriction → object ACTVT → integration/data existence → IBP area permission.
- **Mechanism:** `STAUTHTRACE` / SU53; IBP permission display; plant master assignment; document type controls.
- **Governance:** Minimal grant; document object/field. No plant `*` hotfixes in Production without acceptance.
- **Validation:** Trace miss fixed; control user denied; ticket cites exact object.

## Q10: What audit pack covers supply-chain security?

- **Decision:** Process SoD matrix, plant-critical access lists, IBP admin roster, interface technical users, and sample deny tests.
- **Mechanism:** Exports from GRC/IAG or manual matrix; SUIM critical; IBP role lists; destination inventory.
- **Governance:** Deploy gate for new plant rollout includes security restrictions test.
- **Validation:** Walkthrough P2P SoD; plant deny; IBP area deny; interface least privilege.
