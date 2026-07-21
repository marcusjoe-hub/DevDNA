/**
 * DevDNA - Firebase Integration v2 (Massive Upgrade)
 * ----------------------------------------------------
 * Real-time leaderboard + Event Control + Announcement System
 * 
 * Firestore Structure:
 * 
 * 1) Collection: devdna_leaderboard
 *    Doc: global
 *    Fields: { frontend, backend, fullstack, debugging, ai, total, updatedAt }
 * 
 * 2) Collection: settings
 *    Doc: main  (preferred single doc for all settings)
 *    Fields: {
 *      eventLive: boolean (true = live, false = closed)
 *      announcement: string
 *      announcementVisible: boolean
 *      updatedAt: number
 *    }
 *    ---
 *    Also supports legacy doc split (for spec compatibility):
 *    Doc: eventStatus -> { live: boolean }
 *    Doc: announcementText -> { text: string, visible: boolean }
 * 
 * Security Rules for Tec Toc demo:
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /{document=**} {
 *       allow read: if true;
 *       allow write: if true; // lock down after event
 *     }
 *   }
 * }
 * 
 * Replace firebaseConfig below with your own!
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, getDocs } from "firebase/firestore";

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

const isConfigured = !Object.values(firebaseConfig).some(v => typeof v === 'string' && v.includes('YOUR_'));

let db = null;
let app = null;
let firebaseInitialized = false;

// Local fallback keys
const STORAGE_KEY_COUNTS = 'devdna_fallback_counts_v1';
const STORAGE_KEY_SETTINGS = 'devdna_fallback_settings_v1';

// FIX 3: REMOVE fake mock numbers — counter must be real Firebase total only
// If Firebase empty → show 0, never fake 556 etc.
const defaultCounts = {
    frontend: 0,
    backend: 0,
    fullstack: 0,
    debugging: 0,
    ai: 0,
    total: 0
};

// FIX 4: Update year to 2026
const defaultSettings = {
    eventLive: true,
    announcement: "🎉 Welcome to Tec Toc 2026!",
    announcementVisible: false
};

function getFallbackCounts() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_COUNTS);
        if (raw) {
            const parsed = JSON.parse(raw);
            // FIX 3 migration: if old fake data (556 etc) exists, reset to 0 to avoid fake counter
            // Old fake defaults were 127,98,143,76,112,556 — detect and wipe
            const isOldFake = parsed.total === 556 && parsed.frontend === 127;
            if (isOldFake) {
                localStorage.setItem(STORAGE_KEY_COUNTS, JSON.stringify(defaultCounts));
                return { ...defaultCounts };
            }
            return parsed;
        }
        localStorage.setItem(STORAGE_KEY_COUNTS, JSON.stringify(defaultCounts));
        return { ...defaultCounts };
    } catch {
        return { ...defaultCounts };
    }
}
function setFallbackCounts(counts) {
    try { localStorage.setItem(STORAGE_KEY_COUNTS, JSON.stringify(counts)); } catch {}
}

function getFallbackSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (raw) return JSON.parse(raw);
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(defaultSettings));
        return { ...defaultSettings };
    } catch {
        return { ...defaultSettings };
    }
}
function setFallbackSettings(s) {
    try { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s)); } catch {}
}

// Mock listeners + cross-tab sync for local testing (FIX 7 helper)
let mockLeaderboardListeners = [];
let mockSettingsListeners = [];

function triggerMockLeaderboard() {
    const counts = getFallbackCounts();
    mockLeaderboardListeners.forEach(cb => { try { cb(counts); } catch {} });
}
function triggerMockSettings() {
    const settings = getFallbackSettings();
    mockSettingsListeners.forEach(cb => { try { cb(settings); } catch {} });
}

// FIX 7: Cross-tab sync for mock mode — admin in one tab, main site in another instantly updates
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY_COUNTS) triggerMockLeaderboard();
        if (e.key === STORAGE_KEY_SETTINGS) triggerMockSettings();
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
        console.log('[DevDNA] Firebase initialized ✔ v2');
    } catch (err) {
        console.warn('[DevDNA] Firebase init failed, fallback to mock:', err);
        firebaseInitialized = false;
    }
} else {
    console.warn('[DevDNA] Firebase not configured — using local mock. Replace config in firebase.js');
}

async function ensureDocs() {
    if (!firebaseInitialized) return;
    try {
        // Leaderboard
        const lbRef = doc(db, 'devdna_leaderboard', 'global');
        const lbSnap = await getDoc(lbRef);
        if (!lbSnap.exists()) {
            await setDoc(lbRef, { ...defaultCounts, total: Object.values(defaultCounts).reduce((a,b)=> typeof b==='number'?a+b:a,0), updatedAt: Date.now() });
        }
        // Settings
        const settingsRef = doc(db, 'settings', 'main');
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
            await setDoc(settingsRef, { ...defaultSettings, updatedAt: Date.now() });
        }
    } catch (e) {
        console.warn('[DevDNA] ensureDocs failed', e);
    }
}

if (firebaseInitialized) ensureDocs();

// ============================================================================
// PUBLIC API
// ============================================================================

export async function incrementArchetype(archetypeKey) {
    const validKeys = ['frontend', 'backend', 'fullstack', 'debugging', 'ai'];
    if (!validKeys.includes(archetypeKey)) return;

    if (firebaseInitialized) {
        try {
            const ref = doc(db, 'devdna_leaderboard', 'global');
            await updateDoc(ref, {
                [archetypeKey]: increment(1),
                total: increment(1),
                updatedAt: Date.now()
            });
        } catch (err) {
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
                    await updateDoc(ref, { [archetypeKey]: increment(1), total: increment(1) });
                }
            } catch (e2) {
                const counts = getFallbackCounts();
                counts[archetypeKey] = (counts[archetypeKey] || 0) + 1;
                counts.total = (counts.total || 0) + 1;
                setFallbackCounts(counts);
                triggerMockLeaderboard();
            }
        }
    } else {
        const counts = getFallbackCounts();
        counts[archetypeKey] = (counts[archetypeKey] || 0) + 1;
        counts.total = Object.keys(counts).filter(k=>k!=='total').reduce((s,k)=>s+(counts[k]||0),0);
        setFallbackCounts(counts);
        triggerMockLeaderboard();
    }
}

export function subscribeToLeaderboard(callback) {
    if (firebaseInitialized) {
        const ref = doc(db, 'devdna_leaderboard', 'global');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                callback({
                    frontend: d.frontend || 0,
                    backend: d.backend || 0,
                    fullstack: d.fullstack || 0,
                    debugging: d.debugging || 0,
                    ai: d.ai || 0,
                    total: d.total || 0
                });
            } else {
                callback(getFallbackCounts());
            }
        }, (err) => {
            console.warn('[DevDNA] leaderboard listener error', err);
            callback(getFallbackCounts());
        });
        return unsub;
    } else {
        mockLeaderboardListeners.push(callback);
        setTimeout(() => callback(getFallbackCounts()), 100);
        return () => {
            mockLeaderboardListeners = mockLeaderboardListeners.filter(c=>c!==callback);
        };
    }
}

// ------------------------------------------------------------
// Settings / Event Control
// ------------------------------------------------------------

export function subscribeToSettings(callback) {
    if (firebaseInitialized) {
        const ref = doc(db, 'settings', 'main');
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                callback({
                    eventLive: d.eventLive ?? true,
                    announcement: d.announcement ?? "",
                    announcementVisible: d.announcementVisible ?? false
                });
            } else {
                callback({ ...defaultSettings });
            }
        }, (err) => {
            console.warn('[DevDNA] settings listener error', err);
            callback(getFallbackSettings());
        });
        return unsub;
    } else {
        mockSettingsListeners.push(callback);
        setTimeout(() => callback(getFallbackSettings()), 100);
        return () => {
            mockSettingsListeners = mockSettingsListeners.filter(c=>c!==callback);
        };
    }
}

export async function updateEventStatus(isLive) {
    if (firebaseInitialized) {
        const ref = doc(db, 'settings', 'main');
        try {
            await updateDoc(ref, { eventLive: isLive, updatedAt: Date.now() });
        } catch {
            await setDoc(ref, { ...defaultSettings, eventLive: isLive, updatedAt: Date.now() }, { merge: true });
        }
        // Also write to legacy spec path for compatibility
        try {
            await setDoc(doc(db, 'settings', 'eventStatus'), { live: isLive }, { merge: true });
        } catch {}
    } else {
        const s = getFallbackSettings();
        s.eventLive = isLive;
        setFallbackSettings(s);
        triggerMockSettings();
    }
}

export async function updateAnnouncement(text, visible) {
    if (firebaseInitialized) {
        const ref = doc(db, 'settings', 'main');
        try {
            await updateDoc(ref, { announcement: text, announcementVisible: visible, updatedAt: Date.now() });
        } catch {
            await setDoc(ref, { ...defaultSettings, announcement: text, announcementVisible: visible, updatedAt: Date.now() }, { merge: true });
        }
        try {
            await setDoc(doc(db, 'settings', 'announcement'), { text, visible }, { merge: true });
            await setDoc(doc(db, 'settings', 'announcementVisible'), { visible }, { merge: true });
        } catch {}
    } else {
        const s = getFallbackSettings();
        s.announcement = text;
        s.announcementVisible = visible;
        setFallbackSettings(s);
        triggerMockSettings();
    }
}

export async function clearAllSubmissions() {
    if (firebaseInitialized) {
        const ref = doc(db, 'devdna_leaderboard', 'global');
        await setDoc(ref, { frontend: 0, backend: 0, fullstack: 0, debugging: 0, ai: 0, total: 0, updatedAt: Date.now() });
    } else {
        const empty = { frontend: 0, backend: 0, fullstack: 0, debugging: 0, ai: 0, total: 0 };
        setFallbackCounts(empty);
        triggerMockLeaderboard();
    }
}

export async function getLeaderboardData() {
    if (firebaseInitialized) {
        try {
            const ref = doc(db, 'devdna_leaderboard', 'global');
            const snap = await getDoc(ref);
            if (snap.exists()) return snap.data();
            return getFallbackCounts();
        } catch {
            return getFallbackCounts();
        }
    } else {
        return getFallbackCounts();
    }
}

export function isFirebaseConfigured() { return firebaseInitialized; }
export function getDefaultCounts() { return { ...defaultCounts }; }
export function getDefaultSettings() { return { ...defaultSettings }; }

if (typeof window !== 'undefined') {
    window.__DevDNA_Firebase = {
        isConfigured: firebaseInitialized,
        incrementArchetype,
        subscribeToLeaderboard,
        subscribeToSettings,
        updateEventStatus,
        updateAnnouncement,
        clearAllSubmissions
    };
}
