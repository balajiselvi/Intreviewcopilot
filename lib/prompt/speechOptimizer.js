class AnswerStyleEngine {
  constructor(config = {}) {
    this.config = config;
    this.conversationHistory = [];
    this.styleCache = new Map();

    this.audienceLevels = {
      seniorConsultant: {
        name: 'Senior Consultant',
        priority: 1,
        expectedDuration: { min: 45, max: 90 },
        sophistication: 0.65,
        practicalFocus: 0.8,
        theoryFocus: 0.3,
        technicalDepth: 0.75,
        experientialWeight: 0.7,
        businessContextWeight: 0.5,
        communicationStyle: 'collaborative',
        tonalityMarkers: ['experienced', 'practical', 'solutions-oriented'],
        assumedKnowledge: 'intermediate-advanced'
      },
      lead: {
        name: 'Lead',
        priority: 2,
        expectedDuration: { min: 60, max: 120 },
        sophistication: 0.8,
        practicalFocus: 0.7,
        theoryFocus: 0.4,
        technicalDepth: 0.85,
        experientialWeight: 0.65,
        businessContextWeight: 0.6,
        communicationStyle: 'directive-collaborative',
        tonalityMarkers: ['authoritative', 'strategic', 'forward-thinking'],
        assumedKnowledge: 'advanced'
      },
      architect: {
        name: 'Architect',
        priority: 3,
        expectedDuration: { min: 60, max: 120 },
        sophistication: 1.0,
        practicalFocus: 0.6,
        theoryFocus: 0.6,
        technicalDepth: 1.0,
        experientialWeight: 0.5,
        businessContextWeight: 0.8,
        communicationStyle: 'strategic',
        tonalityMarkers: ['visionary', 'comprehensive', 'enterprise-focused'],
        assumedKnowledge: 'expert'
      }
    };

    this.questionTypeStyles = {
      fundamental: {
        name: 'Fundamental Question',
        expectedDuration: { min: 30, max: 60 },
        structureTemplate: ['definition', 'why_it_matters', 'key_point'],
        emphasizeFirstPrinciples: true,
        includeRealWorldContext: true,
        complexity: 0.3,
        assumedContext: 'minimal'
      },
      scenario: {
        name: 'Scenario Question',
        expectedDuration: { min: 60, max: 120 },
        structureTemplate: ['situation_assessment', 'problem_identification', 'solution_approach', 'expected_outcome'],
        emphasizeDecisionMaking: true,
        includeTradeoffs: true,
        complexity: 0.7,
        assumedContext: 'specific'
      },
      architecture: {
        name: 'Architecture Question',
        expectedDuration: { min: 60, max: 120 },
        structureTemplate: ['design_principles', 'component_overview', 'integration_points', 'scalability_considerations', 'security_implications'],
        emphasizeSystemDesign: true,
        includeTradeoffs: true,
        includeAlternatives: true,
        complexity: 0.9,
        assumedContext: 'enterprise'
      },
      troubleshooting: {
        name: 'Troubleshooting Question',
        expectedDuration: { min: 60, max: 120 },
        structureTemplate: ['diagnosis_approach', 'common_causes', 'investigation_steps', 'resolution_strategy'],
        emphasizeSystematicApproach: true,
        includeDiagnosticTools: true,
        complexity: 0.8,
        assumedContext: 'operational'
      },
      implementation: {
        name: 'Implementation Question',
        expectedDuration: { min: 75, max: 150 },
        structureTemplate: ['planning', 'phasing', 'key_milestones', 'risk_mitigation', 'validation'],
        emphasizeProcess: true,
        includeTimelines: true,
        includeResourceConsiderations: true,
        complexity: 0.75,
        assumedContext: 'project'
      },
      comparison: {
        name: 'Comparison Question',
        expectedDuration: { min: 60, max: 120 },
        structureTemplate: ['option_overview', 'strengths_weaknesses', 'use_case_mapping', 'recommendation'],
        emphasizeAnalysis: true,
        includeTradeoffs: true,
        includeContextDependency: true,
        complexity: 0.7,
        assumedContext: 'evaluative'
      },
      followUp: {
        name: 'Follow-Up Question',
        expectedDuration: { min: 30, max: 90 },
        structureTemplate: ['connection_to_previous', 'deeper_exploration', 'related_concepts'],
        emphasizeContinuity: true,
        buildOnContext: true,
        complexity: 'variable',
        assumedContext: 'conversational'
      }
    };

    this.tonePatterns = {
      seniorConsultant: {
        opening: 'Based on my experience,',
        transition: 'What I\'ve found in practice is',
        emphasis: 'This is critical because',
        closing: 'That\'s the pattern I\'ve seen work',
        confidence: 'moderate-high'
      },
      lead: {
        opening: 'Here\'s how I approach this',
        transition: 'The key distinction is',
        emphasis: 'This is non-negotiable because',
        closing: 'That\'s the strategic direction I\'d take',
        confidence: 'high'
      },
      architect: {
        opening: 'From an enterprise perspective,',
        transition: 'The architectural principle here is',
        emphasis: 'This aligns with our foundational requirements',
        closing: 'That\'s the architectural pattern',
        confidence: 'expert'
      }
    };

    this.communicationPrinciples = {
      active: {
        pattern: 'present_tense',
        voicePreference: 'active',
        agencyEmphasis: true,
        decisiveness: 0.8
      },
      supportingEvidence: {
        citePracticalExamples: true,
        includeMetrics: true,
        nameSpecificTools: true,
        referenceLessonsLearned: true
      },
      clarity: {
        avoidJargonWithoutContext: true,
        defineNewConcepts: true,
        useComparisons: true,
        structureLogically: true
      },
      engagement: {
        inviteQuestions: true,
        acknowledgeComplexity: true,
        addressCommonMisconceptions: true,
        showThinkingProcess: true
      }
    };
  }

  determineStyle(context) {
    const {
      audienceLevel = 'architect',
      questionType = 'fundamental',
      conversationDepth = 0,
      previousAnswerQuality = 0.7,
      interviewPhase = 'initial'
    } = context;

    const cacheKey = `${audienceLevel}_${questionType}_${conversationDepth}`;
    if (this.styleCache.has(cacheKey)) {
      return this.styleCache.get(cacheKey);
    }

    const audienceStyle = this.audienceLevels[audienceLevel] || this.audienceLevels.architect;
    const questionStyle = this.questionTypeStyles[questionType] || this.questionTypeStyles.fundamental;
    const toneGuide = this.tonePatterns[audienceLevel] || this.tonePatterns.architect;

    const style = {
      audience: audienceStyle,
      questionType: questionStyle,
      tone: toneGuide,
      duration: this._calculateDuration(audienceStyle, questionStyle, conversationDepth),
      verbosity: this._calculateVerbosity(audienceLevel, questionType, conversationDepth),
      structure: this._buildStructure(questionStyle, audienceStyle, conversationDepth),
      communicationModes: this._selectCommunicationModes(audienceLevel, questionType),
      confidenceLevel: this._calibrateConfidence(previousAnswerQuality),
      interviewPhase,
      styleGuidelines: this._compileStyleGuidelines(audienceLevel, questionType),
      tokenBudget: this._calculateTokenBudget(audienceStyle, questionStyle)
    };

    this.styleCache.set(cacheKey, style);
    return style;
  }

  _calculateDuration(audienceStyle, questionStyle, conversationDepth) {
    const baseDuration = {
      min: Math.max(audienceStyle.expectedDuration.min, questionStyle.expectedDuration.min),
      max: Math.max(audienceStyle.expectedDuration.max, questionStyle.expectedDuration.max)
    };

    const adjustedMin = baseDuration.min + (conversationDepth * 10);
    const adjustedMax = baseDuration.max + (conversationDepth * 15);

    return {
      expectedSeconds: Math.floor((adjustedMin + adjustedMax) / 2),
      minSeconds: adjustedMin,
      maxSeconds: adjustedMax,
      recommendedPacing: this._calculatePacing(adjustedMin, adjustedMax)
    };
  }

  _calculatePacing(min, max) {
    const midpoint = (min + max) / 2;
    if (midpoint < 60) return 'brisk';
    if (midpoint < 120) return 'measured';
    return 'deliberate';
  }

  _calculateVerbosity(audienceLevel, questionType, conversationDepth) {
    const baseVerbosity = {
      seniorConsultant: 0.6,
      lead: 0.65,
      architect: 0.55
    }[audienceLevel] || 0.65;

    const typeAdjustment = {
      fundamental: -0.15,
      scenario: 0,
      architecture: 0.15,
      troubleshooting: -0.05,
      implementation: 0.1,
      comparison: 0.05,
      followUp: -0.2
    }[questionType] || 0;

    const depthAdjustment = Math.min(conversationDepth * 0.05, 0.15);
    const verbosity = Math.max(0.4, Math.min(0.95, baseVerbosity + typeAdjustment + depthAdjustment));

    return {
      level: verbosity,
      descriptor: this._getVerbosityDescriptor(verbosity),
      includeContextSetting: verbosity > 0.5,
      includeDetailedExamples: verbosity > 0.65,
      includeAlternativePerspectives: verbosity > 0.75,
      includeHistoricalContext: verbosity > 0.8
    };
  }

  _getVerbosityDescriptor(level) {
    if (level < 0.45) return 'concise';
    if (level < 0.6) return 'direct';
    if (level < 0.75) return 'comprehensive';
    return 'elaborate';
  }

  _buildStructure(questionStyle, audienceStyle, conversationDepth) {
    const template = questionStyle.structureTemplate || [];
    const structure = [];

    structure.push({
      phase: 'opening',
      guidance: 'Signal understanding and provide immediate value',
      expectedDuration: 5
    });

    for (const part of template) {
      structure.push({
        phase: this._phaseFromTemplate(part),
        guidance: this._guidanceForPhase(part, audienceStyle),
        expectedDuration: this._durationForPhase(part)
      });
    }

    if (conversationDepth > 0) {
      structure.push({
        phase: 'connection',
        guidance: 'Explicitly connect to previous exchange',
        expectedDuration: 3
      });
    }

    structure.push({
      phase: 'closing',
      guidance: 'Summarize key point and invite follow-up',
      expectedDuration: 5
    });

    return structure;
  }

  _phaseFromTemplate(templatePart) {
    const phaseMap = {
      definition: 'Definition & Context',
      why_it_matters: 'Business Relevance',
      key_point: 'Key Takeaway',
      situation_assessment: 'Situation Assessment',
      problem_identification: 'Problem Identification',
      solution_approach: 'Solution Approach',
      expected_outcome: 'Expected Outcome',
      design_principles: 'Design Principles',
      component_overview: 'Component Overview',
      integration_points: 'Integration Points',
      scalability_considerations: 'Scalability & Performance',
      security_implications: 'Security & Compliance',
      diagnosis_approach: 'Diagnostic Approach',
      common_causes: 'Common Root Causes',
      investigation_steps: 'Investigation Steps',
      resolution_strategy: 'Resolution Strategy',
      planning: 'Planning Phase',
      phasing: 'Implementation Phasing',
      key_milestones: 'Key Milestones',
      risk_mitigation: 'Risk Mitigation',
      validation: 'Validation & Testing',
      option_overview: 'Options Overview',
      strengths_weaknesses: 'Comparative Analysis',
      use_case_mapping: 'Use Case Mapping',
      recommendation: 'Recommendation'
    };
    return phaseMap[templatePart] || templatePart;
  }

  _guidanceForPhase(phase, audienceStyle) {
    const baseGuidance = {
      definition: 'Provide clear, concise definition grounded in practice',
      why_it_matters: 'Emphasize business impact and relevance',
      key_point: 'State the central insight clearly',
      situation_assessment: 'Analyze constraints and context quickly',
      problem_identification: 'Identify root cause systematically',
      solution_approach: 'Present solution with reasoning',
      expected_outcome: 'Paint clear picture of success',
      design_principles: 'Articulate foundational principles',
      component_overview: 'Describe architecture at appropriate level',
      integration_points: 'Explain how components interact',
      scalability_considerations: 'Address growth and performance',
      security_implications: 'Highlight security and compliance aspects',
      diagnosis_approach: 'Outline systematic investigation method',
      common_causes: 'List likely root causes with frequency',
      investigation_steps: 'Detail troubleshooting sequence',
      resolution_strategy: 'Explain fix and validation approach',
      planning: 'Describe upfront planning activities',
      phasing: 'Break implementation into phases',
      key_milestones: 'Highlight critical delivery points',
      risk_mitigation: 'Address potential obstacles',
      validation: 'Describe quality assurance approach',
      option_overview: 'Present options fairly',
      strengths_weaknesses: 'Compare objectively on key dimensions',
      use_case_mapping: 'Match options to scenarios',
      recommendation: 'Provide clear recommendation with reasoning'
    };

    const guidance = baseGuidance[phase] || 'Provide clear, relevant information';

    if (audienceStyle.sophistication > 0.8) {
      return guidance + ' (assume foundational knowledge)';
    } else if (audienceStyle.sophistication > 0.6) {
      return guidance + ' (bridge theory and practice)';
    }
    return guidance;
  }

  _durationForPhase(phase) {
    const durationMap = {
      definition: 10,
      why_it_matters: 8,
      key_point: 5,
      situation_assessment: 15,
      problem_identification: 15,
      solution_approach: 20,
      expected_outcome: 10,
      design_principles: 20,
      component_overview: 25,
      integration_points: 20,
      scalability_considerations: 20,
      security_implications: 15,
      diagnosis_approach: 15,
      common_causes: 15,
      investigation_steps: 20,
      resolution_strategy: 20,
      planning: 15,
      phasing: 20,
      key_milestones: 10,
      risk_mitigation: 15,
      validation: 15,
      option_overview: 15,
      strengths_weaknesses: 25,
      use_case_mapping: 15,
      recommendation: 10
    };
    return durationMap[phase] || 15;
  }

  _selectCommunicationModes(audienceLevel, questionType) {
    return {
      narrative: true,
      analogy: audienceLevel !== 'architect',
      example: true,
      dataPoint: audienceLevel === 'lead' || audienceLevel === 'architect',
      visualization: false,
      stepByStep: questionType === 'troubleshooting' || questionType === 'implementation',
      comparison: questionType === 'comparison',
      scenario: questionType === 'scenario'
    };
  }

  _calibrateConfidence(previousAnswerQuality) {
    if (previousAnswerQuality > 0.85) {
      return {
        level: 'expert',
        posture: 'authoritative',
        hedgingLanguage: 'minimal',
        provisionalStatements: false
      };
    }
    if (previousAnswerQuality > 0.7) {
      return {
        level: 'strong',
        posture: 'confident-curious',
        hedgingLanguage: 'minimal',
        provisionalStatements: false
      };
    }
    return {
      level: 'cautious',
      posture: 'collaborative-exploratory',
      hedgingLanguage: 'moderate',
      provisionalStatements: true
    };
  }

  _compileStyleGuidelines(audienceLevel, questionType) {
    const baseGuidelines = {
      noMarkdown: true,
      noExcessiveFormatting: true,
      conversationalTone: true,
      activateExperience: true,
      showDecisionMaking: true,
      acknowledgeComplexity: true,
      avoidOverSimplification: true,
      useSpecificTerminology: true,
      preserveSAPAccuracy: true
    };

    if (audienceLevel === 'architect') {
      baseGuidelines.addressEnterpriseScale = true;
      baseGuidelines.emphasizeTradeoffs = true;
      baseGuidelines.discussLongTermImplications = true;
    } else if (audienceLevel === 'lead') {
      baseGuidelines.emphasizeLeadership = true;
      baseGuidelines.focusOnDecisions = true;
      baseGuidelines.addressTeamDynamics = true;
    } else {
      baseGuidelines.focusOnPractical = true;
      baseGuidelines.shareImplementationInsights = true;
      baseGuidelines.addressTacticalConcerns = true;
    }

    if (questionType === 'scenario' || questionType === 'troubleshooting') {
      baseGuidelines.structureSystematically = true;
      baseGuidelines.showThinkingProcess = true;
    }

    return baseGuidelines;
  }

  _calculateTokenBudget(audienceStyle, questionStyle) {
    const baseBudget = 2048;
    const sophisticationMultiplier = 1 + (audienceStyle.sophistication * 0.5);
    const durationMultiplier = (audienceStyle.expectedDuration.max) / 90;

    return {
      suggested: Math.floor(baseBudget * sophisticationMultiplier * durationMultiplier),
      minimum: Math.floor(baseBudget * 0.6),
      maximum: Math.floor(baseBudget * 2),
      reserve: Math.floor(baseBudget * 0.2)
    };
  }

  formatResponseGuidance(style) {
    return {
      targetDuration: `${style.duration.minSeconds}–${style.duration.maxSeconds} seconds`,
      targetPacing: style.duration.recommendedPacing,
      verbosityLevel: `${style.verbosity.descriptor} (${(style.verbosity.level * 100).toFixed(0)}%)`,
      structuralPhases: style.structure.map(s => s.phase),
      toneOpening: style.tone.opening,
      toneClosing: style.tone.closing,
      confidencePosture: style.confidenceLevel.posture,
      tokenBudget: `${style.tokenBudget.suggested} tokens (min: ${style.tokenBudget.minimum}, max: ${style.tokenBudget.maximum})`
    };
  }
}

const CATEGORY_TO_QUESTION_TYPE = {
  Architecture: 'architecture',
  Security: 'architecture',
  Authorization: 'architecture',
  'Role Design': 'architecture',
  Implementation: 'implementation',
  Configuration: 'implementation',
  Migration: 'implementation',
  Upgrade: 'implementation',
  Troubleshooting: 'troubleshooting',
  'Production Support': 'troubleshooting',
  Performance: 'troubleshooting',
  Scenario: 'scenario',
  Workflow: 'scenario',
  Comparison: 'comparison',
  Definition: 'fundamental',
  General: 'fundamental'
};

function mapCategoryToQuestionType(category, isFollowUp) {
  if (isFollowUp) return 'followUp';
  return CATEGORY_TO_QUESTION_TYPE[category] || 'fundamental';
}

// Module-level singleton, same pattern as lib/interviewerProfiler.js's global._interviewerProfiler —
// keeps the style cache warm across requests without re-instantiating the engine every call.
export function buildAnswerStyle(question = '', analysis = {}) {
  if (!global._answerStyleEngine) {
    global._answerStyleEngine = new AnswerStyleEngine();
  }
  const questionType = mapCategoryToQuestionType(analysis.category, analysis.isFollowUp);
  const style = global._answerStyleEngine.determineStyle({ questionType, audienceLevel: 'architect' });
  const guidance = global._answerStyleEngine.formatResponseGuidance(style);

  // toneOpening/toneClosing (guidance.toneOpening/toneClosing) are deliberately NOT included
  // here -- tonePatterns' literal strings ("From an enterprise perspective,", "That's the
  // architectural pattern") are exactly two of the phrases interviewPrompt.js's RULES section
  // bans outright, so surfacing them here had every request opening this section by directly
  // contradicting the banned-phrase rule stated a few hundred characters later in the same
  // prompt. MANDATORY STRUCTURE already owns anchor-sentence guidance without that conflict.
  return `Target ${guidance.targetDuration} (${guidance.targetPacing} pacing), ${guidance.verbosityLevel} verbosity. ` +
    `Confidence posture: ${guidance.confidencePosture}.`;
}
