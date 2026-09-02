document.addEventListener("DOMContentLoaded", function () {
  // 1. HITUNG KEDALAMAN PATH AGAR HEADER & FOOTER RELATIF TERHADAP FOLDER
  const rootPath = getRootPath();

  // 2. FETCH & INJECT HEADER
  fetch(rootPath + "assets/components/header.html")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal memuat header");
      return response.text();
    })
    .then((data) => {
      const headerContainer = document.getElementById("app-header");
      if (headerContainer) {
        headerContainer.innerHTML = data;
        initHeaderEvents(); // Jalankan event listener untuk menu setelah header terpasang
      }
    })
    .catch((err) => console.error("Error loading header:", err));

  // 3. FETCH & INJECT FOOTER
  fetch(rootPath + "assets/components/footer.html")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal memuat footer");
      return response.text();
    })
    .then((data) => {
      const footerContainer = document.getElementById("app-footer");
      if (footerContainer) {
        footerContainer.innerHTML = data;
      }
    })
    .catch((err) => console.error("Error loading footer:", err));
});

/**
 * Fungsi untuk menentukan path relatif ke root directory
 * Contoh: 
 * - kelasbisa.com/index.html -> "./"
 * - kelasbisa.com/pilar/index.html -> "../"
 */
function getRootPath() {
  const path = window.location.pathname;
  // Hitung berapa jumlah slashes (/) dalam URL setelah origin
  const segments = path.split("/").filter((segment) => segment.length > 0);

  // Jika di root (misal: / atau /index.html), butuh "./"
  // Jika di sub-folder (misal: /pilar/ atau /events/), butuh "../"
  if (segments.length <= 1 && !path.endsWith("/")) {
    return "./";
  }
  
  // Buat string "../" sebanyak kedalaman folder
  let depth = segments.length;
  // Jika URL berakhir dengan nama file (misal /pilar/index.html), kurangi 1 kedalaman
  if (path.includes(".html")) {
    depth -= 1;
  }
  
  return depth > 0 ? "../".repeat(depth) : "./";
}

/**
 * Fungsi untuk Mengaktifkan Interaktivitas Navigasi Header
 * (Hamburger Menu, Dropdown Mobile & Desktop)
 */
function initHeaderEvents() {
  const mobileToggle = document.getElementById("mobileToggle");
  const mainNav = document.getElementById("mainNav");
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  const portalBtn = document.querySelector(".btn-portal");
  const portalDropdown = document.querySelector(".portal-dropdown");

  // Toggle Menu Mobile
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

    // Tutup dropdown portal jika mengklik di luar area portal
    document.addEventListener("click", function (e) {
      if (!portalDropdown.contains(e.target)) {
        portalDropdown.classList.remove("active");
      }
    });
  }
}
