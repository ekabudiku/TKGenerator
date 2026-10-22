/**
 * TKGen - Titik Kartometrik Generator
 * Logic & Interactivity
 * 
 * Rules:
 * - TK Reguler: exactly 2 desas, suffix -001, -002, ...
 * - TK Simpul: arbitrary number of desas (with add/delete), suffix -000
 * - Format: TK.[Prov].[Kab].[Kec1].[Desa1]-[Kec2].[Desa2]...-[NoTK]
 */

// --- Global Application State ---
const state = {
  mode: 'reguler', // 'reguler' | 'simpul'
  provKode: '74',  // Default Sulawesi Tenggara
  kabKode: '13',   // Default Kab. Muna Barat
  isCustomWilayah: false,
  customProv: '74',
  customKab: '13',
  
  // Village list:
  // For reguler: 2 items
  // For simpul: dynamic items (default 3)
  desas: [
    { kecKode: '01', desaKode: '2001', desaNama: 'Wakoila', isCustom: false },
    { kecKode: '02', desaKode: '2001', desaNama: 'Wuna', isCustom: false }
  ],

  // Numbering
  noTk: 1,
  autoIncrement: true,
  suffixSep: '-', // '-' or '.'
  prefix: 'TK.',  // 'TK.' or 'TK'

  // History
  history: []
};

// --- Storage Keys ---
const STORAGE_THEME = 'tkgen_theme';
const STORAGE_HISTORY = 'tkgen_history';
const STORAGE_PREFS = 'tkgen_prefs';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadSavedPreferences();
  loadHistory();
  initWilayahState();
  populateWilayahDropdowns();
  populateDefaultDesas();
  renderDesaColumns();
  updateOutput();
  setupEventListeners();
});

function initWilayahState() {
  if (typeof WILAYAH_DATA !== 'undefined' && WILAYAH_DATA.length > 0) {
    let prov = findProvinsi(state.provKode);
    if (!prov) {
      state.provKode = WILAYAH_DATA[0].kode;
      prov = WILAYAH_DATA[0];
    }
    const kab = prov.kabupaten.find(k => k.kode === state.kabKode);
    if (!kab && prov.kabupaten.length > 0) {
      state.kabKode = prov.kabupaten[0].kode;
    }
  }
}

// --- Theme Management (Light / Dark Mode) ---
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME);
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  // Listen to system changes if no explicit preference saved
  if (!savedTheme && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(STORAGE_THEME)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode');
    themeToggleBtn.title = theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(STORAGE_THEME, next);
  showToast(`Mode ${next === 'dark' ? 'Gelap' : 'Terang'} aktif`);
}

// --- Preferences ---
function loadSavedPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.suffixSep) state.suffixSep = parsed.suffixSep;
      if (parsed.autoIncrement !== undefined) state.autoIncrement = parsed.autoIncrement;
      const suffixSelect = document.getElementById('suffixSepSelect');
      if (suffixSelect) suffixSelect.value = state.suffixSep;
      const autoIncCheckbox = document.getElementById('autoIncCheckbox');
      if (autoIncCheckbox) autoIncCheckbox.checked = state.autoIncrement;
    }
  } catch (err) {
    console.error('Failed to parse preferences', err);
  }
}

function savePreferences() {
  const prefs = {
    suffixSep: state.suffixSep,
    autoIncrement: state.autoIncrement
  };
  localStorage.setItem(STORAGE_PREFS, JSON.stringify(prefs));
}

// --- History Management ---
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY);
    if (raw) {
      state.history = JSON.parse(raw);
      renderHistoryTable();
    }
  } catch (err) {
    state.history = [];
  }
}

function addToHistory(tkCode, mode, summary) {
  const item = {
    id: Date.now(),
    code: tkCode,
    mode: mode === 'reguler' ? 'TK Reguler' : 'TK Simpul',
    summary: summary,
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  };
  // Prepend, keep max 20
  state.history.unshift(item);
  if (state.history.length > 25) state.history.pop();
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(state.history));
  renderHistoryTable();
}

function clearHistory() {
  state.history = [];
  localStorage.removeItem(STORAGE_HISTORY);
  renderHistoryTable();
  showToast('Riwayat berhasil dibersihkan');
}

function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  const emptyState = document.getElementById('historyEmptyState');
  const countBadge = document.getElementById('historyCountBadge');
  
  if (countBadge) countBadge.textContent = `${state.history.length} data`;

  if (!tbody || !emptyState) return;

  if (state.history.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tbody.innerHTML = state.history.map(item => `
    <tr>
      <td style="white-space: nowrap; color: var(--text-muted); font-size: 0.75rem;">${item.time}</td>
      <td>
        <span class="mode-pill-badge" style="font-size: 0.7rem; ${item.mode === 'TK Simpul' ? 'background: rgba(6, 182, 212, 0.15); color: var(--brand-accent);' : ''}">
          ${item.mode}
        </span>
      </td>
      <td>
        <strong class="history-tk-code">${item.code}</strong>
        <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">${item.summary}</div>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="copyTextDirect('${item.code}')" title="Salin lagi">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Salin
        </button>
      </td>
    </tr>
  `).join('');
}

// --- Populating Master Wilayah (Provinsi & Kabupaten) ---
function populateWilayahDropdowns() {
  const provSelect = document.getElementById('provSelect');
  const kabSelect = document.getElementById('kabSelect');

  if (!provSelect || !kabSelect) return;

  // Populate Provinsi
  provSelect.innerHTML = WILAYAH_DATA.map(p => `
    <option value="${p.kode}" ${p.kode === state.provKode ? 'selected' : ''}>
      ${p.kode} - ${p.nama}
    </option>
  `).join('');

  updateKabupatenDropdown();
}

function updateKabupatenDropdown() {
  const kabSelect = document.getElementById('kabSelect');
  if (!kabSelect) return;

  const currentProv = findProvinsi(state.provKode);
  if (!currentProv || !currentProv.kabupaten) {
    kabSelect.innerHTML = '<option value="">Tidak ada data</option>';
    return;
  }

  kabSelect.innerHTML = currentProv.kabupaten.map(k => `
    <option value="${k.kode}" ${k.kode === state.kabKode ? 'selected' : ''}>
      ${k.kode} - ${k.nama}
    </option>
  `).join('');

  // Update chips in UI
  updateWilayahChips();
}

function updateWilayahChips() {
  const provChip = document.getElementById('provCodeChip');
  const kabChip = document.getElementById('kabCodeChip');
  if (provChip) provChip.textContent = state.isCustomWilayah ? state.customProv : state.provKode;
  if (kabChip) kabChip.textContent = state.isCustomWilayah ? state.customKab : state.kabKode;
}

// --- Mode Switching (Slider Interaction) ---
function setMode(newMode) {
  if (state.mode === newMode) return;
  state.mode = newMode;

  const sliderPill = document.getElementById('modeSliderPill');
  const btnReguler = document.getElementById('btnModeReguler');
  const btnSimpul = document.getElementById('btnModeSimpul');
  const hintEl = document.getElementById('modeHintText');
  const addVillageBtn = document.getElementById('btnAddVillage');
  const numberingCard = document.getElementById('numberingCard');

  if (sliderPill) {
    sliderPill.setAttribute('data-active', newMode);
  }

  if (newMode === 'reguler') {
    btnReguler.classList.add('active');
    btnSimpul.classList.remove('active');
    btnReguler.setAttribute('aria-selected', 'true');
    btnSimpul.setAttribute('aria-selected', 'false');

    if (hintEl) {
      hintEl.innerHTML = `Mode <strong>TK Reguler</strong>: Tepat 2 desa batas. Akhiran nomor urut <code>-001, -002, ...</code>`;
    }

    // Hide "+ Tambah Desa" button in reguler mode
    if (addVillageBtn) addVillageBtn.style.display = 'none';
    if (numberingCard) numberingCard.style.display = 'flex';

    // Reguler must have exactly 2 desas
    if (state.desas.length > 2) {
      state.desas = state.desas.slice(0, 2);
    } else if (state.desas.length < 2) {
      populateDefaultDesas();
    }
  } else {
    // Simpul
    btnSimpul.classList.add('active');
    btnReguler.classList.remove('active');
    btnSimpul.setAttribute('aria-selected', 'true');
    btnReguler.setAttribute('aria-selected', 'false');

    if (hintEl) {
      hintEl.innerHTML = `Mode <strong>TK Simpul</strong>: Titik pertemuan 3+ desa (bebas tanpa batas). Selalu berakhiran <code>-000</code>`;
    }

    // Show "+ Tambah Desa" button
    if (addVillageBtn) addVillageBtn.style.display = 'inline-flex';
    if (numberingCard) numberingCard.style.display = 'none';

    // If only 2, add a 3rd default desa for Simpul demonstration
    if (state.desas.length < 3) {
      addDefaultThirdDesa();
    }
  }

  renderDesaColumns();
  updateOutput();
}

function populateDefaultDesas() {
  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  if (!currentKab || !currentKab.kecamatan || currentKab.kecamatan.length === 0) return;

  const firstKec = currentKab.kecamatan[0];
  const secondKec = currentKab.kecamatan.length > 1 ? currentKab.kecamatan[1] : currentKab.kecamatan[0];

  const firstDesa = (firstKec.desa && firstKec.desa.length > 0)
    ? firstKec.desa[0]
    : { kode: '2001', nama: 'Desa A' };

  const secondDesa = (secondKec === firstKec && secondKec.desa && secondKec.desa.length > 1)
    ? secondKec.desa[1]
    : ((secondKec.desa && secondKec.desa.length > 0) ? secondKec.desa[0] : { kode: '2002', nama: 'Desa B' });

  state.desas = [
    {
      kecKode: firstKec.kode,
      desaKode: firstDesa.kode,
      desaNama: firstDesa.nama,
      isCustom: false
    },
    {
      kecKode: secondKec.kode,
      desaKode: secondDesa.kode,
      desaNama: secondDesa.nama,
      isCustom: false
    }
  ];
}

function addDefaultThirdDesa() {
  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  if (!currentKab || !currentKab.kecamatan || currentKab.kecamatan.length === 0) return;

  const thirdKec = currentKab.kecamatan[2] || currentKab.kecamatan[1] || currentKab.kecamatan[0];
  const candidateDesa = (thirdKec.desa && thirdKec.desa.length > 0)
    ? (thirdKec.desa[2] || thirdKec.desa[1] || thirdKec.desa[0])
    : { kode: '2003', nama: 'Desa C' };

  state.desas.push({
    kecKode: thirdKec.kode,
    desaKode: candidateDesa.kode,
    desaNama: candidateDesa.nama,
    isCustom: false
  });
}

// --- Add & Remove Desa (TK Simpul) ---
function addDesa() {
  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  if (!currentKab || !currentKab.kecamatan || currentKab.kecamatan.length === 0) return;

  const kecIndex = state.desas.length % currentKab.kecamatan.length;
  const targetKec = currentKab.kecamatan[kecIndex];
  const targetDesa = (targetKec && targetKec.desa && targetKec.desa.length > 0)
    ? targetKec.desa[0]
    : { kode: `200${state.desas.length + 1}`, nama: `Desa ${String.fromCharCode(65 + state.desas.length)}` };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const labelLetter = state.desas.length < 26 ? alphabet[state.desas.length] : (state.desas.length + 1);

  state.desas.push({
    kecKode: targetKec.kode,
    desaKode: targetDesa.kode,
    desaNama: targetDesa.nama,
    isCustom: false
  });

  renderDesaColumns();
  updateOutput();
  showToast(`Desa ${labelLetter} (${targetDesa.nama}) ditambahkan`);
}

function removeDesa(index) {
  if (state.desas.length <= 2) {
    showToast('Minimal harus ada 2 desa untuk batas wilayah', 'warning');
    return;
  }
  const removed = state.desas.splice(index, 1);
  renderDesaColumns();
  updateOutput();
  showToast(`Kolom desa berhasil dihapus`);
}

// --- Render Desa Columns & Dropdowns ---
function renderDesaColumns() {
  const grid = document.getElementById('desaGrid');
  if (!grid) return;

  const isSimpul = state.mode === 'simpul';
  grid.className = isSimpul ? 'desa-grid multi-columns' : 'desa-grid';

  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  const kecamatanList = currentKab?.kecamatan || [];

  // Build flattened list of all desas in this kabupaten for quick searchable selection
  const allDesasInKab = [];
  kecamatanList.forEach(kec => {
    kec.desa.forEach(d => {
      allDesasInKab.push({
        kecKode: kec.kode,
        kecNama: kec.nama,
        desaKode: d.kode,
        desaNama: d.nama,
        fullLabel: `${d.nama} (${d.kode}) - Kec. ${kec.nama}`
      });
    });
  });

  grid.innerHTML = state.desas.map((item, index) => {
    const letter = String.fromCharCode(65 + index); // A, B, C...
    const cardTitle = isSimpul ? `Desa ${index + 1} (${letter})` : (index === 0 ? 'Desa A' : 'Desa B');
    const canDelete = isSimpul && state.desas.length > 2;

    // Check if current combination matches any preset
    const matched = allDesasInKab.find(x => x.kecKode === item.kecKode && x.desaKode === item.desaKode);

    return `
      <div class="desa-card" id="desaCard_${index}">
        <div class="desa-card-header">
          <div class="desa-card-badge">
            <span class="desa-index-circle">${letter}</span>
            <span>${cardTitle}</span>
          </div>
          <div class="desa-card-meta">
            ${canDelete ? `
              <button class="btn btn-danger-ghost btn-sm" onclick="removeDesa(${index})" title="Hapus kolom desa ini">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Hapus
              </button>
            ` : ''}
            <button class="custom-toggle-btn" onclick="toggleCustomMode(${index})">
              ${item.isCustom ? 'Gunakan Dropdown' : 'Input Manual'}
            </button>
          </div>
        </div>

        <div class="desa-card-body">
          ${item.isCustom ? `
            <!-- Manual Custom Input Mode -->
            <div class="input-group">
              <label class="input-label">
                <span>Nama Desa / Kelurahan</span>
              </label>
              <input type="text" class="input-control" placeholder="Contoh: Desa Karangsalam" 
                     value="${item.desaNama || ''}" 
                     oninput="handleCustomNameChange(${index}, this.value)" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="input-group">
                <label class="input-label">
                  <span>Kode Kec</span>
                  <span class="code-chip kec">2 digit</span>
                </label>
                <input type="text" maxlength="2" class="input-control" style="font-family: monospace;" 
                       placeholder="01" value="${item.kecKode}" 
                       oninput="handleCustomKecChange(${index}, this.value)" />
              </div>
              <div class="input-group">
                <label class="input-label">
                  <span>Kode Desa</span>
                  <span class="code-chip desa">4 digit</span>
                </label>
                <input type="text" maxlength="4" class="input-control" style="font-family: monospace;" 
                       placeholder="2001" value="${item.desaKode}" 
                       oninput="handleCustomDesaChange(${index}, this.value)" />
              </div>
            </div>
          ` : `
            <!-- Dropdown Selection Mode (Default) -->
            <div class="input-group">
              <label class="input-label">
                <span>Kecamatan</span>
                <span class="code-chip kec">${item.kecKode}</span>
              </label>
              <select class="select-control" onchange="handleKecamatanSelect(${index}, this.value)">
                ${kecamatanList.map(kec => `
                  <option value="${kec.kode}" ${kec.kode === item.kecKode ? 'selected' : ''}>
                    ${kec.kode} - Kec. ${kec.nama}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">
                <span>Pilih Nama Desa</span>
                <span class="code-chip desa">${item.desaKode}</span>
              </label>
              <select class="select-control" onchange="handleDesaSelect(${index}, this.value)">
                ${getDesaOptionsHtml(item.kecKode, item.desaKode)}
              </select>
            </div>
          `}

          <!-- Live Code Summary for this Village -->
          <div class="desa-code-summary">
            <span>Kode Format Wilayah:</span>
            <div class="code-composite">
              <span class="code-chip kec">${item.kecKode}</span>
              <span>.</span>
              <span class="code-chip desa">${item.desaKode}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getDesaOptionsHtml(kecKode, selectedDesaKode) {
  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  const currentKec = currentKab?.kecamatan.find(k => k.kode === kecKode);

  if (!currentKec || !currentKec.desa || currentKec.desa.length === 0) {
    return '<option value="">Tidak ada desa</option>';
  }

  const hasSelected = currentKec.desa.some(d => d.kode === selectedDesaKode);

  return currentKec.desa.map((d, idx) => `
    <option value="${d.kode}" ${(d.kode === selectedDesaKode || (!hasSelected && idx === 0)) ? 'selected' : ''}>
      ${d.nama} (${d.kode})
    </option>
  `).join('');
}

// --- Dropdown & Input Event Handlers ---
function handleKecamatanSelect(index, newKecKode) {
  state.desas[index].kecKode = newKecKode;

  // Set default first desa of new kecamatan
  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  const newKec = currentKab?.kecamatan.find(k => k.kode === newKecKode);

  if (newKec && newKec.desa && newKec.desa.length > 0) {
    state.desas[index].desaKode = newKec.desa[0].kode;
    state.desas[index].desaNama = newKec.desa[0].nama;
  }

  renderDesaColumns();
  updateOutput();
}

function handleDesaSelect(index, newDesaKode) {
  state.desas[index].desaKode = newDesaKode;

  const currentProv = findProvinsi(state.provKode);
  const currentKab = currentProv?.kabupaten.find(k => k.kode === state.kabKode);
  const kec = currentKab?.kecamatan.find(k => k.kode === state.desas[index].kecKode);
  const desa = kec?.desa.find(d => d.kode === newDesaKode);

  if (desa) {
    state.desas[index].desaNama = desa.nama;
  }

  renderDesaColumns();
  updateOutput();
}

function toggleCustomMode(index) {
  state.desas[index].isCustom = !state.desas[index].isCustom;
  renderDesaColumns();
  updateOutput();
}

function handleCustomNameChange(index, val) {
  state.desas[index].desaNama = val;
  updateOutput();
}

function handleCustomKecChange(index, val) {
  state.desas[index].kecKode = val.padStart(2, '0').slice(-2);
  updateOutput();
}

function handleCustomDesaChange(index, val) {
  state.desas[index].desaKode = val.padStart(4, '0').slice(-4);
  updateOutput();
}

function swapDesas() {
  if (state.desas.length >= 2) {
    const temp = state.desas[0];
    state.desas[0] = state.desas[1];
    state.desas[1] = temp;
    renderDesaColumns();
    updateOutput();
    showToast('Posisi Desa A & Desa B berhasil ditukar');
  }
}

// --- Numbering Stepper for TK Reguler ---
function changeNoTk(delta) {
  let next = state.noTk + delta;
  if (next < 1) next = 1;
  state.noTk = next;
  updateNoTkDisplay();
  updateOutput();
}

function setNoTkManual(val) {
  let num = parseInt(val, 10);
  if (isNaN(num) || num < 1) num = 1;
  state.noTk = num;
  updateNoTkDisplay();
  updateOutput();
}

function setQuickNoTk(val) {
  state.noTk = val;
  updateNoTkDisplay();
  updateOutput();
}

function updateNoTkDisplay() {
  const input = document.getElementById('noTkInput');
  if (input) {
    input.value = String(state.noTk).padStart(3, '0');
  }
}

// --- CORE GENERATOR: Assemble TK Name & Breakdown ---
function generateTkResult() {
  const prov = state.isCustomWilayah ? state.customProv : state.provKode;
  const kab = state.isCustomWilayah ? state.customKab : state.kabKode;
  const prefix = state.prefix; // "TK."

  // Suffix number
  let suffixNumber = '000';
  if (state.mode === 'reguler') {
    suffixNumber = String(state.noTk).padStart(3, '0');
  } else {
    suffixNumber = '000';
  }

  // Format desa parts: [Kec1].[Desa1] - [Kec2].[Desa2] - [Kec3].[Desa3]...
  const desaSegments = state.desas.map(d => `${d.kecKode}.${d.desaKode}`).join('-');

  // Final code: TK.Prov.Kab.Kec1.Desa1-Kec2.Desa2-Suffix
  // Notice user prompt specifies suffix separator: -000, -001
  const sep = state.suffixSep || '-';
  const fullCode = `${prefix}${prov}.${kab}.${desaSegments}${sep}${suffixNumber}`;

  // Check condition for caption (Gambar 3 vs Gambar 4 vs Simpul)
  let ruleType = '';
  if (state.mode === 'simpul') {
    ruleType = `Titik Simpul (Pertemuan ${state.desas.length} Desa) • Akhiran ${sep}000`;
  } else {
    // Check if desas are in same or different kecamatan
    const kecSet = new Set(state.desas.map(d => d.kecKode));
    if (kecSet.size === 1) {
      ruleType = `Satu Kecamatan (Format Gambar 3) • Akhiran ${sep}${suffixNumber}`;
    } else {
      ruleType = `Berbeda Kecamatan (Format Gambar 4) • Akhiran ${sep}${suffixNumber}`;
    }
  }

  // Summary label
  const villageNames = state.desas.map(d => d.desaNama || `Desa (${d.desaKode})`).join(' & ');

  return {
    fullCode,
    prefix,
    prov,
    kab,
    desaList: state.desas,
    suffixNumber,
    sep,
    ruleType,
    villageNames
  };
}

function updateOutput() {
  const res = generateTkResult();
  const outputTextEl = document.getElementById('outputTkText');
  const ruleBadgeEl = document.getElementById('outputRuleBadge');
  const breakdownEl = document.getElementById('diagramBoxesWrapper');

  if (outputTextEl) {
    outputTextEl.textContent = res.fullCode;
  }

  if (ruleBadgeEl) {
    ruleBadgeEl.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      ${res.ruleType}
    `;
  }

  // Render Visual Breakdown Boxes (matching exactly the colors in the user's diagram)
  if (breakdownEl) {
    let html = `
      <!-- TK Prefix -->
      <div class="diag-box tk-prefix">
        <span>TK</span>
        <span class="label">Tipe</span>
      </div>
      <span class="diag-sep">.</span>

      <!-- Kode Prov (Yellow) -->
      <div class="diag-box prov">
        <span>${res.prov}</span>
        <span class="label">Prov</span>
      </div>
      <span class="diag-sep">.</span>

      <!-- Kode Kab (Green) -->
      <div class="diag-box kab">
        <span>${res.kab}</span>
        <span class="label">Kab</span>
      </div>
    `;

    // Each village
    res.desaList.forEach((d, idx) => {
      const sep = idx === 0 ? '.' : '-';
      html += `
        <span class="diag-sep">${sep}</span>
        <!-- Kode Kec (Blue) -->
        <div class="diag-box kec">
          <span>${d.kecKode}</span>
          <span class="label">Kec ${String.fromCharCode(65 + idx)}</span>
        </div>
        <span class="diag-sep">.</span>
        <!-- Kode Desa (Pink) -->
        <div class="diag-box desa">
          <span>${d.desaKode}</span>
          <span class="label">Desa ${String.fromCharCode(65 + idx)}</span>
        </div>
      `;
    });

    // Suffix (No.TK - Gray)
    html += `
      <span class="diag-sep">${res.sep}</span>
      <div class="diag-box notk">
        <span>${res.suffixNumber}</span>
        <span class="label">${state.mode === 'simpul' ? 'Simpul (000)' : 'No.TK'}</span>
      </div>
    `;

    breakdownEl.innerHTML = html;
  }
}

// --- Copy to Clipboard with Feedback ---
function copyTkCode() {
  const res = generateTkResult();
  const textToCopy = res.fullCode;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      handleCopySuccess(res);
    }).catch(() => {
      fallbackCopyText(textToCopy, res);
    });
  } else {
    fallbackCopyText(textToCopy, res);
  }
}

function fallbackCopyText(text, res) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    handleCopySuccess(res);
  } catch (err) {
    showToast('Gagal menyalin otomatis. Silakan salin manual.', 'error');
  }
  document.body.removeChild(textArea);
}

function copyTextDirect(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Tersalin: ${text}`);
    });
  } else {
    showToast(`Tersalin: ${text}`);
  }
}

function handleCopySuccess(res) {
  // Visual feedback on CTA
  const ctaBtn = document.getElementById('outputCopyCta');
  const origHtml = ctaBtn ? ctaBtn.innerHTML : '';
  if (ctaBtn) {
    ctaBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Tersalin!
    `;
    ctaBtn.style.background = 'var(--brand-success)';
    setTimeout(() => {
      ctaBtn.innerHTML = origHtml;
      ctaBtn.style.background = '';
    }, 1500);
  }

  showToast(`Nama TK tersalin ke clipboard! 🎉`);

  // Add to History
  addToHistory(res.fullCode, state.mode, res.villageNames);

  // Auto-increment if in reguler mode
  if (state.mode === 'reguler' && state.autoIncrement) {
    state.noTk += 1;
    updateNoTkDisplay();
    updateOutput();
  }
}

// --- Toast System ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      ${type === 'success' 
        ? '<polyline points="20 6 9 17 4 12"></polyline>' 
        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}

// --- Export History ---
function exportHistory(format) {
  if (state.history.length === 0) {
    showToast('Belum ada riwayat untuk diekspor', 'warning');
    return;
  }

  let content = '';
  let filename = `TKGen_Riwayat_${Date.now()}`;
  let mimeType = 'text/plain';

  if (format === 'csv') {
    filename += '.csv';
    mimeType = 'text/csv;charset=utf-8;';
    content = 'Waktu,Tipe,Nama TK,Keterangan Desa\n';
    content += state.history.map(h => `"${h.time}","${h.mode}","${h.code}","${h.summary.replace(/"/g, '""')}"`).join('\n');
  } else {
    // TXT format
    filename += '.txt';
    content = state.history.map(h => h.code).join('\n');
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`File ${filename} berhasil diunduh`);
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  // Theme toggle button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Slider buttons
  const btnReguler = document.getElementById('btnModeReguler');
  const btnSimpul = document.getElementById('btnModeSimpul');
  if (btnReguler) btnReguler.addEventListener('click', () => setMode('reguler'));
  if (btnSimpul) btnSimpul.addEventListener('click', () => setMode('simpul'));

  // Provinsi & Kabupaten change
  const provSelect = document.getElementById('provSelect');
  if (provSelect) {
    provSelect.addEventListener('change', (e) => {
      state.provKode = e.target.value;
      const prov = findProvinsi(state.provKode);
      if (prov && prov.kabupaten.length > 0) {
        state.kabKode = prov.kabupaten[0].kode;
      }
      updateKabupatenDropdown();
      populateDefaultDesas();
      renderDesaColumns();
      updateOutput();
    });
  }

  const kabSelect = document.getElementById('kabSelect');
  if (kabSelect) {
    kabSelect.addEventListener('change', (e) => {
      state.kabKode = e.target.value;
      updateWilayahChips();
      populateDefaultDesas();
      renderDesaColumns();
      updateOutput();
    });
  }

  // Add Village button
  const addVillageBtn = document.getElementById('btnAddVillage');
  if (addVillageBtn) addVillageBtn.addEventListener('click', addDesa);

  // Swap desas button
  const swapBtn = document.getElementById('btnSwapDesas');
  if (swapBtn) swapBtn.addEventListener('click', swapDesas);

  // Output display box click-to-copy & keyboard accessibility
  const outputBox = document.getElementById('outputDisplayBox');
  if (outputBox) {
    outputBox.addEventListener('click', copyTkCode);
    outputBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyTkCode();
      }
    });
  }

  // Suffix format selector
  const suffixSelect = document.getElementById('suffixSepSelect');
  if (suffixSelect) {
    suffixSelect.addEventListener('change', (e) => {
      state.suffixSep = e.target.value;
      savePreferences();
      updateOutput();
    });
  }

  // Auto-increment checkbox
  const autoIncCheckbox = document.getElementById('autoIncCheckbox');
  if (autoIncCheckbox) {
    autoIncCheckbox.addEventListener('change', (e) => {
      state.autoIncrement = e.target.checked;
      savePreferences();
    });
  }

  // Clear history button
  const clearHistoryBtn = document.getElementById('btnClearHistory');
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

  // Modal open/close
  const guideBtn = document.getElementById('guideBtn');
  const guideModal = document.getElementById('guideModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (guideBtn && guideModal) {
    guideBtn.addEventListener('click', () => guideModal.classList.add('open'));
  }
  if (closeModalBtn && guideModal) {
    closeModalBtn.addEventListener('click', () => guideModal.classList.remove('open'));
  }
  if (guideModal) {
    guideModal.addEventListener('click', (e) => {
      if (e.target === guideModal) guideModal.classList.remove('open');
    });
  }
}
