//
// *** DeliveryMaster V33.0 - מודול שירותי מפה ***
//
// מרכז את הלוגיקה של Leaflet (אייקונים) ו-Geocoding.
//

// --- Leaflet Icons (Exported) ---
// (Note: L needs to be available in the global scope where these are used)

// Driver Icons
export const driverIconActive = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] 
});

export const driverIconStuck = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] 
});

// Order Icons
export const orderIconNew = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41] 
});

// Alias for viewer app
export const orderIconActive = orderIconNew;

// Alias for customer tracking page
export const driverIcon = driverIconActive;
export const orderIcon = orderIconNew;

// Warehouse Icons
export const driverIconAvailable = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});

export const driverIconLoading = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png', 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});

export const driverIconInactive = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png', 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});

export const warehouseIcon = L.icon({ 
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', 
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', 
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] 
});


// --- Geocoding Function (Exported) ---

/**
 * Geocodes an address string using Nominatim (OpenStreetMap).
 * @param {string} address The address to geocode.
 * @returns {Promise<[number, number] | null>} A promise that resolves to [lat, lon] array or null.
 */
export async function geocodeAddress(address) {
    if (!address) return null;
    
    // Simple cache to avoid re-querying during the same session
    if (!window.geocodeCache) {
        window.geocodeCache = new Map();
    }
    if (window.geocodeCache.has(address)) {
        return window.geocodeCache.get(address);
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=il`;
    // console.log(`Geocoding address: ${address}`); // Use SmartLog if available, but keep this independent
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Nominatim API failed: ${response.status}`);
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const coords = [parseFloat(lat), parseFloat(lon)];
            // console.log(`Geocode success: [${lat}, ${lon}]`);
            window.geocodeCache.set(address, coords); // Cache result
            return coords;
        } else {
            // console.warn(`Geocode found no results for: ${address}`);
            window.geocodeCache.set(address, null); // Cache null result
            return null;
        }
    } catch (error) {
        console.error("Error in geocodeAddress:", error, { address });
        return null;
    }
}
