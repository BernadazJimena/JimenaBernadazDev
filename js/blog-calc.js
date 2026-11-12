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
        const summary = calc.querySelector('.blog-calc-summary');

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

            // Costo de cada plan con lo que eligió (null = no disponible)
            const totals = PLANS.map((plan) => {
                if (plan.pagoNubeOnly && !pagoNube) return null;
                const fee = plan.annualDiscount && annual ? Math.round(plan.fee * ANNUAL) : plan.fee;
                const rate = pagoNube || plan.rate === null ? 0 : plan.rate;
                return { plan, fee, rate, total: fee + Math.round(sales * rate) };
            });
            const available = totals.filter(Boolean);
            const cheapest = available.reduce((a, b) => (b.total < a.total ? b : a));
            const tiendanube = available.filter((t) => t.plan.name.startsWith('Tiendanube'));
            const bestTn = tiendanube.reduce((a, b) => (b.total < a.total ? b : a));
            const empretienda = available.find((t) => t.plan.name === 'Empretienda');
            const shortName = (t) => t.plan.name.replace('Tiendanube · ', 'el plan ');

            if (summary) {
                if (!sales) {
                    summary.innerHTML = '<p>Escribí cuánto vendés (o pensás vender) por mes y tocá <strong>Calcular</strong>.</p>';
                } else {
                    const strong = (text) => `<strong>${text}</strong>`;
                    const lines = [];
                    lines.push(`Con ventas de ${strong(money.format(sales))} por mes, lo que menos te cobra la plataforma es ${strong(`${cheapest.plan.name}: ${money.format(cheapest.total)} por mes`)}${cheapest.plan.fee === 0 ? ' (sin abono; pagás solo la comisión de Pago Nube)' : ''}.`);
                    const other = cheapest === empretienda ? bestTn : empretienda;
                    const diff = other.total - cheapest.total;
                    lines.push(cheapest === empretienda
                        ? `En Tiendanube, lo más económico para vos sería ${shortName(other)}: ${money.format(other.total)} por mes, ${strong(money.format(diff))} más (${money.format(diff * 12)} al año).`
                        : `Empretienda te costaría ${money.format(other.total)} por mes, ${strong(money.format(diff))} más (${money.format(diff * 12)} al año).`);
                    // ¿Desde qué nivel de ventas le conviene el plan siguiente de Tiendanube?
                    if (!pagoNube) {
                        const next = tiendanube.filter((t) => t.rate < bestTn.rate && t.fee > bestTn.fee)
                            .map((t) => ({ t, at: Math.ceil((t.fee - bestTn.fee) / (bestTn.rate - t.rate)) }))
                            .sort((a, b) => a.at - b.at)[0];
                        if (next) lines.push(`Dato: si vendieras más de ${money.format(next.at)} por mes, en Tiendanube ${shortName(next.t)} pasaría a cobrarte menos que ${shortName(bestTn)}.`);
                    }
                    summary.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
                }
            }

            body.innerHTML = '';
            PLANS.forEach((plan, index) => {
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
                if (sales && totals[index] === cheapest) {
                    row.classList.add('is-cheapest');
                    row.querySelector('th').insertAdjacentHTML('beforeend', ' <span class="blog-calc-badge">Lo más económico</span>');
                }
                body.append(row);
            });
        };

        salesInput.addEventListener('input', () => { formatInput(); render(); });
        form.addEventListener('change', render);
        // "Calcular": rehace la cuenta y lleva a la conclusión
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            formatInput();
            render();
            if (!summary) return;
            summary.classList.remove('is-updated');
            void summary.offsetWidth; // reinicia la animación
            summary.classList.add('is-updated');
            summary.focus({ preventScroll: true });
            summary.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
        });
        render();
    });
})();
