export function renderRatingChart(containerId, distribution) {
  const container = document.getElementById(containerId);

  if (!distribution) {
    container.innerHTML = '<h2>평점 분포</h2><p>데이터가 없습니다</p>';
    return;
  }

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
  const colors = {
    '5': '#4CAF50',
    '4': '#8BC34A',
    '3': '#FFC107',
    '2': '#FF9800',
    '1': '#F44336'
  };

  container.innerHTML = `
    <h2>평점 분포</h2>
    <div class="rating-chart">
      ${Object.entries(distribution)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([rating, count]) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          return `
            <div class="rating-bar">
              <span class="rating-label">${rating}점</span>
              <div class="bar-container">
                <div class="bar" style="width: ${percentage}%; background-color: ${colors[rating] || '#ccc'}"></div>
              </div>
              <span class="rating-count">${count} (${percentage}%)</span>
            </div>
          `;
        }).join('')}
    </div>
    <style>
      .rating-chart {
        padding: 16px 0;
      }
      .rating-bar {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        gap: 12px;
      }
      .rating-label {
        width: 40px;
        font-weight: 500;
      }
      .bar-container {
        flex: 1;
        height: 24px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
      }
      .bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      .rating-count {
        width: 100px;
        text-align: right;
        font-size: 0.9rem;
        color: #666;
      }
    </style>
  `;
}
