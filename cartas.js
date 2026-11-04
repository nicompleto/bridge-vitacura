// Pestaña Juego de cartas
dash.calc('palos', {
  title: 'Contratos por palo',
  description: 'Suma los contratos de cada palo (todos los niveles) por año: veces, % del total y % cumplido.',
  inputs: ['contratos'],
  fn: (contratos) => {
    const grupos = d3.rollups(contratos, (v) => ({
      veces: d3.sum(v, (r) => r.veces),
      cumplidos: d3.sum(v, (r) => r.veces * r.pct_cumplido / 100),
    }), (r) => r.anio, (r) => r.palo);
    return grupos.flatMap(([anio, palos]) => {
      const total = d3.sum(palos, ([, s]) => s.veces);
      return palos.map(([palo, s]) => ({
        clave: anio + '|' + palo, anio, palo, veces: s.veces,
        pct_contratos: Math.round(1000 * s.veces / total) / 10,
        pct_cumplido: Math.round(1000 * s.cumplidos / s.veces) / 10,
      }));
    });
  },
});

(() => {
  const {fmt, filas, anio, minimo, listaBarras, verJugador, tooltip, ejeY, anchoTexto, estiloEje} = window.bv;
  // denominaciones como vienen en los datos: T tréboles, D diamantes, C corazones, P picas, S sin triunfo
  const PALOS = [
    {id: 'T', simbolo: '♣', nombre: 'Tréboles', rojo: false},
    {id: 'D', simbolo: '♦', nombre: 'Diamantes', rojo: true},
    {id: 'C', simbolo: '♥', nombre: 'Corazones', rojo: true},
    {id: 'P', simbolo: '♠', nombre: 'Picas', rojo: false},
    {id: 'S', simbolo: 'ST', nombre: 'Sin triunfo', rojo: false},
  ];

  dash.draw('palos', (ol) => {
    const d = dash.data('palos');
    if (d.status !== 'ok' || !anio()) { ol.replaceChildren(); return; }
    const rows = d.data.filter((r) => r.anio === anio());
    const items = PALOS.map((p) => ({p, r: rows.find((r) => r.palo === p.id)})).filter((x) => x.r);
    listaBarras(ol, items.map(({p, r}) => ({
      etiquetaRank: p.simbolo, nombre: p.nombre, valor: r.pct_contratos, texto: fmt.pct(r.pct_contratos),
      sub: `${fmt.int(r.veces)} contratos · ${fmt.pct(r.pct_cumplido)} cumplidos`,
    })), {dominio: [0, d3.max(items, (x) => x.r.pct_contratos)], medallas: false,
          colores: items.map(({p}) => (p.rojo ? 'var(--color-bad)' : 'var(--color-fg)'))});
    ol.querySelectorAll('.bv-rank').forEach((el, i) => {
      el.style.color = items[i].p.rojo ? 'var(--color-bad)' : 'var(--color-fg)';
      el.style.fontSize = 'var(--cds-font-size-heading)';
      el.style.border = '0';
    });
  });

  dash.draw('mapa-contratos', (el) => {
    const rows = filas('contratos');
    if (!rows || !anio()) { el.replaceChildren(); return; }
    const sel = rows.filter((r) => r.anio === anio());
    // los colores de serie son variables CSS: se mezclan con color-mix en vez de interpolar en JS
    const color = (t) => `color-mix(in srgb, ${dash.colors[0]} ${Math.round(12 + t * 88)}%, transparent)`;
    const celdas = [document.createElement('div')];
    PALOS.forEach((p) => {
      const h = document.createElement('div');
      h.className = 'bv-heat-h';
      h.textContent = p.simbolo;
      if (p.rojo) h.style.color = 'var(--color-bad)';
      celdas.push(h);
    });
    for (let nivel = 1; nivel <= 7; nivel++) {
      const l = document.createElement('div');
      l.className = 'bv-heat-l';
      l.textContent = String(nivel);
      celdas.push(l);
      PALOS.forEach((p) => {
        const r = sel.find((x) => x.nivel === nivel && x.palo === p.id);
        const c = document.createElement('div');
        if (r && r.veces >= 20) {
          const t = Math.max(0, Math.min(1, (r.pct_cumplido - 20) / 70));
          c.style.background = color(t);
          c.style.color = t > 0.55 ? 'var(--color-bg)' : 'var(--color-fg)';
          const v = document.createElement('span');
          v.textContent = Math.round(r.pct_cumplido) + '%';
          const n = document.createElement('small');
          n.textContent = fmt.compact(r.veces);
          c.append(v, n);
        } else {
          c.style.color = 'var(--color-fg-muted)';
          c.textContent = r ? '·' : '';
        }
        celdas.push(c);
      });
    }
    el.replaceChildren(...celdas);
  });

  dash.draw('grafico-hcp', (el) => {
    el.replaceChildren();
    const rows = filas('hcp_pct');
    if (!rows || !anio()) return;
    const datos = rows.filter((r) => r.anio === anio() && r.contratos >= 50).sort((a, b) => a.hcp - b.hcp);
    if (!datos.length) return;
    const W = el.clientWidth || 640, H = 260, mb = 34;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
      .attr('aria-label', 'Contratos cumplidos según puntos de honor del declarante');
    const y = d3.scaleLinear([0, 100], [H - mb, 10]);
    const ml = anchoTexto(svg, '100%') + 10;
    const x = d3.scaleLinear(d3.extent(datos, (r) => r.hcp), [ml + 8, W - 12]);
    ejeY(svg, y, ml, W - 12, (v) => v + '%');
    svg.append('g').attr('transform', `translate(0,${H - mb})`)
      .call(d3.axisBottom(x).ticks(Math.min(10, Math.floor((W - ml) / 45))).tickFormat((v) => v).tickSizeOuter(0))
      .call(estiloEje);
    svg.append('text').attr('x', W - 12).attr('y', H - 4).attr('text-anchor', 'end').attr('fill', 'var(--color-fg-muted)')
      .attr('font-size', 'var(--cds-font-size-caption)').text('puntos de honor de la línea');
    if (x.domain()[0] <= 20 && x.domain()[1] >= 20) {
      svg.append('line').attr('x1', x(20)).attr('x2', x(20)).attr('y1', 10).attr('y2', H - mb)
        .attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '2 4');
    }
    const series = [
      {campo: 'pct_cumplido', color: 'var(--color-ok)'},
      {campo: 'pct_manga', color: 'var(--color-warn)'},
    ];
    series.forEach((s) => {
      svg.append('path').datum(datos).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
        .attr('d', d3.line().x((r) => x(r.hcp)).y((r) => y(r[s.campo])));
      svg.append('g').selectAll('circle').data(datos).join('circle')
        .attr('cx', (r) => x(r.hcp)).attr('cy', (r) => y(r[s.campo])).attr('r', 3).attr('fill', s.color);
    });
    const tip = tooltip(el);
    const finder = d3.bisector((r) => r.hcp).center;
    const regla = svg.append('line').attr('y1', 10).attr('y2', H - mb).attr('stroke', 'var(--cds-chart-axis)').style('opacity', 0);
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - 12 - ml).attr('height', H - mb).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const r = datos[finder(datos, x.invert(d3.pointer(ev)[0]))];
        regla.attr('x1', x(r.hcp)).attr('x2', x(r.hcp)).style('opacity', 1);
        tip.show([`${r.hcp} puntos de honor`, `${fmt.pct(r.pct_cumplido)} de los contratos se cumplen`,
                  `${fmt.pct(r.pct_manga)} a nivel de manga o más`, `nivel promedio ${fmt.dec(r.nivel_prom)} · ${fmt.int(r.contratos)} contratos`],
                 x(r.hcp) / W * el.clientWidth, y(r.pct_cumplido) / H * el.clientHeight);
      })
      .on('pointerleave', () => { tip.hide(); regla.style('opacity', 0); });
  });

  const elegibles = () => (filas('jugador_anio') || []).filter((r) => r.anio === anio() && r.manos_declaradas >= minimo('declarante'));
  dash.draw('top-declarantes', (ol) => {
    if (!anio() || !filas('jugador_anio')) { ol.replaceChildren(); return; }
    const rows = elegibles().filter((r) => r.dd_declarando != null).sort((a, b) => b.dd_declarando - a.dd_declarando).slice(0, 10);
    const lo = d3.min(rows, (r) => r.dd_declarando);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.jugador, valor: r.dd_declarando, texto: fmt.dd(r.dd_declarando) + ' bazas',
      sub: `${fmt.int(r.manos_declaradas)} manos declaradas · ${fmt.pct(r.cumple_declarando)} cumplidas`, clic: () => verJugador(r.jugador),
    })), {dominio: [Math.min(0, lo) - 0.05, d3.max(rows, (r) => r.dd_declarando)], color: dash.colors[4]});
  });
  dash.draw('top-defensores', (ol) => {
    if (!anio() || !filas('jugador_anio')) { ol.replaceChildren(); return; }
    const rows = elegibles().filter((r) => r.pct_defendiendo != null).sort((a, b) => b.pct_defendiendo - a.pct_defendiendo).slice(0, 10);
    listaBarras(ol, rows.map((r) => ({
      nombre: r.jugador, valor: r.pct_defendiendo, texto: fmt.pct(r.pct_defendiendo),
      sub: `declarando: ${fmt.pct(r.pct_declarando)}`, clic: () => verJugador(r.jugador),
    })), {dominio: [45, d3.max(rows, (r) => r.pct_defendiendo)], color: dash.colors[5]});
  });
})();
