// Blog: botón de "me gusta" en cada artículo y en sus cards (listado del blog y sección del inicio).
// El número sale del mismo lugar (/api/likes, el Worker de Cloudflare), así card y artículo muestran siempre lo mismo.
// Los botones se agregan solos: no hace falta tocar el HTML de cada artículo, solo cargar este archivo.
// Si el servidor no responde, el botón no aparece (nunca queda un botón roto a la vista).
(() => {
    const STORE = 'jnb-blog-likes';
    const VISITOR = 'jnb-blog-visitor';

    const read = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
    };
    const write = (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento: igual funciona en esta visita */ }
    };

    let visitor = read(VISITOR, null);
    if (typeof visitor !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(visitor)) {
        visitor = (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''));
        write(VISITOR, visitor);
    }
    const liked = read(STORE, {});

    const slugFrom = (path) => (path.match(/^\/blog\/([a-z0-9-]+)\/?$/) || [])[1];
    const heart = '<svg class="blog-like-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4 7.4 4c2 0 3.6 1.1 4.6 2.7C13 5.1 14.6 4 16.6 4c3.5 0 5.8 3.6 4.6 7.1-1.7 4.8-9.2 9.4-9.2 9.4Z"/></svg>';

    const makeButton = (slug, title) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'blog-like';
        button.dataset.likeSlug = slug;
        button.dataset.likeTitle = title;
        button.innerHTML = `${heart}<span class="blog-like-count">0</span>`;
        return button;
    };

    const buttons = [];

    // Cards (listado del blog e inicio): el corazón va abajo a la derecha, siempre a la vista.
    // Tocarlo no abre ni cierra la card.
    document.querySelectorAll('.blog-card').forEach((card) => {
        const link = card.querySelector('.blog-card-more[href]');
        const slug = link && slugFrom(new URL(link.getAttribute('href'), location.href).pathname);
        if (!slug) return;
        const title = card.querySelector('.blog-card-title')?.textContent.trim() || '';
        const button = makeButton(slug, title);
        card.querySelector('summary').append(button);
        buttons.push(button);
    });

    // Página del artículo: bloque al final del texto, antes de la autora.
    const article = document.querySelector('.blog-article');
    const articleSlug = slugFrom(location.pathname);
    if (article && articleSlug) {
        const box = document.createElement('div');
        box.className = 'blog-like-box';
        box.innerHTML = '<p class="blog-like-text">¿Te resultó útil? Dejame tu me gusta</p>';
        const title = document.querySelector('h1')?.textContent.trim() || '';
        const button = makeButton(articleSlug, title);
        box.append(button);
        const body = article.querySelector('.blog-body');
        if (body) body.after(box); else article.append(box);
        buttons.push(button);
    }

    if (!buttons.length) return;

    const paint = (slug, count) => {
        buttons.filter((b) => b.dataset.likeSlug === slug).forEach((b) => {
            const on = Boolean(liked[slug]);
            b.setAttribute('aria-pressed', String(on));
            b.querySelector('.blog-like-count').textContent = count;
            b.dataset.count = count;
            const people = count === 1 ? '1 persona' : `${count} personas`;
            b.setAttribute('aria-label', `${on ? 'Quitar mi me gusta de' : 'Me gusta'} “${b.dataset.likeTitle}”. Le gusta a ${people}.`);
        });
    };

    const slugs = [...new Set(buttons.map((b) => b.dataset.likeSlug))];
    fetch(`/api/likes?slugs=${slugs.join(',')}`, { headers: { accept: 'application/json' } })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((counts) => {
            slugs.forEach((slug) => paint(slug, Number(counts[slug]) || 0));
            document.documentElement.classList.add('blog-likes-ready');
        })
        .catch(() => { /* sin servidor (por ejemplo, vista previa local): los botones quedan ocultos */ });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.blog-like');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled) return;
        const slug = button.dataset.likeSlug;
        const next = !liked[slug];
        const before = Number(button.dataset.count) || 0;

        liked[slug] = next;
        if (!next) delete liked[slug];
        write(STORE, liked);
        paint(slug, Math.max(0, before + (next ? 1 : -1)));
        if (next) {
            buttons.filter((b) => b.dataset.likeSlug === slug).forEach((b) => {
                b.classList.remove('is-popping');
                void b.offsetWidth;
                b.classList.add('is-popping');
            });
        }

        button.disabled = true;
        fetch(`/api/likes/${slug}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ visitor, liked: next }),
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then(({ count }) => paint(slug, Number(count) || 0))
            .catch(() => {
                // No se pudo guardar: vuelve a como estaba.
                if (next) delete liked[slug]; else liked[slug] = true;
                write(STORE, liked);
                paint(slug, before);
            })
            .finally(() => { button.disabled = false; });
    });
})();
