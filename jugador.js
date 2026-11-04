// Pestaña Ficha de jugador
(() => {
  const {fmt, enc, filas, jugadorActual, llenar, listaBarras, tooltip, ejeY, anchoTexto, estiloEje} = window.bv;

  dash.draw('elegir-jugador', (sel) => {
    const rows = filas('jugadores');
    if (!rows) { sel.replaceChildren(); return; }
    const nombres = rows.map((r) => r.jugador).sort((a, b) => a.localeCompare(b, 'es'));
    sel.replaceChildren(...nombres.map((n) => new Option(n, n)));
    sel.value = jugadorActual();
    sel.onchange = () => dash.setParams({jugador: sel.value});
  });

  dash.draw('ficha', (el) => {
    const rows = filas('jugadores');
    const nombre = jugadorActual();
    const r = rows && rows.find((x) => x.jugador === nombre);
    if (!r) { el.textContent = '—'; return; }
    el.dataset.where = 'jugador=' + enc(nombre);
    el.textContent = (fmt[el.dataset.fmt] || fmt.texto)(r[el.dataset.field]);
  });

  dash.draw('ficha-anios', (ol) => {
    const rows = filas('jugador_anio');
    const nombre = jugadorActual();
    if (!rows || !nombre) { ol.replaceChildren(); return; }
    const sel = rows.filter((r) => r.jugador === nombre && r.anio !== 'todos').sort((a, b) => a.anio.localeCompare(b.anio));
    listaBarras(ol, sel.map((r) => ({
      etiquetaRank: "'" + r.anio.slice(2), nombre: r.anio, valor: r.pct, texto: fmt.pct(r.pct),
      sub: `${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares · mejor ${fmt.pct(r.mejor_pct)}`,
    })), {dominio: [30, 70], medallas: false, colores: sel.map((r) => (r.pct >= 50 ? 'var(--color-ok)' : 'var(--cds-chart-muted)'))});
  });

  dash.draw('tabla-companeros', (tbody) => {
    const rows = filas('companeros');
    const nombre = jugadorActual();
    if (!rows || !nombre) { tbody.replaceChildren(); return; }
    llenar(tbody, rows.filter((r) => r.jugador === nombre), [
      {f: 'companero'}, {f: 'torneos', fmt: fmt.int}, {f: 'pct', fmt: fmt.pct}, {f: 'victorias', fmt: fmt.int}, {f: 'ultimo'},
    ], (tr, r) => { tr.dataset.key = enc(r.jugador) + ',' + enc(r.companero); });
  });

  dash.draw('tabla-ultimos', (tbody) => {
    const rows = filas('jugador_torneos');
    const nombre = jugadorActual();
    if (!rows || !nombre) { tbody.replaceChildren(); return; }
    llenar(tbody, rows.filter((r) => r.jugador === nombre), [
      {f: 'fecha'}, {f: 'companero', cls: 'bv-left'}, {f: 'posicion', fmt: fmt.int}, {f: 'parejas_linea', fmt: fmt.int},
      {f: 'porcentaje', fmt: fmt.pct}, {f: 'torneo', cls: 'bv-left bv-hide-narrow'},
    ], (tr, r) => { tr.dataset.key = enc(r.jugador) + ',' + enc(r.id_torneo); });
  });

  dash.draw('grafico-mes', (el) => {
    el.replaceChildren();
    const rows = filas('jugador_mes');
    const nombre = jugadorActual();
    if (!rows || !nombre) return;
    const datos = rows.filter((r) => r.jugador === nombre).map((r) => ({...r, d: new Date(r.mes + '-01T00:00:00Z')}));
    if (!datos.length) return;
    const W = el.clientWidth || 560, H = 240, mb = 26;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
      .attr('aria-label', '% promedio por mes de ' + nombre);
    const lo = Math.min(40, d3.min(datos, (r) => r.pct)), hi = Math.max(60, d3.max(datos, (r) => r.pct));
    const y = d3.scaleLinear([Math.floor(lo / 5) * 5, Math.ceil(hi / 5) * 5], [H - mb, 10]);
    const ml = anchoTexto(svg, y.domain()[1] + '%') + 10;
    const ext = d3.extent(datos, (r) => r.d);
    if (+ext[0] === +ext[1]) ext[1] = d3.utcMonth.offset(ext[1], 1);
    const x = d3.scaleUtc(ext, [ml + 6, W - 10]);
    ejeY(svg, y, ml, W - 10, (v) => v + '%');
    svg.append('g').attr('transform', `translate(0,${H - mb})`)
      .call(d3.axisBottom(x).ticks(Math.max(2, Math.floor((W - ml) / 90))).tickFormat(d3.utcFormat('%b %Y')).tickSizeOuter(0))
      .call(estiloEje);
    svg.append('line').attr('x1', ml).attr('x2', W - 10).attr('y1', y(50)).attr('y2', y(50))
      .attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 4');
    const id = 'bv-grad-mes';
    const grad = svg.append('defs').append('linearGradient').attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    [[0, .26], [.25, .16], [.5, .08], [.75, .03], [1, 0]].forEach(([o, a]) => grad.append('stop').attr('offset', o).attr('style', `stop-color:${dash.colors[0]};stop-opacity:${a}`));
    svg.append('path').datum(datos).attr('fill', `url(#${id})`)
      .attr('d', d3.area().x((r) => x(r.d)).y0(H - mb).y1((r) => y(r.pct)));
    svg.append('path').datum(datos).attr('fill', 'none').attr('stroke', dash.colors[0]).attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
      .attr('d', d3.line().x((r) => x(r.d)).y((r) => y(r.pct)));
    const radio = d3.scaleSqrt([1, Math.max(2, d3.max(datos, (r) => r.torneos))], [2.5, 6]);
    svg.append('g').selectAll('circle').data(datos).join('circle')
      .attr('cx', (r) => x(r.d)).attr('cy', (r) => y(r.pct)).attr('r', (r) => radio(r.torneos)).attr('fill', dash.colors[0]);
    const tip = tooltip(el);
    const finder = d3.bisector((r) => r.d).center;
    const marca = svg.append('circle').attr('r', 8).attr('fill', 'none').attr('stroke', dash.colors[0]).attr('stroke-width', 2).style('opacity', 0);
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - 10 - ml).attr('height', H - mb).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const r = datos[finder(datos, x.invert(d3.pointer(ev)[0]))];
        marca.attr('cx', x(r.d)).attr('cy', y(r.pct)).style('opacity', 1);
        tip.show([d3.utcFormat('%B %Y')(r.d), fmt.pct(r.pct) + ' · ' + r.torneos + (r.torneos === 1 ? ' torneo' : ' torneos')],
                 x(r.d) / W * el.clientWidth, y(r.pct) / H * el.clientHeight);
      })
      .on('pointerleave', () => { tip.hide(); marca.style('opacity', 0); });
  });
})();
