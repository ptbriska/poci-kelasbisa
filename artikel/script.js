// MASTER DATA ARTIKEL SINKRON VIA MANIFEST
let allArticlesData = [];

// OBJEK STATE FILTER
let activeFilters = {
  tag: 'Semua',
  subbrand: 'Semua'
};

document.addEventListener("DOMContentLoaded", async function () {
  await loadArticlesFromManifest();

  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  // JIKA BERADA DI HALAMAN BACA (baca.html)
  if (document.getElementById('articleContainer')) {
    if (articleId) {
      renderSingleArticlePage(articleId);
    } else {
      window.location.href = 'index.html';
    }
  } 
  // JIKA BERADA DI HALAMAN PORTAL/KATALOG (index.html)
  else {
    checkUrlParams();
    applyFilters();
  }
});

// 1. MEMBACA MANIFEST.JSON & FETCH SEMUA FILE ARTIKEL TERDAFTAR
async function loadArticlesFromManifest() {
  allArticlesData = [];
  try {
    const resManifest = await fetch('info-artikel/manifest.json');
    if (!resManifest.ok) throw new Error("File info-artikel/manifest.json tidak ditemukan.");

    const articleFiles = await resManifest.json(); // Contoh: ["ART-01", "ART-02"]

    if (Array.isArray(articleFiles) && articleFiles.length > 0) {
      const fetchPromises = articleFiles.map(fileName => {
        const safeFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;

        return fetch(`info-artikel/${safeFileName}`)
          .then(res => res.ok ? res.json() : null)
          .catch(err => {
            console.error(`Gagal memuat artikel info-artikel/${safeFileName}:`, err);
            return null;
          });
      });

      const results = await Promise.all(fetchPromises);
      allArticlesData = results.filter(item => item !== null);
    }
  } catch (err) {
    console.log("Informasi:", err.message);
    allArticlesData = [];
  }
}

// 2. OTO-FILTER DARI QUERY PARAMETER URL (INDEX.HTML)
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');
  const subbrandParam = urlParams.get('subbrand');

  if (tagParam) {
    activeFilters.tag = tagParam;
    highlightActiveChip('tag', tagParam);
  }

  if (subbrandParam) {
    activeFilters.subbrand = subbrandParam;
    highlightActiveChip('subbrand', subbrandParam);
  }
}

// 3. HANDLER KLIK CHIP FILTER MULTI-KATEGORI
function clickFilterChip(buttonElem) {
  const group = buttonElem.getAttribute('data-group');
  const val = buttonElem.getAttribute('data-value');

  activeFilters[group] = val;

  const parent = buttonElem.parentElement;
  const chips = parent.querySelectorAll('.m-chip');
  chips.forEach(c => c.classList.remove('active'));
  buttonElem.classList.add('active');

  applyFilters();
}

// 4. HIGHLIGHT CHIP PROGRAMATIS
function highlightActiveChip(groupName, value) {
  const container = document.querySelector(`.m-chip[data-group="${groupName}"]`)?.parentElement;
  if (!container) return;

  const chips = container.querySelectorAll('.m-chip');
  chips.forEach(c => {
    if (c.getAttribute('data-value').toLowerCase() === value.toLowerCase()) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}

// 5. LOGIKA FILTER CERDAS & PENCARIAN REAL-TIME
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const searchKey = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = allArticlesData.filter(item => {
    const matchSearch = (item.judul || '').toLowerCase().includes(searchKey) ||
                        (item.penulis || '').toLowerCase().includes(searchKey) ||
                        (item.ringkasan || '').toLowerCase().includes(searchKey);

    const matchTag      = activeFilters.tag      === 'Semua' || (item.tag || '').toLowerCase() === activeFilters.tag.toLowerCase();
    const matchSubbrand = activeFilters.subbrand === 'Semua' || item.sub_brand === activeFilters.subbrand;

    return matchSearch && matchTag && matchSubbrand;
  });

  renderArticlesPortal(filtered);
  renderTrendingWidget();
}

// 6. REDIRECT KE HALAMAN BACA KHUSUS (BACA.HTML)
function openArticlePage(articleId) {
  window.location.href = `baca.html?id=${articleId}`;
}

// 7. RENDER KARTU ARTIKEL & FEATURED POST (INDEX.HTML)
function renderArticlesPortal(list) {
  const featuredContainer = document.getElementById('featuredArticleContainer');
  const grid = document.getElementById('articlesGrid');
  const empty = document.getElementById('emptyState');

  if (!grid) return;

  if (list.length === 0) {
    if (featuredContainer) featuredContainer.innerHTML = '';
    grid.innerHTML = '';
    if (empty) {
      empty.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📰</div>
        <h3 style="font-weight: 800; color: #0F172A; margin-bottom: 0.5rem;">Belum Ada Artikel</h3>
        <p style="color: #64748B; font-size: 0.9rem;">Tidak ditemukan artikel atau rilis berita yang sesuai dengan kriteria pencarianmu.</p>
        <button onclick="resetFilters()" class="btn-reset-text" style="margin-top: 1rem; text-decoration: underline;">Reset Filter</button>
      `;
      empty.style.display = 'block';
    }
    return;
  }

  if (empty) empty.style.display = 'none';

  // Pisahkan Featured Post
  const featuredItem = list.find(a => a.is_featured) || list[0];
  const regularItems = list.filter(a => a.id !== featuredItem.id);

  // Render Featured Post
  if (featuredContainer && featuredItem) {
    let featImg = featuredItem.gambar_header || 'https://via.placeholder.com/800x400?text=Header+Berita';
    if (!featImg.startsWith('http') && !featImg.startsWith('info-artikel/')) {
      featImg = `info-artikel/${featImg}`;
    }

    featuredContainer.innerHTML = `
      <div class="featured-card" onclick="openArticlePage('${featuredItem.id}')">
        <div class="featured-media">
          <span class="tag-badge ${getBadgeClass(featuredItem.tag)}">${featuredItem.tag || 'Berita'}</span>
          <img src="${featImg}" alt="${featuredItem.judul}" onerror="this.src='https://via.placeholder.com/800x400?text=Header+Berita'">
        </div>
        <div class="featured-body">
          <div class="meta-info">
            <span>✍️ ${featuredItem.penulis || 'Redaksi'}</span> • 
            <span>📅 ${featuredItem.tanggal_rilis || '-'}</span> • 
            <span>⏱️ ${featuredItem.estimasi_baca || '3 Min'}</span>
          </div>
          <h2 class="featured-title">${featuredItem.judul}</h2>
          <p class="featured-desc">${featuredItem.ringkasan || ''}</p>
        </div>
      </div>
    `;
  }

  // Render Grid Artikel Reguler
  let gridHtml = '';
  regularItems.forEach(item => {
    let imgSrc = item.gambar_header || 'https://via.placeholder.com/400x250?text=Berita';
    if (!imgSrc.startsWith('http') && !imgSrc.startsWith('info-artikel/')) {
      imgSrc = `info-artikel/${imgSrc}`;
    }

    gridHtml += `
      <article class="article-card" onclick="openArticlePage('${item.id}')">
        <div class="article-media">
          <span class="tag-badge ${getBadgeClass(item.tag)}">${item.tag || 'Berita'}</span>
          <img src="${imgSrc}" alt="${item.judul}" onerror="this.src='https://via.placeholder.com/400x250?text=Berita'">
        </div>
        <div class="article-body">
          <div class="meta-info">
            <span>📅 ${item.tanggal_rilis || '-'}</span> • 
            <span>⏱️ ${item.estimasi_baca || '3 Min'}</span>
          </div>
          <h3 class="article-title" title="${item.judul}">${item.judul}</h3>
          <p class="article-excerpt">${item.ringkasan || ''}</p>
        </div>
      </article>
    `;
  });

  grid.innerHTML = gridHtml;
}

// 8. RENDER WIDGET TRENDING / POPULER DI SIDEBAR
function renderTrendingWidget() {
  const container = document.getElementById('trendingList');
  if (!container) return;

  const sortedByViews = [...allArticlesData].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  let html = '';
  sortedByViews.forEach((item, index) => {
    html += `
      <div class="trending-item" onclick="openArticlePage('${item.id}')">
        <span class="trending-num">0${index + 1}</span>
        <div class="trending-info">
          <h4 class="trending-title">${item.judul}</h4>
          <span class="trending-meta">${item.tanggal_rilis || '-'} • 👁️ ${item.views || 0}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 9. RENDER HALAMAN BACA SINGLE ARTICLE (BACA.HTML)
async function renderSingleArticlePage(articleId) {
  const item = allArticlesData.find(a => a.id === articleId);
  const container = document.getElementById('articleContainer');
  if (!item || !container) return;

  document.title = `${item.judul} — Kelas Bisa`;

  // Increment Local Views Count
  item.views = (item.views || 0) + 1;

  // A. Fetch File Markdown (.md)
  let markdownText = "Gagal memuat isi artikel.";
  if (item.file_markdown) {
    let mdPath = item.file_markdown;
    if (!mdPath.startsWith('http') && !mdPath.startsWith('info-artikel/')) {
      mdPath = `info-artikel/${mdPath}`;
    }

    try {
      const resMd = await fetch(mdPath);
      if (resMd.ok) {
        markdownText = await resMd.text();
      }
    } catch (err) {
      console.error("Gagal membaca file markdown:", err);
    }
  }

  // B. Konversi Markdown ke HTML via Marked.js
  const parsedHtmlContent = (typeof marked !== 'undefined') 
    ? marked.parse(markdownText) 
    : `<p>${markdownText}</p>`;

  // C. Data LocalStorage (Like & Komentar)
  const likesData = JSON.parse(localStorage.getItem(`likes_art_${articleId}`) || '{"count": 18, "isLiked": false}');
  const commentsData = JSON.parse(localStorage.getItem(`comments_art_${articleId}`) || '[]');

  let commentsHtml = '';
  if (commentsData.length === 0) {
    commentsHtml = `<p class="no-comment-text" id="noCommentText">Belum ada tanggapan. Berikan tanggapan pertama kamu!</p>`;
  } else {
    commentsData.forEach(c => {
      commentsHtml += `
        <div class="comment-item">
          <strong>${c.nama}</strong>: ${c.teks}
          <span class="comment-time">${c.waktu}</span>
        </div>
      `;
    });
  }

  // D. Rekomendasi Program / Promo Widget
  let promoWidgetHtml = '';
  if (item.rekomendasi_program) {
    const promo = item.rekomendasi_program;
    const targetUrl = promo.tipe === 'ketal' 
      ? `../ketal/index.html?kode=${promo.kode_produk}` 
      : `../events/index.html?kode=${promo.kode_produk}`;

    promoWidgetHtml = `
      <div class="article-promo-box">
        <div class="promo-badge">💡 REKOMENDASI PROGRAM</div>
        <p class="promo-text">${promo.teks}</p>
        <a href="${targetUrl}" class="btn-promo-cta">Lihat Program Terkait ➔</a>
      </div>
    `;
  }

  let headerImg = item.gambar_header || 'https://via.placeholder.com/800x400?text=Header+Berita';
  if (!headerImg.startsWith('http') && !headerImg.startsWith('info-artikel/')) {
    headerImg = `info-artikel/${headerImg}`;
  }

  // E. Render Layout Halaman Utuh
  container.innerHTML = `
    <div class="reader-header-info">
      <span class="tag-badge ${getBadgeClass(item.tag)}">${item.tag || 'Berita'}</span>
      <h1 class="reader-article-title" style="margin-top: 10px;">${item.judul}</h1>
      <div class="reader-meta-bar">
        <span>✍️ ${item.penulis || 'Redaksi'}</span> • 
        <span>📅 ${item.tanggal_rilis || '-'}</span> • 
        <span>⏱️ ${item.estimasi_baca || '3 Min'}</span> • 
        <span>👁️ ${item.views} Dilihat</span>
      </div>
    </div>

    <div class="reader-header-media">
      <img src="${headerImg}" alt="${item.judul}" onerror="this.src='https://via.placeholder.com/800x400?text=Header+Berita'">
    </div>

    <!-- ISI MARKDOWN TERPARSED -->
    <div class="markdown-rendered-content">
      ${parsedHtmlContent}
    </div>

    ${promoWidgetHtml}

    <!-- ACTION BAR -->
    <div class="reader-action-bar">
      <button type="button" class="btn-ig-like ${likesData.isLiked ? 'liked' : ''}" id="likeBtn" onclick="toggleLikeArticle('${articleId}')">
        <span id="likeIcon">${likesData.isLiked ? '❤️' : '🤍'}</span>
        <span id="likeCount">${likesData.count}</span> Suka
      </button>
      <button type="button" class="btn-share-text" onclick="shareArticle('${item.judul}')">🔗 Bagikan Artikel</button>
    </div>

    <!-- KOMENTAR SECTION -->
    <div class="reader-comments-section">
      <h4 style="font-size: 0.95rem; margin: 0 0 12px 0; color: #0F172A; font-weight: 800;">💬 Kolom Komentar & Diskusi:</h4>
      <div class="ig-comments-list" id="commentsContainer">
        ${commentsHtml}
      </div>

      <form class="ig-comment-form" style="margin-top: 16px;" onsubmit="addCommentArticle(event, '${articleId}')">
        <input type="text" id="commentNameInput" placeholder="Nama..." required class="ig-input-name">
        <input type="text" id="commentTextInput" placeholder="Tulis komentar/tanggapan..." required class="ig-input-text">
        <button type="submit" class="btn-ig-send">Kirim</button>
      </form>
    </div>
  `;

  renderTrendingWidget();
}

// 10. TOGGLE LIKE LOCALSTORAGE
function toggleLikeArticle(articleId) {
  const likesData = JSON.parse(localStorage.getItem(`likes_art_${articleId}`) || '{"count": 18, "isLiked": false}');

  if (likesData.isLiked) {
    likesData.count -= 1;
    likesData.isLiked = false;
  } else {
    likesData.count += 1;
    likesData.isLiked = true;
  }

  localStorage.setItem(`likes_art_${articleId}`, JSON.stringify(likesData));

  const likeBtn = document.getElementById('likeBtn');
  const likeIcon = document.getElementById('likeIcon');
  const likeCount = document.getElementById('likeCount');

  if (likeBtn && likeIcon && likeCount) {
    likeCount.innerText = likesData.count;
    if (likesData.isLiked) {
      likeBtn.classList.add('liked');
      likeIcon.innerText = '❤️';
    } else {
      likeBtn.classList.remove('liked');
      likeIcon.innerText = '🤍';
    }
  }
}

// 11. TAMBAH KOMENTAR LOCALSTORAGE
function addCommentArticle(event, articleId) {
  event.preventDefault();
  const nameInput = document.getElementById('commentNameInput');
  const textInput = document.getElementById('commentTextInput');
  const container = document.getElementById('commentsContainer');
  const noCommentText = document.getElementById('noCommentText');

  if (!nameInput || !textInput || !container) return;

  const newComment = {
    nama: nameInput.value.trim(),
    teks: textInput.value.trim(),
    waktu: 'Baru saja'
  };

  const commentsData = JSON.parse(localStorage.getItem(`comments_art_${articleId}`) || '[]');
  commentsData.push(newComment);
  localStorage.setItem(`comments_art_${articleId}`, JSON.stringify(commentsData));

  if (noCommentText) noCommentText.remove();

  const commentElement = document.createElement('div');
  commentElement.className = 'comment-item';
  commentElement.innerHTML = `<strong>${newComment.nama}</strong>: ${newComment.teks} <span class="comment-time">${newComment.waktu}</span>`;
  container.appendChild(commentElement);

  textInput.value = '';
  container.scrollTop = container.scrollHeight;
}

// 12. HELPER BADGE COLOR PER TAG
function getBadgeClass(tag) {
  const t = (tag || '').toLowerCase();
  if (t === 'berita') return 'tag-news';
  if (t === 'pengumuman') return 'tag-announcement';
  if (t === 'artikel ilmiah') return 'tag-scientific';
  if (t === 'dokumentasi') return 'tag-doc';
  return 'tag-default';
}

// 13. BAGIKAN ARTIKEL
function shareArticle(title) {
  if (navigator.share) {
    navigator.share({
      title: title,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link artikel berhasil disalin ke clipboard!');
  }
}

// 14. RESET FILTER
function resetFilters() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  activeFilters = {
    tag: 'Semua',
    subbrand: 'Semua'
  };

  const chips = document.querySelectorAll('.m-chip');
  chips.forEach(c => {
    if (c.getAttribute('data-value') === 'Semua') {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });

  applyFilters();
}
