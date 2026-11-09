// Blog: pregunta interactiva "Probalo con tu caso". Al elegir una respuesta muestra qué opción conviene
(() => {
    document.querySelectorAll('[data-blog-quiz]').forEach((quiz) => {
        const options = [...quiz.querySelectorAll('.blog-quiz-option')];
        const answers = [...quiz.querySelectorAll('.blog-quiz-answer')];

        options.forEach((option) => {
            option.addEventListener('click', () => {
                const pick = option.dataset.answer;
                options.forEach((o) => o.setAttribute('aria-pressed', String(o === option)));
                answers.forEach((a) => { a.hidden = a.dataset.result !== pick; });
            });
        });
    });
})();
