// Sorteos de Instagram en el panel (/api/admin, módulo #sorteos; la ficha de un ganador es #sorteos/G12).
// Todo se carga a mano: no hay conexión con Instagram ni envíos automáticos. Los mensajes se editan y se copian.
// El panel le pasa a este archivo api(), toast(), sus datos y go() por window.JNBPanel; acá no hay claves.
(() => {
    const panel = () => window.JNBPanel;
    const root = () => document.getElementById('m-sorteos');
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
    const fdate = (v) => (v ? new Date(v.length === 10 ? v + 'T12:00:00' : v).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
    const STATUS = { borrador: 'Borrador', activo: 'Activo', finalizado: 'Finalizado' };
    const PLANS = { '': 'Sin proyecto web', premium: 'Plan Premium', basico: 'Plan Básico', emprendedor: 'Tienda (Emprendedor)' };
    const MARKS = [['contacted_at', 'Contactado'], ['brief_sent_at', 'Brief enviado'], ['brief_done_at', 'Brief completado'], ['materials_at', 'Materiales recibidos'], ['delivered_at', 'Premio entregado']];
    // Color de la etiqueta según el tramo del seguimiento
    const stageTone = (s) => (s <= 1 ? 'warn' : s <= 6 ? 'info' : s <= 9 ? 'dev' : 'ok');

    let tab = 'ganadores';
    let openId = 0;
    let editGiveaway = 0;
    const filters = { q: '', giveaway: '', stage: '', showArchived: false };

    const data = () => (panel().data() || {}).sorteos || { giveaways: [], winners: [], events: [], stages: [] };
    const setData = (res) => { const d = panel().data(); if (d && res && res.giveaways) d.sorteos = { stages: res.stages, giveaways: res.giveaways, winners: res.winners, events: res.events }; };
    const send = async (path, body, okMsg) => {
        try {
            const res = await panel().api(path, body);
            setData(res);
            if (okMsg) panel().toast(okMsg);
            render();
            badge();
            return res;
        } catch (e) {
            const m = String(e.message);
            panel().toast(m === '409' ? 'Ese usuario ya es ganador de este sorteo' : m === '400' ? 'Revisá los datos: hay algo que no es válido' : 'No se pudo guardar');
            return null;
        }
    };
    const copy = async (txt, msg) => {
        try { await navigator.clipboard.writeText(txt); panel().toast(msg || 'Copiado'); } catch (e) { window.prompt('Copiá el texto:', txt); }
    };

    const alertOf = (w) => {
        if (!w.follow_up || w.stage >= 11) return '';
        if (w.follow_up < today()) return 'vencida';
        if (w.follow_up === today()) return 'hoy';
        return '';
    };
    const stageTag = (w) => '<span class="sg-tag sg-' + stageTone(w.stage) + '">' + esc(data().stages[w.stage] || '') + '</span>';

    // ---- Mensajes sugeridos (se editan antes de copiar y lo editado queda guardado)
    const congratsText = (w) => '¡Hola, ' + (w.name || '').split(' ')[0] + '! 🎉 ¡Ganaste el sorteo "' + w.giveaway_name + '" de JNB Creative Studio! Tu premio: ' + (w.prize || '') + '.\n\nPara empezar, ¿me pasás un mail y un WhatsApp de contacto? Te cuento los próximos pasos por acá. ¡Felicitaciones! 💜';
    const briefText = (w) => '¡Hola, ' + (w.name || '').split(' ')[0] + '! Ya está listo tu brief: son unas preguntas para conocer tu proyecto y armar tu web.\n\nCompletalo acá: ' + (w.brief_link || '[link del brief]') + '\n\nTenés 10 días corridos para enviarlo junto con tu material (logo, fotos y textos). Cualquier duda, escribime por acá. 💜';

    // ---- Resumen
    const kpis = () => {
        const { giveaways, winners } = data();
        const G = giveaways.filter((g) => !g.archived);
        const stat = (n, label, extra) => '<div class="stat"><span class="stat-n">' + n + '</span><span class="stat-l">' + label + '</span>' + (extra ? '<span class="small muted">' + extra + '</span>' : '') + '</div>';
        return '<div class="stats">'
            + stat(G.filter((g) => g.status === 'activo').length, 'Sorteos activos')
            + stat(G.filter((g) => g.status === 'finalizado').length, 'Sorteos finalizados')
            + stat(winners.length, 'Ganadores')
            + stat(winners.filter((w) => w.stage <= 1).length, 'Pendientes de contacto')
            + stat(winners.filter((w) => w.brief_sent_at && !w.brief_done_at && w.stage < 4).length, 'Briefs pendientes')
            + stat(winners.filter((w) => w.stage >= 7 && w.stage <= 9).length, 'Proyectos en desarrollo')
            + stat(winners.filter((w) => w.stage >= 11 || w.delivered_at).length, 'Premios entregados')
            + '</div>';
    };
    const alerts = () => {
        const late = data().winners.filter((w) => alertOf(w));
        if (!late.length) return '';
        return '<div class="alert">⏰ Seguimientos: ' + late.map((w) => '<button type="button" class="link-btn" data-sg-open="' + w.id + '">' + esc(w.name) + '</button> (' + (alertOf(w) === 'vencida' ? 'vencido ' + fdate(w.follow_up) : 'hoy') + ': ' + esc(w.next_task || 'sin tarea') + ')').join(' · ') + '</div>';
    };

    // ---- Lista de ganadores
    const winnersView = () => {
        const { winners, giveaways, stages } = data();
        const q = filters.q.toLowerCase();
        const list = winners.filter((w) => (!filters.giveaway || String(w.giveaway_id) === filters.giveaway)
            && (filters.stage === '' || String(w.stage) === filters.stage)
            && (!q || [w.name, w.instagram, w.email, w.giveaway_name].join(' ').toLowerCase().includes(q)));
        return '<div class="sg-filters"><input type="search" data-sg-filter="q" placeholder="Buscar por nombre, usuario o mail" value="' + esc(filters.q) + '">'
            + '<select data-sg-filter="giveaway"><option value="">Todos los sorteos</option>' + giveaways.map((g) => '<option value="' + g.id + '"' + (filters.giveaway === String(g.id) ? ' selected' : '') + '>' + esc(g.name) + '</option>').join('') + '</select>'
            + '<select data-sg-filter="stage"><option value="">Todas las etapas</option>' + stages.map((s, i) => '<option value="' + i + '"' + (filters.stage === String(i) ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></div>'
            + (list.length ? '<div class="sg-table"><table><thead><tr><th>Ganador</th><th>Sorteo</th><th>Premio</th><th>Etapa</th><th>Seguimiento</th></tr></thead><tbody>'
                + list.map((w) => '<tr data-sg-open="' + w.id + '"><td><strong>' + esc(w.name) + '</strong><br><span class="small muted">@' + esc(w.instagram) + '</span></td><td>' + esc(w.giveaway_name) + '</td><td>' + esc(w.prize) + '</td><td>' + stageTag(w) + '</td>'
                    + '<td>' + (w.next_task ? esc(w.next_task) + '<br><span class="small ' + (alertOf(w) === 'vencida' ? 'sg-late' : 'muted') + '">' + fdate(w.follow_up) + '</span>' : '<span class="muted">—</span>') + '</td></tr>').join('')
                + '</tbody></table></div>' : '<p class="empty">' + (winners.length ? 'No hay ganadores con esos filtros.' : 'Todavía no cargaste ganadores.') + '</p>')
            + (giveaways.some((g) => !g.archived) ? '<details class="card" style="margin-top:1rem"><summary>➕ Registrar un ganador</summary>' + winnerForm({}) + '</details>' : '<p class="small muted">Para registrar ganadores, primero creá un sorteo.</p>');
    };

    const winnerForm = (w) => {
        const G = data().giveaways.filter((g) => !g.archived || g.id === w.giveaway_id);
        return '<form data-sg-form="winner"><input type="hidden" name="id" value="' + (w.id || '') + '"><div class="grid">'
            + '<label>Sorteo<select name="giveawayId" required>' + G.map((g) => '<option value="' + g.id + '"' + (g.id === w.giveaway_id ? ' selected' : '') + '>' + esc(g.name) + '</option>').join('') + '</select></label>'
            + '<label>Nombre y apellido<input name="name" required maxlength="100" value="' + esc(w.name) + '"></label>'
            + '<label>Usuario de Instagram<input name="instagram" required maxlength="31" placeholder="@usuario" value="' + esc(w.instagram ? '@' + w.instagram : '') + '"></label>'
            + '<label>URL del perfil <span class="small muted">(se arma sola si la dejás vacía)</span><input name="profileUrl" type="url" value="' + esc(w.profile_url) + '"></label>'
            + '<label>Correo electrónico<input name="email" type="email" value="' + esc(w.email) + '"></label>'
            + '<label>WhatsApp<input name="whatsapp" inputmode="tel" value="' + esc(w.whatsapp) + '"></label>'
            + '<label>Premio obtenido<input name="prize" maxlength="200" value="' + esc(w.prize) + '"></label>'
            + '<label>Tipo de proyecto<select name="plan">' + Object.entries(PLANS).map(([k, v]) => '<option value="' + k + '"' + ((w.plan || '') === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>'
            + '<label>Fecha de anuncio<input name="announced" type="date" value="' + esc(w.announced) + '"></label>'
            + '</div><label>Observaciones<textarea name="note" rows="2">' + esc(w.note) + '</textarea></label>'
            + '<button class="primary" style="margin-top:.75rem">' + (w.id ? 'Guardar cambios' : 'Registrar ganador') + '</button></form>';
    };

    // ---- Lista de sorteos
    const giveawaysView = () => {
        const all = data().giveaways;
        const list = all.filter((g) => filters.showArchived || !g.archived);
        const editing = all.find((g) => g.id === editGiveaway);
        return '<label class="check-line"><input type="checkbox" data-sg-archived' + (filters.showArchived ? ' checked' : '') + '> Mostrar archivados</label>'
            + (list.length ? '<div class="sg-table"><table><thead><tr><th>Sorteo</th><th>Fechas</th><th>Premio</th><th>Estado</th><th class="n">Ganadores</th><th></th></tr></thead><tbody>'
                + list.map((g) => '<tr' + (g.archived ? ' class="sg-archived"' : '') + '><td><strong>' + esc(g.name) + '</strong>' + (g.url ? '<br><a class="small" href="' + esc(g.url) + '" target="_blank" rel="noopener">Ver publicación ↗</a>' : '') + '</td>'
                    + '<td class="small">' + fdate(g.starts) + ' → ' + fdate(g.ends) + (g.draw_date ? '<br>Sorteo: ' + fdate(g.draw_date) : '') + '</td><td>' + esc(g.prize) + '</td>'
                    + '<td><span class="sg-tag sg-' + (g.archived ? 'muted' : g.status === 'activo' ? 'info' : g.status === 'finalizado' ? 'ok' : 'warn') + '">' + (g.archived ? 'Archivado' : STATUS[g.status]) + '</span></td><td class="n">' + g.winnerCount + '</td>'
                    + '<td class="sg-actions"><button type="button" data-sg-edit="' + g.id + '">Editar</button><button type="button" data-sg-archive="' + g.id + '" data-on="' + (g.archived ? '0' : '1') + '">' + (g.archived ? 'Desarchivar' : 'Archivar') + '</button></td></tr>').join('')
                + '</tbody></table></div>' : '<p class="empty">Todavía no hay sorteos.</p>')
            + '<details class="card" style="margin-top:1rem"' + (editing ? ' open' : '') + '><summary>' + (editing ? '✏️ Editar "' + esc(editing.name) + '"' : '➕ Nuevo sorteo') + '</summary>' + giveawayForm(editing || {}) + '</details>';
    };

    const giveawayForm = (g) => '<form data-sg-form="giveaway"><input type="hidden" name="id" value="' + (g.id || '') + '"><div class="grid">'
        + '<label>Nombre del sorteo<input name="name" required maxlength="120" value="' + esc(g.name) + '"></label>'
        + '<label>URL de la publicación<input name="url" type="url" placeholder="https://www.instagram.com/p/..." value="' + esc(g.url) + '"></label>'
        + '<label>Fecha de inicio<input name="starts" type="date" value="' + esc(g.starts) + '"></label>'
        + '<label>Fecha de finalización<input name="ends" type="date" value="' + esc(g.ends) + '"></label>'
        + '<label>Fecha de selección del ganador<input name="drawDate" type="date" value="' + esc(g.draw_date) + '"></label>'
        + '<label>Estado<select name="status">' + Object.entries(STATUS).map(([k, v]) => '<option value="' + k + '"' + ((g.status || 'borrador') === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></label>'
        + '</div><label>Publicación de Instagram (texto o descripción)<textarea name="post" rows="2">' + esc(g.post) + '</textarea></label>'
        + '<label>Premio ofrecido<textarea name="prize" rows="2">' + esc(g.prize) + '</textarea></label>'
        + '<label>Condiciones<textarea name="conditions" rows="3">' + esc(g.conditions) + '</textarea></label>'
        + '<div class="row" style="margin-top:.75rem"><button class="primary">' + (g.id ? 'Guardar cambios' : 'Crear sorteo') + '</button>' + (g.id ? '<button type="button" data-sg-edit="0">Cancelar</button>' : '') + '</div></form>';

    // ---- Ficha del ganador
    const fichaView = (w) => {
        const { stages, events } = data();
        const history = events.filter((e) => e.winner_id === w.id);
        const copyBtn = (val, label) => (val ? '<button type="button" class="sg-copy" data-sg-copy="' + esc(val) + '" title="Copiar ' + label + '">Copiar</button>' : '');
        const row = (label, val, raw) => '<div class="sg-field"><span class="small muted">' + label + '</span><span>' + (val ? esc(val) : '—') + '</span>' + copyBtn(raw === undefined ? val : raw, label.toLowerCase()) + '</div>';
        const late = alertOf(w);
        return '<p><button type="button" class="link-btn" data-sg-back>← Volver a Sorteos</button></p>'
            + '<div class="row space"><h2 style="margin:0">' + esc(w.name) + '</h2>' + stageTag(w) + '</div>'
            + '<p class="muted" style="margin-top:.25rem">' + esc(w.giveaway_name) + ' · ' + esc(w.prize || 'Premio sin cargar') + '</p>'
            + (late ? '<div class="alert">⏰ ' + (late === 'vencida' ? 'Seguimiento vencido (' + fdate(w.follow_up) + ')' : 'Seguimiento para hoy') + ': ' + esc(w.next_task || 'sin tarea') + '</div>' : '')
            + '<div class="sg-grid">'
            // Datos y contacto
            + '<section class="card"><h3>Datos y contacto</h3>'
            + row('Nombre', w.name) + row('Instagram', '@' + w.instagram, '@' + w.instagram) + row('Correo', w.email) + row('WhatsApp', w.whatsapp)
            + '<div class="row" style="margin-top:.5rem"><a class="btn" href="' + esc(w.profile_url) + '" target="_blank" rel="noopener">Abrir perfil de Instagram ↗</a>'
            + '<button type="button" data-sg-copy="' + esc([w.name, '@' + w.instagram, w.email, w.whatsapp].filter(Boolean).join('\n')) + '">Copiar todos los datos</button></div>'
            + (w.note ? '<p class="small"><strong>Observaciones:</strong> ' + esc(w.note) + '</p>' : '')
            + '<p class="small muted">Anunciado: ' + fdate(w.announced) + ' · Proyecto: ' + esc(PLANS[w.plan || '']) + '</p>'
            + '<details><summary>✏️ Editar datos</summary>' + winnerForm(w) + '</details></section>'
            // Seguimiento
            + '<section class="card"><h3>Seguimiento</h3>'
            + '<label>Etapa<select data-sg-stage>' + stages.map((s, i) => '<option value="' + i + '"' + (i === w.stage ? ' selected' : '') + '>' + (i + 1) + '. ' + esc(s) + '</option>').join('') + '</select></label>'
            + '<p class="small muted">Desde ' + fdate(w.stage_at) + '</p>'
            + (w.stage < stages.length - 1 ? '<button type="button" class="primary" data-sg-next>Pasar a: ' + esc(stages[w.stage + 1]) + ' →</button>' : '')
            + '<ul class="sg-marks">' + MARKS.map(([f, label]) => '<li><span>' + label + '</span><span class="small ' + (w[f] ? '' : 'muted') + '">' + (w[f] ? fdate(w[f]) : 'pendiente') + '</span>'
                + (w[f] ? '<button type="button" class="link-btn" data-sg-mark="' + f + '" data-date="">Quitar</button>' : '<button type="button" data-sg-mark="' + f + '">Registrar hoy</button>') + '</li>').join('') + '</ul></section>'
            + '</div>'
            // Mensajes y brief
            + '<form class="card" data-sg-form="track"><h3>Mensajes, brief y próxima tarea</h3>'
            + '<label>Mensaje de felicitación <span class="small muted">(editalo antes de copiarlo)</span><textarea name="msgCongrats" rows="5">' + esc(w.msg_congrats || congratsText(w)) + '</textarea></label>'
            + '<div class="row"><button type="button" data-sg-copy-field="msgCongrats">Copiar para Instagram</button>' + (w.contacted_at ? '' : '<button type="button" data-sg-mark="contacted_at">Registrar contacto hoy</button>') + '</div>'
            + '<label>Link del brief<input name="briefLink" type="url" placeholder="Se completa al crear el proyecto (#brief)" value="' + esc(w.brief_link) + '"></label>'
            + '<label>Mensaje para enviar el brief<textarea name="msgBrief" rows="5">' + esc(w.msg_brief || briefText(w)) + '</textarea></label>'
            + '<div class="row"><button type="button" data-sg-copy-field="msgBrief">Copiar para Instagram</button>' + (w.brief_sent_at ? '' : '<button type="button" data-sg-mark="brief_sent_at">Registrar envío hoy</button>') + '</div>'
            + '<div class="grid"><label>Próxima tarea<input name="nextTask" maxlength="200" value="' + esc(w.next_task) + '"></label>'
            + '<label>Fecha de seguimiento<input name="followUp" type="date" value="' + esc(w.follow_up) + '"></label></div>'
            + '<label>Notas internas<textarea name="internalNotes" rows="3">' + esc(w.internal_notes) + '</textarea></label>'
            + '<button class="primary" style="margin-top:.75rem">Guardar seguimiento</button></form>'
            // Historial
            + '<section class="card"><h3>Historial de actividad</h3>' + (history.length ? '<ul class="feed">' + history.map((e) => '<li><span class="tl-icon">' + esc(e.icon) + '</span><div><p style="margin:0">' + esc(e.text) + '</p><p class="small muted" style="margin:0">' + new Date(e.at).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) + '</p></div></li>').join('') + '</ul>' : '<p class="empty">Sin movimientos.</p>') + '</section>';
    };

    const render = () => {
        const el = root();
        if (!el || el.hidden) return;
        const w = openId ? data().winners.find((x) => x.id === openId) : null;
        if (w) { el.innerHTML = fichaView(w); return; }
        el.innerHTML = '<h2>Sorteos de Instagram</h2>' + kpis() + alerts()
            + '<nav class="subtabs"><button type="button" data-sg-tab="ganadores" aria-pressed="' + (tab === 'ganadores') + '">Ganadores</button><button type="button" data-sg-tab="sorteos" aria-pressed="' + (tab === 'sorteos') + '">Sorteos</button></nav>'
            + (tab === 'ganadores' ? winnersView() : giveawaysView());
    };

    const badge = () => {
        const n = data().winners.filter((w) => alertOf(w) === 'vencida' || w.stage <= 1).length;
        const b = document.getElementById('n-sorteos');
        if (b) b.textContent = n || '';
    };

    const formObj = (form) => Object.fromEntries(new FormData(form).entries());

    document.addEventListener('submit', (e) => {
        const form = e.target.closest('[data-sg-form]');
        if (!form || !root().contains(form)) return;
        e.preventDefault();
        const f = formObj(form);
        const kind = form.dataset.sgForm;
        if (kind === 'giveaway') {
            send('sorteos', { action: 'save', giveaway: f }, f.id ? 'Sorteo guardado' : 'Sorteo creado').then((r) => { if (r) { editGiveaway = 0; render(); } });
        } else if (kind === 'winner') {
            send('sorteos/ganadores', { action: 'save', winner: f }, f.id ? 'Datos guardados' : 'Ganador registrado').then((r) => { if (r && !f.id) { panel().go('sorteos', 'G' + r.id); } });
        } else if (kind === 'track') {
            send('sorteos/ganadores', { action: 'track', id: openId, ...f }, 'Seguimiento guardado');
        }
    });

    document.addEventListener('change', (e) => {
        const el = root();
        if (!el || !el.contains(e.target)) return;
        if (e.target.matches('[data-sg-filter]') && e.target.tagName === 'SELECT') { filters[e.target.dataset.sgFilter] = e.target.value; render(); }
        if (e.target.matches('[data-sg-archived]')) { filters.showArchived = e.target.checked; render(); }
        if (e.target.matches('[data-sg-stage]')) send('sorteos/ganadores', { action: 'stage', id: openId, stage: Number(e.target.value) }, 'Etapa actualizada');
    });

    document.addEventListener('input', (e) => {
        if (!e.target.matches('#m-sorteos input[data-sg-filter="q"]')) return;
        filters.q = e.target.value;
        const pos = e.target.selectionStart;
        render();
        const again = root().querySelector('input[data-sg-filter="q"]');
        if (again) { again.focus(); again.setSelectionRange(pos, pos); }
    });

    document.addEventListener('click', (e) => {
        const el = root();
        if (!el || !el.contains(e.target)) return;
        const t = e.target.closest('button, tr[data-sg-open]');
        if (!t) return;
        const d = t.dataset;
        if (d.sgTab) { tab = d.sgTab; render(); }
        else if (d.sgOpen) panel().go('sorteos', 'G' + d.sgOpen);
        else if ('sgBack' in d) panel().go('sorteos', '');
        else if (d.sgEdit !== undefined) { editGiveaway = Number(d.sgEdit); render(); }
        else if (d.sgArchive) {
            if (d.on === '1' && !window.confirm('¿Archivar este sorteo? Sus ganadores, proyectos e historial se conservan.')) return;
            send('sorteos', { action: 'archive', id: Number(d.sgArchive), archived: d.on === '1' }, d.on === '1' ? 'Sorteo archivado' : 'Sorteo restaurado');
        } else if (d.sgCopy !== undefined) copy(d.sgCopy);
        else if (d.sgCopyField) { const area = el.querySelector('[name="' + d.sgCopyField + '"]'); if (area) copy(area.value, 'Mensaje copiado'); }
        else if (d.sgMark) send('sorteos/ganadores', { action: 'mark', id: openId, field: d.sgMark, date: d.date === '' ? '' : today() }, 'Fecha registrada');
        else if ('sgNext' in d) {
            const w = data().winners.find((x) => x.id === openId);
            if (w) send('sorteos/ganadores', { action: 'stage', id: openId, stage: w.stage + 1 }, 'Etapa actualizada');
        }
    });

    window.JNBGiveaways = {
        // id: '' (resumen y listas) o 'G12' (ficha del ganador 12)
        show(id) {
            const m = /^G(\d+)$/.exec(id || '');
            openId = m ? Number(m[1]) : 0;
            render();
        },
        refresh() { badge(); render(); },
    };
})();
