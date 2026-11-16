// Plan a medida: el cliente arma su proyecto desde cero (estructura web mínima, secciones, páginas y funciones),
// ve cuánto cuesta cada cosa y, si uno de los planes le conviene más por precio Y por prestaciones, se lo recomiendo.
// Precios, prestaciones de los planes y textos están solo en este archivo: si cambia algo, se cambia acá.
(() => {
    const root = document.querySelector('[data-custom-plan]');
    if (!root) return;

    // ---------------------------------------------------------------------------------------------
    // Precios: [pesos argentinos, dólares]. Cada moneda se suma por separado: nunca se mezclan.
    // ---------------------------------------------------------------------------------------------
    // Los precios salen de js/pricing.js (único lugar donde se cambian). Cada precio es [pesos, dólares]:
    // los dólares se calculan con la cotización del dólar MEP que figura ahí.
    const P = window.JNBPricing;
    const pair = (ars) => [ars, P.usd(ars)];
    const A = P.ARS;
    const PRICES = {
        web: pair(A.medida),        // estructura web mínima (precio base del Plan a medida)
        map: pair(A.map),
        agenda: pair(A.agenda),
        section: pair(A.section),
        page: pair(A.page),         // página secundaria de hasta 3 secciones
        dark: pair(A.dark),
        hours: pair(A.hours),
        storeAlone: pair(A.emprendedor),  // tienda sola = Plan Emprendedor
        storeAddOn: pair(A.storeAddOn),   // tienda sumada a una web (Plan Básico o Premium)
        second: pair(A.second),
        support: pair(A.support),   // por mes, aparte del total
        // Productos: total por tramo (21-30 … 91-100). Hasta 50, cada 10 cuesta "products"; desde el 51, "products51".
        products: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => pair(Math.min(n, 3) * A.products + Math.max(0, n - 3) * A.products51)),
    };

    // ---------------------------------------------------------------------------------------------
    // Planes cerrados, tal como los describe /planes/ (no se modifican: solo se usan para comparar).
    // type: 'web' = landing o web; 'store' = tienda. Lo que no está acá NO se considera incluido.
    // ---------------------------------------------------------------------------------------------
    // sections: máximo de secciones incluidas; minSections: las que el plan trae sí o sí (si el cliente pide menos, le sobran).
    // includes: funciones incluidas. pending: lo que la descripción del plan no aclara: NO se da por incluido,
    // se muestra "a confirmar" hasta que Jimena lo confirme. availability: la sección de disponibilidad no cuenta como sección.
    const PLANS = {
        emprendedor: {
            type: 'store', price: pair(A.emprendedor), anchor: 'emprendedor', langs: ['es', 'pt'],
            // Tienda en una plataforma, 20 productos, pagos y envíos. Productos extra y 2.ª plataforma: adicionales.
        },
        // Plan Emprendedor + landing: "5 secciones, como el Plan Básico". Cuesta lo mismo que el Plan Básico + la tienda sumada.
        // PENDIENTE: confirmar si la landing incluye mapa y botón de agenda como el Básico.
        emprendedorLanding: {
            type: 'web+store', price: pair(A.basico + A.storeAddOn), anchor: 'emprendedor', langs: ['es', 'pt'],
            sections: 5, minSections: 5, pages: 0, includes: [], pending: ['mail', 'map', 'agenda'], extraBenefits: [],
        },
        basico: {
            type: 'web', price: pair(A.basico), anchor: 'basico', langs: ['es', 'en', 'pt'],
            sections: 5, minSections: 5, pages: 0, includes: ['map', 'agenda'],
            // Modo claro / oscuro y abierto / cerrado: adicionales del Básico. Páginas secundarias: se cotizan aparte (precio de lista).
            // PENDIENTE: el plan menciona WhatsApp y redes, pero no el mail en el contacto.
            pending: ['mail'], extraBenefits: [],
        },
        premium: {
            type: 'web', price: pair(A.premium), anchor: 'premium', langs: ['es', 'en', 'pt'],
            sections: 10, minSections: 6, pages: 4, includes: ['map', 'agenda', 'dark', 'hours'], availability: true,
            // PENDIENTE: igual que el Básico, el mail en el contacto no está especificado.
            pending: ['mail'], extraBenefits: ['rounds3', 'support30', 'design'],
        },
    };
    const URGENT = P.URGENT;

    // ---------------------------------------------------------------------------------------------
    // Textos (los nombres de las opciones salen de la página, que ya está traducida)
    // ---------------------------------------------------------------------------------------------
    const I18N = {
        es: {
            section: 'Sección', otherSections: 'Otras secciones', pages: 'Páginas secundarias', urgent: 'Entrega urgente (+30 %)',
            monthly: 'por mes', from: 'desde', sections: 'secciones',
            empty: 'Elegí lo que necesitás y acá vas a ver cómo se arma tu presupuesto.',
            total: 'Total estimado', totalQuote: 'Total estimado, sin los ítems a cotizar',
            required: 'Necesaria para: {list}', auto: '{base}: la sumé porque la necesitan: {list}.',
            withWeb: 'con tu web',
            needsBase: '{list}: se suma a una web o a una tienda. Elegí una base para incluirlo.',
            plans: { emprendedor: 'Plan Emprendedor', emprendedorLanding: 'Plan Emprendedor + landing', basico: 'Plan Básico', premium: 'Plan Premium' },
            recoEyebrowAlt: 'Una alternativa para comparar',
            recoLeadAlt: 'El {plan} cubre lo que seleccionaste, pero también incluye cosas que no pediste. Si no las vas a usar, tu configuración a medida es igual de válida.',
            minSections: 'El {plan} incluye como mínimo {min} secciones: elegiste {n}, así que tendrías {x} más de las que necesitás.',
            unrequested: 'Incluye y no pediste', unrequestedValue: 'Valor de lista de lo que no pediste: {value}. La diferencia de precio es {diff}.',
            unrequestedValueTie: 'Valor de lista de lo que no pediste: {value}, por el mismo precio.',
            moreSections: '{n} secciones más', moreSection: '1 sección más', morePages: 'hasta {n} páginas secundarias', morePage: 'hasta 1 página secundaria',
            pendingTitle: 'A confirmar con tu presupuesto', whyPending: 'Cuesta {diff} menos. Lo marcado “a confirmar” te lo confirmo con el presupuesto.',
            recoLeadPending: 'Según las características que seleccionaste, el {plan} puede ser más conveniente: cubre lo que está confirmado en su descripción, y {list} te lo confirmo con el presupuesto.',
            recoLeadAltPending: 'El {plan} cubre lo que está confirmado en su descripción ({list}: a confirmar con el presupuesto), pero también incluye cosas que no pediste. Si no las vas a usar, tu configuración a medida es igual de válida.',
            pendingItems: { mail: 'Contacto por mail', map: 'Ubicación con mapa', agenda: 'Botón de agenda de turnos', dark: 'Modo claro / oscuro', hours: 'Cartel de abierto / cerrado' },
            availability: 'Horarios (la sección de disponibilidad ya viene incluida)',
            sameAlt: 'Otra opción con el mismo precio', sameAltDiff: '{plan}: mismo precio. Diferencias: {list}.', sameAltNone: '{plan}: mismo precio y mismas prestaciones.',
            diffConfirm: '{item}: a confirmar', diffIncluded: '{item}: incluido', diffExtra: '{item}: se suma como adicional',
            planWithStore: '{plan} + tienda online',
            recoEyebrow: 'Hay una opción que puede convenirte más',
            recoLead: 'Según las características que seleccionaste, el {plan} puede ofrecerte lo que necesitás por un precio más conveniente que tu configuración personalizada.',
            recoLeadTie: 'Según las características que seleccionaste, el {plan} te ofrece lo que necesitás por el mismo precio que tu configuración, y suma más prestaciones.',
            recoPlan: '{plan}', recoCustom: 'Tu configuración', recoDiff: 'Diferencia', recoSame: 'Mismo precio',
            whyCheaper: 'Cubre todo lo que elegiste y cuesta {diff} menos.',
            whyCheaperAddons: 'Con los adicionales que se le suman, cubre todo lo que elegiste y cuesta {diff} menos.',
            whyTie: 'Cuesta lo mismo y además incluye: {list}.',
            covers: 'Incluye lo que elegiste', coversConfirmed: 'Incluye (confirmado)', addons: 'Se le suman como adicionales', outside: 'Siguen a cotizar aparte (con cualquier opción)',
            alsoIncludes: 'Además incluye', urgentNote: 'La entrega urgente (+30 %) se calcula igual sobre cualquiera de las dos opciones.',
            supportNote: 'El soporte por mes no entra en la comparación: se contrata aparte en las dos opciones.',
            view: 'Ver este plan', keep: 'Continuar con mi configuración',
            kept: 'Seguís con tu configuración.', show: 'Ver la recomendación',
            match: 'Lo que armaste es el {plan}, con el mismo precio. Podés pedirlo así.',
            matchAddons: 'Lo que armaste es el {plan} con sus adicionales ({list}), con el mismo precio.',
            structure: 'Portada, contacto, WhatsApp y redes', nSections: '{n} secciones (incluye hasta {max})', nSection: '1 sección (incluye hasta {max})',
            nPages: '{n} páginas secundarias (incluye hasta {max})', nPage: '1 página secundaria (incluye hasta {max})',
            extraSections: '{n} secciones extra', extraSection: '1 sección extra', extraPages: '{n} páginas secundarias', extraPage: '1 página secundaria',
            store: 'Tienda online', storeIncluded: 'Tienda online con hasta 20 productos, pagos y envíos',
            benefits: { map: 'ubicación con mapa', agenda: 'botón de agenda de turnos', dark: 'modo claro / oscuro', hours: 'cartel de abierto / cerrado', rounds3: '3 rondas de ajustes', support30: '30 días de soporte', design: 'diseño personalizado según tu marca' },
        },
        en: {
            section: 'Section', otherSections: 'Other sections', pages: 'Secondary pages', urgent: 'Rush delivery (+30%)',
            monthly: 'per month', from: 'from', sections: 'sections',
            empty: 'Choose what you need and you’ll see your quote take shape here.',
            total: 'Estimated total', totalQuote: 'Estimated total, not including items to be quoted',
            required: 'Needed for: {list}', auto: '{base}: added because these need it: {list}.',
            withWeb: 'with your website',
            needsBase: '{list}: this is added to a website. Choose the website structure to include it.',
            plans: { basico: 'Basic Plan', premium: 'Premium Plan' },
            recoEyebrowAlt: 'An alternative to compare',
            recoLeadAlt: 'The {plan} covers what you selected, but it also includes things you didn’t ask for. If you won’t use them, your custom setup is just as valid.',
            minSections: 'The {plan} includes at least {min} sections: you chose {n}, so you would get {x} more than you need.',
            unrequested: 'Included but not requested', unrequestedValue: 'List value of what you didn’t request: {value}. The price difference is {diff}.',
            unrequestedValueTie: 'List value of what you didn’t request: {value}, for the same price.',
            moreSections: '{n} more sections', moreSection: '1 more section', morePages: 'up to {n} secondary pages', morePage: 'up to 1 secondary page',
            pendingTitle: 'To be confirmed with your quote', whyPending: 'It costs {diff} less. Items marked “to be confirmed” will be confirmed with your quote.',
            recoLeadPending: 'Based on what you selected, the {plan} may be a better fit: it covers what its description confirms, and I’ll confirm {list} with your quote.',
            recoLeadAltPending: 'The {plan} covers what its description confirms ({list}: to be confirmed with your quote), but it also includes things you didn’t ask for. If you won’t use them, your custom setup is just as valid.',
            pendingItems: { mail: 'Email contact', map: 'Location with map', agenda: 'Booking button', dark: 'Light / dark mode', hours: 'Open / closed sign' },
            availability: 'Opening hours (the availability section is already included)',
            sameAlt: 'Another option at the same price', sameAltDiff: '{plan}: same price. Differences: {list}.', sameAltNone: '{plan}: same price and same features.',
            diffConfirm: '{item}: to be confirmed', diffIncluded: '{item}: included', diffExtra: '{item}: added as an extra',
            planWithStore: '{plan} + online store',
            recoEyebrow: 'There’s an option that may suit you better',
            recoLead: 'Based on what you selected, the {plan} can give you what you need for a better price than your custom setup.',
            recoLeadTie: 'Based on what you selected, the {plan} gives you what you need for the same price as your custom setup, with more included.',
            recoPlan: '{plan}', recoCustom: 'Your custom setup', recoDiff: 'Difference', recoSame: 'Same price',
            whyCheaper: 'It covers everything you chose and costs {diff} less.',
            whyCheaperAddons: 'With the add-ons it needs, it covers everything you chose and costs {diff} less.',
            whyTie: 'It costs the same and also includes: {list}.',
            covers: 'Includes what you chose', coversConfirmed: 'Includes (confirmed)', addons: 'Added as extras', outside: 'Still to be quoted separately (with either option)',
            alsoIncludes: 'Also includes', urgentNote: 'Rush delivery (+30%) applies the same way to either option.',
            supportNote: 'Monthly support isn’t part of the comparison: it’s hired separately with either option.',
            view: 'See this plan', keep: 'Keep my custom setup',
            kept: 'You’re keeping your custom setup.', show: 'See the recommendation',
            match: 'What you built is the {plan}, at the same price. You can request it as is.',
            matchAddons: 'What you built is the {plan} with its add-ons ({list}), at the same price.',
            structure: 'Hero, contact, WhatsApp and social links', nSections: '{n} sections (includes up to {max})', nSection: '1 section (includes up to {max})',
            nPages: '{n} secondary pages (includes up to {max})', nPage: '1 secondary page (includes up to {max})',
            extraSections: '{n} extra sections', extraSection: '1 extra section', extraPages: '{n} secondary pages', extraPage: '1 secondary page',
            store: 'Online store', storeIncluded: 'Online store',
            benefits: { map: 'location with map', agenda: 'booking button', dark: 'light / dark mode', hours: 'open / closed sign', rounds3: '3 rounds of revisions', support30: '30 days of support', design: 'design tailored to your brand' },
        },
        pt: {
            section: 'Seção', otherSections: 'Outras seções', pages: 'Páginas secundárias', urgent: 'Entrega urgente (+30 %)',
            monthly: 'por mês', from: 'a partir de', sections: 'seções',
            empty: 'Escolha o que você precisa e aqui você vai ver seu orçamento se formar.',
            total: 'Total estimado', totalQuote: 'Total estimado, sem os itens a orçar',
            required: 'Necessária para: {list}', auto: '{base}: incluí porque é necessária para: {list}.',
            withWeb: 'com o seu site',
            needsBase: '{list}: é somado a um site ou a uma loja. Escolha uma base para incluir.',
            plans: { emprendedor: 'Plano Empreendedor', emprendedorLanding: 'Plano Empreendedor + landing page', basico: 'Plano Básico', premium: 'Plano Premium' },
            recoEyebrowAlt: 'Uma alternativa para comparar',
            recoLeadAlt: 'O {plan} cobre o que você selecionou, mas também inclui coisas que você não pediu. Se não for usá-las, sua configuração sob medida é igualmente válida.',
            minSections: 'O {plan} inclui no mínimo {min} seções: você escolheu {n}, então teria {x} a mais do que precisa.',
            unrequested: 'Inclui e você não pediu', unrequestedValue: 'Valor de tabela do que você não pediu: {value}. A diferença de preço é {diff}.',
            unrequestedValueTie: 'Valor de tabela do que você não pediu: {value}, pelo mesmo preço.',
            moreSections: '{n} seções a mais', moreSection: '1 seção a mais', morePages: 'até {n} páginas secundárias', morePage: 'até 1 página secundária',
            pendingTitle: 'A confirmar com seu orçamento', whyPending: 'Custa {diff} a menos. O que está marcado “a confirmar” eu confirmo com o orçamento.',
            recoLeadPending: 'De acordo com o que você selecionou, o {plan} pode ser mais vantajoso: cobre o que está confirmado na descrição dele, e {list} eu confirmo com o orçamento.',
            recoLeadAltPending: 'O {plan} cobre o que está confirmado na descrição dele ({list}: a confirmar com o orçamento), mas também inclui coisas que você não pediu. Se não for usá-las, sua configuração sob medida é igualmente válida.',
            pendingItems: { mail: 'Contato por e-mail', map: 'Localização com mapa', agenda: 'Botão de agenda', dark: 'Modo claro / escuro', hours: 'Aviso de aberto / fechado' },
            availability: 'Horários (a seção de disponibilidade já vem incluída)',
            sameAlt: 'Outra opção pelo mesmo preço', sameAltDiff: '{plan}: mesmo preço. Diferenças: {list}.', sameAltNone: '{plan}: mesmo preço e mesmas funcionalidades.',
            diffConfirm: '{item}: a confirmar', diffIncluded: '{item}: incluído', diffExtra: '{item}: somado como adicional',
            planWithStore: '{plan} + loja virtual',
            recoEyebrow: 'Há uma opção que pode ser melhor para você',
            recoLead: 'De acordo com o que você selecionou, o {plan} pode oferecer o que você precisa por um preço melhor que a sua configuração personalizada.',
            recoLeadTie: 'De acordo com o que você selecionou, o {plan} oferece o que você precisa pelo mesmo preço da sua configuração, com mais coisas incluídas.',
            recoPlan: '{plan}', recoCustom: 'Sua configuração', recoDiff: 'Diferença', recoSame: 'Mesmo preço',
            whyCheaper: 'Cobre tudo o que você escolheu e custa {diff} a menos.',
            whyCheaperAddons: 'Com os adicionais necessários, cobre tudo o que você escolheu e custa {diff} a menos.',
            whyTie: 'Custa o mesmo e ainda inclui: {list}.',
            covers: 'Inclui o que você escolheu', coversConfirmed: 'Inclui (confirmado)', addons: 'Somados como adicionais', outside: 'Continuam a orçar à parte (em qualquer opção)',
            alsoIncludes: 'Também inclui', urgentNote: 'A entrega urgente (+30 %) é calculada igual nas duas opções.',
            supportNote: 'O suporte mensal não entra na comparação: é contratado à parte nas duas opções.',
            view: 'Ver este plano', keep: 'Continuar com minha configuração',
            kept: 'Você continua com sua configuração.', show: 'Ver a recomendação',
            match: 'O que você montou é o {plan}, pelo mesmo preço. Você pode pedir assim.',
            matchAddons: 'O que você montou é o {plan} com seus adicionais ({list}), pelo mesmo preço.',
            structure: 'Capa, contato, WhatsApp e redes', nSections: '{n} seções (inclui até {max})', nSection: '1 seção (inclui até {max})',
            nPages: '{n} páginas secundárias (inclui até {max})', nPage: '1 página secundária (inclui até {max})',
            extraSections: '{n} seções extras', extraSection: '1 seção extra', extraPages: '{n} páginas secundárias', extraPage: '1 página secundária',
            store: 'Loja virtual', storeIncluded: 'Loja virtual com até 20 produtos, pagamentos e envios',
            benefits: { map: 'localização com mapa', agenda: 'botão de agenda', dark: 'modo claro / escuro', hours: 'aviso de aberto / fechado', rounds3: '3 rodadas de ajustes', support30: '30 dias de suporte', design: 'design personalizado para sua marca' },
        },
    };

    const lang = root.dataset.lang || 'es';
    const T = I18N[lang] || I18N.es;
    const storeKey = 'jnb-plan-a-medida';
    let cur = lang === 'es' ? 0 : 1;   // 0 = pesos, 1 = dólares (inglés y portugués: siempre dólares)
    const money = (price) => {
        if (!cur) return `$${price[0].toLocaleString('es-AR')}`;
        // Dólares: el importe en pesos convertido con la cotización (así el total en USD coincide con el de pesos)
        const usd = P.usd(price[0]).toLocaleString(lang === 'es' ? 'es-AR' : 'en-US');
        return lang === 'es' ? `USD ${usd}` : `$${usd} USD`;
    };
    const fill = (text, values = {}) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), text);
    const times = (price, n) => [price[0] * n, price[1] * n];
    const sum = (prices) => prices.reduce((s, p) => [s[0] + p[0], s[1] + p[1]], [0, 0]);
    const joinList = (items) => items.join(', ');

    // ---------------------------------------------------------------------------------------------
    // Elementos de la página
    // ---------------------------------------------------------------------------------------------
    const baseBoxes = Object.fromEntries([...root.querySelectorAll('input[name="cp-base"]')].map((input) => [input.value, input]));
    const sectionBoxes = [...root.querySelectorAll('input[name="cp-section"]')];
    const otherSections = root.querySelector('input[name="cp-other"]');
    const rows = [...root.querySelectorAll('tr[data-item]')];
    const row = (key) => rows.find((r) => r.dataset.item === key);
    const summary = root.querySelector('.cp-summary');
    const list = summary.querySelector('.cp-summary-list');
    const empty = summary.querySelector('.cp-summary-empty');
    const autoNote = summary.querySelector('.cp-summary-auto');
    const quoteBox = summary.querySelector('.cp-summary-quote');
    const totalBox = summary.querySelector('.cp-summary-total');
    const reco = summary.querySelector('.cp-reco');
    const request = summary.querySelector('.cp-request');
    const bar = root.querySelector('.cp-bar');

    const rowName = (r) => r.querySelector('th').firstChild.textContent.trim();
    const baseName = (key) => baseBoxes[key]?.closest('label').querySelector('.cp-base-title').textContent.trim() || '';
    const rowInput = (r) => r.querySelector('input, select');
    const count = (input) => (input ? Math.max(0, Math.min(Number(input.max) || 99, parseInt(input.value, 10) || 0)) : 0);
    const isOn = (r) => {
        const input = rowInput(r);
        if (input.type === 'checkbox') return input.checked;
        if (input.tagName === 'SELECT') return input.value !== '';
        return count(input) > 0;
    };

    const paintPrices = () => {
        root.querySelectorAll('[data-price]').forEach((el) => {
            const key = el.dataset.price;
            if (key === 'tienda') el.textContent = money(PRICES.storeAlone);
            else if (key === 'products') el.textContent = `${T.from} ${money(PRICES.products[0])}`;
            else if (PRICES[key]) el.textContent = money(PRICES[key]);
        });
    };

    // ---------------------------------------------------------------------------------------------
    // Selección: qué eligió el cliente (y qué base necesita cada cosa)
    // ---------------------------------------------------------------------------------------------
    const needs = () => {
        const web = [];
        const store = [];
        if (sectionBoxes.some((box) => box.checked) || count(otherSections)) web.push(T.sections);
        rows.filter(isOn).forEach((r) => {
            if (r.dataset.needs === 'web') web.push(rowName(r));
            if (r.dataset.needs === 'tienda') store.push(rowName(r));
        });
        return { web, store };
    };

    const readSelection = () => {
        const need = needs();
        const sel = {
            web: Boolean(baseBoxes.web?.checked) || need.web.length > 0,
            store: Boolean(baseBoxes.tienda?.checked) || need.store.length > 0,
            sectionNames: sectionBoxes.filter((box) => box.checked).map((box) => box.value),
            other: count(otherSections),
            pages: 0, map: false, agenda: false, dark: false, hours: false,
            products: null, second: false, support: false, urgent: false,
            quotes: [], missingBase: [], need,
        };
        sel.sections = sel.sectionNames.length + sel.other;
        sel.availability = sectionBoxes.some((box) => box.checked && box.dataset.availability !== undefined);
        rows.filter(isOn).forEach((r) => {
            const key = r.dataset.item;
            const input = rowInput(r);
            if (r.dataset.needs === 'any' && !sel.web && !sel.store) { sel.missingBase.push(rowName(r)); return; }
            if (r.dataset.quote !== undefined) { sel.quotes.push(rowName(r)); return; }
            if (key === 'pages') sel.pages = count(input);
            else if (key === 'products') {
                if (input.value === 'quote') sel.quotes.push(`${rowName(r)}: ${input.selectedOptions[0].textContent.trim()}`);
                else sel.products = { tier: Number(input.value), label: `${rowName(r)}: ${input.selectedOptions[0].textContent.trim()}` };
            } else sel[key] = true;
        });
        return sel;
    };

    // ---------------------------------------------------------------------------------------------
    // Presupuesto a medida: una línea por elemento, con su precio
    // ---------------------------------------------------------------------------------------------
    const customBudget = (sel) => {
        const lines = [];
        const add = (label, price, extra = {}) => lines.push({ label, price, ...extra });
        if (sel.web) add(baseName('web'), PRICES.web, { auto: !baseBoxes.web.checked || Boolean(baseBoxes.web.dataset.auto) });
        sel.sectionNames.forEach((name) => add(`${T.section}: ${name}`, PRICES.section));
        if (sel.other) add(`${T.otherSections} × ${sel.other}`, times(PRICES.section, sel.other));
        if (sel.pages) add(`${T.pages} × ${sel.pages}`, times(PRICES.page, sel.pages));
        ['map', 'agenda', 'dark', 'hours'].forEach((key) => { if (sel[key]) add(rowName(row(key)), PRICES[key]); });
        if (sel.store) add(baseName('tienda'), sel.web ? PRICES.storeAddOn : PRICES.storeAlone, { auto: Boolean(baseBoxes.tienda.dataset.auto) });
        if (sel.products) add(sel.products.label, PRICES.products[sel.products.tier]);
        if (sel.second) add(rowName(row('second')), PRICES.second);
        const subtotal = sum(lines.map((l) => l.price));
        return { lines, subtotal };
    };

    // ---------------------------------------------------------------------------------------------
    // La misma selección armada sobre un plan: qué cubre, qué se suma como adicional y cuánto cuesta.
    // Devuelve null si el plan no corresponde al tipo de proyecto.
    // ---------------------------------------------------------------------------------------------
    const planOption = (key, sel) => {
        const plan = PLANS[key];
        if (!plan.langs.includes(lang)) return null;
        // Tipo de proyecto: un plan de tienda no sirve para una web, ni uno de web solo para una tienda
        if (plan.type === 'store' && sel.web) return null;
        if (plan.type === 'web' && !sel.web) return null;
        if (plan.type === 'web+store' && !(sel.web && sel.store)) return null;

        const covered = [];
        const addons = [];
        const pending = [];
        const unrequested = [];   // { label, price|null }: lo que el plan trae y el cliente no pidió
        const addon = (label, price) => addons.push({ label, price });
        let minNote = '';

        if (plan.type === 'store') {
            covered.push(T.storeIncluded);
        } else {
            covered.push(T.structure);
            if ((plan.pending || []).includes('mail')) pending.push(T.pendingItems.mail);
            // Secciones: si el plan ya trae la de disponibilidad, "Horarios" no se cuenta ni se cobra dos veces
            let sections = sel.sections;
            if (plan.availability && sel.availability) { sections -= 1; covered.push(T.availability); }
            const inPlan = Math.min(sections, plan.sections);
            if (inPlan) covered.push(fill(inPlan === 1 ? T.nSection : T.nSections, { n: inPlan, max: plan.sections }));
            const extra = sections - inPlan;
            if (extra) addon(fill(extra === 1 ? T.extraSection : T.extraSections, { n: extra }), times(PRICES.section, extra));
            const short = Math.max(0, plan.minSections - sections);
            if (short) {
                unrequested.push({ label: fill(short === 1 ? T.moreSection : T.moreSections, { n: short }), price: times(PRICES.section, short) });
                minNote = fill(T.minSections, { plan: T.plans[key], min: plan.minSections, n: sections, x: short });
            }
            const pagesIn = Math.min(sel.pages, plan.pages);
            if (pagesIn) covered.push(fill(pagesIn === 1 ? T.nPage : T.nPages, { n: pagesIn, max: plan.pages }));
            const pagesExtra = sel.pages - pagesIn;
            if (pagesExtra) addon(fill(pagesExtra === 1 ? T.extraPage : T.extraPages, { n: pagesExtra }), times(PRICES.page, pagesExtra));
            const pagesUnused = plan.pages - pagesIn;
            if (pagesUnused) unrequested.push({ label: fill(pagesUnused === 1 ? T.morePage : T.morePages, { n: pagesUnused }), price: times(PRICES.page, pagesUnused) });
            ['map', 'agenda', 'dark', 'hours'].forEach((item) => {
                if (plan.includes.includes(item)) {
                    if (sel[item]) covered.push(rowName(row(item)));
                    else unrequested.push({ label: T.benefits[item], price: PRICES[item] });
                } else if (sel[item]) {
                    if ((plan.pending || []).includes(item)) pending.push(T.pendingItems[item]);
                    else addon(rowName(row(item)), PRICES[item]);
                }
            });
            plan.extraBenefits.forEach((item) => unrequested.push({ label: T.benefits[item], price: null }));
            if (plan.type === 'web' && sel.store) addon(T.store, PRICES.storeAddOn);
            if (plan.type === 'web+store') covered.push(T.storeIncluded);
        }
        // Lo de la tienda que no viene en ningún plan se suma igual (mismo precio en las dos opciones)
        if (sel.products) addon(sel.products.label, PRICES.products[sel.products.tier]);
        if (sel.second) addon(rowName(row('second')), PRICES.second);

        const total = sum([plan.price, ...addons.map((x) => x.price)]);
        const unrequestedValue = sum(unrequested.filter((u) => u.price).map((u) => u.price));
        const name = sel.store && plan.type === 'web' ? fill(T.planWithStore, { plan: T.plans[key] }) : T.plans[key];
        const status = {};
        ['mail', 'map', 'agenda', 'dark', 'hours'].forEach((item) => {
            status[item] = (plan.includes || []).includes(item) ? 'included' : ((plan.pending || []).includes(item) ? 'pending' : 'extra');
        });
        return { key, name, plan, covered, addons, pending, unrequested, unrequestedValue, minNote, total, status };
    };

    // Recomienda el plan más barato que cubra la selección, solo si cuesta lo mismo o menos que la configuración.
    // Los ítems "a cotizar" quedan fuera de la comparación (no se sabe su precio) y siguen a cotizar en cualquier opción.
    const recommend = (sel, budget) => {
        if (!budget.lines.length) return null;
        // La decisión se toma siempre en pesos (la moneda de referencia de los precios), así la misma selección
        // da la misma recomendación en ARS y en USD; los dólares están redondeados y podrían cambiar el resultado.
        // A igual precio, primero el que deja menos cosas "a confirmar" (cubre más con certeza; no es una elección arbitraria).
        const options = Object.keys(PLANS).map((key) => planOption(key, sel)).filter(Boolean)
            .sort((a, b) => a.total[0] - b.total[0] || (a.plan.pending || []).length - (b.plan.pending || []).length);
        const best = options[0];
        if (!best || best.total[0] > budget.subtotal[0]) return null;
        const same = options.slice(1).filter((o) => o.total[0] === best.total[0]);
        const tie = best.total[0] === budget.subtotal[0];
        // Mismo precio y nada de más ni a confirmar = es exactamente ese plan: se avisa, no se "recomienda"
        if (tie && !best.unrequested.length && !best.pending.length) return { ...best, match: true };
        const diff = Math.max(0, budget.subtotal[cur] - best.total[cur]);   // se muestra en la moneda elegida
        // Si el plan trae cosas que el cliente no pidió (o cuesta lo mismo), se presenta como alternativa, no como "conviene más"
        const alt = best.unrequested.some((u) => u.price) || Boolean(best.minNote) || tie;
        return { ...best, diff, custom: budget.subtotal, alt, same };
    };

    // ---------------------------------------------------------------------------------------------
    // Recomendación en pantalla
    // ---------------------------------------------------------------------------------------------
    let dismissedFor = '';
    const el = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const planLink = (anchor) => (lang === 'es' ? `/planes/#${anchor}` : `/planes/${lang}#${anchor}`);
    const listBlock = (title, items, cls) => {
        if (!items.length) return null;
        const box = el('div', `cp-reco-list ${cls}`);
        box.append(el('p', '', title));
        const ul = el('ul');
        items.forEach((item) => {
            const li = el('li');
            if (typeof item === 'string') li.textContent = item;
            else li.append(el('span', '', item.label), el('strong', '', money(item.price)));
            ul.appendChild(li);
        });
        box.appendChild(ul);
        return box;
    };

    const renderReco = (rec, sel) => {
        reco.replaceChildren();
        reco.hidden = !rec;
        if (!rec) return;
        const id = `${rec.key}-${rec.total[cur]}`;

        if (rec.match) {
            reco.className = 'cp-reco is-match';
            reco.append(el('p', 'cp-reco-match', rec.addons.length
                ? fill(T.matchAddons, { plan: rec.name, list: joinList(rec.addons.map((a) => a.label)) })
                : fill(T.match, { plan: rec.name })));
            const link = el('a', 'text-link', `${T.view} →`);
            link.href = planLink(rec.plan.anchor);
            reco.append(link);
            return;
        }

        if (dismissedFor === rec.key) {
            reco.className = 'cp-reco is-dismissed';
            const p = el('p', '', `${T.kept} `);
            const again = el('button', 'cp-reco-again', T.show);
            again.type = 'button';
            again.addEventListener('click', () => { dismissedFor = ''; render(); });
            p.appendChild(again);
            reco.append(p);
            return;
        }

        reco.className = 'cp-reco';
        reco.dataset.id = id;
        reco.classList.toggle('is-alt', rec.alt);
        reco.append(el('p', 'eyebrow', rec.alt ? T.recoEyebrowAlt : T.recoEyebrow));
        reco.append(el('h3', '', rec.name));
        const pendingList = joinList(rec.pending.map((x) => x.toLowerCase()));
        const lead = rec.pending.length
            ? (rec.alt ? T.recoLeadAltPending : T.recoLeadPending)
            : (rec.alt ? T.recoLeadAlt : (rec.diff ? T.recoLead : T.recoLeadTie));
        reco.append(el('p', 'cp-reco-lead', fill(lead, { plan: rec.name, list: pendingList })));
        if (rec.minNote) reco.append(el('p', 'cp-reco-min', rec.minNote));

        const compare = el('dl', 'cp-reco-compare');
        const pair = (label, value, cls) => {
            const wrap = el('div', cls);
            wrap.append(el('dt', '', label), el('dd', '', value));
            compare.appendChild(wrap);
        };
        pair(rec.name, money(rec.total), 'is-plan');
        pair(T.recoCustom, money(rec.custom));
        pair(T.recoDiff, rec.diff ? `− ${money(cur ? [0, rec.diff] : [rec.diff, 0])}` : T.recoSame, 'is-diff');
        reco.appendChild(compare);

        const diffText = money(cur ? [0, rec.diff] : [rec.diff, 0]);
        if (rec.diff) {
            const why = rec.pending.length ? T.whyPending : (rec.addons.length ? T.whyCheaperAddons : T.whyCheaper);
            reco.append(el('p', 'cp-reco-why', fill(why, { diff: diffText })));
        }

        [listBlock(rec.pending.length ? T.coversConfirmed : T.covers, rec.covered, 'is-covered'),
            listBlock(T.addons, rec.addons, 'is-addons'),
            listBlock(T.pendingTitle, rec.pending, 'is-pending'),
            listBlock(T.unrequested, rec.unrequested.map((u) => (u.price ? u : u.label)), 'is-unrequested'),
            listBlock(T.outside, sel.quotes, 'is-outside')].forEach((block) => { if (block) reco.appendChild(block); });
        if (rec.unrequestedValue[cur]) {
            reco.append(el('p', 'cp-reco-value', fill(rec.diff ? T.unrequestedValue : T.unrequestedValueTie, { value: money(rec.unrequestedValue), diff: diffText })));
        }
        // Otra combinación con el mismo precio (por ejemplo, Básico + tienda y Emprendedor + landing): se muestran las dos
        if (rec.same.length) {
            const lines = rec.same.map((other) => {
                const diffs = Object.keys(other.status).filter((item) => other.status[item] !== rec.status[item]).map((item) => {
                    const label = T.pendingItems[item] || T.benefits[item];
                    if (other.status[item] === 'pending') return fill(T.diffConfirm, { item: label });
                    if (other.status[item] === 'included') return fill(T.diffIncluded, { item: label });
                    return fill(T.diffExtra, { item: label });
                });
                return diffs.length ? fill(T.sameAltDiff, { plan: other.name, list: joinList(diffs) }) : fill(T.sameAltNone, { plan: other.name });
            });
            const block = listBlock(T.sameAlt, lines, 'is-same');
            if (block) reco.appendChild(block);
        }

        if (sel.urgent) reco.append(el('p', 'cp-reco-note', T.urgentNote));
        if (sel.support) reco.append(el('p', 'cp-reco-note', T.supportNote));

        const actions = el('div', 'cp-reco-actions');
        const view = el('a', 'button button-ghost', `${T.view} →`);
        view.href = planLink(rec.plan.anchor);
        const keep = el('button', 'cp-reco-keep', T.keep);
        keep.type = 'button';
        keep.addEventListener('click', () => { dismissedFor = rec.key; render(); });
        actions.append(view, keep);
        reco.appendChild(actions);
    };

    // ---------------------------------------------------------------------------------------------
    // Resumen
    // ---------------------------------------------------------------------------------------------
    const syncBases = () => {
        const need = needs();
        [['web', need.web], ['tienda', need.store]].forEach(([key, needers]) => {
            const box = baseBoxes[key];
            if (!box) return;
            const card = box.closest('label');
            const lock = card.querySelector('.cp-base-lock');
            const locked = needers.length > 0;
            if (locked && !box.checked) { box.checked = true; box.dataset.auto = '1'; }
            if (!locked && box.dataset.auto) { box.checked = false; delete box.dataset.auto; }
            box.disabled = locked;
            card.classList.toggle('is-locked', locked);
            lock.hidden = !locked;
            lock.textContent = locked ? fill(T.required, { list: joinList(needers) }) : '';
        });
    };

    const render = () => {
        paintPrices();
        // Precio de la tienda en su tarjeta: el del Plan Emprendedor sola, o el de la tienda sumada si también está la web
        const storePrice = root.querySelector('.cp-base-price[data-price="tienda"]');
        if (storePrice) storePrice.textContent = baseBoxes.web.checked ? `${money(PRICES.storeAddOn)} ${T.withWeb}` : money(PRICES.storeAlone);
        syncBases();
        const sel = readSelection();
        const budget = customBudget(sel);
        const monthly = sel.support ? PRICES.support : null;
        let total = budget.subtotal;
        const lines = [...budget.lines];
        if (sel.urgent && lines.length) {
            const extra = budget.subtotal.map((n) => Math.round(n * URGENT));
            lines.push({ label: T.urgent, price: extra });
            total = sum([budget.subtotal, extra]);
        }

        const hasAny = lines.length > 0 || sel.quotes.length > 0;
        list.replaceChildren(...lines.map((line) => {
            const li = el('li', line.auto ? 'is-auto' : '');
            li.append(el('span', '', line.label), el('strong', '', money(line.price)));
            return li;
        }));
        quoteBox.querySelector('ul').replaceChildren(...sel.quotes.map((label) => el('li', '', label)));
        quoteBox.hidden = !sel.quotes.length;
        empty.hidden = hasAny;
        empty.textContent = T.empty;
        totalBox.hidden = !lines.length;
        request.setAttribute('aria-disabled', String(!hasAny));
        bar.hidden = !lines.length;

        const autoTexts = [];
        if (baseBoxes.web?.dataset.auto) autoTexts.push(fill(T.auto, { base: baseName('web'), list: joinList(sel.need.web) }));
        if (baseBoxes.tienda?.dataset.auto) autoTexts.push(fill(T.auto, { base: baseName('tienda'), list: joinList(sel.need.store) }));
        if (sel.missingBase.length) autoTexts.push(fill(T.needsBase, { list: joinList(sel.missingBase) }));
        autoNote.hidden = !autoTexts.length;
        autoNote.textContent = autoTexts.join(' ');

        totalBox.querySelector('.cp-total-label').textContent = sel.quotes.length ? T.totalQuote : T.total;
        totalBox.querySelector('.cp-total').textContent = money(total);
        const monthlyEl = totalBox.querySelector('.cp-total-monthly');
        monthlyEl.hidden = !monthly || !lines.length;
        if (!monthlyEl.hidden) monthlyEl.textContent = `+ ${money(monthly)} ${T.monthly} · ${rowName(row('support'))}`;
        bar.querySelector('.cp-bar-total').textContent = money(total) + (sel.quotes.length ? ' +' : '');

        const rec = recommend(sel, budget);
        if (rec?.key !== dismissedFor) dismissedFor = '';   // si cambia la recomendación, se vuelve a mostrar
        renderReco(rec, sel);
        save(hasAny ? { lines, quotes: sel.quotes, monthly, total, rec } : null);
    };

    // Guarda la selección para el formulario de presupuesto (solo en esta pestaña; si falla, el formulario pide los detalles)
    const save = (data) => {
        try {
            if (!data) { sessionStorage.removeItem(storeKey); return; }
            sessionStorage.setItem(storeKey, JSON.stringify({
                lines: data.lines.map((line) => `${line.label}: ${money(line.price)}`),
                sections: '',
                quotes: data.quotes,
                monthly: data.monthly ? `${rowName(row('support'))}: ${money(data.monthly)} ${T.monthly}` : '',
                total: data.lines.length ? money(data.total) : '',
                currency: cur ? 'USD' : 'ARS',
            }));
        } catch (e) { /* sin almacenamiento: el formulario pide los detalles a mano */ }
    };

    // ---------------------------------------------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------------------------------------------
    root.querySelectorAll('[data-currency]').forEach((button) => {
        button.addEventListener('click', () => {
            cur = button.dataset.currency === 'usd' ? 1 : 0;
            root.querySelectorAll('[data-currency]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
            render();
        });
    });
    if (lang !== 'es') root.querySelector('.cp-currency')?.setAttribute('hidden', '');

    root.querySelectorAll('[data-stepper]').forEach((stepper) => {
        const input = stepper.querySelector('input');
        stepper.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => {
                input.value = Math.max(0, Math.min(Number(input.max), count(input) + Number(button.dataset.step)));
                render();
            });
        });
    });

    // Una base marcada a mano deja de ser "automática"
    Object.values(baseBoxes).forEach((box) => box.addEventListener('change', () => { delete box.dataset.auto; }));

    request.addEventListener('click', (event) => {
        if (request.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
            (baseBoxes.web || baseBoxes.tienda).focus();
        }
    });

    root.querySelector('.cp-reset').addEventListener('click', () => {
        root.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; delete input.dataset.auto; });
        root.querySelectorAll('input[type="number"]').forEach((input) => { input.value = 0; });
        root.querySelectorAll('select').forEach((select) => { select.value = ''; });
        dismissedFor = '';
        render();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => bar.classList.toggle('is-away', entry.isIntersecting)).observe(summary);
    }

    // Parte del resumen que se desliza: marca si hay más contenido abajo (para el desvanecido)
    const scrollArea = summary.querySelector('.cp-summary-scroll');
    const syncScroll = () => {
        if (!scrollArea) return;
        const scrollable = scrollArea.scrollHeight > scrollArea.clientHeight + 2;
        scrollArea.classList.toggle('is-scrollable', scrollable);
        scrollArea.classList.toggle('is-end', scrollable && scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 2);
    };
    scrollArea?.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', syncScroll);

    // Recorrido 1-2-3: cada paso se marca como hecho a medida que el cliente avanza, y el siguiente queda resaltado
    const howto = [...root.querySelectorAll('.cp-howto li')];
    const syncSteps = () => {
        const sel = readSelection();
        const done = {
            1: sel.web || sel.store,
            2: sel.sections > 0 || sel.pages > 0 || sel.quotes.length > 0
                || ['map', 'agenda', 'dark', 'hours', 'second', 'support', 'urgent'].some((key) => sel[key]) || Boolean(sel.products),
        };
        const current = !done[1] ? 1 : (!done[2] ? 2 : 3);
        howto.forEach((li) => {
            const n = Number(li.dataset.howto);
            li.classList.toggle('is-done', Boolean(done[n]));
            li.classList.toggle('is-current', n === current);
            li.classList.toggle('is-pending', !done[n] && n !== current);
            const link = li.querySelector('a');
            if (n === current) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
        });
        root.querySelectorAll('.cp-step[data-howto-step]').forEach((step) => {
            step.classList.toggle('is-done', Boolean(done[step.dataset.howtoStep]));
        });
    };

    const update = () => { render(); syncScroll(); syncSteps(); };
    root.addEventListener('change', update);
    root.addEventListener('input', update);
    // Botones − / +, "Empezar de nuevo" y moneda llaman a render() directo: después se ponen al día la lista y los pasos
    root.addEventListener('click', () => requestAnimationFrame(() => { syncScroll(); syncSteps(); }));
    update();
})();
