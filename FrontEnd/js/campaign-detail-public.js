
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

async function loadCampaignDetail() {
  const campaignId = getCampaignId();

  if (!campaignId) {
    window.location.href = './index.html';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/campaigns/public/${campaignId}`);

    if (!response.ok) {
      throw new Error('Producto no encontrada');
    }

    const campaign = await response.json();
    renderCampaignDetail(campaign);

  } catch (error) {
    console.error('Error cargando producto:', error);
    window.location.href = './index.html';
  }
}

function renderCampaignDetail(campaign) {
  const heroImage = document.querySelector('.campaign_hero_left img');
  heroImage.src = campaign.main_image_url || 'https://placehold.co/800x500/FF7A59/FFFFFF?text=Sin+Imagen';
  heroImage.alt = campaign.tittle;

  document.querySelector('.creator_name').textContent = campaign.user_first_name
    ? `${campaign.user_first_name} ${campaign.user_last_name || ''}`
    : 'Vendedor';

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

  const donateBtn = document.querySelector('.btn_donate');
  donateBtn.addEventListener('click', () => {
    window.location.href = './login.html';
  });

  const favoriteBtn = document.querySelector('.add_favorite');
  favoriteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = './login.html';
  });
}

async function loadRewards() {
  const campaignId = getCampaignId();
  if (!campaignId) return;

  try {
    const response = await fetch(`${API_URL}/rewards/campaign/${campaignId}`);
    const rewards = await response.json();
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

  rewardsGrid.innerHTML = rewards.map(reward => `
    <div class="reward_card">
      <h3 class="reward_title">${reward.tittle}</h3>
      <div class="reward_image">
        <img src="${reward.image_url || 'https://placehold.co/300x200/FF7A59/FFFFFF?text=Oferta'}" alt="${reward.tittle}">
      </div>
      <p class="reward_amount">${formatCurrency(reward.amount)}</p>
      <p class="reward_description">${reward.description || 'Sin descripción'}</p>
      ${reward.stock !== null ? `<p class="reward_stock">Disponibles: ${reward.stock}</p>` : ''}
      <button class="reward_claim_btn cannot-claim" onclick="window.location.href='./login.html'">Iniciar sesión para reclamar</button>
    </div>
  `).join('');
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

window.onload = function() {
  loadCampaignDetail();
  loadRewards();
  loadTopDonors();
};
