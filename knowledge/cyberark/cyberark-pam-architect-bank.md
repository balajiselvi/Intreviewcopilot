# CyberArk Privileged Access Management (PAM) Architecture

Spoken architect style: fluent Senior Principal Architect paragraphs — lead with exact T-codes/tables/utilities; never Decision/Mechanism/Governance/Validation headings.

**Product boundaries:** CyberArk Digital Vault, PVWA, CPM, PSM/PSMP, PTA, CCP/AAM, and related REST/PACLI administration. This is **not** SAP GRC EAM Firefighter alone and **not** a Vault installer guide—focus is HA/DR, Dual Control, rotation, session isolation, secrets for apps, detection, and audit evidence.

**Anti-surface rule:** Prefer `padr.ini`, Master Policy, `pm.log` / `PSMConsole.log` / `ITA.log`, CCP REST paths, and Dual Control mechanics over “what is CyberArk” definitions.

## Q1: How do you architect a High Availability (HA) and Disaster Recovery (DR) deployment for CyberArk Digital Vault across hybrid cloud environments?

- **Decision:** Deploy CyberArk Primary Vault with automatic failover to a Disaster Recovery (DR) Vault using asynchronous replication over Vault Protocol (TCP 1858), combined with load-balanced PVWA, CPM, and PSM component tiers.
- **Mechanism:** Configure `PADR` (PAM Disaster Recovery) service on the DR Vault node. Maintain `padr.ini` parameter `EnableFailover=YES` and `Interval=30` (seconds). In cloud deployments (AWS/Azure), utilize Vault Cluster / Distributed Vaults architecture. Configure PVWA `Vault.ini` pointing to Primary and DR Vault IPs with auto-switchover fallback.
- **Governance:** Mandate zero RPO for critical vault transactions by enforcing DB transaction log sync, and establish a sub-5-minute RTO policy for automated DR failover.
- **Validation:** Execute `PADR` status checks via `padr.log`; perform a controlled failover test by stopping PrivateArk Server service on Primary, and verify DR Vault transitions cleanly to Active mode (`FailoverHasStarted=1`).

## Q2: How do you design dual-control workflows and ticketing system integration (e.g., ServiceNow) inside CyberArk PVWA?

- **Decision:** Enforce Dual Control and mandatory Ticket System Validation at the Safe/Master Policy layer to require dual authorization and active change ticket verification before credentials can be checked out or brokered.
- **Mechanism:** In PVWA Master Policy, enable *Require dual control password access approval* and *Require ticket system integration*. Configure ServiceNow Ticketing parameters under PVWA Administration → Options → Ticketing Systems. Specify REST API connection settings (`TicketURL`, `ServiceNowAuth`) to validate ticket state (`State = In Progress`) via API calls before releasing credentials.
- **Governance:** Prohibit Emergency/Break-Glass accounts from ticketing dependencies by isolating them in dedicated Safes with explicit EAM/PAM approval paths.
- **Validation:** Attempt credential checkout via PVWA entering a closed/fake ServiceNow Incident ID; verify system displays ticket validation failure and blocks password checkout.

## Q3: How do you configure Central Policy Manager (CPM) for automatic password rotation and reconciliation across Windows, Unix, and Database targets?

- **Decision:** Utilize CPM policy platforms to enforce periodic automatic credential rotation, post-usage immediate changes, and reconciliation via dedicated privileged reconcile accounts.
- **Mechanism:** Configure Master Policy settings: `Perform periodic change = Yes` and `MinValidityPeriod = 1 day`. In platform settings, define `ChangePasswordInResetMode = Yes`. Specify Reconcile Account association at the Safe or Account level. CPM uses `pm.log` and `CPMScanner` to trigger target password changes via SSH, WMI/WinRM, or SQL connection plugins.
- **Governance:** Require daily reconciliation checks and enforce CPM automatic account lockouts if password rotation fails more than 3 consecutive times.
- **Validation:** Force a CPM password change in PVWA; verify status transitions from `Pending Change` to `Success` and check `pm.log` on the CPM server to validate execution.

## Q4: How do you broker zero-trust privileged sessions using Privileged Session Manager (PSM) and PSM for SSH (PSMP) without exposing credentials to end users?

- **Decision:** Route all administrative access through PSM/PSMP isolation proxies, enforcing complete credential masking, live session monitoring, and video/keystroke recording.
- **Mechanism:** Users connect via PVWA or native client (RDP/SSH) targeting PSM proxy endpoint. PSM retrieves target credentials securely from Digital Vault via Vault protocol (TCP 1858) and initiates RDP/SSH session to target using native protocols (TCP 3389 / 22). Enable PSM HTML5 Gateway for clientless web-browser RDP/SSH access. Configure PSM Hardened server with AppLocker rules restricting execution strictly to authorized binaries (`mstsc.exe`, `putty.exe`).
- **Governance:** Enforce full video session recording and text transcript logging for all tier-0 administrative sessions.
- **Validation:** Launch a PSM RDP session, attempt to copy/paste text or launch unapproved executables, and verify AppLocker blocks execution while `PSMConsole.log` logs the policy violation.

## Q5: How do you secure DevOps pipelines and microservices using CyberArk Application Access Manager (AAM) / Central Credential Provider (CCP)?

- **Decision:** Deploy Central Credential Provider (CCP) agentless REST API architecture or Application Access Manager (AAM) local dynamic caching to eliminate hardcoded secrets in CI/CD pipelines and microservices.
- **Mechanism:** Applications issue HTTPS REST calls to CCP endpoint (`/AIMWebService/api/Accounts`). Authenticate application identity using mTLS client certificates, IP whitelisting, and OS User validation defined in CyberArk Application ID settings. CCP fetches requested secret from Digital Vault in real time and returns JSON payload without storing secrets on app servers.
- **Governance:** Prohibit static API keys or long-lived tokens in source code repositories (Git); mandate mTLS certificate-based app authentication.
- **Validation:** Issue a curl/REST request presenting a valid client certificate to the CCP endpoint and verify JSON secret retrieval payload with `HTTP 200 OK`.

## Q6: How do you design Privileged Threat Analytics (PTA) detection use cases for Vault, domain, and session abuse?

- **Decision:** Position PTA as the detection plane for privileged anomalies (credential theft patterns, suspicious Vault activity, risky PSM behavior)—not as a replacement for CPM rotation or PSM isolation.
- **Mechanism:** Deploy PTA to ingest Vault syslog/audit and relevant Windows/AD security events where licensed. Enable detections for patterns such as anomalous Retrieve/Connect sequences, Pass-the-Hash / Golden Ticket indicators (environment-dependent), and abnormal privileged account usage. Forward PTA alerts to SOC SIEM (Sentinel/Splunk) with Account, Safe, User, and SourceIP context. Correlate PTA alert IDs with Vault audit (`ITALog` / Vault audit exports) and PSM recordings.
- **Governance:** High/Critical PTA alerts follow 24/7 SOC playbooks; false-positive tuning requires Security + IAM dual approval.
- **Validation:** Reproduce a controlled anomalous Retrieve/Connect in non-Production; confirm PTA raises an alert, SIEM ticket opens, and Vault/`ITALog` entries match the PTA event timeline.

## Q7: How do you administer CyberArk at scale using REST APIs and PACLI without weakening Dual Control?

- **Decision:** Automate Safe/Account lifecycle via CyberArk REST (PVWA API) and constrain PACLI/CLI to break-glass automation identities—never bypass Dual Control for Production Retrieve.
- **Mechanism:**
  - REST: authenticate to PVWA API (`/PasswordVault/API/Auth/...`), then manage Safes/Accounts/Platforms via documented endpoints (e.g. Accounts, Safes, Members).
  - Automation identities: dedicated AppID/user with least Safe permissions (`Add accounts`, `Update account properties`)—exclude unconstrained `Retrieve` on tier-0 Safes.
  - PACLI: reserved for emergency Vault operations with logged operator ID; store scripts in controlled repo; no embedded Vault admin passwords (CCP for script secrets).
- **Governance:** All Production API clients registered; client credentials rotated; Dual Control remains enforced for human Retrieve/Connect.
- **Validation:** API create/update Account succeeds; API Retrieve on Dual Control Safe without confirmation fails; Vault audit shows API user actions separately from human PVWA sessions.

## Q8: How do you segment Safes and Master Policy for tier-0 (domain/cloud admin) versus application technical accounts?

- **Decision:** Separate Safes and policy overlays by risk tier so tier-0 secrets never share membership or recording policy with routine app accounts.
- **Mechanism:**
  - Safes: `T0-DOMAIN`, `T0-CLOUD-HYPERVISOR`, `APP-<PLATFORM>-TECH` naming.
  - Master Policy defaults: Dual Control + PSM required for T0; CPM periodic change for all; exclusive accounts for shared break-glass where needed.
  - Platform bindings: Windows Domain Admin vs SQL vs Network Device platforms with distinct reconcile accounts.
  - Membership: T0 confirmer group ≠ T0 requestor group; auditors get view/recording without Connect.
- **Governance:** Architecture Board must approve any Safe that mixes T0 and app credentials; quarterly membership SoD report.
- **Validation:** User in APP Safe cannot list T0 accounts; T0 Connect requires Dual Control + recording; export Safe member report shows SoD separation.

## Q9: How do you integrate CyberArk with SAP hybrid landscapes so technical users are vaulted while human Firefighter stays in SAP IAG/GRC EAM?

- **Decision:** Split control planes—**CyberArk** vaults and rotates machine/technical credentials (RFC, OS, DB, BTP Destination secrets); **SAP IAG PAM / GRC EAM** handles human emergency elevation with SAP audit logs.
- **Mechanism:** Onboard SAP System/Communication users into CPM platforms; consumers (`SM59`, BTP Destinations, middleware) retrieve via CCP or controlled secret sync after rotation. Human Firefighter / Role Collection elevation remains in IAG/EAM with `GRAC_SPM_LOG_SYNC` / BTP audit review. Document RACI: IAM owns Vault; SAP Security owns EAM/IAG; Platform owns Destination updates post-CPM change.
- **Governance:** Reject designs that put interactive Firefighter passwords only in CyberArk without SAP session audit—or leave interface passwords in clear text outside Vault.
- **Validation:** Tabletop: interface outage remediated via CPM/CCP evidence (`pm.log`, CCP `HTTP 200`); human emergency remediated via IAM/EAM evidence—both ticket types close with the correct tool artifacts.

## Q10: What Production go-live and audit evidence pack do you require for CyberArk PAM?

- **Decision:** Accept Production only on policy, SoD, rotation, session, DR, and SIEM evidence—component “installed” is not acceptance.
- **Mechanism:** Evidence checklist:
  1. Master Policy export (Dual Control, ticketing, PSM required, change intervals).
  2. Safe inventory + requestor/confirmer SoD report.
  3. Sample CPM Change/Verify successes from `pm.log`.
  4. PSM recording sample + AppLocker deny from `PSMConsole.log`.
  5. CCP mTLS retrieve proof (`HTTP 200`) for one app identity.
  6. Controlled `PADR` failover evidence (`padr.log`, `FailoverHasStarted=1`).
  7. PTA/SIEM alert test ticket.
  8. Break-glass Safe procedure + last drill record.
- **Governance:** CISO / Internal Audit sign-off; quarterly drift review against the pack.
- **Validation:** Auditor selects a random Production Account; team produces Dual Control → Connect/Change artifacts and recording without exposing clear-text secrets on the auditor workstation.
