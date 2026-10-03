// Modo claro / oscuro (la preferencia se guarda en este navegador)
(() => {
    const themeToggle = document.querySelector('.theme-toggle');
    const THEME_KEY = 'jnb-theme';

    // Textos del botón según el idioma de la página (es, en, pt-BR)
    const themeLabels = {
        es: { toDark: 'Modo oscuro', toLight: 'Modo claro' },
        en: { toDark: 'Dark mode', toLight: 'Light mode' },
        pt: { toDark: 'Modo escuro', toLight: 'Modo claro' },
    }[document.documentElement.lang.slice(0, 2)] || { toDark: 'Modo oscuro', toLight: 'Modo claro' };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);

        if (!themeToggle) return;
        const isDark = theme === 'dark';
        const label = isDark ? themeLabels.toLight : themeLabels.toDark;
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', label);
        const icon = themeToggle.querySelector('.theme-toggle-icon');
        const text = themeToggle.querySelector('.theme-toggle-label');
        if (icon) icon.textContent = isDark ? '☀' : '☾';
        if (text) text.textContent = label;
    };

    applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');

    themeToggle?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (error) {
            /* localStorage unavailable (private mode) — theme just won't persist */
        }
        applyTheme(next);
    });
})();
