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
            status: { recibido: 'Recibido', preparando: 'En preparación', enviado: 'Presupuesto listo', aceptado: 'Aceptado' },
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
            proposalKicker: 'Propuesta comercial',
            proposalTitle: '¡Tu propuesta está lista, {name}!',
            acceptedTitle: '¡Gracias por confirmar, {name}!',
            acceptedText: 'Ya tengo tu confirmación. Te escribo para coordinar los próximos pasos.',
            proposalThanks: '¡Gracias por confiar en JNB Creative Studio! 💜',
            quoteNumber: 'Presupuesto {code}',
            issuedOn: 'Emitido el {date}',
            pdf: 'Descargar en PDF',
            pdfLoading: 'Preparando el PDF...',
            investment: 'Inversión total',
            finalPrice: 'Precio final de la propuesta',
            includesTitle: 'Tu web incluye',
            includesTitleStore: 'Tu tienda incluye',
            payChoose: 'Elegí cómo querés pagar',
            payOption1: 'Opción 1 · Directamente conmigo',
            payOption1Tag: '2 pagos',
            payDeposit: 'Anticipo para comenzar',
            payBalance: 'Contra entrega',
            payDirectHint: '50 % al iniciar y 50 % al finalizar el proyecto.',
            payOption2: 'Opción 2 · Mi tienda online',
            payOption2Tag: 'Cuotas',
            payStoreText: 'Pagá con tarjeta de crédito a través de mi tienda de Tiendanube.',
            payStoreHint: 'Hasta 12 cuotas, según las condiciones disponibles en el checkout. El importe y las condiciones definitivas se muestran al momento de pagar.',
            conditionsTitle: 'Condiciones de contratación',
            validityTitle: 'Vigencia de la propuesta',
            validityText: 'Hasta el {date} inclusive.',
            ctaTitle: '¿Querés avanzar con tu proyecto?',
            acceptButton: 'Aceptar presupuesto por WhatsApp',
            ctaQuestion: 'También podés {link} antes de decidir.',
            ctaQuestionLink: 'consultarme una duda',
            originalRequest: 'Tu solicitud original',
            originalLabels: ['Plan solicitado', 'Funcionalidades adicionales', 'Detalles del pedido'],
            expired: 'Este presupuesto venció el {date}. Escribime y te lo actualizo.',
            note: 'Nota',
            payStoreButton: 'Pagar en cuotas en mi tienda',
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
            status: { recibido: 'Received', preparando: 'In progress', enviado: 'Quote ready', aceptado: 'Accepted' },
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
            proposalKicker: 'Business proposal',
            proposalTitle: 'Your proposal is ready, {name}!',
            acceptedTitle: 'Thank you for confirming, {name}!',
            acceptedText: 'I have your confirmation. I will write to you to arrange the next steps.',
            proposalThanks: 'Thank you for trusting JNB Creative Studio! 💜',
            quoteNumber: 'Quote {code}',
            issuedOn: 'Issued on {date}',
            pdf: 'Download as PDF',
            pdfLoading: 'Preparing the PDF...',
            investment: 'Total investment',
            finalPrice: 'Final price of the proposal',
            includesTitle: 'Your website includes',
            includesTitleStore: 'Your store includes',
            payChoose: 'Choose how you want to pay',
            payOption1: 'Option 1 · Directly with me',
            payOption1Tag: '2 payments',
            payDeposit: 'Deposit to get started',
            payBalance: 'On delivery',
            payDirectHint: '50% at the start and 50% when the project is finished.',
            payOption2: 'Option 2 · My online store',
            payOption2Tag: 'Installments',
            payStoreText: 'Pay by credit card through my Tiendanube store.',
            payStoreHint: 'Up to 12 installments, depending on the options available at checkout. The final amount and terms are shown when you pay.',
            conditionsTitle: 'Terms',
            validityTitle: 'Proposal validity',
            validityText: 'Until {date}, inclusive.',
            ctaTitle: 'Would you like to move forward with your project?',
            acceptButton: 'Accept quote on WhatsApp',
            ctaQuestion: 'You can also {link} before deciding.',
            ctaQuestionLink: 'ask me a question',
            originalRequest: 'Your original request',
            originalLabels: ['Requested plan', 'Additional features', 'Request details'],
            expired: 'This quote expired on {date}. Write to me and I will update it.',
            note: 'Note',
            payStoreButton: 'Pay in installments in my store',
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
            status: { recibido: 'Recebido', preparando: 'Em preparação', enviado: 'Orçamento pronto', aceptado: 'Aceito' },
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
            proposalKicker: 'Proposta comercial',
            proposalTitle: 'Sua proposta está pronta, {name}!',
            acceptedTitle: 'Obrigada por confirmar, {name}!',
            acceptedText: 'Já tenho sua confirmação. Vou escrever para combinarmos os próximos passos.',
            proposalThanks: 'Obrigada por confiar na JNB Creative Studio! 💜',
            quoteNumber: 'Orçamento {code}',
            issuedOn: 'Emitido em {date}',
            pdf: 'Baixar em PDF',
            pdfLoading: 'Preparando o PDF...',
            investment: 'Investimento total',
            finalPrice: 'Preço final da proposta',
            includesTitle: 'Seu site inclui',
            includesTitleStore: 'Sua loja inclui',
            payChoose: 'Escolha como quer pagar',
            payOption1: 'Opção 1 · Diretamente comigo',
            payOption1Tag: '2 pagamentos',
            payDeposit: 'Sinal para começar',
            payBalance: 'Na entrega',
            payDirectHint: '50% no início e 50% ao finalizar o projeto.',
            payOption2: 'Opção 2 · Minha loja virtual',
            payOption2Tag: 'Parcelado',
            payStoreText: 'Pague com cartão de crédito pela minha loja da Tiendanube.',
            payStoreHint: 'Em até 12 vezes, conforme as condições disponíveis no checkout. O valor e as condições finais aparecem no momento do pagamento.',
            conditionsTitle: 'Condições de contratação',
            validityTitle: 'Validade da proposta',
            validityText: 'Até {date}, inclusive.',
            ctaTitle: 'Quer seguir com o seu projeto?',
            acceptButton: 'Aceitar orçamento pelo WhatsApp',
            ctaQuestion: 'Você também pode {link} antes de decidir.',
            ctaQuestionLink: 'tirar uma dúvida comigo',
            originalRequest: 'Seu pedido original',
            originalLabels: ['Plano solicitado', 'Funcionalidades adicionais', 'Detalhes do pedido'],
            expired: 'Este orçamento venceu em {date}. Escreva para mim e eu atualizo.',
            note: 'Observação',
            payStoreButton: 'Pagar parcelado na minha loja',
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

    // Mitad del precio en el mismo formato ("ARS 420.000" → "ARS 210.000"). Si no se puede leer el número, no se muestra.
    const halfPrice = (price) => {
        const match = String(price).match(/^(\D*?)\s*(\d[\d.,]*)\s*(\D*)$/);
        if (!match) return '';
        const raw = match[2];
        let number;
        if (/,\d{1,2}$/.test(raw)) number = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
        else if (/\.\d{1,2}$/.test(raw)) number = parseFloat(raw.replace(/,/g, ''));
        else number = parseFloat(raw.replace(/[.,]/g, ''));
        if (!number) return '';
        const half = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(number / 2);
        return [match[1].trim(), half, match[3].trim()].filter(Boolean).join(' ');
    };

    // "Galería de tortas — Fotos ampliables" → título y descripción
    const splitItem = (line) => {
        const cut = line.match(/\s+[—–-]\s+/);
        return cut ? [line.slice(0, cut.index), line.slice(cut.index + cut[0].length)] : [line, ''];
    };

    const tag = (text, extra = '') => el('span', `client-tag ${extra}`.trim(), text);

    // Plan B si no se puede generar el PDF: la ventana de imprimir del navegador, siempre en modo claro
    const printProposal = () => {
        const root = document.documentElement;
        const theme = root.getAttribute('data-theme');
        root.setAttribute('data-theme', 'light');
        const restore = () => { if (theme) root.setAttribute('data-theme', theme); window.removeEventListener('afterprint', restore); };
        window.addEventListener('afterprint', restore);
        window.print();
    };

    // Descarga directa del PDF. La herramienta (html2pdf, desde cdnjs) se carga recién al tocar el botón,
    // con su huella de seguridad: si el archivo no coincide, el navegador no lo usa y se abre la ventana de imprimir.
    const PDF_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    const PDF_LIB_HASH = 'sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==';
    let pdfLib;
    const loadPdfLib = () => {
        if (window.html2pdf) return Promise.resolve();
        pdfLib = pdfLib || new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = PDF_LIB;
            script.integrity = PDF_LIB_HASH;
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            script.onload = resolve;
            script.onerror = () => { pdfLib = null; reject(new Error('pdf')); };
            document.head.append(script);
        });
        return pdfLib;
    };

    const downloadPdf = async (card, code, pdfButton) => {
        const root = document.documentElement;
        const theme = root.getAttribute('data-theme');
        const label = pdfButton.textContent;
        pdfButton.disabled = true;
        pdfButton.textContent = T.pdfLoading;
        try {
            await loadPdfLib();
            // Se arma en modo claro y con la versión "documento" de la tarjeta (sin botones, con la marca arriba)
            root.setAttribute('data-theme', 'light');
            card.classList.add('is-pdf');
            await window.html2pdf().set({
                margin: [12, 12, 14, 12],
                filename: `presupuesto-${code}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#f3ebf6' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], avoid: ['.client-head', '.client-intro', '.client-meta', '.client-investment', '.client-include', '.client-option', '.client-note', '.client-conditions li', '.client-validity', '.client-summary > div'] },
            }).from(card).save();
        } catch (pdfError) {
            card.classList.remove('is-pdf');
            if (theme) root.setAttribute('data-theme', theme);
            printProposal();
        } finally {
            card.classList.remove('is-pdf');
            if (theme) root.setAttribute('data-theme', theme);
            pdfButton.disabled = false;
            pdfButton.textContent = label;
        }
    };

    const requestList = (quote, labels) => {
        const list = el('dl', 'client-summary');
        quote.summary.split('\n').filter(Boolean).forEach((line) => {
            const cut = line.indexOf(': ');
            const row = el('div');
            if (cut > 0) {
                const label = line.slice(0, cut);
                const value = line.slice(cut + 2);
                const known = T.formLabels.indexOf(label);
                row.append(el('dt', '', known >= 0 ? labels[known] : label));
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
        return list;
    };

    // Solicitud todavía sin propuesta: estado en 3 etapas y cuándo llega la respuesta
    const renderRequest = (quote) => {
        const card = el('article', 'client-card client-quote');
        const head = el('div', 'client-head');
        head.append(el('p', 'client-kicker', T.quoteTitle), el('span', `client-status is-${quote.status}`, T.status[quote.status] || quote.status));
        card.append(head);

        const intro = el('div', 'client-intro');
        intro.append(
            el('h2', 'client-headline', T.headline.waiting),
            el('p', 'client-lead', fill(T.hello, { name: quote.firstName })),
            el('p', 'client-date', T.waiting),
        );
        card.append(intro);
        card.append(infoBox('client-code-box', T.codeTitle, ['client-code', quote.code], ['client-date', fill(T.requestedOn, { date: longDate(quote.created) })]));

        const status = el('section', 'client-status-list');
        status.append(el('h2', 'client-small-title', T.stepsTitle));
        const steps = el('ol', 'client-steps');
        T.quoteSteps.forEach(([title, todoText, doneText], index) => {
            const state = index === 0 ? 'done' : index === 1 ? 'current' : 'pending';
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
        card.append(infoBox('client-when', T.whenTitle, ['client-due-date', T.whenText], ['client-date', T.whenHint]));

        const request = el('section', 'client-request');
        request.append(el('h2', 'client-subtitle', T.yourRequest), requestList(quote, T.requestLabels));
        card.append(request);
        card.append(infoBox('client-save', T.saveTitle, ['', T.saveText]), el('p', 'client-foot client-signature', T.signature));
        view.replaceChildren(card);
    };

    // Propuesta comercial: precio, qué incluye, cómo pagar, condiciones, vigencia y aceptación
    const renderProposal = (quote) => {
        const proposal = quote.proposal;
        const accepted = quote.status === 'aceptado';
        const today = new Date().toISOString().slice(0, 10);
        const expired = !accepted && proposal.validUntil && proposal.validUntil < today;
        const card = el('article', 'client-card client-quote client-proposal-page');

        // Marca del estudio: solo se ve en el PDF
        const brand = el('div', 'client-pdf-brand');
        const mark = el('span', 'client-pdf-mark', 'JNB');
        brand.append(mark, el('span', 'client-pdf-name', 'Creative Studio'), el('span', 'client-pdf-site', 'jnbcreativestudio.com.ar'));
        card.append(brand);

        const head = el('div', 'client-head');
        head.append(el('p', 'client-kicker', T.proposalKicker), el('span', `client-status is-${accepted ? 'aceptado' : 'enviado'}`, T.status[accepted ? 'aceptado' : 'enviado']));
        card.append(head);

        const intro = el('div', 'client-intro');
        intro.append(el('h2', 'client-headline', fill(accepted ? T.acceptedTitle : T.proposalTitle, { name: quote.firstName })), el('p', 'client-lead', T.proposalThanks));
        if (accepted) intro.append(el('p', 'client-date', T.acceptedText));
        else intro.append(el('p', 'client-date', T.ready), el('p', 'client-date', T.readyHelp));
        card.append(intro);

        // Número, fecha de emisión y PDF
        const meta = el('section', 'client-info client-meta');
        const metaText = el('div');
        metaText.append(el('p', 'client-small-title', fill(T.quoteNumber, { code: quote.code })), el('p', 'client-date', fill(T.issuedOn, { date: longDate(proposal.issued || quote.created) })));
        const pdf = el('button', 'button button-ghost client-pdf', T.pdf);
        pdf.type = 'button';
        pdf.addEventListener('click', () => downloadPdf(card, quote.code, pdf));
        meta.append(metaText, pdf);
        card.append(meta);

        // Inversión total
        const price = el('section', 'client-investment');
        price.append(el('h2', 'client-small-title', T.investment), el('p', 'client-price', proposal.price), el('p', 'client-date', T.finalPrice));
        card.append(price);

        // Qué incluye
        const items = (proposal.includes || '').split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
        if (items.length) {
            const box = el('section', 'client-includes');
            const isStore = /emprendedor|empreendedor/i.test(quote.plan);
            box.append(el('h2', 'client-subtitle', isStore ? T.includesTitleStore : T.includesTitle));
            const list = el('ul', 'client-include-list');
            items.forEach((line) => {
                const [title, text] = splitItem(line);
                const item = el('li', 'client-include');
                const mark = el('span', 'client-include-mark', '✓');
                mark.setAttribute('aria-hidden', 'true');
                const body = el('div');
                body.append(el('p', 'client-include-title', title));
                if (text) body.append(el('p', 'client-include-text', text));
                item.append(mark, body);
                list.append(item);
            });
            box.append(list);
            card.append(box);
        }

        // Cómo pagar
        const pay = el('section', 'client-pay');
        pay.append(el('h2', 'client-subtitle', T.payChoose));
        const option1 = el('div', 'client-option');
        const head1 = el('div', 'client-option-head');
        head1.append(el('p', 'client-option-title', T.payOption1), tag(T.payOption1Tag));
        option1.append(head1);
        const half = halfPrice(proposal.price);
        if (half) {
            const amounts = el('div', 'client-option-amounts');
            [[half, T.payDeposit], [half, T.payBalance]].forEach(([amount, label]) => {
                const cell = el('div');
                cell.append(el('p', 'client-option-amount', amount), el('p', 'client-date', label));
                amounts.append(cell);
            });
            option1.append(amounts);
        }
        option1.append(el('p', 'client-date', T.payDirectHint));
        pay.append(option1);
        if (proposal.storeLink) {
            const option2 = el('div', 'client-option');
            const head2 = el('div', 'client-option-head');
            head2.append(el('p', 'client-option-title', T.payOption2), tag(T.payOption2Tag, 'is-soft'));
            option2.append(head2, el('p', '', T.payStoreText), el('p', 'client-date', T.payStoreHint));
            if (!expired) {
                const actions = el('div', 'client-actions');
                actions.append(button(proposal.storeLink, T.payStoreButton, false, true));
                option2.append(actions);
            }
            pay.append(option2);
        }
        card.append(pay);

        if (proposal.note) {
            const note = el('div', 'client-note');
            note.append(el('p', 'client-small-title', T.note), el('p', '', proposal.note));
            card.append(note);
        }

        // Condiciones de contratación
        const conditions = (proposal.conditions || '').split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
        if (conditions.length) {
            const box = el('section', 'client-conditions');
            box.append(el('h2', 'client-subtitle', T.conditionsTitle));
            const list = el('ul', 'client-list');
            conditions.forEach((line) => list.append(el('li', '', line)));
            box.append(list);
            card.append(box);
        }

        // Vigencia
        if (proposal.validUntil && !accepted) {
            card.append(infoBox(`client-validity${expired ? ' is-expired' : ''}`, T.validityTitle,
                ['client-due-date', fill(expired ? T.expired : T.validityText, { date: longDate(proposal.validUntil) })]));
        }

        // Aceptación (abre WhatsApp; Jimena la confirma a mano en su panel)
        if (!accepted) {
            const cta = el('section', 'client-cta');
            const questionLink = el('a', 'text-link', T.ctaQuestionLink);
            questionLink.href = WHATSAPP + encodeURIComponent(fill(T.questionText, { code: quote.code }));
            questionLink.target = '_blank';
            questionLink.rel = 'noopener noreferrer';
            if (!expired) {
                cta.append(el('h2', 'client-subtitle', T.ctaTitle));
                const accept = button(WHATSAPP + encodeURIComponent(fill(T.acceptText, { code: quote.code })), T.acceptButton, true, true);
                accept.classList.add('client-accept');
                cta.append(accept);
                const [before, after] = T.ctaQuestion.split('{link}');
                const small = el('p', 'client-date client-cta-hint');
                small.append(before, questionLink, after);
                cta.append(small);
            } else {
                const actions = el('div', 'client-actions');
                actions.append(button(questionLink.href, T.ctaQuestionLink.charAt(0).toUpperCase() + T.ctaQuestionLink.slice(1), true, true));
                cta.append(actions);
            }
            card.append(cta);
        }

        // Solicitud original
        const request = el('section', 'client-request');
        request.append(el('h2', 'client-subtitle', T.originalRequest), requestList(quote, T.originalLabels));
        card.append(request);
        card.append(infoBox('client-save', T.saveTitle, ['', T.saveText]), el('p', 'client-foot client-signature', T.signature));
        view.replaceChildren(card);
    };

    const renderQuote = (quote) => (quote.proposal ? renderProposal(quote) : renderRequest(quote));

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

    // Seguimiento del proyecto: si el cliente vuelve a esta pestaña, se trae la etapa actual (Jimena la cambia desde su panel)
    if (kind === 'project') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            getJson(`/api/proyectos/${token}`).then((data) => { if (data) renderProject(data); }).catch(() => { /* queda lo que ya se ve */ });
        });
    }
})();
