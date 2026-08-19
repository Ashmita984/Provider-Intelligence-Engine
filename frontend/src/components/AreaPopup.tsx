import { useNavigate } from "react-router-dom";
import type { Area, RiskLevel } from "../types";
import RiskBadge, { riskHex } from "./RiskBadge";
import { useSelectedArea } from "../context/SelectedAreaContext";

interface AreaPopupProps {
  area: Area;
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export default function AreaPopup({ area }: AreaPopupProps) {
  const navigate = useNavigate();
  const { setSelectedAreaId } = useSelectedArea();

  return (
    <div className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-navy-900">{area.name}</p>
          <p className="text-xs text-slate-400">{area.state}</p>
        </div>
        <RiskBadge level={area.riskLevel} size="sm" />
      </div>
      <dl className="mt-3 grid grid-[#2 gap-y-2 text-xs">
        <dt className="text-slate-400">Population</dt>
        <dd className="text-right font-semibold text-navy-900">{area.population.toLocaleString()}</dd>
        <dt className="text-slate-400">Providers</dt>
        <dd className="text-right font-semibold text-navy-900">{area.providerSupply}</dd>
        <dt className="text-slate-400">Risk Score</dt>
        <dd className="text-right font-semibold text-navy-900">{area.riskScore}%</dd>
        <dt className="text-slate-400">Access Gap</dt>
        <dd className="text-right font-semibold capitalize text-navy-900">{area.accessGap}</dd>
      </dl>

      <div className="mt-3 border-t border-surface-border pt-2">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Diseases in {area.name}
        </p>
        <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
          {area.diseases.map((d) => {
            const level = riskLevelFromScore(d.riskScore);
            return (
              <li key={d.disease} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-navy-900">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: riskHex(level) }} />
                  <span className="truncate">{d.disease}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-slate-500">
                  Risk {d.riskScore}% · {d.providerSupply} providers
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedAreaId(area.id);
            navigate("/area-insights");
          }}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="flex-1 rounded-lg border border-[#526D5B] bg-[#EBF0EA] px-3 py-2 text-xs font-bold text-[#526D5B] hover:bg-[#D9E2D5]"
        >
          Send Alert
        </button>
      </div>
    </div>
  );
}
