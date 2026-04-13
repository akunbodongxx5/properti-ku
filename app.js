// ===== PropertiKu — Property Rental Management App =====

// ===== Data Layer =====
function notifyStorageQuotaMaybe(err) {
  const n = err && err.name;
  if (n !== 'QuotaExceededError' && n !== 'NS_ERROR_DOM_QUOTA_REACHED') return;
  const now = Date.now();
  if (now - (window.__pkLastQuotaToast || 0) < 10000) return;
  window.__pkLastQuotaToast = now;
  queueMicrotask(() => {
    const msg = typeof t === 'function' ? t('msg.storageFull') : 'Penyimpanan penuh. Kurangi data atau export lalu reset.';
    if (typeof showToast === 'function') showToast(msg, 'error', 5000);
    else alert(msg);
  });
}

const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem(`propertiKu_${key}`)) || []; } catch { return []; } },
  set(key, data) {
    try {
      localStorage.setItem(`propertiKu_${key}`, JSON.stringify(data));
      return true;
    } catch (e) {
      notifyStorageQuotaMaybe(e);
      return false;
    }
  },
  getVal(key) { return localStorage.getItem(`propertiKu_${key}`) || ''; },
  setVal(key, val) {
    try {
      localStorage.setItem(`propertiKu_${key}`, val);
      return true;
    } catch (e) {
      notifyStorageQuotaMaybe(e);
      return false;
    }
  },
  genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};

// ===== UI mode: Sederhana (awam) vs Pro (laporan & analisis lengkap) =====
function getUiMode() {
  const v = DB.getVal('ui_mode');
  if (v === 'simple' || v === 'pro') return v;
  return 'pro';
}
function isProMode() { return getUiMode() === 'pro'; }
function isSimpleMode() { return getUiMode() === 'simple'; }

/** Nama di kartu sapaan Beranda (localStorage). */
function getOwnerDisplayName() {
  return (DB.getVal('owner_display_name') || '').trim();
}

/** Baris nama di beranda: mengganti kata «Investor»; sapaan jam hanya di baris atas (getGreeting). */
function getDashboardGreetingSublineHtml() {
  const name = getOwnerDisplayName().slice(0, 40);
  const nameEsc = escapeHtml(name);
  return name ? nameEsc : escapeHtml(t('dash.investorBare'));
}

function saveOwnerProfileFromSettings() {
  const n = document.getElementById('settings-owner-name');
  if (n) DB.setVal('owner_display_name', (n.value || '').trim().slice(0, 40));
  DB.setVal('owner_title', '');
  renderDashboard();
  if (typeof showToast === 'function') showToast(t('toast.ownerSaved'), 'success', 2400);
  showSettings();
}
function applyUiMode() {
  document.body.dataset.uiMode = getUiMode();
  const navLbl = document.getElementById('nav-reports-label');
  if (navLbl && typeof t === 'function') navLbl.textContent = getUiMode() === 'simple' ? t('nav.summary') : t('nav.reports');
}
function setUiModeFromSettings(mode) {
  if (mode !== 'simple' && mode !== 'pro') return;
  DB.setVal('ui_mode', mode);
  applyUiMode();
  reportTab = 'overview';
  document.querySelectorAll('#page-reports .rpt-tab').forEach(t => t.classList.remove('active'));
  const ov = document.getElementById('rpt-tab-overview');
  if (ov) ov.classList.add('active');
  refreshCurrentPage();
  const titleMap = {
    dashboard: t('title.app'),
    tenants: t('title.tenants'),
    payments: t('title.payments'),
    units: t('title.units'),
    reports: getUiMode() === 'simple' ? t('title.summary') : t('title.reports')
  };
  const pt = document.getElementById('page-title');
  if (pt && titleMap[currentPage]) pt.textContent = titleMap[currentPage];
  closeModal();
  showSettings();
}

// ===== Helpers =====
function numLocaleTag() {
  return (typeof getLocale === 'function' && getLocale() === 'en') ? 'en-GB' : 'id-ID';
}
function formatRp(n) {
  const v = Number(n);
  const loc = numLocaleTag();
  const en = typeof getLocale === 'function' && getLocale() === 'en';
  if (v >= 1000000000) return 'Rp ' + (v / 1000000000).toFixed(1).replace('.0', '') + (en ? ' B' : ' M');
  if (v >= 1000000) return 'Rp ' + (v / 1000000).toFixed(1).replace('.0', '') + (en ? ' M' : ' jt');
  if (v >= 1000) return 'Rp ' + (v / 1000).toFixed(0) + (en ? ' k' : ' rb');
  return 'Rp ' + v.toLocaleString(loc);
}

function formatPaybackLabel(paybackYearsStr) {
  if (paybackYearsStr === '-') return '-';
  const y = Number(paybackYearsStr);
  if (y >= 2) return t('rpt.paybackYears', { n: paybackYearsStr });
  return t('rpt.paybackMonths', { n: String(Math.round(y * 12)) });
}

function formatSisaTenorMonths(sisaTenor) {
  if (!sisaTenor || sisaTenor <= 0) return '';
  if (sisaTenor > 12) {
    const y = Math.floor(sisaTenor / 12);
    const m = sisaTenor % 12;
    if (m) return t('rpt.tenorYrMo', { y, m });
    return t('rpt.paybackYears', { n: String(y) });
  }
  return t('rpt.tenorMonthsOnly', { n: String(sisaTenor) });
}
function formatRpFull(n) { return 'Rp ' + Number(n).toLocaleString(numLocaleTag()); }

/** Rp. + pemisah ribuan untuk laporan cetak/PDF (bukan saran pajak — hanya tampilan). */
function formatIdrPrint(n) {
  const x = Number(n);
  if (isNaN(x)) return 'Rp. 0';
  const absStr = Math.abs(Math.round(x)).toLocaleString(numLocaleTag());
  if (x < 0) return '- Rp. ' + absStr;
  return 'Rp. ' + absStr;
}

// Number input formatting with thousand separator (dot)
function formatNumDots(n) {
  if (!n && n !== 0) return '';
  return String(n).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function parseNum(s) {
  if (typeof s === 'number') return s;
  return Number(String(s).replace(/\./g, '').replace(/,/g, '')) || 0;
}
function initRpInputs(container) {
  const root = container || document;
  root.querySelectorAll('input[data-rp]').forEach(el => {
    if (el._rpInit) return;
    el._rpInit = true;
    // Format initial value
    if (el.value && !isNaN(Number(el.value))) el.value = formatNumDots(el.value);
    el.addEventListener('input', function() {
      const raw = this.value.replace(/\./g, '');
      const pos = this.selectionStart;
      const oldLen = this.value.length;
      this.value = formatNumDots(raw);
      const newLen = this.value.length;
      this.setSelectionRange(pos + (newLen - oldLen), pos + (newLen - oldLen));
    });
  });
}
function getRpVal(name) {
  const el = document.querySelector(`[name="${name}"]`) || document.getElementById(name);
  return el ? parseNum(el.value) : 0;
}
function dateLocaleTag() {
  return (typeof getLocale === 'function' && getLocale() === 'en') ? 'en-GB' : 'id-ID';
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString(dateLocaleTag(), { day: 'numeric', month: 'short', year: 'numeric' });
}
/** Tanggal ringkas untuk baris unit (mis. 10 Des 25). */
function formatDateShort(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString(dateLocaleTag(), { day: 'numeric', month: 'short', year: '2-digit' });
}
/** Kontrak berakhir sebelum hari ini (kalender). */
function isLeaseEndBeforeToday(endStr) {
  const end = parseYMD(endStr);
  if (!end) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return end < today;
}

/**
 * Samakan status unit dengan kontrak penyewa: occupied tanpa penyewa / kontrak lewat → vacant.
 * Dipanggil saat load dan sebelum render daftar unit.
 */
function syncUnitOccupancyFromTenants() {
  const tenants = getTenants();
  const units = getUnits();
  let changed = false;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u.status !== 'occupied') continue;
    const tn = tenants.find(t => t.unitId === u.id);
    if (!tn) {
      units[i] = { ...u, status: 'vacant' };
      changed = true;
      continue;
    }
    if (isLeaseEndBeforeToday(tn.endDate)) {
      units[i] = { ...u, status: 'vacant' };
      changed = true;
    }
  }
  if (changed) saveUnits(units);
}

function getTenantForUnit(unitId) {
  return getTenants().find(t => t.unitId === unitId) || null;
}

function getUnitLeaseDatesLineHtml(u) {
  if (u.status !== 'occupied') return '';
  const tn = getTenantForUnit(u.id);
  if (!tn) {
    return `<div class="unit-item-lease"><span class="unit-lease-muted">${escapeHtml(t('unit.noRenters'))}</span></div>`;
  }
  const inn = formatDateShort(tn.startDate);
  const out = formatDateShort(tn.endDate);
  return `<div class="unit-item-lease"><span class="unit-lease-in">${escapeHtml(t('unit.leaseIn'))}: ${escapeHtml(inn)}</span><span class="unit-lease-sep"> · </span><span class="unit-lease-out">${escapeHtml(t('unit.leaseOut'))}: ${escapeHtml(out)}</span></div>`;
}

function csvEscapeCell(val) {
  const s = val == null ? '' : String(val);
  return `"${s.replace(/"/g, '""')}"`;
}
function getMonthYear(d) { const x = d ? new Date(d) : new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; }
/** Ringkasan bulanan: periode YYYY-MM, atau sewa lunas di muka (`prepaid`) diatribut ke bulan kalender dari tanggal jatuh tempo. */
function paymentMatchesCalendarMonth(p, cm) {
  if (p.period === cm) return true;
  if (p.period === 'prepaid' && p.type === 'income' && p.status === 'paid' && p.dueDate) {
    return getMonthYear(p.dueDate) === cm;
  }
  return false;
}
function getYear(d) { return d ? new Date(d).getFullYear().toString() : new Date().getFullYear().toString(); }
/** Selisih hari ke tanggal (kalender lokal). String YYYY-MM-DD diparse lewat parseYMD agar tidak geser UTC. */
function daysUntil(d) {
  if (d == null || d === '') return NaN;
  const s = String(d).trim().slice(0, 10);
  const t = /^\d{4}-\d{2}-\d{2}$/.test(s) ? parseYMD(s) : new Date(d);
  if (!t || isNaN(t.getTime())) return NaN;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t - now) / 864e5);
}
function parseYMD(s) {
  if (!s) return null;
  const p = String(s).slice(0, 10).split('-');
  if (p.length < 3) return null;
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return isNaN(d.getTime()) ? null : d;
}
/** Sewa aktif pada bulan kalender ym (YYYY-MM) memakai kontrak penyewa + arsip */
function leaseCoversMonth(startStr, endStr, ym) {
  const [Y, M] = ym.split('-').map(Number);
  if (!Y || !M) return false;
  const ms = new Date(Y, M - 1, 1);
  const me = new Date(Y, M, 0);
  const as = parseYMD(startStr), ae = parseYMD(endStr);
  if (!as || !ae) return false;
  return as <= me && ae >= ms;
}
function occupiedUnitsByLeasesAtMonth(units, tenants, history, ym) {
  let n = 0;
  for (const u of units) {
    let ok = false;
    for (const t of tenants) {
      if (t.unitId !== u.id) continue;
      if (leaseCoversMonth(t.startDate, t.endDate, ym)) { ok = true; break; }
    }
    if (!ok) {
      for (const h of history) {
        if (h.unitId !== u.id) continue;
        if (leaseCoversMonth(h.startDate, h.endDate, ym)) { ok = true; break; }
      }
    }
    if (ok) n++;
  }
  return n;
}
function getGreeting() {
  const h = new Date().getHours();
  let text;
  if (typeof t !== 'function') {
    if (h < 11) text = 'Selamat Pagi';
    else if (h < 15) text = 'Selamat Siang';
    else if (h < 18) text = 'Selamat Sore';
    else text = 'Selamat Malam';
  } else {
    const en = typeof getLocale === 'function' && getLocale() === 'en';
    // EN: "Good morning" through 11:59 — was incorrectly using noon → "Good afternoon" for hour 11.
    if (en) {
      if (h < 12) text = t('greeting.morning');
      else if (h < 17) text = t('greeting.afternoon');
      else text = t('greeting.evening');
    } else {
      if (h < 11) text = t('greeting.morning');
      else if (h < 15) text = t('greeting.noon');
      else if (h < 18) text = t('greeting.afternoon');
      else text = t('greeting.evening');
    }
  }
  return text;
}
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

/** Escape text for safe insertion into HTML (mitigates XSS from user data). */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
/** JSON string literal safe inside a double-quoted HTML onclick/href attribute. */
function onclickStrArg(val) {
  return JSON.stringify(val == null ? '' : String(val))
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

// ===== Toast Notifications =====
function showToast(msg, type = 'success', duration = 2500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '&#10003;', error: '&#10007;', info: '&#8505;', warning: '&#9888;' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<div class="toast-icon ${type}">${icons[type] || icons.info}</div><div class="toast-msg">${escapeHtml(msg)}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== Empty State with SVG Illustration =====
function emptyStateHTML(type) {
  const states = {
    unit: {
      svg: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="12" y="28" width="56" height="40" rx="4" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/><path d="M12 36h56" stroke="var(--text-muted)" stroke-width="2"/><rect x="24" y="44" width="12" height="16" rx="2" stroke="var(--text-muted)" stroke-width="2"/><rect x="44" y="44" width="12" height="8" rx="2" stroke="var(--text-muted)" stroke-width="2"/><path d="M40 12L8 28h64L40 12z" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/></svg>`,
      titleKey: 'empty.unitTitle',
      descKey: 'empty.unitDesc',
      action: () => `<button class="btn btn-primary" onclick="showUnitForm(); closeFabMenu()">${t('empty.unitBtn')}</button><button class="btn btn-outline empty-demo-btn" onclick="loadDummyData()">${t('empty.demo')}</button>`
    },
    tenant: {
      svg: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="14" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/><path d="M16 68c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/></svg>`,
      titleKey: 'empty.tenantTitle',
      descKey: 'empty.tenantDesc',
      action: () => `<button class="btn btn-primary" onclick="showTenantForm(); closeFabMenu()">${t('empty.tenantBtn')}</button>`
    },
    payment: {
      svg: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="10" y="22" width="60" height="36" rx="6" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/><path d="M10 34h60" stroke="var(--text-muted)" stroke-width="2"/><circle cx="56" cy="46" r="5" stroke="var(--text-muted)" stroke-width="2"/><circle cx="46" cy="46" r="5" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/></svg>`,
      titleKey: 'empty.payTitle',
      descKey: 'empty.payDesc',
      action: () => `<button class="btn btn-primary" onclick="showPaymentForm(); closeFabMenu()">${t('empty.payBtn')}</button>`
    },
    property: {
      svg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="8" y="24" width="48" height="32" rx="3" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/><path d="M32 8L4 24h56L32 8z" stroke="var(--text-muted)" stroke-width="2" fill="var(--primary-glow)"/></svg>`,
      titleKey: 'empty.propTitle',
      descKey: 'empty.propDesc',
      action: () => `<button class="btn btn-outline empty-demo-btn" onclick="loadDummyData()">${t('empty.demo')}</button>`
    }
  };
  const s = states[type] || states.property;
  return `<div class="empty-state-fancy">${s.svg}<div class="empty-title">${t(s.titleKey)}</div><div class="empty-desc">${t(s.descKey)}</div>${s.action()}</div>`;
}

// ===== Onboarding =====
function loadDummyData() {
  if (getUnits().length > 0) return;

  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const fmt = d => d.toISOString().slice(0,10);
  const period = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const mAgo = n => new Date(y, m-n, 1);
  const mFwd = n => new Date(y, m+n, 1);

  const cur = period(now), p1 = period(mAgo(1)), p2 = period(mAgo(2));

  DB.set('properties', [
    { name:'Kos Melati', purchasePrice:850000000, pbb:1500000, maintenance:3000000, insurance:0, otherExpense:0, cicilanPerBulan:0, sisaTenor:0 },
    { name:'Ruko Sudirman', purchasePrice:2000000000, pbb:5000000, maintenance:6000000, insurance:2000000, otherExpense:0, cicilanPerBulan:12000000, sisaTenor:84 }
  ]);

  DB.set('units', [
    { id:'du1', property:'Kos Melati', subtype:'Standar', name:'Kamar A', type:'kos', price:1500000, billingCycle:'monthly', ipl:0, sinkingFund:0, unitPbb:0, unitOtherCost:0, facilities:'AC,Kamar Mandi Dalam', status:'occupied', createdAt:now.toISOString() },
    { id:'du2', property:'Kos Melati', subtype:'Standar', name:'Kamar B', type:'kos', price:1500000, billingCycle:'monthly', ipl:0, sinkingFund:0, unitPbb:0, unitOtherCost:0, facilities:'AC,Kamar Mandi Dalam', status:'occupied', createdAt:now.toISOString() },
    { id:'du3', property:'Kos Melati', subtype:'Standar', name:'Kamar C', type:'kos', price:1500000, billingCycle:'monthly', ipl:0, sinkingFund:0, unitPbb:0, unitOtherCost:0, facilities:'AC', status:'vacant', createdAt:now.toISOString() },
    { id:'du4', property:'Kos Melati', subtype:'Standar', name:'Kamar D', type:'kos', price:1500000, billingCycle:'monthly', ipl:0, sinkingFund:0, unitPbb:0, unitOtherCost:0, facilities:'AC', status:'occupied', createdAt:now.toISOString() },
    { id:'du5', property:'Ruko Sudirman', subtype:'Unit', name:'Unit Utama', type:'ruko', price:8000000, billingCycle:'monthly', ipl:500000, sinkingFund:0, unitPbb:0, unitOtherCost:0, facilities:'', status:'occupied', createdAt:now.toISOString() }
  ]);

  DB.set('tenants', [
    { id:'dt1', name:'Budi Santoso', phone:'081234567890', unitId:'du1', startDate:fmt(mAgo(3)), endDate:fmt(mFwd(9)), dueDay:5, deposit:1500000, notes:'', createdAt:now.toISOString() },
    { id:'dt2', name:'Sari Dewi', phone:'082345678901', unitId:'du2', startDate:fmt(mAgo(3)), endDate:fmt(mFwd(2)), dueDay:10, deposit:1500000, notes:'Kontrak hampir habis', createdAt:now.toISOString() },
    { id:'dt3', name:'Ahmad Rizki', phone:'083456789012', unitId:'du4', startDate:fmt(mAgo(3)), endDate:fmt(mFwd(5)), dueDay:1, deposit:0, notes:'Sering telat bayar', createdAt:now.toISOString() },
    { id:'dt4', name:'PT. Maju Bersama', phone:'021-5551234', unitId:'du5', startDate:fmt(mAgo(3)), endDate:fmt(mFwd(9)), dueDay:1, deposit:8000000, notes:'Tenant komersial', createdAt:now.toISOString() }
  ]);

  const pmts = [];
  const addPmt = (id, tenantId, prop, amount, pr, dd, status, desc) => pmts.push({
    id, type:'income', tenantId, propertyName:prop, amount, period:pr,
    dueDate:dd, status, description:desc, autoGenerated:true, billingCycle:'monthly', createdAt:now.toISOString()
  });

  // Budi — lunas 3 bulan terakhir
  addPmt('dp_b1','dt1','Kos Melati',1500000,p2,fmt(new Date(y,m-2,5)),'paid','Sewa Kamar A — Budi Santoso');
  addPmt('dp_b2','dt1','Kos Melati',1500000,p1,fmt(new Date(y,m-1,5)),'paid','Sewa Kamar A — Budi Santoso');
  addPmt('dp_b3','dt1','Kos Melati',1500000,cur,fmt(new Date(y,m,5)),'paid','Sewa Kamar A — Budi Santoso');

  // Sari — lunas 2 bulan, pending bulan ini
  addPmt('dp_s1','dt2','Kos Melati',1500000,p2,fmt(new Date(y,m-2,10)),'paid','Sewa Kamar B — Sari Dewi');
  addPmt('dp_s2','dt2','Kos Melati',1500000,p1,fmt(new Date(y,m-1,10)),'paid','Sewa Kamar B — Sari Dewi');
  addPmt('dp_s3','dt2','Kos Melati',1500000,cur,fmt(new Date(y,m,10)),'pending','Sewa Kamar B — Sari Dewi');

  // Ahmad — lunas 2 bulan lalu, overdue 2 bulan terakhir
  addPmt('dp_a1','dt3','Kos Melati',1500000,p2,fmt(new Date(y,m-2,1)),'paid','Sewa Kamar D — Ahmad Rizki');
  addPmt('dp_a2','dt3','Kos Melati',1500000,p1,fmt(new Date(y,m-1,1)),'overdue','Sewa Kamar D — Ahmad Rizki');
  addPmt('dp_a3','dt3','Kos Melati',1500000,cur,fmt(new Date(y,m,1)),'overdue','Sewa Kamar D — Ahmad Rizki');

  // Ruko — lunas semua
  addPmt('dp_r1','dt4','Ruko Sudirman',8000000,p2,fmt(new Date(y,m-2,1)),'paid','Sewa Unit Utama — PT. Maju Bersama');
  addPmt('dp_r2','dt4','Ruko Sudirman',8000000,p1,fmt(new Date(y,m-1,1)),'paid','Sewa Unit Utama — PT. Maju Bersama');
  addPmt('dp_r3','dt4','Ruko Sudirman',8000000,cur,fmt(new Date(y,m,1)),'paid','Sewa Unit Utama — PT. Maju Bersama');

  // Pengeluaran
  pmts.push({ id:'dp_e1', type:'expense', tenantId:'', propertyName:'Kos Melati', amount:750000, period:p1, dueDate:fmt(new Date(y,m-1,15)), status:'paid', description:'Perbaikan AC Kamar C', expenseCategory:'maintenance', expenseUnitId:'', createdAt:now.toISOString() });
  pmts.push({ id:'dp_e2', type:'expense', tenantId:'', propertyName:'Ruko Sudirman', amount:1200000, period:cur, dueDate:fmt(new Date(y,m,10)), status:'paid', description:'Biaya kebersihan & keamanan', expenseCategory:'other', expenseUnitId:'', createdAt:now.toISOString() });

  DB.set('payments', pmts);

  dismissOnboarding();
  refreshCurrentPage();
  showToast(t('toast.demo'), 'success', 3500);
}

function showOnboarding() {
  if (DB.getVal('onboarded')) return;
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-overlay';
  overlay.innerHTML = `
    <div class="onboarding-content">
      <div class="onboarding-icon">🏠</div>
      <div class="onboarding-title">${t('onboard.title')}</div>
      <div class="onboarding-desc">${t('onboard.desc')}</div>
      <div class="onboarding-steps">
        <div class="onboarding-step"><div class="onboarding-step-num">1</div><div class="onboarding-step-text">${t('onboard.s1')}</div></div>
        <div class="onboarding-step"><div class="onboarding-step-num">2</div><div class="onboarding-step-text">${t('onboard.s2')}</div></div>
        <div class="onboarding-step"><div class="onboarding-step-num">3</div><div class="onboarding-step-text">${t('onboard.s3')}</div></div>
      </div>
      <div class="onboarding-owner-fields">
        <label class="form-label" for="onboard-owner-name">${t('owner.nameAsk')}</label>
        <input type="text" id="onboard-owner-name" class="form-input" maxlength="40" autocomplete="name" placeholder="${t('owner.namePh')}">
        <small class="onboarding-owner-hint">${t('owner.fieldsHint')}</small>
      </div>
      <button class="onboarding-btn" onclick="dismissOnboarding()">${t('onboard.start')}</button>
      <button class="onboarding-btn-demo" onclick="loadDummyData()">${t('onboard.demo')}</button>
      <button class="onboarding-skip" onclick="dismissOnboarding()">${t('onboard.skip')}</button>
    </div>`;
  document.body.appendChild(overlay);
}
function dismissOnboarding() {
  const n = document.getElementById('onboard-owner-name');
  if (n) DB.setVal('owner_display_name', (n.value || '').trim().slice(0, 40));
  DB.setVal('owner_title', '');
  DB.setVal('onboarded', '1');
  const el = document.getElementById('onboarding-overlay');
  if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s ease'; setTimeout(() => el.remove(), 300); }
  renderDashboard();
}

// ===== FAB =====
function toggleFabMenu() {
  ['fab-main', 'fab-menu', 'fab-backdrop'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
  });
}
function closeFabMenu() {
  ['fab-main', 'fab-menu', 'fab-backdrop'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  });
}

// ===== Navigation =====
let currentPage = 'dashboard';
function navigateTo(page, btn) {
  const pageEl = document.getElementById(`page-${page}`);
  if (!pageEl) return;
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titles = {
    dashboard: t('title.app'),
    tenants: t('title.tenants'),
    payments: t('title.payments'),
    units: t('title.units'),
    reports: getUiMode() === 'simple' ? t('title.summary') : t('title.reports')
  };
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = titles[page] != null ? titles[page] : page;
  closeFabMenu();
  refreshCurrentPage();
}
function syncPageTitle() {
  if (typeof t !== 'function') return;
  const titles = {
    dashboard: t('title.app'),
    tenants: t('title.tenants'),
    payments: t('title.payments'),
    units: t('title.units'),
    reports: getUiMode() === 'simple' ? t('title.summary') : t('title.reports')
  };
  const pt = document.getElementById('page-title');
  if (pt && titles[currentPage]) pt.textContent = titles[currentPage];
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.title = t('theme.toggle');
}
if (typeof window !== 'undefined') window.syncPageTitle = syncPageTitle;
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

function getUnitMonthlyRent(unit) {
  return unit.billingCycle === 'yearly' ? (unit.price || 0) / 12 : (unit.price || 0);
}

function getUnitYearlyRent(unit) {
  return unit.billingCycle === 'yearly' ? (unit.price || 0) : (unit.price || 0) * 12;
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
  { catKey: 'faccat.room', items: [
    { id: 'ac', icon: '❄️', key: 'fac.ac' },
    { id: 'full_furnished', icon: '🪑', key: 'fac.full_furnished' },
    { id: 'semi_furnished', icon: '🪑', key: 'fac.semi_furnished' },
    { id: 'no_furnished', icon: '📦', key: 'fac.no_furnished' },
    { id: 'tv', icon: '📺', key: 'fac.tv' },
    { id: 'kulkas', icon: '🧊', key: 'fac.kulkas' },
    { id: 'dapur_bersama', icon: '🍳', key: 'fac.dapur_bersama' },
    { id: 'dapur_pribadi', icon: '🍳', key: 'fac.dapur_pribadi' },
  ]},
  { catKey: 'faccat.bathroom', items: [
    { id: 'km_dalam', icon: '🚿', key: 'fac.km_dalam' },
    { id: 'km_luar', icon: '🚿', key: 'fac.km_luar' },
  ]},
  { catKey: 'faccat.utility', items: [
    { id: 'wifi', icon: '📶', key: 'fac.wifi' },
    { id: 'listrik_incl', icon: '⚡', key: 'fac.listrik_incl' },
    { id: 'air_incl', icon: '💧', key: 'fac.air_incl' },
    { id: 'parkir_motor', icon: '🅿️', key: 'fac.parkir_motor' },
    { id: 'parkir_mobil', icon: '🚗', key: 'fac.parkir_mobil' },
    { id: 'akses_kunci', icon: '🔒', key: 'fac.akses_kunci' },
  ]},
  { catKey: 'faccat.service', items: [
    { id: 'laundry', icon: '👕', key: 'fac.laundry' },
    { id: 'air_minum', icon: '🥤', key: 'fac.air_minum' },
    { id: 'nasi_putih', icon: '🍚', key: 'fac.nasi_putih' },
    { id: 'cleaning', icon: '🧹', key: 'fac.cleaning' },
    { id: 'security', icon: '👮', key: 'fac.security' },
  ]},
  { catKey: 'faccat.building', items: [
    { id: 'kolam_renang', icon: '🏊', key: 'fac.kolam_renang' },
    { id: 'gym', icon: '🏋️', key: 'fac.gym' },
    { id: 'lift', icon: '🛗', key: 'fac.lift' },
    { id: 'ruang_meeting', icon: '📦', key: 'fac.ruang_meeting' },
  ]},
  { catKey: 'faccat.rules', items: [
    { id: 'pet_friendly', icon: '🐾', key: 'fac.pet_friendly' },
    { id: 'bebas_rokok', icon: '🚭', key: 'fac.bebas_rokok' },
    { id: 'boleh_tamu', icon: '👫', key: 'fac.boleh_tamu' },
    { id: 'no_tamu', icon: '🚫', key: 'fac.no_tamu' },
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
  const key = 'expense.' + (id || 'other');
  if (typeof t === 'function') {
    const label = t(key);
    if (label !== key) return (cat ? cat.icon : '\u{1F4E6}') + ' ' + label;
  }
  return cat ? cat.icon + ' ' + cat.label : '\u{1F4E6} Lain-lain';
}

// ===== TENANT HISTORY =====
function getTenantHistory() { return DB.get('tenantHistory'); }
function saveTenantHistory(h) { DB.set('tenantHistory', h); }

// ===== UNIT PHOTOS =====
function getUnitPhotos() { return DB.get('unitPhotos'); }
function saveUnitPhotos(p) { DB.set('unitPhotos', p); }
function getMaintenanceTickets() { return DB.get('maintenanceTickets'); }
function saveMaintenanceTickets(t) { DB.set('maintenanceTickets', t); }

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
    if (item) return t(item.key);
  }
  return id;
}

function buildChipsHtml(selected) {
  let html = '<div class="chips-group">';
  FACILITY_OPTIONS.forEach(cat => {
    html += `<div class="chips-category">${t(cat.catKey)}</div>`;
    cat.items.forEach(item => {
      const sel = selected.includes(item.id) ? 'selected' : '';
      html += `<div class="chip ${sel}" data-id="${item.id}" onclick="toggleChip('${item.id}')"><span class="chip-icon">${item.icon}</span> ${t(item.key)}</div>`;
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
  if (!data || data.length === 0) return '<div class="empty-state">' + t('chart.noData') + '</div>';
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
  if (!data || data.length === 0) return '<div class="empty-state">' + t('chart.noData') + '</div>';
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return '<div class="empty-state">' + t('chart.noData') + '</div>';
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
  if (!data || data.length === 0) return '<div class="empty-state">' + t('chart.noData') + '</div>';
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
  sel.innerHTML = '<option value="">' + t('form.subtypeNone') + '</option><option value="__new__">' + t('form.addNew') + '</option>'
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
    ? '<button type="button" class="btn btn-outline" onclick="addUnitPhoto(\'' + unitId + '\')" style="font-size:13px">' + t('form.addPhoto') + '</button>'
    : '<small style="color:var(--text-muted)">' + t('form.maxPhotos') + '</small>';
  return '<div class="form-group"><label class="form-label">' + t('form.photoUnit') + '</label>'
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

  const _rentPeriod = u?.billingCycle === 'yearly' ? t('form.periodYear') : t('form.periodMonth');
  openModal(u ? t('unit.editTitle') : t('unit.addNewTitle'), `
    <form onsubmit="saveUnit(event,'${editId||''}')">
      <div class="form-group"><label class="form-label">${t('form.propName')}</label>
        <select class="form-select" name="propertySelect" onchange="onPropertySelect(this.value)">
          ${existingProps.length ? '' : '<option value="">' + t('form.noPropYet') + '</option>'}
          ${existingProps.map(p => `<option value="${p}" ${u?.property===p?'selected':''}>${p}</option>`).join('')}
          <option value="__new__" ${!isExistingProp && !editId ? 'selected' : ''}>${t('form.addPropNew')}</option>
        </select>
        <input class="form-input" id="new-property-input" name="newProperty" placeholder="${t('form.propNewPh')}" style="margin-top:8px;display:${(!isExistingProp || !existingProps.length) ? 'block' : 'none'}" value="${(!isExistingProp && u?.property) ? u.property : ''}">
      </div>
      <div class="form-group"><label class="form-label">${t('form.subtype')}</label>
        <select class="form-select" id="subtype-select" name="subtypeSelect" onchange="onSubtypeSelect(this.value)">
          <option value="">${t('form.subtypeNone')}</option>
          <option value="__new__">${t('form.addNew')}</option>
          ${existingSubtypes.map(s => `<option value="${s}" ${u?.subtype===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <input class="form-input" id="new-subtype-input" name="newSubtype" placeholder="${t('form.subtypePh')}" style="margin-top:8px;display:none" value="">
      </div>
      <div class="form-group"><label class="form-label">${t('form.unitName')}</label>
        <input class="form-input" name="name" required placeholder="${t('form.unitNamePh')}" value="${u?.name||''}"></div>
      <div class="form-group"><label class="form-label">${t('form.propType')}</label>
        <select class="form-select" name="type">
          <option value="kos" ${u?.type==='kos'?'selected':''}>${t('form.type.kos')}</option>
          <option value="apartemen" ${u?.type==='apartemen'?'selected':''}>${t('form.type.apartemen')}</option>
          <option value="rumah" ${u?.type==='rumah'?'selected':''}>${t('form.type.rumah')}</option>
          <option value="ruko" ${u?.type==='ruko'?'selected':''}>${t('form.type.ruko')}</option>
          <option value="kantor" ${u?.type==='kantor'?'selected':''}>${t('form.type.kantor')}</option>
        </select></div>
      <div class="form-group"><label class="form-label">${t('form.billingCycle')}</label>
        <select class="form-select" name="billingCycle">
          <option value="monthly" ${u?.billingCycle==='yearly'?'':'selected'}>${t('form.perMonth')}</option>
          <option value="yearly" ${u?.billingCycle==='yearly'?'selected':''}>${t('form.perYear')}</option>
        </select></div>
      <div class="form-group"><label class="form-label" id="price-label">${t('form.rentPrice', { period: _rentPeriod })}</label>
        <input class="form-input" name="price" type="text" inputmode="numeric" data-rp required placeholder="1.500.000" value="${u?.price ? formatNumDots(u.price) : ''}"></div>
      <div class="form-group" id="unit-costs-section">
        <label class="form-label" style="margin-bottom:4px">${t('form.fixedCosts')}</label>
        <small style="color:var(--text-muted);display:block;margin-bottom:10px">${t('form.fixedCostsHint')}</small>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">${t('form.ipl')}</label>
            <input class="form-input" name="ipl" type="text" inputmode="numeric" data-rp placeholder="0" value="${u?.ipl ? formatNumDots(u.ipl) : ''}"></div>
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">${t('form.sinking')}</label>
            <input class="form-input" name="sinkingFund" type="text" inputmode="numeric" data-rp placeholder="0" value="${u?.sinkingFund ? formatNumDots(u.sinkingFund) : ''}"></div>
        </div>
        <div style="display:flex;gap:8px">
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">${t('form.unitPbb')}</label>
            <input class="form-input" name="unitPbb" type="text" inputmode="numeric" data-rp placeholder="0" value="${u?.unitPbb ? formatNumDots(u.unitPbb) : ''}"></div>
          <div style="flex:1"><label style="font-size:11px;color:var(--text-secondary);font-weight:600">${t('form.unitOther')}</label>
            <input class="form-input" name="unitOtherCost" type="text" inputmode="numeric" data-rp placeholder="0" value="${u?.unitOtherCost ? formatNumDots(u.unitOtherCost) : ''}"></div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">${t('form.facilities')}</label>
        ${buildChipsHtml(_selectedFacilities)}</div>
      <div class="form-group"><label class="form-label">${t('form.status')}</label>
        <select class="form-select" name="status">
          <option value="vacant" ${u?.status==='vacant'?'selected':''}>${t('form.vacant')}</option>
          <option value="occupied" ${u?.status==='occupied'?'selected':''}>${t('form.occupied')}</option>
        </select></div>
      ${u ? buildUnitPhotoSection(editId) : ''}
      <button type="submit" class="btn btn-primary">${u ? t('form.save') : t('form.addUnit')}</button>
      ${u?`<div class="btn-group"><button type="button" class="btn btn-danger" onclick="deleteUnit('${editId}')">${t('form.delete')}</button></div>`:''}
    </form>
    <script>document.querySelector('[name="billingCycle"]').addEventListener('change',function(){var y=this.value==='yearly';document.getElementById('price-label').textContent=typeof t==='function'?t('form.rentPrice',{period:y?t('form.periodYear'):t('form.periodMonth')}):('Harga Sewa / '+(y?'Tahun':'Bulan')+' (Rp)')})<\/script>
  `);
  setTimeout(() => initRpInputs(), 50);
}

function saveUnit(e, editId) {
  e.preventDefault();
  const f = e.target;
  // Resolve property name
  const propSelect = f.propertySelect.value;
  const property = (propSelect === '__new__' || propSelect === '') ? f.newProperty.value.trim() : propSelect;
  if (!property) { alert(t('msg.propRequired')); return; }
  // Resolve subtype
  const subSelect = f.subtypeSelect.value;
  const subtype = subSelect === '__new__' ? f.newSubtype.value.trim() : (subSelect || '');

  // Auto-create property record if new
  getOrCreateProperty(property);

  const newFacilities = _selectedFacilities.join(',');
  const newPrice = parseNum(f.price.value);

  let rentHistory = [];
  const units = getUnits();
  if (editId) {
    const old = units.find(x => x.id === editId);
    if (old) {
      rentHistory = Array.isArray(old.rentHistory) ? [...old.rentHistory] : [];
      if (old.price !== newPrice || old.billingCycle !== f.billingCycle.value) {
        rentHistory.push({
          at: new Date().toISOString(),
          price: old.price,
          billingCycle: old.billingCycle || 'monthly'
        });
      }
    }
  }

  const data = {
    id: editId || DB.genId(), property, subtype, name: f.name.value.trim(),
    type: f.type.value, price: newPrice, billingCycle: f.billingCycle.value,
    ipl: parseNum(f.ipl.value) || 0, sinkingFund: parseNum(f.sinkingFund.value) || 0,
    unitPbb: parseNum(f.unitPbb.value) || 0, unitOtherCost: parseNum(f.unitOtherCost.value) || 0,
    facilities: newFacilities, status: f.status.value,
    rentHistory,
    createdAt: editId ? (getUnits().find(x=>x.id===editId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };
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
        let msg = t('confirm.updateSiblings', { n: siblings.length, sub: subtype });
        if (facChanged) msg += t('confirm.updateFac');
        if (priceChanged) msg += t('confirm.updatePrice', { price: formatRpFull(newPrice) });
        msg += t('confirm.updateSiblingsTail');
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
  showToast(editId ? t('msg.unitUpdated') : t('msg.unitAdded'), 'success');
}

function deleteUnit(id) { if (!confirm(t('confirm.deleteUnit'))) return; saveUnits(getUnits().filter(x=>x.id!==id)); closeModal(); refreshCurrentPage(); }

function filterUnits(f, btn) {
  unitFilter = f;
  document.querySelectorAll('#page-units .filter-tab').forEach(el => el.classList.remove('active'));
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
  syncUnitOccupancyFromTenants();
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

  if (units.length === 0) { container.innerHTML = emptyStateHTML('unit'); return; }

  const icons = { kos:'🏠', apartemen:'🏢', rumah:'🏡', ruko:'🏪', kantor:'🏛' };

  // Group filtered units by property
  const propOrder = [...new Set(units.map(u => u.property))];
  const groups = {};
  propOrder.forEach(p => { groups[p] = []; });
  filtered.forEach(u => { if (groups[u.property]) groups[u.property].push(u); });

  // Remove props with no filtered units
  const visibleProps = propOrder.filter(p => groups[p].length > 0);

  if (visibleProps.length === 0) {
    container.innerHTML = '<p class="empty-state">' + (searchTerm ? t('unit.searchNone', { q: escapeHtml(searchTerm) }) : t('unit.filterEmpty')) + '</p>';
    return;
  }

  container.innerHTML = visibleProps.map(prop => {
    const propUnits = groups[prop];
    const allPropUnits = units.filter(u => u.property === prop);
    const occCount = allPropUnits.filter(u => u.status === 'occupied').length;
    const totalCount = allPropUnits.length;
    const monthlyIncome = allPropUnits.filter(u => u.status === 'occupied').reduce((s, u) => s + getUnitMonthlyRent(u), 0);
    const type = allPropUnits[0]?.type || 'kos';
    const collapsed = _collapsedProps[prop] && !searchTerm;

    // Group units by subtype within property
    const subtypes = [...new Set(propUnits.map(u => u.subtype || ''))];

    let unitsHtml = '';
    if (!collapsed) {
      unitsHtml = subtypes.map(sub => {
        const subUnits = propUnits.filter(u => (u.subtype || '') === sub).sort((a, b) => naturalSort(a.name, b.name));
        const subLabel = sub ? `<div class="prop-subtype-label">${escapeHtml(sub)}</div>` : '';
        const subItems = subUnits.map(u => {
          const facs = u.facilities ? u.facilities.split(',').filter(Boolean).slice(0, 4).map(f => `<span class="facility-tag">${escapeHtml(getFacilityLabel(f.trim()))}</span>`).join('') : '';
          const extraFacs = u.facilities ? u.facilities.split(',').filter(Boolean).length - 4 : 0;
          const floorColor = getFloorColor(u.name);
          const floorDot = floorColor ? `<span class="floor-dot" style="background:${floorColor}" title="${t('unit.floorTitle')}"></span>` : '';
          const hasPhotos = getUnitPhotos().some(p => p.unitId === u.id);
          const hasHistory = getTenantHistory().some(h => h.unitId === u.id);
          const leaseLine = getUnitLeaseDatesLineHtml(u);
          return `<div class="unit-item unit-${u.status}" onclick="showUnitForm(${onclickStrArg(u.id)})">
            <div class="unit-item-left">
              ${floorDot}
              <span class="unit-item-name">${escapeHtml(u.name)}</span>
              <span class="badge badge-sm ${u.status === 'occupied' ? 'badge-success' : 'badge-warning'}">${u.status === 'occupied' ? t('form.occupied') : t('form.vacant')}</span>
              ${hasPhotos ? '<span style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();showUnitPhotos(' + onclickStrArg(u.id) + ')" title="' + escapeHtml(t('unit.viewPhotos')) + '">📷</span>' : ''}
              ${hasHistory ? '<span style="font-size:12px;cursor:pointer" onclick="event.stopPropagation();showUnitHistory(' + onclickStrArg(u.id) + ')" title="' + escapeHtml(t('unit.historyTenants')) + '">📜</span>' : ''}
            </div>
            <div class="unit-item-right">
              <span class="unit-item-price">${formatRp(u.price)}<span class="unit-item-period">/${u.billingCycle==='yearly'?t('period.yr'):t('period.mo')}</span></span>
              ${getUnitMonthlyCost(u) > 0 ? `<div style="font-size:10px;color:var(--danger);font-weight:600;margin-top:2px">-${formatRp(getUnitMonthlyCost(u))}${t('unit.perCostMo')}</div>` : ''}
            </div>
            ${leaseLine}
            ${facs ? `<div class="unit-item-facs">${facs}${extraFacs > 0 ? `<span class="facility-tag fac-more">+${extraFacs}</span>` : ''}</div>` : ''}
          </div>`;
        }).join('');
        return subLabel + subItems;
      }).join('');
    }

    return `<div class="prop-group">
      <div class="prop-group-header" onclick="togglePropertyGroup(${onclickStrArg(prop)})">
        <div class="prop-group-info">
          <div class="prop-group-name">${icons[type] || '🏠'} ${escapeHtml(prop)}</div>
          <div class="prop-group-stats">${t('unit.propStats', { occ: occCount, total: totalCount, income: formatRp(monthlyIncome), mo: t('period.mo') })}</div>
        </div>
        <div class="prop-group-actions">
          <button class="prop-action-btn add" onclick="event.stopPropagation(); addUnitForProperty(${onclickStrArg(prop)})" title="${escapeHtml(t('unit.addBtnTitle'))}">+</button>
          ${isProMode() ? `<button class="prop-action-btn bulk" onclick="event.stopPropagation(); showBulkAddForm(${onclickStrArg(prop)})" title="${escapeHtml(t('unit.bulkTitle'))}">⊞</button>` : ''}
          <button class="prop-action-btn settings" onclick="event.stopPropagation(); showPropertySettings(${onclickStrArg(prop)})" title="${escapeHtml(t('unit.settingsTitle'))}">⚙</button>
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
  const tenants = getTenants(), tn = editId ? tenants.find(x=>x.id===editId) : null;
  const units = getUnits();
  const taken = tenants.filter(x=>x.id!==editId).map(x=>x.unitId);
  const avail = units.filter(u => !taken.includes(u.id) || (tn && tn.unitId === u.id));
  const defaultDueDay = tn?.dueDay || '';

  openModal(tn ? t('form.editTenant') : t('form.addTenant'), `
    <form onsubmit="saveTenant(event,'${editId||''}')">
      <div class="form-group"><label class="form-label">${t('form.name')}</label>
        <input class="form-input" name="name" required placeholder="${t('form.fullNamePh')}" value="${tn?.name||''}"></div>
      <div class="form-group"><label class="form-label">${t('form.phone')}</label>
        <input class="form-input" name="phone" type="tel" placeholder="${t('form.phonePh')}" value="${tn?.phone||''}"></div>
      <div class="form-group"><label class="form-label">${t('form.unitLabel')}</label>
        <select class="form-select" name="unitId" required><option value="">${t('form.pickUnit')}</option>
          ${avail.map(u=>`<option value="${u.id}" ${tn?.unitId===u.id?'selected':''}>${u.property} — ${u.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">${t('form.leaseStart')}</label>
        <input class="form-input" name="startDate" type="date" required value="${tn?.startDate||''}" onchange="onTenantStartDateChange(this.value)"></div>
      <div class="form-group"><label class="form-label">${t('form.leaseEnd')}</label>
        <input class="form-input" name="endDate" type="date" required value="${tn?.endDate||''}"></div>
      <div class="form-group" style="display:flex;align-items:flex-start;gap:10px">
        <input type="checkbox" name="paidInAdvance" id="tenant-paid-in-advance" value="1" ${tn?.paidInAdvance ? 'checked' : ''} style="margin-top:4px;width:auto">
        <label for="tenant-paid-in-advance" style="font-weight:500;cursor:pointer">${t('form.paidInAdvance')}<br><small style="color:var(--text-muted);font-weight:400">${t('form.paidInAdvanceHelp')}</small></label></div>
      <div class="form-group"><label class="form-label">${t('form.dueDay')}</label>
        <input class="form-input" name="dueDay" type="number" id="tenant-due-day" min="1" max="31" placeholder="${t('form.dueDayPh')}" value="${defaultDueDay}">
        <small style="color:var(--text-muted);display:block;margin-top:4px">${t('form.dueDayHelp')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.deposit')}</label>
        <input class="form-input" name="deposit" type="text" inputmode="numeric" data-rp placeholder="0" value="${tn?.deposit ? formatNumDots(tn.deposit) : ''}"></div>
      <div class="form-group"><label class="form-label">${t('form.notes')}</label>
        <textarea class="form-textarea" name="notes" placeholder="${t('form.notesPh')}">${tn?.notes||''}</textarea></div>
      <button type="submit" class="btn btn-primary">${tn ? t('form.save') : t('form.addTenant')}</button>
      ${tn?`<div class="btn-group">
        <button type="button" class="btn btn-outline" onclick="regeneratePayments('${editId}')">${t('form.regenBills')}</button>
        <button type="button" class="btn btn-outline" onclick="downloadContract('${editId}')">${t('form.makeContract')}</button>
        <button type="button" class="btn btn-warning" onclick="showArchiveTenantModal(${onclickStrArg(editId)})">${t('form.endLease')}</button>
        <button type="button" class="btn btn-danger" onclick="deleteTenant('${editId}')">${t('form.delete')}</button>
      </div>`:''}
    </form>
  `);
  setTimeout(() => initRpInputs(), 50);
}

function onTenantStartDateChange(val) {
  const dueDayEl = document.getElementById('tenant-due-day');
  if (dueDayEl && !dueDayEl.value) {
    dueDayEl.placeholder = t('tenant.defaultDuePh', { n: calcDefaultDueDay(val) });
  }
}

/** Geser tanggal maju n bulan kalender; tanggal 31 → akhir bulan tujuan (Feb 28/29), hindari bug Date JS (Jan 31 + 1 bln → Mar). */
function addCalendarMonths(fromDate, n) {
  const s = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const y = s.getFullYear();
  const m = s.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  const day = Math.min(s.getDate(), last);
  return new Date(y, m, day);
}

/**
 * Jumlah periode sewa bulanan dari tanggal mulai–selesai kontrak (bukan jumlah bulan kalender yang “kesentuh”).
 * Contoh: 15 Jun – 15 Jul = 1 periode; algoritma lama (loop tanggal 1 tiap bulan) menghasilkan 2 dan salah.
 */
function countMonthlyLeasePeriods(startStr, endStr) {
  const s = parseYMD(startStr);
  const e = parseYMD(endStr);
  if (!s || !e || e < s) return 0;
  let m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() < s.getDate()) m--;
  return Math.max(1, m);
}

/** Periode tagihan tahunan: selisih tahun disesuaikan jika belum genap sampai tanggal mulai tahun berikutnya. */
function countYearlyLeasePeriods(startStr, endStr) {
  const s = parseYMD(startStr);
  const e = parseYMD(endStr);
  if (!s || !e || e < s) return 0;
  let y = e.getFullYear() - s.getFullYear();
  if (e.getMonth() < s.getMonth() || (e.getMonth() === s.getMonth() && e.getDate() < s.getDate())) y--;
  return Math.max(1, y);
}

/** Jumlah periode tagihan — selaras generate cicilan (bulanan / tahunan). */
function countBillingPeriodsForLease(tenant, unit) {
  const isYearly = unit.billingCycle === 'yearly';
  if (isYearly) return countYearlyLeasePeriods(tenant.startDate, tenant.endDate);
  return countMonthlyLeasePeriods(tenant.startDate, tenant.endDate);
}

/** Tanggal jatuh tempo periode pertama (sama seperti iterasi pertama generate cicilan). */
function firstDueDateInLease(tenant, unit) {
  const dueDay = tenant.dueDay || calcDefaultDueDay(tenant.startDate);
  const start = new Date(tenant.startDate);
  const yr = start.getFullYear();
  const mn = start.getMonth();
  const maxDay = new Date(yr, mn + 1, 0).getDate();
  const actualDueDay = Math.min(dueDay, maxDay);
  return `${yr}-${String(mn + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;
}

/** Lewatkan reminder Telegram untuk tagihan tidak relevan (lunas di muka, jatuh tempo setelah akhir kontrak). */
function shouldIncludePaymentInReminders(p, tenants) {
  if (p.prepaidFullLease) return false;
  if (p.type !== 'income' || !p.tenantId || !p.dueDate) return true;
  const tenant = tenants.find(x => x.id === p.tenantId);
  if (!tenant || !tenant.endDate) return true;
  const pd = parseYMD(p.dueDate);
  const te = parseYMD(tenant.endDate);
  if (pd && te && pd > te) return false;
  return true;
}

/** Pending/overdue yang “perlu perhatian” di dashboard & badge (selaras reminder Telegram). */
function isActionableDueForDashboard(p, tenants) {
  if (p.status !== 'pending' && p.status !== 'overdue') return false;
  return shouldIncludePaymentInReminders(p, tenants);
}

function generatePaymentsForTenant(tenant) {
  const units = getUnits();
  const unit = units.find(u => u.id === tenant.unitId);
  if (!unit || !tenant.startDate || !tenant.endDate) return [];

  if (tenant.paidInAdvance) {
    const periods = countBillingPeriodsForLease(tenant, unit);
    if (periods < 1) return [];
    const totalAmount = periods * unit.price;
    const dueDate = firstDueDateInLease(tenant, unit);
    const isYearly = unit.billingCycle === 'yearly';
    return [{
      id: DB.genId(), type: 'income', tenantId: tenant.id,
      propertyName: unit.property, amount: totalAmount, period: 'prepaid',
      dueDate,
      status: 'paid',
      description: t('pay.descPrepaidFull', { unit: unit.name, name: tenant.name }),
      autoGenerated: true, billingCycle: isYearly ? 'yearly' : 'monthly',
      prepaidFullLease: true,
      createdAt: new Date().toISOString()
    }];
  }

  const amount = unit.price;
  const isYearly = unit.billingCycle === 'yearly';
  const dueDay = tenant.dueDay || calcDefaultDueDay(tenant.startDate);
  const start = new Date(tenant.startDate);
  const end = new Date(tenant.endDate);
  const payments = [];

  if (isYearly) {
    const nYear = countYearlyLeasePeriods(tenant.startDate, tenant.endDate);
    for (let k = 0; k < nYear; k++) {
      const ref = addCalendarMonths(start, k * 12);
      const yr = ref.getFullYear();
      const mn = ref.getMonth();
      const period = `${yr}-${String(mn + 1).padStart(2, '0')}`;
      const maxDay = new Date(yr, mn + 1, 0).getDate();
      const actualDueDay = Math.min(dueDay, maxDay);
      const dueDate = `${yr}-${String(mn + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

      payments.push({
        id: DB.genId(), type: 'income', tenantId: tenant.id,
        propertyName: unit.property, amount, period, dueDate,
        status: 'pending',
        description: t('pay.descYearly', { unit: unit.name, name: tenant.name, yr }),
        autoGenerated: true, billingCycle: 'yearly',
        createdAt: new Date().toISOString()
      });
    }
  } else {
    const nMo = countMonthlyLeasePeriods(tenant.startDate, tenant.endDate);
    for (let k = 0; k < nMo; k++) {
      const ref = addCalendarMonths(start, k);
      const yr = ref.getFullYear();
      const mn = ref.getMonth();
      const period = `${yr}-${String(mn + 1).padStart(2, '0')}`;
      const maxDay = new Date(yr, mn + 1, 0).getDate();
      const actualDueDay = Math.min(dueDay, maxDay);
      const dueDate = `${yr}-${String(mn + 1).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

      payments.push({
        id: DB.genId(), type: 'income', tenantId: tenant.id,
        propertyName: unit.property, amount, period, dueDate,
        status: 'pending',
        description: t('pay.descMonthly', { unit: unit.name, name: tenant.name }),
        autoGenerated: true, billingCycle: 'monthly',
        createdAt: new Date().toISOString()
      });
    }
  }

  return payments;
}

function saveTenant(e, editId) {
  e.preventDefault(); const f = e.target;
  const dueDayVal = f.dueDay.value ? Number(f.dueDay.value) : 0;

  let vacancyDaysBeforeMoveIn = null;
  if (!editId) {
    const hist = getTenantHistory().filter(h => h.unitId === f.unitId.value)
      .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
    if (hist.length && f.startDate.value) {
      const sd = parseYMD(f.startDate.value);
      const ar = new Date(hist[0].archivedAt);
      if (sd && !isNaN(ar.getTime())) {
        const gap = Math.round((sd.getTime() - ar.getTime()) / 864e5);
        if (!isNaN(gap) && gap >= 0) vacancyDaysBeforeMoveIn = gap;
      }
    }
  }

  const data = { id: editId || DB.genId(), name: f.name.value.trim(), phone: f.phone.value.trim(),
    unitId: f.unitId.value, startDate: f.startDate.value, endDate: f.endDate.value,
    dueDay: dueDayVal || calcDefaultDueDay(f.startDate.value),
    paidInAdvance: !!f.paidInAdvance?.checked,
    deposit: parseNum(f.deposit.value)||0, notes: f.notes.value.trim(),
    vacancyDaysBeforeMoveIn: editId ? (getTenants().find(x=>x.id===editId)?.vacancyDaysBeforeMoveIn ?? null) : vacancyDaysBeforeMoveIn,
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
      showToast(t('msg.tenantAddedBills', { n: newPayments.length }), 'success', 3000);
    }
  } else {
    showToast(t('msg.tenantUpdated'), 'success');
  }

  syncUnitOccupancyFromTenants();
  closeModal(); refreshCurrentPage();
}

function regeneratePayments(tenantId) {
  const tenant = getTenants().find(t => t.id === tenantId);
  if (!tenant) return;

  const payments = getPayments();

  if (tenant.paidInAdvance) {
    if (!confirm(t('confirm.regenPrepaid'))) return;
    const kept = payments.filter(p => !(p.tenantId === tenantId && p.autoGenerated));
    const newPayments = generatePaymentsForTenant(tenant);
    kept.push(...newPayments);
    savePayments(kept);
    updateOverduePayments();
    alert(t('msg.billsRegenPrepaid', { n: newPayments.length }));
    closeModal(); refreshCurrentPage();
    return;
  }

  // Cicilan: pertahankan periode yang sudah lunas
  const existingAuto = payments.filter(p => p.tenantId === tenantId && p.autoGenerated);
  const paidPeriods = existingAuto.filter(p => p.status === 'paid').map(p => p.period);

  const kept = payments.filter(p => !(p.tenantId === tenantId && p.autoGenerated && p.status !== 'paid'));

  const newPayments = generatePaymentsForTenant(tenant);

  const toAdd = newPayments.filter(p => !paidPeriods.includes(p.period));

  kept.push(...toAdd);
  savePayments(kept);
  updateOverduePayments();

  alert(t('msg.billsRegen', { new: toAdd.length, kept: paidPeriods.length }));
  closeModal(); refreshCurrentPage();
}

function deleteTenant(id) {
  if (!confirm(t('confirm.deleteTenant'))) return;
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
  if (filtered.length === 0) { container.innerHTML = q ? '<p class="empty-state">' + t('tenant.searchNone', { q: escapeHtml(q) }) + '</p>' : emptyStateHTML('tenant'); return; }
  container.innerHTML = filtered.map(tn => {
    const unit = units.find(u=>u.id===tn.unitId);
    const dl = daysUntil(tn.endDate);
    let badge = dl < 0 ? '<span class="badge badge-danger">' + t('tenant.badgeExpired') + '</span>' : dl <= 30 ? `<span class="badge badge-warning">${dl}d</span>` : '<span class="badge badge-success">' + t('tenant.badgeActive') + '</span>';
    const ini = escapeHtml(tn.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase());
    return `<div class="list-item" onclick="showTenantForm(${onclickStrArg(tn.id)})">
      <div style="display:flex;gap:14px;align-items:center">
        <div style="width:44px;height:44px;border-radius:14px;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:15px;flex-shrink:0">${ini}</div>
        <div style="flex:1;min-width:0">
          <div class="list-item-header" style="margin-bottom:4px"><span class="list-item-title">${escapeHtml(tn.name)}</span>${badge}</div>
          <div class="list-item-subtitle" style="margin-bottom:2px">${unit ? escapeHtml(unit.property + ' — ' + unit.name) : t('tenant.unitUnknown')}</div>
          <div class="list-item-row"><span class="list-item-detail">${formatDate(tn.startDate)} — ${formatDate(tn.endDate)}</span><span class="list-item-detail">${escapeHtml(tn.phone || '')}</span></div>
        </div></div></div>`;
  }).join('');
}

// ===== PAYMENT TRACKING =====
let paymentFilter = 'all';
let paymentViewMode = (() => {
  const v = DB.getVal('payment_list_view');
  return v === 'byTenant' ? 'byTenant' : 'timeline';
})();

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
  openModal(p ? t('form.editPayment') : t('form.recordPayment'), `
    <form onsubmit="savePayment(event,'${editId||''}')">
      <div class="form-group"><label class="form-label">${t('form.paymentType')}</label>
        <select class="form-select" name="type" onchange="togglePaymentFields(this.value)">
          <option value="income" ${p?.type==='income'?'selected':''}>${t('form.typeIncome')}</option>
          <option value="expense" ${p?.type==='expense'?'selected':''}>${t('form.typeExpense')}</option></select></div>
      <div class="form-group" id="fg-tenant"><label class="form-label">${t('form.tenant')}</label>
        <select class="form-select" name="tenantId"><option value="">${t('form.pick')}</option>
          ${tenants.map(tn=>{const u=units.find(x=>x.id===tn.unitId);return`<option value="${tn.id}" ${p?.tenantId===tn.id?'selected':''}>${tn.name} (${u?u.name:'-'})</option>`;}).join('')}</select></div>
      <div class="form-group" id="fg-property"><label class="form-label">${t('form.property')}</label>
        <select class="form-select" name="propertyName" onchange="applyPbbAmountFromProperty(this.form)"><option value="">${t('form.pick')}</option>
          ${[...new Set(units.map(u=>u.property))].map(pr=>`<option value="${pr}" ${p?.propertyName===pr?'selected':''}>${pr}</option>`).join('')}</select></div>
      <div class="form-group" id="fg-expense-category" style="display:none"><label class="form-label">${t('form.expenseCat')}</label>
        <select class="form-select" name="expenseCategory" onchange="updatePbbLinkRow()">
          ${EXPENSE_CATEGORIES.map(c=>`<option value="${c.id}" ${expCat===c.id?'selected':''}>${getExpenseCategoryLabel(c.id)}</option>`).join('')}</select></div>
      <div class="form-group" id="fg-expense-unit" style="display:none"><label class="form-label">${t('form.expenseUnit')}</label>
        <select class="form-select" name="expenseUnitId"><option value="">${t('form.expenseUnitAll')}</option>
          ${units.map(u=>`<option value="${u.id}" ${p?.expenseUnitId===u.id?'selected':''}>${u.property} — ${u.name}</option>`).join('')}</select></div>
      <div class="form-group" id="fg-pbb-link" style="display:none">
        <label class="form-label">${t('form.pbbLinkLabel')}</label>
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-weight:400;line-height:1.45">
          <input type="checkbox" name="expensePbbFromProperty" value="1" ${p?.expensePbbFromProperty ? 'checked' : ''} style="margin-top:3px;flex-shrink:0" onchange="applyPbbAmountFromProperty(this.form)">
          <span>${t('form.pbbLinkHint')}</span>
        </label>
        <small style="color:var(--text-muted);font-size:12px;display:block;margin-top:8px;line-height:1.45">${t('form.pbbLinkMicro')}</small>
      </div>
      <div class="form-group"><label class="form-label">${t('form.amount')}</label>
        <input class="form-input" name="amount" type="text" inputmode="numeric" data-rp required placeholder="1.500.000" value="${p?.amount ? formatNumDots(p.amount) : ''}"></div>
      <div class="form-group"><label class="form-label">${t('form.period')}</label>
        <input class="form-input" name="period" type="month" required value="${p?.period||getMonthYear()}"></div>
      <div class="form-group"><label class="form-label">${t('form.dueDate')}</label>
        <input class="form-input" name="dueDate" type="date" required value="${p?.dueDate||''}"></div>
      <div class="form-group"><label class="form-label">${t('form.status')}</label>
        <select class="form-select" name="status">
          <option value="pending" ${p?.status==='pending'?'selected':''}>${t('pay.pending')}</option>
          <option value="paid" ${p?.status==='paid'?'selected':''}>${t('pay.paid')}</option></select></div>
      <div class="form-group"><label class="form-label">${t('form.desc')}</label>
        <input class="form-input" name="description" placeholder="${t('form.descPh')}" value="${p?.description||''}"></div>
      <button type="submit" class="btn btn-primary">${t('form.save')}</button>
      ${p?`<div class="btn-group">${p.status!=='paid'?`<button type="button" class="btn btn-success" onclick="markPaid('${editId}')">${t('form.markPaid')}</button>`:''}<button type="button" class="btn btn-danger" onclick="deletePayment('${editId}')">${t('form.delete')}</button></div>`:''}
    </form>
    <script>togglePaymentFields('${p?.type||'income'}')<\/script>
  `);
  setTimeout(() => { initRpInputs(); updatePbbLinkRow(); }, 50);
}

/** Tampilkan opsi hubung PBB pengeluaran ↔ pengaturan properti (kategori Pajak saja). */
function updatePbbLinkRow() {
  const form = document.querySelector('#modal-overlay form');
  if (!form || !form.type) return;
  const row = document.getElementById('fg-pbb-link');
  if (!row) return;
  const cat = form.expenseCategory?.value;
  const show = form.type.value === 'expense' && cat === 'tax';
  row.style.display = show ? 'block' : 'none';
  if (!show && form.expensePbbFromProperty) form.expensePbbFromProperty.checked = false;
}

/** Isi field jumlah dari PBB/tahun properti jika centang "dari pengaturan properti". */
function applyPbbAmountFromProperty(form) {
  if (!form) return;
  const cb = form.expensePbbFromProperty;
  const pr = form.propertyName?.value;
  const amt = form.amount;
  if (!cb || !cb.checked || !pr) return;
  const pd = getPropertyData(pr);
  const v = pd.pbb || 0;
  if (amt) amt.value = formatNumDots(v);
}

function togglePaymentFields(type) {
  const a = document.getElementById('fg-tenant'), b = document.getElementById('fg-property');
  const c = document.getElementById('fg-expense-category'), d = document.getElementById('fg-expense-unit');
  if (a) a.style.display = type==='income'?'block':'none';
  if (b) b.style.display = type==='expense'?'block':'none';
  if (c) c.style.display = type==='expense'?'block':'none';
  if (d) d.style.display = type==='expense'?'block':'none';
  updatePbbLinkRow();
}

function savePayment(e, editId) {
  e.preventDefault(); const f = e.target, type = f.type.value;
  let pn = f.propertyName.value;
  if (type==='income' && f.tenantId.value) {
    const t = getTenants().find(x=>x.id===f.tenantId.value);
    if (t) { const u = getUnits().find(x=>x.id===t.unitId); if (u) pn = u.property; }
  }
  const data = { id: editId||DB.genId(), type, tenantId: type==='income'?f.tenantId.value:'', propertyName: pn,
    amount: parseNum(f.amount.value), period: f.period.value, dueDate: f.dueDate.value,
    status: f.status.value, description: f.description.value.trim(),
    expenseCategory: type==='expense' ? (f.expenseCategory?.value || 'other') : '',
    expenseUnitId: type==='expense' ? (f.expenseUnitId?.value || '') : '',
    expensePbbFromProperty: type === 'expense' && (f.expenseCategory?.value === 'tax') && !!(f.expensePbbFromProperty && f.expensePbbFromProperty.checked),
    createdAt: editId?(getPayments().find(x=>x.id===editId)?.createdAt||new Date().toISOString()):new Date().toISOString()
  };
  if (data.status==='pending' && daysUntil(data.dueDate)<0) data.status='overdue';
  const payments = getPayments();
  if (editId) { const i = payments.findIndex(x=>x.id===editId); if (i>=0) payments[i]=data; }
  else payments.push(data);
  savePayments(payments); closeModal(); refreshCurrentPage();
  showToast(editId ? t('msg.paymentUpdated') : (data.type === 'expense' ? t('msg.expenseRecorded') : t('msg.paymentRecorded')), 'success');
}

function markPaid(id) {
  const p = getPayments(); const i = p.findIndex(x=>x.id===id);
  if (i>=0) { p[i].status='paid'; p[i].paidDate=new Date().toISOString(); savePayments(p); }
  closeModal(); refreshCurrentPage();
  showToast(t('msg.markedPaid'), 'success');
}

function deletePayment(id) { if (!confirm(t('confirm.deleteShort'))) return; savePayments(getPayments().filter(x=>x.id!==id)); closeModal(); refreshCurrentPage(); }

function filterPayments(f, btn) {
  paymentFilter = f;
  document.querySelectorAll('#page-payments .filter-tabs:not(.payment-view-tabs) .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPayments();
}

function setPaymentViewMode(mode, btn) {
  if (mode !== 'timeline' && mode !== 'byTenant') return;
  paymentViewMode = mode;
  DB.setVal('payment_list_view', mode);
  document.querySelectorAll('.payment-view-tabs .filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.payView === mode);
  });
  renderPayments();
}

function paymentRowHtml(p, tenants) {
  const tn = tenants.find(x => x.id === p.tenantId);
  const st = { paid: { b: 'badge-success', l: t('pay.stPaid') }, pending: { b: 'badge-warning', l: t('pay.stPending') }, overdue: { b: 'badge-danger', l: t('pay.stOverdue') } }[p.status] || { b: 'badge-warning', l: t('pay.stPending') };
  const isExp = p.type === 'expense';
  const isPaid = p.status === 'paid';
  const dl = daysUntil(p.dueDate);
  const dueLabel = isPaid ? t('pay.paidOn', { date: p.paidDate ? formatDate(p.paidDate) : '' }) : dl < 0 ? t('pay.lateDays', { n: Math.abs(dl) }) : dl === 0 ? t('pay.dueToday') : dl <= 5 ? t('pay.dueIn', { n: dl }) : t('pay.dueLabel', { date: formatDate(p.dueDate) });
  const dueColor = isPaid ? 'var(--success)' : dl <= 0 ? 'var(--danger)' : dl <= 5 ? '#d97706' : 'var(--text-muted)';
  const toggleBtn = !isExp ? `<button class="pay-toggle-btn ${isPaid ? 'paid' : ''}" onclick="quickTogglePaid(${onclickStrArg(p.id)}, event)" title="${isPaid ? t('form.cancelMark') : t('form.markPaid')}">
      ${isPaid ? '✅' : '☐'}
    </button>` : '';
  return `<div class="list-item payment-item ${isPaid ? 'payment-paid' : ''} status-${isExp ? 'expense' : p.status}" onclick="showPaymentForm(${onclickStrArg(p.id)})">
      <div style="display:flex;gap:12px;align-items:flex-start;width:100%">
        ${toggleBtn}
        <div style="flex:1;min-width:0">
          <div class="list-item-header"><span class="list-item-title">${isExp ? escapeHtml(getExpenseCategoryLabel(p.expenseCategory || 'other')) : '💰'} ${isExp ? '' : escapeHtml(tn?.name || t('pay.tenantWord'))}</span><span class="badge ${st.b}">${st.l}</span></div>
          <div class="list-item-subtitle">${escapeHtml(p.propertyName || '-')} · ${escapeHtml(p.description || t('pay.rentFallback', { period: p.period }))}${isExp && p.expenseCategory === 'tax' && p.expensePbbFromProperty ? ' · ' + escapeHtml(t('pay.pbbLinkTag')) : ''}</div>
          <div class="list-item-row" style="margin-top:6px">
            <span class="list-item-detail" style="color:${dueColor};font-weight:600">${dueLabel}</span>
            <span style="font-weight:800;font-size:15px;color:${isExp ? 'var(--danger)' : 'var(--success)'}">${isExp ? '-' : '+'}${formatRpFull(p.amount)}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function paymentGroupBadgeRow(items) {
  const tenants = getTenants();
  const nOverdue = items.filter(p => p.status === 'overdue' && isActionableDueForDashboard(p, tenants)).length;
  const nPending = items.filter(p => p.status === 'pending' && isActionableDueForDashboard(p, tenants)).length;
  const nPaid = items.filter(p => p.status === 'paid').length;
  let html = '';
  if (nOverdue) html += `<span class="pg-mini pg-mini-overdue">${t('pay.miniOver', { n: nOverdue })}</span>`;
  if (nPending) html += `<span class="pg-mini pg-mini-pending">${t('pay.miniPending', { n: nPending })}</span>`;
  if (nPaid) html += `<span class="pg-mini pg-mini-paid">${t('pay.miniPaid', { n: nPaid })}</span>`;
  return html ? `<div class="payment-group-badges">${html}</div>` : '';
}

function paymentGroupDefaultOpen(items) {
  // Semua: default tertutup per grup (nama) supaya daftar tidak “rame”; user buka manual.
  if (paymentFilter === 'all') return false;
  if (paymentFilter === 'paid' || paymentFilter === 'pending' || paymentFilter === 'overdue') return true;
  const tenants = getTenants();
  return items.some(p => isActionableDueForDashboard(p, tenants));
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
  showToast(p.status === 'paid' ? t('msg.markedPaid') : t('msg.statusReverted'), p.status === 'paid' ? 'success' : 'info');
}

function renderPayments() {
  const payments = getPayments(), tenants = getTenants(), units = getUnits();
  updateOverduePayments();
  const filtered = paymentFilter === 'all' ? payments : payments.filter(p => p.status === paymentFilter);
  const sorted = [...filtered].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const container = document.getElementById('payment-list');
  if (!container) return;

  document.querySelectorAll('.payment-view-tabs .filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.payView === paymentViewMode);
  });

  if (sorted.length === 0) { container.innerHTML = emptyStateHTML('payment'); return; }

  if (paymentViewMode === 'timeline') {
    container.innerHTML = sorted.map(p => paymentRowHtml(p, tenants)).join('');
    return;
  }

  const groupMap = new Map();
  for (const p of sorted) {
    let key;
    if (p.type === 'expense') key = '_expenses';
    else if (p.tenantId) key = p.tenantId;
    else key = '_income_loose';
    if (!groupMap.has(key)) groupMap.set(key, { key, items: [] });
    groupMap.get(key).items.push(p);
  }

  const tenantKeys = [...groupMap.keys()].filter(k => k !== '_expenses' && k !== '_income_loose');
  tenantKeys.sort((a, b) => {
    const na = tenants.find(t => t.id === a)?.name || '';
    const nb = tenants.find(t => t.id === b)?.name || '';
    return naturalSort(na, nb);
  });
  const orderKeys = [...tenantKeys];
  if (groupMap.has('_income_loose')) orderKeys.push('_income_loose');
  if (groupMap.has('_expenses')) orderKeys.push('_expenses');

  container.innerHTML = orderKeys.map(k => {
    const { items } = groupMap.get(k);
    let titleText, metaLine;

    if (k === '_expenses') {
      titleText = t('pay.groupExp');
      metaLine = t('pay.groupTx', { n: items.length });
    } else if (k === '_income_loose') {
      titleText = t('pay.groupLoose');
      metaLine = t('pay.groupLooseHint', { n: items.length });
    } else {
      const tn = tenants.find(x => x.id === k);
      const u = tn ? units.find(x => x.id === tn.unitId) : null;
      titleText = tn?.name || t('pay.tenantMissing');
      metaLine = u ? `${u.property} · ${u.name}` : (tn ? t('pay.noUnitLinked') : '');
    }

    const openAttr = paymentGroupDefaultOpen(items) ? ' open' : '';
    const badges = paymentGroupBadgeRow(items);
    const rows = items.map(p => paymentRowHtml(p, tenants)).join('');

    return `<div class="payment-group">
      <details class="payment-group-details"${openAttr}>
        <summary>
          <div class="payment-group-summary-top">
            <span class="payment-group-title">${escapeHtml(titleText)}</span>
            <span class="payment-group-chevron" aria-hidden="true">▼</span>
          </div>
          <div class="payment-group-meta">
            ${metaLine ? `<div>${escapeHtml(metaLine)}</div>` : ''}
            ${badges}
          </div>
        </summary>
        <div class="payment-group-items">${rows}</div>
      </details>
    </div>`;
  }).join('');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const units = getUnits(), payments = getPayments(), tenants = getTenants(), cm = getMonthYear();
  const total = units.length, occ = units.filter(u=>u.status==='occupied').length;
  const occupancy = total>0 ? Math.round((occ/total)*100) : 0;
  const mp = payments.filter(p => paymentMatchesCalendarMonth(p, cm));
  const inc = mp.filter(p=>p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const exp = mp.filter(p=>p.type==='expense').reduce((s,p)=>s+p.amount,0);
  const overdue = payments.filter(p => p.status === 'overdue' && isActionableDueForDashboard(p, tenants)).length;

  const simple = isSimpleMode();
  const greet = document.getElementById('greeting-container');
  if (!greet) return;
  greet.innerHTML = `
    <div class="greeting-banner">
      <div class="greeting-text">${getGreeting()} 👋</div>
      <div class="greeting-name">${getDashboardGreetingSublineHtml()}</div>
      <div class="quick-stats">
        <div class="quick-stat"><span class="quick-stat-value">${total}</span><span class="quick-stat-label">${t('stat.unit')}</span></div>
        <div class="quick-stat"><span class="quick-stat-value">${occupancy}%</span><span class="quick-stat-label">${simple ? t('stat.occPct') : t('stat.occ')}</span></div>
        <div class="quick-stat"><span class="quick-stat-value">${occ}</span><span class="quick-stat-label">${simple ? t('stat.filled') : t('stat.filledPro')}</span></div>
        <div class="quick-stat"><span class="quick-stat-value" ${overdue>0?'style="color:#ef4444"':''}>${overdue}</span><span class="quick-stat-label">${t('stat.overdue')}</span></div>
      </div>
      <button type="button" class="greeting-cal-jump" onclick="var el=document.getElementById('dash-biz-cal');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})">${t('dash.jumpCal')}</button>
    </div>`;

  const cfTitle = document.getElementById('dash-cf-title');
  if (cfTitle) cfTitle.textContent = simple ? t('dash.cfSimple') : t('dash.cfPro');

  const cfIn = document.getElementById('cf-income');
  const cfEx = document.getElementById('cf-expense');
  const cfNt = document.getElementById('cf-net');
  if (cfIn) cfIn.textContent = formatRpFull(inc);
  if (cfEx) cfEx.textContent = formatRpFull(exp);
  if (cfNt) cfNt.textContent = formatRpFull(inc - exp);

  // Upcoming dues — filter sama seperti reminder (selaras Telegram)
  const pending = payments.filter(p => isActionableDueForDashboard(p, tenants))
    .sort((a, b) => {
      const aMs = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bMs = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aMs - bMs;
    }).slice(0, 5);
  const dc = document.getElementById('upcoming-dues');
  if (dc) {
    if (!pending.length) dc.innerHTML = '<p class="empty-state">' + t('dash.noDues') + '</p>';
    else dc.innerHTML = pending.map(p => {
      const tnt = tenants.find(x => x.id === p.tenantId);
      const d = p.dueDate ? daysUntil(p.dueDate) : null;
      const lbl = d == null || isNaN(d)
        ? `<span class="upcoming-tag">—</span>`
        : d < 0
          ? `<span class="overdue-tag">${t('dash.overdue', { n: Math.abs(d) })}</span>`
          : `<span class="upcoming-tag">${t('dash.inDays', { n: d })}</span>`;
      return `<div class="due-item"><div class="due-info"><span class="due-name">${escapeHtml(tnt?.name || t('dash.expenseLbl'))}</span><span class="due-detail">${escapeHtml(p.propertyName || '-')} · ${lbl}</span></div><span class="due-amount">${formatRp(p.amount)}</span></div>`;
    }).join('');
  }

  const rt = document.getElementById('reminder-tools');
  const scopeRem = getReminderScopePayments();
  if (rt) {
    if (!scopeRem.length) {
      rt.setAttribute('hidden', '');
      rt.innerHTML = '';
    } else {
      rt.removeAttribute('hidden');
      rt.innerHTML = `<p class="reminder-tools-hint">${escapeHtml(t('reminder.toolsHint'))}</p>
        <div class="reminder-tools-row">
          <button type="button" class="btn btn-outline btn-reminder-ics" onclick="downloadReminderCalendarIcs()">${escapeHtml(t('reminder.downloadIcs'))}</button>
          <button type="button" class="btn btn-outline" onclick="openGoogleCalendarNextDue()">${escapeHtml(t('reminder.googleNext'))}</button>
          <button type="button" class="btn btn-outline btn-reminder-wa" onclick="openWhatsAppReminderPage()">${escapeHtml(t('reminder.whatsappBtn'))}</button>
        </div>`;
    }
  }

  // ROI Cards (Pro saja)
  if (isProMode()) renderROICards();
  else {
    const roiEl = document.getElementById('dashboard-roi');
    if (roiEl) roiEl.innerHTML = '';
  }

  // Properties
  const props = [...new Set(units.map(u=>u.property))];
  const pc = document.getElementById('dashboard-properties');
  if (pc) {
    if (!props.length) pc.innerHTML = '<p class="empty-state">' + t('dash.propertiesEmpty') + '</p>';
    else pc.innerHTML = props.map(prop => {
      const pu = units.filter(u=>u.property===prop), po = pu.filter(u=>u.status==='occupied').length, pt = pu.length;
      const o = pt>0?Math.round((po/pt)*100):0, circ = 2*Math.PI*16, off = circ-(o/100)*circ;
      const col = o>=80?'var(--success)':o>=50?'var(--warning-dark)':'var(--danger)';
      return `<div class="property-mini"><div class="property-mini-info"><span class="property-mini-name">${escapeHtml(prop)}</span>
        <span class="property-mini-detail">${t('dash.occupiedDetail', { po, pt, rent: formatRp(pu.reduce((s,u)=>s+(u.status==='occupied'?getUnitMonthlyRent(u):0),0)) })}</span></div>
        <div class="occ-ring"><svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="16" fill="none" stroke="var(--border)" stroke-width="4"/>
          <circle cx="22" cy="22" r="16" fill="none" stroke="${col}" stroke-width="4" stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/>
        </svg><span class="occ-ring-text" style="color:${col}">${o}%</span></div></div>`;
    }).join('');
  }

  const dbc = document.getElementById('dashboard-business-calendar');
  if (dbc) {
    const rem = collectBusinessReminders(60, 90);
    const slice = rem.slice(0, 7);
    const remHtml = slice.length
      ? slice.map(r =>
          `<div class="biz-cal-row dash ${r.level}"><span class="biz-cal-dot"></span><div><div class="biz-cal-title">${escapeHtml(r.title)}</div><div class="biz-cal-sub">${escapeHtml(r.sub)}</div></div><span class="biz-cal-when">${escapeHtml(r.whenLabel)}</span></div>`).join('')
      : '<p class="empty-state">' + t('dash.calEmpty') + '</p>';
    let more = '';
    if (isProMode()) {
      more = rem.length > slice.length
        ? `<p class="yield-cap-micro dash-cal-more">${t('dash.calMore', { n: rem.length - slice.length })}<button type="button" class="btn-link-cal" onclick="openReportTab('insight')">${t('dash.calOpenInsight')}</button></p>`
        : (rem.length ? `<p class="yield-cap-micro dash-cal-more"><button type="button" class="btn-link-cal" onclick="openReportTab('insight')">${t('dash.calDetailInsight')}</button></p>` : '');
    }
    dbc.innerHTML = `<div class="biz-cal-list">${remHtml}</div>${more}`;
  }
}

// ===== REPORTS (Overview + Yield + Analytics + Multi) =====
let reportPeriod = 'month';
let reportTab = 'overview';

function switchReportTab(tab, btn) {
  const panel = document.getElementById(`rpt-tab-${tab}`);
  if (!panel) return;
  reportTab = tab;
  document.querySelectorAll('#page-reports > .filter-tabs.ui-pro-only .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.rpt-tab').forEach(t => t.classList.remove('active'));
  panel.classList.add('active');
  renderReports();
}

/** Pindah ke Laporan + sub-tab (mis. dari kartu dashboard). */
function openReportTab(tab) {
  if (isSimpleMode()) {
    navigateTo('reports');
    return;
  }
  const panel = document.getElementById(`rpt-tab-${tab}`);
  if (!panel) return;
  reportTab = tab;
  navigateTo('reports');
  document.querySelectorAll('#page-reports > .filter-tabs.ui-pro-only .filter-tab').forEach(t => {
    t.classList.remove('active');
    if (t.getAttribute('data-report-tab') === tab) t.classList.add('active');
  });
  document.querySelectorAll('#page-reports .rpt-tab').forEach(t => t.classList.remove('active'));
  panel.classList.add('active');
}

function changeReportPeriod(p, btn) {
  reportPeriod = p;
  document.querySelectorAll('.sub-filter .filter-tab').forEach(t=>t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderReports();
}

function renderReports() {
  if (isSimpleMode()) {
    reportTab = 'overview';
    document.querySelectorAll('#page-reports .rpt-tab').forEach(t => t.classList.remove('active'));
    const ov = document.getElementById('rpt-tab-overview');
    if (ov) ov.classList.add('active');
    renderOverview();
    return;
  }
  if (reportTab === 'overview') renderOverview();
  else if (reportTab === 'yield') renderYield();
  else if (reportTab === 'proyeksi') renderProyeksi();
  else if (reportTab === 'analytics') renderAnalytics();
  else if (reportTab === 'multi') renderMultiProperty();
  else if (reportTab === 'kpr') renderKPRSimulator();
  else if (reportTab === 'charts') renderCharts();
  else if (reportTab === 'stress') renderStressTest();
  else if (reportTab === 'insight') renderInvestorInsight();
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
  if (!props.length) pnl.innerHTML = '<p class="empty-state">' + t('chart.noData') + '</p>';
  else {
    const mx = Math.max(...props.map(pr => Math.abs(pp.filter(p=>p.propertyName===pr&&p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0) - pp.filter(p=>p.propertyName===pr&&p.type==='expense').reduce((s,p)=>s+p.amount,0))),1);
    pnl.innerHTML = props.map(pr => {
      const i = pp.filter(p=>p.propertyName===pr&&p.type==='income'&&p.status==='paid').reduce((s,p)=>s+p.amount,0);
      const e = pp.filter(p=>p.propertyName===pr&&p.type==='expense').reduce((s,p)=>s+p.amount,0);
      const pf = i-e, bw = mx>0?Math.abs(pf)/mx*100:0, pos = pf>=0;
      return `<div class="pnl-row"><div class="pnl-header"><span class="pnl-name">${escapeHtml(pr)}</span><span class="pnl-profit ${pos?'positive':'negative'}">${pos?'+':''}${formatRpFull(pf)}</span></div>
        <div class="pnl-bar"><div class="pnl-bar-fill ${pos?'positive':'negative'}" style="width:${bw}%"></div></div></div>`;
    }).join('');
  }

  // Transactions
  const sorted = [...pp].sort((a,b)=>new Date(b.dueDate)-new Date(a.dueDate)).slice(0,20);
  const tx = document.getElementById('report-transactions');
  if (!sorted.length) tx.innerHTML = '<p class="empty-state">' + t('tx.none') + '</p>';
  else tx.innerHTML = sorted.map(p => {
    const isE = p.type==='expense';
    const desc = escapeHtml(p.description || (isE ? 'Pengeluaran' : 'Sewa'));
    const propNm = escapeHtml(p.propertyName || '-');
    return `<div class="tx-item"><div class="tx-info"><span class="tx-desc">${isE?'💸':'💰'} ${desc} — ${propNm}</span>
      <span class="tx-date">${formatDate(p.dueDate)} · ${p.status==='paid'?t('tx.statusPaid'):t('tx.statusPending')}</span></div>
      <span class="tx-amount ${isE?'expense':'income'}">${isE?'-':'+'}${formatRp(p.amount)}</span></div>`;
  }).join('');
}

/** Data ringkasan overview untuk CSV/PDF (satu sumber kebenaran). */
function buildOverviewExportContext() {
  const payments = getPayments();
  const units = getUnits();
  const cp = reportPeriod === 'month' ? getMonthYear() : getYear();
  const pp = payments.filter(p => (reportPeriod === 'month' ? p.period === cp : p.period.startsWith(cp)));
  const ti = pp.filter(p => p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const te = pp.filter(p => p.type === 'expense').reduce((s, p) => s + p.amount, 0);
  const net = ti - te;
  const allProps = getProperties();
  const tpp = allProps.reduce((s, p) => s + (p.purchasePrice || 0), 0);
  const totalFixedCosts = allProps.reduce((s, p) => s + getPropertyAnnualCost(p), 0);
  const an = reportPeriod === 'month' ? net * 12 : net;
  const y = tpp > 0 ? (((an - (reportPeriod === 'month' ? totalFixedCosts / 12 : totalFixedCosts)) / tpp) * 100).toFixed(1) : '-';

  const props = [...new Set(units.map(u => u.property))];
  const pnlRows = props.map(pr => {
    const i = pp.filter(p => p.propertyName === pr && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const e = pp.filter(p => p.propertyName === pr && p.type === 'expense').reduce((s, p) => s + p.amount, 0);
    return { property: pr, income: i, expense: e, net: i - e };
  });

  const expByCat = {};
  pp.filter(p => p.type === 'expense').forEach(p => {
    const c = p.expenseCategory || 'other';
    expByCat[c] = (expByCat[c] || 0) + p.amount;
  });

  const incByProp = {};
  pp.filter(p => p.type === 'income' && p.status === 'paid').forEach(p => {
    const pr = p.propertyName || '-';
    incByProp[pr] = (incByProp[pr] || 0) + p.amount;
  });

  const sortedChrono = [...pp].sort((a, b) => {
    const da = new Date(a.dueDate || 0).getTime();
    const db = new Date(b.dueDate || 0).getTime();
    return da - db;
  });

  return {
    cp,
    reportPeriod,
    pp,
    ti,
    te,
    net,
    y,
    tpp,
    pnlRows,
    expByCat,
    incByProp,
    sortedChrono,
    generatedAt: new Date().toISOString()
  };
}

function expenseCategoryPlain(id) {
  const key = 'expense.' + (id || 'other');
  const s = typeof t === 'function' ? t(key) : key;
  return s === key ? String(id || 'other') : s;
}

/**
 * CSV untuk pajak / akuntansi: kolom Amount_IDR angka bulat (mudah SUM di Excel), grup per bagian.
 */
function exportOverviewReportCsv() {
  const ctx = buildOverviewExportContext();
  const rows = [];
  const slug = ctx.reportPeriod === 'month' ? ctx.cp : `year-${ctx.cp}`;

  rows.push([t('rpt.taxReportTitle'), '', '']);
  rows.push([t('rpt.taxGenerated'), ctx.generatedAt, '']);
  rows.push([t('rpt.exportPeriod'), ctx.reportPeriod === 'month' ? ctx.cp : t('rpt.exportYearValue', { y: ctx.cp }), '']);
  rows.push([t('rpt.exportMode'), ctx.reportPeriod === 'month' ? t('rpt.monthly') : t('rpt.yearly'), '']);
  rows.push(['', '', '']);

  rows.push([t('rpt.taxSectionTotals'), 'Amount_IDR', 'Notes']);
  rows.push([t('rpt.taxLineIncomePaid'), String(Math.round(ctx.ti)), t('rpt.taxNotePaidOnly')]);
  rows.push([t('rpt.taxLineExpense'), String(Math.round(ctx.te)), '']);
  rows.push([t('rpt.taxLineNet'), String(Math.round(ctx.net)), '']);
  if (isProMode() && ctx.y !== '-') {
    rows.push([t('rpt.yieldBuy'), ctx.y + '%', t('rpt.taxNoteYield')]);
  }
  rows.push(['', '', '']);

  rows.push([t('rpt.taxIncomeByProp'), 'Amount_IDR', '']);
  const incKeys = Object.keys(ctx.incByProp).sort();
  if (!incKeys.length) rows.push([t('chart.noData'), '', '']);
  else incKeys.forEach(k => rows.push([k, String(Math.round(ctx.incByProp[k])), '']));
  rows.push(['', '', '']);

  rows.push([t('rpt.taxExpenseByCat'), 'Amount_IDR', '']);
  const catKeys = Object.keys(ctx.expByCat).sort();
  if (!catKeys.length) rows.push(['—', '0', '']);
  else catKeys.forEach(k => rows.push([expenseCategoryPlain(k), String(Math.round(ctx.expByCat[k])), '']));
  rows.push(['', '', '']);

  rows.push([t('rpt.taxPnlByProp'), 'Income_IDR', 'Expense_IDR', 'Net_IDR']);
  if (!ctx.pnlRows.length) rows.push([t('chart.noData'), '', '', '']);
  else {
    ctx.pnlRows.forEach(r => {
      rows.push([r.property, String(Math.round(r.income)), String(Math.round(r.expense)), String(Math.round(r.net))]);
    });
  }
  rows.push(['', '', '', '']);

  rows.push([t('rpt.taxSectionLines'), '', '', '']);
  rows.push([
    t('rpt.exportColPeriod'),
    t('rpt.exportColDate'),
    t('rpt.colType'),
    t('rpt.colCategory'),
    t('rpt.exportColProp'),
    t('rpt.exportColDesc'),
    t('rpt.colAmountIdr'),
    t('rpt.exportColStatus')
  ]);
  ctx.sortedChrono.forEach(p => {
    const isE = p.type === 'expense';
    const typ = isE ? t('form.typeExpense') : t('form.typeIncome');
    const cat = isE ? expenseCategoryPlain(p.expenseCategory) : t('rpt.taxCatRent');
    const desc = p.description || (isE ? '—' : t('rpt.taxRentShort'));
    const amt = isE ? -Math.round(p.amount) : Math.round(p.amount);
    rows.push([
      p.period || '',
      p.dueDate ? String(p.dueDate).slice(0, 10) : '',
      typ,
      cat,
      p.propertyName || '-',
      desc,
      String(amt),
      p.status || ''
    ]);
  });
  rows.push(['', '', '', '', '', '', '', '']);
  rows.push([t('rpt.taxDisclaimer'), '', '', '', '', '', '', '']);

  const bom = '\uFEFF';
  const csv = rows.map(r => r.map(csvEscapeCell).join(',')).join('\r\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `propertiKu-tax-${slug}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast(t('rpt.exportDone'), 'success', 2500);
}

function buildTaxReportPrintHtml(ctx) {
  const esc = escapeHtml;
  const periodLbl = ctx.reportPeriod === 'month' ? esc(ctx.cp) : esc(t('rpt.exportYearValue', { y: ctx.cp }));

  const incRows = Object.keys(ctx.incByProp).sort().map(k =>
    `<tr><td>${esc(k)}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(ctx.incByProp[k]))}</td></tr>`
  ).join('') || `<tr><td colspan="2">${esc(t('chart.noData'))}</td></tr>`;

  const catRows = Object.keys(ctx.expByCat).sort().map(k =>
    `<tr><td>${esc(expenseCategoryPlain(k))}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(ctx.expByCat[k]))}</td></tr>`
  ).join('') || `<tr><td colspan="2">—</td></tr>`;

  const pnlRows = ctx.pnlRows.length
    ? ctx.pnlRows.map(r => `<tr><td>${esc(r.property)}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(r.income))}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(r.expense))}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(r.net))}</td></tr>`).join('')
    : `<tr><td colspan="4">${esc(t('chart.noData'))}</td></tr>`;

  const lineRows = ctx.sortedChrono.map(p => {
    const isE = p.type === 'expense';
    const amt = isE ? -Math.round(p.amount) : Math.round(p.amount);
    return `<tr>
      <td>${esc(p.period || '')}</td>
      <td>${esc((p.dueDate || '').toString().slice(0, 10))}</td>
      <td>${esc(isE ? t('form.typeExpense') : t('form.typeIncome'))}</td>
      <td>${esc(isE ? expenseCategoryPlain(p.expenseCategory) : t('rpt.taxCatRent'))}</td>
      <td>${esc(p.propertyName || '-')}</td>
      <td>${esc(p.description || '')}</td>
      <td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(amt))}</td>
      <td>${esc(p.status || '')}</td>
    </tr>`;
  }).join('');

  const yieldRow = isProMode() && ctx.y !== '-'
    ? `<tr><td>${esc(t('rpt.yieldBuy'))}</td><td style="text-align:right">${esc(ctx.y)}%</td></tr>`
    : '';

  const docSlug = esc(ctx.cp);
  return `<!DOCTYPE html><html lang="${typeof getLocale === 'function' && getLocale() === 'en' ? 'en' : 'id'}"><head><meta charset="utf-8"><title>${esc(t('rpt.taxReportTitle'))} — ${docSlug}</title>
<style>
  body { font-family: system-ui, Segoe UI, sans-serif; font-size: 11pt; color: #111; margin: 24px; }
  h1 { font-size: 16pt; margin: 0 0 4px; }
  .meta { color: #444; font-size: 10pt; margin-bottom: 20px; }
  h2 { font-size: 12pt; margin: 18px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; page-break-inside: avoid; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: 700; font-size: 10pt; }
  .disc { font-size: 9pt; color: #555; margin-top: 24px; max-width: 720px; }
  @media print { body { margin: 12mm; } }
</style></head><body>
  <h1>${esc(t('rpt.taxReportTitle'))}</h1>
  <div class="meta">${esc(t('rpt.taxGenerated'))}: ${esc(ctx.generatedAt)}<br>
  ${esc(t('rpt.exportPeriod'))}: ${periodLbl} · ${esc(t('rpt.exportMode'))}: ${esc(ctx.reportPeriod === 'month' ? t('rpt.monthly') : t('rpt.yearly'))}</div>

  <h2>${esc(t('rpt.taxSectionTotals'))}</h2>
  <table><thead><tr><th>${esc(t('rpt.taxColLabel'))}</th><th>${esc(t('rpt.pdfColAmount'))}</th></tr></thead><tbody>
    <tr><td>${esc(t('rpt.taxLineIncomePaid'))}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(ctx.ti))}</td></tr>
    <tr><td>${esc(t('rpt.taxLineExpense'))}</td><td style="text-align:right;white-space:nowrap">${esc(formatIdrPrint(ctx.te))}</td></tr>
    <tr><td><strong>${esc(t('rpt.taxLineNet'))}</strong></td><td style="text-align:right;white-space:nowrap"><strong>${esc(formatIdrPrint(ctx.net))}</strong></td></tr>
    ${yieldRow}
  </tbody></table>

  <h2>${esc(t('rpt.taxIncomeByProp'))}</h2>
  <table><thead><tr><th>${esc(t('rpt.exportColProp'))}</th><th>${esc(t('rpt.pdfColAmount'))}</th></tr></thead><tbody>${incRows}</tbody></table>

  <h2>${esc(t('rpt.taxExpenseByCat'))}</h2>
  <table><thead><tr><th>${esc(t('rpt.colCategory'))}</th><th>${esc(t('rpt.pdfColAmount'))}</th></tr></thead><tbody>${catRows}</tbody></table>

  <h2>${esc(t('rpt.taxPnlByProp'))}</h2>
  <table><thead><tr><th>${esc(t('rpt.exportColProp'))}</th><th>${esc(t('rpt.taxColIncome'))}</th><th>${esc(t('rpt.taxColExpense'))}</th><th>${esc(t('rpt.taxColNet'))}</th></tr></thead><tbody>${pnlRows}</tbody></table>

  <h2>${esc(t('rpt.taxSectionLines'))}</h2>
  <table><thead><tr>
    <th>${esc(t('rpt.exportColPeriod'))}</th><th>${esc(t('rpt.exportColDate'))}</th><th>${esc(t('rpt.colType'))}</th><th>${esc(t('rpt.colCategory'))}</th>
    <th>${esc(t('rpt.exportColProp'))}</th><th>${esc(t('rpt.exportColDesc'))}</th><th>${esc(t('rpt.colAmountIdr'))}</th><th>${esc(t('rpt.exportColStatus'))}</th>
  </tr></thead><tbody>${ctx.sortedChrono.length ? lineRows : `<tr><td colspan="8">${esc(t('tx.none'))}</td></tr>`}</tbody></table>

  <p class="disc">${esc(t('rpt.taxDisclaimer'))}</p>
</body></html>`;
}

/** PDF ringan: buka jendela siap cetak → simpan sebagai PDF dari dialog browser. */
function exportOverviewReportPdf() {
  const ctx = buildOverviewExportContext();
  const html = buildTaxReportPrintHtml(ctx);
  const w = window.open('', '_blank');
  if (!w) {
    if (typeof showToast === 'function') showToast(t('rpt.pdfPopupBlocked'), 'error', 4000);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch (e) { /* ignore */ }
  }, 300);
  if (typeof showToast === 'function') showToast(t('rpt.pdfPrintHint'), 'info', 4500);
}

/** Alias kompatibilitas lama */
function exportOverviewReport() {
  exportOverviewReportCsv();
}

// ===== YIELD CALCULATOR =====
function getYieldAppreciationPct() {
  const v = parseFloat(DB.getVal('yield_cap_appreciation_pct') || '0');
  if (isNaN(v)) return 0;
  return Math.min(50, Math.max(-30, v));
}
function getYieldHorizonYears() {
  const v = parseInt(DB.getVal('yield_cap_horizon_years') || '5', 10);
  if (isNaN(v)) return 5;
  return Math.min(30, Math.max(1, v));
}
/** Asumsi % kenaikan "laba sewa" (Net profit/thn) dari tahun ke tahun untuk total di horizon. */
function getYieldRentEscalationPct() {
  const v = parseFloat(DB.getVal('yield_cap_rent_escalation_pct') || '0');
  if (isNaN(v)) return 0;
  return Math.min(25, Math.max(-15, v));
}
function getYieldCapOverrideMap() {
  try {
    const o = JSON.parse(DB.getVal('yield_cap_by_property') || '{}');
    return typeof o === 'object' && o !== null && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}
function effectiveYieldCapPct(propName, globalCap) {
  const map = getYieldCapOverrideMap();
  if (Object.prototype.hasOwnProperty.call(map, propName)) {
    const v = parseFloat(map[propName]);
    if (!isNaN(v)) return Math.min(50, Math.max(-30, v));
  }
  return globalCap;
}
function setYieldCapOverrideFromYield(propName, raw) {
  const map = getYieldCapOverrideMap();
  const t = String(raw ?? '').trim();
  if (t === '') {
    delete map[propName];
  } else {
    const v = parseFloat(t);
    if (isNaN(v)) return;
    map[propName] = Math.min(50, Math.max(-30, v));
  }
  DB.setVal('yield_cap_by_property', JSON.stringify(map));
  renderProyeksi();
}
/** Jumlah laba sewa selama `years` tahun: thn 1 = base, thn berikutnya naik g% dari thn sebelumnya. */
function cumNetOperasionalOverYears(baseNetAnnual, years, rentEscalationPct) {
  const n = Math.max(0, Math.floor(years));
  const g = rentEscalationPct / 100;
  if (n <= 0) return 0;
  if (Math.abs(g) < 1e-12) return Math.round(baseNetAnnual * n);
  let sum = 0;
  for (let k = 0; k < n; k++) sum += baseNetAnnual * Math.pow(1 + g, k);
  return Math.round(sum);
}

function renderYield() {
  const units = getUnits(), payments = getPayments();
  const props = [...new Set(units.map(u=>u.property))];
  const container = document.getElementById('yield-content');

  if (!props.length) { container.innerHTML = emptyStateHTML('property'); return; }

  // Comparison table
  let compHtml = '';
  if (props.length > 1) {
    compHtml = `<div class="card"><h3 class="card-title">${t('rpt.yieldCompareTitle')}</h3><p class="yield-cap-table-note">${t('rpt.yieldCompareNote')}</p><div class="yield-compare-table"><table class="compare-table"><thead><tr><th>${t('rpt.colProperty')}</th><th>${t('rpt.colGross')}</th><th>${t('rpt.colNet')}</th><th>${t('rpt.colFull')}</th><th>${t('rpt.colPayback')}</th></tr></thead><tbody>`;
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

    const monthlyRent = pu.filter(u=>u.status==='occupied').reduce((s,u)=>s+getUnitMonthlyRent(u),0);
    const potentialRent = pu.reduce((s,u)=>s+getUnitMonthlyRent(u),0);
    const yearIncome = monthlyRent * 12;
    const yearIncomeIfFull = potentialRent * 12;

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
    const fullNetYieldNum = purchasePrice > 0 ? ((yearIncomeIfFull - totalAnnualExpense) / purchasePrice) * 100 : NaN;
    const effectiveYield = purchasePrice > 0 && !isNaN(fullNetYieldNum) ? fullNetYieldNum.toFixed(2) : '-';

    const netAnnualProfit = yearIncome - totalAnnualExpense;
    const cashflowAfterCicilan = yearIncome - totalWithCicilan;
    const monthlyCashflow = Math.round(cashflowAfterCicilan / 12);
    const paybackYears = purchasePrice > 0 && netAnnualProfit > 0 ? (purchasePrice / netAnnualProfit).toFixed(1) : '-';
    const paybackLabel = formatPaybackLabel(paybackYears);

    // Badge color
    const nv = parseFloat(netYield);
    const badgeColor = isNaN(nv) ? 'var(--text-muted)' : nv >= 8 ? 'var(--success)' : nv >= 4 ? 'var(--warning-dark)' : 'var(--danger)';

    // Add to comparison table
    if (props.length > 1) {
      compHtml += `<tr onclick="showPropertySettings(${onclickStrArg(prop)})"><td style="font-weight:700">${escapeHtml(prop)}</td><td>${grossYield !== '-' ? grossYield+'%' : '-'}</td><td style="color:${badgeColor};font-weight:800">${netYield !== '-' ? netYield+'%' : '-'}</td><td>${effectiveYield !== '-' ? effectiveYield+'%' : '-'}</td><td>${paybackLabel}</td></tr>`;
    }

    return `<div class="yield-card">
      <div class="yield-card-header">
        <span class="yield-card-name">${escapeHtml(prop)}</span>
        <span class="yield-card-badge" style="background:${badgeColor}20;color:${badgeColor}">${netYield !== '-' ? t('rpt.netRentBadge', { pct: netYield }) : t('rpt.notFilledShort')}</span>
      </div>
      <div class="yield-section-title">${t('rpt.investmentSection')}</div>
      <div class="yield-row"><span>${t('rpt.purchasePrice')}</span><span style="font-weight:700">${purchasePrice>0?formatRpFull(purchasePrice):'<span style="color:var(--warning-dark)">' + escapeHtml(t('rpt.notFilledShort')) + '</span>'}</span></div>
      <div class="yield-section-title">${t('rpt.incomeSection')}</div>
      <div class="yield-row"><span>${t('rpt.actualRentMo', { n: occCount })}</span><span style="color:var(--success)">${formatRp(monthlyRent)}</span></div>
      <div class="yield-row"><span>${t('rpt.potentialRentMo', { n: pu.length })}</span><span>${formatRp(potentialRent)}</span></div>
      <div class="yield-row"><span>${t('rpt.actualIncomeYr')}</span><span style="color:var(--success);font-weight:700">${formatRp(yearIncome)}</span></div>
      <div class="yield-section-title">${t('rpt.expenseSection')}</div>
      ${fixedCosts > 0 ? `
        ${pd.pbb ? `<div class="yield-row sub"><span>${t('rpt.pbb')}</span><span>${formatRp(pd.pbb)}</span></div>` : ''}
        ${pd.maintenance ? `<div class="yield-row sub"><span>${t('expense.maintenance')}</span><span>${formatRp(pd.maintenance)}</span></div>` : ''}
        ${pd.insurance ? `<div class="yield-row sub"><span>${t('rpt.insurance')}</span><span>${formatRp(pd.insurance)}</span></div>` : ''}
        ${pd.otherExpense ? `<div class="yield-row sub"><span>${t('rpt.otherExpense')}</span><span>${formatRp(pd.otherExpense)}</span></div>` : ''}
      ` : ''}
      ${unitsCost > 0 ? `<div class="yield-row sub"><span>${t('rpt.unitCostsIpl')}</span><span>${formatRp(unitsCost)}</span></div>` : ''}
      ${recordedExpense > 0 ? `<div class="yield-row sub"><span>${t('rpt.opsRecorded')}</span><span>${formatRp(recordedExpense)}</span></div>` : ''}
      <div class="yield-row"><span>${t('rpt.totalExpenseYr')}</span><span style="color:var(--danger);font-weight:700">${formatRp(totalAnnualExpense)}</span></div>
      ${cicilanPerBulan > 0 ? `
        <div class="yield-section-title">${t('rpt.bankLoanSection')}</div>
        <div class="yield-row sub"><span>${t('rpt.installmentMo')}</span><span style="color:var(--danger)">${formatRp(cicilanPerBulan)}</span></div>
        <div class="yield-row sub"><span>${t('rpt.installmentYr')}</span><span style="color:var(--danger)">${formatRp(cicilanPerTahun)}</span></div>
        ${sisaTenor > 0 ? `<div class="yield-row sub"><span>${t('rpt.tenorRemain')}</span><span>${formatSisaTenorMonths(sisaTenor)}</span></div>` : ''}
        <div class="yield-row"><span>${t('rpt.totalPlusInstallmentYr')}</span><span style="color:var(--danger);font-weight:700">${formatRp(totalWithCicilan)}</span></div>
      ` : ''}
      <div class="yield-divider"></div>
      <div class="yield-section-title">${t('rpt.pillar1Yield')}</div>
      <div class="yield-row highlight"><span>${t('rpt.grossYieldRent')}</span><span style="font-weight:800">${grossYield !== '-' ? grossYield + '%' : '-'}</span></div>
      <div class="yield-row highlight"><span>${t('rpt.netYieldRent')}</span><span style="color:var(--primary);font-weight:800;font-size:16px">${netYield !== '-' ? netYield + '%' : '-'}</span></div>
      <div class="yield-row highlight"><span>${t('rpt.netYieldFullOcc')}</span><span style="color:${badgeColor};font-weight:800">${effectiveYield !== '-' ? effectiveYield + '%' : '-'}</span></div>
      <div class="yield-row"><span>${t('rpt.occupancy')}</span><span>${occRate}% (${occCount}/${pu.length})</span></div>
      <div class="yield-divider"></div>
      <div class="yield-row highlight"><span>${t('rpt.paybackPeriod')}</span><span style="font-weight:800;color:var(--primary)">${paybackLabel}</span></div>
      <div class="yield-row"><span>${t('rpt.netProfitYr')}</span><span style="color:${netAnnualProfit>=0?'var(--success)':'var(--danger)'};font-weight:700">${formatRp(netAnnualProfit)}</span></div>
      ${cicilanPerBulan > 0 ? `
        <div class="yield-divider"></div>
        <div class="yield-section-title">${t('rpt.cashflowAfterLoan')}</div>
        <div class="yield-row highlight"><span>${t('rpt.cashflowMo')}</span><span style="color:${monthlyCashflow>=0?'var(--success)':'var(--danger)'};font-weight:800;font-size:16px">${monthlyCashflow>=0?'+':''}${formatRp(monthlyCashflow)}</span></div>
        <div class="yield-row highlight"><span>${t('rpt.cashflowYr')}</span><span style="color:${cashflowAfterCicilan>=0?'var(--success)':'var(--danger)'};font-weight:700">${cashflowAfterCicilan>=0?'+':''}${formatRp(cashflowAfterCicilan)}</span></div>
        <div class="yield-row"><span>${t('rpt.status')}</span><span style="font-weight:700;color:${monthlyCashflow>=0?'var(--success)':'var(--danger)'}">${monthlyCashflow>=0?t('rpt.positiveLoan'):escapeHtml(t('rpt.negativeLoan', { amt: formatRp(Math.abs(monthlyCashflow)) }))}</span></div>
      ` : ''}
      <div style="margin-top:14px">
        <button class="btn btn-outline" onclick="showPropertySettings(${onclickStrArg(prop)})">${t('rpt.configureInvest')}</button>
      </div>
    </div>`;
  }).join('');

  if (props.length > 1) {
    compHtml += '</tbody></table></div></div>';
  }

  container.innerHTML = explanationToggleBtn() + compHtml + cardsHtml;
}

// ===== PROYEKSI (apresiasi + horizon) =====
function renderProyeksi() {
  const units = getUnits(), payments = getPayments();
  const props = [...new Set(units.map(u=>u.property))];
  const container = document.getElementById('proyeksi-content');

  if (!props.length) { container.innerHTML = emptyStateHTML('property'); return; }

  const capPct = getYieldAppreciationPct();
  const capYears = getYieldHorizonYears();
  const rentEscPct = getYieldRentEscalationPct();
  const capOverrideMap = getYieldCapOverrideMap();

  const framingHtml = '';

  const assumptionHtml = `<div class="card">
    <h3 class="card-title">${t('rpt.projAssumptions')}</h3>
    <div class="form-group">
      <label class="form-label">${t('rpt.assetGrowthYr')}</label>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="number" id="proj-cap-pct" step="0.5" min="-30" max="50" class="form-input" style="max-width:120px"
          value="${capPct}"
          onchange="DB.setVal('yield_cap_appreciation_pct', this.value); renderProyeksi()">
        <span style="font-weight:700;color:var(--primary)">${t('rpt.perYrPct')}</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('rpt.projectionHorizon')}</label>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="number" id="proj-horizon" step="1" min="1" max="30" class="form-input" style="max-width:120px"
          value="${capYears}"
          onchange="DB.setVal('yield_cap_horizon_years', this.value); renderProyeksi()">
        <span style="font-weight:700;color:var(--primary)">${t('rpt.yearsWord')}</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${t('rpt.rentProfitGrowthYr')}</label>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="number" id="proj-esc" step="0.5" min="-15" max="25" class="form-input" style="max-width:120px"
          value="${rentEscPct}"
          onchange="DB.setVal('yield_cap_rent_escalation_pct', this.value); renderProyeksi()">
        <span style="font-weight:700;color:var(--primary)">${t('rpt.perYrPct')}</span>
      </div>
    </div>
  </div>`;

  // Comparison table (multi-property)
  let compHtml = '';
  if (props.length > 1) {
    compHtml = `<div class="card"><h3 class="card-title">${t('rpt.projCompareTitle', { n: capYears })}</h3><p class="yield-cap-table-note">${t('rpt.projCompareHint')}</p><div class="yield-compare-table"><table class="compare-table"><thead><tr><th>${t('rpt.colProperty')}</th><th>${t('rpt.colNetYield')}</th><th>${t('rpt.colAppreciation')}</th><th>${t('rpt.colReturnYr')}</th><th>${t('rpt.colValueGain')}</th></tr></thead><tbody>`;
  }

  const cardsHtml = props.map(prop => {
    const pu = units.filter(u=>u.property===prop);
    const pd = getPropertyData(prop);
    const purchasePrice = pd.purchasePrice || 0;
    const fixedCosts = getPropertyAnnualCost(pd);
    const cicilanPerBulan = pd.cicilanPerBulan || 0;
    const cicilanPerTahun = cicilanPerBulan * 12;

    const occCount = pu.filter(u=>u.status==='occupied').length;
    const monthlyRent = pu.filter(u=>u.status==='occupied').reduce((s,u)=>s+getUnitMonthlyRent(u),0);
    const yearIncome = monthlyRent * 12;

    const cy = getYear();
    const recordedExpense = payments.filter(p=>p.propertyName===prop&&p.type==='expense'&&p.period.startsWith(cy)).reduce((s,p)=>s+p.amount,0);
    const unitsCost = getAllUnitsAnnualCost(pu);
    const totalAnnualExpense = fixedCosts + unitsCost + recordedExpense;
    const netAnnualProfit = yearIncome - totalAnnualExpense;

    const netYield = purchasePrice > 0 ? (((yearIncome - totalAnnualExpense) / purchasePrice) * 100).toFixed(2) : '-';

    const propCapEff = effectiveYieldCapPct(prop, capPct);
    const usesGlobalCap = !Object.prototype.hasOwnProperty.call(capOverrideMap, prop);
    const simpleSumPct = netYield !== '-' ? (parseFloat(netYield) + propCapEff).toFixed(2) : '-';

    // Comparison row
    if (props.length > 1) {
      const paperGain = purchasePrice > 0 ? Math.round(purchasePrice * (Math.pow(1 + propCapEff/100, capYears) - 1)) : null;
      compHtml += `<tr onclick="showPropertySettings(${onclickStrArg(prop)})">
        <td style="font-weight:700">${escapeHtml(prop)}</td>
        <td>${netYield !== '-' ? netYield+'%' : '-'}</td>
        <td>${propCapEff >= 0 ? '+' : ''}${propCapEff.toFixed(1)}%</td>
        <td style="font-weight:700;color:var(--primary)">${simpleSumPct !== '-' ? simpleSumPct+'%' : '-'}</td>
        <td>${paperGain !== null ? (paperGain >= 0 ? '+' : '') + formatRpFull(paperGain) : '-'}</td>
      </tr>`;
    }

    // Per-property projection card
    let capGainSection = '';
    if (purchasePrice > 0) {
      const netYNum = netYield !== '-' ? parseFloat(netYield) : null;
      const incomeYieldPct = netYNum;
      const fv = purchasePrice * Math.pow(1 + propCapEff / 100, capYears);
      const capGainAmt = Math.round(fv - purchasePrice);
      const cumRent = cumNetOperasionalOverYears(netAnnualProfit, capYears, rentEscPct);
      const combinedEst = capGainAmt + cumRent;

      const capOvInputVal = Object.prototype.hasOwnProperty.call(capOverrideMap, prop) ? String(capOverrideMap[prop]) : '';
      const capOvPh = escapeHtml(t('rpt.capOverridePh', { cap: capPct }));
      const rentEscLabel = rentEscPct === 0
        ? t('rpt.rentFlatEachYear')
        : t('rpt.rentUpEachYear', { p: (rentEscPct >= 0 ? '+' : '') + rentEscPct });

      capGainSection = `
      <div class="yield-row highlight"><span>${t('rpt.capGrowthYr')}</span><span style="font-weight:800;color:var(--text-secondary)">${propCapEff >= 0 ? '+' : ''}${propCapEff.toFixed(2)}%${usesGlobalCap ? '' : ' <span style="font-size:10px;color:var(--text-muted)">' + escapeHtml(t('rpt.customCapTag')) + '</span>'}</span></div>
      ${netYNum !== null ? `<div class="yield-row"><span>${t('rpt.estReturnYr')}</span><span style="font-weight:700;color:var(--primary)">${simpleSumPct}%</span></div>` : ''}
      <div class="form-group yield-cap-override">
        <label class="form-label">${t('rpt.capOverrideLabel')}</label>
        <input type="number" step="0.5" min="-30" max="50" class="form-input" placeholder="${capOvPh}"
          value="${capOvInputVal.replace(/"/g, '&quot;')}"
          onchange="setYieldCapOverrideFromYield(${onclickStrArg(prop)}, this.value)">
      </div>
      <div class="yield-divider"></div>
      <div class="yield-section-title">${t('rpt.projNYears', { n: capYears })}</div>
      <div class="yield-row"><span>${t('rpt.purchasePriceLower')}</span><span style="font-weight:700">${formatRpFull(purchasePrice)}</span></div>
      <div class="yield-row"><span>${t('rpt.estAssetValue')}</span><span style="font-weight:700">${formatRpFull(Math.round(fv))}</span></div>
      <div class="yield-row highlight"><span>${t('rpt.estValueGain')}</span><span style="color:${capGainAmt >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700">${capGainAmt >= 0 ? '+' : ''}${formatRpFull(capGainAmt)}</span></div>
      <div class="yield-row sub"><span>${t('rpt.cumRentNYears', { n: capYears, esc: rentEscLabel })}</span><span style="color:${cumRent >= 0 ? 'var(--success)' : 'var(--danger)'}">${cumRent >= 0 ? '+' : ''}${formatRpFull(cumRent)}</span></div>
      <div class="yield-row highlight"><span>${t('rpt.totalEstGain')}</span><span style="font-weight:800;font-size:15px;color:var(--primary)">${combinedEst >= 0 ? '+' : ''}${formatRpFull(combinedEst)}</span></div>
      <p class="yield-cap-micro">${t('rpt.projFootnote', { n: capYears })}</p>
      ${cicilanPerBulan > 0 ? `<p class="yield-cap-micro yield-cap-cicilan">${t('rpt.projHasKprNote')}</p>` : ''}`;
    } else {
      capGainSection = `
      <div class="form-group yield-cap-override">
        <label class="form-label">${t('rpt.capOverrideLabel')}</label>
        <input type="number" step="0.5" min="-30" max="50" class="form-input" placeholder="${escapeHtml(t('rpt.capOverridePhDefault', { cap: capPct }))}"
          value="${(Object.prototype.hasOwnProperty.call(capOverrideMap, prop) ? String(capOverrideMap[prop]) : '').replace(/"/g, '&quot;')}"
          onchange="setYieldCapOverrideFromYield(${onclickStrArg(prop)}, this.value)">
      </div>
      <p class="yield-cap-micro">${t('rpt.fillPurchaseHint')}</p>`;
    }

    return `<div class="yield-card">
      <div class="yield-card-header">
        <span class="yield-card-name">${escapeHtml(prop)}</span>
        <span class="yield-card-badge" style="background:var(--primary-10,#0d948820);color:var(--primary)">${t('rpt.horizonBadge', { n: capYears })}</span>
      </div>
      <div class="yield-section-title">${t('rpt.valueAppreciationTitle')}</div>
      ${capGainSection}
      <div style="margin-top:14px">
        <button class="btn btn-outline" onclick="showPropertySettings(${onclickStrArg(prop)})">${t('rpt.configureInvest')}</button>
      </div>
    </div>`;
  }).join('');

  if (props.length > 1) {
    compHtml += '</tbody></table></div></div>';
  }

  container.innerHTML = explanationToggleBtn() + framingHtml + assumptionHtml + compHtml + cardsHtml;
}

// ===== OCCUPANCY ANALYTICS =====
function renderAnalytics() {
  const units = getUnits(), tenants = getTenants(), tenantHistory = getTenantHistory();
  const container = document.getElementById('analytics-content');
  const props = [...new Set(units.map(u=>u.property))];

  if (!props.length) { container.innerHTML = '<p class="empty-state">' + t('yield.addPropsFirst') + '</p>'; return; }

  // Current occupancy per property
  let html = '<div class="card"><h3 class="card-title">' + escapeHtml(t('rpt.occupancyRateTitle')) + '</h3>';
  props.forEach(prop => {
    const pu = units.filter(u=>u.property===prop);
    const occ = pu.length>0 ? Math.round(pu.filter(u=>u.status==='occupied').length/pu.length*100) : 0;
    html += `<div class="analytics-bar-group"><div class="analytics-bar-label"><span>${escapeHtml(prop)}</span><span style="font-weight:800;color:${occ>=80?'var(--success)':occ>=50?'var(--warning-dark)':'var(--danger)'}">${occ}%</span></div>
      <div class="analytics-bar"><div class="analytics-bar-fill" style="width:${occ}%;background:${occ>=80?'var(--gradient-success)':occ>=50?'var(--gradient-warm)':'var(--gradient-danger)'}"></div></div></div>`;
  });
  html += '</div>';

  // Tren okupansi dari periode kontrak (sama logika dengan Laporan → Grafik)
  html += '<div class="card"><h3 class="card-title">' + escapeHtml(t('rpt.occupancyTrendTitle', { n: 6 })) + '</h3>';
  html += '<p class="yield-cap-micro" style="margin:-4px 0 12px">' + escapeHtml(t('rpt.occupancyTrendHint')) + '</p>';
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString(dateLocaleTag(), {month:'short'}), key: getMonthYear(d) });
  }
  const totalUnits = units.length || 1;
  months.forEach(m => {
    const occupiedCount = occupiedUnitsByLeasesAtMonth(units, tenants, tenantHistory, m.key);
    const rate = Math.min(Math.round((occupiedCount / totalUnits) * 100), 100);
    html += `<div class="analytics-bar-group"><div class="analytics-bar-label"><span>${m.label}</span><span>${rate}%</span></div>
      <div class="analytics-bar"><div class="analytics-bar-fill" style="width:${rate}%"></div></div></div>`;
  });
  html += '</div>';

  // Kontrak akan habis
  html += '<div class="card"><h3 class="card-title">' + escapeHtml(t('rpt.leaseExpiryTitle')) + '</h3>';
  const expiring = tenants.filter(t => {
    const d = daysUntil(t.endDate);
    return d >= -30 && d <= 90;
  }).sort((a,b) => new Date(a.endDate) - new Date(b.endDate));

  if (!expiring.length) html += '<p class="empty-state">' + t('yield.noExpiry') + '</p>';
  else {
    expiring.forEach(tenant => {
      const unit = units.find(u=>u.id===tenant.unitId);
      const d = daysUntil(tenant.endDate);
      const status = d < 0 ? t('rpt.expiredStatus') : t('rpt.daysLeft', { d });
      const color = d < 0 ? 'var(--danger)' : d <= 30 ? 'var(--warning-dark)' : 'var(--text-secondary)';
      html += `<div class="due-item"><div class="due-info"><span class="due-name">${escapeHtml(tenant.name)}</span>
        <span class="due-detail">${unit?escapeHtml(unit.property+' — '+unit.name):'-'}</span></div>
        <span style="font-size:13px;font-weight:700;color:${color}">${escapeHtml(status)}</span></div>`;
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

  if (!props.length) { container.innerHTML = '<p class="empty-state">' + t('yield.noProps') + '</p>'; return; }

  const cm = getMonthYear();
  container.innerHTML = props.map(prop => {
    const pu = units.filter(u=>u.property===prop);
    const pd = getPropertyData(prop);
    const purchasePrice = pd.purchasePrice || 0;
    const fixedCosts = getPropertyAnnualCost(pd);
    const occCount = pu.filter(u=>u.status==='occupied').length;
    const vacCount = pu.length - occCount;
    const occRate = pu.length>0 ? Math.round(occCount/pu.length*100) : 0;
    const monthInc = payments.filter(p => p.propertyName === prop && paymentMatchesCalendarMonth(p, cm) && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const monthExp = payments.filter(p => p.propertyName === prop && paymentMatchesCalendarMonth(p, cm) && p.type === 'expense').reduce((s, p) => s + p.amount, 0);
    const net = monthInc - monthExp;
    const potentialRent = pu.reduce((s,u)=>s+getUnitMonthlyRent(u),0);
    const monthlyRent = pu.filter(u=>u.status==='occupied').reduce((s,u)=>s+getUnitMonthlyRent(u),0);
    const yearIncome = monthlyRent * 12;
    const cy = getYear();
    const recordedExpense = payments.filter(p=>p.propertyName===prop&&p.type==='expense'&&p.period.startsWith(cy)).reduce((s,p)=>s+p.amount,0);
    const unitsCostMulti = getAllUnitsAnnualCost(pu);
    const totalAnnualExpense = fixedCosts + unitsCostMulti + recordedExpense;
    const netYield = purchasePrice > 0 ? (((yearIncome - totalAnnualExpense) / purchasePrice) * 100).toFixed(1) : '-';
    const netProfit = yearIncome - totalAnnualExpense;
    const paybackYears = purchasePrice > 0 && netProfit > 0 ? (purchasePrice / netProfit).toFixed(1) : '-';
    const paybackLabel = formatPaybackLabel(paybackYears);
    const propTenants = tenants.filter(t => pu.some(u=>u.id===t.unitId));
    const overdueCount = payments.filter(p =>
      p.propertyName === prop && p.status === 'overdue' && isActionableDueForDashboard(p, tenants)).length;
    const type = pu[0]?.type || 'kos';
    const icons = { kos:'🏠', apartemen:'🏢', rumah:'🏡', ruko:'🏪', kantor:'🏛' };
    const typeTk = 'form.type.' + type;
    let typeLabel = t(typeTk);
    if (typeLabel === typeTk) typeLabel = type;

    return `<div class="mp-card" onclick="showPropertySettings(${onclickStrArg(prop)})">
      <div class="mp-card-header">
        <span class="mp-card-name">${icons[type]||'🏠'} ${escapeHtml(prop)}</span>
        <span class="mp-card-type">${escapeHtml(typeLabel)} · ${t('rpt.nUnits', { n: pu.length })}</span>
      </div>
      <div class="mp-stats">
        <div class="mp-stat"><span class="mp-stat-value" style="color:${occRate>=80?'var(--success)':occRate>=50?'var(--warning-dark)':'var(--danger)'}">${occRate}%</span><span class="mp-stat-label">${t('rpt.occupancy')}</span></div>
        <div class="mp-stat"><span class="mp-stat-value" style="color:var(--success)">${formatRp(monthInc)}</span><span class="mp-stat-label">${t('rpt.incomePerMo')}</span></div>
        <div class="mp-stat"><span class="mp-stat-value" style="color:${net>=0?'var(--success)':'var(--danger)'}">${formatRp(net)}</span><span class="mp-stat-label">${t('rpt.netPerMo')}</span></div>
      </div>
      <div class="mp-yield-row">
        <div class="mp-yield-item"><span class="mp-yield-label">${t('rpt.rentalYield')}</span><span class="mp-yield-value" style="color:var(--primary)">${netYield !== '-' ? netYield + '%' : '-'}</span></div>
        <div class="mp-yield-item"><span class="mp-yield-label">${t('rpt.payback')}</span><span class="mp-yield-value">${paybackLabel}</span></div>
        <div class="mp-yield-item"><span class="mp-yield-label">${t('rpt.investasiShort')}</span><span class="mp-yield-value">${purchasePrice > 0 ? formatRp(purchasePrice) : '-'}</span></div>
      </div>
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--text-secondary)">
        <span>${t('rpt.potentialPerMo', { v: formatRp(potentialRent) })}</span>
        <span>${t('rpt.tenantsCount', { n: propTenants.length })}</span>
        <span>${t('rpt.vacantCount', { n: vacCount })}</span>
        ${overdueCount?`<span style="color:var(--danger)">${t('rpt.overdueCount', { n: overdueCount })}</span>`:''}
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
      <h3 class="card-title">${escapeHtml(t('kpr.title'))}</h3>
      <small style="color:var(--text-muted);display:block;margin-bottom:16px">${escapeHtml(t('kpr.subtitle'))}</small>

      ${props.length > 0 ? `<div class="form-group"><label class="form-label">${escapeHtml(t('kpr.selectProperty'))}</label>
        <select class="form-select" id="kpr-property" onchange="kprSelectProperty(this.value)">
          <option value="">${escapeHtml(t('kpr.customManual'))}</option>
          ${props.map(p => {
            const pd = getPropertyData(p);
            return `<option value="${escapeHtml(p)}" ${d.selectedProperty === p ? 'selected' : ''}>${escapeHtml(p)}${pd.purchasePrice ? ' — ' + formatRp(pd.purchasePrice) : ''}</option>`;
          }).join('')}
        </select></div>` : ''}

      <div class="kpr-section-title">${escapeHtml(t('kpr.priceDp'))}</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.propertyPrice'))}</label><input type="text" inputmode="numeric" data-rp id="kpr-harga" value="${formatNumDots(d.hargaProperti)}" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.dpPct'))}</label><input type="number" id="kpr-dp" value="${d.dp}" step="5" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.tenorYears'))}</label><input type="number" id="kpr-tenor" value="${d.tenor}" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.rateSection'))}</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.fixedRate'))}</label><input type="number" id="kpr-fixed-rate" value="${d.fixedRate}" step="0.1" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.fixedPeriodYr'))}</label><input type="number" id="kpr-fixed-years" value="${d.fixedYears}" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.floatingRate'))}</label><input type="number" id="kpr-floating-rate" value="${d.floatingRate}" step="0.1" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.closingCosts'))}</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.provisi'))}</label><input type="number" id="kpr-provisi" value="${d.provisi}" step="0.1" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.admin'))}</label><input type="text" inputmode="numeric" data-rp id="kpr-admin" value="${formatNumDots(d.adminFee)}" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.appraisal'))}</label><input type="text" inputmode="numeric" data-rp id="kpr-appraisal" value="${formatNumDots(d.appraisal)}" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.notarisPct'))}</label><input type="number" id="kpr-notaris" value="${d.notaris}" step="0.1" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.bphtb'))}</label><input type="number" id="kpr-bphtb" value="${d.bphtbRate}" step="0.5" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.njoptkp'))}</label><input type="text" inputmode="numeric" data-rp id="kpr-njoptkp" value="${formatNumDots(d.njoptkp)}" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.insuranceSection'))}</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.lifeIns'))}</label><input type="number" id="kpr-as-jiwa" value="${d.asuransiJiwa}" step="0.01" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.fireIns'))}</label><input type="number" id="kpr-as-kebakaran" value="${d.asuransiKebakaran}" step="0.01" oninput="calcKPR()"></div>
      </div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.rentEscalationSection'))}</div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.rentNow'))}</label><input type="text" inputmode="numeric" data-rp id="kpr-sewa-awal" value="${formatNumDots(d.sewaAwal)}" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.rentStepYears'))}</label><input type="number" id="kpr-rent-freq" value="${d.rentFreq}" min="1" max="5" oninput="calcKPR()"></div>
      </div>
      <div class="kpr-row">
        <div class="kpr-field"><label>${escapeHtml(t('kpr.scenarioLow'))}</label><input type="number" id="kpr-rent-low" value="${d.rentConservative}" step="0.5" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.scenarioMid'))}</label><input type="number" id="kpr-rent-mid" value="${d.rentModerate}" step="0.5" oninput="calcKPR()"></div>
        <div class="kpr-field"><label>${escapeHtml(t('kpr.scenarioHigh'))}</label><input type="number" id="kpr-rent-high" value="${d.rentOptimistic}" step="0.5" oninput="calcKPR()"></div>
      </div>
      <small style="color:var(--text-muted);display:block;margin-top:4px;padding:0 4px">${escapeHtml(t('kpr.rentStepHint'))}</small>
    </div>

    <div id="kpr-results"></div>
  `;

  setTimeout(() => {
    initRpInputs(document.getElementById('kpr-content'));
    // If a property was previously selected, restore the unit breakdown
    if (d.selectedProperty) {
      const selUnits = getUnits().filter(u => u.property === d.selectedProperty);
      const selPd = getPropertyData(d.selectedProperty);
      renderKPRUnitBreakdown(d.selectedProperty, selUnits, selPd);
    }
  }, 50);
  calcKPR();
}

function kprSelectProperty(propName) {
  if (!propName) {
    _kprState = { ..._kprState, selectedProperty: '' };
    const el = document.getElementById('kpr-unit-breakdown');
    if (el) el.innerHTML = '';
    calcKPR();
    return;
  }
  const pd = getPropertyData(propName);
  const propUnits = getUnits().filter(u => u.property === propName);
  const potentialRent = propUnits.reduce((s, u) => s + getUnitMonthlyRent(u), 0);
  const unitsCost = getAllUnitsAnnualCost(propUnits);
  const propCost = getPropertyAnnualCost(pd);

  // Auto-fill from real data
  if (pd.purchasePrice) document.getElementById('kpr-harga').value = formatNumDots(pd.purchasePrice);
  if (potentialRent > 0) document.getElementById('kpr-sewa-awal').value = formatNumDots(potentialRent);

  // Fill existing cicilan if property has KPR data
  if (pd.cicilanPerBulan && pd.sisaTenor) {
    document.getElementById('kpr-tenor').value = Math.ceil(pd.sisaTenor / 12) || 20;
  }

  _kprState = { ..._kprState, selectedProperty: propName };

  // Show auto-fill summary
  const parts = [];
  if (pd.purchasePrice) parts.push(t('kpr.partPurchase'));
  if (potentialRent > 0) parts.push(t('kpr.partRentUnits', { rent: formatRp(potentialRent), n: propUnits.length }));
  if (parts.length) showToast(t('msg.propPrefill', { name: propName, parts: parts.join(', ') }), 'info', 3000);

  // Render unit breakdown under the property selector
  renderKPRUnitBreakdown(propName, propUnits, pd);

  calcKPR();
}

function renderKPRUnitBreakdown(propName, units, pd) {
  let el = document.getElementById('kpr-unit-breakdown');
  if (!el) {
    const select = document.getElementById('kpr-property');
    if (!select) return;
    el = document.createElement('div');
    el.id = 'kpr-unit-breakdown';
    select.parentNode.after(el);
  }

  if (!units.length) { el.innerHTML = ''; return; }

  const occupiedUnits = units.filter(u => u.status === 'occupied');
  const vacantUnits = units.filter(u => u.status === 'vacant');
  const totalMonthlyRent = units.reduce((s, u) => s + getUnitMonthlyRent(u), 0);
  const actualMonthlyRent = occupiedUnits.reduce((s, u) => s + getUnitMonthlyRent(u), 0);
  const totalMonthlyCost = units.reduce((s, u) => s + getUnitMonthlyCost(u), 0);
  const propMonthlyCost = (getPropertyAnnualCost(pd)) / 12;

  el.innerHTML = `
    <div style="background:var(--bg);border-radius:var(--radius-xs);padding:14px;margin-top:12px;margin-bottom:12px;border-left:4px solid var(--primary)">
      <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">${escapeHtml(t('kpr.realDataTitle', { name: propName }))}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
        <div style="background:var(--bg-card);padding:8px 10px;border-radius:8px;text-align:center">
          <div style="font-size:16px;font-weight:800;color:var(--success)">${formatRp(actualMonthlyRent)}</div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:600">${escapeHtml(t('kpr.sewaAktualBln'))}</div>
        </div>
        <div style="background:var(--bg-card);padding:8px 10px;border-radius:8px;text-align:center">
          <div style="font-size:16px;font-weight:800;color:var(--primary)">${formatRp(totalMonthlyRent)}</div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:600">${escapeHtml(t('kpr.potensiBln'))}</div>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">${escapeHtml(t('kpr.detailPerUnit'))}</div>
      ${units.map(u => {
        const rent = getUnitMonthlyRent(u);
        const cost = getUnitMonthlyCost(u);
        const isOcc = u.status === 'occupied';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px">
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${isOcc ? 'var(--success)' : 'var(--text-muted)'};flex-shrink:0"></span>
            <span style="font-weight:600;color:var(--text)">${escapeHtml(u.name)}</span>
          </span>
          <span>
            <span style="font-weight:700;color:${isOcc ? 'var(--success)' : 'var(--text-muted)'}">${formatRp(rent)}${escapeHtml(t('kpr.perMoSuffix'))}</span>
            ${cost > 0 ? `<span style="color:var(--danger);font-size:11px;margin-left:4px">-${formatRp(cost)}</span>` : ''}
          </span>
        </div>`;
      }).join('')}
      ${(totalMonthlyCost > 0 || propMonthlyCost > 0) ? `
        <div style="margin-top:8px;padding-top:6px;border-top:1px solid var(--border)">
          ${totalMonthlyCost > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--danger);padding:2px 0"><span>${escapeHtml(t('kpr.unitCostMo'))}</span><span style="font-weight:700">-${formatRp(Math.round(totalMonthlyCost))}</span></div>` : ''}
          ${propMonthlyCost > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--danger);padding:2px 0"><span>${escapeHtml(t('kpr.propCostMo'))}</span><span style="font-weight:700">-${formatRp(Math.round(propMonthlyCost))}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:800;padding:4px 0;color:${(actualMonthlyRent - totalMonthlyCost - propMonthlyCost) >= 0 ? 'var(--success)' : 'var(--danger)'}">
            <span>${escapeHtml(t('kpr.netActualMo'))}</span><span>${formatRp(Math.round(actualMonthlyRent - totalMonthlyCost - propMonthlyCost))}</span>
          </div>
        </div>` : ''}
      <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
        ${t('kpr.occSummary', { occ: occupiedUnits.length, total: units.length, pct: units.length > 0 ? Math.round(occupiedUnits.length/units.length*100) : 0 })}
      </div>
    </div>`;
}

function calcKPR() {
  const v = id => { const el = document.getElementById(id); return el && el.hasAttribute('data-rp') ? parseNum(el.value) : Number(el?.value || 0); };

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

  const kprOut = document.getElementById('kpr-results');
  if (harga <= 0 || tenor <= 0) {
    if (kprOut) kprOut.innerHTML = '';
    return;
  }

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
    const monthlyRent = units.filter(u => u.status === 'occupied').reduce((s, u) => s + getUnitMonthlyRent(u), 0);
    const potentialRent = units.reduce((s, u) => s + getUnitMonthlyRent(u), 0);
    const totalMonthlyOut = monthlyFixed + monthlyInsurance;
    const cashflowFixed = monthlyRent - totalMonthlyOut;
    const totalMonthlyOutFloat = monthlyFloating + monthlyInsurance;
    const cashflowFloating = monthlyRent - totalMonthlyOutFloat;

    overlayHtml = `
      <div class="card kpr-overlay-card">
        <h3 class="card-title">${escapeHtml(t('kpr.overlayTitle', { name: selectedProp }))}</h3>
        <div class="yield-row"><span>${escapeHtml(t('kpr.actualRentMo'))}</span><span style="color:var(--success);font-weight:700">${formatRp(monthlyRent)}</span></div>
        <div class="yield-row"><span>${escapeHtml(t('kpr.potentialRentMo'))}</span><span>${formatRp(potentialRent)}</span></div>
        <div class="yield-divider"></div>
        <div class="yield-row"><span>${escapeHtml(t('kpr.fixedPlusInsMo'))}</span><span style="color:var(--danger)">${formatRp(Math.round(totalMonthlyOut))}</span></div>
        <div class="yield-row highlight"><span>${escapeHtml(t('kpr.cashflowFixed'))}</span><span style="color:${cashflowFixed>=0?'var(--success)':'var(--danger)'};font-weight:800;font-size:16px">${cashflowFixed>=0?'+':''}${formatRp(Math.round(cashflowFixed))}${escapeHtml(t('kpr.perMoSuffix'))}</span></div>
        ${floatingMonths > 0 ? `
          <div class="yield-divider"></div>
          <div class="yield-row"><span>${escapeHtml(t('kpr.floatPlusInsMo'))}</span><span style="color:var(--danger)">${formatRp(Math.round(totalMonthlyOutFloat))}</span></div>
          <div class="yield-row highlight"><span>${escapeHtml(t('kpr.cashflowFloat'))}</span><span style="color:${cashflowFloating>=0?'var(--success)':'var(--danger)'};font-weight:800;font-size:16px">${cashflowFloating>=0?'+':''}${formatRp(Math.round(cashflowFloating))}${escapeHtml(t('kpr.perMoSuffix'))}</span></div>
        ` : ''}
        <div class="yield-divider"></div>
        <div class="yield-row"><span>${escapeHtml(t('kpr.verdict'))}</span><span style="font-weight:800;color:${cashflowFixed>=0?'var(--success)':'var(--danger)'}">${cashflowFixed>=0?escapeHtml(t('kpr.coversLoan')):escapeHtml(t('kpr.needTopup', { amt: formatRp(Math.abs(Math.round(cashflowFixed))) }))}</span></div>
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
      ${escapeHtml(t('kpr.amortTitle'))} <span style="font-size:12px;color:var(--text-muted)">${escapeHtml(t('kpr.tapToggle'))}</span>
    </h3>
    <div id="amort-table" class="collapsed">
      <div class="yield-compare-table"><table class="compare-table amort">
        <thead><tr><th>${escapeHtml(t('kpr.amortColYr'))}</th><th>${escapeHtml(t('kpr.amortColRate'))}</th><th>${escapeHtml(t('kpr.amortColInstMo'))}</th><th>${escapeHtml(t('kpr.amortColPrinYr'))}</th><th>${escapeHtml(t('kpr.amortColIntYr'))}</th><th>${escapeHtml(t('kpr.amortColBal'))}</th></tr></thead>
        <tbody>${amortRows.map(r => `<tr class="${r.isFixed?'':'amort-floating'}">
          <td>${r.yr}</td><td>${r.rate}%${r.isFixed?' ★':''}</td><td>${formatRp(r.monthly)}</td>
          <td>${formatRp(r.principal)}</td><td style="color:var(--danger)">${formatRp(r.interest)}</td>
          <td style="font-weight:700">${formatRp(r.balance)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">${escapeHtml(t('kpr.amortFixedStar'))}</div>
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
      { label: t('kpr.scenarioConservative'), pct: rentLow, color: '#d97706', icon: '🐢' },
      { label: t('kpr.scenarioModerate'), pct: rentMid, color: '#0d9488', icon: '📊' },
      { label: t('kpr.scenarioOptimistic'), pct: rentHigh, color: '#7c3aed', icon: '🚀' }
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
        <div style="font-weight:800;font-size:13px;color:${p.color};margin-bottom:8px">${p.icon} ${escapeHtml(p.label)} ${escapeHtml(t('kpr.pctPerNYears', { pct: p.pct, n: rentFreq }))}</div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.rentStart'))}</span><span>${formatRp(sewaAwal)}${escapeHtml(t('kpr.perMoSuffix'))}</span></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.rentYearN', { n: tenor }))}</span><span style="font-weight:700;color:var(--success)">${formatRp(p.finalRent)}${escapeHtml(t('kpr.perMoSuffix'))}</span></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.totalIncrease'))}</span><span style="font-weight:700">${((p.finalRent / sewaAwal - 1) * 100).toFixed(0)}%</span></div>
        <div class="yield-divider"></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.totalRentNYears', { n: tenor }))}</span><span style="color:var(--success);font-weight:700">${formatRp(p.totalRent)}</span></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.totalInstallIns'))}</span><span style="color:var(--danger);font-weight:700">${formatRp(p.totalCicilan)}</span></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.initialOutlay'))}</span><span style="color:var(--danger);font-weight:700">${formatRp(Math.round(totalOneTime))}</span></div>
        <div class="yield-row highlight"><span>${escapeHtml(t('kpr.netCumulative'))}</span><span style="font-weight:800;font-size:15px;color:${netCum>=0?'var(--success)':'var(--danger)'}">${netCum>=0?'+':''}${formatRp(netCum)}</span></div>
        <div class="yield-divider"></div>
        <div class="yield-divider"></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.cfPositive'))}</span><span style="font-weight:700;color:${p.color}">${p.cashflowBreakeven ? escapeHtml(t('kpr.yearReached', { n: p.cashflowBreakeven })) : escapeHtml(t('kpr.notReached'))}</span></div>
        <div class="yield-row sub"><span>${escapeHtml(t('kpr.roiDp'))}</span><span style="font-weight:700;color:${p.color}">${p.investBreakeven ? escapeHtml(t('kpr.yearReached', { n: p.investBreakeven })) : escapeHtml(t('kpr.notWithinYears', { n: tenor }))}</span></div>
        <div class="yield-row highlight"><span>${escapeHtml(t('kpr.paidOffTotal'))}</span><span style="font-weight:800;font-size:14px;color:${p.color}">${p.fullPaybackYear ? escapeHtml(t('kpr.yearReached', { n: p.fullPaybackYear })) : escapeHtml(t('kpr.notWithinYears', { n: tenor }))}</span></div>
        <small style="color:var(--text-muted);font-size:10px;display:block;margin-top:4px">${escapeHtml(t('kpr.paidOffHint', { amt: formatRp(Math.round(totalCostOwnership)) }))}</small>
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
        <span style="width:32px;text-align:right;color:var(--text-muted)">${escapeHtml(t('kpr.yearLabel', { n: r.yr }))}</span>
        <div style="flex:1;height:14px;background:var(--border);border-radius:7px;overflow:hidden;position:relative">
          <div style="width:${Math.min(pct,100)}%;height:100%;background:${isPositive?'var(--success)':'var(--danger)'};border-radius:7px;transition:width 0.3s"></div>
        </div>
        <span style="width:80px;font-weight:700;font-size:10px;color:${isPositive?'var(--success)':'var(--danger)'}">${isPositive?'+':''}${formatRp(r.cumNetCashflow)}</span>
      </div>`;
    }).join('');

    const rentStepHint = rentFreq === 1 ? t('kpr.rentEveryYear') : t('kpr.rentEveryNYears', { n: rentFreq });
    rentProjectionHtml = `
      <div class="card">
        <h3 class="card-title">${escapeHtml(t('kpr.rentVsMortgageTitle'))}</h3>
        <small style="color:var(--text-muted);display:block;margin-bottom:16px">${escapeHtml(t('kpr.rentStepSummary', { hint: rentStepHint }))}</small>
        <div class="rent-scenarios">${summaryCards}</div>
      </div>

      <div class="card">
        <h3 class="card-title">${escapeHtml(t('kpr.paybackModerateTitle', { pct: rentMid }))}</h3>
        <small style="color:var(--text-muted);display:block;margin-bottom:12px">${escapeHtml(t('kpr.paybackBarHint'))}</small>
        ${barChart}
      </div>

      <div class="card">
        <h3 class="card-title" onclick="document.getElementById('rent-detail-table').classList.toggle('collapsed')" style="cursor:pointer">
          ${escapeHtml(t('kpr.detailPerYear'))} <span style="font-size:12px;color:var(--text-muted)">${escapeHtml(t('kpr.tapOpenClose'))}</span>
        </h3>
        <div id="rent-detail-table" class="collapsed">
          <div class="yield-compare-table"><table class="compare-table amort">
            <thead><tr>
              <th>${escapeHtml(t('kpr.thYear'))}</th><th>${escapeHtml(t('kpr.thInstMo'))}</th>
              <th style="color:#d97706">${escapeHtml(t('kpr.thCon'))}</th>
              <th style="color:#0d9488">${escapeHtml(t('kpr.thMod'))}</th>
              <th style="color:#7c3aed">${escapeHtml(t('kpr.thOpt'))}</th>
              <th>${escapeHtml(t('kpr.thCfMod'))}</th>
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
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">${escapeHtml(t('kpr.savePrompt'))}</p>
      <button class="btn btn-primary" onclick="saveKPRToProperty(${onclickStrArg(selectedProp)}, ${Math.round(monthlyFixed)}, ${totalMonths})">
        ${escapeHtml(t('kpr.saveBtn', { name: selectedProp }))}
      </button>
      <small style="display:block;margin-top:8px;color:var(--text-muted)">${escapeHtml(t('kpr.saveHint', { cicilan: formatRpFull(Math.round(monthlyFixed)), n: totalMonths }))}</small>
    </div>`;
  }

  // Render results
  const mult = (totalCostOwnership/harga).toFixed(1);
  const tipRentEnd = sewaAwal > 0 ? t('kpr.tipRentEnd', {
    mid: rentMid,
    freq: rentFreq,
    rent: formatRp(Math.round(sewaAwal * Math.pow(1 + rentMid/100, Math.floor(tenor/rentFreq))))
  }) : '';
  if (!kprOut) return;
  kprOut.innerHTML = `
    <div class="card">
      <h3 class="card-title">${escapeHtml(t('kpr.resultsTitle'))}</h3>

      <div class="kpr-section-title">${escapeHtml(t('kpr.loanSection'))}</div>
      <div class="yield-row"><span>${escapeHtml(t('kpr.propertyPrice'))}</span><span style="font-weight:700">${formatRpFull(harga)}</span></div>
      <div class="yield-row"><span>${escapeHtml(t('kpr.dpWithPct', { pct: dpPct }))}</span><span>${formatRpFull(Math.round(dpAmount))}</span></div>
      <div class="yield-row highlight"><span>${escapeHtml(t('kpr.loanAmount'))}</span><span style="font-weight:800;color:var(--primary)">${formatRpFull(Math.round(loanAmount))}</span></div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.monthlySection'))}</div>
      <div class="yield-row highlight"><span>${escapeHtml(t('kpr.fixedPeriod', { y: fixedYears, rate: fixedRate }))}</span><span style="font-weight:800;font-size:16px;color:var(--danger)">${formatRpFull(Math.round(monthlyFixed))}</span></div>
      ${floatingMonths > 0 ? `<div class="yield-row highlight"><span>${escapeHtml(t('kpr.floatPeriod', { y: tenor - fixedYears, rate: floatingRate }))}</span><span style="font-weight:800;font-size:16px;color:var(--danger)">${formatRpFull(Math.round(monthlyFloating))}</span></div>` : ''}
      <div class="yield-row"><span>${escapeHtml(t('kpr.insuranceMo'))}</span><span>${formatRp(monthlyInsurance)}</span></div>
      <div class="yield-row highlight"><span>${escapeHtml(t('kpr.totalPayMoFixed'))}</span><span style="font-weight:800;color:var(--danger)">${formatRpFull(Math.round(monthlyFixed + monthlyInsurance))}</span></div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.closingPayNow'))}</div>
      <div class="yield-row sub"><span>${escapeHtml(t('kpr.dp'))}</span><span>${formatRp(Math.round(dpAmount))}</span></div>
      <div class="yield-row sub"><span>${escapeHtml(t('kpr.provisiWithPct', { pct: provisiPct }))}</span><span>${formatRp(Math.round(provisiAmount))}</span></div>
      <div class="yield-row sub"><span>${escapeHtml(t('kpr.adminShort'))}</span><span>${formatRp(adminFee)}</span></div>
      <div class="yield-row sub"><span>${escapeHtml(t('kpr.appraisal'))}</span><span>${formatRp(appraisal)}</span></div>
      <div class="yield-row sub"><span>${escapeHtml(t('kpr.notarisFee', { pct: notarisPct }))}</span><span>${formatRp(Math.round(notarisAmount))}</span></div>
      <div class="yield-row sub"><span>${escapeHtml(t('kpr.bphtbFee', { pct: bphtbPct }))}</span><span>${formatRp(Math.round(bphtbAmount))}</span></div>
      <div class="yield-row highlight"><span>${escapeHtml(t('kpr.totalUpfront'))}</span><span style="font-weight:800;color:var(--danger)">${formatRpFull(Math.round(totalOneTime))}</span></div>

      <div class="kpr-section-title">${escapeHtml(t('kpr.summaryTotal'))}</div>
      <div class="yield-row"><span>${escapeHtml(t('kpr.totalInstallments', { n: tenor }))}</span><span>${formatRpFull(Math.round(totalPaid))}</span></div>
      <div class="yield-row"><span>${escapeHtml(t('kpr.totalInterestPaid'))}</span><span style="color:var(--danger)">${formatRpFull(Math.round(totalInterest))}</span></div>
      <div class="yield-row"><span>${escapeHtml(t('kpr.totalInsuranceNYears', { n: tenor }))}</span><span>${formatRp(Math.round(totalInsurancePerYear * tenor))}</span></div>
      <div class="yield-divider"></div>
      <div class="yield-row highlight"><span>${escapeHtml(t('kpr.totalCostOwnership'))}</span><span style="font-weight:800;font-size:16px;color:var(--primary)">${formatRpFull(Math.round(totalCostOwnership))}</span></div>
      <div class="yield-row"><span>${escapeHtml(t('kpr.vsPropertyPrice'))}</span><span style="color:var(--danger);font-weight:700">${(totalCostOwnership/harga*100).toFixed(0)}% (${mult}×)</span></div>
    </div>

    ${amortHtml}
    ${overlayHtml}
    ${rentProjectionHtml}
    ${saveBtn}

    <div class="card">
      <h3 class="card-title">${escapeHtml(t('kpr.tipsTitle'))}</h3>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.7">
        <p>${escapeHtml(t('kpr.tip1'))}</p>
        <p>${escapeHtml(t('kpr.tip2'))}</p>
        <p>${escapeHtml(t('kpr.tip3'))}</p>
        <p>${escapeHtml(t('kpr.tip4', { mult }))}</p>
        ${sewaAwal > 0 ? `<p>${escapeHtml(tipRentEnd)}</p>` : ''}
      </div>
    </div>
  `;
}

function saveKPRToProperty(propName, cicilanPerBulan, sisaTenor) {
  let props = getProperties();
  let prop = props.find(p => p.name === propName);
  if (!prop) {
    getOrCreateProperty(propName);
    props = getProperties();
    prop = props.find(p => p.name === propName);
  }
  if (!prop) {
    alert(t('msg.saveKprFail'));
    return;
  }
  prop.cicilanPerBulan = cicilanPerBulan;
  prop.sisaTenor = sisaTenor;
  saveProperties(props);
  alert(t('msg.saveKprOk', { cicilan: formatRpFull(cicilanPerBulan), mo: t('period.mo'), n: sisaTenor, name: propName }));
}

// ===== PROPERTY SETTINGS FORM =====
function showPropertySettings(propName) {
  const pd = getPropertyData(propName);
  const units = getUnits();
  const subtypes = [...new Set(units.filter(u => u.property === propName && u.subtype).map(u => u.subtype))];

  let subtypeHtml = '';
  if (subtypes.length > 0) {
    subtypeHtml = `<div class="form-group"><label class="form-label">${t('form.subtype')}</label>
      <div class="subtype-manage-list">
        ${subtypes.map(s => {
          const tpl = getSubtypeTemplate(propName, s);
          const facCount = tpl?.facilities ? tpl.facilities.split(',').filter(Boolean).length : 0;
          const tplInfo = tpl ? t('prop.subtypeTpl', { price: formatRp(tpl.price), mo: t('period.mo'), n: facCount }) : t('prop.noTemplate');
          return `<div class="subtype-manage-item">
          <div class="subtype-manage-info">
            <span class="subtype-manage-name">${escapeHtml(s)}</span>
            <span class="subtype-manage-detail">${escapeHtml(tplInfo)}</span>
          </div>
          <div class="subtype-manage-actions">
            <button type="button" class="subtype-btn rename" onclick="renameSubtype(${onclickStrArg(propName)}, ${onclickStrArg(s)})" title="${escapeHtml(t('prop.renameSubtypeTitle'))}">✏️</button>
            <button type="button" class="subtype-btn delete" onclick="deleteSubtype(${onclickStrArg(propName)}, ${onclickStrArg(s)})" title="${escapeHtml(t('prop.deleteSubtypeTitle'))}">🗑️</button>
          </div>
        </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  openModal(t('prop.settingsTitle', { name: propName }), `
    <form onsubmit="savePropertySettings(event, ${onclickStrArg(propName)})">
      <div class="form-group"><label class="form-label">${t('form.propName')}</label>
        <input class="form-input" name="propName" value="${propName}" required>
        <small style="color:var(--text-muted);font-size:12px">${t('prop.renameHint')}</small></div>
      ${subtypeHtml}
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">${t('form.ownerName')}</label>
        <input class="form-input" name="ownerName" value="${pd.ownerName||''}" placeholder="${t('form.ownerNamePh')}"></div>
      <div class="form-group"><label class="form-label">${t('form.ownerAddr')}</label>
        <input class="form-input" name="ownerAddress" value="${pd.ownerAddress||''}" placeholder="${t('form.ownerAddrPh')}"></div>
      <div class="form-group"><label class="form-label">${t('form.ownerKtp')}</label>
        <input class="form-input" name="ownerKTP" value="${pd.ownerKTP||''}" placeholder="${t('form.ownerKtpPh')}"></div>
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">${t('form.purchasePrice')}</label>
        <input class="form-input" name="purchasePrice" type="text" inputmode="numeric" data-rp placeholder="500.000.000" value="${pd.purchasePrice ? formatNumDots(pd.purchasePrice) : ''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.purchaseHint')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.pbbYr')}</label>
        <input class="form-input" name="pbb" type="text" inputmode="numeric" data-rp placeholder="2.000.000" value="${pd.pbb ? formatNumDots(pd.pbb) : ''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.pbbHint')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.pbbDue')}</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <select class="form-select" name="pbbDueMonth" style="flex:1;min-width:120px">
            <option value="">${t('form.monthDash')}</option>
            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}" ${Number(pd.pbbDueMonth)===m?'selected':''}>${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][m-1]}</option>`).join('')}
          </select>
          <input class="form-input" name="pbbDueDay" type="number" min="1" max="31" placeholder="${t('form.dayPh')}" style="max-width:90px" value="${pd.pbbDueDay || ''}">
        </div>
        <small style="color:var(--text-muted);font-size:12px">${t('form.pbbDueHint')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.permit')}</label>
        <input class="form-input" name="permitLabel" placeholder="${t('form.permitPh')}" value="${escapeHtml(pd.permitLabel || '')}">
        <input class="form-input" name="permitExpiry" type="date" style="margin-top:8px" value="${pd.permitExpiry || ''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.permitExpHint')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.maintYr')}</label>
        <input class="form-input" name="maintenance" type="text" inputmode="numeric" data-rp placeholder="5.000.000" value="${pd.maintenance ? formatNumDots(pd.maintenance) : ''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.maintHint')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.insuranceYr')}</label>
        <input class="form-input" name="insurance" type="text" inputmode="numeric" data-rp placeholder="0" value="${pd.insurance ? formatNumDots(pd.insurance) : ''}"></div>
      <div class="form-group"><label class="form-label">${t('form.otherYr')}</label>
        <input class="form-input" name="otherExpense" type="text" inputmode="numeric" data-rp placeholder="0" value="${pd.otherExpense ? formatNumDots(pd.otherExpense) : ''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.otherYrHint')}</small></div>
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">${t('form.cicilanMo')}</label>
        <input class="form-input" name="cicilanPerBulan" type="text" inputmode="numeric" data-rp placeholder="0" value="${pd.cicilanPerBulan ? formatNumDots(pd.cicilanPerBulan) : ''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.cicilanHint')}</small></div>
      <div class="form-group"><label class="form-label">${t('form.tenorLeft')}</label>
        <input class="form-input" name="sisaTenor" type="number" placeholder="0" value="${pd.sisaTenor||''}">
        <small style="color:var(--text-muted);font-size:12px">${t('form.tenorHint')}</small></div>
      <div class="prop-settings-divider"></div>
      <div class="form-group"><label class="form-label">${t('form.notes')}</label>
        <textarea class="form-textarea" name="notes" placeholder="${t('form.propNotesPh')}">${pd.notes||''}</textarea></div>
      <button type="submit" class="btn btn-primary">${t('form.save')}</button>
    </form>
    <div class="prop-settings-divider"></div>
    <button class="btn btn-danger" onclick="deleteProperty(${onclickStrArg(propName)})">${t('prop.deleteAll')}</button>
  `);
  setTimeout(() => initRpInputs(), 50);
}

function savePropertySettings(e, oldPropName) {
  e.preventDefault();
  const f = e.target;
  const newPropName = f.propName.value.trim();
  if (!newPropName) { alert(t('msg.propRequired')); return; }

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
      alert(t('msg.propDuplicate')); return;
    }
    const capMap = getYieldCapOverrideMap();
    if (Object.prototype.hasOwnProperty.call(capMap, oldPropName)) {
      capMap[newPropName] = capMap[oldPropName];
      delete capMap[oldPropName];
      DB.setVal('yield_cap_by_property', JSON.stringify(capMap));
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
  prop.purchasePrice = parseNum(f.purchasePrice.value) || 0;
  prop.pbb = parseNum(f.pbb.value) || 0;
  prop.pbbDueMonth = f.pbbDueMonth?.value ? Number(f.pbbDueMonth.value) : '';
  prop.pbbDueDay = f.pbbDueDay?.value ? Number(f.pbbDueDay.value) : '';
  prop.permitLabel = (f.permitLabel?.value || '').trim();
  prop.permitExpiry = f.permitExpiry?.value || '';
  prop.maintenance = parseNum(f.maintenance.value) || 0;
  prop.insurance = parseNum(f.insurance.value) || 0;
  prop.otherExpense = parseNum(f.otherExpense.value) || 0;
  prop.cicilanPerBulan = parseNum(f.cicilanPerBulan.value) || 0;
  prop.sisaTenor = Number(f.sisaTenor.value) || 0;
  prop.notes = f.notes.value.trim();
  saveProperties(props);
  closeModal();
  refreshCurrentPage();
}

function deleteProperty(propName) {
  const units = getUnits().filter(u => u.property === propName);
  const msg = units.length > 0
    ? t('confirm.deletePropUnits', { name: propName, n: units.length })
    : t('confirm.deleteProp', { name: propName });
  if (!confirm(msg)) return;

  const capMap = getYieldCapOverrideMap();
  if (Object.prototype.hasOwnProperty.call(capMap, propName)) {
    delete capMap[propName];
    DB.setVal('yield_cap_by_property', JSON.stringify(capMap));
  }

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
  const newSub = prompt(t('prompt.renameSubtype', { old: oldSub }), oldSub);
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
  if (!confirm(t('confirm.deleteSubtype', { sub, n: affected.length }))) return;
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

  openModal(t('bulk.title'), `
    <form onsubmit="saveBulkUnits(event, ${onclickStrArg(propName)})">
      <div class="card" style="background:var(--primary-glow);padding:14px;margin-bottom:16px;border-radius:12px">
        <div style="font-size:13px;color:var(--primary);font-weight:700">📦 ${escapeHtml(propName)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${t('bulk.blurb')}</div>
      </div>

      <div class="form-group"><label class="form-label">${t('form.subtype')}</label>
        <select class="form-select" name="subtypeSelect" id="bulk-subtype" onchange="onBulkSubtypeChange(this.value, ${onclickStrArg(propName)})">
          <option value="">${t('form.subtypeNone')}</option>
          ${existingSubtypes.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
          <option value="__new__">${t('form.addNew')}</option>
        </select>
        <input class="form-input" id="bulk-new-subtype" placeholder="${t('form.subtypePh')}" style="margin-top:8px;display:none">
      </div>

      <div class="form-group"><label class="form-label">${t('bulk.range')}</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" name="startNum" type="number" placeholder="101" required style="flex:1">
          <span style="color:var(--text-muted);font-weight:700">${t('bulk.to')}</span>
          <input class="form-input" name="endNum" type="number" placeholder="120" required style="flex:1">
        </div>
        <small style="color:var(--text-muted);margin-top:6px;display:block">${t('bulk.rangeHint')}</small>
      </div>

      <div class="form-group"><label class="form-label">${t('bulk.prefix')}</label>
        <input class="form-input" name="prefix" placeholder="${t('bulk.prefixPh')}">
        <small style="color:var(--text-muted);margin-top:4px;display:block">${t('bulk.prefixHint')}</small>
      </div>

      <div class="form-group"><label class="form-label">${t('bulk.skip')}</label>
        <input class="form-input" name="skipNums" placeholder="${t('bulk.skipPh')}">
        <small style="color:var(--text-muted);margin-top:4px;display:block">${t('bulk.skipHint')}</small>
      </div>

      <div class="form-group"><label class="form-label">${t('bulk.rentMo')}</label>
        <input class="form-input" name="price" type="text" inputmode="numeric" data-rp id="bulk-price" placeholder="1.500.000" value="0">
      </div>

      <div class="form-group"><label class="form-label">${t('bulk.initialStatus')}</label>
        <select class="form-select" name="status">
          <option value="vacant">${t('form.vacant')}</option>
          <option value="occupied">${t('form.occupied')}</option>
        </select>
      </div>

      <div id="bulk-preview" style="margin-bottom:16px"></div>

      <button type="submit" class="btn btn-primary">${t('bulk.submit')}</button>
    </form>
    <script>
      document.querySelector('[name="startNum"]').addEventListener('input', previewBulk);
      document.querySelector('[name="endNum"]').addEventListener('input', previewBulk);
      document.querySelector('[name="prefix"]').addEventListener('input', previewBulk);
      document.querySelector('[name="skipNums"]').addEventListener('input', previewBulk);
    </script>
  `);
  setTimeout(() => initRpInputs(), 50);
}

function onBulkSubtypeChange(val, propName) {
  document.getElementById('bulk-new-subtype').style.display = val === '__new__' ? 'block' : 'none';
  if (val && val !== '__new__') {
    const tpl = getSubtypeTemplate(propName, val);
    if (tpl?.price) document.getElementById('bulk-price').value = formatNumDots(tpl.price);
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
      <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px">${t('bulk.previewTitle', { n: count })}</div>
      <div style="font-size:12px;color:var(--text-secondary)">${sample.join(', ')}${remaining > 0 ? t('bulk.previewMore', { n: remaining }) : ''}</div>
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
  const price = parseNum(f.price.value) || 0;
  const status = f.status.value;
  const skipStr = f.skipNums?.value || '';
  const skipNums = skipStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);

  if (start <= 0 || end < start) { alert(t('msg.rangeInvalid')); return; }
  if (end - start > 500) { alert(t('msg.bulkMax')); return; }

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

  if (added === 0) { alert(t('msg.bulkNone')); return; }

  saveUnits(units);
  closeModal();
  refreshCurrentPage();
  alert(t('msg.bulkDone', { added }) + (skipped > 0 ? t('msg.bulkSkipped', { n: skipped }) : ''));
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
  if (!cfg.token || !cfg.chatId) { alert(t('msg.tgSetupFirst')); return; }

  const payments = getPayments(), tenants = getTenants();
  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const maxDue = new Date(today0);
  maxDue.setDate(maxDue.getDate() + 30);

  const pending = payments.filter(p => {
    if (!((p.status === 'pending' || p.status === 'overdue') && p.type === 'income' && shouldIncludePaymentInReminders(p, tenants))) return false;
    const du = parseYMD(String(p.dueDate || '').slice(0, 10));
    if (!du) return false;
    du.setHours(0, 0, 0, 0);
    /* Hanya jatuh tempo ≤ hari ini + 30 hari (termasuk semua yang terlambat) */
    if (du.getTime() > maxDue.getTime()) return false;
    return true;
  });

  if (!pending.length) { alert(t('msg.tgNoBillsManualReminder')); return; }

  let msg = '🏠 *PropertiKu — Reminder Sewa*\n\n';
  pending.forEach(p => {
    const tn = tenants.find(x => x.id === p.tenantId);
    const d = daysUntil(p.dueDate);
    const status = d < 0 ? `⚠️ TERLAMBAT ${Math.abs(d)} hari` : `⏳ ${d} hari lagi`;
    const periodLabel = p.dueDate ? getMonthYear(p.dueDate) : (p.period || '');
    msg += `👤 *${tn?.name || t('pay.tenantWord')}*\n`;
    msg += `📍 ${p.propertyName || '-'}\n`;
    msg += `💰 ${formatRpFull(p.amount)} — ${p.description || t('pay.rentFallback', { period: periodLabel })}\n`;
    msg += `📅 Jatuh tempo: ${formatDate(p.dueDate)} (${status})\n\n`;
  });

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cfg.chatId, text: msg, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    if (data.ok) alert(t('msg.tgOk'));
    else alert(t('msg.tgFail', { err: data.description || 'Unknown error' }));
  } catch (err) {
    alert(t('msg.error', { err: err.message }));
  }
}

// ===== SETTINGS =====
/** Hapus semua data lokal (tombol Reset di pengaturan). Inline confirm() di HTML attribute rusak jika string berisi tanda kutip. */
function resetAllData() {
  const msg = typeof t === 'function' ? t('settings.resetConfirm') : 'Delete ALL data? This cannot be undone.';
  if (!confirm(msg)) return;
  try {
    localStorage.clear();
  } catch (e) {
    alert((e && e.message) || String(e));
    return;
  }
  location.reload();
}

function showSettings() {
  const cfg = getTelegramConfig();
  const isDark = getTheme() === 'dark';
  const um = getUiMode();
  openModal(t('settings.title'), `
    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">${t('settings.display')}</label>
      <div class="ui-mode-segment">
        <button type="button" class="ui-mode-btn ${um === 'simple' ? 'active' : ''}" onclick="setUiModeFromSettings('simple')">${t('settings.simple')}</button>
        <button type="button" class="ui-mode-btn ${um === 'pro' ? 'active' : ''}" onclick="setUiModeFromSettings('pro')">${t('settings.pro')}</button>
      </div>
      <small style="display:block;margin-top:8px;color:var(--text-muted);font-size:12px;line-height:1.45">${t('settings.modeHelp')}</small>
    </div>

    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">${t('settings.ownerGreet')}</label>
      <input type="text" id="settings-owner-name" class="form-input" maxlength="40" autocomplete="name" placeholder="${t('owner.namePh')}" value="${escapeHtml(getOwnerDisplayName())}">
      <small style="display:block;margin-top:8px;color:var(--text-muted);font-size:12px;line-height:1.45">${t('settings.ownerHelp')}</small>
      <button type="button" class="btn btn-primary" style="width:100%;margin-top:12px" onclick="saveOwnerProfileFromSettings()">${t('settings.saveGreet')}</button>
    </div>

    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">${t('settings.dark')}</label>
      <div style="display:flex;align-items:center;gap:12px">
        <label style="position:relative;display:inline-block;width:50px;height:28px;cursor:pointer">
          <input type="checkbox" ${isDark ? 'checked' : ''} onchange="toggleTheme();showSettings()" style="opacity:0;width:0;height:0">
          <span style="position:absolute;inset:0;background:${isDark ? 'var(--primary)' : 'var(--border)'};border-radius:28px;transition:0.3s"></span>
          <span style="position:absolute;top:3px;left:${isDark ? '25px' : '3px'};width:22px;height:22px;background:white;border-radius:50%;transition:0.3s"></span>
        </label>
        <span style="font-size:13px;color:var(--text-secondary)">${isDark ? t('settings.darkOn') : t('settings.darkOff')}</span>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">${t('settings.storage')}</label>
      <div style="font-size:13px;color:var(--text-secondary)">${getStorageUsage()}${t('settings.storageSub')}</div>
      <div style="height:6px;background:var(--border);border-radius:3px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${Math.min(parseFloat(getStorageUsage()) / 5 * 100, 100)}%;background:var(--primary);border-radius:3px"></div></div>
    </div>

    <div class="form-group" style="margin-bottom:20px">
      <label class="form-label">${t('settings.legal')}</label>
      <button type="button" class="btn btn-outline" onclick="window.open('privacy.html','_blank','noopener')" style="width:100%">${t('settings.privacy')}</button>
      <small style="display:block;margin-top:8px;color:var(--text-muted);font-size:12px;line-height:1.45">${t('settings.privacyHint')}</small>
    </div>

    <div class="yield-divider" style="margin:16px 0"></div>

    <div class="settings-info">
      ${t('settings.tgIntro')}
    </div>

    <div class="card" style="background:var(--bg);padding:14px;border-radius:12px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:800;color:var(--primary);margin-bottom:10px">${t('settings.tgSetup')}</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
        ${t('settings.tgSteps')}
      </div>
    </div>

    <form onsubmit="saveSettingsForm(event)">
      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label">${t('settings.channelsTitle')}</label>
        <p style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin:0 0 10px 0">${t('settings.channelsIntro')}</p>
        <input type="tel" class="form-input" name="waPhone" id="settings-wa-phone" autocomplete="tel" inputmode="tel" placeholder="${t('settings.waPhonePh')}" value="${escapeHtml(DB.getVal('reminder_whatsapp'))}">
        <small style="display:block;margin-top:8px;color:var(--text-muted);font-size:12px;line-height:1.45">${t('settings.waPhoneHint')}</small>
      </div>
      <div class="form-group"><label class="form-label">${t('settings.tgToken')}</label>
        <input class="form-input" name="tgToken" id="tg-token-input" placeholder="123456789:ABCdefGHI-jklMNOpqrSTUvwxYZ" value="${cfg.token}"></div>

      <div class="form-group"><label class="form-label">${t('settings.tgChat')}</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" name="tgChatId" id="tg-chatid-input" placeholder="123456789" value="${cfg.chatId}" style="flex:1">
          <button type="button" class="btn btn-outline" onclick="fetchTelegramChatId()" style="white-space:nowrap;font-size:12px">${t('settings.fetchChat')}</button>
        </div>
        <div id="tg-chatid-status" style="font-size:11px;margin-top:6px;color:var(--text-muted)"></div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button type="button" class="btn btn-outline" onclick="testTelegramConnection()" style="flex:1;font-size:13px">${t('settings.test')}</button>
        <button type="submit" class="btn btn-primary" style="flex:1;font-size:13px">${t('settings.save')}</button>
      </div>
    </form>

    <div id="tg-test-result" style="margin-bottom:12px"></div>

    <button class="btn btn-success" onclick="sendTelegramReminder()" style="width:100%;margin-bottom:8px">${t('settings.sendNow')}</button>
    <small style="display:block;color:var(--text-muted);margin-bottom:16px;line-height:1.45">${t('settings.sendNowHint')}</small>

    <div class="yield-divider" style="margin:16px 0"></div>
    <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">${t('settings.backup')}</div>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <button type="button" class="btn btn-outline" onclick="exportData()" style="flex:1">${t('settings.export')}</button>
      <button type="button" class="btn btn-outline" onclick="importData()" style="flex:1">${t('settings.import')}</button>
    </div>
    <small style="color:var(--text-muted);display:block;margin-bottom:16px">${t('settings.backupHint')}</small>

    <div class="yield-divider" style="margin:16px 0"></div>
    <div class="btn-group">
      <button type="button" class="btn btn-danger" onclick="resetAllData()">${t('settings.reset')}</button>
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
      statusEl.innerHTML = `<span style="color:var(--danger)">❌ Token tidak valid: ${escapeHtml(data.description || 'Error')}</span>`;
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
      statusEl.innerHTML = `<span style="color:var(--success)">✅ Chat ID ditemukan: <strong>${escapeHtml(String(chatId))}</strong> (${escapeHtml(String(chatName))})</span>`;
    } else {
      statusEl.innerHTML = '<span style="color:var(--danger)">❌ Tidak bisa menemukan Chat ID. Coba kirim pesan baru ke bot.</span>';
    }
  } catch (err) {
    statusEl.innerHTML = `<span style="color:var(--danger)">❌ Error: ${escapeHtml(err.message)}</span>`;
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
      resultEl.innerHTML = `<div class="settings-info" style="background:#fef2f2;color:var(--danger)">❌ Gagal: ${escapeHtml(data.description || 'Unknown error')}</div>`;
    }
  } catch (err) {
    resultEl.innerHTML = `<div class="settings-info" style="background:#fef2f2;color:var(--danger)">❌ Error: ${escapeHtml(err.message)}</div>`;
  }
}

function saveSettingsForm(e) {
  e.preventDefault();
  const f = e.target;
  const waField = f.elements && f.elements.namedItem ? f.elements.namedItem('waPhone') : null;
  saveTelegramConfig(f.tgToken.value.trim(), f.tgChatId.value.trim());
  const waRaw = (waField && 'value' in waField)
    ? String(waField.value || '').trim()
    : (f.waPhone ? String(f.waPhone.value || '').trim() : '');
  DB.setVal('reminder_whatsapp', waRaw);
  alert(t('msg.settingsSaved'));
}

// ===== CALENDAR (.ics / Google) + WHATSAPP REMINDER (scope = autoReminderCheck) =====
function getReminderScopePayments() {
  const payments = getPayments();
  const tenants = getTenants();
  const upcoming = payments.filter(p => {
    if (!isActionableDueForDashboard(p, tenants)) return false;
    const dl = daysUntil(p.dueDate);
    return dl >= 0 && dl <= 5;
  });
  const overdue = payments.filter(p => {
    if (!isActionableDueForDashboard(p, tenants)) return false;
    return p.status === 'overdue' || (p.status === 'pending' && daysUntil(p.dueDate) < 0);
  });
  const map = new Map();
  [...overdue, ...upcoming].forEach(p => map.set(p.id, p));
  return [...map.values()].sort((a, b) => {
    const aMs = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bMs = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return aMs - bMs;
  });
}

function normalizeWhatsAppDigits(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  return d;
}

function getReminderWhatsappPhone() {
  return normalizeWhatsAppDigits(DB.getVal('reminder_whatsapp'));
}

function escapeIcsText(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatIcsDateCompact(ymd) {
  if (!ymd) return '';
  const s = String(ymd).slice(0, 10).replace(/-/g, '');
  return s.length === 8 ? s : '';
}

function addOneDayYmdCompact(ymd8) {
  const y = +ymd8.slice(0, 4);
  const m = +ymd8.slice(4, 6) - 1;
  const d = +ymd8.slice(6, 8);
  const dt = new Date(y, m, d);
  dt.setDate(dt.getDate() + 1);
  return dt.getFullYear() + String(dt.getMonth() + 1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0');
}

function buildReminderIcsCalendar(prefList) {
  const tenants = getTenants();
  const list = Array.isArray(prefList) ? prefList : getReminderScopePayments();
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  let out = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PropertiKu//Reminder//ID\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n';
  for (const p of list) {
    const ymd = formatIcsDateCompact(p.dueDate);
    if (!ymd) continue;
    const tnt = tenants.find(x => x.id === p.tenantId);
    const dl = daysUntil(p.dueDate);
    const statusTxt = dl < 0
      ? t('dash.overdue', { n: Math.abs(dl) })
      : (dl === 0 ? t('reminder.icsToday') : t('dash.inDays', { n: dl }));
    const summary = `${t('reminder.icsEventPrefix')}: ${tnt?.name || '—'} — ${p.propertyName || ''}`;
    const desc = [
      `${t('reminder.icsDescAmount')}: ${formatRpFull(p.amount)}`,
      p.description || '',
      `${t('reminder.icsDescDue')}: ${formatDate(p.dueDate)}`,
      statusTxt
    ].filter(Boolean).join('\\n');
    const uid = `${p.id}-${ymd}@propertiku.local`;
    const endEx = addOneDayYmdCompact(ymd);
    out += 'BEGIN:VEVENT\r\n';
    out += `UID:${uid}\r\n`;
    out += `DTSTAMP:${stamp}\r\n`;
    out += `DTSTART;VALUE=DATE:${ymd}\r\n`;
    out += `DTEND;VALUE=DATE:${endEx}\r\n`;
    out += `SUMMARY:${escapeIcsText(summary)}\r\n`;
    out += `DESCRIPTION:${escapeIcsText(desc)}\r\n`;
    out += 'END:VEVENT\r\n';
  }
  out += 'END:VCALENDAR\r\n';
  return out;
}

function downloadReminderCalendarIcs() {
  const list = getReminderScopePayments();
  if (!list.length) {
    if (typeof showToast === 'function') showToast(t('reminder.nothingToExport'), 'info', 3200);
    else alert(t('reminder.nothingToExport'));
    return;
  }
  try {
    const ics = buildReminderIcsCalendar(list);
    const vevents = (ics.match(/BEGIN:VEVENT/g) || []).length;
    if (!vevents) {
      if (typeof showToast === 'function') showToast(t('reminder.icsNoValidDates'), 'warning', 4500);
      else alert(t('reminder.icsNoValidDates'));
      return;
    }
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'propertiku-reminder.ics';
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast(t('reminder.icsDownloaded'), 'success', 4000);
  } catch (err) {
    throw err;
  }
}

function googleCalendarUrlForNextDue() {
  const list = getReminderScopePayments();
  const tenants = getTenants();
  for (const p of list) {
    const ymd = formatIcsDateCompact(p.dueDate);
    if (!ymd) continue;
    const tnt = tenants.find(x => x.id === p.tenantId);
    const endEx = addOneDayYmdCompact(ymd);
    const text = encodeURIComponent(`${t('reminder.icsEventPrefix')}: ${tnt?.name || ''} — ${p.propertyName || ''}`);
    const dl = daysUntil(p.dueDate);
    const statusTxt = dl < 0
      ? t('dash.overdue', { n: Math.abs(dl) })
      : (dl === 0 ? t('reminder.icsToday') : t('dash.inDays', { n: dl }));
    const details = encodeURIComponent(
      [formatRpFull(p.amount), p.description || '', `${formatDate(p.dueDate)} — ${statusTxt}`].filter(Boolean).join('\n')
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${ymd}/${endEx}&details=${details}`;
  }
  return '';
}

function openGoogleCalendarNextDue() {
  const url = googleCalendarUrlForNextDue();
  if (!url) {
    if (typeof showToast === 'function') showToast(t('reminder.nothingToExport'), 'info', 3200);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function buildWhatsAppReminderBody() {
  const tenants = getTenants();
  const list = getReminderScopePayments();
  if (!list.length) return '';
  let msg = `${t('reminder.waHeader')}\n${new Date().toLocaleDateString(dateLocaleTag(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
  list.forEach(p => {
    const tn = tenants.find(x => x.id === p.tenantId);
    const d = daysUntil(p.dueDate);
    const status = d < 0
      ? `⚠ ${t('dash.overdue', { n: Math.abs(d) })}`
      : (d === 0 ? `📌 ${t('reminder.waToday')}` : `⏳ ${t('dash.inDays', { n: d })}`);
    msg += `• ${tn?.name || '-'}\n`;
    msg += `  ${p.propertyName || '-'} · ${formatRpFull(p.amount)}\n`;
    msg += `  ${formatDate(p.dueDate)} — ${status}\n\n`;
  });
  msg += t('reminder.waFooter', { n: list.length });
  return msg;
}

function openWhatsAppReminderPage() {
  const phone = getReminderWhatsappPhone();
  if (!phone) {
    if (typeof showToast === 'function') showToast(t('reminder.waNeedPhone'), 'warning', 4500);
    else alert(t('reminder.waNeedPhone'));
    return;
  }
  let body = buildWhatsAppReminderBody();
  if (!body) {
    if (typeof showToast === 'function') showToast(t('reminder.nothingToExport'), 'info', 3200);
    return;
  }
  if (body.length > 1800) body = body.slice(0, 1790) + '\n…';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ===== AUTO REMINDER ON LOAD =====
async function autoReminderCheck() {
  const cfg = getTelegramConfig();
  if (!cfg.token || !cfg.chatId) return; // Not configured

  const today = new Date().toISOString().slice(0, 10);
  const lastSent = DB.getVal('lastReminderDate');
  if (lastSent === today) return; // Already sent today

  const payments = getPayments();
  const tenants = getTenants();
  const upcoming = payments.filter(p => {
    if (!isActionableDueForDashboard(p, tenants)) return false;
    const dl = daysUntil(p.dueDate);
    return dl >= 0 && dl <= 5; // Due within 5 days
  });
  const overdue = payments.filter(p => {
    if (!isActionableDueForDashboard(p, tenants)) return false;
    return p.status === 'overdue' || (p.status === 'pending' && daysUntil(p.dueDate) < 0);
  });

  const needReminder = [...upcoming, ...overdue];
  if (needReminder.length === 0) return;
  let msg = '🏠 *PropertiKu — Reminder Otomatis*\n';
  msg += `📅 ${new Date().toLocaleDateString(dateLocaleTag(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;

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
const BACKUP_ARRAY_KEYS = ['properties', 'units', 'tenants', 'payments', 'tenantHistory', 'subtypeTemplates', 'unitPhotos', 'maintenanceTickets'];

function validateBackupImport(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, msg: 'File bukan objek JSON yang valid.' };
  }
  const keys = Object.keys(data).filter(k => k.startsWith('propertiKu_'));
  if (keys.length === 0) {
    return { ok: false, msg: 'Tidak ada data PropertiKu (kunci propertiKu_*).' };
  }
  for (const k of keys) {
    const v = data[k];
    if (typeof v !== 'string') {
      return { ok: false, msg: 'Format backup tidak dikenali: nilai harus berupa string (export asli PropertiKu).' };
    }
  }
  for (const short of BACKUP_ARRAY_KEYS) {
    const full = 'propertiKu_' + short;
    if (data[full] === undefined) continue;
    try {
      const parsed = JSON.parse(data[full]);
      if (!Array.isArray(parsed)) {
        return { ok: false, msg: `Data "${short}" rusak: harus berupa array.` };
      }
    } catch {
      return { ok: false, msg: `Data "${short}" bukan JSON array yang valid.` };
    }
  }
  return { ok: true, keys };
}

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
        const check = validateBackupImport(data);
        if (!check.ok) {
          alert(check.msg);
          return;
        }
        if (!confirm(t('confirm.import', { n: check.keys.length }))) return;
        check.keys.forEach(k => localStorage.setItem(k, data[k]));
        alert(t('msg.importOk'));
        location.reload();
      } catch (err) {
        alert(t('msg.fileInvalid', { err: err.message }));
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== ARCHIVE TENANT =====
function showArchiveTenantModal(tenantId) {
  const tenant = getTenants().find(t => t.id === tenantId);
  if (!tenant) return;
  const unit = getUnits().find(u => u.id === tenant.unitId);
  const dep = tenant.deposit || 0;
  const sub = unit ? escapeHtml(unit.property + ' — ' + unit.name) : '';
  openModal(t('archive.title'), `
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px"><strong>${escapeHtml(tenant.name)}</strong>${sub ? ' · ' + sub : ''}</p>
    <form onsubmit="submitArchiveTenant(event, ${onclickStrArg(tenantId)})">
      <div class="form-group"><label class="form-label">${t('form.depositDeduct')}</label>
        <input class="form-input" name="depositDeduct" type="text" data-rp inputmode="numeric" placeholder="0" value=""></div>
      <div class="form-group"><label class="form-label">${t('form.depositWhy')}</label>
        <textarea class="form-textarea" name="depositNotes" placeholder="${t('form.depositWhyPh')}"></textarea></div>
      <div class="form-group"><label class="form-label">${t('form.depositReturn')}</label>
        <input class="form-input" name="depositReturned" type="text" data-rp inputmode="numeric" placeholder="${t('form.depositReturnPh')}" value="${dep ? formatNumDots(dep) : ''}"></div>
      <small style="color:var(--text-muted);display:block;margin-bottom:12px">${t('form.depositRecorded', { amt: formatRpFull(dep) })}</small>
      <button type="submit" class="btn btn-warning">${t('archive.submit')}</button>
    </form>
  `);
  setTimeout(() => initRpInputs(), 50);
}

function submitArchiveTenant(e, tenantId) {
  e.preventDefault();
  const f = e.target;
  const depositDeduct = parseNum(f.depositDeduct.value) || 0;
  const depositReturned = parseNum(f.depositReturned.value) || 0;
  const depositNotes = f.depositNotes.value.trim();
  doArchiveTenant(tenantId, { depositDeduct, depositReturned, depositNotes });
}

function doArchiveTenant(tenantId, depInfo) {
  const tenants = getTenants();
  const tenant = tenants.find(t => t.id === tenantId);
  if (!tenant) return;
  const unit = getUnits().find(u => u.id === tenant.unitId);
  if (!confirm(t('confirm.endLease', { name: tenant.name }))) return;

  const history = getTenantHistory();
  history.push({
    ...tenant,
    unitId: tenant.unitId,
    unitName: unit ? unit.name : '',
    propertyName: unit ? unit.property : '',
    archivedAt: new Date().toISOString(),
    archiveDepositDeducted: depInfo.depositDeduct,
    archiveDepositReturned: depInfo.depositReturned,
    archiveDepositNotes: depInfo.depositNotes
  });
  saveTenantHistory(history);

  if (unit) {
    const units = getUnits();
    const ui = units.findIndex(u => u.id === tenant.unitId);
    if (ui >= 0) { units[ui].status = 'vacant'; saveUnits(units); }
  }

  const payments = getPayments().filter(p => !(p.tenantId === tenantId && p.autoGenerated && p.status !== 'paid'));
  savePayments(payments);

  saveTenants(tenants.filter(t => t.id !== tenantId));

  closeModal();
  refreshCurrentPage();
  showToast(t('msg.archiveDone'), 'success');
}

// ===== UNIT HISTORY =====
function showUnitHistory(unitId) {
  const unit = getUnits().find(u => u.id === unitId);
  if (!unit) return;

  const currentTenant = getTenants().find(t => t.unitId === unitId);
  const archived = getTenantHistory().filter(h => h.unitId === unitId).sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  let html = '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">' + escapeHtml(unit.property + ' — ' + unit.name) + '</div>';

  if (currentTenant) {
    html += '<div class="card" style="padding:12px;border-radius:10px;margin-bottom:12px;border-left:4px solid var(--success)">';
    html += '<div style="font-weight:700;color:var(--success);font-size:13px;margin-bottom:4px">' + t('history.current') + '</div>';
    html += '<div style="font-weight:700">' + escapeHtml(currentTenant.name) + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted)">' + formatDate(currentTenant.startDate) + ' — ' + formatDate(currentTenant.endDate) + '</div>';
    if (currentTenant.phone) html += '<div style="font-size:12px;color:var(--text-muted)">' + escapeHtml(currentTenant.phone) + '</div>';
    html += '</div>';
  } else {
    html += '<div style="padding:12px;background:var(--bg);border-radius:10px;margin-bottom:12px;text-align:center;color:var(--text-muted);font-size:13px">' + t('history.vacantNow') + '</div>';
  }

  if (archived.length > 0) {
    html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--text-secondary)">' + t('history.past') + '</div>';
    archived.forEach(h => {
      html += '<div class="card" style="padding:10px;border-radius:8px;margin-bottom:8px;border-left:4px solid var(--border)">';
      html += '<div style="font-weight:600;font-size:13px">' + escapeHtml(h.name) + '</div>';
      html += '<div style="font-size:12px;color:var(--text-muted)">' + formatDate(h.startDate) + ' — ' + formatDate(h.endDate) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted)">' + t('history.archived', { date: formatDate(h.archivedAt) }) + '</div>';
      if (h.archiveDepositDeducted || h.archiveDepositReturned || h.archiveDepositNotes) {
        const depBits = [];
        if (h.archiveDepositDeducted) depBits.push(t('history.deduct', { amt: formatRpFull(h.archiveDepositDeducted) }));
        if (h.archiveDepositReturned) depBits.push(t('history.returned', { amt: formatRpFull(h.archiveDepositReturned) }));
        if (h.archiveDepositNotes) depBits.push(escapeHtml(h.archiveDepositNotes));
        html += '<div style="font-size:11px;color:var(--text-secondary);margin-top:6px">' + depBits.join(' · ') + '</div>';
      }
      html += '</div>';
    });
  } else if (!currentTenant) {
    html += '<p class="empty-state">' + t('history.none') + '</p>';
  }

  openModal(t('history.title'), html);
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
  if (!tenant) { alert(t('msg.tenantNotFound')); return; }
  const html = generateContract(tenantId);
  if (!html) { alert(t('msg.contractIncomplete')); return; }
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

  if (!props.length) { container.innerHTML = '<p class="empty-state">' + t('yield.noProps') + '</p>'; return; }

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
  if (photos.length >= 5) { alert(t('msg.maxPhotos')); return; }

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
  if (!confirm(t('confirm.deletePhoto'))) return;
  saveUnitPhotos(getUnitPhotos().filter(p => p.id !== photoId));
  closeModal();
  showUnitForm(unitId);
}

function showUnitPhotos(unitId) {
  const photos = getUnitPhotos().filter(p => p.unitId === unitId);
  const unit = getUnits().find(u => u.id === unitId);
  if (photos.length === 0) { alert(t('msg.noPhotos')); return; }

  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">';
  photos.forEach((ph, idx) => {
    html += '<div style="border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer" onclick="viewFullPhoto(' + idx + ',\'' + unitId + '\')">'
      + '<img src="' + ph.data + '" style="width:100%;height:100%;object-fit:cover">'
      + '</div>';
  });
  html += '</div>';

  openModal(t('photo.title', { name: unit ? unit.name : t('form.unitLabel') }), html);
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

function nextAnnualOccurrenceDate(month1to12, dayOfMonth) {
  const now = new Date();
  const dom = Math.min(Math.max(Number(dayOfMonth) || 15, 1), 28);
  let y = now.getFullYear();
  let d = new Date(y, month1to12 - 1, dom);
  d.setHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  if (d < todayStart) d = new Date(y + 1, month1to12 - 1, dom);
  return d;
}

function collectBusinessReminders(contractDays = 60, permitDays = 90) {
  const out = [];
  getTenants().forEach(tenant => {
    if (!tenant.endDate) return;
    const dl = daysUntil(tenant.endDate);
    if (!isNaN(dl) && dl >= 0 && dl <= contractDays) {
      out.push({
        level: dl <= 14 ? 'urgent' : 'soon',
        title: t('rem.contract', { name: tenant.name }),
        sub: t('rem.contractSub', { date: formatDate(tenant.endDate) }),
        whenLabel: dl === 0 ? t('rem.today') : t('rem.days', { n: dl }),
        sort: dl
      });
    }
  });
  getProperties().forEach(p => {
    if (!p.pbbDueMonth) return;
    const dNext = nextAnnualOccurrenceDate(Number(p.pbbDueMonth), p.pbbDueDay);
    const dl = Math.ceil((dNext.getTime() - Date.now()) / 864e5);
    if (dl >= 0 && dl <= 60) {
      out.push({
        level: dl <= 14 ? 'urgent' : 'soon',
        title: t('rem.pbb', { name: p.name }),
        sub: t('rem.pbbSub', { date: formatDate(dNext.toISOString().slice(0, 10)) }),
        whenLabel: t('rem.days', { n: dl }),
        sort: 200 + dl
      });
    }
  });
  getProperties().forEach(p => {
    if (!p.permitExpiry) return;
    const dl = daysUntil(p.permitExpiry);
    if (dl >= 0 && dl <= permitDays) {
      out.push({
        level: dl <= 30 ? 'urgent' : 'soon',
        title: t('rem.permit', { label: p.permitLabel || t('rem.permitDefault'), name: p.name }),
        sub: t('rem.permitSub', { date: formatDate(p.permitExpiry) }),
        whenLabel: t('rem.days', { n: dl }),
        sort: 400 + dl
      });
    }
  });
  const openT = getMaintenanceTickets().filter(x => x.status !== 'done').length;
  if (openT > 0) {
    out.push({
      level: 'info',
      title: t('rem.tickets', { n: openT }),
      sub: t('rem.ticketsSub'),
      whenLabel: '',
      sort: 9000
    });
  }
  return out.sort((a, b) => a.sort - b.sort);
}

function getStressParams() {
  return {
    vacancy: Math.min(50, Math.max(0, parseFloat(DB.getVal('stress_vacancy_pct') || '0') || 0)),
    rentDown: Math.min(40, Math.max(0, parseFloat(DB.getVal('stress_rent_down_pct') || '0') || 0)),
    expenseUp: Math.min(50, Math.max(0, parseFloat(DB.getVal('stress_expense_up_pct') || '0') || 0)),
    cicilanUp: Math.min(50, Math.max(0, parseFloat(DB.getVal('stress_cicilan_up_pct') || '0') || 0))
  };
}

function renderStressTest() {
  const container = document.getElementById('stress-content');
  if (!container) return;
  const units = getUnits(), payments = getPayments();
  const props = [...new Set(units.map(u => u.property))];
  const { vacancy, rentDown, expenseUp, cicilanUp } = getStressParams();
  const cy = getYear();
  const rentM = 1 - rentDown / 100;
  const vacM = 1 - vacancy / 100;
  const expM = 1 + expenseUp / 100;
  const cicM = 1 + cicilanUp / 100;

  if (!props.length) {
    container.innerHTML = '<p class="empty-state">' + t('stress.empty') + '</p>';
    return;
  }

  let rows = '';
  let sumBase = 0, sumStress = 0;
  props.forEach(prop => {
    const pu = units.filter(u => u.property === prop);
    const pd = getPropertyData(prop);
    const monthlyRent = pu.filter(u => u.status === 'occupied').reduce((s, u) => s + getUnitMonthlyRent(u), 0);
    const recordedExpense = payments.filter(p => p.propertyName === prop && p.type === 'expense' && p.period.startsWith(cy)).reduce((s, p) => s + p.amount, 0);
    const unitsCost = getAllUnitsAnnualCost(pu);
    const fixedCosts = getPropertyAnnualCost(pd);
    const totalAnnualExpense = fixedCosts + unitsCost + recordedExpense;
    const cicilan = pd.cicilanPerBulan || 0;
    const baseMo = monthlyRent - totalAnnualExpense / 12 - cicilan;
    const adjRent = monthlyRent * rentM * vacM;
    const adjExp = (totalAnnualExpense / 12) * expM;
    const adjCic = cicilan * cicM;
    const stressMo = adjRent - adjExp - adjCic;
    sumBase += baseMo;
    sumStress += stressMo;
    rows += `<tr><td style="font-weight:700">${escapeHtml(prop)}</td><td>${formatRp(Math.round(baseMo))}</td><td style="color:${stressMo >= baseMo ? 'var(--success)' : 'var(--danger)'};font-weight:700">${formatRp(Math.round(stressMo))}</td><td>${stressMo >= baseMo ? '+' : ''}${formatRp(Math.round(stressMo - baseMo))}</td></tr>`;
  });

  container.innerHTML = `
    ${explanationToggleBtn()}
    <div class="card">
      <h3 class="card-title">${t('stress.title')}</h3>
      <p class="yield-cap-micro">${t('stress.blurb')}</p>
      <div class="stress-sliders" style="margin-top:16px">
        <label class="stress-slider-row">
          <span>${t('stress.vacancy')}</span>
          <input type="range" min="0" max="40" value="${vacancy}" oninput="DB.setVal('stress_vacancy_pct',this.value);document.getElementById('sv-v').textContent=this.value+'%';renderStressTest();">
          <span id="sv-v" class="stress-val">${vacancy}%</span>
        </label>
        <label class="stress-slider-row">
          <span>${t('stress.rentDown')}</span>
          <input type="range" min="0" max="30" value="${rentDown}" oninput="DB.setVal('stress_rent_down_pct',this.value);document.getElementById('sv-r').textContent=this.value+'%';renderStressTest();">
          <span id="sv-r" class="stress-val">${rentDown}%</span>
        </label>
        <label class="stress-slider-row">
          <span>${t('stress.expUp')}</span>
          <input type="range" min="0" max="40" value="${expenseUp}" oninput="DB.setVal('stress_expense_up_pct',this.value);document.getElementById('sv-e').textContent=this.value+'%';renderStressTest();">
          <span id="sv-e" class="stress-val">${expenseUp}%</span>
        </label>
        <label class="stress-slider-row">
          <span>${t('stress.cicilan')}</span>
          <input type="range" min="0" max="30" value="${cicilanUp}" oninput="DB.setVal('stress_cicilan_up_pct',this.value);document.getElementById('sv-c').textContent=this.value+'%';renderStressTest();">
          <span id="sv-c" class="stress-val">${cicilanUp}%</span>
        </label>
      </div>
    </div>
    <div class="card">
      <h3 class="card-title">${t('stress.resultTitle')}</h3>
      <div class="yield-compare-table"><table class="compare-table">
        <thead><tr><th>${t('stress.colProp')}</th><th>${t('stress.colNow')}</th><th>${t('stress.colScenario')}</th><th>${t('stress.colDelta')}</th></tr></thead>
        <tbody>${rows}
        <tr style="font-weight:800;background:var(--primary-glow)"><td>${t('stress.total')}</td><td>${formatRp(Math.round(sumBase))}</td><td>${formatRp(Math.round(sumStress))}</td><td>${sumStress >= sumBase ? '+' : ''}${formatRp(Math.round(sumStress - sumBase))}</td></tr>
        </tbody></table></div>
    </div>`;
}

function renderInvestorInsight() {
  const container = document.getElementById('insight-content');
  if (!container) return;
  const tenants = getTenants(), history = getTenantHistory(), units = getUnits();
  const tickets = getMaintenanceTickets();

  const vacSamples = tenants.map(tn => tn.vacancyDaysBeforeMoveIn).filter(v => v != null && v >= 0);
  const vacAvg = vacSamples.length ? Math.round(vacSamples.reduce((a, b) => a + b, 0) / vacSamples.length) : null;

  const byYear = {};
  history.forEach(h => {
    const y = new Date(h.archivedAt).getFullYear();
    byYear[y] = (byYear[y] || 0) + 1;
  });
  const churnRows = Object.keys(byYear).sort((a, b) => b - a).map(y =>
    `<tr><td>${y}</td><td>${t('insight.churnRow', { n: byYear[y] })}</td></tr>`).join('') || `<tr><td colspan="2" class="empty-state">${t('insight.churnEmpty')}</td></tr>`;

  let rentRows = '';
  units.forEach(u => {
    const rh = Array.isArray(u.rentHistory) ? u.rentHistory : [];
    rh.forEach(entry => {
      rentRows += `<tr><td>${escapeHtml(u.property)} — ${escapeHtml(u.name)}</td><td>${formatDate(entry.at?.slice(0, 10) || '')}</td><td>${formatRpFull(entry.price)}/${entry.billingCycle === 'yearly' ? t('period.yr') : t('period.mo')}</td></tr>`;
    });
  });
  if (!rentRows) rentRows = `<tr><td colspan="3" class="empty-state">${t('insight.rentEmpty')}</td></tr>`;

  const rem = collectBusinessReminders(90, 120);
  const remHtml = rem.length ? rem.map(r =>
    `<div class="biz-cal-row ${r.level}"><span class="biz-cal-dot"></span><div><div class="biz-cal-title">${escapeHtml(r.title)}</div><div class="biz-cal-sub">${escapeHtml(r.sub)}</div></div><span class="biz-cal-when">${escapeHtml(r.whenLabel)}</span></div>`).join('')
    : '<p class="empty-state">' + t('dash.calEmpty') + '</p>';

  const tickRows = tickets.slice().reverse().map(tk => {
    const st = tk.status === 'done' ? '✅' : '🔧';
    const u = tk.unitId ? units.find(x => x.id === tk.unitId) : null;
    const loc = u ? escapeHtml(u.property + ' — ' + u.name) : escapeHtml(tk.propertyName || '-');
    return `<tr><td>${st}</td><td>${escapeHtml(tk.title || '-')}</td><td>${loc}</td><td>${tk.cost ? formatRp(tk.cost) : '-'}</td>
      <td><button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:11px" onclick="toggleMaintenanceStatus(${onclickStrArg(tk.id)})">${tk.status === 'done' ? t('insight.ticketReopen') : t('insight.ticketDone')}</button>
      <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:11px;margin-left:4px" onclick="deleteMaintenanceTicket(${onclickStrArg(tk.id)})">×</button></td></tr>`;
  }).join('');

  container.innerHTML = `
    <div class="card">
      <h3 class="card-title">${t('insight.reminders')}</h3>
      <p class="yield-cap-micro">${t('insight.remHint')}</p>
      <div class="biz-cal-list" style="margin-top:12px">${remHtml}</div>
    </div>
    <div class="card">
      <h3 class="card-title">${t('insight.tickets')}</h3>
      <p class="yield-cap-micro">${t('insight.ticketHint')}</p>
      <div class="yield-compare-table" style="margin-top:12px"><table class="compare-table">
        <thead><tr><th></th><th>${t('insight.tCol1')}</th><th>${t('insight.tCol2')}</th><th>${t('insight.tCol3')}</th><th></th></tr></thead>
        <tbody>${tickRows || `<tr><td colspan="5" class="empty-state">${t('insight.tEmpty')}</td></tr>`}</tbody></table></div>
    </div>
    <div class="card">
      <h3 class="card-title">${t('insight.churn')}</h3>
      <div class="yield-compare-table"><table class="compare-table">
        <thead><tr><th>${t('insight.year')}</th><th>${t('insight.churnCol')}</th></tr></thead>
        <tbody>${churnRows}</tbody></table></div>
    </div>
    <div class="card">
      <h3 class="card-title">${t('insight.vacancy')}</h3>
      <p class="yield-cap-micro">${t('insight.vacHint')}</p>
      <p style="font-size:28px;font-weight:800;color:var(--primary);margin:12px 0 2px">${vacAvg != null ? vacAvg + ' ' + t('insight.daysSuffix') : '—'}</p>
      <p style="font-size:12px;color:var(--text-muted)">${vacAvg != null ? t('insight.vacSub', { n: vacSamples.length }) : t('insight.vacNoData')}</p>
    </div>
    <div class="card">
      <h3 class="card-title">${t('insight.rentHist')}</h3>
      <p class="yield-cap-micro">${t('insight.rentHint')}</p>
      <div class="yield-compare-table" style="margin-top:12px"><table class="compare-table">
        <thead><tr><th>${t('insight.rentColUnit')}</th><th>${t('insight.rentColDate')}</th><th>${t('insight.rentColOld')}</th></tr></thead>
        <tbody>${rentRows}</tbody></table></div>
    </div>`;
}

function showMaintenanceForm() {
  const units = getUnits();
  const props = [...new Set(units.map(u => u.property))];
  openModal(t('ticket.title'), `
    <form onsubmit="saveMaintenanceTicket(event)">
      <div class="form-group"><label class="form-label">${t('form.ticketTitle')}</label>
        <input class="form-input" name="title" required placeholder="${t('form.ticketTitlePh')}"></div>
      <div class="form-group"><label class="form-label">${t('form.property')}</label>
        <select class="form-select" name="propertyName" id="mt-prop" onchange="onMaintenancePropChange(this.value)">
          <option value="">${t('form.propGeneral')}</option>
          ${props.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">${t('form.unitOpt')}</label>
        <select class="form-select" name="unitId" id="mt-unit"><option value="">—</option>
          ${units.map(u => `<option value="${u.id}" data-prop="${escapeHtml(u.property)}">${escapeHtml(u.property)} — ${escapeHtml(u.name)}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">${t('form.costEst')}</label>
        <input class="form-input" name="cost" type="text" data-rp inputmode="numeric" placeholder="0"></div>
      <div class="form-group"><label class="form-label">${t('form.notes')}</label>
        <textarea class="form-textarea" name="notes"></textarea></div>
      <button type="submit" class="btn btn-primary">${t('form.ticketSave')}</button>
    </form>
  `);
  setTimeout(() => initRpInputs(), 50);
}

function onMaintenancePropChange(prop) {
  const sel = document.getElementById('mt-unit');
  if (!sel) return;
  for (const o of sel.options) {
    if (!o.value) { o.hidden = false; continue; }
    o.hidden = !!(prop && o.dataset.prop !== prop);
  }
  sel.value = '';
}

function saveMaintenanceTicket(e) {
  e.preventDefault();
  const f = e.target;
  const list = getMaintenanceTickets();
  list.push({
    id: DB.genId(),
    title: f.title.value.trim(),
    propertyName: f.propertyName.value.trim(),
    unitId: f.unitId.value || '',
    cost: parseNum(f.cost.value) || 0,
    notes: f.notes.value.trim(),
    status: 'open',
    createdAt: new Date().toISOString()
  });
  saveMaintenanceTickets(list);
  closeModal();
  refreshCurrentPage();
  showToast(t('msg.ticketSaved'), 'success');
}

function toggleMaintenanceStatus(id) {
  const list = getMaintenanceTickets();
  const tk = list.find(x => x.id === id);
  if (!tk) return;
  tk.status = tk.status === 'done' ? 'open' : 'done';
  tk.completedAt = tk.status === 'done' ? new Date().toISOString() : '';
  saveMaintenanceTickets(list);
  refreshCurrentPage();
}

function deleteMaintenanceTicket(id) {
  if (!confirm(t('confirm.deleteTicket'))) return;
  saveMaintenanceTickets(getMaintenanceTickets().filter(x => x.id !== id));
  refreshCurrentPage();
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
  const tenants = getTenants();
  const tenantHistory = getTenantHistory();
  const now = new Date();

  // 1. Income Trend (last 6 months)
  const months6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthYear(d);
    const label = d.toLocaleDateString(dateLocaleTag(), { month: 'short' });
    const value = payments.filter(p => p.period === key && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    months6.push({ label, value });
  }

  // 2. Expense by category
  const expByCat = {};
  payments.filter(p => p.type === 'expense').forEach(p => {
    const cat = p.expenseCategory || 'other';
    expByCat[cat] = (expByCat[cat] || 0) + p.amount;
  });
  const donutData = EXPENSE_CATEGORIES.filter(c => expByCat[c.id]).map(c => ({ label: getExpenseCategoryLabel(c.id), value: expByCat[c.id] }));

  // 3. Profit per Property (bar chart)
  const props = [...new Set(units.map(u => u.property))];
  const barData = props.map(prop => {
    const inc = payments.filter(p => p.propertyName === prop && p.type === 'income' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const exp = payments.filter(p => p.propertyName === prop && p.type === 'expense').reduce((s, p) => s + p.amount, 0);
    return { label: prop, values: [inc, exp] };
  });

  // 4. Occupancy trend from lease dates (active tenants + archived contracts), not bill proxy
  const totalUnits = units.length || 1;
  const occData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthYear(d);
    const label = d.toLocaleDateString(dateLocaleTag(), { month: 'short' });
    const occCount = occupiedUnitsByLeasesAtMonth(units, tenants, tenantHistory, key);
    const rate = Math.min(Math.round((occCount / totalUnits) * 100), 100);
    occData.push({ label, value: rate });
  }

  container.innerHTML = `
    <div class="card"><h3 class="card-title">${t('charts.income6')}</h3>${svgLineChart(months6, { color: 'var(--success)' })}</div>
    <div class="card"><h3 class="card-title">${t('charts.expCat')}</h3>${svgDonutChart(donutData)}</div>
    <div class="card"><h3 class="card-title">${t('charts.incVsExp')}</h3>${svgBarChart(barData, { colors: ['var(--success)', 'var(--danger)'], labels: [t('charts.incomeLbl'), t('charts.expenseLbl')] })}</div>
    <div class="card"><h3 class="card-title">${t('charts.occ6')}</h3>
      <p class="yield-cap-micro">${t('charts.occNote')}</p>
      ${svgLineChart(occData, { color: 'var(--primary)' })}</div>
  `;
}

// ===== INIT =====
function isExplanationsHidden() {
  return DB.getVal('hide_explanations') === '1';
}
function applyExplanationPref() {
  const rpt = document.getElementById('page-reports');
  if (rpt) rpt.classList.toggle('hide-explanations', isExplanationsHidden());
}
function toggleExplanations() {
  DB.setVal('hide_explanations', isExplanationsHidden() ? '0' : '1');
  applyExplanationPref();
  if (reportTab === 'yield') renderYield();
  else if (reportTab === 'proyeksi') renderProyeksi();
}
function explanationToggleBtn() {
  const hidden = isExplanationsHidden();
  return `<div style="text-align:right;margin-bottom:8px">
    <button class="btn-explain-toggle" onclick="toggleExplanations()">
      ${hidden ? t('explain.show') : t('explain.hide')}
    </button>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initLocale === 'function') initLocale();
  applyUiMode();
  syncPageTitle();
  applyExplanationPref();
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
        themeBtn.title = typeof t === 'function' ? t('theme.toggle') : 'Dark/Light Mode';
        themeBtn.textContent = getTheme() === 'dark' ? '\u2600\uFE0F' : '\u{1F319}';
        settingsBtn.parentNode.insertBefore(themeBtn, settingsBtn);
      }
    }
  }

  updateOverduePayments();
  syncUnitOccupancyFromTenants();
  renderDashboard();
  if (!document.getElementById('dash-biz-cal')) {
    console.warn('[PropertiKu] #dash-biz-cal missing — index.html or cache may be stale. Hard refresh, or open via serve script and close other app tabs.');
  } else {
    console.info('[PropertiKu] Business calendar card is present below the green banner (jump button available).');
  }
  // Auto-send Telegram reminder if needed
  autoReminderCheck();
  // Show onboarding for first-time users
  showOnboarding();

  document.addEventListener('sw-register-failed', () => {
    if (typeof showToast === 'function') showToast(typeof t === 'function' ? t('msg.swRegisterFail') : 'Service worker failed', 'warning', 4000);
  });
});
