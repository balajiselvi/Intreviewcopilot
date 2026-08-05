# Production Readiness Checklist

## Development Mode vs. Production Mode

The app already auto-detects this — `config/appConfig.js`'s `environment.isDevelopment`/`isProduction` derive from `NODE_ENV`, which Next.js sets automatically (`development` under `next dev`, `production` under `next build && next start`). No manual toggle needed; nothing in this document requires setting `NODE_ENV` yourself.

## Execution Modes

Interview Copilot supports three explicit execution modes, controlled by the `LLM_VALIDATION_MODE` environment variable (read from `config/appConfig.js`, used in `pages/api/chat.js`):

| Mode | Environment Variable | Behavior | API Key Required | Use Case | Default |
|---|---|---|---|---|---|
| **Production** | `LLM_VALIDATION_MODE=full` (or unset) | Runs full pipeline: question analysis → knowledge retrieval → prompt construction → **LLM streaming** → answer evaluation. Returns streamed interview answer. | Yes (client-supplied or `OPENAI_API_KEY`/`GEMINI_API_KEY`) | Live interviews, real generation | **YES** |
| **Retrieval Validation** | `LLM_VALIDATION_MODE=retrieval-only` | Runs pipeline up through prompt construction, returns diagnostic SSE event showing what would have been sent to LLM (model, token ceiling, category, retrieved-context preview). No LLM call made. | No | Validating retrieval quality without API cost | No |
| **Disabled** | `LLM_VALIDATION_MODE=disabled` | Application explicitly disabled. Returns message that system is unavailable. | No | Maintenance or emergency shutdown | No |

### Default Behavior (Production-Safe)

When `LLM_VALIDATION_MODE` is **not set**, the application defaults to **production mode** (`full`). This is the safe default: if an API key is provided, the application will stream real LLM responses. If no API key is provided, production mode will return a clear error asking for one.

### Configuring Modes

Set via environment variable:
```bash
# Production mode (default if unset)
export LLM_VALIDATION_MODE=full

# Retrieval validation mode (diagnostic, no API cost)
export LLM_VALIDATION_MODE=retrieval-only

# Disabled mode (maintenance)
export LLM_VALIDATION_MODE=disabled
```

Or via `.env.local` (git-ignored):
```
LLM_VALIDATION_MODE=retrieval-only
```

### Important Design Decisions

1. **Production is the default.** Do not silently fall back to retrieval-only mode when configuration is missing. If the user didn't explicitly ask for diagnostic mode, they expect production mode with LLM generation.

2. **Retrieval-only must be explicit.** Developers who want to validate retrieval without API costs must explicitly set `LLM_VALIDATION_MODE=retrieval-only`. This prevents accidental "it's working, but there's no answer" scenarios.

3. **API key requirement depends on mode.** Production mode requires an API key and returns a clear error if missing. Retrieval-only mode does not require a key.

## Configuring the LLM provider

Three env vars, all optional, read once in `config/appConfig.js`:

```bash
LLM_PROVIDER=openai        # label only — see note below
OPENAI_MODEL=gpt-4o-mini   # fallback default when a request doesn't specify a model
OPENAI_API_KEY=            # server-side fallback key
GEMINI_API_KEY=            # server-side fallback key
```

**Provider routing is still determined by the model string itself**, not by `LLM_PROVIDER` — `pages/api/chat.js`'s `isGeminiModel()` routes to Gemini when the model name starts with `"gemini"`, otherwise OpenAI. `LLM_PROVIDER` just labels the intended default; it doesn't force routing. This wasn't changed, to avoid adding a provider-abstraction layer the app doesn't otherwise need.

**Key priority:** a client-supplied key (entered in the Settings dialog, sent per-request) always wins over the env var. The app's primary design is bring-your-own-key — `OPENAI_API_KEY`/`GEMINI_API_KEY` exist only for deployments that want a shared server-side key instead (e.g. a single-tenant internal tool). Leaving them unset preserves pure BYOK behavior exactly as it worked before this change.

**Model identifier note:** the OpenAI SDK (confirmed installed: `openai@4.104.0`, matching `package.json`) does not validate model names client-side — whatever string you set in `OPENAI_MODEL` or select in Settings is sent straight to OpenAI's API, which is the only real authority on whether that model ID is currently live on your account. This codebase cannot confirm any specific model name (including hypothetical or newer ones) actually exists — verify against your OpenAI dashboard or the API's model-list endpoint before setting `OPENAI_MODEL` to a new value in production.

## Setup

1. Copy `.env.example` to `.env.local` (already git-ignored — confirmed in `.gitignore`).
2. Leave everything unset to keep current behavior (`retrieval-only`, BYOK via Settings).
3. To enable real generation: set `LLM_VALIDATION_MODE=full`, and either have users enter their own key in Settings, or set `OPENAI_API_KEY`/`GEMINI_API_KEY` for a shared server-side key.

## Verified

- ✅ No secrets hardcoded anywhere in the codebase (grepped for OpenAI/Gemini key patterns — zero matches).
- ✅ `.gitignore` already excludes `.env`, `.env.local`, `.env.*.local`.
- ✅ Server-side env vars (`OPENAI_API_KEY`, `GEMINI_API_KEY`, etc.) are read only in `config/appConfig.js`, imported only by `pages/api/chat.js` and pure server-side `services/`/`lib/` modules — never by `pages/interview.js`, `pages/landing.js`, or any `components/*.js`, which use the separate client-side `utils/config.js` instead. Nothing here can reach the browser bundle.
- ✅ Missing model or question still returns a clean `400` with a specific error message, not a crash.
- ✅ Missing API key in `full` mode returns a clean `400` ("An API key is required for full generation mode...") instead of an opaque SDK error.
- ✅ Missing API key in `retrieval-only` mode (the default) is not an error at all — no key is required.

## Not yet covered (flagging honestly, not implemented here)

- No rate limiting on `/api/chat` — worth adding before any public-facing deployment.
- No request size limits beyond Next.js defaults.
- `data/knowledgeIndex.json` is currently checked into the working tree, not `.gitignore`d — decide deliberately whether the built index should be committed (simpler deploys, larger repo) or generated at build/deploy time via `npm run build:knowledge` (smaller repo, requires a build step). Not changed here since it's a real trade-off call, not a defect.
