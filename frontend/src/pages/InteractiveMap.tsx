import { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/PageHeader";
import PageSearchBar from "../components/PageSearchBar";
import FilterPanel from "../components/FilterPanel";
import MapLegend from "../components/MapLegend";
import AreaPopup from "../components/AreaPopup";
import EmptyState from "../components/EmptyState";
import MapResizeHandler from "../components/MapResizeHandler";
import { AREAS, SPECIALTIES, STATES, SPECIALTY_TO_DISEASE, riskLevelFromScore } from "../data/mockData";
import { riskHex } from "../components/RiskBadge";
import type { DiseaseMetric, FilterState } from "../types";
import { MapPinOff } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  state: "All States",
  county: "All Counties",
  specialty: "All Specialties",
  riskLevel: "All",
};

const RISK_OPTIONS = ["All", "Low", "Medium", "High", "Critical"];

export default function InteractiveMap() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const countyOptions = useMemo(() => {
    const scoped =
      filters.state === "All States" ? AREAS : AREAS.filter((a) => a.state === filters.state);
    return ["All Counties", ...Array.from(new Set(scoped.map((a) => a.name))).sort()];
  }, [filters.state]);

  const filteredAreas = useMemo(() => {
    return AREAS.filter((a) => {
      if (filters.state !== "All States" && a.state !== filters.state) return false;
      
      // When a specific county is selected, prioritize displaying that county
      if (filters.county !== "All Counties") {
        return a.name === filters.county;
      }
      
      if (filters.specialty !== "All Specialties") {
        const targetDisease = SPECIALTY_TO_DISEASE[filters.specialty as keyof typeof SPECIALTY_TO_DISEASE];
        const matchesPrimary = a.primarySpecialty === filters.specialty;
        const matchesDisease = a.diseases?.some((dm: DiseaseMetric) => dm.disease === targetDisease);
        if (!matchesPrimary && !matchesDisease) return false;
      }

      if (filters.riskLevel !== "All") {
        const selectedRiskLower = filters.riskLevel.toLowerCase();
        const matchesOverall = a.riskLevel === selectedRiskLower;
        const matchesDiseaseRisk = a.diseases?.some((dm: DiseaseMetric) => riskLevelFromScore(dm.riskScore) === selectedRiskLower);
        if (!matchesOverall && !matchesDiseaseRisk) return false;
      }

      return true;
    });
  }, [filters]);

  function handleChange(key: string, value: string) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value } as FilterState;

      if (key === "state") {
        next.county = "All Counties";
      }

      if (key === "county" && value !== "All Counties") {
        const foundArea = AREAS.find((a) => a.name === value && (next.state === "All States" || a.state === next.state));
        if (foundArea) {
          if (next.state === "All States") {
            next.state = foundArea.state;
          }
          // Reset specialty filter if it doesn't match this county
          if (next.specialty !== "All Specialties" && foundArea.primarySpecialty !== next.specialty) {
            const targetDisease = SPECIALTY_TO_DISEASE[next.specialty as keyof typeof SPECIALTY_TO_DISEASE];
            const hasDiseaseMatch = foundArea.diseases?.some((dm: DiseaseMetric) => dm.disease === targetDisease);
            if (!hasDiseaseMatch) {
              next.specialty = "All Specialties";
            }
          }
          // Reset risk level filter if it doesn't match this county
          if (next.riskLevel !== "All" && foundArea.riskLevel !== next.riskLevel.toLowerCase()) {
            const selectedRiskLower = next.riskLevel.toLowerCase();
            const hasDiseaseRiskMatch = foundArea.diseases?.some((dm: DiseaseMetric) => riskLevelFromScore(dm.riskScore) === selectedRiskLower);
            if (!hasDiseaseRiskMatch) {
              next.riskLevel = "All";
            }
          }
        }
      }

      return next;
    });
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
  }

  const center: [number, number] = [37.5, -96];

  return (
    <DashboardLayout title="Explore Network" subtitle="Visualize provider availability, identify geographic access gaps, and pinpoint areas with the greatest network needs.">
      <PageHeader
        title="Provider Access & Risk Map"
        description="Visualize provider availability, identify geographic access gaps, and pinpoint areas with the greatest network needs."
        actions={<PageSearchBar />}
      />

      <div className="mb-4">
        <FilterPanel
          fields={[
            { key: "state", label: "State", options: ["All States", ...STATES] },
            { key: "county", label: "County", options: countyOptions },
            { key: "specialty", label: "Specialty", options: ["All Specialties", ...SPECIALTIES] },
            { key: "riskLevel", label: "Risk Level", options: RISK_OPTIONS },
          ]}
          values={filters as unknown as Record<string, string>}
          onChange={handleChange}
          onReset={handleReset}
          resultCount={filteredAreas.length}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-surface-border shadow-card">
        {filteredAreas.length === 0 ? (
          <EmptyState
            icon={MapPinOff}
            title="No areas match these filters"
            description="Try widening your filters — for example, choose a broader state or set risk level back to All."
            action={
              <button
                onClick={handleReset}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="relative h-[600px] w-full">
            <MapContainer center={center} zoom={4} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizeHandler />
              {filteredAreas.map((area) => (
                <CircleMarker
                  key={area.id}
                  center={[area.latitude, area.longitude]}
                  radius={9}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: riskHex(area.riskLevel),
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup minWidth={260} maxWidth={300}>
                    <AreaPopup area={area} />
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="pointer-events-none absolute bottom-4 left-4 z-[400]">
              <div className="pointer-events-auto">
                <MapLegend />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
