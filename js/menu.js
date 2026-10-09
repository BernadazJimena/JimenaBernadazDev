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

    // Fondo oscurecido detrás del menú hamburguesa: al tocarlo, el menú se cierra
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const setMenu = (isOpen) => {
        mainNav.classList.toggle('is-open', isOpen);
        backdrop.classList.toggle('is-open', isOpen);
        // Con el menú abierto, la página de fondo no se desplaza; al cerrarlo vuelve a desplazarse
        document.documentElement.classList.toggle('menu-open', isOpen);
        menuToggle?.setAttribute('aria-expanded', String(isOpen));
        menuToggle?.setAttribute('aria-label', isOpen ? menuLabels.close : menuLabels.open);
    };

    menuToggle?.addEventListener('click', () => setMenu(!mainNav.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setMenu(false));
    document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

    // Tecla Escape: cierra el menú hamburguesa y devuelve el foco al botón (sin mover la página: la barra es fija)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
            setMenu(false);
            menuToggle?.focus({ preventScroll: true });
        }
    });

    // Si la ventana se agranda hasta el menú de escritorio, el panel no queda abierto
    window.matchMedia('(min-width: 64rem)').addEventListener('change', (event) => {
        if (event.matches) setMenu(false);
    });

    // Barra fija en computadora: al bajar se achica. Los dos umbrales evitan que parpadee justo en el límite.
    const header = document.querySelector('.site-header');
    const updateHeader = () => {
        const isScrolled = header.classList.contains('is-scrolled');
        if (!isScrolled && window.scrollY > 90) header.classList.add('is-scrolled');
        else if (isScrolled && window.scrollY < 20) header.classList.remove('is-scrolled');
    };
    if (header) {
        window.addEventListener('scroll', updateHeader, { passive: true });
        updateHeader();
    }

    // Celular y tablet: la barra se esconde al bajar y reaparece al subir, desde cualquier punto de la página.
    // Reacciona recién después de 10 px en la misma dirección y nunca se esconde en los primeros 100 px.
    // Con el menú abierto o con el foco del teclado adentro, queda visible.
    const mobileQuery = window.matchMedia('(max-width: 63.99rem)');
    let lastY = window.scrollY;
    let travel = 0;
    const setHidden = (isHidden) => header.classList.toggle('is-hidden', isHidden);
    const updateHidden = () => {
        const y = window.scrollY;
        const delta = y - lastY;
        lastY = y;
        if (!mobileQuery.matches || y < 100 || mainNav.classList.contains('is-open') || header.contains(document.activeElement)) {
            travel = 0;
            setHidden(false);
            return;
        }
        travel = (delta > 0) === (travel > 0) ? travel + delta : delta;
        if (travel > 10) setHidden(true);
        else if (travel < -10) setHidden(false);
    };
    if (header) {
        window.addEventListener('scroll', updateHidden, { passive: true });
        header.addEventListener('focusin', () => setHidden(false));
        mobileQuery.addEventListener('change', updateHidden);
    }

    // Al entrar con un ancla (por ejemplo /#contacto desde otra página), la página baja hasta esa sección.
    // El desplazamiento del navegador se cortaba cuando la barra fija se achica; los desplegables los maneja accordion.js.
    const goToHash = () => {
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (!target || target.tagName === 'DETAILS') return;
        target.scrollIntoView({ behavior: 'instant' });
    };
    if (location.hash) {
        goToHash();
        if (document.readyState !== 'complete') window.addEventListener('load', goToHash, { once: true });
    }

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
                toggle.focus({ preventScroll: true });
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
        // Al pasar el mouse el submenú se ve: el atributo acompaña lo que se ve
        group.addEventListener('mouseenter', () => toggle.setAttribute('aria-expanded', 'true'));
        group.addEventListener('mouseleave', () => {
            if (!group.classList.contains('is-open')) toggle.setAttribute('aria-expanded', 'false');
        });
        group.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && group.classList.contains('is-open')) {
                event.stopPropagation();
                setOpen(false);
                toggle.focus({ preventScroll: true });
            }
        });
        document.addEventListener('click', (event) => {
            if (!group.contains(event.target)) setOpen(false);
        });
    });
})();
