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
            const included = plan ? [plan.sections + ' secciones', plan.pages ? plan.pages + ' páginas secundarias' : '', ...plan.includes.map((x) => EXTRAS[x]), ...(plan.extraBenefits || []).map((b) => BENEFITS[b])].filter(Boolean) : [];
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
            reco += ' El Plan Premium cuesta solo ' + ars(premium.total - best.total) + ' más e incluye ' + premium.included.slice(-3).join(', ') + ': vale la pena ofrecerlo.';
        }
        if (!req.base && best.key === 'medida') reco += ' (Sin estructura web: solo las funcionalidades, para sumar a una web existente.)';
        return { opts, best, reco, feats, fTotal, fHours };
    };

    const proposalText = (r) => {
        const L = ['Propuesta' + (req.client ? ' para ' + req.client : '') + ' · JNB Creative Studio', ''];
        if (r.feats.length) { L.push('Funcionalidades solicitadas:'); r.feats.forEach((f) => L.push('• ' + f.name + (req.showHours ? ' (' + hrs(f.hours) + ')' : ''))); L.push(''); }
        r.opts.forEach((o, i) => {
            L.push('Opción ' + (i + 1) + ' · ' + o.name + ': ' + ars(o.total) + ' (' + usd(o.total) + ')' + (o.key === r.best.key ? '  ★ recomendada' : ''));
            if (o.included.length) L.push('  Incluye: ' + o.included.join(', '));
        });
        if (req.showHours) L.push('', 'Tiempo estimado de desarrollo de las funcionalidades: ' + hrs(r.fHours));
        L.push('', r.reco, '', 'Dólares aproximados, calculados con el dólar MEP vendedor. El valor final se confirma con tu presupuesto.');
        return L.join('\n');
    };

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
            + groups.map(([cat, list]) => '<div class="qz-table"><table><thead><tr><th colspan="2">' + esc(cat) + '</th><th class="n">Horas</th><th class="n">Pesos</th><th class="n">USD</th><th></th></tr></thead><tbody>'
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
                + (o.included.length ? '<p class="small"><strong>Incluye:</strong> ' + esc(o.included.join(', ')) + '</p>' : '') + '</article>').join('') + '</div>'
            + '<div class="alert">💡 ' + esc(r.reco) + '</div>'
            + '<h4>Propuesta para el cliente</h4><label class="check-line"><input type="checkbox" data-qz-hours' + (req.showHours ? ' checked' : '') + '> Mostrar las horas de desarrollo en la propuesta</label>'
            + '<textarea id="qz-text" rows="12">' + esc(proposalText(r)) + '</textarea>'
            + '<div class="row"><button type="button" data-qz-copy>Copiar propuesta</button><button type="button" data-qz-print>Imprimir / guardar PDF</button></div></section>';
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
        const id = e.target.id;
        if (!['qz-form', 'qz-rates', 'qz-req'].includes(id)) return;
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target).entries());
        if (id === 'qz-form') send({ action: 'save', feature: d }, 'Funcionalidad guardada');
        else if (id === 'qz-rates') send({ action: 'rate', rate: d.rate, hour: d.hour }, 'Precios recalculados');
        else { readReq(e.target); render(); }
    });
    document.addEventListener('click', (e) => {
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
            w.document.write('<!doctype html><meta charset="utf-8"><title>Propuesta · JNB Creative Studio</title><style>body{background:#f3ebf6;color:#211632;font:15px/1.6 Arial,sans-serif;padding:32px;white-space:pre-wrap}h1{color:#7543d6;font-size:20px}@page{margin:16mm}</style><h1>JNB Creative Studio</h1>' + esc(document.getElementById('qz-text').value));
            w.document.close(); w.focus(); w.print();
        }
    });

    window.JNBQuoter = { show: render };
})();
