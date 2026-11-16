// Plan a medida: el cliente arma su proyecto desde cero (estructura web mínima, secciones, páginas y funciones),
// ve cuánto cuesta cada cosa y, si uno de los planes le conviene más por precio Y por prestaciones, se lo recomiendo.
// Precios, prestaciones de los planes y textos están solo en este archivo: si cambia algo, se cambia acá.
(() => {
    const root = document.querySelector('[data-custom-plan]');
    if (!root) return;

    // ---------------------------------------------------------------------------------------------
    // Precios: [pesos argentinos, dólares]. Cada moneda se suma por separado: nunca se mezclan.
    // ---------------------------------------------------------------------------------------------
    const PRICES = {
        web: [54990, 35],           // PROVISIONAL: estructura web mínima, sujeta a revisión de rentabilidad
        map: [3990, 3],             // PROVISIONAL: ubicación con mapa
        agenda: [3990, 3],          // PROVISIONAL: botón de agenda (integración sencilla)
        section: [11990, 8],
        page: [34990, 23],          // página secundaria de hasta 3 secciones
        dark: [17990, 12],
        hours: [8990, 6],
        storeAlone: [66990, 43],    // tienda sola = Plan Emprendedor
        storeAddOn: [49990, 32],    // tienda sumada a una web (Plan Básico o Premium)
        second: [39990, 26],
        support: [14990, 10],       // por mes, aparte del total
        // Productos: total por tramo (21-30 … 91-100)
        products: [[9990, 6], [19980, 12], [29970, 18], [37960, 23], [45950, 28], [53940, 33], [61930, 38], [69920, 43]],
    };

    // ---------------------------------------------------------------------------------------------
    // Planes cerrados, tal como los describe /planes/ (no se modifican: solo se usan para comparar).
    // type: 'web' = landing o web; 'store' = tienda. Lo que no está acá NO se considera incluido.
    // ---------------------------------------------------------------------------------------------
    const PLANS = {
        emprendedor: {
            type: 'store', price: [66990, 43], anchor: 'emprendedor', langs: ['es', 'pt'],
            // Tienda en una plataforma, 20 productos, pagos y envíos. Productos extra y 2.ª plataforma: adicionales.
        },
        basico: {
            type: 'web', price: [111990, 72], anchor: 'basico', langs: ['es', 'en', 'pt'],
            sections: 5, pages: 0, includes: ['map', 'agenda'],
            // Modo claro / oscuro y abierto / cerrado: adicionales del Básico. Páginas secundarias: se cotizan aparte (precio de lista).
            extraBenefits: [],
        },
        premium: {
            type: 'web', price: [189990, 122], anchor: 'premium', langs: ['es', 'en', 'pt'],
            sections: 10, pages: 4, includes: ['map', 'agenda', 'dark', 'hours'],
            extraBenefits: ['rounds3', 'support30', 'design'],
        },
    };
    const URGENT = 0.3;

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
            needsBase: '{list}: se suma a una web o a una tienda. Elegí una base para incluirlo.',
            plans: { emprendedor: 'Plan Emprendedor', basico: 'Plan Básico', premium: 'Plan Premium' },
            planWithStore: '{plan} + tienda online',
            recoEyebrow: 'Hay una opción que puede convenirte más',
            recoLead: 'Según las características que seleccionaste, el {plan} puede ofrecerte lo que necesitás por un precio más conveniente que tu configuración personalizada.',
            recoLeadTie: 'Según las características que seleccionaste, el {plan} te ofrece lo que necesitás por el mismo precio que tu configuración, y suma más prestaciones.',
            recoPlan: '{plan}', recoCustom: 'Tu configuración', recoDiff: 'Diferencia', recoSame: 'Mismo precio',
            whyCheaper: 'Cubre todo lo que elegiste y cuesta {diff} menos.',
            whyCheaperAddons: 'Con los adicionales que se le suman, cubre todo lo que elegiste y cuesta {diff} menos.',
            whyTie: 'Cuesta lo mismo y además incluye: {list}.',
            covers: 'Incluye lo que elegiste', addons: 'Se le suman como adicionales', outside: 'Siguen a cotizar aparte (con cualquier opción)',
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
            needsBase: '{list}: this is added to a website. Choose the website structure to include it.',
            plans: { basico: 'Basic Plan', premium: 'Premium Plan' },
            planWithStore: '{plan} + online store',
            recoEyebrow: 'There’s an option that may suit you better',
            recoLead: 'Based on what you selected, the {plan} can give you what you need for a better price than your custom setup.',
            recoLeadTie: 'Based on what you selected, the {plan} gives you what you need for the same price as your custom setup, with more included.',
            recoPlan: '{plan}', recoCustom: 'Your custom setup', recoDiff: 'Difference', recoSame: 'Same price',
            whyCheaper: 'It covers everything you chose and costs {diff} less.',
            whyCheaperAddons: 'With the add-ons it needs, it covers everything you chose and costs {diff} less.',
            whyTie: 'It costs the same and also includes: {list}.',
            covers: 'Includes what you chose', addons: 'Added as extras', outside: 'Still to be quoted separately (with either option)',
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
            needsBase: '{list}: é somado a um site ou a uma loja. Escolha uma base para incluir.',
            plans: { emprendedor: 'Plano Empreendedor', basico: 'Plano Básico', premium: 'Plano Premium' },
            planWithStore: '{plan} + loja virtual',
            recoEyebrow: 'Há uma opção que pode ser melhor para você',
            recoLead: 'De acordo com o que você selecionou, o {plan} pode oferecer o que você precisa por um preço melhor que a sua configuração personalizada.',
            recoLeadTie: 'De acordo com o que você selecionou, o {plan} oferece o que você precisa pelo mesmo preço da sua configuração, com mais coisas incluídas.',
            recoPlan: '{plan}', recoCustom: 'Sua configuração', recoDiff: 'Diferença', recoSame: 'Mesmo preço',
            whyCheaper: 'Cobre tudo o que você escolheu e custa {diff} a menos.',
            whyCheaperAddons: 'Com os adicionais necessários, cobre tudo o que você escolheu e custa {diff} a menos.',
            whyTie: 'Custa o mesmo e ainda inclui: {list}.',
            covers: 'Inclui o que você escolheu', addons: 'Somados como adicionais', outside: 'Continuam a orçar à parte (em qualquer opção)',
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
        return lang === 'es' ? `USD ${price[1].toLocaleString('en-US')}` : `$${price[1].toLocaleString('en-US')} USD`;
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

        const covered = [];
        const addons = [];
        const addon = (label, price) => addons.push({ label, price });

        if (plan.type === 'store') {
            covered.push(T.storeIncluded);
        } else {
            covered.push(T.structure);
            if (sel.sections) {
                const inPlan = Math.min(sel.sections, plan.sections);
                if (inPlan) covered.push(fill(inPlan === 1 ? T.nSection : T.nSections, { n: inPlan, max: plan.sections }));
                const extra = sel.sections - inPlan;
                if (extra) addon(fill(extra === 1 ? T.extraSection : T.extraSections, { n: extra }), times(PRICES.section, extra));
            }
            if (sel.pages) {
                const inPlan = Math.min(sel.pages, plan.pages);
                if (inPlan) covered.push(fill(inPlan === 1 ? T.nPage : T.nPages, { n: inPlan, max: plan.pages }));
                const extra = sel.pages - inPlan;
                if (extra) addon(fill(extra === 1 ? T.extraPage : T.extraPages, { n: extra }), times(PRICES.page, extra));
            }
            ['map', 'agenda', 'dark', 'hours'].forEach((item) => {
                if (!sel[item]) return;
                if (plan.includes.includes(item)) covered.push(rowName(row(item)));
                else addon(rowName(row(item)), PRICES[item]);
            });
            if (sel.store) addon(T.store, PRICES.storeAddOn);
        }
        // Lo de la tienda que no viene en ningún plan se suma igual (mismo precio en las dos opciones)
        if (sel.products) addon(sel.products.label, PRICES.products[sel.products.tier]);
        if (sel.second) addon(rowName(row('second')), PRICES.second);

        // Prestaciones del plan que el cliente no pidió (se muestran como "además incluye", nunca se cobran aparte)
        const extras = plan.type === 'web'
            ? [...plan.includes.filter((item) => !sel[item]), ...plan.extraBenefits].map((item) => T.benefits[item])
            : [];
        const total = sum([plan.price, ...addons.map((a) => a.price)]);
        return { key, name: sel.store && plan.type === 'web' ? fill(T.planWithStore, { plan: T.plans[key] }) : T.plans[key], plan, covered, addons, extras, total };
    };

    // Recomienda el plan más barato que cubra la selección, solo si cuesta lo mismo o menos que la configuración.
    // Los ítems "a cotizar" quedan fuera de la comparación (no se sabe su precio) y siguen a cotizar en cualquier opción.
    const recommend = (sel, budget) => {
        if (!budget.lines.length) return null;
        // La decisión se toma siempre en pesos (la moneda de referencia de los precios), así la misma selección
        // da la misma recomendación en ARS y en USD; los dólares están redondeados y podrían cambiar el resultado.
        const options = Object.keys(PLANS).map((key) => planOption(key, sel)).filter(Boolean)
            .sort((a, b) => a.total[0] - b.total[0]);
        const best = options[0];
        if (!best || best.total[0] > budget.subtotal[0]) return null;
        // Mismo precio y nada más incluido = es exactamente ese plan: se avisa, no se "recomienda"
        if (best.total[0] === budget.subtotal[0] && !best.extras.length) return { ...best, match: true };
        const diff = Math.max(0, budget.subtotal[cur] - best.total[cur]);   // se muestra en la moneda elegida
        return { ...best, diff, custom: budget.subtotal };
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
        reco.append(el('p', 'eyebrow', T.recoEyebrow));
        reco.append(el('h3', '', rec.name));
        reco.append(el('p', 'cp-reco-lead', fill(rec.diff ? T.recoLead : T.recoLeadTie, { plan: rec.name })));

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

        const why = rec.diff
            ? fill(rec.addons.length ? T.whyCheaperAddons : T.whyCheaper, { diff: money(cur ? [0, rec.diff] : [rec.diff, 0]) })
            : fill(T.whyTie, { list: joinList(rec.extras) });
        reco.append(el('p', 'cp-reco-why', why));

        [listBlock(T.covers, rec.covered, 'is-covered'),
            listBlock(T.addons, rec.addons, 'is-addons'),
            rec.diff ? listBlock(T.alsoIncludes, rec.extras, 'is-extras') : null,
            listBlock(T.outside, sel.quotes, 'is-outside')].forEach((block) => { if (block) reco.appendChild(block); });

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

    root.addEventListener('change', render);
    root.addEventListener('input', render);
    render();
})();
