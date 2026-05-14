// ==================== UTILIDADES & SEGURIDAD ====================
const escapeHtml = (unsafe) => String(unsafe)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const showToast = (msg, duration = 3000) => {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
};

const showModal = (html) => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', (e) => e.target === overlay && overlay.remove());
  document.getElementById('modalContainer').appendChild(overlay);
  return overlay;
};

const fm = (n) => {
  if (isNaN(n) || n === null) return '0';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const getDiasDesde = (f) => {
  if (!f) return 999;
  const [d, m, y] = f.split('/').map(Number);
  return Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000);
};

const randColor = () => ['#d4a017','#22c55e','#3b82f6','#ef4444','#a78bfa','#f59e0b','#ec4899','#14b8a6'][Math.floor(Math.random()*8)];

// ==================== BASE DE DATOS & STORAGE ====================
const STORAGE_KEY = 'ganadero_elite_v32';
let DB = {};

const loadDB = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) throw new Error("Init");
    
    // Migración suave y defaults
    parsed.alimentosCustom = parsed.alimentosCustom || [];
    parsed.sanidadCustom = parsed.sanidadCustom || [];
    parsed.asignacionesAlimentos = parsed.asignacionesAlimentos || {};
    parsed.lotes = parsed.lotes || [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }];
    parsed.animales?.forEach(a => { if(!a.loteId) a.loteId = 'lot_general'; });
    return parsed;
  } catch {
    return {
      animales: [], precios: { pasto: 1200, salvado: 2500, melaza: 3800, levadura: 8000, bicarb: 4500, sal: 6200, urea: 9500 },
      stock: { pasto: 500, salvado: 200, melaza: 50, levadura: 10, bicarb: 5, sal: 2, urea: 20 },
      stockSanidad: {}, preciosSanidad: {}, aplicaciones: [], precioKG: 9800,
      alimentosCustom: [], sanidadCustom: [], asignacionesAlimentos: {},
      lotes: [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }]
    };
  }
};

DB = loadDB();
const saveDB = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));

// ==================== CONSTANTES & CATÁLOGOS ====================
const AL = ['pasto', 'salvado', 'melaza', 'levadura', 'bicarb', 'sal', 'urea'];
const IC = { pasto: 'fa-seedling', salvado: 'fa-wheat-awn', melaza: 'fa-droplet', levadura: 'fa-flask', bicarb: 'fa-cubes', sal: 'fa-vial-circle-check', urea: 'fa-flask-vial' };
const NM = { pasto: 'Pasto Picado', salvado: 'Salvado Trigo', melaza: 'Melaza', levadura: 'Levadura', bicarb: 'Bicarbonato', sal: 'Sal Mineral', urea: 'UREA' };
const CATALOGO_SANIDAD = [
  { id: 'modificador', nombre: 'Modificador Orgánico', dosis: 50, diasEfecto: 90, retiro: 0, icono: 'fa-flask', color: '#22c55e' },
  { id: 'vitaminaA', nombre: 'Vitamina ADE', dosis: 50, diasEfecto: 60, retiro: 30, icono: 'fa-sun', color: '#d4a017' },
  { id: 'complejoB', nombre: 'Complejo B (B12)', dosis: 50, diasEfecto: 20, retiro: 0, icono: 'fa-capsules', color: '#3b82f6' },
  { id: 'ivermectina1', nombre: 'Ivermectina 1%', dosis: 50, diasEfecto: 30, retiro: 28, icono: 'fa-shield-virus', color: '#ef4444' },
  { id: 'ivermectina315', nombre: 'Ivermectina 3.15%', dosis: 50, diasEfecto: 90, retiro: 122, icono: 'fa-shield-halved', color: '#dc2626' },
  { id: 'fosforo', nombre: 'Fósforo B12', dosis: 20, diasEfecto: 30, retiro: 0, icono: 'fa-bone', color: '#a78bfa' },
  { id: 'hierro', nombre: 'Hierro Dextrano', dosis: 100, diasEfecto: 30, retiro: 0, icono: 'fa-droplet', color: '#f87171' }
];

// ==================== MOTOR DE NEGOCIO ====================
const getDiet = (pv, prop, estado) => { 
  if (pv < 20) return AL.reduce((acc, k) => ({...acc, [k]:0}), {});
  const base = pv * 0.03;
  let m = 0, u = 0, b = 0, s = 0;
  const p = prop || 'carne', st = estado || 'auto';
  
  if (st === 'venta' || st === 'descarte') { m=base*0.05; u=(pv*0.11)/1000; b=(pv*0.15)/1000; s=(pv*0.20)/1000; }
  else if (p === 'carne') {
    if (pv<150) { m=base*0.02; u=0; b=(pv*0.10)/1000; s=(pv*0.15)/1000; }
    else if (pv<350) { m=base*0.03; u=(pv*0.11)/1000; b=(pv*0.125)/1000; s=(pv*0.20)/1000; }
    else { m=base*0.05; u=(pv*0.11)/1000; b=(pv*0.15)/1000; s=(pv*0.20)/1000; }
  } else {
    if (st==='seca' || pv<350) { m=base*0.01; u=(pv*0.05)/1000; b=(pv*0.10)/1000; s=(pv*0.25)/1000; }
    else if (st==='parida') { m=base*0.03; u=(pv*0.08)/1000; b=(pv*0.20)/1000; s=(pv*0.50)/1000; }
    else { m=base*0.01; u=(pv*0.05)/1000; b=(pv*0.10)/1000; s=(pv*0.25)/1000; }
  }
  if (pv<150) u=0;
  u = Math.min(u, (pv*0.11)/1000);
  if ((p==='leche' && pv<350) || st==='novilla') m = Math.min(m, base*0.02);
  
  return { 
    pasto: base*0.90, salvado: base*0.10, levadura: (pv*0.05)/1000,
    melaza: m, urea: u, bicarb: b, sal: s 
  }; 
};

const getGMD = (h) => { 
  if(h.length < 2) return 0; 
  const last = h[h.length-1], prev = h[h.length-2];
  const diffDias = (new Date(last.fecha.split('/').reverse().join('-')) - new Date(prev.fecha.split('/').reverse().join('-'))) / 86400000;
  return diffDias > 0 ? (last.peso - prev.peso) / diffDias : 0; 
};

const getRendimiento = (h) => {
  if(h.length<2) return {nivel:'azul', texto:'Registre más pesajes', cm:0};
  const a = h[h.length-1].peso, b = h[h.length-2].peso, c = ((a-b)/b)*100;
  if(a<b) return {nivel:'gris', texto:'Pérdida', cm:c};
  if(c>=5) return {nivel:'verde', texto:'Excelente', cm:c};
  if(c>=3.5) return {nivel:'azul', texto:'Bueno', cm:c};
  if(c>=2.5) return {nivel:'naranja', texto:'Regular', cm:c};
  return {nivel:'rojo', texto:'Bajo', cm:c};
};

const calcRepro = (a) => {
  if(a.proposito!=='leche' && !a.fechaUltimoParto) return null;
  if(!a.fechaUltimoParto) return {diasPP:0, diasParaParto:999, fechaProxParto:null, semaforo:{color:'#6b7280', txt:'📅 Sin registro'}, estadoLactancia:'novilla'};
  
  const hoy = new Date(), parto = new Date(a.fechaUltimoParto.split('/').reverse().join('-'));
  const diasPP = Math.max(0, Math.floor((hoy-parto)/86400000));
  const fpp = new Date(parto); fpp.setDate(parto.getDate()+285);
  const dpp = Math.floor((fpp-hoy)/86400000);
  const est = (a.estadoReproductivo==='seca') ? 'seca' : 'parida';
  let sem;
  if(dpp<=60 && dpp>0) { sem={color:'#3b82f6', txt:`🔵 Secado (${dpp}d)`}; }
  else if(diasPP<=60) sem={color:'#22c55e', txt:'🟢 Recup. posparto'};
  else if(diasPP<=150) sem={color:'#f59e0b', txt:'🟡 Ventana preñez'};
  else sem={color:'#ef4444', txt:'🔴 ALERTA vaca vacía'};
  return {diasPP, diasParaParto:dpp, fechaProxParto:fpp.toLocaleDateString('es-CO'), semaforo:sem, estadoLactancia: est === 'seca' ? 'seca' : 'parida'};
};

const getEtapa = (pv, rep) => {
  const e = rep ? rep.estadoLactancia : 'auto';
  if(e==='seca') return {nombre:'Vaca Seca', clase:'etapa-madurez', icono:'🥛', min:300, max:600, ureaBloqueada:false, color:'#3b82f6', siguiente:'Venta'};
  if(e==='parida') return {nombre:'Producción', clase:'etapa-ceba', icono:'🐄', min:400, max:800, ureaBloqueada:false, color:'#22c55e', siguiente:'Venta'};
  if(pv<150) return {nombre:'Cría', clase:'etapa-inicio', icono:'🐮', min:0, max:150, ureaBloqueada:true, color:'#d4a017', siguiente:'Levante'};
  if(pv<350) return {nombre:'Levante', clase:'etapa-desarrollo', icono:'🐂', min:150, max:350, ureaBloqueada:false, color:'#60a5fa', siguiente:'Ceba'};
  return {nombre:'Ceba/Finalización', clase:'etapa-madurez', icono:'🐃', min:350, max:500, ureaBloqueada:false, color:'#fb923c', siguiente:'Venta'};
};

const getAllSanidad = () => [
  ...CATALOGO_SANIDAD.map(p => ({...p, esBase:true})),
  ...DB.sanidadCustom.map(p => ({...p, esBase:false}))
];

const getAlertasSanidad = (a) => {
  const al = [], pv = a.historial[a.historial.length-1].peso;
  const gmd = getGMD(a.historial), et = getEtapa(pv, calcRepro(a));
  let tm=false, tcb=false, tiv=false;
  
  for(let i=DB.aplicaciones.length-1; i>=0; i--){
    if(DB.aplicaciones[i].animalId === a.id){
      const d = getDiasDesde(DB.aplicaciones[i].fecha);
      const pr = getAllSanidad().find(x => x.id === DB.aplicaciones[i].productoId);
      if(pr){
        if(pr.id==='modificador' && d<pr.diasEfecto) tm=true;
        if(pr.id==='complejoB' && d<pr.diasEfecto) tcb=true;
        if(pr.id.includes('ivermectina') && d<pr.diasEfecto) tiv=true;
        if(pr.retiro>0 && d<pr.retiro) al.push({t:'r', m:`🚫 NO APTO VENTA. ${pr.nombre} (${pr.retiro-d}d)`, icon:'fa-clock'});
      }
    }
  }
  if(gmd>0 && gmd<0.4 && !tm) al.push({t:'purple', m:'Ganancia baja. Aplicar Modificador', icon:'fa-flask'});
  if(!tiv) al.push({t:'r', m:'Desparasitación vencida. Aplicar Ivermectina', icon:'fa-shield-virus'});
  if(et.nombre.includes('Cría') && (!tm||!tcb)) al.push({t:'purple', m:'Inicio: Refuerzo Modificador/Complejo B', icon:'fa-bone'});
  return al;
};

const getLoteName = (id) => DB.lotes.find(x => x.id===id)?.nombre || 'General';
const getAnimalesByLote = (lid) => DB.animales.filter(a => a.loteId === lid);

// ==================== NAVEGACIÓN ====================
let animalFilterLote = 'all', animalSearch = '', insumoTab = 'precios';
let searchTimeout;

const goPage = (p) => {
  document.querySelectorAll('main').forEach(el => el.classList.add('hidden'));
  document.getElementById(`v-${p}`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-p="${p}"]`)?.classList.add('active');
  
  if(p==='inicio') renderInicio();
  else if(p==='lotes') renderLotes();
  else if(p==='animales') renderAnimales();
  else if(p==='insumos') renderInsumos();
  else if(p==='config') renderConfig();
  
  window.scrollTo({top:0, behavior:'smooth'});
};

document.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => goPage(n.dataset.p)));

// ==================== RENDERS ====================
const renderInicio = () => {
  const pr = DB.precioKG, ta = DB.animales.length;
  let tKg=0, coT=0, csT=0, est={verde:0,azul:0,naranja:0,rojo:0,gris:0}, als=[];
  
  DB.animales.forEach(a => {
    const p = a.historial[a.historial.length-1].peso;
    const rep = calcRepro(a), estAct = rep?.estadoLactancia || 'auto';
    tKg += p;
    coT += (p*0.03*1200) + (DB.asignacionesAlimentos[a.id] ? 500 : 0); // Simplificado para rendimiento visual
    csT += DB.aplicaciones.filter(x=>x.animalId===a.id).reduce((s,x)=>s+(x.costo||0),0);
    est[getRendimiento(a.historial).nivel]++;
    getAlertasSanidad(a).forEach(s => als.push({nombre:a.nombre, t:s.t, m:s.m, icon:s.icon}));
  });
  
  const prom = ta ? tKg/ta : 0, gmdL = ta ? DB.animales.reduce((s,a)=>s+getGMD(a.historial),0)/ta : 0;
  const gan = (gmdL*30*pr*ta) - (coT*30) - (csT/12);
  const pctB = ta ? ((est.verde+est.azul)/ta)*100 : 0;

  let html = `
    <div class="card" style="background:linear-gradient(135deg,rgba(212,160,23,.1),rgba(212,160,23,.02));border-color:rgba(212,160,23,.2)">
        <div class="row-label mb6" style="font-weight:600;color:var(--accent)"><i class="fa-solid fa-coins"></i> PRECIO KG EN PIE</div>
        <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:1.2rem;font-weight:800;color:var(--accent)">$</span>
            <input id="inpPKG" type="number" value="${pr}" style="font-size:1.2rem;font-weight:700;text-align:center;background:transparent;border:none;color:var(--accent);padding:8px;width:100%">
            <span style="font-size:.7rem;color:var(--muted)">COP</span>
        </div>
        <button class="btn btn-green mt8" onclick="DB.precioKG=parseFloat(document.getElementById('inpPKG').value)||0;saveDB();renderInicio();showToast('✅ Precio actualizado')"><i class="fa-solid fa-check"></i> ACTUALIZAR</button>
    </div>
    <div class="card">
        <div class="row-label mb6" style="font-weight:600"><i class="fa-solid fa-chart-pie"></i> RESUMEN GENERAL</div>
        <div class="stats-grid">
            <div class="stat-item"><div class="row-label"><i class="fa-solid fa-users"></i> Cabezas</div><div class="row-val">${ta}</div></div>
            <div class="stat-item"><div class="row-label"><i class="fa-solid fa-layer-group"></i> Lotes</div><div class="row-val">${DB.lotes.length}</div></div>
            <div class="stat-item"><div class="row-label"><i class="fa-solid fa-weight-scale"></i> Peso Total</div><div class="row-val">${fm(tKg)} kg</div></div>
            <div class="stat-item"><div class="row-label"><i class="fa-solid fa-calculator"></i> Promedio</div><div class="row-val">${fm(prom)} kg</div></div>
        </div>
    </div>
    <div class="card"><div class="capital-value">$ ${fm(tKg*pr)}</div><div class="row-label" style="font-size:.7rem;color:var(--muted)"><i class="fa-solid fa-sack-dollar"></i> Valor total del hato</div></div>
    <div class="card">
        <div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--muted)"><i class="fa-solid fa-chart-simple"></i> ESTADO DEL HATO</div>
        <div class="estado-simple">
            <div class="estado-pildora e"><div class="num">${est.verde}</div><div class="lbl">Excelente</div></div>
            <div class="estado-pildora b"><div class="num">${est.azul}</div><div class="lbl">Bueno</div></div>
            <div class="estado-pildora r"><div class="num">${est.naranja}</div><div class="lbl">Regular</div></div>
            <div class="estado-pildora m"><div class="num">${est.rojo}</div><div class="lbl">Bajo</div></div>
        </div>
        <div class="progress"><div class="progress-fill" style="width:${pctB}%;background:var(--info)"></div></div>
    </div>`;

  if(als.length) {
    html += `<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:8px;color:var(--muted)"><i class="fa-solid fa-bell"></i> ALERTAS RECIENTES</div>`;
    als.slice(0,5).forEach(a => {
      const cls = a.t==='r'?'alert-danger':a.t==='purple'?'alert-purple':'alert-warning';
      html += `<div class="alert-item ${cls}"><i class="fa-solid ${a.icon}"></i><div><b>${escapeHtml(a.nombre||'')}</b>: ${escapeHtml(a.m)}</div></div>`;
    });
    html += '</div>';
  }

  html += `<div class="section-title"><i class="fa-solid fa-layer-group"></i> MIS LOTES</div><div class="grid">`;
  DB.lotes.forEach(l => {
    const na = getAnimalesByLote(l.id).length;
    const pt = getAnimalesByLote(l.id).reduce((s,a)=>s+a.historial[a.historial.length-1].peso, 0);
    html += `<div class="lote-card" style="border-color:${l.color}30" onclick="animalFilterLote='${l.id}';goPage('animales')">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div class="lote-color" style="background:${l.color}"></div>
        <div><div class="lote-name">${escapeHtml(l.nombre)}</div><div class="lote-stats">${na} animales · ${fm(pt)} kg</div></div>
      </div></div>`;
  });
  html += '</div>';
  document.getElementById('v-inicio').innerHTML = html;
};

const renderLotes = () => {
  let html = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:700;color:var(--accent)"><i class="fa-solid fa-layer-group"></i> GESTIÓN DE LOTES</span><button class="btn btn-sm btn-gold" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showAddLoteModal()"><i class="fa-solid fa-plus"></i> Crear Lote</button></div>`;
  if(!DB.lotes.length) html += '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">No hay lotes creados</div>';
  DB.lotes.forEach(l => {
    const na = getAnimalesByLote(l.id).length, pt = getAnimalesByLote(l.id).reduce((s,a)=>s+a.historial[a.historial.length-1].peso, 0);
    html += `<div class="lote-card" style="border-color:${l.color}30" onclick="animalFilterLote='${l.id}';goPage('animales')">
      <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:${l.color};border-radius:4px 0 0 4px"></div>
      <div class="lote-header"><div><div class="lote-name">${escapeHtml(l.nombre)}</div><div class="lote-stats"><span><b>${na}</b> animales</span><span><b>${fm(pt)}</b> kg total</span></div></div>
      <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
        <div class="lote-color" style="background:${l.color}" onclick="showEditLoteColor('${l.id}')"></div>
        <button class="btn btn-sm btn-danger" style="width:28px;padding:0;height:28px" onclick="event.stopPropagation();deleteLote('${l.id}')"><i class="fa-solid fa-trash"></i></button>
      </div></div></div>`;
  });
  html += '</div>';
  document.getElementById('v-lotes').innerHTML = html;
};

const renderAnimales = () => {
  let filtered = DB.animales;
  if(animalFilterLote!=='all') filtered = filtered.filter(a => a.loteId === animalFilterLote);
  if(animalSearch) filtered = filtered.filter(a => a.nombre.toLowerCase().includes(animalSearch.toLowerCase()));
  
  let html = `<div class="card" style="padding:12px 16px"><input id="animSearch" type="text" placeholder="🔍 Buscar animal..." value="${escapeHtml(animalSearch)}" style="padding:10px 14px;font-size:.85rem"></div>`;
  html += `<div class="filter-chips"><div class="chip ${animalFilterLote==='all'?'active':''}" onclick="animalFilterLote='all';renderAnimales()">Todos</div>`;
  DB.lotes.forEach(l => html += `<div class="chip ${animalFilterLote===l.id?'active':''}" onclick="animalFilterLote='${l.id}';renderAnimales()">${escapeHtml(l.nombre)}</div>`);
  html += '</div><div class="grid">';
  
  if(!filtered.length) html += '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--muted)"><i class="fa-solid fa-cow" style="font-size:2rem;margin-bottom:10px;display:block"></i>No hay animales registrados</div>';
  
  filtered.forEach(a => {
    const p = a.historial[a.historial.length-1].peso;
    const rep = calcRepro(a), estAct = rep?.estadoLactancia || 'auto';
    const et = getEtapa(p, rep), r = getRendimiento(a.historial), gmd = getGMD(a.historial);
    const lm = {verde:'ml-g',azul:'ml-b',naranja:'ml-o',rojo:'ml-r',gris:'ml-x'};
    let ret = false;
    for(let j=DB.aplicaciones.length-1;j>=0;j--){
      if(DB.aplicaciones[j].animalId===a.id){
        const pr = getAllSanidad().find(x=>x.id===DB.aplicaciones[j].productoId);
        if(pr?.retiro>0 && getDiasDesde(DB.aplicaciones[j].fecha)<pr.retiro){ret=true;break}
      }
    }
    html += `<div class="animal-card" onclick="showProfile(${a.id})">
      <div class="mini-led ${lm[r.nivel]}"></div>
      ${et.ureaBloqueada?'<div class="lock-icon"><i class="fa-solid fa-lock"></i></div>':''}
      <span style="font-size:1.5rem">${et.icono}</span>
      <div class="name">${escapeHtml(a.nombre)}</div>
      <span class="etapa-tag ${et.clase}">${escapeHtml(et.nombre)}</span>
      <div style="font-size:.6rem;color:var(--muted);margin-top:2px">${escapeHtml(getLoteName(a.loteId))}</div>
      <div class="weight">${fm(p)} kg</div>
      ${ret?'<div class="retiro-badge">🚫 VEDA</div>':''}
      <div class="cm" style="color:${r.cm>=0?'#22c55e':'#ef4444'}">${r.cm>=0?'+':''}${r.cm.toFixed(1)}%</div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('v-animales').innerHTML = html;
  
  // Debounce search
  const searchInput = document.getElementById('animSearch');
  if(searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => { animalSearch = e.target.value; renderAnimales(); }, 250);
    });
  }
};

const renderInsumos = () => {
  const html = `<div class="insumos-tabs">
    <button class="insumo-tab ${insumoTab==='precios'?'active':''}" onclick="insumoTab='precios';renderInsumos()">Precios</button>
    <button class="insumo-tab ${insumoTab==='stock'?'active':''}" onclick="insumoTab='stock';renderInsumos()">Stock</button>
    <button class="insumo-tab ${insumoTab==='sanidad'?'active':''}" onclick="insumoTab='sanidad';renderInsumos()">Sanidad</button>
  </div><div id="insumoContent"></div>`;
  document.getElementById('v-insumos').innerHTML = html;
  if(insumoTab==='precios') renderInsumoPrecios();
  else if(insumoTab==='stock') renderInsumoStock();
  else renderInsumoSanidad();
};

const renderInsumoPrecios = () => {
  let html = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:700;color:var(--accent)"><i class="fa-solid fa-tags"></i> PRECIOS ALIMENTOS</span><button class="btn btn-sm btn-purple" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showModalGestionAlimentos()"><i class="fa-solid fa-gear"></i> Personalizar</button></div>`;
  AL.forEach(k => { html += `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)"><i class="fa-solid ${IC[k]}" style="width:16px"></i><span style="flex:1;font-size:.76rem">${NM[k]}</span><span style="font-size:.7rem;color:var(--muted)">$</span><input id="pr-${k}" type="number" value="${DB.precios[k]||0}" style="width:85px;text-align:right;padding:8px 10px"></div>`; });
  DB.alimentosCustom.forEach(a => { html += `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)"><i class="fa-solid ${a.icono}" style="width:16px;color:var(--accent)"></i><span style="flex:1;font-size:.76rem">${escapeHtml(a.nombre)} <span class="custom-badge">CUST</span></span><span style="font-size:.7rem;color:var(--muted)">$</span><input id="pr-${a.id}" type="number" value="${DB.precios[a.id]||0}" style="width:85px;text-align:right;padding:8px 10px"><button class="btn btn-sm btn-danger" style="width:26px;padding:0;height:26px;margin-left:4px" onclick="deleteAlimentoCustom('${a.id}');renderInsumos()"><i class="fa-solid fa-trash"></i></button></div>`; });
  html += `<button class="btn btn-gold mt8" onclick="savePrecios()"><i class="fa-solid fa-check"></i> GUARDAR</button></div>`;
  document.getElementById('insumoContent').innerHTML = html;
};

const savePrecios = () => {
  [...AL, ...DB.alimentosCustom.map(a=>a.id)].forEach(id => {
    const el = document.getElementById(`pr-${id}`);
    if(el) DB.precios[id] = parseFloat(el.value)||0;
  });
  saveDB(); showToast('✅ Precios actualizados');
};

const renderInsumoStock = () => {
  let html = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:700;color:var(--accent)"><i class="fa-solid fa-boxes"></i> STOCK ALIMENTOS</span><button class="btn btn-sm btn-purple" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showModalGestionAlimentos()"><i class="fa-solid fa-gear"></i> Personalizar</button></div>`;
  AL.forEach(k => {
    const st = DB.stock[k]||0, co = DB.animales.length * 2, dias = co>0 && st>0 ? st/co : 999;
    const dCol = dias<3?'#ef4444':dias<7?'#f59e0b':'#22c55e';
    html += `<div class="stock-row"><i class="fa-solid ${IC[k]}"></i><div class="stock-info"><span class="stock-name">${NM[k]}</span><span class="stock-consumo">Consumo est.: ${co.toFixed(1)} kg/d</span></div><input id="st-${k}" type="number" value="${Math.round(st)}" style="width:70px;text-align:right;padding:8px;font-size:.85rem" step="1"><span style="font-size:.68rem;font-weight:600;color:${dCol};min-width:35px;text-align:center">${dias===999?'--':Math.round(dias)+'d'}</span></div>`;
  });
  html += `<button class="btn btn-gold mt8" onclick="saveStock()"><i class="fa-solid fa-check"></i> GUARDAR STOCK</button></div>`;
  document.getElementById('insumoContent').innerHTML = html;
};

const saveStock = () => {
  AL.forEach(id => {
    const el = document.getElementById(`st-${id}`);
    if(el) DB.stock[id] = parseFloat(el.value)||0;
  });
  saveDB(); showToast('✅ Stock actualizado');
};

const renderInsumoSanidad = () => {
  let html = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:var(--accent)"><span><i class="fa-solid fa-syringe"></i> INVENTARIO SANIDAD</span><button class="btn btn-sm btn-purple" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showModalGestionSanidad()"><i class="fa-solid fa-gear"></i> Personalizar</button></div>`;
  getAllSanidad().forEach(p => {
    const st = DB.stockSanidad[p.id]||0, precio = p.esBase ? (DB.preciosSanidad[p.id]||0) : (p.precioML||0);
    html += `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><i class="fa-solid ${p.icono}" style="color:${p.color};font-size:1.1rem;width:20px"></i><div style="flex:1"><span style="font-size:.76rem;font-weight:600">${escapeHtml(p.nombre)}${p.esBase?'':'<span class="custom-badge">CUST</span>'}</span><span style="font-size:.6rem;color:var(--muted);display:block">Stock: <b>${fm(st)} ml</b> · $<b>${fm(precio)}/ml</b> · Efecto: ${p.diasEfecto}d</span></div></div>`;
    if(!p.esBase) html += `<button class="btn btn-sm btn-danger" style="width:auto;padding:4px 8px;margin-bottom:6px;font-size:.6rem" onclick="deleteSanidadCustom('${p.id}');renderInsumos()"><i class="fa-solid fa-trash"></i> Eliminar</button>`;
    html += `<div style="font-size:.65rem;color:var(--muted);margin:6px 0 6px">➕ Comprar:</div><div style="display:flex;gap:6px;align-items:center"><input id="compraML-${p.id}" type="number" placeholder="ml" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px"><input id="compraCosto-${p.id}" type="number" placeholder="Costo total ($)" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px"><button class="btn btn-green" onclick="agregarCompraSanidad('${p.id}')" style="width:auto;padding:8px 12px;font-size:.65rem"><i class="fa-solid fa-plus"></i></button></div></div>`;
  });
  html += '</div>';
  document.getElementById('insumoContent').innerHTML = html;
};

const agregarCompraSanidad = (pid) => {
  const mlEl = document.getElementById(`compraML-${pid}`), costoEl = document.getElementById(`compraCosto-${pid}`);
  const ml = parseFloat(mlEl.value), costo = parseFloat(costoEl.value);
  if(isNaN(ml)||ml<=0||isNaN(costo)||costo<=0) return showToast('⚠️ Ingresa valores válidos');
  DB.stockSanidad[pid] = (DB.stockSanidad[pid]||0) + ml;
  DB.preciosSanidad[pid] = costo/ml;
  const item = DB.sanidadCustom.find(x=>x.id===pid);
  if(item) item.precioML = costo/ml;
  saveDB(); mlEl.value=''; costoEl.value=''; renderInsumos(); showToast('✅ Stock actualizado');
};

const renderConfig = () => {
  document.getElementById('v-config').innerHTML = `
    <div class="card">
        <div class="config-item" onclick="exportData()"><i class="fa-solid fa-download"></i><div class="cfg-text"><span>Exportar Datos</span><small>Descargar respaldo JSON</small></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:.7rem"></i></div>
        <div class="config-item" onclick="importData()"><i class="fa-solid fa-upload"></i><div class="cfg-text"><span>Importar Datos</span><small>Restaurar desde archivo</small></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:.7rem"></i></div>
        <div class="config-item" onclick="if(confirm('⚠️ ¿Borrar TODOS los datos?')){localStorage.clear();location.reload();}"><i class="fa-solid fa-trash-can" style="color:var(--danger)"></i><div class="cfg-text"><span style="color:var(--danger)">Borrar Todo</span><small>Eliminar todos los datos</small></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:.7rem"></i></div>
    </div>
    <div class="card" style="text-align:center;padding:20px">
        <div style="font-size:2rem;margin-bottom:8px">🐄</div>
        <div style="font-weight:700;font-size:.9rem;color:var(--accent)">GANADERO ÉLITE PRO</div>
        <div style="font-size:.65rem;color:var(--muted);margin-top:4px">Versión 3.2 · Gestión Inteligente</div>
        <div style="font-size:.6rem;color:var(--muted);margin-top:8px">${DB.animales.length} animales · ${DB.lotes.length} lotes</div>
    </div>
    <input type="file" id="importFile" accept=".json" style="display:none" onchange="handleImport(event)">
  `;
};

const exportData = () => {
  const blob = new Blob([JSON.stringify(DB)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`ganadero_backup_${new Date().toISOString().slice(0,10)}.json`; a.click();
  showToast('✅ Respaldo descargado');
};
const importData = () => document.getElementById('importFile').click();
const handleImport = (e) => {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result);
      if(d.animales && d.precios) {
        DB = d; if(!DB.lotes) DB.lotes=[{id:'lot_general',nombre:'General',color:'#d4a017'}];
        DB.animales.forEach(a => { if(!a.loteId) a.loteId='lot_general'; });
        saveDB(); showToast('✅ Datos importados'); goPage('inicio');
      } else showToast('⚠️ Archivo inválido');
    } catch { showToast('⚠️ Error al leer archivo'); }
  };
  r.readAsText(f);
};

const showProfile = (id) => {
  const a = DB.animales.find(x => x.id === id); if(!a) return;
  const p = a.historial[a.historial.length-1].peso, rep = calcRepro(a), et = getEtapa(p, rep);
  const r = getRendimiento(a.historial), gmd = getGMD(a.historial);
  const valA = p * DB.precioKG, proy30 = p + (gmd*30);
  const faltaKg = et.max - p, progPct = Math.min(100, Math.max(0, ((p-et.min)/(et.max-et.min))*100));
  
  let alertHTML = getAlertasSanidad(a).map(s => `<div class="alert-item alert-${s.t==='r'?'danger':s.t==='purple'?'purple':'warning'}"><i class="fa-solid ${s.icon}"></i> ${escapeHtml(s.m)}</div>`).join('');
  let feedHTML = a.historial.slice().reverse().map((h,i) => {
    const delta = i < a.historial.length-1 ? `+${(((h.peso-a.historial[a.historial.length-2-i].peso)/a.historial[a.historial.length-2-i].peso)*100).toFixed(1)}%` : 'Inicial';
    return `<div class="sp-feed-item"><div class="sp-feed-header"><span class="sp-feed-title"><i class="fa-solid fa-weight-scale"></i> ${fm(h.peso)} kg</span><span class="sp-feed-date">${escapeHtml(h.fecha)}</span></div><div class="sp-feed-body"><span style="color:#22c55e;font-weight:600">${delta}</span> · GMD: ${gmd.toFixed(2)} kg/d</div></div>`;
  }).join('');

  let html = `<div class="sp-wrapper"><div class="sp-banner"><button class="sp-back" onclick="closeProfile()"><i class="fa-solid fa-arrow-left"></i></button></div>
    <div class="sp-header"><div class="sp-avatar">${et.icono}</div><div class="sp-name">${escapeHtml(a.nombre)}</div>
    <div class="sp-badges"><span class="sp-badge" style="background:${et.color}">${escapeHtml(et.nombre)}</span><span class="sp-badge">${escapeHtml(getLoteName(a.loteId))}</span></div>
    <div class="sp-meta">${fm(p)} kg · ${escapeHtml(r.texto)} · Último: ${getDiasDesde(a.historial[a.historial.length-1].fecha)}d</div></div>
    <div class="sp-stats"><div class="sp-stat"><div class="val">${fm(p)}</div><div class="lbl">Peso</div></div><div class="sp-stat"><div class="val">$${fm(valA)}</div><div class="lbl">Valor</div></div><div class="sp-stat"><div class="val">${gmd.toFixed(2)}</div><div class="lbl">GMD</div></div><div class="sp-stat"><div class="val">$${fm(9800)}</div><div class="lbl">Costo/kg</div></div></div>
    <div class="stage-progress-container"><div class="stage-progress-labels"><span>Actual</span><span>Siguiente: ${escapeHtml(et.siguiente)}</span></div>
    <div class="stage-progress-bar"><div class="stage-progress-fill" style="width:${progPct}%;background:${et.color}"><span class="stage-progress-text">${faltaKg<=0?'VENDIBLE':fm(faltaKg)+' kg faltan'}</span></div></div></div>
    <div class="sp-scroll">${alertHTML}${feedHTML}<div class="sp-card"><div class="sp-card-title"><i class="fa-solid fa-chart-line"></i> PROYECCIÓN</div><div class="sp-projection"><div class="sp-proj-box"><div class="sp-proj-d">30 DÍAS</div><div class="sp-proj-w">${fm(proy30)} kg</div><div class="sp-proj-g" style="color:#22c55e">+$${fm(proy30*DB.precioKG-valA)}</div></div></div></div></div>
    <div class="sp-actions-bar"><button class="btn btn-gold" onclick="updateWeight(${id})"><i class="fa-solid fa-gauge-high"></i> PESAJE</button><button class="btn btn-purple" onclick="openAplicarProducto(${id})"><i class="fa-solid fa-syringe"></i> SANIDAD</button><button class="btn btn-danger" onclick="deleteAnimal(${id})"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
  
  document.querySelectorAll('main').forEach(el => el.classList.add('hidden'));
  document.getElementById('v-perfil').classList.remove('hidden');
  document.getElementById('v-perfil').innerHTML = html;
  document.querySelector('header').classList.add('hidden');
};

// ==================== MODALES & CRUD ====================
const showAddAnimalModal = () => {
  let opts = DB.lotes.map(l => `<option value="${l.id}">${escapeHtml(l.nombre)}</option>`).join('');
  showModal(`<div style="font-weight:700;margin-bottom:14px;color:var(--accent);font-size:1.05rem"><i class="fa-solid fa-cow"></i> NUEVO ANIMAL</div><div class="flex-col gap10"><input id="addN" type="text" placeholder="Nombre / Número"><input id="addW" type="number" placeholder="Peso Inicial (kg)" min="20" max="2000"><select id="addLote">${opts}</select><div class="grid"><select id="addProp"><option value="carne">🥩 CARNE</option><option value="leche">🥛 LECHE</option></select><select id="addOrig" onchange="document.getElementById('addPriceWrap').classList.toggle('hidden',this.value!=='comprado')"><option value="nacimiento">🐄 Nacimiento</option><option value="comprado">💰 Comprado</option></select></div><div id="addPriceWrap" class="hidden"><input id="addPrice" type="number" placeholder="Valor de compra ($)"></div><button class="btn btn-gold mt12" onclick="guardarNuevoAnimal()"><i class="fa-solid fa-check"></i> REGISTRAR</button><button class="btn btn-gray" onclick="document.querySelector('.modal-overlay').remove()">CANCELAR</button></div>`);
};

const guardarNuevoAnimal = () => {
  const n = document.getElementById('addN').value.trim(), w = parseFloat(document.getElementById('addW').value);
  const lote = document.getElementById('addLote').value, p = document.getElementById('addProp').value;
  if(!n || isNaN(w) || w<20 || w>2000) return showToast('⚠️ Verifica nombre y peso');
  DB.animales.push({id: Date.now(), nombre:n, historial:[{fecha:new Date().toLocaleDateString(), peso:w}], proposito:p, origen:'nacimiento', valorCompra:0, fechaUltimoParto:null, estadoReproductivo:'novilla', loteId:lote});
  saveDB(); document.querySelector('.modal-overlay').remove(); showToast(`✅ ${escapeHtml(n)} registrado`); goPage('animales');
};

const showAddLoteModal = () => showModal(`<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-plus"></i> NUEVO LOTE</div><div class="flex-col gap10"><input id="nlNombre" type="text" placeholder="Nombre del lote"><input id="nlColor" type="color" value="${randColor()}" style="width:100%;height:40px;border-radius:10px;border:none"><button class="btn btn-gold mt8" onclick="guardarLote()"><i class="fa-solid fa-check"></i> CREAR</button><button class="btn btn-gray" onclick="document.querySelector('.modal-overlay').remove()">CANCELAR</button></div>`);

const guardarLote = () => {
  const n = document.getElementById('nlNombre').value.trim(), c = document.getElementById('nlColor').value;
  if(!n) return showToast('⚠️ Ingresa un nombre');
  DB.lotes.push({id:'lot_'+Date.now(), nombre:n, color:c});
  saveDB(); document.querySelector('.modal-overlay').remove(); showToast(`✅ Lote "${escapeHtml(n)}" creado`); renderLotes();
};

const showEditLoteColor = (lid) => {
  const l = DB.lotes.find(x => x.id===lid); if(!l) return;
  showModal(`<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-palette"></i> COLOR DEL LOTE</div><div class="flex-col gap10"><input id="elColor" type="color" value="${l.color}" style="width:100%;height:50px;border-radius:10px;border:none"><button class="btn btn-green mt8" onclick="guardarColorLote('${lid}')"><i class="fa-solid fa-check"></i> GUARDAR</button><button class="btn btn-gray" onclick="document.querySelector('.modal-overlay').remove()">CANCELAR</button></div>`);
};

const guardarColorLote = (lid) => {
  const l = DB.lotes.find(x => x.id===lid); if(l) l.color = document.getElementById('elColor').value;
  saveDB(); document.querySelector('.modal-overlay').remove(); renderLotes(); showToast('✅ Color actualizado');
};

const deleteLote = (lid) => {
  if(lid==='lot_general') return showToast('⚠️ No puedes eliminar el lote General');
  if(!confirm('¿Eliminar este lote? Los animales pasarán a "General"')) return;
  DB.animales.forEach(a => { if(a.loteId===lid) a.loteId='lot_general'; });
  DB.lotes = DB.lotes.filter(l => l.id!==lid);
  saveDB(); renderLotes(); showToast('✅ Lote eliminado');
};

const updateWeight = (id) => {
  const p = prompt('⚖️ Nuevo pesaje (kg):'); if(!p) return;
  const peso = parseFloat(p); if(isNaN(peso)||peso<20||peso>2000) return showToast('⚠️ Peso inválido');
  const a = DB.animales.find(x => x.id===id); if(a) {
    a.historial.push({fecha:new Date().toLocaleDateString(), peso}); saveDB(); showProfile(id);
  }
};

const deleteAnimal = (id) => {
  if(confirm('⚠️ ¿Eliminar animal y su historial?')) {
    DB.animales = DB.animales.filter(x => x.id!==id);
    delete DB.asignacionesAlimentos[id]; saveDB(); closeProfile();
  }
};

const closeProfile = () => {
  document.getElementById('v-perfil').classList.add('hidden');
  document.querySelector('header').classList.remove('hidden');
  goPage('animales');
};

const openAplicarProducto = (animalId) => {
  const a = DB.animales.find(x => x.id===animalId); if(!a) return;
  const p = a.historial[a.historial.length-1].peso;
  let opts = getAllSanidad().map(pr => `<option value="${pr.id}">${escapeHtml(pr.nombre)} (${pr.diasEfecto}d)</option>`).join('');
  const m = showModal(`<div style="font-weight:700;margin-bottom:12px;color:var(--accent)">💉 APLICAR A ${escapeHtml(a.nombre)}</div><div class="flex-col gap10"><select id="aplProducto" onchange="calcDosisModal(${p})">${opts}</select><div id="dosisInfo" style="font-size:.7rem;color:var(--muted)"></div><input id="aplML" type="number" placeholder="ml aplicados" step=".1"><button class="btn btn-green mt8" onclick="aplicarProducto(${animalId})"><i class="fa-solid fa-check"></i> CONFIRMAR</button><button class="btn btn-gray" onclick="document.querySelector('.modal-overlay').remove()">CANCELAR</button></div>`);
  setTimeout(() => calcDosisModal(p), 100);
};

const calcDosisModal = (p) => {
  const s = document.getElementById('aplProducto'), i = document.getElementById('dosisInfo');
  if(!s || !i) return;
  const pr = getAllSanidad().find(x => x.id===s.value);
  if(pr) i.innerHTML = `📋 Dosis: <b>${(p/pr.dosis).toFixed(1)} ml</b>`;
};

const aplicarProducto = (id) => {
  const pid = document.getElementById('aplProducto').value, ml = parseFloat(document.getElementById('aplML').value);
  if(isNaN(ml)||ml<=0) return showToast('⚠️ Ingresa ml válidos');
  const pr = getAllSanidad().find(x => x.id===pid); if(!pr) return;
  const cu = pr.precioML || DB.preciosSanidad[pid] || 0;
  DB.aplicaciones.push({animalId:id, productoId:pid, producto:pr.nombre, ml, costo:ml*cu, fecha:new Date().toLocaleDateString()});
  DB.stockSanidad[pid] = Math.max(0, (DB.stockSanidad[pid]||0)-ml);
  saveDB(); document.querySelector('.modal-overlay').remove(); showToast('✅ Aplicado'); showProfile(id);
};

const showModalGestionAlimentos = () => showModal(`<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-plus"></i> NUEVO ALIMENTO</div><div class="flex-col gap8"><input id="acNombre" type="text" placeholder="Nombre"><div class="grid"><select id="acIcono"><option value="fa-wheat-awn">🌾 Grano</option><option value="fa-seedling">🌱 Forraje</option><option value="fa-cubes">🧊 Suplemento</option></select><select id="acUnidad"><option value="kg">Kilogramos</option><option value="g">Gramos</option></select></div><div class="grid"><input id="acDosis" type="number" step="0.001" placeholder="Dosis por kg"><input id="acPrecioTotal" type="number" placeholder="Precio Total ($)"></div><div class="grid"><input id="acCantidadTotal" type="number" step="0.1" placeholder="Cantidad Total"><input id="acPrecioUnitario" type="text" readonly placeholder="Auto..." style="background:rgba(255,255,255,.03);color:var(--accent)"></div><button class="btn btn-green" onclick="guardarAlimentoCustom()"><i class="fa-solid fa-check"></i> GUARDAR</button></div>`);

const guardarAlimentoCustom = () => {
  const n = document.getElementById('acNombre').value.trim();
  const d = parseFloat(document.getElementById('acDosis').value), pt = parseFloat(document.getElementById('acPrecioTotal').value), ct = parseFloat(document.getElementById('acCantidadTotal').value);
  if(!n || isNaN(d) || isNaN(pt) || isNaN(ct)) return showToast('⚠️ Completa todo correctamente');
  const id = 'ac_'+Date.now();
  DB.alimentosCustom.push({id, nombre:n, icono:document.getElementById('acIcono').value, unidad:document.getElementById('acUnidad').value, dosisPorKg:d, precioUnitario:pt/ct, stock:ct});
  DB.precios[id] = pt/ct; DB.stock[id] = ct;
  saveDB(); document.querySelector('.modal-overlay').remove(); showToast('✅ Agregado'); renderInsumos();
};

const deleteAlimentoCustom = (id) => {
  if(!confirm('¿Eliminar?')) return;
  DB.alimentosCustom = DB.alimentosCustom.filter(a => a.id!==id); delete DB.precios[id]; delete DB.stock[id];
  saveDB(); renderInsumos();
};

const showModalGestionSanidad = () => showModal(`<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-plus"></i> NUEVO PRODUCTO</div><div class="flex-col gap8"><input id="scNombre" type="text" placeholder="Nombre"><div class="grid"><select id="scIcono"><option value="fa-syringe">💉 Inyectable</option><option value="fa-pills">💊 Oral</option></select><input id="scColor" type="color" value="#a78bfa" style="width:100%;height:40px;border-radius:8px;border:none"></div><input id="scDosis" type="number" step="0.01" placeholder="Dosis (ml/kg)"><div class="grid"><input id="scEfecto" type="number" placeholder="Días efecto"><input id="scRetiro" type="number" placeholder="Días retiro"></div><div class="grid"><input id="scPrecioTotal" type="number" placeholder="Precio Total ($)"><input id="scMlTotal" type="number" placeholder="Mililitros Totales"></div><button class="btn btn-green" onclick="guardarSanidadCustom()"><i class="fa-solid fa-check"></i> GUARDAR</button></div>`);

const guardarSanidadCustom = () => {
  const n = document.getElementById('scNombre').value.trim(), d = parseFloat(document.getElementById('scDosis').value);
  const ef = parseInt(document.getElementById('scEfecto').value)||0, ret = parseInt(document.getElementById('scRetiro').value)||0;
  const pt = parseFloat(document.getElementById('scPrecioTotal').value), ml = parseFloat(document.getElementById('scMlTotal').value);
  if(!n || isNaN(d) || isNaN(pt) || isNaN(ml)) return showToast('⚠️ Completa todo correctamente');
  const id = 'sc_'+Date.now();
  DB.sanidadCustom.push({id, nombre:n, icono:document.getElementById('scIcono').value, color:document.getElementById('scColor').value, dosisPorKg:d, diasEfecto:ef, retiro:ret, precioML:pt/ml, stockML:ml});
  DB.preciosSanidad[id] = pt/ml; DB.stockSanidad[id] = ml;
  saveDB(); document.querySelector('.modal-overlay').remove(); showToast('✅ Agregado'); renderInsumos();
};

const deleteSanidadCustom = (id) => {
  if(!confirm('¿Eliminar?')) return;
  DB.sanidadCustom = DB.sanidadCustom.filter(a => a.id!==id); delete DB.preciosSanidad[id]; delete DB.stockSanidad[id];
  saveDB(); renderInsumos();
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  goPage('animales');
  // Service Worker básico para PWA (opcional)
  if ('serviceWorker' in navigator) {
    // navigator.serviceWorker.register('/sw.js');
  }
});
