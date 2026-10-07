import { useCallback, useState } from "react";
import { Loader2, Navigation, RotateCcw } from "lucide-react";
import { geocode, parseLatLngInput } from "./tripEngine";
import LocationPicker from "./LocationPicker";
import TripMap from "./TripMap";
import PlanResult from "./PlanResult";

export default function TripPlanner({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onPlan,
  planning,
  result,
  currentBattery,
  onEditVehicle,
}) {
  const [originQuery, setOriginQuery] = useState(origin?.name || "");
  const [destQuery, setDestQuery] = useState(destination?.name || "");
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [mapSelectMode, setMapSelectMode] = useState(null);

  const applyOrigin = (pos) => {
    onOriginChange(pos);
    setOriginQuery(pos.name);
    setOriginResults([]);
    setMapSelectMode(null);
  };

  const applyDest = (pos) => {
    onDestinationChange(pos);
    setDestQuery(pos.name);
    setDestResults([]);
    setMapSelectMode(null);
  };

  const tryApplyCoords = (query, apply) => {
    const coords = parseLatLngInput(query);
    if (!coords) return false;
    apply(coords);
    return true;
  };

  const resolveQuery = async (query, apply) => {
    if (tryApplyCoords(query, apply)) return;
    if (!query || query.length < 2) return;
    const res = await geocode(query);
    if (res[0] && res.length === 1) apply(res[0]);
    return res;
  };

  const searchOrigin = async () => {
    setSearchingOrigin(true);
    const res = await resolveQuery(originQuery, applyOrigin);
    if (Array.isArray(res)) setOriginResults(res);
    setSearchingOrigin(false);
  };

  const searchDest = async () => {
    setSearchingDest(true);
    const res = await resolveQuery(destQuery, applyDest);
    if (Array.isArray(res)) setDestResults(res);
    setSearchingDest(false);
  };

  const handleGetLocation = (target) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        name: "موقعیت فعلی شما",
      };
      if (target === "origin") applyOrigin(p);
      else applyDest(p);
    });
  };

  const onPickPoint = useCallback(
    (pos) => {
      if (mapSelectMode === "origin") applyOrigin(pos);
      else applyDest(pos);
    },
    [mapSelectMode],
  );

  const canPlan = Boolean(origin && destination);

  return (
    <div className="routes-page flex flex-col overflow-hidden">
      <TripMap
        origin={origin}
        destination={destination}
        result={result}
        mapSelectMode={mapSelectMode}
        onPickPoint={onPickPoint}
      />

      <div className="z-10 flex min-h-0 flex-shrink-0 flex-col overflow-hidden border-t border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Navigation size={17} color="#2ECC71" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              برنامه‌ریزی مسیر
            </span>
          </div>
          <button
            type="button"
            onClick={onEditVehicle}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <RotateCcw size={13} /> ویرایش اطلاعات
          </button>
        </div>

        <div className="max-h-[35vh] space-y-3 mb-5 overflow-y-auto p-4">
          <LocationPicker
            label="مبدا سفر"
            query={originQuery}
            onQueryChange={(v) => {
              setOriginQuery(v);
              setOriginResults([]);
              const coords = parseLatLngInput(v);
              if (coords) onOriginChange(coords);
            }}
            onSearch={searchOrigin}
            searching={searchingOrigin}
            results={originResults}
            onSelectResult={applyOrigin}
            selected={origin}
            onUseMyLocation={() => handleGetLocation("origin")}
            onPickOnMap={() => setMapSelectMode("origin")}
            placeholder="جستجو آدرس یا lat,lng"
          />
          <LocationPicker
            label="مقصد سفر"
            query={destQuery}
            onQueryChange={(v) => {
              setDestQuery(v);
              setDestResults([]);
              const coords = parseLatLngInput(v);
              if (coords) onDestinationChange(coords);
            }}
            onSearch={searchDest}
            searching={searchingDest}
            results={destResults}
            onSelectResult={applyDest}
            selected={destination}
            selectedColor="red"
            onPickOnMap={() => setMapSelectMode("dest")}
            placeholder="جستجو آدرس یا lat,lng"
          />
          <PlanResult result={result} currentBattery={currentBattery} />
          <div className=" border-t p-3 dark:border-gray-700 dark:bg-gray-800 mb-10">
            <button
              type="button"
              onClick={onPlan}
              disabled={!canPlan || planning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-5 mb-10 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "#2ECC71", fontFamily: "Vazirmatn" }}
            >
              {planning ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> در حال
                  محاسبه...
                </>
              ) : (
                <>
                  <Navigation size={16} /> محاسبه بهینه‌ترین مسیر
                </>
              )}
            </button>
            {!canPlan && (
              <p className="mt-2 text-center text-[11px] text-gray-400">
                مبدا و مقصد را مشخص کنید تا دکمه محاسبه فعال شود
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
