/**
 * PILAR MINI GLOBAL CONTROLLER (script.js)
 * Hanya berlaku di dalam lingkungan Micro-Site PILAR.
 * Isolasi Total: Tidak berpengaruh pada sub-brand lain.
 */

document.addEventListener("DOMContentLoaded", function () {
  // 1. Inisialisasi Fitur Subnav Baris 2 PILAR
  initPilarSubnav();

  // 2. Fetch Data Profil Singkat PILAR (info.md) jika wadahnya ada
  loadPilarInfo();

  // 3. Handlers & Interaktivitas Khusus PILAR
  initPilarEvents();
});

/**
 * Inisialisasi Interaktivitas Navigasi Baris 2 PILAR
 */
function initPilarSubnav() {
  const subnavLinks = document.querySelectorAll(".pilar-menu a");

  // Highlight menu aktif berdasarkan URL
  const currentPath = window.location.pathname.toLowerCase();
  subnavLinks.forEach((link) => {
    const href = link.getAttribute("href").toLowerCase();
    if (href !== "./" && currentPath.includes(href.replace("./", ""))) {
      link.style.color = "var(--pilar-cyan)";
      link.style.background = "rgba(255, 255, 255, 0.12)";
    }
  });
}

/**
 * Load & Render Profil/Info Singkat PILAR dari pilar/content/info.md
 */
function loadPilarInfo() {
  const infoContainer = document.getElementById("pilar-info-desc");
  if (!infoContainer) return;

  // Hitung relative path ke folder content/info.md
  fetch("content/info.md")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal membaca info.md");
      return response.text();
    })
    .then((markdownText) => {
      // Jika pustaka Marked.js tersedia, render Markdown; jika tidak, tampilkan teks
      if (typeof marked !== "undefined") {
        infoContainer.innerHTML = marked.parse(markdownText);
      } else {
        infoContainer.innerText = markdownText;
      }
    })
    .catch((err) => {
      console.warn("Info PILAR menggunakan teks default fallback:", err);
      infoContainer.innerText =
        "Membina siswa/i dan guru dalam persiapan OSN, KSM, OPSI, FIKSI, hingga Karya Tulis Ilmiah secara terstruktur dan teruji.";
    });
}

/**
 * Handlers Interaktivitas Khusus PILAR
 */
function initPilarEvents() {
  // Utility: Smooth Scroll untuk tautan internal berawalan #
  const internalLinks = document.querySelectorAll('.pilar-menu a[href^="#"]');
  internalLinks.forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const subnavHeight = document.querySelector(".pilar-subnav")?.offsetHeight || 0;
        const globalHeaderHeight = 60; // Estimasi tinggi Header Baris 1
        const totalOffset = subnavHeight + globalHeaderHeight;

        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
}
