// Pestaña Inicio: historias, temporadas, avances por año y curiosidades
(() => {
  const {fmt, filas, lindo, listaBarras, verJugador, anios} = window.bv;
  // cada grupo es un palo
  const GRUPOS = {
    dominio: {palo: '♠', color: () => dash.colors[0]},
    parejas: {palo: '♥', color: () => dash.colors[4]},
    estilos: {palo: '♦', color: () => dash.colors[1]},
    manos: {palo: '♣', color: () => dash.colors[3]},
    club: {palo: 'ST', color: () => dash.colors[2]},
    asistencia: {palo: '', color: () => dash.colors[5]},
  };

  const tarjeta = (h, conPalo) => {
    const g = GRUPOS[h.grupo] || GRUPOS.club;
    const card = document.createElement('article');
    card.className = 'bv-feature';
    card.style.setProperty('--g', g.color());
    const crear = (clase, texto) => { const e = document.createElement('div'); e.className = clase; e.textContent = texto; return e; };
    if (conPalo) card.appendChild(crear('bv-f-palo', g.palo));
    card.append(crear('bv-f-cifra', h.cifra), crear('bv-f-unidad', h.unidad), crear('bv-f-titulo', h.titulo), crear('bv-f-detalle', h.detalle));
    if (h.jugador) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-linkbtn';
      b.textContent = 'Ver ficha';
      b.addEventListener('click', () => verJugador(h.jugador));
      card.appendChild(b);
    }
    return card;
  };

  dash.draw('inicio-destacados', (el) => {
    const rows = filas('hallazgos');
    el.replaceChildren(...(rows || []).filter((h) => h.destacado).map((h) => tarjeta(h, true)));
  });
  dash.draw('inicio-grupo', (el) => {
    const rows = filas('hallazgos');
    el.replaceChildren(...(rows || []).filter((h) => h.grupo === el.dataset.grupo && !h.destacado).map((h) => tarjeta(h, false)));
  });

  dash.draw('inicio-temporadas', (el) => {
    const rows = filas('campeones_anio');
    if (!rows) { el.replaceChildren(); return; }
    const ultimo = anios()[anios().length - 1];
    const premio = (label, nombre, extra, oro) => {
      if (!nombre) return null;
      const d = document.createElement('div');
      d.className = 'bv-premio' + (oro ? ' bv-oro' : '');
      const s = document.createElement('span');
      s.textContent = `${label} · ${extra}`;
      const b = document.createElement('b');
      b.textContent = lindo(nombre);
      d.append(s, b);
      return d;
    };
    el.replaceChildren(...rows.slice().sort((a, b) => b.anio.localeCompare(a.anio)).map((r) => {
      const card = document.createElement('article');
      card.className = 'bv-temporada';
      const h = document.createElement('div');
      h.className = 'bv-temporada-anio';
      h.textContent = r.anio;
      if (r.anio === ultimo) {
        const s = document.createElement('small');
        s.textContent = 'en curso';
        h.appendChild(s);
      }
      card.appendChild(h);
      card.append(...[
        premio('Mejor jugador', r.campeon, fmt.pct(r.campeon_pct) + ' ajustado', true),
        premio('Mejor pareja', r.pareja, fmt.pct(r.pareja_pct) + ' ajustado', true),
        premio('Más victorias', r.ganador, `${r.victorias} torneos`),
        premio('Más torneos', r.activo, `${r.activo_torneos} jugados`),
        premio('Mayor mejora', r.mejora, r.mejora_pts == null ? '' : d3.format('+.1f')(r.mejora_pts) + ' puntos'),
        premio('Mejor novato', r.novato, r.novato_pct == null ? '' : fmt.pct(r.novato_pct)),
      ].filter(Boolean));
      return card;
    }));
  });

  // gráfico chico por año: barras desde cero para cantidades, línea para tasas
  dash.draw('mini', (el) => {
    el.replaceChildren();
    const rows = filas(el.dataset.datos || 'resumen_anio');
    if (!rows) return;
    const datos = rows.filter((r) => r.anio !== 'todos').sort((a, b) => a.anio.localeCompare(b.anio));
    const campo = el.dataset.campo, f = fmt[el.dataset.fmt] || fmt.texto, color = dash.colors[Number(el.dataset.color)];
    const W = el.clientWidth || 240, H = 130, mt = 20, mb = 20;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const x = d3.scaleBand(datos.map((r) => r.anio), [4, W - 4]).padding(0.28);
    const etiqueta = (sel, ty) => sel.attr('text-anchor', 'middle').attr('fill', 'var(--color-fg)')
      .attr('font-size', 'var(--cds-font-size-caption)').attr('x', (r) => x(r.anio) + x.bandwidth() / 2).attr('y', ty).text((r) => f(r[campo]));
    svg.append('g').selectAll('text').data(datos).join('text').attr('text-anchor', 'middle').attr('fill', 'var(--color-fg-muted)')
      .attr('font-size', 'var(--cds-font-size-caption)').attr('x', (r) => x(r.anio) + x.bandwidth() / 2).attr('y', H - 4).text((r) => "'" + r.anio.slice(2));
    if (el.dataset.tipo === 'barras') {
      const y = d3.scaleLinear([0, d3.max(datos, (r) => r[campo])], [H - mb, mt]);
      svg.append('g').selectAll('rect').data(datos).join('rect').attr('x', (r) => x(r.anio)).attr('width', x.bandwidth())
        .attr('y', (r) => y(r[campo])).attr('height', (r) => y(0) - y(r[campo])).attr('rx', 4).attr('fill', color);
      svg.append('g').selectAll('text').data(datos).join('text').call(etiqueta, (r) => y(r[campo]) - 5);
    } else {
      const ext = d3.extent(datos, (r) => r[campo]);
      const pad = (ext[1] - ext[0]) * 0.35 || 1;
      const y = d3.scaleLinear([ext[0] - pad, ext[1] + pad], [H - mb, mt]);
      const cx = (r) => x(r.anio) + x.bandwidth() / 2;
      svg.append('path').datum(datos).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round').attr('d', d3.line().x(cx).y((r) => y(r[campo])));
      svg.append('g').selectAll('circle').data(datos).join('circle').attr('cx', cx).attr('cy', (r) => y(r[campo])).attr('r', 4).attr('fill', color);
      svg.append('g').selectAll('text').data(datos).join('text').call(etiqueta, (r) => y(r[campo]) - 9);
    }
  });

  dash.draw('inicio-dias', (ol) => {
    const rows = filas('dias_semana');
    if (!rows) { ol.replaceChildren(); return; }
    listaBarras(ol, rows.map((r) => ({
      etiquetaRank: r.dia.slice(0, 2), nombre: r.dia, valor: r.parejas_por_torneo, texto: fmt.dec(r.parejas_por_torneo),
      sub: `${fmt.int(r.torneos)} torneos`,
    })), {dominio: [0, d3.max(rows, (r) => r.parejas_por_torneo)], medallas: false, color: dash.colors[5]});
  });
})();
