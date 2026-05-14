// ==================== UTILIDADES ====================
function fm(n) { if (isNaN(n) || n === null || n === undefined) return '0'; n = Math.round(n); var s = String(n); var r = ''; var c = 0; for (var i = s.length - 1; i >= 0; i--) { if (c > 0 && c % 3 === 0) r = '.' + r; r = s.charAt(i) + r; c++; } return r; }
function showToast(m, d) { d = d || 3000; var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = m; document.getElementById('toastContainer').appendChild(t); setTimeout(function() { t.remove(); }, d); }
function showModal(h) { var o = document.createElement('div'); o.className = 'modal-overlay'; o.innerHTML = '<div class="modal">' + h + '</div>'; o.onclick = function(e) { if (e.target === o) o.remove(); }; document.getElementById('modalContainer').appendChild(o); }
function getDiasDesde(f) { if (!f) return 999; var p = f.split('/'); if (p.length<3) return 999; return Math.floor((new Date() - new Date(p[2], p[1] - 1, p[0])) / 86400000); }
function randColor() { var c = ['#d4a017','#22c55e','#3b82f6','#ef4444','#a78bfa','#f59e0b','#ec4899','#14b8a6']; return c[Math.floor(Math.random()*c.length)]; }

// ==================== BASE DE DATOS ====================
var AL = ['pasto', 'salvado', 'melaza', 'levadura', 'bicarb', 'sal', 'urea'];
var IC = { pasto: 'fa-seedling', salvado: 'fa-wheat-awn', melaza: 'fa-droplet', levadura: 'fa-flask', bicarb: 'fa-cubes', sal: 'fa-vial-circle-check', urea: 'fa-flask-vial' };
var NM = { pasto: 'Pasto Picado', salvado: 'Salvado Trigo', melaza: 'Melaza', levadura: 'Levadura', bicarb: 'Bicarbonato', sal: 'Sal Mineral', urea: 'UREA' };
var CATALOGO_SANIDAD = [
    { id: 'modificador', nombre: 'Modificador Orgánico', dosis: 50, diasEfecto: 90, retiro: 0, icono: 'fa-flask', color: '#22c55e' },
    { id: 'vitaminaA', nombre: 'Vitamina ADE', dosis: 50, diasEfecto: 60, retiro: 30, icono: 'fa-sun', color: '#d4a017' },
    { id: 'complejoB', nombre: 'Complejo B (B12)', dosis: 50, diasEfecto: 20, retiro: 0, icono: 'fa-capsules', color: '#3b82f6' },
    { id: 'ivermectina1', nombre: 'Ivermectina 1%', dosis: 50, diasEfecto: 30, retiro: 28, icono: 'fa-shield-virus', color: '#ef4444' },
    { id: 'ivermectina315', nombre: 'Ivermectina 3.15%', dosis: 50, diasEfecto: 90, retiro: 122, icono: 'fa-shield-halved', color: '#dc2626' },
    { id: 'fosforo', nombre: 'Fósforo B12', dosis: 20, diasEfecto: 30, retiro: 0, icono: 'fa-bone', color: '#a78bfa' },
    { id: 'hierro', nombre: 'Hierro Dextrano', dosis: 100, diasEfecto: 30, retiro: 0, icono: 'fa-droplet', color: '#f87171' }
];

var DB = {};
try { var raw = localStorage.getItem('ganadero_elite_v32'); DB = raw ? JSON.parse(raw) : null; if (!DB) throw new Error("Init"); 
      if (!DB.alimentosCustom) DB.alimentosCustom = []; if (!DB.sanidadCustom) DB.sanidadCustom = []; 
      if (!DB.asignacionesAlimentos) DB.asignacionesAlimentos = {}; 
      if (!DB.lotes) { DB.lotes = [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }]; }
      DB.animales.forEach(function(a){ if(!a.loteId) a.loteId = 'lot_general'; });
} catch(e) { 
    DB = { animales: [], precios: { pasto: 1200, salvado: 2500, melaza: 3800, levadura: 8000, bicarb: 4500, sal: 6200, urea: 9500 }, 
           stock: { pasto: 500, salvado: 200, melaza: 50, levadura: 10, bicarb: 5, sal: 2, urea: 20 }, stockSanidad: {}, preciosSanidad: {}, 
           aplicaciones: [], precioKG: 9800, alimentosCustom: [], sanidadCustom: [], asignacionesAlimentos: {},
           lotes: [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }] }; 
}
function save() { localStorage.setItem('ganadero_elite_v32', JSON.stringify(DB)); }

// ==================== MOTOR DIETA ====================
function getDiet(pv, prop, estado) { 
    if (pv < 20) return { pasto:0,salvado:0,melaza:0,urea:0,bicarb:0,sal:0,levadura:0 };
    var base = pv * 0.03, pasto = base*0.90, salvado = base*0.10, levadura = (pv*0.05)/1000;
    var m, u, b, s, p = prop||'carne', st = estado||'auto';
    if (st==='venta'||st==='descarte') { m=base*0.05; u=(pv*0.11)/1000; b=(pv*0.15)/1000; s=(pv*0.20)/1000; }
    else if (p==='carne') {
        if (pv<150) { m=base*0.02; u=0; b=(pv*0.10)/1000; s=(pv*0.15)/1000; }
        else if (pv<350) { m=base*0.03; u=(pv*0.11)/1000; b=(pv*0.125)/1000; s=(pv*0.20)/1000; }
        else { m=base*0.05; u=(pv*0.11)/1000; b=(pv*0.15)/1000; s=(pv*0.20)/1000; }
    } else {
        if (st==='seca'||pv<350) { m=base*0.01; u=(pv*0.05)/1000; b=(pv*0.10)/1000; s=(pv*0.25)/1000; }
        else if (st==='parida') { m=base*0.03; u=(pv*0.08)/1000; b=(pv*0.20)/1000; s=(pv*0.50)/1000; }
        else { m=base*0.01; u=(pv*0.05)/1000; b=(pv*0.10)/1000; s=(pv*0.25)/1000; }
    }
    if (pv<150) u=0; u=Math.min(u,(pv*0.11)/1000);
    if ((p==='leche'&&pv<350)||st==='novilla') m=Math.min(m,base*0.02);
    return { pasto, salvado, melaza:m, urea:u, bicarb:b, sal:s, levadura }; 
}

function getGMD(h) { 
    if(h.length < 2) return 0; 
    var last = h[h.length-1], prev = h[h.length-2];
    function parseFecha(f) { var partes = f.split('/'); return new Date(partes[2], partes[1]-1, partes[0]); }
    var diffDias = (parseFecha(last.fecha) - parseFecha(prev.fecha)) / (1000 * 60 * 60 * 24);
    return diffDias > 0 ? (last.peso - prev.peso) / diffDias : 0; 
}

function getRendimiento(h){if(h.length<2)return{nivel:'azul',texto:'Registre más pesajes',cm:0,color:'azul'};var a=h[h.length-1].peso,b=h[h.length-2].peso,c=((a-b)/b)*100;if(a<b)return{nivel:'gris',texto:'Pérdida',cm:c,color:'gris'};if(c>=5)return{nivel:'verde',texto:'Excelente',cm:c,color:'verde'};if(c>=3.5)return{nivel:'azul',texto:'Bueno',cm:c,color:'azul'};if(c>=2.5)return{nivel:'naranja',texto:'Regular',cm:c,color:'naranja'};return{nivel:'rojo',texto:'Bajo',cm:c,color:'rojo'}}

// ==================== MOTOR REPRODUCTIVO ====================
function calcRepro(a) {
    if(a.proposito!=='leche'&&!a.fechaUltimoParto) return null;
    if(!a.fechaUltimoParto) return {diasPP:0,diasParaParto:999,fechaProxParto:null,semaforo:{color:'#6b7280',txt:'📅 Sin registro'},estadoLactancia:'novilla'};
    var hoy=new Date(),parto=new Date(a.fechaUltimoParto.split('/').reverse().join('-')),diasPP=Math.max(0,Math.floor((hoy-parto)/86400000));
    var fpp=new Date(parto);fpp.setDate(parto.getDate()+285);var dpp=Math.floor((fpp-hoy)/86400000);
    var est=(a.estadoReproductivo==='seca')?'seca':'parida',sem;
    if(dpp<=60&&dpp>0){est='seca';sem={color:'#3b82f6',txt:'🔵 Secado ('+dpp+'d)'};}
    else if(diasPP<=60) sem={color:'#22c55e',txt:'🟢 Recup. posparto'};
    else if(diasPP<=150) sem={color:'#f59e0b',txt:'🟡 Ventana preñez'};
    else sem={color:'#ef4444',txt:'🔴 ALERTA vaca vacía'};
    return {diasPP,diasParaParto:dpp,fechaProxParto:fpp.toLocaleDateString('es-CO'),semaforo:sem,estadoLactancia:est};
}
function getEtapa(pv,rep){var e=rep?rep.estadoLactancia:'auto';if(e==='seca')return{nombre:'Vaca Seca',clase:'etapa-madurez',icono:'🥛',min:300,max:600,ureaBloqueada:false,color:'#3b82f6',siguiente:'Venta'};if(e==='parida')return{nombre:'Producción',clase:'etapa-ceba',icono:'🐄',min:400,max:800,ureaBloqueada:false,color:'#22c55e',siguiente:'Venta'};if(pv<150)return{nombre:'Cría',clase:'etapa-inicio',icono:'🐮',min:0,max:150,ureaBloqueada:true,color:'#d4a017',siguiente:'Levante'};if(pv<350)return{nombre:'Levante',clase:'etapa-desarrollo',icono:'🐂',min:150,max:350,ureaBloqueada:false,color:'#60a5fa',siguiente:'Ceba'};return{nombre:'Ceba/Finalización',clase:'etapa-madurez',icono:'🐃',min:350,max:500,ureaBloqueada:false,color:'#fb923c',siguiente:'Venta'};}
function getProgresoEtapa(pv,e){return Math.min(100,Math.max(0,((pv-e.min)/(e.max-e.min))*100));}

// ==================== FINANZAS ====================
function getCostoDiario(pv,prop,estado){var d=getDiet(pv,prop,estado),pr=DB.precios;return(d.pasto*pr.pasto)+(d.salvado*pr.salvado)+(d.melaza*pr.melaza)+(d.levadura*pr.levadura)+(d.bicarb*pr.bicarb)+(d.sal*pr.sal)+(d.urea*pr.urea);}
function getCostoAlimentosCustom(aid,peso){if(!DB.asignacionesAlimentos[aid])return 0;var t=0;DB.asignacionesAlimentos[aid].forEach(function(a){if(a.activo){var i=DB.alimentosCustom.find(function(x){return x.id===a.alimentoId});if(i)t+=(peso*i.dosisPorKg)*(i.unidad==='g'?0.001:1)*i.precioUnitario;}});return t;}
function getAllSanidad(){var b=CATALOGO_SANIDAD.map(function(p){return Object.assign({},p,{esBase:true})}),c=DB.sanidadCustom.map(function(p){return Object.assign({},p,{esBase:false})});return b.concat(c);}
function getCostoSanidadDiario(aid){var t=0;for(var i=0;i<DB.aplicaciones.length;i++){if(DB.aplicaciones[i].animalId===aid){var p=getAllSanidad().find(function(x){return x.id===DB.aplicaciones[i].productoId});if(p&&p.diasEfecto>0)t+=(DB.aplicaciones[i].costo||0)/p.diasEfecto;}}return t;}
function getCostoSanidadTotal(aid){var t=0;for(var i=0;i<DB.aplicaciones.length;i++)if(DB.aplicaciones[i].animalId===aid)t+=(DB.aplicaciones[i].costo||0);return t;}
function getAlertasSanidad(a){var al=[],pv=a.historial[a.historial.length-1].peso,gmd=getGMD(a.historial),et=getEtapa(pv,calcRepro(a)),tm=false,tcb=false,tiv=false;for(var i=DB.aplicaciones.length-1;i>=0;i--){if(DB.aplicaciones[i].animalId===a.id){var d=getDiasDesde(DB.aplicaciones[i].fecha),pr=getAllSanidad().find(function(p){return p.id===DB.aplicaciones[i].productoId});if(pr){if(pr.id==='modificador'&&d<pr.diasEfecto)tm=true;if(pr.id==='complejoB'&&d<pr.diasEfecto)tcb=true;if(pr.id.indexOf('ivermectina')!==-1&&d<pr.diasEfecto)tiv=true;if(pr.retiro>0&&d<pr.retiro)al.push({t:'r',m:'🚫 NO APTO VENTA. '+pr.nombre+' ('+(pr.retiro-d)+'d)',icon:'fa-clock'});}}}if(gmd>0&&gmd<0.4&&!tm)al.push({t:'purple',m:'Ganancia baja. Aplicar Modificador',icon:'fa-flask'});if(!tiv)al.push({t:'r',m:'Desparasitación vencida. Aplicar Ivermectina',icon:'fa-shield-virus'});if(et.nombre.indexOf('Cría')!==-1&&(!tm||!tcb))al.push({t:'purple',m:'Inicio: Refuerzo Modificador/Complejo B',icon:'fa-bone'});return al;}

// ==================== HELPERS LOTES ====================
function getLoteName(id){var l=DB.lotes.find(function(x){return x.id===id});return l?l.nombre:'General';}
function getLoteColor(id){var l=DB.lotes.find(function(x){return x.id===id});return l?l.color:'#d4a017';}
function getAnimalesByLote(loteId){return DB.animales.filter(function(a){return a.loteId===loteId;});}

// ==================== INICIO (DASHBOARD) ====================
function renderInicio(){/* Aquí va tu renderInicio completo */}

function savePKG(){var e=document.getElementById('inpPKG');if(e){DB.precioKG=parseFloat(e.value)||0;save();renderInicio();showToast('✅ Precio actualizado');}}
function filtrarPorLote(loteId){goPage('animales');setTimeout(function(){animalFilterLote=loteId;renderAnimales();},100);}

// ==================== LOTES ====================
function renderLotes(){/* Aquí va tu renderLotes completo */}
function showAddLoteModal(){/* ... */}
function guardarLote(){/* ... */}
function showEditLoteColor(lid){/* ... */}
function guardarColorLote(lid){/* ... */}
function deleteLote(lid){/* ... */}

// ==================== ANIMALES ====================
var animalFilterLote='all', animalSearch='';
function renderAnimales(){/* Aquí va tu renderAnimales completo */}

// ==================== INSUMOS ====================
var insumoTab='precios';
function renderInsumos(){/* Aquí va tu renderInsumos completo */}
function renderInsumoPrecios(){/* ... */}
function savePrecios(){/* ... */}
function renderInsumoStock(){/* ... */}
function saveStock(){/* ... */}
function renderInsumoSanidad(){/* ... */}
function agregarCompraSanidad(prodId){/* ... */}

// ==================== CONFIG ====================
function renderConfig(){/* Aquí va tu renderConfig completo */}
function exportData(){/* ... */}
function importData(){/* ... */}
function handleImport(e){/* ... */}

// ==================== PERFIL ====================
function showProfile(id){/* Aquí va tu showProfile completo */}

// ==================== MODALES CRUD ====================
function showAddAnimalModal(){/* Aquí va tu showAddAnimalModal completo */}
function toggleCompraField(){/* ... */}
function guardarNuevoAnimal(){/* ... */}
function showReproModal(id){/* ... */}
function guardarRepro(id){/* ... */}
function showModalAsignarAlimento(idAnimal){/* ... */}
function asignarAlimentoConStock(id){/* ... */}
function toggleAlimentoCustom(id,aid){/* ... */}
function openAplicarProducto(animalId){/* ... */}
function calcDosisModal(p){/* ... */}
function aplicarProducto(id){/* ... */}

// ==================== PERSONALIZADOS CRUD ====================
function addAlimentoCustom(d){/* ... */}
function deleteAlimentoCustom(id){/* ... */}
function addSanidadCustom(d){/* ... */}
function deleteSanidadCustom(id){/* ... */}
function showModalGestionAlimentos(){/* ... */}
function renderFormAlimentoCustom(){/* ... */}
function guardarAlimentoCustom(){/* ... */}
function calcPreviewAl(){/* ... */}
function showModalGestionSanidad(){/* ... */}
function renderFormSanidadCustom(){/* ... */}
function guardarSanidadCustom(){/* ... */}
function calcPreviewSan(){/* ... */}

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.nav-item').forEach(function(n){n.addEventListener('click',function(){goPage(n.dataset.p);});});
function goPage(p){
    document.querySelector('header').classList.remove('hidden');
    ['v-inicio','v-lotes','v-animales','v-insumos','v-config','v-perfil'].forEach(function(id){document.getElementById(id).classList.add('hidden');});
    document.getElementById('v-'+p).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');n.style.display='flex';});
    document.querySelector('.nav-item[data-p="'+p+'"]')?.classList.add('active');
    if(p==='inicio')renderInicio();if(p==='lotes')renderLotes();if(p==='animales')renderAnimales();if(p==='insumos')renderInsumos();if(p==='config')renderConfig();
    window.scrollTo(0,0);
}
function updateWeight(id){var p=prompt('⚖️ Nuevo pesaje (kg):');if(!p)return;p=parseFloat(p);if(isNaN(p)||p<20||p>2000){alert('⚠️ Peso inválido');return}var a=DB.animales.find(function(x){return x.id===id});if(!a)return;a.historial.push({fecha:new Date().toLocaleDateString(),peso:p});save();showProfile(id);}
function deleteAnimal(id){if(confirm('⚠️ ¿Eliminar?')){DB.animales=DB.animales.filter(function(x){return x.id!==id});delete DB.asignacionesAlimentos[id];save();closeProfile();}}
function closeProfile(){document.getElementById('v-perfil').classList.add('hidden');document.querySelector('header').classList.remove('hidden');goPage('animales');}
renderAnimales();
