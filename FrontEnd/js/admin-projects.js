var productos = [];
var campaniaActual = null;
var filtroActual = '2';
var accionPendiente = null;

document.addEventListener('DOMContentLoaded', function() {
    verificarAdmin();
    configurarFiltros();
    cargarProyectos();
});

function verificarAdmin() {
    var token = localStorage.getItem('token');
    var user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role_id !== 1) {
        window.location.href = './index-logged.html';
    }
}

function configurarFiltros() {
    var botones = document.querySelectorAll('.filtro-btn');
    for (var i = 0; i < botones.length; i++) {
        botones[i].addEventListener('click', function() {
            for (var j = 0; j < botones.length; j++) {
                botones[j].classList.remove('activo');
            }
            this.classList.add('activo');
            filtroActual = this.getAttribute('data-filtro');
            cargarProyectos();
        });
    }
}

function cargarProyectos() {
    var token = localStorage.getItem('token');

    var url = API_URL + '/admin/campaigns';
    if (filtroActual && filtroActual !== 'todos') {
        url = url + '?workflow_state_id=' + filtroActual;
    }

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Error al cargar');
        }
        return response.json();
    })
    .then(function(data) {
        productos = data;
        mostrarProyectos();
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar los productos', 'error');
    });
}

function mostrarProyectos() {
    var tbody = document.getElementById('tablaCampanias');
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="sin-resultados">No hay productos</td></tr>';
        return;
    }

    for (var i = 0; i < productos.length; i++) {
        var p = productos[i];
        var tr = document.createElement('tr');

        var estadoTexto = obtenerEstadoTexto(p.workflow_state_id);
        var estadoClase = obtenerEstadoClase(p.workflow_state_id);
        var fecha = p.created_at ? p.created_at.substring(0, 10) : 'N/A';

        tr.innerHTML = '' +
            '<td>' + p.id + '</td>' +
            '<td>' + p.tittle + '</td>' +
            '<td>' + (p.user_name || 'Sin nombre') + '</td>' +
            '<td>S/. ' + p.goal_amount + '</td>' +
            '<td><span class="estado ' + estadoClase + '">' + estadoTexto + '</span></td>' +
            '<td>' + fecha + '</td>' +
            '<td class="acciones">' + generarBotones(p) + '</td>';

        tbody.appendChild(tr);
    }
}

function obtenerEstadoTexto(estado) {
    if (estado === 1) return 'Borrador';
    if (estado === 2) return 'En Revisión';
    if (estado === 3) return 'Observado';
    if (estado === 4) return 'Rechazado';
    if (estado === 5) return 'Publicado';
    return 'Desconocido';
}

function obtenerEstadoClase(estado) {
    if (estado === 1) return 'estado-borrador';
    if (estado === 2) return 'estado-revision';
    if (estado === 3) return 'estado-observado';
    if (estado === 4) return 'estado-rechazado';
    if (estado === 5) return 'estado-aprobado';
    return '';
}

function generarBotones(producto) {
    var botones = '';

    botones = botones + '<button class="btn btn-ver" onclick="verDetalle(' + producto.id + ')">Ver</button>';

    if (producto.workflow_state_id === 2) {
        botones = botones + '<button class="btn btn-aprobar" onclick="aprobar(' + producto.id + ')">Aprobar</button>';
        botones = botones + '<button class="btn btn-observar" onclick="abrirFormularioObservacion(' + producto.id + ', \'observar\')">Observar</button>';
        botones = botones + '<button class="btn btn-rechazar" onclick="rechazarDirecto(' + producto.id + ')">Rechazar</button>';
    }

    if (producto.workflow_state_id === 3) {
        botones = botones + '<button class="btn btn-aprobar" onclick="aprobar(' + producto.id + ')">Aprobar</button>';
        botones = botones + '<button class="btn btn-rechazar" onclick="rechazarDirecto(' + producto.id + ')">Rechazar</button>';
    }

    return botones;
}

function verDetalle(id) {
    window.location.href = './admin-campaign-detail.html?id=' + id;
}

function mostrarDetalle(campania) {
    var estadoTexto = obtenerEstadoTexto(campania.workflow_state_id);
    var estadoClase = obtenerEstadoClase(campania.workflow_state_id);

    var html = '' +
        '<h2>' + campania.name + '</h2>' +
        (campania.image_url ? '<img src="' + campania.image_url + '" class="detalle-imagen" alt="Imagen">' : '') +
        '<div class="detalle-info">' +
            '<div class="detalle-item"><label>Categoría</label><span>' + (campania.category_name || 'N/A') + '</span></div>' +
            '<div class="detalle-item"><label>Meta</label><span>S/. ' + campania.goal_amount + '</span></div>' +
            '<div class="detalle-item"><label>Fecha Límite</label><span>' + (campania.end_date || 'N/A') + '</span></div>' +
            '<div class="detalle-item"><label>Estado</label><span class="estado ' + estadoClase + '">' + estadoTexto + '</span></div>' +
        '</div>' +
        '<div class="detalle-descripcion">' +
            '<h3>Descripción</h3>' +
            '<p>' + (campania.description || 'Sin descripción') + '</p>' +
        '</div>';

    if (campania.workflow_state_id === 2 || campania.workflow_state_id === 3) {
        html += '<div class="detalle-acciones">';
        html += '<button class="btn btn-aprobar" onclick="aprobar(' + campania.id + ')">Aprobar</button>';
        if (campania.workflow_state_id === 2) {
            html += '<button class="btn btn-observar" onclick="abrirFormularioObservacion(' + campania.id + ', \'observar\')">Observar</button>';
        }
        html += '<button class="btn btn-rechazar" onclick="rechazarDirecto(' + campania.id + ')">Rechazar</button>';
        html += '</div>';
    }

    document.getElementById('detalleCampania').innerHTML = html;
}

function volverALista() {
    document.getElementById('vistaDetalle').classList.add('oculto');
    document.getElementById('vistaLista').classList.remove('oculto');
    document.getElementById('formularioObservacion').classList.add('oculto');
    campaniaActual = null;
    cargarProyectos();
}

function aprobar(id) {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + id + '/approve', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        mostrarMensaje('Producto aprobado correctamente', 'exito');
        if (campaniaActual) {
            volverALista();
        } else {
            cargarProyectos();
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al aprobar el producto', 'error');
    });
}

function rechazarDirecto(id) {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + id + '/reject', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        mostrarMensaje('Producto rechazado correctamente', 'exito');
        if (campaniaActual) {
            volverALista();
        } else {
            cargarProyectos();
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al rechazar el producto', 'error');
    });
}

function abrirFormularioObservacion(id, tipo) {
    campaniaActual = { id: id };
    accionPendiente = tipo;

    document.getElementById('textoObservacion').value = '';

    if (tipo === 'observar') {
        document.getElementById('tituloObservacion').textContent = 'Agregar Observación';
    } else {
        document.getElementById('tituloObservacion').textContent = 'Motivo de Rechazo';
    }

    document.getElementById('btnConfirmarAccion').onclick = confirmarAccion;
    document.getElementById('formularioObservacion').classList.remove('oculto');

    if (!document.getElementById('vistaDetalle').classList.contains('oculto') === false) {
        document.getElementById('vistaLista').classList.add('oculto');
        document.getElementById('vistaDetalle').classList.remove('oculto');
        document.getElementById('detalleCampania').innerHTML = '<p>Cargando...</p>';
    }
}

function cancelarObservacion() {
    document.getElementById('formularioObservacion').classList.add('oculto');
    accionPendiente = null;
}

function confirmarAccion() {
    var texto = document.getElementById('textoObservacion').value;

    if (!texto || texto.trim() === '') {
        mostrarMensaje('Debes escribir un motivo', 'error');
        return;
    }

    var token = localStorage.getItem('token');
    var url = '';
    var body = {};

    if (accionPendiente === 'observar') {
        url = API_URL + '/admin/campaigns/' + campaniaActual.id + '/observe';
        body = { observation_text: texto };
    } else {
        url = API_URL + '/admin/campaigns/' + campaniaActual.id + '/reject';
        body = { observation_text: texto };
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        var msg = accionPendiente === 'observar' ? 'Observación enviada' : 'Producto rechazado';
        mostrarMensaje(msg, 'exito');
        cancelarObservacion();
        volverALista();
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al procesar la acción', 'error');
    });
}

function verProyecto(id) {
    window.open('./campaign-detail-logged.html?id=' + id, '_blank');
}

function mostrarMensaje(texto, tipo) {
    var div = document.getElementById('mensaje');
    div.textContent = texto;
    div.className = 'mensaje mensaje-' + tipo;
    div.classList.remove('hidden');

    setTimeout(function() {
        div.classList.add('hidden');
    }, 3000);
}
