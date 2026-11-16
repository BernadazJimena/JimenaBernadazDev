// Precios del estudio y cotización del dólar: TODO se cambia acá (planes, adicionales y la cotización).
// Los dólares no se escriben a mano: salen de dividir el precio en pesos por la cotización del dólar MEP vendedor,
// redondeados a dólares enteros (desde ,50 sube al siguiente: 113,85 → 114). Las páginas muestran estos valores (las cifras escritas en el HTML son solo de respaldo).
(() => {
    const RATE = {
        mep: 1580.90,                      // dólar MEP (bolsa) vendedor, en pesos
        date: '2026-11-15',                // fecha de la cotización
        source: 'DolarApi (dolarapi.com/v1/dolares/bolsa), confirmada con ArgentinaDatos',
    };

    // Precios en pesos argentinos
    const ARS = {
        // Planes
        medida: 74990,          // Plan a medida: estructura web mínima (precio base)
        emprendedor: 94990,
        basico: 179990,
        premium: 269990,
        // Adicionales
        products: 14990,        // productos extra en la tienda: desde (cada 10 productos)
        products51: 11990,      // PENDIENTE DE APROBACIÓN: cada 10 productos a partir del 51 (antes $7.990, ajustado en la misma proporción)
        second: 55990,          // tienda también en la otra plataforma
        map: 5990,              // ubicación con mapa
        agenda: 5990,           // botón de agenda de turnos
        hours: 12990,           // indicador abierto / cerrado
        section: 16990,         // sección extra
        support: 20990,         // soporte por mes (aparte, sin permanencia)
        // Sin cambios en esta actualización (pendientes de revisión: ver el informe)
        page: 34990,            // página secundaria de hasta 3 secciones
        dark: 17990,            // modo claro / oscuro
        storeAddOn: 49990,      // tienda sumada a una web
    };
    const URGENT = 0.3;         // entrega urgente: +30 % sobre el total

    // Trabajos fuera del alcance (rondas extra, horas, cambios de alcance): cómo se cobran.
    // mode: 'round' (por ronda), 'hour' (por hora) o 'quote' (presupuesto según complejidad). Sin precio aprobado = "A cotizar".
    const EXTRA_WORK = { mode: 'quote', round: null, hour: null };

    const usd = (ars) => Math.round(ars / RATE.mep);
    const fmtArs = (n) => `$${Math.round(n).toLocaleString('es-AR')}`;
    const fmtUsd = (n, lang) => (lang === 'es'
        ? `USD ${n.toLocaleString('es-AR')}`
        : `$${n.toLocaleString('en-US')}`);

    window.JNBPricing = { RATE, ARS, URGENT, EXTRA_WORK, usd, fmtArs, fmtUsd };

    // Precios de los planes en las páginas: <span data-ars="basico"> y <span data-usd="basico">
    const fill = () => {
        const lang = (document.documentElement.lang || 'es').slice(0, 2);
        document.querySelectorAll('[data-ars]').forEach((el) => {
            const value = ARS[el.dataset.ars];
            if (value) el.textContent = fmtArs(value);
        });
        // Cotización usada para los dólares
        const day = RATE.date.split('-').reverse().join('/');
        const rateText = {
            es: `Dólares calculados con el dólar MEP vendedor: $${RATE.mep.toLocaleString('es-AR', { minimumFractionDigits: 2 })} (${day}).`,
            en: `USD prices use the Argentine MEP dollar (sell) rate: ARS ${RATE.mep.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${day}).`,
            pt: `Valores em dólares calculados com o dólar MEP de venda: ARS ${RATE.mep.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${day}).`,
        };
        document.querySelectorAll('[data-rate]').forEach((el) => { el.textContent = rateText[lang] || rateText.es; });
        document.querySelectorAll('[data-usd]').forEach((el) => {
            const value = ARS[el.dataset.usd];
            if (value) el.textContent = fmtUsd(usd(value), lang);
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
    else fill();
})();
