//
// *** DeliveryMaster V33.0 - מודול Firebase מרכזי ***
//
// זהו המקור היחיד (Single Source of Truth) עבור כל הגדרות Firebase,
// אימות (Auth), לוגיקה (SmartLog), והודעות (showToast).
// כל האפליקציות (נהג, מנהל, מחסן...) צריכות לייבא מודול זה.
//

// --- Inlined Firebase SDK Imports ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    getFirestore, collection, doc, onSnapshot, query, orderBy, addDoc, 
    updateDoc, serverTimestamp, deleteDoc, arrayUnion, where, getDocs, 
    setDoc, limit, getDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";

// --- Firebase Config (Centralized) ---
const firebaseConfig = {
    apiKey: "AIzaSyDq0oVwS6zbEfsgrYBRkeBq80dDUKMedzo", 
    authDomain: "saban94-78949.firebaseapp.com", 
    projectId: "saban94-78949",
    storageBucket: "saban94-78949.firebasestorage.app", 
    messagingSenderId: "41553157903", 
    appId: "1:41553157903:web:cc33d252cff023be97a87a", 
    measurementId: "G-XV6RZDESSB"
};

// --- Initialize Firebase Services ---
let app, auth, db, functions;
let initializationError = null;

try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app); // Initialize Functions
    console.log("DeliveryMaster Firebase Core: Initialized.");
} catch (error) {
    console.error("CRITICAL: Firebase init failed!", error);
    initializationError = error;
}

// --- Centralized Auth Promise ---
const MAX_AUTH_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function ensureAuth() {
    let tries = 0;
    while (tries < MAX_AUTH_RETRIES) {
        tries++;
        try {
            if (initializationError) throw new Error(`Firebase Init failed: ${initializationError.message}`);
            if (!auth) throw new Error("Auth object is missing");
            
            // If we already have a user, just return it
            if (auth.currentUser) {
                // console.log("ensureAuth: User already authenticated.");
                return auth.currentUser;
            }

            // Try anonymous sign-in
            // console.log(`ensureAuth: Attempt ${tries}/${MAX_AUTH_RETRIES}...`);
            const userCredential = await signInAnonymously(auth);
            console.log("ensureAuth: Anonymous sign-in successful.", userCredential.user.uid);
            return userCredential.user;
            
        } catch (e) {
            console.warn(`[FirebaseAuth] Attempt ${tries} failed:`, e.code, e.message);
            if (tries >= MAX_AUTH_RETRIES) {
                console.error("ensureAuth: All anonymous sign-in attempts failed.");
                throw e;
            }
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
    }
    throw new Error("ensureAuth: Max retries reached.");
}

// This promise is exported and awaited by all apps before they run
const authReadyPromise = ensureAuth();

// --- Centralized SmartLog ---
const LOG_COLLECTION = 'system_logs_v3';
const sessionId = (Date.now() + Math.random()).toString(36);
let isDbLoggingEnabled = !!db;

const writeLog = async (level, message, origin, context = {}, category = null) => {
    // 1. Console Log (Always)
    const consoleArgs = [`[${origin}] ${level}:`, message];
    if (Object.keys(context).length > 0) consoleArgs.push(context);
    if (category) consoleArgs.push(`[Cat: ${category}]`);
    
    switch (level) {
        case 'INFO': console.log(...consoleArgs); break;
        case 'WARN': console.warn(...consoleArgs); break;
        case 'ERROR': console.error(...consoleArgs); break;
        default: console.log(...consoleArgs);
    }

    // 2. Firestore Log (If enabled)
    if (!isDbLoggingEnabled) return;

    try {
        // Wait for auth to be ready before trying to log
        const user = await authReadyPromise; 
        if (!user) {
            console.warn("SmartLog: User missing after authReady, skipping DB log.");
            return;
        }
        
        const userContext = { uid: user.uid, isAnonymous: user.isAnonymous };
        const logEntry = {
            timestamp: serverTimestamp(),
            level,
            message: String(message),
            origin: String(origin),
            context: {
                ...JSON.parse(JSON.stringify(context || {})), // Deep copy context
                sessionId,
                userAgent: navigator.userAgent || 'N/A',
                page: window.location.pathname || 'N/A'
            },
            user: userContext,
            category: category || null
        };
        
        // Fire-and-forget logging
        addDoc(collection(db, LOG_COLLECTION), logEntry).catch(e => {
            console.error("SmartLog: Firestore write error:", e);
            if (e.code === 'permission-denied' || e.message.includes('permission')) {
                console.warn("SmartLog: Disabling Firestore logging due to permission error.");
                isDbLoggingEnabled = false;
            }
        });
    } catch (error) {
        console.error("SmartLog: FATAL ERROR during log write.", error, { originalMessage: message });
    }
};

const SmartLog = {
    info: (msg, origin, ctx = {}) => { writeLog('INFO', msg, origin, ctx); },
    warn: (msg, origin, ctx = {}, cat = null) => { writeLog('WARN', msg, origin, ctx, cat); },
    error: (err, origin, ctx = {}, cat = null) => {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : 'N/A';
        writeLog('ERROR', msg, origin, { ...ctx, stack }, cat);
    }
};

// --- Centralized Toast Function ---
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn("Toast container not found for message:", message);
        return;
    }

    let bgColorClass = 'info'; // Default
    switch (type) {
        case 'success': bgColorClass = 'success'; break;
        case 'error':   bgColorClass = 'error'; break;
        case 'warn':    bgColorClass = 'warn'; break;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${bgColorClass}`;
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, { once: true });
    }, duration);

    // Log the toast message
    SmartLog.info(`Toast shown: ${message}`, "UI.Toast", { type, duration });
}

// --- Export all shared services and functions ---
export {
    db, auth, authReadyPromise, functions, SmartLog, showToast,
    // Firestore functions
    collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp,
    // Functions
    httpsCallable
};
