// Pestaña Mujeres y hombres: participación y mejores de cada grupo, sin comparar resultados entre grupos
(() => {
  const {fmt, enc, filas, anio, minimo, lindo, listaBarras, verJugador} = window.bv;
  const TOP = 8;
  const COLOR = {Mujeres: 4, Mixta: 5, Hombres: 1};
  const generos = () => new Map((filas('generos_jugadores') || []).map((r) => [r.jugador, r.genero]));
  const tipoPareja = (pareja, gen) => {
    const g = pareja.split(' / ').map((x) => gen.get(x) || '').sort().join('');
    return {FF: 'Mujeres', MM: 'Hombres', FM: 'Mixta'}[g] || '';
  };

  dash.draw('kpi-genero', (el) => {
    const r = (filas('generos_anio') || []).find((x) => x.anio === anio());
    if (!r) { el.textContent = '—'; return; }
    el.dataset.where = 'anio=' + enc(r.anio);
    el.textContent = (fmt[el.dataset.fmt] || fmt.texto)(r[el.dataset.field]);
  });

  dash.draw('top-genero', (ol) => {
    const rows = filas('jugador_anio');
    const gen = generos();
    if (!rows || !gen.size || !anio()) { ol.replaceChildren(); return; }
    const g = ol.dataset.genero;
    const sel = rows.filter((r) => r.anio === anio() && r.torneos >= minimo('jugador') && gen.get(r.jugador) === g)
      .sort((a, b) => b.pct_ajustado - a.pct_ajustado).slice(0, TOP);
    listaBarras(ol, sel.map((r) => ({
      nombre: lindo(r.jugador), valor: r.pct_ajustado, texto: fmt.pct(r.pct_ajustado), clic: () => verJugador(r.jugador),
      sub: `${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares`,
    })), {dominio: [40, Math.max(60, d3.max(sel, (r) => r.pct_ajustado) || 60)], color: dash.colors[g === 'F' ? 4 : 1]});
  });

  dash.draw('top-tipo', (ol) => {
    const rows = filas('pareja_anio');
    const gen = generos();
    if (!rows || !gen.size || !anio()) { ol.replaceChildren(); return; }
    const tp = ol.dataset.tipoPareja;
    const sel = rows.filter((r) => r.anio === anio() && r.torneos >= minimo('pareja') && tipoPareja(r.pareja, gen) === tp)
      .sort((a, b) => b.pct_ajustado - a.pct_ajustado).slice(0, 5);
    listaBarras(ol, sel.map((r) => ({
      nombre: lindo(r.pareja), valor: r.pct_ajustado, texto: fmt.pct(r.pct_ajustado),
      sub: `${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares`,
    })), {dominio: [40, Math.max(60, d3.max(sel, (r) => r.pct_ajustado) || 60)], color: dash.colors[COLOR[tp]]});
  });
})();
