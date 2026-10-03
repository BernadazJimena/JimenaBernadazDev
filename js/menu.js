// Menú principal: botón ☰ del celular, submenú "Menú" y segundo nivel "Planes"
(() => {
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    // Textos del botón ☰ según el idioma de la página
    const menuLabels = {
        es: { open: 'Abrir menú', close: 'Cerrar menú' },
        en: { open: 'Open menu', close: 'Close menu' },
        pt: { open: 'Abrir menu', close: 'Fechar menu' },
    }[document.documentElement.lang.slice(0, 2)] || { open: 'Abrir menú', close: 'Cerrar menú' };

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

    // Submenú "Planes" del menú principal: se abre con clic (pantallas táctiles y teclado)
    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
        const toggle = dropdown.querySelector('.nav-dropdown-toggle');
        const setOpen = (isOpen) => {
            dropdown.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        };
        toggle.addEventListener('click', () => setOpen(!dropdown.classList.contains('is-open')));
        document.addEventListener('click', (event) => {
            if (!dropdown.contains(event.target)) setOpen(false);
        });
        dropdown.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                toggle.focus();
            }
        });
    });

    // Segundo nivel del menú ("Planes"): se abre con clic en pantallas táctiles y con teclado
    document.querySelectorAll('.nav-subgroup').forEach((group) => {
        const toggle = group.querySelector('.nav-subgroup-toggle');
        const setOpen = (isOpen) => {
            group.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        };
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            setOpen(!group.classList.contains('is-open'));
        });
        document.addEventListener('click', (event) => {
            if (!group.contains(event.target)) setOpen(false);
        });
    });
})();
