import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Gauge, TrendingDown, Users, Sparkles } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceDot,
} from "recharts";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import PageSearchBar from "../components/PageSearchBar";
import ChartCard from "../components/ChartCard";
import { useSelectedArea } from "../context/SelectedAreaContext";
import { AREAS, SPECIALTIES } from "../data/mockData";
import { getWhatIfPrediction } from "../services/api";
import type { Specialty, WhatIfResult } from "../types";

export default function WhatIfSimulator() {
  const { selectedAreaId, setSelectedAreaId } = useSelectedArea();
  const initialArea = AREAS.find((a) => a.id === selectedAreaId) ?? AREAS[0];

  const [areaId, setAreaId] = useState(initialArea.id);
  const [specialty, setSpecialty] = useState<Specialty>(initialArea.primarySpecialty);
  const [providersToAdd, setProvidersToAdd] = useState(0);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  const currentArea = useMemo(() => AREAS.find((a) => a.id === areaId) ?? AREAS[0], [areaId]);

  useEffect(() => {
    setSelectedAreaId(areaId);
  }, [areaId, setSelectedAreaId]);

  useEffect(() => {
    let active = true;
    getWhatIfPrediction(areaId, specialty, providersToAdd).then((r) => {
      if (active) setResult(r);
    });
    return () => {
      active = false;
    };
  }, [areaId, specialty, providersToAdd]);

  function handleAreaChange(id: string) {
    const area = AREAS.find((a) => a.id === id);
    setAreaId(id);
    if (area) setSpecialty(area.primarySpecialty);
    setProvidersToAdd(0);
  }

  const gapLabel = (level: string) => level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <DashboardLayout title="What-if Simulator" subtitle="Simulate the impact of adding providers">
      <PageHeader
        eyebrow="Provider Recruitment"
        title="What-if Simulator"
        description="Test how adding providers to a specialty in a given area would change access risk."
        actions={<PageSearchBar />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls */}
        <div className="space-y-4 lg:col-span-1">
          <ChartCard title="Select Scenario" subtitle="Choose an area and specialty to simulate">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Select Area</span>
                <select
                  value={areaId}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}, {a.state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Select Specialty</span>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as Specialty)}
                  className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl bg-surface p-3">
                <p className="text-xs font-medium text-slate-500">Current Providers</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{currentArea.providerSupply}</p>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-slate-500">Providers to Add</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProvidersToAdd((n) => Math.max(0, n - 1))}
                    aria-label="Decrease providers to add"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-navy-900 hover:bg-surface disabled:opacity-40"
                    disabled={providersToAdd === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={providersToAdd}
                      onChange={(e) => setProvidersToAdd(Number(e.target.value))}
                      className="w-full accent-brand-600"
                      aria-label="Providers to add"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProvidersToAdd((n) => Math.min(5, n + 1))}
                    aria-label="Increase providers to add"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-navy-900 hover:bg-surface disabled:opacity-40"
                    disabled={providersToAdd === 5}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-3xl font-bold text-brand-700">{providersToAdd}</p>
              </div>
            </div>
          </ChartCard>

          {result && (
            <ChartCard title="Current Situation" subtitle="Baseline before simulation">
              <dl className="space-y-2 text-sm">
                <Row label="Area" value={`${result.areaName}, ${result.state}`} />
                <Row label="Specialty" value={result.specialty} />
                <Row label="Current Providers" value={String(result.currentProviders)} />
                <Row label="Risk Score" value={`${result.currentRiskScore}%`} />
                <Row label="Access Gap" value={gapLabel(currentArea.accessGap)} />
              </dl>
            </ChartCard>
          )}
        </div>

        {/* Results */}
        <div className="flex h-full flex-col gap-6 lg:col-span-2">
          {result && (
            <>
              <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-4">
                <ResultCard icon={Gauge} label="Current Risk" value={`${result.currentRiskScore}%`} tone="neutral" />
                <ResultCard
                  icon={TrendingDown}
                  label="Predicted Risk"
                  value={`${result.predictedRiskScore}%`}
                  tone="positive"
                />
                <ResultCard
                  icon={Sparkles}
                  label="Access Improvement"
                  value={`${result.accessImprovementPct}%`}
                  tone="positive"
                />
                <ResultCard icon={Users} label="New Provider Count" value={String(result.newProviderCount)} tone="neutral" />
              </div>

              <ChartCard
                title="Predicted Risk vs. Providers Added"
                subtitle="Diminishing returns as more providers are added"
                className="flex flex-1 flex-col"
              >
                <div className="min-h-[280px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      key={`${areaId}-${specialty}`}
                      data={result.curve}
                      margin={{ left: -10, right: 20, top: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f2" />
                      <XAxis
                        dataKey="providersAdded"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: "Additional Providers", position: "insideBottom", offset: -4, fontSize: 11, fill: "#94a3b8" }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: "Predicted Risk Score", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }}
                      />
                      <Tooltip
                        formatter={(v) => [`${Number(v)}%`, "Predicted risk"]}
                        labelFormatter={(l) => `+${l} providers`}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e4e9f2", fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="predictedRiskScore" stroke="#2f6ce8" strokeWidth={2.5} dot={{ r: 3 }} />
                      <ReferenceDot
                        x={providersToAdd}
                        y={result.predictedRiskScore}
                        r={7}
                        fill="#dc2626"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-semibold text-navy-900">{value}</dd>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  tone: "neutral" | "positive";
}) {
  const iconTone = tone === "positive" ? "bg-risk-lowbg text-risk-low" : "bg-brand-100 text-brand-700";
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconTone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
