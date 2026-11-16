// Vista previa del brief en el panel (/api/admin, módulo #brief). Solo lectura: muestra las preguntas que ve cada plan.
// Las preguntas viven en js/brief.js (window.JNBBriefSchema); acá no se edita ni se guarda nada.
(() => {
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const PLANS = [['emprendedor', 'Emprendedor (tienda)'], ['basico', 'Básico (landing)'], ['premium', 'Premium (web a medida)']];
    const TYPES = { text: 'Texto corto', textarea: 'Texto largo', radio: 'Una opción', checkbox: 'Varias opciones', check: 'Casilla', file: 'Archivos', select: 'Lista', email: 'Mail', tel: 'Teléfono', url: 'Link', date: 'Fecha' };
    let plan = 'premium';

    // Los textos pueden ser funciones según el plan: se calculan con un cliente sin respuestas ni adicionales
    // Para ver las condicionales: "todos los adicionales pedidos" (x) y "respondió que sí a todo" (a)
    const ALL = new Proxy({}, { get: () => true });
    const YES = new Proxy({}, { get: () => 'yes' });
    const ctx = (x = {}, a = {}) => ({ a, lang: 'es', knownPlan: true, plan, x });
    const val = (v) => { try { return typeof v === 'function' ? v(ctx()) : v; } catch (e) { return ''; } };
    const test = (item, c) => { try { return !item.when || Boolean(item.when(c)); } catch (e) { return false; } };
    const shows = (item) => test(item, ctx());
    const withExtras = (item) => test(item, ctx(ALL));
    const withAnswers = (item) => test(item, ctx({}, YES)) || test(item, ctx(ALL, YES));

    const render = () => {
        const root = document.getElementById('m-brief');
        const schema = window.JNBBriefSchema;
        if (!root) return;
        if (!schema) { root.innerHTML = '<h2>Brief</h2><p class="empty">No se pudo cargar el brief.</p>'; return; }
        const sections = schema.SECTIONS.filter((s) => shows(s) || withExtras(s) || withAnswers(s));
        let n = 0;
        root.innerHTML = '<h2>Brief</h2><p class="muted">Vista previa de solo lectura de las preguntas que ve cada cliente según su plan. Para cambiar preguntas hay que editar <code>js/brief.js</code>.</p>'
            + '<nav class="subtabs">' + PLANS.map(([k, label]) => '<button type="button" data-brief-plan="' + k + '" aria-pressed="' + (plan === k) + '">' + label + '</button>').join('') + '</nav>'
            + '<p class="small muted">Las preguntas marcadas "Según respuestas" o "Si pidió adicionales" aparecen solo en esos casos.</p>'
            + sections.map((s) => {
                const qs = s.questions.filter((q) => shows(q) || withExtras(q) || withAnswers(q));
                return '<section class="card"><h3>' + esc(val(s.es)) + '</h3><ol class="brief-preview">' + qs.map((q) => {
                    n += 1;
                    const t = q.es || [];
                    const opts = Array.isArray(t[2]) ? t[2] : [];
                    const cond = !q.when || shows(q) ? '' : withExtras(q) ? 'Si pidió adicionales' : 'Según respuestas';
                    return '<li><p style="margin:0"><strong>' + esc(val(t[0])) + '</strong></p>'
                        + (t[1] ? '<p class="small muted" style="margin:.2rem 0 0">' + esc(val(t[1])) + '</p>' : '')
                        + (opts.length ? '<p class="small" style="margin:.2rem 0 0">Opciones: ' + opts.map(esc).join(' · ') + '</p>' : '')
                        + '<p class="small" style="margin:.2rem 0 .6rem">' + esc(TYPES[q.type] || q.type) + (val(q.req) ? ' · Obligatoria' : ' · Opcional') + (cond ? ' · <em>' + cond + '</em>' : '') + '</p></li>';
                }).join('') + '</ol></section>';
            }).join('')
            + '<p class="small muted">' + n + ' preguntas en total para este plan (contando las condicionales).</p>';
    };

    document.addEventListener('click', (e) => {
        const b = e.target.closest('[data-brief-plan]');
        if (!b) return;
        plan = b.dataset.briefPlan;
        render();
    });

    window.JNBBriefPreview = { show: render };
})();
