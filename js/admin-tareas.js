// Gestor de tareas del panel (/api/admin, módulo #tareas): tablero tipo Kanban con cinco columnas.
// Las tareas se guardan en la base de datos del panel (Durable Object), así se ven iguales en cualquier dispositivo.
// El panel le pasa a este archivo su función api() y toast() por window.JNBPanel; acá no hay datos ni claves.
(() => {
    const COLUMNS = [
        { id: 'inbox', name: 'Bandeja de entrada' },
        { id: 'todo', name: 'Pendientes' },
        { id: 'doing', name: 'En proceso' },
        { id: 'review', name: 'En revisión' },
        { id: 'done', name: 'Completadas' },
    ];
    const PRIORITIES = [
        { id: 'alta', name: 'Alta' },
        { id: 'media', name: 'Media' },
        { id: 'baja', name: 'Baja' },
    ];

    const ICON = {
        calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
        check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>',
        tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
        archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/></svg>',
        filter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M10 19h4"/></svg>',
        plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
        list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    };
    let filtersOpen = false;
    let mobileCol = '';   // columna que se ve en celulares (pestañas)

    let state = { tasks: [], categories: [] };
    let loaded = false;
    let showArchived = false;
    const filters = { q: '', category: '', priority: '', date: '' };

    const panel = () => window.JNBPanel;
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const root = () => document.getElementById('m-tareas');
    const today = () => {
        const d = new Date();
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    };
    const addDays = (iso, n) => {
        const d = new Date(`${iso}T12:00:00`);
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
    };
    const fmtDate = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
    // Fecha con hora opcional: "18/11/2026 · 16:00 hs" (o solo la fecha si la tarea no tiene horario)
    const fmtWhen = (t) => (t.due ? `${fmtDate(t.due)}${t.due_time ? ` · ${t.due_time} hs` : ''}` : '');
    const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
    const isOverdue = (t) => Boolean(t.due) && t.due < today() && t.status !== 'done';
    const categoryName = (id) => state.categories.find((c) => c.id === id)?.name || '';
    const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    // ---- Datos
    const call = async (body) => {
        try {
            state = await panel().api('tareas', body);
            render();
            return true;
        } catch (e) {
            if (e.message !== 'clave') panel().toast('No se pudo guardar. Probá de nuevo.');
            return false;
        }
    };

    const refresh = async () => {
        try {
            state = await panel().api('tareas');
            loaded = true;
            render();
        } catch (e) { /* el panel ya avisa si la clave no es válida */ }
    };

    // ---- Filtros
    const matches = (t) => {
        if (filters.q && !norm(t.title).includes(norm(filters.q))) return false;
        if (filters.category === 'none' && t.category) return false;
        if (filters.category && filters.category !== 'none' && String(t.category) !== filters.category) return false;
        if (filters.priority && t.priority !== filters.priority) return false;
        const now = today();
        if (filters.date === 'overdue' && !isOverdue(t)) return false;
        if (filters.date === 'today' && t.due !== now) return false;
        if (filters.date === 'week' && !(t.due && t.due >= now && t.due <= addDays(now, 7))) return false;
        if (filters.date === 'nodate' && t.due) return false;
        return true;
    };
    const filtering = () => Boolean(filters.q || filters.category || filters.priority || filters.date);

    // ---- Tablero
    const cardHtml = (t) => {
        const subs = t.subtasks || [];
        const doneSubs = subs.filter((x) => x.done).length;
        const cat = categoryName(t.category);
        const overdue = isOverdue(t);
        const prio = PRIORITIES.find((p) => p.id === t.priority)?.name || '';
        const pct = subs.length ? Math.round((doneSubs / subs.length) * 100) : 0;
        return `<article class="task-card prio-${esc(t.priority)}${overdue ? ' is-overdue' : ''}${t.status === 'done' ? ' is-done' : ''}" draggable="true" data-id="${t.id}" tabindex="0"
            aria-label="${esc(t.title)}. Prioridad ${esc(prio.toLowerCase())}${t.due ? `. Vence el ${fmtWhen(t)}` : ''}${overdue ? ', vencida' : ''}">
            <div class="task-card-top">
                <span class="task-cat" title="${esc(cat || 'Sin categoría')}">${cat ? esc(cat) : 'Sin categoría'}</span>
                <span class="task-prio" title="Prioridad ${esc(prio.toLowerCase())}"><i aria-hidden="true"></i>${esc(prio)}</span>
            </div>
            <p class="task-title">${esc(t.title)}</p>
            ${t.description ? `<p class="task-desc">${esc(t.description)}</p>` : ''}
            ${subs.length ? `<div class="task-progress" title="Subtareas: ${doneSubs} de ${subs.length}"><span style="width:${pct}%"></span></div>` : ''}
            ${t.due || subs.length ? `<div class="task-card-foot">
                ${t.due ? `<span class="task-date${overdue ? ' overdue' : ''}${t.due_time ? ' has-time' : ''}" title="${t.due_time ? 'Fecha y hora' : 'Fecha límite (sin horario)'}">${t.due_time ? ICON.clock : ICON.calendar}${overdue ? 'Vencida · ' : ''}${fmtWhen(t)}</span>` : '<span></span>'}
                ${subs.length ? `<span class="task-subcount${doneSubs === subs.length ? ' complete' : ''}">${ICON.check}${doneSubs}/${subs.length}</span>` : ''}
            </div>` : ''}
        </article>`;
    };

    const summaryHtml = (active) => {
        const count = (st) => active.filter((t) => st.includes(t.status)).length;
        const overdue = active.filter(isOverdue).length;
        return `<div class="task-summary">
            <div class="task-stat is-todo"><strong>${count(['inbox', 'todo'])}</strong><span>Pendientes</span></div>
            <div class="task-stat is-doing"><strong>${count(['doing', 'review'])}</strong><span>En proceso y revisión</span></div>
            <div class="task-stat is-done"><strong>${count(['done'])}</strong><span>Completadas</span></div>
            <button type="button" class="task-stat${overdue ? ' is-warn' : ''}" data-act="show-overdue" ${overdue ? '' : 'disabled'}><strong>${overdue}</strong><span>Vencidas</span></button>
        </div>`;
    };

    const activeFilters = () => ['category', 'priority', 'date'].filter((k) => filters[k]).length;
    const toolbarHtml = () => `<div class="task-toolbar${filtersOpen ? ' is-open' : ''}">
        <div class="task-search-row">
            <label class="task-search"><span class="sr-only">Buscar tareas</span><input type="search" id="task-q" placeholder="Buscar por nombre…" value="${esc(filters.q)}"></label>
            <button type="button" class="task-filter-toggle" data-act="toggle-filters" aria-expanded="${filtersOpen}">${ICON.filter}<span>Filtros${activeFilters() ? ` (${activeFilters()})` : ''}</span></button>
        </div>
        <div class="task-filters">
        <label><span class="sr-only">Categoría</span><select id="task-f-category">
            <option value="">Todas las categorías</option>
            ${state.categories.map((c) => `<option value="${c.id}"${filters.category === String(c.id) ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}
            <option value="none"${filters.category === 'none' ? ' selected' : ''}>Sin categoría</option>
        </select></label>
        <label><span class="sr-only">Prioridad</span><select id="task-f-priority">
            <option value="">Todas las prioridades</option>
            ${PRIORITIES.map((p) => `<option value="${p.id}"${filters.priority === p.id ? ' selected' : ''}>Prioridad ${p.name.toLowerCase()}</option>`).join('')}
        </select></label>
        <label><span class="sr-only">Fecha límite</span><select id="task-f-date">
            <option value="">Cualquier fecha</option>
            <option value="overdue"${filters.date === 'overdue' ? ' selected' : ''}>Vencidas</option>
            <option value="today"${filters.date === 'today' ? ' selected' : ''}>Vencen hoy</option>
            <option value="week"${filters.date === 'week' ? ' selected' : ''}>Próximos 7 días</option>
            <option value="nodate"${filters.date === 'nodate' ? ' selected' : ''}>Sin fecha límite</option>
        </select></label>
        ${filtering() ? '<button type="button" class="task-link" data-act="clear-filters">Limpiar filtros</button>' : ''}
        </div>
    </div>`;

    const tabsHtml = (active) => `<div class="task-tabs" role="tablist" aria-label="Columnas">
        ${COLUMNS.map((col) => {
            const n = active.filter((t) => t.status === col.id && matches(t)).length;
            return `<button type="button" role="tab" class="task-tab" data-act="tab" data-col="${col.id}" aria-selected="${col.id === mobileCol}">
                <span class="task-dot" aria-hidden="true"></span>${col.name}<span class="task-count">${n}</span></button>`;
        }).join('')}
    </div>`;

    const RANK = { alta: 0, media: 1, baja: 2 };
    // A igual fecha, primero las que tienen horario (por hora) y después las de todo el día
    const byUrgency = (x, y) => (`${x.due || '9999'} ${x.due_time || '~'}`.localeCompare(`${y.due || '9999'} ${y.due_time || '~'}`)) || ((RANK[x.priority] ?? 1) - (RANK[y.priority] ?? 1)) || (x.position - y.position);

    const boardHtml = (active) => `${tabsHtml(active)}<div class="task-board" role="list" data-active="${mobileCol}">
        ${COLUMNS.map((col) => {
            // Más urgente primero: vencimiento más cercano (sin fecha al final) y, a igual fecha, prioridad Alta → Media → Baja
            const all = active.filter((t) => t.status === col.id).sort(col.id === 'done' ? (x, y) => x.position - y.position : byUrgency);
            const shown = all.filter(matches);
            return `<section class="task-col" data-status="${col.id}" role="listitem" aria-label="${col.name}">
                <header class="task-col-head">
                    <span class="task-dot" aria-hidden="true"></span>
                    <h3 title="${col.name}">${col.name}</h3>
                    <span class="task-count" title="Tareas en esta columna">${filtering() ? `${shown.length}/${all.length}` : all.length}</span>
                </header>
                <div class="task-list" data-status="${col.id}">
                    ${shown.map(cardHtml).join('') || `<p class="task-empty">${filtering() ? 'Nada con estos filtros' : 'Soltá una tarea acá'}</p>`}
                </div>
                <form class="task-quick" data-status="${col.id}">
                    <label>${ICON.plus}<span class="sr-only">Nueva tarea en ${col.name}</span><input name="title" maxlength="160" placeholder="Agregar tarea" autocomplete="off"></label>
                </form>
                ${col.id === 'done' && all.length ? `<button type="button" class="task-archive-done" data-act="archive-done">${ICON.archive}Archivar completadas</button>` : ''}
            </section>`;
        }).join('')}
    </div>`;

    const archivedHtml = () => {
        const archived = state.tasks.filter((t) => t.archived).filter(matches)
            .sort((a, b) => (b.done_at || b.updated).localeCompare(a.done_at || a.updated));
        return `<div class="task-archived">
            ${archived.length ? `<table><thead><tr><th>Tarea</th><th>Categoría</th><th>Completada</th><th></th></tr></thead><tbody>
            ${archived.map((t) => `<tr><td><button type="button" class="task-link" data-act="open" data-id="${t.id}">${esc(t.title)}</button></td>
                <td>${esc(categoryName(t.category)) || '<span class="muted">—</span>'}</td><td>${fmtDate(t.done_at) || '—'}</td>
                <td class="task-row-actions"><button type="button" data-act="restore" data-id="${t.id}">Restaurar</button>
                <button type="button" data-act="delete" data-id="${t.id}">Eliminar</button></td></tr>`).join('')}
            </tbody></table>` : '<p class="empty">No hay tareas archivadas.</p>'}
        </div>`;
    };

    const render = () => {
        const el = root();
        if (!el) return;
        const active = state.tasks.filter((t) => !t.archived);
        const archivedCount = state.tasks.length - active.length;
        const badge = document.getElementById('n-tareas');
        if (badge) {
            const overdue = active.filter(isOverdue).length;
            badge.textContent = overdue || '';
            badge.title = overdue ? `${overdue} vencidas` : '';
        }
        if (!loaded) { el.innerHTML = '<h2>Gestor de tareas</h2><p class="muted">Cargando tareas…</p>'; return; }
        // Al entrar desde el celular se abre la primera columna con tareas
        if (!mobileCol) mobileCol = (COLUMNS.find((c) => active.some((t) => t.status === c.id && t.status !== 'done')) || COLUMNS[0]).id;
        const focusId = document.activeElement?.id;
        el.innerHTML = `<div class="task-head">
                <h2>Gestor de tareas</h2>
                <div class="task-actions">
                    <button type="button" class="task-btn" data-act="categories" title="Categorías">${ICON.tag}<span>Categorías</span></button>
                    <button type="button" class="task-btn" data-act="toggle-archived" aria-pressed="${showArchived}" title="${showArchived ? 'Volver al tablero' : 'Archivadas'}">${showArchived ? ICON.list : ICON.archive}<span>${showArchived ? 'Volver al tablero' : `Archivadas${archivedCount ? ` (${archivedCount})` : ''}`}</span></button>
                    <button type="button" class="task-btn primary" data-act="new">${ICON.plus}<span>Nueva tarea</span></button>
                </div>
            </div>
            ${summaryHtml(active)}
            ${toolbarHtml()}
            ${showArchived ? archivedHtml() : boardHtml(active)}`;
        if (focusId === 'task-q') {
            const q = document.getElementById('task-q');
            q.focus();
            q.setSelectionRange(q.value.length, q.value.length);
        }
    };

    // ---- Editor de tareas (ventana)
    const dialog = () => {
        let d = document.getElementById('task-dialog');
        if (!d) {
            d = document.createElement('dialog');
            d.id = 'task-dialog';
            d.className = 'task-dialog';
            document.body.appendChild(d);
        }
        return d;
    };

    const subtaskRow = (s, i) => `<li class="task-sub" data-i="${i}">
        <input type="checkbox" ${s.done ? 'checked' : ''} aria-label="Hecha">
        <input type="text" value="${esc(s.text)}" maxlength="300" aria-label="Subtarea">
        <button type="button" class="task-icon-btn" data-act="sub-remove" aria-label="Quitar subtarea">×</button>
    </li>`;

    const openEditor = (task) => {
        const t = task || { id: 0, title: '', description: '', category: null, priority: 'media', status: 'inbox', due: '', due_time: '', notes: '', subtasks: [], created: '' };
        const [hh, mm] = (t.due_time || '').split(':');
        const d = dialog();
        d.innerHTML = `<form method="dialog" class="task-form">
            <div class="task-form-head">
                <strong>${t.id ? 'Editar tarea' : 'Nueva tarea'}</strong>
                <button type="button" class="task-icon-btn" data-act="close" aria-label="Cerrar">×</button>
            </div>
            <div class="task-form-body">
                <label>Título<input name="title" required maxlength="160" value="${esc(t.title)}"></label>
                <label>Descripción<textarea name="description" maxlength="4000" rows="3">${esc(t.description)}</textarea></label>
                <div class="task-form-grid">
                    <label>Categoría<select name="category"><option value="">Sin categoría</option>
                        ${state.categories.map((c) => `<option value="${c.id}"${c.id === t.category ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
                    <label>Prioridad<select name="priority">${PRIORITIES.map((p) => `<option value="${p.id}"${p.id === t.priority ? ' selected' : ''}>${p.name}</option>`).join('')}</select></label>
                    <label>Columna<select name="status">${COLUMNS.map((c) => `<option value="${c.id}"${c.id === t.status ? ' selected' : ''}>${c.name}</option>`).join('')}</select></label>
                    <div class="task-when">
                        <label>Fecha límite<input type="date" name="due" value="${esc(t.due)}"></label>
                        <div class="task-time" role="group" aria-labelledby="task-time-label">
                            <span id="task-time-label">Hora <span class="muted">(opcional, 24 h)</span></span>
                            <div class="task-time-row"><select name="due_hour" aria-label="Hora"><option value="">Sin horario</option>${HOURS.map((h) => `<option value="${h}"${h === hh ? ' selected' : ''}>${h}</option>`).join('')}</select>
                            <span aria-hidden="true">:</span>
                            <select name="due_min" aria-label="Minutos">${MINUTES.concat(mm && !MINUTES.includes(mm) ? [mm] : []).map((m) => `<option value="${m}"${m === (mm || '00') ? ' selected' : ''}>${m}</option>`).join('')}</select></div>
                        </div>
                    </div>
                </div>
                <fieldset class="task-subs">
                    <legend>Subtareas</legend>
                    <ul>${(t.subtasks || []).map(subtaskRow).join('')}</ul>
                    <div class="task-sub-add"><input type="text" maxlength="300" placeholder="Agregar una subtarea y apretar Enter" aria-label="Nueva subtarea"><button type="button" data-act="sub-add">Agregar</button></div>
                </fieldset>
                <label>Notas<textarea name="notes" maxlength="4000" rows="3">${esc(t.notes)}</textarea></label>
                ${t.due ? `<p class="task-when-detail${t.due_time ? ' has-time' : ''}">${t.due_time ? ICON.clock : ICON.calendar}Vence el ${fmtDate(t.due)} · ${t.due_time ? `${esc(t.due_time)} hs` : 'Sin horario'}</p>` : ''}
                ${t.created ? `<p class="small muted">Creada el ${fmtDate(t.created)}${t.done_at ? ` · Completada el ${fmtDate(t.done_at)}` : ''}${t.archived ? ' · Archivada' : ''}</p>` : ''}
            </div>
            <div class="task-form-foot">
                ${t.id ? `<div class="row">
                    <button type="button" data-act="delete" data-id="${t.id}">Eliminar</button>
                    <button type="button" data-act="duplicate" data-id="${t.id}">Duplicar</button>
                    ${t.archived ? `<button type="button" data-act="restore" data-id="${t.id}">Restaurar</button>`
                        : (t.status === 'done' ? `<button type="button" data-act="archive" data-id="${t.id}">Archivar</button>` : '')}
                </div>` : '<span></span>'}
                <div class="row"><button type="button" data-act="close">Cancelar</button><button type="submit" class="primary">Guardar</button></div>
            </div>
        </form>`;
        d.dataset.id = t.id;
        d.showModal();
        d.querySelector('[name="title"]').focus();
    };

    const readEditor = () => {
        const f = dialog().querySelector('form');
        const val = (n) => f.elements[n].value;
        return {
            id: Number(dialog().dataset.id) || 0,
            title: val('title').trim(),
            description: val('description'),
            category: Number(val('category')) || null,
            priority: val('priority'),
            status: val('status'),
            due: val('due'),
            due_time: val('due_hour') ? `${val('due_hour')}:${val('due_min') || '00'}` : '',
            notes: val('notes'),
            subtasks: [...f.querySelectorAll('.task-sub')].map((li) => ({
                text: li.querySelector('input[type="text"]').value.trim(),
                done: li.querySelector('input[type="checkbox"]').checked,
            })).filter((s) => s.text),
        };
    };

    const addSubtask = () => {
        const input = dialog().querySelector('.task-sub-add input');
        const value = input.value.trim();
        if (!value) return;
        const ul = dialog().querySelector('.task-subs ul');
        ul.insertAdjacentHTML('beforeend', subtaskRow({ text: value, done: false }, ul.children.length));
        input.value = '';
        input.focus();
    };

    // ---- Categorías (ventana)
    const categoryRow = (c) => `<li class="task-cat" data-id="${c.id || 0}">
        <input type="text" maxlength="60" value="${esc(c.name)}" aria-label="Nombre de la categoría">
        <button type="button" class="task-icon-btn" data-act="cat-up" aria-label="Subir">↑</button>
        <button type="button" class="task-icon-btn" data-act="cat-down" aria-label="Bajar">↓</button>
        <button type="button" class="task-icon-btn" data-act="cat-remove" aria-label="Quitar">×</button>
    </li>`;

    const openCategories = () => {
        const d = dialog();
        d.dataset.id = '';
        d.innerHTML = `<form method="dialog" class="task-form" data-kind="categories">
            <div class="task-form-head"><strong>Categorías</strong><button type="button" class="task-icon-btn" data-act="close" aria-label="Cerrar">×</button></div>
            <div class="task-form-body">
                <p class="small muted">Cambiá los nombres, el orden o agregá categorías. Si quitás una, sus tareas quedan “sin categoría”.</p>
                <ul class="task-cats">${state.categories.map(categoryRow).join('')}</ul>
                <button type="button" data-act="cat-add">+ Agregar categoría</button>
            </div>
            <div class="task-form-foot"><span></span><div class="row"><button type="button" data-act="close">Cancelar</button><button type="submit" class="primary">Guardar</button></div></div>
        </form>`;
        d.showModal();
    };

    // ---- Acciones
    const findTask = (id) => state.tasks.find((t) => t.id === Number(id));

    const act = async (name, btn) => {
        const id = Number(btn.dataset.id) || Number(btn.closest('[data-id]')?.dataset.id) || 0;
        const d = dialog();
        switch (name) {
            case 'new': openEditor(null); break;
            case 'open': openEditor(findTask(id)); break;
            case 'categories': openCategories(); break;
            case 'toggle-archived': showArchived = !showArchived; render(); break;
            case 'toggle-filters': filtersOpen = !filtersOpen; render(); break;
            case 'tab':
                mobileCol = btn.dataset.col;
                render();
                root().querySelector(`.task-tab[data-col="${mobileCol}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
                break;
            case 'clear-filters': Object.assign(filters, { q: '', category: '', priority: '', date: '' }); render(); break;
            case 'show-overdue': Object.assign(filters, { date: 'overdue' }); showArchived = false; render(); break;
            case 'close': d.close(); break;
            case 'sub-add': addSubtask(); break;
            case 'sub-remove': btn.closest('.task-sub').remove(); break;
            case 'cat-add': d.querySelector('.task-cats').insertAdjacentHTML('beforeend', categoryRow({ name: '' })); d.querySelector('.task-cats li:last-child input').focus(); break;
            case 'cat-remove': btn.closest('.task-cat').remove(); break;
            case 'cat-up': { const li = btn.closest('.task-cat'); if (li.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling); break; }
            case 'cat-down': { const li = btn.closest('.task-cat'); if (li.nextElementSibling) li.parentNode.insertBefore(li.nextElementSibling, li); break; }
            case 'duplicate':
                if (await call({ action: 'duplicate', id })) { d.close(); panel().toast('Tarea duplicada'); }
                break;
            case 'archive':
                if (await call({ action: 'archive', ids: [id] })) { if (d.open) d.close(); panel().toast('Tarea archivada'); }
                break;
            case 'restore':
                if (await call({ action: 'archive', ids: [id], archived: false })) { if (d.open) d.close(); panel().toast('Tarea restaurada'); }
                break;
            case 'archive-done': {
                const ids = state.tasks.filter((t) => !t.archived && t.status === 'done').map((t) => t.id);
                if (ids.length && confirm(`¿Archivar ${ids.length === 1 ? 'la tarea completada' : `las ${ids.length} tareas completadas`}? Van a quedar en “Archivadas”.`)) {
                    if (await call({ action: 'archive', ids })) panel().toast('Tareas archivadas');
                }
                break;
            }
            case 'delete': {
                const t = findTask(id);
                if (t && confirm(`¿Eliminar la tarea “${t.title}”? No se puede deshacer.`)) {
                    if (await call({ action: 'delete', id })) { if (d.open) d.close(); panel().toast('Tarea eliminada'); }
                }
                break;
            }
            default: break;
        }
    };

    // ---- Arrastrar y soltar (mouse y teclado: la columna también se cambia desde el editor)
    let dragId = 0;
    // Tarjetas de la columna sin contar la que se está arrastrando
    const otherCards = (list) => [...list.querySelectorAll('.task-card')].filter((c) => Number(c.dataset.id) !== dragId);
    const dropIndex = (list, y) => {
        const cards = otherCards(list);
        const i = cards.findIndex((c) => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; });
        return i === -1 ? cards.length : i;
    };
    const clearMarks = () => document.querySelectorAll('.task-list.is-over, .task-tab.is-over').forEach((l) => l.classList.remove('is-over'));

    const drop = async (list, y) => {
        const task = findTask(dragId);
        if (!task) return;
        const status = list.dataset.status;
        const index = dropIndex(list, y);
        // Nuevo orden de la columna: las tareas visibles en su lugar, y las ocultas por un filtro, al final
        const column = state.tasks.filter((t) => !t.archived && t.status === status && t.id !== task.id).sort((a, b) => a.position - b.position);
        const visible = otherCards(list).map((c) => Number(c.dataset.id));
        const order = [...visible];
        order.splice(index, 0, task.id);
        column.forEach((t) => { if (!order.includes(t.id)) order.push(t.id); });
        // Se ve al instante; después llega la versión guardada
        task.status = status;
        order.forEach((tid, i) => { const t = findTask(tid); if (t) t.position = i + 1; });
        render();
        if (await call({ action: 'move', id: task.id, status, order })) {
            if (status === 'done') panel().toast('¡Tarea completada!');
        } else await refresh();
    };

    // ---- Eventos (delegados: el módulo se vuelve a dibujar a menudo)
    const bind = () => {
        const el = root();
        if (!el || el.dataset.bound) return;
        el.dataset.bound = '1';

        el.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-act]');
            if (btn) { act(btn.dataset.act, btn); return; }
            const card = e.target.closest('.task-card');
            if (card) openEditor(findTask(card.dataset.id));
        });
        el.addEventListener('keydown', (e) => {
            const card = e.target.closest('.task-card');
            if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openEditor(findTask(card.dataset.id)); }
        });
        el.addEventListener('input', (e) => {
            if (e.target.id === 'task-q') { filters.q = e.target.value; render(); }
        });
        el.addEventListener('change', (e) => {
            const map = { 'task-f-category': 'category', 'task-f-priority': 'priority', 'task-f-date': 'date' };
            if (map[e.target.id]) { filters[map[e.target.id]] = e.target.value; render(); }
        });
        // Agregar rápido: se escribe el título y Enter
        el.addEventListener('submit', async (e) => {
            const form = e.target.closest('.task-quick');
            if (!form) return;
            e.preventDefault();
            const title = form.elements.title.value.trim();
            if (!title) return;
            form.elements.title.value = '';
            const status = form.dataset.status;
            if (await call({ action: 'save', task: { title, status, priority: 'media', subtasks: [] } })) {
                const input = root().querySelector(`.task-quick[data-status="${status}"] input`);
                if (input) input.focus();
            }
        });

        el.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.task-card');
            if (!card) return;
            dragId = Number(card.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(dragId));
            requestAnimationFrame(() => card.classList.add('is-dragging'));
        });
        el.addEventListener('dragend', (e) => {
            e.target.closest('.task-card')?.classList.remove('is-dragging');
            clearMarks();
        });
        // Lista donde se suelta: la de la columna, o la de la pestaña sobre la que se suelta (va al final de esa columna)
        const dropList = (target) => {
            const tab = target.closest('.task-tab');
            if (tab) return root().querySelector(`.task-col[data-status="${tab.dataset.col}"] .task-list`);
            return target.closest('.task-col')?.querySelector('.task-list');
        };
        el.addEventListener('dragover', (e) => {
            const list = dropList(e.target);
            if (!list || !dragId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const mark = e.target.closest('.task-tab') || list;
            if (!mark.classList.contains('is-over')) { clearMarks(); mark.classList.add('is-over'); }
        });
        el.addEventListener('drop', (e) => {
            const fromTab = Boolean(e.target.closest('.task-tab'));
            const list = dropList(e.target);
            if (!list || !dragId) return;
            e.preventDefault();
            clearMarks();
            drop(list, fromTab ? Number.MAX_SAFE_INTEGER : e.clientY).finally(() => { dragId = 0; });
        });

        // Ventana del editor y de las categorías
        const d = dialog();
        d.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-act]');
            if (btn) act(btn.dataset.act, btn);
            else if (e.target === d) d.close();   // clic afuera de la ventana
        });
        d.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.closest('.task-sub-add')) { e.preventDefault(); addSubtask(); }
        });
        d.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            if (form.dataset.kind === 'categories') {
                const categories = [...form.querySelectorAll('.task-cat')].map((li) => ({ id: Number(li.dataset.id) || 0, name: li.querySelector('input').value.trim() })).filter((c) => c.name);
                if (!categories.length) { panel().toast('Dejá al menos una categoría'); return; }
                if (await call({ action: 'categories', categories })) { d.close(); panel().toast('Categorías guardadas'); }
                return;
            }
            const task = readEditor();
            if (!task.title) { form.elements.title.focus(); return; }
            if (task.due_time && !task.due) { panel().toast('Elegí una fecha para poder guardar la hora'); form.elements.due.focus(); return; }
            if (await call({ action: 'save', task })) { d.close(); panel().toast(task.id ? 'Tarea guardada' : 'Tarea creada'); }
        });
    };

    window.JNBTasks = {
        // Se llama al entrar al panel (para el número de vencidas del menú) y al abrir el módulo
        refresh: () => { bind(); return refresh(); },
        show: () => { bind(); if (!loaded) refresh(); else render(); },
        // Para los pendientes del día del Dashboard (null mientras no se cargaron)
        list: () => (loaded ? state.tasks : null),
        // Para las alertas de Marketing del Dashboard (recordatorios = tareas de las categorías de marketing)
        categories: () => state.categories,
    };
})();
