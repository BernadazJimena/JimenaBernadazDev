/* Copia completa cifrada del panel (JNB Workspace).
   Cifra y descifra EN EL NAVEGADOR con Web Crypto: la frase nunca se manda al servidor ni se guarda.
   Formato "jnb-completa-cifrada" versión 1:
     - Clave: PBKDF2-SHA-256, 600.000 iteraciones, salt aleatorio de 16 bytes → clave AES de 256 bits.
     - Cifrado: AES-256-GCM, IV aleatorio de 12 bytes, etiqueta de 128 bits.
     - Los metadatos (formato, versión, parámetros, salt, IV) van como "datos asociados": si alguien los cambia, no descifra.
   El descifrador independiente (tools/descifrar-copia.html) implementa lo mismo sin depender del panel. */
(function (root) {
  'use strict';
  var FORMAT = 'jnb-completa-cifrada';
  var VERSION = 1;
  var ITERATIONS = 600000;
  var SALT_BYTES = 16;
  var IV_BYTES = 12;
  var MIN_PHRASE = 12;

  var subtle = root.crypto && root.crypto.subtle;
  var enc = new TextEncoder();
  var dec = new TextDecoder('utf-8', { fatal: true });

  function toB64(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function fromB64(text) {
    if (typeof text !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4) throw new Error('base64');
    var s = atob(text);
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  // Encabezado en un orden fijo: lo que se autentica junto con los datos
  function header(file) {
    return JSON.stringify({
      formato: file.formato, version: file.version,
      kdf: { nombre: file.kdf.nombre, hash: file.kdf.hash, iteraciones: file.kdf.iteraciones, salt: file.kdf.salt },
      cifrado: { nombre: file.cifrado.nombre, largoClave: file.cifrado.largoClave, iv: file.cifrado.iv, etiquetaBits: file.cifrado.etiquetaBits },
      contenido: { tipo: file.contenido.tipo, creada: file.contenido.creada },
    });
  }
  function deriveKey(phrase, salt, iterations, usage) {
    return subtle.importKey('raw', enc.encode(phrase.normalize('NFC')), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iterations }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
    });
  }

  // Cifra el texto JSON de la copia completa. Devuelve el objeto del archivo (listo para JSON.stringify).
  function encryptBackup(plainJson, phrase) {
    if (!subtle) return Promise.reject(new Error('sin-webcrypto'));
    if (typeof phrase !== 'string' || phrase.length < MIN_PHRASE) return Promise.reject(new Error('frase-corta'));
    var parsed;
    try { parsed = JSON.parse(plainJson); } catch (e) { return Promise.reject(new Error('copia-invalida')); }
    if (!parsed || parsed.formato !== 'jnb-completa' || typeof parsed.tables !== 'object') return Promise.reject(new Error('copia-invalida'));
    var salt = root.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    var iv = root.crypto.getRandomValues(new Uint8Array(IV_BYTES));
    var file = {
      formato: FORMAT, version: VERSION,
      kdf: { nombre: 'PBKDF2', hash: 'SHA-256', iteraciones: ITERATIONS, salt: toB64(salt) },
      cifrado: { nombre: 'AES-GCM', largoClave: 256, iv: toB64(iv), etiquetaBits: 128 },
      contenido: { tipo: 'application/json', creada: String(parsed.created || '') },
      datos: '',
    };
    return deriveKey(phrase, salt, ITERATIONS, 'encrypt').then(function (key) {
      return subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: enc.encode(header(file)), tagLength: 128 }, key, enc.encode(plainJson));
    }).then(function (cipher) {
      file.datos = toB64(new Uint8Array(cipher));
      return file;
    });
  }

  // Revisa el archivo antes de pedir la frase. Lanza un Error con un código si algo no corresponde.
  function checkFile(file) {
    if (!file || typeof file !== 'object') throw new Error('no-es-copia');
    if (file.formato !== FORMAT) throw new Error('no-es-copia');
    if (file.version !== VERSION) throw new Error('version-desconocida');
    var k = file.kdf || {}; var c = file.cifrado || {};
    if (k.nombre !== 'PBKDF2' || k.hash !== 'SHA-256' || !Number.isInteger(k.iteraciones) || k.iteraciones < ITERATIONS || k.iteraciones > 10000000) throw new Error('parametros');
    if (c.nombre !== 'AES-GCM' || c.largoClave !== 256 || c.etiquetaBits !== 128) throw new Error('parametros');
    if (!file.contenido || typeof file.contenido.tipo !== 'string') throw new Error('incompleto');
    var salt = fromB64(k.salt); var iv = fromB64(c.iv); var data = fromB64(file.datos);
    if (salt.length < SALT_BYTES || iv.length !== IV_BYTES) throw new Error('parametros');
    if (data.length < 17) throw new Error('incompleto');
    return { salt: salt, iv: iv, data: data };
  }

  // Descifra un archivo (objeto ya leído con JSON.parse). Devuelve el texto JSON de la copia completa.
  function decryptBackup(file, phrase) {
    if (!subtle) return Promise.reject(new Error('sin-webcrypto'));
    var parts;
    try { parts = checkFile(file); } catch (e) { return Promise.reject(e); }
    return deriveKey(String(phrase || ''), parts.salt, file.kdf.iteraciones, 'decrypt').then(function (key) {
      return subtle.decrypt({ name: 'AES-GCM', iv: parts.iv, additionalData: enc.encode(header(file)), tagLength: 128 }, key, parts.data);
    }).then(function (plain) {
      return dec.decode(new Uint8Array(plain));
    }, function () {
      // AES-GCM no distingue: frase incorrecta o archivo alterado dan el mismo error
      throw new Error('frase-o-alterado');
    });
  }

  root.JNBCopiaCifrada = { FORMAT: FORMAT, VERSION: VERSION, ITERATIONS: ITERATIONS, MIN_PHRASE: MIN_PHRASE, encryptBackup: encryptBackup, decryptBackup: decryptBackup, checkFile: checkFile };
})(typeof window !== 'undefined' ? window : globalThis);
