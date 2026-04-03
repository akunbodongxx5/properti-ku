// ===== PropertiKu — Property Rental Management App =====

// ===== Data Layer =====
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem(`propertiKu_${key}`)) || []; } catch { return []; } },
  set(key, data) { localStorage.setItem(`propertiKu_${key}`, JSON.stringify(data)); },
  getVal(key) { return localStorage.getItem(`propertiKu_${key}`) || ''; },
  setVal(key, val) { localStorage.setItem(`propertiKu_${key}`, val); },
  genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};

// ===== Helpers =====
function formatRp(n) {
  const v = Number(n);
  if (v >= 1000000000) return 'Rp ' + (v / 1000000000).toFixed(1).replace('.0', '') + ' M';
  if (v >= 1000000) return 'Rp ' + (v / 1000000).toFixed(1).replace('.0', '') + ' jt';
  if (v >= 1000) return 'Rp ' + (v / 1000).toFixed(0) + ' rb';
  return 'Rp ' + v.toLocaleString('id-ID');
}
function formatRpFull(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function formatDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getMonthYear(d) { const x = d ? new Date(d) : new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; }
function getYear(d) { return d ? new Date(d).getFullYear().toString() : new Date().getFullYear().toString(); }
function daysUntil(d) { const now = new Date(); now.setHours(0,0,0,0); const t = new Date(d); t.setHours(0,0,0,0); return Math.ceil((t-now)/(864e5)); }
function getGreeting() { const h = new Date().getHours(); if (h<11) return 'Selamat Pagi'; if (h<15) return 'Selamat Siang'; if (h<18) return 'Selamat Sore'; return 'Selamat Malam'; }
function naturalSort(a, b) {
  const ax = [], bx = [];
  a.replace(/(\d+)|(\D+)/g, (_, $1, $2) => { ax.push([$1 || Infinity, $2 || '']); });
  b.replace(/(\d+)|(\D+)/g, (_, $1, $2) => { bx.push([$1 || Infinity, $2 || '']); });
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    const ai = ax[i] || [Infinity, ''], bi = bx[i] || [Infinity, ''];
    const numA = Number(ai[0]), numB = Number(bi[0]);
    if (numA !== numB) return numA - numB;
    if (ai[1] !== bi[1]) return ai[1] < bi[1] ? -1 : 1;
  }
  return 0;
}

// ===== FAB =====
function toggleFabMenu() {
  ['fab-main','fab-menu','fab-backdrop'].forEach(id => document.getElementById(id).classList.toggle('open'));
}
function closeFabMenu() {
  ['fab-main','fab-menu','fab-backdrop'].forEach(id => document.getElementById(id).classList.remove('open'));
}

// ===== Navigation =====
let currentPage = 'dashboard';
function navigateTo(page, btn) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titles = { dashboard:'PropertiKu', tenants:'Penyewa', payments:'Pembayaran', units:'Unit & Properti', reports:'Laporan' };
  document.getElementById('page-title').textContent = titles[page];
  closeFabMenu();
  refreshCurrentPage();
}
function refreshCurrentPage() {
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'tenants') renderTenants();
  else if (currentPage === 'payments') renderPayments();
  else if (currentPage === 'units') renderUnits();
  else if (currentPage === 'reports') renderReports();
}

// ===== Modal =====
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

// ===== Data Accessors =====
function getUnits() { return DB.get('units'); }
function saveUnits(u) { DB.set('units', u); }
function getTenants() { return DB.get('tenants'); }
function saveTenants(t) { DB.set('tenants', t); }
function getPayments() { return DB.get('payments'); }
function savePayments(p) { DB.set('payments', p); }
function getProperties() { return DB.get('properties'); }
function saveProperties(p) { DB.set('properties', p); }

function getOrCreateProperty(name) {
  const props = getProperties();
  let prop = props.find(p => p.name === name);
  if (!prop) {
    prop = { id: DB.genId(), name, purchasePrice: 0, pbb: 0, maintenance: 0, insurance: 0, otherExpense: 0, cicilanPerBulan: 0, sisaTenor: 0, notes: '', createdAt: new Date().toISOString() };
    props.push(prop);
    saveProperties(props);
  }
  return prop;
}

function getPropertyData(name) {
  const props = getProperties();
  return props.find(p => p.name === name) || { purchasePrice: 0, pbb: 0, maintenance: 0, insurance: 0, otherExpense: 0, cicilanPerBulan: 0, sisaTenor: 0 };
}

function getPropertyAnnualCost(propData) {
  return (propData.pbb || 0) + (propData.maintenance || 0) + (propData.insurance || 0) + (propData.otherExpense || 0);
}

function getUnitMonthlyCost(unit) {
  return (unit.ipl || 0) + (unit.sinkingFund || 0) + (unit.unitOtherCost || 0);
}

function getUnitAnnualCost(unit) {
  return getUnitMonthlyCost(unit) * 12 + (unit.unitPbb || 0);
}

function getAllUnitsAnnualCost(units) {
  return units.reduce((s, u) => s + getUnitAnnualCost(u), 0);
}

function getPropertyAnnualCostWithCicilan(propData) {
  return getPropertyAnnualCost(propData) + ((propData.cicilanPerBulan || 0) * 12);
}

// ===== Subtype Templates =====
function getSubtypeTemplates() { return DB.get('subtypeTemplates'); }
function saveSubtypeTemplates(t) { DB.set('subtypeTemplates', t); }

function getSubtypeTemplate(property, subtype) {
  if (!property || !subtype) return null;
  return getSubtypeTemplates().find(t => t.property === property && t.subtype === subtype) || null;
}

function saveSubtypeTemplate(property, subtype, facilities, price) {
  if (!property || !subtype) return;
  const templates = getSubtypeTemplates();
  const existing = templates.find(t => t.property === property && t.subtype === subtype);
  if (existing) {
    existing.facilities = facilities;
    existing.price = price;
  } else {
    templates.push({ id: DB.genId(), property, subtype, facilities, price });
  }
  saveSubtypeTemplates(templates);
}

// ===== FACILITY OPTIONS =====
const FACILITY_OPTIONS = [
  { cat: 'Ruangan', items: [
    { id: 'ac', icon: '❄️', label: 'AC' },
    { id: 'full_furnished', icon: '🪑', label: 'Full Furnished' },
    { id: 'semi_furnished', icon: '🪑', label: 'Semi Furnished' },
    { id: 'no_furnished', icon: '📦', label: 'No Furnished' },
    { id: 'tv', icon: '📺', label: 'TV' },
    { id: 'kulkas', icon: '🧊', label: 'Kulkas' },
    { id: 'dapur_bersama', icon: '🍳', label: 'Dapur Bersama' },
    { id: 'dapur_pribadi', icon: '🍳', label: 'Dapur Pribadi' },
  ]},
  { cat: 'Kamar Mandi', items: [
    { id: 'km_dalam', icon: '🚿', label: 'KM Dalam' },
    { id: 'km_luar', icon: '🚿', label: 'KM Luar' },
  ]},
  { cat: 'Utilitas', items: [
    { id: 'wifi', icon: '📶', label: 'Wi-Fi' },
    { id: 'listrik_incl', icon: '⚡', label: 'Listrik Termasuk' },
    { id: 'air_incl', icon: '💧', label: 'Air Termasuk' },
    { id: 'parkir_motor', icon: '🅿️', label: 'Parkir Motor' },
    { id: 'parkir_mobil', icon: '🚗', label: 'Parkir Mobil' },
    { id: 'akses_kunci', icon: '🔒', label: 'Akses Kartu/Kunci Digital' },
  ]},
  { cat: 'Layanan', items: [
    { id: 'laundry', icon: '👕', label: 'Laundry' },
    { id: 'air_minum', icon: '🥤', label: 'Air Minum' },
    { id: 'nasi_putih', icon: '🍚', label: 'Nasi Putih' },
    { id: 'cleaning', icon: '🧹', label: 'Cleaning Service' },
    { id: 'security', icon: '👮', label: 'Security 24 Jam' },
  ]},
  { cat: 'Fasilitas Gedung', items: [
    { id: 'kolam_renang', icon: '🏊', label: 'Kolam Renang' },
    { id: 'gym', icon: '🏋️', label: 'Gym / Fitness' },
    { id: 'lift', icon: '🛗', label: 'Lift' },
    { id: 'ruang_meeting', icon: '📦', label: 'Ruang Meeting' },
  ]},
  { cat: 'Aturan', items: [
    { id: 'pet_friendly', icon: '🐾', label: 'Pet Friendly' },
    { id: 'bebas_rokok', icon: '🚭', label: 'Bebas Rokok' },
    { id: 'boleh_tamu', icon: '👫', label: 'Boleh Bawa Tamu' },
    { id: 'no_tamu', icon: '🚫', label: 'Tidak Boleh Tamu' },
  ]},
];

// ===== EXPENSE CATEGORIES =====
const EXPENSE_CATEGORIES = [
  { id: 'maintenance', icon: '\u{1F527}', label: 'Maintenance' },
  { id: 'tax', icon: '\u{1F3DB}\uFE0F', label: 'Pajak (PBB)' },
  { id: 'electricity', icon: '\u26A1', label: 'Listrik' },
  { id: 'water', icon: '\u{1F4A7}', label: 'Air / PDAM' },
  { id: 'security', icon: '\u{1F46E}', label: 'Keamanan' },
  { id: 'cleaning', icon: '\u{1F9F9}', label: 'Kebersihan' },
  { id: 'insurance', icon: '\u{1F6E1}\uFE0F', label: 'Asuransi' },
  { id: 'renovation', icon: '\u{1F3D7}\uFE0F', label: 'Renovasi' },
  { id: 'other', icon: '\u{1F4E6}', label: 'Lain-lain' }
];

function getExpenseCategoryLabel(id) {
  const cat = EXPENSE_CATEGORIES.find(c => c.id === id);
  return cat ? cat.icon + ' ' + cat.label : '\u{1F4E6} Lain-lain';
}

// ===== TENANT HISTORY =====
function getTenantHistory() { return DB.get('tenantHistory'); }
function saveTenantHistory(h) { DB.set('tenantHistory', h); }

// ===== UNIT PHOTOS =====
function getUnitPhotos() { return DB.get('unitPhotos'); }
function saveUnitPhotos(p) { DB.set('unitPhotos', p); }

// ===== THEME =====
function getTheme() { return DB.getVal('theme') || 'light'; }
function setTheme(theme) {
  DB.setVal('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0f172a' : '#0d9488';
}
function toggleTheme() {
  const newTheme = getTheme() === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = newTheme === 'dark' ? '\u2600\uFE0F' : '\u{1F319}';
  refreshCurrentPage();
}

let _selectedFacilities = [];

function toggleChip(id) {
  const idx = _selectedFacilities.indexOf(id);
  if (idx >= 0) _selectedFacilities.splice(idx, 1);
  else _selectedFacilities.push(id);
  const el = document.querySelector(`.chip[data-id="${id}"]`);
  if (el) el.classList.toggle('selected');
}

function getFacilityLabel(id) {
  for (const cat of FACILITY_OPTIONS) {
    const item = cat.items.find(x => x.id === id);
    if (item) return item.label;
  }
  return id;
}

function buildChipsHtml(selected) {
  let html = '<div class="chips-group">';
  FACILITY_OPTIONS.forEach(cat => {
    html += `<div class="chips-category">${cat.cat}</div>`;
    cat.items.forEach(item => {
      const sel = selected.includes(item.id) ? 'selected' : '';
      html += `<div class="chip ${sel}" data-id="${item.id}" onclick="toggleChip('${item.id}')"><span class="chip-icon">${item.icon}</span> ${item.label}</div>`;
    });
  });
  html += '</div>';
  return html;
}

// ===== TERBILANG (Number to Indonesian words) =====
function terbilang(n) {
  if (n === 0) return 'nol';
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  n = Math.abs(Math.floor(n));
  if (n < 12) return satuan[n];
  if (n < 20) return satuan[n - 10] + ' belas';
  if (n < 100) return satuan[Math.floor(n / 10)] + ' puluh' + (n % 10 ? ' ' + satuan[n % 10] : '');
  if (n < 200) return 'seratus' + (n - 100 > 0 ? ' ' + terbilang(n - 100) : '');
  if (n < 1000) return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'seribu' + (n - 1000 > 0 ? ' ' + terbilang(n - 1000) : '');
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 ? ' ' + terbilang(n % 1000000) : '');
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' miliar' + (n % 1000000000 ? ' ' + terbilang(n % 1000000000) : '');
  return terbilang(Math.floor(n / 1000000000000)) + ' triliun' + (n % 1000000000000 ? ' ' + terbilang(n % 1000000000000) : '');
}

// ===== SVG CHART HELPERS =====
function svgLineChart(data, options) {
  const { width = 300, height = 180, color = 'var(--primary)', label = '' } = options || {};
  if (!data || data.length === 0) return '<div class="empty-state">Belum ada data</div>';
  const padL = 50, padR = 20, padT = 20, padB = 40;
  const w = width - padL - padR, h = height - padT - padB;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;
  const points = data.map((d, i) => {
    const x = padL + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2);
    const y = padT + h - ((d.value - minVal) / range) * h;
    return `${x},${y}`;
  });
  const labels = data.map((d, i) => {
    const x = padL + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2);
    return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="currentColor" font-size="10">${d.label}</text>`;
  }).join('');
  // Y axis labels
  const yLabels = [0, 0.5, 1].map(f => {
    const val = minVal + f * range;
    const y = padT + h - f * h;
    return `<text x="${padL - 5}" y="${y + 4}" text-anchor="end" fill="currentColor" font-size="9">${formatRp(val)}</text><line x1="${padL}" y1="${y}" x2="${padL + w}" y2="${y}" stroke="currentColor" stroke-opacity="0.1"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;color:var(--text-secondary)">
    ${yLabels}${labels}
    <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${data.map((d, i) => {
      const x = padL + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2);
      const y = padT + h - ((d.value - minVal) / range) * h;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
    }).join('')}
  </svg>`;
}

function svgDonutChart(data, options) {
  const { size = 200 } = options || {};
  if (!data || data.length === 0) return '<div class="empty-state">Belum ada data</div>';
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return '<div class="empty-state">Belum ada data</div>';
  const colors = ['#0d9488', '#6366f1', '#d97706', '#e11d48', '#7c3aed', '#059669', '#2563eb', '#c026d3', '#ca8a04'];
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const o = offset;
    offset += dash;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="${size * 0.12}" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-o}" transform="rotate(-90 ${cx} ${cy})"/>`;
  }).join('');
  const legend = data.map((d, i) => {
    const pct = ((d.value / total) * 100).toFixed(1);
    return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:4px"><span style="width:10px;height:10px;border-radius:3px;background:${colors[i % colors.length]};flex-shrink:0"></span><span style="flex:1;color:var(--text-secondary)">${d.label}</span><span style="font-weight:700;color:var(--text)">${pct}%</span></div>`;
  }).join('');
  return `<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;flex-shrink:0">
      ${arcs}
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-size="${size * 0.1}" font-weight="800">${formatRp(total)}</text>
    </svg>
    <div style="flex:1;min-width:120px">${legend}</div>
  </div>`;
}

function svgBarChart(data, options) {
  const { width = 300, height = 200, colors = ['var(--success)', 'var(--danger)'], labels = ['Income', 'Expense'] } = options || {};
  if (!data || data.length === 0) return '<div class="empty-state">Belum ada data</div>';
  const padL = 50, padR = 20, padT = 20, padB = 50;
  const w = width - padL - padR, h = height - padT - padB;
  const maxVal = Math.max(...data.flatMap(d => d.values), 1);
  const barGroupW = w / data.length;
  const barW = Math.min(barGroupW * 0.35, 30);
  const bars = data.map((d, i) => {
    const gx = padL + i * barGroupW + barGroupW / 2;
    return d.values.map((v, vi) => {
      const bh = (v / maxVal) * h;
      const x = gx - barW + vi * barW;
      const y = padT + h - bh;
      return `<rect x="${x}" y="${y}" width="${barW - 2}" height="${bh}" fill="${colors[vi]}" rx="3"/>`;
    }).join('') + `<text x="${gx}" y="${height - 5}" text-anchor="middle" fill="currentColor" font-size="9" transform="rotate(-20 ${gx} ${height - 5})">${d.label.length > 10 ? d.label.slice(0, 10) + '..' : d.label}</text>`;
  }).join('');
  const legendHtml = labels.map((l, i) => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;margin-right:10px"><span style="width:8px;height:8px;border-radius:2px;background:${colors[i]}"></span>${l}</span>`).join('');
  return `<div style="margin-bottom:4px">${legendHtml}</div><svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;color:var(--text-secondary)">${bars}</svg>`;
}

// ===== RESIZE IMAGE =====
function resizeImage(base64, maxSize, quality) {
  maxSize = maxSize || 800;
  quality = quality || 0.6;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
  });
}

// ===== STORAGE USAGE =====
function getStorageUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('propertiKu_')) {
      total += localStorage.getItem(key).length * 2; // UTF-16
    }
  }
  return (total / (1024 * 1024)).toFixed(2);
}

// ===== UNIT MANAGEMENT =====
let unitFilter = 'all';

function onPropertySelect(val) {
  const newInput = document.getElementById('new-property-input');
  if (val === '__new__') {
    newInput.style.display = 'block';
    newInput.focus();
  } else {
    newInput.style.display = 'none';
    newInput.value = '';
    // Auto-fill subtypes dropdown for this property
    updateSubtypeOptions(val);
    // Auto-fill facilities and price from last unit
    autoFillFacilities();
    autoFillPrice();
  }
}

function autoFillFacilities() {
  const propSelect = document.querySelector('[name="propertySelect"]');
  const subSelect = document.getElementById('subtype-select');
  const property = propSelect ? propSelect.value : '';
  const subtype = subSelect ? subSelect.value : '';
  if (!property || property === '__new__') return;

  // Priority 1: subtype template
  if (subtype && subtype !== '__new__' && subtype !== '') {
    const tpl = getSubtypeTemplate(property, subtype);
    if (tpl && tpl.facilities) {
      _selectedFacilities = tpl.facilities.split(',').map(s => s.trim()).filter(Boolean);
      refreshChipsUI();
      return;
    }
  }

  // Priority 2: last unit of same subtype
  const units = getUnits().filter(u => u.property === property && u.facilities);
  let matchedUnit = null;
  if (subtype && subtype !== '__new__' && subtype !== '') {
    matchedUnit = units.filter(u => u.subtype === subtype).pop();
  }
  // Priority 3: last unit of same property
  if (!matchedUnit) {
    matchedUnit = units.length > 0 ? units[units.length - 1] : null;
  }

  if (matchedUnit) {
    _selectedFacilities = matchedUnit.facilities.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    _selectedFacilities = [];
  }
  refreshChipsUI();
}

function refreshChipsUI() {
  document.querySelectorAll('.chip').forEach(chip => {
    const id = chip.dataset.id;
    if (_selectedFacilities.includes(id)) {
      chip.classList.add('selected');
    } else {
      chip.classList.remove('selected');
    }
  });
}

function updateSubtypeOptions(property) {
  const units = getUnits();
  const subtypes = [...new Set(units.filter(u => u.property === property && u.subtype).map(u => u.subtype))];
  const sel = document.getElementById('subtype-select');
  if (!sel) return;
  const currentVal = sel.value;
  // Keep first 2 options (Pilih/Tambah baru), rebuild the rest
  sel.innerHTML = '<option value="">Tanpa blok/sub-tipe</option><option value="__new__">+ Tambah baru...</option>'
    + subtypes.map(s => `<option value="${s}" ${s===currentVal?'selected':''}>${s}</option>`).join('');
}

function onSubtypeSelect(val) {
  const newInput = document.getElementById('new-subtype-input');
  if (val === '__new__') {
    newInput.style.display = 'block';
    newInput.focus();
  } else {
    newInput.style.display = 'none';
    newInput.value = '';
    // Auto-fill facilities and price based on subtype selection
    autoFillFacilities();
    autoFillPrice();
  }
}

function autoFillPrice() {
  const priceInput = document.querySelector('[name="price"]');
  if (!priceInput) return;
  const propSelect = document.querySelector('[name="propertySelect"]');
  const subSelect = document.getElementById('subtype-select');
  const property = propSelect ? propSelect.value : '';
  const subtype = subSelect ? subSelect.value : '';
  if (!property || property === '__new__') return;

  // Priority 0: subtype template
  if (subtype && subtype !== '__new__' && subtype !== '') {
    const tpl = getSubtypeTemplate(property, subtype);
    if (tpl && tpl.price) { priceInput.value = tpl.price; return; }
  }

  const units = getUnits();
  let matchedUnit = null;

  // Priority 1: same property + same subtype
  if (subtype && subtype !== '__new__') {
    matchedUnit = units.filter(u => u.property === property && u.subtype === subtype).pop();
  }
  // Priority 2: same property (any subtype)
  if (!matchedUnit) {
    matchedUnit = units.filter(u => u.property === property).pop();
  }

  if (matchedUnit && matchedUnit.price) {
    priceInput.value = matchedUnit.price;
  }
}

function buildUnitPhotoSection(unitId) {
  const photos = getUnitPhotos().filter(p => p.unitId === unitId);
  let thumbs = photos.map(ph => {
    return '<div style="position:relative;width:72px;height:72px;border-radius:8px;overflow:hidden;border:1px solid var(--border)">'
      + '<img src="' + ph.data + '" style="width:100%;height:100%;object-fit:cover" onclick="showUnitPhotos(\'' + unitId + '\')">'
      + '<button type="button" onclick="event.stopPropagation();deleteUnitPhoto(\'' + ph.id + '\',\'' + unitId + '\')" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center">&times;</button>'
      + '</div>';
  }).join('');
  const addBtn = photos.length < 5
    ? '<button type="button" class="btn btn-outline" onclick="addUnitPhoto(\'' + unitId + '\')" style="font-size:13px">📷 Tambah Foto</button>'
    : '<small style="color:var(--text-muted)">Maksimal 5 foto tercapai</small>';
  return '<div class="form-group"><label class="form-label">📷 Foto Unit (maks 5)</label>'
    + '<div id="unit-photo-thumbs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">' + thumbs + '</div>'
    + addBtn + '</div>';
}

function showUnitForm(editId) {
  const units = getUnits();
  const u = editId ? units.find(x => x.id === editId) : null;
  _selectedFacilities = u?.facilities ? u.facilities.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Get existing property names and subtypes
  const existingProps = [...new Set(units.map(x => x.property).filter(Boolean))];
  const isExistingProp = u && existingProps.includes(u.property);
  const existingSubtypes = u ? [...new Set(units.filter(x => x.property === u.property && x.subtype).map(x => x.subtype))] : [];

  openModal(u ? 'Edit Unit' : 'Tambah Unit Baru', `
    <form onsubmit="saveUnit(event,'${editId||''}')">
      <div class="form-group"><label class="form-label">Nama Properti</label>
        <select class="form-select" name="propertySelect" onchange="onPropertySelect(this.value)">
          ${existingProps.length ? '' : '<option value="">Belum ada properti</option>'}
          ${existingProps.map(p => `<option value="${p}" ${u?.property===p?'selected':''}>${p}</option>`).join('')}
          <option value="__new__" ${!isExistingProp && !editId ? 'selected' : ''}>+ Tambah properti baru...</option>
        </select>
        <input class="form-input" id="new-property-input" name="newProperty" placeholder="Nama properti baru..." style="margin-top:8px;display:${(!isExistingProp || !existingProps.length) ? 'block' : 'none'}" value="${(!isExistingProp && u?.property) ? u.property : ''}">
      </div>
      <div class="form-group"><label class="form-label">Blok / Sub-tipe</label>
        <select class="form-select" id="subtype-select" name="subtypeSelect" onchange="onSubtypeSelect(this.value)">
          <option value="">Tanpa blok/sub-tipe</option>
          <option value="__new__">+ Tambah baru...</option>
          ${existingSubtypes.map(s => `<option value="${s}" ${u?.subtype===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <input class="form-input" id="new-subtype-input" name="newSubtype" placeholder="Contoh: Blok A, Tipe Deluxe..." style="margin-top:8px;display:none" value="">
      </div>
      <div class="form-group"><label class="form-label">Nomor / Nama Unit</label>
        <input class="form-input" name="name" required placeholder="Kamar 101" value="${u?.name||''}"></div>
      <div class="form-group"><label class="form-label">Tipe Properti</label>
        <select class="form-select" name="type">
          <option value="kos" ${u?.type==='kos'?'selected':''}>Kos-kosan</option>
          <option value="apartemen" ${u?.type==='apartemen'?'selected':''}>Apartemen</option>
          <option value="rumah" ${u?.type==='rumah'?'selected':''}>Rumah</option>
          <option value="ruko" ${u?.type==='ruko'?'selected':''}>Ruko</option>
          <option value="kantor" ${u?.type==='kantor'?'selected':''}>Gedung Perkantoran</option>
        </select></div>
      <div class="form-group"><label class="form-label">Siklus Pembayaran</label>
        <select class="form-select" name="billingCycle">
          <option value="monthly" ${u?.billingCycle==='yearly'?'':'selected'}>Per Bulan</option>
          <option value="yearly" ${u?.billingCycle==='yearly'?'selected':''}>Per Tahun</option>
        </select></div>
      <div class="form-group"><label class="form-label" id="price-label">Harga Sewa / ${u?.billingCycle==='yearly'?'Tahun':'Bulan'} (Rp)</label>
        <input class="form-input" name="price" type="number" required placeholder="1500000" value="${u?.price||''}"></div>
      <div class="form-group" id="unit-costs-section">
        <label class="form-label" style="margin-bottom:4px">💸 Biaya Tetap per Unit</label>
        <small style="color:var(--text-muted);display:block;margin-bottom:10px">Untuk apartemen: IPL, sinking fund, dll. Kos-kosan bisa dikosongi (pakai biaya properti).</small>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">IPL / Service Charge (Rp/bln)</label>
            <input class="form-input" name="ipl" type="number" placeholder="0" value="${u?.ipl||''}"></div>
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">Sinking Fund (Rp/bln)</label>
            <input class="form-input" name="sinkingFund" type="number" placeholder="0" value="${u?.sinkingFund||''}"></div>
        </div>
        <div style="display:flex;gap:8px">
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">PBB Unit (Rp/thn)</label>
            <input class="form-input" name="unitPbb" type="number" placeholder="0" value="${u?.unitPbb||''}"></div>
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">Biaya Lain (Rp/bln)</label>
            <input class="form-input" name="unitOtherCost" type="number" placeholder="0" value="${u?.unitOtherCost||''}"></div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Fasilitas</label>
        ${buildChipsHtml(_selectedFacilities)}</div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" name="status">
          <option value="vacant" ${u?.status==='vacant'?'selected':''}>Kosong</option>
          <option value="occupied" ${u?.status==='occupied'?'selected':''}>Terisi</option>
        </select></div>
      ${u ? buildUnitPhotoSection(editId) : ''}
      <button type="submit" class="btn btn-primary">${u?'Simpan':'Tambah Unit'}</button>
      ${u?`<div class="btn-group"><button type="button" class="btn btn-danger" onclick="deleteUnit('${editId}')">Hapus</button></div>`:''}
    </form>
    <script>document.querySelector('[name="billingCycle"]').addEventListener('change',function(){document.getElementById('price-label').textContent='Harga Sewa / '+(this.value==='yearly'?'Tahun':'Bulan')+' (Rp)'})<\/script>
  `);
}

function saveUnit(e, editId) {
  e.preventDefault();
  const f = e.target;
  // Resolve property name
  const propSelect = f.propertySelect.value;
  const property = (propSelect === '__new__' || propSelect === '') ? f.newProperty.value.trim() : propSelect;
  if (!property) { alert('Nama properti wajib diisi'); return; }
  // Resolve subtype
  const subSelect = f.subtypeSelect.value;
  const subtype = subSelect === '__new__' ? f.newSubtype.value.trim() : (subSelect || '');

  // Auto-create property record if new
  getOrCreateProperty(property);

  const newFacilities = _selectedFacilities.join(',');
  const newPrice = Number(f.price.value);

  const data = {
    id: editId || DB.genId(), property, subtype, name: f.name.value.trim(),
    type: f.type.value, price: newPrice, billingCycle: f.billingCycle.value,
    ipl: Number(f.ipl.value) || 0, sinkingFund: Number(f.sinkingFund.value) || 0,
    unitPbb: Number(f.unitPbb.value) || 0, unitOtherCost: Number(f.unitOtherCost.value) || 0,
    facilities: newFacilities, status: f.status.value,
    createdAt: editId ? (getUnits().find(x=>x.id===editId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };
  const units = getUnits();
  if (editId) { const i = units.findIndex(x=>x.id===editId); if (i>=0) units[i] = data; }
  else units.push(data);

  // Save/update subtype template
  if (subtype) {
    const oldTpl = getSubtypeTemplate(property, subtype);
    const oldFac = oldTpl?.facilities || '';
    const oldPrice = oldTpl?.price || 0;
    saveSubtypeTemplate(property, subtype, newFacilities, newPrice);

    // Offer propagation if facilities or price changed from template
    const facChanged = oldFac && oldFac !== newFacilities;
    const priceChanged = oldPrice && oldPrice !== newPrice;
    if (facChanged || priceChanged) {
      const siblings = units.filter(u => u.property === property && u.subtype === subtype && u.id !== data.id);
      if (siblings.length > 0) {
        let msg = `Update ${siblings.length} unit lain di "${subtype}"?\n\n`;
        if (facChanged) msg += '✅ Fasilitas akan diperbarui\n';
        if (priceChanged) msg += `✅ Harga akan diubah ke ${formatRpFull(newPrice)}\n`;
        msg += '\nUnit yang sengaja beda bisa diedit ulang nanti.';
        if (confirm(msg)) {
          siblings.forEach(u => {
            if (facChanged) u.facilities = newFacilities;
            if (priceChanged) u.price = newPrice;
          });
        }
      }
    }
  }

  saveUnits(units); closeModal(); refreshCurrentPage();
}

function deleteUnit(id) { if (!confirm('Hapus unit ini?')) return; saveUnits(getUnits().filter(x=>x.id!==id)); closeModal(); refreshCurrentPage(); }

function filterUnits(f, btn) {
  unitFilter = f;
  document.querySelectorAll('#page-units .filter-tab').forEach(t=>t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderUnits();
}

// Track which property groups are collapsed
let _collapsedProps = {};

function togglePropertyGroup(prop) {
  _collapsedProps[prop] = !_collapsedProps[prop];
  renderUnits();
}

// Floor color palette for unit number visual grouping
const _floorColors = [
  '#0d9488', '#6366f1', '#d97706', '#e11d48', '#7c3aed',
  '#059669', '#2563eb', '#c026d3', '#ca8a04', '#dc2626'
];
function getFloorColor(unitName) {
  const match = unitName.match(/(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1]);
  // Extract floor: 101-199 → floor 1, 201-299 → floor 2, etc.
  const floor = num >= 100 ? Math.floor(num / 100) : (num >= 10 ? Math.floor(num / 10) : num);
  return _floorColors[(floor - 1) % _floorColors.length];
}

function renderUnits() {
  const units = getUnits();
  const searchTerm = (document.getElementById('search-unit')?.value || '').toLowerCase().trim();
  let filtered = unitFilter === 'all' ? units : units.filter(u => u.status === unitFilter);
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(searchTerm) ||
      (u.property || '').toLowerCase().includes(searchTerm) ||
      (u.subtype || '').toLowerCase().includes(searchTerm) ||
      (u.facilities || '').toLowerCase().includes(searchTerm)
    );
  }
  const container = document.getElementById('unit-list');

  if (units.length === 0) { container.innerHTML = '<p class="empty-state">Belum ada unit. Tap + untuk menambah.</p>'; return; }

  const icons = { kos:'🏠', apartemen:'🏢', rumah:'🏡', ruko:'🏪', kantor:'🏛' };

  // Group filtered units by property
  const propOrder = [...new Set(units.map(u => u.property))];
  const groups = {};
  propOrder.forEach(p => { groups[p] = []; });
  filtered.forEach(u => { if (groups[u.property]) groups[u.property].push(u); });

  // Remove props with no filtered units
  const visibleProps = propOrder.filter(p => groups[p].length > 0);

  if (visibleProps.length === 0) { container.innerHTML = `<p class="empty-state">${searchTerm ? 'Tidak ditemukan unit "' + searchTerm + '"' : 'Tidak ada unit yang cocok dengan filter.'}</p>`; return; }

  container.innerHTML = visibleProps.map(prop => {
    const propUnits = groups[prop];
    const allPropUnits = units.filter(u => u.property === prop);
    const occCount = allPropUnits.filter(u => u.status === 'occupied').length;
    const totalCount = allPropUnits.length;
    const monthlyIncome = allPropUnits.filter(u => u.status === 'occupied').reduce((s, u) => s + (u.billingCycle === 'yearly' ? u.price / 12 : u.price), 0);
    const type = allPropUnits[0]?.type || 'kos';
    const collapsed = _collapsedProps[prop] && !searchTerm;

    // Group units by subtype within property
    const subtypes = [...new Set(propUnits.map(u => u.subtype || ''))];

    let unitsHtml = '';
    if (!collapsed) {
      unitsHtml = subtypes.map(sub => {
        const subUnits = propUnits.filter(u => (u.subtype || '') === sub).sort((a, b) => naturalSort(a.name, b.name));
        const subLabel = sub ? `<div class="prop-subtype-label">${sub}</div>` : '';
        const subItems = subUnits.map(u => {
          const facs = u.facilities ? u.facilities.split(',').filter(Boolean).slice(0, 4).map(f => `<span class="facility-tag">${getFacilityLabel(f.trim())}</span>`).join('') : '';
          const extraFacs = u.facilities ? u.facilities.split(',').filter(Boolean).length - 4 : 0;
          const floorColor = getFloorColor(u.name);
          const floorDot = floorColor ? `<span class="floor-dot" style="background:${floorColor}" title="Lantai"></span>` : '';
          const hasPhotos = getUnitPhotos().some(p => p.unitId === u.id);
          const hasHistory = getTenantHistory().some(h => h.unitId === u.id);
          return `<div class="unit-item" onclick="showUnitForm('${u.id}')">
            <div class="unit-item-left">
              ${floorDot}
              <span class="unit-item-name">${u.name}</span>
              <span class="badge badge-sm ${u.status === 'occupied' ? 'badge-success' : 'badge-warning'}">${u.status === 'occupied' ? 'Terisi' : 'Kosong'}</span>
              ${hasPhotos ? '<span style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();showUnitPhotos(\'' + u.id + '\')" title="Lihat Foto">📷</span>' : ''}
              ${hasHistory ? '<span style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();showUnitHistory(\'' + u.id + '\')" title="Riwayat Penyewa">📜</span>' : ''}
            </div>
            <div class="unit-item-right">
              <span class="unit-item-price">${formatRp(u.price)}<span class="unit-item-period">/${u.billingCycle==='yearly'?'thn':'bln'}</span></span>
              ${getUnitMonthlyCost(u) > 0 ? `<div style="font-size:10px;color:var(--danger);font-weight:600;margin-top:2px">-${formatRp(getUnitMonthlyCost(u))}/bln</div>` : ''}
            </div>
            ${facs ? `<div class="unit-item-facs">${facs}${extraFacs > 0 ? `<span class="facility-tag fac-more">+${extraFacs}</span>` : ''}</div>` : ''}
          </div>`;
        }).join('');
        return subLabel + subItems;
      }).join('');
    }

    return `<div class="prop-group">
      <div class="prop-group-header" onclick="togglePropertyGroup('${prop.replace(/'/g, "\\'")}')">
        <div class="prop-group-info">
          <div class="prop-group-name">${icons[type] || '🏠'} ${prop}</div>
          <div class="prop-group-stats">${occCount}/${totalCount} terisi · ${formatRp(monthlyIncome)}/bln</div>
        </div>
        <div class="prop-group-actions">
          <button class="prop-action-btn add" onclick="event.stopPropagation(); addUnitForProperty('${prop.replace(/'/g, "\\'")}')" title="Tambah Unit">+</button>
          <button class="prop-action-btn bulk" onclick="event.stopPropagation(); showBulkAddForm('${prop.replace(/'/g, "\\'")}')" title="Tambah Massal">⊞</button>
          <button class="prop-action-btn settings" onclick="event.stopPropagation(); showPropertySettings('${prop.replace(/'/g, "\\'")}')" title="Pengaturan Properti">⚙</button>
          <span class="prop-group-chevron ${collapsed ? 'collapsed' : ''}">▼</span>
        </div>
      </div>
      <div class="prop-group-body ${collapsed ? 'collapsed' : ''}">
        ${unitsHtml}
      </div>
    </div>`;
  }).join('');
}

// ===== TENANT MANAGEMENT =====
function calcDefaultDueDay(startDate) {
  // Default jatuh tempo = tanggal yang sama dengan mulai sewa
  const d = new Date(startDate);
  return d.getDate(); // 1-31, akan di-cap otomatis di bulan pendek
}

function showTenantForm(editId) {
  const tenants = getTenants(), t = editId ? tenants.find(x=>x.id===editId) : null;
  const units = getUnits();
  const taken = tenants.filter(x=>x.id!==editId).map(x=>x.unitId);
  const avail = units.filter(u => !taken.includes(u.id) || (t && t.unitId === u.id));
  const defaultDueDay = t?.dueDay || '';

  openModal(t ? 'Edit Penyewa' : 'Tambah Penyewa', `
    <form onsubmit="saveTenant(event,'${editId||''}')">
      <div class="form-group"><label class="form-label">Nama</label>
        <input class="form-input" name="name" required placeholder="Nama lengkap" value="${t?.name||''}"></div>
      <div class="form-group"><label class="form-label">No. HP / WhatsApp</label>
        <input class="form-input" name="phone" type="tel" placeholder="08xxxxxxxxxx" value="${t?.phone||''}"></div>
      <div class="form-group"><label class="form-label">Unit</label>
        <select class="form-select" name="unitId" required><option value="">Pilih unit...</option>
          ${avail.map(u=>`<option value="${u.id}" ${t?.unitId===u.id?'selected':''}>${u.property} — ${u.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Mulai Sewa</label>
        <input class="form-input" name="startDate" type="date" required value="${t?.startDate||''}" onchange="onTenantStartDateChange(this.value)"></div>
      <div class="form-group"><label class="form-label">Akhir Kontrak</label>
        <input class="form-input" name="endDate" type="date" required value="${t?.endDate||''}"></div>
      <div class="form-group"><label class="form-label">Tgl Jatuh Tempo (tiap bulan)</label>
        <input class="form-input" name="dueDay" type="number" id="tenant-due-day" min="1" max="31" placeholder="Auto: 1 hari sebelum mulai sewa" value="${defaultDueDay}">
        <small style="color:var(--text-muted);display:block;margin-top:4px">Tanggal jatuh tempo pembayaran sewa tiap bulan. Kosongkan = otomatis 1 hari sebelum tanggal mulai sewa.</small></div>
      <div class="form-group"><label class="form-label">Deposit (Rp)</label>
        <input class="form-input" name="deposit" type="number" placeholder="0" value="${t?.deposit||''}"></div>
      <div class="form-group"><label class="form-label">Catatan</label>
        <textarea class="form-textarea" name="notes" placeholder="Catatan...">${t?.notes||''}</textarea></div>
      <button type="submit" class="btn btn-primary">${t?'Simpan':'Tambah Penyewa'}</button>
      ${t?`<div class="btn-group">
        <button type="button" class="btn btn-outline" onclick="regeneratePayments('${editId}')">🔄 Regenerate Tagihan</button>
        <button type="button" class="btn btn-outline" onclick="downloadContract('${editId}')">📄 Buat Kontrak</button>
        <button type="button" class="btn btn-warning" onclick="archiveTenant('${editId}')">📦 Akhiri Kontrak</button>
        <button type="button" class="btn btn-danger" onclick="deleteTenant('${editId}')">Hapus</button>
      </div>`:''}
    </form>
  `);
}

function onTenantStartDateChange(val) {
  const dueDayEl = document.getElementById('tenant-due-day');
  if (dueDayEl && !dueDayEl.value) {
    dueDayEl.placeholder = `Default: tgl ${calcDefaultDueDay(val)}`;
  }
}

function generatePaymentsForTenant(tenant) {
  const units = getUnits();
  const unit = units.find(u => u.id === tenant.unitId);
  if (!unit || !tenant.startDate || !tenant.endDate) return [];

  const amount = unit.price;
  const isYearly = unit.billingCycle === 'yearly';
  const dueDay = tenant.dueDay || calcDefaultDueDay(tenant.startDate);
  const start = new Date(tenant.startDate);
  const end = new Date(tenant.endDate);
  const payments = [];

  if (isYearly) {
    // Generate yearly payments
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      const yr = current.getFullYear();
      const mn = current.getMonth();
      const period = `${yr}-${String(mn + 1).padStart(2, '0')}`;
      const maxDay = new Date(yr, mn + 1, 0).getDate();
      const actualDueDay = Math.min(dueDay, maxDay);
      const dueDate = `${yr}-${String(mn + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

      payments.push({
        id: DB.genId(), type: 'income', tenantId: tenant.id,
        propertyName: unit.property, amount, period, dueDate,
        status: 'pending',
        description: `Sewa Tahunan ${unit.name} — ${tenant.name} (${yr})`,
        autoGenerated: true, billingCycle: 'yearly',
        createdAt: new Date().toISOString()
      });

      // Jump 12 months for next yearly payment
      current.setFullYear(current.getFullYear() + 1);
    }
  } else {
    // Generate monthly payments
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      const yr = current.getFullYear();
      const mn = current.getMonth();
      const period = `${yr}-${String(mn + 1).padStart(2, '0')}`;
      const maxDay = new Date(yr, mn + 1, 0).getDate();
      const actualDueDay = Math.min(dueDay, maxDay);
      const dueDate = `${yr}-${String(mn + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

      payments.push({
        id: DB.genId(), type: 'income', tenantId: tenant.id,
        propertyName: unit.property, amount, period, dueDate,
        status: 'pending',
        description: `Sewa ${unit.name} — ${tenant.name}`,
        autoGenerated: true, billingCycle: 'monthly',
        createdAt: new Date().toISOString()
      });

      current.setMonth(current.getMonth() + 1);
    }
  }

  return payments;
}

function saveTenant(e, editId) {
  e.preventDefault(); const f = e.target;
  const dueDayVal = f.dueDay.value ? Number(f.dueDay.value) : 0;

  const data = { id: editId || DB.genId(), name: f.name.value.trim(), phone: f.phone.value.trim(),
    unitId: f.unitId.value, startDate: f.startDate.value, endDate: f.endDate.value,
    dueDay: dueDayVal || calcDefaultDueDay(f.startDate.value),
    deposit: Number(f.deposit.value)||0, notes: f.notes.value.trim(),
    createdAt: editId ? (getTenants().find(x=>x.id===editId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };
  const tenants = getTenants();
  const isNew = !editId;
  if (editId) { const i = tenants.findIndex(x=>x.id===editId); if (i>=0) tenants[i] = data; }
  else tenants.push(data);
  saveTenants(tenants);

  const units = getUnits(); const ui = units.findIndex(u=>u.id===data.unitId);
  if (ui>=0) { units[ui].status = 'occupied'; saveUnits(units); }

  // Auto-generate payments for new tenant
  if (isNew) {
    const newPayments = generatePaymentsForTenant(data);
    if (newPayments.length > 0) {
      const payments = getPayments();
      payments.push(...newPayments);
      savePayments(payments);
      // Mark past-due ones as overdue
      updateOverduePayments();
      alert(`✅ Penyewa ditambahkan!\n📋 ${newPayments.length} tagihan bulanan otomatis dibuat.\n\nDari ${formatDate(data.startDate)} s/d ${formatDate(data.endDate)}, jatuh tempo tgl ${data.dueDay} tiap bulan.`);
    }
  }

  closeModal(); refreshCurrentPage();
}

function regeneratePayments(tenantId) {
  const tenant = getTenants().find(t => t.id === tenantId);
  if (!tenant) return;

  const payments = getPayments();
  // Find existing auto-generated payments for this tenant
  const existingAuto = payments.filter(p => p.tenantId === tenantId && p.autoGenerated);
  const paidPeriods = existingAuto.filter(p => p.status === 'paid').map(p => p.period);

  // Remove old unpaid auto-generated payments
  const kept = payments.filter(p => !(p.tenantId === tenantId && p.autoGenerated && p.status !== 'paid'));

  // Generate new ones
  const newPayments = generatePaymentsForTenant(tenant);

  // Skip periods that are already paid
  const toAdd = newPayments.filter(p => !paidPeriods.includes(p.period));

  kept.push(...toAdd);
  savePayments(kept);
  updateOverduePayments();

  alert(`🔄 Tagihan di-regenerate!\n✅ ${toAdd.length} tagihan baru\n💰 ${paidPeriods.length} yang sudah lunas tetap dipertahankan`);
  closeModal(); refreshCurrentPage();
}

function deleteTenant(id) {
  if (!confirm('Hapus penyewa ini?\n\nTagihan yang belum dibayar juga akan dihapus.\nTagihan yang sudah lunas tetap disimpan.')) return;
  const t = getTenants().find(x=>x.id===id);
  saveTenants(getTenants().filter(x=>x.id!==id));
  if (t) {
    const units = getUnits(); const ui = units.findIndex(u=>u.id===t.unitId);
    if (ui>=0) { units[ui].status='vacant'; saveUnits(units); }
    // Remove unpaid auto-generated payments
    const payments = getPayments().filter(p => !(p.tenantId === id && p.autoGenerated && p.status !== 'paid'));
    savePayments(payments);
  }
  closeModal(); refreshCurrentPage();
}

function updateOverduePayments() {
  const payments = getPayments();
  let changed = false;
  payments.forEach(p => { if (p.status === 'pending' && daysUntil(p.dueDate) < 0) { p.status = 'overdue'; changed = true; } });
  if (changed) savePayments(payments);
}

function renderTenants() {
  const tenants = getTenants(), units = getUnits();
  const q = (document.getElementById('search-tenant')?.value||'').toLowerCase();
  const filtered = tenants.filter(t => t.name.toLowerCase().includes(q));
  const container = document.getElementById('tenant-list');
  if (filtered.length === 0) { container.innerHTML = '<p class="empty-state">Belum ada penyewa. Tap + untuk menambah.</p>'; return; }
  container.innerHTML = filtered.map(t => {
    const unit = units.find(u=>u.id===t.unitId);
    const dl = daysUntil(t.endDate);
    let badge = dl < 0 ? '<span class="badge badge-danger">Expired</span>' : dl <= 30 ? `<span class="badge badge-warning">${dl}d</span>` : '<span class="badge badge-success">Aktif</span>';
    const ini = t.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    return `<div class="list-item" onclick="showTenantForm('${t.id}')">
      <div style="display:flex;gap:14px;align-items:center">
        <div style="width:44px;height:44px;border-radius:14px;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:15px;flex-shrink:0">${ini}</div>
        <div style="flex:1;min-width:0">
          <div class="list-item-header" style="margin-bottom:4px"><span class="list-item-title">${t.name}</span>${badge}</div>
          <div class="list-item-subtitle" style="margin-bottom:2px">${unit?`${unit.property} — ${unit.name}`:'Unit ?'}</div>
          <div class="list-item-row"><span class="list-item-detail">${formatDate(t.startDate)} — ${formatDate(t.endDate)}</span><span class="list-item-detail">${t.phone||''}</span></div>
        </div></div></div>`;
  }).join('');
}

// ===== PAYMENT TRACKING =====
let paymentFilter = 'all';

function showExpenseForm() {
  showPaymentForm();
  setTimeout(() => {
    const typeSelect = document.querySelector('[name="type"]');
    if (typeSelect) { typeSelect.value = 'expense'; togglePaymentFields('expense'); }
  }, 100);
}

function showPaymentForm(editId) {
  const payments = getPayments(), p = editId ? payments.find(x=>x.id===editId) : null;
  const tenants = getTenants(), units = getUnits();
  const expCat = p?.expenseCategory || 'other';
  openModal(p ? 'Edit Pembayaran' : 'Catat Pembayaran', `
    <form onsubmit="savePayment(event,'${editId||''}')">
      <div class="form-group"><label class="form-label">Tipe</label>
        <select class="form-select" name="type" onchange="togglePaymentFields(this.value)">
          <option value="income" ${p?.type==='income'?'selected':''}>Pemasukan (Sewa)</option>
          <option value="expense" ${p?.type==='expense'?'selected':''}>Pengeluaran</option></select></div>
      <div class="form-group" id="fg-tenant"><label class="form-label">Penyewa</label>
        <select class="form-select" name="tenantId"><option value="">Pilih...</option>
          ${tenants.map(t=>{const u=units.find(x=>x.id===t.unitId);return`<option value="${t.id}" ${p?.tenantId===t.id?'selected':''}>${t.name} (${u?u.name:'-'})</option>`;}).join('')}</select></div>
      <div class="form-group" id="fg-property"><label class="form-label">Properti</label>
        <select class="form-select" name="propertyName"><option value="">Pilih...</option>
          ${[...new Set(units.map(u=>u.property))].map(pr=>`<option value="${pr}" ${p?.propertyName===pr?'selected':''}>${pr}</option>`).join('')}</select></div>
      <div class="form-group" id="fg-expense-category" style="display:none"><label class="form-label">Kategori Pengeluaran</label>
        <select class="form-select" name="expenseCategory">
          ${EXPENSE_CATEGORIES.map(c=>`<option value="${c.id}" ${expCat===c.id?'selected':''}>${c.icon} ${c.label}</option>`).join('')}</select></div>
      <div class="form-group" id="fg-expense-unit" style="display:none"><label class="form-label">Unit (opsional, untuk pengeluaran spesifik unit)</label>
        <select class="form-select" name="expenseUnitId"><option value="">Semua / Umum</option>
          ${units.map(u=>`<option value="${u.id}" ${p?.expenseUnitId===u.id?'selected':''}>${u.property} — ${u.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Jumlah (Rp)</label>
        <input class="form-input" name="amount" type="number" required placeholder="1500000" value="${p?.amount||''}"></div>
      <div class="form-group"><label class="form-label">Periode</label>
        <input class="form-input" name="period" type="month" required value="${p?.period||getMonthYear()}"></div>
      <div class="form-group"><label class="form-label">Jatuh Tempo</label>
        <input class="form-input" name="dueDate" type="date" required value="${p?.dueDate||''}"></div>
      <div class="form-group"><label class="form-label">Status</label>
        <select class="form-select" name="status">
          <option value="pending" ${p?.status==='pending'?'selected':''}>Belum Bayar</option>
          <option value="paid" ${p?.status==='paid'?'selected':''}>Lunas</option></select></div>
      <div class="form-group"><label class="form-label">Keterangan</label>
        <input class="form-input" name="description" placeholder="Sewa bulan..." value="${p?.description||''}"></div>
      <button type="submit" class="btn btn-primary">${p?'Simpan':'Simpan'}</button>
      ${p?`<div class="btn-group">${p.status!=='paid'?`<button type="button" class="btn btn-success" onclick="markPaid('${editId}')">Tandai Lunas</button>`:''}<button type="button" class="btn btn-danger" onclick="deletePayment('${editId}')">Hapus</button></div>`:''}
    </form>
    <script>togglePaymentFields('${p?.type||'income'}')<\/script>
  `);
}

function togglePaymentFields(type) {
  const a = document.getElementById('fg-tenant'), b = document.getElementById('fg-property');
  const c = document.getElementById('fg-expense-category'), d = document.getElementById('fg-expense-unit');
  if (a) a.style.display = type==='income'?'block':'none';
  if (b) b.style.display = type==='expense'?'block':'none';
  if (c) c.style.display = type==='expense'?'block':'none';
  if (d) d.style.display = type==='expense'?'block':'none';
}

function savePayment(e, editId) {
  e.preventDefault(); const f = e.target, type = f.type.value;
  let pn = f.propertyName.value;
  if (type==='income' && f.tenantId.value) {
    const t = getTenants().find(x=>x.id===f.tenantId.value);
    if (t) { const u = getUnits().find(x=>x.id===t.unitId); if (u) pn = u.property; }
  }
  const data = { id: editId||DB.genId(), type, tenantId: type==='income'?f.tenantId.value:'', propertyName: pn,
    amount: Number(f.amount.value), period: f.period.value, dueDate: f.dueDate.value,
    status: f.status.value, description: f.description.value.trim(),
    expenseCategory: type==='expense' ? (f.expenseCategory?.value || 'other') : '',
    expenseUnitId: type==='expense' ? (f.expenseUnitId?.value || '') : '',
    createdAt: editId?(getPayments().find(x=>x.id===editId)?.createdAt||new Date().toISOString()):new Date().toISOString()
  };
  if (data.status==='pending' && daysUntil(data.dueDate)<0) data.status='overdue';
  const payments = getPayments();
  if (editId) { const i = payments.findIndex(x=>x.id===editId); if (i>=0) payments[i]=data; }
  else payments.push(data);
  savePayments(payments); closeModal(); refreshCurrentPage();
}

function markPaid(id) {
  const p = getPayments(); const i = p.findIndex(x=>x.id===id);
  if (i>=0) { p[i].status='paid'; p[i].paidDate=new Date().toISOString(); savePayments(p); }
  closeModal(); refreshCurrentPage();
}

function deletePayment(id) { if (!confirm('Hapus?')) return; savePayments(getPayments().filter(x=>x.id!==id)); closeModal(); refreshCurrentPage(); }

function filterPayments(f, btn) {
  paymentFilter = f;
  document.querySelectorAll('#page-payments .filter-tab').forEach(t=>t.classList.remove('active'));
  if (btn) btn.classList.add('active'); renderPayments();
}

function quickTogglePaid(id, ev) {
  ev.stopPropagation();
  const payments = getPayments();
  const p = payments.find(x => x.id === id);
  if (!p) return;
  if (p.status === 'paid') {
    p.status = 'pending';
    p.paidDate = '';
    if (daysUntil(p.dueDate) < 0) p.status = 'overdue';
  } else {
    p.status = 'paid';
    p.paidDate = new Date().toISOString();
  }
  savePayments(payments);
  refreshCurrentPage();
}

function renderPayments() {
  const payments = getPayments(), tenants = getTenants();
  updateOverduePayments();
  const filtered = paymentFilter==='all' ? payments : payments.filter(p=>p.status===paymentFilter);
  const sorted = filtered.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const container = document.getElementById('payment-list');
  if (sorted.length===0) { container.innerHTML = '<p class="empty-state">Belum ada pembayaran. Tap + untuk mencatat.</p>'; return; }
  container.innerHTML = sorted.map(p => {
    const t = tenants.find(x=>x.id===p.tenantId);
    const st = {paid:{b:'badge-success',l:'✅ Lunas'},pending:{b:'badge-warning',l:'⏳ Pending'},overdue:{b:'badge-danger',l:'⚠️ Nunggak'}}[p.status]||{b:'badge-warning',l:'⏳ Pending'};
    const isExp = p.type==='expense';
    const isPaid = p.status === 'paid';
    const dl = daysUntil(p.dueDate);
    const dueLabel = isPaid ? `Dibayar ${p.paidDate ? formatDate(p.paidDate) : ''}` : dl < 0 ? `Terlambat ${Math.abs(dl)} hari` : dl === 0 ? 'Jatuh tempo HARI INI' : dl <= 5 ? `H-${dl} hari lagi` : `Due: ${formatDate(p.dueDate)}`;
    const dueColor = isPaid ? 'var(--success)' : dl <= 0 ? 'var(--danger)' : dl <= 5 ? '#d97706' : 'var(--text-muted)';

    const toggleBtn = !isExp ? `<button class="pay-toggle-btn ${isPaid ? 'paid' : ''}" onclick="quickTogglePaid('${p.id}', event)" title="${isPaid ? 'Batalkan' : 'Tandai Lunas'}">
      ${isPaid ? '✅' : '☐'}
    </button>` : '';

    return `<div class="list-item payment-item ${isPaid ? 'payment-paid' : ''}" onclick="showPaymentForm('${p.id}')">
      <div style="display:flex;gap:12px;align-items:flex-start;width:100%">
        ${toggleBtn}
        <div style="flex:1;min-width:0">
          <div class="list-item-header"><span class="list-item-title">${isExp ? getExpenseCategoryLabel(p.expenseCategory || 'other') : '💰'} ${isExp?'':(t?.name||'Penyewa')}</span><span class="badge ${st.b}">${st.l}</span></div>
          <div class="list-item-subtitle">${p.propertyName||'-'} · ${p.description||'Sewa '+p.period}</div>
          <div class="list-item-row" style="margin-top:6px">
            <span class="list-item-detail" style="color:${dueColor};font-weight:600">${dueLabel}</span>
            <span style="font-weight:800;font-size:15px;color:${isExp?'var(--danger)':'var(--success)'}">${isExp?'-':'+'}${formatRpFull(p.amount)}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const units = getUnits(), payments = getPayments(), tenants = getTenants(), cm = getMonthYear();
  const total = units.length, occ = units.filter(u=>u.status==='occupied').length;
  const occupancy = total>0 ? Math.round((occ/total)*100) : 0;
  const mp = payments.filter(p=>p.period===cm);
  const inc = mp.filter(p=>p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const exp = mp.filter(p=>p.type==='expense').reduce((s,p)=>s+p.amount,0);
  const overdue = payments.filter(p=>p.status==='overdue').length;

  document.getElementById('greeting-container').innerHTML = `
    <div class="greeting-banner">
      <div class="greeting-text">${getGreeting()} 👋</div>
      <div class="greeting-name">Investor!</div>
      <div class="quick-stats">
        <div class="quick-stat"><span class="quick-stat-value">${total}</span><span class="quick-stat-label">Unit</span></div>
        <div class="quick-stat"><span class="quick-stat-value">${occupancy}%</span><span class="quick-stat-label">Occupancy</span></div>
        <div class="quick-stat"><span class="quick-stat-value">${occ}</span><span class="quick-stat-label">Terisi</span></div>
        <div class="quick-stat"><span class="quick-stat-value" ${overdue>0?'style="color:#ef4444"':''}>${overdue}</span><span class="quick-stat-label">Nunggak</span></div>
      </div>
    </div>`;

  document.getElementById('cf-income').textContent = formatRpFull(inc);
  document.getElementById('cf-expense').textContent = formatRpFull(exp);
  document.getElementById('cf-net').textContent = formatRpFull(inc - exp);

  // Upcoming dues
  const pending = payments.filter(p=>p.status==='pending'||p.status==='overdue').sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).slice(0,5);
  const dc = document.getElementById('upcoming-dues');
  if (!pending.length) dc.innerHTML = '<p class="empty-state">Tidak ada tagihan tertunda</p>';
  else dc.innerHTML = pending.map(p => {
    const t = tenants.find(x=>x.id===p.tenantId), d = daysUntil(p.dueDate);
    const lbl = d<0 ? `<span class="overdue-tag">Terlambat ${Math.abs(d)} hari</span>` : `<span class="upcoming-tag">${d} hari lagi</span>`;
    return `<div class="due-item"><div class="due-info"><span class="due-name">${t?.name||'Pengeluaran'}</span><span class="due-detail">${p.propertyName||'-'} · ${lbl}</span></div><span class="due-amount">${formatRp(p.amount)}</span></div>`;
  }).join('');

  // ROI Cards
  renderROICards();

  // Properties
  const props = [...new Set(units.map(u=>u.property))];
  const pc = document.getElementById('dashboard-properties');
  if (!props.length) pc.innerHTML = '<p class="empty-state">Belum ada properti</p>';
  else pc.innerHTML = props.map(prop => {
    const pu = units.filter(u=>u.property===prop), po = pu.filter(u=>u.status==='occupied').length, pt = pu.length;
    const o = pt>0?Math.round((po/pt)*100):0, circ = 2*Math.PI*16, off = circ-(o/100)*circ;
    const col = o>=80?'var(--success)':o>=50?'var(--warning-dark)':'var(--danger)';
    return `<div class="property-mini"><div class="property-mini-info"><span class="property-mini-name">${prop}</span>
      <span class="property-mini-detail">${po}/${pt} terisi · ${formatRp(pu.reduce((s,u)=>s+(u.status==='occupied'?u.price:0),0))}/bln</span></div>
      <div class="occ-ring"><svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="16" fill="none" stroke="var(--border)" stroke-width="4"/>
        <circle cx="22" cy="22" r="16" fill="none" stroke="${col}" stroke-width="4" stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/>
      </svg><span class="occ-ring-text" style="color:${col}">${o}%</span></div></div>`;
  }).join('');
}

// ===== REPORTS (Overview + Yield + Analytics + Multi) =====
let reportPeriod = 'month';
let reportTab = 'overview';

function switchReportTab(tab, btn) {
  reportTab = tab;
  document.querySelectorAll('#page-reports > .filter-tabs:first-child .filter-tab').forEach(t=>t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.rpt-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(`rpt-tab-${tab}`).classList.add('active');
  renderReports();
}

function changeReportPeriod(p, btn) {
  reportPeriod = p;
  document.querySelectorAll('.sub-filter .filter-tab').forEach(t=>t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderReports();
}

function renderReports() {
  if (reportTab === 'overview') renderOverview();
  else if (reportTab === 'yield') renderYield();
  else if (reportTab === 'analytics') renderAnalytics();
  else if (reportTab === 'multi') renderMultiProperty();
  else if (reportTab === 'kpr') renderKPRSimulator();
  else if (reportTab === 'charts') renderCharts();
}

function renderOverview() {
  const payments = getPayments(), units = getUnits();
  const cp = reportPeriod==='month' ? getMonthYear() : getYear();
  const pp = payments.filter(p => reportPeriod==='month' ? p.period===cp : p.period.startsWith(cp));
  const ti = pp.filter(p=>p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const te = pp.filter(p=>p.type==='expense').reduce((s,p)=>s+p.amount,0);
  const net = ti - te;
  const allProps = getProperties();
  const tpp = allProps.reduce((s,p)=>s+(p.purchasePrice||0),0);
  const totalFixedCosts = allProps.reduce((s,p)=>s+getPropertyAnnualCost(p),0);
  const an = reportPeriod==='month' ? net*12 : net;
  const y = tpp>0 ? (((an - (reportPeriod==='month' ? totalFixedCosts/12 : totalFixedCosts)) / tpp)*100).toFixed(1) : '-';

  document.getElementById('rpt-income').textContent = formatRpFull(ti);
  document.getElementById('rpt-expense').textContent = formatRpFull(te);
  document.getElementById('rpt-net').textContent = formatRpFull(net);
  document.getElementById('rpt-net').style.color = net>=0?'var(--success)':'var(--danger)';
  document.getElementById('rpt-yield').textContent = y==='-'?'-':y+'%';
  document.getElementById('rpt-yield').style.color = 'var(--primary)';

  // P&L per property
  const props = [...new Set(units.map(u=>u.property))];
  const pnl = document.getElementById('report-per-property');
  if (!props.length) pnl.innerHTML = '<p class="empty-state">Belum ada data</p>';
  else {
    const mx = Math.max(...props.map(pr => Math.abs(pp.filter(p=>p.propertyName===pr&&p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0) - pp.filter(p=>p.propertyName===pr&&p.type==='expense').reduce((s,p)=>s+p.amount,0))),1);
    pnl.innerHTML = props.map(pr => {
      const i = pp.filter(p=>p.propertyName===pr&&p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
      const e = pp.filter(p=>p.propertyName===pr&&p.type==='expense').reduce((s,p)=>s+p.amount,0);
      const pf = i-e, bw = mx>0?Math.abs(pf)/mx*100:0, pos = pf>=0;
      return `<div class="pnl-row"><div class="pnl-header"><span class="pnl-name">${pr}</span><span class="pnl-profit ${pos?'positive':'negative'}">${pos?'+':''}${formatRpFull(pf)}</span></div>
        <div class="pnl-bar"><div class="pnl-bar-fill ${pos?'positive':'negative'}" style="width:${bw}%"></div></div></div>`;
    }).join('');
  }

  // Transactions
  const sorted = pp.sort((a,b)=>new Date(b.dueDate)-new Date(a.dueDate)).slice(0,20);
  const tx = document.getElementById('report-transactions');
  if (!sorted.length) tx.innerHTML = '<p class="empty-state">Belum ada transaksi</p>';
  else tx.innerHTML = sorted.map(p => {
    const isE = p.type==='expense';
    return `<div class="tx-item"><div class="tx-info"><span class="tx-desc">${isE?'💸':'💰'} ${p.description||(isE?'Pengeluaran':'Sewa')} — ${p.propertyName||'-'}</span>
      <span class="tx-date">${formatDate(p.dueDate)} · ${p.status==='paid'?'Lunas':'Pending'}</span></div>
      <span class="tx-amount ${isE?'expense':'income'}">${isE?'-':'+'}${formatRp(p.amount)}</span></div>`;
  }).join('');
}

// ===== YIELD CALCULATOR =====
function renderYield() {
  const units = getUnits(), payments = getPayments();
  const props = [...new Set(units.map(u=>u.property))];
  const container = document.getElementById('yield-content');

  if (!props.length) { container.innerHTML = '<p class="empty-state">Tambahkan properti untuk melihat yield.</p>'; return; }

  // Comparison table
  let compHtml = '';
  if (props.length > 1) {
    compHtml = '<div class="card"><h3 class="card-title">📊 Perbandingan Yield</h3><div class="yield-compare-table"><table class="compare-table"><thead><tr><th>Properti</th><th>Gross</th><th>Net</th><th>Eff.</th><th>Payback</th></tr></thead><tbody>';
  }

  let cardsHtml = props.map(prop => {
    const pu = units.filter(u=>u.property===prop);
    const pd = getPropertyData(prop);
    const purchasePrice = pd.purchasePrice || 0;
    const fixedCosts = getPropertyAnnualCost(pd);
    const cicilanPerBulan = pd.cicilanPerBulan || 0;
    const cicilanPerTahun = cicilanPerBulan * 12;
    const sisaTenor = pd.sisaTenor || 0;

    const occCount = pu.filter(u=>u.status==='occupied').length;
    const occRate = pu.length > 0 ? Math.round(occCount / pu.length * 100) : 0;

    const monthlyRent = pu.filter(u=>u.status==='occupied').reduce((s,u)=>s+u.price,0);
    const potentialRent = pu.reduce((s,u)=>s+u.price,0);
    const yearIncome = monthlyRent * 12;

    // Recorded operational expenses from payments
    const cy = getYear();
    const recordedExpense = payments.filter(p=>p.propertyName===prop&&p.type==='expense'&&p.period.startsWith(cy)).reduce((s,p)=>s+p.amount,0);

    // Unit-level annual costs (IPL, sinking fund, PBB unit, etc.)
    const unitsCost = getAllUnitsAnnualCost(pu);

    // Total annual expense (without cicilan — for pure yield)
    const totalAnnualExpense = fixedCosts + unitsCost + recordedExpense;
    // Total with cicilan — for real cashflow
    const totalWithCicilan = totalAnnualExpense + cicilanPerTahun;

    const grossYield = purchasePrice > 0 ? ((yearIncome / purchasePrice) * 100).toFixed(2) : '-';
    const netYield = purchasePrice > 0 ? (((yearIncome - totalAnnualExpense) / purchasePrice) * 100).toFixed(2) : '-';
    const effectiveYield = (netYield !== '-' && occRate > 0) ? ((yearIncome - totalAnnualExpense) / purchasePrice * (occRate/100) * 100).toFixed(2) : netYield;

    const netAnnualProfit = yearIncome - totalAnnualExpense;
    const cashflowAfterCicilan = yearIncome - totalWithCicilan;
    const monthlyCashflow = Math.round(cashflowAfterCicilan / 12);
    const paybackYears = purchasePrice > 0 && netAnnualProfit > 0 ? (purchasePrice / netAnnualProfit).toFixed(1) : '-';
    const paybackLabel = paybackYears !== '-' ? (paybackYears >= 2 ? paybackYears + ' tahun' : Math.round(paybackYears * 12) + ' bulan') : '-';

    // Badge color
    const nv = parseFloat(netYield);
    const badgeColor = isNaN(nv) ? 'var(--text-muted)' : nv >= 8 ? 'var(--success)' : nv >= 4 ? 'var(--warning-dark)' : 'var(--danger)';

    // Add to comparison table
    if (props.length > 1) {
      compHtml += `<tr onclick="showPropertySettings('${prop.replace(/'/g,"\\'")}')"><td style="font-weight:700">${prop}</td><td>${grossYield !== '-' ? grossYield+'%' : '-'}</td><td style="color:${badgeColor};font-weight:800">${netYield !== '-' ? netYield+'%' : '-'}</td><td>${effectiveYield !== '-' ? effectiveYield+'%' : '-'}</td><td>${paybackLabel}</td></tr>`;
    }

    return `<div class="yield-card">
      <div class="yield-card-header">
        <span class="yield-card-name">${prop}</span>
        <span class="yield-card-badge" style="background:${badgeColor}20;color:${badgeColor}">${netYield !== '-' ? 'Net ' + netYield + '%' : 'Belum diisi'}</span>
      </div>
      <div class="yield-section-title">💰 Investasi</div>
      <div class="yield-row"><span>Harga Beli</span><span style="font-weight:700">${purchasePrice>0?formatRpFull(purchasePrice):'<span style="color:var(--warning-dark)">Belum diisi</span>'}</span></div>
      <div class="yield-section-title">📈 Pendapatan</div>
      <div class="yield-row"><span>Sewa Aktual/bln (${occCount} unit)</span><span style="color:var(--success)">${formatRp(monthlyRent)}</span></div>
      <div class="yield-row"><span>Potensi Sewa/bln (${pu.length} unit)</span><span>${formatRp(potentialRent)}</span></div>
      <div class="yield-row"><span>Pendapatan Aktual/thn</span><span style="color:var(--success);font-weight:700">${formatRp(yearIncome)}</span></div>
      <div class="yield-section-title">💸 Pengeluaran Tahunan</div>
      ${fixedCosts > 0 ? `
        ${pd.pbb ? `<div class="yield-row sub"><span>PBB</span><span>${formatRp(pd.pbb)}</span></div>` : ''}
        ${pd.maintenance ? `<div class="yield-row sub"><span>Maintenance</span><span>${formatRp(pd.maintenance)}</span></div>` : ''}
        ${pd.insurance ? `<div class="yield-row sub"><span>Asuransi</span><span>${formatRp(pd.insurance)}</span></div>` : ''}
        ${pd.otherExpense ? `<div class="yield-row sub"><span>Lain-lain</span><span>${formatRp(pd.otherExpense)}</span></div>` : ''}
      ` : ''}
      ${unitsCost > 0 ? `<div class="yield-row sub"><span>Biaya per-unit (IPL, dll)</span><span>${formatRp(unitsCost)}</span></div>` : ''}
      ${recordedExpense > 0 ? `<div class="yield-row sub"><span>Operasional (tercatat)</span><span>${formatRp(recordedExpense)}</span></div>` : ''}
      <div class="yield-row"><span>Total Pengeluaran/thn</span><span style="color:var(--danger);font-weight:700">${formatRp(totalAnnualExpense)}</span></div>
      ${cicilanPerBulan > 0 ? `
        <div class="yield-section-title">🏦 Cicilan Bank</div>
        <div class="yield-row sub"><span>Angsuran/bulan</span><span style="color:var(--danger)">${formatRp(cicilanPerBulan)}</span></div>
        <div class="yield-row sub"><span>Angsuran/tahun</span><span style="color:var(--danger)">${formatRp(cicilanPerTahun)}</span></div>
        ${sisaTenor > 0 ? `<div class="yield-row sub"><span>Sisa tenor</span><span>${sisaTenor > 12 ? Math.floor(sisaTenor/12) + ' thn ' + (sisaTenor%12) + ' bln' : sisaTenor + ' bulan'}</span></div>` : ''}
        <div class="yield-row"><span>Total + Cicilan/thn</span><span style="color:var(--danger);font-weight:700">${formatRp(totalWithCicilan)}</span></div>
      ` : ''}
      <div class="yield-divider"></div>
      <div class="yield-section-title">📊 Analisis Yield</div>
      <div class="yield-row highlight"><span>Gross Yield</span><span style="font-weight:800">${grossYield !== '-' ? grossYield + '%' : '-'}</span></div>
      <div class="yield-row highlight"><span>Net Yield (ROI)</span><span style="color:var(--primary);font-weight:800;font-size:16px">${netYield !== '-' ? netYield + '%' : '-'}</span></div>
      <div class="yield-row highlight"><span>Effective Yield</span><span style="color:${badgeColor};font-weight:800">${effectiveYield !== '-' ? effectiveYield + '%' : '-'}</span></div>
      <div class="yield-row"><span>Occupancy</span><span>${occRate}% (${occCount}/${pu.length})</span></div>
      <div class="yield-divider"></div>
      <div class="yield-row highlight"><span>⏱ Payback Period</span><span style="font-weight:800;color:var(--primary)">${paybackLabel}</span></div>
      <div class="yield-row"><span>Net Profit/thn</span><span style="color:${netAnnualProfit>=0?'var(--success)':'var(--danger)'};font-weight:700">${formatRp(netAnnualProfit)}</span></div>
      ${cicilanPerBulan > 0 ? `
        <div class="yield-divider"></div>
        <div class="yield-section-title">💳 Cashflow Setelah Cicilan</div>
        <div class="yield-row highlight"><span>Cashflow/bulan</span><span style="color:${monthlyCashflow>=0?'var(--success)':'var(--danger)'};font-weight:800;font-size:16px">${monthlyCashflow>=0?'+':''}${formatRp(monthlyCashflow)}</span></div>
        <div class="yield-row highlight"><span>Cashflow/tahun</span><span style="color:${cashflowAfterCicilan>=0?'var(--success)':'var(--danger)'};font-weight:700">${cashflowAfterCicilan>=0?'+':''}${formatRp(cashflowAfterCicilan)}</span></div>
        <div class="yield-row"><span>Status</span><span style="font-weight:700;color:${monthlyCashflow>=0?'var(--success)':'var(--danger)'}">${monthlyCashflow>=0?'✅ Positif — sewa menutupi cicilan':'⚠️ Negatif — perlu topup '+formatRp(Math.abs(monthlyCashflow))+'/bln'}</span></div>
      ` : ''}
      <div style="margin-top:14px">
        <button class="btn btn-outline" onclick="showPropertySettings('${prop.replace(/'/g,"\\'")}')">⚙ Atur Investasi & Biaya</button>
      </div>
    </div>`;
  }).join('');

  if (props.length > 1) {
    compHtml += '</tbody></table></div></div>';
  }

  container.innerHTML = compHtml + cardsHtml;
}

// ===== OCCUPANCY ANALYTICS =====
function renderAnalytics() {
  const units = getUnits(), payments = getPayments(), tenants = getTenants();
  const container = document.getElementById('analytics-content');
  const props = [...new Set(units.map(u=>u.property))];

  if (!props.length) { container.innerHTML = '<p class="empty-state">Tambahkan properti terlebih dahulu.</p>'; return; }

  // Current occupancy per property
  let html = '<div class="card"><h3 class="card-title">Occupancy Rate</h3>';
  props.forEach(prop => {
    const pu = units.filter(u=>u.property===prop);
    const occ = pu.length>0 ? Math.round(pu.filter(u=>u.status==='occupied').length/pu.length*100) : 0;
    html += `<div class="analytics-bar-group"><div class="analytics-bar-label"><span>${prop}</span><span style="font-weight:800;color:${occ>=80?'var(--success)':occ>=50?'var(--warning-dark)':'var(--danger)'}">${occ}%</span></div>
      <div class="analytics-bar"><div class="analytics-bar-fill" style="width:${occ}%;background:${occ>=80?'var(--gradient-success)':occ>=50?'var(--gradient-warm)':'var(--gradient-danger)'}"></div></div></div>`;
  });
  html += '</div>';

  // Occupancy trend (last 6 months simulation from payment data)
  html += '<div class="card"><h3 class="card-title">Tren Occupancy (6 Bulan)</h3>';
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('id-ID', {month:'short'}), key: getMonthYear(d) });
  }
  const totalUnits = units.length || 1;
  months.forEach(m => {
    // Count units that had income payments in that month as "occupied"
    const occupiedCount = new Set(payments.filter(p => p.period === m.key && p.type === 'income').map(p => p.tenantId)).size;
    const rate = Math.min(Math.round((occupiedCount / totalUnits) * 100), 100);
    html += `<div class="analytics-bar-group"><div class="analytics-bar-label"><span>${m.label}</span><span>${rate}%</span></div>
      <div class="analytics-bar"><div class="analytics-bar-fill" style="width:${rate}%"></div></div></div>`;
  });
  html += '</div>';

  // Kontrak akan habis
  html += '<div class="card"><h3 class="card-title">Prediksi Vacancy</h3>';
  const expiring = tenants.filter(t => {
    const d = daysUntil(t.endDate);
    return d >= -30 && d <= 90;
  }).sort((a,b) => new Date(a.endDate) - new Date(b.endDate));

  if (!expiring.length) html += '<p class="empty-state">Tidak ada kontrak yang akan habis dalam 90 hari</p>';
  else {
    expiring.forEach(t => {
      const unit = units.find(u=>u.id===t.unitId);
      const d = daysUntil(t.endDate);
      const status = d < 0 ? 'Sudah expired' : d <= 30 ? `${d} hari lagi` : `${d} hari lagi`;
      const color = d < 0 ? 'var(--danger)' : d <= 30 ? 'var(--warning-dark)' : 'var(--text-secondary)';
      html += `<div class="due-item"><div class="due-info"><span class="due-name">${t.name}</span>
        <span class="due-detail">${unit?unit.property+' — '+unit.name:'-'}</span></div>
        <span style="font-size:13px;font-weight:700;color:${color}">${status}</span></div>`;
    });
  }
  html += '</div>';

  container.innerHTML = html;
}

// ===== MULTI-PROPERTY VIEW =====
function renderMultiProperty() {
  const units = getUnits(), payments = getPayments(), tenants = getTenants();
  const props = [...new Set(units.map(u=>u.property))];
  const container = document.getElementById('multi-content');

  if (!props.length) { container.innerHTML = '<p class="empty-state">Belum ada properti.</p>'; return; }

  const cm = getMonthYear();
  container.innerHTML = props.map(prop => {
    const pu = units.filter(u=>u.property===prop);
    const pd = getPropertyData(prop);
    const purchasePrice = pd.purchasePrice || 0;
    const fixedCosts = getPropertyAnnualCost(pd);
    const occCount = pu.filter(u=>u.status==='occupied').length;
    const vacCount = pu.length - occCount;
    const occRate = pu.length>0 ? Math.round(occCount/pu.length*100) : 0;
    const monthInc = payments.filter(p=>p.propertyName===prop&&p.period===cm&&p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
    const monthExp = payments.filter(p=>p.propertyName===prop&&p.period===cm&&p.type==='expense').reduce((s,p)=>s+p.amount,0);
    const net = monthInc - monthExp;
    const potentialRent = pu.reduce((s,u)=>s+u.price,0);
    const monthlyRent = pu.filter(u=>u.status==='occupied').reduce((s,u)=>s+u.price,0);
    const yearIncome = monthlyRent * 12;
    const cy = getYear();
    const recordedExpense = payments.filter(p=>p.propertyName===prop&&p.type==='expense'&&p.period.startsWith(cy)).reduce((s,p)=>s+p.amount,0);
    const unitsCostMulti = getAllUnitsAnnualCost(pu);
    const totalAnnualExpense = fixedCosts + unitsCostMulti + recordedExpense;
    const netYield = purchasePrice > 0 ? (((yearIncome - totalAnnualExpense) / purchasePrice) * 100).toFixed(1) : '-';
    const netProfit = yearIncome - totalAnnualExpense;
    const paybackYears = purchasePrice > 0 && netProfit > 0 ? (purchasePrice / netProfit).toFixed(1) : '-';
    const paybackLabel = paybackYears !== '-' ? (paybackYears >= 2 ? paybackYears + ' thn' : Math.round(paybackYears * 12) + ' bln') : '-';
    const propTenants = tenants.filter(t => pu.some(u=>u.id===t.unitId));
    const overdueCount = payments.filter(p=>p.propertyName===prop&&p.status==='overdue').length;
    const type = pu[0]?.type || 'kos';
    const icons = { kos:'🏠', apartemen:'🏢', rumah:'🏡', ruko:'🏪', kantor:'🏛' };

    return `<div class="mp-card" onclick="showPropertySettings('${prop.replace(/'/g,"\\'")}')">
      <div class="mp-card-header">
        <span class="mp-card-name">${icons[type]||'🏠'} ${prop}</span>
        <span class="mp-card-type">${type} · ${pu.length} unit</span>
      </div>
      <div class="mp-stats">
        <div class="mp-stat"><span class="mp-stat-value" style="color:${occRate>=80?'var(--success)':occRate>=50?'var(--warning-dark)':'var(--danger)'}">${occRate}%</span><span class="mp-stat-label">Occupancy</span></div>
        <div class="mp-stat"><span class="mp-stat-value" style="color:var(--success)">${formatRp(monthInc)}</span><span class="mp-stat-label">Income/bln</span></div>
        <div class="mp-stat"><span class="mp-stat-value" style="color:${net>=0?'var(--success)':'var(--danger)'}">${formatRp(net)}</span><span class="mp-stat-label">Net/bln</span></div>
      </div>
      <div class="mp-yield-row">
        <div class="mp-yield-item"><span class="mp-yield-label">Net Yield</span><span class="mp-yield-value" style="color:var(--primary)">${netYield !== '-' ? netYield + '%' : '-'}</span></div>
        <div class="mp-yield-item"><span class="mp-yield-label">Payback</span><span class="mp-yield-value">${paybackLabel}</span></div>
        <div class="mp-yield-item"><span class="mp-yield-label">Investasi</span><span class="mp-yield-value">${purchasePrice > 0 ? formatRp(purchasePrice) : '-'}</span></div>
      </div>
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--text-secondary)">
        <span>🏷 Potensi: ${formatRp(potentialRent)}/bln</span>
        <span>👥 ${propTenants.length} penyewa</span>
        <span>🔴 ${vacCount} kosong</span>
        ${overdueCount?`<span style="color:var(--danger)">⚠ ${overdueCount} nunggak</span>`:''}
      </div>
    </div>`;
  }).join('');
}

// ===== KPR SIMULATOR =====
let _kprState = null;

function renderKPRSimulator() {
  const container = document.getElementById('kpr-content');
  const units = getUnits();
  const props = [...new Set(units.map(u => u.property))];

  // Default values
  const d = _kprState || {
    hargaProperti: 500000000, dp: 20, tenor: 20,
    fixedRate: 6.5, fixedYears: 3, floatingRate: 11,
    provisi: 1, adminFee: 750000, appraisal: 750000,
    asuransiJiwa: 0.2, asuransiKebakaran: 0.075,
    bphtbRate: 5, njoptkp: 60000000, notaris: 0.75,
    selectedProperty: '',
    sewaAwal: 0, rentFreq: 1,
    rentConservative: 5, rentModerate: 7, rentOptimistic: 10
  };

  container.innerHTML = `
    <div class="card">
      <h3 class="card-title">🏦 Simulasi KPR</h3>
      <small style="color:var(--text-muted);display:block;margin-bottom:16px">Hitung angsuran dan total biaya KPR. Semua angka bisa diedit.</small>

      ${props.length > 0 ? `<div class="form-group"><label class="form-label">Pilih Properti (opsional)</label>
        <select class="form-select" id="kpr-property" onchange="kprSelectProperty(this.value)">
          <option value="">Custom / Manual</option>
          ${props.map(p => {
            const pd = getPropertyData(p);
            return `<option value="${p}" ${d.selectedProperty === p ? 'selected' : ''}>${p}${pd.purchasePrice ? ' — ' + formatRp(pd.purchasePrice) : ''}</option>`;
          }).join('')}
        </select></div>` : ''}

      <div class="kpr-section-title">💰 Harga & DP</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Harga Properti</label><input type="number" id="kpr-harga" value="${d.hargaProperti}" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>DP (%)</label><input type="number" id="kpr-dp" value="${d.dp}" step="5" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Tenor (tahun)</label><input type="number" id="kpr-tenor" value="${d.tenor}" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">📊 Suku Bunga</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Bunga Fixed (%/thn)</label><input type="number" id="kpr-fixed-rate" value="${d.fixedRate}" step="0.1" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>Periode Fixed (thn)</label><input type="number" id="kpr-fixed-years" value="${d.fixedYears}" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Bunga Floating (%/thn)</label><input type="number" id="kpr-floating-rate" value="${d.floatingRate}" step="0.1" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">🧾 Biaya Akad (One-Time)</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Provisi (%)</label><input type="number" id="kpr-provisi" value="${d.provisi}" step="0.1" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>Admin (Rp)</label><input type="number" id="kpr-admin" value="${d.adminFee}" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Appraisal (Rp)</label><input type="number" id="kpr-appraisal" value="${d.appraisal}" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>Notaris (%)</label><input type="number" id="kpr-notaris" value="${d.notaris}" step="0.1" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>BPHTB (%)</label><input type="number" id="kpr-bphtb" value="${d.bphtbRate}" step="0.5" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>NJOPTKP (Rp)</label><input type="number" id="kpr-njoptkp" value="${d.njoptkp}" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">🛡 Asuransi (% / tahun)</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Asuransi Jiwa (%)</label><input type="number" id="kpr-as-jiwa" value="${d.asuransiJiwa}" step="0.01" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>As. Kebakaran (%)</label><input type="number" id="kpr-as-kebakaran" value="${d.asuransiKebakaran}" step="0.01" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">📈 Proyeksi Kenaikan Sewa</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Sewa saat ini (Rp/bln)</label><input type="number" id="kpr-sewa-awal" value="${d.sewaAwal}" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>Naik tiap (tahun)</label><input type="number" id="kpr-rent-freq" value="${d.rentFreq}" min="1" max="5" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>Konservatif (%)</label><input type="number" id="kpr-rent-low" value="${d.rentConservative}" step="0.5" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>Moderat (%)</label><input type="number" id="kpr-rent-mid" value="${d.rentModerate}" step="0.5" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>Optimistik (%)</label><input type="number" id="kpr-rent-high" value="${d.rentOptimistic}" step="0.5" oninput="calcKPR()"></div>
      </div>
      <small style="color:var(--text-muted);display:block;margin-top:4px;padding:0 4px">Sewa naik setiap N tahun. 3 skenario dihitung bersamaan.</small>
    </div>

    <div id="kpr-results"></div>
  `;

  calcKPR();
}

function kprSelectProperty(propName) {
  if (!propName) return;
  const pd = getPropertyData(propName);
  if (pd.purchasePrice) document.getElementById('kpr-harga').value = pd.purchasePrice;
  // Fill rent from property units
  const propUnits = getUnits().filter(u => u.property === propName);
  const potentialRent = propUnits.reduce((s, u) => s + u.price, 0);
  if (potentialRent > 0) document.getElementById('kpr-sewa-awal').value = potentialRent;
  _kprState = { ..._kprState, selectedProperty: propName };
  calcKPR();
}

function calcKPR() {
  const v = id => Number(document.getElementById(id)?.value || 0);

  const harga = v('kpr-harga');
  const dpPct = v('kpr-dp');
  const tenor = v('kpr-tenor');
  const fixedRate = v('kpr-fixed-rate');
  const fixedYears = v('kpr-fixed-years');
  const floatingRate = v('kpr-floating-rate');
  const provisiPct = v('kpr-provisi');
  const adminFee = v('kpr-admin');
  const appraisal = v('kpr-appraisal');
  const notarisPct = v('kpr-notaris');
  const bphtbPct = v('kpr-bphtb');
  const njoptkp = v('kpr-njoptkp');
  const asJiwa = v('kpr-as-jiwa');
  const asKebakaran = v('kpr-as-kebakaran');

  // Persist all inputs to _kprState so they survive page navigation
  _kprState = {
    hargaProperti: harga, dp: dpPct, tenor, fixedRate, fixedYears, floatingRate,
    provisi: provisiPct, adminFee, appraisal, notaris: notarisPct,
    asuransiJiwa: asJiwa, asuransiKebakaran: asKebakaran,
    bphtbRate: bphtbPct, njoptkp,
    selectedProperty: document.getElementById('kpr-property')?.value || '',
    sewaAwal: v('kpr-sewa-awal'), rentFreq: v('kpr-rent-freq'),
    rentConservative: v('kpr-rent-low'), rentModerate: v('kpr-rent-mid'), rentOptimistic: v('kpr-rent-high')
  };

  if (harga <= 0 || tenor <= 0) return;

  const dpAmount = harga * dpPct / 100;
  const loanAmount = harga - dpAmount;
  const totalMonths = tenor * 12;
  const fixedMonths = fixedYears * 12;
  const floatingMonths = totalMonths - fixedMonths;

  // Monthly payment calculation (annuity)
  function calcMonthly(principal, annualRate, months) {
    if (months <= 0 || principal <= 0) return 0;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  }

  const monthlyFixed = calcMonthly(loanAmount, fixedRate, totalMonths);
  // Remaining principal after fixed period
  let remainingPrincipal = loanAmount;
  const rFixed = fixedRate / 100 / 12;
  for (let i = 0; i < fixedMonths && i < totalMonths; i++) {
    const interest = remainingPrincipal * rFixed;
    const principal = monthlyFixed - interest;
    remainingPrincipal -= principal;
  }
  const monthlyFloating = floatingMonths > 0 ? calcMonthly(Math.max(remainingPrincipal, 0), floatingRate, floatingMonths) : 0;

  // Total interest
  const totalPaidFixed = monthlyFixed * Math.min(fixedMonths, totalMonths);
  const totalPaidFloating = monthlyFloating * Math.max(floatingMonths, 0);
  const totalPaid = totalPaidFixed + totalPaidFloating;
  const totalInterest = totalPaid - loanAmount;

  // One-time costs
  const provisiAmount = loanAmount * provisiPct / 100;
  const notarisAmount = harga * notarisPct / 100;
  const bphtbBase = Math.max(harga - njoptkp, 0);
  const bphtbAmount = bphtbBase * bphtbPct / 100;
  const totalOneTime = dpAmount + provisiAmount + adminFee + appraisal + notarisAmount + bphtbAmount;

  // Annual insurance
  const annualAsJiwa = loanAmount * asJiwa / 100;
  const annualAsKebakaran = harga * asKebakaran / 100;
  const totalInsurancePerYear = annualAsJiwa + annualAsKebakaran;
  const monthlyInsurance = Math.round(totalInsurancePerYear / 12);

  // Total cost of ownership
  const totalCostOwnership = totalOneTime + totalPaid + (totalInsurancePerYear * tenor);

  // Property comparison overlay
  const selectedProp = document.getElementById('kpr-property')?.value || '';
  let overlayHtml = '';
  if (selectedProp) {
    const units = getUnits().filter(u => u.property === selectedProp);
    const monthlyRent = units.filter(u => u.status === 'occupied').reduce((s, u) => s + u.price, 0);
    const potentialRent = units.reduce((s, u) => s + u.price, 0);
    const totalMonthlyOut = monthlyFixed + monthlyInsurance;
    const cashflowFixed = monthlyRent - totalMonthlyOut;
    const totalMonthlyOutFloat = monthlyFloating + monthlyInsurance;
    const cashflowFloating = monthlyRent - totalMonthlyOutFloat;

    overlayHtml = `
      <div class="card kpr-overlay-card">
        <h3 class="card-title">📊 Overlay — ${selectedProp}</h3>
        <div class="yield-row"><span>Sewa aktual/bln</span><span style="color:var(--success);font-weight:700">${formatRp(monthlyRent)}</span></div>
        <div class="yield-row"><span>Potensi sewa/bln</span><span>${formatRp(potentialRent)}</span></div>
        <div class="yield-divider"></div>
        <div class="yield-row"><span>Cicilan Fixed + Asuransi/bln</span><span style="color:var(--danger)">${formatRp(Math.round(totalMonthlyOut))}</span></div>
        <div class="yield-row highlight"><span>Cashflow (Fixed)</span><span style="color:${cashflowFixed>=0?'var(--success)':'var(--danger)'};font-weight:800;font-size:16px">${cashflowFixed>=0?'+':''}${formatRp(Math.round(cashflowFixed))}/bln</span></div>
        ${floatingMonths > 0 ? `
          <div class="yield-divider"></div>
          <div class="yield-row"><span>Cicilan Floating + Asuransi/bln</span><span style="color:var(--danger)">${formatRp(Math.round(totalMonthlyOutFloat))}</span></div>
          <div class="yield-row highlight"><span>Cashflow (Floating)</span><span style="color:${cashflowFloating>=0?'var(--success)':'var(--danger)'};font-weight:800;font-size:16px">${cashflowFloating>=0?'+':''}${formatRp(Math.round(cashflowFloating))}/bln</span></div>
        ` : ''}
        <div class="yield-divider"></div>
        <div class="yield-row"><span>Verdict</span><span style="font-weight:800;color:${cashflowFixed>=0?'var(--success)':'var(--danger)'}">${cashflowFixed>=0?'✅ Sewa menutupi cicilan':'⚠️ Perlu topup '+formatRp(Math.abs(Math.round(cashflowFixed)))+'/bln'}</span></div>
      </div>`;
  }

  // Build yearly amortization schedule
  let amortRows = [];
  let bal = loanAmount;
  for (let yr = 1; yr <= tenor; yr++) {
    const isFixed = yr <= fixedYears;
    const rate = isFixed ? fixedRate : floatingRate;
    const monthly = isFixed ? monthlyFixed : monthlyFloating;
    const r = rate / 100 / 12;
    let yearInterest = 0, yearPrincipal = 0;
    for (let m = 0; m < 12 && bal > 0; m++) {
      const interest = bal * r;
      const principal = Math.min(monthly - interest, bal);
      yearInterest += interest;
      yearPrincipal += principal;
      bal -= principal;
    }
    amortRows.push({ yr, rate, monthly: Math.round(monthly), interest: Math.round(yearInterest), principal: Math.round(yearPrincipal), balance: Math.round(Math.max(bal, 0)), isFixed });
  }

  const amortHtml = `<div class="card">
    <h3 class="card-title" onclick="document.getElementById('amort-table').classList.toggle('collapsed')" style="cursor:pointer">
      📅 Jadwal Amortisasi Per Tahun <span style="font-size:12px;color:var(--text-muted)">(tap untuk buka/tutup)</span>
    </h3>
    <div id="amort-table" class="collapsed">
      <div class="yield-compare-table"><table class="compare-table amort">
        <thead><tr><th>Thn</th><th>Rate</th><th>Cicilan/bln</th><th>Pokok/thn</th><th>Bunga/thn</th><th>Sisa</th></tr></thead>
        <tbody>${amortRows.map(r => `<tr class="${r.isFixed?'':'amort-floating'}">
          <td>${r.yr}</td><td>${r.rate}%${r.isFixed?' ★':''}</td><td>${formatRp(r.monthly)}</td>
          <td>${formatRp(r.principal)}</td><td style="color:var(--danger)">${formatRp(r.interest)}</td>
          <td style="font-weight:700">${formatRp(r.balance)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">★ = Periode fixed rate</div>
    </div>
  </div>`;

  // ===== RENT PROJECTION =====
  const sewaAwal = v('kpr-sewa-awal');
  const rentFreq = Math.max(1, v('kpr-rent-freq'));
  const rentLow = v('kpr-rent-low');
  const rentMid = v('kpr-rent-mid');
  const rentHigh = v('kpr-rent-high');

  let rentProjectionHtml = '';
  if (sewaAwal > 0) {
    const scenarios = [
      { label: 'Konservatif', pct: rentLow, color: '#d97706', icon: '🐢' },
      { label: 'Moderat', pct: rentMid, color: '#0d9488', icon: '📊' },
      { label: 'Optimistik', pct: rentHigh, color: '#7c3aed', icon: '🚀' }
    ];

    // Build projection rows per scenario
    const projections = scenarios.map(sc => {
      let rent = sewaAwal;
      let cumRent = 0, cumCicilan = 0;
      let cumNetCashflow = -totalOneTime; // Start negative: DP + biaya akad sudah keluar
      let cashflowBreakeven = null; // When monthly rent >= monthly payment
      let investBreakeven = null;   // When cumulative cashflow recoups initial outlay
      let fullPaybackYear = null;   // When cumulative rent >= total cost of ownership (fixed final number)
      const rows = [];
      for (let yr = 1; yr <= tenor; yr++) {
        if (yr > 1 && (yr - 1) % rentFreq === 0) {
          rent = Math.round(rent * (1 + sc.pct / 100));
        }
        const cicilanBulan = yr <= fixedYears ? monthlyFixed : monthlyFloating;
        const totalOut = cicilanBulan + monthlyInsurance;
        const cashflow = rent - totalOut;
        cumRent += rent * 12;
        cumCicilan += totalOut * 12;
        cumNetCashflow += cashflow * 12;
        if (cashflowBreakeven === null && cashflow >= 0) cashflowBreakeven = yr;
        if (investBreakeven === null && cumNetCashflow >= 0) investBreakeven = yr;
        if (fullPaybackYear === null && cumRent >= totalCostOwnership) fullPaybackYear = yr;
        rows.push({ yr, rent: Math.round(rent), cicilan: Math.round(totalOut), cashflow: Math.round(cashflow), cumRent: Math.round(cumRent), cumCicilan: Math.round(cumCicilan), cumNetCashflow: Math.round(cumNetCashflow) });
      }
      return { ...sc, rows, cashflowBreakeven, investBreakeven, fullPaybackYear, finalRent: Math.round(rent), totalRent: Math.round(cumRent), totalCicilan: Math.round(cumCicilan) };
    });

    // Summary cards
    const summaryCards = projections.map(p => {
      const netCum = p.totalRent - p.totalCicilan;
      return `<div class="rent-scenario-card" style="border-left:4px solid ${p.color}">
        <div style="font-weight:800;font-size:13px;color:${p.color};margin-bottom:8px">${p.icon} ${p.label} (${p.pct}%/${rentFreq}thn)</div>
        <div class="yield-row sub"><span>Sewa awal</span><span>${formatRp(sewaAwal)}/bln</span></div>
        <div class="yield-row sub"><span>Sewa tahun ke-${tenor}</span><span style="font-weight:700;color:var(--success)">${formatRp(p.finalRent)}/bln</span></div>
        <div class="yield-row sub"><span>Kenaikan total</span><span style="font-weight:700">${((p.finalRent / sewaAwal - 1) * 100).toFixed(0)}%</span></div>
        <div class="yield-divider"></div>
        <div class="yield-row sub"><span>Total sewa ${tenor} thn</span><span style="color:var(--success);font-weight:700">${formatRp(p.totalRent)}</span></div>
        <div class="yield-row sub"><span>Total cicilan+asuransi</span><span style="color:var(--danger);font-weight:700">${formatRp(p.totalCicilan)}</span></div>
        <div class="yield-row sub"><span>Modal awal (DP+akad)</span><span style="color:var(--danger);font-weight:700">${formatRp(Math.round(totalOneTime))}</span></div>
        <div class="yield-row highlight"><span>Net kumulatif</span><span style="font-weight:800;font-size:15px;color:${netCum>=0?'var(--success)':'var(--danger)'}">${netCum>=0?'+':''}${formatRp(netCum)}</span></div>
        <div class="yield-divider"></div>
        <div class="yield-divider"></div>
        <div class="yield-row sub"><span>📅 Cashflow positif</span><span style="font-weight:700;color:${p.color}">${p.cashflowBreakeven ? 'Tahun ke-' + p.cashflowBreakeven : '❌ Tidak tercapai'}</span></div>
        <div class="yield-row sub"><span>💰 Balik modal (DP+akad)</span><span style="font-weight:700;color:${p.color}">${p.investBreakeven ? 'Tahun ke-' + p.investBreakeven : '❌ Belum dalam ' + tenor + ' thn'}</span></div>
        <div class="yield-row highlight"><span>🏆 Lunas total</span><span style="font-weight:800;font-size:14px;color:${p.color}">${p.fullPaybackYear ? 'Tahun ke-' + p.fullPaybackYear : '❌ Belum dalam ' + tenor + ' thn'}</span></div>
        <small style="color:var(--text-muted);font-size:10px;display:block;margin-top:4px">Lunas = sewa kumulatif ≥ ${formatRp(Math.round(totalCostOwnership))} (DP+akad+cicilan+asuransi)</small>
      </div>`;
    }).join('');

    // Yearly detail table
    const detailRows = [];
    for (let yr = 0; yr < tenor; yr++) {
      const r = projections.map(p => p.rows[yr]);
      const cicilanBulan = r[0].cicilan;
      detailRows.push(`<tr${r[0].yr <= fixedYears ? '' : ' class="amort-floating"'}>
        <td>${r[0].yr}</td>
        <td>${formatRp(cicilanBulan)}</td>
        <td style="color:#d97706">${formatRp(r[0].rent)}</td>
        <td style="color:#0d9488">${formatRp(r[1].rent)}</td>
        <td style="color:#7c3aed">${formatRp(r[2].rent)}</td>
        <td style="color:${r[1].cashflow>=0?'var(--success)':'var(--danger)'};font-weight:700">${r[1].cashflow>=0?'+':''}${formatRp(r[1].cashflow)}</td>
      </tr>`);
    }

    // Visual bar chart — cumulative net cashflow (includes initial investment payback)
    const modRows = projections[1].rows;
    const maxAbsCum = Math.max(...modRows.map(r => Math.abs(r.cumNetCashflow)), 1);
    const barChart = modRows.filter((_, i) => i % Math.max(1, Math.floor(tenor / 10)) === 0 || modRows[i]?.yr === projections[1].investBreakeven).map(r => {
      const pct = Math.abs(r.cumNetCashflow) / maxAbsCum * 100;
      const isPositive = r.cumNetCashflow >= 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;font-size:11px">
        <span style="width:32px;text-align:right;color:var(--text-muted)">Thn ${r.yr}</span>
        <div style="flex:1;height:14px;background:var(--border);border-radius:7px;overflow:hidden;position:relative">
          <div style="width:${Math.min(pct,100)}%;height:100%;background:${isPositive?'var(--success)':'var(--danger)'};border-radius:7px;transition:width 0.3s"></div>
        </div>
        <span style="width:80px;font-weight:700;font-size:10px;color:${isPositive?'var(--success)':'var(--danger)'}">${isPositive?'+':''}${formatRp(r.cumNetCashflow)}</span>
      </div>`;
    }).join('');

    rentProjectionHtml = `
      <div class="card">
        <h3 class="card-title">📈 Proyeksi Sewa vs Cicilan</h3>
        <small style="color:var(--text-muted);display:block;margin-bottom:16px">Sewa naik ${rentFreq === 1 ? 'tiap tahun' : `tiap ${rentFreq} tahun`} · 3 skenario</small>
        <div class="rent-scenarios">${summaryCards}</div>
      </div>

      <div class="card">
        <h3 class="card-title">📊 Balik Modal — Moderat (${rentMid}%)</h3>
        <small style="color:var(--text-muted);display:block;margin-bottom:12px">Hijau = sudah balik modal · Merah = belum balik modal (termasuk DP + biaya akad)</small>
        ${barChart}
      </div>

      <div class="card">
        <h3 class="card-title" onclick="document.getElementById('rent-detail-table').classList.toggle('collapsed')" style="cursor:pointer">
          📋 Detail Per Tahun <span style="font-size:12px;color:var(--text-muted)">(tap buka/tutup)</span>
        </h3>
        <div id="rent-detail-table" class="collapsed">
          <div class="yield-compare-table"><table class="compare-table amort">
            <thead><tr>
              <th>Thn</th><th>Cicilan/bln</th>
              <th style="color:#d97706">Konser.</th>
              <th style="color:#0d9488">Moder.</th>
              <th style="color:#7c3aed">Optim.</th>
              <th>CF Mod.</th>
            </tr></thead>
            <tbody>${detailRows.join('')}</tbody>
          </table></div>
        </div>
      </div>`;
  }

  // Save to property button
  let saveBtn = '';
  if (selectedProp) {
    saveBtn = `<div class="card" style="text-align:center;padding:16px">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Simpan hasil simulasi ke pengaturan properti?</p>
      <button class="btn btn-primary" onclick="saveKPRToProperty('${selectedProp.replace(/'/g,"\\'")}', ${Math.round(monthlyFixed)}, ${totalMonths})">
        📥 Simpan Cicilan ke ${selectedProp}
      </button>
      <small style="display:block;margin-top:8px;color:var(--text-muted)">Cicilan ${formatRpFull(Math.round(monthlyFixed))}/bln · ${totalMonths} bulan akan disimpan</small>
    </div>`;
  }

  // Render results
  document.getElementById('kpr-results').innerHTML = `
    <div class="card">
      <h3 class="card-title">📋 Hasil Simulasi</h3>

      <div class="kpr-section-title">💵 Pinjaman</div>
      <div class="yield-row"><span>Harga Properti</span><span style="font-weight:700">${formatRpFull(harga)}</span></div>
      <div class="yield-row"><span>DP (${dpPct}%)</span><span>${formatRpFull(Math.round(dpAmount))}</span></div>
      <div class="yield-row highlight"><span>Jumlah Pinjaman</span><span style="font-weight:800;color:var(--primary)">${formatRpFull(Math.round(loanAmount))}</span></div>

      <div class="kpr-section-title">📅 Angsuran Bulanan</div>
      <div class="yield-row highlight"><span>Periode Fixed (${fixedYears} thn, ${fixedRate}%)</span><span style="font-weight:800;font-size:16px;color:var(--danger)">${formatRpFull(Math.round(monthlyFixed))}</span></div>
      ${floatingMonths > 0 ? `<div class="yield-row highlight"><span>Periode Floating (${tenor-fixedYears} thn, ${floatingRate}%)</span><span style="font-weight:800;font-size:16px;color:var(--danger)">${formatRpFull(Math.round(monthlyFloating))}</span></div>` : ''}
      <div class="yield-row"><span>Asuransi/bln</span><span>${formatRp(monthlyInsurance)}</span></div>
      <div class="yield-row highlight"><span>Total bayar/bln (Fixed)</span><span style="font-weight:800;color:var(--danger)">${formatRpFull(Math.round(monthlyFixed + monthlyInsurance))}</span></div>

      <div class="kpr-section-title">🧾 Biaya Akad (Bayar di Muka)</div>
      <div class="yield-row sub"><span>DP</span><span>${formatRp(Math.round(dpAmount))}</span></div>
      <div class="yield-row sub"><span>Provisi (${provisiPct}%)</span><span>${formatRp(Math.round(provisiAmount))}</span></div>
      <div class="yield-row sub"><span>Admin</span><span>${formatRp(adminFee)}</span></div>
      <div class="yield-row sub"><span>Appraisal</span><span>${formatRp(appraisal)}</span></div>
      <div class="yield-row sub"><span>Notaris (${notarisPct}%)</span><span>${formatRp(Math.round(notarisAmount))}</span></div>
      <div class="yield-row sub"><span>BPHTB (${bphtbPct}%)</span><span>${formatRp(Math.round(bphtbAmount))}</span></div>
      <div class="yield-row highlight"><span>Total Bayar di Muka</span><span style="font-weight:800;color:var(--danger)">${formatRpFull(Math.round(totalOneTime))}</span></div>

      <div class="kpr-section-title">📊 Ringkasan Total</div>
      <div class="yield-row"><span>Total Angsuran (${tenor} thn)</span><span>${formatRpFull(Math.round(totalPaid))}</span></div>
      <div class="yield-row"><span>Total Bunga Dibayar</span><span style="color:var(--danger)">${formatRpFull(Math.round(totalInterest))}</span></div>
      <div class="yield-row"><span>Total Asuransi (${tenor} thn)</span><span>${formatRp(Math.round(totalInsurancePerYear * tenor))}</span></div>
      <div class="yield-divider"></div>
      <div class="yield-row highlight"><span>Total Biaya Kepemilikan</span><span style="font-weight:800;font-size:16px;color:var(--primary)">${formatRpFull(Math.round(totalCostOwnership))}</span></div>
      <div class="yield-row"><span>vs Harga Properti</span><span style="color:var(--danger);font-weight:700">${(totalCostOwnership/harga*100).toFixed(0)}% (${(totalCostOwnership/harga).toFixed(1)}×)</span></div>
    </div>

    ${amortHtml}
    ${overlayHtml}
    ${rentProjectionHtml}
    ${saveBtn}

    <div class="card">
      <h3 class="card-title">💡 Tips</h3>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.7">
        <p>• DP lebih besar = cicilan lebih kecil + total bunga lebih rendah</p>
        <p>• Pertimbangkan refinancing sebelum floating rate dimulai</p>
        <p>• Cashflow positif = sewa menutupi cicilan (ideal untuk investor)</p>
        <p>• Total biaya kepemilikan ${(totalCostOwnership/harga).toFixed(1)}× dari harga properti — pastikan yield tetap menguntungkan</p>
        ${sewaAwal > 0 ? `<p>• Dengan kenaikan sewa ${rentMid}%/${rentFreq}thn, sewa kamu bisa mencapai ${formatRp(Math.round(sewaAwal * Math.pow(1 + rentMid/100, Math.floor(tenor/rentFreq))))}/bln di akhir tenor</p>` : ''}
      </div>
    </div>
  `;
}

function saveKPRToProperty(propName, cicilanPerBulan, sisaTenor) {
  const props = getProperties();
  let prop = props.find(p => p.name === propName);
  if (!prop) {
    prop = getOrCreateProperty(propName);
  } else {
    prop.cicilanPerBulan = cicilanPerBulan;
    prop.sisaTenor = sisaTenor;
    saveProperties(props);
  }
  alert(`Tersimpan! Cicilan ${formatRpFull(cicilanPerBulan)}/bln (${sisaTenor} bulan) disimpan ke "${propName}".`);
}

// ===== PROPERTY SETTINGS FORM =====
function showPropertySettings(propName) {
  const pd = getPropertyData(propName);
  const units = getUnits();
  const subtypes = [...new Set(units.filter(u => u.property === propName && u.subtype).map(u => u.subtype))];
  const esc = s => s.replace(/'/g, "\\'");

  let subtypeHtml = '';
  if (subtypes.length > 0) {
    subtypeHtml = `<div class="form-group"><label class="form-label">Blok / Sub-tipe</label>
      <div class="subtype-manage-list">
        ${subtypes.map(s => {
          const tpl = getSubtypeTemplate(propName, s);
          const facCount = tpl?.facilities ? tpl.facilities.split(',').filter(Boolean).length : 0;
          const tplInfo = tpl ? `${formatRp(tpl.price)}/bln · ${facCount} fasilitas` : 'Belum ada template';
          return `<div class="subtype-manage-item">
          <div class="subtype-manage-info">
            <span class="subtype-manage-name">${s}</span>
            <span class="subtype-manage-detail">${tplInfo}</span>
          </div>
          <div class="subtype-manage-actions">
            <button type="button" class="subtype-btn rename" onclick="renameSubtype('${esc(propName)}','${esc(s)}')" title="Rename">✏️</button>
            <button type="button" class="subtype-btn delete" onclick="deleteSubtype('${esc(propName)}','${esc(s)}')" title="Hapus">🗑️</button>
          </div>
        </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  openModal(`⚙ Pengaturan — ${propName}`, `
    <form onsubmit="savePropertySettings(event, '${esc(propName)}')">
      <div class="form-group"><label class="form-label">Nama Properti</label>
        <input class="form-input" name="propName" value="${propName}" required>
        <small style="color:var(--text-muted);font-size:12px">Ubah nama properti ini</small></div>
      ${subtypeHtml}
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">Nama Pemilik</label>
        <input class="form-input" name="ownerName" value="${pd.ownerName||''}" placeholder="Nama lengkap pemilik"></div>
      <div class="form-group"><label class="form-label">Alamat Pemilik</label>
        <input class="form-input" name="ownerAddress" value="${pd.ownerAddress||''}" placeholder="Alamat lengkap"></div>
      <div class="form-group"><label class="form-label">No. KTP Pemilik</label>
        <input class="form-input" name="ownerKTP" value="${pd.ownerKTP||''}" placeholder="No. KTP / NIK"></div>
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">Harga Beli / Investasi Awal (Rp)</label>
        <input class="form-input" name="purchasePrice" type="number" placeholder="500000000" value="${pd.purchasePrice||''}">
        <small style="color:var(--text-muted);font-size:12px">Total harga beli properti (tanah + bangunan)</small></div>
      <div class="form-group"><label class="form-label">PBB / Tahun (Rp)</label>
        <input class="form-input" name="pbb" type="number" placeholder="2000000" value="${pd.pbb||''}">
        <small style="color:var(--text-muted);font-size:12px">Pajak Bumi & Bangunan tahunan</small></div>
      <div class="form-group"><label class="form-label">Biaya Maintenance / Tahun (Rp)</label>
        <input class="form-input" name="maintenance" type="number" placeholder="5000000" value="${pd.maintenance||''}">
        <small style="color:var(--text-muted);font-size:12px">Renovasi, perbaikan, perawatan gedung</small></div>
      <div class="form-group"><label class="form-label">Asuransi / Tahun (Rp)</label>
        <input class="form-input" name="insurance" type="number" placeholder="0" value="${pd.insurance||''}"></div>
      <div class="form-group"><label class="form-label">Biaya Lain-lain / Tahun (Rp)</label>
        <input class="form-input" name="otherExpense" type="number" placeholder="0" value="${pd.otherExpense||''}">
        <small style="color:var(--text-muted);font-size:12px">Listrik induk, kebersihan, keamanan, dll</small></div>
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">🏦 Cicilan Bank / Bulan (Rp)</label>
        <input class="form-input" name="cicilanPerBulan" type="number" placeholder="0" value="${pd.cicilanPerBulan||''}">
        <small style="color:var(--text-muted);font-size:12px">Angsuran KPR bulanan (pokok + bunga)</small></div>
      <div class="form-group"><label class="form-label">Sisa Tenor (bulan)</label>
        <input class="form-input" name="sisaTenor" type="number" placeholder="0" value="${pd.sisaTenor||''}">
        <small style="color:var(--text-muted);font-size:12px">Berapa bulan lagi cicilan lunas</small></div>
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">Catatan</label>
        <textarea class="form-textarea" name="notes" placeholder="Catatan properti...">${pd.notes||''}</textarea></div>
      <button type="submit" class="btn btn-primary">Simpan</button>
    </form>
    <div class="prop-settings-divider"></div>
    <button class="btn btn-danger" onclick="deleteProperty('${esc(propName)}')">🗑️ Hapus Properti & Semua Unit</button>
  `);
}

function savePropertySettings(e, oldPropName) {
  e.preventDefault();
  const f = e.target;
  const newPropName = f.propName.value.trim();
  if (!newPropName) { alert('Nama properti wajib diisi'); return; }

  const props = getProperties();
  let prop = props.find(p => p.name === oldPropName);
  if (!prop) {
    prop = { id: DB.genId(), name: oldPropName, createdAt: new Date().toISOString() };
    props.push(prop);
  }

  // Rename property across all data if name changed
  if (newPropName !== oldPropName) {
    // Check duplicate
    if (props.some(p => p.name === newPropName && p.name !== oldPropName)) {
      alert('Nama properti sudah dipakai'); return;
    }
    // Update units
    const units = getUnits();
    units.forEach(u => { if (u.property === oldPropName) u.property = newPropName; });
    saveUnits(units);
    // Update payments
    const payments = getPayments();
    payments.forEach(p => { if (p.propertyName === oldPropName) p.propertyName = newPropName; });
    savePayments(payments);
    // Update subtype templates
    const templates = getSubtypeTemplates();
    templates.forEach(t => { if (t.property === oldPropName) t.property = newPropName; });
    saveSubtypeTemplates(templates);
    // Update property record
    prop.name = newPropName;
  }

  prop.ownerName = f.ownerName.value.trim();
  prop.ownerAddress = f.ownerAddress.value.trim();
  prop.ownerKTP = f.ownerKTP.value.trim();
  prop.purchasePrice = Number(f.purchasePrice.value) || 0;
  prop.pbb = Number(f.pbb.value) || 0;
  prop.maintenance = Number(f.maintenance.value) || 0;
  prop.insurance = Number(f.insurance.value) || 0;
  prop.otherExpense = Number(f.otherExpense.value) || 0;
  prop.cicilanPerBulan = Number(f.cicilanPerBulan.value) || 0;
  prop.sisaTenor = Number(f.sisaTenor.value) || 0;
  prop.notes = f.notes.value.trim();
  saveProperties(props);
  closeModal();
  refreshCurrentPage();
}

function deleteProperty(propName) {
  const units = getUnits().filter(u => u.property === propName);
  const msg = units.length > 0
    ? `Hapus properti "${propName}" beserta ${units.length} unit di dalamnya?\n\nPenyewa terkait akan kehilangan unit. Data ini tidak bisa di-undo.`
    : `Hapus properti "${propName}"?`;
  if (!confirm(msg)) return;

  // Remove units
  const allUnits = getUnits().filter(u => u.property !== propName);
  saveUnits(allUnits);
  // Remove related tenants' unit references
  const removedIds = units.map(u => u.id);
  const tenants = getTenants();
  tenants.forEach(t => { if (removedIds.includes(t.unitId)) t.unitId = ''; });
  saveTenants(tenants);
  // Remove property record
  saveProperties(getProperties().filter(p => p.name !== propName));
  closeModal();
  refreshCurrentPage();
}

function renameSubtype(propName, oldSub) {
  const newSub = prompt(`Rename "${oldSub}" menjadi:`, oldSub);
  if (!newSub || newSub.trim() === '' || newSub.trim() === oldSub) return;
  const units = getUnits();
  units.forEach(u => { if (u.property === propName && u.subtype === oldSub) u.subtype = newSub.trim(); });
  saveUnits(units);
  // Update template
  const templates = getSubtypeTemplates();
  const tpl = templates.find(t => t.property === propName && t.subtype === oldSub);
  if (tpl) { tpl.subtype = newSub.trim(); saveSubtypeTemplates(templates); }
  closeModal();
  showPropertySettings(propName);
}

function deleteSubtype(propName, sub) {
  const units = getUnits();
  const affected = units.filter(u => u.property === propName && u.subtype === sub);
  if (!confirm(`Hapus sub-tipe "${sub}"?\n\n${affected.length} unit akan kehilangan sub-tipe ini (unit tidak dihapus, hanya sub-tipenya di-clear).`)) return;
  units.forEach(u => { if (u.property === propName && u.subtype === sub) u.subtype = ''; });
  saveUnits(units);
  // Remove template
  saveSubtypeTemplates(getSubtypeTemplates().filter(t => !(t.property === propName && t.subtype === sub)));
  closeModal();
  showPropertySettings(propName);
}

// Add unit pre-filled with property name
function addUnitForProperty(propName) {
  showUnitForm();
  // After modal opens, pre-select the property
  setTimeout(() => {
    const sel = document.querySelector('[name="propertySelect"]');
    if (sel) {
      for (const opt of sel.options) {
        if (opt.value === propName) { sel.value = propName; break; }
      }
      onPropertySelect(propName);
      const newInput = document.getElementById('new-property-input');
      if (newInput) { newInput.style.display = 'none'; newInput.value = ''; }
    }
  }, 100);
}

function showBulkAddForm(propName) {
  const units = getUnits();
  const existingSubtypes = [...new Set(units.filter(u => u.property === propName && u.subtype).map(u => u.subtype))];
  const propData = getPropertyData(propName);
  const type = units.find(u => u.property === propName)?.type || 'kos';

  openModal('Tambah Unit Massal', `
    <form onsubmit="saveBulkUnits(event, '${propName.replace(/'/g,"\\'")}')">
      <div class="card" style="background:var(--primary-glow);padding:14px;margin-bottom:16px;border-radius:12px">
        <div style="font-size:13px;color:var(--primary);font-weight:700">📦 ${propName}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Otomatis generate banyak unit sekaligus</div>
      </div>

      <div class="form-group"><label class="form-label">Blok / Sub-tipe</label>
        <select class="form-select" name="subtypeSelect" id="bulk-subtype" onchange="onBulkSubtypeChange(this.value, '${propName.replace(/'/g,"\\'")}')">
          <option value="">Tanpa blok/sub-tipe</option>
          ${existingSubtypes.map(s => `<option value="${s}">${s}</option>`).join('')}
          <option value="__new__">+ Tambah baru...</option>
        </select>
        <input class="form-input" id="bulk-new-subtype" placeholder="Nama sub-tipe baru..." style="margin-top:8px;display:none">
      </div>

      <div class="form-group"><label class="form-label">Range Nomor Unit</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" name="startNum" type="number" placeholder="101" required style="flex:1">
          <span style="color:var(--text-muted);font-weight:700">s/d</span>
          <input class="form-input" name="endNum" type="number" placeholder="120" required style="flex:1">
        </div>
        <small style="color:var(--text-muted);margin-top:6px;display:block">Contoh: 101 s/d 120 → generate 20 unit (101, 102, ... 120)</small>
      </div>

      <div class="form-group"><label class="form-label">Prefix (opsional)</label>
        <input class="form-input" name="prefix" placeholder="Contoh: Kamar, Unit, Room">
        <small style="color:var(--text-muted);margin-top:4px;display:block">Hasil: "Kamar 101", "Kamar 102", dll. Kosongkan = hanya angka.</small>
      </div>

      <div class="form-group"><label class="form-label">Skip Nomor (opsional)</label>
        <input class="form-input" name="skipNums" placeholder="Contoh: 104, 113">
        <small style="color:var(--text-muted);margin-top:4px;display:block">Nomor yang dilewati (misal: sudah terpakai).</small>
      </div>

      <div class="form-group"><label class="form-label">Harga Sewa / Bulan (Rp)</label>
        <input class="form-input" name="price" type="number" id="bulk-price" placeholder="1500000" value="0">
      </div>

      <div class="form-group"><label class="form-label">Status Awal</label>
        <select class="form-select" name="status">
          <option value="vacant">Kosong</option>
          <option value="occupied">Terisi</option>
        </select>
      </div>

      <div id="bulk-preview" style="margin-bottom:16px"></div>

      <button type="submit" class="btn btn-primary">Tambah Semua Unit</button>
    </form>
    <script>
      document.querySelector('[name="startNum"]').addEventListener('input', previewBulk);
      document.querySelector('[name="endNum"]').addEventListener('input', previewBulk);
      document.querySelector('[name="prefix"]').addEventListener('input', previewBulk);
      document.querySelector('[name="skipNums"]').addEventListener('input', previewBulk);
    </script>
  `);
}

function onBulkSubtypeChange(val, propName) {
  document.getElementById('bulk-new-subtype').style.display = val === '__new__' ? 'block' : 'none';
  if (val && val !== '__new__') {
    const tpl = getSubtypeTemplate(propName, val);
    if (tpl?.price) document.getElementById('bulk-price').value = tpl.price;
  }
}

function previewBulk() {
  const start = Number(document.querySelector('[name="startNum"]')?.value || 0);
  const end = Number(document.querySelector('[name="endNum"]')?.value || 0);
  const prefix = document.querySelector('[name="prefix"]')?.value?.trim() || '';
  const skipStr = document.querySelector('[name="skipNums"]')?.value || '';
  const skipNums = skipStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);

  if (start <= 0 || end <= 0 || end < start) {
    document.getElementById('bulk-preview').innerHTML = '';
    return;
  }

  const count = end - start + 1 - skipNums.filter(n => n >= start && n <= end).length;
  const sample = [];
  for (let i = start; i <= Math.min(start + 4, end); i++) {
    if (!skipNums.includes(i)) sample.push(prefix ? `${prefix} ${i}` : `${i}`);
  }
  const remaining = count - sample.length;

  document.getElementById('bulk-preview').innerHTML = `
    <div class="card" style="padding:12px;border-radius:10px;background:var(--bg)">
      <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px">Preview: ${count} unit akan dibuat</div>
      <div style="font-size:12px;color:var(--text-secondary)">${sample.join(', ')}${remaining > 0 ? `, ... +${remaining} lainnya` : ''}</div>
    </div>
  `;
}

function saveBulkUnits(e, propName) {
  e.preventDefault();
  const f = e.target;
  const subSelect = f.subtypeSelect.value;
  const subtype = subSelect === '__new__' ? document.getElementById('bulk-new-subtype').value.trim() : (subSelect || '');
  const start = Number(f.startNum.value);
  const end = Number(f.endNum.value);
  const prefix = f.prefix.value.trim();
  const price = Number(f.price.value) || 0;
  const status = f.status.value;
  const skipStr = f.skipNums?.value || '';
  const skipNums = skipStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);

  if (start <= 0 || end < start) { alert('Range nomor tidak valid'); return; }
  if (end - start > 500) { alert('Maksimal 500 unit per batch'); return; }

  const units = getUnits();
  const type = units.find(u => u.property === propName)?.type || 'kos';
  const existingNames = new Set(units.filter(u => u.property === propName).map(u => u.name));

  // Get template facilities if subtype exists
  const tpl = subtype ? getSubtypeTemplate(propName, subtype) : null;
  const facilities = tpl?.facilities || '';

  getOrCreateProperty(propName);

  let added = 0, skipped = 0;
  for (let i = start; i <= end; i++) {
    if (skipNums.includes(i)) continue;
    const name = prefix ? `${prefix} ${i}` : `${i}`;
    if (existingNames.has(name)) { skipped++; continue; }
    units.push({
      id: DB.genId(), property: propName, subtype, name,
      type, price, facilities, status,
      createdAt: new Date().toISOString()
    });
    added++;
  }

  if (added === 0) { alert('Tidak ada unit baru ditambahkan. Semua nomor sudah ada.'); return; }

  saveUnits(units);
  closeModal();
  refreshCurrentPage();
  alert(`✅ ${added} unit berhasil ditambahkan!${skipped > 0 ? `\n⚠️ ${skipped} unit dilewati (sudah ada).` : ''}`);
}

// ===== TELEGRAM REMINDER =====
function getTelegramConfig() {
  return { token: DB.getVal('tg_token'), chatId: DB.getVal('tg_chatId') };
}

function saveTelegramConfig(token, chatId) {
  DB.setVal('tg_token', token);
  DB.setVal('tg_chatId', chatId);
}

async function sendTelegramReminder() {
  const cfg = getTelegramConfig();
  if (!cfg.token || !cfg.chatId) { alert('Atur Bot Token & Chat ID di Settings terlebih dahulu.'); return; }

  const payments = getPayments(), tenants = getTenants(), units = getUnits();
  const pending = payments.filter(p => (p.status === 'pending' || p.status === 'overdue') && p.type === 'income');

  if (!pending.length) { alert('Tidak ada tagihan pending.'); return; }

  let msg = '🏠 *PropertiKu — Reminder Sewa*\n\n';
  pending.forEach(p => {
    const t = tenants.find(x => x.id === p.tenantId);
    const d = daysUntil(p.dueDate);
    const status = d < 0 ? `⚠️ TERLAMBAT ${Math.abs(d)} hari` : `⏳ ${d} hari lagi`;
    msg += `👤 *${t?.name || 'Penyewa'}*\n`;
    msg += `📍 ${p.propertyName || '-'}\n`;
    msg += `💰 ${formatRpFull(p.amount)} — ${p.description || 'Sewa ' + p.period}\n`;
    msg += `📅 Jatuh tempo: ${formatDate(p.dueDate)} (${status})\n\n`;
  });

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cfg.chatId, text: msg, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    if (data.ok) alert('Reminder berhasil dikirim ke Telegram!');
    else alert('Gagal: ' + (data.description || 'Unknown error'));
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ===== SETTINGS =====
function showSettings() {
  const cfg = getTelegramConfig();
  const isDark = getTheme() === 'dark';
  openModal('Pengaturan', `
    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">🌙 Mode Gelap</label>
      <div style="display:flex;align-items:center;gap:12px">
        <label style="position:relative;display:inline-block;width:50px;height:28px;cursor:pointer">
          <input type="checkbox" ${isDark ? 'checked' : ''} onchange="toggleTheme();showSettings()" style="opacity:0;width:0;height:0">
          <span style="position:absolute;inset:0;background:${isDark ? 'var(--primary)' : 'var(--border)'};border-radius:28px;transition:0.3s"></span>
          <span style="position:absolute;top:3px;left:${isDark ? '25px' : '3px'};width:22px;height:22px;background:white;border-radius:50%;transition:0.3s"></span>
        </label>
        <span style="font-size:13px;color:var(--text-secondary)">${isDark ? 'Aktif' : 'Nonaktif'}</span>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">💾 Penggunaan Storage</label>
      <div style="font-size:13px;color:var(--text-secondary)">${getStorageUsage()} MB digunakan dari ~5 MB</div>
      <div style="height:6px;background:var(--border);border-radius:3px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${Math.min(parseFloat(getStorageUsage()) / 5 * 100, 100)}%;background:var(--primary);border-radius:3px"></div></div>
    </div>

    <div class="yield-divider" style="margin:16px 0"></div>

    <div class="settings-info">
      🤖 Hubungkan Telegram Bot untuk mengirim reminder tagihan sewa ke chat pribadimu.
    </div>

    <div class="card" style="background:var(--bg);padding:14px;border-radius:12px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;color:var(--primary);margin-bottom:10px">📋 Cara Setup (5 menit)</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
        <strong>Step 1 — Buat Bot</strong><br>
        1. Buka Telegram, cari <strong>@BotFather</strong><br>
        2. Kirim <code>/newbot</code><br>
        3. Beri nama bot (misal: "PropertiKu Reminder")<br>
        4. Beri username bot (misal: "PropertiKu_bot")<br>
        5. BotFather akan kasih <strong>Token</strong> → copy & paste di bawah<br>
        <br>
        <strong>Step 2 — Dapatkan Chat ID</strong><br>
        1. Buka bot kamu di Telegram (cari username-nya)<br>
        2. Klik <strong>Start</strong>, lalu kirim pesan apa saja (misal: "halo")<br>
        3. Paste token di bawah, lalu klik tombol <strong>"🔍 Ambil Chat ID"</strong><br>
        <br>
        <strong>Step 3 — Test & Simpan</strong><br>
        1. Klik <strong>"🧪 Test Koneksi"</strong> untuk verifikasi<br>
        2. Klik <strong>"Simpan Pengaturan"</strong><br>
        3. Gunakan <strong>"📨 Kirim Reminder"</strong> kapan saja!
      </div>
    </div>

    <form onsubmit="saveSettingsForm(event)">
      <div class="form-group"><label class="form-label">Telegram Bot Token</label>
        <input class="form-input" name="tgToken" id="tg-token-input" placeholder="123456789:ABCdefGHI-jklMNOpqrSTUvwxYZ" value="${cfg.token}"></div>

      <div class="form-group"><label class="form-label">Telegram Chat ID</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" name="tgChatId" id="tg-chatid-input" placeholder="123456789" value="${cfg.chatId}" style="flex:1">
          <button type="button" class="btn btn-outline" onclick="fetchTelegramChatId()" style="white-space:nowrap;font-size:12px">🔍 Ambil Chat ID</button>
        </div>
        <div id="tg-chatid-status" style="font-size:11px;margin-top:6px;color:var(--text-muted)"></div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button type="button" class="btn btn-outline" onclick="testTelegramConnection()" style="flex:1;font-size:13px">🧪 Test Koneksi</button>
        <button type="submit" class="btn btn-primary" style="flex:1;font-size:13px">💾 Simpan</button>
      </div>
    </form>

    <div id="tg-test-result" style="margin-bottom:12px"></div>

    <button class="btn btn-success" onclick="sendTelegramReminder()" style="width:100%;margin-bottom:16px">📨 Kirim Reminder Sekarang</button>

    <div class="yield-divider" style="margin:16px 0"></div>
    <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">📦 Backup & Restore</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button type="button" class="btn btn-outline" onclick="exportData()" style="flex:1">📤 Export Data</button>
      <button type="button" class="btn btn-outline" onclick="importData()" style="flex:1">📥 Import Data</button>
    </div>
    <small style="color:var(--text-muted);display:block;margin-bottom:16px">Export data dari PC, lalu Import di HP untuk mindahin data.</small>

    <div class="yield-divider" style="margin:16px 0"></div>
    <div class="btn-group">
      <button class="btn btn-danger" onclick="if(confirm('Hapus SEMUA data? Tidak bisa di-undo.')) { localStorage.clear(); location.reload(); }">🗑 Reset Semua Data</button>
    </div>
  `);
}

async function fetchTelegramChatId() {
  const token = document.getElementById('tg-token-input')?.value?.trim();
  const statusEl = document.getElementById('tg-chatid-status');
  if (!token) { statusEl.innerHTML = '<span style="color:var(--danger)">❌ Isi Bot Token dulu di atas</span>'; return; }

  statusEl.innerHTML = '<span style="color:var(--primary)">⏳ Mengambil Chat ID...</span>';
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (!data.ok) {
      statusEl.innerHTML = `<span style="color:var(--danger)">❌ Token tidak valid: ${data.description || 'Error'}</span>`;
      return;
    }
    if (!data.result || data.result.length === 0) {
      statusEl.innerHTML = '<span style="color:var(--danger)">❌ Belum ada pesan. Buka bot kamu di Telegram, klik <strong>Start</strong>, kirim pesan "halo", lalu coba lagi.</span>';
      return;
    }
    // Find the latest chat ID from messages
    const lastMsg = data.result[data.result.length - 1];
    const chatId = lastMsg.message?.chat?.id || lastMsg.channel_post?.chat?.id || '';
    const chatName = lastMsg.message?.chat?.first_name || lastMsg.message?.chat?.title || 'Unknown';
    if (chatId) {
      document.getElementById('tg-chatid-input').value = chatId;
      statusEl.innerHTML = `<span style="color:var(--success)">✅ Chat ID ditemukan: <strong>${chatId}</strong> (${chatName})</span>`;
    } else {
      statusEl.innerHTML = '<span style="color:var(--danger)">❌ Tidak bisa menemukan Chat ID. Coba kirim pesan baru ke bot.</span>';
    }
  } catch (err) {
    statusEl.innerHTML = `<span style="color:var(--danger)">❌ Error: ${err.message}</span>`;
  }
}

async function testTelegramConnection() {
  const token = document.getElementById('tg-token-input')?.value?.trim();
  const chatId = document.getElementById('tg-chatid-input')?.value?.trim();
  const resultEl = document.getElementById('tg-test-result');

  if (!token || !chatId) {
    resultEl.innerHTML = '<div class="settings-info" style="background:#fef2f2;color:var(--danger)">❌ Isi Bot Token dan Chat ID terlebih dahulu.</div>';
    return;
  }

  resultEl.innerHTML = '<div class="settings-info" style="background:var(--primary-glow);color:var(--primary)">⏳ Mengirim pesan test...</div>';
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '✅ PropertiKu berhasil terhubung!\n\nBot ini akan mengirim reminder tagihan sewa.', parse_mode: 'Markdown' })
    });
    const data = await res.json();
    if (data.ok) {
      resultEl.innerHTML = '<div class="settings-info" style="background:#f0fdf4;color:var(--success)">✅ Berhasil! Cek Telegram kamu — pesan test sudah terkirim. Klik "Simpan" untuk menyimpan pengaturan.</div>';
    } else {
      resultEl.innerHTML = `<div class="settings-info" style="background:#fef2f2;color:var(--danger)">❌ Gagal: ${data.description || 'Unknown error'}</div>`;
    }
  } catch (err) {
    resultEl.innerHTML = `<div class="settings-info" style="background:#fef2f2;color:var(--danger)">❌ Error: ${err.message}</div>`;
  }
}

function saveSettingsForm(e) {
  e.preventDefault();
  const f = e.target;
  saveTelegramConfig(f.tgToken.value.trim(), f.tgChatId.value.trim());
  alert('✅ Pengaturan tersimpan!');
}

// ===== AUTO REMINDER ON LOAD =====
async function autoReminderCheck() {
  const cfg = getTelegramConfig();
  if (!cfg.token || !cfg.chatId) return; // Not configured

  const today = new Date().toISOString().slice(0, 10);
  const lastSent = DB.getVal('lastReminderDate');
  if (lastSent === today) return; // Already sent today

  const payments = getPayments();
  const upcoming = payments.filter(p => {
    if (p.status === 'paid') return false;
    const dl = daysUntil(p.dueDate);
    return dl >= 0 && dl <= 5; // Due within 5 days
  });
  const overdue = payments.filter(p => p.status === 'overdue' || (p.status === 'pending' && daysUntil(p.dueDate) < 0));

  const needReminder = [...upcoming, ...overdue];
  if (needReminder.length === 0) return;

  const tenants = getTenants();
  let msg = '🏠 *PropertiKu — Reminder Otomatis*\n';
  msg += `📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;

  if (overdue.length > 0) {
    msg += '⚠️ *NUNGGAK / TERLAMBAT:*\n';
    overdue.forEach(p => {
      const t = tenants.find(x => x.id === p.tenantId);
      const dl = Math.abs(daysUntil(p.dueDate));
      msg += `• ${t?.name || 'Penyewa'} — ${formatRpFull(p.amount)} (terlambat ${dl} hari)\n`;
      msg += `  📍 ${p.propertyName || '-'} · ${p.description || ''}\n`;
    });
    msg += '\n';
  }

  if (upcoming.length > 0) {
    msg += '⏳ *JATUH TEMPO ≤ 5 HARI:*\n';
    upcoming.forEach(p => {
      const t = tenants.find(x => x.id === p.tenantId);
      const dl = daysUntil(p.dueDate);
      const label = dl === 0 ? 'HARI INI' : `H-${dl}`;
      msg += `• ${t?.name || 'Penyewa'} — ${formatRpFull(p.amount)} (${label})\n`;
      msg += `  📍 ${p.propertyName || '-'} · Due: ${formatDate(p.dueDate)}\n`;
    });
  }

  msg += `\n📊 Total: ${needReminder.length} tagihan perlu perhatian`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cfg.chatId, text: msg, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    if (data.ok) {
      DB.setVal('lastReminderDate', today);
      console.log('✅ Auto-reminder sent to Telegram');
    }
  } catch (err) {
    console.log('Auto-reminder failed:', err.message);
  }
}

// ===== EXPORT / IMPORT =====
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('propertiKu_')) {
      data[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `propertiKu-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const keys = Object.keys(data).filter(k => k.startsWith('propertiKu_'));
        if (keys.length === 0) { alert('File tidak valid — tidak ada data PropertiKu.'); return; }
        if (!confirm(`Import ${keys.length} data? Data saat ini akan ditimpa.`)) return;
        keys.forEach(k => localStorage.setItem(k, data[k]));
        alert('Data berhasil diimport! App akan reload.');
        location.reload();
      } catch (err) {
        alert('File tidak valid: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== ARCHIVE TENANT =====
function archiveTenant(tenantId) {
  const tenants = getTenants();
  const tenant = tenants.find(t => t.id === tenantId);
  if (!tenant) return;
  const unit = getUnits().find(u => u.id === tenant.unitId);
  if (!confirm('Akhiri kontrak ' + tenant.name + '?\n\nPenyewa akan diarsipkan, unit dikembalikan ke status Kosong.\nTagihan yang belum dibayar akan dihapus.\nTagihan lunas tetap disimpan.')) return;

  // Copy to tenant history
  const history = getTenantHistory();
  history.push({
    ...tenant,
    unitId: tenant.unitId,
    unitName: unit ? unit.name : '',
    propertyName: unit ? unit.property : '',
    archivedAt: new Date().toISOString()
  });
  saveTenantHistory(history);

  // Set unit back to vacant
  if (unit) {
    const units = getUnits();
    const ui = units.findIndex(u => u.id === tenant.unitId);
    if (ui >= 0) { units[ui].status = 'vacant'; saveUnits(units); }
  }

  // Remove unpaid auto-generated payments, keep paid ones
  const payments = getPayments().filter(p => !(p.tenantId === tenantId && p.autoGenerated && p.status !== 'paid'));
  savePayments(payments);

  // Remove tenant from active list
  saveTenants(tenants.filter(t => t.id !== tenantId));

  closeModal();
  refreshCurrentPage();
  alert('Kontrak ' + tenant.name + ' telah diakhiri dan diarsipkan.');
}

// ===== UNIT HISTORY =====
function showUnitHistory(unitId) {
  const unit = getUnits().find(u => u.id === unitId);
  if (!unit) return;

  const currentTenant = getTenants().find(t => t.unitId === unitId);
  const archived = getTenantHistory().filter(h => h.unitId === unitId).sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  let html = '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">' + unit.property + ' — ' + unit.name + '</div>';

  if (currentTenant) {
    html += '<div class="card" style="padding:12px;border-radius:10px;margin-bottom:12px;border-left:4px solid var(--success)">';
    html += '<div style="font-weight:700;color:var(--success);font-size:13px;margin-bottom:4px">Penyewa Saat Ini</div>';
    html += '<div style="font-weight:700">' + currentTenant.name + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted)">' + formatDate(currentTenant.startDate) + ' — ' + formatDate(currentTenant.endDate) + '</div>';
    if (currentTenant.phone) html += '<div style="font-size:12px;color:var(--text-muted)">' + currentTenant.phone + '</div>';
    html += '</div>';
  } else {
    html += '<div style="padding:12px;background:var(--bg);border-radius:10px;margin-bottom:12px;text-align:center;color:var(--text-muted);font-size:13px">Unit sedang kosong</div>';
  }

  if (archived.length > 0) {
    html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--text-secondary)">Riwayat Penyewa</div>';
    archived.forEach(h => {
      html += '<div class="card" style="padding:10px;border-radius:8px;margin-bottom:8px;border-left:4px solid var(--border)">';
      html += '<div style="font-weight:600;font-size:13px">' + h.name + '</div>';
      html += '<div style="font-size:12px;color:var(--text-muted)">' + formatDate(h.startDate) + ' — ' + formatDate(h.endDate) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted)">Diarsipkan: ' + formatDate(h.archivedAt) + '</div>';
      html += '</div>';
    });
  } else if (!currentTenant) {
    html += '<p class="empty-state">Belum ada riwayat penyewa</p>';
  }

  openModal('Riwayat Unit', html);
}

// ===== CONTRACT GENERATION =====
function generateContract(tenantId) {
  const tenant = getTenants().find(t => t.id === tenantId);
  if (!tenant) return '';
  const unit = getUnits().find(u => u.id === tenant.unitId);
  if (!unit) return '';
  const propData = getPropertyData(unit.property);

  const ownerName = propData.ownerName || '[Nama Pemilik]';
  const ownerAddress = propData.ownerAddress || '[Alamat Pemilik]';
  const ownerKTP = propData.ownerKTP || '[No. KTP Pemilik]';
  const amount = unit.price;
  const amountWords = terbilang(amount);
  const deposit = tenant.deposit || 0;
  const depositWords = deposit > 0 ? terbilang(deposit) : 'nol';
  const billingLabel = unit.billingCycle === 'yearly' ? 'tahun' : 'bulan';

  const startDate = new Date(tenant.startDate);
  const endDate = new Date(tenant.endDate);
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const fmtDate = (d) => d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  const today = new Date();

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Surat Perjanjian Sewa — ${tenant.name}</title>
<style>
@media print { body { margin: 0; } @page { size: A4; margin: 2cm; } }
body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.8; color: #222; max-width: 210mm; margin: 0 auto; padding: 2cm; }
h1 { text-align: center; font-size: 16pt; text-decoration: underline; margin-bottom: 4px; }
h2 { text-align: center; font-size: 13pt; font-weight: normal; margin-top: 0; margin-bottom: 24px; }
.pasal { font-weight: bold; margin-top: 20px; margin-bottom: 8px; }
.signature { display: flex; justify-content: space-between; margin-top: 60px; }
.sig-box { text-align: center; width: 45%; }
.sig-line { margin-top: 80px; border-top: 1px solid #222; padding-top: 4px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; }
td { padding: 4px 8px; vertical-align: top; }
td:first-child { width: 160px; }
</style></head><body>
<h1>SURAT PERJANJIAN SEWA MENYEWA</h1>
<h2>No. ${DB.genId().toUpperCase()}</h2>

<p>Pada hari ini, tanggal <strong>${fmtDate(today)}</strong>, kami yang bertanda tangan di bawah ini:</p>

<table>
<tr><td>Nama</td><td>: <strong>${ownerName}</strong></td></tr>
<tr><td>Alamat</td><td>: ${ownerAddress}</td></tr>
<tr><td>No. KTP</td><td>: ${ownerKTP}</td></tr>
</table>
<p>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong> (Pemilik).</p>

<table>
<tr><td>Nama</td><td>: <strong>${tenant.name}</strong></td></tr>
<tr><td>No. HP</td><td>: ${tenant.phone || '-'}</td></tr>
</table>
<p>Selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong> (Penyewa).</p>

<p>Kedua belah pihak sepakat untuk mengadakan perjanjian sewa menyewa dengan ketentuan sebagai berikut:</p>

<p class="pasal">Pasal 1 — Objek Sewa</p>
<p>PIHAK PERTAMA menyewakan kepada PIHAK KEDUA berupa:</p>
<table>
<tr><td>Properti</td><td>: ${unit.property}</td></tr>
<tr><td>Unit</td><td>: ${unit.name}${unit.subtype ? ' (' + unit.subtype + ')' : ''}</td></tr>
<tr><td>Tipe</td><td>: ${unit.type}</td></tr>
${unit.facilities ? '<tr><td>Fasilitas</td><td>: ' + unit.facilities.split(',').map(f => getFacilityLabel(f.trim())).join(', ') + '</td></tr>' : ''}
</table>

<p class="pasal">Pasal 2 — Jangka Waktu Sewa</p>
<p>Masa sewa berlaku sejak <strong>${fmtDate(startDate)}</strong> sampai dengan <strong>${fmtDate(endDate)}</strong>.</p>

<p class="pasal">Pasal 3 — Harga Sewa</p>
<p>Harga sewa yang disepakati adalah sebesar <strong>Rp ${Number(amount).toLocaleString('id-ID')}</strong> (${amountWords} rupiah) per ${billingLabel}.</p>
<p>Pembayaran dilakukan paling lambat tanggal <strong>${tenant.dueDay || '-'}</strong> setiap ${billingLabel}nya.</p>

<p class="pasal">Pasal 4 — Deposit</p>
<p>PIHAK KEDUA menyerahkan deposit sebesar <strong>Rp ${Number(deposit).toLocaleString('id-ID')}</strong> (${depositWords} rupiah) yang akan dikembalikan pada akhir masa sewa setelah dipotong biaya kerusakan (jika ada).</p>

<p class="pasal">Pasal 5 — Kewajiban Penyewa</p>
<ol>
<li>Menjaga kebersihan dan kelestarian unit yang disewa.</li>
<li>Tidak mengubah struktur bangunan tanpa izin tertulis dari PIHAK PERTAMA.</li>
<li>Membayar sewa tepat waktu sesuai tanggal yang disepakati.</li>
<li>Mematuhi peraturan yang berlaku di lingkungan properti.</li>
</ol>

<p class="pasal">Pasal 6 — Pemutusan Perjanjian</p>
<p>Perjanjian ini dapat diputus sebelum waktunya apabila PIHAK KEDUA melanggar ketentuan yang telah disepakati, dengan pemberitahuan minimal 30 hari sebelumnya.</p>

<p>Demikian surat perjanjian ini dibuat dan ditandatangani oleh kedua belah pihak dalam keadaan sadar dan tanpa paksaan.</p>

<div class="signature">
<div class="sig-box"><div>PIHAK PERTAMA</div><div class="sig-line">(${ownerName})</div></div>
<div class="sig-box"><div>PIHAK KEDUA</div><div class="sig-line">(${tenant.name})</div></div>
</div>

<p style="text-align:center;font-size:10pt;color:#888;margin-top:40px">Dokumen ini digenerate oleh PropertiKu pada ${fmtDate(today)}</p>
</body></html>`;
}

function downloadContract(tenantId) {
  const tenant = getTenants().find(t => t.id === tenantId);
  if (!tenant) { alert('Penyewa tidak ditemukan'); return; }
  const html = generateContract(tenantId);
  if (!html) { alert('Data tidak lengkap untuk membuat kontrak'); return; }
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Kontrak-' + tenant.name.replace(/\s+/g, '_') + '-' + new Date().toISOString().slice(0, 10) + '.html';
  a.click();
  URL.revokeObjectURL(url);
}

// ===== ROI CARDS FOR DASHBOARD =====
function renderROICards() {
  const units = getUnits();
  const payments = getPayments();
  const props = [...new Set(units.map(u => u.property))];
  const container = document.getElementById('dashboard-roi');
  if (!container) return;

  if (!props.length) { container.innerHTML = '<p class="empty-state">Belum ada properti</p>'; return; }

  container.innerHTML = props.map(prop => {
    const pd = getPropertyData(prop);
    const totalInvestment = pd.purchasePrice || 0;
    if (totalInvestment <= 0) return '';

    const pu = units.filter(u => u.property === prop);
    const totalIncome = payments.filter(p => p.propertyName === prop && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const totalExpense = payments.filter(p => p.propertyName === prop && p.type === 'expense').reduce((s, p) => s + p.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const actualROI = totalInvestment > 0 ? (netProfit / totalInvestment * 100).toFixed(1) : 0;

    // months active
    const allDates = payments.filter(p => p.propertyName === prop && p.createdAt).map(p => new Date(p.createdAt));
    const firstDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date();
    const monthsActive = Math.max(1, Math.round((new Date() - firstDate) / (30.44 * 24 * 60 * 60 * 1000)));
    const monthlyUnitCosts = pu.reduce((s, u) => s + getUnitMonthlyCost(u), 0);
    const avgMonthlyProfit = (netProfit / monthsActive) - monthlyUnitCosts;
    const projectedPaybackMonths = avgMonthlyProfit > 0 ? Math.round(totalInvestment / avgMonthlyProfit) : 0;
    const paybackLabel = projectedPaybackMonths > 0 ? (projectedPaybackMonths >= 24 ? (projectedPaybackMonths / 12).toFixed(1) + ' thn' : projectedPaybackMonths + ' bln') : '-';

    const progressPct = totalInvestment > 0 ? Math.min((netProfit / totalInvestment) * 100, 100) : 0;
    const progressColor = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';

    return '<div style="background:var(--bg-card);border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1px solid var(--border)">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
      + '<span style="font-weight:700;font-size:13px;color:var(--text)">' + prop + '</span>'
      + '<span style="font-size:12px;font-weight:800;color:' + (parseFloat(actualROI) >= 0 ? 'var(--success)' : 'var(--danger)') + '">ROI ' + actualROI + '%</span>'
      + '</div>'
      + '<div style="display:flex;gap:12px;font-size:11px;color:var(--text-muted);margin-bottom:6px">'
      + '<span>Profit: ' + formatRp(netProfit) + '</span>'
      + '<span>Payback: ' + paybackLabel + '</span>'
      + '<span>' + monthsActive + ' bln aktif</span>'
      + '</div>'
      + '<div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">'
      + '<div style="height:100%;width:' + Math.max(progressPct, 0) + '%;background:' + progressColor + ';border-radius:3px;transition:width 0.3s"></div>'
      + '</div>'
      + '</div>';
  }).filter(Boolean).join('');
}

// ===== UNIT PHOTOS =====
function addUnitPhoto(unitId) {
  const photos = getUnitPhotos().filter(p => p.unitId === unitId);
  if (photos.length >= 5) { alert('Maksimal 5 foto per unit'); return; }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.setAttribute('capture', 'environment');
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const resized = await resizeImage(ev.target.result, 800, 0.6);
      const allPhotos = getUnitPhotos();
      allPhotos.push({ id: DB.genId(), unitId, data: resized, createdAt: new Date().toISOString() });
      saveUnitPhotos(allPhotos);
      // Refresh the form
      closeModal();
      showUnitForm(unitId);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function deleteUnitPhoto(photoId, unitId) {
  if (!confirm('Hapus foto ini?')) return;
  saveUnitPhotos(getUnitPhotos().filter(p => p.id !== photoId));
  closeModal();
  showUnitForm(unitId);
}

function showUnitPhotos(unitId) {
  const photos = getUnitPhotos().filter(p => p.unitId === unitId);
  const unit = getUnits().find(u => u.id === unitId);
  if (photos.length === 0) { alert('Belum ada foto untuk unit ini'); return; }

  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">';
  photos.forEach((ph, idx) => {
    html += '<div style="border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer" onclick="viewFullPhoto(' + idx + ',\'' + unitId + '\')">'
      + '<img src="' + ph.data + '" style="width:100%;height:100%;object-fit:cover">'
      + '</div>';
  });
  html += '</div>';

  openModal('Foto ' + (unit ? unit.name : 'Unit'), html);
}

function viewFullPhoto(idx, unitId) {
  const photos = getUnitPhotos().filter(p => p.unitId === unitId);
  if (!photos[idx]) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:pointer';
  overlay.onclick = () => overlay.remove();
  const img = document.createElement('img');
  img.src = photos[idx].data;
  img.style.cssText = 'max-width:95vw;max-height:95vh;object-fit:contain;border-radius:8px';
  overlay.appendChild(img);
  document.body.appendChild(overlay);
}

// ===== CHARTS =====
function renderCharts() {
  let container = document.getElementById('rpt-tab-charts');
  if (!container) {
    // Create the tab container dynamically
    const reportPage = document.getElementById('page-reports');
    if (reportPage) {
      container = document.createElement('div');
      container.id = 'rpt-tab-charts';
      container.className = 'rpt-tab active';
      reportPage.appendChild(container);
    } else return;
  }

  const payments = getPayments();
  const units = getUnits();
  const now = new Date();

  // 1. Income Trend (last 6 months)
  const months6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthYear(d);
    const label = d.toLocaleDateString('id-ID', { month: 'short' });
    const value = payments.filter(p => p.period === key && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    months6.push({ label, value });
  }

  // 2. Expense by category
  const expByCat = {};
  payments.filter(p => p.type === 'expense').forEach(p => {
    const cat = p.expenseCategory || 'other';
    expByCat[cat] = (expByCat[cat] || 0) + p.amount;
  });
  const donutData = EXPENSE_CATEGORIES.filter(c => expByCat[c.id]).map(c => ({ label: c.icon + ' ' + c.label, value: expByCat[c.id] }));

  // 3. Profit per Property (bar chart)
  const props = [...new Set(units.map(u => u.property))];
  const barData = props.map(prop => {
    const inc = payments.filter(p => p.propertyName === prop && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const exp = payments.filter(p => p.propertyName === prop && p.type === 'expense').reduce((s, p) => s + p.amount, 0);
    return { label: prop, values: [inc, exp] };
  });

  // 4. Occupancy Trend
  const totalUnits = units.length || 1;
  const occData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthYear(d);
    const label = d.toLocaleDateString('id-ID', { month: 'short' });
    const occCount = new Set(payments.filter(p => p.period === key && p.type === 'income').map(p => p.tenantId)).size;
    const rate = Math.min(Math.round((occCount / totalUnits) * 100), 100);
    occData.push({ label, value: rate });
  }

  container.innerHTML = `
    <div class="card"><h3 class="card-title">📈 Tren Pemasukan (6 Bulan)</h3>${svgLineChart(months6, { color: 'var(--success)' })}</div>
    <div class="card"><h3 class="card-title">🍩 Pengeluaran per Kategori</h3>${svgDonutChart(donutData)}</div>
    <div class="card"><h3 class="card-title">📊 Income vs Expense per Properti</h3>${svgBarChart(barData, { colors: ['var(--success)', 'var(--danger)'], labels: ['Income', 'Expense'] })}</div>
    <div class="card"><h3 class="card-title">📉 Tren Occupancy (6 Bulan)</h3>${svgLineChart(occData, { color: 'var(--primary)' })}</div>
  `;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  setTheme(getTheme());

  // Add dark mode toggle button to header (only once)
  if (!document.getElementById('theme-toggle-btn')) {
    const header = document.querySelector('.header');
    if (header) {
      const settingsBtn = document.getElementById('btn-settings');
      if (settingsBtn) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.setAttribute('onclick', 'toggleTheme()');
        themeBtn.id = 'theme-toggle-btn';
        themeBtn.title = 'Dark/Light Mode';
        themeBtn.textContent = getTheme() === 'dark' ? '\u2600\uFE0F' : '\u{1F319}';
        settingsBtn.parentNode.insertBefore(themeBtn, settingsBtn);
      }
    }
  }

  updateOverduePayments();
  renderDashboard();
  // Auto-send Telegram reminder if needed
  autoReminderCheck();
});
