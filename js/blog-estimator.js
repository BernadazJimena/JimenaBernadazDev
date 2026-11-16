// Blog: estimador "¿Cuánto saldría tu web?". Usa los precios publicados de los planes
// (pago único) y lista aparte lo que se cotiza como adicional. Actualizar acá si cambian los precios.
(() => {
    const PLANS = {
        landing: { name: 'Plan Básico · Landing page', price: 179990, days: 10, url: '/planes/#basico' },
        web: { name: 'Plan Premium · Web a medida', price: 269990, days: 15, url: '/planes/#premium' },
        tienda: { name: 'Plan Emprendedor · Tienda online', price: 94990, days: 7, url: '/planes/#emprendedor' },
    };
    const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    document.querySelectorAll('[data-blog-estimator]').forEach((box) => {
        const form = box.querySelector('form');
        const extras = [...box.querySelectorAll('[data-for]')];
        const result = box.querySelector('.blog-estimator-result');

        const render = () => {
            const type = form.elements.tipo.value;
            const plan = PLANS[type];

            // Solo se muestran los adicionales que corresponden al tipo elegido
            extras.forEach((el) => {
                const show = el.dataset.for.split(' ').includes(type);
                el.hidden = !show;
                if (!show) el.querySelector('input').checked = false;
            });
            if (!plan) { result.hidden = true; return; }

            const chosen = extras.filter((el) => !el.hidden && el.querySelector('input').checked);
            const quoted = chosen.filter((el) => el.dataset.kind === 'quote').map((el) => el.dataset.label);
            const included = chosen.filter((el) => el.dataset.kind === 'included').map((el) => el.dataset.label);

            result.querySelector('[data-plan]').textContent = plan.name;
            result.querySelector('[data-price]').textContent = money.format(plan.price);
            result.querySelector('[data-days]').textContent = `${plan.days} días hábiles`;
            result.querySelector('[data-plan-link]').href = plan.url;

            const fill = (selector, items) => {
                const wrap = result.querySelector(selector);
                const list = wrap.querySelector('ul');
                list.innerHTML = '';
                items.forEach((text) => {
                    const li = document.createElement('li');
                    li.textContent = text;
                    list.append(li);
                });
                wrap.hidden = items.length === 0;
            };
            fill('[data-included]', included);
            fill('[data-quoted]', quoted);

            result.querySelectorAll('[data-only]').forEach((el) => {
                el.hidden = !el.dataset.only.split(' ').includes(type);
            });
            result.hidden = false;
        };

        form.addEventListener('change', render);
        form.addEventListener('submit', (e) => e.preventDefault());
        render();
    });
})();
