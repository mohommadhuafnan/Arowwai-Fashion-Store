const ENDPOINT = 'https://models.github.ai/inference';
const DEFAULT_MODEL = process.env.GITHUB_AI_MODEL || 'deepseek/DeepSeek-V3-0324';

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
    return 'GitHub AI token invalid or expired. Check GITHUB_TOKEN in Vercel env vars.';
  }
  return msg || 'GitHub AI request failed';
}

function localRetailReply(userMessage, storeContext = null) {
  const ctx = storeContext || {};
  const top = (ctx.topProducts || []).slice(0, 3).map((p) => p.name).join(', ') || 'your top sellers';
  const low = (ctx.lowStock || []).length;
  const avg = ctx.avgOrderValue || 0;
  const q = userMessage.toLowerCase();

  if (/stock|inventory|restock|low/.test(q)) {
    return low > 0
      ? `You have ${low} low-stock item(s). Review inventory and reorder ${top} first. Average order value is LKR ${avg.toLocaleString()}.`
      : `Stock levels look stable. Keep monitoring ${top} as they drive most sales.`;
  }
  if (/sale|revenue|profit|earn/.test(q)) {
    return `Recent average order value is LKR ${avg.toLocaleString()} with ${ctx.totalOrders || 0} total orders. Focus promotions on ${top} to lift revenue this week.`;
  }
  if (/price|discount|promo/.test(q)) {
    return `For Mawanella fashion retail, bundle slow movers with ${top.split(',')[0] || 'bestsellers'} and cap discounts at 10–15% to protect margin.`;
  }
  return `TrendyPOS offline assistant: ${ctx.store || 'AROWWAI'} has ${ctx.customerCount || 0} customers. Top products: ${top}. Ask about sales, stock, or pricing — live GitHub AI will resume when rate limits reset.`;
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
    return localRetailReply(userMessage, storeContext);
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
