const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const year = document.querySelector('#year');
const statusDot = document.querySelector('.status-dot');
const themeToggle = document.querySelector('.theme-toggle');

if (year) year.textContent = new Date().getFullYear();

const THEME_KEY = 'jnb-theme';
const isEnglish = document.documentElement.lang === 'en';
const themeLabels = isEnglish
    ? { toDark: 'Dark mode', toLight: 'Light mode' }
    : { toDark: 'Modo oscuro', toLight: 'Modo claro' };

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

applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try {
        localStorage.setItem(THEME_KEY, next);
    } catch (error) {
        /* localStorage unavailable (private mode) — theme just won't persist */
    }
    applyTheme(next);
});

const updateAvailabilityStatus = () => {
    if (!statusDot) return;

    const argentinaTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
    }).formatToParts(new Date());
    const currentHour = Number(argentinaTime.find(({ type }) => type === 'hour').value);
    const isOutsideHours = currentHour >= 17 || currentHour < 9;

    statusDot.classList.toggle('is-closed', isOutsideHours);
};

updateAvailabilityStatus();
setInterval(updateAvailabilityStatus, 60 * 1000);

menuToggle?.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});

document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', 'Abrir menú');
    });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const contactSection = document.querySelector('#contacto');
const whatsappFloat = document.querySelector('.whatsapp-float');
const footer = document.querySelector('.site-footer');
const topFloat = document.querySelector('.top-float');

if (contactSection && whatsappFloat) {
    const contactObserver = new IntersectionObserver(([entry]) => {
        whatsappFloat.classList.toggle('is-hidden', entry.isIntersecting);
    }, { threshold: 0.2 });

    contactObserver.observe(contactSection);
}

if (footer && topFloat) {
    const footerObserver = new IntersectionObserver(([entry]) => {
        topFloat.classList.toggle('is-hidden', entry.isIntersecting);
    }, { threshold: 0.1 });

    footerObserver.observe(footer);
}

