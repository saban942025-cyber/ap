// shared/map-utils.js - v33.0

// ייבוא Leaflet (בהנחה שהוא נטען גלובלית דרך CDN בקובץ ה-HTML)
// אם תעבור לניהול תלויות מקומי, תצטרך לייבא אותו כאן: import L from 'leaflet';

import { SmartLog } from './firebase-init.js'; // ייבוא SmartLog לרישום שגיאות

// --- קבועים ---
export const ISRAEL_CENTER = [32.0853, 34.7818];
export const WAREHOUSE_LOCATIONS = {
    "החרש": [32.13266165049073, 34.898196599998755],
    "התלמיד": [32.16303427408473, 34.894926705310006]
};

// --- הגדרות אייקונים (Icons) ---
// ניתן להגדיר פה את כל האייקונים פעם אחת ולייצא אותם
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

export const driverIconLoading = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41]
});

export const driverIconInactive = L.icon({ // אייקון נוסף לא פעיל
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41]
});

export const orderIconNew = L.icon({ // שונה ל- orderIconActive
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41]
});

export const warehouseIcon = L.icon({ // אייקון למחסן
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', // נשתמש באדום למחסן
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', shadowSize: [41, 41]
});


// --- אתחול מפה ---
/**
 * מאתחל מפת Leaflet בתוך אלמנט HTML נתון.
 * @param {string} mapElementId - ה-ID של אלמנט ה-div שיכיל את המפה.
 * @param {Array<number>} [center=ISRAEL_CENTER] - מרכז המפה ההתחלתי [lat, lng].
 * @param {number} [zoom=9] - רמת הזום ההתחלתית.
 * @returns {L.Map|null} - מחזיר את אובייקט המפה של Leaflet או null במקרה של שגיאה.
 */
export function initMap(mapElementId, center = ISRAEL_CENTER, zoom = 9) {
    try {
        const mapElement = document.getElementById(mapElementId);
        if (!mapElement) {
            throw new Error(`Map container #${mapElementId} not found`);
        }
        // הסרת מפה קיימת אם יש (למקרה של ריענון חלקי)
        if (window[`${mapElementId}_mapInstance`]) {
            window[`${mapElementId}_mapInstance`].remove();
        }

        const map = L.map(mapElementId).setView(center, zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // שמירת רפרנס למפה בחלון הגלובלי (או החזרה ישירה)
        window[`${mapElementId}_mapInstance`] = map;
        SmartLog.info(`Map initialized in #${mapElementId}`, "Map.Init");
        return map;
    } catch (error) {
        SmartLog.error(error, "Map.Init", { mapElementId });
        const mapEl = document.getElementById(mapElementId);
        if (mapEl) mapEl.innerHTML = `<div class="p-4 text-center text-red-500">שגיאה בטעינת המפה.</div>`;
        return null;
    }
}

// --- Geocoding ---
/**
 * ממיר כתובת לקואורדינטות (lat, lng) באמצעות שירות Nominatim.
 * @param {string} address - הכתובת לחיפוש.
 * @returns {Promise<Array<number>|null>} - מחזיר מערך [lat, lng] או null אם נכשל/לא נמצא.
 */
export async function geocodeAddress(address) {
    if (!address) return null;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=il`;
    SmartLog.info(`Geocoding address: ${address}`, "Geocode.Nominatim");
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Nominatim API failed: ${response.status}`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const coords = [parseFloat(lat), parseFloat(lon)];
            SmartLog.info(`Geocode success: [${coords[0]}, ${coords[1]}]`, "Geocode.Nominatim");
            return coords;
        } else {
            SmartLog.warn(`Geocode found no results for: ${address}`, "Geocode.Nominatim");
            return null;
        }
    } catch (error) {
        SmartLog.error(error, "Geocode.Nominatim", { address });
        return null;
    }
}

// --- פונקציות עזר נוספות למפה (אופציונלי) ---

/**
 * מעדכן או יוצר סמן (Marker) על המפה.
 * @param {L.Map} mapInstance - אובייקט המפה.
 * @param {Object} markersObject - אובייקט שמחזיק את הסמנים הקיימים (לפי ID).
 * @param {string} itemId - ה-ID של הפריט (נהג/הזמנה).
 * @param {Array<number>} latLng - הקואורדינטות [lat, lng].
 * @param {L.Icon} icon - האייקון של הסמן.
 * @param {string} popupContent - תוכן ה-HTML לחלון הקופץ.
 * @param {Function} [onClickHandler=null] - פונקציה שתופעל בלחיצה על הסמן.
 */
export function updateMarker(mapInstance, markersObject, itemId, latLng, icon, popupContent, onClickHandler = null) {
    if (!mapInstance || !latLng || !latLng[0] || !latLng[1]) return;

    if (markersObject[itemId]) {
        // עדכון סמן קיים
        markersObject[itemId].setLatLng(latLng).setIcon(icon).setPopupContent(popupContent);
    } else {
        // יצירת סמן חדש
        markersObject[itemId] = L.marker(latLng, { icon })
            .addTo(mapInstance)
            .bindPopup(popupContent);
        if (onClickHandler) {
            markersObject[itemId].on('click', () => onClickHandler(itemId));
        }
    }
}

/**
 * מסיר סמנים ישנים מהמפה ומאובייקט הסמנים.
 * @param {L.Map} mapInstance - אובייקט המפה.
 * @param {Object} markersObject - אובייקט הסמנים.
 * @param {Array<string>} currentItemIds - מערך ה-IDs של הפריטים שצריכים להישאר.
 */
export function removeOldMarkers(mapInstance, markersObject, currentItemIds) {
    if (!mapInstance) return;
    Object.keys(markersObject).forEach(markerId => {
        if (!currentItemIds.includes(markerId)) {
            if (mapInstance.hasLayer(markersObject[markerId])) {
                mapInstance.removeLayer(markersObject[markerId]);
            }
            delete markersObject[markerId];
        }
    });
}

/**
 * מתאים את גבולות המפה להכיל את כל הסמנים הפעילים.
 * @param {L.Map} mapInstance - אובייקט המפה.
 * @param {Array<L.Marker>} activeMarkers - מערך של סמנים פעילים.
 */
export function fitMapToBounds(mapInstance, activeMarkers) {
    if (!mapInstance || activeMarkers.length === 0) return;
    const bounds = L.latLngBounds(activeMarkers.map(marker => marker.getLatLng()));
    if (bounds.isValid()) {
        try {
            mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } catch (e) {
            SmartLog.warn("FitBounds error", "Map.Util", e);
        }
    }
}
