document.addEventListener("DOMContentLoaded", function () {
  // 1. DAFTAR FILE EVENT DI FOLDER CONTENT/ (OTOMATIS / MANUALLY INDEXED)
  // Saat menggunakan Decap CMS, file-file ini dibuat otomatis di folder events/content/
  const eventFiles = [
    "2026-10-tryout-cpns.json",
    "2026-09-webinar-osn.md",
    "2026-11-bootcamp-ielts.json"
  ];

  let allEventsData = [];

  // 2. ELEMENT DOM REFERENCES
  const eventsGrid = document.getElementById("eventsGrid");
  const searchInput = document.getElementById("searchEventInput");
  const filterSubbrand = document.getElementById("filterSubbrand");
  const filterType = document.getElementById("filterType");
  const filterFormat = document.getElementById("filterFormat");
  const filterStatus = document.getElementById("filterStatus");
  const btnResetFilter = document.getElementById("btnResetFilter");
  const eventCountBadge = document.getElementById("eventCountBadge");

  // 3. INISIALISASI PENGAMBILAN DATA
  initEventsHub();

  async function initEventsHub() {
    try {
      allEventsData = await fetchAllEvents(eventFiles);
      
      // BACA PARAMETER URL (Jika pengguna datang dari pilar/gatra via link filter)
      applyURLParameters();

      // RENDER DAN AKTIFKAN FILTER
      renderEvents(allEventsData);
      setupFilterListeners();
    } catch (error) {
      console.error("Error loading events:", error);
      if (eventsGrid) {
        eventsGrid.innerHTML = `<div class="events-loading" style="color: #EF4444;">Gagal memuat agenda event. Silakan segarkan halaman.</div>`;
      }
    }
  }

  /**
   * Mengambil dan memproses seluruh file (.json dan .md) dari folder events/content/
   */
  async function fetchAllEvents(files) {
    const fetchPromises = files.map(async (fileName) => {
      const filePath = `content/${fileName}`;
      const isMarkdown = fileName.endsWith(".md");

      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`Failed to load ${fileName}`);

      if (isMarkdown) {
        const textData = await response.text();
        return parseMarkdownFrontmatter(textData, fileName);
      } else {
        return await response.json();
      }
    });

    return await Promise.all(fetchPromises);
  }

  /**
   * Parser Sederhana untuk membaca Frontmatter pada File Markdown (.md)
   */
  function parseMarkdownFrontmatter(mdContent, fileName) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = frontmatterRegex.exec(mdContent);

    if (!match) {
      return { id: fileName, title: "Event Tanpa Judul", status: "open" };
    }

    const frontmatterBlock = match[1];
    const data = { id: fileName.replace(".md", "") };

    // Parsing Key-Value sederhan dari Frontmatter
    frontmatterBlock.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        const cleanKey = key.trim();
        let cleanValue = valueParts.join(":").trim().replace(/^["']|["']$/g, "");
        data[cleanKey] = cleanValue;
      }
    });

    return data;
  }

  /**
   * Membaca Parameter URL (Contoh: /events/?subbrand=pilar)
   */
  function applyURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const subbrandParam = urlParams.get("subbrand");
    const statusParam = urlParams.get("status");

    if (subbrandParam && filterSubbrand) {
      filterSubbrand.value = subbrandParam.toLowerCase();
    }
    if (statusParam && filterStatus) {
      filterStatus.value = statusParam.toLowerCase();
    }
  }

  /**
   * Memasang Listener pada Form Filter & Search Input
   */
  function setupFilterListeners() {
    const filterElements = [searchInput, filterSubbrand, filterType, filterFormat, filterStatus];
    
    filterElements.forEach((el) => {
      if (el) {
        el.addEventListener("input", filterAndRenderEvents);
        el.addEventListener("change", filterAndRenderEvents);
      }
    });

    if (btnResetFilter) {
      btnResetFilter.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (filterSubbrand) filterSubbrand.value = "all";
        if (filterType) filterType.value = "all";
        if (filterFormat) filterFormat.value = "all";
        if (filterStatus) filterStatus.value = "open";
        filterAndRenderEvents();
      });
    }
  }

  /**
   * Logika Penyaringan (Filtering) Data Event
   */
  function filterAndRenderEvents() {
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedSubbrand = filterSubbrand ? filterSubbrand.value : "all";
    const selectedType = filterType ? filterType.value : "all";
    const selectedFormat = filterFormat ? filterFormat.value : "all";
    const selectedStatus = filterStatus ? filterStatus.value : "all";

    const filteredData = allEventsData.filter((event) => {
      // 1. Match Search Query (Judul / Summary)
      const matchSearch =
        !searchQuery ||
        (event.title && event.title.toLowerCase().includes(searchQuery)) ||
        (event.summary && event.summary.toLowerCase().includes(searchQuery));

      // 2. Match Sub-brand
      const matchSubbrand =
        selectedSubbrand === "all" ||
        (event.subbrand && event.subbrand.toLowerCase() === selectedSubbrand);

      // 3. Match Jenis Kegiatan
      const matchType =
        selectedType === "all" ||
        (event.type && event.type.toLowerCase() === selectedType.toLowerCase());

      // 4. Match Format Belajar
      const matchFormat =
        selectedFormat === "all" ||
        (event.format && event.format.toLowerCase() === selectedFormat.toLowerCase());

      // 5. Match Status Pendaftaran
      const matchStatus =
        selectedStatus === "all" ||
        (event.status && event.status.toLowerCase() === selectedStatus);

      return matchSearch && matchSubbrand && matchType && matchFormat && matchStatus;
    });

    renderEvents(filteredData);
  }

  /**
   * Merender Hasil Filter menjadi Kartu HTML di events/index.html
   */
  function renderEvents(dataList) {
    if (!eventsGrid) return;

    eventsGrid.innerHTML = "";

    // Update Counter Jumlah Event
    if (eventCountBadge) {
      eventCountBadge.textContent = `Menampilkan ${dataList.length} kegiatan`;
    }

    if (dataList.length === 0) {
      eventsGrid.innerHTML = `
        <div class="events-loading">
          <p>⚠️ Tidak ditemukan kegiatan/event yang sesuai dengan filter kamu.</p>
        </div>
      `;
      return;
    }

    dataList.forEach((event) => {
      const cardHTML = createEventCardHTML(event);
      eventsGrid.insertAdjacentHTML("beforeend", cardHTML);
    });
  }

  /**
   * Template Generator untuk Kartu Event
   */
  function createEventCardHTML(event) {
    // Status Badge Logic
    let statusClass = "status-open";
    let statusText = "Open Registration";

    if (event.status === "soon") {
      statusClass = "status-soon";
      statusText = "Segera Dibuka";
    } else if (event.status === "closed") {
      statusClass = "status-closed";
      statusText = "Ditutup";
    }

    const bannerImg = event.banner || "../assets/images/hero-banner.png";
    const subbrandLabel = event.subbrand_label || (event.subbrand ? event.subbrand.toUpperCase() : "KELAS BISA");

    return `
      <article class="event-card">
        <div>
          <!-- BANNER IMAGE & STATUS TAG -->
          <div class="event-card-banner">
            <img src="${bannerImg}" alt="${event.title}" onerror="this.src='../assets/images/hero-banner.png'">
            <span class="event-status-tag ${statusClass}">${statusText}</span>
          </div>

          <!-- CARD BODY -->
          <div class="event-card-body">
            <span class="event-subbrand-badge">${subbrandLabel} • ${event.type || "Program"}</span>
            <h3 class="event-card-title">${event.title}</h3>
            
            <div class="event-meta">
              <span>📅 ${event.date_event || "Jadwal Menyesuaikan"}</span>
            </div>
            <div class="event-meta">
              <span>💻 Format: <strong>${event.format || "KETAL/PLATO"}</strong></span>
            </div>
            
            <p style="font-size:0.82rem; color:var(--text-muted); margin-top:0.6rem; line-height:1.4;">
              ${event.summary ? event.summary.substring(0, 90) + "..." : "Klik detail untuk informasi lengkap agenda kegiatan."}
            </p>
          </div>
        </div>

        <!-- CARD FOOTER -->
        <div class="event-card-footer">
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">Biaya Investasi:</span>
            <strong style="font-size:0.95rem; color:var(--brand-deep-blue);">${event.price || "Hubungi Admin"}</strong>
          </div>
          <a href="detail.html?id=${encodeURIComponent(event.id)}" class="btn-detail-event">
            Detail & Daftar
          </a>
        </div>
      </article>
    `;
  }
});
