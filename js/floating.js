// Botones flotantes: WhatsApp (se oculta en Contacto) e Inicio (se oculta arriba y en el pie)
(() => {
    const contactSection = document.querySelector('#contacto');
    const whatsappFloat = document.querySelector('.whatsapp-float');
    const footer = document.querySelector('.site-footer');
    const topFloat = document.querySelector('.top-float');

    if (contactSection && whatsappFloat) {
        const contactObserver = new IntersectionObserver(([entry]) => {
            whatsappFloat.classList.toggle('is-hidden', entry.isIntersecting);
        }, { threshold: 0.2 });

        contactObserver.observe(contactSection);
    }

    const heroSection = document.querySelector('.hero, .legal-hero');
    // En términos el botón aparece recién cuando el encabezado sale de pantalla
    const heroHideRatio = heroSection?.classList.contains('legal-hero') ? 0 : 0.25;

    if (topFloat) {
        // El botón "Inicio" se oculta en la sección de inicio y en el footer
        let isHeroVisible = false;
        let isFooterVisible = false;
        const updateTopFloat = () => {
            topFloat.classList.toggle('is-hidden', isHeroVisible || isFooterVisible);
        };

        if (heroSection) {
            new IntersectionObserver(([entry]) => {
                isHeroVisible = heroHideRatio === 0
                    ? entry.isIntersecting
                    : entry.intersectionRatio >= heroHideRatio;
                updateTopFloat();
            }, { threshold: [0, 0.25] }).observe(heroSection);
        }

        if (footer) {
            new IntersectionObserver(([entry]) => {
                isFooterVisible = entry.isIntersecting;
                updateTopFloat();
            }, { threshold: 0.1 }).observe(footer);
        }
    }
})();
