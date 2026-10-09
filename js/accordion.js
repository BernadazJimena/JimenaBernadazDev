// Desplegables (términos, planes y guía): abrir/cerrar todos, imprimir y abrir desde un enlace
(() => {
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

    // Si se llega con un enlace a una sección (por ejemplo /planes/#premium), se abre ese desplegable
    // y la página baja hasta él, dejando lugar para la barra fija del menú en computadora.
    const scrollToSection = (target) => {
        const header = document.querySelector('.site-header');
        const isSticky = header && getComputedStyle(header).position === 'sticky';
        const offset = isSticky ? 78 : 16;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'instant' });
    };

    const openSectionFromHash = () => {
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target && target.tagName === 'DETAILS') {
            target.open = true;
            scrollToSection(target);
            // Se repite cuando termina de cargar todo (tipografías e imágenes mueven el contenido)
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => scrollToSection(target), { once: true });
            }
        }
    };
    openSectionFromHash();
    window.addEventListener('hashchange', openSectionFromHash);
})();
