// Blog: preguntas interactivas dentro de los artículos ("Probalo con tu caso").
// Cada botón lleva a otra pregunta (data-next) o muestra una recomendación (data-answer).
(() => {
    document.querySelectorAll('[data-blog-quiz]').forEach((quiz) => {
        const steps = [...quiz.querySelectorAll('.blog-quiz-step')];
        const answers = [...quiz.querySelectorAll('.blog-quiz-answer')];

        const reset = (step) => {
            step.querySelectorAll('.blog-quiz-option').forEach((o) => o.setAttribute('aria-pressed', 'false'));
        };

        quiz.querySelectorAll('.blog-quiz-option').forEach((option) => {
            option.addEventListener('click', () => {
                const step = option.closest('.blog-quiz-step');
                const index = steps.indexOf(step);

                // Al cambiar una respuesta se borran las preguntas que venían después
                steps.slice(index + 1).forEach((s) => { s.hidden = true; reset(s); });
                answers.forEach((a) => { a.hidden = true; });

                reset(step || quiz);
                option.setAttribute('aria-pressed', 'true');

                const next = option.dataset.next && quiz.querySelector(`.blog-quiz-step[data-step="${option.dataset.next}"]`);
                if (next) {
                    next.hidden = false;
                } else {
                    const answer = quiz.querySelector(`.blog-quiz-answer[data-result="${option.dataset.answer}"]`);
                    if (answer) answer.hidden = false;
                }
            });
        });
    });
})();
