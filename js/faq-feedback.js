// Preguntas frecuentes: "¿Te sirvió esta respuesta? Sí / No" al pie de cada respuesta,
// y registro de lo que se busca y no se encuentra (para saber qué preguntas faltan).
// Lo guarda el Worker de Cloudflare (/api/faq). Solo se guardan conteos y palabras, nada personal.
// Los botones se agregan solos y aparecen solo si el servidor responde (nunca queda un botón roto a la vista).
(() => {
    const groups = document.querySelectorAll('.faq-group');
    if (!groups.length) return;

    const lang = document.documentElement.lang.slice(0, 2);
    const TEXTS = {
        es: { ask: '¿Te sirvió esta respuesta?', yes: 'Sí', no: 'No', thanksYes: '¡Gracias por contarme!', thanksNo: 'Gracias. Si te quedó una duda, {link} y te ayudo.', link: 'escribime' },
        en: { ask: 'Was this answer helpful?', yes: 'Yes', no: 'No', thanksYes: 'Thanks for letting me know!', thanksNo: 'Thanks. If you still have a question, {link} and I will help you.', link: 'write to me' },
        pt: { ask: 'Esta resposta ajudou?', yes: 'Sim', no: 'Não', thanksYes: 'Obrigada por me contar!', thanksNo: 'Obrigada. Se ficou alguma dúvida, {link} e eu ajudo você.', link: 'escreva para mim' },
    };
    const text = TEXTS[lang];
    if (!text) return;

    const STORE = 'jnb-faq-votes';
    const VISITOR = 'jnb-blog-visitor'; // el mismo número al azar que usan los "me gusta" del blog

    const read = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
    };
    const write = (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento: igual funciona en esta visita */ }
    };
    const post = (path, data) => fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, lang }),
        keepalive: true,
    });

    let visitor = read(VISITOR, null);
    if (typeof visitor !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(visitor)) {
        visitor = (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''));
        write(VISITOR, visitor);
    }
    const votes = read(STORE, {});
    const contactHref = document.querySelector('.faq-search-empty a')?.getAttribute('href') || '/#contacto';

    // ---- "¿Te sirvió esta respuesta?"
    const thanks = (box, helpful) => {
        const message = box.querySelector('.faq-helpful-thanks');
        if (helpful === undefined) { message.textContent = ''; return; }
        if (helpful) { message.textContent = text.thanksYes; return; }
        const [before, after] = text.thanksNo.split('{link}');
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = contactHref;
        link.textContent = text.link;
        message.replaceChildren(before, link, after);
    };

    const paint = (box, helpful) => {
        box.querySelectorAll('.faq-helpful-option').forEach((button) => {
            button.setAttribute('aria-pressed', String(String(helpful) === button.dataset.helpful));
        });
    };

    document.querySelectorAll('.faq-group details.legal-block[id]').forEach((item) => {
        const panel = item.querySelector('.legal-panel');
        if (!panel) return;
        const box = document.createElement('div');
        box.className = 'faq-helpful';
        box.dataset.question = item.id;
        box.innerHTML = `<p class="faq-helpful-ask">${text.ask}</p>
            <div class="faq-helpful-options">
                <button class="faq-helpful-option" type="button" data-helpful="true" aria-pressed="false">${text.yes}</button>
                <button class="faq-helpful-option" type="button" data-helpful="false" aria-pressed="false">${text.no}</button>
            </div>
            <p class="faq-helpful-thanks" role="status" aria-live="polite"></p>`;
        panel.append(box);
        if (typeof votes[item.id] === 'boolean') paint(box, votes[item.id]);
    });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.faq-helpful-option');
        if (!button) return;
        const box = button.closest('.faq-helpful');
        const question = box.dataset.question;
        const helpful = button.dataset.helpful === 'true';
        const before = votes[question];
        if (before === helpful) return; // ya votó eso

        votes[question] = helpful;
        write(STORE, votes);
        paint(box, helpful);
        thanks(box, helpful);

        post('/api/faq/voto', { visitor, question, helpful })
            .then((res) => { if (!res.ok) throw new Error(res.status); })
            .catch(() => {
                // No se pudo guardar: vuelve a como estaba.
                if (typeof before === 'boolean') votes[question] = before; else delete votes[question];
                write(STORE, votes);
                paint(box, before);
                thanks(box, undefined);
            });
    });

    // Se muestran solo si el servidor responde.
    fetch('/api/faq', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data) => { if (data?.ok) document.documentElement.classList.add('faq-feedback-ready'); })
        .catch(() => { /* sin servidor: la página queda como siempre */ });

    // ---- Búsquedas que no encontraron nada
    // Se guarda cuando la persona deja de escribir unos segundos (o se va) y no apareció ninguna pregunta.
    const input = document.querySelector('.faq-search input');
    const empty = document.querySelector('.faq-search-empty');
    if (!input || !empty) return;

    const sent = new Set();
    let timer;
    const clean = (value) => value.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);
    const looksPersonal = (term) => term.includes('@') || /\d{5,}/.test(term.replace(/[\s.()-]/g, ''));

    const report = () => {
        clearTimeout(timer);
        const term = clean(input.value);
        if (empty.hidden || term.length < 3 || looksPersonal(term) || sent.has(term)) return;
        sent.add(term);
        post('/api/faq/busqueda', { term }).catch(() => { /* no pasa nada si no se guarda */ });
    };

    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(report, 2500);
    });
    input.addEventListener('blur', report);
    window.addEventListener('pagehide', report);
})();
