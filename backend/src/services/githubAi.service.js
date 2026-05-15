const ENDPOINT = 'https://models.github.ai/inference';
/** Default matches GitHub “Models” quickstart; override with GITHUB_AI_MODEL. External models: custom/key_id/model_id */
const DEFAULT_MODEL = process.env.GITHUB_AI_MODEL || 'openai/gpt-4o-mini';

let clientPromise = null;

async function getClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured. Add it to backend/.env');
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const { default: ModelClient } = await import('@azure-rest/ai-inference');
      const { AzureKeyCredential } = await import('@azure/core-auth');
      return ModelClient(ENDPOINT, new AzureKeyCredential(token));
    })();
  }

  return clientPromise;
}

function isConfigured() {
  return Boolean(process.env.GITHUB_TOKEN);
}

function getModel() {
  return process.env.GITHUB_AI_MODEL || DEFAULT_MODEL;
}

function formatAiError(err) {
  const msg = String(err?.message || err || '');
  if (/too many requests|rate limit|429/i.test(msg)) {
    return 'GitHub AI rate limit reached. Using offline assistant — try again in a few minutes.';
  }
  if (/unexpected token|not valid json/i.test(msg)) {
    return 'AI service temporarily unavailable. Using offline assistant.';
  }
  if (/unauthorized|401|403|invalid.*token/i.test(msg)) {
    return 'GitHub AI rejected the token — use a PAT with models:read (fine-grained: Models permission) and set GITHUB_TOKEN only on the backend / Vercel server env.';
  }
  return msg || 'GitHub AI request failed';
}

/**
 * Short answers from live POS snapshot when GitHub Models is off or fails.
 * @param {string} userMessage
 * @param {object|null} storeContext
 * @param {{ fallbackReason?: 'not-configured' | 'rate-limit' | 'error' | 'generic' }} [meta]
 */
function localRetailReply(userMessage, storeContext = null, meta = {}) {
  const reason = meta.fallbackReason || 'generic';
  const ctx = storeContext || {};
  const topProducts = (ctx.topProducts || []).slice(0, 5);
  const top = topProducts.slice(0, 3).map((p) => p.name).join(', ') || 'your top sellers';
  const topOne = topProducts[0]?.name || 'your bestsellers';
  const low = (ctx.lowStock || []).length;
  const avg = ctx.avgOrderValue || 0;
  const orders = ctx.totalOrders || 0;
  const customers = ctx.customerCount || 0;
  const q = userMessage.toLowerCase().trim();

  const tail = () => {
    if (reason === 'not-configured') {
      return ' Full AI replies need GITHUB_TOKEN (with Models / models:read) on your server—ask your admin if this keeps showing.';
    }
    if (reason === 'rate-limit') {
      return ' GitHub Models is busy right now—try again in a few minutes.';
    }
    if (reason === 'error') {
      return ' Live AI had a hiccup; this answer uses your store data only.';
    }
    return '';
  };

  if (/^(hi|hello|hey|hola)\b|^good\s+(morning|afternoon|evening)\b/.test(q) || /^(hi|hello)[\s!.?]*$/i.test(userMessage.trim())) {
    return `Hello — I’m the built-in assistant for ${ctx.store || 'your store'}. Ask about bestsellers, low stock, or promos. (${orders} orders on file, ${customers} customers.)${tail()}`;
  }
  if (/help|what can you|how (do|can) i use|what should i ask/.test(q)) {
    return `Try: “What’s selling best?”, “Any low stock?”, or “Discount ideas”. I use live data—right now strong lines include ${top}.${tail()}`;
  }
  if (/who are you|what are you|are you (ai|a bot)/.test(q)) {
    return `I answer from your POS snapshot (sales, stock, customers). I’m not the full cloud model unless GitHub AI is enabled on the server.${tail()}`;
  }
  if (/customer|clients|shoppers|loyalty/.test(q)) {
    return `You have ${customers} active customers on file and ${orders} completed orders. Avg order about LKR ${avg.toLocaleString()}—reward repeat buyers on ${topOne}.${tail()}`;
  }
  if (/best\s*sell|top\s*product|moving|popular|what('?s|\s+is)\s+selling/.test(q)) {
    return `Strong performers recently: ${top}. Double-check sizes/colors on ${topOne} so you don’t miss sales.${tail()}`;
  }
  if (/stock|inventory|restock|low/.test(q)) {
    return low > 0
      ? `You have ${low} low-stock item(s). Review inventory and reorder ${top} first. Average order value is LKR ${avg.toLocaleString()}.${tail()}`
      : `Stock levels look stable. Keep monitoring ${top} as they drive most sales.${tail()}`;
  }
  if (/sale|revenue|profit|earn|turnover/.test(q)) {
    return `Recent average order value is LKR ${avg.toLocaleString()} with ${orders} total orders. Focus promotions on ${top} to lift revenue this week.${tail()}`;
  }
  if (/price|discount|promo|mark\s*down|offer/.test(q)) {
    return `For fashion retail in Mawanella, bundle slow movers with ${top.split(',')[0] || 'bestsellers'} and cap discounts around 10–15% to protect margin.${tail()}`;
  }

  const n = (userMessage || '').length % 3;
  const bodies = [
    `Quick view: ${customers} customers, ${orders} orders, typical order about LKR ${avg.toLocaleString()}. Movers: ${top}. Say “low stock”, “sales”, or “promos” for specifics.`,
    `From your data: bestsellers include ${top}. Avg sale ~LKR ${avg.toLocaleString()}. What do you want next—inventory checks, revenue, or pricing?`,
    `Snapshot: ${orders} completed orders, ${customers} customers. Strong products: ${top}. Rephrase with one topic (e.g. stock, discounts) and I’ll narrow it down.`,
  ];
  return bodies[n] + tail();
}

async function safeChatCompletion(messages, options = {}) {
  try {
    return await chatCompletion(messages, options);
  } catch (err) {
    throw new Error(formatAiError(err));
  }
}

/**
 * Send a chat completion request to GitHub Models inference API.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ temperature?: number, top_p?: number, max_tokens?: number, model?: string }} options
 */
async function chatCompletion(messages, options = {}) {
  const { isUnexpected } = await import('@azure-rest/ai-inference');
  const client = await getClient();

  let response;
  try {
    response = await client.path('/chat/completions').post({
      body: {
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 1.0,
        max_tokens: options.max_tokens ?? 2000,
        model: options.model || getModel(),
      },
    });
  } catch (err) {
    throw new Error(formatAiError(err));
  }

  if (isUnexpected(response)) {
    const err = response.body?.error;
    const status = response.status;
    if (status === 429) {
      throw new Error('Too many requests — GitHub AI rate limit');
    }
    const bodyText = typeof response.body === 'string' ? response.body : '';
    if (/too many requests/i.test(bodyText)) {
      throw new Error('Too many requests — GitHub AI rate limit');
    }
    throw new Error(err?.message || err?.code || 'GitHub AI request failed');
  }

  return response.body.choices?.[0]?.message?.content || '';
}

function extractJsonBlock(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Retail-focused assistant for AROWWAI Fashion Store POS.
 */
async function askRetailAssistant(userMessage, storeContext = null) {
  const contextBlock = storeContext
    ? `\n\nCurrent store snapshot (JSON):\n${JSON.stringify(storeContext, null, 2)}`
    : '';

  try {
    return await chatCompletion([
      {
        role: 'system',
        content:
          'You are TrendyPOS AI, a helpful retail analyst for AROWWAI Fashion Store in Mawanella, Sri Lanka. ' +
          'Give practical, concise advice about sales, inventory, pricing, and fashion retail. ' +
          'Use LKR for currency. Be direct and actionable.',
      },
      {
        role: 'user',
        content: `${userMessage}${contextBlock}`,
      },
    ], { temperature: 0.6, max_tokens: 1500 });
  } catch (err) {
    console.error('GitHub AI chat fallback:', err.message);
    const msg = String(err?.message || '');
    const reason = /rate limit|429|too many requests/i.test(msg) ? 'rate-limit' : 'error';
    return localRetailReply(userMessage, storeContext, { fallbackReason: reason });
  }
}

/**
 * Generate structured analytics insights from live POS data.
 */
async function generateStoreInsights(storeData) {
  const content = await chatCompletion([
    {
      role: 'system',
      content:
        'You are a retail analytics engine. Respond with ONLY valid JSON (no markdown fences). ' +
        'Schema: {"salesPrediction":{"nextMonthRevenue":number,"trend":"upward"|"downward"|"stable","confidence":number},' +
        '"demandPredictions":[{"product":string,"currentSales":number,"predictedDemand":number,"recommendation":string}],' +
        '"restockSuggestions":[{"product":string,"currentStock":number,"suggestedOrder":number,"urgency":"critical"|"high"|"medium"}],' +
        '"customerInsights":{"avgOrderValue":number,"repeatRate":number,"topSegment":string},' +
        '"seasonalRecommendations":[{"season":string,"products":string[]}],' +
        '"aiSummary":string}',
    },
    {
      role: 'user',
      content: `Analyze this fashion store POS data and fill the JSON schema with realistic values:\n${JSON.stringify(storeData)}`,
    },
  ], { temperature: 0.4, max_tokens: 2500 });

  const parsed = extractJsonBlock(content);
  if (!parsed) {
    throw new Error('AI returned invalid JSON');
  }
  return parsed;
}

module.exports = {
  isConfigured,
  getModel,
  chatCompletion,
  askRetailAssistant,
  generateStoreInsights,
  extractJsonBlock,
  localRetailReply,
  formatAiError,
};
