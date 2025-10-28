// --- Firebase SDK Imports ---
// Using v9 modular SDK
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
// Note: Other Firestore functions (doc, onSnapshot, query, etc.) will be imported directly in the files that use them.

// --- Firebase Configuration ---
// **חשוב**: תצורה זו משותפת כעת לכל האפליקציות
const firebaseConfig = {
    apiKey: "AIzaSyDq0oVwS6zbEfsgrYBRkeBq80dDUKMedzo",
    authDomain: "saban94-78949.firebaseapp.com",
    projectId: "saban94-78949",
    storageBucket: "saban94-78949.firebasestorage.app",
    messagingSenderId: "41553157903",
    appId: "1:41553157903:web:cc33d252cff023be97a87a",
    measurementId: "G-XV6RZDESSB"
};

// --- Firebase Initialization ---
let app, auth, db;
let initializationError = null;
try {
    // Initialize Firebase only once
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[firebase-init] Firebase initialized successfully.");
} catch (error) {
    console.error("[firebase-init] CRITICAL: Firebase initialization failed!", error);
    initializationError = error;
    // Consider adding a visual error indicator if this fails
}

// --- Authentication Handler ---
const MAX_AUTH_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function ensureAuth() {
    console.log("[ensureAuth] Starting authentication check...");
    let tries = 0;
    while (tries < MAX_AUTH_RETRIES) {
        tries++;
        try {
            if (initializationError) {
                throw new Error(`Firebase init failed: ${initializationError.message}`);
            }
            if (!auth) {
                throw new Error("Firebase Auth object is missing.");
            }

            // If already signed in (even anonymously), return the user
            if (auth.currentUser) {
                console.log(`[ensureAuth] Already signed in as ${auth.currentUser.isAnonymous ? 'anonymous' : 'non-anonymous'} user: ${auth.currentUser.uid}`);
                return auth.currentUser;
            }

            console.log(`[ensureAuth] Attempt ${tries}/${MAX_AUTH_RETRIES} to sign in anonymously...`);
            const userCredential = await signInAnonymously(auth);
            console.log("[ensureAuth] Anonymous sign-in successful.", userCredential.user.uid);
            return userCredential.user;

        } catch (e) {
            console.warn(`[ensureAuth] Attempt ${tries} failed:`, e.code, e.message);
            if (tries >= MAX_AUTH_RETRIES) {
                console.error("[ensureAuth] All authentication attempts failed.");
                throw e; // Re-throw the error after max retries
            }
            console.log(`[ensureAuth] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
    // This line should technically be unreachable due to the throw in the loop
    throw new Error("[ensureAuth] Max retries reached without successful authentication.");
}

// Immediately attempt authentication and store the promise
const authReady = ensureAuth();

// --- SmartLog Implementation ---
const LOG_COLLECTION = 'system_logs_v3'; // Unified collection name
const sessionId = (Date.now() + Math.random()).toString(36);
let isDbAvailableForLogging = !!db; // Check initial DB availability
let isAuthReadyForLogging = false;

// Check auth status for logging purposes
authReady.then(() => {
    isAuthReadyForLogging = true;
    console.log("[SmartLog] Auth is ready, Firestore logging enabled.");
}).catch(() => {
    isDbAvailableForLogging = false; // Disable logging if auth fails
    console.warn("[SmartLog] Auth failed, Firestore logging disabled.");
});

const writeLog = async (level, message, origin, context = {}, category = null, solution = null) => {
    // 1. Console Logging (Always)
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

    // 2. Firestore Logging (Conditional)
    if (!isDbAvailableForLogging || !isAuthReadyForLogging) {
        // console.log("[SmartLog] Firestore logging skipped (DB not available or Auth not ready).");
        return;
    }

    try {
        const user = auth?.currentUser;
        if (!user) {
            // This might happen briefly during initialization, usually okay.
            // console.warn("[SmartLog] User object not available yet for Firestore logging.");
            return;
        }
        const userContext = { uid: user.uid, isAnonymous: user.isAnonymous };

        // Sanitize context: Remove large objects or sensitive data if necessary
        const safeContext = { ...context };
        // Example: Remove potentially large stack trace from INFO/WARN logs in Firestore
        if (level !== 'ERROR' && safeContext.stack) {
            delete safeContext.stack;
        }
        // Ensure context is serializable
        try { JSON.stringify(safeContext); } catch (e) {
             console.warn("[SmartLog] Context object is not serializable, logging basic info only.", e);
             safeContext = { error: "Context not serializable" };
        }


        const logEntry = {
            timestamp: serverTimestamp(),
            level,
            message: String(message), // Ensure message is a string
            origin, // Application-specific origin (e.g., "Sidor", "DriverApp")
            context: {
                ...safeContext, // Use the potentially cleaned context
                sessionId,
                userAgent: navigator.userAgent || 'N/A',
                page: window.location.pathname || 'N/A'
            },
            user: userContext,
            category: category || null,
            solution: solution || null
        };

        // Use addDoc for logging (fire and forget is okay here)
        addDoc(collection(db, LOG_COLLECTION), logEntry).catch(e => {
            console.error("[SmartLog] FATAL ERROR writing log to Firestore.", e);
            // If permission denied, disable future logging attempts
            if (e.code === 'permission-denied' || e.message.includes('permission')) {
                console.warn("[SmartLog] Disabling Firestore logging due to permission error.");
                isDbAvailableForLogging = false;
            }
        });

    } catch (error) {
        // Catch errors within the logging function itself
        console.error("[SmartLog] UNEXPECTED FATAL ERROR during log processing.", error, { originalMessage: message });
    }
};

const SmartLog = {
    info: (msg, origin, ctx = {}) => { writeLog('INFO', msg, origin, ctx); },
    warn: (msg, origin, ctx = {}, cat = null, sol = null) => { writeLog('WARN', msg, origin, ctx, cat, sol); },
    error: (err, origin, ctx = {}, cat = null, sol = null) => {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : 'N/A';
        // Ensure stack trace is included in the context for ERROR level
        writeLog('ERROR', message, origin, { ...ctx, stack }, cat, sol);
    }
};

// --- Exports ---
// Export the initialized instances and functions
export { db, auth, authReady, SmartLog, firebaseConfig };
