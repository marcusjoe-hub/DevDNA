/**
 * DevDNA v3 - Theme System
 * 6 Full themes, real-time sync via Firebase /settings/main/theme
 * Applies CSS variables to :root for instant global theming
 */

export const THEMES = {
    cyberpunk: {
        name: "Cyberpunk Neon",
        desc: "Green / Purple / Blue — classic DevDNA",
        icon: "🌃",
        colors: {
            "--neon-primary": "#00ff99",
            "--neon-secondary": "#a855f7",
            "--neon-tertiary": "#00ccff",
            "--neon-green": "#00ff99",
            "--neon-blue": "#00ccff",
            "--neon-purple": "#a855f7",
            "--neon-pink": "#ff00aa",
            "--neon-orange": "#ff8a00",
            "--bg-deep": "#0a0a0f",
            "--bg-elevated": "#14141c",
            "--bg-card": "rgba(18, 18, 26, 0.7)",
            "--text-primary": "#f8f8ff"
        }
    },
    matrix: {
        name: "Matrix Green",
        desc: "Terminal vibes — all green",
        icon: "🟩",
        colors: {
            "--neon-primary": "#00ff00",
            "--neon-secondary": "#003300",
            "--neon-tertiary": "#00cc66",
            "--neon-green": "#00ff41",
            "--neon-blue": "#00aa33",
            "--neon-purple": "#00ff66",
            "--neon-pink": "#33ff77",
            "--neon-orange": "#88ff88",
            "--bg-deep": "#020a02",
            "--bg-elevated": "#0a1a0a",
            "--bg-card": "rgba(10, 26, 10, 0.75)",
            "--text-primary": "#ccffcc"
        }
    },
    blood: {
        name: "Blood Neon",
        desc: "Red / Black / White — aggressive",
        icon: "🩸",
        colors: {
            "--neon-primary": "#ff0040",
            "--neon-secondary": "#8a0000",
            "--neon-tertiary": "#ffffff",
            "--neon-green": "#ff0040",
            "--neon-blue": "#ffaaaa",
            "--neon-purple": "#cc0000",
            "--neon-pink": "#ff3366",
            "--neon-orange": "#ff6666",
            "--bg-deep": "#0a0000",
            "--bg-elevated": "#1a0a0a",
            "--bg-card": "rgba(26, 10, 10, 0.75)",
            "--text-primary": "#ffe0e0"
        }
    },
    ocean: {
        name: "Ocean Deep",
        desc: "Blue / Teal / Navy — deep sea",
        icon: "🌊",
        colors: {
            "--neon-primary": "#00ccff",
            "--neon-secondary": "#0066ff",
            "--neon-tertiary": "#00ffcc",
            "--neon-green": "#00ffcc",
            "--neon-blue": "#0099ff",
            "--neon-purple": "#0066cc",
            "--neon-pink": "#33ccff",
            "--neon-orange": "#66ddff",
            "--bg-deep": "#000a14",
            "--bg-elevated": "#001a33",
            "--bg-card": "rgba(10, 26, 46, 0.75)",
            "--text-primary": "#d0f0ff"
        }
    },
    sunset: {
        name: "Sunset Wave",
        desc: "Orange / Pink / Purple — synthwave",
        icon: "🌅",
        colors: {
            "--neon-primary": "#ff8a00",
            "--neon-secondary": "#ff00aa",
            "--neon-tertiary": "#a855f7",
            "--neon-green": "#ff8a00",
            "--neon-blue": "#ff00aa",
            "--neon-purple": "#ff4400",
            "--neon-pink": "#ff66cc",
            "--neon-orange": "#ffcc00",
            "--bg-deep": "#1a0f14",
            "--bg-elevated": "#2a1620",
            "--bg-card": "rgba(32, 18, 26, 0.75)",
            "--text-primary": "#ffe0cc"
        }
    },
    monochrome: {
        name: "Monochrome",
        desc: "White / Gray / Black — minimal",
        icon: "⚪",
        colors: {
            "--neon-primary": "#ffffff",
            "--neon-secondary": "#a1a1b5",
            "--neon-tertiary": "#6b6b80",
            "--neon-green": "#ffffff",
            "--neon-blue": "#cccccc",
            "--neon-purple": "#999999",
            "--neon-pink": "#bbbbbb",
            "--neon-orange": "#888888",
            "--bg-deep": "#0f0f0f",
            "--bg-elevated": "#1a1a1a",
            "--bg-card": "rgba(24, 24, 24, 0.8)",
            "--text-primary": "#ffffff"
        }
    }
};

/**
 * Apply theme to entire site (main + admin)
 * Sets CSS variables on :root with smooth transition
 */
export function applyTheme(themeKey) {
    const theme = THEMES[themeKey];
    if (!theme) {
        console.warn(`[DevDNA Themes] Unknown theme: ${themeKey}, falling back to cyberpunk`);
        return applyTheme('cyberpunk');
    }

    const root = document.documentElement;
    
    // Smooth transition for theme change
    root.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    
    // Apply all color variables
    Object.entries(theme.colors).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
    });

    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', themeKey);
    
    // Store locally for instant load on next visit (before Firebase sync)
    try {
        localStorage.setItem('devdna_theme', themeKey);
    } catch {}

    console.log(`[DevDNA Themes] Applied theme: ${theme.name} (${themeKey})`);
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('devdna-theme-changed', { detail: { themeKey, theme } }));
}

/**
 * Get current theme key from DOM or localStorage
 */
export function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 
           localStorage.getItem('devdna_theme') || 
           'cyberpunk';
}

/**
 * Get theme definition
 */
export function getTheme(themeKey) {
    return THEMES[themeKey] || THEMES.cyberpunk;
}

/**
 * Initialize theme from localStorage (instant) then wait for Firebase
 */
export function initTheme() {
    const saved = localStorage.getItem('devdna_theme') || 'cyberpunk';
    applyTheme(saved);
}

// Auto-init on import
if (typeof window !== 'undefined') {
    initTheme();
}
