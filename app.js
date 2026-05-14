// ==================== UTILIDADES ====================
function fm(n) {
    if (isNaN(n) || n === null || n === undefined) return '0';
    n = Math.round(n);
    var s = String(n);
    var r = '';
    var c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
        if (c > 0 && c % 3 === 0) r = '.' + r;
        r = s.charAt(i) + r;
        c++;
    }
    return r;
}

function showToast(m, d) {
    d = d || 3000;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = m;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(function() { t.remove(); }, d);
}

function showModal(h) {
    var o = document.createElement('div');
    o.className = 'modal-overlay';
    o.innerHTML = '<div class="modal">' + h + '</div>';
    o.onclick = function(e) { if (e.target === o) o.remove(); };
    document.getElementById('modalContainer').appendChild(o);
}

function getDiasDesde(f) {
    if (!f) return 999;
    var p = f.split('/');
    if (p.length < 3) return 999;
    return Math.floor((new Date() - new Date(p[2], p[1] - 1, p[0])) / 86400000);
}

function randColor() {
    var c = ['#d4a017', '#22c55e', '#3b82f6', '#ef4444', '#a78bfa', '#f59e0b', '#ec4899', '#14b8a6'];
    return c[Math.floor(Math.random() * c.length)];
}

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
try {
    var raw = localStorage.getItem('ganadero_elite_v32');
    DB = raw ? JSON.parse(raw) : null;
    if (!DB) throw new Error("Init");
    if (!DB.alimentosCustom) DB.alimentosCustom = [];
    if (!DB.sanidadCustom) DB.sanidadCustom = [];
    if (!DB.asignacionesAlimentos) DB.asignacionesAlimentos = {};
    if (!DB.lotes) { DB.lotes = [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }]; }
    DB.animales.forEach(function(a) { if (!a.loteId) a.loteId = 'lot_general'; });
} catch (e) {
    DB = {
        animales: [],
        precios: { pasto: 1200, salvado: 2500, melaza: 3800, levadura: 8000, bicarb: 4500, sal: 6200, urea: 9500 },
        stock: { pasto: 500, salvado: 200, melaza: 50, levadura: 10, bicarb: 5, sal: 2, urea: 20 },
        stockSanidad: {},
        preciosSanidad: {},
        aplicaciones: [],
        precioKG: 9800,
        alimentosCustom: [],
        sanidadCustom: [],
        asignacionesAlimentos: {},
        lotes: [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }]
    };
}

function save() {
    localStorage.setItem('ganadero_elite_v32', JSON.stringify(DB));
}

// ==================== MOTOR DIETA ====================
function getDiet(pv, prop, estado) {
    if (pv < 20) return { pasto: 0, salvado: 0, melaza: 0, urea: 0, bicarb: 0, sal: 0, levadura: 0 };
    var base = pv * 0.03;
    var pasto = base * 0.90;
    var salvado = base * 0.10;
    var levadura = (pv * 0.05) / 1000;
    var m, u, b, s;
    var p = prop || 'carne';
    var st = estado || 'auto';

    if (st === 'venta' || st === 'descarte') {
        m = base * 0.05;
        u = (pv * 0.11) / 1000;
        b = (pv * 0.15) / 1000;
        s = (pv * 0.20) / 1000;
    } else if (p === 'carne') {
        if (pv < 150) {
            m = base * 0.02;
            u = 0;
            b = (pv * 0.10) / 1000;
            s = (pv * 0.15) / 1000;
        } else if (pv < 350) {
            m = base * 0.03;
            u = (pv * 0.11) / 1000;
            b = (pv * 0.125) / 1000;
            s = (pv * 0.20) / 1000;
        } else {
            m = base * 0.05;
            u = (pv * 0.11) / 1000;
            b = (pv * 0.15) / 1000;
            s = (pv * 0.20) / 1000;
        }
    } else {
        if (st === 'seca' || pv < 350) {
            m = base * 0.01;
            u = (pv * 0.05) / 1000;
            b = (pv * 0.10) / 1000;
            s = (pv * 0.25) / 1000;
        } else if (st === 'parida') {
            m = base * 0.03;
            u = (pv * 0.08) / 1000;
            b = (pv * 0.20) / 1000;
            s = (pv * 0.50) / 1000;
        } else {
            m = base * 0.01;
            u = (pv * 0.05) / 1000;
            b = (pv * 0.10) / 1000;
            s = (pv * 0.25) / 1000;
        }
    }

    if (pv < 150) u = 0;
    u = Math.min(u, (pv * 0.11) / 1000);
    if ((p === 'leche' && pv < 350) || st === 'novilla') m = Math.min(m, base * 0.02);

    return { pasto: pasto, salvado: salvado, melaza: m, urea: u, bicarb: b, sal: s, levadura: levadura };
}

function getGMD(h) {
    if (h.length < 2) return 0;
    var last = h[h.length - 1];
    var prev = h[h.length - 2];

    function parseFecha(f) {
        var partes = f.split('/');
        return new Date(partes[2], partes[1] - 1, partes[0]);
    }

    var diffDias = (parseFecha(last.fecha) - parseFecha(prev.fecha)) / (1000 * 60 * 60 * 24);
    return diffDias > 0 ? (last.peso - prev.peso) / diffDias : 0;
}

function getRendimiento(h) {
    if (h.length < 2) return { nivel: 'azul', texto: 'Registre más pesajes', cm: 0, color: 'azul' };
    var act = h[h.length - 1].peso;
    var ant = h[h.length - 2].peso;
    var cm = ((act - ant) / ant) * 100;
    if (act < ant) return { nivel: 'gris', texto: 'Pérdida de Peso', cm: cm, color: 'gris' };
    if (cm >= 5) return { nivel: 'verde', texto: 'Excelente', cm: cm, color: 'verde' };
    if (cm >= 3.5) return { nivel: 'azul', texto: 'Bueno', cm: cm, color: 'azul' };
    if (cm >= 2.5) return { nivel: 'naranja', texto: 'Regular', cm: cm, color: 'naranja' };
    return { nivel: 'rojo', texto: 'Bajo', cm: cm, color: 'rojo' };
}

// ==================== MOTOR REPRODUCTIVO ====================
function calcRepro(a) {
    if (a.proposito !== 'leche' && !a.fechaUltimoParto) return null;
    if (!a.fechaUltimoParto) {
        return {
            diasPP: 0,
            diasParaParto: 999,
            fechaProxParto: null,
            semaforo: { color: '#6b7280', txt: '📅 Sin registro' },
            estadoLactancia: 'novilla'
        };
    }
    var hoy = new Date();
    var parto = new Date(a.fechaUltimoParto.split('/').reverse().join('-'));
    var diasPP = Math.max(0, Math.floor((hoy - parto) / 86400000));
    var fechaProxParto = new Date(parto);
    fechaProxParto.setDate(parto.getDate() + 285);
    var diasParaParto = Math.floor((fechaProxParto - hoy) / 86400000);
    var estadoLactancia = (a.estadoReproductivo === 'seca') ? 'seca' : 'parida';
    var semaforo;

    if (diasParaParto <= 60 && diasParaParto > 0) {
        estadoLactancia = 'seca';
        semaforo = { color: '#3b82f6', txt: '🔵 FASE SECADO (' + diasParaParto + 'd)' };
    } else if (diasPP <= 60) {
        semaforo = { color: '#22c55e', txt: '🟢 Recup. e inicio ordeño' };
    } else if (diasPP <= 150) {
        semaforo = { color: '#f59e0b', txt: '🟡 Ventana de preñez óptima' };
    } else {
        semaforo = { color: '#ef4444', txt: '🔴 ALERTA: Vaca vacía fuera de tiempo' };
    }

    return {
        diasPP: diasPP,
        diasParaParto: diasParaParto,
        fechaProxParto: fechaProxParto.toLocaleDateString('es-CO'),
        semaforo: semaforo,
        estadoLactancia: estadoLactancia
    };
}

function getEtapa(pv, rep) {
    var est = rep ? rep.estadoLactancia : 'auto';
    if (est === 'seca') {
        return { nombre: 'Vaca Seca', clase: 'etapa-madurez', icono: '🥛', min: 300, max: 600, ureaBloqueada: false, color: '#3b82f6', siguiente: 'Venta' };
    }
    if (est === 'parida') {
        return { nombre: 'Producción', clase: 'etapa-ceba', icono: '🐄', min: 400, max: 800, ureaBloqueada: false, color: '#22c55e', siguiente: 'Venta' };
    }
    if (pv < 150) {
        return { nombre: 'Cría', clase: 'etapa-inicio', icono: '🐮', min: 0, max: 150, ureaBloqueada: true, color: '#d4a017', siguiente: 'Levante' };
    }
    if (pv < 350) {
        return { nombre: 'Levante', clase: 'etapa-desarrollo', icono: '🐂', min: 150, max: 350, ureaBloqueada: false, color: '#60a5fa', siguiente: 'Ceba' };
    }
    return { nombre: 'Ceba/Finalización', clase: 'etapa-madurez', icono: '🐃', min: 350, max: 500, ureaBloqueada: false, color: '#fb923c', siguiente: 'Venta' };
}

function getProgresoEtapa(pv, e) {
    return Math.min(100, Math.max(0, ((pv - e.min) / (e.max - e.min)) * 100));
}

// ==================== FINANZAS ====================
function getCostoDiario(pv, prop, estado) {
    var d = getDiet(pv, prop, estado);
    var pr = DB.precios;
    return (d.pasto * pr.pasto) + (d.salvado * pr.salvado) + (d.melaza * pr.melaza) +
           (d.levadura * pr.levadura) + (d.bicarb * pr.bicarb) + (d.sal * pr.sal) + (d.urea * pr.urea);
}

function getCostoAlimentosCustom(aid, peso) {
    if (!DB.asignacionesAlimentos[aid]) return 0;
    var total = 0;
    DB.asignacionesAlimentos[aid].forEach(function(a) {
        if (a.activo) {
            var item = DB.alimentosCustom.find(function(x) { return x.id === a.alimentoId; });
            if (item) {
                total += (peso * item.dosisPorKg) * (item.unidad === 'g' ? 0.001 : 1) * item.precioUnitario;
            }
        }
    });
    return total;
}

function getAllSanidad() {
    var base = CATALOGO_SANIDAD.map(function(p) {
        return Object.assign({}, p, { esBase: true });
    });
    var custom = DB.sanidadCustom.map(function(p) {
        return Object.assign({}, p, { esBase: false });
    });
    return base.concat(custom);
}

function getCostoSanidadDiario(aid) {
    var total = 0;
    for (var i = 0; i < DB.aplicaciones.length; i++) {
        if (DB.aplicaciones[i].animalId === aid) {
            var prod = getAllSanidad().find(function(x) { return x.id === DB.aplicaciones[i].productoId; });
            if (prod && prod.diasEfecto > 0) {
                total += (DB.aplicaciones[i].costo || 0) / prod.diasEfecto;
            }
        }
    }
    return total;
}

function getCostoSanidadTotal(aid) {
    var total = 0;
    for (var i = 0; i < DB.aplicaciones.length; i++) {
        if (DB.aplicaciones[i].animalId === aid) total += (DB.aplicaciones[i].costo || 0);
    }
    return total;
}

function getAlertasSanidad(a) {
    var alertas = [];
    var pv = a.historial[a.historial.length - 1].peso;
    var gmd = getGMD(a.historial);
    var etapa = getEtapa(pv, calcRepro(a));
    var tm = false, tcb = false, tiv = false;

    for (var i = DB.aplicaciones.length - 1; i >= 0; i--) {
        if (DB.aplicaciones[i].animalId === a.id) {
            var d = getDiasDesde(DB.aplicaciones[i].fecha);
            var prod = getAllSanidad().find(function(p) { return p.id === DB.aplicaciones[i].productoId; });
            if (prod) {
                if (prod.id === 'modificador' && d < prod.diasEfecto) tm = true;
                if (prod.id === 'complejoB' && d < prod.diasEfecto) tcb = true;
                if (prod.id.indexOf('ivermectina') !== -1 && d < prod.diasEfecto) tiv = true;
                if (prod.retiro > 0 && d < prod.retiro) {
                    alertas.push({ t: 'r', m: '🚫 NO APTO VENTA. ' + prod.nombre + ' (' + (prod.retiro - d) + 'd)', icon: 'fa-clock' });
                }
            }
        }
    }

    if (gmd > 0 && gmd < 0.4 && !tm) alertas.push({ t: 'purple', m: 'Ganancia baja. Aplicar Modificador', icon: 'fa-flask' });
    if (!tiv) alertas.push({ t: 'r', m: 'Desparasitación vencida. Aplicar Ivermectina', icon: 'fa-shield-virus' });
    if (etapa.nombre.indexOf('Cría') !== -1 && (!tm || !tcb)) alertas.push({ t: 'purple', m: 'Inicio: Refuerzo Modificador/Complejo B', icon: 'fa-bone' });

    return alertas;
}

// ==================== HELPERS LOTES ====================
function getLoteName(id) {
    var l = DB.lotes.find(function(x) { return x.id === id; });
    return l ? l.nombre : 'General';
}

function getLoteColor(id) {
    var l = DB.lotes.find(function(x) { return x.id === id; });
    return l ? l.color : '#d4a017';
}

function getAnimalesByLote(loteId) {
    return DB.animales.filter(function(a) { return a.loteId === loteId; });
}

// ==================== INICIO (DASHBOARD) ====================
function renderInicio() {
    var pr = DB.precioKG;
    var totalKg = 0;
    var costoTotal = 0;
    var est = { verde: 0, azul: 0, naranja: 0, rojo: 0, gris: 0 };
    var alertas = [];
    var csTotal = 0;
    var ta = DB.animales.length;

    DB.animales.forEach(function(a) {
        var p = a.historial[a.historial.length - 1].peso;
        var rep = calcRepro(a);
        var estAct = rep ? rep.estadoLactancia : 'auto';
        totalKg += p;
        costoTotal += getCostoDiario(p, a.proposito, estAct) + getCostoAlimentosCustom(a.id, p);
        csTotal += getCostoSanidadTotal(a.id);
        var r = getRendimiento(a.historial);
        est[r.nivel]++;
        var as = getAlertasSanidad(a);
        for (var s = 0; s < as.length; s++) {
            alertas.push({ nombre: a.nombre, t: as[s].t, m: as[s].m, icon: as[s].icon });
        }
    });

    var prom = ta > 0 ? totalKg / ta : 0;
    var gmdL = ta > 0 ? DB.animales.reduce(function(s, a) { return s + getGMD(a.historial); }, 0) / ta : 0;
    var ingM = gmdL * 30 * pr * ta;
    var cosM = costoTotal * 30;
    var gan = ingM - cosM - (csTotal / 12);
    var pctB = ta > 0 ? ((est.verde + est.azul) / ta) * 100 : 0;
    var nl = DB.lotes.length;

    var html = '';
    html += '<div class="card" style="background:linear-gradient(135deg,rgba(212,160,23,.1),rgba(212,160,23,.02));border-color:rgba(212,160,23,.2)">';
    html += '<div class="row-label mb6" style="font-weight:600;color:var(--accent)"><i class="fa-solid fa-coins"></i> PRECIO KG EN PIE</div>';
    html += '<div style="display:flex;align-items:center;gap:6px">';
    html += '<span style="font-size:1.2rem;font-weight:800;color:var(--accent)">$</span>';
    html += '<input id="inpPKG" type="number" value="' + pr + '" style="font-size:1.2rem;font-weight:700;text-align:center;background:transparent;border:none;color:var(--accent)">';
    html += '<span style="font-size:.7rem;color:var(--muted)">COP</span></div>';
    html += '<button class="btn btn-green mt8" onclick="savePKG()"><i class="fa-solid fa-check"></i> ACTUALIZAR</button></div>';

    html += '<div class="card"><div class="row-label mb6" style="font-weight:600"><i class="fa-solid fa-chart-pie"></i> RESUMEN GENERAL</div>';
    html += '<div class="stats-grid">';
    html += '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-users"></i> Cabezas</div><div class="row-val">' + ta + '</div></div>';
    html += '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-layer-group"></i> Lotes</div><div class="row-val">' + nl + '</div></div>';
    html += '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-weight-scale"></i> Peso Total</div><div class="row-val">' + fm(totalKg) + ' kg</div></div>';
    html += '<div class="stat-item"><div class="row-label"><i class="fa-solid fa-calculator"></i> Promedio</div><div class="row-val">' + fm(prom) + ' kg</div></div>';
    html += '</div></div>';

    html += '<div class="card"><div class="capital-value">$ ' + fm(totalKg * pr) + '</div>';
    html += '<div class="row-label" style="font-size:.7rem;color:var(--muted)"><i class="fa-solid fa-sack-dollar"></i> Valor total del hato</div></div>';

    html += '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--muted)"><i class="fa-solid fa-chart-simple"></i> ESTADO DEL HATO</div>';
    html += '<div class="estado-simple">';
    html += '<div class="estado-pildora e"><div class="num">' + est.verde + '</div><div class="lbl">Excelente</div></div>';
    html += '<div class="estado-pildora b"><div class="num">' + est.azul + '</div><div class="lbl">Bueno</div></div>';
    html += '<div class="estado-pildora r"><div class="num">' + est.naranja + '</div><div class="lbl">Regular</div></div>';
    html += '<div class="estado-pildora m"><div class="num">' + est.rojo + '</div><div class="lbl">Bajo</div></div></div>';
    html += '<div class="progress"><div class="progress-fill" style="width:' + pctB + '%;background:var(--info)"></div></div></div>';

    html += '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:10px;color:var(--muted)"><i class="fa-solid fa-coins"></i> FINANZAS</div>';
    html += '<div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Alimentación/día</span><span class="row-val">$ ' + fm(costoTotal) + '</span></div>';
    html += '<div class="row"><span class="row-label"><i class="fa-solid fa-syringe"></i> Sanidad total</span><span class="row-val">$ ' + fm(csTotal) + '</span></div>';
    html += '<div class="row"><span class="row-label"><i class="fa-solid fa-chart-line"></i> Ganancia neta/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>';

    if (alertas.length > 0) {
        html += '<div class="card"><div style="font-weight:700;font-size:.7rem;margin-bottom:8px;color:var(--muted)"><i class="fa-solid fa-bell"></i> ALERTAS RECIENTES</div>';
        alertas.slice(0, 5).forEach(function(a) {
            var cls = a.t === 'r' ? 'alert-danger' : (a.t === 'purple' ? 'alert-purple' : (a.t === 'info' ? 'alert-info' : 'alert-warning'));
            html += '<div class="alert-item ' + cls + '"><i class="fa-solid ' + a.icon + '"></i><div><b>' + (a.nombre || '') + '</b>: ' + a.m + '</div></div>';
        });
        html += '</div>';
    }

    html += '<div class="section-title"><i class="fa-solid fa-layer-group"></i> MIS LOTES</div><div class="grid">';
    DB.lotes.forEach(function(l) {
        var na = getAnimalesByLote(l.id).length;
        var pt = 0;
        getAnimalesByLote(l.id).forEach(function(a) { pt += a.historial[a.historial.length - 1].peso; });
        html += '<div class="lote-card" style="border-color:' + l.color + '30" onclick="filtrarPorLote(\'' + l.id + '\')">';
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
        html += '<div class="lote-color" style="background:' + l.color + '"></div>';
        html += '<div><div class="lote-name">' + l.nombre + '</div>';
        html += '<div class="lote-stats">' + na + ' animales · ' + fm(pt) + ' kg</div></div></div></div>';
    });
    html += '</div>';

    document.getElementById('v-inicio').innerHTML = html;
}

function savePKG() {
    var el = document.getElementById('inpPKG');
    if (el) {
        DB.precioKG = parseFloat(el.value) || 0;
        save();
        renderInicio();
        showToast('✅ Precio actualizado');
    }
}

function filtrarPorLote(loteId) {
    goPage('animales');
    setTimeout(function() {
        animalFilterLote = loteId;
        renderAnimales();
    }, 100);
}

// ==================== LOTES ====================
function renderLotes() {
    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-weight:700;color:var(--accent)"><i class="fa-solid fa-layer-group"></i> GESTIÓN DE LOTES</span>';
    html += '<button class="btn btn-sm btn-gold" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showAddLoteModal()"><i class="fa-solid fa-plus"></i> Crear Lote</button></div>';

    if (DB.lotes.length === 0) {
        html += '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem">No hay lotes creados</div>';
    }

    DB.lotes.forEach(function(l) {
        var na = getAnimalesByLote(l.id).length;
        var pt = 0;
        getAnimalesByLote(l.id).forEach(function(a) { pt += a.historial[a.historial.length - 1].peso; });
        html += '<div class="lote-card" style="border-color:' + l.color + '30" onclick="filtrarPorLote(\'' + l.id + '\')">';
        html += '<div style="position:absolute;top:0;left:0;width:4px;height:100%;background:' + l.color + ';border-radius:4px 0 0 4px"></div>';
        html += '<div class="lote-header"><div><div class="lote-name">' + l.nombre + '</div>';
        html += '<div class="lote-stats"><span><b>' + na + '</b> animales</span><span><b>' + fm(pt) + '</b> kg total</span></div></div>';
        html += '<div style="display:flex;gap:6px" onclick="event.stopPropagation()">';
        html += '<div class="lote-color" style="background:' + l.color + '" onclick="showEditLoteColor(\'' + l.id + '\')"></div>';
        html += '<button class="btn btn-sm btn-danger" style="width:28px;padding:0;height:28px" onclick="deleteLote(\'' + l.id + '\')"><i class="fa-solid fa-trash"></i></button>';
        html += '</div></div></div>';
    });
    html += '</div>';

    document.getElementById('v-lotes').innerHTML = html;
}

function showAddLoteModal() {
    var h = '<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-plus"></i> NUEVO LOTE</div>';
    h += '<div class="flex-col gap10">';
    h += '<input id="nlNombre" type="text" placeholder="Nombre del lote">';
    h += '<input id="nlColor" type="color" value="' + randColor() + '" style="width:100%;height:40px;border-radius:10px;border:none;cursor:pointer">';
    h += '<button class="btn btn-gold mt8" onclick="guardarLote()"><i class="fa-solid fa-check"></i> CREAR</button>';
    h += '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(h);
}

function guardarLote() {
    var n = document.getElementById('nlNombre').value.trim();
    var c = document.getElementById('nlColor').value;
    if (!n) { showToast('⚠️ Ingresa un nombre'); return; }
    var id = 'lot_' + Date.now();
    DB.lotes.push({ id: id, nombre: n, color: c });
    save();
    document.querySelector('.modal-overlay').remove();
    showToast('✅ Lote "' + n + '" creado');
    renderLotes();
}

function showEditLoteColor(lid) {
    var l = DB.lotes.find(function(x) { return x.id === lid; });
    if (!l) return;
    var h = '<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-palette"></i> COLOR DEL LOTE</div>';
    h += '<div class="flex-col gap10"><input id="elColor" type="color" value="' + l.color + '" style="width:100%;height:50px;border-radius:10px;border:none;cursor:pointer">';
    h += '<button class="btn btn-green mt8" onclick="guardarColorLote(\'' + lid + '\')"><i class="fa-solid fa-check"></i> GUARDAR</button>';
    h += '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(h);
}

function guardarColorLote(lid) {
    var c = document.getElementById('elColor').value;
    var l = DB.lotes.find(function(x) { return x.id === lid; });
    if (l) l.color = c;
    save();
    document.querySelector('.modal-overlay').remove();
    renderLotes();
    showToast('✅ Color actualizado');
}

function deleteLote(lid) {
    if (lid === 'lot_general') { showToast('⚠️ No puedes eliminar el lote General'); return; }
    if (!confirm('¿Eliminar este lote? Los animales pasarán a "General"')) return;
    DB.animales.forEach(function(a) { if (a.loteId === lid) a.loteId = 'lot_general'; });
    DB.lotes = DB.lotes.filter(function(l) { return l.id !== lid; });
    save();
    renderLotes();
    showToast('✅ Lote eliminado');
}

// ==================== ANIMALES ====================
var animalFilterLote = 'all';
var animalSearch = '';

function renderAnimales() {
    var filtered = DB.animales.slice();
    if (animalFilterLote !== 'all') filtered = filtered.filter(function(a) { return a.loteId === animalFilterLote; });
    if (animalSearch) filtered = filtered.filter(function(a) { return a.nombre.toLowerCase().indexOf(animalSearch.toLowerCase()) !== -1; });

    var html = '<div class="card" style="padding:12px 16px">';
    html += '<input id="animSearch" type="text" placeholder="🔍 Buscar animal..." value="' + animalSearch + '" oninput="animalSearch=this.value;renderAnimales()" style="padding:10px 14px;font-size:.85rem"></div>';

    html += '<div class="filter-chips">';
    html += '<div class="chip ' + (animalFilterLote === 'all' ? 'active' : '') + '" data-lote="all" onclick="animalFilterLote=\'all\';renderAnimales()">Todos</div>';
    DB.lotes.forEach(function(l) {
        html += '<div class="chip ' + (animalFilterLote === l.id ? 'active' : '') + '" data-lote="' + l.id + '" onclick="animalFilterLote=\'' + l.id + '\';renderAnimales()">' + l.nombre + '</div>';
    });
    html += '</div>';

    html += '<div class="grid">';
    if (filtered.length === 0) {
        html += '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--muted)"><i class="fa-solid fa-cow" style="font-size:2rem;margin-bottom:10px;display:block"></i>No hay animales</div>';
    }

    filtered.forEach(function(a) {
        var p = a.historial[a.historial.length - 1].peso;
        var rep = calcRepro(a);
        var estAct = rep ? rep.estadoLactancia : 'auto';
        var etapa = getEtapa(p, rep);
        var r = getRendimiento(a.historial);
        var lm = { verde: 'ml-g', azul: 'ml-b', naranja: 'ml-o', rojo: 'ml-r', gris: 'ml-x' };
        var ret = false;
        for (var j = DB.aplicaciones.length - 1; j >= 0; j--) {
            if (DB.aplicaciones[j].animalId === a.id) {
                var pr = getAllSanidad().find(function(p) { return p.id === DB.aplicaciones[j].productoId; });
                if (pr && pr.retiro > 0 && getDiasDesde(DB.aplicaciones[j].fecha) < pr.retiro) { ret = true; break; }
            }
        }
        html += '<div class="animal-card" onclick="showProfile(' + a.id + ')">';
        html += '<div class="mini-led ' + lm[r.nivel] + '"></div>';
        if (etapa.ureaBloqueada) html += '<div class="lock-icon"><i class="fa-solid fa-lock"></i></div>';
        html += '<span style="font-size:1.5rem">' + etapa.icono + '</span>';
        html += '<div class="name">' + a.nombre + '</div>';
        html += '<span class="etapa-tag ' + etapa.clase + '">' + etapa.nombre + '</span>';
        html += '<div style="font-size:.6rem;color:var(--muted);margin-top:2px">' + getLoteName(a.loteId) + '</div>';
        html += '<div class="weight">' + fm(p) + ' kg</div>';
        if (ret) html += '<div class="retiro-badge">🚫 VEDA</div>';
        html += '<div class="cm" style="color:' + (r.cm >= 0 ? '#22c55e' : '#ef4444') + '">' + (r.cm >= 0 ? '+' : '') + r.cm.toFixed(1) + '%</div>';
        html += '</div>';
    });
    html += '</div>';

    document.getElementById('v-animales').innerHTML = html;
}

// ==================== INSUMOS ====================
var insumoTab = 'precios';

function renderInsumos() {
    var html = '<div class="insumos-tabs">';
    html += '<button class="insumo-tab ' + (insumoTab === 'precios' ? 'active' : '') + '" onclick="insumoTab=\'precios\';renderInsumos()">Precios</button>';
    html += '<button class="insumo-tab ' + (insumoTab === 'stock' ? 'active' : '') + '" onclick="insumoTab=\'stock\';renderInsumos()">Stock</button>';
    html += '<button class="insumo-tab ' + (insumoTab === 'sanidad' ? 'active' : '') + '" onclick="insumoTab=\'sanidad\';renderInsumos()">Sanidad</button>';
    html += '</div>';

    if (insumoTab === 'precios') html += renderInsumoPrecios();
    else if (insumoTab === 'stock') html += renderInsumoStock();
    else html += renderInsumoSanidad();

    document.getElementById('v-insumos').innerHTML = html;
}

function renderInsumoPrecios() {
    var totalKg = 0, costoBase = 0, csTotal = 0;
    DB.animales.forEach(function(a) {
        var p = a.historial[a.historial.length - 1].peso;
        var rep = calcRepro(a);
        var estAct = rep ? rep.estadoLactancia : 'auto';
        totalKg += p;
        costoBase += getCostoDiario(p, a.proposito, estAct);
        csTotal += getCostoSanidadTotal(a.id);
    });
    var gmdL = DB.animales.length > 0 ? DB.animales.reduce(function(s, a) { return s + getGMD(a.historial); }, 0) / DB.animales.length : 0;
    var ingM = gmdL * 30 * DB.precioKG * DB.animales.length;
    var gan = ingM - (costoBase * 30) - (csTotal / 12);

    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-weight:700;color:var(--accent)"><i class="fa-solid fa-tags"></i> PRECIOS ALIMENTOS</span>';
    html += '<button class="btn btn-sm btn-purple" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showModalGestionAlimentos()"><i class="fa-solid fa-gear"></i> Personalizar</button></div>';

    AL.forEach(function(k) {
        html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)">';
        html += '<i class="fa-solid ' + IC[k] + '" style="width:16px"></i>';
        html += '<span style="flex:1;font-size:.76rem">' + NM[k] + '</span>';
        html += '<span style="font-size:.7rem;color:var(--muted)">$</span>';
        html += '<input id="pr-' + k + '" type="number" value="' + (DB.precios[k] || 0) + '" style="width:85px;text-align:right;padding:8px 10px"></div>';
    });

    DB.alimentosCustom.forEach(function(a) {
        html += '<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)">';
        html += '<i class="fa-solid ' + a.icono + '" style="width:16px;color:var(--accent)"></i>';
        html += '<span style="flex:1;font-size:.76rem">' + a.nombre + ' <span class="custom-badge">CUST</span></span>';
        html += '<span style="font-size:.7rem;color:var(--muted)">$</span>';
        html += '<input id="pr-' + a.id + '" type="number" value="' + (DB.precios[a.id] || 0) + '" style="width:85px;text-align:right;padding:8px 10px">';
        html += '<button class="btn btn-sm btn-danger" style="width:26px;padding:0;height:26px;margin-left:4px" onclick="deleteAlimentoCustom(\'' + a.id + '\');renderInsumos()"><i class="fa-solid fa-trash"></i></button></div>';
    });

    html += '<button class="btn btn-gold mt8" onclick="savePrecios()"><i class="fa-solid fa-check"></i> GUARDAR</button></div>';
    html += '<div class="card"><div style="font-weight:700;margin-bottom:8px;color:var(--muted)"><i class="fa-solid fa-calculator"></i> RENTABILIDAD</div>';
    html += '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Valor del lote</span><span class="row-val">$ ' + fm(totalKg * DB.precioKG) + '</span></div>';
    html += '<div class="row"><span class="row-label"><i class="fa-solid fa-syringe"></i> Sanidad total</span><span class="row-val">$ ' + fm(csTotal) + '</span></div>';
    html += '<div class="row"><span class="row-label"><i class="fa-solid fa-chart-line"></i> Ganancia neta/mes</span><span class="row-val" style="color:' + (gan >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gan) + '</span></div></div>';

    return html;
}

function savePrecios() {
    var todos = AL.concat(DB.alimentosCustom.map(function(a) { return a.id; }));
    todos.forEach(function(id) {
        var el = document.getElementById('pr-' + id);
        if (el) DB.precios[id] = parseFloat(el.value) || 0;
    });
    save();
    showToast('✅ Precios actualizados');
}

function renderInsumoStock() {
    var consumoTotal = {};
    DB.animales.forEach(function(a) {
        var p = a.historial[a.historial.length - 1].peso;
        var rep = calcRepro(a);
        var estAct = rep ? rep.estadoLactancia : 'auto';
        var d = getDiet(p, a.proposito, estAct);
        AL.forEach(function(k) { consumoTotal[k] = (consumoTotal[k] || 0) + d[k]; });
        if (DB.asignacionesAlimentos[a.id]) {
            DB.asignacionesAlimentos[a.id].forEach(function(asig) {
                if (asig.activo) {
                    var item = DB.alimentosCustom.find(function(x) { return x.id === asig.alimentoId; });
                    if (item) {
                        consumoTotal[item.id] = (consumoTotal[item.id] || 0) + ((p * item.dosisPorKg) * (item.unidad === 'g' ? 0.001 : 1));
                    }
                }
            });
        }
    });

    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-weight:700;color:var(--accent)"><i class="fa-solid fa-boxes"></i> STOCK ALIMENTOS</span>';
    html += '<button class="btn btn-sm btn-purple" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showModalGestionAlimentos()"><i class="fa-solid fa-gear"></i> Personalizar</button></div>';

    AL.forEach(function(k) {
        var st = DB.stock[k] || 0;
        var co = consumoTotal[k] || 0;
        var dias = (co > 0 && st > 0) ? st / co : 999;
        var dCol = dias < 3 ? '#ef4444' : (dias < 7 ? '#f59e0b' : '#22c55e');
        html += '<div class="stock-row">';
        html += '<i class="fa-solid ' + IC[k] + '"></i>';
        html += '<div class="stock-info"><span class="stock-name">' + NM[k] + '</span>';
        html += '<span class="stock-consumo">Consumo: ' + co.toFixed(1) + ' kg/d</span></div>';
        html += '<input id="st-' + k + '" type="number" value="' + Math.round(st) + '" style="width:70px;text-align:right;padding:8px;font-size:.85rem" step="1">';
        html += '<span style="font-size:.68rem;font-weight:600;color:' + dCol + ';min-width:35px;text-align:center">' + (dias === 999 ? '--' : Math.round(dias) + 'd') + '</span></div>';
    });

    DB.alimentosCustom.forEach(function(a) {
        var st = DB.stock[a.id] || 0;
        var co = consumoTotal[a.id] || 0;
        var dias = (co > 0 && st > 0) ? st / co : 999;
        var dCol = dias < 3 ? '#ef4444' : (dias < 7 ? '#f59e0b' : '#22c55e');
        html += '<div class="stock-row">';
        html += '<i class="fa-solid ' + a.icono + '" style="color:var(--accent)"></i>';
        html += '<div class="stock-info"><span class="stock-name">' + a.nombre + ' <span class="custom-badge">CUST</span></span>';
        html += '<span class="stock-consumo">Consumo: ' + co.toFixed(1) + ' kg/d</span></div>';
        html += '<input id="st-' + a.id + '" type="number" value="' + Math.round(st) + '" style="width:70px;text-align:right;padding:8px;font-size:.85rem" step="1">';
        html += '<span style="font-size:.68rem;font-weight:600;color:' + dCol + ';min-width:35px;text-align:center">' + (dias === 999 ? '--' : Math.round(dias) + 'd') + '</span></div>';
    });

    html += '<button class="btn btn-gold mt8" onclick="saveStock()"><i class="fa-solid fa-check"></i> GUARDAR STOCK</button></div>';
    return html;
}

function saveStock() {
    var todos = AL.concat(DB.alimentosCustom.map(function(a) { return a.id; }));
    todos.forEach(function(id) {
        var el = document.getElementById('st-' + id);
        if (el) DB.stock[id] = parseFloat(el.value) || 0;
    });
    save();
    showToast('✅ Stock actualizado');
}

function renderInsumoSanidad() {
    var html = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:var(--accent)">';
    html += '<span><i class="fa-solid fa-syringe"></i> INVENTARIO SANIDAD</span>';
    html += '<button class="btn btn-sm btn-purple" style="width:auto;padding:6px 12px;font-size:.65rem" onclick="showModalGestionSanidad()"><i class="fa-solid fa-gear"></i> Personalizar</button></div>';

    getAllSanidad().forEach(function(p) {
        var st = DB.stockSanidad[p.id] || 0;
        var precio = p.esBase ? (DB.preciosSanidad[p.id] || 0) : p.precioML;
        html += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)">';
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
        html += '<i class="fa-solid ' + p.icono + '" style="color:' + p.color + ';font-size:1.1rem;width:20px"></i>';
        html += '<div style="flex:1"><span style="font-size:.76rem;font-weight:600">' + p.nombre + (p.esBase ? '' : '<span class="custom-badge">CUST</span>') + '</span>';
        html += '<span style="font-size:.6rem;color:var(--muted);display:block">Stock: <b>' + fm(st) + ' ml</b> · $<b>' + fm(precio) + '/ml</b> · Efecto: ' + p.diasEfecto + 'd</span></div></div>';

        if (!p.esBase) {
            html += '<button class="btn btn-sm btn-danger" style="width:auto;padding:4px 8px;margin-bottom:6px;font-size:.6rem" onclick="deleteSanidadCustom(\'' + p.id + '\');renderInsumos()"><i class="fa-solid fa-trash"></i> Eliminar</button>';
        }

        html += '<div style="font-size:.65rem;color:var(--muted);margin:6px 0 6px">➕ Comprar:</div>';
        html += '<div style="display:flex;gap:6px;align-items:center">';
        html += '<input id="compraML-' + p.id + '" type="number" placeholder="ml" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px">';
        html += '<input id="compraCosto-' + p.id + '" type="number" placeholder="Costo total ($)" style="flex:1;padding:8px 10px;font-size:.7rem;min-height:36px">';
        html += '<button class="btn btn-green" onclick="agregarCompraSanidad(\'' + p.id + '\')" style="width:auto;padding:8px 12px;font-size:.65rem"><i class="fa-solid fa-plus"></i></button>';
        html += '</div></div>';
    });
    html += '</div>';
    return html;
}

function agregarCompraSanidad(prodId) {
    var mlEl = document.getElementById('compraML-' + prodId);
    var costoEl = document.getElementById('compraCosto-' + prodId);
    if (!mlEl || !costoEl) return;
    var ml = parseFloat(mlEl.value);
    var costo = parseFloat(costoEl.value);
    if (isNaN(ml) || ml <= 0) { showToast('⚠️ Cantidad válida'); return; }
    if (isNaN(costo) || costo <= 0) { showToast('⚠️ Costo válido'); return; }
    DB.stockSanidad[prodId] = (DB.stockSanidad[prodId] || 0) + ml;
    DB.preciosSanidad[prodId] = costo / ml;
    var item = DB.sanidadCustom.find(function(x) { return x.id === prodId; });
    if (item) item.precioML = costo / ml;
    save();
    mlEl.value = '';
    costoEl.value = '';
    renderInsumos();
    showToast('✅ Stock actualizado');
}

// ==================== CONFIG ====================
function renderConfig() {
    var html = '<div class="card">';
    html += '<div class="config-item" onclick="exportData()"><i class="fa-solid fa-download"></i><div class="cfg-text"><span>Exportar Datos</span><small>Descargar respaldo JSON</small></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:.7rem"></i></div>';
    html += '<div class="config-item" onclick="importData()"><i class="fa-solid fa-upload"></i><div class="cfg-text"><span>Importar Datos</span><small>Restaurar desde archivo</small></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:.7rem"></i></div>';
    html += '<div class="config-item" onclick="if(confirm(\'⚠️ ¿Borrar TODOS los datos?\')){localStorage.clear();location.reload();}"><i class="fa-solid fa-trash-can" style="color:var(--danger)"></i><div class="cfg-text"><span style="color:var(--danger)">Borrar Todo</span><small>Eliminar todos los datos</small></div><i class="fa-solid fa-chevron-right" style="color:var(--muted);font-size:.7rem"></i></div>';
    html += '</div>';

    html += '<div class="card" style="text-align:center;padding:20px">';
    html += '<div style="font-size:2rem;margin-bottom:8px">🐄</div>';
    html += '<div style="font-weight:700;font-size:.9rem;color:var(--accent)">GANADERO ÉLITE PRO</div>';
    html += '<div style="font-size:.65rem;color:var(--muted);margin-top:4px">Versión 3.2 · Gestión Inteligente</div>';
    html += '<div style="font-size:.6rem;color:var(--muted);margin-top:8px">' + DB.animales.length + ' animales · ' + DB.lotes.length + ' lotes</div>';
    html += '</div>';

    html += '<input type="file" id="importFile" accept=".json" style="display:none" onchange="handleImport(event)">';
    document.getElementById('v-config').innerHTML = html;
}

function exportData() {
    var blob = new Blob([JSON.stringify(DB)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ganadero_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    showToast('✅ Respaldo descargado');
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) {
        try {
            var d = JSON.parse(ev.target.result);
            if (d.animales && d.precios) {
                DB = d;
                if (!DB.lotes) DB.lotes = [{ id: 'lot_general', nombre: 'General', color: '#d4a017' }];
                DB.animales.forEach(function(a) { if (!a.loteId) a.loteId = 'lot_general'; });
                save();
                showToast('✅ Datos importados');
                goPage('inicio');
            } else {
                showToast('⚠️ Archivo inválido');
            }
        } catch (err) {
            showToast('⚠️ Error al leer archivo');
        }
    };
    r.readAsText(f);
}

// ==================== PERFIL ====================
function showProfile(id) {
    var a = DB.animales.find(function(x) { return x.id === id; });
    if (!a) return;

    var p = a.historial[a.historial.length - 1].peso;
    var rep = calcRepro(a);
    var estadoActual = rep ? rep.estadoLactancia : 'auto';
    var etapa = getEtapa(p, rep);
    var r = getRendimiento(a.historial);
    var gmd = getGMD(a.historial);
    var cd = getCostoDiario(p, a.proposito, estadoActual);
    var cdC = getCostoAlimentosCustom(id, p);
    var cdT = cd + cdC;
    var csd = getCostoSanidadDiario(id);
    var cst = getCostoSanidadTotal(id);
    var ckp = gmd > 0 ? (cdT + csd) / gmd : 999999;
    var inversionTotal = (a.valorCompra || 0) + cst;
    var gananciaMensual = (gmd * 30 * DB.precioKG) - (cdT * 30) - (csd * 30);
    var diasU = getDiasDesde(a.historial[a.historial.length - 1].fecha);
    var proy30 = p + (gmd * 30);
    var proy60 = p + (gmd * 60);
    var proy90 = p + (gmd * 90);
    var valA = p * DB.precioKG;
    var fechaIngreso = a.historial[0]?.fecha || 'N/A';
    var diasSistema = fechaIngreso !== 'N/A' ? getDiasDesde(fechaIngreso) : 0;

    var as = getAlertasSanidad(a);
    var alertHTML = '';
    as.forEach(function(s) {
        var cls = s.t === 'r' ? 'danger' : (s.t === 'purple' ? 'purple' : (s.t === 'info' ? 'info' : 'warning'));
        alertHTML += '<div class="alert-item alert-' + cls + '"><i class="fa-solid ' + s.icon + '"></i> ' + s.m + '</div>';
    });

    var feedHTML = '';
    var rev = a.historial.slice().reverse();
    rev.forEach(function(h, i) {
        var fecha = h.fecha;
        var peso = fm(h.peso) + ' kg';
        var delta = '';
        var claseDelta = '';
        if (i < rev.length - 1) {
            var ant = rev[i + 1].peso;
            var dif = h.peso - ant;
            if (dif > 0) {
                delta = '+' + ((dif / ant) * 100).toFixed(1) + '% ↑';
                claseDelta = 'color:#22c55e';
            } else if (dif < 0) {
                delta = ((dif / ant) * 100).toFixed(1) + '% ↓';
                claseDelta = 'color:#ef4444';
            } else {
                delta = '0% -';
                claseDelta = 'color:var(--muted)';
            }
        } else {
            delta = 'Registro inicial';
            claseDelta = 'color:var(--accent)';
        }
        feedHTML += '<div class="sp-feed-item"><div class="sp-feed-header"><span class="sp-feed-title"><i class="fa-solid fa-weight-scale"></i> ' + peso + '</span><span class="sp-feed-date">' + fecha + '</span></div>';
        feedHTML += '<div class="sp-feed-body"><span style="font-weight:600;' + claseDelta + '">' + delta + '</span> · GMD: ' + gmd.toFixed(2) + ' kg/d</div></div>';
    });

    var d = getDiet(p, a.proposito, estadoActual);
    var dietHTML = '<div class="sp-card"><div class="sp-card-title"><i class="fa-solid fa-mortar-pestle"></i> DIETA BASE</div>';
    AL.forEach(function(k) {
        var val = d[k];
        var unit = (k === 'pasto' || k === 'salvado') ? ' kg' : ' g';
        var display = (k === 'pasto' || k === 'salvado') ? val.toFixed(1) : Math.round(val * 1000);
        var bl = (k === 'urea') && etapa.ureaBloqueada;
        dietHTML += '<div class="row"><span class="row-label"><i class="fa-solid ' + IC[k] + '"></i> ' + NM[k] + '</span>';
        dietHTML += '<span class="row-val" style="' + (bl ? 'color:#6b7280;text-decoration:line-through' : '') + '">' + (bl ? '0 (🔒)' : display + unit) + '</span></div>';
    });
    dietHTML += '</div>';

    var dietCustHTML = '<div class="sp-card"><div class="sp-card-title"><i class="fa-solid fa-wheat-awn"></i> PERSONALIZADOS <button class="btn btn-sm btn-purple" style="width:auto;padding:4px 8px;margin-left:auto;font-size:.6rem" onclick="showModalAsignarAlimento(' + id + ')">+ Agregar</button></div>';
    var asigs = DB.asignacionesAlimentos[id] || [];
    if (asigs.length > 0) {
        asigs.forEach(function(asig) {
            var item = DB.alimentosCustom.find(function(x) { return x.id === asig.alimentoId; });
            if (item) {
                var cons = p * item.dosisPorKg;
                var costo = cons * item.precioUnitario * (item.unidad === 'g' ? 0.001 : 1);
                var disp = item.unidad === 'g' ? cons.toFixed(0) + ' g' : cons.toFixed(2) + ' kg';
                dietCustHTML += '<div class="custom-item-row"><div style="display:flex;align-items:center;gap:8px"><i class="fa-solid ' + item.icono + '" style="color:var(--accent)"></i>';
                dietCustHTML += '<div><div style="font-size:.75rem;font-weight:600">' + item.nombre + '</div>';
                dietCustHTML += '<div style="font-size:.6rem;color:var(--muted)">Dosis: ' + disp + '/día · $' + fm(costo) + '/día</div></div></div>';
                dietCustHTML += '<button class="toggle-btn ' + (asig.activo ? 'active' : '') + '" onclick="toggleAlimentoCustom(' + id + ',\'' + asig.alimentoId + '\')"><i class="fa-solid fa-' + (asig.activo ? 'xmark' : 'check') + '"></i></button></div>';
            }
        });
    } else {
        dietCustHTML += '<div style="font-size:.7rem;color:var(--muted);text-align:center;padding:14px">No hay alimentos asignados.</div>';
    }
    dietCustHTML += '</div>';

    var reproHTML = '';
    if (a.proposito === 'leche') {
        reproHTML = '<div class="sp-card" style="border-left:4px solid ' + (rep ? rep.semaforo.color : '#6b7280') + '"><div class="sp-card-title"><i class="fa-solid fa-calendar-days"></i> CICLO REPRODUCTIVO</div>';
        reproHTML += '<div style="display:flex;align-items:center;margin-bottom:8px"><span class="traffic-light" style="background:' + ((rep ? rep.semaforo.color : '#6b7280')) + '"></span>';
        reproHTML += '<span style="font-size:.82rem;font-weight:600">' + ((rep ? rep.semaforo.txt : 'Sin registro')) + '</span></div>';
        reproHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-clock"></i> Días posparto</span><span class="row-val">' + ((rep ? rep.diasPP : '--')) + '</span></div>';
        reproHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-baby"></i> Próximo parto</span><span class="row-val">' + ((rep ? rep.fechaProxParto : '--')) + '</span></div>';
        reproHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-hourglass-half"></i> Días para parto</span><span class="row-val">' + ((rep ? rep.diasParaParto + 'd' : '--')) + '</span></div>';
        reproHTML += '<button class="btn btn-sm btn-purple mt8" onclick="showReproModal(' + id + ')"><i class="fa-solid fa-pen"></i> Registrar Evento</button></div>';
    }

    var projHTML = '<div class="sp-card"><div class="sp-card-title"><i class="fa-solid fa-chart-line"></i> PROYECCIÓN</div><div class="sp-projection">';
    projHTML += '<div class="sp-proj-box"><div class="sp-proj-d">30 DÍAS</div><div class="sp-proj-w">' + fm(proy30) + ' kg</div><div class="sp-proj-g" style="color:#22c55e">+$' + fm(proy30 * DB.precioKG - valA) + '</div></div>';
    projHTML += '<div class="sp-proj-box"><div class="sp-proj-d">60 DÍAS</div><div class="sp-proj-w">' + fm(proy60) + ' kg</div><div class="sp-proj-g" style="color:#22c55e">+$' + fm(proy60 * DB.precioKG - valA) + '</div></div>';
    projHTML += '<div class="sp-proj-box"><div class="sp-proj-d">90 DÍAS</div><div class="sp-proj-w">' + fm(proy90) + ' kg</div><div class="sp-proj-g" style="color:#22c55e">+$' + fm(proy90 * DB.precioKG - valA) + '</div></div></div></div>';

    var finHTML = '<div class="sp-card"><div class="sp-card-title"><i class="fa-solid fa-coins"></i> RENTABILIDAD</div>';
    finHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-receipt"></i> Alim. base/día</span><span class="row-val">$ ' + fm(cd) + '</span></div>';
    finHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-wheat-awn"></i> Alim. custom/día</span><span class="row-val" style="color:' + (cdC > 0 ? '#d4a017' : '#666') + '">$ ' + fm(cdC) + '</span></div>';
    finHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-syringe"></i> Sanidad/día</span><span class="row-val">$ ' + fm(csd) + '</span></div>';
    finHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-chart-pie"></i> Costo/kg</span><span class="row-val" style="color:' + (ckp < DB.precioKG ? '#22c55e' : '#ef4444') + '">$ ' + fm(ckp) + '</span></div>';
    finHTML += '<div class="row"><span class="row-label"><i class="fa-solid fa-sack-dollar"></i> Ganancia/mes</span><span class="row-val" style="color:' + (gananciaMensual >= 0 ? '#22c55e' : '#ef4444') + '">$ ' + fm(gananciaMensual) + '</span></div></div>';

    // Ocultar todas las vistas y mostrar perfil
    document.getElementById('v-inicio').classList.add('hidden');
    document.getElementById('v-lotes').classList.add('hidden');
    document.getElementById('v-animales').classList.add('hidden');
    document.getElementById('v-insumos').classList.add('hidden');
    document.getElementById('v-config').classList.add('hidden');
    document.getElementById('v-perfil').classList.remove('hidden');
    document.querySelector('header').classList.add('hidden');

    var faltaKg = etapa.max - p;
    var progPct = getProgresoEtapa(p, etapa);

    var html = '<div class="sp-wrapper"><div class="sp-banner"><button class="sp-back" onclick="closeProfile()"><i class="fa-solid fa-arrow-left"></i></button></div>';
    html += '<div class="sp-header"><div class="sp-avatar">' + etapa.icono + '</div>';
    html += '<div class="sp-name">' + a.nombre + '</div>';
    html += '<div class="sp-badges"><span class="sp-badge" style="background:' + etapa.color + '">' + etapa.nombre + '</span>';
    html += '<span class="sp-badge">' + getLoteName(a.loteId) + '</span>';
    html += '<span class="sp-badge">' + (a.proposito === 'carne' ? '🥩 CARNE' : '🥛 LECHE') + '</span></div>';
    html += '<div class="sp-meta">' + fm(p) + ' kg · ' + r.texto + ' · Último: ' + diasU + 'd · En sistema: ' + diasSistema + 'd</div></div>';

    html += '<div class="sp-stats">';
    html += '<div class="sp-stat"><div class="val">' + fm(p) + '</div><div class="lbl">Peso</div></div>';
    html += '<div class="sp-stat"><div class="val">$' + fm(valA) + '</div><div class="lbl">Valor</div></div>';
    html += '<div class="sp-stat"><div class="val">' + gmd.toFixed(2) + '</div><div class="lbl">GMD</div></div>';
    html += '<div class="sp-stat"><div class="val">$' + fm(ckp) + '</div><div class="lbl">Costo/kg</div></div></div>';

    html += '<div class="stage-progress-container"><div class="stage-progress-labels"><span>Actual</span><span>Siguiente: ' + etapa.siguiente + '</span></div>';
    html += '<div class="stage-progress-bar"><div class="stage-progress-fill" style="width:' + progPct + '%;background:' + etapa.color + '">';
    html += '<span class="stage-progress-text">' + (faltaKg <= 0 ? 'VENDIBLE' : fm(faltaKg) + ' kg faltan') + '</span></div></div></div>';

    html += '<div class="sp-scroll">' + alertHTML + feedHTML + dietHTML + dietCustHTML + reproHTML + projHTML + finHTML + '</div>';
    html += '<div class="sp-actions-bar">';
    html += '<button class="btn btn-gold" onclick="updateWeight(' + id + ')"><i class="fa-solid fa-gauge-high"></i> PESAJE</button>';
    html += '<button class="btn btn-purple" onclick="openAplicarProducto(' + id + ')"><i class="fa-solid fa-syringe"></i> SANIDAD</button>';
    html += '<button class="btn btn-danger" onclick="deleteAnimal(' + id + ')"><i class="fa-solid fa-trash-can"></i></button>';
    html += '</div></div>';

    document.getElementById('v-perfil').innerHTML = html;
}

// ==================== MODALES CRUD ====================
function showAddAnimalModal() {
    var loteOpts = '';
    DB.lotes.forEach(function(l) { loteOpts += '<option value="' + l.id + '">' + l.nombre + '</option>'; });
    var html = '<div style="font-weight:700;margin-bottom:14px;color:var(--accent);font-size:1.05rem"><i class="fa-solid fa-cow"></i> NUEVO ANIMAL</div>';
    html += '<div class="flex-col gap10">';
    html += '<input id="addN" type="text" placeholder="Nombre / Número">';
    html += '<input id="addW" type="number" placeholder="Peso Inicial (kg)" min="20" max="2000">';
    html += '<select id="addLote">' + loteOpts + '</select>';
    html += '<div class="grid"><select id="addProp"><option value="carne">🥩 CARNE</option><option value="leche">🥛 LECHE</option></select>';
    html += '<select id="addOrig" onchange="toggleCompraField()"><option value="nacimiento">🐄 Nacimiento</option><option value="comprado">💰 Comprado</option></select></div>';
    html += '<div id="addPriceWrap" class="hidden"><input id="addPrice" type="number" placeholder="Valor de compra ($)"></div>';
    html += '<button class="btn btn-gold mt12" onclick="guardarNuevoAnimal()"><i class="fa-solid fa-check"></i> REGISTRAR</button>';
    html += '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(html);
}

function toggleCompraField() {
    document.getElementById('addPriceWrap').classList.toggle('hidden', document.getElementById('addOrig').value !== 'comprado');
}

function guardarNuevoAnimal() {
    var n = document.getElementById('addN').value.trim();
    var w = parseFloat(document.getElementById('addW').value);
    var lote = document.getElementById('addLote').value;
    var p = document.getElementById('addProp').value;
    var o = document.getElementById('addOrig').value;
    var pc = parseFloat(document.getElementById('addPrice').value) || 0;

    if (!n || isNaN(w) || w < 20 || w > 2000) { showToast('⚠️ Verifica nombre y peso'); return; }
    if (o === 'comprado' && pc <= 0) { showToast('⚠️ Ingresa el valor de compra'); return; }

    var id = Date.now();
    DB.animales.push({
        id: id,
        nombre: n,
        historial: [{ fecha: new Date().toLocaleDateString(), peso: w }],
        proposito: p,
        origen: o,
        valorCompra: pc,
        fechaUltimoParto: null,
        estadoReproductivo: 'novilla',
        loteId: lote
    });
    save();
    document.querySelector('.modal-overlay').remove();
    showToast('✅ ' + n + ' registrado');
    goPage('animales');
}

function showReproModal(id) {
    var html = '<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-calendar-check"></i> REGISTRO REPRODUCTIVO</div>';
    html += '<div class="flex-col gap10">';
    html += '<select id="reTipo"><option value="parto">🐣 Parto</option><option value="insem">🐄 Inseminación</option><option value="secado">🛑 Secado</option><option value="venta">💰 Venta/Descarte</option></select>';
    html += '<input id="reFecha" type="date" value="' + new Date().toISOString().split('T')[0] + '">';
    html += '<button class="btn btn-green" onclick="guardarRepro(' + id + ')"><i class="fa-solid fa-check"></i> GUARDAR</button>';
    html += '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(html);
}

function guardarRepro(id) {
    var tipo = document.getElementById('reTipo').value;
    var fecha = document.getElementById('reFecha').value;
    if (!fecha) { showToast('⚠️ Selecciona fecha'); return; }
    var f = fecha.split('-').reverse().join('/');
    var a = DB.animales.find(function(x) { return x.id === id; });
    if (tipo === 'parto') { a.fechaUltimoParto = f; a.estadoReproductivo = 'parida'; }
    if (tipo === 'insem') { a.fechaUltimoParto = null; a.estadoReproductivo = 'novilla'; }
    if (tipo === 'secado') { a.estadoReproductivo = 'seca'; }
    if (tipo === 'venta') { a.estadoReproductivo = 'venta'; }
    save();
    document.querySelector('.modal-overlay').remove();
    showProfile(id);
    showToast('✅ Registrado');
}

function showModalAsignarAlimento(idAnimal) {
    var disp = DB.alimentosCustom;
    if (disp.length === 0) { showToast('⚠️ Crea alimentos en Insumos > Personalizar'); return; }
    var asigs = DB.asignacionesAlimentos[idAnimal] || [];
    var ids = asigs.map(function(a) { return a.alimentoId; });
    var opts = '';
    disp.forEach(function(i) {
        if (ids.indexOf(i.id) === -1) {
            opts += '<option value="' + i.id + '">' + i.nombre + ' (' + i.dosisPorKg + ' ' + i.unidad + '/kg) - Stock: ' + fm(i.stock) + ' ' + i.unidad + '</option>';
        }
    });
    if (opts === '') { showToast('✅ Todos asignados'); return; }
    var h = '<div style="font-weight:700;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-wheat-awn"></i> ASIGNAR ALIMENTO</div>';
    h += '<div class="flex-col gap10"><select id="selAlimentoCustom">' + opts + '</select>';
    h += '<input id="cantidadDiaria" type="number" step="any" placeholder="Cantidad diaria (kg)">';
    h += '<button class="btn btn-green mt8" onclick="asignarAlimentoConStock(' + idAnimal + ')"><i class="fa-solid fa-check"></i> ASIGNAR</button>';
    h += '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(h);
}

function asignarAlimentoConStock(id) {
    var s = document.getElementById('selAlimentoCustom');
    var cantidad = parseFloat(document.getElementById('cantidadDiaria').value);
    if (!s) return;
    if (isNaN(cantidad) || cantidad <= 0) { showToast('⚠️ Ingrese cantidad válida'); return; }
    var alimentoId = s.value;
    var alimento = DB.alimentosCustom.find(function(x) { return x.id === alimentoId; });
    if (!alimento) return;
    if (cantidad > alimento.stock) {
        showToast('⚠️ Stock insuficiente. Disponible: ' + alimento.stock.toFixed(2) + ' ' + alimento.unidad);
        return;
    }
    alimento.stock -= cantidad;
    if (!DB.asignacionesAlimentos[id]) DB.asignacionesAlimentos[id] = [];
    DB.asignacionesAlimentos[id].push({ alimentoId: alimentoId, cantidadDiaria: cantidad, activo: true });
    save();
    document.querySelector('.modal-overlay').remove();
    showToast('✅ Asignado: ' + cantidad.toFixed(2) + ' kg/día de ' + alimento.nombre);
    showProfile(id);
}

function toggleAlimentoCustom(id, aid) {
    if (!DB.asignacionesAlimentos[id]) return;
    var i = DB.asignacionesAlimentos[id].findIndex(function(a) { return a.alimentoId === aid; });
    if (i > -1) {
        if (DB.asignacionesAlimentos[id][i].activo) {
            if (confirm('¿Quitar este alimento?')) {
                DB.asignacionesAlimentos[id].splice(i, 1);
                save();
                showProfile(id);
            }
        } else {
            DB.asignacionesAlimentos[id][i].activo = true;
            save();
            showProfile(id);
        }
    }
}

function openAplicarProducto(animalId) {
    var a = DB.animales.find(function(x) { return x.id === animalId; });
    if (!a) return;
    var p = a.historial[a.historial.length - 1].peso;
    var prods = getAllSanidad();
    var opts = '';
    prods.forEach(function(pr) {
        opts += '<option value="' + pr.id + '">' + pr.nombre + (pr.esBase ? '' : '<span style="color:var(--accent)">★</span>') + ' (' + pr.diasEfecto + 'd efecto)</option>';
    });
    var h = '<div style="font-weight:700;margin-bottom:12px;color:var(--accent)">💉 APLICAR A ' + a.nombre + ' (' + fm(p) + ' kg)</div>';
    h += '<div class="flex-col gap10"><select id="aplProducto" onchange="calcDosisModal(' + p + ')">' + opts + '</select>';
    h += '<div id="dosisInfo" style="font-size:.7rem;color:var(--muted)"></div>';
    h += '<input id="aplML" type="number" placeholder="ml aplicados" step=".1">';
    h += '<button class="btn btn-gold mt8" onclick="aplicarProducto(' + animalId + ')"><i class="fa-solid fa-check"></i> CONFIRMAR</button>';
    h += '<button class="btn btn-gray" onclick="document.querySelector(\'.modal-overlay\').remove()">CANCELAR</button></div>';
    showModal(h);
    setTimeout(function() { calcDosisModal(p); }, 100);
}

function calcDosisModal(p) {
    var s = document.getElementById('aplProducto');
    var i = document.getElementById('dosisInfo');
    if (!s || !i) return;
    var pr = getAllSanidad().find(function(p) { return p.id === s.value; });
    if (pr) i.innerHTML = '📋 Dosis: <b>' + (p / pr.dosis).toFixed(1) + ' ml</b> (Base: 1 ml c/' + pr.dosis + ' kg)';
}

function aplicarProducto(id) {
    var s = document.getElementById('aplProducto');
    var m = document.getElementById('aplML');
    if (!s || !m) return;
    var pid = s.value;
    var ml = parseFloat(m.value);
    if (isNaN(ml) || ml <= 0) { alert('⚠️ Ingrese ml válidos'); return; }
    var pr = getAllSanidad().find(function(p) { return p.id === pid; });
    if (!pr) return;
    var cu = pr.precioML || (DB.preciosSanidad[pid] || 0);
    var ct = ml * cu;
    DB.aplicaciones.push({
        animalId: id,
        productoId: pid,
        producto: pr.nombre,
        ml: ml,
        costo: ct,
        fecha: new Date().toLocaleDateString()
    });
    DB.stockSanidad[pid] = Math.max(0, (DB.stockSanidad[pid] || 0) - ml);
    save();
    document.querySelector('.modal-overlay').remove();
    showToast('✅ Aplicado: $' + fm(ct));
    showProfile(id);
}

// ==================== PERSONALIZADOS CRUD ====================
function addAlimentoCustom(d) {
    var id = 'ac_' + Date.now();
    DB.alimentosCustom.push({
        id: id,
        nombre: d.nombre.trim(),
        icono: d.icono,
        dosisPorKg: parseFloat(d.dosisPorKg),
        unidad: d.unidad,
        precioUnitario: d.cantidadTotal > 0 ? d.precioTotal / d.cantidadTotal : 0,
        stock: d.cantidadTotal
    });
    DB.precios[id] = d.cantidadTotal > 0 ? d.precioTotal / d.cantidadTotal : 0;
    DB.stock[id] = d.cantidadTotal;
    save();
}

function deleteAlimentoCustom(id) {
    if (!confirm('¿Eliminar este alimento?')) return;
    DB.alimentosCustom = DB.alimentosCustom.filter(function(a) { return a.id !== id; });
    delete DB.precios[id];
    delete DB.stock[id];
    Object.keys(DB.asignacionesAlimentos).forEach(function(aId) {
        if (DB.asignacionesAlimentos[aId]) {
            DB.asignacionesAlimentos[aId] = DB.asignacionesAlimentos[aId].filter(function(x) { return x.alimentoId !== id; });
        }
    });
    save();
}

function addSanidadCustom(d) {
    var id = 'sc_' + Date.now();
    DB.sanidadCustom.push({
        id: id,
        nombre: d.nombre.trim(),
        icono: d.icono,
        color: d.color || '#a78bfa',
        dosisPorKg: parseFloat(d.dosisPorKg),
        diasEfecto: parseInt(d.diasEfecto) || 0,
        retiro: parseInt(d.retiro) || 0,
        precioML: d.mlTotales > 0 ? d.precioTotal / d.mlTotales : 0,
        stockML: d.mlTotales
    });
    DB.preciosSanidad[id] = d.mlTotales > 0 ? d.precioTotal / d.mlTotales : 0;
    DB.stockSanidad[id] = d.mlTotales;
    save();
}

function deleteSanidadCustom(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    DB.sanidadCustom = DB.sanidadCustom.filter(function(a) { return a.id !== id; });
    delete DB.preciosSanidad[id];
    delete DB.stockSanidad[id];
    save();
}

function showModalGestionAlimentos() {
    var h = '<div style="max-height:60vh;overflow-y:auto;padding-bottom:20px">' + renderFormAlimentoCustom() + '</div>';
    h += '<button class="btn btn-gray mt12" onclick="document.querySelector(\'.modal-overlay\').remove()">CERRAR</button>';
    showModal(h);
    setTimeout(function() {
        ['acPrecioTotal', 'acCantidadTotal', 'acDosis', 'acUnidad'].forEach(function(id) {
            var e = document.getElementById(id);
            if (e) e.oninput = calcPreviewAl;
        });
    }, 50);
}

function renderFormAlimentoCustom() {
    var h = '<div class="card"><div style="font-weight:700;margin-bottom:10px;color:var(--accent)"><i class="fa-solid fa-plus"></i> NUEVO ALIMENTO</div>';
    h += '<div class="flex-col gap8">';
    h += '<input id="acNombre" type="text" placeholder="Nombre">';
    h += '<div class="grid"><select id="acIcono"><option value="fa-wheat-awn">🌾 Grano</option><option value="fa-seedling">🌱 Forraje</option><option value="fa-cubes">🧊 Suplemento</option><option value="fa-flask">🧪 Aditivo</option></select>';
    h += '<select id="acUnidad"><option value="kg">Kilogramos (kg)</option><option value="g">Gramos (g)</option></select></div>';
    h += '<div style="font-size:.7rem;color:var(--muted);margin-top:4px">💡 Dosis por kg de peso del animal</div>';
    h += '<div class="grid"><input id="acDosis" type="number" step="0.001" placeholder="Ej: 0.02">';
    h += '<input id="acDosisHelp" type="text" readonly placeholder="≈ 6000 g (300kg)" style="background:rgba(255,255,255,.03);color:var(--muted);font-size:.7rem"></div>';
    h += '<div class="grid"><input id="acPrecioTotal" type="number" step="1" placeholder="Precio Total ($)">';
    h += '<input id="acCantidadTotal" type="number" step="0.1" placeholder="Cantidad Recibida"></div>';
    h += '<div id="acPrecioUnitario" style="font-size:.7rem;color:var(--accent);text-align:center;font-weight:600"></div>';
    h += '<button class="btn btn-green" onclick="guardarAlimentoCustom()"><i class="fa-solid fa-check"></i> GUARDAR</button></div></div>';

    DB.alimentosCustom.forEach(function(a) {
        h += '<div class="custom-item-row">';
        h += '<i class="fa-solid ' + a.icono + '"></i>';
        h += '<div style="flex:1;margin-left:8px">';
        h += '<div style="font-size:.75rem">' + a.nombre + '</div>';
        h += '<div style="font-size:.6rem;color:var(--muted)">Stock: ' + fm(DB.stock[a.id] || 0) + ' ' + a.unidad + '</div></div>';
        h += '<button class="btn btn-sm btn-danger" style="width:30px;padding:0" onclick="deleteAlimentoCustom(\'' + a.id + '\');showModalGestionAlimentos()"><i class="fa-solid fa-trash"></i></button></div>';
    });
    return h;
}

function guardarAlimentoCustom() {
    var n = document.getElementById('acNombre').value.trim();
    var ic = document.getElementById('acIcono').value;
    var u = document.getElementById('acUnidad').value;
    var d = parseFloat(document.getElementById('acDosis').value);
    var pt = parseFloat(document.getElementById('acPrecioTotal').value);
    var ct = parseFloat(document.getElementById('acCantidadTotal').value);
    if (!n || isNaN(d) || isNaN(pt) || isNaN(ct)) { showToast('⚠️ Completa todo'); return; }
    addAlimentoCustom({ nombre: n, icono: ic, unidad: u, dosisPorKg: d, precioTotal: pt, cantidadTotal: ct });
    showToast('✅ Agregado');
    showModalGestionAlimentos();
}

function calcPreviewAl() {
    var pt = parseFloat(document.getElementById('acPrecioTotal')?.value) || 0;
    var ct = parseFloat(document.getElementById('acCantidadTotal')?.value) || 0;
    var d = parseFloat(document.getElementById('acDosis')?.value) || 0;
    var u = document.getElementById('acUnidad')?.value || 'kg';
    document.getElementById('acPrecioUnitario').innerHTML = (pt > 0 && ct > 0) ? '💰 Precio: $' + fm(pt / ct) + '/' + u : '';
    if (d > 0) {
        var e = 300 * d;
        document.getElementById('acDosisHelp').value = '≈ ' + ((u === 'g' ? e.toFixed(0) + ' g' : e.toFixed(2) + ' kg') + ' (300kg)');
    }
}

function showModalGestionSanidad() {
    var h = '<div style="max-height:60vh;overflow-y:auto;padding-bottom:20px">' + renderFormSanidadCustom() + '</div>';
    h += '<button class="btn btn-gray mt12" onclick="document.querySelector(\'.modal-overlay\').remove()">CERRAR</button>';
    showModal(h);
    setTimeout(function() {
        ['scPrecioTotal', 'scMlTotal', 'scDosis'].forEach(function(id) {
            var e = document.getElementById(id);
            if (e) e.oninput = calcPreviewSan;
        });
    }, 50);
}

function renderFormSanidadCustom() {
    var h = '<div class="card"><div style="font-weight:700;margin-bottom:10px;color:var(--accent)"><i class="fa-solid fa-plus"></i> NUEVO PRODUCTO</div>';
    h += '<div class="flex-col gap8">';
    h += '<input id="scNombre" type="text" placeholder="Nombre">';
    h += '<div class="grid"><select id="scIcono"><option value="fa-syringe">💉 Inyectable</option><option value="fa-pills">💊 Oral</option><option value="fa-flask">🧪 Líquido</option></select>';
    h += '<input id="scColor" type="color" value="#a78bfa" style="width:100%;height:40px;border-radius:8px;border:none;background:transparent"></div>';
    h += '<input id="scDosis" type="number" step="0.01" placeholder="Dosis (ml por kg)">';
    h += '<div class="grid"><input id="scEfecto" type="number" placeholder="Días efecto">';
    h += '<input id="scRetiro" type="number" placeholder="Días retiro"></div>';
    h += '<div class="grid"><input id="scPrecioTotal" type="number" placeholder="Precio Total ($)">';
    h += '<input id="scMlTotal" type="number" placeholder="Mililitros Totales"></div>';
    h += '<div id="scPrecioML" style="font-size:.7rem;color:var(--accent);text-align:center;font-weight:600"></div>';
    h += '<button class="btn btn-green" onclick="guardarSanidadCustom()"><i class="fa-solid fa-check"></i> GUARDAR</button></div></div>';

    DB.sanidadCustom.forEach(function(p) {
        h += '<div class="custom-item-row">';
        h += '<i class="fa-solid ' + p.icono + '" style="color:' + p.color + '"></i>';
        h += '<div style="flex:1;margin-left:8px"><div style="font-size:.75rem">' + p.nombre + '</div>';
        h += '<div style="font-size:.6rem;color:var(--muted)">$' + fm(p.precioML) + '/ml · ' + p.dosisPorKg + ' ml/kg</div></div>';
        h += '<button class="btn btn-sm btn-danger" style="width:30px;padding:0" onclick="deleteSanidadCustom(\'' + p.id + '\');showModalGestionSanidad()"><i class="fa-solid fa-trash"></i></button></div>';
    });
    return h;
}

function guardarSanidadCustom() {
    var n = document.getElementById('scNombre').value.trim();
    var ic = document.getElementById('scIcono').value;
    var co = document.getElementById('scColor').value;
    var d = parseFloat(document.getElementById('scDosis').value);
    var ef = parseInt(document.getElementById('scEfecto').value) || 0;
    var ret = parseInt(document.getElementById('scRetiro').value) || 0;
    var pt = parseFloat(document.getElementById('scPrecioTotal').value);
    var ml = parseFloat(document.getElementById('scMlTotal').value);
    if (!n || isNaN(d) || isNaN(pt) || isNaN(ml)) { showToast('⚠️ Completa todo'); return; }
    addSanidadCustom({ nombre: n, icono: ic, color: co, dosisPorKg: d, diasEfecto: ef, retiro: ret, precioTotal: pt, mlTotales: ml });
    showToast('✅ Agregado');
    showModalGestionSanidad();
}

function calcPreviewSan() {
    var pt = parseFloat(document.getElementById('scPrecioTotal')?.value) || 0;
    var ml = parseFloat(document.getElementById('scMlTotal')?.value) || 0;
    if (pt > 0 && ml > 0) document.getElementById('scPrecioML').innerHTML = '💰 $' + fm(pt / ml) + ' por ml';
}

// ==================== NAVEGACIÓN ====================
document.querySelectorAll('.nav-item').forEach(function(n) {
    n.addEventListener('click', function() { goPage(n.dataset.page); });
});

function goPage(p) {
    document.querySelector('header').classList.remove('hidden');
    var pages = ['v-inicio', 'v-lotes', 'v-animales', 'v-insumos', 'v-config', 'v-perfil'];
    pages.forEach(function(id) { document.getElementById(id).classList.add('hidden'); });
    document.getElementById('v-' + p).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.querySelector('.nav-item[data-page="' + p + '"]')?.classList.add('active');

    if (p === 'inicio') renderInicio();
    if (p === 'lotes') renderLotes();
    if (p === 'animales') renderAnimales();
    if (p === 'insumos') renderInsumos();
    if (p === 'config') renderConfig();

    window.scrollTo(0, 0);
}

function updateWeight(id) {
    var p = prompt('⚖️ Nuevo pesaje (kg):');
    if (!p) return;
    p = parseFloat(p);
    if (isNaN(p) || p < 20 || p > 2000) { alert('⚠️ Peso entre 20 y 2000 kg'); return; }
    var a = DB.animales.find(function(x) { return x.id === id; });
    if (!a) return;
    a.historial.push({ fecha: new Date().toLocaleDateString(), peso: p });
    save();
    showProfile(id);
}

function deleteAnimal(id) {
    if (confirm('⚠️ ¿Eliminar este animal definitivamente?')) {
        DB.animales = DB.animales.filter(function(x) { return x.id !== id; });
        delete DB.asignacionesAlimentos[id];
        save();
        closeProfile();
    }
}

function closeProfile() {
    document.getElementById('v-perfil').classList.add('hidden');
    document.querySelector('header').classList.remove('hidden');
    goPage('animales');
}

// ==================== INICIALIZACIÓN ====================
// La página principal debe ser INICIO
goPage('inicio');
</script>
</body>
</html>
