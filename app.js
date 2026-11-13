// ═══════════════════════════════════════════════════════════════
// AMAUTA v1.0 · El Origen (Frontend)
// Se comunica con /api/proxy que hace el puente a Google Apps Script
// ═══════════════════════════════════════════════════════════════

const API_ENDPOINT = '/api/proxy';

let datosRegistro = {};
let treeCardCounter = 0;

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ─── UTILIDADES ───────────────────────────────────────────────────

function showStep(stepId) {
    $$('.step').forEach(s => s.classList.remove('active'));
    $(stepId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setStatus(id, msg, tipo = '') {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'status-msg' + (tipo ? ' ' + tipo : '');
}

async function llamarAPI(payload) {
    try {
        const res = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data;
    } catch (err) {
        return { ok: false, mensaje: 'Error de red: ' + err.message };
    }
}

// ─── PASO 1: SOLICITAR PIN ────────────────────────────────────────

async function solicitarPin() {
    datosRegistro = {
        nombre: $('reg-nombre').value.trim(),
        telefono: $('reg-telefono').value.trim(),
        email: $('reg-email').value.trim()
    };

    if (!datosRegistro.nombre || !datosRegistro.telefono || !datosRegistro.email) {
        setStatus('status-registro', 'Por favor, llena todos los campos.', 'err');
        return;
    }
    if (datosRegistro.telefono.replace(/\D/g, '').length < 10) {
        setStatus('status-registro', 'El teléfono debe tener al menos 10 dígitos.', 'err');
        return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datosRegistro.email)) {
        setStatus('status-registro', 'El correo no es válido.', 'err');
        return;
    }

    const btn = $('btnSolicitarPin');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    setStatus('status-registro', '');

    const res = await llamarAPI({
        accion: 'amautaSolicitarPin',
        nombre: datosRegistro.nombre,
        telefono: datosRegistro.telefono,
        email: datosRegistro.email
    });

    btn.disabled = false;
    btn.textContent = 'Comenzar el Viaje';

    if (res.ok) {
        setStatus('status-registro', '✓ PIN enviado. Revisa tu correo.', 'ok');
        setTimeout(() => showStep('step-pin'), 800);
    } else {
        setStatus('status-registro', '✗ ' + (res.mensaje || 'Error desconocido'), 'err');
    }
}

// ─── PASO 2: VALIDAR PIN ──────────────────────────────────────────

async function validarPin() {
    const pin = $('pin-input').value.trim();
    if (pin.length !== 4) {
        setStatus('status-pin', 'El PIN debe tener 4 dígitos.', 'err');
        return;
    }

    const btn = $('btnValidarPin');
    btn.disabled = true;
    btn.textContent = 'Validando...';
    setStatus('status-pin', '');

    const res = await llamarAPI({
        accion: 'amautaValidarPin',
        email: datosRegistro.email,
        pin: pin
    });

    btn.disabled = false;
    btn.textContent = 'Validar Código';

    if (res.ok) {
        setStatus('status-pin', '✓ Verificado. Bienvenido a Amauta.', 'ok');
        setTimeout(() => {
            showStep('step-formulario');
            if ($$('.tree-card').length === 0) addTreeCard();
        }, 600);
    } else {
        setStatus('status-pin', '✗ ' + (res.mensaje || 'PIN incorrecto'), 'err');
    }
}

// ─── LÓGICA DEL FORMULARIO ────────────────────────────────────────

function toggleOrigen() {
    const tipo = $('m1-origen-gral').value;
    $('div-origen-ciudad').style.display = tipo === 'Ciudad' ? 'block' : 'none';
    $('div-origen-campo').style.display = tipo === 'Campo' ? 'block' : 'none';
}

// Expansión de checkboxes: al marcar, aparece textarea debajo
document.addEventListener('change', (e) => {
    const cb = e.target;
    if (cb.type === 'checkbox' && cb.name === 'm2-hitos') {
        const expBox = cb.closest('.check-card').nextElementSibling;
        if (expBox && expBox.classList.contains('expansion-box')) {
            if (cb.checked) {
                expBox.classList.add('active');
            } else {
                expBox.classList.remove('active');
                const ta = expBox.querySelector('textarea');
                if (ta) ta.value = '';
            }
        }
    }
});

function addTreeCard() {
    treeCardCounter++;
    const container = $('arbol-container');
    const card = document.createElement('div');
    card.className = 'tree-card';
    card.id = 'tree-card-' + treeCardCounter;
    card.innerHTML = `
        <button type="button" class="btn-remove" data-remove="${treeCardCounter}">×</button>
        <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-size: 0.9rem;">Lugar / Etapa</label>
            <input type="text" class="tree-lugar" placeholder="Ej: San Fernando de Apure (1998)" style="padding: 10px;">
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-size: 0.9rem;">Tipo de Experiencia</label>
            <select class="tree-tipo" style="padding: 10px;">
                <option value="Migración">Migración / Mudanza</option>
                <option value="Trabajo">Trabajo / Empleo</option>
                <option value="Crisis">Crisis / Superación</option>
                <option value="Logro">Logro / Alegría</option>
                <option value="Lucha Social">Lucha Social / Comunidad</option>
            </select>
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
            <label style="font-size: 0.9rem;">¿Qué pasó? (El Hecho)</label>
            <textarea class="tree-desc" rows="2" placeholder="Describe los hechos, lugares y personas..." style="padding: 10px;"></textarea>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.9rem;">¿Qué aprendiste? (La Emoción)</label>
            <textarea class="tree-aprendizaje" rows="2" placeholder="¿Cómo te sentiste? ¿Qué te dejó esta experiencia?" style="padding: 10px;"></textarea>
        </div>
    `;
    container.appendChild(card);
}

document.addEventListener('click', (e) => {
    if (e.target.matches('[data-remove]')) {
        const id = e.target.getAttribute('data-remove');
        const card = $('tree-card-' + id);
        if (card) card.remove();
    }
});

function getCheckedValues(name) {
    return $$(`input[name="${name}"]:checked`).map(cb => cb.value);
}

function getExpansionValues(name) {
    const result = [];
    $$(`input[name="${name}"]:checked`).forEach(cb => {
        const expBox = cb.closest('.check-card').nextElementSibling;
        let detalle = '';
        if (expBox && expBox.classList.contains('expansion-box')) {
            const ta = expBox.querySelector('textarea');
            if (ta) detalle = ta.value.trim();
        }
        result.push({ seleccion: cb.value, detalle: detalle });
    });
    return result;
}

// ─── PASO 3: GENERAR CON IA ───────────────────────────────────────

async function generarAutobiografia() {
    const origenGeneral = $('m1-origen-gral').value;
    let origenEspecifico = '';
    if (origenGeneral === 'Ciudad') origenEspecifico = $('m1-origen-ciudad').value;
    else if (origenGeneral === 'Campo') origenEspecifico = $('m1-origen-campo').value;

    const arbolVida = [];
    $$('.tree-card').forEach(card => {
        const lugar = card.querySelector('.tree-lugar').value.trim();
        const tipo = card.querySelector('.tree-tipo').value;
        const desc = card.querySelector('.tree-desc').value.trim();
        const aprendizaje = card.querySelector('.tree-aprendizaje').value.trim();
        if (lugar || desc) {
            arbolVida.push({ lugar, tipo, descripcion: desc, aprendizaje });
        }
    });

    const datosMaestros = {
        registro: datosRegistro,
        momento1: {
            edad: $('m1-edad').value,
            origenGeneral: origenGeneral,
            origenEspecifico: origenEspecifico,
            familia: $('m1-familia').value
        },
        momento2: {
            hitos: getExpansionValues('m2-hitos'),
            arbolVida: arbolVida
        },
        momento3: {
            valores: getCheckedValues('m3-valores'),
            referentes: $('m3-referentes').value
        },
        momento4: {
            motivacion: getCheckedValues('m4-motivacion'),
            lineaInvestigacion: $('m4-linea').value,
            tituloAspira: $('m4-titulo').value,
            portafolio: $('m4-portafolio').value,
            vozLibre: $('m4-voz').value.trim()
        }
    };

    if (!datosMaestros.momento1.edad || !datosMaestros.momento1.origenGeneral) {
        setStatus('status-generar', 'Por favor completa al menos tu edad y origen en el Momento I.', 'err');
        return;
    }

    const btn = $('btnGenerar');
    const loader = $('loader');
    btn.style.display = 'none';
    loader.style.display = 'block';
    setStatus('status-generar', 'Amauta está tejiendo tu historia...');

    const res = await llamarAPI({
        accion: 'amautaGenerar',
        datos: JSON.stringify(datosMaestros)
    });

    loader.style.display = 'none';

    if (res.ok && res.texto) {
        $('texto-final').textContent = res.texto;
        $('texto-final').setAttribute('data-json', JSON.stringify(datosMaestros));
        showStep('step-resultado');
    } else {
        btn.style.display = 'block';
        setStatus('status-generar', '✗ ' + (res.mensaje || 'Error al generar el texto.'), 'err');
    }
}

// ─── PASO 4: GUARDAR ──────────────────────────────────────────────

async function guardarAutobiografia() {
    const btn = $('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const texto = $('texto-final').textContent;
    const datosJSON = $('texto-final').getAttribute('data-json');

    const res = await llamarAPI({
        accion: 'amautaGuardar',
        email: datosRegistro.email,
        datos: datosJSON,
        texto: texto
    });

    if (res.ok) {
        btn.textContent = '✓ Guardado con Éxito';
        btn.style.background = '#27ae60';
        setStatus('status-guardar', '✓ Tu autobiografía ha sido guardada en el Archivo Histórico de Amauta.', 'ok');
    } else {
        btn.disabled = false;
        btn.textContent = '💾 Guardar en el Archivo Histórico';
        setStatus('status-guardar', '✗ ' + (res.mensaje || 'Error al guardar'), 'err');
    }
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    $('btnSolicitarPin').addEventListener('click', solicitarPin);
    $('btnValidarPin').addEventListener('click', validarPin);
    $('btnGenerar').addEventListener('click', generarAutobiografia);
    $('btnGuardar').addEventListener('click', guardarAutobiografia);
    $('btnAddTree').addEventListener('click', addTreeCard);
    $('m1-origen-gral').addEventListener('change', toggleOrigen);
    $('btnReiniciar').addEventListener('click', () => location.reload());

    // Enter en PIN = validar
    $('pin-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') validarPin();
    });
});