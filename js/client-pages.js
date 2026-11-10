// Páginas privadas para clientes (llegan con un link que les manda Jimena; no están en el menú ni en Google):
//   /mi-presupuesto/?c=…  el pedido de presupuesto y, cuando está lista, la propuesta
//   /resena/?c=…          formulario para dejar una opinión (Jimena la aprueba antes de publicarla)
//   /mi-proyecto/?c=…     en qué etapa está su web
// El contenido llega del Worker (/api/…) y se arma acá, en el idioma de la página.
(() => {
    const view = document.querySelector('.client-view');
    if (!view) return;

    const lang = document.documentElement.lang.slice(0, 2);
    const LOCALE = { es: 'es-AR', en: 'en-US', pt: 'pt-BR' }[lang] || 'es-AR';
    const WHATSAPP = 'https://wa.me/5491127663667?text=';
    const CONTACT = { es: '/#contacto', en: '/inicio/en#contacto', pt: '/inicio/pt#contacto' }[lang];

    const T = {
        es: {
            notFound: 'No encontré esta página. Revisá que el link esté completo o {link}.',
            contact: 'escribime y te ayudo',
            error: 'No se pudo cargar. Probá de nuevo en un rato.',
            // Presupuesto
            quoteTitle: 'Pedido de presupuesto',
            requestedOn: 'Pedido del {date}',
            status: { recibido: 'Recibido', preparando: 'En preparación', enviado: 'Listo' },
            hello: 'Hola, {name}.',
            waiting: 'Estoy preparando tu presupuesto. Te lo mando dentro de las 24 horas hábiles y también lo vas a ver acá, en este mismo link.',
            ready: 'Tu presupuesto está listo. Si tenés dudas, escribime y lo vemos juntos.',
            proposal: 'Mi propuesta',
            includes: 'Incluye',
            validUntil: 'Válido hasta el {date}.',
            expired: 'Este presupuesto venció el {date}. Escribime y te lo actualizo.',
            note: 'Nota',
            accept: 'Aceptar por WhatsApp',
            question: 'Tengo una consulta',
            acceptText: 'Hola Jimena, quiero avanzar con el presupuesto {code}.',
            questionText: 'Hola Jimena, tengo una consulta sobre el presupuesto {code}.',
            yourRequest: 'Lo que me pediste',
            save: 'Guardá este link para volver cuando quieras.',
            // Reseña
            reviewIntro: 'Me encantaría saber cómo fue trabajar juntos. Tu opinión ayuda a otras personas a decidirse y a mí a seguir mejorando.',
            name: 'Tu nombre',
            namePh: 'Por ejemplo: Ana García',
            business: 'Tu negocio o profesión',
            businessPh: 'Por ejemplo: Pastelería Dulce Ana',
            opinion: 'Tu opinión',
            opinionPh: '¿Cómo fue el proceso? ¿Qué te gustó del resultado?',
            consent: 'Acepto que mi opinión se publique en jnbcreativestudio.com.ar con mi nombre y mi negocio.',
            send: 'Enviar mi opinión',
            sending: 'Enviando...',
            errName: 'Escribí tu nombre.',
            errBusiness: 'Contame cuál es tu negocio o profesión.',
            errOpinion: 'Contame un poco más (al menos 20 letras).',
            errConsent: 'Para publicarla necesito que lo aceptes.',
            errSend: 'No se pudo enviar. Probá de nuevo en un rato.',
            thanks: '¡Muchas gracias! Recibí tu opinión. La reviso y la sumo a la web en los próximos días.',
            used: 'Ya recibí tu opinión. ¡Muchas gracias!',
            // Proyecto
            projectHello: 'Hola, {name}. Acá podés ver cómo va tu web.',
            due: 'Entrega estimada: {date}',
            published: '¡Tu web ya está publicada!',
            noteFrom: 'Nota de Jimena',
            updated: 'Última actualización: {date}.',
            current: 'En curso',
            done: 'Listo',
            write: 'Escribime por WhatsApp',
            writeText: 'Hola Jimena, te escribo por mi proyecto.',
            stages: [
                ['Confirmación y pago', 'Confirmás el plan y abonás. Tu lugar en mi agenda queda reservado.'],
                ['Material', 'Me enviás los textos, las fotos y el logo. Con todo listo, empiezo a diseñar.'],
                ['Diseño', 'Diseño y armo tu web.'],
                ['Revisión', 'Te muestro la web, la revisamos juntos y hago los ajustes.'],
                ['Publicación', 'Tu web queda publicada y lista para compartir.'],
            ],
        },
        en: {
            notFound: 'I could not find this page. Check that the link is complete or {link}.',
            contact: 'write to me and I will help you',
            error: 'It could not load. Please try again in a little while.',
            quoteTitle: 'Quote request',
            requestedOn: 'Requested on {date}',
            status: { recibido: 'Received', preparando: 'In progress', enviado: 'Ready' },
            hello: 'Hi, {name}.',
            waiting: 'I am preparing your quote. I will send it within 24 business hours, and you will also see it here, at this same link.',
            ready: 'Your quote is ready. If you have any questions, write to me and we can go over it together.',
            proposal: 'My proposal',
            includes: 'Includes',
            validUntil: 'Valid until {date}.',
            expired: 'This quote expired on {date}. Write to me and I will update it.',
            note: 'Note',
            accept: 'Accept on WhatsApp',
            question: 'I have a question',
            acceptText: 'Hi Jimena, I would like to go ahead with quote {code}.',
            questionText: 'Hi Jimena, I have a question about quote {code}.',
            yourRequest: 'What you asked for',
            save: 'Save this link to come back anytime.',
            reviewIntro: 'I would love to know how it was to work together. Your feedback helps other people decide, and helps me keep improving.',
            name: 'Your name',
            namePh: 'For example: Anna Smith',
            business: 'Your business or profession',
            businessPh: 'For example: Anna’s Bakery',
            opinion: 'Your feedback',
            opinionPh: 'How was the process? What did you like about the result?',
            consent: 'I agree that my feedback may be published on jnbcreativestudio.com.ar with my name and business.',
            send: 'Send my feedback',
            sending: 'Sending...',
            errName: 'Please write your name.',
            errBusiness: 'Tell me your business or profession.',
            errOpinion: 'Tell me a little more (at least 20 characters).',
            errConsent: 'I need your agreement to publish it.',
            errSend: 'It could not be sent. Please try again in a little while.',
            thanks: 'Thank you so much! I received your feedback. I will review it and add it to the website in the next few days.',
            used: 'I already received your feedback. Thank you so much!',
            projectHello: 'Hi, {name}. Here you can see how your website is going.',
            due: 'Estimated delivery: {date}',
            published: 'Your website is live!',
            noteFrom: 'Note from Jimena',
            updated: 'Last updated: {date}.',
            current: 'In progress',
            done: 'Done',
            write: 'Message me on WhatsApp',
            writeText: 'Hi Jimena, I am writing about my project.',
            stages: [
                ['Confirmation and payment', 'You confirm the plan and pay. Your spot in my schedule is booked.'],
                ['Content', 'You send me the texts, photos and logo. Once everything is ready, I start designing.'],
                ['Design', 'I design and build your website.'],
                ['Review', 'I show you the website, we review it together and I make the adjustments.'],
                ['Launch', 'Your website is live and ready to share.'],
            ],
        },
        pt: {
            notFound: 'Não encontrei esta página. Confira se o link está completo ou {link}.',
            contact: 'escreva para mim e eu ajudo você',
            error: 'Não foi possível carregar. Tente de novo daqui a pouco.',
            quoteTitle: 'Pedido de orçamento',
            requestedOn: 'Pedido de {date}',
            status: { recibido: 'Recebido', preparando: 'Em preparação', enviado: 'Pronto' },
            hello: 'Olá, {name}.',
            waiting: 'Estou preparando seu orçamento. Envio em até 24 horas úteis e você também vai vê-lo aqui, neste mesmo link.',
            ready: 'Seu orçamento está pronto. Se tiver dúvidas, escreva para mim e vemos juntos.',
            proposal: 'Minha proposta',
            includes: 'Inclui',
            validUntil: 'Válido até {date}.',
            expired: 'Este orçamento venceu em {date}. Escreva para mim e eu atualizo.',
            note: 'Observação',
            accept: 'Aceitar pelo WhatsApp',
            question: 'Tenho uma dúvida',
            acceptText: 'Olá Jimena, quero seguir com o orçamento {code}.',
            questionText: 'Olá Jimena, tenho uma dúvida sobre o orçamento {code}.',
            yourRequest: 'O que você me pediu',
            save: 'Guarde este link para voltar quando quiser.',
            reviewIntro: 'Eu adoraria saber como foi trabalharmos juntos. Sua opinião ajuda outras pessoas a decidir e me ajuda a continuar melhorando.',
            name: 'Seu nome',
            namePh: 'Por exemplo: Ana Souza',
            business: 'Seu negócio ou profissão',
            businessPh: 'Por exemplo: Confeitaria da Ana',
            opinion: 'Sua opinião',
            opinionPh: 'Como foi o processo? O que você gostou no resultado?',
            consent: 'Aceito que minha opinião seja publicada em jnbcreativestudio.com.ar com meu nome e meu negócio.',
            send: 'Enviar minha opinião',
            sending: 'Enviando...',
            errName: 'Escreva seu nome.',
            errBusiness: 'Conte qual é o seu negócio ou profissão.',
            errOpinion: 'Conte um pouco mais (pelo menos 20 letras).',
            errConsent: 'Para publicar, preciso que você aceite.',
            errSend: 'Não foi possível enviar. Tente de novo daqui a pouco.',
            thanks: 'Muito obrigada! Recebi sua opinião. Vou revisar e colocar no site nos próximos dias.',
            used: 'Já recebi sua opinião. Muito obrigada!',
            projectHello: 'Olá, {name}. Aqui você pode ver como está o seu site.',
            due: 'Entrega prevista: {date}',
            published: 'Seu site já está no ar!',
            noteFrom: 'Recado da Jimena',
            updated: 'Última atualização: {date}.',
            current: 'Em andamento',
            done: 'Pronto',
            write: 'Fale comigo no WhatsApp',
            writeText: 'Olá Jimena, estou escrevendo sobre o meu projeto.',
            stages: [
                ['Confirmação e pagamento', 'Você confirma o plano e faz o pagamento. Seu lugar na minha agenda fica reservado.'],
                ['Material', 'Você me envia os textos, as fotos e o logo. Com tudo pronto, começo a criar.'],
                ['Design', 'Crio e monto o seu site.'],
                ['Revisão', 'Mostro o site, revisamos juntos e faço os ajustes.'],
                ['Publicação', 'Seu site fica publicado e pronto para compartilhar.'],
            ],
        },
    }[lang];
    if (!T) return;

    // ---- Ayudas
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
    // Fechas guardadas como 2026-11-24 (sin hora) o con hora; siempre en el idioma de la página
    const longDate = (value) => {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
        return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };
    const button = (href, label, primary, external) => {
        const a = el('a', `button ${primary ? 'button-primary' : 'button-ghost'}`, label);
        a.href = href;
        if (external) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.append(' ', Object.assign(el('span', '', '↗'), { ariaHidden: 'true' }));
        }
        return a;
    };
    const message = (text, linkText) => {
        const p = el('p', 'client-message');
        if (linkText) {
            const [before, after] = text.split('{link}');
            const a = el('a', 'text-link', linkText);
            a.href = CONTACT;
            p.append(before, a, after);
        } else {
            p.textContent = text;
        }
        view.replaceChildren(p);
    };
    const notFound = () => message(T.notFound, T.contact);

    const token = new URLSearchParams(location.search).get('c') || '';
    if (!/^[A-Za-z0-9]{20,40}$/.test(token)) { notFound(); return; }
    // Al cambiar de idioma se mantiene el link del cliente
    document.querySelectorAll('.lang-flag[href]').forEach((flag) => {
        flag.href = `${flag.getAttribute('href').split('?')[0]}?c=${token}`;
    });

    const getJson = (path) => fetch(path, { cache: 'no-store' }).then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(res.status);
        return res.json();
    });

    // ---- Presupuesto
    const renderQuote = (quote) => {
        const card = el('article', 'client-card');
        const head = el('div', 'client-head');
        const titles = el('div');
        titles.append(el('p', 'client-kicker', T.quoteTitle), el('p', 'client-code', quote.code), el('p', 'client-date', fill(T.requestedOn, { date: longDate(quote.created) })));
        head.append(titles, el('span', `client-status is-${quote.status}`, T.status[quote.status] || quote.status));
        card.append(head);

        const proposal = quote.proposal;
        card.append(el('p', 'client-lead', `${fill(T.hello, { name: quote.firstName })} ${proposal ? T.ready : T.waiting}`));

        if (proposal) {
            const box = el('section', 'client-proposal');
            box.append(el('h2', 'client-subtitle', T.proposal), el('p', 'client-price', proposal.price));
            const items = (proposal.includes || '').split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
            if (items.length) {
                box.append(el('h3', 'client-small-title', T.includes));
                const list = el('ul', 'client-list');
                items.forEach((item) => list.append(el('li', '', item)));
                box.append(list);
            }
            if (proposal.note) {
                const note = el('div', 'client-note');
                note.append(el('p', 'client-small-title', T.note), el('p', '', proposal.note));
                box.append(note);
            }
            const today = new Date().toISOString().slice(0, 10);
            const expired = proposal.validUntil && proposal.validUntil < today;
            if (proposal.validUntil) box.append(el('p', `client-valid${expired ? ' is-expired' : ''}`, fill(expired ? T.expired : T.validUntil, { date: longDate(proposal.validUntil) })));
            const actions = el('div', 'client-actions');
            if (!expired) actions.append(button(WHATSAPP + encodeURIComponent(fill(T.acceptText, { code: quote.code })), T.accept, true, true));
            actions.append(button(WHATSAPP + encodeURIComponent(fill(T.questionText, { code: quote.code })), T.question, expired, true));
            box.append(actions);
            card.append(box);
        }

        const request = el('section', 'client-request');
        request.append(el('h2', 'client-subtitle', T.yourRequest));
        const list = el('dl', 'client-summary');
        quote.summary.split('\n').filter(Boolean).forEach((line) => {
            const cut = line.indexOf(': ');
            const row = el('div');
            if (cut > 0) row.append(el('dt', '', line.slice(0, cut)), el('dd', '', line.slice(cut + 2)));
            else row.append(el('dd', '', line));
            list.append(row);
        });
        request.append(list);
        card.append(request, el('p', 'client-foot', T.save));
        view.replaceChildren(card);
    };

    // ---- Reseña
    const field = (labelText, control, hint) => {
        const label = el('label', 'contact-field');
        label.append(el('span', '', labelText), control);
        if (hint) label.append(hint);
        return label;
    };

    const renderReviewForm = () => {
        const form = el('form', 'client-card client-review contact-form-like');
        form.noValidate = true;
        form.append(el('p', 'client-lead', T.reviewIntro));

        const name = Object.assign(el('input'), { name: 'name', type: 'text', autocomplete: 'name', placeholder: T.namePh, maxLength: 80 });
        const business = Object.assign(el('input'), { name: 'business', type: 'text', autocomplete: 'organization', placeholder: T.businessPh, maxLength: 100 });
        const opinion = Object.assign(el('textarea'), { name: 'body', rows: 5, placeholder: T.opinionPh, maxLength: 800 });
        const consent = Object.assign(el('input'), { name: 'consent', type: 'checkbox' });
        const consentLabel = el('label', 'client-consent');
        consentLabel.append(consent, el('span', '', T.consent));

        const row = el('div', 'contact-form-row');
        row.append(field(T.name, name), field(T.business, business));
        const submit = el('button', 'button button-primary', T.send);
        submit.type = 'submit';
        const status = el('p', 'contact-form-status');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        form.append(row, field(T.opinion, opinion), consentLabel, submit, status);
        view.replaceChildren(form);

        const showError = (input, text) => {
            status.className = 'contact-form-status is-error';
            status.textContent = text;
            input.setAttribute('aria-invalid', 'true');
            input.focus();
        };

        form.addEventListener('input', (event) => event.target.removeAttribute('aria-invalid'));
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
            if (!name.value.trim()) return showError(name, T.errName);
            if (!business.value.trim()) return showError(business, T.errBusiness);
            if (opinion.value.trim().length < 20) return showError(opinion, T.errOpinion);
            if (!consent.checked) return showError(consent, T.errConsent);

            submit.disabled = true;
            status.className = 'contact-form-status';
            status.textContent = T.sending;
            try {
                const res = await fetch(`/api/resenas/invitacion/${token}`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ lang, name: name.value, business: business.value, body: opinion.value, consent: true }),
                });
                if (res.status === 409) { message(T.used); return; }
                if (!res.ok) throw new Error(res.status);
                message(T.thanks);
            } catch (sendError) {
                status.className = 'contact-form-status is-error';
                status.textContent = T.errSend;
                submit.disabled = false;
            }
        });
    };

    // ---- Proyecto
    const renderProject = (project) => {
        const card = el('article', 'client-card');
        const last = T.stages.length - 1;
        const isLive = project.stage >= last;
        card.append(el('p', 'client-kicker', project.project), el('p', 'client-lead', fill(T.projectHello, { name: project.client })));
        if (isLive) card.append(el('p', 'client-live', T.published));
        else if (project.due) card.append(el('p', 'client-due', fill(T.due, { date: longDate(project.due) })));

        const steps = el('ol', 'client-steps');
        T.stages.forEach(([title, text], index) => {
            const state = index < project.stage || (isLive && index === last) ? 'done' : index === project.stage ? 'current' : 'pending';
            const step = el('li', `client-step is-${state}`);
            if (state === 'current') step.setAttribute('aria-current', 'step');
            const mark = el('span', 'client-step-mark', state === 'done' ? '✓' : String(index + 1));
            mark.setAttribute('aria-hidden', 'true');
            const body = el('div', 'client-step-body');
            const titleRow = el('p', 'client-step-title', title);
            if (state !== 'pending') titleRow.append(' ', el('span', 'client-step-tag', state === 'done' ? T.done : T.current));
            body.append(titleRow, el('p', 'client-step-text', text));
            step.append(mark, body);
            steps.append(step);
        });
        card.append(steps);

        if (project.note) {
            const note = el('div', 'client-note');
            note.append(el('p', 'client-small-title', T.noteFrom), el('p', '', project.note));
            card.append(note);
        }
        const actions = el('div', 'client-actions');
        actions.append(button(WHATSAPP + encodeURIComponent(T.writeText), T.write, false, true));
        card.append(actions, el('p', 'client-foot', fill(T.updated, { date: longDate(project.updated) })));
        view.replaceChildren(card);
    };

    // ---- Carga
    const kind = view.dataset.view;
    const load = {
        quote: () => getJson(`/api/presupuestos/${token}`).then((data) => (data ? renderQuote(data) : notFound())),
        review: () => getJson(`/api/resenas/invitacion/${token}`).then((data) => {
            if (!data) notFound();
            else if (data.used) message(T.used);
            else renderReviewForm();
        }),
        project: () => getJson(`/api/proyectos/${token}`).then((data) => (data ? renderProject(data) : notFound())),
    }[kind];
    load?.().catch(() => message(T.error));
})();
