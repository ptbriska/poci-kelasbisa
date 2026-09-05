// MASTER SCRIPT UNTUK MICRO-SITE POCI

document.addEventListener("DOMContentLoaded", async function () {
  // Cek apakah berada di halaman detail silabus (silabus.html)
  if (document.getElementById('syllabusContainer')) {
    await renderSyllabusDetailPage();
  } 
  // Jika berada di landing page (index.html)
  else {
    await loadPociMainInfo();
  }
});

// 1. MEMBACA & MENGRENDER DATA INFO UTAMA (INDEX.HTML)
async function loadPociMainInfo() {
  try {
    const res = await fetch('content/info.json');
    if (!res.ok) throw new Error("Gagal mengambil data content/info.json");
    
    const data = await res.json();

    // Fill Hero Data
    const heroCode = document.getElementById('heroCode');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const heroDate = document.getElementById('heroDate');
    const heroPlatform = document.getElementById('heroPlatform');

    if (heroCode) heroCode.innerText = data.kode_event || 'PLR-POCI-001';
    if (heroTitle) heroTitle.innerText = data.nama_acara || 'POCI';
    if (heroDesc) heroDesc.innerText = data.deskripsi_singkat || '';
    if (heroDate) heroDate.innerText = data.tanggal_waktu || '-';
    if (heroPlatform) heroPlatform.innerText = data.platform || '-';

    // Render Kategori & Mata Pelajaran Grid
    renderKategoriGrid(data.kategori_peserta || []);

    // Render Syarat
    const listSyarat = document.getElementById('listSyarat');
    if (listSyarat && Array.isArray(data.syarat_pendaftaran)) {
      listSyarat.innerHTML = data.syarat_pendaftaran.map(s => `<li>${s}</li>`).join('');
    }

    // Render Fasilitas
    const listFasilitas = document.getElementById('listFasilitas');
    if (listFasilitas && Array.isArray(data.fasilitas)) {
      listFasilitas.innerHTML = data.fasilitas.map(f => `<li>${f}</li>`).join('');
    }

    // Render Jadwal & Kontak
    if (data.jadwal) {
      const jDaftar = document.getElementById('jadwalDaftar');
      const jKerja = document.getElementById('jadwalKerja');
      if (jDaftar) jDaftar.innerText = data.jadwal.pendaftaran || '-';
      if (jKerja) jKerja.innerText = data.jadwal.pengerjaan || '-';
    }

    if (data.kontak) {
      const kWA = document.getElementById('kontakWA');
      const kIG = document.getElementById('kontakIG');
      if (kWA) kWA.innerText = data.kontak.wa || '-';
      if (kIG) kIG.innerText = data.kontak.ig || '-';
    }

  } catch (err) {
    console.error("Informasi Error POCI:", err.message);
  }
}

// 2. RENDER KATEGORI & MAPEL CHIPS
function renderKategoriGrid(kategoriList) {
  const container = document.getElementById('syllabusGridContainer');
  if (!container) return;

  let html = '';
  kategoriList.forEach(kat => {
    let chipsHtml = '';
    (kat.bidang || []).forEach(b => {
      chipsHtml += `
        <a href="silabus.html?mapel=${b.slug}" class="mapel-chip">
          📖 ${b.mapel}
        </a>
      `;
    });

    html += `
      <div class="kategori-block">
        <h3 class="kategori-title">🎓 ${kat.tingkat}</h3>
        <div class="bidang-chips">
          ${chipsHtml}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 3. RENDER HALAMAN BACA SILABUS TUNGGAL (SILABUS.HTML)
async function renderSyllabusDetailPage() {
  const container = document.getElementById('syllabusContainer');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const mapelSlug = urlParams.get('mapel');

  if (!mapelSlug) {
    window.location.href = 'index.html';
    return;
  }

  try {
    // Membaca file silabus spesifik berdasarkan slug mapel
    const res = await fetch(`content/silabus-${mapelSlug}.json`);
    if (!res.ok) throw new Error(`File content/silabus-${mapelSlug}.json belum tersedia.`);

    const data = await res.json();

    document.title = `Silabus ${data.mata_pelajaran || ''} (${data.tingkat || ''}) — POCI`;

    let materiListHtml = '';
    if (Array.isArray(data.daftar_materi)) {
      data.daftar_materi.forEach(item => {
        let sublistHtml = '';
        if (Array.isArray(item.sub_materi)) {
          sublistHtml = `
            <ul class="syllabus-sublist">
              ${item.sub_materi.map(sub => `<li>${sub}</li>`).join('')}
            </ul>
          `;
        }

        materiListHtml += `
          <div class="syllabus-topic-item">
            <h4>📌 ${item.topik}</h4>
            ${sublistHtml}
          </div>
        `;
      });
    }

    container.innerHTML = `
      <div class="syllabus-header">
        <span class="poci-badge">${data.tingkat || 'Olimpiade'}</span>
        <h1>Silabus Ujian: ${data.mata_pelajaran || '-'}</h1>
        <div class="syllabus-meta">
          <span>🏆 Kompetisi: POCI 2026</span> • 
          <span>⏱️ Durasi Ujian: ${data.durasi || '90 Menit'}</span> • 
          <span>📝 Jumlah Soal: ${data.jumlah_soal || '40 Soal'}</span>
        </div>
      </div>

      <div class="syllabus-body">
        <h3 style="font-size: 1.1rem; color: #0A192F; margin-bottom: 16px;">📋 Rincian Topik & Cakupan Materi:</h3>
        ${materiListHtml || '<p>Cakupan materi belum diunggah.</p>'}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">📚</div>
        <h3 style="color: #0A192F;">Silabus Belum Tersedia</h3>
        <p style="color: #64748B; font-size: 0.9rem;">Rincian silabus untuk mata pelajaran ini sedang disusun oleh tim akademik.</p>
        <a href="index.html" class="btn-primary" style="margin-top: 12px; display: inline-block;">Kembali ke Beranda POCI</a>
      </div>
    `;
  }
}
