export function reviewAnswer(question, answer, analysis = {}) {

  const text = (answer || "").toLowerCase();

  const review = {
    score: 10,
    issues: [],
    regenerate: false
  };

  // -----------------------------
  // Length
  // -----------------------------

  const words = answer.trim().split(/\s+/).length;

  if (words < 55) {

    review.score -= 1;
    review.issues.push("Answer is too short.");

  }

  if (words > 170) {

    review.score -= 1;
    review.issues.push("Answer is too long for live interview.");

  }

  // -----------------------------
  // Business Objective
  // -----------------------------

  if (
    !text.includes("business") &&
    !text.includes("objective") &&
    !text.includes("requirement")
  ) {

    review.score -= 1;
    review.issues.push("Business objective missing.");

  }

  // -----------------------------
  // Technical Depth
  // -----------------------------

  const technicalKeywords = [

    "pfcg",
    "su24",
    "ara",
    "arm",
    "eam",
    "msmp",
    "brf",
    "ias",
    "ips",
    "iag",
    "cloud connector",
    "snc",
    "sm59",
    "firefighter",
    "role",
    "authorization"

  ];

  let keywordHits = 0;

  technicalKeywords.forEach(keyword => {

    if (text.includes(keyword))
      keywordHits++;

  });

  if (keywordHits < 2) {

    review.score -= 2;
    review.issues.push("Technical depth is weak.");

  }

  // -----------------------------
  // Generic Phrases
  // -----------------------------

  const generic = [

    "this improves compliance",

    "best practice",

    "proper governance",

    "proper security",

    "overall security"

  ];

  generic.forEach(item => {

    if (text.includes(item)) {

      review.score -= 0.5;
      review.issues.push("Contains generic statement.");

    }

  });

  // -----------------------------
  // Architect Thinking
  // -----------------------------

  if (
    !text.includes("implementation") &&
    !text.includes("enterprise") &&
    !text.includes("architecture")
  ) {

    review.score -= 1;
    review.issues.push("Architect-level implementation insight missing.");

  }

  // -----------------------------
  // Hallucination Indicators
  // -----------------------------

  if (
    text.includes("my project") ||
    text.includes("our customer") ||
    text.includes("when i implemented")
  ) {

    review.score -= 2;
    review.issues.push("Potential fabricated experience.");

  }

  // -----------------------------
  // Regeneration Threshold
  // -----------------------------

  if (review.score < 9) {

    review.regenerate = true;

  }

  return review;

}