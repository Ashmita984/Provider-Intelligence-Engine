import React, { useState } from "react";
import { Send, PhoneCall, MessageSquare, CheckCircle2, AlertTriangle, X, RefreshCw } from "lucide-react";
import { sendTwilioAlert } from "../services/api";
import type { Area } from "../types";

interface TwilioModalProps {
  isOpen: boolean;
  onClose: () => void;
  area?: Area | null;
  specialty?: string;
}

export default function TwilioModal({ isOpen, onClose, area, specialty }: TwilioModalProps) {
  const [toNumber, setToNumber] = useState("+918610848428");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    success: boolean;
    channel?: string;
    messageSid?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const defaultMsg = area
    ? `High Healthcare Access Gap Alert for ${area.name}, ${area.state}! Specialty shortage: ${specialty || area.primarySpecialty} (Risk Score: ${area.riskScore}%). Immediate provider recruitment recommended.`
    : "High healthcare access gap detected. Provider recruitment recommended.";

  const activeMsg = message.trim() ? message : defaultMsg;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatusResult(null);

    const res = await sendTwilioAlert({
      toNumber,
      channel,
      message: activeMsg,
      areaName: area?.name,
      specialty: specialty || area?.primarySpecialty,
      riskLevel: area?.riskLevel?.toUpperCase() || "HIGH",
    });

    setSending(false);
    setStatusResult(res);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface-card p-6 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900">Dispatch Twilio Alert</h3>
              <p className="text-xs text-slate-500">Automated WhatsApp & SMS Healthcare Notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSend} className="mt-4 space-y-4">
          
          {area && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs">
              <span className="font-semibold text-brand-900">Target Region:</span>{" "}
              <span className="font-bold text-navy-900">{area.name}, {area.state}</span>
              <div className="mt-1 flex items-center gap-3 text-slate-600">
                <span>Specialty: <strong className="text-navy-900">{specialty || area.primarySpecialty}</strong></span>
                <span>Risk Level: <strong className="uppercase text-rose-600">{area.riskLevel}</strong></span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Phone Number (E.164 Format)
            </label>
            <input
              type="text"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              placeholder="+918610848428 or whatsapp:+918610848428"
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-xs font-mono text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Channel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                  channel === "whatsapp"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold"
                    : "border-surface-border bg-white text-slate-600 hover:bg-surface"
                }`}
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                WhatsApp (w/ SMS Fallback)
              </button>

              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                  channel === "sms"
                    ? "border-brand-500 bg-brand-50 text-brand-700 font-bold"
                    : "border-surface-border bg-white text-slate-600 hover:bg-surface"
                }`}
              >
                <PhoneCall className="h-4 w-4 text-brand-600" />
                Direct SMS Only
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notification Text
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={defaultMsg}
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-xs text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Status Result Display */}
          {statusResult && (
            <div className={`rounded-xl border p-3.5 text-xs ${
              statusResult.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {statusResult.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Notification Dispatched Successfully!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Delivery Failed</span>
                  </>
                )}
              </div>
              {statusResult.messageSid && (
                <p className="mt-1 font-mono text-[11px]">
                  Twilio SID: <strong>{statusResult.messageSid}</strong> ({statusResult.channel})
                </p>
              )}
              {statusResult.error && (
                <p className="mt-1 text-[11px] text-rose-600">{statusResult.error}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-surface-border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-surface"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Dispatch Alert
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
