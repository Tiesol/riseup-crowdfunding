var campaniaId = null;
var campaniaData = null;

document.addEventListener('DOMContentLoaded', function() {
    verificarAdmin();
    obtenerIdCampania();
    cargarDatos();
});

function verificarAdmin() {
    var token = localStorage.getItem('token');
    var user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role_id !== 1) {
        window.location.href = './index-logged.html';
    }
}

function obtenerIdCampania() {
    var params = new URLSearchParams(window.location.search);
    campaniaId = params.get('id');

    if (!campaniaId) {
        window.location.href = './admin-projects.html';
    }
}

function cargarDatos() {
    cargarInfoCampania();
    cargarRequerimientos();
    cargarObservaciones();
}

function cargarInfoCampania() {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + campaniaId, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        campaniaData = data;
        mostrarInfoCampania(data);
        mostrarBotonesAccion(data);
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar el producto', 'error');
    });
}

function mostrarInfoCampania(campania) {
    var estadoTexto = obtenerEstadoTexto(campania.workflow_state_id);
    var estadoClase = obtenerEstadoClase(campania.workflow_state_id);

    var html = '' +
        '<h1>' + (campania.tittle || campania.name || 'Sin título') + '</h1>' +
        (campania.main_image_url ? '<img src="' + campania.main_image_url + '" class="detalle-imagen" alt="Imagen">' : '') +
        '<div class="detalle-info">' +
            '<div class="detalle-item"><label>Categoría</label><span>' + (campania.category_name || 'N/A') + '</span></div>' +
            '<div class="detalle-item"><label>Meta</label><span>S/. ' + campania.goal_amount + '</span></div>' +
            '<div class="detalle-item"><label>Vendido</label><span>S/. ' + campania.current_amount + '</span></div>' +
            '<div class="detalle-item"><label>Fecha Límite</label><span>' + (campania.expiration_date || 'N/A') + '</span></div>' +
            '<div class="detalle-item"><label>Estado</label><span class="estado ' + estadoClase + '">' + estadoTexto + '</span></div>' +
        '</div>' +
        '<div class="detalle-descripcion">' +
            '<h3>Descripción</h3>' +
            '<p>' + (campania.description || 'Sin descripción') + '</p>' +
        '</div>';

    document.getElementById('infoCampania').innerHTML = html;
}

function mostrarBotonesAccion(campania) {
    var html = '';

    if (campania.workflow_state_id === 2) {
        html += '<button class="btn btn-aprobar" onclick="aprobar()">Aprobar</button>';
        html += '<button class="btn btn-observar" onclick="mostrarFormularioObservacion()">Observar</button>';
        html += '<button class="btn btn-rechazar" onclick="rechazar()">Rechazar</button>';
    }

    if (campania.workflow_state_id === 3) {
        html += '<button class="btn btn-aprobar" onclick="aprobar()">Aprobar</button>';
        html += '<button class="btn btn-rechazar" onclick="rechazar()">Rechazar</button>';
    }

    document.getElementById('botonesAccion').innerHTML = html;
}

function cargarRequerimientos() {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/requirements/campaign/' + campaniaId, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        mostrarRequerimientos(data);
    })
    .catch(function(error) {
        console.error('Error:', error);
        document.getElementById('listaRequerimientos').innerHTML = '<p class="sin-resultados">Error al cargar requerimientos</p>';
    });
}

function mostrarRequerimientos(requerimientos) {
    var container = document.getElementById('listaRequerimientos');

    if (requerimientos.length === 0) {
        container.innerHTML = '<p class="sin-resultados">No hay requerimientos enviados</p>';
        return;
    }

    var html = '<div class="tabla-container"><table class="tabla">' +
        '<thead><tr>' +
            '<th>Requisito</th>' +
            '<th>Respuesta</th>' +
            '<th>Archivo</th>' +
        '</tr></thead><tbody>';

    for (var i = 0; i < requerimientos.length; i++) {
        var req = requerimientos[i];
        var archivoHtml = req.file_url
            ? '<a href="' + req.file_url + '" target="_blank" class="btn btn-ver">Ver archivo</a>'
            : '-';

        html += '<tr>' +
            '<td>' + (req.requirement_name || 'Sin nombre') + '</td>' +
            '<td>' + (req.response_value || '-') + '</td>' +
            '<td>' + archivoHtml + '</td>' +
        '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function cargarObservaciones() {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + campaniaId + '/observations', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        mostrarObservaciones(data);
    })
    .catch(function(error) {
        console.error('Error:', error);
        document.getElementById('listaObservaciones').innerHTML = '<p class="sin-resultados">Error al cargar observaciones</p>';
    });
}

function mostrarObservaciones(observaciones) {
    var container = document.getElementById('listaObservaciones');

    if (observaciones.length === 0) {
        container.innerHTML = '<p class="sin-resultados">No hay observaciones registradas</p>';
        return;
    }

    var html = '<div class="tabla-container"><table class="tabla">' +
        '<thead><tr>' +
            '<th>Fecha</th>' +
            '<th>Administrador</th>' +
            '<th>Observación</th>' +
        '</tr></thead><tbody>';

    for (var i = 0; i < observaciones.length; i++) {
        var obs = observaciones[i];
        var fecha = obs.created_at ? obs.created_at.substring(0, 10) : 'N/A';

        html += '<tr>' +
            '<td>' + fecha + '</td>' +
            '<td>' + (obs.admin_name || 'Admin') + '</td>' +
            '<td>' + (obs.observation_text || '-') + '</td>' +
        '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function mostrarFormularioObservacion() {
    document.getElementById('textoObservacion').value = '';
    document.getElementById('formularioObservacion').classList.remove('oculto');
}

function cancelarObservacion() {
    document.getElementById('formularioObservacion').classList.add('oculto');
}

function enviarObservacion() {
    var texto = document.getElementById('textoObservacion').value;

    if (!texto || texto.trim() === '') {
        mostrarMensaje('Debes escribir una observación', 'error');
        return;
    }

    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + campaniaId + '/observe', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observation_text: texto })
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error');
        return response.json();
    })
    .then(function(data) {
        mostrarMensaje('Observación enviada correctamente', 'exito');
        cancelarObservacion();
        cargarDatos();
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al enviar la observación', 'error');
    });
}

function aprobar() {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + campaniaId + '/approve', {
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
        setTimeout(function() {
            window.location.href = './admin-projects.html';
        }, 1500);
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al aprobar el producto', 'error');
    });
}

function rechazar() {
    var token = localStorage.getItem('token');

    fetch(API_URL + '/admin/campaigns/' + campaniaId + '/reject', {
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
        mostrarMensaje('Producto rechazado exitosamente', 'exito');
        setTimeout(function() {
            window.location.href = './admin-projects.html';
        }, 1500);
    })
    .catch(function(error) {
        console.error('Error:', error);
        mostrarMensaje('Error al rechazar el producto', 'error');
    });
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

function mostrarMensaje(texto, tipo) {
    var div = document.getElementById('mensaje');
    div.textContent = texto;
    div.className = 'mensaje mensaje-' + tipo;
    div.classList.remove('hidden');

    setTimeout(function() {
        div.classList.add('hidden');
    }, 3000);
}
