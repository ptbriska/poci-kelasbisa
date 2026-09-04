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
      // Auto-rewrite atribut href dan src lokal berbasis rootPath yang presisi
      const rootPath = getRootPath();
      const fixedData = data.replace(/(href|src)="([^"]*)"/g, function (match, attr, url) {
        // Abaikan link eksternal, anchor link, telp, mailto, atau path absolut
        if (
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("#") ||
          url.startsWith("mailto:") ||
          url.startsWith("tel:")
        ) {
          return match;
        }
        return `${attr}="${rootPath}${url}"`;
      });

      container.innerHTML = fixedData;
      if (callback) callback();
    })
    .catch((err) => console.error("Error loading component:", err));
}

/**
 * Fungsi Deteksi Path Relatif Bebas Bug GitHub Pages (Multi-Level Support)
 * Menentukan berapa tingkat folder harus mundur ("./", "../", "../../", dst.)
 */
function getRootPath() {
  const path = window.location.pathname.toLowerCase();

  // 1. DAFTAR SUB-FOLDER LEVEL 2 & LEVEL 3 (Membutuhkan mundur dua tingkat "../../")
  const level2Keywords = [
    "/freemium/",
    "/reguler/",
    "/prestasi/",
    "/testimoni/",
    "/tutor/",
    "/metode.html",
    "/kemitraan.html"
  ];

  // 2. DAFTAR SUB-FOLDER LEVEL 1 (Membutuhkan mundur satu tingkat "../")
  const level1Keywords = [
    "/pilar/",
    "/gatra/",
    "/nestu/",
    "/lingua/",
    "/geodatis/",
    "/arpa/",
    "/workit/",
    "/elementa/",
    "/poci/",
    "/tentang/",
    "/events/",
    "/ketal/",
    "/dokumentasi/",
    "/admin/"
  ];

  // Cek apakah URL memuat salah satu keyword Level 2
  const isLevel2 = level2Keywords.some((keyword) => path.includes(keyword));
  if (isLevel2) {
    // Pengecualian jika file berada di pilar/reguler/sub-folder/ (Level 3)
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 3) {
      // Menghitung kedalaman presisi berdasarkan jumlah folder
      const depth = segments.length - (path.endsWith(".html") ? 1 : 0);
      if (depth === 2) return "../../";
      if (depth >= 3) return "../../../";
    }
    return "../../";
  }

  // Cek apakah URL memuat salah satu keyword Level 1
  const isLevel1 = level1Keywords.some((keyword) => path.includes(keyword));
  if (isLevel1) {
    return "../";
  }

  // Default jika berada di root domain (index.html)
  return "./";
}

/**
 * Fungsi Interaktivitas Navigasi Header (Mobile & Dropdown)
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
