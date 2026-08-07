const fs = require("fs");
const path = require("path");
const { parseJudgmentRecord, parseEngineeringPrinciple } = require("./schema");

// Version 1 storage. Per docs/EXPERIENCE_ACQUISITION_ENGINE_DESIGN.md section 8.1: no new
// database infrastructure -- follows the exact pattern data/knowledgeIndex.json already uses
// (flat JSON array, loaded fully into memory, read/written with fs). Two files, not one,
// because Judgment Records are directly-captured input and Engineering Principles are mined
// output -- keeping them separate keeps the (not-yet-built) mining job's read/write boundary
// clean, per section 8.1.

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const RECORDS_PATH = path.join(DATA_DIR, "engineeringMemory.json");
const PRINCIPLES_PATH = path.join(DATA_DIR, "engineeringPrinciples.json");

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} does not contain a JSON array`);
  }
  return parsed;
}

function writeJsonArray(filePath, items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
}

// --- Judgment Records ---

function loadJudgmentRecords() {
  return readJsonArray(RECORDS_PATH).map(parseJudgmentRecord);
}

function saveJudgmentRecords(records) {
  const validated = records.map(parseJudgmentRecord);
  writeJsonArray(RECORDS_PATH, validated);
  return validated;
}

// Validates and appends one record, rejecting a duplicate id outright rather than silently
// overwriting -- a silent overwrite on an id collision would be exactly the kind of quiet data
// loss this whole platform exists to avoid for the candidate's real experience.
function addJudgmentRecord(record) {
  const validated = parseJudgmentRecord(record);
  const existing = loadJudgmentRecords();
  if (existing.some(r => r.id === validated.id)) {
    throw new Error(`Judgment Record with id "${validated.id}" already exists`);
  }
  existing.push(validated);
  saveJudgmentRecords(existing);
  return validated;
}

// --- Engineering Principles ---

function loadEngineeringPrinciples() {
  return readJsonArray(PRINCIPLES_PATH).map(parseEngineeringPrinciple);
}

function saveEngineeringPrinciples(principles) {
  const validated = principles.map(parseEngineeringPrinciple);
  writeJsonArray(PRINCIPLES_PATH, validated);
  return validated;
}

function addEngineeringPrinciple(principle) {
  const validated = parseEngineeringPrinciple(principle);
  const existing = loadEngineeringPrinciples();
  if (existing.some(p => p.id === validated.id)) {
    throw new Error(`Engineering Principle with id "${validated.id}" already exists`);
  }
  existing.push(validated);
  saveEngineeringPrinciples(existing);
  return validated;
}

module.exports = {
  RECORDS_PATH,
  PRINCIPLES_PATH,
  loadJudgmentRecords,
  saveJudgmentRecords,
  addJudgmentRecord,
  loadEngineeringPrinciples,
  saveEngineeringPrinciples,
  addEngineeringPrinciple
};
