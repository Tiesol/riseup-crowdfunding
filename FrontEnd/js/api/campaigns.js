

export async function getPublicCampaigns(options = {}) {
  try {
    const params = new URLSearchParams();

    if (options.category_id) params.append('category_id', options.category_id);
    if (options.search) params.append('search', options.search);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    const queryString = params.toString();
    const url = `${API_URL}/campaigns/public${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Error al obtener productos');
    }

    return data;
  } catch (error) {
    console.error('Error en getPublicCampaigns:', error);
    throw error;
  }
}

export async function getFeaturedCampaigns(limit = 6) {
  try {
    const response = await fetch(`${API_URL}/campaigns/featured?limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Error al obtener productos destacados');
    }

    return data;
  } catch (error) {
    console.error('Error en getFeaturedCampaigns:', error);
    throw error;
  }
}

export async function getCampaignDetail(campaignId) {
  try {
    const response = await fetch(`${API_URL}/campaigns/public/${campaignId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Error al obtener producto');
    }

    return data;
  } catch (error) {
    console.error('Error en getCampaignDetail:', error);
    throw error;
  }
}

export async function getCampaignRewards(campaignId) {
  try {
    const response = await fetch(`${API_URL}/rewards/campaign/${campaignId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Error al obtener ofertas');
    }

    return data;
  } catch (error) {
    console.error('Error en getCampaignRewards:', error);
    throw error;
  }
}

export async function getTopDonors(campaignId, limit = 5) {
  try {
    const response = await fetch(`${API_URL}/donations/campaign/${campaignId}/top-donors?limit=${limit}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Error al obtener compradores');
    }

    return data;
  } catch (error) {
    console.error('Error en getTopDonors:', error);
    throw error;
  }
}

export function calculateDaysLeft(expirationDate) {
  if (!expirationDate) return 0;

  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
