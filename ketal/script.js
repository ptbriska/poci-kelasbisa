// MASTER DATA KETAL SINKRON VIA MANIFEST
let allEventsData = [];

// OBJEK STATE FILTER KETAL
let activeFilters = {
  level: 'Semua',
  kategori: 'Semua',
  waktu: 'Semua',
  afiliasi: 'Semua',
  subbrand: 'Semua'
};

document.addEventListener("DOMContentLoaded", async function () {
  await loadEventsFromManifest();
  checkUrlParams();
  applyFilters();
});

// 1. MEMBACA MANIFEST.JSON & FETCH SEMUA FILE KURSUS TERDAFTAR
async function loadEventsFromManifest() {
  allEventsData = [];
  try {
    const resManifest = await fetch('info-ketal/manifest.json');
    if (!resManifest.ok) throw new Error("File info-ketal/manifest.json tidak ditemukan.");

    const eventFiles = await resManifest.json(); // Membaca: ["KTL-WEB-01", ...]

    if (Array.isArray(eventFiles) && eventFiles.length > 0) {
      const fetchPromises = eventFiles.map(fileName => {
        const safeFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;

        return fetch(`info-ketal/${safeFileName}`)
          .then(res => res.ok ? res.json() : null)
          .catch(err => {
            console.error(`Gagal memuat kursus info-ketal/${safeFileName}:`, err);
            return null;
          });
      });

      const results = await Promise.all(fetchPromises);
      allEventsData = results.filter(item => item !== null);
    }
  } catch (err) {
    console.log("Informasi:", err.message);
    allEventsData = [];
  }
}

// 2. OTO-FILTER DARI QUERY PARAMETER URL
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const subbrandParam = urlParams.get('subbrand');
  const kategoriParam = urlParams.get('kategori');

  if (subbrandParam) {
    activeFilters.subbrand = subbrandParam;
    highlightActiveChip('subbrand', subbrandParam);
  }

  if (kategoriParam) {
    activeFilters.kategori = kategoriParam;
    highlightActiveChip('kategori', kategoriParam);
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

  const filtered = allEventsData.filter(item => {
    const matchSearch = (item.nama_produk || '').toLowerCase().includes(searchKey) ||
                        (item.kode_produk || '').toLowerCase().includes(searchKey) ||
                        (item.trainer || '').toLowerCase().includes(searchKey) ||
                        (item.deskripsi || '').toLowerCase().includes(searchKey);

    const matchLevel    = activeFilters.level    === 'Semua' || (item.level || '').toLowerCase() === activeFilters.level.toLowerCase();
    const matchKategori = activeFilters.kategori === 'Semua' || item.kategori === activeFilters.kategori;
    const matchWaktu    = activeFilters.waktu    === 'Semua' || item.format_waktu === activeFilters.waktu;
    const matchAfiliasi = activeFilters.afiliasi === 'Semua' || item.afiliasi === activeFilters.afiliasi;
    const matchSubbrand = activeFilters.subbrand === 'Semua' || item.sub_brand === activeFilters.subbrand;

    return matchSearch && matchLevel && matchKategori && matchWaktu && matchAfiliasi && matchSubbrand;
  });

  renderEventsGrid(filtered);
}

// 6. RENDER KARTU KURSUS KETAL
function renderEventsGrid(list) {
  const grid = document.getElementById('eventsGrid');
  const empty = document.getElementById('emptyState');

  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = '';
    if (empty) {
      empty.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎥</div>
        <h3 style="font-weight: 800; color: var(--eco-text-main, #31353B); margin-bottom: 0.5rem;">Belum Ada Modul Kursus</h3>
        <p style="color: #6C727C; font-size: 0.9rem;">Saat ini belum ada materi video yang cocok dengan filter kamu. Silakan coba filter lain.</p>
        <button onclick="resetFilters()" class="btn-reset-text" style="margin-top: 1rem; text-decoration: underline;">Reset Filter</button>
      `;
      empty.style.display = 'block';
    }
    return;
  }

  if (empty) empty.style.display = 'none';

  let html = '';
  list.forEach((item, cardIdx) => {
    // Format Harga
    const priceVal = Number(item.harga) || 0;
    const priceDisplay = priceVal === 0
      ? `<span class="price-badge free">GRATIS</span>`
      : `<span class="price-amount">Rp ${priceVal.toLocaleString('id-ID')}</span>`;

    // Slider Poster Gambar
    const rawImages = item.poster || [];
    let sliderContent = '';

    if (rawImages.length > 0) {
      rawImages.forEach((imgSrc, imgIdx) => {
        let finalSrc = imgSrc;
        if (!finalSrc.startsWith('http') && !finalSrc.startsWith('info-ketal/')) {
          finalSrc = `info-ketal/${finalSrc}`;
        }

        const activeClass = imgIdx === 0 ? 'active' : '';
        sliderContent += `
          <img src="${finalSrc}" class="slide-img ${activeClass}" id="slide-${cardIdx}-${imgIdx}" alt="Poster ${item.nama_produk}" onerror="this.src='https://via.placeholder.com/400x400?text=Katalog+Video+LMS'">
        `;
      });

      if (rawImages.length > 1) {
        sliderContent += `
          <button class="slider-btn prev" onclick="event.stopPropagation(); changeSlide(${cardIdx}, -1, ${rawImages.length})">❮</button>
          <button class="slider-btn next" onclick="event.stopPropagation(); changeSlide(${cardIdx}, 1, ${rawImages.length})">❯</button>
        `;
      }
    } else {
      sliderContent = `<img src="https://via.placeholder.com/400x400?text=Katalog+Video+LMS" class="slide-img active">`;
    }

    // Format Link WA CS
    let waUrl = item.link_wa || 'wa.me/082268118842';
    if (!waUrl.startsWith('http://') && !waUrl.startsWith('https://')) {
      waUrl = 'https://' + waUrl;
    }

    html += `
      <div class="event-card">
        <div class="card-slider">
          <span class="status-badge open">${item.level || 'All Level'} • ${item.sub_brand || 'Kelas Bisa'}</span>
          ${sliderContent}
        </div>

        <div class="card-body">
          <h3 class="card-title" title="${item.nama_produk}">${item.nama_produk}</h3>

          <div class="card-price-box">
            ${priceDisplay}
          </div>

          <div class="card-actions">
            <button onclick="openDetailModal('${item.kode_produk}')" class="btn-cta-detail">
              👁️ Lihat Detail & Preview
            </button>
            <a href="${item.link_checkout || '#'}" target="_blank" rel="noopener" class="btn-cta-checkout">
              🛒 Beli / Akses Sekarang
            </a>
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-cta-wa">
              💬 Hubungi CS via WA
            </a>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

// 7. NAVIGASI SLIDER POSTER PER KARTU
function changeSlide(cardIdx, direction, totalImgs) {
  let currentIdx = 0;

  for (let i = 0; i < totalImgs; i++) {
    const img = document.getElementById(`slide-${cardIdx}-${i}`);
    if (img && img.classList.contains('active')) {
      currentIdx = i;
      img.classList.remove('active');
      break;
    }
  }

  let nextIdx = currentIdx + direction;
  if (nextIdx >= totalImgs) nextIdx = 0;
  if (nextIdx < 0) nextIdx = totalImgs - 1;

  const nextImg = document.getElementById(`slide-${cardIdx}-${nextIdx}`);
  if (nextImg) nextImg.classList.add('active');
}

// 8. POP-UP MODAL OVERLAY ENGINE KETAL (INSTAGRAM WEB STYLE + VIDEO TEASER)
function openDetailModal(kodeProduk) {
  const item = allEventsData.find(e => e.kode_produk === kodeProduk);
  if (!item) return;

  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');

  const priceVal = Number(item.harga) || 0;
  const priceDisplay = priceVal === 0 ? 'GRATIS' : `Rp ${priceVal.toLocaleString('id-ID')}`;

  let waUrl = item.link_wa || 'wa.me/082268118842';
  if (!waUrl.startsWith('http://') && !waUrl.startsWith('https://')) {
    waUrl = 'https://' + waUrl;
  }

  // A. Slider Poster
  const rawImages = item.poster || [];
  let modalSliderContent = '';

  if (rawImages.length > 0) {
    rawImages.forEach((imgSrc, imgIdx) => {
      let finalSrc = imgSrc;
      if (!finalSrc.startsWith('http') && !finalSrc.startsWith('info-ketal/')) {
        finalSrc = `info-ketal/${finalSrc}`;
      }

      const activeClass = imgIdx === 0 ? 'active' : '';
      modalSliderContent += `
        <img src="${finalSrc}" class="modal-slide-img ${activeClass}" id="modal-slide-${imgIdx}" alt="Poster ${item.nama_produk}" onerror="this.src='https://via.placeholder.com/600x600?text=Katalog+Video+LMS'">
      `;
    });

    if (rawImages.length > 1) {
      modalSliderContent += `
        <button class="modal-slider-btn prev" onclick="changeModalSlide(-1, ${rawImages.length})">❮</button>
        <button class="modal-slider-btn next" onclick="changeModalSlide(1, ${rawImages.length})">❯</button>
      `;
    }
  } else {
    modalSliderContent = `<img src="https://via.placeholder.com/600x600?text=Katalog+Video+LMS" class="modal-slide-img active">`;
  }

  // B. Video Teaser (Kondisional: jika link_video diisi)
  let videoPreviewHtml = '';
  if (item.link_video && item.link_video.trim() !== '') {
    videoPreviewHtml = `
      <div class="ig-video-section">
        <h4 style="font-size: 0.88rem; margin: 0 0 8px 0; color: var(--eco-dark);">📺 Preview / Video Teaser Materi:</h4>
        <div class="video-embed-container">
          <iframe src="${item.link_video}" title="Preview Video ${item.nama_produk}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>
    `;
  }

  // C. Data LocalStorage (Like & Komentar)
  const likesData = JSON.parse(localStorage.getItem(`likes_${kodeProduk}`) || '{"count": 25, "isLiked": false}');
  const commentsData = JSON.parse(localStorage.getItem(`comments_${kodeProduk}`) || '[]');

  let commentsHtml = '';
  if (commentsData.length === 0) {
    commentsHtml = `<p class="no-comment-text" id="noCommentText">Belum ada diskusi. Silakan tanyakan hal terkait materi ini!</p>`;
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

  // D. Render Modal Content
  modalBody.innerHTML = `
    <div class="ig-modal-grid">

      <!-- SISI KIRI: POSTER CAROUSEL -->
      <div class="ig-modal-media">
        ${modalSliderContent}
      </div>

      <!-- SISI KANAN: PANEL DETAIL, VIDEO TEASER & DISKUSI -->
      <div class="ig-modal-side">

        <!-- HEADER BRAND -->
        <div class="ig-side-header">
          <div class="ig-user-info">
            <span class="ig-avatar">🎥</span>
            <div>
              <div class="ig-username">${item.sub_brand || 'Kelas Bisa'}</div>
              <div class="ig-subtext">${item.kategori || 'Video LMS'} • ${item.afiliasi || 'Kelas Bisa'}</div>
            </div>
          </div>
        </div>

        <!-- BODY INFO, VIDEO TEASER, & DISKUSI (SCROLLABLE) -->
        <div class="ig-side-body">
          <h2 class="ig-event-title">${item.nama_produk}</h2>
          <div class="ig-price-tag">${priceDisplay}</div>

          <div class="ig-info-table">
            <div><strong>Kode Kursus:</strong> ${item.kode_produk || '-'}</div>
            <div><strong>Level:</strong> <span style="text-transform: capitalize;">${item.level || '-'}</span></div>
            <div><strong>Format Waktu:</strong> ${item.format_waktu || '-'}</div>
            <div><strong>Total Durasi:</strong> ${item.total_durasi || '-'}</div>
            <div><strong>Total Modul:</strong> ${item.total_modul || '-'}</div>
            <div><strong>Trainer/Instruktur:</strong> ${item.trainer || '-'}</div>
          </div>

          <div class="ig-desc-box">
            <p>${item.deskripsi || 'Belum ada deskripsi khusus.'}</p>
          </div>

          ${videoPreviewHtml}

          <hr class="ig-divider">

          <!-- KONTEN DISKUSI / KOMENTAR -->
          <div class="ig-comments-list" id="commentsContainer">
            ${commentsHtml}
          </div>
        </div>

        <!-- FOOTER ACTION -->
        <div class="ig-side-footer">

          <div class="ig-action-bar">
            <button class="btn-ig-like ${likesData.isLiked ? 'liked' : ''}" id="likeBtn" onclick="toggleLike('${kodeProduk}')">
              <span id="likeIcon">${likesData.isLiked ? '❤️' : '🤍'}</span>
              <span id="likeCount">${likesData.count}</span> Suka
            </button>
            <span class="ig-wa-cs-link"><a href="${waUrl}" target="_blank" rel="noopener">💬 Tanya CS via WA</a></span>
          </div>

          <!-- INPUT KOMENTAR -->
          <form class="ig-comment-form" onsubmit="addComment(event, '${kodeProduk}')">
            <input type="text" id="commentNameInput" placeholder="Nama..." required class="ig-input-name">
            <input type="text" id="commentTextInput" placeholder="Tulis pertanyaan..." required class="ig-input-text">
            <button type="submit" class="btn-ig-send">Kirim</button>
          </form>

          <a href="${item.link_checkout || '#'}" target="_blank" rel="noopener" class="btn-cta-checkout ig-checkout-btn">
            🛒 Beli / Akses Kursus Sekarang
          </a>
        </div>

      </div>

    </div>
  `;

  if (modal) modal.style.display = 'flex';
}

function closeDetailModal(event) {
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
}

// 9. NAVIGASI SLIDER POSTER MODAL
function changeModalSlide(direction, totalImgs) {
  let currentIdx = 0;
  for (let i = 0; i < totalImgs; i++) {
    const img = document.getElementById(`modal-slide-${i}`);
    if (img && img.classList.contains('active')) {
      currentIdx = i;
      img.classList.remove('active');
      break;
    }
  }
  let nextIdx = currentIdx + direction;
  if (nextIdx >= totalImgs) nextIdx = 0;
  if (nextIdx < 0) nextIdx = totalImgs - 1;

  const nextImg = document.getElementById(`modal-slide-${nextIdx}`);
  if (nextImg) nextImg.classList.add('active');
}

// 10. TOGGLE LIKE LOCALSTORAGE
function toggleLike(kodeProduk) {
  const likesData = JSON.parse(localStorage.getItem(`likes_${kodeProduk}`) || '{"count": 25, "isLiked": false}');

  if (likesData.isLiked) {
    likesData.count -= 1;
    likesData.isLiked = false;
  } else {
    likesData.count += 1;
    likesData.isLiked = true;
  }

  localStorage.setItem(`likes_${kodeProduk}`, JSON.stringify(likesData));

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
function addComment(event, kodeProduk) {
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

  const commentsData = JSON.parse(localStorage.getItem(`comments_${kodeProduk}`) || '[]');
  commentsData.push(newComment);
  localStorage.setItem(`comments_${kodeProduk}`, JSON.stringify(commentsData));

  if (noCommentText) noCommentText.remove();

  const commentElement = document.createElement('div');
  commentElement.className = 'comment-item';
  commentElement.innerHTML = `<strong>${newComment.nama}</strong>: ${newComment.teks} <span class="comment-time">${newComment.waktu}</span>`;
  container.appendChild(commentElement);

  textInput.value = '';
  container.scrollTop = container.scrollHeight;
}

// 12. RESET FILTER
function resetFilters() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  activeFilters = {
    level: 'Semua',
    kategori: 'Semua',
    waktu: 'Semua',
    afiliasi: 'Semua',
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
