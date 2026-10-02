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
const menuLabels = isEnglish
    ? { open: 'Open menu', close: 'Close menu' }
    : { open: 'Abrir menú', close: 'Cerrar menú' };

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

const updateAvailabilityStatus = () => {
    if (!statusDot) return;

    const argentinaTime = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: 'numeric',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
    }).formatToParts(new Date());
    const currentHour = Number(argentinaTime.find(({ type }) => type === 'hour').value);
    const currentDay = argentinaTime.find(({ type }) => type === 'weekday').value;
    const isWeekend = currentDay === 'Sat' || currentDay === 'Sun';
    const isOutsideHours = isWeekend || currentHour >= 17 || currentHour < 9;

    statusDot.classList.toggle('is-closed', isOutsideHours);

    // El estado también se muestra en texto, no solo con el color del punto
    const statusText = document.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = isOutsideHours ? statusText.dataset.closed : statusText.dataset.open;
        statusText.closest('.availability-status')?.classList.toggle('is-closed', isOutsideHours);
    }
};

updateAvailabilityStatus();
setInterval(updateAvailabilityStatus, 60 * 1000);

menuToggle?.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? menuLabels.close : menuLabels.open);
});

document.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', menuLabels.open);
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

const heroSection = document.querySelector('.hero, .legal-hero');
// En términos el botón aparece recién cuando el encabezado sale de pantalla
const heroHideRatio = heroSection?.classList.contains('legal-hero') ? 0 : 0.25;

if (topFloat) {
    // El botón "Inicio" se oculta en la sección de inicio y en el footer
    let isHeroVisible = false;
    let isFooterVisible = false;
    const updateTopFloat = () => {
        topFloat.classList.toggle('is-hidden', isHeroVisible || isFooterVisible);
    };

    if (heroSection) {
        new IntersectionObserver(([entry]) => {
            isHeroVisible = heroHideRatio === 0
                ? entry.isIntersecting
                : entry.intersectionRatio >= heroHideRatio;
            updateTopFloat();
        }, { threshold: [0, 0.25] }).observe(heroSection);
    }

    if (footer) {
        new IntersectionObserver(([entry]) => {
            isFooterVisible = entry.isIntersecting;
            updateTopFloat();
        }, { threshold: 0.1 }).observe(footer);
    }
}

const contactForm = document.querySelector('.contact-form');

// Mensajes de validación en el idioma de la página (no en el del navegador)
contactForm?.querySelectorAll('input[required], textarea[required]').forEach((field) => {
    field.addEventListener('invalid', () => {
        const { valueMissing, typeMismatch, patternMismatch } = field.validity;
        const isBadEmail = field.type === 'email' && (typeMismatch || patternMismatch);
        const message = isBadEmail ? field.dataset.msgInvalid : field.dataset.msgRequired;
        field.setCustomValidity(valueMissing || isBadEmail || patternMismatch ? message || '' : '');
    });
    field.addEventListener('input', () => field.setCustomValidity(''));
});

contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = contactForm.querySelector('.contact-form-status');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const { sending, success, error } = contactForm.dataset;

    status.className = 'contact-form-status';
    status.textContent = sending;
    submitButton.disabled = true;

    try {
        const response = await fetch(contactForm.action, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(contactForm)
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);

        contactForm.reset();
        status.classList.add('is-success');
        status.textContent = success;
    } catch (submitError) {
        status.classList.add('is-error');
        status.textContent = error;
    } finally {
        submitButton.disabled = false;
    }
});

// Términos: abrir / cerrar todas las secciones desplegables
const legalToggleAll = document.querySelector('.legal-toggle-all');
const legalSections = document.querySelectorAll('.legal-accordion details');

const syncLegalToggle = () => {
    if (!legalToggleAll) return;
    const allOpen = [...legalSections].every((section) => section.open);
    legalToggleAll.textContent = allOpen ? legalToggleAll.dataset.close : legalToggleAll.dataset.open;
    legalToggleAll.setAttribute('aria-expanded', String(allOpen));
};

legalToggleAll?.addEventListener('click', () => {
    const openAll = ![...legalSections].every((section) => section.open);
    legalSections.forEach((section) => { section.open = openAll; });
    syncLegalToggle();
});

legalSections.forEach((section) => section.addEventListener('toggle', syncLegalToggle));

// Al imprimir, se muestran todas las secciones
window.addEventListener('beforeprint', () => legalSections.forEach((section) => { section.open = true; }));
