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

    // Si se llega con un enlace a una sección (por ejemplo planes.html#emprendedor), se abre ese desplegable
    const openSectionFromHash = () => {
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target && target.tagName === 'DETAILS') {
            target.open = true;
            target.scrollIntoView({ block: 'start' });
        }
    };
    openSectionFromHash();
    window.addEventListener('hashchange', openSectionFromHash);
})();
