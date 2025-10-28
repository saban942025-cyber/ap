// /shared/firebase-init.js v1.0
// Shared module for Firebase initialization, authentication, and logging

// --- Firebase SDK Imports ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// Import ALL Firestore functions used across ALL apps
import {
    getFirestore, collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp // Import Timestamp if needed for comparisons
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";

// --- Config Logic ---
const firebaseConfig = {
    apiKey: "AIzaSyDq0oVwS6zbEfsgrYBRkeBq80dDUKMedzo", // Replace with your actual API key if needed
    authDomain: "saban94-78949.firebaseapp.com",
    projectId: "saban94-78949",
    storageBucket: "saban94-78949.appspot.com", // Corrected storage bucket name
    messagingSenderId: "41553157903",
    appId: "1:41553157903:web:cc33d252cff023be97a87a",
    measurementId: "G-XV6RZDESSB"
};

let app, auth, db, functions;
let initializationError = null;
try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, 'europe-west1'); // Specify region if needed
    console.log("Firebase initialized via shared module.");
} catch (error) {
    console.error("CRITICAL: Firebase init failed in shared module!", error);
    initializationError = error;
    // Attempt to notify user visually if possible - this is tricky in a module
    // Maybe dispatch a custom event? For now, console error is primary.
    window.dispatchEvent(new CustomEvent('firebase-init-error', { detail: error }));
}

// --- Auth Function ---
const MAX_AUTH_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
async function ensureAuth() {
    console.log("ensureAuth (shared): Starting...");
    let tries = 0;
    while (tries < MAX_AUTH_RETRIES) {
        tries++;
        try {
            if (initializationError) throw new Error(`Init failed: ${initializationError.message}`);
            if (!auth) throw new Error("Auth object missing");

            // If already signed in (anonymously or otherwise), return current user
            if (auth.currentUser) {
                 console.log(`ensureAuth (shared): Already signed in as ${auth.currentUser.uid} (Anonymous: ${auth.currentUser.isAnonymous})`);
                 return auth.currentUser;
            }

            console.log(`ensureAuth (shared): Attempt ${tries}/${MAX_AUTH_RETRIES}...`);
            const userCredential = await signInAnonymously(auth);
            console.log("ensureAuth (shared): Success (Anonymous).", userCredential.user.uid);
            return userCredential.user;
        } catch (e) {
            console.warn(`[FirebaseAuth Shared] Attempt ${tries} failed:`, e.code, e.message);
            if (tries >= MAX_AUTH_RETRIES) {
                console.error("ensureAuth (shared): All attempts failed.");
                throw e;
            }
            console.log(`ensureAuth (shared): Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
    }
    throw new Error("ensureAuth (shared): Max retries reached.");
}
const authReadyPromise = ensureAuth(); // Call immediately

// --- SmartLog Logic (Unified) ---
const LOG_COLLECTION = 'system_logs_v3'; // Unified collection name
const sessionId = (Date.now() + Math.random()).toString(36);
let isDbAvailableForLog = !!db;
let isAuthReadyForLog = false;
authReadyPromise.then(() => { isAuthReadyForLog = true; }).catch(() => { isDbAvailableForLog = false; });

const writeLog = async (level, message, origin, context = {}, category = null, solution = null) => {
    // Determine origin prefix based on current page path
    let originPrefix = 'UnknownApp';
    try {
        if (window.location.pathname.includes('/sidor/')) originPrefix = 'Admin';
        else if (window.location.pathname.includes('/driver-app/')) originPrefix = 'Driver';
        else if (window.location.pathname.includes('/warehouse-app/')) originPrefix = 'Warehouse';
        else if (window.location.pathname.includes('/viewer-app/')) originPrefix = 'Viewer';
        else if (window.location.pathname.includes('/customer.html')) originPrefix = 'CustomerLink';
        else if (window.location.pathname.includes('/log.html')) originPrefix = 'LogViewer';
    } catch (e) { /* Ignore errors if window/location are not available */ }


    const fullOrigin = `${originPrefix}-${origin}`;

    // Console logging (improved formatting)
    const timestamp = new Date().toLocaleTimeString('he-IL');
    const consoleArgs = [`%c[${timestamp} | ${fullOrigin}] ${level}:`, `font-weight: bold; color: ${level === 'ERROR' ? 'red' : (level === 'WARN' ? 'orange' : 'inherit')};`, message];
    if (Object.keys(context).length > 0) consoleArgs.push(context);
    if (category) consoleArgs.push(`[Cat: ${category}]`);
    if (solution) consoleArgs.push(`[Sol: ${solution}]`);

    switch (level) {
        case 'INFO': console.log(...consoleArgs); break;
        case 'WARN': console.warn(...consoleArgs); break;
        case 'ERROR': console.error(...consoleArgs); break;
        default: console.log(...consoleArgs);
    }

    // Firestore logging
    if (!isDbAvailableForLog || !isAuthReadyForLog) {
        // console.warn("Firestore logging skipped (DB not available or Auth not ready)");
        return;
    }
    try {
        const user = auth?.currentUser; if (!user) { return; } // Should not happen after authReadyPromise resolves
        const userContext = { uid: user.uid, isAnonymous: user.isAnonymous };

        // Clean context: remove large objects or circular references if necessary
        const safeContext = JSON.parse(JSON.stringify(context || {}, (key, value) => {
             // Example: Limit stack trace length
             if (key === 'stack' && typeof value === 'string' && value.length > 1000) {
                 return value.substring(0, 1000) + '... [truncated]';
             }
             // Add more filtering if needed
             return value;
        }));


        const logEntry = {
            timestamp: serverTimestamp(),
            level,
            message: String(message),
            origin: fullOrigin,
            context: {
                 ...safeContext,
                 sessionId,
                 userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                 page: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
            },
            user: userContext,
            category: category || null,
            solution: solution || null
        };
        // Use addDoc for logging - Fire and forget
        addDoc(collection(db, LOG_COLLECTION), logEntry).catch(e => console.error("SmartLog background write error:", e));
    } catch (error) {
        console.error("SmartLog FATAL ERROR processing log before Firestore write.", error, { originalMessage: message });
        if (error.code === 'permission-denied' || error.message.includes('permission')) {
             console.warn("SmartLog: Disabling Firestore logging due to permission error.");
             isDbAvailableForLog = false;
        }
        // Avoid infinite loops if stringify fails
        if (error instanceof TypeError && error.message.includes('circular structure')) {
             console.error("SmartLog: Circular reference detected in context. Logging skipped.", context);
        }
    }
};

const SmartLog = {
    info: (msg, origin, ctx = {}) => { writeLog('INFO', msg, origin, ctx); },
    warn: (msg, origin, ctx = {}, cat = null, sol = null) => { writeLog('WARN', msg, origin, ctx, cat, sol); },
    error: (err, origin, ctx = {}, cat = null, sol = null) => {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : (new Error()).stack; // Attempt to get stack trace even for non-Errors
        writeLog('ERROR', msg, origin, { ...ctx, stack }, cat, sol);
    }
};

// Export necessary Firebase services and functions, plus our helpers
export {
    db, auth, authReadyPromise, functions, SmartLog,
    // Firestore functions (list all used across apps)
    collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp // Export Timestamp
};
