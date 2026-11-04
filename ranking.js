// Pestañas Ranking y Parejas
(() => {
  const {fmt, enc, filas, anio, minimo, ordenar, llenar, listaBarras, verJugador} = window.bv;
  const deAnio = (id) => (filas(id) || []).filter((r) => r.anio === anio());
  const minDe = (valor, tipo) => (valor === 'auto' ? minimo(tipo) : Number(valor));

  // ---------- ranking de jugadores ----------
  const q = {texto: '', min: 'auto'};
  document.querySelectorAll('.bv-search').forEach((el) => el.addEventListener('input', () => { q.texto = el.value.trim().toUpperCase(); dash.draw('tabla-jugadores'); }));
  document.querySelectorAll('.bv-min').forEach((el) => el.addEventListener('change', () => { q.min = el.value; dash.draw('tabla-jugadores'); }));
  dash.draw('tabla-jugadores', (tbody) => {
    if (!anio() || !filas('jugador_anio')) { tbody.replaceChildren(); return; }
    const min = minDe(q.min, 'jugador');
    const vis = deAnio('jugador_anio').filter((r) => r.torneos >= min && (!q.texto || r.jugador.includes(q.texto)));
    llenar(tbody, ordenar('jugadores', vis, {col: 'pct', dir: 'desc'}), [
      {f: 'jugador'}, {f: 'torneos', fmt: fmt.int}, {f: 'pct', fmt: fmt.pct}, {f: 'mejor_pct', fmt: fmt.pct, cls: 'bv-hide-narrow'},
      {f: 'victorias', fmt: fmt.int}, {f: 'podios', fmt: fmt.int, cls: 'bv-hide-narrow'},
      {f: 'cumple_declarando', fmt: fmt.pct, cls: 'bv-hide-narrow'}, {f: 'dd_declarando', fmt: fmt.dd, cls: 'bv-hide-narrow'},
    ], (tr, r) => {
      tr.className = 'bv-click';
      tr.tabIndex = 0;
      tr.dataset.key = enc(r.jugador) + ',' + enc(r.anio);
      tr.addEventListener('click', () => verJugador(r.jugador));
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') verJugador(r.jugador); });
    });
  });

  // ---------- parejas ----------
  const qp = {texto: '', min: 'auto'};
  document.querySelectorAll('.bv-search-parejas').forEach((el) => el.addEventListener('input', () => { qp.texto = el.value.trim().toUpperCase(); dash.draw('tabla-parejas'); }));
  document.querySelectorAll('.bv-min-parejas').forEach((el) => el.addEventListener('change', () => { qp.min = el.value; dash.draw('tabla-parejas'); }));
  dash.draw('tabla-parejas', (tbody) => {
    if (!anio() || !filas('pareja_anio')) { tbody.replaceChildren(); return; }
    const min = minDe(qp.min, 'pareja');
    const vis = deAnio('pareja_anio').filter((r) => r.torneos >= min && (!qp.texto || r.pareja.includes(qp.texto)));
    llenar(tbody, ordenar('parejas', vis, {col: 'pct', dir: 'desc'}), [
      {f: 'pareja'}, {f: 'torneos', fmt: fmt.int}, {f: 'pct', fmt: fmt.pct}, {f: 'mejor_pct', fmt: fmt.pct, cls: 'bv-hide-narrow'},
      {f: 'victorias', fmt: fmt.int}, {f: 'podios', fmt: fmt.int, cls: 'bv-hide-narrow'}, {f: 'ultimo_torneo', cls: 'bv-hide-narrow'},
    ], (tr, r) => { tr.dataset.key = enc(r.pareja) + ',' + enc(r.anio); });
  });

  dash.draw('top-parejas-victorias', (ol) => {
    if (!anio() || !filas('pareja_anio')) { ol.replaceChildren(); return; }
    const rows = deAnio('pareja_anio').sort((a, b) => b.victorias - a.victorias || b.pct - a.pct).slice(0, 10);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.pareja, valor: r.victorias, texto: fmt.int(r.victorias),
      sub: `de ${fmt.int(r.torneos)} torneos · ${fmt.pct(r.pct)} promedio`,
    })), {color: dash.colors[2]});
  });
  dash.draw('top-parejas-torneos', (ol) => {
    if (!anio() || !filas('pareja_anio')) { ol.replaceChildren(); return; }
    const rows = deAnio('pareja_anio').sort((a, b) => b.torneos - a.torneos).slice(0, 10);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.pareja, valor: r.torneos, texto: fmt.int(r.torneos),
      sub: `${fmt.pct(r.pct)} promedio · ${fmt.int(r.victorias)} primeros lugares`,
    })), {color: dash.colors[3], medallas: false});
  });
})();
