// Pestaña Resumen
(() => {
  const {fmt, filas, anio, anios, minimo, listaBarras, mancuernas, verJugador, tooltip, ejeY, anchoTexto, estiloEje} = window.bv;
  const TOP = 10;
  const deAnio = (id) => (filas(id) || []).filter((r) => r.anio === anio());

  dash.draw('top-jugadores', (ol) => {
    if (!anio() || !filas('jugador_anio')) { ol.replaceChildren(); return; }
    const rows = deAnio('jugador_anio').filter((r) => r.torneos >= minimo('jugador')).sort((a, b) => b.pct - a.pct).slice(0, TOP);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.jugador, valor: r.pct, texto: fmt.pct(r.pct),
      sub: `${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares`, clic: () => verJugador(r.jugador),
    })), {dominio: [40, Math.max(60, d3.max(rows, (r) => r.pct) || 60)], color: dash.colors[0]});
  });

  dash.draw('top-parejas', (ol) => {
    if (!anio() || !filas('pareja_anio')) { ol.replaceChildren(); return; }
    const rows = deAnio('pareja_anio').filter((r) => r.torneos >= minimo('pareja')).sort((a, b) => b.pct - a.pct).slice(0, TOP);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.pareja, valor: r.pct, texto: fmt.pct(r.pct),
      sub: `${fmt.int(r.torneos)} torneos juntos · ${fmt.int(r.victorias)} primeros lugares`,
    })), {dominio: [40, Math.max(60, d3.max(rows, (r) => r.pct) || 60)], color: dash.colors[1]});
  });

  dash.draw('top-victorias', (ol) => {
    if (!anio() || !filas('jugador_anio')) { ol.replaceChildren(); return; }
    const rows = deAnio('jugador_anio').sort((a, b) => b.victorias - a.victorias || b.pct - a.pct).slice(0, TOP);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.jugador, valor: r.victorias, texto: fmt.int(r.victorias),
      sub: `de ${fmt.int(r.torneos)} torneos · ${fmt.int(r.podios)} podios`, clic: () => verJugador(r.jugador),
    })), {color: dash.colors[2]});
  });

  dash.draw('top-activos', (ol) => {
    if (!anio() || !filas('jugador_anio')) { ol.replaceChildren(); return; }
    const rows = deAnio('jugador_anio').sort((a, b) => b.torneos - a.torneos).slice(0, TOP);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.jugador, valor: r.torneos, texto: fmt.int(r.torneos),
      sub: `${fmt.pct(r.pct)} promedio`, clic: () => verJugador(r.jugador),
    })), {color: dash.colors[3], medallas: false});
  });

  // mejoras: cada año contra el anterior; en "Histórico", primer año contra el más reciente
  dash.draw('mejora-titulo', (el) => {
    const a = anio();
    el.textContent = !a ? '—' : a === 'todos' ? '· desde su primer año' : `· ${a} vs ${Number(a) - 1}`;
  });
  dash.draw('mejora-modo', () => {
    const historico = anio() === 'todos';
    document.querySelectorAll('.bv-mejora-anual').forEach((p) => { p.hidden = historico; });
    document.querySelectorAll('.bv-mejora-historica').forEach((p) => { p.hidden = !historico; });
  });
  const dibujarMejoras = (tipo) => (ol) => {
    const rows = filas('mejoras');
    const a = anio();
    if (!rows || !a) { ol.replaceChildren(); return; }
    const sel = rows.filter((r) => r.anio === a && r.tipo === tipo).slice(0, 8);
    mancuernas(ol, sel.map((r) => ({
      nombre: r.nombre, antes: r.pct_anterior, ahora: r.pct, texto: d3.format('+.1f')(r.mejora) + ' pts',
      sub: `${r.anio_desde}: ${fmt.pct(r.pct_anterior)} (${r.torneos_anterior} torneos) → ${r.anio_hasta}: ${fmt.pct(r.pct)} (${r.torneos} torneos)`,
      clic: tipo === 'jugador' ? () => verJugador(r.nombre) : null,
    })), 'var(--color-ok)');
  };
  dash.draw('mejoras-jugador', dibujarMejoras('jugador'));
  dash.draw('mejoras-pareja', dibujarMejoras('pareja'));

  dash.draw('records', (el) => {
    const rows = filas('records');
    if (!rows || !anio()) { el.replaceChildren(); return; }
    el.replaceChildren(...rows.filter((r) => r.anio === anio()).slice(0, 8).map((r) => {
      const card = document.createElement('div');
      card.className = 'bv-record';
      const b = document.createElement('b');
      b.textContent = fmt.pct(r.porcentaje);
      const s = document.createElement('span');
      s.textContent = r.pareja;
      const sm = document.createElement('small');
      sm.textContent = `${r.fecha} · ${r.torneo} · ${r.parejas_linea} parejas en la línea`;
      card.append(b, s, sm);
      return card;
    }));
  });

  // jugadores activos por mes, con los nuevos destacados
  dash.draw('grafico-actividad', (el) => {
    el.replaceChildren();
    const rows = filas('actividad_mes');
    const a = anio();
    if (!rows || !a) return;
    const datos = rows.filter((r) => a === 'todos' || r.mes.startsWith(a));
    if (!datos.length) return;
    const W = el.clientWidth || 640, H = 240, mb = 26, mt = 8;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`)
      .attr('role', 'img').attr('aria-label', 'Jugadores activos por mes');
    const y = d3.scaleLinear([0, d3.max(datos, (r) => r.jugadores) * 1.08], [H - mb, mt]).nice();
    const ml = anchoTexto(svg, d3.format(',')(y.domain()[1])) + 10;
    const x = d3.scaleBand(datos.map((r) => r.mes), [ml, W - 4]).padding(0.25);
    ejeY(svg, y, ml, W - 4, d3.format(','));
    const parse = (m) => new Date(m + '-01T00:00:00Z');
    const cada = Math.max(1, Math.ceil(datos.length / Math.max(2, Math.floor((W - ml) / 70))));
    const etiquetaMes = a === 'todos' ? d3.utcFormat('%b %y') : d3.utcFormat('%b');
    svg.append('g').attr('transform', `translate(0,${H - mb})`)
      .call(d3.axisBottom(x).tickValues(datos.map((r) => r.mes).filter((_, i) => i % cada === 0)).tickFormat((m) => etiquetaMes(parse(m))).tickSizeOuter(0))
      .call(estiloEje);
    const bw = Math.min(32, x.bandwidth()), off = (x.bandwidth() - bw) / 2;
    const rx = Math.min(4, bw / 2);
    svg.append('g').selectAll('rect').data(datos).join('rect')
      .attr('x', (r) => x(r.mes) + off).attr('width', bw)
      .attr('y', (r) => y(r.jugadores)).attr('height', (r) => y(0) - y(r.jugadores))
      .attr('rx', rx).attr('fill', dash.colors[0]).attr('opacity', 0.45);
    svg.append('g').selectAll('rect').data(datos).join('rect')
      .attr('x', (r) => x(r.mes) + off).attr('width', bw)
      .attr('y', (r) => y(r.jugadores_nuevos)).attr('height', (r) => y(0) - y(r.jugadores_nuevos))
      .attr('rx', rx).attr('fill', dash.colors[0]);
    const tip = tooltip(el);
    svg.append('g').selectAll('rect').data(datos).join('rect')
      .attr('x', (r) => x(r.mes)).attr('width', x.step()).attr('y', mt).attr('height', H - mb - mt).attr('fill', 'transparent')
      .on('pointerenter', (ev, r) => {
        const px = (x(r.mes) + x.bandwidth() / 2) / W * el.clientWidth;
        const py = y(r.jugadores) / H * el.clientHeight;
        tip.show([d3.utcFormat('%B %Y')(parse(r.mes)), `${fmt.int(r.jugadores)} jugadores`, `${fmt.int(r.jugadores_nuevos)} nuevos`,
                  `${fmt.int(r.torneos)} torneos · ${r.parejas_por_torneo} parejas por torneo`], px, py);
      })
      .on('pointerleave', () => tip.hide());
  });
})();
