// Inicio: reseñas de clientes. Las aprueba Jimena desde su panel; el servidor las manda solo cuando hay al menos 3,
// así la sección nunca aparece vacía ni con una sola. Mientras tanto queda oculta y la página se ve como siempre.
(() => {
    const section = document.querySelector('.reviews');
    const grid = section?.querySelector('.reviews-grid');
    if (!grid) return;

    fetch('/api/resenas', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then(({ reviews }) => {
            if (!Array.isArray(reviews) || reviews.length < 3) return;
            grid.replaceChildren(...reviews.map((review) => {
                const item = document.createElement('li');
                const figure = document.createElement('figure');
                figure.className = 'review-card';
                const quote = document.createElement('blockquote');
                quote.textContent = review.body;
                if (review.lang) quote.lang = review.lang === 'pt' ? 'pt-BR' : review.lang;
                const caption = document.createElement('figcaption');
                const name = document.createElement('span');
                name.className = 'review-name';
                name.textContent = review.name;
                const business = document.createElement('span');
                business.className = 'review-business';
                business.textContent = review.business;
                caption.append(name, business);
                figure.append(quote, caption);
                item.append(figure);
                return item;
            }));
            section.hidden = false;
        })
        .catch(() => { /* sin servidor: la sección sigue oculta */ });
})();
