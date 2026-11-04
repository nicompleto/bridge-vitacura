// Pestaña Estilo de juego
(() => {
  const {fmt, enc, filas, anio, minimo, ordenar, llenar, listaBarras} = window.bv;
  const TOP = 8;
  const club = () => (filas('estilo_club') || []).find((r) => r.anio === anio());
  const elegibles = () => (filas('estilo_parejas') || []).filter((r) => r.anio === anio() && r.manos >= minimo('estilo'));
  const listo = () => anio() && filas('estilo_parejas') && filas('estilo_club');

  dash.draw('kpi-estilo', (el) => {
    const c = club();
    if (!c) { el.textContent = '—'; return; }
    el.dataset.where = 'anio=' + enc(c.anio);
    el.textContent = (fmt[el.dataset.fmt] || fmt.texto)(c[el.dataset.field]);
  });

  // lista de las parejas con el valor más alto (o más bajo) de un campo
  const lista = (campo, {asc = false, texto, sub, color, valor}) => (ol) => {
    if (!listo()) { ol.replaceChildren(); return; }
    const c = club();
    const rows = elegibles().filter((r) => r[campo] != null)
      .sort((a, b) => (asc ? a[campo] - b[campo] : b[campo] - a[campo])).slice(0, TOP);
    const vals = rows.map((r) => (valor ? valor(r) : r[campo]));
    listaBarras(ol, rows.map((r, i) => ({nombre: r.pareja, valor: vals[i], texto: texto(r), sub: sub(r, c)})),
                {dominio: [0, d3.max(vals) || 1], color});
  };

  dash.draw('estilo-st', lista('pct_st', {
    color: dash.colors[1], texto: (r) => fmt.pct(r.pct_st),
    sub: (r, c) => `club ${fmt.pct(c.pct_st)} · ${fmt.int(r.st_solos)} ST solitarios` + (r.pct_en_st_solos != null ? `, ${fmt.pct(r.pct_en_st_solos)} en esas manos` : ''),
  }));
  dash.draw('estilo-fit', lista('pct_fit_corto', {
    color: dash.colors[2], texto: (r) => fmt.pct(r.pct_fit_corto),
    sub: (r, c) => `club ${fmt.pct(c.pct_fit_corto)} · ${fmt.int(r.contratos)} contratos declarados`,
  }));
  dash.draw('estilo-slam', lista('slams_solos_100', {
    color: dash.colors[3], texto: (r) => fmt.dec2(r.slams_solos_100),
    sub: (r, c) => `club ${fmt.dec2(c.slams_solos_100)} · ${fmt.int(r.slams_solos)} slams, ${fmt.int(r.slams_solos_cumplidos)} cumplidos` +
      (r.pct_en_slams_solos != null ? `, ${fmt.pct(r.pct_en_slams_solos)} en esas manos` : ''),
  }));
  dash.draw('estilo-manga', lista('mangas_solas_100', {
    color: dash.colors[0], texto: (r) => fmt.dec2(r.mangas_solas_100),
    sub: (r, c) => `club ${fmt.dec2(c.mangas_solas_100)}` + (r.pct_en_mangas_solas != null ? ` · ${fmt.pct(r.pct_en_mangas_solas)} en esas manos` : '') +
      ` · pierden ${fmt.dec2(r.mangas_perdidas_100)} por cada 100`,
  }));
  dash.draw('estilo-agresivos', lista('pct_sobre_dd', {
    color: dash.colors[4], texto: (r) => fmt.pct(r.pct_sobre_dd),
    sub: (r, c) => `club ${fmt.pct(c.pct_sobre_dd)} · ${fmt.int(r.contratos)} contratos declarados`,
  }));
  dash.draw('estilo-defensa', lista('defensa_dd', {
    asc: true, color: dash.colors[5], valor: (r) => Math.max(0, -r.defensa_dd), texto: (r) => fmt.dd(r.defensa_dd) + ' bazas',
    sub: (r, c) => `club ${fmt.dd(c.defensa_dd)} · doblan ${fmt.int(r.doblan)} veces` + (r.doblan_caen != null ? `, ${fmt.pct(r.doblan_caen)} caen` : ''),
  }));

  const q = {texto: ''};
  document.querySelectorAll('.bv-search-estilo').forEach((el) => el.addEventListener('input', () => { q.texto = el.value.trim().toUpperCase(); dash.draw('tabla-estilo'); }));
  dash.draw('tabla-estilo', (tbody) => {
    if (!listo()) { tbody.replaceChildren(); return; }
    const vis = elegibles().filter((r) => !q.texto || r.pareja.includes(q.texto));
    llenar(tbody, ordenar('estilo', vis, {col: 'manos', dir: 'desc'}), [
      {f: 'pareja'}, {f: 'manos', fmt: fmt.int}, {f: 'pct_st', fmt: fmt.pct}, {f: 'pct_fit_corto', fmt: fmt.pct},
      {f: 'slams_100', fmt: fmt.dec2, cls: 'bv-hide-narrow'}, {f: 'slams_solos', fmt: fmt.int},
      {f: 'mangas_solas_100', fmt: fmt.dec2, cls: 'bv-hide-narrow'}, {f: 'mangas_perdidas_100', fmt: fmt.dec2, cls: 'bv-hide-narrow'},
      {f: 'pct_sobre_dd', fmt: fmt.pct, cls: 'bv-hide-narrow'}, {f: 'defensa_dd', fmt: fmt.dd, cls: 'bv-hide-narrow'},
    ], (tr, r) => { tr.dataset.key = enc(r.pareja) + ',' + enc(r.anio); });
  });
})();
