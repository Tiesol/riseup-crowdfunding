
const params = new URLSearchParams(window.location.search);
const donationId = params.get('donation_id');
const gatewayId = params.get('gateway_id');
const campaignId = params.get('campaign_id');

async function checkPaymentStatus() {
  const token = localStorage.getItem('token');

  if (!donationId) {
    showError('ID de compra no válido');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/donations/status/${donationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();

      document.getElementById('paymentAmount').textContent = `$${data.amount.toFixed(2)}`;

      if (data.state_id === 2) {
        showSuccess('Pago completado exitosamente');
        setTimeout(() => {
          window.location.href = './donations.html';
        }, 2000);
      } else if (data.state_id === 3) {
        showError('Pago cancelado');
        setTimeout(() => {
          window.location.href = `./campaign-detail-logged.html?id=${campaignId}`;
        }, 2000);
      } else {
        showPending('Pago pendiente. Escanea el QR o simula el pago.');
        loadQR();
      }
    } else {
      showError('Error al verificar el estado del pago');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  }
}

async function loadQR() {
  if (!gatewayId) return;

  const qrContainer = document.getElementById('qrContainer');
  const qrImage = document.getElementById('qrImage');
  const actionsDiv = document.getElementById('paymentActions');

  const paymentConfirmUrl = `${window.CONFIG.GATEWAY_URL}/wallet/${gatewayId}`;

  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentConfirmUrl)}`;
  qrContainer.classList.remove('hidden');
  actionsDiv.classList.remove('hidden');
}

async function simulatePayment() {
  const btn = document.getElementById('simulateBtn');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  try {
    const response = await fetch(`${window.CONFIG.GATEWAY_URL}/payments/${gatewayId}/confirm`, {
      method: 'POST'
    });

    if (response.ok) {
      showSuccess('Pago confirmado exitosamente');
    } else {
      await confirmInBackend();
    }
  } catch (error) {
    console.error('Error simulando pago:', error);
    await confirmInBackend();
  }
}

async function cancelPayment() {
  const btn = document.getElementById('cancelBtn');
  btn.disabled = true;
  btn.textContent = 'Cancelando...';

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/donations/${donationId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      showError('Pago cancelado');
      setTimeout(() => {
        window.location.href = `./campaign-detail-logged.html?id=${campaignId}`;
      }, 1500);
    } else {
      btn.disabled = false;
      btn.textContent = 'Cancelar';
      alert('Error al cancelar el pago');
    }
  } catch (error) {
    console.error('Error cancelando:', error);
    btn.disabled = false;
    btn.textContent = 'Cancelar';
  }
}

async function confirmInBackend() {
  const token = localStorage.getItem('token');
  try {
    await fetch(`${API_URL}/donations/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: gatewayId })
    });
    showSuccess('Pago confirmado exitosamente');
    setTimeout(() => {
      window.location.href = './donations.html';
    }, 2000);
  } catch (e) {
    console.error('Error confirmando:', e);
    showError('Error al confirmar el pago');
  }
}

function showSuccess(message) {
  const statusDiv = document.getElementById('paymentStatus');
  statusDiv.className = 'payment-status completed';
  statusDiv.innerHTML = `<p style="font-weight: 600;">${message}</p><p style="font-size: 0.9rem; margin-top: 8px;">Redirigiendo...</p>`;
  document.getElementById('qrContainer').classList.add('hidden');
  document.getElementById('paymentActions').classList.add('hidden');
}

function showPending(message) {
  const statusDiv = document.getElementById('paymentStatus');
  statusDiv.className = 'payment-status pending';
  statusDiv.innerHTML = `<p>${message}</p>`;
}

function showError(message) {
  const statusDiv = document.getElementById('paymentStatus');
  statusDiv.className = 'payment-status error';
  statusDiv.innerHTML = `<p>${message}</p>`;
}

document.addEventListener('DOMContentLoaded', function() {
  checkPaymentStatus();
  setInterval(checkPaymentStatus, 5000);
});
