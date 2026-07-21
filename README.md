[README.md](https://github.com/user-attachments/files/30228006/README.md)[Uploading # 🧬 DevDNA v2 — Tec Toc 2025 Massive Upgrade

> Cyberpunk Developer Archetype Quiz — now with boot sequence, matrix rain, SFX, admin control center, live announcement banner, QR result cards, and hash-routed status pages.

**Live URL:** `https://devdna-2trh.onrender.com/`  
**Event:** Tec Toc 2025 • School Tech Showcase Ready  
**Stack:** HTML, CSS, Vanilla JS (ES Modules), Firebase Firestore, QRCode.js CDN, Canvas API

---

## 🆕 What's New in v2 (vs v1)

### 🐞 Critical Bug Fixes
1. **Download Card Watermark & Icon** — watermark now perfectly centered (`W/2, H/2`) at 12% opacity, not cut off. Icon is `92px`, bright white with double neon glow `shadowBlur 28+16`, visible for all 5 archetypes.
2. **Quiz Answer Layout** — Desktop `min-width:769px` → `grid-template-columns: 1fr 1fr` (2x2), Mobile → 1 column stacked.
3. **Toast** — Now `position: fixed; bottom:28px; left:50%; z-index:99999;` floating above leaderboard, fade-in/out, auto-hide 2.5s, neon green glow.
4. **Share Link** — Fixed to `https://devdna-2trh.onrender.com/` (was `devdna.onrender.com`).

### ✨ New Features
- **Feature 1: SFX** — hover click, select beep, complete ding, reveal swoosh. Toggle 🔊/🔇 top-right, persists in localStorage, volume 35%, preloaded.
- **Feature 2: Typing Animation** — `DevDNA` types at 90ms/char, subtitle `Discover Your Developer Archetype` at 42ms/char with blinking cursor.
- **Feature 3: Boot Screen** — Every visit ~2.5s, terminal green text typing:
  ```
  > Initializing DevDNA...
  > Loading neural weights...
  > Connecting to archetype database...
  > System ready.
  ```
  Plus cyberpunk loading bar 0→100% with shimmer.
- **Feature 4: Best Pair** — Result shows:
  - Frontend Wizard → Backend Architect — "You design the dream, they build the engine."
  - Backend Architect → Frontend Wizard — "You build the engine, they design the dream."
  - Full Stack Ninja → Debugging Detective — "You build fast, they keep it flawless."
  - Debugging Detective → Full Stack Ninja — "You catch the chaos, they create the code."
  - AI Explorer → Frontend Wizard — "You bring intelligence, they make it beautiful."
- **Feature 5: Full Breakdown** — All 5 archetypes with % match sorted high→low, neon animated bars.
- **Feature 6: Custom Cursor** — Desktop only, crosshair dot + ring, hover scale, trail effect, disabled on touch.
- **Feature 7: Matrix Rain** — `<canvas id="matrix-canvas">` low opacity 9%, green+purple chars, slow fall, on landing/result/admin/404.
- **Feature 8: Reveal Sequence** — After last question, overlay:
  ```
  > SCANNING NEURAL PATTERNS...
  > ANALYZING RESPONSES...
  > DECODING DNA...
  > COMPLETE.
  ```
  Glitch + fade into result with glow-in animation.
- **Feature 9: Total Users Counter** — Landing below CTA: `⚡ [NUMBER] developers analyzed`, animated count-up 0→total from Firebase `total`.
- **Feature 10: QR Code on Card** — Bottom-right QR linking to `https://devdna-2trh.onrender.com/` with neon border, plus bottom-left `Generated on 03 Oct 2025`.

### 🔒 Secret Admin Panel
- **Route:** `https://devdna-2trh.onrender.com/#secret-admin-only`
- **Password:** `2trh-8D`
- Wrong → glitch + shake + red `ACCESS DENIED`
- Correct → `> ACCESS GRANTED. WELCOME, ADMIN.` → dashboard

**Dashboard:**
1. **Event Control** — Toggle `EVENT STATUS: 🟢 LIVE / 🔴 CLOSED`, START/CLOSE buttons (green/red glow). When CLOSED: public sees 🔒 locked screen with matrix rain.
2. **Leaderboard Control** — Total submissions, CLEAR ALL (confirm modal), DOWNLOAD JSON.
3. **Stats** — Glowing cards per archetype counts.
4. **Announcement Banner** — Input + UPDATE/HIDE, real-time top banner for all users.
5. **Export** — JSON `{exportedAt, settings, counts}`.
6. **Logout** — Clears session.

**Firebase Settings Docs:**
```
/settings/main {
  eventLive: boolean,
  announcement: string,
  announcementVisible: boolean,
  updatedAt: timestamp
}
```
Also legacy compat:
`/settings/eventStatus { live: boolean }`
`/settings/announcement { text, visible }`

Main site listens real-time via `subscribeToSettings()` → instant banner/event updates.

### 🌐 Uptime Ping Page
- **Route:** `#uptime-ping`
- Big `DevDNA STATUS: 🟢 ONLINE`, uptime timer `HH:MM:SS` from page load, last checked timestamp, Firestore status, auto-refresh every 30s ping. Used for human status view; Uptime Robot should still ping main URL.

### ❌ 404 Page
- Any invalid hash (e.g., `#foobar`) → glitchy 404: big `ERROR 404` with glitch animation, subtitle `ACCESS DENIED — RETURN TO BASE`, matrix rain, random hacker lines, RETURN TO DEVDNA button.

---

## 📁 Final File Structure

```
/devdna
│── index.html          # main + hash routing for #secret-admin-only, #uptime-ping, #404
│── style.css           # main styles (includes boot, matrix, cursor, grid fix, toast)
│── admin.css           # admin panel styles (glitch, shake, dashboard)
│── script.js           # main quiz logic v2 (SFX, typing, boot, matrix, cursor, reveal, QR)
│── admin.js            # admin panel logic
│── firebase.js         # Firebase + settings + leaderboard + mock fallback
│── audio/
│     ├── click.mp3     # soft cyberpunk click (see links below - replace silent placeholder)
│     ├── select.mp3    # futuristic beep
│     ├── complete.mp3  # success ding
│     ├── reveal.mp3    # dramatic swoosh
│     └── README.txt    # download instructions
│── assets/
│     └── .gitkeep
│── README.md
```

---

## 🎵 Audio Files — Download Instructions (IMPORTANT)

Repo includes silent placeholder wavs to prevent 404. Replace them with real SFX for Tec Toc wow-factor.

All files are **free, royalty-free, no attribution required** from **Pixabay**:

1. **click.mp3 — soft cyberpunk click**
   - Recommended: `Interface Click - Light` 
   - Download page: https://pixabay.com/sound-effects/search/click/  
   - Direct pick: https://pixabay.com/sound-effects/click-button-140881/ (click → Download MP3)
   - Put as `audio/click.mp3`

2. **select.mp3 — futuristic beep**
   - Recommended: `Beep Sound - Electronic`
   - Download page: https://pixabay.com/sound-effects/search/beep/
   - Direct pick: https://pixabay.com/sound-effects/beep-sound-8333/
   - Put as `audio/select.mp3`

3. **complete.mp3 — success ding**
   - Recommended: `Success Bell / Level Up`
   - Download page: https://pixabay.com/sound-effects/search/success%20ding/
   - Direct pick: https://pixabay.com/sound-effects/success-1-6297/
   - Put as `audio/complete.mp3`

4. **reveal.mp3 — dramatic swoosh**
   - Recommended: `Swoosh Whoosh`
   - Download page: https://pixabay.com/sound-effects/search/dramatic%20swoosh/
   - Direct pick: https://pixabay.com/sound-effects/swoosh-142322/
   - Put as `audio/reveal.mp3`

**Steps:**
1. Open each Pixabay link → big green **Download** button → MP3.
2. Rename to exactly `click.mp3`, `select.mp3`, `complete.mp3`, `reveal.mp3`.
3. Drop into `/audio/` folder, overwriting placeholders.
4. Commit & push → Render auto-deploys.

Volume is coded to `0.35` (35%) soft. Toggle state saves in `localStorage['devdna_sound_enabled']`.

> Tip: You can also search Freesound.org: `https://freesound.org/search/?q=cyberpunk+click` — same process.

---

## 🔥 Firebase Setup v2

1. Create project https://console.firebase.google.com
2. Firestore → Create Database → Test Mode → Location `asia-south1` (Mumbai) for Kerala latency.
3. Project Settings → General → Web app → Copy `firebaseConfig` → paste into `firebase.js`.
4. **Collections to create** (auto-created on first write if you skip):
   - `devdna_leaderboard/global` → `{ frontend:0, backend:0, fullstack:0, debugging:0, ai:0, total:0 }`
   - `settings/main` → `{ eventLive:true, announcement:"🎉 Welcome to Tec Toc 2025!", announcementVisible:false, updatedAt: Date.now() }`

5. **Security Rules** (demo open):
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
Lock down after event with auth if needed.

6. **How to change admin password:** Edit `admin.js` line `const ADMIN_PASSWORD = '2trh-8D';` → replace string. Redeploy.

---

## 🚀 Deploy on Render (Static Site)

**No build needed.**

1. Push `/devdna` to GitHub repo root (or keep inside folder and set root dir).
2. Render Dashboard → New → Static Site → Connect repo.
3. Settings:
   - Root Directory: `devdna` (if repo has subfolder) or `.`
   - Build Command: (empty)
   - Publish Directory: `.`
4. Create → Get URL `https://devdna-2trh.onrender.com/` — rename if free.
5. After each GitHub push, Render auto-deploys in ~40s.

---

## 🌐 Custom Domain on Render

1. Buy domain e.g., `devdna.site`
2. Render → Your Site → Settings → Custom Domains → Add `devdna.site` + `www.devdna.site`
3. Render shows CNAME target e.g., `devdna-2trh.onrender.com`
4. Registrar DNS → Add CNAME:
   - Host `@` → `devdna-2trh.onrender.com`
   - Host `www` → `devdna-2trh.onrender.com`
5. Wait TLS provisioning. Update `SITE_URL` constant in `script.js` if you change domain (also QR).

---

## 🤖 Uptime Robot Setup

1. https://uptimerobot.com → Free account → Add New Monitor
   - Type: HTTP(s)
   - Friendly Name: DevDNA
   - URL: `https://devdna-2trh.onrender.com/` (important: main URL, not #uptime-ping)
   - Interval: 5 mins
2. Optional: Monitor `#uptime-ping` URL as well for human check: `https://devdna-2trh.onrender.com/#uptime-ping`
3. Enable email alerts.
4. Render static sites rarely sleep, but this ensures instant wake + status badge.

---

## 🧪 QA Checklist for Tec Toc Projector

- [ ] Boot screen ~2.5s: green terminal lines typing, loading bar 0→100%, fades.
- [ ] Landing typing: `DevDNA` then subtitle character-by-character + cursor blink.
- [ ] Sound toggle 🔊 top-right (bottom-right mobile), persists after reload.
- [ ] Hover any button → soft click (if sound on).
- [ ] Total counter counts up from 0 to Firebase total (e.g., 556→) with ⚡.
- [ ] Start Analysis → quiz 2x2 grid on desktop, 1 column mobile, no overflow.
- [ ] Select answer → beep + 420ms delay → next.
- [ ] After Q12 → reveal overlay `SCANNING... ANALYZING... DECODING... COMPLETE.` → result glow-in.
- [ ] Result icon bright neon, aura strong, watermark perfectly centered faint.
- [ ] Best pair shows correct mapping per spec, breakdown % total 100%, sorted.
- [ ] Download → PNG includes QR bottom-right (scannable to live URL) + `Generated on DD MMM YYYY` bottom-left + domain.
- [ ] Share copies exact text with `https://devdna-2trh.onrender.com/` + floating toast bottom-center above all.
- [ ] Leaderboard live bars, total decoded.
- [ ] Hash `#secret-admin-only` → login → password `2trh-8D` → dashboard → toggle event live/closed → banner update appears instantly on main page in another tab.
- [ ] Event CLOSED → new visitors see locked screen `🔒 DevDNA is locked.`
- [ ] Hash `#uptime-ping` → status page with uptime timer ticking.
- [ ] Hash `#random-xyz` → 404 glitch page + RETURN button.
- [ ] Custom cursor crosshair only desktop, trail, hover scale.
- [ ] Matrix rain subtle 10% everywhere, not laggy.

---

## 🔒 Admin Quick Access

- URL: `https://devdna-2trh.onrender.com/#secret-admin-only`
- Password: `2trh-8D`
- Change password: in `admin.js` → `ADMIN_PASSWORD`
- Change announcement: dashboard input → UPDATE BANNER
- Clear leaderboard: dashboard → CLEAR ALL → confirm.
- Export: DOWNLOAD LEADERBOARD DATA → JSON file.

---

## 📜 License

MIT — Use for Tec Toc, portfolio, startup. Credit appreciated.

---

## 🙏 Credits

v1 built as senior frontend piece; v2 massive upgrade for Tec Toc 2025 — boot sequence, matrix rain, SFX, QR cards, admin control center, hash routing, all vanilla.

*Decode. Reveal. Ship.*
README.md…]()
