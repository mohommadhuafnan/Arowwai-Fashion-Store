'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Package, Users, Sparkles, ArrowUpRight, RefreshCw, Send, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { analyticsAPI, aiAPI } from '@/lib/api';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils';

const EMPTY_INSIGHTS: Record<string, unknown> = {
  salesPrediction: { nextMonthRevenue: 0, trend: 'stable', confidence: 0 },
  demandPredictions: [],
  restockSuggestions: [],
  salesTrend: [],
  customerInsights: { avgOrderValue: 0, repeatRate: 0, topSegment: 'N/A' },
  seasonalRecommendations: [],
  source: 'fallback',
  aiSummary: 'Loading your store insights…',
};

function initialInsights() {
  return { ...EMPTY_INSIGHTS, aiSummary: 'Loading your store insights…' };
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Record<string, unknown>>(initialInsights);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiOnline, setAiOnline] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiHostLabel = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || '';
    if (!raw.trim()) return 'localhost (set NEXT_PUBLIC_API_URL on Vercel)';
    return raw.replace(/\/api\/?$/i, '').replace(/^https?:\/\//i, '');
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await analyticsAPI.getAIInsights();
      const data = res.data?.data;
      if (data && typeof data === 'object') {
        setInsights(data);
        if (data.source === 'github-ai') {
          setAiOnline(true);
          if (typeof data.model === 'string' && data.model) setAiModel(data.model);
          toast.success('AI insights updated');
        }
      } else {
        setInsights({ ...EMPTY_INSIGHTS, aiSummary: 'Unexpected response from server. Check NEXT_PUBLIC_API_URL on Vercel.' });
        setLoadError('Invalid response');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as { message?: string })?.message
        || 'Could not load insights';
      const isTimeout = (err as { code?: string })?.code === 'ECONNABORTED'
        || /timeout/i.test(String((err as { message?: string })?.message || ''));
      const hint =
        isTimeout
          ? 'Request timed out — GitHub AI may be slow. Tap Refresh or try again in a minute.'
          : status === 401
            ? 'Session expired — sign out and sign in again.'
            : status === 404
              ? 'API not found — set NEXT_PUBLIC_API_URL to your site URL + /api (e.g. https://your-app.vercel.app/api).'
              : msg;
      setLoadError(hint);
      setInsights({
        ...EMPTY_INSIGHTS,
        aiSummary: hint,
      });
      toast.error('Could not load AI insights');
    } finally {
      setLoading(false);
      try {
        const st = await aiAPI.getStatus();
        setAiOnline(Boolean(st.data.data?.configured));
        if (st.data.data?.model) setAiModel(String(st.data.data.model));
      } catch {
        setAiOnline(false);
      }
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setChatLoading(true);
    try {
      const res = await aiAPI.chat(text);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.data.reply }]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'AI chat failed';
      toast.error(msg);
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry, I could not respond: ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const data = insights;

  const prediction = data.salesPrediction as { nextMonthRevenue: number; trend: string; confidence: number };
  const demands = (data.demandPredictions as { product: string; currentSales: number; predictedDemand: number; recommendation: string }[]) || [];
  const restocks = (data.restockSuggestions as { product: string; currentStock: number; suggestedOrder: number; urgency: string }[]) || [];
  const trend = (data.salesTrend as { _id: string; revenue: number }[]) || [];
  const customer = data.customerInsights as { avgOrderValue: number; repeatRate: number; topSegment: string };
  const seasonal = (data.seasonalRecommendations as { season: string; products: string[] }[]) || [];
  const aiSummary = data.aiSummary as string | undefined;
  const source = data.source as string | undefined;

  const URGENCY_COLORS: Record<string, string> = {
    critical: 'text-red-400 bg-red-500/20',
    high: 'text-amber-400 bg-amber-500/20',
    medium: 'text-cyan-400 bg-cyan-500/20',
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          Updating insights from your store…
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Brain className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">AI Analytics</h1>
            <p className="text-sm text-[var(--muted)]">
              API <span className="font-mono text-[var(--foreground)]">{apiHostLabel}</span>
              {' · '}
              {aiOnline
                ? <>GitHub Models ready · <span className="text-[var(--foreground)]">{aiModel || 'openai/gpt-4o-mini'}</span></>
                : <>No server token — add <span className="font-mono text-[var(--foreground)]">GITHUB_TOKEN</span> (models:read) on Vercel, redeploy</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loadError && (
            <span className="text-[10px] text-amber-400 max-w-[200px] truncate" title={loadError}>
              Check connection / login
            </span>
          )}
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${aiOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
            {source === 'github-ai' ? 'Live AI' : 'Local'}
          </span>
          <button
            type="button"
            onClick={loadInsights}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs text-[var(--foreground)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {aiSummary && (
        <motion.div className="glass-card rounded-2xl p-5 border border-[var(--accent)]/20">
          <p className="text-xs font-semibold text-[var(--accent)] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Summary
          </p>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">{aiSummary}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div className="glass-card rounded-2xl p-5" whileHover={{ y: -2 }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[var(--muted)]">Sales Prediction</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(prediction?.nextMonthRevenue || 0)}</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {prediction?.trend || 'stable'} trend · {((prediction?.confidence || 0) * 100).toFixed(0)}% confidence
          </p>
        </motion.div>
        <motion.div className="glass-card rounded-2xl p-5" whileHover={{ y: -2 }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-[var(--muted)]">Customer Insights</span>
          </div>
          <p className="text-2xl font-bold"><AnimatedCounter value={customer?.repeatRate || 0} suffix="%" /></p>
          <p className="text-xs text-[var(--muted)] mt-1">Repeat rate · Top: {customer?.topSegment || 'N/A'}</p>
        </motion.div>
        <motion.div className="glass-card rounded-2xl p-5" whileHover={{ y: -2 }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-[var(--muted)]">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(customer?.avgOrderValue || 0)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Based on your store sales data</p>
        </motion.div>
      </div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Demand Predictions</h3>
          <div className="space-y-3">
            {demands.map((d, i) => (
              <motion.div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div>
                  <p className="text-xs font-medium">{d.product}</p>
                  <p className="text-[10px] text-[var(--muted)]">{d.recommendation}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--accent)]">{d.predictedDemand} units</p>
                  <p className="text-[10px] text-[var(--muted)]">from {d.currentSales}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" /> Smart Restocking
          </h3>
          <div className="space-y-3">
            {restocks.map((r, i) => (
              <motion.div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div>
                  <p className="text-xs font-medium">{r.product}</p>
                  <p className="text-[10px] text-[var(--muted)]">Current: {r.currentStock} units</p>
                </div>
                <div className="text-right">
                  <p className="text-xs">Order: {r.suggestedOrder}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${URGENCY_COLORS[r.urgency] || URGENCY_COLORS.medium}`}>{r.urgency}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-4">Sales Trend Forecast</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="_id" stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <YAxis stroke="var(--muted)" fontSize={12} tickFormatter={(v) => formatCurrencyCompact(v as number)} />
            <Tooltip contentStyle={{ background: 'rgba(15,10,30,0.95)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', color: '#fff' }} />
            <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="url(#aiGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seasonal.map((s, i) => (
          <motion.div key={i} className="glass-card rounded-2xl p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <h4 className="text-sm font-semibold mb-3">{s.season} Recommendations</h4>
            <div className="flex flex-wrap gap-2">
              {s.products.map((p) => (
                <span key={p} className="px-3 py-1 rounded-full text-xs bg-purple-600/10 text-purple-300 border border-purple-500/20">{p}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Bot className="w-4 h-4 text-[var(--accent)]" /> Ask TrendyPOS AI
        </h3>
        <p className="text-xs text-[var(--muted)] mb-4">Ask about sales, stock, pricing, or promotions. Uses your live store data.</p>

        <div className="max-h-64 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.length === 0 && (
            <p className="text-xs text-[var(--muted)] text-center py-6">Try: &quot;What should I restock this week?&quot; or &quot;How can I increase sales?&quot;</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm rounded-xl px-3 py-2.5 max-w-[90%] whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'ml-auto bg-[var(--accent)]/20 text-[var(--foreground)] border border-[var(--accent)]/30'
                  : 'mr-auto bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border-subtle)]'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="text-xs text-[var(--muted)] flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              AI is thinking...
            </div>
          )}
          <motion.div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Ask your retail AI assistant..."
            disabled={chatLoading}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] input-glow disabled:opacity-50"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
          />
          <button
            type="button"
            onClick={sendChat}
            disabled={chatLoading || !chatInput.trim()}
            className="px-4 py-2.5 rounded-xl btn-primary text-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </motion.div>
  );
}
