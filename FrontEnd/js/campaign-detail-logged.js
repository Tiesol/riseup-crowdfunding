
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = './login.html';
}

if (!isAuthenticated()) {
  window.location.href = './login.html';
}

function getCampaignId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculateDaysLeft(expirationDate) {
  if (!expirationDate) return 0;
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

let currentCampaign = null;
let isFavorite = false;
let userTotalDonated = 0;
let userClaimedRewards = [];

async function loadCampaignDetail() {
  const campaignId = getCampaignId();
  const token = localStorage.getItem('token');

  if (!campaignId) {
    window.location.href = './index-logged.html';
    return;
  }

  try {
    let response;
    if (token) {
      response = await fetch(`${API_URL}/campaigns/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    if (!response || !response.ok) {
      response = await fetch(`${API_URL}/campaigns/public/${campaignId}`);
    }

    if (!response.ok) {
      throw new Error('Producto no encontrada');
    }

    currentCampaign = await response.json();
    renderCampaignDetail(currentCampaign);

    await checkFavoriteStatus();

  } catch (error) {
    console.error('Error cargando producto:', error);
    window.location.href = './index-logged.html';
  }
}

async function checkFavoriteStatus() {
  const campaignId = getCampaignId();
  const token = getToken();
  const favoriteBtn = document.querySelector('.add_favorite');

  if (!token || !favoriteBtn) return;

  try {
    const response = await fetch(`${API_URL}/favorites/check/${campaignId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.is_favorite) {
        isFavorite = true;
        favoriteBtn.style.color = '#FF7A59';
        favoriteBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> En favoritos';
      }
    }
  } catch (error) {
    console.error('Error verificando favoritos:', error);
  }
}

function renderCampaignDetail(campaign) {
  const heroImage = document.querySelector('.campaign_hero_left img');
  heroImage.src = campaign.main_image_url || 'https://placehold.co/800x500/FF7A59/FFFFFF?text=Sin+Imagen';
  heroImage.alt = campaign.tittle;

  const creatorName = campaign.user_first_name
    ? `${campaign.user_first_name} ${campaign.user_last_name || ''}`
    : 'Vendedor';
  document.querySelector('.creator_name').textContent = creatorName;

  const creatorAvatar = document.querySelector('.creator_avatar');
  if (campaign.user_profile_image_url) {
    creatorAvatar.innerHTML = `<img src="${campaign.user_profile_image_url}" alt="${campaign.user_first_name || 'Vendedor'}">`;
  }

  document.querySelector('.campaign_detail_title').textContent = campaign.tittle;

  document.querySelector('.campaign_short_description').textContent = campaign.description || 'Sin descripción disponible';

  const progress = campaign.goal_amount > 0
    ? (campaign.current_amount / campaign.goal_amount * 100)
    : 0;

  document.querySelector('.detail_progress_fill').style.width = `${Math.min(progress, 100)}%`;
  document.querySelector('.funding_text').textContent =
    `${formatCurrency(campaign.current_amount)} de ${formatCurrency(campaign.goal_amount)} | ${progress.toFixed(0)}% vendido`;

  const daysLeft = calculateDaysLeft(campaign.expiration_date);
  const daysElement = document.querySelector('.days_count');
  if (daysElement) {
    daysElement.textContent = daysLeft;
  }

  const descriptionContent = document.querySelector('.description_content');
  if (campaign.rich_text) {
    descriptionContent.innerHTML = campaign.rich_text;
  } else {
    descriptionContent.innerHTML = `
      <h3>Sobre el Producto</h3>
      <p>${campaign.description || 'Sin descripción disponible'}</p>
    `;
  }

  document.title = `${campaign.tittle} - RiseUp`;
}

async function loadRewards() {
  const campaignId = getCampaignId();
  const token = getToken();
  if (!campaignId) return;

  try {
    const rewardsResponse = await fetch(`${API_URL}/rewards/campaign/${campaignId}`);
    const rewards = await rewardsResponse.json();

    if (token) {
      try {
        const totalResponse = await fetch(`${API_URL}/rewards/campaign/${campaignId}/my-total`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (totalResponse.ok) {
          const totalData = await totalResponse.json();
          userTotalDonated = totalData.total_donated || 0;
        }
      } catch (e) {
        console.error('Error cargando total donado:', e);
      }

      try {
        const claimsResponse = await fetch(`${API_URL}/rewards/campaign/${campaignId}/my-claims`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (claimsResponse.ok) {
          userClaimedRewards = await claimsResponse.json();
        }
      } catch (e) {
        console.error('Error cargando claims:', e);
      }
    }

    renderRewards(rewards);
  } catch (error) {
    console.error('Error cargando ofertas:', error);
  }
}

function renderRewards(rewards) {
  const rewardsGrid = document.querySelector('.rewards_grid');

  if (!rewards || rewards.length === 0) {
    rewardsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Este producto aún no tiene ofertas.</p>';
    return;
  }

  rewardsGrid.innerHTML = rewards.map(reward => {
    const isClaimed = userClaimedRewards.includes(reward.id);
    const canClaim = userTotalDonated >= parseFloat(reward.amount);
    const isOwner = currentCampaign && getCurrentUser() && currentCampaign.user_id === getCurrentUser().id;

    let buttonHtml = '';
    if (!isOwner) {
      if (isClaimed) {
        buttonHtml = `<button class="reward_claim_btn claimed" disabled>✓ Reclamado</button>`;
      } else if (canClaim) {
        buttonHtml = `<button class="reward_claim_btn can-claim" onclick="claimReward(${reward.id})">Reclamar</button>`;
      } else {
        buttonHtml = `<button class="reward_claim_btn cannot-claim" onclick="showCannotClaimMessage(${parseFloat(reward.amount)})">Reclamar</button>`;
      }
    }

    return `
      <div class="reward_card">
        <h3 class="reward_title">${reward.tittle}</h3>
        <div class="reward_image">
          <img src="${reward.image_url || 'https://placehold.co/300x200/FF7A59/FFFFFF?text=Oferta'}" alt="${reward.tittle}">
        </div>
        <p class="reward_amount">${formatCurrency(reward.amount)}</p>
        <p class="reward_description">${reward.description || 'Sin descripción'}</p>
        ${reward.stock !== null ? `<p class="reward_stock">Disponibles: ${reward.stock}</p>` : ''}
        ${buttonHtml}
      </div>
    `;
  }).join('');
}

function showCannotClaimMessage(requiredAmount) {
  const needed = requiredAmount - userTotalDonated;
  showMessage(`Necesitas comprar $${needed.toFixed(2)} más para reclamar esta oferta. Has donado $${userTotalDonated.toFixed(2)}.`, true);
}

async function claimReward(rewardId) {
  const campaignId = getCampaignId();
  const token = getToken();

  if (!token) {
    window.location.href = './login.html';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/rewards/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reward_id: rewardId,
        campaign_id: parseInt(campaignId)
      })
    });

    if (response.ok) {
      const claim = await response.json();
      showMessage(`¡Has reclamado la oferta "${claim.reward_title}" exitosamente!`);
      userClaimedRewards.push(rewardId);
      loadRewards();
    } else {
      const error = await response.json();
      showMessage(error.detail || 'Error al reclamar la oferta', true);
    }
  } catch (error) {
    console.error('Error reclamando oferta:', error);
    showMessage('Error al reclamar la oferta', true);
  }
}

async function loadTopDonors() {
  const campaignId = getCampaignId();
  if (!campaignId) return;

  try {
    const response = await fetch(`${API_URL}/donations/campaign/${campaignId}/top-donors?limit=5`);
    const donors = await response.json();
    renderTopDonors(donors);
  } catch (error) {
    console.error('Error cargando compradores:', error);
  }
}

function renderTopDonors(donors) {
  const donatorsList = document.querySelector('.donators_list');

  if (!donors || donors.length === 0) {
    donatorsList.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Sé el primero en comprar a este producto.</p>';
    return;
  }

  donatorsList.innerHTML = donors.map(donor => `
    <div class="donator_item">
      <div class="donator_info">
        <div class="donator_avatar">
          ${donor.user_image
            ? `<img src="${donor.user_image}" alt="${donor.user_name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : '<i class="fa-solid fa-user"></i>'
          }
        </div>
        <span class="donator_name">${donor.user_name}</span>
      </div>
      <span class="donator_amount">${formatCurrency(donor.amount)}</span>
    </div>
  `).join('');
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  const successDiv = document.getElementById('successMessage');

  if (successDiv) successDiv.classList.add('hidden');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showSuccess(message) {
  const errorDiv = document.getElementById('errorMessage');
  const successDiv = document.getElementById('successMessage');

  if (errorDiv) errorDiv.classList.add('hidden');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showMessage(message, isError = false) {
  if (isError) {
    showError(message);
  } else {
    showSuccess(message);
  }
}

function handleDonate() {
  document.getElementById('donationModal').classList.remove('hidden');
  document.getElementById('donationAmount').value = '';
  document.getElementById('donationAmount').focus();
}

function closeDonationModal() {
  document.getElementById('donationModal').classList.add('hidden');
}

async function confirmDonation() {
  const campaignId = getCampaignId();
  const amountInput = document.getElementById('donationAmount');
  const amount = amountInput.value;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    showMessage('Por favor ingresa una cantidad válida', true);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/donations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        campaign_id: parseInt(campaignId),
        amount: parseFloat(amount),
        payment_method_id: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al procesar compra');
    }

    const donation = await response.json();
    closeDonationModal();

    if (donation.payment_url) {
      window.location.href = donation.payment_url;
    } else {
      showSuccess('¡Compra realizada con éxito! Gracias por tu compra.');
      setTimeout(() => {
        loadCampaignDetail();
        loadTopDonors();
        loadRewards();
      }, 500);
    }

  } catch (error) {
    console.error('Error:', error);
    showMessage(error.message, true);
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeDonationModal();
  }
});

document.getElementById('donationModal')?.addEventListener('click', function(e) {
  if (e.target === this) {
    closeDonationModal();
  }
});

async function handleFavorite(e) {
  e.preventDefault();
  const campaignId = getCampaignId();
  const favoriteBtn = document.querySelector('.add_favorite');
  const icon = favoriteBtn.querySelector('i');

  try {
    const response = await fetch(`${API_URL}/favorites/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        campaign_id: parseInt(campaignId)
      })
    });

    if (response.ok) {
      isFavorite = true;
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
      favoriteBtn.style.color = '#FF7A59';
      favoriteBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> En favoritos';
    } else {
      const error = await response.json();
      if (error.detail && error.detail.includes('ya')) {
        isFavorite = true;
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        favoriteBtn.style.color = '#FF7A59';
        favoriteBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> En favoritos';
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

window.onload = function() {
  loadCampaignDetail();
  loadRewards();
  loadTopDonors();

  const donateBtn = document.querySelector('.btn_donate');
  donateBtn.addEventListener('click', handleDonate);

  const favoriteBtn = document.querySelector('.add_favorite');
  favoriteBtn.addEventListener('click', handleFavorite);

  const user = getCurrentUser();
  const adminLink = document.getElementById('adminLink');
  const logoutBtn = document.getElementById('logoutBtn');

  if (user && user.role_id === 1 && adminLink) {
    adminLink.classList.remove('hidden');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
};
