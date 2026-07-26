/**
 * DevDNA v1.0 - Owner Setup Page (Security Overhaul Part 1 of 3)
 * One-time setup that moves OWNER credentials OUT of codebase INTO Firestore
 * Route: #owner-setup
 * Flow: Init Key -> Google Sign-In -> Password Setup -> Recovery Codes -> Finish
 * BACKUP PLAN: If setup page breaks, manually create owner in Firebase Console:
 * 1. Firestore → /settings/main → set { ownerSetupComplete: true, ownerGmail: "your@gmail.com" }
 * 2. Firestore → /admins/{sanitized_gmail} → create doc with { gmail, displayName, password, role: "owner", permissions: {...all true}, createdAt: Date.now(), addedBy: "system-setup" }
 * 3. Optional: manually add recoveryCodes array with SHA-256 hashed codes
 */

import { signInWithGoogle, checkOwnerSetupStatus, checkInitKeyExists, getAdminByGmail, createAdmin, getDefaultPermissions, addActivityLog } from './firebase.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

let tempState = {
    initKeyVerified: false,
    googleUser: null,
    recoveryCodes: [],
    hashedCodes: [],
    codesCopied: false,
    codesDownloaded: false
};

function $(id){ return document.getElementById(id); }

function showScreen(screenId){
    const screens = ['init-key-screen','google-signin-screen','password-setup-screen','recovery-codes-screen','setup-already-done-screen','setup-unavailable-screen'];
    screens.forEach(s=>{
        const el = $(s);
        if(el) el.style.display = (s===screenId) ? 'block' : 'none';
    });
}

function shakeElement(el){
    if(!el) return;
    el.classList.add('shake');
    setTimeout(()=>el.classList.remove('shake'), 520);
}

function generateRecoveryCode(){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars I, O, 0, 1
    const seg = () => Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    return `${seg()}-${seg()}-${seg()}`;
}

async function sha256(text){
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function showOwnerSetupPage(){
    const section = $('owner-setup-section');
    if(!section){
        console.warn('[DevDNA v1.0] owner-setup-section missing');
        return;
    }
    // Hide all other sections
    document.querySelectorAll('.section').forEach(s=>{ s.style.display='none'; s.classList.remove('active'); });
    section.style.display='block';
    section.classList.add('active');
    console.log('[DevDNA v1.0] Owner setup route accessed');

    // Reset state
    tempState = { initKeyVerified:false, googleUser:null, recoveryCodes:[], hashedCodes:[], codesCopied:false, codesDownloaded:false };

    // PART 2: Check if setup already complete
    try{
        const complete = await checkOwnerSetupStatus();
        if(complete){
            showScreen('setup-already-done-screen');
            console.log('[DevDNA v1.0] Owner setup already completed - showing done screen');
            return;
        }
    }catch(e){
        console.warn('[DevDNA v1.0] checkOwnerSetupStatus error', e);
    }

    // Check if init key exists
    try{
        const exists = await checkInitKeyExists();
        if(!exists){
            showScreen('setup-unavailable-screen');
            console.log('[DevDNA v1.0] Init key does not exist - showing unavailable');
            return;
        }
    }catch(e){
        console.warn('[DevDNA v1.0] checkInitKeyExists error', e);
        showScreen('setup-unavailable-screen');
        return;
    }

    // Show init key entry
    showScreen('init-key-screen');
    bindInitKeyHandlers();
}

function bindInitKeyHandlers(){
    const input = $('init-key-input');
    const submit = $('init-key-submit');
    const errorEl = $('init-key-error');
    if(!input || !submit) return;

    // Clear previous listeners by cloning
    const newSubmit = submit.cloneNode(true);
    submit.parentNode.replaceChild(newSubmit, submit);
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);

    const freshInput = $('init-key-input');
    const freshSubmit = $('init-key-submit');
    const freshError = $('init-key-error');

    freshSubmit.addEventListener('click', async ()=>{
        const entered = freshInput.value.trim();
        if(!entered){
            freshInput.focus();
            shakeElement(freshInput);
            return;
        }
        freshSubmit.disabled=true;
        freshSubmit.textContent='VERIFYING...';
        if(freshError){ freshError.style.display='none'; freshError.textContent=''; }

        try{
            // Read Firestore /settings/main/ownerInitKey
            const mod = await import('./firebase.js');
            const db = mod.getFirestore ? mod.getFirestore() : null;
            // Use direct Firestore read via firebase.js helper? We'll read via doc
            // Since we have checkInitKeyExists, we need actual value
            const { getFirestore: getFS, doc: docFn, getDoc: getDocFn } = await import('firebase/firestore');
            // Try to get db instance from window.__DevDNA_Firebase or getFirestore
            let firestoreDb;
            try{
                const appMod = await import('firebase/app');
                // fallback: use getFirestore from firebase.js internal? We'll attempt to get via import
                const { getFirestore } = await import('firebase/firestore');
                // We need app instance - we can get from auth? Simplify: use getDoc via our check function that already reads
                // For security, we read settings doc directly via our function that returns existence but not value - we need value
                // We'll implement direct read using same db as firebase.js initialized
                // To avoid duplication, we will use window.__DevDNA_Firebase if available? Instead, we try to read via getDoc with doc reference using getFirestore()
                // The firebase app is initialized in firebase.js - we can try to get it via getFirestore()
                // This may fail in mock mode - handle gracefully
                const settingsRef = docFn(getFS(), 'settings', 'main');
                const snap = await getDocFn(settingsRef);
                if(!snap.exists()){
                    throw new Error('Settings doc missing');
                }
                const data = snap.data();
                const storedKey = data.ownerInitKey;
                if(!storedKey){
                    if(freshError){
                        freshError.textContent='⚠️ Init key not set. Contact developer to set ownerInitKey in Firestore.';
                        freshError.style.display='block';
                    }
                    console.log('[DevDNA v1.0] Init key entry: FAILED (no key in Firestore)');
                    return;
                }
                const matched = entered === storedKey;
                console.log('[DevDNA v1.0] Init key entry:', matched ? 'SUCCESS' : 'FAILED');
                if(matched){
                    tempState.initKeyVerified=true;
                    showScreen('google-signin-screen');
                    bindGoogleHandlers();
                } else {
                    if(freshError){
                        freshError.textContent='⛔ Invalid init key. Check Firestore /settings/main/ownerInitKey';
                        freshError.style.display='block';
                    }
                    shakeElement(freshInput);
                }
            }catch(err){
                console.warn('[DevDNA v1.0] Init key verification failed', err);
                if(freshError){
                    freshError.textContent='⚠️ Setup unavailable — Firestore read failed. Check console.';
                    freshError.style.display='block';
                }
            }
        }finally{
            freshSubmit.disabled=false;
            freshSubmit.textContent='CONTINUE →';
        }
    });

    freshInput.addEventListener('keydown', (e)=>{
        if(e.key==='Enter'){
            e.preventDefault();
            freshSubmit.click();
        }
    });

    // Back button for google screen already handled elsewhere, but ensure back to key works
    const backBtn = $('owner-setup-back-to-key');
    if(backBtn){
        backBtn.addEventListener('click', ()=>{
            showScreen('init-key-screen');
        });
    }
}

function bindGoogleHandlers(){
    const btn = $('owner-google-signin-btn');
    const errorEl = $('google-signin-error');
    if(!btn) return;

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    const freshBtn = $('owner-google-signin-btn');

    freshBtn.addEventListener('click', async ()=>{
        freshBtn.disabled=true;
        freshBtn.textContent='⏳ Signing in...';
        if(errorEl){ errorEl.style.display='none'; errorEl.textContent=''; }
        try{
            const result = await signInWithGoogle();
            const user = result.user;
            console.log('[DevDNA v1.0] Owner Google sign-in success', user.email);
            tempState.googleUser = {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL,
                gmail: user.email
            };
            const gmailSpan = $('setup-gmail');
            if(gmailSpan) gmailSpan.textContent = user.email;
            showScreen('password-setup-screen');
            bindPasswordHandlers();
        }catch(err){
            console.error('[DevDNA v1.0] Owner Google sign-in failed', err);
            if(errorEl){
                errorEl.textContent = 'Google sign-in failed: ' + (err.message||'Unknown');
                errorEl.style.display='block';
            }
        }finally{
            freshBtn.disabled=false;
            freshBtn.textContent='🔐 SIGN IN WITH GOOGLE';
        }
    });
}

function bindPasswordHandlers(){
    const passInput = $('setup-password');
    const confirmInput = $('setup-password-confirm');
    const createBtn = $('setup-create-btn');
    const errorEl = $('setup-error');
    if(!passInput || !confirmInput || !createBtn) return;

    const newCreate = createBtn.cloneNode(true);
    createBtn.parentNode.replaceChild(newCreate, createBtn);
    const freshCreate = $('setup-create-btn');

    freshCreate.addEventListener('click', async ()=>{
        const pwd = $('setup-password')?.value || '';
        const confirm = $('setup-password-confirm')?.value || '';
        if(errorEl){ errorEl.style.display='none'; errorEl.textContent=''; }

        // Validate min 12 chars
        if(pwd.length < 12){
            if(errorEl){
                errorEl.textContent='⛔ Password must be at least 12 characters.';
                errorEl.style.display='block';
            }
            shakeElement($('setup-password'));
            return;
        }
        if(pwd !== confirm){
            if(errorEl){
                errorEl.textContent='⛔ Passwords do not match.';
                errorEl.style.display='block';
            }
            shakeElement($('setup-password-confirm'));
            return;
        }

        freshCreate.disabled=true;
        freshCreate.textContent='CREATING OWNER...';

        try{
            // Check if owner already exists (prevent race)
            const complete = await checkOwnerSetupStatus();
            if(complete){
                if(errorEl){
                    errorEl.textContent='⛔ Owner setup already completed by another session.';
                    errorEl.style.display='block';
                }
                showScreen('setup-already-done-screen');
                return;
            }

            // Also check if admin with this gmail already exists as owner
            const existing = await getAdminByGmail(tempState.googleUser.email);
            if(existing && existing.role==='owner'){
                if(errorEl){
                    errorEl.textContent='⛔ Owner account already exists for this Gmail.';
                    errorEl.style.display='block';
                }
                return;
            }

            // Write to Firestore /admins/{sanitized_gmail} via createAdmin (handles mock fallback for Shourya/Ryan/Rohan)
            const { getFirestore, doc, setDoc, updateDoc, deleteField, getDoc } = await import('firebase/firestore');
            let db=null;
            try{ db = getFirestore(); }catch{}

            const sanitized = tempState.googleUser.email.toLowerCase().replace(/@/g,'_at_').replace(/\./g,'_dot_');

            // Try using createAdmin from firebase.js which handles mock fallback
            try{
                await createAdmin({
                    gmail: tempState.googleUser.email,
                    displayName: tempState.googleUser.displayName,
                    avatar: tempState.googleUser.photoURL,
                    password: pwd,
                    role: 'owner',
                    permissions: getDefaultPermissions(),
                    addedBy: 'system-setup',
                    displayAsOwner: false
                });
                console.log('[DevDNA v1.0] Owner admin doc created via createAdmin', sanitized);
            }catch(e){
                console.warn('[DevDNA v1.0] createAdmin failed, trying direct setDoc', e.message);
                if(db){
                    const ownerData = {
                        gmail: tempState.googleUser.email.toLowerCase(),
                        displayName: tempState.googleUser.displayName,
                        avatar: tempState.googleUser.photoURL || '',
                        password: pwd,
                        role: 'owner',
                        permissions: getDefaultPermissions(),
                        displayAsOwner: false,
                        createdAt: Date.now(),
                        addedBy: 'system-setup',
                        lastSeen: Date.now(),
                        chatPreferences: { playSound:true, showToasts:true, showBadges:true }
                    };
                    await setDoc(doc(db, 'admins', sanitized), ownerData);
                } else {
                    // Mock fallback - directly write to localStorage
                    try{
                        const raw = localStorage.getItem('devdna_fallback_admins_v1');
                        const admins = raw ? JSON.parse(raw) : [];
                        admins.push({
                            gmail: tempState.googleUser.email.toLowerCase(),
                            displayName: tempState.googleUser.displayName,
                            avatar: tempState.googleUser.photoURL || '',
                            password: pwd,
                            role: 'owner',
                            permissions: getDefaultPermissions(),
                            displayAsOwner: false,
                            createdAt: Date.now(),
                            addedBy: 'system-setup'
                        });
                        localStorage.setItem('devdna_fallback_admins_v1', JSON.stringify(admins));
                    }catch{}
                }
            }

            // Write to /settings/main - ownerSetupComplete, ownerGmail, delete init key
            try{
                if(db){
                    const settingsRef = doc(db, 'settings', 'main');
                    try{
                        await updateDoc(settingsRef, {
                            ownerSetupComplete: true,
                            ownerGmail: tempState.googleUser.email,
                            updatedAt: Date.now(),
                            ownerInitKey: deleteField()
                        });
                    }catch(e){
                        const snap = await getDoc(settingsRef);
                        if(snap.exists()){
                            const data = snap.data();
                            await setDoc(settingsRef, {
                                ...data,
                                ownerSetupComplete: true,
                                ownerGmail: tempState.googleUser.email,
                                ownerInitKey: deleteField(),
                                updatedAt: Date.now()
                            }, { merge: true });
                        }else{
                            await setDoc(settingsRef, {
                                ownerSetupComplete: true,
                                ownerGmail: tempState.googleUser.email,
                                eventLive: true,
                                announcement: "🧬 DevDNA IS LIVE! Discover your Developer Archetype in 2 minutes. Scan your coding style, view the global leaderboard, and claim your shareable ID card! [ START ANALYSIS → ]",
                                announcementVisible: true,
                                theme: "cyberpunk",
                                leaderboardAutoClearDays: 10,
                                leaderboardFrozen: false,
                                nextAutoClearAt: Date.now()+10*24*60*60*1000,
                                updatedAt: Date.now()
                            });
                        }
                    }
                } else {
                    // Mock fallback settings
                    try{
                        const raw = localStorage.getItem('devdna_fallback_settings_v1');
                        const settings = raw ? JSON.parse(raw) : {};
                        settings.ownerSetupComplete = true;
                        settings.ownerGmail = tempState.googleUser.email;
                        delete settings.ownerInitKey;
                        settings.updatedAt = Date.now();
                        localStorage.setItem('devdna_fallback_settings_v1', JSON.stringify(settings));
                    }catch{}
                }
            }catch(e){
                console.warn('[DevDNA v1.0] Settings update failed', e);
            }

            console.log('[DevDNA v1.0] Settings updated: ownerSetupComplete true, ownerGmail set, initKey deleted');

            // Activity log
            try{
                await addActivityLog({
                    action: 'owner_setup_completed',
                    gmail: tempState.googleUser.email,
                    displayName: tempState.googleUser.displayName,
                    role: 'owner',
                    details: 'One-time owner setup completed via #owner-setup'
                });
            }catch{}

            // Generate recovery codes (Part 4)
            const recoveryCodes = Array.from({length:5}, generateRecoveryCode);
            tempState.recoveryCodes = recoveryCodes;
            const hashedCodes = await Promise.all(recoveryCodes.map(sha256));
            tempState.hashedCodes = hashedCodes;

            // Store hashed codes
            try{
                if(db){
                    const ownerRef = doc(db, 'admins', sanitized);
                    const codesArray = hashedCodes.map(h=>({ hash:h, used:false, createdAt: Date.now() }));
                    await updateDoc(ownerRef, { recoveryCodes: codesArray });
                    console.log('[DevDNA v1.0] Recovery codes hashed and stored');
                } else {
                    // Mock fallback
                    try{
                        const raw = localStorage.getItem('devdna_fallback_admins_v1');
                        const admins = raw ? JSON.parse(raw) : [];
                        const idx = admins.findIndex(a=>a.gmail.toLowerCase()===tempState.googleUser.email.toLowerCase());
                        if(idx>=0){
                            admins[idx].recoveryCodes = hashedCodes.map(h=>({ hash:h, used:false, createdAt: Date.now() }));
                            localStorage.setItem('devdna_fallback_admins_v1', JSON.stringify(admins));
                        }
                    }catch{}
                }
            }catch(err){
                console.warn('[DevDNA v1.0] Failed to store recovery codes', err);
            }

            // Show recovery codes screen
            showRecoveryCodesScreen();

        }catch(err){
            console.error('[DevDNA v1.0] Owner creation failed', err);
            if(errorEl){
                errorEl.textContent = 'Failed to create owner: ' + (err.message||'Unknown');
                errorEl.style.display='block';
            }
        }finally{
            freshCreate.disabled=false;
            freshCreate.textContent='CREATE OWNER ACCOUNT →';
        }
    });
}

function showRecoveryCodesScreen(){
    showScreen('recovery-codes-screen');
    const display = $('recovery-codes-display');
    if(!display) return;
    display.innerHTML='';
    tempState.recoveryCodes.forEach((code, i)=>{
        const card = document.createElement('div');
        card.className='code-card';
        card.innerHTML=`<div style="font-size:10px; color:var(--text-muted); margin-bottom:4px;">CODE ${i+1}</div><div>${code}</div>`;
        display.appendChild(card);
    });

    tempState.codesCopied=false;
    tempState.codesDownloaded=false;
    const finishBtn = $('setup-finish-btn');
    if(finishBtn){
        finishBtn.disabled=true;
        finishBtn.style.opacity='0.5';
        finishBtn.style.cursor='not-allowed';
    }

    bindRecoveryHandlers();
}

function bindRecoveryHandlers(){
    const copyBtn = $('copy-codes-btn');
    const downloadBtn = $('download-codes-btn');
    const finishBtn = $('setup-finish-btn');

    if(copyBtn){
        const newCopy = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopy, copyBtn);
        $('copy-codes-btn').addEventListener('click', async ()=>{
            const text = tempState.recoveryCodes.map((c,i)=>`${i+1}. ${c}`).join('\n');
            try{
                if(navigator.clipboard && window.isSecureContext){
                    await navigator.clipboard.writeText(text);
                }else{
                    const ta=document.createElement('textarea');
                    ta.value=text;
                    ta.style.position='fixed';
                    ta.style.opacity='0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                }
                const btn = $('copy-codes-btn');
                btn.textContent='✓ Copied!';
                setTimeout(()=>btn.textContent='📋 COPY ALL CODES', 2000);
                tempState.codesCopied=true;
                checkFinishEnable();
            }catch(e){
                alert('Copy failed, please manually copy');
            }
        });
    }

    if(downloadBtn){
        const newDl = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newDl, downloadBtn);
        $('download-codes-btn').addEventListener('click', ()=>{
            const txt = `DevDNA v1.0 — OWNER Recovery Codes
Generated: ${new Date().toISOString()}
Gmail: ${tempState.googleUser?.email||'unknown'}

⚠️ Keep these SAFE. Each code works ONCE.

${tempState.recoveryCodes.map((c,i)=>`${i+1}. ${c}`).join('\n')}

---
Built by ByteCraft | DevDNA v1.0
`;
            const blob = new Blob([txt], {type:'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href=url;
            a.download=`devdna-owner-recovery-codes-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            const btn = $('download-codes-btn');
            btn.textContent='✓ Downloaded!';
            setTimeout(()=>btn.textContent='💾 DOWNLOAD AS TXT', 2000);
            tempState.codesDownloaded=true;
            checkFinishEnable();
        });
    }

    if(finishBtn){
        const newFinish = finishBtn.cloneNode(true);
        finishBtn.parentNode.replaceChild(newFinish, finishBtn);
        $('setup-finish-btn').addEventListener('click', ()=>{
            // Redirect to admin panel
            const toast = document.getElementById('copy-toast');
            if(toast){
                toast.textContent='✅ Owner account created — redirecting to admin panel';
                toast.classList.remove('hidden');
                toast.classList.add('show');
                setTimeout(()=>{ toast.classList.remove('show'); toast.classList.add('hidden'); }, 2500);
            }
            // Clear state
            tempState = { initKeyVerified:false, googleUser:null, recoveryCodes:[], hashedCodes:[], codesCopied:false, codesDownloaded:false };
            location.hash='#secret-admin-only';
        });
    }

    function checkFinishEnable(){
        const fb = $('setup-finish-btn');
        if(!fb) return;
        if(tempState.codesCopied || tempState.codesDownloaded){
            fb.disabled=false;
            fb.style.opacity='1';
            fb.style.cursor='pointer';
        }
    }

    // Already done / unavailable go buttons
    const goAdmin = $('setup-go-admin-btn');
    if(goAdmin){
        const newGo = goAdmin.cloneNode(true);
        goAdmin.parentNode.replaceChild(newGo, goAdmin);
        $('setup-go-admin-btn').addEventListener('click', ()=>{
            location.hash='#secret-admin-only';
        });
    }
}
