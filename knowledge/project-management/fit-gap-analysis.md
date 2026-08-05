# SAP Fit-Gap Analysis

## Overview

Fit-gap analysis is the structured comparison of SAP standard functionality against business requirements. It identifies where SAP "fits" (standard functionality matches requirements) and where "gaps" exist (standard functionality doesn't meet requirements, customization needed). A thorough fit-gap analysis allows organizations to make informed decisions: adopt SAP standard processes, customize SAP, or change business processes to match SAP. These decisions directly impact project cost, timeline, complexity, and long-term supportability.

## Interview Summary

Fit-gap analysis compares SAP standard functionality to business requirements, identifying what works out-of-box versus what requires customization or process change.

## 30 Second Interview Answer

Fit-gap analysis takes business requirements and asks: "Does SAP do this out-of-box?" For each requirement, you map it to SAP functionality. If SAP standard matches, it's a "fit"—no customization needed. If SAP standard doesn't match, it's a "gap"—you must decide whether to customize SAP, change the business process to match SAP, or find a workaround. Fit-gap analysis prevents scope creep by making customization visible and justified.

## 60 Second Interview Answer

Fit-gap analysis is a systematic comparison: for each business requirement, identify the SAP standard functionality that addresses it. Document: requirement, SAP functionality (if it exists), gap assessment (fit or gap), and gap resolution (customize, adopt SAP standard, or change process). A strong fit-gap analysis shows clearly where customization is needed and why. This drives project decisions: customization increases cost and complexity; adopting SAP standard reduces cost and risk. Gap resolution options for each gap: SAP Standard (adopt as-is, no cost), Slight Customization (configuration change, low cost), Moderate Customization (user exit or small enhancement, medium cost), Heavy Customization (major development, high cost, high risk). Fit-gap analysis is the business case for customization decisions.

## 90 Second Interview Answer

Fit-gap analysis is performed during Explore phase after requirements are gathered and before design is locked. For each business requirement, consultants research SAP standard functionality, document where it fits or gaps, and present options for gap resolution to business stakeholders. A strong fit-gap analysis includes: current-state analysis (how is it done today), future-state SAP design (how SAP would do it), gap summary (what's missing), and gap resolution with trade-offs. Example: Finance requires monthly automated intercompany reconciliation. SAP standard: FI reconciliation tools (existing, fits) + IDoc interfaces (existing, fits) + custom reconciliation program (gap). Fit: 90%, Gap: 10%. Gap resolution: develop custom program. Cost: medium. Most gaps fall into three categories: configuration gaps (settings can enable it, no custom code), functional gaps (SAP doesn't have it, must customize), and process gaps (SAP can do it differently, requires process change). Fit-gap analysis is the business case for all three resolution types.

## Architecture

Fit-gap analysis architecture includes:

1. **Requirement Mapping**
   - Each business requirement mapped to SAP functionality (or documented as gap if no functionality exists)
   - SAP transaction codes and modules identified
   - Data flow implications documented

2. **Gap Categories**
   - Configuration gaps: handled through module settings
   - Functional gaps: handled through custom development
   - Process gaps: handled through process redesign
   - Integration gaps: handled through interfaces

3. **Gap Resolution Options**
   - Adopt SAP standard (no cost, risk: process change needed)
   - Configure SAP (low cost, uses standard features)
   - Customize SAP (moderate-high cost, needs custom code)
   - Change business process (cultural change cost, eliminates gap need)

## Runtime Flow

1. **Requirements Review**
   - Start with requirements document from requirement gathering phase
   - Prioritize by business criticality

2. **SAP Functionality Research**
   - For each requirement, research SAP standard functionality
   - Document SAP transactions, tables, modules involved
   - Identify configuration options

3. **Gap Assessment**
   - Requirement fits SAP standard (no gap)
   - Requirement partially fits (partial gap)
   - Requirement not addressed by SAP (full gap)

4. **Gap Resolution Planning**
   - For each gap, document resolution option and trade-offs
   - Estimate effort and cost
   - Present to business for decision

5. **Documentation**
   - Create fit-gap matrix (requirement × SAP module)
   - Document gap resolutions
   - Present to business for sign-off

## Configuration

Fit-gap documentation includes:

1. **Fit-Gap Matrix**
   - Requirement | SAP Module | Fit Assessment | Gap Resolution | Cost | Timeline

2. **Gap Details**
   - Gap description: what's missing
   - Business impact: why this matters
   - Resolution options: customize/change process/adopt standard
   - Recommendation: which option is best

3. **Customization Summary**
   - Total customization needs identified
   - Effort and cost estimate
   - Schedule impact
   - Risk assessment

## Implementation Activities

1. **Requirement-to-SAP Mapping**
   - Systematically go through each requirement
   - Research SAP standard for that area
   - Document fit or gap

2. **Gap Analysis**
   - For each gap, understand the gap fully
   - Research resolution options
   - Estimate effort for each

3. **Business Decision**
   - Present gaps and options to business
   - Business decides: customize, change process, or accept limitation
   - Document decisions

4. **Customization Scoping**
   - For gaps that require customization, scope the work
   - Estimate effort and cost
   - Add to project plan

## Troubleshooting

### Issue 1: Too Many Gaps Discovered
**Symptoms:** Fit-gap analysis reveals 30+ gaps, customization scope huge, business shocked at cost

**Root Cause:** Requirements gathered without understanding SAP standard, or SAP standard genuinely doesn't match industry practices

**Resolution:** Prioritize gaps (must-have vs nice-to-have), accept some limitations, or reconsider SAP

---

### Issue 2: Business Doesn't Like SAP Standard Solution
**Symptoms:** "SAP does it this way, but we need to do it our way" insists on customization

**Root Cause:** Process change required, but business wants to preserve legacy process

**Resolution:** Quantify cost of customization, discuss long-term support burden, educate on SAP best practices

## Common Interview Questions

1. **What is fit-gap analysis and why does it matter?**
   Identifies where SAP standard meets business requirements (fit) and where customization is needed (gap). Prevents scope creep by making customization visible and justified.

2. **What are the main gap resolution options?**
   Adopt SAP standard (no cost), configure SAP (low cost), customize SAP (high cost), or change business process (organizational change).

3. **How do you prioritize gaps?**
   By business criticality: must-have gaps are addressed, nice-to-have gaps may be deferred.

4. **What's the difference between a fit and a gap?**
   Fit: SAP standard meets the requirement. Gap: SAP standard doesn't meet the requirement, decision needed.

5. **When should fit-gap analysis happen?**
   After requirements gathered, before design locked. Explore phase.

6. **What makes a good fit-gap analysis?**
   Clear documentation of each gap, realistic effort estimates, business decision documented for each gap.

7. **Can you always resolve gaps through customization?**
   Technically yes, but cost/complexity/risk increase significantly. Sometimes better to change process.

8. **How do fit-gap findings influence project cost and timeline?**
   Heavy customization increases both significantly. Light customization = shorter timeline.

## Tough Follow-up Questions

1. **What if business insists on customization for a gap that could be resolved through process change?**
   Quantify cost of customization (development, testing, ongoing support). Compare to cost of process change. Business makes informed decision.

2. **How do you estimate effort for a gap you've never implemented?**
   Research, consult with technical architect, look at similar implementations, build risk buffer.

3. **What if fit-gap analysis reveals SAP can't meet core business requirement?**
   Escalate. Either customize heavily, change process significantly, or reconsider SAP.

## SAP Transactions

- SPRO: Navigate to modules relevant to requirements
- Transaction-specific (varies by requirement area)

## SAP Tables

- Varies by requirement area

## Best Practices

- **Thorough requirements understanding:** Start with clear requirements
- **Comprehensive SAP research:** Understand standard capabilities before declaring gaps
- **Business involvement in decisions:** Let business decide gap resolution trade-offs
- **Clear documentation:** Fit-gap matrix makes decisions visible
- **Realistic effort estimates:** Include testing, documentation, support

## Common Mistakes

- **Incomplete fit-gap analysis:** Some gaps missed, discovered later during config
- **Underestimating customization effort:** Initial estimates too optimistic
- **Not involving business in decisions:** Customization decisions made without business input
- **Pursuing customization without trade-off discussion:** Business surprised by cost/timeline

## Interviewer's Hidden Expectations

- **Practical thinking:** Understand trade-offs (speed vs cost vs simplicity)
- **Business perspective:** Why does the business care about gap resolution?
- **Customization realism:** Know cost and risk of custom development

## What Makes This a 10/10 Answer

- Candidate explains fit-gap as comparing requirements to SAP standard
- Discusses gap resolution options with trade-offs
- Shares example: gap found, resolution decided, impact on project
- Understands prioritization (must-have vs nice-to-have gaps)
- Shows business acumen: cost vs speed vs quality trade-offs

## Red Flags

- Candidate doesn't understand fit-gap purpose
- No awareness of gap resolution trade-offs
- Assumes all gaps can/should be customized

## Keywords

- Fit-gap analysis
- Gap resolution
- Customization scope
- SAP standard functionality
- Process change
- Requirement mapping

## Related Topics

- [Requirements Gathering](./requirement-gathering.md)
- [Blueprinting](./blueprinting.md)
- [Risk Management](./risk-management.md)
