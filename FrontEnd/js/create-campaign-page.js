
const rewards = [];
let editingCampaignId = null;
let currentMediaType = null;
let currentRequirements = [];
let currentWorkflowStateId = null;
let quill = null;

function getCampaignId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function imageHandler() {
  showMediaModal('image');
}

function videoHandler() {
  showMediaModal('video');
}

function initQuill() {
  quill = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Describe tu producto en detalle...',
    modules: {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['link', 'image', 'video'],
          ['clean']
        ],
        handlers: {
          image: imageHandler,
          video: videoHandler
        }
      }
    }
  });
}

async function loadRequirements(categoryId) {
  const section = document.getElementById('requirementsSection');
  const container = document.getElementById('requirementsContainer');

  if (!categoryId) {
    section.classList.add('hidden');
    currentRequirements = [];
    return;
  }

  try {
    const response = await fetch(`${API_URL}/requirements/category/${categoryId}`);
    if (response.ok) {
      currentRequirements = await response.json();

      if (currentRequirements.length === 0) {
        section.classList.add('hidden');
        return;
      }

      container.innerHTML = currentRequirements.map(req => {
        const isRequired = req.is_required;
        const requiredMark = isRequired ? '<span class="required-mark">*</span>' : '';
        const requiredClass = isRequired ? 'is-required' : '';

        let inputHtml = '';
        switch(req.requirement_type_id) {
          case 4:
            inputHtml = `<input type="url" id="req_${req.id}" class="requirement-input ${requiredClass}"
                         placeholder="https://..." data-req-id="${req.id}" data-required="${isRequired}">`;
            break;
          case 2:
          case 3:
            inputHtml = `<input type="url" id="req_${req.id}" class="requirement-input ${requiredClass}"
                         placeholder="URL del archivo o imagen" data-req-id="${req.id}" data-required="${isRequired}">`;
            break;
          default:
            inputHtml = `<textarea id="req_${req.id}" class="requirement-input requirement-textarea ${requiredClass}"
                         rows="2" data-req-id="${req.id}" data-required="${isRequired}" placeholder="Tu respuesta..."></textarea>`;
        }

        return `
          <div class="requirement-item" data-req-id="${req.id}">
            <label for="req_${req.id}">
              ${req.name} ${requiredMark}
            </label>
            <p class="requirement-description">${req.description || ''}</p>
            ${inputHtml}
            <span class="error-mensaje">Este campo es obligatorio</span>
          </div>
        `;
      }).join('');

      section.classList.remove('hidden');

      if (editingCampaignId) {
        await loadRequirementResponses(editingCampaignId);
      }
    }
  } catch (error) {
    console.error('Error cargando requisitos:', error);
  }
}

async function loadRequirementResponses(campaignId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/requirements/campaign/${campaignId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const responses = await response.json();
      responses.forEach(resp => {
        const input = document.querySelector(`input[data-req-id="${resp.requirement_id}"], textarea[data-req-id="${resp.requirement_id}"]`);
        if (input) {
          input.value = resp.response_value || resp.file_url || '';
        }
      });
    }
  } catch (error) {
    console.error('Error cargando respuestas:', error);
  }
}

function getRequirementResponses() {
  const responses = [];
  currentRequirements.forEach(req => {
    const input = document.querySelector(`input[data-req-id="${req.id}"], textarea[data-req-id="${req.id}"]`);
    if (input && input.value && input.value.trim()) {
      const value = input.value.trim();
      responses.push({
        requirement_id: req.id,
        response_value: req.requirement_type_id === 1 ? value : null,
        file_url: req.requirement_type_id !== 1 ? value : null
      });
    }
  });
  return responses;
}

function validateRequirements() {
  let hasErrors = false;

  document.querySelectorAll('.requirement-item').forEach(item => {
    item.classList.remove('error');
  });

  currentRequirements.forEach(req => {
    if (req.is_required) {
      const input = document.querySelector(`input[data-req-id="${req.id}"], textarea[data-req-id="${req.id}"]`);
      const item = document.querySelector(`.requirement-item[data-req-id="${req.id}"]`);
      if (!input || !input.value || !input.value.trim()) {
        if (item) item.classList.add('error');
        hasErrors = true;
      }
    }
  });
  return hasErrors;
}

function showMediaModal(type) {
  currentMediaType = type;
  const modal = document.getElementById('mediaModal');
  const title = document.getElementById('mediaModalTitle');
  const label = document.getElementById('mediaModalLabel');
  const help = document.getElementById('mediaModalHelp');
  const input = document.getElementById('mediaUrlInput');

  if (type === 'image') {
    title.textContent = 'Insertar Imagen';
    label.textContent = 'URL de la imagen:';
    help.textContent = 'Pega la URL directa de la imagen (ej: https://ejemplo.com/foto.jpg)';
    input.placeholder = 'https://ejemplo.com/imagen.jpg';
  } else {
    title.textContent = 'Insertar Video';
    label.textContent = 'URL del video:';
    help.textContent = 'Pega el enlace de YouTube o Vimeo. Ej: https://youtube.com/watch?v=xxxxx';
    input.placeholder = 'https://youtube.com/watch?v=...';
  }

  input.value = '';
  modal.classList.remove('hidden');
  input.focus();
}

function closeMediaModal() {
  document.getElementById('mediaModal').classList.add('hidden');
  currentMediaType = null;
}

function insertMedia() {
  let url = document.getElementById('mediaUrlInput').value.trim();
  if (!url) {
    return;
  }

  const range = quill.getSelection(true);

  if (currentMediaType === 'video') {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
    }
    quill.insertEmbed(range.index, 'video', url);
  } else {
    quill.insertEmbed(range.index, 'image', url);
  }

  quill.setSelection(range.index + 1);
  closeMediaModal();
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
  document.getElementById('successMessage').classList.add('hidden');
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(message) {
  const successDiv = document.getElementById('successMessage');
  successDiv.textContent = message;
  successDiv.classList.remove('hidden');
  document.getElementById('errorMessage').classList.add('hidden');
}

function hideMessages() {
  document.getElementById('errorMessage').classList.add('hidden');
  document.getElementById('successMessage').classList.add('hidden');
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories/`);
    if (response.ok) {
      const categories = await response.json();
      const select = document.getElementById('categorySelect');
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

async function loadCampaignRewards(campaignId) {
  try {
    const response = await fetch(`${API_URL}/rewards/campaign/${campaignId}`);
    if (response.ok) {
      const existingRewards = await response.json();

      rewards.length = 0;
      existingRewards.forEach(r => {
        rewards.push({
          id: r.id,
          title: r.tittle,
          minAmount: parseFloat(r.amount),
          description: r.description || '',
          image_url: r.image_url || null
        });
      });
      renderRewards();
    }
  } catch (error) {
    console.error('Error cargando ofertas:', error);
  }
}

async function loadCampaignData(campaignId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const campaign = await response.json();

      currentWorkflowStateId = campaign.workflow_state_id;

      if (currentWorkflowStateId !== 1 && currentWorkflowStateId !== 3) {
        showError('Este producto no se puede editar en su estado actual');
        setTimeout(() => {
          window.location.href = 'my-campaigns.html';
        }, 2000);
        return;
      }

      document.querySelector('.page-title').textContent = 'Editar Producto';
      document.title = 'Editar Producto - RiseUp';

      document.getElementById('campaignTitle').value = campaign.tittle || '';
      document.getElementById('shortDescription').value = campaign.description || '';
      document.getElementById('goalAmount').value = campaign.goal_amount || '';
      document.getElementById('mainImageUrl').value = campaign.main_image_url || '';

      if (campaign.expiration_date) {
        document.getElementById('expirationDate').value = campaign.expiration_date;
      }

      editingCampaignId = campaignId;

      if (campaign.category_id) {
        document.getElementById('categorySelect').value = campaign.category_id;
        await loadRequirements(campaign.category_id);
      }

      if (campaign.rich_text) {
        quill.root.innerHTML = campaign.rich_text;
      }

      await loadCampaignRewards(campaignId);

      if (currentWorkflowStateId === 3) {
        const btnObs = document.getElementById('btnObservations');
        btnObs.classList.remove('btn-warning');
        btnObs.classList.add('btn-obs-active');
      }
    } else {
      showError('No se pudo cargar el producto');
    }
  } catch (error) {
    console.error('Error cargando producto:', error);
    showError('Error al cargar los datos de el producto');
  }
}

function renderRewards() {
  const container = document.getElementById('rewardsList');
  container.innerHTML = rewards.map((r, i) => `
    <div class="reward-card">
      ${r.image_url ? `<img src="${r.image_url}" alt="${r.title}" class="reward-image">` : ''}
      <div class="reward-info">
        <strong>${r.title}</strong> - Mínimo: $${r.minAmount}
        <p>${r.description}</p>
      </div>
      <button type="button" class="btn-remove" onclick="removeReward(${i})">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function addReward() {
  const title = document.getElementById('rewardTitle').value.trim();
  const minAmount = document.getElementById('rewardMinAmount').value;
  const description = document.getElementById('rewardDescription').value.trim();
  const imageUrl = document.getElementById('rewardImageUrl').value.trim();

  if (!title || !minAmount) {
    showError('Ingresa título y monto mínimo para la oferta');
    return;
  }

  rewards.push({ title, minAmount: parseFloat(minAmount), description, image_url: imageUrl || null });
  renderRewards();
  hideMessages();

  document.getElementById('rewardTitle').value = '';
  document.getElementById('rewardMinAmount').value = '';
  document.getElementById('rewardDescription').value = '';
  document.getElementById('rewardImageUrl').value = '';
}

function removeReward(index) {
  rewards.splice(index, 1);
  renderRewards();
}

async function loadAndShowObservations(campaignId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/campaigns/${campaignId}/observations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const observations = await response.json();
      const container = document.getElementById('observationsList');

      if (observations.length === 0) {
        container.innerHTML = '<p class="no-observations">No hay observaciones registradas.</p>';
      } else {
        container.innerHTML = observations.map(obs => `
          <div class="observation-item">
            <div class="observation-header">
              <span class="observation-admin"><i class="fa-solid fa-user-shield"></i> ${obs.admin_name || 'Administrador'}</span>
              <span class="observation-date">${new Date(obs.created_at).toLocaleString('es-ES')}</span>
            </div>
            <div class="observation-text">${obs.observation_text}</div>
          </div>
        `).join('');
      }

      document.getElementById('observationsModal').classList.remove('hidden');
    } else {
      showError('No se pudieron cargar las observaciones');
    }
  } catch (error) {
    console.error('Error cargando observaciones:', error);
    showError('Error al cargar las observaciones');
  }
}

function closeObservationsModal() {
  document.getElementById('observationsModal').classList.add('hidden');
}

function limpiarErroresCampos() {
  const grupos = document.querySelectorAll('.form-group');
  grupos.forEach(g => g.classList.remove('error'));
}

async function saveCampaign(send) {
  hideMessages();
  limpiarErroresCampos();

  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const tittle = document.getElementById('campaignTitle').value.trim();
  const description = document.getElementById('shortDescription').value.trim();
  const categoryId = document.getElementById('categorySelect').value;
  const goalAmount = document.getElementById('goalAmount').value;
  const expirationDate = document.getElementById('expirationDate').value;
  const mainImageUrl = document.getElementById('mainImageUrl').value.trim();
  const richText = quill.root.innerHTML;

  let hayErrores = false;

  if (!tittle) {
    document.getElementById('grupoTitulo').classList.add('error');
    hayErrores = true;
  }
  if (!description) {
    document.getElementById('grupoDescripcion').classList.add('error');
    hayErrores = true;
  }
  if (!categoryId) {
    document.getElementById('grupoCategoria').classList.add('error');
    hayErrores = true;
  }
  if (!goalAmount || parseFloat(goalAmount) <= 0) {
    document.getElementById('grupoMeta').classList.add('error');
    hayErrores = true;
  }
  if (!expirationDate) {
    document.getElementById('grupoFecha').classList.add('error');
    hayErrores = true;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(expirationDate);
    if (selectedDate <= today) {
      document.getElementById('grupoFecha').classList.add('error');
      document.querySelector('#grupoFecha .error-mensaje').textContent = 'La fecha debe ser futura';
      hayErrores = true;
    }
  }

  if (hayErrores) {
    return;
  }

  if (send) {
    const hasReqErrors = validateRequirements();
    if (hasReqErrors) {
      return;
    }
  }

  const data = {
    tittle: tittle,
    description: description,
    goal_amount: parseFloat(goalAmount),
    expiration_date: expirationDate,
    main_image_url: mainImageUrl || null,
    rich_text: richText,
    category_id: parseInt(categoryId)
  };

  try {
    let response;
    let campaignId = editingCampaignId;

    if (editingCampaignId) {
      response = await fetch(`${API_URL}/campaigns/${editingCampaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } else {
      response = await fetch(`${API_URL}/campaigns/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const newCampaign = await response.json();
        campaignId = newCampaign.id;
      }
    }

    if (!response.ok) {
      const err = await response.json();
      if (err.detail && Array.isArray(err.detail)) {
        const messages = err.detail.map(e => e.msg || e.message || 'Error de validación').join(', ');
        showError(messages);
      } else {
        showError(err.detail || 'Error al guardar el producto');
      }
      return;
    }

    const reqResponses = getRequirementResponses();
    if (reqResponses.length > 0 && campaignId) {
      await fetch(`${API_URL}/requirements/campaign/${campaignId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reqResponses)
      });
    }

    if (rewards.length > 0 && campaignId) {
      for (const reward of rewards) {
        const rewardData = {
          tittle: reward.title,
          description: reward.description || null,
          amount: reward.minAmount,
          stock: null,
          campaign_id: campaignId,
          image_url: reward.image_url || null
        };

        await fetch(`${API_URL}/rewards/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(rewardData)
        });
      }
    }

    if (send && campaignId) {
      const reviewResponse = await fetch(`${API_URL}/campaigns/${campaignId}/submit-for-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!reviewResponse.ok) {
        const err = await reviewResponse.json();
        showError(err.detail || 'Error al enviar a revisión');
        return;
      }
    }

    const msg = send
      ? '¡Producto enviado para revisión!'
      : (editingCampaignId ? '¡Producto actualizado!' : '¡Borrador guardado!');
    showSuccess(msg);
    setTimeout(() => {
      window.location.href = 'my-campaigns.html';
    }, 1500);

  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión con el servidor');
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  initQuill();

  await loadCategories();

  const campaignId = getCampaignId();
  if (campaignId) {
    await loadCampaignData(campaignId);
  }

  document.getElementById('categorySelect').addEventListener('change', function() {
    const categoryId = this.value;
    loadRequirements(categoryId);
  });

  document.getElementById('closeMediaModal').addEventListener('click', closeMediaModal);
  document.getElementById('cancelMediaBtn').addEventListener('click', closeMediaModal);
  document.getElementById('insertMediaBtn').addEventListener('click', insertMedia);

  document.getElementById('mediaModal').addEventListener('click', function(e) {
    if (e.target === this) closeMediaModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMediaModal();
  });

  document.getElementById('mediaUrlInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      insertMedia();
    }
  });

  document.getElementById('btnAddReward').addEventListener('click', addReward);

  document.getElementById('btnCancel').addEventListener('click', function() {
    window.location.href = 'my-campaigns.html';
  });

  document.getElementById('btnSave').addEventListener('click', function() {
    saveCampaign(false);
  });

  document.getElementById('btnSendCampaign').addEventListener('click', function() {
    saveCampaign(true);
  });

  document.getElementById('btnObservations').addEventListener('click', async function() {
    if (!editingCampaignId) {
      showError('Primero debes crear el producto.');
      return;
    }

    if (currentWorkflowStateId !== 3) {
      showError('Las observaciones solo están disponibles cuando tu producto ha sido observada por un administrador.');
      return;
    }

    await loadAndShowObservations(editingCampaignId);
  });

  document.getElementById('closeObservationsModal').addEventListener('click', closeObservationsModal);
  document.getElementById('closeObservationsBtn').addEventListener('click', closeObservationsModal);
  document.getElementById('observationsModal').addEventListener('click', function(e) {
    if (e.target === this) closeObservationsModal();
  });
});
