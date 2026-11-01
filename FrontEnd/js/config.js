(function() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Producción: reemplazar por las URLs públicas del backend y la pasarela (Railway)
  const API_URL = isLocal ? 'http://localhost:3000' : 'https://RISEUP-BACKEND.up.railway.app';
  const GATEWAY_URL = isLocal ? 'http://localhost:3002' : 'https://RISEUP-GATEWAY.up.railway.app';

  const FRONTEND_URL = window.location.origin;

  const CONFIG = {
    API_URL: API_URL,
    GATEWAY_URL: GATEWAY_URL,
    FRONTEND_URL: FRONTEND_URL,
    PAGE_SIZE: 9,
    MESSAGE_TIMEOUT: 4000,
    VERSION: '1.0.0'
  };

  window.CONFIG = CONFIG;
  window.API_URL = API_URL;
})();
