class InterviewerProfiler {
  constructor(config = {}) {
    this.config = config;
    this.conversationHistory = [];
    this.profileCache = new Map();
    this.profileSequence = [];

    // Every pattern below is wrapped in \b...\b -- without it these matched as bare substrings
    // (e.g. "provisioning" contains "vision", misrouting to executive; "team"/"farm"/"warm"
    // contain "eam"/"arm", misrouting to securityLead), live-confirmed via DEBUG_DUMP_PROMPT
    // injecting the wrong INTERVIEWER CONTEXT into unrelated questions. \b is a zero-width
    // assertion evaluated at the actual match boundary, so it works correctly per-alternative
    // even for the multi-word phrases (e.g. "risk management") mixed into the same group.
    this.interviewerCatalog = {
      architect: {
        roles: ['Enterprise Architect', 'Solution Architect', 'Tech Lead Architect'],
        patterns: /\b(architecture|landscape|integration|design|framework|blueprint|platform|scalability|microservices|cloud native)\b/i,
        weight: 1.0,
        technicalDepth: 0.95,
        architectureWeight: 0.9,
        implementationWeight: 0.4,
        interviewPhase: 'architecture',
        expectedAnswerDepth: 'deep',
        answerStyle: 'Architecture First',
        preferredFocus: [
          'Business Objective',
          'Architecture',
          'Integration',
          'Security',
          'Trade-offs',
          'Enterprise Scalability',
          'Future-proofing'
        ],
        avoidItems: [
          'Oversimplification',
          'Tactical-only thinking',
          'Single-solution advocacy'
        ],
        expectedFollowUps: [
          'Why this architecture?',
          'Alternative designs?',
          'Scalability approach?',
          'Trade-offs?',
          'Risk mitigation?'
        ]
      },
      securityLead: {
        roles: ['SAP Security Lead', 'GRC Lead', 'Security Architect'],
        patterns: /\b(authorization|role|pfcg|su24|su25|grc|ara|arm|eam|firefighter|risk management|access control)\b/i,
        weight: 0.95,
        technicalDepth: 0.9,
        architectureWeight: 0.5,
        implementationWeight: 0.9,
        interviewPhase: 'security-implementation',
        expectedAnswerDepth: 'detailed',
        answerStyle: 'Implementation First',
        preferredFocus: [
          'Business Requirement',
          'Security Design',
          'SAP Transactions',
          'Authorization Objects',
          'Governance Framework',
          'Compliance & Audit',
          'Implementation Steps'
        ],
        avoidItems: [
          'Generic security statements',
          'Theoretical frameworks only',
          'Missing SAP-specific details'
        ],
        expectedFollowUps: [
          'Implementation steps?',
          'Configuration details?',
          'Compliance considerations?',
          'Testing approach?',
          'Risk mitigation?'
        ]
      },
      supportLead: {
        roles: ['Production Support Manager', 'Support Lead', 'Operations Manager'],
        patterns: /\b(issue|error|troubleshoot|su53|st01|st22|dump|trace|problem|incident|outage|root cause)\b/i,
        weight: 0.85,
        technicalDepth: 0.85,
        architectureWeight: 0.3,
        implementationWeight: 0.7,
        interviewPhase: 'operational-support',
        expectedAnswerDepth: 'systematic',
        answerStyle: 'Evidence Driven',
        preferredFocus: [
          'Symptoms',
          'Evidence Collection',
          'Diagnosis Method',
          'Root Cause',
          'Resolution Strategy',
          'Prevention'
        ],
        avoidItems: [
          'Speculation',
          'Guessing',
          'Missing diagnostic steps'
        ],
        expectedFollowUps: [
          'How would you diagnose?',
          'Tools you\'d use?',
          'If that fails?',
          'Prevention strategy?'
        ]
      },
      deliveryManager: {
        roles: ['Program Manager', 'Delivery Manager', 'Project Manager'],
        patterns: /\b(project|stakeholder|delivery|team|deadline|budget|resource|governance|leadership|timeline|milestone)\b/i,
        weight: 0.8,
        technicalDepth: 0.6,
        architectureWeight: 0.4,
        implementationWeight: 0.7,
        interviewPhase: 'delivery-planning',
        expectedAnswerDepth: 'strategic-tactical',
        answerStyle: 'Business Outcome',
        preferredFocus: [
          'Situation Analysis',
          'Decision Rationale',
          'Execution Plan',
          'Stakeholder Management',
          'Outcome & Metrics',
          'Risk Management'
        ],
        avoidItems: [
          'Technical deep-dive only',
          'Ignoring people aspects',
          'Missing business context'
        ],
        expectedFollowUps: [
          'How would you lead this?',
          'Team approach?',
          'Risk mitigation?',
          'Stakeholder management?'
        ]
      },
      executive: {
        roles: ['CIO', 'Technology Director', 'VP Engineering', 'Chief Architect'],
        patterns: /\b(strategy|roadmap|future|vision|digital transformation|value|business case|competitive|market|innovation)\b/i,
        weight: 0.9,
        technicalDepth: 0.7,
        architectureWeight: 0.6,
        implementationWeight: 0.4,
        interviewPhase: 'strategic-vision',
        expectedAnswerDepth: 'executive-summary',
        answerStyle: 'Executive',
        preferredFocus: [
          'Business Value',
          'Strategic Alignment',
          'Risk Management',
          'Enterprise Architecture',
          'Governance & Compliance',
          'Competitive Advantage'
        ],
        avoidItems: [
          'Over-technical details',
          'Missing business impact',
          'Tactical only focus'
        ],
        expectedFollowUps: [
          'Business impact?',
          'Risk?',
          'ROI?',
          'Enterprise implications?'
        ]
      },
      auditor: {
        roles: ['Internal Auditor', 'External Auditor', 'Compliance Officer'],
        patterns: /\b(audit|sox|compliance|control|risk assessment|evidence|regulatory|governance controls)\b/i,
        weight: 0.85,
        technicalDepth: 0.7,
        architectureWeight: 0.4,
        implementationWeight: 0.6,
        interviewPhase: 'compliance-audit',
        expectedAnswerDepth: 'evidence-based',
        answerStyle: 'Control Based',
        preferredFocus: [
          'Control Design',
          'Risk Assessment',
          'Evidence & Trails',
          'Audit Procedures',
          'Compliance Framework',
          'Remediation'
        ],
        avoidItems: [
          'Unsubstantiated claims',
          'Missing evidence',
          'Weak controls'
        ],
        expectedFollowUps: [
          'Evidence of control?',
          'Testing approach?',
          'Deficiency remediation?',
          'Future controls?'
        ]
      }
    };

    this.candidatePersona = {
      experience: '10+ years SAP Security, GRC and IDM',
      speakingStyle: 'Speak as the implementation consultant who configured the solution.',
      narrative: 'Use first-person language such as "In my project", "I configured", "I implemented", "I integrated".',
      order: [
        'Business requirement',
        'Architecture/Design',
        'Configuration/Implementation',
        'Execution flow',
        'Production considerations',
        'Business outcome'
      ],
      avoidItems: [
        'Textbook definitions',
        'Generic introductions',
        'Marketing language',
        'Repeated governance statements',
        'Technical jargon without context'
      ]
    };

    this.globalAvoidItems = [
      'Textbook definitions',
      'Marketing language',
      'Generic compliance statements',
      'Repeating the question',
      'Irrelevant SAP modules'
    ];

    this.precompilePatterns();
  }

  precompilePatterns() {
    for (const key in this.interviewerCatalog) {
      const interviewer = this.interviewerCatalog[key];
      if (typeof interviewer.patterns === 'string') {
        interviewer.patterns = new RegExp(interviewer.patterns, 'i');
      }
    }
  }

  profileInterviewer(question = '', analysis = {}) {
    const questionLower = question.toLowerCase();
    const cacheKey = this._generateCacheKey(questionLower, analysis);

    if (this.profileCache.has(cacheKey)) {
      return this.profileCache.get(cacheKey);
    }

    const matched = this._matchInterviewerType(questionLower);
    const conversationContext = this._analyzeConversationContext();
    const profile = this._buildProfile(matched, conversationContext, analysis);

    this.profileCache.set(cacheKey, profile);
    this._recordInHistory(profile);

    return profile;
  }

  _matchInterviewerType(questionLower) {
    let bestMatch = null;
    let highestScore = 0;

    for (const key in this.interviewerCatalog) {
      const interviewer = this.interviewerCatalog[key];
      if (interviewer.patterns.test(questionLower)) {
        const score = interviewer.weight;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { key, interviewer };
        }
      }
    }

    return bestMatch || { key: 'architect', interviewer: this.interviewerCatalog.architect };
  }

  _analyzeConversationContext() {
    const depth = this.conversationHistory.length;
    const recentTypes = this.profileSequence.slice(-5);
    const typeFrequency = {};

    for (const type of recentTypes) {
      typeFrequency[type] = (typeFrequency[type] || 0) + 1;
    }

    const dominantType = Object.entries(typeFrequency).sort(([, a], [, b]) => b - a)[0]?.[0];
    const isRecurring = recentTypes.filter(t => t === dominantType).length > 1;
    const isDeepening = this._isConversationDeepening();
    const maturity = this._calculateConversationMaturity();
    const followUpProbability = this._calculateFollowUpProbability();

    return {
      depth,
      dominantType,
      isRecurring,
      isDeepening,
      maturity,
      followUpProbability,
      interviewPhase: this._determineInterviewPhase()
    };
  }

  _isConversationDeepening() {
    if (this.conversationHistory.length < 2) return false;

    const recent = this.conversationHistory.slice(-2);
    const prevDepth = recent[0].expectedAnswerDepth;
    const currDepth = recent[1].expectedAnswerDepth;

    const depthRanking = { 'executive-summary': 1, 'strategic-tactical': 2, 'systematic': 3, 'detailed': 4, 'deep': 5 };
    return depthRanking[currDepth] > depthRanking[prevDepth];
  }

  _calculateConversationMaturity() {
    if (this.conversationHistory.length === 0) return 'initial';
    if (this.conversationHistory.length < 3) return 'exploratory';
    if (this.conversationHistory.length < 7) return 'developing';
    return 'mature';
  }

  _calculateFollowUpProbability() {
    if (this.conversationHistory.length === 0) return 0;

    const recentQuestions = this.conversationHistory.slice(-5);
    const relatedCount = recentQuestions.filter(h => h.isRelatedToPreview !== false).length;

    return Math.min(1, 0.3 + (relatedCount / 5) * 0.7);
  }

  _determineInterviewPhase() {
    const depth = this.conversationHistory.length;

    if (depth === 0) return 'introduction';
    if (depth < 3) return 'discovery';
    if (depth < 7) return 'deepening';
    if (depth < 15) return 'advanced';
    return 'expert-level';
  }

  _buildProfile(matched, conversationContext, analysis) {
    const interviewer = matched.interviewer;
    const profileType = matched.key;

    const technicalDepthScore = this._calculateTechnicalDepth(interviewer, conversationContext);
    const architectureFocus = this._calculateArchitectureFocus(interviewer, conversationContext);
    const interviewConfidence = this._calculateInterviewConfidence(conversationContext);

    return {
      interviewer: interviewer.roles[0],
      interviewerType: profileType,
      interviewerRoles: interviewer.roles,
      expectation: `${interviewer.answerStyle} approach. Speak from real project implementation experience. Focus on: ${interviewer.preferredFocus.slice(0, 2).join(', ')}.`,
      answerStyle: `${interviewer.answerStyle}. Use first-person implementation language.`,
      technicalDepth: technicalDepthScore,
      technicalDepthScore: interviewer.technicalDepth,
      architectureWeight: architectureFocus,
      implementationWeight: interviewer.implementationWeight,
      interviewPhase: interviewer.interviewPhase,
      conversationPhase: conversationContext.interviewPhase,
      expectedAnswerDepth: interviewer.expectedAnswerDepth,
      preferredFocus: interviewer.preferredFocus,
      avoid: [...interviewer.avoidItems, ...this.globalAvoidItems],
      expectedFollowUps: interviewer.expectedFollowUps,
      candidatePersona: this.candidatePersona,
      profiling: {
        confidence: this._calculateProfilingConfidence(conversationContext),
        conversationDepth: conversationContext.depth,
        conversationMaturity: conversationContext.maturity,
        followUpProbability: conversationContext.followUpProbability,
        isDeepening: conversationContext.isDeepening,
        dominantTopic: conversationContext.dominantType
      },
      interviewConfidence: interviewConfidence
    };
  }

  _calculateTechnicalDepth(interviewer, conversationContext) {
    const baseDepth = interviewer.technicalDepth;
    const depthAdjustment = Math.min(conversationContext.depth * 0.05, 0.2);
    const adjustedDepth = baseDepth + depthAdjustment;

    if (adjustedDepth > 0.95) return 'Expert';
    if (adjustedDepth > 0.85) return 'Very High';
    if (adjustedDepth > 0.70) return 'High';
    if (adjustedDepth > 0.50) return 'Moderate';
    return 'Foundational';
  }

  _calculateArchitectureFocus(interviewer, conversationContext) {
    let weight = interviewer.architectureWeight;

    if (conversationContext.interviewPhase === 'strategic-vision') {
      weight += 0.1;
    } else if (conversationContext.interviewPhase === 'operational-support') {
      weight -= 0.1;
    }

    return Math.max(0.2, Math.min(1, weight));
  }

  _calculateProfilingConfidence(conversationContext) {
    if (conversationContext.depth === 0) return 0.5;
    if (conversationContext.depth < 2) return 0.65;
    if (conversationContext.depth < 5) return 0.80;
    return 0.95;
  }

  _calculateInterviewConfidence(conversationContext) {
    const maturityScores = { initial: 0.4, exploratory: 0.5, developing: 0.7, mature: 0.9 };
    const baseScore = maturityScores[conversationContext.maturity] || 0.5;
    const deepeningBonus = conversationContext.isDeepening ? 0.1 : 0;

    return Math.min(1, baseScore + deepeningBonus);
  }

  _generateCacheKey(questionLower, analysis) {
    const typeKey = Object.keys(this.interviewerCatalog).find(key =>
      this.interviewerCatalog[key].patterns.test(questionLower)
    ) || 'default';

    return `${typeKey}_${this.conversationHistory.length}`;
  }

  _recordInHistory(profile) {
    this.conversationHistory.push({
      timestamp: Date.now(),
      interviewerType: profile.interviewerType,
      technicalDepth: profile.technicalDepthScore,
      expectedAnswerDepth: profile.expectedAnswerDepth
    });

    this.profileSequence.push(profile.interviewerType);

    if (this.conversationHistory.length > 100) {
      this.conversationHistory.shift();
      this.profileSequence.shift();
    }
  }

  getConversationInsights() {
    return {
      totalExchanges: this.conversationHistory.length,
      conversationPhase: this._calculateConversationMaturity(),
      dominantInterviewerType: this._getDominantInterviewerType(),
      interviewerConsistency: this._calculateConsistency(),
      topicEvolution: this.profileSequence.slice(-10)
    };
  }

  _getDominantInterviewerType() {
    const typeCount = {};

    for (const type of this.profileSequence) {
      typeCount[type] = (typeCount[type] || 0) + 1;
    }

    return Object.entries(typeCount).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
  }

  _calculateConsistency() {
    if (this.profileSequence.length < 2) return 0;

    const recentTypes = this.profileSequence.slice(-10);
    const dominant = this._getDominantInterviewerType();
    const consistency = recentTypes.filter(t => t === dominant).length / recentTypes.length;

    return parseFloat(consistency.toFixed(2));
  }

  clearHistory() {
    this.conversationHistory = [];
    this.profileSequence = [];
    this.profileCache.clear();
  }
}

export function profileInterviewer(question = '', analysis = {}) {
  if (!global._interviewerProfiler) {
    global._interviewerProfiler = new InterviewerProfiler();
  }
  return global._interviewerProfiler.profileInterviewer(question, analysis);
}