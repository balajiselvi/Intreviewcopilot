class QueryExpander {
  constructor(config = {}) {
    this.config = {
      maxExpansionsPerQuery: config.maxExpansionsPerQuery || 8,
      maxTokensPerExpansion: config.maxTokensPerExpansion || 150,
      enableCaching: config.enableCaching !== false,
      cacheTtlMs: config.cacheTtlMs || 3600000,
      minRelevanceScore: config.minRelevanceScore || 0.5,
      ...config
    };

    this.cache = new Map();
    this.patternRegistry = this._initializePatternRegistry();
    this.patternTriggers = this._buildPatternTriggers();
  }

  _initializePatternRegistry() {
    return {
      connector: {
        domain: 'SAP GRC Connectors',
        category: 'infrastructure',
        patterns: [
          'SAP GRC Connector RFC Repository Sync Connector Group',
          'Connector Repository Synchronization Provisioning',
          'SM59 RFC GRC Connector'
        ],
        keywords: ['connector', 'sm59', 'rfc', 'repository', 'sync', 'provisioning'],
        relevanceScore: 0.9,
        priority: 1
      },
      ruleset: {
        domain: 'SAP GRC Rulesets',
        category: 'governance',
        patterns: [
          'SAP GRC Ruleset Function Risk Action Permission',
          'ARA Ruleset SoD Risk',
          'Ruleset Risk Analysis'
        ],
        keywords: ['ruleset', 'rule', 'function', 'sod', 'segregation'],
        relevanceScore: 0.85,
        priority: 2
      },
      arm: {
        domain: 'SAP GRC ARM',
        category: 'governance',
        patterns: [
          'SAP GRC ARM Access Request Management MSMP BRF+ Provisioning'
        ],
        keywords: ['arm', 'access request', 'msmp', 'brf+', 'provisioning'],
        relevanceScore: 0.95,
        priority: 1
      },
      ara: {
        domain: 'SAP GRC ARA',
        category: 'governance',
        patterns: [
          'SAP GRC ARA Risk Analysis Function Risk Permission'
        ],
        keywords: ['ara', 'access risk', 'risk analysis', 'risk'],
        relevanceScore: 0.95,
        priority: 1
      },
      eam: {
        domain: 'SAP GRC EAM',
        category: 'governance',
        patterns: [
          'SAP GRC EAM Firefighter Log Controller Owner'
        ],
        keywords: ['eam', 'firefighter', 'emergency', 'access'],
        relevanceScore: 0.9,
        priority: 2
      },
      role: {
        domain: 'SAP Security Roles & Authorization',
        category: 'security',
        patterns: [
          'SAP Security PFCG Derived Role Composite Role SU24 SU25'
        ],
        keywords: ['role', 'authorization', 'pfcg', 'su24', 'su25', 'composite'],
        relevanceScore: 0.95,
        priority: 1
      },
      troubleshooting: {
        domain: 'SAP Troubleshooting Tools',
        category: 'operational',
        patterns: [
          'SU53 ST01 STAUTHTRACE SLG1 SM21 SM37'
        ],
        keywords: ['error', 'issue', 'troubleshoot', 'trace', 'log', 'st01', 'su53'],
        relevanceScore: 0.85,
        priority: 3
      },
      authentication: {
        domain: 'SAP Cloud Identity Authentication',
        category: 'security',
        patterns: [
          'SAP Cloud Identity Services IAS OIDC SAML Authentication',
          'Single Sign-On SSO SAML 2.0 OpenID Connect'
        ],
        keywords: ['authentication', 'saml', 'oidc', 'sso', 'ias', 'openid'],
        relevanceScore: 0.9,
        priority: 2
      },
      idm: {
        domain: 'SAP Identity & Access Management',
        category: 'security',
        patterns: [
          'SAP IDM User Provisioning Identity Sync Access Governance',
          'Identity Management Joiner Mover Leaver Provisioning'
        ],
        keywords: ['idm', 'identity', 'provisioning', 'joiner', 'mover', 'leaver'],
        relevanceScore: 0.9,
        priority: 2
      },
      fiori: {
        domain: 'SAP Fiori Security',
        category: 'security',
        patterns: [
          'SAP Fiori App Security Role Design Gateway Authorization'
        ],
        keywords: ['fiori', 'app', 'gateway', 'launchpad'],
        relevanceScore: 0.85,
        priority: 2
      },
      btp: {
        domain: 'SAP BTP Cloud Security',
        category: 'security',
        patterns: [
          'SAP BTP Cloud Security Identity Services Connectivity Data Protection'
        ],
        keywords: ['btp', 'cloud', 'security', 'connectivity', 'data protection'],
        relevanceScore: 0.9,
        priority: 2
      },
      s4hana: {
        domain: 'SAP S/4HANA Security',
        category: 'security',
        patterns: [
          'S/4HANA Security Authorization Audit Data Classification Compliance'
        ],
        keywords: ['s4hana', 's4', 'hana', 'security'],
        relevanceScore: 0.85,
        priority: 2
      },
      bw: {
        domain: 'SAP BW Security',
        category: 'security',
        patterns: [
          'SAP BW Business Warehouse Security Reporting Query Authorization'
        ],
        keywords: ['bw', 'warehouse', 'reporting', 'query'],
        relevanceScore: 0.85,
        priority: 3
      }
    };
  }

  _buildPatternTriggers() {
    const triggers = {};

    for (const [key, registry] of Object.entries(this.patternRegistry)) {
      for (const keyword of registry.keywords) {
        if (!triggers[keyword]) {
          triggers[keyword] = [];
        }
        triggers[keyword].push(key);
      }
    }

    return triggers;
  }

  expandQuery(question = '', analysis = {}) {
    if (!question || typeof question !== 'string') {
      return [question].filter(Boolean);
    }

    const cacheKey = this._generateCacheKey(question, analysis);

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTtlMs) {
        return cached.result;
      }
      this.cache.delete(cacheKey);
    }

    const expandedQueries = this._performExpansion(question, analysis);
    const deduplicatedQueries = this._deduplicate(expandedQueries);
    const scoredQueries = this._scoreAndFilter(deduplicatedQueries, question, analysis);
    const resultQueries = this._limitResults(scoredQueries);

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, {
        result: resultQueries,
        timestamp: Date.now()
      });
    }

    return resultQueries;
  }

  _performExpansion(question, analysis) {
    const queries = [question];
    const questionLower = question.toLowerCase();
    const matchedPatternKeys = new Set();

    const intentPatterns = this._getIntentPatterns(analysis);
    matchedPatternKeys.forEach(key => matchedPatternKeys.add(key));

    for (const [keyword, patternKeys] of Object.entries(this.patternTriggers)) {
      if (questionLower.includes(keyword)) {
        patternKeys.forEach(key => matchedPatternKeys.add(key));
      }
    }

    for (const patternKey of matchedPatternKeys) {
      const registry = this.patternRegistry[patternKey];
      if (registry) {
        queries.push(...registry.patterns);
      }
    }

    return queries;
  }

  _getIntentPatterns(analysis) {
    const patterns = [];

    if (analysis.intent === 'troubleshooting') {
      patterns.push('troubleshooting');
    }

    if (analysis.domain) {
      const domainMap = {
        'SAP GRC': ['arm', 'ara', 'eam', 'ruleset'],
        'SAP Security': ['role', 'authentication', 'idm'],
        'SAP Fiori': ['fiori'],
        'SAP BTP': ['btp'],
        'SAP S/4HANA': ['s4hana'],
        'SAP BW': ['bw']
      };

      for (const [domainKey, patternKeys] of Object.entries(domainMap)) {
        if (analysis.domain.includes(domainKey)) {
          patterns.push(...patternKeys);
        }
      }
    }

    if (analysis.implementationContext === true) {
      patterns.push('arm', 'eam', 'idm');
    }

    return patterns;
  }

  _deduplicate(queries) {
    return Array.from(new Set(queries));
  }

  _scoreAndFilter(queries, originalQuestion, analysis) {
    const scoredQueries = queries.map((query, index) => {
      let score = 1.0;

      if (index === 0) {
        score = 1.0;
      } else {
        const registry = Object.values(this.patternRegistry).find(r =>
          r.patterns.includes(query)
        );

        if (registry) {
          score = registry.relevanceScore;
          score += (registry.priority === 1 ? 0.1 : registry.priority === 2 ? 0.05 : 0);

          const keywordMatches = registry.keywords.filter(kw =>
            originalQuestion.toLowerCase().includes(kw)
          ).length;
          score += keywordMatches * 0.05;
        }
      }

      return {
        query,
        score: Math.min(1, score),
        isExpansion: index > 0
      };
    });

    return scoredQueries
      .filter(sq => sq.score >= this.config.minRelevanceScore)
      .sort((a, b) => {
        if (a.isExpansion === b.isExpansion) {
          return b.score - a.score;
        }
        return a.isExpansion ? 1 : -1;
      });
  }

  _limitResults(scoredQueries) {
    return scoredQueries
      .slice(0, this.config.maxExpansionsPerQuery)
      .map(sq => sq.query);
  }

  _generateCacheKey(question, analysis) {
    const questionHash = question.slice(0, 50).toLowerCase().replace(/\s+/g, '');
    const domainKey = analysis.domain ? analysis.domain.slice(0, 20) : 'default';
    const intentKey = analysis.intent ? analysis.intent.slice(0, 20) : 'none';

    return `${questionHash}_${domainKey}_${intentKey}`;
  }

  addPattern(key, registry) {
    if (!key || !registry || !registry.patterns || !registry.keywords) {
      throw new Error('Invalid pattern registry format');
    }

    this.patternRegistry[key] = {
      domain: registry.domain || key,
      category: registry.category || 'custom',
      patterns: registry.patterns,
      keywords: registry.keywords,
      relevanceScore: registry.relevanceScore || 0.7,
      priority: registry.priority || 5
    };

    this._rebuildTriggers();
  }

  removePattern(key) {
    if (this.patternRegistry[key]) {
      delete this.patternRegistry[key];
      this._rebuildTriggers();
    }
  }

  updatePattern(key, updates) {
    if (this.patternRegistry[key]) {
      this.patternRegistry[key] = {
        ...this.patternRegistry[key],
        ...updates
      };
      if (updates.keywords) {
        this._rebuildTriggers();
      }
    }
  }

  _rebuildTriggers() {
    this.patternTriggers = this._buildPatternTriggers();
    this.cache.clear();
  }

  getPatternRegistry() {
    return this.patternRegistry;
  }

  getPatternsByDomain(domain) {
    return Object.entries(this.patternRegistry)
      .filter(([_, registry]) => registry.domain === domain)
      .reduce((acc, [key, registry]) => {
        acc[key] = registry;
        return acc;
      }, {});
  }

  clearCache() {
    this.cache.clear();
  }

  getMetrics() {
    return {
      cacheSize: this.cache.size,
      registrySize: Object.keys(this.patternRegistry).length,
      triggerSize: Object.keys(this.patternTriggers).length
    };
  }
}

let _queryExpander = null;

function getQueryExpander(config = {}) {
  if (!_queryExpander) {
    _queryExpander = new QueryExpander(config);
  }
  return _queryExpander;
}

export function expandQuery(question = '', analysis = {}) {
  const expander = getQueryExpander();
  return expander.expandQuery(question, analysis);
}

export function createQueryExpander(config = {}) {
  return new QueryExpander(config);
}

export default QueryExpander;