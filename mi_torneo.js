// Pestaña Mi torneo: revisar las manos de una pareja de a una, con la mesa completa
(() => {
  const {fmt, filas, lindo, nombreTorneo, buscador} = window.bv;
  const q = {torneo: null, pareja: null, filtro: 'todas', mano: null, abiertos: {}};
  const TIPOS = {
    B: {nombre: 'Muy buena', plural: 'Muy buenas'},
    M: {nombre: 'Para mejorar', plural: 'Para mejorar'},
    S: {nombre: 'Mala suerte', plural: 'Mala suerte'},
    N: {nombre: 'Normal', plural: 'Normales'},
  };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fechaLinda = (iso) => { const [a, m, d] = String(iso).split('-').map(Number); return m ? `${d} de ${MESES[m - 1]} de ${a}` : iso; };
  const ASIENTOS = {N: 'Norte', E: 'Este', S: 'Sur', O: 'Oeste'};
  const PINTAS = [['♠', false], ['♥', true], ['♦', true], ['♣', false]];
  const DENOMINACION = {T: '♣', D: '♦', C: '♥', P: '♠', S: 'ST'};

  const crear = (tag, clase, texto) => {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto != null) e.textContent = texto;
    return e;
  };
  // texto con las pintas en su color: '3♥ S en 4 de 17 mesas'
  const conPintas = (el, texto) => {
    String(texto).split(/([♠♥♦♣])/).forEach((t) => {
      if (!t) return;
      if ('♠♥♦♣'.includes(t)) el.appendChild(crear('span', 'bv-pinta' + ('♥♦'.includes(t) ? ' bv-pinta-roja' : ''), t));
      else el.appendChild(document.createTextNode(t));
    });
    return el;
  };

  const parejas = () => filas('mi_torneo_parejas') || [];
  const torneos = () => {
    const vistos = new Map();
    parejas().forEach((r) => { if (!vistos.has(r.id_torneo)) vistos.set(r.id_torneo, r); });
    return [...vistos.values()];
  };
  const torneoActual = () => {
    const t = torneos();
    return t.some((r) => r.id_torneo === q.torneo) ? q.torneo : (t[0] && t[0].id_torneo);
  };
  const delTorneo = () => parejas().filter((r) => r.id_torneo === torneoActual());
  const parejaActual = () => {
    const p = delTorneo();
    return p.find((r) => r.pareja_nro === q.pareja) || p[0];
  };
  const manos = () => {
    const p = parejaActual();
    if (!p) return [];
    return (filas('mi_torneo_manos') || []).filter((r) => r.id_torneo === p.id_torneo && r.pareja_nro === p.pareja_nro).sort((a, b) => a.mano - b.mano);
  };
  const visibles = () => { const m = manos(); return q.filtro === 'todas' ? m : m.filter((r) => r.tipo === q.filtro); };
  const manoActual = () => { const v = visibles(); return v.find((r) => r.mano === q.mano) || v[0]; };
  const tablero = (r) => (filas('mi_torneo_cartas') || []).find((c) => c.id_torneo === r.id_torneo && c.mano === r.mano);
  const nombrePareja = (nro) => { const p = delTorneo().find((x) => x.pareja_nro === nro); return p ? lindo(p.pareja) : null; };

  const redibujar = () => ['mt-torneo', 'mt-pareja', 'mt-cabecera', 'mt-filtros', 'mt-tira', 'mt-mano'].forEach((d) => dash.draw(d));
  const irAMano = (n) => { q.mano = n; ['mt-tira', 'mt-mano'].forEach((d) => dash.draw(d)); };
  const mover = (paso) => {
    const v = visibles(), i = v.indexOf(manoActual()), s = v[i + paso];
    if (s) irAMano(s.mano);
  };

  buscador('sugerencias-mt', '#buscar-mt', () => [...new Set(parejas().flatMap((r) => r.pareja.split(' / ')))].sort(), (n) => {
    const r = parejas().find((x) => x.pareja.split(' / ').includes(n));    // vienen del más reciente al más antiguo
    if (r) { q.torneo = r.id_torneo; q.pareja = r.pareja_nro; q.mano = null; q.filtro = 'todas'; redibujar(); }
  });

  dash.draw('mt-torneo', (sel) => {
    sel.replaceChildren(...torneos().map((t) => new Option(`${fechaLinda(t.fecha)}, ${nombreTorneo(t.torneo)}`, t.id_torneo)));
    sel.value = torneoActual() || '';
    sel.onchange = () => { q.torneo = sel.value; q.pareja = null; q.mano = null; q.filtro = 'todas'; redibujar(); };
  });
  dash.draw('mt-pareja', (sel) => {
    const lista = delTorneo().slice().sort((a, b) => a.pareja.localeCompare(b.pareja, 'es'));
    sel.replaceChildren(...lista.map((p) => new Option(lindo(p.pareja), p.pareja_nro)));
    const p = parejaActual();
    sel.value = p ? String(p.pareja_nro) : '';
    sel.onchange = () => { q.pareja = Number(sel.value); q.mano = null; q.filtro = 'todas'; redibujar(); };
  });

  dash.draw('mt-cabecera', (el) => {
    const p = parejaActual();
    if (!p) { el.replaceChildren(); return; }
    const izq = crear('div', 'bv-mt-quien');
    izq.append(crear('h3', '', lindo(p.pareja)), crear('p', '', `${nombreTorneo(p.torneo)}, ${fechaLinda(p.fecha)}${p.linea ? ', línea ' + p.linea : ''}`));
    const der = crear('div', 'bv-mt-marca');
    der.append(crear('b', '', fmt.pct(p.porcentaje)), crear('span', '', p.posicion ? `${p.posicion}.º lugar` : ''));
    el.replaceChildren(izq, der);
  });

  dash.draw('mt-filtros', (el) => {
    const m = manos();
    if (!m.length) { el.replaceChildren(); return; }
    const opciones = [['todas', 'Todas', m.length], ...['B', 'M', 'S'].map((t) => [t, TIPOS[t].plural, m.filter((r) => r.tipo === t).length])];
    el.replaceChildren(...opciones.map(([id, texto, n]) => {
      const b = crear('button', 'bv-mt-filtro' + (id === 'todas' ? '' : ' bv-t-' + id));
      b.type = 'button';
      b.disabled = n === 0;
      b.setAttribute('aria-pressed', String(q.filtro === id));
      b.append(crear('span', '', texto), crear('b', '', String(n)));
      b.addEventListener('click', () => { q.filtro = id; q.mano = null; ['mt-filtros', 'mt-tira', 'mt-mano'].forEach((d) => dash.draw(d)); });
      return b;
    }));
  });

  dash.draw('mt-tira', (el) => {
    const actual = manoActual();
    el.replaceChildren(...visibles().map((r) => {
      const b = crear('button', 'bv-mt-tile bv-t-' + r.tipo);
      b.type = 'button';
      b.setAttribute('aria-label', `Mano ${r.mano}: ${r.pct}%, ${TIPOS[r.tipo].nombre}`);
      if (actual && r.mano === actual.mano) b.setAttribute('aria-current', 'true');
      b.append(crear('b', '', String(r.mano)), crear('span', '', `${r.pct}%`));
      b.addEventListener('click', () => irAMano(r.mano));
      return b;
    }));
  });

  const mesa = (t, r, propia) => {
    const m = crear('div', 'bv-mt-mesa');
    const decl = (r.jugada.match(/ ([NSEO]) (?:=|[+-]\d)/) || [])[1];
    ['N', 'O', 'E', 'S'].forEach((a) => {
      const s = crear('div', `bv-mt-asiento bv-m-${a.toLowerCase()}` + (propia.includes(a) ? ' bv-mt-suya' : ''));
      const cab = crear('div', 'bv-mt-seat');
      cab.append(crear('b', '', ASIENTOS[a]));
      const i = 'NESO'.indexOf(a);
      if (t.hcp && t.hcp[i] != null) cab.appendChild(crear('span', '', `${t.hcp[i]} pts`));
      s.appendChild(cab);
      if (a === decl) s.appendChild(crear('div', 'bv-mt-marcas', 'Declarante'));
      (t[a] || '...').split('.').forEach((cartas, k) => {
        const f = crear('div', 'bv-mt-palo');
        f.append(crear('i', PINTAS[k][1] ? 'bv-rojo-palo' : '', PINTAS[k][0]), crear('span', '', cartas ? cartas.replace(/T/g, '10').split('').join(' ').replace(/1 0/g, '10') : '—'));
        s.appendChild(f);
      });
      m.appendChild(s);
    });
    const centro = crear('div', 'bv-mt-centro');
    centro.append(crear('span', '', t.vulnerable === 'Nadie' ? 'Nadie vulnerable' : t.vulnerable === 'Todos' ? 'Todos vulnerables' : `Vulnerable ${t.vulnerable}`), crear('span', '', `Da ${t.dador}`));
    m.appendChild(centro);
    return m;
  };

  const contrato = (texto) => {
    const c = crear('div', 'bv-mt-contrato');
    const x = texto.match(/^(\d(?:♠|♥|♦|♣|ST))(?: (doblado|redoblado))? ([NSEO]) (=|[+-]\d+)$/);
    if (!x) { c.appendChild(crear('b', '', 'Paso')); c.appendChild(crear('span', '', 'Nadie remató en esta mesa')); return c; }
    const [, base, doble, a, res] = x;
    const n = res === '=' ? 0 : Number(res);
    const baza = (v) => `${Math.abs(v)} baza${Math.abs(v) > 1 ? 's' : ''}`;
    const resultado = n === 0 ? 'cumplió justo' : n > 0 ? `cumplió con ${baza(n)} de más` : `cayó por ${baza(n)}`;
    c.append(conPintas(crear('b'), base), crear('span', '', `${ASIENTOS[a]}${doble ? ', ' + doble + ',' : ''} ${resultado}`));
    return c;
  };

  const otrasMesas = (r, p) => {
    const linea = new Set(delTorneo().filter((x) => x.linea === p.linea).map((x) => x.pareja_nro));
    const todas = (filas('mi_torneo_manos') || []).filter((x) => x.id_torneo === r.id_torneo && x.mano === r.mano && linea.has(x.pareja_nro));
    const grupos = d3.rollups(todas, (v) => ({n: v.length, pct: v[0].pct, puntaje: v[0].puntaje, suya: v.some((x) => x.pareja_nro === r.pareja_nro)}), (x) => `${x.jugada}|${x.puntaje}`)
      .map(([k, g]) => ({jugada: k.split('|')[0], ...g})).sort((a, b) => b.pct - a.pct);
    const ol = crear('ol', 'bv-mt-mesas');
    ol.append(...grupos.map((g) => {
      const li = crear('li', g.suya ? 'bv-mt-esta' : '');
      li.append(conPintas(crear('b'), g.jugada), crear('span', '', g.n > 1 ? `${g.n} mesas` : (g.suya ? 'Ustedes' : '1 mesa')), crear('span', 'bv-mt-num', g.puntaje == null ? '—' : fmt.int(g.puntaje)), crear('span', 'bv-mt-num', `${g.pct}%`));
      return li;
    }));
    return ol;
  };

  const dobleMuerto = (t) => {
    const tabla = crear('table', 'bv-mt-dd');
    const cab = crear('tr');
    cab.appendChild(crear('th', '', ''));
    'TDCPS'.split('').forEach((d) => cab.appendChild(conPintas(crear('th'), DENOMINACION[d])));
    tabla.appendChild(cab);
    'NESO'.split('').forEach((a, i) => {
      const tr = crear('tr');
      tr.appendChild(crear('th', '', ASIENTOS[a]));
      'TDCPS'.split('').forEach((d, j) => tr.appendChild(crear('td', '', String(parseInt(t.dd[i * 5 + j], 16)))));
      tabla.appendChild(tr);
    });
    return tabla;
  };

  const plegable = (id, titulo, contenido) => {
    const d = crear('details', 'bv-mt-mas');
    d.open = !!q.abiertos[id];
    d.addEventListener('toggle', () => { q.abiertos[id] = d.open; });
    d.append(crear('summary', '', titulo), contenido);
    return d;
  };

  dash.draw('mt-mano', (el) => {
    const r = manoActual(), p = parejaActual();
    if (!r || !p) {
      el.replaceChildren();
      if (p && filas('mi_torneo_manos')) el.appendChild(crear('p', 'bv-note', 'Esta pareja no tiene manos publicadas.'));
      return;
    }
    const v = visibles(), i = v.indexOf(r), t = tablero(r);
    const nav = crear('div', 'bv-mt-nav');
    const boton = (texto, paso, activo) => {
      const b = crear('button', 'bv-mt-paso', texto);
      b.type = 'button';
      b.disabled = !activo;
      b.addEventListener('click', () => mover(paso));
      return b;
    };
    nav.append(boton('Anterior', -1, i > 0), crear('b', '', `Mano ${r.mano}`), boton('Siguiente', 1, i < v.length - 1));

    const panel = crear('div', 'bv-mt-panel');
    panel.appendChild(crear('span', 'bv-mt-tipo bv-t-' + r.tipo, TIPOS[r.tipo].nombre));
    panel.appendChild(contrato(r.jugada));
    const nota = crear('div', 'bv-mt-nota');
    nota.append(crear('b', '', `${r.pct}%`), crear('span', '', r.puntaje == null ? 'de la mano' : `de la mano, con ${fmt.int(r.puntaje)} puntos`));
    panel.appendChild(nota);
    const barra = crear('div', 'bv-mt-barra');
    const relleno = crear('div', 'bv-t-' + r.tipo);
    relleno.style.width = `${Math.max(2, Math.min(100, r.pct))}%`;
    barra.appendChild(relleno);
    panel.appendChild(barra);
    if (r.razon) panel.appendChild(crear('p', 'bv-mt-razon', r.razon));
    const datos = crear('dl', 'bv-mt-datos');
    const dato = (k, val) => { const d = crear('div'); d.append(crear('dt', '', k), conPintas(crear('dd'), val)); datos.appendChild(d); };
    const rival = nombrePareja(r.rival_nro);
    if (rival) dato('Rivales', rival);
    dato('En el club', r.club);
    if (t && t.par && t.par !== 'Pass') {
      const nivel = t.par.match(/^(\d)([TDCPS])(x*)/);
      if (nivel) dato('Lo óptimo', `${nivel[1]}${DENOMINACION[nivel[2]]}${nivel[3] ? ' doblado' : ''} ${t.par_decl || ''}`.trim());
    }
    panel.appendChild(datos);
    panel.appendChild(plegable('mesas', 'Qué hicieron las otras mesas', otrasMesas(r, p)));
    if (t && t.dd && !t.dudosa) panel.appendChild(plegable('dd', 'Cuántas bazas daban las cartas', dobleMuerto(t)));

    const cuerpo = crear('div', 'bv-mt-cuerpo');
    const propia = p.linea === 'E-O' ? ['E', 'O'] : p.linea === 'N-S' ? ['N', 'S'] : [];
    if (t) {
      const lado = crear('div', 'bv-mt-lado');
      lado.appendChild(mesa(t, r, propia));
      if (t.dudosa) lado.appendChild(crear('p', 'bv-note', 'Las cartas publicadas de esta mano podrían no ser las que se jugaron.'));
      cuerpo.appendChild(lado);
    }
    cuerpo.appendChild(panel);
    el.replaceChildren(nav, cuerpo);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || document.getElementById('mi-torneo').hidden) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    mover(e.key === 'ArrowLeft' ? -1 : 1);
  });
})();
