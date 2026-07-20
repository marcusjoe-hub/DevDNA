# 🧬 DevDNA — Discover Your Developer Archetype

> A cyberpunk-themed, production-ready Developer Archetype Quiz. Decode your coding soul into 1 of 5 archetypes. Built with pure HTML, CSS, Vanilla JS + Firebase real-time leaderboard.

**Live Demo:** `https://devdna.onrender.com` *(replace after deploy)*  
**Tech Event Ready:** Dark neon glassmorphism, animated particles, fully responsive, zero backend required.

---

## ✨ Preview

```
Landing → 12 Question Quiz → Result Card (canvas export) → Share → Live Leaderboard
```

- **Hero:** Glowing `DevDNA` title with neural scan badge
- **Quiz:** One question at a time, fade transitions, progress bar, 4 glassmorphic options
- **Result:** Neon aura archetype card with icon, traits, canvas-exported PNG
- **Leaderboard:** Real-time Firestore sync showing global popularity % bars

---

## 🧠 The 5 Archetypes

| Emoji | Archetype | Vibe | Neon |
|-------|-----------|------|------|
| 🎨 | **Frontend Wizard** | Pixel perfectionist, motion nerd | `#00ccff` |
| 🛠 | **Backend Architect** | Scales to 1M req/s, DB whisperer | `#00ff99` |
| ⚡ | **Full Stack Ninja** | 0→1 shipper, stack polyglot | `#a855f7` |
| 🐞 | **Debugging Detective** | Heisenbug hunter, log whisperer | `#ff8a00` |
| 🤖 | **AI Explorer** | Prompt engineer, automation addict | `#00ffff` |

Quiz logic:
- 12 original questions (problem solving, design pref, debugging habit, AI curiosity, system arch, team role, learning style, pressure reaction, etc.)
- Each option → +1 point to one archetype
- Winner = highest score, deterministic tie-break via `['frontend','backend','fullstack','debugging','ai']` order

---

## 🌌 Features List

- [x] **Cyberpunk Theme** — deep black `#0a0a0f`, neon green `#00ff99`, blue `#00ccff`, purple `#a855f7`, glassmorphism + blur
- [x] **Particle Network Background** — canvas animated dots + connecting lines, subtle glow
- [x] **Landing Section** — glowing title, subtitle, Start Analysis CTA with hover glow
- [x] **Smart Quiz Engine** — 12 Q, 4 options, keyboard support (1-4 / A-D), progress bar, counter
- [x] **Result Screen** — aura, emoji icon, description, trait pills, unique ID
- [x] **Download Result Card** — 1080x1350 canvas PNG, neon styling, grid, gradients, works on mobile
- [x] **Share Button** — copies `"I just discovered I'm a [Archetype] on DevDNA! ⚡ Try it yourself at devdna.onrender.com"` + toast
- [x] **Live Leaderboard** — Firestore real-time `onSnapshot`, animated % bars, fallback to localStorage mock
- [x] **Mobile-First Responsive** — no overflow, projector clean, touch haptics via `navigator.vibrate`
- [x] **Zero Dependencies** — No Node, no bundler. Works by opening `index.html` or on Render static site
- [x] **Clean Code** — semantic HTML, modular JS, no inline CSS/JS, commented, no global pollution

---

## 📁 Folder Structure

```text
/devdna
│── index.html        # Semantic HTML5 structure + importmap for Firebase
│── style.css         # Cyberpunk glassmorphism system, animations, responsive
│── script.js         # ES module: particles, quiz flow, result, canvas export, leaderboard UI
│── firebase.js       # Firebase init + Firestore helpers + localStorage fallback
│── assets/           # Put icons/images here (currently self-contained via emoji/data-URI)
│── README.md         # This file
```

### File Responsibilities

- **index.html**: Sections (landing, quiz, result), top bar, bg canvas, export canvas (hidden), Google Fonts (Orbitron, Space Grotesk, JetBrains Mono)
- **style.css**: CSS variables, bg layers (gradient + grid + noise), glass-panel, buttons, options, result card, leaderboard bars, `prefers-reduced-motion` support
- **script.js**: `ARCHETYPES`, `QUIZ_QUESTIONS`, state (`scores`), `initParticles()`, `renderQuestion()`, `calculateResult()`, `generateResultCard()`, leaderboard rendering
- **firebase.js**: Placeholder `firebaseConfig`, `isConfigured` detection, `incrementArchetype()`, `subscribeToLeaderboard()`, `ensureLeaderboardDoc()`, mock listeners for offline demo

---

## 🔥 Firebase Setup (Replace Placeholder)

1. Create project at https://console.firebase.google.com
2. **Build → Firestore Database → Create Database → Test Mode** (for event/demo)
   - Location: pick nearest (e.g., `asia-south1` if you're in Kerala)
3. **Project Settings → General → Your apps → Web** → copy config
4. Open `firebase.js` and replace:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. **Firestore Security Rules** (for demo, open read/write). For production, restrict:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /devdna_leaderboard/{doc} {
      allow read: if true;
      allow write: if true; // replace with auth/validation in prod
    }
  }
}
```

6. Data will auto-create:
   - Collection: `devdna_leaderboard`
   - Doc: `global`
   - Fields: `frontend, backend, fullstack, debugging, ai, total`

> **No Firebase yet?** App automatically falls back to `localStorage` mock with seed data `127,98,143,76,112` so leaderboard still works and looks live — perfect for judging without internet.

---

## 🚀 Deploy on Render (Static Site)

DevDNA is 100% static. No build command.

1. Push this `/devdna` folder to GitHub repo (e.g., `yourname/devdna`)
2. Go to https://dashboard.render.com → **New → Static Site**
3. Connect GitHub repo, set:
   - **Root Directory:** `devdna` (or `/` if repo root is project root)
   - **Build Command:** *(empty)*
   - **Publish Directory:** `.` or `./devdna`
4. Click **Create Static Site**. Render gives you `https://devdna-xxxx.onrender.com`
5. Optional rename to `devdna.onrender.com` in Render settings if name free.

Your site runs by just serving `index.html` — no server needed.

---

## 🌐 Custom Domain on Render

1. Buy domain (e.g., Namecheap, GoDaddy) — say `devdna.site`
2. In Render dashboard → your static site → **Settings → Custom Domains → Add Custom Domain** → enter `devdna.site` and `www.devdna.site`
3. Render shows DNS records (CNAME `____.onrender.com`).
4. Go to your domain registrar → DNS → Add `CNAME` for `@` and `www` to Render target, or `A` record if provided.
5. Wait 5-60 mins for TLS. Render auto-provisions Let's Encrypt SSL.
6. Update share text in `script.js` if you change final domain:

```js
const text = `I just discovered I'm a ${archetype.name} on DevDNA! ⚡ Try it yourself at devdna.onrender.com`;
```

---

## 🤖 Uptime Robot (Prevent Render Cold Start)

Render free static sites don't sleep much, but web services do. For static it's fast, but if you upgrade to Web Service or want monitoring:

1. Create account at https://uptimerobot.com (free)
2. **Add New Monitor**
   - Type: HTTPS
   - Friendly Name: DevDNA
   - URL: `https://devdna.onrender.com`
   - Interval: 5 minutes
3. It will ping every 5 mins, keeping site warm and you get downtime alerts via email/Slack.
4. Add status page badge to README if you want:

```md
[![Uptime Robot](https://img.shields.io/uptimerobot/ratio/m796...)](https://stats.uptimerobot.com/...)
```

---

## 💻 Local Development

```bash
# Option 1: Just open file
open index.html  # double-click works, but ES modules need http server for Firebase CDN

# Option 2: Recommended - tiny http server
npx serve .
# or
python3 -m http.server 3000
# then visit http://localhost:3000
```

No `npm install`. No build.

---

## 🧪 QA Checklist (for tech event projector)

- [ ] Title glows, particles visible, no horizontal scroll
- [ ] Start Analysis → Quiz fades in, progress 8% → 100%
- [ ] Keyboard: numbers 1-4 select options
- [ ] Result aura color matches archetype
- [ ] Download PNG works on mobile Chrome/Safari, filename `DevDNA-Frontend-Wizard.png`
- [ ] Share copies + toast green “Copied!”
- [ ] Leaderboard animates bars, shows total decoded, live badge = green if Firebase else orange MOCK MODE

---

## 📥 Result Card Spec

Canvas 1080×1350:

- Black base + radial purple/blue glows
- Subtle grid overlay
- Rounded glass icon container with emoji
- Orbitron bold archetype name, gradient underline
- Wrapped description 26px Space Grotesk
- Trait pills, watermark `DevDNA` faint
- Footer: domain + random ID + tagline

Generated entirely client-side.

---

## 🔒 Privacy

- No cookies, no analytics, no tracking
- Firebase only stores anonymous archetype counts, no PII
- Canvas export happens locally

---

## 📜 License

MIT — Use for school, portfolio, startup, event. Credit appreciated but not required.

---

## 🙌 Credits

Built as a senior frontend piece: semantic HTML, vanilla JS modules, Firestore real-time, canvas API, glassmorphism design system.

*Deployed on Render. Decode yourself.*
