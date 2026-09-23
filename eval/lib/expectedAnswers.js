/**
 * Prepared spoken scripts for this presales round.
 * First matching pattern wins. Patterns are question-shaped, not bare product words,
 * so an ordinary PFCG/SU24/derived-role question does not pick up a script.
 * Unmatched questions return null and the rest of the pipeline is unchanged.
 */
const EXPECTED_ANSWERS = [
  {
    id: "about-yourself",
    re: /\b(tell me about yourself|introduce yourself|walk me through your (background|career|experience)|who are you)\b/i,
    answer: "I'm an SAP Security and GRC professional. I work across authorizations, GRC Access Control, SoD, role design, and S/4HANA security. My strength is combining the technical security layer with governance and the business requirement. I can sit with a process owner, understand the access risk, translate that into a security architecture, explain the business value, and then make it deliverable with the technical team. That is why a Security/GRC presales role fits: the job is to bridge sales, the customer, and engineering across GRC, IAM, S/4HANA, BTP, and cloud security. In the role I would help the customer see not only what the technology does, but why it reduces access risk and how it can actually be implemented."
  },
  {
    id: "why-presales",
    re: /\bwhy (presales|pre-sales|this role)\b|\bwhy do you (think you can|want to) do presales\b|\bstrong technical background\b/i,
    answer: "Presales is the same consulting motion I already do, earlier in the customer journey. I understand the business process and the risk, design the control, and explain it to business, IT, and audit. At Dover I was not only configuring GRC. I ran risk and role-design discussions with Finance, Procurement, Supply Chain, and HR, and I explained the controls to audit. Presales adds discovery, demos, POCs, and positioning. That is the direction I want to take the experience."
  },
  {
    id: "why-hire",
    re: /\bwhy should we hire\b|\bwhy you\b|\bfit for this role\b/i,
    answer: "Three things. Technical depth across SAP Security, GRC, SoD, role design, S/4HANA, and IAM. Solution thinking: I turn a security problem into an architecture and an implementation path, not a list of components. Communication: I can explain the same problem to a security architect, a process owner, an auditor, or an executive. At Dover that was a global S/4 transformation, 11 countries, 28 legal entities, 8,700-plus users, 18 systems on GRC, and more than 2,400 SoD conflicts cleared before cutover. The role needs someone who can bridge sales, customers, and technical teams. That is the capability I would bring."
  },
  {
    id: "security-vs-grc",
    re: /\b(difference|differ|vs\.?|versus).{0,40}(sap security|security).{0,40}(grc)|(already have sap security|why (do we|would we) need grc|security grants|grc governs)\b/i,
    answer: "SAP Security enforces technical access: users, roles, authorizations, authentication. GRC governs whether that access is appropriate: who should have it, who approved it, what SoD or critical-access risk it creates, how it is mitigated, and what evidence an auditor can see. Security builds the doors and locks. GRC governs who receives the keys, who approves them, and whether the combination of keys creates risk. I would not sell GRC as a replacement for SAP Security."
  },
  {
    id: "what-is-grc",
    re: /\b(what is|explain|describe)(?!.{0,40}\bdifference\b).{0,30}(sap )?grc\b|\bwhy (would|should) a customer buy grc\b|\bgrc access control architecture\b|\bwalk me through (sap )?grc\b/i,
    answer: "I explain SAP GRC Access Control as the governance layer over SAP access. Security controls what a user can do. GRC covers who should have it, who approves it, what risk exists, how it is mitigated, and how it is monitored. Four capabilities: ARA identifies SoD, critical actions, and critical permissions. ARM runs the request, approval, risk check, and provisioning. EAM controls emergency or firefighter access, including logs and review. BRM governs the business-role lifecycle. Those sit above ECC and S/4 authorization and can connect to identity services. I would not position GRC as only an SoD report."
  },
  {
    id: "sod-vs-least",
    re: /\b(difference|differ).{0,40}(sod|segregation).{0,40}(least privilege)|(least privilege).{0,40}(sod|segregation)\b/i,
    answer: "Least privilege asks whether this user has more access than the job needs. SoD asks whether the combination of that access creates a conflicting business capability. A user can have only the access required for two legitimate jobs and still create an SoD conflict, for example vendor maintenance plus payment processing. They are complementary. Least privilege does not replace SoD."
  },
  {
    id: "sod-ruleset",
    re: /\b(design|build|approach).{0,40}(sod|segregation).{0,20}(ruleset|rule set|rules)\b|\bhow (do|would) you design (an )?sod\b/i,
    answer: "I would not import a generic ruleset and treat it as the customer's risk. I start from the business process and the control objective. In Procure-to-Pay that is vendor creation versus purchase-order processing versus payment. I map those activities to transactions, Fiori apps, authorization objects, and permissions, then to functions and risks. Process owners, Internal Audit, and Compliance validate the risk, because that is a business-control decision. After go-live the ruleset needs an owner, because processes and custom transactions change. Path: business process, critical activities, permissions, functions, risks, validation, remediate or mitigate, ongoing governance. Standard SAP content is the starting point, not the finished ruleset."
  },
  {
    id: "sod-found",
    re: /\b(sod|segregation).{0,30}(conflict|violation).{0,40}(identif|found|what (do|would) you|what happens)\b|\bwhen grc identifies\b|\bthousands of sod\b|\b10,?000 sod\b|\b20,?000 users\b/i,
    answer: "I would not remediate a large conflict count one by one, and I would not treat the number as the problem. First I separate genuine risk, false positives, and access the job actually needs. Then I prioritize by severity and business process. If the access is not required, I remove it or redesign the role. If it is required, I look for a mitigating control with an owner, frequency, evidence, and an end date. The preference is always to remove unnecessary conflicting access. Mitigation is informed risk acceptance, not a way to ignore SoD. The root cause is often role design or a bad ruleset, not thousands of unrelated issues."
  },
  {
    id: "false-positive",
    re: /\bfalse[- ]?positive/i,
    answer: "I would find out why the count is high before I delete rules to make the dashboard green. Typical causes are an overly broad function, a wrong action-to-permission map, custom transactions that were never mapped, or a legitimate business combination that was never classified. I validate the rule against the real process with the process owner and retune it. The goal is meaningful risk, not a low number."
  },
  {
    id: "mitigating",
    re: /\b(mitigating control|compensating control)\b/i,
    answer: "A mitigating or compensating control is what you use when a real business need means the conflicting access cannot be removed. Example: an independent review of the sensitive transactions, with a named owner, a frequency, evidence, and a validity period. It is part of risk management. It is not a substitute for role design, and it is not a permanent ignore of the SoD."
  },
  {
    id: "business-refuses",
    re: /\b(refuses to remove|will not remove|won't remove|business owner still refuses).{0,40}(sod|conflict|access)\b|\bresidual risk\b/i,
    answer: "I validate the business justification first. If role redesign or a process split can remove the conflict, that is still the preference. If not, I put a compensating control on it with an owner, frequency, evidence, and an end date, and the risk owner explicitly accepts the residual risk. My job is to make the risk visible and offer a viable control. I do not silently override the business."
  },
  {
    id: "ara",
    re: /\b(explain|what is|describe) ara\b|\baccess risk analysis\b/i,
    answer: "ARA is Access Risk Analysis. It checks users and roles against a ruleset for SoD conflicts, critical actions, and critical permissions. The business question is what risk exists, who has it, why, and whether you will remove it or mitigate it. At Dover every role was simulated in ARA before transport."
  },
  {
    id: "arm",
    re: /\b(explain|what is|describe) arm\b|\baccess request management\b/i,
    answer: "ARM is Access Request Management. It replaces uncontrolled manual assignment with a workflow: request, manager, role or business owner, risk analysis, remediate or mitigate if needed, provision, then evidence of who asked, who approved, what risk existed, and what was provisioned. At Dover that workflow carried about 4,000 requests a year."
  },
  {
    id: "eam",
    re: /\b(explain|what is|describe).{0,20}(eam|firefighter)\b|\bemergency access\b|\bis firefighter pam\b/i,
    answer: "EAM is controlled temporary elevated access, not a standing SAP_ALL. The controls are assignment approval, a reason, logging, log review, and an independent controller. The cybersecurity problem it solves is standing privilege. It supports the SAP privileged-access use case. It does not replace an enterprise PAM platform that also covers infrastructure and databases. At Dover I ran EAM end to end for 95 firefighter owners, with reason codes and controller sign-off."
  },
  {
    id: "brm",
    re: /\b(explain|what is|describe) brm\b|\bbusiness role management\b/i,
    answer: "BRM governs the business-role lifecycle. The business role is what the job needs. The technical roles underneath carry the PFCG authorizations. That gives the customer a standard to approve, assign, and audit, instead of ad-hoc technical role assignment."
  },
  {
    id: "s4-vs-ecc",
    re: /\b(s\/?4|fiori).{0,50}(differ|versus|vs\.?).{0,30}ecc\b|\becc.{0,50}(differ|versus|vs\.?).{0,30}(s\/?4|fiori)\b|\b(difference|different).{0,40}(s\/?4|fiori).{0,40}ecc\b/i,
    answer: "ECC security conversations sit on transactions and authorization objects. S/4 still uses PFCG for the backend, and it adds Fiori: catalogs, target mappings, spaces or pages, frontend and backend roles, and OData objects such as S_SERVICE and S_START. I would not migrate ECC roles as-is. I would check whether they still match the target process and redesign where they do not."
  },
  {
    id: "ecc-to-s4",
    re: /\becc.{0,20}(to|into).{0,15}s\/?4|\bs\/?4hana security transformation\b|\bapproach an ecc\b/i,
    answer: "Six stages. Assess current roles, users, SoD, critical access, and the process. Design the target authorization concept for S/4 and Fiori, including catalogs, OData, and GRC connectivity. Build the roles and connect GRC. Validate with authorization testing, SoD simulation, negative testing, and the business owner. Cut over with provisioning and access-control gates. Hypercare for access defects, emergency access, and risk remediation. The objective is a cleaner auditable model, not a role copy. At Dover that was 1,650 PFCG roles, 350 business roles, 220 Fiori catalogs, and more than 2,400 conflicts cleared before cutover."
  },
  {
    id: "grc-for-s4",
    re: /\bdesign grc for (an )?s\/?4\b|\bgrc for an s\/?4hana\b/i,
    answer: "I start from the current and target landscape, not an ECC copy. I look at the ECC role model, process changes in S/4, Fiori catalogs, frontend and backend authorizations, OData and Gateway, GRC connectivity and risk analysis, identity and authentication, and the SoD rules against the redesigned business roles. Then I map business roles to technical roles, simulate risk, and remediate before go-live, with cutover and hypercare included."
  },
  {
    id: "cfo",
    re: /\b(cfo|chief financial)\b/i,
    answer: "I would not open with PFCG. I would open with financial risk. Creating a vendor and processing a payment can each be legitimate. Together they are a fraud and audit exposure. GRC identifies that combination, governs the request and approval, controls emergency access, and produces evidence. The value is reduced access risk, stronger internal controls, and faster audit evidence. If the CFO says SoD is slowing the business, I separate the control objective from a workflow that treats low-risk requests like high-risk ones. Risk-based governance, not maximum bureaucracy."
  },
  {
    id: "ciso",
    re: /\b(ciso|chief information security)\b/i,
    answer: "Four questions: who has access, what can they do, is that access appropriate and does it create business risk, and can we detect misuse. That is identity, authorization, governance, and detection. I map GRC to the governance slice and say clearly what stays with IAM and the SOC. I would not overwhelm a CISO with screens. Credibility and risk reduction matter more than feature volume."
  },
  {
    id: "discovery",
    re: /\b(discovery workshop|customer discovery|conduct a (customer )?workshop)\b/i,
    answer: "I would not start with a demo. Five areas: landscape, meaning ECC, S/4, BTP, and connected apps; identity, meaning the source, JML, and authentication; access, meaning the role model, privileged access, and provisioning; risk, meaning SoD, critical access, and audit findings; operations, meaning the current approval path and the manual pain. Then I map only those problems to capabilities and demonstrate only what is relevant."
  },
  {
    id: "demo-poc",
    re: /\b(structure (a |the )?demo|demonstrate grc|how would you demo|run a poc|proof of concept)\b/i,
    answer: "The demo is a use case, not a feature tour. Problem, risk, analysis, remediation or mitigation, provisioning, evidence, business outcome. Example: request, approval, ARA finds the SoD, remediate or mitigate, provision, audit trail. A POC starts with measurable success criteria, agreed use cases, data, scope, and owners. I configure only what proves the case, then write findings, gaps, assumptions, and the next step. I do not show every screen."
  },
  {
    id: "rfp",
    re: /\b(rfp|rfi)\b/i,
    answer: "I split the RFP into functional, technical, integration, compliance, implementation, and commercial requirements. Each line is marked standard, configuration, customization, third-party, or future. I validate technical assumptions with engineering before I commit. The response is written in the customer's language. The goal is accurate and commercially useful, without overpromising."
  },
  {
    id: "product-gap",
    re: /\b(doesn'?t support|does not support|product gap|feature (your|the) solution doesn)\b/i,
    answer: "I would not promise a customization in the room. I clarify the business requirement and check whether standard configuration or another architecture already covers it. If it is a real gap, I document it, name the workaround, and involve product or engineering. Credibility is worth more than a commitment delivery cannot keep."
  },
  {
    id: "competitors",
    re: /\b(pathlock|securitybridge|onapsis|fastpath|turnkey|competitor)\b/i,
    answer: "I would not claim we are simply better. I ask what they are buying: access governance, SoD, threat detection, vulnerability management, cloud coverage, integration, or cost. Then I compare on those criteria, name our strength, and say where another product is stronger or where we need an extra component. The goal is a decision the customer can defend. GRC and a threat-detection product are not the same thing: GRC governs whether access should exist; threat detection tells you what the user actually did."
  },
  {
    id: "iam-iga-pam",
    re: /\b(iam).{0,20}(iga).{0,20}(pam)\b|\b(iga).{0,15}(pam)\b|\brelationship between iam\b/i,
    answer: "IAM establishes the identity, authentication, and lifecycle. IGA governs whether the access is appropriate: request, approval, certification, policy. PAM controls highly privileged accounts. In SAP, GRC Access Control is the application IGA layer through ARA, ARM, BRM, and access review. EAM is the SAP emergency-privilege control. I would not say GRC replaces enterprise IAM or enterprise PAM."
  },
  {
    id: "iam-integration",
    re: /\bintegrat\w+ sap security with iam\b|\bsap iam\b|\bwhat is iam in an sap\b/i,
    answer: "I separate identity lifecycle, authentication, and SAP authorization. HR or the enterprise IdP owns the joiner, mover, and leaver. IAS or the corporate IdP authenticates. PFCG and the target app enforce authorization. GRC decides whether the access is appropriate. Example path: HR event, identity lifecycle, SSO, SAP user, role assignment, ARA risk check. The exact products depend on whether they use IAS and IPS, Entra ID, or another IdP. Cloud identity should not become a second governance island."
  },
  {
    id: "ias-ips",
    re: /\b(ias).{0,25}(ips)\b|\b(ips).{0,25}(ias)\b|\bcloud identity services\b/i,
    answer: "IAS is the identity provider or proxy IdP: SAML 2.0 or OpenID Connect, SSO, and MFA. It authenticates. It does not provision and it does not run SoD. IPS is the SCIM source-to-target job: read the source, map, write the target. In a hybrid landscape the Cloud Connector is the outbound tunnel to on-premise systems, with no inbound firewall. At Dover, IAG with S/4 and BTP used IPS and Cloud Connector, and BTP role collections sat in the same request and review path as on-premise roles."
  },
  {
    id: "authn-authz",
    re: /\b(authentication).{0,30}(authorization)\b|\b(authorization).{0,30}(authentication)\b/i,
    answer: "Authentication answers who you are. Authorization answers what you may do. IAS or Entra ID can authenticate. SAP roles, authorization objects, and BTP role collections decide what that user can execute. Successful SSO is not application access."
  },
  {
    id: "btp-security",
    re: /\b(btp security|security of (sap )?btp|know about (sap )?btp)\b/i,
    answer: "BTP security is identity, authentication, authorization, and integration, designed with the hybrid landscape rather than as an island. IAS or the corporate IdP establishes trust. The runtime token is OAuth 2.0 or JWT. Role collections hold the roles and are assigned to users or groups. The application enforces scopes through XSUAA. Cloud Connector only when a call reaches an on-premise backend."
  },
  {
    id: "jml",
    re: /\b(joiner|jml|mover).{0,20}(leaver|sap)\b|\bhow (do|would) you secure joiner\b/i,
    answer: "Joiner gets access from the business role, not a copied user. Mover reassesses old access; that is the usual failure, because people accumulate roles. Leaver removes access across the connected systems, not only a lock in one app. I connect the HR or IAM lifecycle event to provisioning and to a GRC risk check, so the governance decision is in the path."
  },
  {
    id: "least-privilege",
    re: /\bwhat is least privilege\b|\bleast privilege in sap\b/i,
    answer: "Least privilege is only the access the job needs. In SAP that is the role, the authorization object and values, and the org levels, not a smaller transaction count by itself. I still run SoD, because two legitimate permissions can form a conflict. The user must still be able to do the job."
  },
  {
    id: "rbac",
    re: /\bwhat is rbac\b|\brole-based access control\b/i,
    answer: "RBAC assigns access from the business role rather than one-off permissions. In SAP, PFCG is the enforcement mechanism. GRC business-role governance and SoD analysis keep those roles appropriate. The role is not the governance decision."
  },
  {
    id: "privileged",
    re: /\b(what is )?privileged access\b|\bhow (do|would) you control privileged\b/i,
    answer: "Privileged access can change the system or a sensitive business outcome. I minimize standing privilege: approval, time bound, logging, and an independent review. Emergency need goes through EAM or Firefighter, not a permanent SAP_ALL."
  },
  {
    id: "sap-all",
    re: /\bsap_all\b/i,
    answer: "I ask why they want SAP_ALL. If it is troubleshooting or a cutover emergency, I use a time-bound firefighter or a narrow role, with a reason and a log review. I do not leave unrestricted access on the user master. Least privilege, with an operational path for the real emergency."
  },
  {
    id: "troubleshoot-auth",
    re: /\btroubleshoot\w* (an )?sap authorization\b|\bauthorization (issue|error|dump)\b/i,
    answer: "I reproduce the exact transaction or app before I change a role. SU53 shows the last failed AUTHORITY-CHECK. If that is not enough, STAUTHTRACE or ST01 while the user repeats it. I separate missing authorization, wrong field value, missing role, wrong org level, a user-comparison gap, and a Fiori or OData failure on S_SERVICE. Then I fix the object or the catalog and retest. I do not grant broad access to clear the error."
  },
  {
    id: "usability",
    re: /\bbalance security with (business )?usability\b|\bsecurity and usability\b/i,
    answer: "I treat it as risk-based, not as a contest. Low-risk access should be simple and automated. High-risk access gets a stronger approval, SoD check, or monitoring. The business should get the access the job needs. Unacceptable combinations stay controlled. Business roles and a governed request path do that better than manual administration."
  },
  {
    id: "roi",
    re: /\b(roi|tco)\b/i,
    answer: "I start from their baseline. Operational cost of manual requests, provisioning, and audit evidence. Risk cost of excessive access, open SoD, and standing privilege. Then license, implementation, and run cost. I also look at whether more SAP systems can be governed without a matching growth in the security team. The case is efficiency, risk reduction, and evidence, not a feature list."
  },
  {
    id: "cyber-risks",
    re: /\b(biggest|major|cybersecurity) risks in (an )?sap\b|\bsap security within the broader cybersecurity\b|\bdifferent from traditional cybersecurity\b/i,
    answer: "SAP security is application security inside the same cybersecurity principles: identity, least privilege, privileged access, SoD, monitoring, and compliance. The SAP-specific part is the business process, the role, the authorization object, and the org value. I group the risk as identity and JML, standing privilege, SoD in the process, technical exposure such as interfaces and configuration, and detection plus evidence. Least privilege becomes PFCG design. IGA becomes GRC. PAM for SAP emergencies becomes Firefighter. I would not describe SAP security as only role administration."
  },
  {
    id: "zero-trust",
    re: /\bzero trust\b/i,
    answer: "Zero Trust in SAP means verify the identity, grant the minimum access, separate conflicting duties, control privilege, review access again, and monitor use. GRC supports the governance part: request, risk analysis, certification, and emergency access. I would not say GRC by itself implements Zero Trust."
  },
  {
    id: "itgc-sox-audit",
    re: /\b(itgc|sox|how does grc (support|help with) audit|relationship between sap grc and audit)\b/i,
    answer: "ITGC in SAP includes provisioning and deprovisioning, approvals, role assignment, privileged access, access review, SoD, and evidence of changes. SOX cares about access around financial processes. GRC can identify those conflicts, govern the request, control firefighter use, run reviews, and produce evidence. I would not say installing GRC makes the company SOX compliant. The auditor tests the control environment, not the fact that the product is installed."
  },
  {
    id: "continuous-monitoring",
    re: /\bcontinuous controls monitoring\b/i,
    answer: "Continuous controls monitoring replaces a once-a-year manual test with a repeated check of a defined condition: open SoD, critical access, privileged use, or a policy break. The point is to find the failure before the next audit, not to generate another report."
  },
  {
    id: "siem",
    re: /\b(siem|soc)\b/i,
    answer: "A network SIEM does not see SAP application attacks such as an SE16N download, unauthorized RFC, or a table-parameter change. I put an SAP-aware detection layer, Enterprise Threat Detection or a product such as SecurityBridge or Onapsis, on the Security Audit Log in SM19 and SM20, Read Access Logging, change documents, and Gateway or RFC logs, then forward CEF or Syslog to the SOC. GRC answers whether the access should exist. The SIEM answers whether the activity looks wrong. I would not send every SAP event. I would send privileged activity, failed logons, user and role changes, sensitive configuration, firefighter use, and selected high-risk business events."
  },
  {
    id: "grc-vs-detection",
    re: /\b(grc).{0,40}(threat detection|siem)\b|\b(threat detection).{0,30}(grc)\b|\bvulnerability management\b/i,
    answer: "GRC asks who should have access and whether that access creates risk. Threat detection asks what is happening and whether it looks suspicious. Vulnerability management asks whether the system, software, or configuration can be exploited. A patched system can still have excessive privilege. A clean role model does not patch a vulnerability. I need all three, and I would not call them the same product."
  },
  {
    id: "nist",
    re: /\bnist\b/i,
    answer: "I map SAP into the NIST functions without pretending one product covers all of them. Identify the assets, identities, and processes. Protect with authentication, least privilege, SoD, and controlled privilege. Detect through SAP telemetry into the SIEM. Respond by containing the identity and investigating the logs. Recover by restoring access safely and fixing the control that failed. GRC is strongest in protect and in the evidence. Detection and recovery need the SOC and the basis team as well."
  },
  {
    id: "incident",
    re: /\bincident response\b/i,
    answer: "I follow the company incident process and add the SAP facts. Validate the event, name the identity, system, and business process, contain it by restricting that access, correlate SAP logs with the IdP and the SIEM, fix the cause, restore normal access, and review. An access-control mistake and malicious use are not the same response."
  },
  {
    id: "uar",
    re: /\baccess certification\b|\buser access review\b|\buar\b/i,
    answer: "Access certification is a periodic review of whether access that was approved once is still appropriate. A manager or role owner certifies it. In GRC that is the user access review. Access is not permanently valid because it was approved at hire."
  },
  {
    id: "risk-vs-control",
    re: /\b(difference|distinguish).{0,30}(control).{0,20}(risk)\b|\brisk from a control\b|\bpreventive vs detective\b|\bpreventive (control )?versus detective\b/i,
    answer: "A risk is what can go wrong. A control is how you prevent, detect, or correct it. Vendor creation plus payment is the risk. Removing that combination, or reviewing it when it must remain, is the control. Preventive controls stop the event, such as role restrictions and SoD at request time. Detective controls find it afterward, such as access review, firefighter log review, and SIEM. A mature design uses both."
  },
  {
    id: "fraud",
    re: /\bprevent fraud\b|\bcan grc prevent fraud\b/i,
    answer: "GRC can reduce access-related fraud risk through SoD, least privilege, controlled privilege, and review. It does not prevent fraud by itself. Fraud also depends on the business process, detective monitoring, and behavior. I would not claim the product stops fraud."
  },
  {
    id: "governance-means",
    re: /\bwhat (exactly )?do you mean by governance\b|\bwhat is governance\b/i,
    answer: "Governance is who decides, which policy applies, how a request is approved, how risk is evaluated, how an exception is owned, and what evidence shows the process ran. The technology implements the control. The business owns the risk."
  },
  {
    id: "difficult-stakeholder",
    re: /\b(difficult|skeptical) (customer|stakeholder)\b|\bstakeholder situation\b/i,
    answer: "At Dover, some access that created SoD conflicts was defended as operationally necessary. I sat with Finance, Procurement, Supply Chain, and HR, mapped the conflict back to the activity, removed what was not required, and where separation was not practical I put a named mitigating control on it. That cleared more than 2,400 conflicts before cutover and stayed defensible to audit. If an owner still refuses, I document the residual risk and have that owner accept it. I do not silently override the control."
  },
  {
    id: "complex-grc",
    re: /\bmost complex grc\b|\bdover corporation program\b|\bled the grc workstream\b/i,
    answer: "Dover was the complex one: ECC to S/4, 11 countries, 28 legal entities, more than 8,700 users, three phased go-lives. I led GRC Access Control 12.0 across ARA, ARM, BRM, and EAM, 18 connected systems, more than 250 custom SoD rules, 300 mitigating controls, about 4,000 ARM requests a year, and 95 firefighter owners. Roles were SoD-simulated before transport. The three go-lives finished on the plan and the SOX review had no significant access-control finding. I owned the design, the ruleset method, the workshops, the testing approach, and the audit conversation, with a team of eight."
  },
  {
    id: "eminov-hypercare",
    re: /\b(eminov|eminnov).{0,40}(cutover|hypercare|could have gone wrong)\b|\bp1 access incident\b/i,
    answer: "Eminnov was a GRC 12.0 S/4 conversion across 9 countries and about 6,500 users, rebuilding about 1,300 roles and 180 Fiori catalogs, with 110 firefighter IDs, in one global cutover. I treated security readiness, testing, and hypercare as part of the plan rather than a final checklist. The cutover completed and the following eight weeks of hypercare had no P1 access incident."
  },
  {
    id: "killer-scenario",
    re: /\b(running ecc and planning s\/?4|significant sod issues|fragmented iam|propose a solution)\b/i,
    answer: "Four stages. Discovery: current ECC roles, processes, SoD, how access is provisioned today, audit findings, and the S/4 target. Target architecture: S/4 and Fiori authorization, GRC Access Control, identity lifecycle, and authentication. Governance: ARA for risk, ARM for requests, EAM for emergency access, BRM for business roles. Transformation: redesign, remediate, test, cut over, hypercare. I would demo one process they actually run, such as Procure-to-Pay, not a generic click-path. The outcome I would name is a cleaner S/4 model, a controlled lifecycle, less standing SoD exposure, and evidence an auditor can use."
  },
  {
    id: "dashboard-green",
    re: /\b(2,?000 risks|dashboard shows|dashboard isn'?t working|make the dashboard)\b/i,
    answer: "The point of risk analysis is not to force the number to zero. I would classify the findings by severity, separate real risk from a bad rule, remove unnecessary access, and mitigate only what the business must keep. Success is risk reduction and a control that operates, not a green dashboard."
  },
  {
    id: "questions-for-them",
    re: /\bquestions (do you have|would you ask|for us)\b|\banything you want to ask\b/i,
    answer: "I would ask what the hardest part of SAP Security and GRC presales is today: discovery, architecture, competitive positioning, POCs, or turning a technical discussion into business value. What usually separates a win from the other vendors. What you would want this person to have done in six months. How early presales joins discovery. And where the practice is actually growing: GRC, IAM, S/4 transformation, BTP, or threat detection."
  }
];

function recallExpectedAnswer(question = "") {
  const text = String(question || "");
  if (!text.trim()) return null;
  for (const entry of EXPECTED_ANSWERS) {
    try {
      if (entry.re.test(text)) return { id: entry.id, answer: entry.answer };
    } catch (error) {
      // one bad pattern must not break generation
    }
  }
  return null;
}

module.exports = { EXPECTED_ANSWERS, recallExpectedAnswer };
