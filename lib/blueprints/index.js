const conceptBlueprint = require("./concept");
const architectureBlueprint = require("./architecture");
const troubleshootingBlueprint = require("./troubleshooting");
const migrationBlueprint = require("./migration");
const scenarioBlueprint = require("./scenario");
const comparisonBlueprint = require("./comparison");
const leadershipBlueprint = require("./leadership");

function getBlueprint(question, analysis = {}) {

    switch ((analysis.intent || "").toLowerCase()) {

        case "architecture":
            return architectureBlueprint.getBlueprint(question, analysis);

        case "troubleshooting":
            return troubleshootingBlueprint.getBlueprint(question, analysis);

        case "migration":
            return migrationBlueprint.getBlueprint(question, analysis);

        case "scenario":
            return scenarioBlueprint.getBlueprint(question, analysis);

        case "comparison":
            return comparisonBlueprint.getBlueprint(question, analysis);

        case "leadership":
            return leadershipBlueprint.getBlueprint(question, analysis);

        default:
            return conceptBlueprint.getBlueprint(question, analysis);
    }
}

module.exports = {
    getBlueprint
};