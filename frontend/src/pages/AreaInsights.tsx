import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Activity,
  MapPinned,
  Route,
  Gauge,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FlaskConical,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import PageSearchBar from "../components/PageSearchBar";
import ChartCard from "../components/ChartCard";
import RiskBadge from "../components/RiskBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import InsightAssistant from "../components/InsightAssistant";
import { useSelectedArea } from "../context/SelectedAreaContext";
import { getAreaDetails } from "../services/api";
import { SPECIALTY_TO_DISEASE } from "../data/mockData";
import type { Area, DiseaseMetric, Specialty } from "../types";

// Reverse map: Disease -> Specialty
const DISEASE_TO_SPECIALTY: Record<string, Specialty> = Object.fromEntries(
  Object.entries(SPECIALTY_TO_DISEASE).map(([sp, dis]) => [dis, sp as Specialty])
);

const FACTOR_LABELS: { key: keyof Area["riskFactors"]; label: string }[] = [
  { key: "demandPressure", label: "Demand Pressure" },
  { key: "providerShortage", label: "Provider Shortage" },
  { key: "travelDistance", label: "Distance" },
  { key: "utilization", label: "Utilization" },
];

// ---- colour helpers ---------------------------------------------------------
function riskColors(score: number) {
  if (score >= 85) return { border: "border-red-200", bg: "bg-red-50", bar: "bg-red-500", badge: "bg-red-100 text-red-700", actionCls: "bg-red-100 text-red-800 border border-red-200", label: "Critical" };
  if (score >= 65) return { border: "border-orange-200", bg: "bg-orange-50", bar: "bg-orange-400", badge: "bg-orange-100 text-orange-700", actionCls: "bg-orange-100 text-orange-800 border border-orange-200", label: "High" };
  if (score >= 40) return { border: "border-amber-200", bg: "bg-amber-50", bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700", actionCls: "bg-amber-100 text-amber-800 border border-amber-200", label: "Medium" };
  return { border: "border-emerald-200", bg: "bg-emerald-50", bar: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700", actionCls: "bg-emerald-100 text-emerald-800 border border-emerald-200", label: "Low" };
}

function providersNeeded(dm: DiseaseMetric): number {
  if (dm.riskScore >= 85) return Math.max(1, 5 - dm.providerSupply);
  if (dm.riskScore >= 65) return Math.max(1, 4 - dm.providerSupply);
  if (dm.riskScore >= 40) return Math.max(0, 3 - dm.providerSupply);
  return 0;
}

function actionText(dm: DiseaseMetric, isPrimary: boolean): string {
  const needed = providersNeeded(dm);
  const specialty = DISEASE_TO_SPECIALTY[dm.disease] ?? "Specialist";
  if (needed > 0 && (isPrimary || dm.riskScore >= 65)) {
    return `Recruit ${needed} ${specialty} provider${needed > 1 ? "s" : ""}${isPrimary ? " immediately" : ""}`;
  }
  if (dm.riskScore >= 40) return "Enhance care coordination & referral pathways";
  return "No immediate recruitment action required";
}

// ---- DiseaseActionCard component --------------------------------------------
function DiseaseActionCard({ dm, isPrimary }: { dm: DiseaseMetric; isPrimary: boolean }) {
  const colors = riskColors(dm.riskScore);
  const needed = providersNeeded(dm);
  const specialty = DISEASE_TO_SPECIALTY[dm.disease] ?? "Specialist";

  return (
    <div
      className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${
        isPrimary
          ? "border-brand-200 bg-brand-50/70"
          : `${colors.border} ${colors.bg}/50 bg-white`
      } shadow-sm`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              isPrimary ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-500"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold leading-tight truncate ${isPrimary ? "text-brand-900" : "text-slate-800"}`}>
              {dm.disease}
            </p>
            <p className="text-[11px] text-slate-500">{specialty}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.badge}`}>
            {colors.label}
          </span>
          {isPrimary && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide">
              Primary
            </span>
          )}
        </div>
      </div>

      {/* Risk bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Risk Score</span>
          <span className="font-bold text-slate-700">{dm.riskScore}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-white/70">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${dm.riskScore}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white bg-white/80 px-3 py-2">
          <p className="flex items-center gap-1 text-[10px] text-slate-500">
            <Stethoscope className="h-3 w-3" /> Supply
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-800">{dm.providerSupply}</p>
        </div>
        <div className="rounded-lg border border-white bg-white/80 px-3 py-2">
          <p className="flex items-center gap-1 text-[10px] text-slate-500">
            <AlertTriangle className="h-3 w-3" /> Demand
          </p>
          <p className="mt-0.5 text-base font-bold capitalize text-slate-800">{dm.demandLevel}</p>
        </div>
      </div>

      {/* Providers needed pill */}
      {needed > 0 ? (
        <div
          className={`mb-3 flex items-center gap-1.5 rounded-lg border px-3 py-2 ${
            isPrimary ? "border-brand-200 bg-brand-100" : "border-slate-200 bg-white"
          }`}
        >
          <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="text-[11px] text-slate-600">
            Providers needed:{" "}
            <span className="font-bold text-slate-800">{needed}</span>
          </span>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="text-[11px] font-medium text-emerald-700">Adequately staffed</span>
        </div>
      )}

      {/* Action line */}
      <p
        className={`rounded-lg px-3 py-2 text-[11px] font-semibold leading-snug ${
          isPrimary
            ? "bg-brand-600 text-white"
            : needed > 0
            ? colors.actionCls
            : "border border-emerald-200 bg-emerald-100 text-emerald-800"
        }`}
      >
        → {actionText(dm, isPrimary)}
      </p>
    </div>
  );
}

// ---- Main page --------------------------------------------------------------
export default function AreaInsights() {
  const navigate = useNavigate();
  const { selectedAreaId } = useSelectedArea();
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    if (!selectedAreaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getAreaDetails(selectedAreaId).then((a) => {
      setArea(a);
      setLoading(false);
    });
  }, [selectedAreaId]);

  const supplyDemandData = area
    ? [
        { name: "Current Supply", value: area.providerSupply },
        { name: "Recommended Supply", value: area.providerSupply + area.providersNeeded },
      ]
    : [];

  const travelBuckets = area
    ? [
        { range: "0-10 km", patients: Math.round(area.population * 0.00012) },
        { range: "10-20 km", patients: Math.round(area.population * 0.0002) },
        { range: "20-30 km", patients: Math.round(area.population * 0.00026) },
        { range: "30-40 km", patients: Math.round(area.population * (area.avgTravelDistanceKm > 25 ? 0.00034 : 0.00014)) },
        { range: "40+ km", patients: Math.round(area.population * (area.avgTravelDistanceKm > 30 ? 0.0002 : 0.00006)) },
      ]
    : [];

  const primaryDisease = area ? SPECIALTY_TO_DISEASE[area.primarySpecialty] : "";

  // Sort: primary first, then by descending risk score
  const sortedDiseases = area
    ? [...area.diseases].sort((a, b) => {
        if (a.disease === primaryDisease) return -1;
        if (b.disease === primaryDisease) return 1;
        return b.riskScore - a.riskScore;
      })
    : [];

  const needingAction = sortedDiseases.filter((dm) => providersNeeded(dm) > 0).length;
  const adequateCount = sortedDiseases.length - needingAction;

  return (
    <DashboardLayout title="Area Insights" subtitle="Detailed access analysis for a selected area">
      {loading ? (
        <LoadingState label="Loading area insights..." />
      ) : !area ? (
        <EmptyState
          icon={AlertCircle}
          title="No area selected"
          description="Choose an area from the Dashboard, Explore Network, or Recommendations to see its detailed access analysis here."
          action={
            <button
              onClick={() => navigate("/map")}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Open Explore Network
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <PageHeader
            eyebrow="Network Access Analysis"
            title={`${area.name}, ${area.state}`}
            description={`Last updated ${area.lastUpdated}`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <PageSearchBar />
                <RiskBadge level={area.riskLevel} score={area.riskScore} size="lg" />
              </div>
            }
          />

          {/* AI Insight Assistant */}
          <InsightAssistant
            requestPayload={{
              page_context: "Area Insights",
              area_name: area.name,
              state: area.state,
              risk_score: area.riskScore,
              risk_level: area.riskLevel,
              cluster_group: "Cluster #1 (High-Volume Access Gap Zone)",
              is_anomaly: area.riskScore >= 80,
              provider_supply: area.providerSupply,
              providers_needed: area.providersNeeded,
              primary_specialty: area.primarySpecialty,
              recommendation: `Recruit ${area.providersNeeded} ${area.primarySpecialty} provider(s) immediately to optimize network adequacy.`,
            }}
          />

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <MiniKpi icon={Users} label="Population" value={area.population.toLocaleString()} />
            <MiniKpi icon={Stethoscope} label="Provider Supply" value={String(area.providerSupply)} />
            <MiniKpi icon={Activity} label="Disease Demand" value={cap(area.demandLevel)} />
            <MiniKpi icon={MapPinned} label="Access Gap" value={cap(area.accessGap)} />
            <MiniKpi icon={Route} label="Avg. Travel Distance" value={`${area.avgTravelDistanceKm} km`} />
            <MiniKpi icon={Gauge} label="Network Adequacy" value={`${area.networkAdequacyPct}%`} />
          </div>

          {/* Root cause */}
          <ChartCard title="Why is this area at risk?" subtitle="Root cause analysis (prototype logic)">
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              High population demand combined with insufficient{" "}
              {area.primarySpecialty.toLowerCase()} provider supply and a{" "}
              {area.avgTravelDistanceKm} km average travel distance is creating a{" "}
              <span className="font-semibold text-navy-900">{area.accessGap}</span> provider access
              gap in this area.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FACTOR_LABELS.map((f) => (
                <div key={f.key} className="rounded-xl border border-surface-border p-3">
                  <p className="text-xs font-medium text-slate-500">{f.label}</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${area.riskFactors[f.key]}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs font-semibold text-navy-900">
                    {area.riskFactors[f.key]}%
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* ── Multi-disease Recommended Actions ─────────────────────────── */}
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            {/* Section header */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-900">
                    Recommended Actions — All Diseases
                  </p>
                  <p className="text-xs text-slate-500">
                    {needingAction} disease{needingAction !== 1 ? "s" : ""} require provider
                    recruitment · {adequateCount} adequately staffed
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/recommendations")}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View All Recommendations
                </button>
                <button
                  onClick={() => navigate("/what-if")}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-4 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  Run What-if Analysis
                </button>
              </div>
            </div>

            {/* Risk summary pills */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(["Critical", "High", "Medium", "Low"] as const).map((lvl) => {
                const count = sortedDiseases.filter(
                  (dm) => riskColors(dm.riskScore).label === lvl
                ).length;
                if (count === 0) return null;
                const cls: Record<string, string> = {
                  Critical: "border-red-200 bg-red-100 text-red-700",
                  High: "border-orange-200 bg-orange-100 text-orange-700",
                  Medium: "border-amber-200 bg-amber-100 text-amber-700",
                  Low: "border-emerald-200 bg-emerald-100 text-emerald-700",
                };
                return (
                  <span
                    key={lvl}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls[lvl]}`}
                  >
                    {count} {lvl}
                  </span>
                );
              })}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedDiseases.map((dm) => (
                <DiseaseActionCard
                  key={dm.disease}
                  dm={dm}
                  isPrimary={dm.disease === primaryDisease}
                />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Provider Supply vs. Demand"
              subtitle="Current vs. recommended provider count"
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={supplyDemandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f2" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #e4e9f2", fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#2f6ce8" radius={[6, 6, 0, 0]} barSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Travel Distance Distribution"
              subtitle="Estimated patients by distance band"
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={travelBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f2" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #e4e9f2", fontSize: 12 }}
                  />
                  <Bar dataKey="patients" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard
            title="Risk Factors"
            subtitle="Relative contribution to overall risk score"
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={FACTOR_LABELS.map((f) => ({ label: f.label, value: area.riskFactors[f.key] }))}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e9f2" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={130}
                  tick={{ fontSize: 11, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e4e9f2", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" name="Score" fill="#dc2626" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </DashboardLayout>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 shadow-card">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-navy-900">{value}</p>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
