// Feriados y días no laborables de Argentina: qué días no se trabaja y cuál es el próximo día hábil.
// La lista es local (no consulta ningún servicio), así que funciona sin conexión.
//
// CÓMO ACTUALIZARLA CADA AÑO
// 1. Abrir https://www.argentina.gob.ar/feriados y elegir el año nuevo.
//    (Los mismos datos están en https://www.argentina.gob.ar/sites/default/files/holidays-AAAA-es.json)
// 2. Agregar el año en CALENDARIO, una línea por fecha, en orden. Si una fecha figura con más de un
//    motivo, se carga una sola vez con el tipo más fuerte (feriado > turístico > no laborable).
// 3. Cambiar CUBIERTO_HASTA por el último día que confirma el calendario oficial.
// Si queda una fecha mal escrita o repetida, se ignora y avisa en la consola del navegador.
(() => {
    const TIME_ZONE = 'America/Argentina/Buenos_Aires';

    // Qué tipos de día bloquean la disponibilidad de JNB
    const BLOQUEA = {
        inamovible: true,    // feriado nacional de fecha fija
        trasladable: true,   // feriado nacional que se mueve al lunes
        turistico: true,     // día no laborable con fines turísticos (puente)
        no_laborable: false, // día no laborable (festividades religiosas y conmemoraciones)
        local: false,        // feriado que rige solo en algunas provincias
    };

    // Excepciones por fecha, que mandan sobre todo lo anterior:
    // true = ese día no se trabaja, false = ese día se trabaja. Ejemplo: '2026-11-10': true
    const FECHAS_PROPIAS = {};

    // Hasta acá llega lo que publicó el calendario oficial. Más allá no se afirma nada sobre feriados.
    const CUBIERTO_HASTA = '2027-01-01';

    // Fuente: argentina.gob.ar/feriados (revisado el 12/10/2026)
    const CALENDARIO = {
        2026: [
            ['01-01', 'inamovible', 'Año Nuevo'],
            ['02-16', 'inamovible', 'Carnaval'],
            ['02-17', 'inamovible', 'Carnaval'],
            ['03-20', 'no_laborable', 'Fiesta de la Ruptura del Ayuno del Sagrado Mes de Ramadán'],
            ['03-23', 'turistico', 'Día no laborable con fines turísticos'],
            ['03-24', 'inamovible', 'Día Nacional de la Memoria por la Verdad y la Justicia'],
            ['04-02', 'inamovible', 'Día del Veterano y de los Caídos en la Guerra de Malvinas'],
            ['04-03', 'inamovible', 'Viernes Santo'],
            ['04-08', 'no_laborable', 'Últimos dos días de la Pascua Judía'],
            ['04-09', 'no_laborable', 'Últimos dos días de la Pascua Judía'],
            ['04-24', 'no_laborable', 'Día de acción por la tolerancia y el respeto entre los pueblos'],
            ['05-01', 'inamovible', 'Día del Trabajador'],
            ['05-25', 'inamovible', 'Día de la Revolución de Mayo'],
            ['05-27', 'no_laborable', 'Fiesta del Sacrificio'],
            ['06-15', 'trasladable', 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes (17/6)'],
            ['06-17', 'no_laborable', 'Año Nuevo Islámico'],
            ['06-20', 'inamovible', 'Paso a la Inmortalidad del Gral. Manuel Belgrano'],
            ['07-09', 'inamovible', 'Día de la Independencia'],
            ['07-10', 'turistico', 'Día no laborable con fines turísticos'],
            ['08-17', 'trasladable', 'Paso a la Inmortalidad del Gral. José de San Martín'],
            ['09-12', 'no_laborable', 'Año Nuevo Judío'],
            ['09-13', 'no_laborable', 'Año Nuevo Judío'],
            ['09-21', 'no_laborable', 'Día del Perdón'],
            ['10-12', 'trasladable', 'Día de la Raza'],
            ['11-09', 'inamovible', 'Visita de Su Santidad el Papa León XIV'],
            ['11-10', 'local', 'Visita del Papa León XIV (Córdoba y Ciudad de Buenos Aires)'],
            ['11-11', 'local', 'Visita del Papa León XIV (Provincia de Buenos Aires)'],
            ['11-23', 'trasladable', 'Día de la Soberanía Nacional (20/11)'],
            ['12-07', 'turistico', 'Día no laborable con fines turísticos'],
            ['12-08', 'inamovible', 'Inmaculada Concepción de María'],
            ['12-25', 'inamovible', 'Navidad'],
        ],
        2027: [
            ['01-01', 'inamovible', 'Año Nuevo'],
        ],
    };

    // Las fechas se manejan como texto 'AAAA-MM-DD' y las cuentas se hacen en UTC,
    // así la zona horaria del dispositivo no puede correr un día.
    const toUTC = (iso) => new Date(`${iso}T00:00:00Z`);
    const toISO = (date) => date.toISOString().slice(0, 10);
    const isRealDate = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso)
        && !Number.isNaN(toUTC(iso).getTime()) && toISO(toUTC(iso)) === iso;

    const days = new Map();
    Object.entries(CALENDARIO).forEach(([year, entries]) => {
        entries.forEach(([monthDay, type, name]) => {
            const iso = `${year}-${monthDay}`;
            const problem = !isRealDate(iso) ? 'la fecha no existe'
                : !(type in BLOQUEA) ? `el tipo "${type}" no existe`
                    : days.has(iso) ? 'la fecha está repetida'
                        : '';
            if (problem) {
                console.warn(`holidays.js: se ignora ${iso} (${name}): ${problem}.`);
                return;
            }
            days.set(iso, { date: iso, type, name });
        });
    });

    // Fecha y hora de este momento en Argentina, sin importar dónde esté el dispositivo
    const now = (date = new Date()) => {
        const parts = {};
        new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            hourCycle: 'h23',
            timeZone: TIME_ZONE
        }).formatToParts(date).forEach(({ type, value }) => { parts[type] = value; });
        return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
    };

    const addDays = (iso, amount) => {
        const date = toUTC(iso);
        date.setUTCDate(date.getUTCDate() + amount);
        return toISO(date);
    };

    const isWeekend = (iso) => [0, 6].includes(toUTC(iso).getUTCDay());

    // Feriado o día no laborable de esa fecha ({ date, type, name }), bloquee o no
    const getDay = (iso) => days.get(iso) || null;

    // Por qué ese día no se trabaja: 'finde', el tipo de feriado, 'propio' (excepción cargada a mano) o null si es hábil
    const blockReason = (iso) => {
        if (iso in FECHAS_PROPIAS) return FECHAS_PROPIAS[iso] ? 'propio' : null;
        if (isWeekend(iso)) return 'finde';
        const day = getDay(iso);
        return day && BLOQUEA[day.type] ? day.type : null;
    };

    const isBusinessDay = (iso) => blockReason(iso) === null;

    // Próximo día hábil después de esa fecha. Devuelve null si cae más allá de lo que cubre el calendario cargado.
    const nextBusinessDay = (iso) => {
        let next = addDays(iso, 1);
        while (!isBusinessDay(next)) next = addDays(next, 1);
        return next <= CUBIERTO_HASTA ? next : null;
    };

    if (now().date > CUBIERTO_HASTA) {
        console.warn(`holidays.js: el calendario de feriados llega hasta ${CUBIERTO_HASTA}. Falta cargar el año nuevo.`);
    }

    window.JNBHolidays = { now, getDay, blockReason, isBusinessDay, nextBusinessDay, isWeekend, addDays };
})();
