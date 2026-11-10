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
            quoteTitle: 'Solicitud de presupuesto',
            status: { recibido: 'Recibido', preparando: 'En preparación', enviado: 'Listo' },
            headline: { waiting: 'Tu proyecto empieza acá.', ready: 'Tu presupuesto está listo.' },
            hello: 'Hola, {name}. ¡Gracias por confiar en JNB Creative Studio! 💜',
            waiting: 'Recibí tu solicitud y estoy preparando una propuesta para tu proyecto.',
            ready: 'Preparé esta propuesta teniendo en cuenta lo que necesitás para tu proyecto. Acá podés consultar todos los detalles.',
            readyHelp: 'Si tenés alguna duda o querés conversar sobre algún punto, escribime. ¡Estoy para ayudarte!',
            codeTitle: 'Número de solicitud',
            requestedOn: 'Pedido realizado el {date}',
            stepsTitle: 'Estado de tu solicitud',
            // Etapas de la solicitud: título, texto mientras no está lista y texto cuando ya está lista
            quoteSteps: [
                ['Solicitud recibida', 'Tu pedido llegó correctamente.', 'Tu pedido llegó correctamente.'],
                ['Preparación del presupuesto', 'Estoy evaluando los requerimientos de tu proyecto.', 'Evalué los requerimientos de tu proyecto.'],
                ['Presupuesto enviado', 'Vas a recibir mi propuesta con los detalles y valores.', 'Tu propuesta está lista, con los detalles y valores.'],
            ],
            whenTitle: '¿Cuándo recibirás mi respuesta?',
            whenText: 'Dentro de las próximas 24 horas hábiles.',
            whenHint: 'Cuando el presupuesto esté listo, vas a poder consultarlo desde este mismo enlace.',
            // Las etiquetas del resumen que arma el formulario de presupuesto, y cómo se muestran acá
            formLabels: ['Pedido', 'Quiero sumar o actualizar', 'Detalles'],
            requestLabels: ['Servicio', 'Funcionalidades solicitadas', 'Sobre tu proyecto'],
            saveTitle: 'Guardá este enlace',
            saveText: 'Podés volver a esta página cuando quieras para consultar el estado de tu solicitud y acceder a tu presupuesto.',
            signature: 'JNB Creative Studio · Diseño y desarrollo web',
            proposal: 'Mi propuesta',
            includes: 'Incluye',
            validUntil: 'Válido hasta el {date}.',
            expired: 'Este presupuesto venció el {date}. Escribime y te lo actualizo.',
            note: 'Nota',
            payTitle: 'Cómo pagar',
            payDirect: 'Directamente conmigo: 50 % de anticipo para empezar y 50 % en la entrega.',
            payStore: 'En mi tienda de Tiendanube: con tarjeta de crédito, en hasta 12 cuotas.',
            payStoreButton: 'Pagar en cuotas en mi tienda',
            accept: 'Aceptar por WhatsApp',
            question: 'Tengo una consulta',
            acceptText: 'Hola Jimena, quiero avanzar con el presupuesto {code}.',
            questionText: 'Hola Jimena, tengo una consulta sobre el presupuesto {code}.',
            yourRequest: 'Lo que me pediste',
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
            projectKicker: 'Proyecto web',
            projectStatus: { going: 'En curso', live: 'Publicada' },
            projectHello: 'Hola, {name}. ¡Tu proyecto está en marcha!',
            projectHelloLive: 'Hola, {name}. ¡Tu web ya está publicada!',
            projectIntro: 'Desde acá podés seguir cada etapa de tu web y ver qué viene después.',
            progress: 'Paso {n} de {total}',
            dueTitle: 'Entrega estimada',
            dueHint: 'La fecha puede ajustarse si quedan materiales o revisiones pendientes.',
            nextTitle: 'Tu próximo paso',
            nextByStage: [
                'Para reservar tu lugar en mi agenda, confirmá el plan y aboná el anticipo.',
                'Enviame los textos, las imágenes y el logo. Con todo listo, empiezo a diseñar.',
                'No necesitás hacer nada por ahora: estoy trabajando en tu web.',
                'Tu web está lista para revisar. Mirá la vista previa y enviame tus comentarios.',
                '¡Tu web ya está online! Compartila con tus clientes.',
            ],
            preview: 'Ver la vista previa',
            visit: 'Ver tu web',
            statusTitle: 'Estado del proyecto',
            stateTag: { done: 'Listo', current: 'En curso', pending: 'Pendiente' },
            noteFrom: 'Nota de Jimena',
            helpTitle: '¿Tenés alguna consulta?',
            helpText: 'Si necesitás comunicarte conmigo durante el proyecto, escribime directamente.',
            updated: 'Última actualización: {date}.',
            write: 'Escribime por WhatsApp',
            writeText: 'Hola Jimena, te escribo por mi proyecto.',
            // Cada etapa: título, texto cuando está lista, en curso y pendiente
            stages: [
                ['Reserva y confirmación', 'Plan confirmado y pago recibido. Tu lugar en mi agenda está reservado.', 'Confirmás el plan y abonás el anticipo para reservar tu lugar en mi agenda.', 'Confirmás el plan y abonás el anticipo para reservar tu lugar en mi agenda.'],
                ['Recepción de materiales', 'Textos, imágenes y logo recibidos. ¡Todo listo para empezar!', 'Estoy esperando tus textos, imágenes y logo para empezar a diseñar.', 'Me enviás los textos, las imágenes y el logo.'],
                ['Diseño y desarrollo', 'Diseño y desarrollo terminados.', 'Estoy trabajando en el diseño y la construcción de tu web.', 'Diseño y armo tu web.'],
                ['Revisión y ajustes', 'Revisamos la web juntos y hice los ajustes.', 'Revisá el resultado y pedime los ajustes incluidos en tu plan.', 'Vas a poder revisar el resultado y pedirme los ajustes incluidos en tu plan.'],
                ['Publicación y entrega', 'Tu web está online y lista para compartir con tus clientes.', 'Estoy publicando tu web en tu dominio.', 'Tu web va a estar online y lista para compartir con tus clientes.'],
            ],
        },
        en: {
            notFound: 'I could not find this page. Check that the link is complete or {link}.',
            contact: 'write to me and I will help you',
            error: 'It could not load. Please try again in a little while.',
            quoteTitle: 'Quote request',
            status: { recibido: 'Received', preparando: 'In progress', enviado: 'Ready' },
            headline: { waiting: 'Your project starts here.', ready: 'Your quote is ready.' },
            hello: 'Hi, {name}. Thank you for trusting JNB Creative Studio! 💜',
            waiting: 'I received your request and I am preparing a proposal for your project.',
            ready: 'I prepared this proposal based on what your project needs. Here you can see all the details.',
            readyHelp: 'If you have any questions or want to talk about anything, write to me. I am here to help!',
            codeTitle: 'Request number',
            requestedOn: 'Requested on {date}',
            stepsTitle: 'Status of your request',
            quoteSteps: [
                ['Request received', 'Your request arrived successfully.', 'Your request arrived successfully.'],
                ['Preparing your quote', 'I am reviewing what your project needs.', 'I reviewed what your project needs.'],
                ['Quote sent', 'You will receive my proposal with the details and prices.', 'Your proposal is ready, with the details and prices.'],
            ],
            whenTitle: 'When will you hear from me?',
            whenText: 'Within the next 24 business hours.',
            whenHint: 'When your quote is ready, you will find it at this same link.',
            formLabels: ['Request', 'I want to add or update', 'Details'],
            requestLabels: ['Service', 'Requested features', 'About your project'],
            saveTitle: 'Save this link',
            saveText: 'You can come back to this page anytime to check the status of your request and see your quote.',
            signature: 'JNB Creative Studio · Web design and development',
            proposal: 'My proposal',
            includes: 'Includes',
            validUntil: 'Valid until {date}.',
            expired: 'This quote expired on {date}. Write to me and I will update it.',
            note: 'Note',
            payTitle: 'How to pay',
            payDirect: 'Directly with me: a 50% deposit to get started and the remaining 50% on delivery.',
            payStore: 'In my online store (Tiendanube): by credit card, in up to 12 installments.',
            payStoreButton: 'Pay in installments in my store',
            accept: 'Accept on WhatsApp',
            question: 'I have a question',
            acceptText: 'Hi Jimena, I would like to go ahead with quote {code}.',
            questionText: 'Hi Jimena, I have a question about quote {code}.',
            yourRequest: 'What you asked for',
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
            projectKicker: 'Website project',
            projectStatus: { going: 'In progress', live: 'Live' },
            projectHello: 'Hi, {name}. Your project is underway!',
            projectHelloLive: 'Hi, {name}. Your website is live!',
            projectIntro: 'Here you can follow each stage of your website and see what comes next.',
            progress: 'Step {n} of {total}',
            dueTitle: 'Estimated delivery',
            dueHint: 'The date may change if content or reviews are still pending.',
            nextTitle: 'Your next step',
            nextByStage: [
                'To book your spot in my schedule, confirm the plan and pay the deposit.',
                'Send me the texts, images and logo. Once everything is ready, I start designing.',
                'You do not need to do anything for now: I am working on your website.',
                'Your website is ready for review. Check the preview and send me your comments.',
                'Your website is live! Share it with your clients.',
            ],
            preview: 'View the preview',
            visit: 'Visit your website',
            statusTitle: 'Project status',
            stateTag: { done: 'Done', current: 'In progress', pending: 'Pending' },
            noteFrom: 'Note from Jimena',
            helpTitle: 'Any questions?',
            helpText: 'If you need to reach me during the project, write to me directly.',
            updated: 'Last updated: {date}.',
            write: 'Message me on WhatsApp',
            writeText: 'Hi Jimena, I am writing about my project.',
            stages: [
                ['Booking and confirmation', 'Plan confirmed and payment received. Your spot in my schedule is booked.', 'You confirm the plan and pay the deposit to book your spot in my schedule.', 'You confirm the plan and pay the deposit to book your spot in my schedule.'],
                ['Content', 'Texts, images and logo received. Everything is ready to start!', 'I am waiting for your texts, images and logo to start designing.', 'You send me the texts, images and logo.'],
                ['Design and build', 'Design and build finished.', 'I am working on the design and build of your website.', 'I design and build your website.'],
                ['Review and adjustments', 'We reviewed the website together and I made the adjustments.', 'Review the result and ask me for the adjustments included in your plan.', 'You will be able to review the result and ask me for the adjustments included in your plan.'],
                ['Launch and delivery', 'Your website is live and ready to share with your clients.', 'I am publishing your website on your domain.', 'Your website will be live and ready to share with your clients.'],
            ],
        },
        pt: {
            notFound: 'Não encontrei esta página. Confira se o link está completo ou {link}.',
            contact: 'escreva para mim e eu ajudo você',
            error: 'Não foi possível carregar. Tente de novo daqui a pouco.',
            quoteTitle: 'Pedido de orçamento',
            status: { recibido: 'Recebido', preparando: 'Em preparação', enviado: 'Pronto' },
            headline: { waiting: 'Seu projeto começa aqui.', ready: 'Seu orçamento está pronto.' },
            hello: 'Olá, {name}. Obrigada por confiar na JNB Creative Studio! 💜',
            waiting: 'Recebi seu pedido e estou preparando uma proposta para o seu projeto.',
            ready: 'Preparei esta proposta pensando no que o seu projeto precisa. Aqui você pode ver todos os detalhes.',
            readyHelp: 'Se tiver alguma dúvida ou quiser conversar sobre algum ponto, escreva para mim. Estou aqui para ajudar!',
            codeTitle: 'Número do pedido',
            requestedOn: 'Pedido feito em {date}',
            stepsTitle: 'Status do seu pedido',
            quoteSteps: [
                ['Pedido recebido', 'Seu pedido chegou corretamente.', 'Seu pedido chegou corretamente.'],
                ['Preparação do orçamento', 'Estou avaliando o que o seu projeto precisa.', 'Avaliei o que o seu projeto precisa.'],
                ['Orçamento enviado', 'Você vai receber minha proposta com os detalhes e valores.', 'Sua proposta está pronta, com os detalhes e valores.'],
            ],
            whenTitle: 'Quando você recebe minha resposta?',
            whenText: 'Nas próximas 24 horas úteis.',
            whenHint: 'Quando o orçamento estiver pronto, você poderá vê-lo neste mesmo link.',
            formLabels: ['Pedido', 'Quero adicionar ou atualizar', 'Detalhes'],
            requestLabels: ['Serviço', 'Funcionalidades solicitadas', 'Sobre o seu projeto'],
            saveTitle: 'Guarde este link',
            saveText: 'Você pode voltar a esta página quando quiser para ver o status do seu pedido e acessar seu orçamento.',
            signature: 'JNB Creative Studio · Design e desenvolvimento web',
            proposal: 'Minha proposta',
            includes: 'Inclui',
            validUntil: 'Válido até {date}.',
            expired: 'Este orçamento venceu em {date}. Escreva para mim e eu atualizo.',
            note: 'Observação',
            payTitle: 'Como pagar',
            payDirect: 'Diretamente comigo: sinal de 50% para começar e os 50% restantes na entrega.',
            payStore: 'Na minha loja virtual (Tiendanube): no cartão de crédito, em até 12 parcelas.',
            payStoreButton: 'Pagar parcelado na minha loja',
            accept: 'Aceitar pelo WhatsApp',
            question: 'Tenho uma dúvida',
            acceptText: 'Olá Jimena, quero seguir com o orçamento {code}.',
            questionText: 'Olá Jimena, tenho uma dúvida sobre o orçamento {code}.',
            yourRequest: 'O que você me pediu',
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
            projectKicker: 'Projeto de site',
            projectStatus: { going: 'Em andamento', live: 'No ar' },
            projectHello: 'Olá, {name}. Seu projeto está em andamento!',
            projectHelloLive: 'Olá, {name}. Seu site já está no ar!',
            projectIntro: 'Aqui você pode acompanhar cada etapa do seu site e ver o que vem depois.',
            progress: 'Etapa {n} de {total}',
            dueTitle: 'Entrega prevista',
            dueHint: 'A data pode mudar se ainda faltarem materiais ou revisões.',
            nextTitle: 'Seu próximo passo',
            nextByStage: [
                'Para reservar seu lugar na minha agenda, confirme o plano e pague o sinal.',
                'Me envie os textos, as imagens e o logo. Com tudo pronto, começo a criar.',
                'Você não precisa fazer nada por enquanto: estou trabalhando no seu site.',
                'Seu site está pronto para revisão. Veja a prévia e me envie seus comentários.',
                'Seu site já está no ar! Compartilhe com seus clientes.',
            ],
            preview: 'Ver a prévia',
            visit: 'Ver seu site',
            statusTitle: 'Status do projeto',
            stateTag: { done: 'Pronto', current: 'Em andamento', pending: 'Pendente' },
            noteFrom: 'Recado da Jimena',
            helpTitle: 'Alguma dúvida?',
            helpText: 'Se precisar falar comigo durante o projeto, escreva diretamente para mim.',
            updated: 'Última atualização: {date}.',
            write: 'Fale comigo no WhatsApp',
            writeText: 'Olá Jimena, estou escrevendo sobre o meu projeto.',
            stages: [
                ['Reserva e confirmação', 'Plano confirmado e pagamento recebido. Seu lugar na minha agenda está reservado.', 'Você confirma o plano e paga o sinal para reservar seu lugar na minha agenda.', 'Você confirma o plano e paga o sinal para reservar seu lugar na minha agenda.'],
                ['Recebimento de materiais', 'Textos, imagens e logo recebidos. Tudo pronto para começar!', 'Estou esperando seus textos, imagens e logo para começar a criar.', 'Você me envia os textos, as imagens e o logo.'],
                ['Design e desenvolvimento', 'Design e desenvolvimento concluídos.', 'Estou trabalhando no design e na construção do seu site.', 'Crio e monto o seu site.'],
                ['Revisão e ajustes', 'Revisamos o site juntos e fiz os ajustes.', 'Revise o resultado e me peça os ajustes incluídos no seu plano.', 'Você vai poder revisar o resultado e me pedir os ajustes incluídos no seu plano.'],
                ['Publicação e entrega', 'Seu site está no ar e pronto para compartilhar com seus clientes.', 'Estou publicando seu site no seu domínio.', 'Seu site vai estar no ar e pronto para compartilhar com seus clientes.'],
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
    // Separa los adicionales ("A; B (Secciones: 4 a 5; Páginas: 1)") sin cortar lo que va entre paréntesis
    const splitItems = (text) => {
        const items = [];
        let depth = 0;
        let current = '';
        for (const char of text) {
            if (char === '(') depth += 1;
            if (char === ')') depth = Math.max(0, depth - 1);
            if (char === ';' && depth === 0) { items.push(current.trim()); current = ''; continue; }
            current += char;
        }
        if (current.trim()) items.push(current.trim());
        return items.filter(Boolean);
    };

    const infoBox = (className, title, ...texts) => {
        const box = el('section', `client-info ${className}`);
        box.append(el('h2', 'client-small-title', title));
        texts.forEach(([cls, text]) => box.append(el('p', cls, text)));
        return box;
    };

    const renderQuote = (quote) => {
        const proposal = quote.proposal;
        const card = el('article', 'client-card client-quote');

        // Encabezado: tipo de página y estado
        const head = el('div', 'client-head');
        head.append(el('p', 'client-kicker', T.quoteTitle), el('span', `client-status is-${quote.status}`, T.status[quote.status] || quote.status));
        card.append(head);

        const intro = el('div', 'client-intro');
        intro.append(
            el('h2', 'client-headline', proposal ? T.headline.ready : T.headline.waiting),
            el('p', 'client-lead', fill(T.hello, { name: quote.firstName })),
            el('p', 'client-date', proposal ? T.ready : T.waiting),
        );
        if (proposal) intro.append(el('p', 'client-date', T.readyHelp));
        card.append(intro);

        card.append(infoBox('client-code-box', T.codeTitle, ['client-code', quote.code], ['client-date', fill(T.requestedOn, { date: longDate(quote.created) })]));

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
            // Cómo pagar: directo (50 % y 50 %) o, si Jimena dejó el link, en cuotas desde la tienda
            const pay = el('div', 'client-pay');
            const payList = el('ul', 'client-list');
            payList.append(el('li', '', T.payDirect));
            if (proposal.storeLink) payList.append(el('li', '', T.payStore));
            pay.append(el('h3', 'client-small-title', T.payTitle), payList);
            box.append(pay);
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
            if (!expired && proposal.storeLink) actions.append(button(proposal.storeLink, T.payStoreButton, false, true));
            actions.append(button(WHATSAPP + encodeURIComponent(fill(T.questionText, { code: quote.code })), T.question, expired, true));
            box.append(actions);
            card.append(box);
        }

        // Estado de la solicitud: recibida (siempre lista), preparación y envío
        const status = el('section', 'client-status-list');
        status.append(el('h2', 'client-small-title', T.stepsTitle));
        const steps = el('ol', 'client-steps');
        T.quoteSteps.forEach(([title, todoText, doneText], index) => {
            const state = proposal || index === 0 ? 'done' : index === 1 ? 'current' : 'pending';
            const step = el('li', `client-step is-${state}`);
            if (state === 'current') step.setAttribute('aria-current', 'step');
            const mark = el('span', 'client-step-mark', state === 'done' ? '✓' : String(index + 1));
            mark.setAttribute('aria-hidden', 'true');
            const body = el('div', 'client-step-body');
            const titleRow = el('p', 'client-step-title', title);
            titleRow.append(' ', el('span', `client-step-tag is-${state}`, T.stateTag[state]));
            body.append(titleRow, el('p', 'client-step-text', state === 'done' ? doneText : todoText));
            step.append(mark, body);
            steps.append(step);
        });
        status.append(steps);
        card.append(status);

        if (!proposal) card.append(infoBox('client-when', T.whenTitle, ['client-due-date', T.whenText], ['client-date', T.whenHint]));

        // Lo que pidió, con etiquetas más claras que las del formulario
        const request = el('section', 'client-request');
        request.append(el('h2', 'client-subtitle', T.yourRequest));
        const list = el('dl', 'client-summary');
        quote.summary.split('\n').filter(Boolean).forEach((line) => {
            const cut = line.indexOf(': ');
            const row = el('div');
            if (cut > 0) {
                const label = line.slice(0, cut);
                const value = line.slice(cut + 2);
                const known = T.formLabels.indexOf(label);
                row.append(el('dt', '', known >= 0 ? T.requestLabels[known] : label));
                if (known === 1) {
                    const dd = el('dd');
                    const items = el('ul', 'client-list');
                    splitItems(value).forEach((item) => items.append(el('li', '', item)));
                    dd.append(items);
                    row.append(dd);
                } else {
                    row.append(el('dd', '', value));
                }
            } else {
                row.append(el('dd', '', line));
            }
            list.append(row);
        });
        request.append(list);
        card.append(request);

        card.append(infoBox('client-save', T.saveTitle, ['', T.saveText]), el('p', 'client-foot client-signature', T.signature));
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
    const section = (className, title) => {
        const box = el('section', className);
        if (title) box.append(el('h2', 'client-small-title', title));
        return box;
    };

    const renderProject = (project) => {
        const total = T.stages.length;
        const last = total - 1;
        const isLive = project.stage >= last;
        const card = el('article', 'client-card client-project');

        // Encabezado: tipo de proyecto, estado y saludo
        const head = el('div', 'client-head');
        const titles = el('div');
        titles.append(el('p', 'client-kicker', T.projectKicker), el('p', 'client-code', project.project));
        head.append(titles, el('span', `client-status${isLive ? ' is-enviado' : ''}`, isLive ? T.projectStatus.live : T.projectStatus.going));
        card.append(head);
        const intro = el('div');
        intro.append(el('p', 'client-lead', fill(isLive ? T.projectHelloLive : T.projectHello, { name: project.client })));
        if (!isLive) intro.append(el('p', 'client-date', T.projectIntro));
        card.append(intro);

        // Barra de avance
        const percent = isLive ? 100 : Math.round((project.stage / last) * 100);
        const progress = el('div', 'client-progress');
        const label = el('p', 'client-progress-label', fill(T.progress, { n: Math.min(project.stage + 1, total), total }));
        const bar = el('div', 'client-progress-bar');
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuemin', '0');
        bar.setAttribute('aria-valuemax', '100');
        bar.setAttribute('aria-valuenow', String(percent));
        bar.setAttribute('aria-label', label.textContent);
        const fillBar = el('span', 'client-progress-fill');
        fillBar.style.width = `${Math.max(percent, 4)}%`;
        bar.append(fillBar);
        progress.append(label, bar);
        card.append(progress);

        // Próximo paso y fecha estimada, lado a lado en pantallas anchas
        const highlights = el('div', 'client-highlights');
        const next = section('client-next', T.nextTitle);
        next.append(el('p', '', project.next || T.nextByStage[Math.min(project.stage, last)]));
        if (project.preview) {
            const previewButton = button(project.preview, isLive ? T.visit : T.preview, project.stage === 3 || isLive, true);
            next.append(previewButton);
        }
        highlights.append(next);
        if (!isLive && project.due) {
            const due = section('client-due-box', T.dueTitle);
            due.append(el('p', 'client-due-date', longDate(project.due)), el('p', 'client-date', T.dueHint));
            highlights.append(due);
        }
        card.append(highlights);

        // Etapas
        const status = section('client-status-list', T.statusTitle);
        const steps = el('ol', 'client-steps');
        T.stages.forEach(([title, doneText, currentText, pendingText], index) => {
            const state = index < project.stage || (isLive && index === last) ? 'done' : index === project.stage ? 'current' : 'pending';
            const step = el('li', `client-step is-${state}`);
            if (state === 'current') step.setAttribute('aria-current', 'step');
            const mark = el('span', 'client-step-mark', state === 'done' ? '✓' : String(index + 1));
            mark.setAttribute('aria-hidden', 'true');
            const body = el('div', 'client-step-body');
            const titleRow = el('p', 'client-step-title', `${index + 1}. ${title}`);
            titleRow.append(' ', el('span', `client-step-tag is-${state}`, T.stateTag[state]));
            body.append(titleRow, el('p', 'client-step-text', { done: doneText, current: currentText, pending: pendingText }[state]));
            step.append(mark, body);
            steps.append(step);
        });
        status.append(steps);
        card.append(status);

        if (project.note) {
            const note = el('div', 'client-note');
            note.append(el('p', 'client-small-title', T.noteFrom), el('p', '', project.note));
            card.append(note);
        }

        // Contacto
        const help = section('client-help', T.helpTitle);
        help.append(el('p', '', T.helpText));
        const actions = el('div', 'client-actions');
        actions.append(button(WHATSAPP + encodeURIComponent(T.writeText), T.write, false, true));
        help.append(actions);
        card.append(help, el('p', 'client-foot', fill(T.updated, { date: longDate(project.updated) })));
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
