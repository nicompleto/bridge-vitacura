// Rediseño: menú agrupado y la nueva portada de Inicio.
(() => {
  const {filas, lindo, nombreTorneo, verJugador, irA} = window.bv;
  const num = new Intl.NumberFormat('es-CL');
  const dec = new Intl.NumberFormat('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const pct = (v) => (v == null ? '—' : `${dec.format(v)} %`);
  const el = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; };
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PALO = {T: '♣', D: '♦', C: '♥', P: '♠', S: 'ST'};

  // ---------- menú: cinco temas, y dentro las páginas de cada uno ----------
  const GRUPOS = {
    inicio: [['inicio', 'Inicio']],
    'mi-torneo': [['mi-torneo', 'Mis manos']],
    jugadores: [['jugador', 'Perfil'], ['ranking', 'Ranking'], ['parejas', 'Parejas'], ['handicap', 'Handicap'], ['juveniles', 'Juveniles']],
    torneos: [['records', 'Historias y récords'], ['resumen', 'Resumen del año'], ['dias-semana', 'Días']],
    juego: [['estilo', 'Estilo de juego'], ['cartas', 'Juego de cartas'], ['generos', 'Mujeres y hombres']],
  };
  const grupoDe = (tab) => Object.keys(GRUPOS).find((g) => GRUPOS[g].some(([t]) => t === tab)) || 'inicio';
  const sub = document.querySelector('.nv-sub');
  const actual = () => document.querySelector('.bv-page:not([hidden])')?.id || 'inicio';
  const pintarMenu = () => {
    const tab = actual(), g = grupoDe(tab);
    document.querySelectorAll('.nv-grupo').forEach((b) => b.setAttribute('aria-current', String(b.dataset.grupo === g)));
    const paginas = GRUPOS[g];
    if (paginas.length < 2) { sub.replaceChildren(); return; }
    if (sub.dataset.grupo !== g) {
      sub.dataset.grupo = g;
      sub.replaceChildren(...paginas.map(([t, nombre]) => { const b = el('button', '', nombre); b.type = 'button'; b.dataset.ir = t; return b; }));
    }
    sub.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.ir === tab)));
  };
  const ir = (tab) => { irA(tab); window.scrollTo({top: 0, behavior: 'auto'}); };
  document.addEventListener('click', (ev) => {
    const g = ev.target.closest('.nv-grupo');
    if (g) { ir(GRUPOS[g.dataset.grupo][0][0]); return; }
    const d = ev.target.closest('[data-ir]');
    if (d) ir(d.dataset.ir);
  });
  document.querySelectorAll('.bv-page').forEach((p) => new MutationObserver(pintarMenu).observe(p, {attributes: true, attributeFilter: ['hidden']}));
  pintarMenu();

  // ---------- portada ----------
  const botonJugador = (nombre, texto) => {
    const b = el('button', 'nv-nombre-btn', texto || lindo(nombre));
    b.type = 'button';
    b.addEventListener('click', () => { verJugador(nombre); window.scrollTo({top: 0}); });
    return b;
  };
  const conocidos = () => new Set((filas('jugadores') || []).map((j) => j.jugador));
  const nombre = (n, set) => (set.has(String(n).toUpperCase()) ? botonJugador(String(n).toUpperCase(), lindo(n)) : el('span', '', lindo(n)));

  dash.draw('nv-cifras', (p) => {
    const a = (filas('resumen_anio') || []).filter((r) => /^\d{4}$/.test(r.anio));
    if (!a.length) return;
    const suma = (k) => a.reduce((t, r) => t + (r[k] || 0), 0);
    const b = (t) => el('b', '', t);
    p.replaceChildren('Desde ', b(a[0].anio), ' se han jugado ', b(num.format(suma('torneos'))), ' torneos, con ', b(num.format(suma('jugadores_nuevos'))), ' jugadores y ', b(num.format(suma('manos_jugadas'))), ' manos.');
  });

  // el contrato más jugado del club cierra la subasta
  const favorito = () => {
    const c = {};
    (filas('contratos') || []).forEach((r) => { if (r.anio !== 'todos') c[`${r.nivel}${r.palo}`] = (c[`${r.nivel}${r.palo}`] || 0) + r.veces; });
    const tot = Object.values(c).reduce((a, b) => a + b, 0);       // incluye las manos pasadas
    const [k, v] = Object.entries(c).filter(([key]) => key !== '0X').sort((a, b) => b[1] - a[1])[0] || [];
    return k ? {nivel: k[0], palo: k[1], parte: v / tot * 100} : null;
  };
  dash.draw('nv-favorito', (card) => {
    const f = favorito();
    if (!f) return;
    const i = el('i', f.palo === 'S' ? 'nv-st' : (f.palo === 'D' || f.palo === 'C') ? 'nv-rojo' : '', PALO[f.palo]);
    card.replaceChildren(el('span', '', f.nivel), i);
  });
  dash.draw('nv-nota-subasta', (p) => {
    const f = favorito();
    p.textContent = f ? `${f.nivel} ${PALO[f.palo] === 'ST' ? 'sin triunfo' : PALO[f.palo]} es el contrato más jugado del club: ${dec.format(f.parte)} % de las manos.` : '';
  });

  dash.draw('nv-contrato', (art) => {
    const t = (filas('ultimo_torneo') || [])[0], podio = filas('ultimo_podio') || [];
    if (!t) return;
    const gan = el('dl', 'nv-ganadores');
    ['N-S', 'E-O', 'General'].forEach((linea) => {
      const r = podio.find((x) => x.linea === linea && x.posicion === 1);
      if (!r) return;
      const f = el('div');
      f.append(el('dt', '', linea === 'General' ? 'Ganan' : linea), el('dd', 'nv-nombres', lindo(r.pareja).replace(' / ', ' y ')), el('dd', 'nv-pct', pct(r.porcentaje)));
      gan.appendChild(f);
    });
    art.replaceChildren(el('p', 'nv-contrato-quien', 'Último torneo'), el('h2', '', nombreTorneo(t.torneo)), el('p', 'nv-contrato-fecha', `${t.dia}, ${t.fecha}, ${t.parejas} parejas`), gan);
  });

  dash.draw('nv-torneo-sub', (p) => {
    const t = (filas('ultimo_torneo') || [])[0];
    if (t) p.textContent = `${nombreTorneo(t.torneo)}, ${t.fecha}. Jugaron ${t.parejas} parejas y ${t.manos} manos.`;
  });
  dash.draw('nv-podios', (cont) => {
    const podio = filas('ultimo_podio') || [];
    if (!podio.length) return;
    const set = conocidos();
    cont.replaceChildren(...[...new Set(podio.map((r) => r.linea))].map((linea) => {
      const col = el('div', 'nv-podio');
      col.appendChild(el('h3', '', linea === 'General' ? 'Clasificación general' : `Línea ${linea}`));
      const ol = el('ol');
      podio.filter((r) => r.linea === linea).sort((a, b) => a.posicion - b.posicion).forEach((r) => {
        const li = el('li');
        const par = el('span', 'nv-pareja');
        String(r.pareja).split(' / ').forEach((n) => par.appendChild(nombre(n, set)));
        li.append(el('span', 'nv-puesto', String(r.posicion)), par, el('span', 'nv-pct', pct(r.porcentaje)));
        ol.appendChild(li);
      });
      col.appendChild(ol);
      return col;
    }));
  });

  dash.draw('nv-forma', (ol) => {
    const f = filas('en_forma') || [];
    if (!f.length) return;
    const set = conocidos();
    ol.replaceChildren(...f.slice(0, 6).map((r) => {
      const li = el('li');
      const n = el('span', 'nv-n');
      n.appendChild(nombre(r.jugador, set));
      li.append(n, el('span', 'nv-pct', pct(r.pct)), el('span', 'nv-det', `${r.torneos} torneos${r.victorias ? `, ${r.victorias} ${r.victorias === 1 ? 'victoria' : 'victorias'}` : ''}`));
      return li;
    }));
  });

  dash.draw('nv-historias', (cont) => {
    const h = (filas('hallazgos') || []).filter((x) => x.destacado).slice(0, 4);
    if (!h.length) return;
    cont.replaceChildren(...h.map((x) => {
      const a = el('article', 'nv-historia');
      const c = el('div', 'nv-cifra', x.cifra);
      c.appendChild(el('small', '', x.unidad));
      const t = el('div');
      t.append(el('h3', '', x.titulo), el('p', '', x.detalle));
      a.append(c, t);
      return a;
    }));
  });

  dash.draw('nv-temporadas', (ol) => {
    const c = (filas('campeones_anio') || []).filter((r) => r.campeon);
    if (!c.length) return;
    const set = conocidos();
    ol.replaceChildren(...c.map((r) => {
      const li = el('li');
      const d = el('div');
      const camp = el('span', 'nv-campeon');
      camp.appendChild(nombre(r.campeon, set));
      d.append(camp, el('p', '', `${pct(r.campeon_pct)} de promedio en ${num.format(r.campeon_torneos)} torneos. Más victorias: ${lindo(r.ganador)}, con ${r.victorias}.`));
      li.append(el('span', 'nv-anio', r.anio), d);
      return li;
    }));
  });

  // la escena de la subasta se inclina con el mouse
  const escena = document.querySelector('.nv-escena'), zona = document.querySelector('.nv-portada');
  if (escena && zona && !quieto && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    zona.addEventListener('pointermove', (ev) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = ev.clientX / innerWidth - .5, y = ev.clientY / innerHeight - .5;
        escena.style.setProperty('--ry', `${(-16 + x * 14).toFixed(2)}deg`);
        escena.style.setProperty('--rx', `${(10 - y * 10).toFixed(2)}deg`);
      });
    }, {passive: true});
    zona.addEventListener('pointerleave', () => { escena.style.removeProperty('--rx'); escena.style.removeProperty('--ry'); });
  }
})();

// ---------- secciones compactas: un resumen arriba y el detalle en capítulos que se abren ----------
(() => {
  const COMPACTAR = ['records', 'handicap', 'resumen', 'juveniles', 'generos', 'dias-semana', 'jugador', 'estilo', 'cartas'];
  const RESUMEN = '.bv-section-head, .bv-kpis, .bv-mini-grid, .bv-mt-resumen, .bv-sentence, .bv-hero, .bv-buscar, .bv-perfil, .nv-reparto';
  // títulos cortos para los capítulos (si falta alguno, se usa el título del bloque)
  const TITULOS = {
    cartas: ['Contratos y palos', 'Puntos del declarante', 'Mejores declarantes y defensores'],
    'dias-semana': ['Cuánta gente va cada día', 'Los torneos y meses más llenos', 'Los torneos más grandes', 'Rarezas de asistencia', 'Cada día es un torneo distinto'],
    estilo: ['Cómo leer esto', 'El club en cifras', 'Parejas con estilo propio', 'Todas las parejas'],
    generos: ['Mejores jugadoras y jugadores', 'Mejores parejas', 'Asistencia', 'Cuadro de honor'],
    handicap: ['Mientras más bajo el handicap, mejor el resultado', 'Quiénes rinden distinto a su handicap', 'Quién gana y qué día es más exigente', 'Cuando se enfrentan', 'Qué hacen distinto'],
    jugador: ['Medallas', 'Sus torneos', 'Dónde gana y pierde puntos', 'Datos freak', 'Su mejor día y su año', 'Mes a mes', 'Su juego de cartas', 'Compañeros y últimos torneos'],
    juveniles: ['Los mejores juveniles', 'El grupo en cifras', 'Sus mejores actuaciones', 'Todos los juveniles'],
    resumen: ['Jugadores activos por mes', 'Los mejores del año', 'Quién más mejoró'],
  };
  const lista = (t) => (t.length < 2 ? t.join('') : `${t.slice(0, -1).join(', ')} y ${t[t.length - 1]}`);
  const titulo = (b) => {
    const h = [...b.querySelectorAll(':scope h2, :scope h3')].map((x) => x.textContent.trim()).filter(Boolean);
    if (b.matches('.bv-grid, .bv-mini-grid')) return lista(h.slice(0, 3));
    return (h[0] || 'Más detalle').replace(/\s*—\s*$/, '');
  };
  const capitulo = (nombreGrupo, texto) => {
    const d = document.createElement('details');
    d.className = 'nv-cap';
    d.name = nombreGrupo;                  // uno abierto a la vez
    const s = document.createElement('summary');
    const t = document.createElement('span');
    t.textContent = texto;
    const i = document.createElement('i');
    i.setAttribute('aria-hidden', 'true');
    s.append(t, i);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'nv-cap-cuerpo';
    d.append(s, cuerpo);
    d.addEventListener('toggle', () => { if (d.open) dash.refresh(); });   // los gráficos se dibujan con el ancho real
    return [d, cuerpo];
  };
  COMPACTAR.forEach((id) => {
    const pag = document.getElementById(id);
    if (!pag) return;
    // los "ver todas las estadísticas" se reparten en capítulos propios
    pag.querySelectorAll(':scope > details.bv-mas').forEach((dm) => {
      [...dm.children].filter((c) => c.tagName !== 'SUMMARY').forEach((c) => dm.before(c));
      dm.remove();
    });
    const hijos = [...pag.children];
    let k = 0;
    while (k < hijos.length && k < 4 && hijos[k].matches(RESUMEN) && !(k > 0 && hijos[k].matches('.bv-section-head'))) k++;
    const resto = hijos.slice(k).filter((b) => !b.matches('p.bv-note:last-child'));
    if (!resto.length) return;
    const caja = document.createElement('div');
    caja.className = 'nv-capitulos';
    let actual = null;
    resto.forEach((b) => {
      if (b.matches('.bv-section-head')) {
        const [d, cuerpo] = capitulo(`cap-${id}`, b.querySelector('h2')?.textContent.trim() || 'Más detalle');
        b.querySelector('h2')?.setAttribute('hidden', '');
        cuerpo.appendChild(b);
        caja.appendChild(d);
        actual = cuerpo;
        return;
      }
      if (actual) { actual.appendChild(b); return; }
      const [d, cuerpo] = capitulo(`cap-${id}`, titulo(b));
      cuerpo.appendChild(b);
      caja.appendChild(d);
    });
    const nombres = TITULOS[id] || [];
    caja.querySelectorAll(':scope > details > summary span').forEach((sp, n) => { if (nombres[n]) sp.textContent = nombres[n]; });
    // si el bloque repite el título del capítulo, no se muestra dos veces
    caja.querySelectorAll(':scope > details').forEach((d) => {
      const h = d.querySelector('.nv-cap-cuerpo h2:not([hidden]), .nv-cap-cuerpo h3');
      if (h && h.textContent.trim() === d.querySelector('summary span').textContent.trim()) h.hidden = true;
    });
    pag.insertBefore(caja, hijos[k] && hijos[k].isConnected && hijos[k].parentElement === pag ? hijos[k] : null);
    // la nota final queda al final, fuera de los capítulos
    const nota = pag.querySelector(':scope > p.bv-note:last-child');
    if (nota) pag.appendChild(nota);
  });
})();

// ---------- Días: cómo se reparten las cartas ----------
(() => {
  const {filas} = window.bv;
  const dec = new Intl.NumberFormat('es-CL', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const dec2 = new Intl.NumberFormat('es-CL', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const y = (t) => (t.length < 2 ? t.join('') : `${t.slice(0, -1).join(', ')} y ${t[t.length - 1]}`);
  const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  dash.draw('nv-reparto', (caja) => {
    const d = (filas('reparto_dias') || []).slice().sort((a, b) => a.orden - b.orden);
    if (!d.length) return;
    const azar = d[0].pct_azar, tope = Math.max(5, ...d.map((r) => r.pct_debiles)) * 1.1;
    const filtrados = d.filter((r) => r.pct_debiles < azar / 2).map((r) => r.dia.toLowerCase());
    const normales = d.filter((r) => r.pct_debiles >= azar / 2).map((r) => r.dia.toLowerCase());
    caja.querySelector('[data-k="frase"]').textContent = filtrados.length
      ? `Todos los días las manos tienen las formas de un reparto al azar. Pero ${y(filtrados)} casi nunca traen manos en que nadie tiene 12 puntos, y por eso ahí casi nadie pasa.${normales.length ? ` ${mayus(y(normales))} se parecen al azar.` : ''}`
      : 'Todos los días las manos se parecen a un reparto al azar.';
    caja.querySelector('[data-k="filas"]').replaceChildren(...d.map((r) => {
      const f = document.createElement('div');
      f.className = 'nv-rep-fila';
      const dia = document.createElement('span');
      dia.className = 'nv-rep-dia';
      dia.textContent = r.dia;
      const pista = document.createElement('div');
      pista.className = 'nv-rep-pista';
      pista.setAttribute('role', 'img');
      pista.setAttribute('aria-label', `${r.dia}: ${dec.format(r.pct_debiles)} % de manos sin nadie con 12 puntos; al azar serían ${dec.format(azar)} %`);
      const az = document.createElement('i');
      az.className = 'nv-rep-azar';
      az.style.left = `${azar / tope * 100}%`;
      const p = document.createElement('i');
      p.className = 'nv-rep-punto';
      p.style.left = `${r.pct_debiles / tope * 100}%`;
      const v = document.createElement('b');
      v.textContent = `${dec.format(r.pct_debiles)} %`;
      p.appendChild(v);
      pista.append(az, p);
      const pasos = document.createElement('span');
      pasos.className = 'nv-rep-pasos';
      const b = document.createElement('b');
      b.textContent = `${dec2.format(r.pct_paso)} %`;
      pasos.append(b, document.createElement('br'), 'pasan');
      f.append(dia, pista, pasos);
      return f;
    }));
  });
})();
