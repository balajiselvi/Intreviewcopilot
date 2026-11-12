/**
 * Runtime-owned candidate experience surface.
 * Production code should import from here rather than directly from eval/.
 * Source of truth for programme facts currently lives in eval/lib/careerTimeline.js
 * (shared with offline batteries). Experience eligibility is enforced separately in
 * lib/experienceEligibility.js before prompt construction.
 */
module.exports = require("../eval/lib/careerTimeline.js");
