document.addEventListener("DOMContentLoaded", function () {
  fetch("content.json")
    .then((res) => {
      if (!res.ok) throw new Error("Gagal membaca content.json");
      return res.json();
    })
    .then((data) => {
      renderHero(data.hero_section);
      renderPendahuluan(data.pendahuluan);
      renderUSP(data.usp_list);
      renderValues(data.nilai_utama);
      renderTarget(data.target_peserta);
    })
    .catch((err) => {
      console.error("Error loading content.json:", err);
    });
});

function renderHero(hero) {
  if (!hero) return;
  const titleElem = document.getElementById("hero-title");
  const subElem = document.getElementById("hero-subtitle");
  const descElem = document.getElementById("hero-desc");

  if (titleElem) titleElem.innerText = hero.title;
  if (subElem) subElem.innerText = hero.subtitle;
  if (descElem) descElem.innerText = hero.description;
}

function renderPendahuluan(pen) {
  if (!pen) return;
  const filoElem = document.getElementById("txt-filosofi");
  const defElem = document.getElementById("txt-definisi");

  if (filoElem) filoElem.innerText = pen.filosofi;
  if (defElem) defElem.innerHTML = `<strong>Definisi Resmi:</strong> ${pen.definisi}`;
}

function renderUSP(uspList) {
  const target = document.getElementById("usp-grid-target");
  if (!target || !uspList) return;

  let html = "";
  uspList.forEach((item) => {
    html += `
      <div class="usp-card">
        <span class="usp-tag">${item.no}</span>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
      </div>
    `;
  });
  target.innerHTML = html;
}

function renderValues(valList) {
  const target = document.getElementById("values-grid-target");
  if (!target || !valList) return;

  let html = "";
  valList.forEach((item) => {
    html += `
      <div class="value-card">
        <h4>${item.nama}</h4>
        <span class="value-motto">"${item.motto}"</span>
        <p>${item.desc}</p>
      </div>
    `;
  });
  target.innerHTML = html;
}

function renderTarget(targetList) {
  const target = document.getElementById("target-grid-target");
  if (!target || !targetList) return;

  let html = "";
  targetList.forEach((item) => {
    html += `
      <div class="target-card">
        <h3>${item.bidang}</h3>
        <span class="target-elemen">Jalur: ${item.elemen_terkait}</span>
        <p>${item.desc}</p>
        <div class="target-materi">
          <strong>Materi:</strong> ${item.materi}
        </div>
      </div>
    `;
  });
  target.innerHTML = html;
}
