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

// 1. MEMBACA MANIFEST.JSON & FETCH SEMUA FILE EVENT TERDAFTAR
async function loadEventsFromManifest() {
  allEventsData = [];
  try {
    const resManifest = await fetch('info-event/manifest.json');
    if (!resManifest.ok) throw new Error("Gagal membaca manifest.json");
    
    const eventFiles = await resManifest.json(); // Array nama file, misal: ["TO01.json", ...]

    // Fetch secara paralel seluruh file event
    const fetchPromises = eventFiles.map(file => 
      fetch(`info-event/${file}`)
        .then(res => res.ok ? res.json() : null)
        .catch(err => {
          console.error(`Gagal memuat info-event/${file}:`, err);
          return null;
        })
    );

    const results = await Promise.all(fetchPromises);
    allEventsData = results.filter(item => item !== null);

  } catch (err) {
    console.error("Error pada Manifest Engine:", err);
  }
}

// 2. OTO-FILTER JIKA ADA QUERY PARAMETER DARI URL (MISAL: ?subbrand=Pilar Juara)
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

  // Highlight tombol aktif di dalam grupnya
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
    // Pencarian Teks (Nama, Kode, atau Deskripsi Singkat)
    const matchSearch = (item.nama_kegiatan || '').toLowerCase().includes(searchKey) ||
                        (item.kode_kegiatan || '').toLowerCase().includes(searchKey) ||
                        (item.deskripsi_singkat || '').toLowerCase().includes(searchKey);

    // Pencarian Filter Kategori
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

// 6. RENDER KARTU KE DALAM EVENT GRID CONTAINER
function renderEventsGrid(list) {
  const grid = document.getElementById('eventsGrid');
  const empty = document.getElementById('emptyState');

  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  let html = '';
  list.forEach((item, cardIdx) => {
    const isOpen = (item.status || '').toLowerCase() === 'open';
    const statusClass = isOpen ? 'open' : 'close';
    const statusLabel = isOpen ? 'Open' : 'Close';

    // Slider Gambar Poster (Multi-Image)
    const images = item.poster || [];
    let sliderContent = '';

    if (images.length > 0) {
      images.forEach((imgSrc, imgIdx) => {
        const activeClass = imgIdx === 0 ? 'active' : '';
        sliderContent += `
          <img src="${imgSrc}" class="slide-img ${activeClass}" id="slide-${cardIdx}-${imgIdx}" alt="Poster ${item.nama_kegiatan}" onerror="this.src='https://via.placeholder.com/400x250?text=Poster+Pelatihan'">
        `;
      });

      // Jika gambar lebih dari 1, tampilkan tombol navigasi slide
      if (images.length > 1) {
        sliderContent += `
          <button class="slider-btn prev" onclick="changeSlide(${cardIdx}, -1, ${images.length})">❮</button>
          <button class="slider-btn next" onclick="changeSlide(${cardIdx}, 1, ${images.length})">❯</button>
        `;
      }
    } else {
      sliderContent = `<img src="https://via.placeholder.com/400x250?text=Poster+Pelatihan" class="slide-img active">`;
    }

    // Format Link WA CS (Mencegah error tanpa http/https)
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
          <h3 class="card-title">${item.nama_kegiatan}</h3>

          <div class="info-list">
            <div><strong>Kode:</strong> ${item.kode_kegiatan || '-'}</div>
            <div><strong>Periode:</strong> ${item.periode_kegiatan || '-'}</div>
            <div><strong>Bulan:</strong> ${item.bulan_kegiatan || '-'}</div>
            <div><strong>Afiliasi:</strong> ${item.afiliasi || '-'}</div>
            <div><strong>Jenis:</strong> ${item.jenis_kegiatan || '-'}</div>
            <div><strong>Platform:</strong> ${item.format_platform || '-'}</div>
            <div><strong>Waktu:</strong> ${item.format_waktu || '-'}</div>
          </div>

          <p class="card-desc">${item.deskripsi_singkat || ''}</p>
        </div>

        <div class="card-actions">
          <a href="${item.link_checkout || '#'}" target="_blank" rel="noopener" class="btn-cta-checkout">
            Daftar / Checkout Sekarang
          </a>
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-cta-wa">
            💬 Hubungi CS via WA
          </a>
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

// 8. RESET SELURUH FILTER & PENCARIAN
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
