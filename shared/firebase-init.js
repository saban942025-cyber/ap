// Export necessary Firebase services and functions, plus our helpers
export {
    db, auth, authReadyPromise, functions, SmartLog, showToast, // Export showToast
    // Firestore functions (list all used across apps)
    collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp // Export Timestamp
};


// --- Enhanced Toast Function ---
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn("Toast container not found for message:", message);
        return; // Exit if container doesn't exist
    }

    // Determine background color based on type
    let bgColorClass = 'info'; // Default
    switch (type) {
        case 'success': bgColorClass = 'success'; break;
        case 'error':   bgColorClass = 'error'; break;
        case 'warn':    bgColorClass = 'warn'; break;
        // 'info' is the default
    }

    const toast = document.createElement('div');
    toast.className = `toast ${bgColorClass}`; // Use dynamic class
    toast.textContent = message; // Use textContent for security

    // Prepend toast to have newest on top (optional)
    // container.prepend(toast);
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
        }, { once: true }); // Ensure listener runs only once
    }, duration);

    // Log the toast message via SmartLog as well
    SmartLog.info(`Toast shown: ${message}`, "UI.Toast", { type, duration });
}
// Note: This function is now EXPORTED from this module.
// --- Enhanced Toast Function ---
// ... (Function definition remains the same)

// Export necessary Firebase services and functions, plus our helpers
export {
    db, auth, authReadyPromise, functions, SmartLog, showToast, // *** Double-checking showToast is EXPORTED ***
    // Firestore functions (list all used across apps)
    collection, doc, onSnapshot, query, orderBy, addDoc, updateDoc,
    serverTimestamp, deleteDoc, arrayUnion, where, getDocs, setDoc, limit, getDoc,
    Timestamp // Export Timestamp
};
