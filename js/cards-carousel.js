// Inicio, solo en el celular: las tarjetas de "Cómo te acompaño" y de "Qué te garantizo" pasan a carrusel.
// Se desliza con el dedo o se toca la tarjeta para pasar a la siguiente; los puntos de abajo indican dónde estás.
// En computadora y tablet las tarjetas siguen en grilla (el carrusel lo arma el CSS de why.css).
(() => {
    const mobile = window.matchMedia('(max-width: 35rem)');
    const labels = {
        en: { group: 'Cards', item: (n, total) => `Card ${n} of ${total}` },
        pt: { group: 'Cartões', item: (n, total) => `Cartão ${n} de ${total}` },
    }[document.documentElement.lang.slice(0, 2)] || { group: 'Tarjetas', item: (n, total) => `Tarjeta ${n} de ${total}` };

    document.querySelectorAll('.why-grid').forEach((track) => {
        const cards = [...track.children];
        if (cards.length < 2) return;

        const dots = document.createElement('div');
        dots.className = 'carousel-dots';
        dots.setAttribute('role', 'group');
        dots.setAttribute('aria-label', labels.group);

        // Distancia entre una tarjeta y la siguiente (ancho + separación)
        const step = () => cards[1].offsetLeft - cards[0].offsetLeft;
        const current = () => Math.round(track.scrollLeft / step());
        // La última tarjeta no llega a alinearse a la izquierda: al final del recorrido cuenta como la última
        const atEnd = () => track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;

        const goTo = (index) => {
            const card = cards[(index + cards.length) % cards.length];
            track.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
        };

        cards.forEach((card, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', labels.item(index + 1, cards.length));
            dot.addEventListener('click', () => goTo(index));
            dots.append(dot);
        });
        track.after(dots);

        const update = () => {
            const active = atEnd() ? cards.length - 1 : Math.min(current(), cards.length - 1);
            [...dots.children].forEach((dot, index) => dot.toggleAttribute('aria-current', index === active));
            // La tarjeta que está al frente se ve plena; las de los costados, más tenues (why.css)
            cards.forEach((card, index) => card.classList.toggle('is-active', index === active));
        };

        // Tocar la tarjeta lleva a la siguiente; después de la última vuelve a la primera.
        // Los enlaces de adentro de la tarjeta funcionan normal
        track.addEventListener('click', (event) => {
            if (!mobile.matches || event.target.closest('a') || !event.target.closest('.why-item')) return;
            goTo(atEnd() ? 0 : current() + 1);
        });

        track.addEventListener('scroll', update, { passive: true });
        // Al girar el celular o cambiar el ancho de la ventana, los puntos vuelven a marcar la tarjeta correcta
        window.addEventListener('resize', update);
        update();
    });
})();
