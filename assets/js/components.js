document.addEventListener("DOMContentLoaded", function () {
  // 1. HITUNG KEDALAMAN PATH SECARA PRESISI & DINAMIS
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
        // Abaikan link eksternal, anchor, tel, mailto, data-URI
        if (
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("#") ||
          url.startsWith("mailto:") ||
          url.startsWith("tel:") ||
          url.startsWith("data:")
        ) {
          return match;
        }

        // Hapus slash di awal url jika ada, agar tidak terjadi dobel slash ("../../" + "/assets" -> "../../assets")
        const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
        return `${attr}="${rootPath}${cleanUrl}"`;
      });

      container.innerHTML = fixedData;
      if (callback) callback();
    })
    .catch((err) => console.error("Error loading component:", err));
}

/**
 * Fungsi Deteksi Path Relatif Otomatis (Bebas Bug Multi-Level Kedalaman)
 * Menghitung langsung jumlah folder kedalaman dari root domain/repository
 */
function getRootPath() {
  // Decode URL (mengubah %20 menjadi spasi asli)
  const pathname = decodeElementSibling(window.location.pathname);
  
  // Split path berdasarkan slash dan bersihkan segmen kosong
  const segments = pathname.split("/").filter(Boolean);

  // Jika di lokal / root utama domain (misal: localhost/ atau index.html)
  if (segments.length === 0) return "./";

  // Cek apakah file paling akhir adalah file (punya ekstensi .html, .htm, .php)
  const lastSegment = segments[segments.length - 1];
  const isFile = lastSegment.includes(".");

  // Jumlah folder yang harus dinaiki/dimunduri
  let folderDepth = isFile ? segments.length - 1 : segments.length;

  // PENANGANAN KHUSUS GITHUB PAGES:
  // Jika di-host di GitHub Pages (misal: username.github.io/nama-repo/)
  // Segmen pertama adalah nama repository, jadi depth dikurangi 1
  const isGitHubPages = window.location.hostname.includes("github.io");
  if (isGitHubPages && folderDepth > 0) {
    folderDepth -= 1;
  }

  // Jika berada di root utama
  if (folderDepth <= 0) return "./";

  // Return string "../" sebanyak jumlah kedalaman folder
  return "../".repeat(folderDepth);
}

/**
 * Helper untuk decode URI secara aman
 */
function decodeElementSibling(uri) {
  try {
    return decodeURIComponent(uri);
  } catch (e) {
    return uri;
  }
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
