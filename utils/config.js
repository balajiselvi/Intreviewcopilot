export const builtInModelGroups = [
  {
    name: "OpenAI Models",
    models: [
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo Preview" },
      { value: "gpt-4o-mini", label: "GPT-4o mini (recommended for live interview)" },
      { value: "gpt-4o", label: "GPT-4o (Omni)" },
    ]
  },
  {
    name: "Gemini Models",
    models: [
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
       { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash " }, 
       { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro " },
      { value: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash Preview (05-20)" },
      { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro Preview (05-06)" },
    ]
  }
];


export const TARGET_JOB_DESCRIPTION = `Head of Global SAP IT Security & Compliance — Principal SAP Security / IAM architect interview.

Landscape: S/4HANA, SuccessFactors, BW/4HANA, SAC, Datasphere, Ariba, CAR, BTP, hybrid/RISE.

Identity planes (do not collapse): SuccessFactors/HR = lifecycle attributes; IAS = authentication, federation, SSO, MFA, trust; IPS = provisioning, transformations, mappings, sync; IAG = Access Request, Access Analysis, Certification, PAM; target application = enforcement (PFCG, SF RBP, RSECADMIN, XSUAA role collections, Ariba groups).

Highest-value topics: SAP role/authorization design, IAG, IAS, IPS, JML, SoD, Access Analysis, role rationalization/remediation, governance, SAP/non-SAP IAM, RISE/hybrid shared responsibility, data quality on user/role extracts, stakeholder management, go-live/hypercare.

Answer as a Principal Architect: business objective → architectural decision → identity/security boundaries → mechanisms → governance → trade-offs → operational reality. Never invent employers, projects, tickets, countries, or metrics beyond CANDIDATE BACKGROUND.`;

const defaultConfig = {
  openaiKey: '',
  geminiKey: '',
  aiModel: 'gpt-4o-mini',
  silenceTimerDuration: 1.2, 
  responseLength: 'medium',
  gptSystemPrompt: `You are an AI interview assistant. Your role is to:
- Highlight key points in responses
- Suggest related technical concepts to explore
- Maintain professional tone`,
  azureToken: '',
  azureRegion: 'eastus',
  azureLanguage: 'en-US',
  customModels: [], // Array for user-added models { value: 'model-id', label: 'Display Name', type: 'openai' | 'gemini' }
  systemAutoMode: true,
  isManualMode: false,
  candidateResume: '', // Only content entered here may be phrased as personal experience in answers.
  jobDescription: TARGET_JOB_DESCRIPTION,
  company: '',
};

export function getConfig() {
  if (typeof window !== 'undefined') {
    const storedConfig = localStorage.getItem('interviewCopilotConfig');
    let parsed = storedConfig ? JSON.parse(storedConfig) : {};
    
    // Migrate old config format for aiModel if gptModel exists
    if (parsed.gptModel && !parsed.aiModel) {
      parsed.aiModel = parsed.gptModel;
      delete parsed.gptModel;
    }
    // Ensure customModels is an array
    if (!Array.isArray(parsed.customModels)) {
        parsed.customModels = [];
    }
    if (!parsed.jobDescription || !String(parsed.jobDescription).trim()) {
      parsed.jobDescription = TARGET_JOB_DESCRIPTION;
    }
    if (!parsed.aiModel || parsed.aiModel === "gpt-3.5-turbo") {
      parsed.aiModel = "gpt-4o-mini";
    }

    return { ...defaultConfig, ...parsed };
  }
  return defaultConfig;
}

export function setConfig(config) {
  if (typeof window !== 'undefined') {
    // Ensure customModels is an array before saving
    const configToSave = {
        ...config,
        customModels: Array.isArray(config.customModels) ? config.customModels : []
    };
    localStorage.setItem('interviewCopilotConfig', JSON.stringify(configToSave));
  }
}
