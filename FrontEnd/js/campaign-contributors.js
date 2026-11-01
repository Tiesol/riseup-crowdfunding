
function getCampaignId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

async function loadContributors() {
  const campaignId = getCampaignId();

  if (!campaignId) {
    window.location.href = './index-logged.html';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/donations/campaign/${campaignId}/all`);

    if (!response.ok) {
      if (response.status === 403) {
        alert('Este producto no está disponible');
        window.location.href = './my-campaigns.html';
        return;
      }
      throw new Error('Error al cargar datos');
    }

    const data = await response.json();

    renderHero(data.campaign);
    renderTopDonors(data.top_5);
    renderAllDonors(data.donors);

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('heroTitle').textContent = 'Error al cargar';
  }
}

function renderHero(campaign) {
  document.getElementById('heroCategory').textContent = campaign.category || 'Sin categoría';
  document.getElementById('heroTitle').textContent = campaign.title;
  document.getElementById('heroCurrentAmount').textContent = formatCurrency(campaign.current_amount);
  document.getElementById('heroGoalAmount').textContent = formatCurrency(campaign.goal_amount);

  const percent = campaign.goal_amount > 0
    ? Math.min((campaign.current_amount / campaign.goal_amount) * 100, 100)
    : 0;

  document.getElementById('heroProgress').style.width = `${percent}%`;
  document.getElementById('heroPercent').textContent = `${percent.toFixed(0)}%`;

  document.getElementById('btnBack').href = `./campaign-detail-logged.html?id=${campaign.id}`;
}

function renderTopDonors(topDonors) {
  const container = document.getElementById('topDonorsGrid');

  if (!topDonors || topDonors.length === 0) {
    container.innerHTML = `
      <div class="empty-donors" style="grid-column: 1/-1;">
        <i class="fa-solid fa-hand-holding-heart"></i>
        <p>Aún no hay compras</p>
      </div>
    `;
    return;
  }

  container.innerHTML = topDonors.map((donor) => `
    <div class="top-donor-card">
      <div class="top-donor-avatar">
        ${donor.user_image
          ? `<img src="${donor.user_image}" alt="${donor.user_name}">`
          : '<i class="fa-solid fa-user"></i>'
        }
      </div>
      <div class="top-donor-name">${donor.user_name}</div>
      <div class="top-donor-amount">${formatCurrency(donor.amount)}</div>
    </div>
  `).join('');
}

function renderAllDonors(donors) {
  const container = document.getElementById('donorsList');

  if (!donors || donors.length === 0) {
    container.innerHTML = `
      <div class="empty-donors">
        <i class="fa-solid fa-hand-holding-heart"></i>
        <p>Aún no hay compras registradas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = donors.map((donor, index) => `
    <div class="donor-item">
      <span class="donor-rank">#${index + 1}</span>
      <div class="donor-avatar">
        ${donor.user_image
          ? `<img src="${donor.user_image}" alt="${donor.user_name}">`
          : '<i class="fa-solid fa-user"></i>'
        }
      </div>
      <div class="donor-info">
        <div class="donor-name">${donor.user_name}</div>
        <div class="donor-date">${formatDate(donor.created_at)}</div>
      </div>
      <div class="donor-amount">${formatCurrency(donor.amount)}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadContributors);
