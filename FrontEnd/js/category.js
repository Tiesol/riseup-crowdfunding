
let allCampaigns = [];
let currentCategory = null;
let currentSearch = '';
let currentPage = 1;
let totalPages = 1;
let totalCampaigns = 0;
const PAGE_SIZE = 9;

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get('category'),
    search: params.get('search')
  };
}

async function loadCategoryInfo(categoryId) {
  try {
    const response = await fetch(`${API_URL}/categories/${categoryId}`);
    if (!response.ok) throw new Error('Categoría no encontrada');
    return await response.json();
  } catch (error) {
    console.error('Error cargando categoría:', error);
    return null;
  }
}

async function loadCampaigns(categoryId = null, searchQuery = null, page = 1) {
  try {
    let url = `${API_URL}/campaigns/public?page=${page}&page_size=${PAGE_SIZE}`;

    if (categoryId) url += `&category_id=${categoryId}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al cargar productos');
    const data = await response.json();

    currentPage = data.page || 1;
    totalPages = data.total_pages || 1;
    totalCampaigns = data.total || 0;

    return Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    console.error('Error cargando productos:', error);
    currentPage = 1;
    totalPages = 1;
    totalCampaigns = 0;
    return [];
  }
}

function calculateDaysLeft(expirationDate) {
  const now = new Date();
  const expDate = new Date(expirationDate);
  const diff = expDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

function createCampaignCard(campaign) {
  const daysLeft = calculateDaysLeft(campaign.expiration_date);
  const progress = campaign.progress_percentage || 0;
  const isLogged = !!localStorage.getItem('token');
  const detailPage = isLogged ? './campaign-detail-logged.html' : './campaign-detail.html';
  const creatorName = campaign.user_first_name ? `${campaign.user_first_name} ${campaign.user_last_name || ''}` : 'Anónimo';

  return `
    <div class="campaign_grid_card">
      <div class="campaign_grid_image">
        <img src="${campaign.main_image_url || 'https://placehold.co/400x250/FF7A59/FFFFFF?text=Sin+Imagen'}" alt="${campaign.tittle}">
        <span class="campaign_category">${campaign.category_name || 'Sin categoría'}</span>
      </div>
      <div class="campaign_grid_content">
        <div class="campaign_grid_user">
          <div class="grid_user_avatar">
            ${campaign.user_profile_image_url ? `<img src="${campaign.user_profile_image_url}" alt="${creatorName}">` : '<i class="fa-solid fa-user"></i>'}
          </div>
          <span class="grid_user_name">${creatorName}</span>
        </div>
        <h3 class="campaign_grid_title">${campaign.tittle}</h3>
        <div class="campaign_grid_progress">
          <div class="grid_progress_bar">
            <div class="grid_progress_fill" style="width: ${progress}%"></div>
          </div>
          <p class="grid_progress_text">$${(campaign.current_amount || 0).toLocaleString()} de $${(campaign.goal_amount || 0).toLocaleString()} | ${Math.round(progress)}% vendido</p>
        </div>
        <div class="campaign_grid_footer">
          <span class="grid_days_left">
            <i class="fa-solid fa-clock"></i> ${daysLeft} días restantes
          </span>
          <a href="${detailPage}?id=${campaign.id}" class="btn_more_details">Ver más</a>
        </div>
      </div>
    </div>
  `;
}

function filterCampaigns() {
  if (!Array.isArray(allCampaigns)) {
    console.error('allCampaigns no es un array:', allCampaigns);
    return [];
  }
  return [...allCampaigns];
}

function renderCampaigns() {
  const grid = document.querySelector('.campaigns_grid');
  if (!grid) return;

  const filtered = filterCampaigns();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no_results">
        <i class="fa-solid fa-search"></i>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otra búsqueda o categoría</p>
      </div>
    `;
    renderPagination();
    return;
  }

  grid.innerHTML = filtered.map(c => createCampaignCard(c)).join('');
  grid.removeAttribute('aria-busy');
  renderPagination();
}

function renderPagination() {
  let paginationContainer = document.querySelector('.pagination');

  if (!paginationContainer) {
    const section = document.querySelector('.category_campaigns');
    if (section) {
      paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination';
      section.appendChild(paginationContainer);
    } else {
      return;
    }
  }

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';

  html += `<button class="pagination_btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
    <i class="fa-solid fa-chevron-left"></i>
  </button>`;

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    html += `<button class="pagination_btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span class="pagination_dots">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination_btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="pagination_dots">...</span>`;
    }
    html += `<button class="pagination_btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `<button class="pagination_btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
    <i class="fa-solid fa-chevron-right"></i>
  </button>`;

  paginationContainer.innerHTML = html;
}

async function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;

  const grid = document.querySelector('.campaigns_grid');
  if (grid) {
    Skeleton.showGrid(grid, PAGE_SIZE);
  }

  allCampaigns = await loadCampaigns(currentCategory, currentSearch, page);
  renderCampaigns();

  document.querySelector('.category_campaigns')?.scrollIntoView({ behavior: 'smooth' });
}

function updatePageHeader(category, searchQuery) {
  const titleEl = document.querySelector('.category_title');
  const descEl = document.querySelector('.category_description');

  if (category) {
    if (titleEl) titleEl.textContent = category.name;
    if (descEl) descEl.textContent = category.description || `Explora productos de ${category.name}`;
    document.title = `${category.name} - RiseUp`;
  } else if (searchQuery) {
    if (titleEl) titleEl.textContent = `Resultados para "${searchQuery}"`;
    if (descEl) descEl.textContent = `Productos que coinciden con tu búsqueda`;
    document.title = `Búsqueda: ${searchQuery} - RiseUp`;
  } else {
    if (titleEl) titleEl.textContent = 'Todos los productos';
    if (descEl) descEl.textContent = 'Explora todos los productos disponibles';
    document.title = 'Productos - RiseUp';
  }
}

function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter_btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.textContent.trim().toLowerCase();
      let filtered = [...allCampaigns];

      if (filter === 'financiados') {
        filtered = filtered.filter(c => c.progress_percentage >= 100);
      } else if (filter === 'recientes') {
        filtered = filtered.slice().reverse();
      }

      const grid = document.querySelector('.campaigns_grid');
      if (grid) {
        if (filtered.length === 0) {
          grid.innerHTML = `
            <div class="no_results">
              <i class="fa-solid fa-search"></i>
              <h3>No se encontraron productos</h3>
              <p>Intenta con otro filtro</p>
            </div>
          `;
        } else {
          grid.innerHTML = filtered.map(c => createCampaignCard(c)).join('');
        }
      }
    });
  });
}

async function initCategoryPage() {
  Skeleton.showGrid(document.querySelector('.campaigns_grid'), 6);

  const params = getURLParams();
  currentCategory = params.category;
  currentSearch = params.search || '';

  const searchInput = document.querySelector('.search_container input');
  if (searchInput && currentSearch) {
    searchInput.value = currentSearch;
  }

  let categoryInfo = null;
  if (currentCategory) {
    categoryInfo = await loadCategoryInfo(currentCategory);
  }

  updatePageHeader(categoryInfo, currentSearch);

  allCampaigns = await loadCampaigns(currentCategory, currentSearch, 1);

  renderCampaigns();

  setupFilters();
}

document.addEventListener('DOMContentLoaded', initCategoryPage);
