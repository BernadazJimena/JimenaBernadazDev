// Sin palabras huérfanas: une las dos últimas palabras de cada texto con un espacio que no corta línea,
// así la última línea nunca queda con una sola palabra (en celular, tablet y computadora).
// Complementa la regla text-wrap de css/base.css, que es solo una sugerencia para el navegador.
// Si al unirlas el texto se sale del borde (títulos grandes en pantallas angostas), se deja el espacio común.
(() => {
    const SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, dd, dt, td, th, label, figcaption, blockquote, summary, .eyebrow, .button, .availability-line';
    // Si las dos últimas palabras juntas son muy largas, no se unen: en cajas angostas podrían salirse del borde
    const MAX_JOINED = 24;
    const NBSP = ' ';
    const fixed = [];

    const textNodes = (el) => {
        const nodes = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) nodes.push(node);
        return nodes;
    };

    // Busca, de atrás para adelante, el último espacio que tiene una palabra (con letras o números) después.
    // Devuelve también la palabra anterior, para medir el largo de lo que queda unido.
    const lastBreak = (nodes) => {
        let tail = '';
        for (let i = nodes.length - 1; i >= 0; i--) {
            const text = nodes[i].data;
            for (let j = text.length - 1; j >= 0; j--) {
                if (/\s/.test(text[j]) && text[j] !== NBSP) {
                    if (/[\p{L}\p{N}]/u.test(tail)) {
                        const previous = text.slice(0, j).trimEnd().split(/\s+/).pop() || '';
                        return { node: nodes[i], index: j, joined: previous + tail.trim() };
                    }
                } else {
                    tail = text[j] + tail;
                }
            }
        }
        return null;
    };

    const overflows = (el) => el.scrollWidth > el.clientWidth + 1;

    // Pone el espacio pegado y, si el texto se sale del borde, vuelve al espacio común
    const apply = (item) => {
        const { el, node, index } = item;
        if (!node.isConnected || node.data[index] === undefined) return;
        node.data = node.data.slice(0, index) + NBSP + node.data.slice(index + 1);
        if (el.clientWidth > 0 && overflows(el)) {
            node.data = node.data.slice(0, index) + ' ' + node.data.slice(index + 1);
        }
    };

    const fix = (el) => {
        if (el.dataset.noOrphans === 'done') return;
        const nodes = textNodes(el);
        const wordCount = nodes.reduce((sum, n) => sum + n.data.trim().split(/\s+/).filter(Boolean).length, 0);
        if (wordCount < 3) return;

        const found = lastBreak(nodes);
        if (!found || found.joined.length > MAX_JOINED) return;

        // Un solo espacio en el corte (si había varios seguidos o saltos de línea, se quitan los demás)
        const { node } = found;
        let index = found.index;
        while (index > 0 && /\s/.test(node.data[index - 1]) && node.data[index - 1] !== NBSP) index--;
        node.data = node.data.slice(0, index) + ' ' + node.data.slice(found.index + 1);
        const item = { el, node, index };
        fixed.push(item);
        apply(item);
        el.dataset.noOrphans = 'done';
    };

    const run = (root = document) => {
        if (root !== document && root.matches(SELECTOR)) fix(root);
        root.querySelectorAll(SELECTOR).forEach(fix);
    };

    run();
    // Con la tipografía ya cargada las palabras cambian de ancho: se revisa de nuevo
    document.fonts?.ready.then(() => fixed.forEach(apply));

    // Al cambiar el ancho (girar el celular, achicar la ventana) se vuelve a revisar que nada se salga del borde
    let lastWidth = window.innerWidth;
    let timer;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        clearTimeout(timer);
        timer = setTimeout(() => fixed.forEach(apply), 150);
    });

    // Textos que otros scripts agregan después (pasos, resultados del test, mensajes)
    new MutationObserver((records) => {
        records.forEach((record) => record.addedNodes.forEach((node) => {
            if (node.nodeType === 1) run(node);
            else if (node.parentElement) {
                const block = node.parentElement.closest(SELECTOR);
                if (block) { delete block.dataset.noOrphans; fix(block); }
            }
        }));
    }).observe(document.body, { childList: true, subtree: true });
})();
