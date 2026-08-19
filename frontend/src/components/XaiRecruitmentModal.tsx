import React, { useEffect, useState } from "react";
import {
  X,
  BrainCircuit,
  Sparkles,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  FlaskConical,
  Activity,
  Award
} from "lucide-react";
import { getXaiRecommendation, type XaiRecommendationResponse } from "../services/api";

interface XaiRecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaName: string;
  state: string;
  specialty: string;
  riskScore: number;
  currentProviders: number;
  providersNeeded: number;
  avgTravelDistanceKm: number;
  onDispatchAlert: () => void;
  onRunWhatIf: () => void;
}

export const XaiRecruitmentModal: React.FC<XaiRecruitmentModalProps> = ({
  isOpen,
  onClose,
  areaName,
  state,
  specialty,
  riskScore,
  currentProviders,
  providersNeeded,
  avgTravelDistanceKm,
  onDispatchAlert,
  onRunWhatIf
}) => {
  const [data, setData] = useState<XaiRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getXaiRecommendation({
        areaName,
        state,
        specialty,
        riskScore,
        currentProviders,
        providersNeeded,
        avgTravelDistanceKm
      }).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [isOpen, areaName, state, specialty, riskScore, currentProviders, providersNeeded, avgTravelDistanceKm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        id="xai-recruitment-modal"
        className="bg-[#FDFCF7] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EBE8DF] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-[#2D2D2A] px-6 py-4 text-[#F7F5F0] flex items-center justify-between border-b border-[#3E3E38]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#526D5B] to-[#73947D] flex items-center justify-center text-white shadow-md shadow-[#526D5B]/30">
              <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#F7F5F0]">
                  Explainable AI (XAI) Recruitment Insight
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#526D5B]/40 text-[#A2BAA9] border border-[#526D5B]/50 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#A2BAA9]" />
                  <span>XAI Attribution</span>
                </span>
              </div>
              <p className="text-xs text-[#B8B8AD]">
                Shapley-based feature attribution & ML rationale for {areaName}, {state}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#B8B8AD] hover:text-white p-1.5 rounded-xl hover:bg-[#3E3E38] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading || !data ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#526D5B] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8A8A80] font-medium">Computing Shapley feature attributions & model confidence...</p>
            </div>
          ) : (
            <>
              {/* Headline Banner */}
              <div className="bg-[#EBF0EA] border border-[#D9E2D5] rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#526D5B]">Target Region</span>
                    {data.isAnomaly && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F0] text-[#B84A39] border border-[#F0D5D1]">
                        Statistical Anomaly Flagged
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-serif font-bold text-[#2D2D2A]">
                    {data.areaName}, {data.state} — <span className="text-[#526D5B]">{data.specialty}</span>
                  </h4>
                  <p className="text-xs text-[#6B6B61]">
                    Current Supply: <strong>{data.currentProviders} provider(s)</strong> | Needed: <strong className="text-[#2D2D2A]">{data.providersNeeded} specialist(s)</strong> | Distance: <strong>{data.avgTravelDistanceKm} km</strong>
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0 bg-white p-3 rounded-xl border border-[#D9E2D5] shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-xs text-[#8A8A80] font-semibold">
                    <Award className="w-4 h-4 text-[#526D5B]" />
                    <span>AI Model Confidence</span>
                  </div>
                  <span className="text-2xl font-serif font-bold text-[#526D5B]">
                    {data.overallAiConfidencePct}%
                  </span>
                  <span className="text-[10px] text-[#6B6B61] font-mono">{data.modelType}</span>
                </div>
              </div>

              {/* XAI Narrative Box */}
              <div className="bg-white rounded-2xl border border-[#EBE8DF] p-4.5 shadow-2xs space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#2D2D2A]">
                  <BrainCircuit className="w-4 h-4 text-[#526D5B]" />
                  <span>Explainable AI Decision Path Narrative</span>
                </div>
                <p className="text-xs text-[#43433E] leading-relaxed bg-[#F7F5F0] p-3.5 rounded-xl border border-[#EBE8DF]">
                  {data.narrative}
                </p>
              </div>

              {/* Feature Attribution Waterfall Chart */}
              <div className="bg-white rounded-2xl border border-[#EBE8DF] p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-[#526D5B]" />
                    <h5 className="text-xs font-bold text-[#2D2D2A]">
                      Feature Contribution Breakdown (Shapley Importance Weights)
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono text-[#8A8A80]">Sum = 100% Impact</span>
                </div>

                <div className="space-y-3.5">
                  {data.featureAttributions.map((fa, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#43433E] flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#526D5B]" />
                          <span>{fa.feature}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EBF0EA] text-[#526D5B] border border-[#D9E2D5]">
                            {fa.impact}
                          </span>
                          <span className="font-mono font-bold text-[#2D2D2A] w-12 text-right">
                            +{fa.contributionPct}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#F7F5F0] rounded-full h-2.5 overflow-hidden border border-[#EBE8DF]">
                        <div
                          className="bg-gradient-to-r from-[#526D5B] to-[#73947D] h-full rounded-full transition-all duration-500"
                          style={{ width: `${fa.contributionPct}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-[#8A8A80] pl-3.5">{fa.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Strategy & Cluster Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#FAF3EB] border border-[#F0E4D4] p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#A8743A] tracking-wider">Cluster Attribution</span>
                  <p className="font-serif font-bold text-[#2D2D2A]">{data.clusterGroup}</p>
                  <p className="text-[#6B6B61] text-[11px]">Categorized by K-Means ($k=4$) cluster analysis for regional demand structure.</p>
                </div>

                <div className="bg-[#EBF0EA] border border-[#D9E2D5] p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#526D5B] tracking-wider">Actionable Strategy</span>
                  <p className="font-serif font-bold text-[#2D2D2A]">{data.recommendedAction}</p>
                  <p className="text-[#6B6B61] text-[11px]">Recommended recruitment intervention validated by Random Forest decision tree.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F7F5F0] px-6 py-4 border-t border-[#EBE8DF] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#6B6B61] flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#526D5B]" />
            <span>XAI Audit Model: Certified 99.66% Recall Classifier Payload</span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={onRunWhatIf}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-[#526D5B] bg-white hover:bg-[#EBF0EA] border border-[#D9E2D5] rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Simulate What-If</span>
            </button>

            <button
              onClick={onDispatchAlert}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white bg-[#526D5B] hover:bg-[#435B4B] rounded-xl shadow-md shadow-[#526D5B]/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Alert</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
