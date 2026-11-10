// Mail de confirmación que recibe quien escribe por el formulario o pide un presupuesto.
// Estilos en línea y tabla simple: así se ve bien en Gmail, Outlook y el celular. Colores de la paleta del sitio.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

const TEXTS = {
  es: {
    subjectConsulta: 'Recibí tu consulta',
    subjectPresupuesto: 'Recibí tu pedido de presupuesto',
    hello: (name) => `Hola ${name}:`,
    introConsulta: '¡Gracias por escribirme! Recibí tu consulta y te respondo a la brevedad.',
    introPresupuesto: '¡Gracias por tu pedido! Ya estoy mirando lo que necesitás y te mando el presupuesto dentro de las 24 horas hábiles.',
    code: 'Número de consulta',
    sent: 'Lo que me enviaste',
    button: 'Ver tu pedido',
    linkHint: 'En ese link vas a ver tu presupuesto apenas esté listo. Guardalo para volver cuando quieras.',
    reply: 'Si querés sumar algo, respondé este mail y me llega directamente.',
    sign: 'Jimena Bernadaz',
    footer: 'Recibiste este mail porque escribiste desde jnbcreativestudio.com.ar.',
  },
  en: {
    subjectConsulta: 'I received your message',
    subjectPresupuesto: 'I received your quote request',
    hello: (name) => `Hi ${name},`,
    introConsulta: 'Thank you for writing! I received your message and will get back to you soon.',
    introPresupuesto: 'Thank you for your request! I am already looking at what you need and will send you a quote within 24 business hours.',
    code: 'Reference number',
    sent: 'What you sent me',
    button: 'View your request',
    linkHint: 'You will see your quote at that link as soon as it is ready. Save it to come back anytime.',
    reply: 'If you want to add anything, just reply to this email and it will reach me directly.',
    sign: 'Jimena Bernadaz',
    footer: 'You received this email because you wrote from jnbcreativestudio.com.ar.',
  },
  pt: {
    subjectConsulta: 'Recebi sua mensagem',
    subjectPresupuesto: 'Recebi seu pedido de orçamento',
    hello: (name) => `Olá, ${name}!`,
    introConsulta: 'Obrigada por escrever! Recebi sua mensagem e respondo em breve.',
    introPresupuesto: 'Obrigada pelo seu pedido! Já estou vendo o que você precisa e envio o orçamento em até 24 horas úteis.',
    code: 'Número de referência',
    sent: 'O que você me enviou',
    button: 'Ver seu pedido',
    linkHint: 'Nesse link você vai ver seu orçamento assim que estiver pronto. Guarde para voltar quando quiser.',
    reply: 'Se quiser acrescentar algo, é só responder este e-mail que ele chega direto para mim.',
    sign: 'Jimena Bernadaz',
    footer: 'Você recebeu este e-mail porque escreveu pelo site jnbcreativestudio.com.ar.',
  },
};

export function confirmationMail(inquiry, link) {
  const t = TEXTS[inquiry.lang] || TEXTS.es;
  const isQuote = inquiry.kind === 'presupuesto';
  const firstName = inquiry.name.split(' ')[0];
  const subject = `${isQuote ? t.subjectPresupuesto : t.subjectConsulta} · ${inquiry.code}`;
  const intro = isQuote ? t.introPresupuesto : t.introConsulta;
  const message = esc(inquiry.message).replace(/\n/g, '<br>');

  const html = `<!doctype html>
<html lang="${esc(inquiry.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3ebf6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ebf6;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ecdff4;border:1px solid #d9c6e8;border-radius:20px;font-family:Manrope,'Segoe UI',Arial,sans-serif;color:#211632;">
    <tr><td style="padding:28px 28px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#24185a;color:#f3ebf6;font-weight:800;font-size:13px;letter-spacing:.5px;border-radius:8px;padding:8px 9px;">JNB</td>
        <td style="padding-left:10px;font-weight:800;font-size:16px;color:#211632;">Creative Studio</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:16px 28px 0;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 12px;font-weight:700;">${esc(t.hello(firstName))}</p>
      <p style="margin:0 0 20px;">${esc(intro)}</p>
    </td></tr>
    <tr><td style="padding:0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e2d0f0;border-radius:14px;">
        <tr><td style="padding:14px 18px;font-size:13px;color:#625970;">${esc(t.code)}</td>
            <td align="right" style="padding:14px 18px;font-size:16px;font-weight:800;color:#5d31b8;letter-spacing:.5px;">${esc(inquiry.code)}</td></tr>
      </table>
    </td></tr>
    ${link ? `<tr><td style="padding:22px 28px 0;">
      <a href="${esc(link)}" style="display:inline-block;background:#7543d6;color:#f3ebf6;text-decoration:none;font-weight:800;font-size:15px;border-radius:999px;padding:13px 24px;">${esc(t.button)} →</a>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#625970;">${esc(t.linkHint)}</p>
    </td></tr>` : ''}
    <tr><td style="padding:24px 28px 0;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#7543d6;">${esc(t.sent)}</p>
      <div style="border-left:3px solid #c9b2de;padding:2px 0 2px 14px;font-size:15px;line-height:1.6;color:#46385f;">${message}</div>
    </td></tr>
    <tr><td style="padding:24px 28px 28px;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 16px;">${esc(t.reply)}</p>
      <p style="margin:0;font-weight:800;">${esc(t.sign)}</p>
      <p style="margin:0;color:#625970;"><a href="https://jnbcreativestudio.com.ar" style="color:#5d31b8;text-decoration:none;">JNB Creative Studio</a></p>
    </td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#625970;">${esc(t.footer)}</p>
</td></tr>
</table>
</body></html>`;

  const plain = [
    t.hello(firstName), '', intro, '', `${t.code}: ${inquiry.code}`,
    ...(link ? ['', `${t.button}: ${link}`, t.linkHint] : []),
    '', `${t.sent}:`, inquiry.message, '', t.reply, '', t.sign, 'JNB Creative Studio · https://jnbcreativestudio.com.ar',
  ].join('\n');

  return { subject, html, text: plain };
}

// ---- Mails del brief

// Marco común: logo, contenido y firma, con los colores del sitio
const frame = (lang, title, inner, footer) => `<!doctype html>
<html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3ebf6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ebf6;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ecdff4;border:1px solid #d9c6e8;border-radius:20px;font-family:Manrope,'Segoe UI',Arial,sans-serif;color:#211632;">
    <tr><td style="padding:28px 28px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#24185a;color:#f3ebf6;font-weight:800;font-size:13px;letter-spacing:.5px;border-radius:8px;padding:8px 9px;">JNB</td>
        <td style="padding-left:10px;font-weight:800;font-size:16px;color:#211632;">Creative Studio</td>
      </tr></table>
    </td></tr>
    ${inner}
  </table>
  ${footer ? `<p style="max-width:560px;margin:16px auto 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#625970;">${esc(footer)}</p>` : ''}
</td></tr>
</table>
</body></html>`;

const BRIEF_INVITE = {
  es: {
    subject: '¡Empezamos! Contame sobre tu proyecto',
    hello: (name) => `Hola ${name}:`,
    intro: '¡Gracias por confirmar el presupuesto! Ya reservé tu lugar en mi agenda.',
    ask: 'Para empezar, necesito que completes el brief: unas preguntas sobre tu negocio, tu marca y lo que querés lograr. Están pensadas para tu plan, y ahí mismo podés subir tu logo, tus fotos y tus textos.',
    time: 'Te lleva entre 10 y 15 minutos, y podés guardarlo y seguir otro día.',
    button: 'Completar el brief',
    track: 'En ese mismo link vas a poder seguir el avance de tu proyecto.',
    sign: 'Jimena Bernadaz',
    footer: 'Recibiste este mail porque aceptaste un presupuesto de jnbcreativestudio.com.ar.',
  },
  en: {
    subject: 'Let’s get started! Tell me about your project',
    hello: (name) => `Hi ${name},`,
    intro: 'Thank you for confirming the quote! Your spot in my schedule is booked.',
    ask: 'To get started, I need you to fill in the brief: a few questions about your business, your brand and what you want to achieve. They are tailored to your plan, and you can upload your logo, photos and texts right there.',
    time: 'It takes 10 to 15 minutes, and you can save it and continue another day.',
    button: 'Fill in the brief',
    track: 'At that same link you can follow your project.',
    sign: 'Jimena Bernadaz',
    footer: 'You received this email because you accepted a quote from jnbcreativestudio.com.ar.',
  },
  pt: {
    subject: 'Vamos começar! Me conte sobre o seu projeto',
    hello: (name) => `Olá, ${name}!`,
    intro: 'Obrigada por confirmar o orçamento! Seu lugar na minha agenda está reservado.',
    ask: 'Para começar, preciso que você preencha o briefing: algumas perguntas sobre o seu negócio, a sua marca e o que você quer alcançar. Elas são pensadas para o seu plano, e ali mesmo você pode enviar seu logo, suas fotos e seus textos.',
    time: 'Leva de 10 a 15 minutos, e você pode salvar e continuar outro dia.',
    button: 'Preencher o briefing',
    track: 'Nesse mesmo link você pode acompanhar o seu projeto.',
    sign: 'Jimena Bernadaz',
    footer: 'Você recebeu este e-mail porque aceitou um orçamento de jnbcreativestudio.com.ar.',
  },
};

// Al cliente, cuando acepta el presupuesto: link para completar el brief de su plan
export function briefInviteMail({ lang, name, link }) {
  const t = BRIEF_INVITE[lang] || BRIEF_INVITE.es;
  const first = String(name || '').split(' ')[0];
  const inner = `
    <tr><td style="padding:16px 28px 0;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 12px;font-weight:700;">${esc(t.hello(first))}</p>
      <p style="margin:0 0 12px;">${esc(t.intro)}</p>
      <p style="margin:0 0 12px;">${esc(t.ask)}</p>
      <p style="margin:0 0 20px;color:#625970;">${esc(t.time)}</p>
    </td></tr>
    <tr><td style="padding:0 28px;">
      <a href="${esc(link)}" style="display:inline-block;background:#7543d6;color:#f3ebf6;text-decoration:none;font-weight:800;font-size:15px;border-radius:999px;padding:13px 24px;">${esc(t.button)} →</a>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#625970;">${esc(t.track)}</p>
    </td></tr>
    <tr><td style="padding:24px 28px 28px;font-size:15px;line-height:1.6;">
      <p style="margin:0;font-weight:800;">${esc(t.sign)}</p>
      <p style="margin:0;"><a href="https://jnbcreativestudio.com.ar" style="color:#5d31b8;text-decoration:none;">JNB Creative Studio</a></p>
    </td></tr>`;
  const plain = [t.hello(first), '', t.intro, '', t.ask, t.time, '', `${t.button}: ${link}`, t.track, '', t.sign, 'JNB Creative Studio'].join('\n');
  return { subject: t.subject, html: frame(lang, t.subject, inner, t.footer), text: plain };
}

// A Jimena, cuando un cliente envía su brief: resumen de las respuestas y link al panel
export function briefReceivedMail({ client, code, planText, summary, panel, edited, changes }) {
  const subject = `${edited ? 'Brief editado' : 'Brief recibido'} · ${client}${code ? ` · ${code}` : ''}`;
  let section = '';
  const rows = (summary || []).map((row) => {
    const head = row.s && row.s !== section ? `<p style="margin:18px 0 6px;font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#7543d6;">${esc(row.s)}</p>` : '';
    section = row.s || section;
    return `${head}<p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#46385f;">${esc(row.q)}</p>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.5;white-space:pre-line;">${esc(row.a)}</p>`;
  }).join('');
  const inner = `
    <tr><td style="padding:16px 28px 0;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 6px;font-weight:800;">${esc(client)} ${edited ? 'editó su brief y te mandó los cambios.' : 'envió su brief.'}</p>
      <p style="margin:0 0 16px;color:#625970;">${esc(planText || '')}</p>
      <a href="${esc(panel)}" style="display:inline-block;background:#7543d6;color:#f3ebf6;text-decoration:none;font-weight:800;font-size:15px;border-radius:999px;padding:12px 22px;">Ver el brief y los archivos en el panel →</a>
    </td></tr>
    ${edited && changes && changes.length ? `<tr><td style="padding:16px 28px 0;"><p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:#9a5b00;">Lo que cambió</p>${changesHtml(changes, { removed: '(respuesta quitada)' })}</td></tr>` : ''}
    <tr><td style="padding:12px 28px 28px;">${rows}</td></tr>`;
  const plain = [`${client} envió su brief.`, planText || '', `Panel: ${panel}`, '', ...(summary || []).map((row) => `${row.q}\n${row.a}\n`)].join('\n');
  return { subject, html: frame('es', subject, inner, ''), text: plain };
}

// Lista de cambios (antes → ahora), con los colores del sitio. La usan los dos mails de brief actualizado.
const changesHtml = (changes, t) => (changes || []).map((c) => `
      <div style="margin:0 0 12px;padding:10px 12px;background:#e2d0f0;border-radius:12px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#46385f;">${esc(c.q)}</p>
        ${c.before ? `<p style="margin:0 0 4px;font-size:14px;line-height:1.5;color:#625970;text-decoration:line-through;white-space:pre-line;">${esc(c.before)}</p>` : ''}
        <p style="margin:0;font-size:15px;line-height:1.5;color:#211632;white-space:pre-line;">${c.after ? esc(c.after) : `<em style="color:#625970;">${esc(t.removed)}</em>`}</p>
      </div>`).join('');

const BRIEF_UPDATED = {
  es: { subject: 'Actualizaste tu brief', hello: (n) => `Hola ${n}:`, intro: 'Recibí los cambios de tu brief. Te dejo una copia de lo que modificaste:', removed: '(respuesta quitada)', button: 'Ver mi brief', sign: 'Jimena Bernadaz', footer: 'Recibiste este mail porque actualizaste tu brief en jnbcreativestudio.com.ar.' },
  en: { subject: 'You updated your brief', hello: (n) => `Hi ${n},`, intro: 'I received the changes to your brief. Here is a copy of what you changed:', removed: '(answer removed)', button: 'See my brief', sign: 'Jimena Bernadaz', footer: 'You received this email because you updated your brief on jnbcreativestudio.com.ar.' },
  pt: { subject: 'Você atualizou o seu briefing', hello: (n) => `Olá, ${n}!`, intro: 'Recebi as alterações do seu briefing. Aqui vai uma cópia do que você mudou:', removed: '(resposta removida)', button: 'Ver meu briefing', sign: 'Jimena Bernadaz', footer: 'Você recebeu este e-mail porque atualizou o seu briefing em jnbcreativestudio.com.ar.' },
};

// Al cliente, cuando reenvía su brief con cambios: copia de lo que modificó
export function briefUpdatedMail({ lang, name, changes, link }) {
  const t = BRIEF_UPDATED[lang] || BRIEF_UPDATED.es;
  const first = String(name || '').split(' ')[0];
  const inner = `
    <tr><td style="padding:16px 28px 0;font-size:16px;line-height:1.6;">
      <p style="margin:0 0 12px;font-weight:700;">${esc(t.hello(first))}</p>
      <p style="margin:0 0 16px;">${esc(t.intro)}</p>
    </td></tr>
    <tr><td style="padding:0 28px;">${changesHtml(changes, t)}</td></tr>
    <tr><td style="padding:8px 28px 0;">
      <a href="${esc(link)}" style="display:inline-block;background:#7543d6;color:#f3ebf6;text-decoration:none;font-weight:800;font-size:15px;border-radius:999px;padding:13px 24px;">${esc(t.button)} →</a>
    </td></tr>
    <tr><td style="padding:24px 28px 28px;font-size:15px;line-height:1.6;">
      <p style="margin:0;font-weight:800;">${esc(t.sign)}</p>
      <p style="margin:0;"><a href="https://jnbcreativestudio.com.ar" style="color:#5d31b8;text-decoration:none;">JNB Creative Studio</a></p>
    </td></tr>`;
  const plain = [t.hello(first), '', t.intro, '', ...(changes || []).map((c) => `${c.q}\n${c.before ? `- ${c.before}\n` : ''}+ ${c.after || t.removed}\n`), `${t.button}: ${link}`, '', t.sign].join('\n');
  return { subject: t.subject, html: frame(lang, t.subject, inner, t.footer), text: plain };
}
