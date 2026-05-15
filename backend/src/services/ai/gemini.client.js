const { GoogleGenerativeAI } = require('@google/generative-ai');

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-flash-lite-latest';

let client = null;
const modelCache = new Map();

function isEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient() {
  if (!isEnabled()) return null;
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

function getModel(name, systemInstruction) {
  const c = getClient();
  if (!c) return null;
  const key = `${name}::${systemInstruction ? systemInstruction.slice(0, 80) : ''}`;
  if (modelCache.has(key)) return modelCache.get(key);
  const m = c.getGenerativeModel(
    systemInstruction ? { model: name, systemInstruction } : { model: name }
  );
  modelCache.set(key, m);
  return m;
}

function isQuotaError(err) {
  const msg = String(err?.message || '');
  return /429|quota|rate.?limit/i.test(msg);
}

async function callWithFallback({ generationConfig, contents, systemInstruction }) {
  let lastErr;
  for (const modelName of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const m = getModel(modelName, systemInstruction);
      const result = await m.generateContent({ contents, generationConfig });
      return result.response.text();
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err)) break;
    }
  }
  throw lastErr;
}

async function generateText(prompt, opts = {}) {
  if (!isEnabled()) {
    const err = new Error('Gemini is not configured');
    err.code = 'AI_DISABLED';
    throw err;
  }
  const text = await callWithFallback({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      maxOutputTokens: opts.maxOutputTokens ?? 600,
    },
  });
  return text.trim();
}

async function generateJSON(prompt, opts = {}) {
  if (!isEnabled()) {
    const err = new Error('Gemini is not configured');
    err.code = 'AI_DISABLED';
    throw err;
  }
  const text = await callWithFallback({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 800,
      responseMimeType: 'application/json',
    },
  });
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error('Gemini returned invalid JSON');
    err.code = 'AI_BAD_JSON';
    err.raw = text;
    throw err;
  }
}

async function generateChat(messages, systemPrompt, opts = {}) {
  if (!isEnabled()) {
    const err = new Error('Gemini is not configured');
    err.code = 'AI_DISABLED';
    throw err;
  }
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));
  const text = await callWithFallback({
    contents,
    systemInstruction: systemPrompt || undefined,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 500,
    },
  });
  return text.trim();
}

module.exports = { isEnabled, generateText, generateJSON, generateChat };
