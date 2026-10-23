import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, PhoneCall, ExternalLink, ShieldAlert, Building2, Pill, Stethoscope, AlertCircle, Compass } from 'lucide-react';
import { placesService, DEMO_FACILITIES } from '../../services/placesService';
import { HealthcareFacility } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const NearbyHealthcarePage: React.FC = () => {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>(DEMO_FACILITIES);
  const [category, setCategory] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchNearby = async (lat: number, lng: number, cat = category, query = searchQuery) => {
    setIsSearching(true);
    setErrorMsg(null);
    try {
      const results = await placesService.searchFacilities(lat, lng, cat, query);
      setFacilities(results);
    } catch (e: any) {
      setErrorMsg(e.message || 'Unable to retrieve facilities.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setErrorMsg(null);
    try {
      const pos = await placesService.getCurrentPosition();
      setUserCoords(pos);
      await fetchNearby(pos.lat, pos.lng, category, searchQuery);
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not access location.');
      // Keep demonstration results visible
    } finally {
      setIsLocating(false);
    }
  };

  const handleCategoryChange = (newCat: 'all' | 'hospital' | 'clinic' | 'pharmacy') => {
    setCategory(newCat);
    const baseLat = userCoords?.lat || 47.6083;
    const baseLng = userCoords?.lng || -122.3214;
    fetchNearby(baseLat, baseLng, newCat, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseLat = userCoords?.lat || 47.6083;
    const baseLng = userCoords?.lng || -122.3214;
    fetchNearby(baseLat, baseLng, category, searchQuery);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-5 h-5 text-red-600" />;
      case 'clinic':
        return <Stethoscope className="w-5 h-5 text-teal-600" />;
      case 'pharmacy':
        return <Pill className="w-5 h-5 text-emerald-600" />;
      default:
        return <Building2 className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Nearby Healthcare Facilities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Find certified hospitals, urgent care clinics, and 24/7 pharmacies with directions and rapid contact links
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDetectLocation}
          isLoading={isLocating}
          className="shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Use Device GPS</span>
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl p-4 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, street, or city (e.g. Seattle, Swedish, Walgreens)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {(['all', 'hospital', 'clinic', 'pharmacy'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-2.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Facilities' : cat + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities List Grid */}
      {facilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map(fac => (
            <Card key={fac.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getCategoryIcon(fac.type)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {fac.emergency_available && (
                      <span className="bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                        24/7 ER
                      </span>
                    )}
                    {fac.distance_km !== undefined && (
                      <span className="text-[11px] font-bold text-slate-400">
                        ~{fac.distance_km} km
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1">
                  {fac.name}
                </h3>

                <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{fac.address}</span>
                </p>

                {fac.opening_hours && (
                  <p className="text-[11px] text-teal-700 font-semibold mb-3">
                    Hours: {fac.opening_hours}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {fac.phone ? (
                  <a
                    href={`tel:${fac.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Clinic</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Directory phone</span>
                )}

                <a
                  href={placesService.getDirectionsUrl(fac.latitude, fac.longitude, fac.address)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-xs">
          No medical facilities found. Try broadening your search or switching categories.
        </Card>
      )}

      {/* Transparency Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Healthcare facilities are retrieved via OpenStreetMap / Overpass API and verified clinical directories. HerCare does not endorse private clinics or guarantee current emergency bed availability. In life-threatening emergencies, dial 911 / 112 directly.
        </p>
      </div>
    </div>
  );
};
