// Blog: calculadora del costo mensual de la plataforma (Tiendanube o Empretienda).
// Solo calcula lo que cobra la plataforma; la comisión del medio de pago va aparte.
// Precios publicados por cada plataforma a noviembre de 2026: actualizar acá si cambian.
(() => {
    const PLANS = [
        { name: 'Tiendanube · Inicial', fee: 0, rate: null, annualDiscount: true, pagoNubeOnly: true },
        { name: 'Tiendanube · Esencial', fee: 27999, rate: 0.02, annualDiscount: true },
        { name: 'Tiendanube · Impulso', fee: 79999, rate: 0.01, annualDiscount: true },
        { name: 'Tiendanube · Escala', fee: 244999, rate: 0.007, annualDiscount: true },
        { name: 'Empretienda', fee: 10490, rate: 0, annualDiscount: false },
    ];
    const ANNUAL = 0.75; // Tiendanube: 25% menos pagando por año

    const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    const percent = (r) => `${(r * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`;

    document.querySelectorAll('[data-blog-calc]').forEach((calc) => {
        const form = calc.querySelector('form');
        const salesInput = form.elements.ventas;
        const body = calc.querySelector('tbody');

        // Solo números; se muestran con puntos de miles mientras se escribe
        const readSales = () => Number(salesInput.value.replace(/\D/g, '')) || 0;
        const formatInput = () => {
            const n = readSales();
            salesInput.value = n ? n.toLocaleString('es-AR') : '';
        };

        const render = () => {
            const sales = readSales();
            const pagoNube = form.elements.cobro.value === 'pagonube';
            const annual = form.elements.anual.checked;

            body.innerHTML = '';
            PLANS.forEach((plan) => {
                const row = document.createElement('tr');
                const cells = [plan.name];

                if (plan.pagoNubeOnly && !pagoNube) {
                    cells.push('—', '—', 'Solo con Pago Nube');
                    row.classList.add('is-unavailable');
                } else {
                    const fee = plan.annualDiscount && annual ? Math.round(plan.fee * ANNUAL) : plan.fee;
                    const rate = pagoNube || plan.rate === null ? 0 : plan.rate;
                    const commission = Math.round(sales * rate);
                    cells.push(
                        money.format(fee),
                        rate ? `${money.format(commission)} (${percent(rate)})` : money.format(0),
                        money.format(fee + commission),
                    );
                }

                cells.forEach((text, i) => {
                    const cell = document.createElement(i === 0 ? 'th' : 'td');
                    if (i === 0) cell.scope = 'row';
                    cell.textContent = text;
                    cell.dataset.label = ['', 'Abono', 'Comisión', 'Total por mes'][i];
                    row.append(cell);
                });
                body.append(row);
            });
        };

        salesInput.addEventListener('input', () => { formatInput(); render(); });
        form.addEventListener('change', render);
        form.addEventListener('submit', (e) => e.preventDefault());
        render();
    });
})();
