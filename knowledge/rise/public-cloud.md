# RISE Public Cloud Deployment

## Overview

RISE with SAP typically deploys to public cloud infrastructure (AWS, Microsoft Azure, or Google Cloud Platform) as the primary option. Public cloud deployment means S/4HANA Cloud runs on hyperscaler IaaS (Infrastructure as a Service), with SAP managing the platform layer and the cloud provider managing the physical infrastructure. Public cloud offers economies of scale, global availability zones for redundancy, managed security, compliance certifications (SOC2, ISO, HIPAA, GDPR), and automatic scaling. For most enterprises, RISE on public cloud is the default; private cloud (on-premise or dedicated) is an alternative for organizations with strict data residency or sovereignty requirements.

## Interview Summary

RISE on public cloud (AWS/Azure/GCP) means S/4HANA Cloud runs on hyperscaler infrastructure. Organizations don't own or manage physical hardware; they consume compute, database, storage as a service. Public cloud offers global availability, managed security, compliance, cost efficiency, and auto-scaling. Private cloud (on-premise) is the alternative for data sovereignty or regulatory constraints.

## 30 Second Interview Answer

RISE on public cloud deploys S/4HANA to AWS, Azure, or GCP. SAP manages the S/4HANA application layer, the cloud provider manages infrastructure. Organizations get global cloud infrastructure, managed backup/recovery, compliance certifications (SOC2, ISO, GDPR, etc.), and automatic scaling without owning or maintaining data centers. Compared to on-premise, public cloud is faster to deploy (no hardware procurement), cheaper upfront (no capex), more scalable (auto-scaling), and globally distributed (data residency options).

## 60 Second Interview Answer

RISE on public cloud consumes hyperscaler infrastructure (AWS EC2/RDS, Azure VMs/SQL, GCP Compute/Cloud SQL). S/4HANA Cloud runs on top, and organizations access it via internet from anywhere. SAP manages application availability and updates. The cloud provider (AWS/Azure/GCP) manages infrastructure, physical security, power, cooling, network infrastructure—eliminating customer capex and ops for data center management.

Public cloud advantages: (1) No infrastructure capex (no server purchase, no facility costs), (2) Global availability (choose region for data residency), (3) Managed security (cloud provider's 24/7 security ops, DDoS protection, compliance audits), (4) Automatic scaling (don't over-provision; scale up/down with demand), (5) Disaster recovery (multi-AZ redundancy, managed backup), (6) Compliance certifications (SOC2 Type II, ISO 27001, HIPAA, GDPR, PCI-DSS—cloud provider already certified).

Trade-offs: (1) Shared infrastructure (multi-tenant cloud; isolation is logical, not physical), (2) Vendor lock-in (if using cloud provider's managed services, migrating later is complex), (3) Network latency (cloud to on-premise legacy systems requires network optimization), (4) Cost unpredictability (auto-scaling can cause bill surprises if not monitored).

## 90 Second Interview Answer

RISE on public cloud means S/4HANA Cloud is deployed on AWS, Azure, or GCP infrastructure. The deployment model is full IaaS: compute (VMs/instances), networking (VPCs, security groups), storage (block storage/object storage), database (managed SQL/NoSQL), and supporting services (CDN, caching, monitoring). SAP is responsible for the S/4HANA application and middleware layer; the cloud provider owns infrastructure and handles scaling/patching/security at the IaaS level; the customer owns business configuration and custom extensions.

**Regional Deployment:** Organizations choose cloud region based on data residency requirements (GDPR → Europe regions, China → China regions, etc.). S/4HANA Cloud runs in that region; data physically resides there. Backup and disaster recovery can span regions for resilience or stay within region for sovereignty compliance.

**Connectivity Model:** Unlike on-premise where users are on corporate network, public cloud S/4HANA is accessed via internet. (1) Internal users: authenticate via cloud identity (IAS/Okta), get token, access S/4HANA over internet (from office or remote). (2) Integrations to on-premise systems: use ExpressRoute (Azure), Direct Connect (AWS), or Interconnect (GCP)—dedicated network circuits for predictable latency, or site-to-site VPN for cheaper but less predictable option.

**Infrastructure Scalability:** Auto-scaling is automatic for most layers. SAP manages S/4HANA scaling. Cloud provider manages infrastructure scaling (if 2 VMs aren't enough, 4 are provisioned automatically). Capacity planning is simplified: buy only what you use, pay only for what you consume. Exception: database sizing still requires planning (can't auto-scale databases infinitely without cost explosion).

**Cost Model:** Hyperscalers charge per resource, per hour/month. Compute: hourly or reserved instances (reserve for 1-3 years, get discount). Database: managed SQL costs vary by size, IOPS, backup retention. Storage: per GB. Data transfer: egress (cloud to internet) charged; ingress (internet to cloud) free; inter-region expensive. Organizations must monitor to avoid surprises. AWS Cost Explorer, Azure Cost Management, GCP Cost Tools help.

**Multi-Cloud Strategy (Rare but Growing):** Some enterprises deploy RISE on AWS, use Azure for analytics, GCP for AI/ML. Integration via APIs. Reduces vendor lock-in but adds operational complexity. Most enterprises standardize on one cloud.

**Hybrid Integration Architecture:** Public cloud S/4HANA integrates with on-premise legacy systems via ExpressRoute/Direct Connect (dedicated network, low latency, high reliability) or VPN (cheaper, higher latency). Cloud ALM orchestrates the integration pipeline. Master data may stay in cloud S/4HANA; transaction data may shuttle between cloud and on-premise legacy systems.

## Architecture

- **Compute:** VMs (AWS EC2, Azure VMs, GCP Compute Engine) running S/4HANA application servers
- **Database:** Managed SQL (AWS RDS, Azure SQL, GCP Cloud SQL) with automatic backups
- **Storage:** Block storage for OS/application, Object storage for documents
- **Networking:** VPC (Virtual Private Cloud) with security groups, isolated network per customer
- **Redundancy:** Multi-AZ (availability zone) deployment for high availability (automatic failover)
- **Connectivity:** ExpressRoute/Direct Connect to on-premise systems, or VPN as fallback
- **Managed Services:** Cloud provider handles infrastructure patching, scaling, security monitoring
- **Compliance:** Cloud provider's compliance certifications (SOC2, ISO, GDPR, HIPAA, PCI-DSS, etc.)

## Runtime Flow

1. **Provisioning:** Cloud account setup, VPC creation, security groups configured, IAM roles defined
2. **Deployment:** S/4HANA Cloud deployed to chosen cloud region by SAP
3. **Connectivity:** ExpressRoute/Direct Connect or VPN established to on-premise systems
4. **Identity Federation:** Cloud identity provider (IAS/Okta/Entra ID) configured, on-premise AD federated
5. **Data Migration:** Data migrated from on-premise ECC to cloud S/4HANA (via Cloud ALM)
6. **Integration:** Cloud Integration (CPI) configured for real-time/batch sync between cloud and on-premise
7. **Testing:** System integration testing, user acceptance testing in cloud environment
8. **Go-Live:** Cutover from ECC to S/4HANA Cloud
9. **Operations:** Continuous monitoring via cloud provider's tools and SAP's Cloud Operations Analytics
10. **Scaling:** Auto-scaling handles demand peaks; SAP/cloud provider manage transparently
11. **Patching:** SAP patches the application; cloud provider patches IaaS; customer does nothing
12. **Backup/Recovery:** Cloud provider's managed backup, SAP handles recovery orchestration

## Configuration

- **Cloud Account:** AWS, Azure, or GCP account (billing, permissions, resource limits)
- **Region Selection:** Choose based on data residency (EU, US, Asia-Pacific)
- **Availability Zones:** Typically multi-AZ for HA (automatic failover between zones)
- **VM Sizing:** Choose based on performance requirements (small, medium, large, extra-large)
- **Database Sizing:** Based on data volume and transaction throughput
- **Network Security:** Security groups (inbound/outbound rules), network ACLs, DDoS protection
- **Backup Policy:** Retention period (7-30 days typical), backup frequency (daily/hourly)
- **Monitoring:** CloudWatch (AWS), Azure Monitor, GCP Cloud Monitoring for infrastructure
- **Cost Controls:** Budget alerts, reserved instances to reduce costs, spot instances for non-critical workloads
- **Compliance:** Enable compliance scanning, audit logging to meet regulatory requirements

## Implementation Activities

- Evaluate cloud provider options (AWS, Azure, GCP) based on organizational strategy
- Plan cloud account structure (single account vs multi-account for isolation)
- Design VPC and network security (CIDR ranges, security groups, NACLs)
- Plan connectivity: ExpressRoute/Direct Connect for predictable performance vs VPN for cost
- Establish cloud identity provider federation
- Plan data migration strategy and cutover timing
- Configure Cloud Integration for on-premise system connectivity
- Set up cloud cost monitoring and budgeting
- Establish cloud operations procedures (monitoring, alerting, incident response)
- Plan disaster recovery strategy (multi-region replication if required)
- Test failover scenarios in cloud environment

## Migration Activities

- Validate cloud region selection against data residency/compliance requirements
- Test connectivity from on-premise to cloud (latency, throughput)
- Validate that all integrations work via cloud connectivity
- Plan data migration volumes and validate cloud network can handle throughput
- Test backup and recovery procedures in cloud before production go-live

## Rollout Activities

- For multi-region rollout: deploy S/4HANA Cloud in primary region first, then additional regions
- Replicate cloud infrastructure (VPC, security groups, networking) to additional regions
- Set up cross-region replication for backup if business requires global redundancy
- Configure regional identity provider federation (if different regions use different auth)

## Production Support Activities

- Monitor cloud infrastructure via cloud provider's monitoring (CPU, memory, disk, network)
- Track cloud costs monthly and optimize (right-size instances, use reserved instances, delete unused resources)
- Manage cloud account and permissions (IAM roles, access control)
- Handle cloud provider incidents (region outages, service degradation)
- Maintain cloud backup and test recovery procedures regularly
- Update cloud security configurations as new threats emerge
- Manage cloud compliance certifications and audit processes

## Troubleshooting

**Common issue:** Latency to on-premise legacy systems is unacceptable (>200ms).
Root cause: Using VPN instead of dedicated circuit; or ExpressRoute/Direct Connect under-provisioned.
Resolution: Upgrade to dedicated circuit (ExpressRoute/Direct Connect), verify bandwidth, check routing, optimize application to reduce chattiness between cloud and on-premise.

**Common issue:** Cloud infrastructure cost is 2x expected.
Root cause: Auto-scaling scaled too aggressively, non-prod environments over-sized, data transfer between clouds expensive.
Resolution: Review scaling policies, right-size instances, use reserved instances, consolidate non-prod to fewer instances, monitor data transfer.

**Common issue:** Cloud region outage; S/4HANA is unreachable.
Root cause: Single-region deployment with no backup; regional infrastructure failure in hyperscaler.
Resolution: Deploy multi-region redundancy (expensive but high availability), use cloud provider's SLA (usually 99.99% uptime with proper HA setup).

**Common issue:** Cloud security incident; unauthorized access detected.
Root cause: Security group too permissive, IAM role over-privileged, identity compromise.
Resolution: Audit security group rules, rotate credentials, review IAM policies, enable MFA, establish incident response procedures.

## Common Interview Questions

1. **Why choose public cloud for RISE instead of on-premise S/4HANA?**
   Public cloud: no capex, global availability, managed security/compliance, auto-scaling. On-premise: capital upfront, lower ongoing costs (if fully loaded), data residency not an issue (can keep on-premise). Business decision based on: capex budget, agility timeline, global vs local operations, compliance requirements.

2. **What's the difference between AWS, Azure, and GCP for RISE?**
   All three support S/4HANA Cloud. AWS is most mature/largest market share. Azure has strong integration with Microsoft stack (for enterprises heavily on Windows/Office). GCP is cost-competitive, strong data analytics. All have equivalent compliance/security. Organizational preference often drives choice (existing contracts, skill depth).

3. **How do you choose between ExpressRoute, Direct Connect, and VPN?**
   ExpressRoute (Azure) / Direct Connect (AWS) / Interconnect (GCP): dedicated circuits, predictable latency, expensive but high reliability. VPN: cheaper, simpler to provision, but variable latency. Choose based on: integration volume (high volume → dedicated), latency requirements (strict → dedicated), budget (constrained → VPN).

4. **What security controls are needed for public cloud S/4HANA?**
   Cloud provider handles infrastructure security (DDoS, physical, network). Customer owns: application config, identity management, data governance, access control. Cloud provider provides tools (security groups, IAM, encryption); customer must configure correctly. Common mistakes: over-permissive security groups, under-privileged IAM roles, unencrypted data.

5. **How does auto-scaling work in public cloud RISE?**
   Cloud provider automatically adds/removes compute resources based on demand. S/4HANA application scales transparently. Database doesn't auto-scale infinitely (cost concern); usually manually sized. Network scales automatically. Organizations monitor auto-scaling behavior to ensure it's cost-effective.

6. **What's the impact of multi-AZ deployment on RISE?**
   Multi-AZ = deploy across 2+ availability zones within a region. Automatic failover if one AZ fails. Higher cost (redundant infrastructure), but HA guaranteed. Most production RISE deployments are multi-AZ.

7. **How do you manage cloud costs in RISE?**
   Monitor monthly via cloud provider tools. Right-size instances (don't reserve too much). Use reserved instances for predictable load (1-3 year commitment gets discount). Delete unused resources (test environments). Optimize data transfer (limit inter-region, compress). Budget alerts to catch surprises.

8. **What's the backup strategy for RISE on public cloud?**
   Cloud provider manages automated backups (daily by default). SAP manages backup orchestration. RPO/RTO usually <1 hour. Tested and monitored by SAP. Customer doesn't own backup operations.

9. **How do you handle multi-region RISE deployments?**
   Primary region for main operations, secondary region for backup/failover. Data replicated asynchronously (replication lag, RPO ~5-15 min). Higher cost but true geographic redundancy. Business decides: is it worth the cost?

10. **Can RISE be deployed on hybrid cloud (part AWS, part on-premise)?**
    Yes, but complex. Usually: S/4HANA in cloud, legacy systems on-premise, integrated via Cloud Integration. Or: distributed SAP systems across cloud and on-premise (rare). Most enterprises consolidate to single cloud for simplicity.

## Tough Follow-up Questions

1. **Your organization requires strict data residency (EU data in EU). How does this change public cloud RISE?**
   Deploy S/4HANA Cloud to EU region (Frankfurt for AWS, Europe West for Azure). Data physically resides in EU; backup replication stays within EU. Backup to different EU zone for HA, not outside EU. Compliance certifications (SOC2, ISO) already present in EU regions.

2. **You're using VPN to on-premise but latency is killing your integration performance. What do you do?**
   Upgrade to ExpressRoute/Direct Connect for dedicated circuit. Takes 1-3 months to provision. In the interim: cache data locally (reduce real-time sync), batch instead of real-time (shift to scheduled sync), optimize application to reduce chattiness.

3. **Your cloud bill is $2M/year vs budgeted $1M. Business wants to know why. What's your response?**
   Investigate: (1) Auto-scaling caused over-provisioning? (2) Non-prod environments over-sized? (3) Data transfer between regions expensive? (4) Reserved instances not used? (5) Forecast was wrong (business grew faster). Propose: right-sizing, reserved instances, cost optimization, forecast adjustment.

4. **SAP releases a security patch that requires downtime. Your SLA is 99.99% uptime. How do you patch without breaking SLA?**
   Deploy multi-region with failover. Patch primary region (planned downtime). Fail over to secondary (users don't see outage). Patch secondary. This requires multi-region redundancy (expensive) but allows zero-downtime patching.

5. **You need to migrate from AWS to Azure (organizational decision). How do you do this without massive effort?**
   One-time effort: redefine cloud infrastructure on Azure (VPC, security, sizing). SAP handles S/4HANA re-deployment. Data migration: export from AWS, import to Azure. Integration: re-configure connectivity. Business impact: weeks of effort, significant cost. This is why cloud provider choice is a big decision.

## SAP Transactions
- **SMSY** (System Landscape Directory) — View cloud deployment and on-premise systems connectivity
- **SOLMAN** (Solution Manager) — SAP's centralized management tool (can manage cloud and on-premise together)
- **Transaction STMS** (Transport Management System) — Moving code/config between cloud and on-premise (if custom extensions exist)

## SAP Tables
- **TCURR** (Currency Table) — Configuration (same across cloud and on-premise)
- **T001** (Company Codes) — Multi-company configuration in cloud
- **KONP** (Pricing Data) — Pricing configuration (specific to RISE deployment region)

## Best Practices
- Choose cloud region based on actual data residency needs (don't choose US if EU required)
- Deploy multi-AZ for HA (not optional for production)
- Use dedicated connectivity (ExpressRoute/Direct Connect) for on-premise integration
- Establish cloud cost monitoring from day one (avoid surprises)
- Use reserved instances for predictable load (1-3 year commitment, ~30% savings)
- Test disaster recovery procedures regularly
- Establish cloud security baseline (security groups, IAM, encryption)
- Separate test/dev environments from production (different clouds or different accounts)
- Document cloud architecture (who owns what, escalation paths for outages)

## Common Mistakes
- Choosing cloud region for cost instead of compliance (ends up in wrong region later)
- Deploying single-AZ for cost savings, then getting hit by zone failure
- Using VPN for latency-sensitive integrations (should use dedicated circuit)
- Over-sizing instances to "be safe" (costs balloon)
- Not monitoring cloud costs (bills arrive, management shocked)
- Neglecting cloud security (overly permissive security groups, unencrypted data)
- Treating cloud CapEx → OpEx as magic (cloud is just shifting where money goes, not saving it)

## Interviewer's Hidden Expectations

Strong answers demonstrate: (1) understanding public cloud **trade-offs** (not just benefits), (2) practical knowledge of **cloud connectivity** (VPN vs dedicated circuit and when to use each), (3) **cost awareness** (cloud costs are a real concern, not magic), (4) **security thinking** (shared infrastructure requires careful configuration), (5) **global architecture** thinking (multi-region, compliance, resilience).

Listen for: "We moved to AWS, latency killed us, had to add ExpressRoute" or "Cloud bill surprised us; we had to right-size" — signs of real experience.

## What Makes This a 10/10 Answer
- Clear comparison of public cloud vs on-premise trade-offs
- Understanding of AWS/Azure/GCP differentiation (not just "all the same")
- Practical knowledge of connectivity (VPN vs dedicated, latency implications)
- Cost awareness and optimization strategies
- Multi-AZ and disaster recovery thinking
- Security in shared infrastructure (not just provider's responsibility)
- Experience example with lesson learned

## Red Flags
- Treating cloud as "infinite, cheap infrastructure" (it's not)
- Not understanding connectivity challenges to on-premise
- Assuming all regions are equivalent (compliance/data residency ignored)
- No mention of cost management (disaster waiting to happen)
- Single-AZ deployments for production (no HA thinking)

## Keywords
- Public cloud, AWS/Azure/GCP, hyperscaler, IaaS
- ExpressRoute, Direct Connect, Interconnect, VPN
- Multi-AZ, availability zone, auto-scaling
- Managed services, compliance certifications
- Data residency, cloud region, sovereignty
- Cost optimization, reserved instances, spot instances
- Security groups, IAM roles, encryption

## Related Topics
- [RISE Overview](rise-overview.md)
- [RISE Private Cloud Alternative](private-cloud.md)
- [Cloud Connector for on-premise integration](../btp/cloud-connector.md)
- [Cloud Security Architecture](../cloud/cloud-security.md)
