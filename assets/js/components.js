document.addEventListener("DOMContentLoaded", function () {
  // 1. HITUNG KEDALAMAN PATH SECARA PRESISI
  const rootPath = getRootPath();

  // 2. FETCH & INJECT HEADER
  loadComponent("app-header", rootPath + "assets/components/header.html", initHeaderEvents);

  // 3. FETCH & INJECT FOOTER
  loadComponent("app-footer", rootPath + "assets/components/footer.html");
});

/**
 * Fungsi helper untuk fetch dan inject HTML ke wadah container
 */
function loadComponent(elementId, filePath, callback) {
  const container = document.getElementById(elementId);
  if (!container) return;

  fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal memuat ${filePath}`);
      }
      return response.text();
    })
    .then((data) => {
      container.innerHTML = data;
      if (callback) callback();
    })
    .catch((err) => console.error("Error loading component:", err));
}

/**
 * Fungsi Deteksi Path Relatif Bebas Bug GitHub Pages
 * Memeriksa apakah halaman dibuka di dalam sub-folder brand/events atau di root
 */
function getRootPath() {
  const path = window.location.pathname.toLowerCase();
  
  // Daftar folder level 1 yang membutuhkan path mundur satu tingkat ("../")
  const subFolders = [
    "/pilar/", "/gatra/", "/nestu/", "/lingua/", 
    "/geodatis/", "/arpa/", "/workit/", "/elementa/", 
    "/poci/", "/events/", "/admin/"
  ];

  // Cek apakah URL memuat salah satu dari folder di atas
  const isSubFolder = subFolders.some((folder) => path.includes(folder));

  return isSubFolder ? "../" : "./";
}

/**
 * Fungsi Interaktivitas Navigasi Header
 */
function initHeaderEvents() {
  const mobileToggle = document.getElementById("mobileToggle");
  const mainNav = document.getElementById("mainNav");
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const portalBtn = document.querySelector(".btn-portal");
  const portalDropdown = document.querySelector(".portal-dropdown");

  // Toggle Menu Mobile (Hamburger)
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener("click", function () {
      mainNav.classList.toggle("active");
      mobileToggle.classList.toggle("open");
    });
  }

  // Toggle Dropdown Menu pada Tampilan Mobile
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = this.parentElement;
        parent.classList.toggle("open-dropdown");
      }
    });
  });

  // Toggle Dropdown Portal Akses Cepat
  if (portalBtn && portalDropdown) {
    portalBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      portalDropdown.classList.toggle("active");
    });

    // Tutup dropdown portal jika klik di luar area
    document.addEventListener("click", function (e) {
      if (!portalDropdown.contains(e.target)) {
        portalDropdown.classList.remove("active");
      }
    });
  }
}
