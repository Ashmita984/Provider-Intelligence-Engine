import { useEffect, useState } from "react";
import { Sparkles, Send, Loader2, Bot, HelpCircle, ShieldCheck } from "lucide-react";
import { getInsightSummary } from "../services/api";
import type { InsightRequest, InsightResponse } from "../types";

interface InsightAssistantProps {
  requestPayload: InsightRequest;
  className?: string;
}

export default function InsightAssistant({ requestPayload, className = "" }: InsightAssistantProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [lastAskedQuestion, setLastAskedQuestion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAnswer(null);
    setLastAskedQuestion(null);

    getInsightSummary(requestPayload)
      .then((res: InsightResponse) => {
        if (!active) return;
        setSummary(res.summary);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Insight summary error:", err);
        setSummary("Unable to generate natural language summary for this page.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    requestPayload.page_context,
    requestPayload.area_name,
    requestPayload.risk_score,
    requestPayload.providers_needed,
  ]);

  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || asking) return;

    const q = question.trim();
    setAsking(true);
    setLastAskedQuestion(q);
    setAnswer(null);

    try {
      const res = await getInsightSummary({
        ...requestPayload,
        question: q,
      });
      setAnswer(res.answer || "No response generated for this question.");
      setQuestion("");
    } catch (err) {
      console.error("Insight Q&A error:", err);
      setAnswer("Error communicating with Insight Assistant.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/60 via-white to-slate-50/50 p-5 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              AI Insight Assistant
              <span className="rounded-full border border-brand-200 bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                Grounded ML Explainer
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Plain-English synthesis constrained strictly to current page data
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Read-only explanation</span>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-2xs">
        {loading ? (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 py-1">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            <span>Analyzing page data metrics...</span>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Bot className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium text-slate-700">
              {summary}
            </p>
          </div>
        )}
      </div>

      {/* Follow-up Question Answer Display */}
      {lastAskedQuestion && (
        <div className="mb-4 space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
            <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
            <span>Q: {lastAskedQuestion}</span>
          </div>
          <div className="pl-5">
            {asking ? (
              <div className="flex items-center gap-2 text-xs text-indigo-600 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Consulting page metrics...</span>
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {answer}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Q&A Input Form */}
      <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this page's data (e.g. 'Why is this an anomaly?' or 'How many providers are needed?')"
          disabled={loading || asking}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading || asking}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {asking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
