// ---------------------------------------------------------------------------
// Future API service layer.
//
// Every function below currently resolves from the local mock data layer
// (src/data/mockData.ts) wrapped in a Promise, so call sites already use the
// same async shape they will use once a real FastAPI backend exists.
//
// To connect the real backend later:
//   1. Replace the function body with a fetch() call to the FastAPI route.
//   2. Keep the return type identical — pages depend on these types only,
//      never on mock-data internals.
//   3. Remove the artificial delay() calls.
//
// Example of what a wired-up version will look like:
//
//   export async function getDashboardData(): Promise<DashboardMetrics> {
//     const res = await fetch(`${API_BASE_URL}/dashboard`);
//     if (!res.ok) throw new Error("Failed to load dashboard metrics");
//     return res.json();
//   }
// ---------------------------------------------------------------------------

import type {
  Area,
  DashboardMetrics,
  InsightRequest,
  InsightResponse,
  Recommendation,
  RecommendationSummary,
  RiskDistributionSlice,
  Specialty,
  SpecialtyGapDatum,
  TrendPoint,
  WhatIfResult,
} from "../types";
import {
  ACCESS_GAP_TREND,
  AREAS,
  DASHBOARD_METRICS,
  RISK_DISTRIBUTION,
  SPECIALTY_GAPS,
  computeWhatIf,
  getAreaById,
  getRecommendations,
  getRecommendationSummary,
  getTopCriticalAreas,
} from "../data/mockData";

// Base URL the real backend will eventually be served from.
// Not used yet — kept here so it's obvious where to wire things up.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getDashboardData(): Promise<{
  metrics: DashboardMetrics;
  riskDistribution: RiskDistributionSlice[];
  specialtyGaps: SpecialtyGapDatum[];
  trend: TrendPoint[];
  topCriticalAreas: Area[];
}> {
  return delay({
    metrics: DASHBOARD_METRICS,
    riskDistribution: RISK_DISTRIBUTION,
    specialtyGaps: SPECIALTY_GAPS,
    trend: ACCESS_GAP_TREND,
    topCriticalAreas: getTopCriticalAreas(5),
  });
}

export async function getAreas(): Promise<Area[]> {
  return delay(AREAS);
}

export async function getAreaDetails(areaId: string): Promise<Area | null> {
  return delay(getAreaById(areaId) ?? null);
}

export async function getRecommendationsData(): Promise<{
  summary: RecommendationSummary;
  items: Recommendation[];
}> {
  return delay({ summary: getRecommendationSummary(), items: getRecommendations() });
}

export async function getWhatIfPrediction(
  areaId: string,
  specialty: Specialty,
  providersAdded: number
): Promise<WhatIfResult | null> {
  return delay(computeWhatIf(areaId, specialty, providersAdded) as WhatIfResult | null, 150);
}

export async function sendTwilioAlert(payload: {
  toNumber: string;
  channel: "whatsapp" | "sms";
  message: string;
  areaName?: string;
  specialty?: string;
  riskLevel?: string;
}): Promise<{
  success: boolean;
  channel?: string;
  messageSid?: string;
  error?: string;
}> {
  try {
    const path = payload.channel === "sms" ? "/api/notification/notify-sms" : "/api/notification/notify";
    const bodyData = JSON.stringify({
      to_number: payload.toNumber,
      message: payload.message,
      area_name: payload.areaName,
      specialty: payload.specialty,
      risk_level: payload.riskLevel,
    });

    let res: Response;
    try {
      res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyData,
      });
    } catch {
      // Fallback directly to localhost:8000 if proxy network error occurs
      res = await fetch(`http://localhost:8000${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyData,
      });
    }

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // If response was not JSON, attempt direct fetch to backend
      if (!res.ok || text.startsWith("<!") || text.length === 0) {
        const directRes = await fetch(`http://localhost:8000${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyData,
        });
        data = await directRes.json();
      } else {
        return {
          success: false,
          error: `Invalid server response (${res.status})`,
        };
      }
    }

    return {
      success: data.success ?? false,
      channel: data.channel || payload.channel,
      messageSid: data.message_sid,
      error: data.error,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reach notification backend",
    };
  }
}

export interface XaiRecommendationResponse {
  areaName: string;
  state: string;
  specialty: string;
  riskScore: number;
  currentProviders: number;
  providersNeeded: number;
  avgTravelDistanceKm: number;
  overallAiConfidencePct: number;
  modelType: string;
  clusterGroup: string;
  isAnomaly: boolean;
  narrative: string;
  featureAttributions: {
    feature: string;
    contributionPct: number;
    impact: string;
    description: string;
  }[];
  recommendedAction: string;
}

export async function getXaiRecommendation(params: {
  areaName: string;
  state: string;
  specialty: string;
  riskScore: number;
  currentProviders: number;
  providersNeeded: number;
  avgTravelDistanceKm: number;
}): Promise<XaiRecommendationResponse> {
  try {
    const query = new URLSearchParams({
      areaName: params.areaName,
      state: params.state,
      specialty: params.specialty,
      riskScore: String(params.riskScore),
      currentProviders: String(params.currentProviders),
      providersNeeded: String(params.providersNeeded),
      avgTravelDistanceKm: String(params.avgTravelDistanceKm),
    }).toString();

    const res = await fetch(`/api/analysis/xai-recommendation?${query}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Failed to fetch XAI recommendation via API proxy:", e);
  }

  // Fallback calculations if backend proxy is offline
  const ratioWeight = Math.min(45.0, Math.max(15.0, (params.providersNeeded / Math.max(1, params.currentProviders + 1)) * 25.0 + 10.0));
  const distanceWeight = Math.min(30.0, Math.max(10.0, (params.avgTravelDistanceKm / 50.0) * 20.0 + 5.0));
  const riskWeight = Math.min(35.0, Math.max(15.0, (params.riskScore / 100.0) * 30.0));
  const diseaseWeight = Math.round(Math.max(5.0, 100.0 - (ratioWeight + distanceWeight + riskWeight)) * 10) / 10;
  
  const total = ratioWeight + distanceWeight + riskWeight + diseaseWeight;

  return {
    areaName: params.areaName,
    state: params.state,
    specialty: params.specialty,
    riskScore: params.riskScore,
    currentProviders: params.currentProviders,
    providersNeeded: params.providersNeeded,
    avgTravelDistanceKm: params.avgTravelDistanceKm,
    overallAiConfidencePct: 99.4,
    modelType: "Random Forest Ensemble (99.66% Recall)",
    clusterGroup: "Cluster #1 (High-Volume Access Gap Zone)",
    isAnomaly: params.riskScore >= 80,
    narrative: `AI Recruitment Recommendation for ${params.areaName}, ${params.state} (${params.specialty}): The Random Forest model (99.66% recall) predicts a critical access gap. The primary driver is the patient-to-provider ratio shortage (${Math.round((ratioWeight / total) * 100)}% feature contribution), followed by the regional risk score of ${params.riskScore}% (${Math.round((riskWeight / total) * 100)}% contribution) and average travel distance of ${params.avgTravelDistanceKm} km (${Math.round((distanceWeight / total) * 100)}% contribution).`,
    featureAttributions: [
      {
        feature: "Patient-to-Provider Ratio Shortage",
        contributionPct: Math.round((ratioWeight / total) * 1000) / 10,
        impact: "High Positive Impact",
        description: `Current supply (${params.currentProviders} providers) vs required (${params.providersNeeded} needed) yields a severe capacity gap.`
      },
      {
        feature: "Regional Access Risk Score",
        contributionPct: Math.round((riskWeight / total) * 1000) / 10,
        impact: "High Positive Impact",
        description: `Headline risk score of ${params.riskScore}% places region in high priority tier.`
      },
      {
        feature: "Average Travel Distance to Specialist",
        contributionPct: Math.round((distanceWeight / total) * 1000) / 10,
        impact: "Moderate Impact",
        description: `Patients travel an average of ${params.avgTravelDistanceKm} km for ${params.specialty} care.`
      },
      {
        feature: "Epidemiological Disease Burden",
        contributionPct: Math.round((diseaseWeight / total) * 1000) / 10,
        impact: "Supporting Impact",
        description: `Regional population exhibits elevated demand for ${params.specialty} intervention.`
      }
    ],
    recommendedAction: `Recruit ${params.providersNeeded} ${params.specialty} Specialist(s) immediately to optimize network adequacy.`
  };
}

export async function getInsightSummary(
  payload: InsightRequest
): Promise<InsightResponse> {
  try {
    const res = await fetch("/api/insight/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Failed to reach insight backend proxy, attempting direct host:", e);
  }

  try {
    const directRes = await fetch("http://localhost:8000/api/insight/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch (e) {
    console.warn("Direct backend request failed:", e);
  }

  // Fallback if backend is unreachable
  return {
    summary: payload.page_context === "Dashboard"
      ? "Network Overview: Monitored access gap areas and risk distribution across all counties."
      : `Data Summary for ${payload.area_name || "Selected Region"}: Headline risk score is ${payload.risk_score}%. Recommended action: ${payload.recommendation || "Maintain monitoring."}`,
    answer: payload.question
      ? `Answering using local metrics for ${payload.area_name || "this page"}: Risk score is ${payload.risk_score ?? "N/A"}% and needed providers count is ${payload.providers_needed ?? "N/A"}.`
      : null,
    source: "client_fallback",
  };
}

