/**
 * SHOWROOM EVENTS - MANIFEST ENGINE (ROBUST & AUTOMATIC POSTER DETECTION)
 */

let eventsData = [];
let activeFilters = {
  search: "",
  status: "ALL",
  bulan: "ALL",
  afiliasi: "ALL",
  subBrand: "ALL",
  jenis: "ALL",
  platform: "ALL",
  waktu: "ALL"
};

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  await loadEventsFromManifest();
  setupFilterListeners();
  setupSearchListener();
  renderEvents();
}

// 1. MEMBACA MANIFEST.JSON MANUAL
async function loadEventsFromManifest() {
  try {
    // Read manifest.json
    const manifestRes = await fetch("info-event/manifest.json");
    if (!manifestRes.ok) throw new Error("File info-event/manifest.json tidak ditemukan!");
    
    const kodeList = await manifestRes.json();

    // Fetch semua JSON berdasarkan Kode secara paralel
    const fetchPromises = kodeList.map(async (kode) => {
      try {
        const res = await fetch(`info-event/${kode}.json`);
        if (!res.ok) return null;
        
        const data = await res.json();

        // Autodetect / Fallback Poster jika di JSON tidak didefinisikan
        if (!data.poster || data.poster.length === 0) {
          data.poster = [
            `info-event/${kode}.png`,
            `info-event/${kode}-1.png`
          ];
        }

        return data;
      } catch (err) {
        console.warn(`Gagal memuat event dengan kode: ${kode}`, err);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Filter data yang valid & buang yang error/null
    eventsData = results.filter((item) => item !== null && item.nama_kegiatan);

  } catch (error) {
    console.error("Sistem gagal memuat manifest:", error);
  }
}

// 2. RENDER CARD & SLIDER POSTER
function renderEvents() {
  const gridContainer = document.getElementById("eventsGrid");
  const emptyState = document.getElementById("emptyState");
  gridContainer.innerHTML = "";

  const filteredEvents = filterEvents(eventsData);

  if (filteredEvents.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  filteredEvents.forEach((event) => {
    const card = createEventCard(event);
    gridContainer.appendChild(card);
  });
}

function createEventCard(event) {
  const card = document.createElement("article");
  card.className = "event-card";

  // Penanganan Poster
  const posters = Array.isArray(event.poster) ? event.poster : [event.poster];
  const isMultiplePosters = posters.length > 1;

  // Jika gambar gagal dimuat (misal file poster ke-2 tidak ada), onError akan menyembunyikan slide tersebut
  const postersHTML = posters
    .map((imgSrc, index) => `
      <img src="${imgSrc}" 
           alt="${event.nama_kegiatan} - Poster ${index + 1}" 
           loading="lazy" 
           onerror="this.onerror=null; if(${index} > 0) { this.remove(); } else { this.src='https://via.placeholder.com/400x500?text=Poster+Tidak+Ada'; }">
    `)
    .join("");

  const sliderControlsHTML = isMultiplePosters
    ? `<button class="slider-btn prev" onclick="moveSlide(this, -1)">&lt;</button>
       <button class="slider-btn next" onclick="moveSlide(this, 1)">&gt;</button>`
    : "";

  const statusClass = event.status && event.status.toLowerCase() === "open" ? "badge-open" : "badge-close";

  card.innerHTML = `
    <div class="card-poster-container">
      <div class="card-badges">
        <span class="badge ${statusClass}">${event.status || 'Close'}</span>
        <span class="badge badge-brand">${event.sub_brand || ''}</span>
      </div>
      <div class="slider-wrapper" data-current-index="0" data-total-slides="${posters.length}">
        ${postersHTML}
      </div>
      ${sliderControlsHTML}
    </div>

    <div class="card-content">
      <h3 class="card-title">${event.nama_kegiatan}</h3>
      <div class="card-code">Kode: ${event.kode_kegiatan}</div>

      <div class="card-meta-list">
        <div class="meta-item"><span class="meta-label">Periode:</span> <strong>${event.periode_kegiatan}</strong></div>
        <div class="meta-item"><span class="meta-label">Bulan:</span> <strong>${event.bulan_kegiatan}</strong></div>
        <div class="meta-item"><span class="meta-label">Afiliasi:</span> <strong>${event.afiliasi}</strong></div>
        <div class="meta-item"><span class="meta-label">Jenis:</span> <strong>${event.jenis_kegiatan}</strong></div>
        <div class="meta-item"><span class="meta-label">Platform:</span> <strong>${event.format_platform}</strong></div>
        <div class="meta-item"><span class="meta-label">Waktu:</span> <strong>${event.format_waktu}</strong></div>
      </div>

      <p class="card-description">${event.deskripsi_singkat}</p>

      <div class="card-actions">
        <a href="${event.link_checkout}" target="_blank" rel="noopener noreferrer" class="btn-checkout">
          Daftar / Checkout Sekarang
        </a>
        <a href="${formatWaLink(event.link_wa_cs)}" target="_blank" rel="noopener noreferrer" class="btn-wa">
          Hubungi CS via WA
        </a>
      </div>
    </div>
  `;

  return card;
}

// Global Function untuk Image Slider/Carousel
window.moveSlide = function (button, direction) {
  const container = button.closest(".card-poster-container");
  const wrapper = container.querySelector(".slider-wrapper");
  const images = wrapper.querySelectorAll("img");
  
  if (images.length <= 1) return;

  let currentIndex = parseInt(wrapper.getAttribute("data-current-index"));
  const totalSlides = images.length;

  currentIndex = (currentIndex + direction + totalSlides) % totalSlides;
  
  wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
  wrapper.setAttribute("data-current-index", currentIndex);
};

// Formatting WA Link
function formatWaLink(link) {
  if (!link) return "https://wa.me/082268118842";
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

// 3. FILTER ENGINE & EVENT LISTENERS
function filterEvents(data) {
  return data.filter((item) => {
    const searchTarget = `${item.nama_kegiatan} ${item.kode_kegiatan} ${item.deskripsi_singkat}`.toLowerCase();
    const matchesSearch = !activeFilters.search || searchTarget.includes(activeFilters.search.toLowerCase());

    return (
      matchesSearch &&
      matchValue(item.status, activeFilters.status) &&
      matchValue(item.bulan_kegiatan, activeFilters.bulan) &&
      matchValue(item.afiliasi, activeFilters.afiliasi) &&
      matchValue(item.sub_brand, activeFilters.subBrand) &&
      matchValue(item.jenis_kegiatan, activeFilters.jenis) &&
      matchValue(item.format_platform, activeFilters.platform) &&
      matchValue(item.format_waktu, activeFilters.waktu)
    );
  });
}

function matchValue(itemValue, filterValue) {
  if (filterValue === "ALL") return true;
  if (!itemValue) return false;
  return itemValue.toLowerCase() === filterValue.toLowerCase();
}

function setupFilterListeners() {
  const filterMap = [
    { containerId: "filterStatus", key: "status" },
    { containerId: "filterBulan", key: "bulan" },
    { containerId: "filterAfiliasi", key: "afiliasi" },
    { containerId: "filterSubBrand", key: "subBrand" },
    { containerId: "filterJenis", key: "jenis" },
    { containerId: "filterPlatform", key: "platform" },
    { containerId: "filterWaktu", key: "waktu" }
  ];

  filterMap.forEach(({ containerId, key }) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("chip")) {
        container.querySelectorAll(".chip").forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");

        activeFilters[key] = e.target.getAttribute("data-value");
        renderEvents();
      }
    });
  });

  const resetBtn = document.getElementById("resetFilterBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      Object.keys(activeFilters).forEach((k) => (activeFilters[k] = k === "search" ? activeFilters.search : "ALL"));
      
      document.querySelectorAll(".chips-wrapper").forEach((wrapper) => {
        wrapper.querySelectorAll(".chip").forEach((chip, idx) => {
          chip.classList.toggle("active", idx === 0);
        });
      });

      renderEvents();
    });
  }
}

function setupSearchListener() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    activeFilters.search = val;
    clearBtn.hidden = val.length === 0;
    renderEvents();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    activeFilters.search = "";
    clearBtn.hidden = true;
    renderEvents();
  });
}
