<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pusat Edukasi & Berita — Kelas Bisa</title>

  <link rel="icon" href="../assets/images/logo-kelasbisa.png" type="image/png">
  <link rel="stylesheet" href="../assets/css/global.css">
  <link rel="stylesheet" href="style.css">

  <!-- Marked.js CDN untuk merender isi file .md (Markdown) ke HTML -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

  <!-- HEADER GLOBAL -->
  <div id="app-header"></div>

  <!-- HERO PROMO BANNER -->
  <section class="events-hero">
    <div class="ecom-container">
      <img src="banner-promo.png" alt="Promo Portal Berita Kelas Bisa" class="hero-banner-img" onerror="this.style.display='none';">
    </div>
  </section>

  <!-- SAMBUTAN / HEADER PORTAL BERITA -->
  <section class="welcome-section">
    <div class="ecom-container">
      <div class="welcome-card">
        <span class="welcome-badge">📰 PORTAL BERITA & KONTEN EDUKASI</span>
        <h1 class="welcome-title">Informasi Terkini, Wawasan Akademik, & Dokumentasi Program</h1>
        <p class="welcome-desc">Temukan rilis berita resmi, pengumuman penting, artikel ilmiah, serta dokumentasi kegiatan terbaru dari ekosistem LKP Kelas Bisa.</p>
      </div>
    </div>
  </section>

  <!-- LAYOUT MAJALAH / BLOGGER (GRID SYSTEM) -->
  <main class="ecom-layout">
    <div class="ecom-container ecom-grid-system">

      <!-- ========================================== -->
      <!-- KONTEN UTAMA ARTIKEL (SISI KIRI) -->
      <!-- ========================================== -->
      <section class="ecom-main">

        <!-- SEARCH BAR ATAS -->
        <div class="ecom-search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" id="searchInput" placeholder="Cari judul berita, topik, penulis, atau kata kunci..." oninput="applyFilters()">
        </div>

        <!-- FEATURED POST / BERITA UTAMA -->
        <div id="featuredArticleContainer">
          <!-- Rendered via script.js -->
        </div>

        <!-- GRID KARTU ARTIKEL / BERITA -->
        <div id="articlesGrid" class="ecom-grid">
          <!-- Rendered via script.js -->
        </div>

        <!-- STATE KOSONG -->
        <div id="emptyState" class="ecom-empty-state" style="display: none;">
          <!-- Rendered via script.js -->
        </div>

      </section>

      <!-- ========================================== -->
      <!-- SIDEBAR PORTAL BERITA (SISI KANAN) -->
      <!-- ========================================== -->
      <aside class="ecom-sidebar">
        <div class="sidebar-header">
          <h3>Kategori Berita</h3>
          <button class="btn-reset-text" onclick="resetFilters()">Reset</button>
        </div>

        <div class="sidebar-content">

          <!-- FILTER TAG ARTIKEL -->
          <div class="filter-section">
            <h4 class="filter-heading">Kategori Utama</h4>
            <div class="filter-chips" id="filterTag">
              <button class="m-chip active" data-group="tag" data-value="Semua" onclick="clickFilterChip(this)">Semua</button>
              <button class="m-chip" data-group="tag" data-value="Berita" onclick="clickFilterChip(this)">📰 Berita</button>
              <button class="m-chip" data-group="tag" data-value="Pengumuman" onclick="clickFilterChip(this)">📢 Pengumuman</button>
              <button class="m-chip" data-group="tag" data-value="Artikel Ilmiah" onclick="clickFilterChip(this)">🔬 Artikel Ilmiah</button>
              <button class="m-chip" data-group="tag" data-value="Dokumentasi" onclick="clickFilterChip(this)">📁 Dokumentasi</button>
            </div>
          </div>

          <!-- FILTER SUB-BRAND -->
          <div class="filter-section">
            <h4 class="filter-heading">Sub-Brand</h4>
            <div class="filter-chips" id="filterSubbrand">
              <button class="m-chip active" data-group="subbrand" data-value="Semua" onclick="clickFilterChip(this)">Semua</button>
              <button class="m-chip" data-group="subbrand" data-value="Pilar Juara" onclick="clickFilterChip(this)">Pilar Juara</button>
              <button class="m-chip" data-group="subbrand" data-value="Gatra Adhika" onclick="clickFilterChip(this)">Gatra Adhika</button>
              <button class="m-chip" data-group="subbrand" data-value="Nestu" onclick="clickFilterChip(this)">Nestu</button>
              <button class="m-chip" data-group="subbrand" data-value="Lingua" onclick="clickFilterChip(this)">Lingua</button>
              <button class="m-chip" data-group="subbrand" data-value="Geodatis" onclick="clickFilterChip(this)">Geodatis</button>
              <button class="m-chip" data-group="subbrand" data-value="Arpa" onclick="clickFilterChip(this)">Arpa</button>
              <button class="m-chip" data-group="subbrand" data-value="Workit" onclick="clickFilterChip(this)">Workit</button>
            </div>
          </div>

          <!-- WIDGET ARTIKEL POPULER / TRENDING -->
          <div class="filter-section">
            <h4 class="filter-heading">🔥 Populer Minggu Ini</h4>
            <div class="trending-list" id="trendingList">
              <!-- Rendered via script.js -->
            </div>
          </div>

        </div>
      </aside>

    </div>
  </main>

  <!-- POP-UP MODAL BACA ARTIKEL (READING VIEW) -->
  <div id="detailModal" class="modal-overlay" style="display: none;" onclick="closeDetailModal(event)">
    <div class="modal-card modal-reading-card" onclick="event.stopPropagation()" id="modalBody">
      <!-- Rendered via script.js -->
    </div>
  </div>

  <!-- FOOTER GLOBAL -->
  <div id="app-footer"></div>

  <!-- SCRIPT -->
  <script src="../assets/js/components.js"></script>
  <script src="script.js"></script>
</body>
</html>
