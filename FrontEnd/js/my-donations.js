
if (!localStorage.getItem('token')) {
  window.location.href = './login.html';
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
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

async function loadMyDonations() {
  const token = localStorage.getItem('token');
  const container = document.getElementById('donationsGrid');

  try {
    const response = await fetch(`${API_URL}/donations/my-donations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = './login.html';
        return;
      }
      throw new Error('Error al cargar compras');
    }

    const donations = await response.json();

    if (donations.length === 0) {
      renderEmptyState(container);
      return;
    }

    const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const uniqueCampaigns = new Set(donations.map(d => d.campaign_id)).size;

    document.getElementById('totalDonated').textContent = formatCurrency(totalDonated);
    document.getElementById('totalCampaigns').textContent = uniqueCampaigns;
    document.getElementById('totalDonations').textContent = donations.length;

    const campaignMap = new Map();
    donations.forEach(donation => {
      if (!campaignMap.has(donation.campaign_id)) {
        campaignMap.set(donation.campaign_id, {
          ...donation,
          total_donated: parseFloat(donation.amount)
        });
      } else {
        campaignMap.get(donation.campaign_id).total_donated += parseFloat(donation.amount);
      }
    });

    renderDonations(Array.from(campaignMap.values()), container);

  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `<p style="text-align: center; color: #666; grid-column: 1/-1;">Error al cargar tus compras</p>`;
  }
}

function renderDonations(donations, container) {
  container.innerHTML = donations.map(donation => {
    const daysLeft = calculateDaysLeft(donation.campaign_expiration);
    const progress = donation.campaign_goal > 0
      ? Math.min((donation.campaign_current / donation.campaign_goal) * 100, 100)
      : 0;

    return `
      <div class="donation-card">
        <img
          src="${donation.campaign_image || 'https://placehold.co/400x200/FF7A59/FFFFFF?text=Sin+Imagen'}"
          alt="${donation.campaign_title}"
          class="donation-card-image"
        >
        <div class="donation-card-body">
          ${donation.campaign_category ? `<span class="donation-card-category">${donation.campaign_category}</span>` : ''}

          <h3 class="donation-card-title">${donation.campaign_title}</h3>
          <p class="donation-card-creator">por ${donation.creator_name || 'Vendedor'}</p>

          <div class="donation-card-stats">
            <div class="donation-stat">
              <div class="donation-stat-value highlight">${formatCurrency(donation.total_donated)}</div>
              <div class="donation-stat-label">Tu aporte</div>
            </div>
            <div class="donation-stat">
              <div class="donation-stat-value">${formatCurrency(donation.campaign_current)}</div>
              <div class="donation-stat-label">Vendido</div>
            </div>
          </div>

          <div class="donation-card-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">
              <span>${formatCurrency(donation.campaign_current)}</span>
              <span>${progress.toFixed(0)}%</span>
            </div>
          </div>

          <div class="donation-card-footer">
            <div class="days-remaining">
              <i class="fa-solid fa-clock"></i>
              <span>${daysLeft > 0 ? `${daysLeft} días restantes` : 'Finalizada'}</span>
            </div>
            <a href="./campaign-detail-logged.html?id=${donation.campaign_id}" class="btn-view-campaign">
              Ver producto
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1/-1;">
      <i class="fa-solid fa-hand-holding-heart"></i>
      <h3>Aún no has realizado compras</h3>
      <p>Explora productos y compra productos que te inspiren</p>
      <a href="./index-logged.html" class="btn-explore">Explorar Productos</a>
    </div>
  `;

  document.querySelector('.donations-stats').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadMyDonations);
