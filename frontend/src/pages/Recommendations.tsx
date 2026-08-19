import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  Lightbulb,
  Target,
  Users2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Stethoscope,
  Eye,
  FlaskConical,
  PhoneCall,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import PageSearchBar from "../components/PageSearchBar";
import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import FilterPanel from "../components/FilterPanel";
import { XaiRecruitmentModal } from "../components/XaiRecruitmentModal";
import { getRecommendationsData } from "../services/api";
import { useSelectedArea } from "../context/SelectedAreaContext";
import { SPECIALTIES, STATES, SPECIALTY_TO_DISEASE } from "../data/mockData";
import type { DiseaseMetric, Recommendation, RecommendationSummary } from "../types";

type SortKey = "expectedImpactScore" | "riskScore" | "providersNeeded" | "avgTravelDistanceKm";

const IMPACT_TONE = { low: "warning", medium: "warning", high: "positive" } as const;
const DEMAND_TONE = { low: "neutral", medium: "warning", high: "negative" } as const;

const RISK_OPTIONS = ["All", "Low", "Medium", "High", "Critical"];

function riskColor(score: number): { bg: string; text: string; bar: string } {
  if (score >= 85) return { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" };
  if (score >= 65) return { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-400" };
  if (score >= 40) return { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-400" };
  return { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-400" };
}

function riskLevelLabel(score: number): string {
  if (score >= 85) return "Critical";
  if (score >= 65) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function diseaseAction(dm: DiseaseMetric, primarySpecialty: string, primaryDisease: string): string {
  if (dm.disease === primaryDisease) {
    const n = Math.max(1, Math.round(dm.riskScore / 20));
    return `Recruit ${n} ${primarySpecialty} provider${n > 1 ? "s" : ""}`;
  }
  if (dm.riskScore >= 65) return "Expand specialist referral network";
  if (dm.riskScore >= 40) return "Monitor — consider care coordination";
  return "No immediate action required";
}

interface RecFilters {
  state: string;
  specialty: string;
  riskLevel: string;
}

function DiseaseActionsPanel({
  rec,
  onView,
  onSimulate,
  onExplainXai,
}: {
  rec: Recommendation;
  onView: () => void;
  onSimulate: () => void;
  onExplainXai: () => void;
}) {
  const primaryDisease =
    (SPECIALTY_TO_DISEASE as Record<string, string>)[rec.specialty] ?? "";

  const sorted = [...rec.diseases].sort((a, b) => {
    if (a.disease === primaryDisease) return -1;
    if (b.disease === primaryDisease) return 1;
    return b.riskScore - a.riskScore;
  });

  return (
    <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Disease-Level Actions — {rec.areaName}, {rec.state}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sorted.map((dm) => {
          const colors = riskColor(dm.riskScore);
          const isPrimary = dm.disease === primaryDisease;
          const action = diseaseAction(dm, rec.specialty, primaryDisease);

          return (
            <div
              key={dm.disease}
              className={`rounded-xl border p-3 ${isPrimary ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"} shadow-sm`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Activity
                    className={`h-3.5 w-3.5 shrink-0 ${isPrimary ? "text-brand-600" : "text-slate-400"}`}
                  />
                  <p className={`text-xs font-semibold leading-tight ${isPrimary ? "text-brand-800" : "text-slate-700"}`}>
                    {dm.disease}
                    {isPrimary && (
                      <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide">
                        Primary
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colors.bg} ${colors.text}`}
                >
                  {riskLevelLabel(dm.riskScore)}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span>Risk Score</span>
                  <span className="font-semibold">{dm.riskScore}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${colors.bar}`}
                    style={{ width: `${dm.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="mb-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] text-slate-500">
                    Supply: <span className="font-semibold text-slate-700">{dm.providerSupply}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] text-slate-500">
                    Demand:{" "}
                    <span className="font-semibold text-slate-700 capitalize">{dm.demandLevel}</span>
                  </span>
                </div>
              </div>

              <p
                className={`text-[10px] leading-snug font-medium rounded-md px-2 py-1.5 ${
                  isPrimary ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                → {action}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onExplainXai}
          className="flex items-center gap-1.5 rounded-lg bg-[#526D5B] hover:bg-[#435B4B] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
        >
          <BrainCircuit className="h-3.5 w-3.5 text-[#A2BAA9]" />
          Explain with XAI
        </button>
        <button
          onClick={onView}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View Area Insights
        </button>
        <button
          onClick={onSimulate}
          className="flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Run What-if Analysis
        </button>
        <button
          onClick={() => window.location.href = '/alerts'}
          className="flex items-center gap-1.5 rounded-lg border border-[#526D5B] bg-[#EBF0EA] px-4 py-2 text-xs font-bold text-[#526D5B] hover:bg-[#D9E2D5] transition-colors"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Dispatch Voice / SMS Alert
        </button>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { setSelectedAreaId } = useSelectedArea();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [items, setItems] = useState<Recommendation[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("expectedImpactScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<RecFilters>({
    state: "All States",
    specialty: "All Specialties",
    riskLevel: "All",
  });
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [xaiArea, setXaiArea] = useState<Recommendation | null>(null);

  useEffect(() => {
    getRecommendationsData().then((data) => {
      setSummary(data.summary);
      setItems(data.items);
      setLoading(false);
    });
  }, []);

  const filteredSorted = useMemo(() => {
    let rows = items;
    if (filters.state !== "All States") rows = rows.filter((r) => r.state === filters.state);
    if (filters.specialty !== "All Specialties")
      rows = rows.filter((r) => r.specialty === filters.specialty);
    if (filters.riskLevel !== "All") {
      rows = rows.filter(
        (r) => riskLevelFromScore(r.riskScore) === filters.riskLevel.toLowerCase()
      );
    }
    rows = [...rows].sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );
    return rows;
  }, [items, filters, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function goToArea(areaId: string) {
    setSelectedAreaId(areaId);
    navigate("/area-insights");
  }

  function goToSimulate(areaId: string) {
    setSelectedAreaId(areaId);
    navigate("/what-if");
  }

  function toggleExpand(areaId: string) {
    setExpandedAreaId((prev) => (prev === areaId ? null : areaId));
  }

  const sortHeader = (label: string, key: SortKey) => (
    <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-navy-900">
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <DashboardLayout title="Recommendations" subtitle="Where to recruit providers next">
      <PageHeader
        eyebrow="Recruitment Strategy"
        title="Provider Recruitment Recommendations"
        description="Prioritized list of counties and specialties where adding providers will have the greatest expected impact on access."
        actions={<PageSearchBar />}
      />

      {loading || !summary ? (
        <LoadingState label="Loading recommendations..." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={Target}
              label="Critical Recruitment Areas"
              value={String(summary.criticalRecruitmentAreas)}
              helperText="Requiring immediate action"
              accent="risk"
            />
            <KpiCard
              icon={Users2}
              label="Total Providers Recommended"
              value={String(summary.totalProvidersRecommended)}
              helperText="Across all flagged areas"
            />
            <KpiCard
              icon={TrendingUp}
              label="Highest Risk"
              value={`${summary.highestRiskPct}%`}
              helperText="Top-priority area"
              accent="risk"
            />
            <KpiCard
              icon={Lightbulb}
              label="Potential Access Improvement"
              value={`${summary.potentialAccessImprovementPct}%`}
              helperText="If recommendations are applied"
            />
          </div>

          <FilterPanel
            fields={[
              { key: "state", label: "State", options: ["All States", ...STATES] },
              { key: "specialty", label: "Specialty", options: ["All Specialties", ...SPECIALTIES] },
              { key: "riskLevel", label: "Risk Level", options: RISK_OPTIONS },
            ]}
            values={filters as unknown as Record<string, string>}
            onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onReset={() =>
              setFilters({ state: "All States", specialty: "All Specialties", riskLevel: "All" })
            }
            resultCount={filteredSorted.length}
          />

          <ChartCard
            title="Recruitment Priority Table"
            subtitle="Sorted by Expected Impact — click a column to re-sort · Click 'Explain with XAI' for Shapley feature attribution breakdowns"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="w-14 pb-3 pr-3 text-xs font-semibold text-slate-500">Rank</th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">County</th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">State</th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">Specialty</th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">
                      {sortHeader("Risk Score", "riskScore")}
                    </th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">
                      Current Providers
                    </th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">
                      {sortHeader("Providers Needed", "providersNeeded")}
                    </th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">Demand</th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">
                      {sortHeader("Travel Distance", "avgTravelDistanceKm")}
                    </th>
                    <th className="pb-3 pr-3 text-xs font-semibold text-slate-500">
                      {sortHeader("Expected Impact", "expectedImpactScore")}
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((r, idx) => {
                    const isExpanded = expandedAreaId === r.areaId;
                    return (
                      <React.Fragment key={r.areaId}>
                        <tr
                          className={`border-b border-slate-50 transition-colors ${
                            isExpanded ? "bg-brand-50/40" : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="py-3 pr-3 text-xs font-medium text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 pr-3 font-semibold text-navy-900">{r.areaName}</td>
                          <td className="py-3 pr-3 text-slate-600">{r.state}</td>
                          <td className="py-3 pr-3 text-slate-600">{r.specialty}</td>
                          <td className="py-3 pr-3 text-slate-700">{r.riskScore}%</td>
                          <td className="py-3 pr-3 text-slate-600">{r.currentProviders}</td>
                          <td className="py-3 pr-3 font-semibold text-slate-800">
                            {r.providersNeeded}
                          </td>
                          <td className="py-3 pr-3">
                            <StatusBadge label={cap(r.demand)} tone={DEMAND_TONE[r.demand]} />
                          </td>
                          <td className="py-3 pr-3 text-slate-600">
                            {r.avgTravelDistanceKm} km
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                label={cap(r.expectedImpact)}
                                tone={IMPACT_TONE[r.expectedImpact]}
                              />
                              <span className="text-xs text-slate-400">{r.expectedImpactScore}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => setXaiArea(r)}
                              className="inline-flex items-center gap-1 rounded-md bg-[#526D5B] hover:bg-[#435B4B] px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                            >
                              <BrainCircuit className="h-3 w-3 text-[#A2BAA9]" />
                              Explain XAI
                            </button>
                            <button
                              onClick={() => toggleExpand(r.areaId)}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                isExpanded
                                  ? "border-brand-300 bg-brand-600 text-white hover:bg-brand-700"
                                  : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  Hide Actions <ChevronUp className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  View Actions <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={11} className="p-0">
                              <DiseaseActionsPanel
                                rec={r}
                                onView={() => goToArea(r.areaId)}
                                onSimulate={() => goToSimulate(r.areaId)}
                                onExplainXai={() => setXaiArea(r)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {filteredSorted.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-400">
                  No recommendations match the current filters.
                </div>
              )}
            </div>
          </ChartCard>

          {/* XAI Recommendation Modal */}
          {xaiArea && (
            <XaiRecruitmentModal
              isOpen={!!xaiArea}
              onClose={() => setXaiArea(null)}
              areaName={xaiArea.areaName}
              state={xaiArea.state}
              specialty={xaiArea.specialty}
              riskScore={xaiArea.riskScore}
              currentProviders={xaiArea.currentProviders}
              providersNeeded={xaiArea.providersNeeded}
              avgTravelDistanceKm={xaiArea.avgTravelDistanceKm}
              onDispatchAlert={() => {
                setXaiArea(null);
                navigate("/alerts");
              }}
              onRunWhatIf={() => {
                const id = xaiArea.areaId;
                setXaiArea(null);
                goToSimulate(id);
              }}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function riskLevelFromScore(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
