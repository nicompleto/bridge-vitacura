// Pestaña Ficha de jugador
(() => {
  const {fmt, enc, filas, jugadorActual, llenar, lindo, buscador, listaBarras, tooltip, ejeY, anchoTexto, estiloEje} = window.bv;

  // medallas: código -> [lo que se ve en la medalla, nombre, categoría]
  const MEDALLAS = {
    T50: ['50', '50 torneos', 'bronce'], T100: ['100', '100 torneos', 'plata'], T250: ['250', '250 torneos', 'oro'], T500: ['500', '500 torneos', 'oro'],
    V1: ['1°', 'Primera victoria', 'bronce'], V10: ['10', '10 victorias', 'plata'], V50: ['50', '50 victorias', 'oro'], V100: ['100', '100 victorias', 'oro'],
    P10: ['10', '10 podios', 'bronce'], P100: ['100', '100 podios', 'oro'],
    R70: ['70%', 'Un torneo de 70%', 'plata'], R75: ['75%', 'Un torneo de 75%', 'oro'],
    S10: ['10', '10 torneos seguidos sobre 50%', 'plata'], S25: ['25', '25 torneos seguidos sobre 50%', 'oro'],
    L10: ['10', '10 slams cumplidos', 'bronce'], L50: ['50', '50 slams cumplidos', 'plata'], G1: ['7', 'Gran slam cumplido', 'oro'],
    A5: ['5', 'Cinco años jugando', 'plata'], D5: ['♣', 'Juega cualquier día', 'bronce'], F100: ['♥', '100 torneos con la misma pareja', 'oro'],
  };
  const medallasDe = () => {
    const r = (filas('jugador_medallas') || []).find((x) => x.jugador === jugadorActual());
    return r ? new Set(String(r.medallas || '').split(',').filter(Boolean)) : null;
  };
  dash.draw('medallas-cuenta', (el) => {
    const m = medallasDe();
    el.textContent = m ? `${m.size} de ${Object.keys(MEDALLAS).length}` : '—';
  });
  dash.draw('medallas', (el) => {
    const m = medallasDe();
    if (!m) { el.replaceChildren(); return; }
    const codigos = Object.keys(MEDALLAS).sort((a, b) => m.has(b) - m.has(a));
    el.replaceChildren(...codigos.map((c) => {
      const [valor, nombre, tipo] = MEDALLAS[c];
      const d = document.createElement('div');
      d.className = `bv-medalla bv-${tipo}` + (m.has(c) ? '' : ' bv-bloqueada');
      const i = document.createElement('i');
      i.textContent = valor;
      const s = document.createElement('span');
      s.textContent = nombre;
      d.append(i, s);
      return d;
    }));
  });

  buscador('sugerencias-ficha', '#buscar-ficha', () => (filas('jugadores') || []).map((r) => r.jugador).sort(), (n) => { dash.setParams({jugador: n}); });

  const fila = () => (filas('jugadores') || []).find((x) => x.jugador === jugadorActual());
  dash.draw('perfil-nombre', (el) => { const r = fila(); el.textContent = r ? lindo(r.jugador) : '—'; });
  dash.draw('perfil-avatar', (el) => {
    const r = fila();
    el.textContent = r ? r.jugador.split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('') : '—';
  });
  dash.draw('perfil-companero', (el) => { const r = fila(); el.textContent = r && r.companero_frecuente ? lindo(r.companero_frecuente) : '—'; });
  dash.draw('perfil-dia', (el) => {
    const r = (filas('jugador_freak') || []).find((x) => x.jugador === jugadorActual());
    el.textContent = r && r.dia_favorito ? r.dia_favorito.toLowerCase() : '—';
  });

  // calendario tipo cuadrícula, un cuadro por día del año
  const cal = {anio: null};
  const aniosCal = () => (filas('jugador_calendario') || []).filter((r) => r.jugador === jugadorActual()).map((r) => r.anio).sort();
  const anioCal = () => { const a = aniosCal(); return a.includes(cal.anio) ? cal.anio : a[a.length - 1]; };
  dash.draw('calendario-anios', (el) => {
    const actual = anioCal();
    el.replaceChildren(...aniosCal().map((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-chip';
      b.textContent = a;
      b.setAttribute('aria-pressed', String(a === actual));
      b.addEventListener('click', () => { cal.anio = a; dash.draw('calendario-anios'); dash.draw('calendario'); });
      return b;
    }));
  });
  dash.draw('calendario', (el) => {
    const a = anioCal();
    const r = (filas('jugador_calendario') || []).find((x) => x.jugador === jugadorActual() && x.anio === a);
    if (!r) { el.replaceChildren(); return; }
    const dias = new Map(r.dias.split(',').map((d) => d.split(':')));
    const celdas = [];
    const inicio = new Date(Date.UTC(Number(a), 0, 1));
    for (let i = 0; i < (inicio.getUTCDay() + 6) % 7; i++) { const v = document.createElement('div'); v.style.visibility = 'hidden'; celdas.push(v); }
    for (let d = new Date(inicio); d.getUTCFullYear() === Number(a); d.setUTCDate(d.getUTCDate() + 1)) {
      const c = document.createElement('div');
      const clave = d3.utcFormat('%m%d')(d);
      if (dias.has(clave)) {
        const p = Number(dias.get(clave));
        c.className = p >= 60 ? 'bv-c4' : p >= 52 ? 'bv-c3' : p >= 45 ? 'bv-c2' : 'bv-c1';
        c.title = `${d3.utcFormat('%d-%m-%Y')(d)}: ${p}%`;
      }
      celdas.push(c);
    }
    el.replaceChildren(...celdas);
  });

  dash.draw('puntos', (ol) => {
    const signo = Number(ol.dataset.signo);
    const sel = (filas('jugador_puntos') || []).filter((r) => r.jugador === jugadorActual() && r.dif * signo >= 0.5).sort((a, b) => (b.dif - a.dif) * signo).slice(0, 3);
    if (!sel.length) {
      const li = document.createElement('li');
      li.textContent = 'Nada que destacar: rinde parejo en todos los tipos de mano.';
      ol.replaceChildren(li);
      return;
    }
    ol.replaceChildren(...sel.map((r) => {
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.textContent = r.tipo;
      const b = document.createElement('b');
      b.textContent = `${d3.format('+.1f')(r.dif)} puntos`;
      b.style.color = signo > 0 ? 'var(--color-ok)' : 'var(--color-bad)';
      li.append(n, b);
      return li;
    }));
  });

  dash.draw('ficha', (el) => {
    const rows = filas('jugadores');
    const nombre = jugadorActual();
    const r = rows && rows.find((x) => x.jugador === nombre);
    if (!r) { el.textContent = '—'; return; }
    el.dataset.where = 'jugador=' + enc(nombre);
    el.textContent = (fmt[el.dataset.fmt] || fmt.texto)(r[el.dataset.field]);
  });

  // datos curiosos: [etiqueta, campo, formato, campo del detalle o función]
  const FREAK = [
    ['Mejor puntaje en una mano', 'mejor_puntaje', fmt.int, 'mejor_puntaje_detalle'],
    ['Peor puntaje en una mano', 'peor_puntaje', fmt.int, 'peor_puntaje_detalle'],
    ['Más puntos entre los dos', 'max_hcp', fmt.int, 'max_hcp_detalle'],
    ['Menos puntos entre los dos', 'min_hcp', fmt.int, 'min_hcp_detalle'],
    ['Mejor torneo', 'mejor_torneo', fmt.pct, 'mejor_torneo_detalle'],
    ['Peor torneo', 'peor_torneo', fmt.pct, 'peor_torneo_detalle'],
    ['Racha más larga sobre 50%', 'racha50', fmt.int, 'racha50_detalle'],
    ['Contrato que más juega', 'contrato_favorito', fmt.texto, (r) => `${fmt.int(r.contrato_veces)} veces, ${fmt.pct(r.contrato_cumplido)} cumplido`],
    ['Su día', 'dia_favorito', fmt.texto, (r) => `${fmt.pct(r.dia_favorito_pct)} de sus torneos`],
    ['Nunca va', 'dias_sin_ir', fmt.texto, () => 'sin contar los jueves, casi solo de eventos'],
    ['Manos con top (100%)', 'manos_100', fmt.int, (r) => `y ${fmt.int(r.manos_0)} manos con 0%`],
    ['Rival favorito', 'rival_favorito_pct', fmt.pct, (r) => `contra ${r.rival_favorito}, en ${fmt.int(r.rival_favorito_manos)} manos`],
    ['Bestia negra', 'bestia_negra_pct', fmt.pct, (r) => `contra ${r.bestia_negra}, en ${fmt.int(r.bestia_negra_manos)} manos`],
  ];
  dash.draw('freak', (el) => {
    const rows = filas('jugador_freak');
    const nombre = jugadorActual();
    const r = rows && rows.find((x) => x.jugador === nombre);
    if (!r) { el.replaceChildren(); return; }
    el.replaceChildren(...FREAK.filter(([, campo]) => r[campo] != null).map(([etiqueta, campo, f, det]) => {
      const c = document.createElement('div');
      c.className = 'bv-freak-item';
      const s = document.createElement('span');
      s.textContent = etiqueta;
      const b = document.createElement('b');
      b.textContent = f(r[campo]);
      const m = document.createElement('small');
      m.textContent = (typeof det === 'function' ? det(r) : r[det]) || '';
      c.append(s, b, m);
      return c;
    }));
  });

  dash.draw('ficha-dias', (ol) => {
    const rows = filas('jugador_dia');
    const nombre = jugadorActual();
    if (!rows || !nombre) { ol.replaceChildren(); return; }
    const orden = ['Lunes', 'Martes', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const sel = rows.filter((r) => r.jugador === nombre).sort((a, b) => orden.indexOf(a.dia) - orden.indexOf(b.dia));
    const mejor = d3.max(sel, (r) => r.pct);
    listaBarras(ol, sel.map((r) => ({
      etiquetaRank: r.dia.slice(0, 2), nombre: r.dia, valor: r.pct, texto: fmt.pct(r.pct),
      sub: `${fmt.pct(r.pct_ajustado)} ajustado · ${fmt.int(r.torneos)} torneos · ${fmt.int(r.victorias)} primeros lugares`,
    })), {dominio: [30, 70], medallas: false, colores: sel.map((r) => (r.pct === mejor ? 'var(--color-ok)' : 'var(--cds-chart-muted)'))});
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
