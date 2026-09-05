// MASTER DATA EVENTS SINKRON VIA MANIFEST
let allEventsData = [];

// OBJEK STATE FILTER
let activeFilters = {
  status: 'Semua',
  bulan: 'Semua',
  afiliasi: 'Semua',
  subbrand: 'Semua',
  jenis: 'Semua',
  platform: 'Semua',
  waktu: 'Semua'
};

document.addEventListener("DOMContentLoaded", async function () {
  await loadEventsFromManifest();
  checkUrlParams();
  applyFilters();
});

// 1. MEMBACA MANIFEST.JSON & FETCH SEMUA FILE EVENT TERDAFTAR SECARA REAL
async function loadEventsFromManifest() {
  allEventsData = [];
  try {
    const resManifest = await fetch('info-event/manifest.json');
    if (!resManifest.ok) throw new Error("File manifest.json tidak ditemukan atau kosong.");
    
    const eventFiles = await resManifest.json(); // Membaca: ["TO01", "ZM-SKD-2026", ...]

    if (Array.isArray(eventFiles) && eventFiles.length > 0) {
      const fetchPromises = eventFiles.map(fileName => {
        // Auto-fix: Tambahkan .json jika belum ada
        const safeFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
        
        return fetch(`info-event/${safeFileName}`)
          .then(res => res.ok ? res.json() : null)
          .catch(err => {
            console.error(`Gagal memuat file kegiatan info-event/${safeFileName}:`, err);
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

// 2. OTO-FILTER JIKA ADA QUERY PARAMETER DARI URL
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const subbrandParam = urlParams.get('subbrand');
  const jenisParam = urlParams.get('jenis');

  if (subbrandParam) {
    activeFilters.subbrand = subbrandParam;
    highlightActiveChip('subbrand', subbrandParam);
  }

  if (jenisParam) {
    activeFilters.jenis = jenisParam;
    highlightActiveChip('jenis', jenisParam);
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

// 4. HIGHLIGHT CHIP SECARA PROGRAMATIS (DARI URL)
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

// 5. LOGIKA FILTER CERDAS & PENCARIAN TEKS REAL-TIME
function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const searchKey = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = allEventsData.filter(item => {
    const matchSearch = (item.nama_kegiatan || '').toLowerCase().includes(searchKey) ||
                        (item.kode_kegiatan || '').toLowerCase().includes(searchKey) ||
                        (item.deskripsi_singkat || '').toLowerCase().includes(searchKey);

    const matchStatus   = activeFilters.status   === 'Semua' || (item.status || '').toLowerCase() === activeFilters.status.toLowerCase();
    const matchBulan    = activeFilters.bulan    === 'Semua' || item.bulan_kegiatan === activeFilters.bulan;
    const matchAfiliasi = activeFilters.afiliasi === 'Semua' || item.afiliasi === activeFilters.afiliasi;
    const matchSubbrand = activeFilters.subbrand === 'Semua' || item.sub_brand === activeFilters.subbrand;
    const matchJenis    = activeFilters.jenis    === 'Semua' || item.jenis_kegiatan === activeFilters.jenis;
    const matchPlatform = activeFilters.platform === 'Semua' || item.format_platform === activeFilters.platform;
    const matchWaktu    = activeFilters.waktu    === 'Semua' || item.format_waktu === activeFilters.waktu;

    return matchSearch && matchStatus && matchBulan && matchAfiliasi && matchSubbrand && matchJenis && matchPlatform && matchWaktu;
  });

  renderEventsGrid(filtered);
}

// 6. RENDER KARTU MINIMALIS KE DALAM EVENT GRID CONTAINER (ALA TOKOPEDIA)
function renderEventsGrid(list) {
  const grid = document.getElementById('eventsGrid');
  const empty = document.getElementById('emptyState');

  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = '';
    if (empty) {
      empty.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📅</div>
        <h3 style="font-weight: 800; color: var(--eco-text-main, #31353B); margin-bottom: 0.5rem;">Belum Ada Kegiatan Aktif</h3>
        <p style="color: #6C727C; font-size: 0.9rem;">Saat ini belum ada jadwal kegiatan atau pendaftaran yang dibuka. Silakan cek kembali secara berkala.</p>
        <button onclick="resetFilters()" class="btn-reset-text" style="margin-top: 1rem; text-decoration: underline;">Reset Filter</button>
      `;
      empty.style.display = 'block';
    }
    return;
  }

  if (empty) empty.style.display = 'none';

  let html = '';
  list.forEach((item, cardIdx) => {
    const isOpen = (item.status || '').toLowerCase() === 'open';
    const statusClass = isOpen ? 'open' : 'close';
    const statusLabel = isOpen ? 'Open' : 'Close';

    // Formatting Harga (0 = GRATIS, >0 = Rp Nominal)
    const priceVal = Number(item.harga) || 0;
    const priceDisplay = priceVal === 0 
      ? `<span class="price-badge free">GRATIS</span>` 
      : `<span class="price-amount">Rp ${priceVal.toLocaleString('id-ID')}</span>`;

    // Slider Gambar Poster Utama
    const rawImages = item.poster || item.gambar_poster || [];
    let sliderContent = '';

    if (rawImages.length > 0) {
      rawImages.forEach((imgSrc, imgIdx) => {
        let finalSrc = imgSrc;
        if (!finalSrc.startsWith('http') && !finalSrc.startsWith('info-event/')) {
          finalSrc = `info-event/${finalSrc}`;
        }

        const activeClass = imgIdx === 0 ? 'active' : '';
        sliderContent += `
          <img src="${finalSrc}" class="slide-img ${activeClass}" id="slide-${cardIdx}-${imgIdx}" alt="Poster ${item.nama_kegiatan}" onerror="this.src='https://via.placeholder.com/400x400?text=Poster+Pelatihan'">
        `;
      });

      if (rawImages.length > 1) {
        sliderContent += `
          <button class="slider-btn prev" onclick="event.stopPropagation(); changeSlide(${cardIdx}, -1, ${rawImages.length})">❮</button>
          <button class="slider-btn next" onclick="event.stopPropagation(); changeSlide(${cardIdx}, 1, ${rawImages.length})">❯</button>
        `;
      }
    } else {
      sliderContent = `<img src="https://via.placeholder.com/400x400?text=Poster+Pelatihan" class="slide-img active">`;
    }

    // Format Link WA CS
    let waUrl = item.link_wa_cs || 'wa.me/082268118842';
    if (!waUrl.startsWith('http://') && !waUrl.startsWith('https://')) {
      waUrl = 'https://' + waUrl;
    }

    html += `
      <div class="event-card">
        <div class="card-slider">
          <span class="status-badge ${statusClass}">${statusLabel} • ${item.sub_brand || 'Kelas Bisa'}</span>
          ${sliderContent}
        </div>

        <div class="card-body">
          <h3 class="card-title" title="${item.nama_kegiatan}">${item.nama_kegiatan}</h3>
          
          <div class="card-price-box">
            ${priceDisplay}
          </div>

          <div class="card-actions">
            <button onclick="openDetailModal('${item.kode_kegiatan}')" class="btn-cta-detail">
              👁️ Lihat Detail Produk
            </button>
            <a href="${item.link_checkout || '#'}" target="_blank" rel="noopener" class="btn-cta-checkout">
              🛒 Daftar / Checkout
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

// 8. POP-UP MODAL OVERLAY ENGINE ALA INSTAGRAM WEB
function openDetailModal(kodeKegiatan) {
  const item = allEventsData.find(e => e.kode_kegiatan === kodeKegiatan);
  if (!item) return;

  const modal = document.getElementById('detailModal');
  const modalBody = document.getElementById('modalBody');

  const priceVal = Number(item.harga) || 0;
  const priceDisplay = priceVal === 0 ? 'GRATIS' : `Rp ${priceVal.toLocaleString('id-ID')}`;

  let waUrl = item.link_wa_cs || 'wa.me/082268118842';
  if (!waUrl.startsWith('http://') && !waUrl.startsWith('https://')) {
    waUrl = 'https://' + waUrl;
  }

  // A. Carousel Poster Gambar Besar untuk Modal
  const rawImages = item.poster || item.gambar_poster || [];
  let modalSliderContent = '';

  if (rawImages.length > 0) {
    rawImages.forEach((imgSrc, imgIdx) => {
      let finalSrc = imgSrc;
      if (!finalSrc.startsWith('http') && !finalSrc.startsWith('info-event/')) {
        finalSrc = `info-event/${finalSrc}`;
      }

      const activeClass = imgIdx === 0 ? 'active' : '';
      modalSliderContent += `
        <img src="${finalSrc}" class="modal-slide-img ${activeClass}" id="modal-slide-${imgIdx}" alt="Poster ${item.nama_kegiatan}" onerror="this.src='https://via.placeholder.com/600x600?text=Poster+Pelatihan'">
      `;
    });

    if (rawImages.length > 1) {
      modalSliderContent += `
        <button class="modal-slider-btn prev" onclick="changeModalSlide(-1, ${rawImages.length})">❮</button>
        <button class="modal-slider-btn next" onclick="changeModalSlide(1, ${rawImages.length})">❯</button>
      `;
    }
  } else {
    modalSliderContent = `<img src="https://via.placeholder.com/600x600?text=Poster+Pelatihan" class="modal-slide-img active">`;
  }

  // B. Data LocalStorage (Like & Komentar Permanen)
  const likesData = JSON.parse(localStorage.getItem(`likes_${kodeKegiatan}`) || '{"count": 12, "isLiked": false}');
  const commentsData = JSON.parse(localStorage.getItem(`comments_${kodeKegiatan}`) || '[]');

  let commentsHtml = '';
  if (commentsData.length === 0) {
    commentsHtml = `<p class="no-comment-text" id="noCommentText">Belum ada diskusi. Jadilah yang pertama bertanya!</p>`;
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

  // C. Render Layout Instagram Web Style
  modalBody.innerHTML = `
    <div class="ig-modal-grid">
      
      <!-- SISI KIRI: CAROUSEL POSTER GAMBAR BESAR -->
      <div class="ig-modal-media">
        ${modalSliderContent}
      </div>

      <!-- SISI KANAN: PANEL DETAIL & DISKUSI INTERAKTIF -->
      <div class="ig-modal-side">
        
        <!-- HEADER BRAND -->
        <div class="ig-side-header">
          <div class="ig-user-info">
            <span class="ig-avatar">🎓</span>
            <div>
              <div class="ig-username">${item.sub_brand || 'Kelas Bisa'}</div>
              <div class="ig-subtext">${item.jenis_kegiatan || 'Event'} • ${item.afiliasi || 'Kelas Bisa'}</div>
            </div>
          </div>
        </div>

        <!-- BODY INFO & DISKUSI (SCROLLABLE) -->
        <div class="ig-side-body">
          <h2 class="ig-event-title">${item.nama_kegiatan}</h2>
          <div class="ig-price-tag">${priceDisplay}</div>

          <div class="ig-info-table">
            <div><strong>Kode:</strong> ${item.kode_kegiatan || '-'}</div>
            <div><strong>Periode:</strong> ${item.periode_kegiatan || '-'}</div>
            <div><strong>Bulan:</strong> ${item.bulan_kegiatan || '-'}</div>
            <div><strong>Platform:</strong> ${item.format_platform || '-'} (${item.format_waktu || '-'})</div>
            <div><strong>Status:</strong> <span class="badge-${(item.status || '').toLowerCase()}">${item.status || '-'}</span></div>
          </div>

          <div class="ig-desc-box">
            <p>${item.deskripsi_singkat || 'Belum ada deskripsi khusus.'}</p>
          </div>

          <hr class="ig-divider">

          <!-- KONTEN DISKUSI / KOMENTAR -->
          <div class="ig-comments-list" id="commentsContainer">
            ${commentsHtml}
          </div>
        </div>

        <!-- FOOTER ACTION: LIKE, FORM KOMENTAR, TOMBOL CHECKOUT -->
        <div class="ig-side-footer">
          
          <div class="ig-action-bar">
            <button class="btn-ig-like ${likesData.isLiked ? 'liked' : ''}" id="likeBtn" onclick="toggleLike('${kodeKegiatan}')">
              <span id="likeIcon">${likesData.isLiked ? '❤️' : '🤍'}</span>
              <span id="likeCount">${likesData.count}</span> Suka
            </button>
            <span class="ig-wa-cs-link"><a href="${waUrl}" target="_blank" rel="noopener">💬 Tanya CS via WA</a></span>
          </div>

          <!-- INPUT KOMENTAR REAL-TIME -->
          <form class="ig-comment-form" onsubmit="addComment(event, '${kodeKegiatan}')">
            <input type="text" id="commentNameInput" placeholder="Nama..." required class="ig-input-name">
            <input type="text" id="commentTextInput" placeholder="Tulis pertanyaan..." required class="ig-input-text">
            <button type="submit" class="btn-ig-send">Kirim</button>
          </form>

          <a href="${item.link_checkout || '#'}" target="_blank" rel="noopener" class="btn-cta-checkout ig-checkout-btn">
            🛒 Beli / Daftar Sekarang
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

// 9. NAVIGASI SLIDER POSTER DI POP-UP MODAL
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

// 10. LOGIKA TOGGLE LIKE (DISIMPAN PERMANEN DI LOCALSTORAGE)
function toggleLike(kodeKegiatan) {
  const likesData = JSON.parse(localStorage.getItem(`likes_${kodeKegiatan}`) || '{"count": 12, "isLiked": false}');
  
  if (likesData.isLiked) {
    likesData.count -= 1;
    likesData.isLiked = false;
  } else {
    likesData.count += 1;
    likesData.isLiked = true;
  }

  localStorage.setItem(`likes_${kodeKegiatan}`, JSON.stringify(likesData));

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

// 11. LOGIKA TAMBAH KOMENTAR (DISIMPAN PERMANEN DI LOCALSTORAGE)
function addComment(event, kodeKegiatan) {
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

  const commentsData = JSON.parse(localStorage.getItem(`comments_${kodeKegiatan}`) || '[]');
  commentsData.push(newComment);
  localStorage.setItem(`comments_${kodeKegiatan}`, JSON.stringify(commentsData));

  if (noCommentText) noCommentText.remove();

  const commentElement = document.createElement('div');
  commentElement.className = 'comment-item';
  commentElement.innerHTML = `<strong>${newComment.nama}</strong>: ${newComment.teks} <span class="comment-time">${newComment.waktu}</span>`;
  container.appendChild(commentElement);

  textInput.value = '';
  container.scrollTop = container.scrollHeight;
}

// 12. RESET SELURUH FILTER & PENCARIAN
function resetFilters() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  activeFilters = {
    status: 'Semua',
    bulan: 'Semua',
    afiliasi: 'Semua',
    subbrand: 'Semua',
    jenis: 'Semua',
    platform: 'Semua',
    waktu: 'Semua'
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
