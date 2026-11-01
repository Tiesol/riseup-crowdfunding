
function isAuthenticated() {
  return !!localStorage.getItem('token');
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

async function loadSearchCategories() {
  const grid = document.getElementById('searchCategoriesGrid');
  if (!grid) return;

  try {
    const response = await fetch(`${API_URL}/categories/`);
    if (!response.ok) throw new Error('Error al cargar categorías');

    const categories = await response.json();

    grid.innerHTML = categories.map(cat => `
      <a href="./category-logged.html?category=${cat.id}" class="search_category_card">
        <span>${cat.name}</span>
      </a>
    `).join('');

    setupSearchDropdownAndForm();
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

function setupSearchDropdownAndForm() {
  const searchInput = document.querySelector('.search_container input');
  const searchDropdown = document.querySelector('.search_dropdown');
  const searchForm = document.querySelector('.search_container form');

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('focus', () => {
      searchDropdown.classList.add('show');
    });

    document.addEventListener('click', (e) => {
      const searchContainer = document.querySelector('.search_container');
      if (searchContainer && !searchContainer.contains(e.target)) {
        searchDropdown.classList.remove('show');
      }
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `./category-logged.html?search=${encodeURIComponent(query)}`;
      }
    });
  }
}

function calculateDaysLeft(expirationDate) {
  if (!expirationDate) return 0;
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function createCampaignCard(campaign) {
  const daysLeft = calculateDaysLeft(campaign.expiration_date);
  const progress = campaign.progress_percentage || 0;

  return `
    <article class="campaign_grid_card">
      <div class="campaign_grid_image">
        <img src="${campaign.main_image_url || 'https://placehold.co/400x250/FF7A59/FFFFFF?text=Sin+Imagen'}" alt="${campaign.tittle}">
        <span class="campaign_category">${campaign.category_name || 'General'}</span>
      </div>
      <div class="campaign_grid_content">
        <div class="campaign_grid_user">
          <div class="grid_user_avatar">
            ${campaign.user_profile_image_url
              ? `<img src="${campaign.user_profile_image_url}" alt="${campaign.user_first_name}">`
              : '<i class="fa-solid fa-user"></i>'}
          </div>
          <span class="grid_user_name">${campaign.user_first_name} ${campaign.user_last_name}</span>
        </div>
        <h3 class="campaign_grid_title">${campaign.tittle}</h3>
        <div class="campaign_grid_progress">
          <div class="grid_progress_bar">
            <div class="grid_progress_fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
          <p class="grid_progress_text">${formatCurrency(campaign.current_amount)} de ${formatCurrency(campaign.goal_amount)} | ${progress.toFixed(0)}% vendido</p>
        </div>
        <div class="campaign_grid_footer">
          <span class="grid_days_left">
            <i class="fa-solid fa-clock"></i> ${daysLeft} días restantes
          </span>
          <a href="campaign-detail-logged.html?id=${campaign.id}" class="btn_more_details">Ver más</a>
        </div>
      </div>
    </article>
  `;
}

function createCarouselCard(campaign) {
  const progress = campaign.progress_percentage || 0;

  return `
    <div class="campaign_card">
      <img src="${campaign.main_image_url || 'https://placehold.co/1200x600/FF7A59/FFFFFF?text=Sin+Imagen'}" alt="${campaign.tittle}" class="campaign_bg">
      <div class="campaign_overlay">
        <div class="campaign_content">
          <div class="user_info">
            <div class="user_avatar">
              ${campaign.user_profile_image_url
                ? `<img src="${campaign.user_profile_image_url}" alt="${campaign.user_first_name}">`
                : '<i class="fa-solid fa-user"></i>'}
            </div>
            <span class="user_name">${campaign.user_first_name} ${campaign.user_last_name}</span>
          </div>
          <h3 class="campaign_title">${campaign.tittle}</h3>
          <div class="campaign_progress">
            <div class="progress_bar">
              <div class="progress_fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
            <div class="progress_info">
              <span class="progress_percentage">${progress.toFixed(0)}%</span>
              <span class="progress_funded">${formatCurrency(campaign.current_amount)} de ${formatCurrency(campaign.goal_amount)}</span>
            </div>
            <a href="campaign-detail-logged.html?id=${campaign.id}" class="btn_view_campaign">Ver Producto</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadFeaturedCampaigns() {
  const carouselTrack = document.querySelector('.carousel_track');
  const indicatorsContainer = document.querySelector('.carousel_indicators');

  carouselTrack.innerHTML = Skeleton.carouselCard();

  try {
    const response = await fetch(`${API_URL}/campaigns/featured?limit=5`);
    const campaigns = await response.json();

    if (campaigns.length === 0) {
      carouselTrack.innerHTML = '<p style="text-align:center; padding: 2rem;">No hay productos destacados.</p>';
      return;
    }

    carouselTrack.innerHTML = campaigns.map(campaign => createCarouselCard(campaign)).join('');

    indicatorsContainer.innerHTML = campaigns.map((_, index) =>
      `<button class="indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></button>`
    ).join('');

    initCarousel(campaigns.length);

  } catch (error) {
    console.error('Error cargando productos destacados:', error);
    carouselTrack.innerHTML = '<p style="text-align:center; padding: 2rem; color: red;">Error al cargar productos.</p>';
  }
}

async function loadPopularCampaigns() {
  const campaignsGrid = document.querySelector('.campaigns_grid');

  Skeleton.showGrid(campaignsGrid, 6);

  try {
    const response = await fetch(`${API_URL}/campaigns/popular?limit=9`);
    const campaigns = await response.json();

    if (campaigns.length === 0) {
      campaignsGrid.innerHTML = `
        <div class="no_campaigns">
          <i class="fa-solid fa-folder-open"></i>
          <p>No hay productos disponibles.</p>
        </div>
      `;
      return;
    }

    campaignsGrid.innerHTML = campaigns.map(campaign => createCampaignCard(campaign)).join('');
    campaignsGrid.removeAttribute('aria-busy');

  } catch (error) {
    console.error('Error cargando productos:', error);
    campaignsGrid.innerHTML = `
      <div class="error_campaigns">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <p>Error al cargar los productos.</p>
      </div>
    `;
  }
}

function initCarousel(totalSlides) {
  let currentSlide = 0;
  const cards = document.querySelectorAll('.carousel_track .campaign_card');
  const indicators = document.querySelectorAll('.indicator');
  const prevBtn = document.querySelector('.carousel_nav_prev');
  const nextBtn = document.querySelector('.carousel_nav_next');

  function updateCarousel() {
    cards.forEach((card, index) => {
      card.style.display = index === currentSlide ? 'block' : 'none';
    });
    indicators.forEach((ind, index) => {
      ind.classList.toggle('active', index === currentSlide);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
      updateCarousel();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentSlide = (currentSlide + 1) % totalSlides;
      updateCarousel();
    });
  }

  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      currentSlide = index;
      updateCarousel();
    });
  });

  setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
  }, 5000);

  updateCarousel();
}

window.onload = function() {
  loadFeaturedCampaigns();
  loadPopularCampaigns();
  loadSearchCategories();

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
