// Guía del dominio: pasos para tildar y botones "Ver los pasos"
(() => {
    // Guía del dominio: pasos para tildar, con progreso guardado en este navegador
    document.querySelectorAll('.domain-steps').forEach((list) => {
        const key = `jnb-domain-${document.documentElement.lang}-${list.dataset.site}`;
        const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
        const panel = list.closest('.legal-panel');
        const progress = panel.querySelector('.domain-progress');

        const update = () => {
            const done = boxes.filter((box) => box.checked).length;
            progress.textContent = progress.dataset.template.replace('{done}', done).replace('{total}', boxes.length);
            try {
                localStorage.setItem(key, JSON.stringify(boxes.map((box) => box.checked)));
            } catch (error) {
                /* sin almacenamiento disponible: el progreso no se guarda */
            }
        };

        try {
            JSON.parse(localStorage.getItem(key) || '[]').forEach((checked, index) => {
                if (boxes[index]) boxes[index].checked = Boolean(checked);
            });
        } catch (error) {
            /* sin almacenamiento disponible */
        }

        boxes.forEach((box) => box.addEventListener('change', update));
        panel.querySelector('.domain-reset')?.addEventListener('click', () => {
            boxes.forEach((box) => { box.checked = false; });
            update();
        });
        update();
    });

    // Tarjetas de la guía: el botón "Ver los pasos" abre el desplegable correspondiente
    document.querySelectorAll('.domain-card-link').forEach((link) => {
        link.addEventListener('click', () => {
            const target = document.getElementById(link.getAttribute('href').slice(1));
            if (target) target.open = true;
        });
    });
    // Celular: las tarjetas de "¿Cuál es tu caso?" se pasan como carrusel.
    // Debajo van los puntos (en cuál estás) y dos flechas para pasar de tarjeta con un toque o un clic.
    document.querySelectorAll('.domain-cards-pick').forEach((track) => {
        const cards = [...track.querySelectorAll('.domain-pick')];
        const nav = document.createElement('div');
        nav.className = 'domain-dots';

        const makeArrow = (label, symbol, step) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'domain-swipe';
            button.setAttribute('aria-label', label);
            button.innerHTML = `<span aria-hidden="true">${symbol}</span>`;
            button.addEventListener('click', () => goTo(current + step));
            return button;
        };

        const labels = {
            en: ['See the previous option', 'See the next option'],
            pt: ['Ver a opção anterior', 'Ver a próxima opção'],
            es: ['Ver la opción anterior', 'Ver la opción siguiente'],
        }[document.documentElement.lang.slice(0, 2)] || ['Ver la opción anterior', 'Ver la opción siguiente'];
        const prev = makeArrow(labels[0], '←', -1);
        const next = makeArrow(labels[1], '→', 1);
        const dotList = document.createElement('span');
        dotList.className = 'domain-dots-list';
        dotList.setAttribute('aria-hidden', 'true');
        const dotItems = cards.map(() => dotList.appendChild(document.createElement('span')));
        nav.append(prev, dotList, next);
        track.after(nav);

        let current = 0;
        const goTo = (index) => {
            const card = cards[Math.max(0, Math.min(index, cards.length - 1))];
            track.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
        };

        const update = () => {
            const center = track.scrollLeft + cards[0].offsetLeft + track.clientWidth / 2;
            let active = 0;
            cards.forEach((card, i) => {
                if (Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) <
                    Math.abs(cards[active].offsetLeft + cards[active].offsetWidth / 2 - center)) active = i;
            });
            current = active;
            dotItems.forEach((dot, i) => dot.classList.toggle('is-active', i === active));
            prev.disabled = active === 0;
            next.disabled = active === cards.length - 1;
        };
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    });
})();
