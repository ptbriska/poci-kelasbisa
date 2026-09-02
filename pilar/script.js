document.addEventListener("DOMContentLoaded", function () {
  // 1. JALANKAN FUNGSI RENDER
  loadPilarSilabus();
  loadPilarInfo();
});

/**
 * Membaca data silabus.json dan merender kartu program di pilar/index.html
 */
function loadPilarSilabus() {
  const gridContainer = document.getElementById("pilar-program-grid");
  if (!gridContainer) return;

  fetch("content/silabus.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Gagal mengambil data silabus JSON");
      }
      return response.json();
    })
    .then((dataList) => {
      // Bersihkan indikator loading
      gridContainer.innerHTML = "";

      if (dataList.length === 0) {
        gridContainer.innerHTML = `<p class="pilar-loading">Belum ada program silabus yang ditampilkan.</p>`;
        return;
      }

      // Loop & Render Setiap Item Silabus
      dataList.forEach((item) => {
        const cardHTML = createSilabusCardHTML(item);
        gridContainer.insertAdjacentHTML("beforeend", cardHTML);
      });
    })
    .catch((error) => {
      console.error("Error loading PILAR Silabus:", error);
      gridContainer.innerHTML = `<p class="pilar-loading" style="color:#EF4444;">Gagal memuat katalog silabus. Silakan segarkan halaman.</p>`;
    });
}

/**
 * Template Helper untuk Membuat Kartu Silabus PILAR
 */
function createSilabusCardHTML(item) {
  // Render Badges Format Belajar yang Tersedia
  const formatsHTML = item.format_tersedia
    .map((fmt) => `<span class="tag-method" style="font-size:0.7rem; padding:0.2rem 0.5rem;">${fmt}</span>`)
    .join(" ");

  return `
    <article class="pilar-card-item">
      <div>
        <div class="pilar-card-header">
          <span class="pilar-card-code">${item.kode}</span>
          <span style="font-size:0.75rem; font-weight:700; color:var(--pilar-sky-deep);">${item.target}</span>
        </div>
        <h3 class="pilar-card-title">${item.nama}</h3>
        <p class="pilar-card-desc">${item.deskripsi}</p>
        
        <div style="margin-bottom: 1rem;">
          <p style="font-size:0.75rem; font-weight:700; color:var(--pilar-text-dark); margin-bottom:0.3rem;">Format Pembelajaran:</p>
          <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
            ${formatsHTML}
          </div>
        </div>
      </div>

      <div class="pilar-card-footer">
        <span class="pilar-card-period">📅 ${item.periode}</span>
        <a href="/events/?subbrand=pilar&code=${encodeURIComponent(item.kode)}" class="btn-pilar-primary" style="padding:0.4rem 0.9rem; font-size:0.8rem;">
          Cek Jadwal
        </a>
      </div>
    </article>
  `;
}

/**
 * Membaca data info.md dan merender isi Markdown ke HTML menggunakan Marked.js
 */
function loadPilarInfo() {
  const markdownContainer = document.getElementById("pilar-info-content");
  if (!markdownContainer) return;

  fetch("content/info.md")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Gagal mengambil data info Markdown");
      }
      return response.text();
    })
    .then((markdownText) => {
      // Pastikan library 'marked' sudah dimuat dari CDN di index.html
      if (typeof marked !== "undefined") {
        markdownContainer.innerHTML = marked.parse(markdownText);
      } else {
        // Fallback sederhana jika Marked CDN belum/gagal terpasang
        markdownContainer.innerHTML = `<pre style="white-space:pre-wrap;">${markdownText}</pre>`;
      }
    })
    .catch((error) => {
      console.error("Error loading PILAR Info Markdown:", error);
      markdownContainer.innerHTML = `<p class="pilar-loading" style="color:#EF4444;">Gagal memuat profil sub-brand.</p>`;
    });
}
