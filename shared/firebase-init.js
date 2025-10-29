// DeliveryMaster V33.0 - Shared Firebase Initialization Module
// Centralizes Firebase setup, Auth, Firestore functions, and core utilities.

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore, collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp, // Export Timestamp directly
    enableIndexedDbPersistence, // Added for offline persistence
    initializeFirestore // Added for settings
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";

// --- Firebase Configuration ---
// IMPORTANT: Keep configuration here, removed from individual HTML files.
const firebaseConfig = {
    apiKey: "AIzaSyDq0oVwS6zbEfsgrYBRkeBq80dDUKMedzo", // Replace with your actual key if needed outside sandbox
    authDomain: "saban94-78949.firebaseapp.com",
    projectId: "saban94-78949",
    storageBucket: "saban94-78949.firebasestorage.app",
    messagingSenderId: "41553157903",
    appId: "1:41553157903:web:cc33d252cff023be97a87a",
    measurementId: "G-XV6RZDESSB" // Optional
};

// --- Initialize Firebase Services ---
let app, auth, db, functions;
let initializationError = null;
let dbInitialized = false; // Flag to ensure persistence is enabled only once

try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    console.log("[Firebase] App instance ensured.");

    auth = getAuth(app);
    console.log("[Firebase] Auth instance obtained.");

    // Initialize Firestore with specific settings
    db = initializeFirestore(app, {
      cacheSizeBytes: 100 * 1024 * 1024 // 100 MB cache size (adjust as needed)
    });
    console.log("[Firebase] Firestore initialized.");

    // Enable offline persistence (only once)
    enableIndexedDbPersistence(db)
      .then(() => {
        dbInitialized = true;
        console.log("[Firebase] Firestore offline persistence enabled.");
      })
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn("[Firebase] Persistence failed: Multiple tabs open?");
        } else if (err.code == 'unimplemented') {
          console.warn("[Firebase] Persistence not available in this browser.");
        } else {
          console.error("[Firebase] Persistence error:", err);
        }
      });

    functions = getFunctions(app); // Initialize Cloud Functions
    console.log("[Firebase] Functions instance obtained.");

} catch (error) {
    console.error("CRITICAL: Firebase init failed!", error);
    initializationError = error;
    // Attempt to get instances even if persistence fails, except for db which requires specific init
    try {
        if (!auth) auth = getAuth(app);
        if (!functions) functions = getFunctions(app);
    } catch (fallbackError) {
        console.error("CRITICAL: Firebase fallback init failed!", fallbackError);
        initializationError = initializationError || fallbackError;
    }
}


// --- Authentication Handling ---
const MAX_AUTH_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Promise that resolves when authentication is complete (or fails)
const authReadyPromise = new Promise(async (resolve, reject) => {
    if (initializationError) {
        console.error("[Auth] Initialization failed before auth attempt.");
        return reject(initializationError);
    }
    if (!auth) {
         console.error("[Auth] Auth service not available.");
         return reject(new Error("Firebase Auth service failed to initialize."));
    }

    let tries = 0;
    while (tries < MAX_AUTH_RETRIES) {
        tries++;
        try {
            console.log(`[Auth] Attempting anonymous sign-in (${tries}/${MAX_AUTH_RETRIES})...`);
            const userCredential = await signInAnonymously(auth);
            console.log("[Auth] Anonymous sign-in successful.", userCredential.user.uid);
            resolve(userCredential.user); // Resolve with the user object
            return; // Exit loop on success
        } catch (e) {
            console.warn(`[Auth] Attempt ${tries} failed:`, e.code, e.message);
            if (tries >= MAX_AUTH_RETRIES) {
                console.error("[Auth] All anonymous sign-in attempts failed.");
                reject(e); // Reject after max retries
                return;
            }
            console.log(`[Auth] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
    }
});


// --- SmartLog Utility ---
const LOG_COLLECTION = 'system_logs_v3'; // Centralized collection name
const sessionId = (Date.now() + Math.random()).toString(36);
let isDbAvailableForLogging = !!db; // Initial check
let isAuthReadyForLogging = false;

authReadyPromise.then(() => {
    isAuthReadyForLogging = true;
    console.log("[SmartLog] Auth is ready for logging.");
}).catch(() => {
    console.warn("[SmartLog] Auth failed, Firestore logging disabled.");
    isDbAvailableForLogging = false;
});

const writeLog = async (level, message, origin, context = {}, category = null, solution = null) => {
    const consoleArgs = [`[${origin}] ${level}:`, message];
    if (Object.keys(context).length > 0) consoleArgs.push(context);
    if (category) consoleArgs.push(`[Cat: ${category}]`);
    if (solution) consoleArgs.push(`[Sol: ${solution}]`);

    switch (level) {
        case 'INFO': console.log(...consoleArgs); break;
        case 'WARN': console.warn(...consoleArgs); break;
        case 'ERROR': console.error(...consoleArgs); break;
        default: console.log(...consoleArgs);
    }

    if (!isDbAvailableForLogging || !isAuthReadyForLogging || !dbInitialized) {
        // console.log("[SmartLog] Skipping Firestore write (DB/Auth/Persistence not ready).");
        return; // Don't log if DB or Auth isn't ready, or persistence failed init
    }

    try {
        const user = auth?.currentUser;
        if (!user) {
            // console.warn("[SmartLog] Skipping Firestore write (User not available).");
            return; // Should not happen after authReadyPromise resolves, but good check
        }
        const userContext = { uid: user.uid, isAnonymous: user.isAnonymous };
        const logEntry = {
            timestamp: serverTimestamp(),
            level,
            message: String(message),
            origin: String(origin), // Ensure origin is string
            context: { ...JSON.parse(JSON.stringify(context || {})), sessionId, userAgent: navigator.userAgent || 'N/A', page: window.location.pathname },
            user: userContext,
            category: category || null,
            solution: solution || null
        };

        // Fire and forget (don't block app execution for logging)
        addDoc(collection(db, LOG_COLLECTION), logEntry).catch(e => {
            console.error("[SmartLog] Firestore write error:", e);
            // Consider disabling logging if permission errors occur frequently
            if (e.code === 'permission-denied') {
                console.warn("[SmartLog] Disabling Firestore logging due to permission error.");
                isDbAvailableForLogging = false;
            }
        });
    } catch (error) {
        console.error("[SmartLog] FATAL logging error.", error);
    }
};

const SmartLog = {
    info: (msg, origin, ctx = {}) => { writeLog('INFO', msg, origin, ctx); },
    warn: (msg, origin, ctx = {}, cat = null, sol = null) => { writeLog('WARN', msg, origin, ctx, cat, sol); },
    error: (err, origin, ctx = {}, cat = null, sol = null) => {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : 'N/A';
        writeLog('ERROR', msg, origin, { ...ctx, stack }, cat, sol);
    }
};


// --- Toast Notification Utility ---
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn("Toast container not found for message:", message);
        return; // Exit if container doesn't exist
    }

    let bgColorClass = 'info'; // Default class name (matches CSS)
    switch (type) {
        case 'success': bgColorClass = 'success'; break;
        case 'error':   bgColorClass = 'error'; break;
        case 'warn':    bgColorClass = 'warn'; break;
        case 'ping':    bgColorClass = 'ping'; break; // Added for global pings
    }

    const toast = document.createElement('div');
    toast.className = `toast ${bgColorClass}`;
    toast.textContent = message; // Use textContent for security

    container.appendChild(toast); // Append is simpler usually

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Automatically remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove the element from DOM after transition ends
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode === container) { // Check if still attached
                container.removeChild(toast);
            }
        }, { once: true });
    }, duration);

    // Log the toast message via SmartLog as well
    // SmartLog.info(`Toast shown: ${message}`, "UI.Toast", { type, duration }); // Reduced verbosity
}


// --- Export necessary Firebase services and functions, plus our helpers ---
export {
    // Core Firebase Services
    db, auth, authReadyPromise, functions, app,

    // Core Utilities
    SmartLog, showToast,

    // Firestore Functions (add any others needed)
    collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp, // Export Timestamp constructor

    // Auth Functions (if needed elsewhere, e.g., getting currentUser)
    onAuthStateChanged,

    // Functions Callables (if needed)
    httpsCallable
};

console.log("[Firebase Init Module] Loaded and ready.");
