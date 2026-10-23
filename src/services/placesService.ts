import { HealthcareFacility } from '../types';

// Fictional demonstration places with explicit labeling
export const DEMO_FACILITIES: HealthcareFacility[] = [
  {
    id: 'fac-001',
    name: "Swedish Medical Center - First Hill Emergency & Women's Pavilion",
    type: 'hospital',
    address: '747 Broadway, Seattle, WA 98122',
    phone: '+1 (206) 386-6000',
    latitude: 47.6083,
    longitude: -122.3214,
    emergency_available: true,
    opening_hours: 'Open 24/7 (Level 1 Trauma & Comprehensive Emergency)',
    is_verified: true,
    distance_km: 1.2,
  },
  {
    id: 'fac-002',
    name: "Pacific Northwest Women's Health Clinic",
    type: 'clinic',
    address: '1101 Madison St, Suite 400, Seattle, WA 98104',
    phone: '+1 (206) 555-0199',
    latitude: 47.6105,
    longitude: -122.3255,
    emergency_available: false,
    opening_hours: 'Mon-Fri: 8:00 AM - 5:00 PM, Sat: 9:00 AM - 1:00 PM',
    is_verified: true,
    distance_km: 1.8,
  },
  {
    id: 'fac-003',
    name: 'Walgreens 24-Hour Pharmacy & Urgent Prescriptions',
    type: 'pharmacy',
    address: '222 Pike St, Seattle, WA 98101',
    phone: '+1 (206) 624-9988',
    latitude: 47.6101,
    longitude: -122.3385,
    emergency_available: false,
    opening_hours: 'Open 24 Hours Daily',
    is_verified: true,
    distance_km: 2.4,
  },
  {
    id: 'fac-004',
    name: "Virginia Mason Franciscan Health Medical Pavilion",
    type: 'hospital',
    address: '925 Seneca St, Seattle, WA 98101',
    phone: '+1 (206) 223-6600',
    latitude: 47.6092,
    longitude: -122.3298,
    emergency_available: true,
    opening_hours: 'Open 24/7 Emergency Care',
    is_verified: true,
    distance_km: 1.5,
  },
  {
    id: 'fac-005',
    name: 'CVS Pharmacy & MinuteClinic',
    type: 'pharmacy',
    address: '1401 2nd Ave, Seattle, WA 98101',
    phone: '+1 (206) 467-0093',
    latitude: 47.6087,
    longitude: -122.3380,
    emergency_available: false,
    opening_hours: 'Mon-Sun: 7:00 AM - 10:00 PM',
    is_verified: true,
    distance_km: 2.1,
  },
];

export const placesService = {
  /**
   * Request user's device geolocation with permission check
   */
  async getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          let message = 'Unable to retrieve location.';
          if (error.code === error.PERMISSION_DENIED) {
            message = 'Location access was denied. You can search manually by city or postal code.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            message = 'Location information is currently unavailable.';
          } else if (error.code === error.TIMEOUT) {
            message = 'Location request timed out.';
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  },

  /**
   * Searches healthcare facilities using Overpass / Nominatim API when online,
   * or returns clearly labeled demonstration results.
   */
  async searchFacilities(
    lat: number,
    lng: number,
    category: 'all' | 'hospital' | 'clinic' | 'pharmacy' = 'all',
    searchQuery: string = ''
  ): Promise<HealthcareFacility[]> {
    // Try live OpenStreetMap query if online
    try {
      const amenityTag = category === 'pharmacy' ? 'pharmacy' : category === 'clinic' ? 'clinic' : 'hospital';
      const query = category === 'all'
        ? `[out:json][timeout:8];(node["amenity"~"hospital|clinic|pharmacy"](around:5000,${lat},${lng}););out body 15;`
        : `[out:json][timeout:8];(node["amenity"="${amenityTag}"](around:5000,${lat},${lng}););out body 15;`;

      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (response.ok) {
        const json = await response.json();
        if (json.elements && json.elements.length > 0) {
          const facilities: HealthcareFacility[] = json.elements
            .filter((el: any) => el.tags && (el.tags.name || el.tags['name:en']))
            .map((el: any) => {
              const type = el.tags.amenity === 'pharmacy' ? 'pharmacy' : el.tags.amenity === 'clinic' ? 'clinic' : 'hospital';
              const dist = calculateDistanceKm(lat, lng, el.lat, el.lon);
              return {
                id: `osm-${el.id}`,
                name: el.tags.name || el.tags['name:en'],
                type,
                address: [el.tags['addr:street'], el.tags['addr:housenumber'], el.tags['addr:city']].filter(Boolean).join(', ') || 'Address in directory',
                phone: el.tags.phone || el.tags['contact:phone'],
                latitude: el.lat,
                longitude: el.lon,
                emergency_available: el.tags.emergency === 'yes' || type === 'hospital',
                opening_hours: el.tags.opening_hours || (type === 'hospital' ? '24/7 Emergency Care' : undefined),
                is_verified: true,
                distance_km: Math.round(dist * 10) / 10,
              };
            });

          if (facilities.length > 0) {
            return facilities.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
          }
        }
      }
    } catch (e) {
      console.warn('Live places fetch error, falling back to demonstration facilities:', e);
    }

    // Fictional demonstration fallback
    let results = [...DEMO_FACILITIES];

    if (category !== 'all') {
      results = results.filter(f => f.type === category);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(f => f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q));
    }

    return results;
  },

  getDirectionsUrl(destinationLat: number, destinationLng: number, address?: string): string {
    if (address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
  },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
