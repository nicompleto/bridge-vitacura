// Pestaña Juveniles
(() => {
  const {fmt, filas, enc, lindo, ordenar, llenar, listaBarras, verJugador} = window.bv;
  const MIN_TORNEOS = 10;

  dash.draw('juv-minimo', (el) => { el.textContent = String(MIN_TORNEOS); });

  dash.draw('kpi-juv', (el) => {
    const r = (filas('juveniles_anio') || []).find((x) => x.anio === 'todos');
    if (!r) { el.textContent = '—'; return; }
    el.dataset.where = 'anio=todos';
    el.textContent = (fmt[el.dataset.fmt] || fmt.texto)(r[el.dataset.field]);
  });

  dash.draw('juv-ranking', (ol) => {
    const rows = filas('juveniles');
    if (!rows) { ol.replaceChildren(); return; }
    const sel = rows.filter((r) => r.torneos >= MIN_TORNEOS).sort((a, b) => b.pct - a.pct);
    listaBarras(ol, sel.map((r) => ({
      nombre: lindo(r.jugador), valor: r.pct, texto: fmt.pct(r.pct), clic: () => verJugador(r.jugador),
      sub: `${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares · compañero más frecuente: ${lindo(r.companero_frecuente)}`,
    })), {dominio: [40, Math.max(65, d3.max(sel, (r) => r.pct) || 65)], color: dash.colors[0]});
  });

  dash.draw('juv-parejas', (ol) => {
    const rows = filas('juveniles_parejas');
    if (!rows) { ol.replaceChildren(); return; }
    const sel = rows.slice(0, 8);
    listaBarras(ol, sel.map((r) => ({
      nombre: lindo(r.pareja), valor: r.torneos, texto: `${fmt.int(r.torneos)} torneos`,
      sub: `${fmt.pct(r.pct)} promedio · mejor ${fmt.pct(r.mejor_pct)} · ${fmt.int(r.victorias)} primeros lugares`,
    })), {color: dash.colors[1], medallas: false});
  });

  dash.draw('juv-records', (el) => {
    const rows = filas('juveniles_records');
    if (!rows) { el.replaceChildren(); return; }
    el.replaceChildren(...rows.map((r) => {
      const card = document.createElement('div');
      card.className = 'bv-record';
      const b = document.createElement('b');
      b.textContent = fmt.pct(r.porcentaje);
      const s = document.createElement('span');
      s.textContent = lindo(r.pareja);
      const sm = document.createElement('small');
      sm.textContent = `${r.fecha} · ${r.torneo}` + (r.pos ? ` · puesto ${r.pos}` : '');
      card.append(b, s, sm);
      return card;
    }));
  });

  dash.draw('tabla-juveniles', (tbody) => {
    const rows = filas('juveniles');
    if (!rows) { tbody.replaceChildren(); return; }
    llenar(tbody, ordenar('juveniles', rows, {col: 'torneos', dir: 'desc'}), [
      {f: 'jugador'}, {f: 'torneos', fmt: fmt.int}, {f: 'pct', fmt: fmt.pct}, {f: 'pct_365d', fmt: fmt.pct, cls: 'bv-hide-narrow'},
      {f: 'mejor_pct', fmt: fmt.pct, cls: 'bv-hide-narrow'}, {f: 'victorias', fmt: fmt.int},
      {f: 'companero_frecuente', cls: 'bv-left bv-hide-narrow'}, {f: 'ultimo_torneo', cls: 'bv-hide-narrow'},
    ], (tr, r) => {
      tr.className = 'bv-click';
      tr.tabIndex = 0;
      tr.dataset.key = enc(r.jugador);
      tr.addEventListener('click', () => verJugador(r.jugador));
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') verJugador(r.jugador); });
    });
  });
})();
