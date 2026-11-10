// Brief del cliente: el formulario para que me cuente sobre su proyecto (reemplaza al Google Form).
// Se abre dentro del link del cliente (pestaña "Tu brief") y muestra solo las preguntas de su plan:
//   Emprendedor (tienda) · Básico (landing) · Premium (web a medida), y las que dependen de sus respuestas.
// Las respuestas se guardan solas mientras escribe (puede seguir otro día) y los archivos se suben al momento.
// Lo usa js/client-pages.js: window.JNBBrief.mount(contenedor, { token, lang, onChange }).
(() => {
    const TERMS = { es: '/terminos/', en: '/terminos/en', pt: '/terminos/pt' };
    const MAX_FILE = 8 * 1024 * 1024;
    const FILE_EXT = /\.(png|jpe?g|webp|gif|svg|heic|heif|pdf|docx?|xlsx?|pptx|odt|ods|txt|csv|zip)$/i;

    // ---- Textos de la pantalla
    const UI = {
        es: {
            title: 'Contame sobre tu proyecto',
            intro: '¡Gracias por confiar en mí! ✨ Este formulario me ayuda a conocer tu negocio, tus objetivos y el estilo que querés transmitir.',
            intro2: 'No necesitás saber de diseño ni de páginas web. No hay respuestas correctas o incorrectas: quiero conocer tu marca para crear una página que realmente te represente.',
            time: 'Tiempo estimado: 10 a 15 minutos. Se guarda solo, así que podés seguir otro día.',
            step: 'Paso {n} de {total}',
            next: 'Siguiente',
            back: 'Anterior',
            send: 'Enviar brief',
            sending: 'Enviando...',
            saving: 'Guardando...',
            saved: 'Guardado',
            saveError: 'No se pudo guardar. Revisá tu conexión.',
            required: 'Completá este dato para seguir.',
            email: 'Revisá el mail: tiene que tener @ y un dominio.',
            url: 'Pegá un link completo, por ejemplo https://drive.google.com/...',
            max: 'Elegí hasta {n}.',
            other: 'Escribí cuál',
            optional: 'opcional',
            upload: 'Elegir archivos',
            uploading: 'Subiendo {name}...',
            remove: 'Quitar',
            fileTooBig: '{name} pesa más de 8 MB. Pegá un link de Drive o WeTransfer en el campo de abajo.',
            fileType: '{name}: ese tipo de archivo no se puede subir. Usá imágenes, PDF, Word, Excel o ZIP.',
            fileError: 'No se pudo subir {name}. Probá de nuevo.',
            fileLimit: 'Llegaste al máximo de archivos. Para el resto, pegá un link de Drive o WeTransfer.',
            fileHint: 'Imágenes, PDF, Word, Excel o ZIP, hasta 8 MB cada uno.',
            sentTitle: '¡Gracias! Recibí tu brief.',
            sentText: 'Con esto ya puedo empezar a trabajar en tu proyecto. Si te olvidaste de algo, podés editar tus respuestas y volver a enviarlas.',
            sentOn: 'Enviado el {date}.',
            edit: 'Ver o editar mis respuestas',
            sendError: 'No se pudo enviar. Probá de nuevo en un rato.',
            missing: 'Falta completar algo en este paso.',
            yes: 'Sí',
        },
        en: {
            title: 'Tell me about your project',
            intro: 'Thank you for trusting me! ✨ This form helps me get to know your business, your goals and the style you want to convey.',
            intro2: 'You do not need to know about design or websites. There are no right or wrong answers: I want to get to know your brand to create a site that truly represents you.',
            time: 'Estimated time: 10 to 15 minutes. It saves automatically, so you can continue another day.',
            step: 'Step {n} of {total}',
            next: 'Next',
            back: 'Back',
            send: 'Send brief',
            sending: 'Sending...',
            saving: 'Saving...',
            saved: 'Saved',
            saveError: 'It could not be saved. Check your connection.',
            required: 'Please fill this in to continue.',
            email: 'Check the email: it needs an @ and a domain.',
            url: 'Paste a full link, for example https://drive.google.com/...',
            max: 'Choose up to {n}.',
            other: 'Tell me which one',
            optional: 'optional',
            upload: 'Choose files',
            uploading: 'Uploading {name}...',
            remove: 'Remove',
            fileTooBig: '{name} is larger than 8 MB. Paste a Drive or WeTransfer link in the field below.',
            fileType: '{name}: that file type cannot be uploaded. Use images, PDF, Word, Excel or ZIP.',
            fileError: '{name} could not be uploaded. Please try again.',
            fileLimit: 'You reached the file limit. For the rest, paste a Drive or WeTransfer link.',
            fileHint: 'Images, PDF, Word, Excel or ZIP, up to 8 MB each.',
            sentTitle: 'Thank you! I received your brief.',
            sentText: 'With this I can start working on your project. If you forgot something, you can edit your answers and send them again.',
            sentOn: 'Sent on {date}.',
            edit: 'View or edit my answers',
            sendError: 'It could not be sent. Please try again in a little while.',
            missing: 'Something is missing in this step.',
            yes: 'Yes',
        },
        pt: {
            title: 'Me conte sobre o seu projeto',
            intro: 'Obrigada por confiar em mim! ✨ Este formulário me ajuda a conhecer o seu negócio, os seus objetivos e o estilo que você quer transmitir.',
            intro2: 'Você não precisa entender de design nem de sites. Não há respostas certas ou erradas: quero conhecer a sua marca para criar uma página que realmente represente você.',
            time: 'Tempo estimado: 10 a 15 minutos. Fica salvo automaticamente, então você pode continuar outro dia.',
            step: 'Etapa {n} de {total}',
            next: 'Próximo',
            back: 'Voltar',
            send: 'Enviar briefing',
            sending: 'Enviando...',
            saving: 'Salvando...',
            saved: 'Salvo',
            saveError: 'Não foi possível salvar. Confira a sua conexão.',
            required: 'Preencha este campo para continuar.',
            email: 'Confira o e-mail: precisa ter @ e um domínio.',
            url: 'Cole um link completo, por exemplo https://drive.google.com/...',
            max: 'Escolha até {n}.',
            other: 'Escreva qual',
            optional: 'opcional',
            upload: 'Escolher arquivos',
            uploading: 'Enviando {name}...',
            remove: 'Remover',
            fileTooBig: '{name} tem mais de 8 MB. Cole um link do Drive ou WeTransfer no campo abaixo.',
            fileType: '{name}: esse tipo de arquivo não pode ser enviado. Use imagens, PDF, Word, Excel ou ZIP.',
            fileError: 'Não foi possível enviar {name}. Tente de novo.',
            fileLimit: 'Você chegou ao limite de arquivos. Para o resto, cole um link do Drive ou WeTransfer.',
            fileHint: 'Imagens, PDF, Word, Excel ou ZIP, até 8 MB cada um.',
            sentTitle: 'Obrigada! Recebi o seu briefing.',
            sentText: 'Com isso já posso começar a trabalhar no seu projeto. Se você esqueceu algo, pode editar as respostas e enviar de novo.',
            sentOn: 'Enviado em {date}.',
            edit: 'Ver ou editar minhas respostas',
            sendError: 'Não foi possível enviar. Tente de novo daqui a pouco.',
            missing: 'Falta preencher algo nesta etapa.',
            yes: 'Sim',
        },
    };

    // ---- Preguntas
    // Cada pregunta: id, tipo, si es obligatoria (req), cuándo aparece (when) y sus textos por idioma:
    //   [pregunta, ayuda, [opciones en el mismo orden que keys]]
    const SECTIONS_OPTS = {
        keys: ['about', 'services', 'how', 'testimonials', 'faq', 'gallery', 'pricing', 'benefits', 'team', 'clients'],
        es: ['Sobre mí', 'Servicios', 'Cómo trabajo', 'Testimonios', 'Preguntas frecuentes', 'Galería o portfolio', 'Precios o planes', 'Beneficios', 'Equipo', 'Clientes o marcas'],
        en: ['About me', 'Services', 'How I work', 'Testimonials', 'FAQ', 'Gallery or portfolio', 'Prices or plans', 'Benefits', 'Team', 'Clients or brands'],
        pt: ['Sobre mim', 'Serviços', 'Como trabalho', 'Depoimentos', 'Perguntas frequentes', 'Galeria ou portfólio', 'Preços ou planos', 'Benefícios', 'Equipe', 'Clientes ou marcas'],
    };
    const YES_NO = { keys: ['yes', 'no'], es: ['Sí', 'No'], en: ['Yes', 'No'], pt: ['Sim', 'Não'] };
    const opts = (o, lang) => o[lang];

    // Adicionales pedidos en el presupuesto (se leen del pedido, en el idioma en que lo hizo)
    const EXTRAS = {
        landing: /landing page (adem[aá]s|in addition|al[eé]m)|landing page besides|landing page as well/i,
        hours: /abierto \/ cerrado|open \/ closed|aberto \/ fechado/i,
        mode: /modo claro \/ oscuro|light \/ dark|modo claro \/ escuro/i,
        sections: /secciones extra|extra sections|se[cç][oõ]es extras|agregar secciones|add new sections/i,
        pages: /p[aá]ginas secundarias|secondary pages|p[aá]ginas secund[aá]rias/i,
        store: /tienda online en|online store on|loja virtual (na|em)/i,
        second: /segunda plataforma|second platform/i,
        urgent: /urgente|urgent/i,
    };
    const extrasFrom = (text) => {
        // Solo la línea de adicionales del pedido ("Quiero sumar o actualizar: ...")
        const line = String(text || '').split('\n').find((row) => /^(Quiero sumar o actualizar|I want to add or update|Quero adicionar ou atualizar):/i.test(row)) || '';
        return Object.fromEntries(Object.entries(EXTRAS).map(([key, re]) => [key, re.test(line)]));
    };

    // Qué partes ve cada cliente: solo las de su plan y las de los adicionales que pidió
    const isStore = (c) => c.plan === 'emprendedor' || (c.plan !== 'emprendedor' && c.x.store);
    const isWeb = (c) => c.plan === 'premium';
    const isLanding = (c) => c.plan === 'basico' || (c.plan === 'emprendedor' && c.x.landing);
    const isSite = (c) => isWeb(c) || isLanding(c);

    const EXTRA_SECTIONS_Q = { id: 'extraSections', type: 'textarea', req: true, when: (c) => c.x.sections,
        es: ['Pediste secciones extra: ¿cuáles querés sumar y qué contenido lleva cada una?'],
        en: ['You asked for extra sections: which ones do you want to add and what content does each one have?'],
        pt: ['Você pediu seções extras: quais quer acrescentar e qual conteúdo cada uma tem?'] };
    const SECOND_PLATFORM_Q = { id: 'secondPlatform', type: 'textarea', req: true, when: (c) => c.x.second,
        es: ['Pediste la tienda también en la segunda plataforma: ¿ya tenés la cuenta creada ahí? Pasame el mail con el que la creaste.', 'No me envíes tu contraseña.'],
        en: ['You asked for the store on the second platform too: have you created the account there? Send me the email you used.', 'Do not send me your password.'],
        pt: ['Você pediu a loja também na segunda plataforma: já criou a conta lá? Me passe o e-mail que usou.', 'Não me envie a sua senha.'] };
    const SECTIONS = [
        {
            id: 'start',
            es: 'Antes de empezar', en: 'Before we start', pt: 'Antes de começar',
            questions: [
                { id: 'terms', type: 'check', req: true,
                    es: ['Leí y acepto los Términos y condiciones.', 'Antes de empezar, leé los {terms}: ahí están los pagos, los plazos, las rondas de ajustes, el dominio, la publicación y las cancelaciones.'],
                    en: ['I have read and accept the Terms and conditions.', 'Before we start, read the {terms}: they cover payments, delivery times, rounds of adjustments, the domain, publishing and cancellations.'],
                    pt: ['Li e aceito os Termos e condições.', 'Antes de começar, leia os {terms}: ali estão os pagamentos, os prazos, as rodadas de ajustes, o domínio, a publicação e os cancelamentos.'] },
            ],
        },
        {
            id: 'you',
            es: 'Vos y tu proyecto', en: 'You and your project', pt: 'Você e o seu projeto',
            questions: [
                { id: 'name', type: 'text', req: true, es: ['Nombre y apellido'], en: ['First and last name'], pt: ['Nome e sobrenome'] },
                { id: 'email', type: 'email', req: true, es: ['Mail de contacto'], en: ['Contact email'], pt: ['E-mail de contato'] },
                { id: 'whatsapp', type: 'tel', req: true, es: ['WhatsApp, con código de país'], en: ['WhatsApp, with country code'], pt: ['WhatsApp, com código do país'] },
                { id: 'brand', type: 'text', req: true, es: ['Nombre de tu marca o emprendimiento'], en: ['Name of your brand or business'], pt: ['Nome da sua marca ou negócio'] },
                { id: 'location', type: 'text', req: true, es: ['País y ciudad desde donde trabajás'], en: ['Country and city where you work from'], pt: ['País e cidade de onde você trabalha'] },
                { id: 'what', type: 'textarea', req: true, es: ['¿Qué hacés o qué vendés? Contámelo como se lo contarías a un cliente nuevo.'], en: ['What do you do or sell? Tell me as you would tell a new client.'], pt: ['O que você faz ou vende? Me conte como contaria para um cliente novo.'] },
                { id: 'audience', type: 'textarea', req: true, es: ['¿A quién le hablás? Describí a tu cliente ideal (edad, qué necesita, qué le preocupa).'], en: ['Who are you talking to? Describe your ideal client (age, what they need, what worries them).'], pt: ['Com quem você fala? Descreva o seu cliente ideal (idade, o que precisa, o que preocupa).'] },
                { id: 'different', type: 'textarea', req: true, es: ['¿Qué te diferencia de otros que hacen lo mismo?'], en: ['What sets you apart from others who do the same?'], pt: ['O que diferencia você de outros que fazem o mesmo?'] },
                { id: 'goal', type: 'checkbox', req: true, other: true,
                    keys: ['whatsapp', 'buy', 'book', 'know'],
                    es: ['¿Qué querés que haga la persona que entra?', 'Podés elegir varias.', ['Que me escriba por WhatsApp', 'Que me compre', 'Que reserve un turno o una consulta', 'Que conozca mi trabajo']],
                    en: ['What do you want visitors to do?', 'You can choose several.', ['Message me on WhatsApp', 'Buy from me', 'Book an appointment or a session', 'Get to know my work']],
                    pt: ['O que você quer que a pessoa faça ao entrar?', 'Você pode escolher várias.', ['Me escrever pelo WhatsApp', 'Comprar de mim', 'Agendar um horário ou uma consulta', 'Conhecer o meu trabalho']] },
                { id: 'current', type: 'textarea', req: true,
                    es: ['¿Ya tenés una web o tienda? Si es así, pegá el enlace y contame qué te gusta y qué no.', 'Si no tenés, escribí "No".'],
                    en: ['Do you already have a website or store? If so, paste the link and tell me what you like and what you do not.', 'If you do not, write "No".'],
                    pt: ['Você já tem um site ou loja? Se tiver, cole o link e me conte do que gosta e do que não gosta.', 'Se não tiver, escreva "Não".'] },
            ],
        },
        {
            id: 'brand',
            es: 'Tu marca', en: 'Your brand', pt: 'A sua marca',
            questions: [
                // Solo si el plan no se sabe (por ejemplo, un proyecto creado a mano sin plan)
                { id: 'plan', type: 'radio', req: true, when: (c) => !c.knownPlan,
                    keys: (c) => (c.lang === 'en' ? ['basico', 'premium'] : ['emprendedor', 'basico', 'premium']),
                    es: ['¿Qué plan contrataste?', '', ['Plan Emprendedor · Tienda online', 'Plan Básico · Landing esencial', 'Plan Premium · Web a medida']],
                    en: ['Which plan did you choose?', '', ['Basic Plan · Essential landing page', 'Premium Plan · Custom website']],
                    pt: ['Qual plano você contratou?', '', ['Plano Empreendedor · Loja virtual', 'Plano Básico · Landing essencial', 'Plano Premium · Site sob medida']] },
                { id: 'logo', type: 'radio', req: true,
                    keys: ['file', 'lowq', 'none'],
                    es: ['¿Tenés logo?', '', ['Sí, lo subo acá', 'Sí, pero no tengo el archivo en buena calidad', 'No tengo logo']],
                    en: ['Do you have a logo?', '', ['Yes, I will upload it here', 'Yes, but I do not have a good-quality file', 'I do not have a logo']],
                    pt: ['Você tem logo?', '', ['Sim, envio aqui', 'Sim, mas não tenho o arquivo em boa qualidade', 'Não tenho logo']] },
                { id: 'logoFile', type: 'file', when: (c) => c.a.logo === 'file' || c.a.logo === 'lowq',
                    es: ['Subí tu logo (ideal: PNG con fondo transparente o SVG).'], en: ['Upload your logo (ideally PNG with a transparent background, or SVG).'], pt: ['Envie o seu logo (ideal: PNG com fundo transparente ou SVG).'] },
                { id: 'colors', type: 'textarea', es: ['Colores de tu marca. Si tenés los códigos (por ejemplo #1A2B3C), pegalos; si no, describilos.'], en: ['Your brand colors. If you have the codes (for example #1A2B3C), paste them; if not, describe them.'], pt: ['Cores da sua marca. Se tiver os códigos (por exemplo #1A2B3C), cole aqui; se não, descreva.'] },
                { id: 'fonts', type: 'textarea', req: true, es: ['¿Usás alguna tipografía en particular?', 'Si no, escribí "No".'], en: ['Do you use any particular typeface?', 'If not, write "No".'], pt: ['Você usa alguma tipografia em particular?', 'Se não, escreva "Não".'] },
                { id: 'feel', type: 'checkbox', req: true, max: 3, other: true,
                    keys: ['close', 'pro', 'elegant', 'fun', 'minimal', 'warm', 'modern', 'craft'],
                    es: ['¿Cómo querés que se sienta tu marca? Elegí hasta tres.', '', ['Cercana', 'Profesional', 'Elegante', 'Divertida', 'Minimalista', 'Cálida', 'Moderna', 'Artesanal']],
                    en: ['How do you want your brand to feel? Choose up to three.', '', ['Approachable', 'Professional', 'Elegant', 'Fun', 'Minimalist', 'Warm', 'Modern', 'Handmade']],
                    pt: ['Como você quer que a sua marca seja percebida? Escolha até três.', '', ['Próxima', 'Profissional', 'Elegante', 'Divertida', 'Minimalista', 'Acolhedora', 'Moderna', 'Artesanal']] },
                { id: 'references', type: 'textarea', es: ['Pegá los enlaces de dos o tres webs o tiendas que te gusten y contame qué te gusta de cada una.'], en: ['Paste links to two or three websites or stores you like and tell me what you like about each one.'], pt: ['Cole os links de dois ou três sites ou lojas de que você gosta e me conte do que gosta em cada um.'] },
                { id: 'avoid', type: 'textarea', es: ['¿Hay algo que no quieras de ninguna manera (colores, estilos, palabras)?'], en: ['Is there anything you definitely do not want (colors, styles, words)?'], pt: ['Tem algo que você não quer de jeito nenhum (cores, estilos, palavras)?'] },
                { id: 'tone', type: 'radio', req: true,
                    keys: ['a', 'b', 'c'],
                    es: ['¿Cómo le hablás a tu público?', '', ['De vos', 'De tú', 'De usted']],
                    en: ['How do you talk to your audience?', '', ['Casual and friendly', 'Friendly but professional', 'Formal']],
                    pt: ['Como você fala com o seu público?', '', ['De "você", informal', 'De "tu"', 'Formal ("o senhor", "a senhora")']] },
            ],
        },
        {
            id: 'store',
            es: 'Tu tienda', en: 'Your store', pt: 'A sua loja',
            when: isStore,
            questions: [
                { id: 'platform', type: 'radio', req: true, keys: ['tiendanube', 'empretienda', 'unsure'],
                    es: ['¿En qué plataforma querés tu tienda?', '', ['Tiendanube', 'Empretienda (solo Argentina)', 'Todavía no sé, necesito ayuda para elegir']],
                    en: ['Which platform do you want your store on?', '', ['Tiendanube', 'Empretienda (Argentina only)', 'I do not know yet, I need help choosing']],
                    pt: ['Em qual plataforma você quer a sua loja?', '', ['Tiendanube (Nuvemshop)', 'Empretienda (só Argentina)', 'Ainda não sei, preciso de ajuda para escolher']] },
                { id: 'account', type: 'radio', req: true, keys: ['yes', 'no'],
                    es: ['¿Ya tenés la cuenta creada en la plataforma?', '', ['Sí', 'No, todavía no']],
                    en: ['Have you already created your account on the platform?', '', ['Yes', 'Not yet']],
                    pt: ['Você já criou a conta na plataforma?', '', ['Sim', 'Ainda não']] },
                { id: 'platformPlan', type: 'textarea', req: true, es: ['¿Qué plan de la plataforma contrataste o pensás contratar?'], en: ['Which platform plan did you choose or are you planning to choose?'], pt: ['Qual plano da plataforma você contratou ou pensa contratar?'] },
                { id: 'storeEmail', type: 'email', req: true,
                    es: ['Mail con el que creaste la cuenta de la tienda.', 'No me envíes tu contraseña. Para trabajar en tu tienda te voy a pedir que me agregues como usuaria desde el panel de la plataforma. Si la plataforma no permite agregar usuarios, te voy a pedir acceso temporal a la cuenta.'],
                    en: ['Email you used to create the store account.', 'Do not send me your password. To work on your store, I will ask you to add me as a user from the platform panel. If the platform does not allow it, I will ask you for temporary access to the account.'],
                    pt: ['E-mail com o qual você criou a conta da loja.', 'Não me envie a sua senha. Para trabalhar na sua loja, vou pedir que você me adicione como usuária pelo painel da plataforma. Se a plataforma não permitir, vou pedir acesso temporário à conta.'] },
                { id: 'verified', type: 'radio', req: true, keys: ['yes', 'no', 'unknown'],
                    es: ['¿Ya verificaste tu identidad en la plataforma?', '', ['Sí', 'No', 'No sé qué es']],
                    en: ['Have you verified your identity on the platform?', '', ['Yes', 'No', 'I do not know what that is']],
                    pt: ['Você já verificou a sua identidade na plataforma?', '', ['Sim', 'Não', 'Não sei o que é']] },
                { id: 'products', type: 'radio', req: true, keys: ['20', '40', '60', '80', '100', 'more'],
                    es: ['¿Cuántos productos vas a cargar al inicio?', '', ['Hasta 20 (incluido en el plan)', '21 a 40', '41 a 60', '61 a 80', '81 a 100', 'Más de 100']],
                    en: ['How many products will you upload at the start?', '', ['Up to 20 (included in the plan)', '21 to 40', '41 to 60', '61 to 80', '81 to 100', 'More than 100']],
                    pt: ['Quantos produtos você vai cadastrar no início?', '', ['Até 20 (incluído no plano)', '21 a 40', '41 a 60', '61 a 80', '81 a 100', 'Mais de 100']] },
                { id: 'categories', type: 'textarea', req: true, es: ['¿En qué categorías los organizás? Por ejemplo: remeras, buzos, accesorios.'], en: ['Which categories do you organize them into? For example: t-shirts, sweaters, accessories.'], pt: ['Em quais categorias você organiza? Por exemplo: camisetas, moletons, acessórios.'] },
                { id: 'variants', type: 'radio', req: true, keys: YES_NO.keys,
                    es: ['¿Tus productos tienen variantes (talle, color, tamaño)?', '', YES_NO.es], en: ['Do your products have variants (size, color)?', '', YES_NO.en], pt: ['Os seus produtos têm variações (tamanho, cor)?', '', YES_NO.pt] },
                SECOND_PLATFORM_Q,
                { id: 'productsFiles', type: 'file', es: ['Subí la planilla de productos y las fotos.'], en: ['Upload the product spreadsheet and the photos.'], pt: ['Envie a planilha de produtos e as fotos.'] },
                { id: 'productsLink', type: 'url', es: ['O pegá el enlace a la carpeta de Drive con la planilla y las fotos.', 'Revisá que se pueda abrir sin pedir permiso.'], en: ['Or paste the link to the Drive folder with the spreadsheet and photos.', 'Make sure it opens without asking for permission.'], pt: ['Ou cole o link da pasta do Drive com a planilha e as fotos.', 'Confira se abre sem pedir permissão.'] },
                { id: 'payments', type: 'textarea', req: true,
                    es: ['¿Cómo te gustaría cobrar en tu tienda? Contame cómo cobrás hoy o qué tenés pensado.', 'Los medios de pago disponibles dependen de la plataforma y del plan que tengas contratado. Con lo que me cuentes, configuro las opciones que tu plan permita y te aviso si algo no está disponible.'],
                    en: ['How would you like to get paid in your store? Tell me how you get paid today or what you have in mind.', 'Available payment methods depend on the platform and your plan. With what you tell me, I set up the options your plan allows and let you know if something is not available.'],
                    pt: ['Como você gostaria de receber na sua loja? Me conte como recebe hoje ou o que tem em mente.', 'Os meios de pagamento disponíveis dependem da plataforma e do plano contratado. Com o que você me contar, configuro as opções que o seu plano permitir e aviso se algo não estiver disponível.'] },
                { id: 'shipping', type: 'textarea', req: true,
                    es: ['¿Cómo te gustaría entregar los pedidos? Contame cómo lo hacés hoy o qué tenés pensado.', 'Las opciones de envío también dependen de la plataforma y de tu plan. Con lo que me cuentes, configuro las que tu plan permita.'],
                    en: ['How would you like to deliver orders? Tell me how you do it today or what you have in mind.', 'Shipping options also depend on the platform and your plan. With what you tell me, I set up the ones your plan allows.'],
                    pt: ['Como você gostaria de entregar os pedidos? Me conte como faz hoje ou o que tem em mente.', 'As opções de envio também dependem da plataforma e do seu plano. Com o que você me contar, configuro as que o seu plano permitir.'] },
                { id: 'storeData', type: 'textarea', req: true,
                    es: ['Datos del negocio que se muestran en la tienda.', 'Nombre comercial, mail de atención, WhatsApp, redes.'],
                    en: ['Business details shown in the store.', 'Trade name, customer service email, WhatsApp, social media.'],
                    pt: ['Dados do negócio que aparecem na loja.', 'Nome comercial, e-mail de atendimento, WhatsApp, redes sociais.'] },
                { id: 'storeHero', type: 'textarea', es: ['¿Querés sumar algún texto para la portada (frase principal, promoción, envío gratis desde cierto monto)?'], en: ['Would you like to add any text for the homepage (main phrase, promotion, free shipping over a certain amount)?'], pt: ['Quer acrescentar algum texto para a página inicial (frase principal, promoção, frete grátis a partir de certo valor)?'] },
            ],
        },
        {
            id: 'web',
            es: 'Tu web a medida', en: 'Your custom website', pt: 'O seu site sob medida',
            when: isWeb,
            questions: [
                { id: 'sectionsWeb', type: 'checkbox', req: true, other: true, keys: SECTIONS_OPTS.keys,
                    es: ['¿Qué secciones querés en tu home?', 'Tu web ya incluye la portada (el primer bloque, con el título) y las secciones de contacto, ubicación y disponibilidad (con el indicador de "abierto / cerrado"): no hace falta que las elijas y no cuentan dentro de las 6 a 10. El menú y el pie de página tampoco cuentan.', SECTIONS_OPTS.es],
                    en: ['Which sections do you want on your homepage?', 'Your website already includes the hero (the first block, with the title) and the contact, location and availability sections (with the "open / closed" indicator): you do not need to choose them and they do not count within the 6 to 10. The menu and footer do not count either.', SECTIONS_OPTS.en],
                    pt: ['Quais seções você quer na página inicial?', 'O seu site já inclui a capa (o primeiro bloco, com o título) e as seções de contato, localização e disponibilidade (com o indicador "aberto / fechado"): não precisa escolhê-las e elas não contam dentro das 6 a 10. O menu e o rodapé também não contam.', SECTIONS_OPTS.pt] },
                { id: 'identity', type: 'textarea', es: ['¿Tu marca tiene manual de identidad u otros elementos gráficos (íconos, patrones, ilustraciones)?'], en: ['Does your brand have a brand book or other graphic elements (icons, patterns, illustrations)?'], pt: ['A sua marca tem manual de identidade ou outros elementos gráficos (ícones, padrões, ilustrações)?'] },
                { id: 'identityFiles', type: 'file', when: (c) => Boolean(c.a.identity), es: ['Si los tenés, subilos acá.'], en: ['If you have them, upload them here.'], pt: ['Se tiver, envie aqui.'] },
                { id: 'special', type: 'textarea', es: ['¿Hay alguna funcionalidad especial que tengas en mente?'], en: ['Is there any special feature you have in mind?'], pt: ['Tem alguma funcionalidade especial em mente?'] },
            ],
        },
        {
            id: 'landing',
            es: 'Tu landing', en: 'Your landing page', pt: 'A sua landing',
            when: isLanding,
            questions: [
                { id: 'sections5', type: 'checkbox', req: true, max: (c) => (c.x.sections ? 0 : 5), other: true, keys: SECTIONS_OPTS.keys,
                    es: [(c) => (c.x.sections ? '¿Qué secciones querés en tu home? Elegí las 5 incluidas y las extra que pediste.' : '¿Qué 5 secciones querés en tu home?'), 'Tu web ya incluye la portada (el primer bloque, con el título) y las secciones de contacto y de ubicación con mapa de Google Maps: no hace falta que las elijas y no cuentan dentro de las 5. El menú y el pie de página tampoco cuentan.', SECTIONS_OPTS.es],
                    en: [(c) => (c.x.sections ? 'Which sections do you want on your homepage? Choose the 5 included plus the extra ones you asked for.' : 'Which 5 sections do you want on your homepage?'), 'Your website already includes the hero (the first block, with the title) and the contact and location sections with a Google Maps map: you do not need to choose them and they do not count within the 5. The menu and footer do not count either.', SECTIONS_OPTS.en],
                    pt: [(c) => (c.x.sections ? 'Quais seções você quer na página inicial? Escolha as 5 incluídas e as extras que pediu.' : 'Quais 5 seções você quer na página inicial?'), 'O seu site já inclui a capa (o primeiro bloco, com o título) e as seções de contato e de localização com mapa do Google Maps: não precisa escolhê-las e elas não contam dentro das 5. O menu e o rodapé também não contam.', SECTIONS_OPTS.pt] },
            ],
        },
        {
            id: 'content',
            es: 'Contenido y contacto', en: 'Content and contact', pt: 'Conteúdo e contato',
            when: isSite,
            questions: [
                EXTRA_SECTIONS_Q,
                { id: 'pages', type: 'textarea', when: (c) => c.plan === 'premium' || c.x.pages, req: (c) => c.x.pages,
                    es: [(c) => (c.plan === 'premium' && !c.x.pages ? '¿Qué páginas secundarias necesitás? Hasta 4 incluidas.' : '¿Qué páginas secundarias necesitás?'), 'Por ejemplo: detalle de servicios, portfolio, preguntas frecuentes, una guía. Para cada una: qué objetivo tiene y qué contenido lleva.'],
                    en: [(c) => (c.plan === 'premium' && !c.x.pages ? 'Which secondary pages do you need? Up to 4 included.' : 'Which secondary pages do you need?'), 'For example: service details, portfolio, FAQ, a guide. For each one: its goal and what content it has.'],
                    pt: [(c) => (c.plan === 'premium' && !c.x.pages ? 'Quais páginas secundárias você precisa? Até 4 incluídas.' : 'Quais páginas secundárias você precisa?'), 'Por exemplo: detalhe dos serviços, portfólio, perguntas frequentes, um guia. Para cada uma: qual o objetivo e qual o conteúdo.'] },
                { id: 'hero', type: 'text', req: true, es: ['Frase principal de la portada: lo primero que se lee al entrar.'], en: ['Main phrase for the hero: the first thing people read when they arrive.'], pt: ['Frase principal da capa: a primeira coisa que se lê ao entrar.'] },
                { id: 'textsFiles', type: 'file', es: ['Subí los textos de las secciones (y de las páginas secundarias, si tenés).', 'Podés subir varios archivos.'], en: ['Upload the texts for the sections (and secondary pages, if any).', 'You can upload several files.'], pt: ['Envie os textos das seções (e das páginas secundárias, se tiver).', 'Você pode enviar vários arquivos.'] },
                { id: 'photosFiles', type: 'file', es: ['Subí las fotos e imágenes.', 'Podés subir varias.'], en: ['Upload the photos and images.', 'You can upload several.'], pt: ['Envie as fotos e imagens.', 'Você pode enviar várias.'] },
                { id: 'filesLink', type: 'url', es: ['O pegá el enlace a una carpeta de Drive o WeTransfer con los textos y las fotos.', 'Sirve si los archivos pesan mucho. Revisá que se pueda abrir sin pedir permiso.'], en: ['Or paste a link to a Drive or WeTransfer folder with the texts and photos.', 'Useful if the files are large. Make sure it opens without asking for permission.'], pt: ['Ou cole o link de uma pasta do Drive ou WeTransfer com os textos e as fotos.', 'Serve se os arquivos forem pesados. Confira se abre sem pedir permissão.'] },
                { id: 'waNumber', type: 'tel', req: true, es: ['Número de WhatsApp para el botón de contacto, con código de país.'], en: ['WhatsApp number for the contact button, with country code.'], pt: ['Número de WhatsApp para o botão de contato, com código do país.'] },
                { id: 'waMessage', type: 'textarea', req: true, es: ['Mensaje que querés que aparezca escrito cuando alguien toca el botón de WhatsApp.'], en: ['Message you want pre-written when someone taps the WhatsApp button.'], pt: ['Mensagem que você quer que apareça escrita quando alguém toca no botão do WhatsApp.'] },
                { id: 'socials', type: 'textarea', req: true, es: ['Enlaces a tus redes sociales.'], en: ['Links to your social media.'], pt: ['Links das suas redes sociais.'] },
                { id: 'maps', type: 'radio', req: true, keys: YES_NO.keys, es: ['¿Querés mostrar tu ubicación en Google Maps?', '', YES_NO.es], en: ['Do you want to show your location on Google Maps?', '', YES_NO.en], pt: ['Quer mostrar a sua localização no Google Maps?', '', YES_NO.pt] },
                { id: 'address', type: 'textarea', req: true, when: (c) => c.a.maps === 'yes', es: ['Dirección exacta para el mapa'], en: ['Exact address for the map'], pt: ['Endereço exato para o mapa'] },
                { id: 'booking', type: 'radio', req: true, keys: YES_NO.keys,
                    es: ['¿Querés sumar un botón para reservar un turno en tu Google Calendar?', 'Está incluido en tu plan y es opcional. Sirve si atendés con turnos, citas o reuniones: el botón lleva a tu página de reservas de Google Calendar.', YES_NO.es],
                    en: ['Would you like a button to book an appointment on your Google Calendar?', 'It is included in your plan and optional. Useful if you work with appointments or meetings: the button opens your Google Calendar booking page.', YES_NO.en],
                    pt: ['Quer um botão para agendar um horário no seu Google Agenda?', 'Está incluído no seu plano e é opcional. Serve se você atende com horários marcados: o botão leva à sua página de agendamentos do Google Agenda.', YES_NO.pt] },
                { id: 'bookingLink', type: 'url', when: (c) => c.a.booking === 'yes', es: ['Enlace a tu página de reservas', 'Si todavía no la tenés creada, dejá este campo vacío y te explico cómo armarla.'], en: ['Link to your booking page', 'If you have not created it yet, leave this empty and I will explain how to set it up.'], pt: ['Link da sua página de agendamentos', 'Se ainda não tiver criado, deixe em branco e eu explico como montar.'] },
                { id: 'hasDomain', type: 'radio', keys: ['yes', 'no'], es: ['¿Ya tenés dominio registrado?', '', ['Sí', 'No, necesito ayuda para registrarlo']], en: ['Do you already have a registered domain?', '', ['Yes', 'No, I need help registering it']], pt: ['Você já tem domínio registrado?', '', ['Sim', 'Não, preciso de ajuda para registrar']] },
                { id: 'domainInfo', type: 'text', when: (c) => c.a.hasDomain === 'yes', es: ['¿Cuál es y dónde lo registraste (NIC Argentina, GoDaddy, otro)?'], en: ['What is it and where did you register it (GoDaddy, Namecheap, other)?'], pt: ['Qual é e onde você registrou (Registro.br, GoDaddy, outro)?'] },
                { id: 'domainIdeas', type: 'textarea', when: (c) => c.a.hasDomain === 'no', es: ['¿Qué nombre te gustaría? Escribí dos o tres opciones.'], en: ['Which name would you like? Write two or three options.'], pt: ['Que nome você gostaria? Escreva duas ou três opções.'] },
                { id: 'hours', type: 'textarea', req: true, when: (c) => isWeb(c) || c.x.hours,
                    es: ['Horario de atención, día por día, y zona horaria de tu negocio, para el indicador "abierto / cerrado".', 'Por ejemplo: lunes a viernes de 9 a 17 h, sábados de 9 a 13 h, domingos cerrado. Hora de Argentina (GMT-3).'],
                    en: ['Opening hours, day by day, and your business time zone, for the "open / closed" indicator.', 'For example: Monday to Friday 9 am to 5 pm, Saturday 9 am to 1 pm, closed on Sunday. Eastern Time (GMT-5).'],
                    pt: ['Horário de atendimento, dia a dia, e fuso horário do seu negócio, para o indicador "aberto / fechado".', 'Por exemplo: segunda a sexta das 9h às 17h, sábados das 9h às 13h, domingos fechado. Horário de Brasília (GMT-3).'] },
                { id: 'holidays', type: 'text', when: (c) => isWeb(c) || c.x.hours, es: ['¿Atendés feriados? ¿Tenés algún horario especial?'], en: ['Do you work on holidays? Do you have any special hours?'], pt: ['Você atende em feriados? Tem algum horário especial?'] },
                { id: 'mode', type: 'radio', req: true, when: (c) => isWeb(c) || c.x.mode, keys: ['light', 'dark', 'auto'],
                    es: ['Modo claro y modo oscuro: ¿cuál preferís que se vea primero?', '', ['Claro', 'Oscuro', 'El que tenga configurado cada visitante']],
                    en: ['Light and dark mode: which one should show first?', '', ['Light', 'Dark', 'Whatever each visitor has set']],
                    pt: ['Modo claro e modo escuro: qual você prefere que apareça primeiro?', '', ['Claro', 'Escuro', 'O que cada visitante tiver configurado']] },
                { id: 'seo', type: 'textarea', es: ['Texto para Google.', 'Describí tu negocio en una oración y sumá las palabras con las que te gustaría que te encuentren.'], en: ['Text for Google.', 'Describe your business in one sentence and add the words you would like people to find you with.'], pt: ['Texto para o Google.', 'Descreva o seu negócio em uma frase e acrescente as palavras com que gostaria de ser encontrado.'] },
            ],
        },
        {
            id: 'close',
            es: 'Para terminar', en: 'To finish', pt: 'Para terminar',
            questions: [
                { id: 'deadline', type: 'textarea', req: (c) => c.x.urgent,
                    es: ['¿Necesitás que tu web o tienda esté publicada para una fecha en particular? Si es así, indicá para qué fecha.', 'Los plazos de entrega son los de tu plan (7 días hábiles en el Emprendedor, 10 en el Básico y 15 en el Premium), contados desde que recibo todo el material. Si necesitás que esté lista sí o sí para una fecha, lo podemos pactar; si implica entregar en menos tiempo, la entrega urgente tiene un costo adicional que te cotizo antes de empezar.'],
                    en: ['Do you need your website to be live by a specific date? If so, tell me which date.', 'Delivery times are those of your plan (10 business days for Basic and 15 for Premium), counted from when I receive all the content. If you need it ready by a certain date, we can agree on it; if that means delivering faster, urgent delivery has an extra cost that I quote before starting.'],
                    pt: ['Você precisa que o seu site ou loja esteja publicado para uma data específica? Se sim, indique a data.', 'Os prazos de entrega são os do seu plano (7 dias úteis no Empreendedor, 10 no Básico e 15 no Premium), contados a partir do recebimento de todo o material. Se precisar que esteja pronto para uma data, podemos combinar; se isso significar entregar em menos tempo, a entrega urgente tem um custo adicional que orço antes de começar.'] },
                { id: 'rights', type: 'check', req: true,
                    es: ['Confirmo que envié todo el material y que tengo derecho a usar los textos y las imágenes que envié.'],
                    en: ['I confirm that I sent all the content and that I have the right to use the texts and images I sent.'],
                    pt: ['Confirmo que enviei todo o material e que tenho direito de usar os textos e as imagens que enviei.'] },
            ],
        },
    ];

    // ---- Ayudas
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
    const sizeText = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
    const read = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } };
    const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ } };

    const mount = async (container, { token, lang, onChange }) => {
        const L = UI[lang] ? lang : 'es';
        const U = UI[L];
        const LOCALE = { es: 'es-AR', en: 'en-US', pt: 'pt-BR' }[L];
        const res = await fetch(`/api/brief/${token}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const backupKey = `jnb-brief-${token}`;
        // Si en este navegador quedó algo sin guardar en el servidor, se recupera
        const backup = read(backupKey);
        const a = { ...(data.answers || {}), ...(backup && backup.updated > (data.updated || '') ? backup.answers : {}) };
        let files = data.files || [];
        let status = data.status;
        let sent = data.sent;
        let step = 0;
        let editing = status !== 'enviado';

        const extras = extrasFrom(data.request);
        const ctx = () => ({ a, lang: L, knownPlan: Boolean(data.plan), plan: data.plan || a.plan || '', x: extras });
        const isReq = (q) => (typeof q.req === 'function' ? q.req(ctx()) : Boolean(q.req));
        const maxOf = (q) => (typeof q.max === 'function' ? q.max(ctx()) : q.max);
        const text = (q) => {
            const t = q[L] || q.es;
            return typeof t[0] === 'function' ? [t[0](ctx()), ...t.slice(1)] : t;
        };
        const keysOf = (q) => (typeof q.keys === 'function' ? q.keys(ctx()) : q.keys) || [];
        const visibleSections = () => SECTIONS.filter((s) => !s.when || s.when(ctx()))
            .map((s) => ({ ...s, qs: s.questions.filter((q) => !q.when || q.when(ctx())) }))
            .filter((s) => s.qs.length);

        // Resumen en el idioma del cliente (lo ve Jimena en el panel y en el mail)
        const optionLabel = (q, key) => {
            const keys = typeof q.keys === 'function' ? (L === 'en' ? ['basico', 'premium'] : ['emprendedor', 'basico', 'premium']) : q.keys;
            const labels = (text(q)[2]) || [];
            return labels[keys.indexOf(key)] || key;
        };
        const answerText = (q) => {
            const value = a[q.id];
            if (q.type === 'file') {
                const list = files.filter((f) => f.field === q.id);
                return list.map((f) => `📎 ${f.name} (${sizeText(f.size)})`).join('\n');
            }
            if (q.type === 'check') return value ? U.yes : '';
            if (q.type === 'radio') return value ? optionLabel(q, value) : '';
            if (q.type === 'checkbox') {
                const chosen = (Array.isArray(value) ? value : []).map((key) => (key === 'other' ? (a[`${q.id}Other`] || '') : optionLabel(q, key))).filter(Boolean);
                return chosen.join(', ');
            }
            return typeof value === 'string' ? value.trim() : '';
        };
        const summary = () => visibleSections().flatMap((s) => s.qs.map((q) => ({ s: s[L], q: text(q)[0], a: answerText(q) })).filter((row) => row.a));

        // ---- Guardado automático
        let saveTimer;
        let statusLine;
        const setSaveState = (state) => { if (statusLine) statusLine.textContent = state; };
        const save = async (send = false) => {
            clearTimeout(saveTimer);
            write(backupKey, { answers: a, updated: new Date().toISOString() });
            const response = await fetch(`/api/brief/${token}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ lang: L, answers: a, summary: summary(), send }),
            });
            if (!response.ok) throw new Error(response.status);
            const result = await response.json();
            status = result.status;
            sent = result.sent;
            return result;
        };
        const queueSave = () => {
            clearTimeout(saveTimer);
            setSaveState(U.saving);
            saveTimer = setTimeout(() => {
                save().then(() => setSaveState(U.saved)).catch(() => setSaveState(U.saveError));
            }, 1200);
        };

        // ---- Validación de un paso
        const problemOf = (q) => {
            const value = a[q.id];
            if (q.type === 'file') return '';
            const empty = q.type === 'checkbox' ? !(Array.isArray(value) && value.length) : !value || (typeof value === 'string' && !value.trim());
            if (isReq(q) && empty) return U.required;
            if (empty) return '';
            if (q.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim())) return U.email;
            if (q.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(value.trim())) return U.url;
            if (q.type === 'checkbox' && maxOf(q) && value.length > maxOf(q)) return fill(U.max, { n: maxOf(q) });
            if (q.type === 'checkbox' && value.includes('other') && !(a[`${q.id}Other`] || '').trim()) return U.required;
            return '';
        };

        // ---- Campos
        const fieldFor = (q) => {
            const [label, hint, options] = text(q);
            const wrap = el('div', `brief-field brief-${q.type}`);
            wrap.dataset.q = q.id;
            const id = `brief-${q.id}`;
            const title = el(q.type === 'radio' || q.type === 'checkbox' || q.type === 'file' ? 'p' : 'label', 'brief-label');
            if (q.type !== 'radio' && q.type !== 'checkbox' && q.type !== 'file' && q.type !== 'check') title.htmlFor = id;
            title.append(label);
            if (!isReq(q) && q.type !== 'check') title.append(' ', el('span', 'brief-optional', `(${U.optional})`));
            if (q.type !== 'check') wrap.append(title);
            if (hint) {
                const help = el('p', 'brief-hint');
                if (hint.includes('{terms}')) {
                    const [before, after] = hint.split('{terms}');
                    const link = el('a', 'text-link', { es: 'Términos y condiciones', en: 'Terms and conditions', pt: 'Termos e condições' }[L]);
                    link.href = TERMS[L];
                    link.target = '_blank';
                    link.rel = 'noopener';
                    help.append(before, link, after);
                } else {
                    help.textContent = hint;
                }
                if (q.type === 'check') wrap.append(help); else wrap.append(help);
            }

            const changed = () => { wrap.classList.remove('has-error'); wrap.querySelector('.brief-error')?.remove(); queueSave(); onChange?.(); };

            if (['text', 'email', 'tel', 'url'].includes(q.type)) {
                const input = el('input');
                input.id = id;
                input.type = q.type;
                input.value = a[q.id] || '';
                if (q.type === 'email') input.autocomplete = 'email';
                if (q.type === 'tel') { input.autocomplete = 'tel'; input.inputMode = 'tel'; }
                if (q.type === 'url') input.placeholder = 'https://';
                input.addEventListener('input', () => { a[q.id] = input.value; changed(); });
                wrap.append(input);
            } else if (q.type === 'textarea') {
                const area = el('textarea');
                area.id = id;
                area.rows = 4;
                area.value = a[q.id] || '';
                area.addEventListener('input', () => { a[q.id] = area.value; changed(); });
                wrap.append(area);
            } else if (q.type === 'check') {
                const box = el('label', 'brief-check');
                const input = el('input');
                input.type = 'checkbox';
                input.checked = Boolean(a[q.id]);
                input.addEventListener('change', () => { a[q.id] = input.checked; changed(); });
                box.append(input, el('span', '', label));
                wrap.append(box);
            } else if (q.type === 'radio' || q.type === 'checkbox') {
                const group = el('div', 'brief-options');
                group.setAttribute('role', q.type === 'radio' ? 'radiogroup' : 'group');
                const keys = keysOf(q);
                const allLabels = options || [];
                const labelFor = (key, index) => (typeof q.keys === 'function' ? optionLabel(q, key) : allLabels[index]);
                const list = [...keys.map((key, index) => [key, labelFor(key, index)]), ...(q.other ? [['other', { es: 'Otro', en: 'Other', pt: 'Outro' }[L]]] : [])];
                const otherInput = el('input', 'brief-other');
                otherInput.type = 'text';
                otherInput.placeholder = U.other;
                otherInput.value = a[`${q.id}Other`] || '';
                const syncOther = () => {
                    const on = q.type === 'radio' ? a[q.id] === 'other' : (a[q.id] || []).includes('other');
                    otherInput.hidden = !on;
                };
                otherInput.addEventListener('input', () => { a[`${q.id}Other`] = otherInput.value; changed(); });
                list.forEach(([key, optionText]) => {
                    const option = el('label', 'brief-option');
                    const input = el('input');
                    input.type = q.type;
                    input.name = id;
                    input.value = key;
                    input.checked = q.type === 'radio' ? a[q.id] === key : (a[q.id] || []).includes(key);
                    input.addEventListener('change', () => {
                        if (q.type === 'radio') a[q.id] = key;
                        else a[q.id] = [...group.querySelectorAll('input:checked')].map((i) => i.value);
                        syncOther();
                        changed();
                        // Las preguntas que dependen de esta respuesta aparecen o desaparecen
                        render();
                    });
                    option.append(input, el('span', '', optionText));
                    group.append(option);
                });
                wrap.append(group);
                if (q.other) { syncOther(); wrap.append(otherInput); }
            } else if (q.type === 'file') {
                const list = el('ul', 'brief-files');
                const note = el('p', 'brief-file-note');
                const paint = () => {
                    list.replaceChildren(...files.filter((f) => f.field === q.id).map((f) => {
                        const item = el('li', 'brief-file');
                        item.append(el('span', 'brief-file-name', `📎 ${f.name}`), el('span', 'brief-file-size', sizeText(f.size)));
                        const remove = el('button', 'brief-file-remove', U.remove);
                        remove.type = 'button';
                        remove.addEventListener('click', async () => {
                            remove.disabled = true;
                            const r = await fetch(`/api/brief/${token}/archivo/${f.id}`, { method: 'DELETE' }).catch(() => null);
                            if (r && r.ok) { files = files.filter((x) => x.id !== f.id); paint(); queueSave(); }
                            else remove.disabled = false;
                        });
                        item.append(remove);
                        return item;
                    }));
                };
                const picker = el('input', 'brief-file-input');
                picker.type = 'file';
                picker.multiple = true;
                picker.id = id;
                picker.accept = '.png,.jpg,.jpeg,.webp,.gif,.svg,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.pptx,.odt,.ods,.txt,.csv,.zip';
                const pick = el('label', 'button button-ghost brief-upload', U.upload);
                pick.htmlFor = id;
                picker.addEventListener('change', async () => {
                    for (const file of [...picker.files]) {
                        if (!FILE_EXT.test(file.name)) { note.textContent = fill(U.fileType, { name: file.name }); continue; }
                        if (file.size > MAX_FILE) { note.textContent = fill(U.fileTooBig, { name: file.name }); continue; }
                        note.textContent = fill(U.uploading, { name: file.name });
                        const r = await fetch(`/api/brief/${token}/archivo?campo=${encodeURIComponent(q.id)}&nombre=${encodeURIComponent(file.name)}`, {
                            method: 'POST',
                            headers: { 'content-type': file.type || 'application/octet-stream' },
                            body: file,
                        }).catch(() => null);
                        if (r && r.ok) {
                            files.push(await r.json());
                            note.textContent = '';
                            paint();
                        } else {
                            const reason = r ? await r.json().catch(() => ({})) : {};
                            note.textContent = reason.error === 'too many' ? U.fileLimit : reason.error === 'type' ? fill(U.fileType, { name: file.name }) : reason.error === 'too big' ? fill(U.fileTooBig, { name: file.name }) : fill(U.fileError, { name: file.name });
                        }
                    }
                    picker.value = '';
                    queueSave();
                });
                paint();
                wrap.append(picker, pick, el('p', 'brief-hint', U.fileHint), list, note);
            }
            return wrap;
        };

        // ---- Pantallas
        const renderSent = () => {
            const box = el('div', 'brief-done');
            box.append(el('p', 'brief-done-mark', '✓'), el('h2', 'client-headline', U.sentTitle), el('p', 'client-lead', U.sentText));
            if (sent) box.append(el('p', 'client-date', fill(U.sentOn, { date: new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(sent)) })));
            const edit = el('button', 'button button-ghost', U.edit);
            edit.type = 'button';
            edit.addEventListener('click', () => { editing = true; step = 0; render(); });
            box.append(edit);
            return box;
        };

        const render = () => {
            const card = el('article', 'client-card brief');
            if (!editing) {
                card.append(renderSent());
                container.replaceChildren(card);
                return;
            }
            const sections = visibleSections();
            step = Math.min(step, sections.length - 1);
            const current = sections[step];

            const head = el('div', 'brief-head');
            head.append(el('p', 'client-kicker', U.title));
            if (step === 0) head.append(el('p', 'client-lead', U.intro), el('p', 'client-date', U.intro2), el('p', 'client-date', U.time));
            const progress = el('div', 'client-progress');
            const label = el('p', 'client-progress-label', fill(U.step, { n: step + 1, total: sections.length }));
            const bar = el('div', 'client-progress-bar');
            const fillBar = el('span', 'client-progress-fill');
            fillBar.style.width = `${Math.round(((step + 1) / sections.length) * 100)}%`;
            bar.append(fillBar);
            progress.append(label, bar);
            head.append(progress);
            card.append(head);

            const form = el('form', 'brief-step');
            form.noValidate = true;
            form.append(el('h2', 'client-headline brief-section-title', current[L]));
            current.qs.forEach((q) => form.append(fieldFor(q)));

            const nav = el('div', 'brief-nav');
            if (step > 0) {
                const back = el('button', 'button button-ghost', `← ${U.back}`);
                back.type = 'button';
                back.addEventListener('click', () => { step -= 1; render(); container.scrollIntoView({ block: 'start' }); });
                nav.append(back);
            }
            const last = step === sections.length - 1;
            const next = el('button', 'button button-primary', last ? U.send : `${U.next} →`);
            next.type = 'submit';
            nav.append(next);
            statusLine = el('p', 'brief-save', '');
            statusLine.setAttribute('role', 'status');
            statusLine.setAttribute('aria-live', 'polite');
            form.append(nav, statusLine);

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                // Revisa este paso: marca lo que falta y lleva al primer error
                let first = null;
                current.qs.forEach((q) => {
                    const problem = problemOf(q);
                    const field = form.querySelector(`[data-q="${q.id}"]`);
                    field.querySelector('.brief-error')?.remove();
                    field.classList.toggle('has-error', Boolean(problem));
                    if (problem) {
                        field.append(el('p', 'brief-error', problem));
                        first = first || field;
                    }
                });
                if (first) {
                    statusLine.textContent = U.missing;
                    first.scrollIntoView({ block: 'center' });
                    first.querySelector('input, textarea')?.focus({ preventScroll: true });
                    return;
                }
                if (!last) {
                    step += 1;
                    render();
                    container.scrollIntoView({ block: 'start' });
                    queueSave();
                    return;
                }
                next.disabled = true;
                next.textContent = U.sending;
                try {
                    await save(true);
                    editing = false;
                    render();
                    container.scrollIntoView({ block: 'start' });
                    onChange?.({ sent: true });
                } catch (sendError) {
                    statusLine.textContent = U.sendError;
                    next.disabled = false;
                    next.textContent = U.send;
                }
            });
            card.append(form);
            container.replaceChildren(card);
        };

        render();
        return { status: () => status };
    };

    window.JNBBrief = { mount };
})();
