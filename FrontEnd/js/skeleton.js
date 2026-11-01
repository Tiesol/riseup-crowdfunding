// Esqueletos de carga: usan las mismas clases que las tarjetas reales para ocupar exactamente el mismo espacio.
(function() {
  const line = (width) => `<span class="sk sk-text" style="width:${width}"></span>`;

  function gridCard() {
    return `
      <div class="campaign_grid_card is-skeleton" aria-hidden="true">
        <div class="campaign_grid_image sk"></div>
        <div class="campaign_grid_content">
          <div class="campaign_grid_user">
            <div class="grid_user_avatar sk"></div>
            <span class="grid_user_name">${line('110px')}</span>
          </div>
          <h3 class="campaign_grid_title">${line('90%')}<br>${line('55%')}</h3>
          <div class="campaign_grid_progress">
            <div class="grid_progress_bar"></div>
            <p class="grid_progress_text">${line('75%')}</p>
          </div>
          <div class="campaign_grid_footer">
            <span class="grid_days_left">${line('120px')}</span>
            <span class="btn_more_details">${line('56px')}</span>
          </div>
        </div>
      </div>
    `;
  }

  function carouselCard() {
    return `
      <div class="campaign_card is-skeleton sk" aria-hidden="true">
        <div class="campaign_overlay">
          <div class="campaign_content">
            <div class="user_info">
              <div class="user_avatar sk"></div>
              <span class="user_name">${line('140px')}</span>
            </div>
            <h3 class="campaign_title">${line('60%')}</h3>
            <div class="campaign_progress">
              <div class="progress_bar"></div>
              <div class="progress_info">
                <span class="progress_percentage">${line('40px')}</span>
                <span class="progress_funded">${line('160px')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function showGrid(container, count) {
    if (!container) return;
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = Array.from({ length: count }, gridCard).join('');
  }

  window.Skeleton = { gridCard, carouselCard, showGrid, line };
})();
