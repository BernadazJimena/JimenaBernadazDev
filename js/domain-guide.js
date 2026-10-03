// Guía del dominio: pasos para tildar y botones "Ver los pasos"
(() => {
    // Guía del dominio: pasos para tildar, con progreso guardado en este navegador
    document.querySelectorAll('.domain-steps').forEach((list) => {
        const key = `jnb-domain-${document.documentElement.lang}-${list.dataset.site}`;
        const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
        const panel = list.closest('.legal-panel');
        const progress = panel.querySelector('.domain-progress');

        const update = () => {
            const done = boxes.filter((box) => box.checked).length;
            progress.textContent = progress.dataset.template.replace('{done}', done).replace('{total}', boxes.length);
            try {
                localStorage.setItem(key, JSON.stringify(boxes.map((box) => box.checked)));
            } catch (error) {
                /* sin almacenamiento disponible: el progreso no se guarda */
            }
        };

        try {
            JSON.parse(localStorage.getItem(key) || '[]').forEach((checked, index) => {
                if (boxes[index]) boxes[index].checked = Boolean(checked);
            });
        } catch (error) {
            /* sin almacenamiento disponible */
        }

        boxes.forEach((box) => box.addEventListener('change', update));
        panel.querySelector('.domain-reset')?.addEventListener('click', () => {
            boxes.forEach((box) => { box.checked = false; });
            update();
        });
        update();
    });

    // Tarjetas de la guía: el botón "Ver los pasos" abre el desplegable correspondiente
    document.querySelectorAll('.domain-card-link').forEach((link) => {
        link.addEventListener('click', () => {
            const target = document.getElementById(link.getAttribute('href').slice(1));
            if (target) target.open = true;
        });
    });
})();
