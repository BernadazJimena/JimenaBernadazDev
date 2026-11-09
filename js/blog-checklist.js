// Blog: checklist para tildar con barra de avance. Lo tildado se recuerda en este navegador
// (si el navegador no lo permite, la lista funciona igual, solo que no se guarda).
(() => {
    document.querySelectorAll('[data-blog-checklist]').forEach((list) => {
        const key = `jnb-checklist-${list.dataset.blogChecklist}`;
        const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
        const bar = list.querySelector('.blog-checklist-bar span');
        const count = list.querySelector('[data-count]');
        const done = list.querySelector('.blog-checklist-done');
        const reset = list.querySelector('.blog-checklist-reset');

        const save = () => {
            try {
                localStorage.setItem(key, JSON.stringify(boxes.filter((b) => b.checked).map((b) => b.value)));
            } catch (e) { /* sin almacenamiento: no se guarda */ }
        };
        const load = () => {
            try {
                const saved = JSON.parse(localStorage.getItem(key) || '[]');
                boxes.forEach((b) => { b.checked = saved.includes(b.value); });
            } catch (e) { /* sin almacenamiento: empieza vacía */ }
        };
        const render = () => {
            const n = boxes.filter((b) => b.checked).length;
            const pct = Math.round((n / boxes.length) * 100);
            bar.style.width = `${pct}%`;
            bar.parentElement.setAttribute('aria-valuenow', String(pct));
            count.textContent = `${n} de ${boxes.length}`;
            done.hidden = n !== boxes.length;
        };

        boxes.forEach((b) => b.addEventListener('change', () => { save(); render(); }));
        reset.addEventListener('click', () => {
            boxes.forEach((b) => { b.checked = false; });
            save();
            render();
        });
        load();
        render();
    });
})();
