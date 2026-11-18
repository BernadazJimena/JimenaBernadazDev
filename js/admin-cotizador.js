// Funcionalidades y cotizador (/api/admin, módulo #cotizador).
// Catálogo: cada funcionalidad tiene horas; el precio sale de horas × valor de la hora y los USD de la cotización (lo calcula el servidor).
// Cotizador: compara estructura web a medida, Plan Básico y Plan Premium con los precios de js/pricing.js y los planes de js/custom-plan.js.
(() => {
    const panel = () => window.JNBPanel;
    const C = () => (panel().data() || {}).cotizador || { rate: 1, hour: 0, categories: [], features: [] };
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ars = (n) => '$ ' + Math.round(n).toLocaleString('es-AR');
    const usdOf = (n) => Math.round(n / C().rate);
    const usd = (n) => 'USD ' + usdOf(n).toLocaleString('es-AR');
    const hrs = (n) => String(Math.round(n * 10) / 10).replace('.', ',') + ' h';
    const EXTRAS = { map: 'Ubicación con mapa', agenda: 'Botón de agenda de turnos', dark: 'Modo claro / oscuro', hours: 'Indicador abierto / cerrado' };
    const BENEFITS = { rounds3: '3 rondas de ajustes', support30: '30 días de soporte', design: 'Diseño más personalizado' };

    const picked = new Set();
    const req = { client: '', base: true, sections: 5, pages: 0, extras: new Set(), showHours: false };
    let editing = 0;

    const send = async (body, msg) => {
        try {
            const res = await panel().api('cotizador', body);
            panel().data().cotizador = res.cotizador;
            panel().toast(msg);
            editing = 0;
            render();
            return true;
        } catch (e) {
            panel().toast(String(e.message) === '409' ? 'Ya existe una funcionalidad con ese nombre' : 'Revisá los datos');
            return false;
        }
    };

    // ---- Comparación: cada opción = precio base + lo que le falta para cubrir el pedido + funcionalidades elegidas
    const compare = () => {
        const A = window.JNBPricing.ARS;
        const P = window.JNBPlans || {};
        const feats = C().features.filter((f) => picked.has(f.id));
        const fTotal = feats.reduce((s, f) => s + f.ars, 0);
        const fHours = feats.reduce((s, f) => s + f.hours, 0);
        const option = (key, name, base, plan) => {
            const lines = [];
            if (base) lines.push([plan ? name : 'Estructura web mínima', base]);
            const incSections = plan ? plan.sections : 0;
            const incPages = plan ? plan.pages : 0;
            const extraSections = Math.max(0, req.sections - incSections);
            const extraPages = Math.max(0, req.pages - incPages);
            if (extraSections) lines.push([extraSections + ' sección(es) extra', extraSections * A.section]);
            if (extraPages) lines.push([extraPages + ' página(s) secundaria(s)', extraPages * A.page]);
            req.extras.forEach((x) => { if (!(plan && plan.includes.includes(x))) lines.push([EXTRAS[x], A[x]]); });
            feats.forEach((f) => lines.push([f.name, f.ars]));
            const total = lines.reduce((s, l) => s + l[1], 0);
            // Lo que traen todas las opciones (planes y estructura mínima): así no parece que alguna no lo incluye.
            // Rondas de ajustes: 2 en la estructura a medida y el Básico, 3 en el Premium (extraBenefits 'rounds3').
            const benefits = plan ? plan.extraBenefits || [] : [];
            // El mail del contacto es la casilla que ya tiene el cliente (ej. @gmail), no un mail con dominio propio (confirmado por Jimena)
            const COMMON = ['Contacto con botón de WhatsApp, redes y mail (tu casilla actual, por ejemplo @gmail; no es un mail con dominio propio)', 'Adaptada a celulares y SEO básico', 'Publicación, hosting sin costo y ayuda con el dominio', benefits.includes('rounds3') ? '3 rondas de ajustes' : '2 rondas de ajustes'];
            const included = plan ? [plan.sections + ' secciones', plan.pages ? plan.pages + ' páginas secundarias' : '', ...plan.includes.map((x) => EXTRAS[x]), ...COMMON, ...benefits.filter((b) => b !== 'rounds3').map((b) => BENEFITS[b])].filter(Boolean)
                // Estructura web mínima (como la describe /plan-a-medida/): portada y contacto, sin secciones de contenido
                : (base ? ['Portada de presentación', ...COMMON] : []);
            return { key, name, lines, total, included, hours: fHours };
        };
        const opts = [
            option('medida', 'Estructura web a medida', req.base ? A.medida : 0, null),
            P.basico && option('basico', 'Plan Básico', A.basico, P.basico),
            P.premium && option('premium', 'Plan Premium', A.premium, P.premium),
        ].filter(Boolean);
        const best = opts.reduce((a, b) => (b.total < a.total ? b : a));
        const premium = opts.find((o) => o.key === 'premium');
        let reco = 'Conviene ' + best.name + ': es la opción más económica para lo que pide el cliente.';
        if (premium && best.key !== 'premium' && premium.total - best.total <= best.total * 0.15) {
            reco += ' El Plan Premium cuesta solo ' + ars(premium.total - best.total) + ' más e incluye 3 rondas de ajustes, 30 días de soporte y diseño más personalizado: vale la pena ofrecerlo.';
        }
        if (!req.base && best.key === 'medida') reco += ' (Sin estructura web: solo las funcionalidades, para sumar a una web existente.)';
        return { opts, best, reco, feats, fTotal, fHours };
    };

    const proposalText = (r) => {
        const L = ['Propuesta' + (req.client ? ' para ' + req.client : '') + ' · JNB Creative Studio', ''];
        if (r.feats.length) { L.push('Funcionalidades solicitadas:'); r.feats.forEach((f) => L.push('• ' + f.name + (req.showHours ? ' (' + hrs(f.hours) + ')' : ''))); L.push(''); }
        r.opts.forEach((o, i) => {
            L.push('Opción ' + (i + 1) + ' · ' + o.name + ': ' + ars(o.total) + ' (' + usd(o.total) + ')' + (o.key === r.best.key ? '  ★ recomendada' : ''));
            if (o.included.length) { L.push('  Incluye:'); o.included.forEach((x) => L.push('  ✓ ' + x)); }
        });
        if (req.showHours) L.push('', 'Tiempo estimado de desarrollo de las funcionalidades: ' + hrs(r.fHours));
        L.push('', r.reco, '', 'Dólares aproximados, calculados con el dólar MEP vendedor. El valor final se confirma con tu presupuesto.');
        return L.join('\n');
    };

    // Propuesta con el diseño de las páginas del cliente (Manrope, lilas de la marca), lista para imprimir o guardar en PDF
    const proposalHtml = (r) => {
        const asked = [...r.feats.map((f) => f.name + (req.showHours ? ' · ' + hrs(f.hours) : '')), req.sections ? req.sections + ' secciones' : '', req.pages ? req.pages + ' páginas secundarias' : '', ...[...req.extras].map((x) => EXTRAS[x])].filter(Boolean);
        const today = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        const card = (o, i) => '<article class="opt' + (o.key === r.best.key ? ' best' : '') + '">' + (o.key === r.best.key ? '<span class="badge">★ Recomendada</span>' : '')
            + '<p class="num">Opción ' + (i + 1) + '</p><h3>' + esc(o.name) + '</h3><p class="price">' + ars(o.total) + '</p><p class="usd">' + usd(o.total) + '</p>'
            + (o.included.length ? '<h4>Incluye</h4><ul>' + o.included.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')
            + '<h4>Detalle</h4><table>' + o.lines.map((l) => '<tr><td>' + esc(l[0]) + '</td><td>' + ars(l[1]) + '</td></tr>').join('') + '</table></article>';
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Propuesta' + (req.client ? ' para ' + esc(req.client) : '') + ' · JNB Creative Studio</title>'
            + '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet"><style>'
            + '*{box-sizing:border-box}html{background:#f3ebf6}body{color:#211632;font:15px/1.55 Manrope,Arial,sans-serif;margin:0 auto;max-width:960px;padding:28px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
            + '.head{align-items:center;background:linear-gradient(135deg,#7543d6,#5d31b8);border-radius:22px;color:#f3ebf6;display:flex;gap:16px;padding:26px 28px}.mark{background:#f3ebf6;border-radius:14px;color:#5d31b8;font-weight:800;padding:10px 12px}'
            + '.head h1{font-size:26px;line-height:1.15;margin:0}.head p{margin:4px 0 0;opacity:.9}.intro{margin:22px 4px}'
            + '.box{background:#ecdff4;border-radius:18px;margin:0 0 18px;padding:18px 20px}.box h2{color:#5d31b8;font-size:13px;letter-spacing:.8px;margin:0 0 10px;text-transform:uppercase}'
            + '.chips{display:flex;flex-wrap:wrap;gap:8px}.chips span{background:#e2d0f0;border-radius:999px;font-size:13px;font-weight:600;padding:5px 12px}'
            + '.opts{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-bottom:18px}.opt{background:#ecdff4;border:2px solid #d9c6e8;border-radius:20px;padding:20px;position:relative;break-inside:avoid}'
            + '.opt.best{border-color:#7543d6;box-shadow:0 8px 24px rgba(117,67,214,.18)}.badge{background:#7543d6;border-radius:999px;color:#f3ebf6;font-size:12px;font-weight:800;padding:4px 11px;position:absolute;right:14px;top:-12px}'
            + '.num{color:#625970;font-size:12px;font-weight:700;letter-spacing:.6px;margin:0;text-transform:uppercase}.opt h3{font-size:19px;margin:2px 0 8px}.price{color:#5d31b8;font-size:30px;font-weight:800;line-height:1;margin:0}.usd{color:#1f7a4d;font-weight:800;margin:4px 0 12px}'
            + '.opt h4{color:#5d31b8;font-size:12px;letter-spacing:.6px;margin:12px 0 6px;text-transform:uppercase}.opt ul{list-style:none;margin:0;padding:0}.opt li{margin:4px 0;padding-left:22px;position:relative}.opt li::before{color:#1f7a4d;content:"✓";font-weight:800;left:0;position:absolute}.opt table{border-collapse:collapse;font-size:13px;width:100%}.opt td{border-bottom:1px solid #d9c6e8;padding:4px 0}.opt td+td{text-align:right;white-space:nowrap}'
            + '.reco{background:#e2d0f0;border-left:5px solid #7543d6;border-radius:14px;font-weight:600;margin-bottom:18px;padding:16px 18px}.foot{color:#625970;font-size:13px;text-align:center}.foot strong{color:#5d31b8}'
            + '@page{margin:12mm}@media print{body{padding:0}}</style></head><body>'
            + '<header class="head"><span class="mark">JNB</span><div><h1>Propuesta' + (req.client ? ' para ' + esc(req.client) : '') + '</h1><p>JNB Creative Studio · ' + today + '</p></div></header>'
            + '<p class="intro">¡Gracias por tu consulta! ✨ Te preparé ' + r.opts.length + ' alternativas para lo que necesitás, así podés comparar precio y lo que incluye cada una.</p>'
            + (asked.length ? '<section class="box"><h2>Lo que pediste</h2><div class="chips">' + asked.map((x) => '<span>' + esc(x) + '</span>').join('') + '</div></section>' : '')
            + '<div class="opts">' + r.opts.map(card).join('') + '</div>'
            + '<div class="reco">💡 ' + esc(r.reco) + '</div>'
            + (req.showHours ? '<section class="box"><h2>Tiempo estimado</h2><p style="margin:0">' + hrs(r.fHours) + ' de desarrollo de las funcionalidades.</p></section>' : '')
            + '<p class="foot">Importe de pago único. Dólares aproximados, calculados con el dólar MEP vendedor; el valor final se confirma con tu presupuesto.<br><strong>jnbcreativestudio.com.ar</strong> · Instagram @jnbcreativestudio</p>'
            + '</body></html>';
    };

    // ---- Llevar una opción al presupuesto del cliente (Presupuestos): se completan precio y "Qué incluye" del formulario de siempre,
    // y Jimena revisa y guarda. Desde ahí sigue el circuito de siempre: enviado → acepta → proyecto, brief y pagos.
    // Traducción de lo que el cotizador escribe solo (nombres de opciones y lo que incluyen) para clientes en inglés o portugués.
    // Las funcionalidades del catálogo están en español: el panel avisa que hay que traducirlas.
    const TR = {
        en: { 'Estructura web a medida': 'Custom website structure', 'Plan Básico': 'Basic Plan', 'Plan Premium': 'Premium Plan', 'Portada de presentación': 'Hero section',
            'Contacto con botón de WhatsApp, redes y mail (tu casilla actual, por ejemplo @gmail; no es un mail con dominio propio)': 'Contact with WhatsApp, social media and email buttons (your current address, e.g. @gmail; not an email with your own domain)',
            'Adaptada a celulares y SEO básico': 'Mobile-friendly with basic SEO', 'Publicación, hosting sin costo y ayuda con el dominio': 'Publishing, free hosting and help with your domain',
            '2 rondas de ajustes': '2 rounds of adjustments', '3 rondas de ajustes': '3 rounds of adjustments', '30 días de soporte': '30 days of support', 'Diseño más personalizado': 'More personalized design',
            'Ubicación con mapa': 'Location with map', 'Botón de agenda de turnos': 'Booking button', 'Modo claro / oscuro': 'Light / dark mode', 'Indicador abierto / cerrado': 'Open / closed indicator',
            'secciones': 'sections', 'páginas secundarias': 'secondary pages', 'sección(es) extra': 'extra section(s)', 'página(s) secundaria(s)': 'secondary page(s)' },
        pt: { 'Estructura web a medida': 'Estrutura web sob medida', 'Plan Básico': 'Plano Básico', 'Plan Premium': 'Plano Premium', 'Portada de presentación': 'Capa de apresentação',
            'Contacto con botón de WhatsApp, redes y mail (tu casilla actual, por ejemplo @gmail; no es un mail con dominio propio)': 'Contato com botão de WhatsApp, redes e e-mail (o seu endereço atual, por exemplo @gmail; não é um e-mail com domínio próprio)',
            'Adaptada a celulares y SEO básico': 'Adaptada para celular, com SEO básico', 'Publicación, hosting sin costo y ayuda con el dominio': 'Publicação, hospedagem sem custo e ajuda com o domínio',
            '2 rondas de ajustes': '2 rodadas de ajustes', '3 rondas de ajustes': '3 rodadas de ajustes', '30 días de soporte': '30 dias de suporte', 'Diseño más personalizado': 'Design mais personalizado',
            'Ubicación con mapa': 'Localização com mapa', 'Botón de agenda de turnos': 'Botão de agendamento', 'Modo claro / oscuro': 'Modo claro / escuro', 'Indicador abierto / cerrado': 'Indicador aberto / fechado',
            'secciones': 'seções', 'páginas secundarias': 'páginas secundárias', 'sección(es) extra': 'seção(ões) extra(s)', 'página(s) secundaria(s)': 'página(s) secundária(s)' },
    };
    const tr = (lang, s) => { const d = TR[lang]; if (!d) return s; if (d[s]) return d[s]; const m = s.match(/^(\d+) (.+)$/); return m && d[m[2]] ? m[1] + ' ' + d[m[2]] : s; };

    // Nombre y descripción de una funcionalidad en el idioma del cliente (si falta la traducción, queda en español)
    const featureText = (f, lang) => (lang === 'en' && f.nameEn ? [f.nameEn, f.descEn || f.description] : lang === 'pt' && f.namePt ? [f.namePt, f.descPt || f.description] : [f.name, f.description]);
    const openQuotes = () => ((panel().data() || {}).inquiries || []).filter((q) => q.kind === 'presupuesto' && ['recibido', 'preparando'].includes(q.status));
    const loadIntoQuote = (code, key, all) => {
        const r = compare();
        const o = r.opts.find((x) => x.key === key) || r.best;
        const byName = Object.fromEntries(r.feats.map((f) => [f.name, f]));
        // la primera línea es el plan o la estructura (ya está en el precio)
        // Moneda como en el resto del panel: pesos si el cliente es de Argentina (o escribió en español sin país); si no, dólares
        const q = openQuotes().find((x) => x.code === code) || {};
        const includesOf = (x) => [...x.included.map((s) => tr(q.lang, s)), ...x.lines.slice(x.key === 'medida' && !req.base ? 0 : 1).map((l) => { const f = byName[l[0]]; if (!f) return tr(q.lang, l[0]); const [n, d] = featureText(f, q.lang); return d ? n + ' — ' + d : n; })];
        const includes = includesOf(o);
        // En inglés y portugués, solo dólares; en español, pesos con la referencia en dólares
        const inUsd = q.lang && q.lang !== 'es';
        panel().go('presupuestos', code);
        setTimeout(() => {
            const form = document.querySelector('#m-presupuestos .quote-form');
            if (!form) { panel().toast('No encontré el formulario del presupuesto'); return; }
            form.closest('details').open = true;
            form.currency.value = inUsd ? 'USD' : '$';
            form.amount.value = (inUsd ? usdOf(o.total) : Math.round(o.total)).toLocaleString('es-AR');
            form.includes.value = includes.join('\n');
            // Con "Enviar las opciones", el cliente compara y elige en su link; la opción elegida acá es la que ve primero
            const priceOf = (x) => (inUsd ? 'USD ' + usdOf(x.total).toLocaleString('es-AR') : '$ ' + Math.round(x.total).toLocaleString('es-AR'));
            const usdRef = (x) => (inUsd ? '' : 'USD ' + usdOf(x.total).toLocaleString('es-AR'));
            form.priceUsd.value = usdRef(o);
            form.options.value = all ? JSON.stringify(r.opts.map((x) => ({ name: tr(q.lang, x.name), price: priceOf(x), priceUsd: usdRef(x), includes: includesOf(x).join('\n'), recommended: x.key === r.best.key }))) : '[]';
            form.chosen.value = '';
            if (form.status.value === 'recibido') form.status.value = 'preparando';
            form.scrollIntoView({ block: 'start' });
            const missing = q.lang && q.lang !== 'es' ? r.feats.filter((f) => !(q.lang === 'en' ? f.nameEn : f.namePt)).map((f) => f.name) : [];
            panel().toast(missing.length ? 'Listo. Faltan traducir: ' + missing.join(', ') + ' (cargalas en el catálogo)' : 'Listo: revisá la propuesta y tocá Guardar');
        }, 80);
    };

    // Mismo ancho de columnas en todas las categorías, así horas, pesos y USD quedan alineados
    const COLS = '<colgroup><col class="c-pick"><col><col class="c-h"><col class="c-ars"><col class="c-usd"><col class="c-act"></colgroup>';

    const render = () => {
        const el = document.getElementById('m-cotizador');
        if (!el || el.hidden) return;
        const { features, categories, rate, hour } = C();
        const groups = categories.map((cat) => [cat, features.filter((f) => f.category === cat)]).filter(([, l]) => l.length);
        const all = features.reduce((s, f) => s + f.ars, 0);
        const r = compare();
        const ed = features.find((f) => f.id === editing) || {};
        el.innerHTML = '<h2>Funcionalidades y cotizador</h2>'
            + '<form class="card qz-rates" id="qz-rates"><label>Valor de la hora ($)<input name="hour" inputmode="numeric" value="' + hour.toLocaleString('es-AR') + '"></label>'
            + '<label>Dólar ($ por USD)<input name="rate" inputmode="decimal" value="' + String(rate).replace('.', ',') + '"></label><button class="primary">Guardar y recalcular</button>'
            + '<p class="small muted">Precio de cada funcionalidad = horas × valor de la hora (redondeado a $x.990). Al cambiar estos valores se recalcula todo el catálogo.</p></form>'
            // Catálogo
            + '<section class="card"><h3>Catálogo</h3><p class="small muted">Tildá las que pide el cliente para cotizarlas abajo.</p>'
            + groups.map(([cat, list]) => '<div class="qz-table"><table>' + COLS + '<thead><tr><th colspan="2">' + esc(cat) + '</th><th class="n">Horas</th><th class="n">Pesos</th><th class="n">USD</th><th></th></tr></thead><tbody>'
                + list.map((f) => '<tr><td><input type="checkbox" data-qz-pick="' + f.id + '"' + (picked.has(f.id) ? ' checked' : '') + ' aria-label="Cotizar ' + esc(f.name) + '"></td><td><strong>' + esc(f.name) + '</strong><br><span class="small muted">' + esc(f.description) + '</span></td>'
                    + '<td class="n">' + hrs(f.hours) + '</td><td class="n">' + ars(f.ars) + '</td><td class="n">USD ' + f.usd + '</td><td class="qz-act"><button type="button" data-qz-edit="' + f.id + '">Editar</button><button type="button" data-qz-del="' + f.id + '" title="Borrar">✕</button></td></tr>').join('')
                + '</tbody><tfoot><tr><th colspan="2">Subtotal</th><th class="n">' + hrs(list.reduce((s, f) => s + f.hours, 0)) + '</th><th class="n">' + ars(list.reduce((s, f) => s + f.ars, 0)) + '</th><th class="n">' + usd(list.reduce((s, f) => s + f.ars, 0)) + '</th><th></th></tr></tfoot></table></div>').join('')
            + '<p><strong>Total del catálogo:</strong> ' + ars(all) + ' · ' + usd(all) + ' · ' + hrs(features.reduce((s, f) => s + f.hours, 0)) + '</p>'
            + '<details' + (editing ? ' open' : '') + '><summary>' + (editing ? '✏️ Editar "' + esc(ed.name) + '"' : '➕ Nueva funcionalidad') + '</summary><form id="qz-form" class="grid"><input type="hidden" name="id" value="' + (ed.id || '') + '">'
            + '<label>Nombre<input name="name" required maxlength="120" value="' + esc(ed.name) + '"></label>'
            + '<label>Categoría<select name="category">' + categories.map((c) => '<option' + (ed.category === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></label>'
            + '<label>Horas estimadas<input name="hours" required inputmode="decimal" value="' + (ed.hours ? String(ed.hours).replace('.', ',') : '') + '"></label>'
            + '<label>Precio calculado<output data-qz-preview>' + (ed.hours ? ars(ed.ars) + ' · USD ' + ed.usd : '—') + '</output></label>'
            + '<label class="qz-wide">Descripción<textarea name="description" rows="2">' + esc(ed.description) + '</textarea></label>'
            + '<details class="qz-wide"' + (ed.id && !(ed.nameEn && ed.namePt) ? ' open' : '') + '><summary class="small">🌐 Traducciones (para clientes en inglés y portugués)</summary><div class="grid">'
            + '<label>Nombre en inglés<input name="nameEn" maxlength="120" value="' + esc(ed.nameEn) + '"></label><label>Descripción en inglés<input name="descEn" maxlength="600" value="' + esc(ed.descEn) + '"></label>'
            + '<label>Nombre en portugués<input name="namePt" maxlength="120" value="' + esc(ed.namePt) + '"></label><label>Descripción en portugués<input name="descPt" maxlength="600" value="' + esc(ed.descPt) + '"></label></div></details>'
            + '<div class="row"><button class="primary">Guardar</button>' + (editing ? '<button type="button" data-qz-cancel>Cancelar</button>' : '') + '</div></form></details></section>'
            // Cotizador
            + '<section class="card"><h3>Cotizador comparativo</h3><form id="qz-req" class="grid">'
            + '<label>Cliente (opcional)<input name="client" value="' + esc(req.client) + '"></label>'
            + '<label>Secciones que necesita<input name="sections" type="number" min="0" max="30" value="' + req.sections + '"></label>'
            + '<label>Páginas secundarias<input name="pages" type="number" min="0" max="20" value="' + req.pages + '"></label>'
            + '<fieldset class="qz-wide"><legend class="small">También pide</legend>' + Object.entries(EXTRAS).map(([k, v]) => '<label class="check-line"><input type="checkbox" name="extra" value="' + k + '"' + (req.extras.has(k) ? ' checked' : '') + '> ' + v + '</label>').join('')
            + '<label class="check-line"><input type="checkbox" name="base"' + (req.base ? ' checked' : '') + '> Incluir la estructura web mínima en la opción a medida</label></fieldset></form>'
            + '<p class="small muted">Funcionalidades elegidas: ' + (r.feats.length ? r.feats.length + ' · ' + ars(r.fTotal) + ' · ' + hrs(r.fHours) : 'ninguna (tildalas en el catálogo)') + '</p>'
            + '<div class="qz-opts">' + r.opts.map((o) => '<article class="qz-opt' + (o.key === r.best.key ? ' is-best' : '') + '"><h4>' + esc(o.name) + (o.key === r.best.key ? ' <span class="chip ok">Recomendada</span>' : '') + '</h4>'
                + '<p class="qz-price">' + ars(o.total) + '<span>' + usd(o.total) + '</span></p><p class="small muted">' + hrs(o.hours) + ' de funcionalidades</p>'
                + '<ul class="small">' + o.lines.map((l) => '<li><span>' + esc(l[0]) + '</span><span>' + ars(l[1]) + '</span></li>').join('') + '</ul>'
                + (o.included.length ? '<p class="small" style="margin-bottom:.2rem"><strong>Incluye</strong></p><ul class="small qz-inc">' + o.included.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') + '</article>').join('') + '</div>'
            + '<div class="alert">💡 ' + esc(r.reco) + '</div>'
            + (openQuotes().length ? '<form id="qz-load" class="qz-load"><label>Cargar en el presupuesto de<select name="code">' + openQuotes().map((q) => '<option value="' + esc(q.code) + '">' + esc(q.name + ' · ' + q.code + (q.plan ? ' · ' + q.plan : '')) + '</option>').join('') + '</select></label>'
              + '<label>Opción<select name="opt">' + r.opts.map((o) => '<option value="' + o.key + '"' + (o.key === r.best.key ? ' selected' : '') + '>' + esc(o.name) + ' · ' + ars(o.total) + '</option>').join('') + '</select></label><label class="check-line"><input type="checkbox" name="all" checked> Enviar las ' + r.opts.length + ' opciones para que el cliente compare y elija</label><button class="primary">Cargar en el presupuesto →</button>'
              + '<p class="small muted">Completa el precio y "Qué incluye" de ese presupuesto. Lo revisás, lo guardás y sigue el circuito de siempre: enviado, acepta, proyecto, brief y pagos.</p></form>' : '<p class="small muted">Cuando tengas un pedido de presupuesto sin propuesta, vas a poder cargar esta opción ahí directamente.</p>')
            + '<h4>Propuesta para el cliente</h4><label class="check-line"><input type="checkbox" data-qz-hours' + (req.showHours ? ' checked' : '') + '> Mostrar las horas de desarrollo en la propuesta</label>'
            + '<textarea id="qz-text" rows="12">' + esc(proposalText(r)) + '</textarea>'
            + '<div class="row"><button type="button" data-qz-copy>Copiar propuesta</button><button type="button" class="primary" data-qz-print>Ver propuesta con diseño (PDF)</button></div></section>';
    };

    const readReq = (form) => {
        const d = new FormData(form);
        req.client = String(d.get('client') || '').slice(0, 100);
        req.sections = Math.min(30, Math.max(0, parseInt(d.get('sections'), 10) || 0));
        req.pages = Math.min(20, Math.max(0, parseInt(d.get('pages'), 10) || 0));
        req.extras = new Set(d.getAll('extra'));
        req.base = d.get('base') === 'on';
    };

    document.addEventListener('change', (e) => {
        const t = e.target;
        if (!t.closest('#m-cotizador')) return;
        if (t.dataset.qzPick) { if (t.checked) picked.add(Number(t.dataset.qzPick)); else picked.delete(Number(t.dataset.qzPick)); render(); }
        else if (t.closest('#qz-req')) { readReq(t.closest('#qz-req')); render(); }
        else if ('qzHours' in t.dataset) { req.showHours = t.checked; render(); }
    });
    document.addEventListener('input', (e) => {
        if (e.target.matches('#qz-form [name="hours"]')) {
            const h = Number(e.target.value.replace(',', '.'));
            const out = document.querySelector('[data-qz-preview]');
            const a = h > 0 ? Math.ceil((h * C().hour) / 1000) * 1000 - 10 : 0;
            if (out) out.textContent = a ? ars(a) + ' · ' + usd(a) : '—';
        }
    });
    document.addEventListener('submit', (e) => {
        // getAttribute: el formulario tiene un campo llamado "id" y e.target.id devolvería ese campo, no el id del formulario
        const id = e.target.getAttribute('id');
        if (!['qz-form', 'qz-rates', 'qz-req', 'qz-load'].includes(id)) return;
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        if (id === 'qz-form') send({ action: 'save', feature: d }, 'Funcionalidad guardada');
        else if (id === 'qz-load') loadIntoQuote(d.code, d.opt, d.all === 'on');
        else if (id === 'qz-rates') send({ action: 'rate', rate: d.rate, hour: d.hour }, 'Precios recalculados');
        else { readReq(e.target); render(); }
    });
    document.addEventListener('click', (e) => {
        // Celulares: tocar una funcionalidad del catálogo muestra u oculta su descripción y sus botones
        const row = e.target.closest('#m-cotizador .qz-table tbody tr');
        if (row && !e.target.closest('button, input, a')) row.classList.toggle('is-open');
        const b = e.target.closest('#m-cotizador button');
        if (!b) return;
        const d = b.dataset;
        if (d.qzEdit) { editing = Number(d.qzEdit); render(); document.getElementById('qz-form').scrollIntoView({ block: 'center' }); }
        else if ('qzCancel' in d) { editing = 0; render(); }
        else if (d.qzDel && window.confirm('¿Borrar esta funcionalidad del catálogo?')) { picked.delete(Number(d.qzDel)); send({ action: 'delete', id: Number(d.qzDel) }, 'Funcionalidad borrada'); }
        else if ('qzCopy' in d) { const t = document.getElementById('qz-text').value; navigator.clipboard.writeText(t).then(() => panel().toast('Propuesta copiada'), () => window.prompt('Copiá la propuesta:', t)); }
        else if ('qzPrint' in d) {
            const w = window.open('', '_blank');
            if (!w) { panel().toast('Permití las ventanas emergentes para imprimir'); return; }
            w.document.write(proposalHtml(compare()));
            w.document.close();
            w.focus();
            // Espera a que cargue la tipografía antes de abrir la impresión (ahí se elige "Guardar como PDF")
            setTimeout(() => w.print(), 700);
        }
    });

    window.JNBQuoter = { show: render };
})();
