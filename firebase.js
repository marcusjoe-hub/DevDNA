/**
 * DevDNA - Firebase Integration
 * -----------------------------------------
 * Handles:
 * - Firebase initialization (Firestore only)
 * - Incrementing archetype counts
 * - Real-time leaderboard subscription
 * 
 * IMPORTANT: Replace the placeholder config below
 * with your own Firebase project config.
 * 
 * How to get config:
 * 1. Go to https://console.firebase.google.com
 * 2. Create project -> Project Settings -> General
 * 3. Scroll to "Your apps" -> Web app -> Config
 * 4. Copy firebaseConfig object
 * 
 * Firestore Structure:
 * - Collection: "devdna_leaderboard"
 * - Document: "global"
 * - Fields: { frontend: number, backend: number, fullstack: number, debugging: number, ai: number, total: number }
 * 
 * Security Rules (for open leaderboard):
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /devdna_leaderboard/{doc} {
 *       allow read: if true;
 *       allow write: if true; // For hackathon; restrict in prod with validation
 *     }
 *   }
 * }
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";

// ============================================================================
// 🔧 REPLACE WITH YOUR OWN FIREBASE CONFIG
// ============================================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCUwsScuaiXdKX5IhMVsdpxquTrSv0Xks",
  authDomain: "devdna-47ffe.firebaseapp.com",
  projectId: "devdna-47ffe",
  storageBucket: "devdna-47ffe.firebasestorage.app",
  messagingSenderId: "507738623580",
  appId: "1:507738623580:web:9d023f5ca2b75f85bc6099",
  measurementId: "G-DX6F6MW85T"
};
// ============================================================================
// End of config - DO NOT EDIT BELOW UNLESS YOU KNOW WHAT YOU'RE DOING
// ============================================================================

/**
 * Check if Firebase is properly configured.
 * If placeholder values remain, we use local mock instead.
 */
const isConfigured = !Object.values(firebaseConfig).some(v => typeof v === 'string' && v.includes('YOUR_'));

let db = null;
let app = null;
let firebaseInitialized = false;

// Local mock fallback (uses localStorage so leaderboard works without Firebase)
const STORAGE_KEY = 'devdna_fallback_counts_v1';
const defaultCounts = {
    frontend: 127,
    backend: 98,
    fullstack: 143,
    debugging: 76,
    ai: 112
};

function getFallbackCounts() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCounts));
        return { ...defaultCounts };
    } catch {
        return { ...defaultCounts };
    }
}

function setFallbackCounts(counts) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch {}
}

// Listeners for mock mode
let mockListeners = [];
let mockInterval = null;

function triggerMockListeners() {
    const counts = getFallbackCounts();
    mockListeners.forEach(cb => {
        try { cb(counts); } catch {}
    });
}

// ============================================================================
// Initialize Firebase if configured
// ============================================================================
if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        firebaseInitialized = true;
        console.log('[DevDNA] Firebase initialized ✔');
    } catch (err) {
        console.warn('[DevDNA] Firebase init failed, falling back to local mock:', err);
        firebaseInitialized = false;
    }
} else {
    console.warn('[DevDNA] Firebase not configured — using local mock leaderboard. Replace firebaseConfig in firebase.js');
}

/**
 * Ensure the global leaderboard document exists.
 * Only runs when Firebase is configured.
 */
async function ensureLeaderboardDoc() {
    if (!firebaseInitialized) return;
    try {
        const ref = doc(db, 'devdna_leaderboard', 'global');
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                frontend: 0,
                backend: 0,
                fullstack: 0,
                debugging: 0,
                ai: 0,
                total: 0,
                updatedAt: Date.now()
            });
            console.log('[DevDNA] Created leaderboard doc');
        }
    } catch (e) {
        console.warn('[DevDNA] ensureLeaderboardDoc failed', e);
    }
}

// Call ensure doc on load if configured (fire-and-forget)
if (firebaseInitialized) {
    ensureLeaderboardDoc();
}

// ============================================================================
// PUBLIC API - Exported for script.js
// ============================================================================

/**
 * Increment count for a given archetype.
 * @param {string} archetypeKey - One of: frontend, backend, fullstack, debugging, ai
 * @returns {Promise<void>}
 */
export async function incrementArchetype(archetypeKey) {
    const validKeys = ['frontend', 'backend', 'fullstack', 'debugging', 'ai'];
    if (!validKeys.includes(archetypeKey)) {
        console.error('[DevDNA] Invalid archetype key:', archetypeKey);
        return;
    }

    if (firebaseInitialized) {
        try {
            const ref = doc(db, 'devdna_leaderboard', 'global');
            // Use increment for atomic operation
            await updateDoc(ref, {
                [archetypeKey]: increment(1),
                total: increment(1),
                updatedAt: Date.now()
            });
            console.log(`[DevDNA] Incremented ${archetypeKey} on Firestore`);
        } catch (err) {
            // If doc doesn't exist, try setDoc
            try {
                const ref = doc(db, 'devdna_leaderboard', 'global');
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                    await setDoc(ref, {
                        frontend: archetypeKey === 'frontend' ? 1 : 0,
                        backend: archetypeKey === 'backend' ? 1 : 0,
                        fullstack: archetypeKey === 'fullstack' ? 1 : 0,
                        debugging: archetypeKey === 'debugging' ? 1 : 0,
                        ai: archetypeKey === 'ai' ? 1 : 0,
                        total: 1,
                        updatedAt: Date.now()
                    });
                } else {
                    // retry update
                    await updateDoc(ref, {
                        [archetypeKey]: increment(1),
                        total: increment(1)
                    });
                }
            } catch (e2) {
                console.error('[DevDNA] Firestore increment failed, using local fallback', e2);
                // Fallback to local
                const counts = getFallbackCounts();
                counts[archetypeKey] = (counts[archetypeKey] || 0) + 1;
                setFallbackCounts(counts);
                triggerMockListeners();
            }
        }
    } else {
        // Mock mode: update localStorage
        const counts = getFallbackCounts();
        counts[archetypeKey] = (counts[archetypeKey] || 0) + 1;
        setFallbackCounts(counts);
        triggerMockListeners();
        console.log(`[DevDNA] Mock increment ${archetypeKey} →`, counts[archetypeKey]);
    }
}

/**
 * Subscribe to real-time leaderboard updates.
 * @param {(data: Object) => void} callback - Receives {frontend, backend, fullstack, debugging, ai, total}
 * @returns {Function} unsubscribe function
 */
export function subscribeToLeaderboard(callback) {
    if (firebaseInitialized) {
        const ref = doc(db, 'devdna_leaderboard', 'global');
        // Real-time listener via Firestore
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // Ensure all keys exist
                const normalized = {
                    frontend: data.frontend || 0,
                    backend: data.backend || 0,
                    fullstack: data.fullstack || 0,
                    debugging: data.debugging || 0,
                    ai: data.ai || 0,
                    total: data.total || 0
                };
                callback(normalized);
            } else {
                callback(getFallbackCounts());
            }
        }, (err) => {
            console.warn('[DevDNA] Firestore listener error, using fallback', err);
            callback(getFallbackCounts());
        });
        return unsub;
    } else {
        // Mock mode: push data immediately and on interval + on storage change
        mockListeners.push(callback);
        // Immediate call
        setTimeout(() => callback(getFallbackCounts()), 120);

        // Simulate live activity (optional subtle random increments for demo feel)
        // Disabled by default - uncomment to make leaderboard feel alive offline
        // mockInterval = setInterval(() => { triggerMockListeners(); }, 5000);

        // Return unsubscribe
        return () => {
            mockListeners = mockListeners.filter(cb => cb !== callback);
            if (mockInterval) clearInterval(mockInterval);
        };
    }
}

export function isFirebaseConfigured() {
    return firebaseInitialized;
}

export function getDefaultCounts() {
    return { ...defaultCounts };
}

/**
 * Expose config check to window for debugging (optional)
 */
if (typeof window !== 'undefined') {
    window.__DevDNA_Firebase = {
        isConfigured: firebaseInitialized,
        incrementArchetype,
        subscribeToLeaderboard
    };
}
