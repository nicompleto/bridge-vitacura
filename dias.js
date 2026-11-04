// Pestaña Días: dificultad y carácter de cada día de la semana
(() => {
  const {fmt, filas, lindo, listaBarras, verJugador, tooltip, ejeY, anchoTexto, estiloEje} = window.bv;
  const COLOR_DIA = {Lunes: 0, Martes: 1, Jueves: 5, Viernes: 4, 'Sábado': 2, Domingo: 3};
  const q = {dia: null};
  const diaElegido = () => {
    const rows = filas('dias_semana') || [];
    return rows.some((r) => r.dia === q.dia) ? q.dia : (rows[0] && rows[0].dia);
  };

  dash.draw('dias-tarjetas', (el) => {
    const rows = filas('dias_semana');
    if (!rows) { el.replaceChildren(); return; }
    el.replaceChildren(...rows.map((r) => {
      const card = document.createElement('article');
      card.className = 'bv-dia';
      const top = document.createElement('div');
      top.className = 'bv-dia-top';
      const n = document.createElement('span');
      n.className = 'bv-dia-nombre';
      n.textContent = r.dia;
      const d = document.createElement('span');
      d.className = 'bv-dia-dif ' + (r.dificultad > 0 ? 'bv-duro' : 'bv-facil');
      d.textContent = `dificultad ${fmt.dif(r.dificultad)}`;
      top.append(n, d);
      const sello = document.createElement('p');
      sello.className = 'bv-dia-sello';
      sello.textContent = r.sello.charAt(0).toUpperCase() + r.sello.slice(1) + '.';
      const dl = document.createElement('dl');
      [
        ['Torneos', fmt.int(r.torneos)],
        ['Parejas por torneo', fmt.dec(r.parejas_por_torneo)],
        ['Manos con manga posible', fmt.pct(r.pct_manga_dd)],
        ['Contratos cumplidos', fmt.pct(r.pct_cumplido)],
        ['Slams cada 100 contratos', fmt.dec(r.slams_100)],
        ['Mejor jugador', `${lindo(r.mejor_jugador)} (${fmt.pct(r.mejor_jugador_pct)})`],
        ['Quien más va', `${lindo(r.mas_asiduo)} (${fmt.int(r.mas_asiduo_torneos)})`],
      ].forEach(([k, v]) => {
        const f = document.createElement('div');
        const dt = document.createElement('dt');
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.textContent = v;
        f.append(dt, dd);
        dl.appendChild(f);
      });
      card.append(top, sello, dl);
      return card;
    }));
  });

  dash.draw('dias-dificultad', (ol) => {
    const rows = filas('dias_semana');
    if (!rows) { ol.replaceChildren(); return; }
    const sel = rows.slice().sort((a, b) => b.dificultad - a.dificultad);
    const lo = d3.min(sel, (r) => r.dificultad);
    listaBarras(ol, sel.map((r) => ({
      nombre: r.dia, valor: r.dificultad, texto: fmt.dif(r.dificultad) + ' puntos',
      sub: `los 30 más fuertes sacan ${fmt.pct(r.pct_fuertes)}`,
    })), {dominio: [lo - 0.3, d3.max(sel, (r) => r.dificultad)], medallas: false,
          colores: sel.map((r) => (r.dificultad > 0 ? 'var(--color-bad)' : 'var(--color-ok)'))});
  });

  dash.draw('dias-cartas', (ol) => {
    const rows = filas('dias_semana');
    if (!rows) { ol.replaceChildren(); return; }
    const sel = rows.slice().sort((a, b) => b.pct_manga_dd - a.pct_manga_dd);
    listaBarras(ol, sel.map((r) => ({
      nombre: r.dia, valor: r.pct_manga_dd, texto: fmt.pct(r.pct_manga_dd),
      sub: `${fmt.pct(r.pct_slam_dd)} con slam posible · una línea trae ${fmt.dec(r.dif_hcp)} puntos más que la otra`,
    })), {dominio: [0, 100], medallas: false, color: dash.colors[3]});
  });

  // una línea por día, con su nombre al final
  dash.draw('dias-linea', (el) => {
    el.replaceChildren();
    const rows = filas('dias_anio');
    if (!rows) return;
    const campo = el.dataset.campo, f = fmt[el.dataset.fmt] || fmt.texto;
    const datos = rows.filter((r) => r[campo] != null);
    if (!datos.length) return;
    const anios = [...new Set(datos.map((r) => r.anio))].sort();
    const W = el.clientWidth || 520, H = 240, mb = 24;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const ext = d3.extent(datos, (r) => r[campo]);
    const pad = (ext[1] - ext[0]) * 0.08;
    const y = d3.scaleLinear([ext[0] - pad, ext[1] + pad], [H - mb, 10]).nice();
    const ml = anchoTexto(svg, f(y.domain()[1])) + 10;
    const mr = anchoTexto(svg, 'Domingo +0.0') + 10;
    const x = d3.scalePoint(anios, [ml + 6, W - mr]);
    ejeY(svg, y, ml, W - mr, (v) => f(v));
    svg.append('g').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).tickSizeOuter(0)).call(estiloEje);
    if (campo === 'dificultad') {
      svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(0)).attr('y2', y(0))
        .attr('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 4');
    }
    const grupos = d3.groups(datos, (r) => r.dia).map(([dia, v]) => ({dia, v: v.sort((a, b) => a.anio.localeCompare(b.anio))}));
    const color = (dia) => dash.colors[COLOR_DIA[dia] ?? 0];
    grupos.forEach(({dia, v}) => {
      svg.append('path').datum(v).attr('fill', 'none').attr('stroke', color(dia)).attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round')
        .attr('d', d3.line().x((r) => x(r.anio)).y((r) => y(r[campo])));
      svg.append('g').selectAll('circle').data(v).join('circle').attr('cx', (r) => x(r.anio)).attr('cy', (r) => y(r[campo])).attr('r', 3).attr('fill', color(dia));
    });
    // etiquetas al final de cada línea, separadas para que no se pisen
    const fin = grupos.map(({dia, v}) => ({dia, r: v[v.length - 1], py: y(v[v.length - 1][campo])})).sort((a, b) => a.py - b.py);
    fin.forEach((e, i) => { if (i && e.py - fin[i - 1].py < 14) e.py = fin[i - 1].py + 14; });
    svg.append('g').selectAll('text').data(fin).join('text').attr('x', (e) => x(e.r.anio) + 8).attr('y', (e) => e.py).attr('dy', '0.32em')
      .attr('fill', 'var(--color-fg)').attr('font-size', 'var(--cds-font-size-caption)').text((e) => `${e.dia} ${f(e.r[campo])}`);
    const tip = tooltip(el);
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - mr - ml).attr('height', H - mb).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const px = d3.pointer(ev)[0];
        const anio = anios.reduce((m, a) => (Math.abs(x(a) - px) < Math.abs(x(m) - px) ? a : m), anios[0]);
        const lineas = datos.filter((r) => r.anio === anio).sort((a, b) => b[campo] - a[campo]).map((r) => `${r.dia}: ${f(r[campo])}`);
        tip.show([anio, ...lineas], x(anio) / W * el.clientWidth, 90);
      })
      .on('pointerleave', () => tip.hide());
  });

  dash.draw('dias-chips', (el) => {
    const rows = filas('dias_semana');
    if (!rows) { el.replaceChildren(); return; }
    const actual = diaElegido();
    el.replaceChildren(...rows.map((r) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-chip';
      b.textContent = r.dia;
      b.setAttribute('aria-pressed', String(r.dia === actual));
      b.addEventListener('click', () => { q.dia = r.dia; dash.draw('dias-chips'); dash.draw('dias-top'); });
      return b;
    }));
  });

  dash.draw('dias-top', (ol) => {
    const rows = filas('jugador_dia');
    const dias = filas('dias_semana');
    if (!rows || !dias) { ol.replaceChildren(); return; }
    const dia = diaElegido();
    const info = dias.find((r) => r.dia === dia);
    const sel = rows.filter((r) => r.dia === dia && r.torneos >= info.minimo_ranking).sort((a, b) => b.pct - a.pct).slice(0, 8);
    listaBarras(ol, sel.map((r) => ({
      nombre: lindo(r.jugador), valor: r.pct, texto: fmt.pct(r.pct), clic: () => verJugador(r.jugador),
      sub: `${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares`,
    })), {dominio: [40, Math.max(65, d3.max(sel, (r) => r.pct) || 65)], color: dash.colors[COLOR_DIA[dia] ?? 0]});
  });
})();
