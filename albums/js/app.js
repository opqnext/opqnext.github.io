/**
 * 专辑列表 — 加载 data/albums.json 并渲染卡片
 */

const FALLBACK_COVER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">' +
    '<rect width="300" height="300" fill="#e5e7eb"/>' +
    '<text x="150" y="170" text-anchor="middle" font-size="56" fill="#9ca3af">♪</text>' +
    '</svg>'
  );

const grid = document.getElementById('album-grid');
const summary = document.getElementById('summary');
const statusBox = document.getElementById('status');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cardHTML(album) {
  const name = escapeHtml(album.name || '未知专辑');
  const artist = escapeHtml(album.artist || '未知歌手');
  const date = album.publish_date ? escapeHtml(album.publish_date) : '未知日期';
  const note = album.note
    ? '<span class="card-note" title="' + escapeHtml(album.note) + '">' + escapeHtml(album.note) + '</span>'
    : '';
  return (
    '<a class="album-card" href="' + escapeHtml(album.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + escapeHtml(album.cover) + '" alt="' + name + '" loading="lazy">' +
      note +
      '<div class="overlay">' +
        '<h2 class="card-name">' + name + '</h2>' +
        '<p class="card-artist">' + artist + '</p>' +
        '<div class="card-meta">' +
          '<span class="card-date">' + date + '</span>' +
          '<span class="card-arrow">→</span>' +
        '</div>' +
      '</div>' +
    '</a>'
  );
}

function showStatus(html, title) {
  statusBox.hidden = false;
  statusBox.innerHTML =
    '<div class="status-icon">♪</div>' +
    '<h2>' + escapeHtml(title) + '</h2>' +
    '<p>' + html + '</p>';
  grid.innerHTML = '';
}

function render(albums) {
  grid.innerHTML = albums.map(cardHTML).join('');
  grid.querySelectorAll('.album-card img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.src !== FALLBACK_COVER) img.src = FALLBACK_COVER;
    });
  });
}

async function init() {
  try {
    const res = await fetch('data/albums.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const albums = Array.isArray(data.albums) ? data.albums : [];

    if (!albums.length) {
      showStatus(
        '在 <code>scripts/albums/config.json</code> 填入网易云专辑 ID，然后运行 ' +
        '<code>python3 scripts/albums/update-albums.py</code>，再重新部署即可。',
        '还没有专辑'
      );
      return;
    }

    summary.hidden = false;
    const updated = data.updated_at ? data.updated_at.slice(0, 10) : '';
    summary.textContent =
      '共 ' + albums.length + ' 张专辑 · 按发行时间排序（最早在前）' +
      (updated ? ' · 更新于 ' + updated : '');
    render(albums);
  } catch (err) {
    showStatus('请确认 <code>albums/data/albums.json</code> 存在且格式正确。', '专辑数据加载失败');
    console.error(err);
  }
}

init();
