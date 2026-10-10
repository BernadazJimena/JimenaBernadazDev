// Inicio: fila deslizable de proyectos de muestra (tablet y celular) con puntos y flechas. Sin avance automático.
(() => {
    const section = document.querySelector('.samples');
    if (!section) return;

    const row = section.querySelector('.portfolio-grid');
    const cards = [...row.querySelectorAll('.portfolio-card')];
    const controls = section.querySelector('.samples-controls');
    if (!controls || !cards.length) return;

    const dots = [...controls.querySelectorAll('.samples-dot')];
    const prev = controls.querySelector('.samples-prev');
    const next = controls.querySelector('.samples-next');

    // Con "reducir movimiento" activado, el salto es directo
    const behavior = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
    const goTo = (index) => {
        const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
        row.scrollTo({ left: card.offsetLeft - row.offsetLeft, behavior: behavior() });
    };

    // Una tarjeta cuenta como visible si se ve al menos el 60 % de su ancho dentro de la fila
    const isVisible = (card) => {
        const rowBox = row.getBoundingClientRect();
        const box = card.getBoundingClientRect();
        const shown = Math.min(box.right, rowBox.right) - Math.max(box.left, rowBox.left);
        return box.width > 0 && shown / box.width >= 0.6;
    };
    const firstVisible = () => Math.max(0, cards.findIndex(isVisible));

    // Los puntos marcan las tarjetas que se ven (una en celular, dos en tablet);
    // las flechas se desactivan al llegar a cada extremo
    const update = () => {
        dots.forEach((dot, index) => {
            if (isVisible(cards[index])) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
        });
        const max = row.scrollWidth - row.clientWidth;
        const atStart = row.scrollLeft <= 1;
        const atEnd = row.scrollLeft >= max - 1;
        if (prev) prev.disabled = atStart;
        if (next) next.disabled = atEnd;
        // El borde se desvanece solo donde asoma otra tarjeta: a la derecha mientras queden tarjetas,
        // y a la izquierda al llegar al final (en el medio, la tarjeta activa empieza justo en el borde)
        row.style.setProperty('--fade-left', atEnd && !atStart ? '2.25rem' : '0px');
        row.style.setProperty('--fade-right', atEnd ? '0px' : '2.25rem');
    };

    dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
    prev?.addEventListener('click', () => goTo(firstVisible() - 1));
    next?.addEventListener('click', () => goTo(firstVisible() + 1));
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    // Sin JavaScript los controles quedan ocultos y la fila se desliza igual
    controls.hidden = false;
    update();
})();
