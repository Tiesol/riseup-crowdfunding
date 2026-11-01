
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function getToken() {
  return localStorage.getItem('token');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}

async function loadCampaignData() {
  const campaignId = getUrlParam('campaign_id');

  if (!campaignId) {
    document.querySelector('.project-name').textContent = 'Sin producto seleccionado';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/campaigns/public/${campaignId}`);

    if (!response.ok) throw new Error('Error al cargar producto');

    const campaign = await response.json();

    document.querySelector('.project-name').textContent = `${campaign.tittle} recaudó:`;
    document.querySelector('.total-amount').textContent = formatCurrency(campaign.current_amount);
    document.title = `Compras - ${campaign.tittle} - RiseUp`;

  } catch (error) {
    console.error('Error:', error);
    document.querySelector('.project-name').textContent = 'Error al cargar producto';
  }
}

async function loadDonations() {
  const campaignId = getUrlParam('campaign_id');

  if (!campaignId) return;

  try {
    const topResponse = await fetch(`${API_URL}/donations/campaign/${campaignId}/top-donors`);
    if (topResponse.ok) {
      const topDonors = await topResponse.json();
      renderTopDonors(topDonors);
    }

    const allResponse = await fetch(`${API_URL}/donations/campaign/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (allResponse.ok) {
      const allDonors = await allResponse.json();
      renderAllDonors(allDonors);
    }

  } catch (error) {
    console.error('Error cargando compras:', error);
  }
}

function renderTopDonors(donors) {
  const container = document.querySelector('.donators-table');

  if (!donors || donors.length === 0) {
    container.innerHTML = `
      <div class="table-header">
        <span>Usuario</span>
        <span>Cantidad</span>
      </div>
      <p style="text-align: center; padding: 2rem; color: #666;">Aún no hay compras</p>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-header">
      <span>Usuario</span>
      <span>Cantidad</span>
    </div>
    ${donors.map(donor => `
      <div class="donator-row">
        <div class="donator-info">
          ${donor.profile_image_url
            ? `<img src="${donor.profile_image_url}" alt="${donor.first_name}">`
            : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #FFD166; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user"></i></div>`
          }
          <span>${donor.first_name} ${donor.last_name || ''}</span>
        </div>
        <span class="amount">${formatCurrency(donor.total_amount)}</span>
      </div>
    `).join('')}
  `;
}

function renderAllDonors(donations) {
  const container = document.querySelector('.donators-list');

  if (!donations || donations.length === 0) {
    container.innerHTML = `
      <p style="text-align: center; padding: 2rem; color: #666;">Aún no hay compras</p>
    `;
    return;
  }

  container.innerHTML = donations.map(donation => `
    <div class="donator-item">
      <div class="donator-avatar">
        ${donation.user_profile_image_url
          ? `<img src="${donation.user_profile_image_url}" alt="${donation.user_first_name}">`
          : `<div style="width: 60px; height: 60px; border-radius: 50%; background: #FFD166; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user" style="font-size: 1.5rem;"></i></div>`
        }
      </div>
      <div class="donator-details">
        <span class="label">Usuario</span>
        <span class="value">${donation.user_first_name} ${donation.user_last_name || ''}</span>
      </div>
      <div class="donator-amount">
        <span class="label">Cantidad</span>
        <span class="value">${formatCurrency(donation.amount)}</span>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  loadCampaignData();
  loadDonations();
});
