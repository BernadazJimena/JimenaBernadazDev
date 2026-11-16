// Dos módulos del panel (/api/admin) que leen los datos ya cargados por el panel (window.JNBPanel):
//   #agenda   Plazos de entrega (en días hábiles, saltando feriados con js/holidays.js) y vencimientos de los clientes
//   #numeros  Ingresos por mes, tope del monotributo, exportar pagos a Excel y de dónde vienen los clientes
(() => {
    const panel = () => window.JNBPanel;
    const D = () => panel().data() || {};
    const H = () => window.JNBHolidays;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = () => (H() ? H().now().date : new Date().toISOString().slice(0, 10));
    const fdate = (v) => (v ? new Date(v.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
    const money = (n) => Number(n || 0).toLocaleString('es-AR');
    const clientOf = (id) => (D().clients || []).find((c) => c.id === id) || null;
    const projectByToken = (t) => (D().projects || []).find((p) => p.token === t) || null;
    const nameOfProject = (p) => { const c = clientOf(p.clientId); return c ? c.name : p.client; };
    const send = async (path, body, msg) => {
        try { await panel().api(path, body); if (msg) panel().toast(msg); await panel().reload(); return true; } catch (e) { panel().toast(String(e.message) === '400' ? 'Revisá los datos' : 'No se pudo guardar'); return false; }
    };
    const tag = (tone, text) => '<span class="ag-tag ag-' + tone + '">' + esc(text) + '</span>';

    // ---- Plazos de entrega: los publicados en la web (días hábiles desde que llega todo el material)
    const ruleOf = (p) => {
        if (p.origin === 'sorteo-instagram') return { days: 7, business: false, label: '7 días corridos (sorteo)' };
        const t = String(p.project || '');
        if (/emprendedor|tienda|loja|store/i.test(t)) return { days: 7, business: true, label: '7 días hábiles' };
        if (/premium|a medida|custom|sob medida/i.test(t)) return { days: 15, business: true, label: '15 días hábiles' };
        if (/b[aá]sico|basic|landing/i.test(t)) return { days: 10, business: true, label: '10 días hábiles' };
        return null;
    };
    const addBusiness = (iso, n) => { let d = iso; while (n > 0) { d = H().addDays(d, 1); if (H().isBusinessDay(d)) n -= 1; } return d; };
    const dayDiff = (a, b) => Math.round((Date.UTC(...b.split('-').map((x, i) => Number(x) - (i === 1 ? 1 : 0))) - Date.UTC(...a.split('-').map((x, i) => Number(x) - (i === 1 ? 1 : 0)))) / 86400000);
    // Días que faltan (hábiles o corridos según el plan); negativo = atrasado
    const remaining = (from, to, business) => {
        if (!business) return dayDiff(from, to);
        if (from === to) return 0;
        const sign = to > from ? 1 : -1;
        let n = 0;
        for (let d = from; d !== to;) { d = H().addDays(d, sign); if (H().isBusinessDay(d)) n += sign; }
        return n;
    };
    const deadlines = () => (D().projects || []).filter((p) => p.stage < 4).map((p) => {
        const rule = ruleOf(p);
        if (!rule || !p.materialsAt || !H()) return { p, rule, due: '', left: null };
        const due = rule.business ? addBusiness(p.materialsAt, rule.days) : H().addDays(p.materialsAt, rule.days);
        return { p, rule, due, left: remaining(today(), due, rule.business) };
    });
    const deliveryTone = (x) => (x.left === null ? 'muted' : x.left < 0 ? 'late' : x.left <= 2 ? 'warn' : 'ok');
    const deliveryText = (x) => (x.left === null ? 'Esperando material' : x.left < 0 ? 'Atrasado ' + (-x.left) + (x.rule.business ? ' hábiles' : ' días') : x.left === 0 ? 'Vence hoy' : 'Faltan ' + x.left + (x.rule.business ? ' hábiles' : ' días'));

    // ---- Vencimientos: los que cargás, cupones sin usar y fin del soporte de 30 días de los ganadores del sorteo
    const KINDS = { dominio: 'Dominio', soporte: 'Soporte mensual', hosting: 'Hosting', otro: 'Otro' };
    const dueItems = () => {
        const d = D();
        const items = (d.renewals || []).filter((r) => !r.doneAt).map((r) => {
            const c = clientOf(r.clientId);
            const p = r.project ? projectByToken(r.project) : null;
            return { date: r.due, kind: KINDS[r.kind] || 'Otro', who: c ? c.name : '—', detail: [r.label, p && p.code, r.amount].filter(Boolean).join(' · '), renewal: r };
        });
        (d.coupons || []).filter((c) => !c.usedBy && c.expires).forEach((c) => items.push({ date: c.expires, kind: 'Cupón por vencer', who: c.client, detail: c.code + ' (' + c.percent + ' %): buen momento para ofrecerle una actualización' }));
        ((d.sorteos || {}).winners || []).filter((w) => w.delivered_at && H()).forEach((w) => items.push({ date: H().addDays(w.delivered_at.slice(0, 10), 30), kind: 'Fin del soporte (sorteo)', who: w.name, detail: '30 días desde la entrega del premio' }));
        return items.sort((a, b) => (a.date < b.date ? -1 : 1));
    };
    const dueTone = (date) => { const n = dayDiff(today(), date); return n < 0 ? 'late' : n <= 30 ? 'warn' : 'ok'; };
    const dueText = (date) => { const n = dayDiff(today(), date); return n < 0 ? 'Venció hace ' + (-n) + ' días' : n === 0 ? 'Vence hoy' : 'En ' + n + ' días'; };
    let showAllDue = false;

    // ---- Revisión del cliente: 4 días hábiles desde que recibe la primera versión (no cuentan en el plazo de desarrollo)
    const REVIEW_DAYS = 4;
    // Rondas incluidas: 3 en Premium y en los premios de sorteo; 2 en Emprendedor, Básico y Plan a medida
    const roundsOf = (p) => (p.origin === 'sorteo-instagram' || (/premium/i.test(p.project) && !/a medida|custom|sob medida/i.test(p.project)) ? 3 : 2);
    const reviewCell = (p) => {
        const max = roundsOf(p);
        const round = p.reviewRound || 0;
        const label = 'Ronda ' + Math.max(round, 1) + ' de ' + max;
        if (!p.reviewSent) return '<button type="button" data-ag-review="' + esc(p.token) + '" data-step="sent">Envié la 1.ª versión hoy</button>';
        if (p.reviewDone) return tag('ok', label + ' · respondió el ' + fdate(p.reviewDone))
            + '<br><button type="button" data-ag-review="' + esc(p.token) + '" data-step="sent">' + (round < max ? 'Envié la versión con ajustes (ronda ' + (round + 1) + ')' : 'Ronda extra (se cotiza aparte)') + '</button>'
            + ' <button type="button" class="link-btn" data-ag-review="' + esc(p.token) + '" data-step="reset">Reiniciar</button>';
        const left = remaining(today(), p.reviewUntil, true);
        return tag(left < 0 ? 'muted' : left <= 1 ? 'warn' : 'ok', label + ' · ' + (left < 0 ? 'cerrada (' + fdate(p.reviewUntil) + ')' : 'revisa hasta ') + fdate(p.reviewUntil) + (left ? ' · faltan ' + left + ' hábiles' : ' · vence hoy'))
            + '<br><button type="button" data-ag-review="' + esc(p.token) + '" data-step="done">Respondió ✓ (seguir)</button>';
    };

    // ---- Presupuestos sin respuesta: propuesta enviada hace 5 días o más (o 5 días desde el último seguimiento)
    const WAIT_DAYS = 5;
    const quoteLink = (q) => 'https://jnbcreativestudio.com.ar/mi-presupuesto/' + (q.lang === 'es' ? '' : q.lang) + '?c=' + q.token;
    const FOLLOW = {
        es: (n, plan, link) => '¡Hola, ' + n + '! ¿Cómo estás? Te escribo por la propuesta que te envié' + (plan ? ' para ' + plan : '') + '. ¿Pudiste verla? Si tenés alguna duda o querés ajustar algo, contame y lo vemos.\n\nAcá la tenés: ' + link + '\n\n¡Saludos! Jimena · JNB Creative Studio',
        en: (n, plan, link) => 'Hi, ' + n + '! I hope you are well. I am following up on the proposal I sent you' + (plan ? ' for ' + plan : '') + '. Did you have a chance to look at it? If you have any questions or want to adjust something, just let me know.\n\nHere it is: ' + link + '\n\nBest regards, Jimena · JNB Creative Studio',
        pt: (n, plan, link) => 'Olá, ' + n + '! Tudo bem? Estou escrevendo sobre a proposta que te enviei' + (plan ? ' para ' + plan : '') + '. Conseguiu ver? Se tiver alguma dúvida ou quiser ajustar algo, me conta e a gente vê.\n\nAqui está: ' + link + '\n\nAbraços! Jimena · JNB Creative Studio',
    };
    const waitingQuotes = () => (D().inquiries || []).filter((q) => q.kind === 'presupuesto' && q.status === 'enviado').map((q) => {
        const base = (q.followupAt || q.sentAt || q.created).slice(0, 10);
        return { q, days: dayDiff(base, today()), followed: Boolean(q.followupAt) };
    }).filter((x) => x.days >= WAIT_DAYS).sort((a, b) => b.days - a.days);
    const quotesCard = () => {
        const list = waitingQuotes();
        if (!list.length) return '';
        return '<section class="card"><h3>💬 Presupuestos sin respuesta (' + list.length + ')</h3><p class="small muted">Propuestas enviadas hace ' + WAIT_DAYS + ' días o más que todavía no aceptaron. Editá el mensaje si querés, copialo y mandalo; después tocá "Ya le escribí" y el aviso vuelve a contar desde hoy.</p>'
            + list.map(({ q, days, followed }) => '<div class="ag-quote"><p style="margin:0"><a href="#presupuestos/' + esc(q.code) + '"><strong>' + esc(q.name) + '</strong></a> · ' + esc(q.plan || 'Presupuesto') + ' · ' + tag(days >= 10 ? 'late' : 'warn', (followed ? 'Último seguimiento hace ' : 'Enviado hace ') + days + ' días') + ' · ' + { es: 'Español', en: 'Inglés', pt: 'Portugués' }[q.lang] + '</p>'
                + '<textarea rows="5" data-ag-msg="' + esc(q.token) + '">' + esc((FOLLOW[q.lang] || FOLLOW.es)(q.name.split(' ')[0], q.plan, quoteLink(q))) + '</textarea>'
                + '<div class="row"><button type="button" data-ag-copy="' + esc(q.token) + '">Copiar mensaje</button><button type="button" data-ag-follow="' + esc(q.token) + '">Ya le escribí ✓</button></div></div>').join('')
            + '</section>';
    };

    const renderAgenda = () => {
        const el = document.getElementById('m-agenda');
        const list = deadlines().sort((a, b) => (a.left === null) - (b.left === null) || (a.left ?? 0) - (b.left ?? 0));
        const due = dueItems();
        const visible = showAllDue ? due : due.filter((x) => dayDiff(today(), x.date) <= 90);
        const clients = D().clients || [];
        el.innerHTML = '<h2>Plazos y vencimientos</h2>'
            + quotesCard()
            + '<section class="card"><h3>Plazos de entrega</h3><p class="small muted">El plazo corre desde que llega todo el material: se completa solo al pasar el proyecto a "Diseño y desarrollo", o lo cargás acá. Cuenta días hábiles y saltea feriados (los premios del sorteo, días corridos).</p>'
            + (list.length ? '<div class="ag-table"><table><thead><tr><th>Proyecto</th><th>Plazo</th><th>Material completo</th><th>Entrega</th><th>Estado</th><th>Revisión del cliente</th></tr></thead><tbody>'
                + list.map((x) => '<tr><td><a href="#proyectos/' + esc(x.p.code) + '">' + esc(x.p.code) + '</a> · ' + esc(nameOfProject(x.p)) + '<br><span class="small muted">' + esc(x.p.project) + '</span></td>'
                    + '<td class="small">' + (x.rule ? esc(x.rule.label) : 'Sin plazo (plan no reconocido)') + '</td>'
                    + '<td><input type="date" data-ag-material="' + esc(x.p.token) + '" value="' + esc(x.p.materialsAt || '') + '" aria-label="Fecha de material completo"></td>'
                    + '<td>' + (x.due ? fdate(x.due) : '—') + '</td><td>' + (x.p.reviewSent ? tag('ok', '1.ª versión enviada') : tag(deliveryTone(x), deliveryText(x))) + '</td><td>' + reviewCell(x.p) + '</td></tr>').join('')
                + '</tbody></table></div>' : '<p class="empty">No hay proyectos en curso.</p>')
            + '</section>'
            + '<section class="card"><div class="row space"><h3 style="margin:0">Vencimientos</h3><label class="check-line"><input type="checkbox" data-ag-all' + (showAllDue ? ' checked' : '') + '> Ver también los de más de 90 días</label></div>'
            + (visible.length ? '<div class="ag-table"><table><thead><tr><th>Fecha</th><th>Qué vence</th><th>Cliente</th><th>Detalle</th><th></th></tr></thead><tbody>'
                + visible.map((x) => '<tr><td>' + fdate(x.date) + '<br>' + tag(dueTone(x.date), dueText(x.date)) + '</td><td>' + esc(x.kind) + '</td><td>' + esc(x.who) + '</td><td class="small">' + esc(x.detail) + '</td>'
                    + '<td class="ag-actions">' + (x.renewal ? '<button type="button" data-ag-done="' + x.renewal.id + '">Hecho ✓</button><button type="button" data-ag-del="' + x.renewal.id + '" title="Borrar">✕</button>' : '') + '</td></tr>').join('')
                + '</tbody></table></div>' : '<p class="empty">No hay vencimientos en los próximos 90 días.</p>')
            + '<details style="margin-top:1rem"><summary>➕ Cargar un vencimiento (dominio, soporte, hosting...)</summary><form id="ag-renewal"><div class="grid">'
            + '<label>Cliente<select name="clientId"><option value="">Sin cliente</option>' + clients.map((c) => '<option value="' + c.id + '">' + esc(c.code + ' · ' + c.name) + '</option>').join('') + '</select></label>'
            + '<label>Proyecto (opcional)<select name="project"><option value="">Sin proyecto</option>' + (D().projects || []).map((p) => '<option value="' + esc(p.token) + '">' + esc(p.code + ' · ' + nameOfProject(p)) + '</option>').join('') + '</select></label>'
            + '<label>Tipo<select name="kind">' + Object.entries(KINDS).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join('') + '</select></label>'
            + '<label>Detalle<input name="label" maxlength="120" placeholder="Ej.: dominio tienda.com.ar"></label>'
            + '<label>Fecha de vencimiento<input name="due" type="date" required></label>'
            + '<label>Monto (opcional)<input name="amount" maxlength="40" placeholder="$ 15.000"></label>'
            + '</div><label>Nota<textarea name="note" rows="2"></textarea></label><button class="primary" style="margin-top:.75rem">Guardar vencimiento</button></form></details>'
            + '</section>';
    };

    // ---- Números
    const SOURCES = { instagram: 'Instagram', sorteo: 'Sorteo de Instagram', upwork: 'Upwork', recomendacion: 'Recomendación', google: 'Google / la web', otro: 'Otro' };
    const monthKey = (iso) => iso.slice(0, 7);
    // Meses que se muestran: desde el mes de inicio que elegís (por defecto diciembre 2026), como mucho los últimos 12
    const DEFAULT_FROM = '2026-12';
    const shiftMonth = (k, n) => { const [y, m] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
    const lastMonths = (from) => {
        const now = today().slice(0, 7);
        const end = now > from ? now : from;
        const start = shiftMonth(end, -11) > from ? shiftMonth(end, -11) : from;
        const out = [];
        for (let k = end; k >= start; k = shiftMonth(k, -1)) out.push(k);
        return out;
    };
    const monthName = (k) => new Date(k + '-15T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const planOf = (text) => { const t = String(text || ''); if (/emprendedor|tienda|loja|store/i.test(t)) return 'Emprendedor'; if (/a medida|custom|sob medida/i.test(t)) return 'Plan a medida'; if (/premium/i.test(t)) return 'Premium'; if (/b[aá]sico|basic|landing/i.test(t)) return 'Básico'; if (/actualiz|update/i.test(t)) return 'Actualización'; return 'Otro'; };
    const pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');

    const renderNumbers = () => {
        const el = document.getElementById('m-numeros');
        const d = D();
        const pays = d.payments || [];
        const mono = d.monotributo || { tope: 0, cotizacion: 0 };
        const from = /^\d{4}-\d{2}$/.test(mono.desde || '') ? mono.desde : DEFAULT_FROM;
        const months = lastMonths(from);
        const byMonth = Object.fromEntries(months.map((k) => [k, { '$': 0, USD: 0 }]));
        pays.filter((y) => y.paid && byMonth[monthKey(y.paid)]).forEach((y) => { byMonth[monthKey(y.paid)][y.currency === 'USD' ? 'USD' : '$'] += y.amount; });
        const total = months.reduce((acc, k) => ({ '$': acc['$'] + byMonth[k]['$'], USD: acc.USD + byMonth[k].USD }), { '$': 0, USD: 0 });
        const pending = pays.filter((y) => !y.paid);
        const pend = { '$': 0, USD: 0 };
        pending.forEach((y) => { pend[y.currency === 'USD' ? 'USD' : '$'] += y.amount; });
        const late = pending.filter((y) => y.due && y.due < today()).length;
        const inPesos = total['$'] + total.USD * (mono.cotizacion || 0);
        const used = mono.tope ? Math.round((inPesos / mono.tope) * 100) : 0;
        // Embudo: pedidos → propuestas enviadas → aceptados (por plan)
        const quotes = (d.inquiries || []).filter((q) => q.kind === 'presupuesto');
        const plans = {};
        quotes.forEach((q) => { const k = planOf(q.plan); plans[k] = plans[k] || { asked: 0, sent: 0, won: 0 }; plans[k].asked += 1; if (['enviado', 'aceptado'].includes(q.status)) plans[k].sent += 1; if (q.status === 'aceptado') plans[k].won += 1; });
        // Origen de los clientes
        const clients = d.clients || [];
        const bySource = {};
        clients.forEach((c) => { const k = c.source || ''; bySource[k] = bySource[k] || { n: 0, withProject: 0 }; bySource[k].n += 1; if (c.projectCount > 0) bySource[k].withProject += 1; });
        el.innerHTML = '<h2>Ingresos y origen de clientes</h2>'
            // Monotributo
            + '<section class="card"><h3>Monotributo: ' + (months.length < 12 ? 'desde ' + monthName(months[months.length - 1]) : 'últimos 12 meses') + '</h3>'
            + '<p>Cobrado: <strong>$ ' + money(total['$']) + '</strong>' + (total.USD ? ' y <strong>USD ' + money(total.USD) + '</strong>' : '') + (total.USD && mono.cotizacion ? ' (≈ $ ' + money(inPesos) + ' en total)' : '') + '</p>'
            + (mono.tope ? '<div class="ag-bar" role="img" aria-label="' + used + ' % del tope"><span style="width:' + Math.min(used, 100) + '%" class="' + (used >= 90 ? 'is-late' : used >= 75 ? 'is-warn' : '') + '"></span></div><p class="small ' + (used >= 75 ? 'ag-late-text' : 'muted') + '">' + used + ' % del tope de tu categoría ($ ' + money(mono.tope) + ')' + (used >= 75 ? ': revisá si te conviene recategorizarte.' : '') + '</p>' : '<p class="small muted">Cargá el tope anual de tu categoría para ver cuánto te falta.</p>')
            + (total.USD && !mono.cotizacion ? '<p class="small muted">Tenés cobros en dólares: cargá una cotización para sumarlos al total.</p>' : '')
            + '<form id="ag-mono" class="grid"><label>Tope anual de tu categoría ($)<input name="tope" inputmode="numeric" value="' + (mono.tope ? money(mono.tope) : '') + '"></label><label>Cotización del dólar ($ por USD)<input name="cotizacion" inputmode="numeric" value="' + (mono.cotizacion ? money(mono.cotizacion) : '') + '"></label><label>Contar desde (mes y año)<input name="desde" type="month" required value="' + esc(from) + '"></label><div><button class="primary" style="margin-top:1.4rem">Guardar</button></div></form>'
            + '<p class="small muted">Se calcula con los pagos que cargás en Pagos (fecha de pago). Los premios de sorteos no tienen pagos, así que no suman.</p></section>'
            // Ingresos por mes
            + '<section class="card"><div class="row space"><h3 style="margin:0">Cobrado por mes</h3><button type="button" id="ag-csv">⬇ Exportar pagos (Excel)</button></div>'
            + '<div class="ag-table"><table><thead><tr><th>Mes</th><th class="n">Pesos</th><th class="n">Dólares</th></tr></thead><tbody>'
            + months.map((k) => '<tr><td>' + monthName(k) + '</td><td class="n">$ ' + money(byMonth[k]['$']) + '</td><td class="n">' + (byMonth[k].USD ? 'USD ' + money(byMonth[k].USD) : '—') + '</td></tr>').join('')
            + '</tbody><tfoot><tr><th>Total</th><th class="n">$ ' + money(total['$']) + '</th><th class="n">USD ' + money(total.USD) + '</th></tr></tfoot></table></div>'
            + '<p>Pendiente de cobro: <strong>$ ' + money(pend['$']) + '</strong>' + (pend.USD ? ' y <strong>USD ' + money(pend.USD) + '</strong>' : '') + (late ? ' · ' + tag('late', late + (late === 1 ? ' pago vencido' : ' pagos vencidos')) : '') + ' · <a href="#pagos">Ver Pagos</a></p></section>'
            // Embudo
            + '<section class="card"><h3>Pedidos de presupuesto por plan</h3>'
            + (quotes.length ? '<div class="ag-table"><table><thead><tr><th>Plan</th><th class="n">Pedidos</th><th class="n">Propuestas enviadas</th><th class="n">Aceptados</th><th class="n">Conversión</th></tr></thead><tbody>'
                + Object.entries(plans).sort((a, b) => b[1].asked - a[1].asked).map(([k, v]) => '<tr><td>' + esc(k) + '</td><td class="n">' + v.asked + '</td><td class="n">' + v.sent + '</td><td class="n">' + v.won + '</td><td class="n">' + pct(v.won, v.asked) + '</td></tr>').join('')
                + '</tbody></table></div>' : '<p class="empty">Todavía no hay pedidos de presupuesto.</p>')
            + '<p class="small muted">Consultas generales: ' + (d.inquiries || []).filter((q) => q.kind === 'consulta').length + '.</p></section>'
            // Origen
            + '<section class="card"><h3>¿Cómo te conocieron?</h3>'
            + (clients.length ? '<div class="ag-table"><table><thead><tr><th>Origen</th><th class="n">Clientes</th><th class="n">Con proyecto</th></tr></thead><tbody>'
                + Object.entries(bySource).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => '<tr><td>' + esc(SOURCES[k] || 'Sin cargar') + '</td><td class="n">' + v.n + '</td><td class="n">' + v.withProject + ' (' + pct(v.withProject, v.n) + ')</td></tr>').join('')
                + '</tbody></table></div>'
                + '<details' + (bySource[''] ? ' open' : '') + '><summary>Cargar el origen de cada cliente' + (bySource[''] ? ' (' + bySource[''].n + ' sin cargar)' : '') + '</summary><ul class="ag-sources">'
                + clients.slice().sort((a, b) => (a.source ? 1 : 0) - (b.source ? 1 : 0)).map((c) => '<li><span>' + esc(c.code + ' · ' + c.name) + '</span><select data-ag-source="' + c.id + '" aria-label="Origen de ' + esc(c.name) + '"><option value="">Sin cargar</option>' + Object.entries(SOURCES).map(([k, v]) => '<option value="' + k + '"' + (c.source === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></li>').join('')
                + '</ul></details>' : '<p class="empty">Todavía no hay clientes.</p>')
            + '<p class="small muted">Los clientes que llegan por el sorteo se marcan solos.</p></section>';
    };

    // Pagos en CSV para Excel (separado por punto y coma, como lo abre Excel en español)
    const exportCsv = () => {
        const d = D();
        const cell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const rows = [['Fecha de pago', 'Vencimiento', 'Cliente', 'Código cliente', 'Proyecto', 'Concepto', 'Moneda', 'Monto', 'Medio de pago', 'Nota']];
        (d.payments || []).forEach((y) => { const c = clientOf(y.clientId); rows.push([y.paid, y.due, c ? c.name : '', c ? c.code : '', y.projectCode, y.concept, y.currency === 'USD' ? 'USD' : 'ARS', y.amount, y.method, y.note]); });
        const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'jnb-pagos-' + today() + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };

    // Avisos del menú: entregas atrasadas o a 2 días o menos, y vencimientos de los próximos 7 días
    const badge = () => {
        const b = document.getElementById('n-agenda');
        if (!b || !D().projects) return;
        const n = waitingQuotes().length + deadlines().filter((x) => x.left !== null && x.left <= 2).length + dueItems().filter((x) => dayDiff(today(), x.date) <= 7).length;
        b.textContent = n || '';
    };

    let current = '';
    const render = () => { if (current === 'agenda') renderAgenda(); else if (current === 'numeros') renderNumbers(); };

    document.addEventListener('change', (e) => {
        const t = e.target;
        if (t.matches('#m-agenda [data-ag-material]')) send('agenda', { action: 'material', project: t.dataset.agMaterial, date: t.value }, t.value ? 'Fecha de material guardada' : 'Fecha quitada');
        else if (t.matches('#m-agenda [data-ag-all]')) { showAllDue = t.checked; render(); }
        else if (t.matches('#m-numeros [data-ag-source]')) send('numeros', { action: 'source', clientId: Number(t.dataset.agSource), source: t.value }, 'Origen guardado');
    });
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'ag-renewal') {
            e.preventDefault();
            send('agenda', { action: 'renewal', renewal: Object.fromEntries(new FormData(e.target).entries()) }, 'Vencimiento guardado');
        } else if (e.target.id === 'ag-mono') {
            e.preventDefault();
            send('numeros', { action: 'monotributo', ...Object.fromEntries(new FormData(e.target).entries()) }, 'Datos del monotributo guardados');
        }
    });
    document.addEventListener('click', (e) => {
        const t = e.target.closest('button');
        if (!t) return;
        if (t.dataset.agReview) {
            const step = t.dataset.step;
            const sent = today();
            send('agenda', { action: 'review', project: t.dataset.agReview, step, sent, until: addBusiness(sent, REVIEW_DAYS) }, step === 'sent' ? 'Ronda de revisión iniciada: 4 días hábiles' : step === 'done' ? 'Listo: podés seguir con los ajustes' : 'Revisión borrada');
            return;
        }
        if (t.id === 'ag-csv') exportCsv();
        else if (t.dataset.agCopy) {
            const area = document.querySelector('[data-ag-msg="' + t.dataset.agCopy + '"]');
            if (area) navigator.clipboard.writeText(area.value).then(() => panel().toast('Mensaje copiado'), () => window.prompt('Copiá el mensaje:', area.value));
        } else if (t.dataset.agFollow) send('agenda', { action: 'quote-followup', token: t.dataset.agFollow }, 'Listo: el aviso vuelve a contar desde hoy');
        else if (t.dataset.agDone) send('agenda', { action: 'renewal-done', id: Number(t.dataset.agDone) }, 'Marcado como hecho');
        else if (t.dataset.agDel && window.confirm('¿Borrar este vencimiento?')) send('agenda', { action: 'renewal-delete', id: Number(t.dataset.agDel) }, 'Vencimiento borrado');
    });

    window.JNBAgenda = {
        show(mod) { current = mod; render(); badge(); },
        refresh() { badge(); const el = document.getElementById('m-' + current); if (el && !el.hidden) render(); },
    };
})();
