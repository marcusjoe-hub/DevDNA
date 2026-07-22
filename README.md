[README.md](https://github.com/user-attachments/files/30272737/README.md)
# 🧬 DevDNA v3.0 — Tec Toc 2026 Enterprise Admin Overhaul

> Cyberpunk Developer Archetype Quiz — now enterprise-grade: Google Auth, role hierarchy Owner > Administrator > Admin, permissions, question editor, activity log, real-time theme switcher, sidebar admin, QR cards, matrix rain, boot sequence.

**Live URL:** `https://devdna-2trh.onrender.com/`  
**Event:** Tec Toc 2026 • Enterprise-Grade Showcase  
**Stack:** HTML, CSS, Vanilla JS (ES Modules), Firebase Auth (Google) + Firestore, QRCode.js local, Canvas API, themes.js

---

## 🚨 OWNER CONFIGURATION REQUIRED (BEFORE GITHUB PUSH)

Open `firebase.js` and replace placeholders:

```js
export const OWNER_CONFIG = {
    gmail: "OWNER_GMAIL_PLACEHOLDER@gmail.com", // ← Replace with your real Gmail e.g. marcus@gmail.com
    displayName: "Marcus",
    password: "OWNER_PASSWORD_PLACEHOLDER", // ← Replace with strong password e.g. 2trh-8D!xK9...
    role: "owner"
};
```

- Owner Gmail = the Google account you will use to sign in first.
- Owner Password = personal password after Google sign-in (second factor).
- Owner is auto-created on first load if missing, protected — cannot be removed/demoted EVER, recreates if deleted.

---

## ✨ Features Overview

### Core Quiz (preserved from v2.1)
- Boot screen 2.5s terminal typing, progress 0→100%
- Typing animation `DevDNA` 90ms/char + subtitle 42ms/char (guarded single execution)
- 12+ questions loaded from Firebase `/questions/` (seed from hardcoded if empty), cached per quiz session
- 2x2 grid desktop, 1 column mobile, progress bar glow
- Result reveal `SCANNING... ANALYZING... DECODING... COMPLETE.` + glow-in
- Best pair compatibility, full breakdown % sorted, neon bars
- Download PNG 1080x1350 with centered watermark 12%, bright emoji glow, QR bottom-right linking to `https://devdna-2trh.onrender.com/`, `Generated on DD MMM YYYY`
- Share copies exact URL `https://devdna-2trh.onrender.com/` + floating toast bottom-center
- Total counter real Firebase `total` only (0 if empty), animated 0→real
- Matrix rain 9% opacity, custom cursor desktop, announcement banner fixed top with neon pulse
- Sound toggle top-right shifts below banner when visible (Option B), volume 0.15, debounce, click-only (no hover spam)

### v3 New: Auth System
**Route:** `https://devdna-2trh.onrender.com/#secret-admin-only`

**Flow:**
1. Screen 1 `AUTHORIZATION REQUIRED` → Google Sign-In button (Firebase Auth Google provider)
2. Google popup → Gmail → check Firestore `admins` collection
   - ❌ Not in list → `ACCESS DENIED — This Gmail is not authorized.` + auto logout, logs failed attempt
   - ✅ In list → Screen 2 `IDENTITY CONFIRMED — [Display Name]`
3. Screen 2 password input (personal password per admin)
   - ❌ Wrong → glitch+shake red, attempt counter, logs failed
   - ✅ Correct → `ACCESS GRANTED. WELCOME, [ROLE].` → dashboard
4. Session persists forever until logout (localStorage + Firebase Auth)

### Role Hierarchy
- 👑 **OWNER (Marcus)** — hardcoded Gmail, password placeholder, auto-created, cannot be removed/demoted EVER, has ALL permissions ALWAYS, ONLY can promote to ADMINISTRATOR, demote ADMINISTRATOR→ADMIN, remove ADMINISTRATOR, view all passwords, clear entire activity log (even if unchecked)
- ⚡ **ADMINISTRATOR** — Has ALL permissions automatically, can add/remove/edit regular ADMINs, change permissions, cannot remove/demote OWNER, cannot view OWNER or other ADMINISTRATOR passwords, can clear activity log if permission
- 🛡️ **ADMIN** — Only permissions explicitly granted

Visual badges gold/purple/blue everywhere.

### Permission System (12 perms)
Top toggle `⚡ ADMINISTRATOR Grants full access... [TOGGLE]` — when ON all checkboxes auto-checked disabled.

Individual:
1. `event_control` 🎬 Event Control — Start/close event
2. `change_banner` 📢 Change Announcement Banner
3. `clear_submissions` 🗑️ Clear Submissions
4. `download_data` 💾 Download Leaderboard Data
5. `edit_questions` ✏️ Edit Questions
6. `add_questions` ➕ Add Questions
7. `delete_questions` ❌ Delete Questions
8. `manage_admins` 👥 Manage Admins (regular only)
9. `set_permissions` 🔧 Set Permissions
10. `view_stats` 📊 View Stats
11. `change_theme` 🎨 Change Site Theme
12. `clear_activity_log` 🧹 Clear Activity Log

OWNER → all true always (no checkboxes). ADMINISTRATOR → all true locked ON. ADMIN → only checked. UI sections hide if no permission.

### New Admin Dashboard (Sidebar Layout)
Discord-style sidebar + content, hamburger collapses mobile.

**Sidebar Tabs** (hide if no permission except Dashboard always):
- 📊 **Dashboard** — overview stats total submissions, most popular archetype, event status, active admins count, quick glowing cards, recent activity last 5
- ⚙️ **Event** — big toggle LIVE/CLOSED, START/CLOSE buttons, needs `event_control`
- 📢 **Banner** — input, UPDATE/HIDE, live preview, needs `change_banner`
- ❓ **Questions** — list expand/collapse, shows text, 4 answers with archetype mapping, Edit/Delete/Add buttons per perms, editor form with question textarea + 4 answer inputs + archetype dropdowns, Save writes to Firebase, future takers only
- 🏆 **Leaderboard** — total counter, stats big glowing numbers (fixed from v2.1 broken icon), CLEAR ALL with modal if `clear_submissions`, DOWNLOAD JSON if `download_data`
- 👥 **Admins** — list with role badges, avatars, filter/search, ADD NEW ADMIN modal: Gmail, Display Name, Password + 🎲 Generate Hard, Role dropdown ADMIN/ADMINISTRATOR (only OWNER sees ADMINISTRATOR), if ADMIN permission checkboxes, CREATE. Edit modal: change name, change password (OWNER sees eye toggle 👁️, others ••••••••), toggle Administrator (only OWNER), edit permissions, Remove with confirm, OWNER row locked
- 📜 **Activity Log** — unlimited Firebase, reverse chronological `[2026-01-15 3:45:22 PM] 👑 Marcus (OWNER) → started the event`, search/filter by admin/action/date/role, CLEAR LOG button if `clear_activity_log` (OWNER always can)
- 🎨 **Theme** — grid of 6 preset cards: Cyberpunk Neon (default green/purple/blue), Matrix Green (all green), Blood Neon (red/black/white), Ocean Deep (blue/teal/navy), Sunset Wave (orange/pink/purple), Monochrome (white/gray/black). Click applies instantly to all users via `/settings/main/theme`, real-time listener updates CSS vars with 0.5s transition

**Sidebar Footer:** Avatar (Google pic), display name, role badge, Logout button.

**Password Visibility:** OWNER sees every admin's password (except own) with eye toggle; ADMINISTRATOR sees •••••••• no reveal; ADMIN cannot see admin page unless `manage_admins`.

**Logging:** Login/logout, failed attempts (gmail), event start/close, banner update/hide, submissions cleared, questions added/edited/deleted, admin added/removed/edited, permissions changed, theme changed, log cleared — format `timestamp + role emoji + displayName + (ROLE) + action`.

**Banner + Sound Fix Option B:** Sound button stays top-right, when banner visible pushes header + sound button down by banner height via CSS `--banner-height` + JS `top = bannerHeight+12px`, smooth transition, mobile too.

**Questions Migration:** Hardcoded in `script.js` fallback, but on first load if `/questions/` empty → seed with 12 hardcoded. Main quiz loads from Firebase on quiz start, cached for session.

---

## 📁 File Structure v3

```
/devdna
│── index.html          # main + hash routing + new sidebar admin HTML
│── style.css           # main styles with CSS vars --neon-primary etc + theme transitions + banner/sound fix
│── admin.css           # sidebar layout, toggle switch, theme grid, questions, admins, activity
│── script.js           # main quiz now loads questions from Firebase, theme listener, click sound global
│── admin.js            # rewritten: Google Auth, roles, permissions, sidebar tabs, CRUD
│── firebase.js         # Auth + Firestore: admins, questions, activity_log, theme, owner auto-seed
│── themes.js           # 🆕 theme presets + applyTheme() with 6 themes
│── lib/
│     └── qrcode.min.js # local QR (fixed tracking prevention)
│── audio/
│     ├── click.mp3
│     ├── select.mp3
│     ├── complete.mp3
│     └── reveal.mp3
│── assets/.gitkeep
│── README.md
```

---

## 🔥 Complete Firebase Setup

### 1. Create Project
- Go https://console.firebase.google.com → Add project → Name `devdna` → Disable Google Analytics (optional) → Create

### 2. Enable Firestore
- Build → Firestore Database → Create database → Start in **Test mode** → Location `asia-south1` (Mumbai) or nearest → Enable
- Rules for Tec Toc event (open):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```
Lock down after event.

### 3. Enable Authentication → Google Provider (STEP-BY-STEP)
- Build → Authentication → Get started
- Sign-in method tab → Add new provider → **Google** → Enable toggle
- Support email: select your Gmail (e.g., owner Gmail)
- Project public-facing name: `DevDNA`
- Save
- Settings tab → Authorized domains → **Add domain** → `devdna-2trh.onrender.com` → Add
- Also ensure `localhost` is there for local testing (default)

### 4. Copy Web SDK Config to `firebase.js`
- Project Settings → General → Your apps → Web → Add app if none → Nickname `devdna-web` → Register
- Copy `firebaseConfig` object:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```
- Paste into `firebase.js` replacing placeholder `YOUR_API_KEY` etc.

### 5. Firestore Collections Auto-Created
On first site load, code auto-creates:
- `/settings/main` → `{eventLive:true, announcement:"🎉 Welcome to Tec Toc 2026!", announcementVisible:false, theme:"cyberpunk", updatedAt}`
- `/devdna_leaderboard/global` → `{frontend:0, backend:0, fullstack:0, debugging:0, ai:0, total:0}`
- `/admins/{owner_sanitized}` → owner doc from `OWNER_CONFIG` (if not exists)
- `/questions/` → seeded with 12 hardcoded if empty
- `/activity_log/` → empty until actions

You can also manually create via Firestore console.

### 6. Owner Setup
- In `firebase.js`, replace `OWNER_GMAIL_PLACEHOLDER@gmail.com` with real owner Gmail (must match Google account you will sign in with)
- Replace `OWNER_PASSWORD_PLACEHOLDER` with strong personal password (e.g., `Marcus$2026!Secure`)
- First time owner signs in via Google → second screen enter that password → gets OWNER role
- Owner cannot be removed/demoted, even if you delete doc in console, it recreates on next load

---

## 👥 How Role & Permission System Works

### Hierarchy
```
👑 OWNER (Marcus) > ⚡ ADMINISTRATOR (Shaurya-tier) > 🛡️ ADMIN (custom)
```

- OWNER has ALL perms always, sees all passwords with 👁️ toggle, only one who can promote/demote ADMINISTRATOR
- ADMINISTRATOR has ALL perms automatically (checkboxes locked ON), can manage ADMINs but not OWNER or other ADMINISTRATOR passwords
- ADMIN only has checked perms, UI hides disallowed tabs

### Adding Admins
- Go to `#secret-admin-only` → Google Sign-In → Password → Admins tab → ADD NEW ADMIN
- Gmail must be exact Google account the person will use
- Display Name, Password (use 🎲 Generate Hard for random 16-char), Role
- If ADMIN, toggle ADMINISTRATOR ON → full access, OFF → check individual perms
- CREATE → Firestore doc created → person can now sign in

### Permissions Enforcement
- Frontend hides tabs via `userCan(permId)` check + `.hidden-perm` class
- Backend Firestore rules currently open for school event (allow read/write true). For production, add custom claims or check role via Cloud Functions.

---

## ❓ Question Editor How-To

- Questions stored in `/questions/{id}` with `order`, `text`, `options: [{text, archetype}]`
- Main quiz on Start Analysis calls `getQuestions()` → sorted by `order` → cached as `quizSessionQuestions` for entire session (so admin edits mid-quiz don't affect current player)
- Admin → Questions tab → Expand question → Edit/Delete
- Edit: textarea question, 4 rows answer text + dropdown archetype → Save → `updateQuestion()` → next taker gets new version
- Add: same form, ADD NEW QUESTION → `addQuestion()`
- Delete: confirmation modal → `deleteQuestion()`
- All logged in activity log

---

## 🎨 Theme Switcher How-To

- Themes defined in `themes.js` `THEMES` object with colors mapping to CSS vars `--neon-primary`, `--neon-green`, etc.
- Store selected theme string in `/settings/main/theme`
- Main site `subscribeToSettings()` listener calls `applyTheme(themeKey)` which sets `document.documentElement.style.setProperty()` + `data-theme` attr + localStorage
- Smooth 0.5s transition on `body, .glass-panel, .top-bar, .btn` etc.
- Click theme card in Admin → Theme tab → updates Firebase → all connected clients instantly switch

Presets:
1. Cyberpunk Neon (default)
2. Matrix Green
3. Blood Neon
4. Ocean Deep
5. Sunset Wave
6. Monochrome

---

## 🚀 Deploy on Render

- Push `/devdna` to GitHub repo root (or subfolder)
- Render Dashboard → New → Static Site → Connect repo
- Root Directory: `devdna` or `.` → Build Command: empty → Publish Directory: `.`
- Create → URL `https://devdna-2trh.onrender.com/` → add custom domain if needed
- After each push, auto-deploy

Add authorized domain `devdna-2trh.onrender.com` in Firebase Auth → Settings → Authorized domains (already done in setup).

---

## 🤖 Uptime Robot

- https://uptimerobot.com → New Monitor → HTTP(s) → Friendly Name DevDNA → URL `https://devdna-2trh.onrender.com/` → Interval 5 mins → Create
- Optional second monitor for `https://devdna-2trh.onrender.com/#uptime-ping`
- Keeps Render awake + email alerts

---

## 🔒 Security Notes for Tec Toc

- Passwords stored plain text per spec Option A (school event). For prod, use Firebase Auth custom claims + hash, not Firestore plain.
- Firestore rules open `allow read, write: if true` for demo convenience. After event, lock down: `allow read: if true; allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.token.email.replace...))`
- Owner doc protected client-side + auto-reseed, but Firestore console can still delete manually — code will recreate on next load.

---

## 🧪 QA Checklist for Tec Toc 2026

- Click sound plays on ALL button clicks (Start, answer, Download, Share, admin buttons) no hover spam, volume 15%
- Google Sign-In popup appears on `#secret-admin-only`
- Non-authorized Gmail → ACCESS DENIED + auto logout after 3s
- Authorized Gmail → password screen shows Identity Confirmed
- Wrong password → glitch+shake red + attempt counter
- Correct password → dashboard loads with sidebar
- Sidebar nav works, hamburger collapses mobile
- Owner sees all passwords with 👁️ toggle, Administrator sees ••••••••
- Administrator can add/remove ADMINs but not OWNER
- Cannot demote/remove OWNER (error)
- Permission checkboxes: ADMINISTRATOR toggle disables individual checkboxes
- Questions load from Firebase in main quiz (check Network → Firestore)
- Question edits reflect on next quiz taker (open 2 tabs, edit in admin, start new quiz in other tab → new question appears)
- Activity log records all actions with timestamp + emoji + name + role
- Theme switcher applies to all users real-time (open 2 browsers, change theme in admin → main site instantly changes colors with 0.5s transition)
- Banner + sound button no longer overlap: banner fixed top, sound button shifts below when banner visible, smooth
- All permissions properly hide/show UI sections
- QR code on download PNG works in Edge Strict tracking prevention (local lib, not CDN)
- Total counter real Firebase 0 if cleared
- Boot typing not doubled
- Event CLOSED shows locked screen, admin still accessible

---

## 🎵 Audio Files (same as v2.1)

Placeholders silent in repo — replace with real MP3s from Pixabay:
- click.mp3 → https://pixabay.com/sound-effects/click-button-140881/
- select.mp3 → https://pixabay.com/sound-effects/beep-sound-8333/
- complete.mp3 → https://pixabay.com/sound-effects/success-1-6297/
- reveal.mp3 → https://pixabay.com/sound-effects/swoosh-142322/

---

## 📜 License

MIT — Use for Tec Toc, portfolio, startup.

*Enterprise-grade admin, cyberpunk soul — Tec Toc 2026.*
