// Adversarial interviewer-behavior scenarios. Each is tested against the LIVE
// single-pass production endpoint (no critic/improve step) because the point is
// to measure how the system actually behaves under real interview pressure,
// not what an idealized revision could look like.
const ADVERSARIAL_CASES = [
  {
    domain: "SAP Security",
    behavior: "interruption",
    question: "How do you approach designing a role-based authorization concept for— actually hold on, skip the design part, just tell me: what do you do FIRST when you inherit an existing, messy role landscape with no documentation?"
  },
  {
    domain: "SAP GRC",
    behavior: "incorrect_assumption",
    question: "Since ARM automatically blocks any access request that has an SoD conflict, walk me through how you'd configure that automatic blocking behavior in SAP GRC."
  },
  {
    domain: "SAP IDM",
    behavior: "rapid_fire",
    question: "Quick round: What triggers a deprovisioning event? What happens if HR data is late? What's the SLA you'd set? What breaks first if provisioning fails silently? Go."
  },
  {
    domain: "SAP BTP Security",
    behavior: "multi_part",
    question: "Three things: first, how do you secure the Cloud Connector itself; second, how do you handle certificate rotation without downtime; and third, how would your approach differ if the on-premise system was a non-SAP legacy application instead of an SAP backend?"
  },
  {
    domain: "S/4HANA Migration",
    behavior: "contradictory_follow_up",
    question: "You said earlier that role redesign is usually necessary during an ECC to S/4HANA migration, but I've also heard experienced consultants say you should never touch existing roles during a technical migration. Which is it, and why did you contradict that?"
  },
  {
    domain: "Audit",
    behavior: "repeated_why",
    question: "Why do you review SoD conflicts before an audit? ... Why does that actually matter to the auditor specifically? ... Why would the auditor care about that over just checking the control exists? ... Why is that distinction important enough to spend time on during audit prep?"
  },
  {
    domain: "Emergency Access",
    behavior: "edge_case_scenario",
    question: "Edge case: a firefighter ID is active, the user performing emergency changes loses network connectivity mid-session before the log capture completes, and the emergency access session times out without a proper checkout. How do you handle reconciliation and audit evidence in that exact scenario?"
  }
];

module.exports = { ADVERSARIAL_CASES };
