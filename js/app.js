let activeTab = 'dashboard';
let editingLogId = null;
let editingPersonnelId = null;

document.addEventListener('DOMContentLoaded', function() {
  loadData();
  if (AppData.actionPlan.length === 0) initDefaultData();
  initNavigation();
  initDailyLog();
  initActionPlan();
  initPersonnel();
  initAttendance();
  initDatabase();
  initReports();
  initSettings();
  document.getElementById('todayDisplay').textContent = 'امروز: ' + getTodayShamsi();
  showTab('dashboard');
  updateDashboard();
});

function initDefaultData() {
  if (AppData.personnel.length === 0) {
    const defaultPersonnel = [
      { role: 'سرپرست کارگاه', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'کارشناس برنامه ریزی و کنترل پروژه', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'سرپرست اجرا', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'انباردار', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'استادکار', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'اداری', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'کمکی', name: '', wage: 0, contractType: 'رسمی', active: true },
      { role: 'کابل کش', name: '', wage: 0, contractType: 'رسمی', active: true }
    ];
    AppData.personnel = defaultPersonnel;
  }
  saveData();
}

function initNavigation() {
  document.querySelectorAll('.sidebar .nav a').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      const tab = this.dataset.tab;
      showTab(tab);
      if (window.innerWidth <= 992) {
        document.querySelector('.sidebar').classList.remove('show');
      }
    });
  });
  document.getElementById('menuToggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('show');
  });
}

function showTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.sidebar .nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(t => {
    t.classList.toggle('active', t.id === `tab-${tab}`);
  });
  document.getElementById('pageTitle').textContent = getTabTitle(tab);
  if (tab === 'dashboard') updateDashboard();
  if (tab === 'dailylog') { renderDailyLog(); renderDailyStats(); }
  if (tab === 'actionplan') renderActionPlan();
  if (tab === 'personnel') renderPersonnel();
  if (tab === 'attendance') renderAttendance();
}

function getTabTitle(tab) {
  const titles = {
    dashboard: 'داشبورد مدیریت',
    dailylog: 'ثبت فعالیت‌های روزانه',
    actionplan: 'اکشن پلن ماهانه',
    personnel: 'منابع انسانی',
    attendance: 'حضور و غیاب',
    database: 'دیتابیس',
    reports: 'گزارشات',
    settings: 'تنظیمات'
  };
  return titles[tab] || 'SCDP';
}

// ============ DASHBOARD ============
function updateDashboard() {
  const today = getTodayShamsi();
  const todayPL = calcDailyProfitLoss(today);
  const todayLogs = AppData.dailyLogs.filter(d => d.date === today);

  document.getElementById('statTodayActual').textContent = todayPL.actualValue.toLocaleString() + ' ریال';
  document.getElementById('statTodayWage').textContent = todayPL.totalWage.toLocaleString() + ' ریال';
  const plClass = todayPL.profitLoss >= 0 ? 'text-success' : 'text-danger';
  const plSign = todayPL.profitLoss >= 0 ? '+' : '';
  document.getElementById('statTodayPL').innerHTML = `<span class="${plClass}">${plSign}${todayPL.profitLoss.toLocaleString()} ریال</span>`;

  const totalPlan = getPlanTotalValue();
  document.getElementById('statPlanTotal').textContent = totalPlan.toLocaleString() + ' ریال';

  const progress = getPlanProgress();
  const totalPlanQty = progress.reduce((s, p) => s + p.plan, 0);
  const totalDone = progress.reduce((s, p) => s + p.done, 0);
  const pct = totalPlanQty > 0 ? ((totalDone / totalPlanQty) * 100).toFixed(1) : '0';
  document.getElementById('statProgress').textContent = `${pct}%`;
  document.getElementById('statProgressDetail').textContent = `${totalDone.toLocaleString()} / ${totalPlanQty.toLocaleString()}`;

  const todayJd = toJalaali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  const prefix = `${todayJd.jy}/${String(todayJd.jm).padStart(2,'0')}`;
  const monthActual = getActualTotalValue(prefix + '/01', prefix + '/31');
  document.getElementById('statMonthActual').textContent = monthActual.toLocaleString() + ' ریال';

  renderDashboardCharts(todayJd.jy, todayJd.jm);

  // Recent logs
  const recentLogs = AppData.dailyLogs.slice(-10).reverse();
  const tbody = document.getElementById('recentLogsBody');
  if (tbody) {
    tbody.innerHTML = recentLogs.map(l => `
      <tr>
        <td>${l.date}</td>
        <td><span class="badge badge-primary">${departmentNames[l.dept] || l.dept}</span></td>
        <td>${l.activity}</td>
        <td>${l.qty}</td>
        <td>${l.unit || '-'}</td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="text-center text-muted">هنوز فعالیتی ثبت نشده است</td></tr>';
  }
}

// ============ DAILY LOG ============
function initDailyLog() {
  document.getElementById('logDate').value = getTodayShamsi();
  populateItemActivities();
  document.getElementById('logItem').addEventListener('change', onItemChange);
  document.getElementById('logForm').addEventListener('submit', saveDailyLog);
  document.getElementById('logSearch').addEventListener('input', renderDailyLog);
  renderDailyStats();
}

function renderDailyStats() {
  const today = getTodayShamsi();
  const pl = calcDailyProfitLoss(today);
  const logs = AppData.dailyLogs.filter(d => d.date === today);
  const container = document.getElementById('dailyStats');
  if (!container) return;
  const plClass = pl.profitLoss >= 0 ? 'text-success' : 'text-danger';
  const plSign = pl.profitLoss >= 0 ? '+' : '';
  container.innerHTML = `
    <div class="mb-2"><strong>تعداد فعالیت‌های امروز:</strong> ${logs.length}</div>
    <div class="mb-2"><strong>درآمد واقعی امروز:</strong> <span class="text-success fw-7">${pl.actualValue.toLocaleString()} ریال</span></div>
    <div class="mb-2"><strong>هزینه دستمزد امروز:</strong> <span class="text-warning fw-7">${pl.totalWage.toLocaleString()} ریال</span></div>
    <div class="mb-2"><strong>سود/زیان امروز:</strong> <span class="${plClass} fw-7">${plSign}${pl.profitLoss.toLocaleString()} ریال</span></div>
    ${logs.length > 0 ? `<div class="mt-2"><button class="btn btn-sm btn-outline" onclick="showDateDetail('${today}')">مشاهده جزئیات</button></div>` : ''}
  `;
}

function showDateDetail(date) {
  const logs = AppData.dailyLogs.filter(d => d.date === date);
  let html = `<div class="card"><div class="card-header">جزئیات فعالیت‌های ${date}</div><div class="table-wrap"><table><tr><th>فعالیت</th><th>بخش</th><th>مقدار</th><th>واحد</th></tr>`;
  logs.forEach(l => {
    html += `<tr><td>${l.activity}</td><td>${departmentNames[l.dept] || l.dept}</td><td>${l.qty}</td><td>${l.unit || '-'}</td></tr>`;
  });
  html += `</table></div></div>`;
  showModal('جزئیات روز', html);
}

function populateItemActivities() {
  const sel = document.getElementById('logItem');
  sel.innerHTML = '<option value="">انتخاب فعالیت...</option>' +
    itemActivities.map(a => `<option value="${a}">${a}</option>`).join('');
}

function onItemChange() {
  const item = this.value;
  const map = itemToSubMap[item];
  if (map) {
    document.getElementById('logMain').value = map.main;
    document.getElementById('logSub').value = map.sub;
  } else {
    document.getElementById('logMain').value = '';
    document.getElementById('logSub').value = '';
  }
}

function saveDailyLog(e) {
  e.preventDefault();
  const date = document.getElementById('logDate').value;
  const item = document.getElementById('logItem').value;
  const qty = parseFloat(document.getElementById('logQty').value) || 0;
  const unit = document.getElementById('logUnit').value;
  const note = document.getElementById('logNote').value;
  const mainAct = document.getElementById('logMain').value;
  const subAct = document.getElementById('logSub').value;

  if (!date || !item || !qty) { showToast('لطفا تاریخ، فعالیت و مقدار را وارد کنید', 'error'); return; }

  const map = itemToSubMap[item];
  const dept = map ? map.main : '';

  const log = { date, dept, mainActivity: mainAct || dept, subActivity: subAct || item, activity: item, qty, unit, note };

  if (editingLogId !== null) {
    AppData.dailyLogs[editingLogId] = log;
    editingLogId = null;
    showToast('فعالیت با موفقیت ویرایش شد', 'success');
  } else {
    AppData.dailyLogs.push(log);
    showToast('فعالیت با موفقیت ثبت شد', 'success');
  }

  saveData();
  document.getElementById('logForm').reset();
  document.getElementById('logDate').value = getTodayShamsi();
  document.getElementById('logMain').value = '';
  document.getElementById('logSub').value = '';
  renderDailyLog();
  updateDashboard();
}

function renderDailyLog() {
  const search = (document.getElementById('logSearch')?.value || '').toLowerCase();
  let logs = AppData.dailyLogs;
  if (search) logs = logs.filter(l => l.activity.includes(search) || l.date.includes(search) || l.dept.includes(search));
  logs = [...logs].reverse();

  const tbody = document.getElementById('dailyLogBody');
  if (!tbody) return;
  tbody.innerHTML = logs.map((l, i) => {
    const origIdx = AppData.dailyLogs.length - 1 - i;
    return `<tr>
      <td>${l.date}</td>
      <td><span class="badge badge-primary">${departmentNames[l.dept] || l.dept}</span></td>
      <td>${l.mainActivity}</td>
      <td>${l.subActivity}</td>
      <td>${l.activity}</td>
      <td>${l.qty}</td>
      <td>${l.unit || '-'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-outline" onclick="editLog(${origIdx})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLog(${origIdx})">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="text-center text-muted">هیچ فعالیتی یافت نشد</td></tr>';
  const cnt = document.getElementById('dailyLogCount');
  if (cnt) cnt.textContent = logs.length;
}

function editLog(idx) {
  const log = AppData.dailyLogs[idx];
  if (!log) return;
  editingLogId = idx;
  document.getElementById('logDate').value = log.date;
  document.getElementById('logItem').value = log.activity;
  document.getElementById('logQty').value = log.qty;
  document.getElementById('logUnit').value = log.unit || '';
  document.getElementById('logNote').value = log.note || '';
  document.getElementById('logMain').value = log.mainActivity || '';
  document.getElementById('logSub').value = log.subActivity || '';
  document.getElementById('logForm').querySelector('button[type=submit]').textContent = 'ویرایش فعالیت';
  document.getElementById('logCancel').style.display = 'inline-flex';
  showToast('در حال ویرایش فعالیت', 'info');
}

function cancelEdit() {
  editingLogId = null;
  document.getElementById('logForm').reset();
  document.getElementById('logDate').value = getTodayShamsi();
  document.getElementById('logMain').value = '';
  document.getElementById('logSub').value = '';
  document.getElementById('logForm').querySelector('button[type=submit]').textContent = 'ثبت فعالیت';
  document.getElementById('logCancel').style.display = 'none';
}

function deleteLog(idx) {
  if (!confirm('آیا از حذف این فعالیت اطمینان دارید؟')) return;
  AppData.dailyLogs.splice(idx, 1);
  saveData();
  renderDailyLog();
  updateDashboard();
  showToast('فعالیت با موفقیت حذف شد', 'info');
}

// ============ ACTION PLAN ============
function initActionPlan() {
  document.getElementById('planForm').addEventListener('submit', savePlanItem);
  document.getElementById('planDept').addEventListener('change', function() {
    const dept = this.value;
    const activities = defaultActivities.filter(a => a.dept === dept);
    const sel = document.getElementById('planActivity');
    sel.innerHTML = '<option value="">انتخاب فعالیت...</option>' +
      activities.map(a => `<option value="${a.sub}">${a.sub}</option>`).join('');
  });
}

function savePlanItem(e) {
  e.preventDefault();
  const dept = document.getElementById('planDept').value;
  const activity = document.getElementById('planActivity').value;
  const qty = parseFloat(document.getElementById('planQty').value) || 0;
  const unit = document.getElementById('planUnit').value;
  const unitPrice = parseFloat(document.getElementById('planUnitPrice').value) || 0;

  if (!dept || !activity || !qty) { showToast('لطفا تمام فیلدها را پر کنید', 'error'); return; }

  const totalPrice = qty * unitPrice;
  AppData.actionPlan.push({ dept, activity, qty, unit, unitPrice, totalPrice });
  saveData();
  document.getElementById('planForm').reset();
  renderActionPlan();
  updateDashboard();
  showToast('آیتم به اکشن پلن اضافه شد', 'success');
}

function renderActionPlan() {
  const tbody = document.getElementById('planBody');
  if (!tbody) return;
  tbody.innerHTML = AppData.actionPlan.map((p, i) => `
    <tr>
      <td><span class="badge badge-primary">${departmentNames[p.dept] || p.dept}</span></td>
      <td>${p.activity}</td>
      <td>${p.qty}</td>
      <td>${p.unit}</td>
      <td>${p.unitPrice.toLocaleString()}</td>
      <td>${(p.totalPrice || p.qty * p.unitPrice).toLocaleString()}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-danger" onclick="deletePlanItem(${i})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="text-center text-muted">هیچ آیتمی در اکشن پلن ثبت نشده است</td></tr>';

  const total = AppData.actionPlan.reduce((s, p) => s + (p.totalPrice || p.qty * p.unitPrice), 0);
  document.getElementById('planTotal').textContent = total.toLocaleString() + ' ریال';
  document.getElementById('planItemCount').textContent = AppData.actionPlan.length;
}

function deletePlanItem(idx) {
  if (!confirm('آیا از حذف این آیتم اطمینان دارید؟')) return;
  AppData.actionPlan.splice(idx, 1);
  saveData();
  renderActionPlan();
  updateDashboard();
  showToast('آیتم حذف شد', 'info');
}

// ============ PERSONNEL ============
function initPersonnel() {
  document.getElementById('personnelForm').addEventListener('submit', savePersonnel);
  document.getElementById('addPersonnelRow').addEventListener('click', addPersonnelRow);
}

function addPersonnelRow() {
  const tbody = document.getElementById('personnelBody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>
      <select class="form-control person-role">
        <option value="سرپرست کارگاه">سرپرست کارگاه</option>
        <option value="کارشناس برنامه ریزی و کنترل پروژه">کارشناس برنامه ریزی و کنترل پروژه</option>
        <option value="سرپرست اجرا">سرپرست اجرا</option>
        <option value="انباردار">انباردار</option>
        <option value="استادکار">استادکار</option>
        <option value="اداری">اداری</option>
        <option value="کمکی">کمکی</option>
        <option value="کابل کش">کابل کش</option>
      </select>
    </td>
    <td><input class="form-control person-name" placeholder="نام و نام خانوادگی"></td>
    <td><input class="form-control person-wage" type="number" placeholder="دستمزد روزانه"></td>
    <td>
      <select class="form-control person-contract">
        <option value="رسمی">رسمی</option>
        <option value="پیمانی">پیمانی</option>
        <option value="ساعتی">ساعتی</option>
      </select>
    </td>
    <td><input class="form-control person-active" type="checkbox" checked></td>
    <td><button class="btn btn-sm btn-danger" onclick="this.closest('tr').remove()">🗑️</button></td>
  `;
  tbody.appendChild(row);
}

function savePersonnel(e) {
  e.preventDefault();
  const rows = document.querySelectorAll('#personnelBody tr');
  AppData.personnel = [];
  rows.forEach(row => {
    const role = row.querySelector('.person-role')?.value;
    const name = row.querySelector('.person-name')?.value || '';
    const wage = parseFloat(row.querySelector('.person-wage')?.value) || 0;
    const contractType = row.querySelector('.person-contract')?.value || 'رسمی';
    const active = row.querySelector('.person-active')?.checked || false;
    if (role) AppData.personnel.push({ role, name, wage, contractType, active });
  });
  saveData();
  renderPersonnel();
  updateDashboard();
  showToast('منابع انسانی با موفقیت ذخیره شد', 'success');
}

function renderPersonnel() {
  const tbody = document.getElementById('personnelBody');
  if (!tbody) return;
  tbody.innerHTML = AppData.personnel.map((p, i) => `
    <tr>
      <td><span class="badge badge-primary">${p.role}</span></td>
      <td>${p.name || '-'}</td>
      <td>${p.wage.toLocaleString()}</td>
      <td>${p.contractType || 'رسمی'}</td>
      <td>${p.active ? '✅' : '❌'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-danger" onclick="deletePersonnel(${i})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-center text-muted">هیچ پرسنلی ثبت نشده است</td></tr>';

  const activeCount = AppData.personnel.filter(p => p.active).length;
  const totalWage = AppData.personnel.filter(p => p.active).reduce((s, p) => s + p.wage, 0);
  document.getElementById('personnelCount').textContent = activeCount;
  document.getElementById('totalWage').textContent = totalWage.toLocaleString() + ' ریال';
  AppData.settings.dailyWageTotal = totalWage || AppData.settings.dailyWageTotal;
}

function deletePersonnel(idx) {
  if (!confirm('آیا از حذف این پرسنل اطمینان دارید؟')) return;
  AppData.personnel.splice(idx, 1);
  saveData();
  renderPersonnel();
  showToast('پرسنل حذف شد', 'info');
}

// ============ ATTENDANCE ============
function initAttendance() {
  document.getElementById('attendanceDate').value = getTodayShamsi();
  document.getElementById('attendanceForm').addEventListener('submit', saveAttendance);
  document.getElementById('attendanceDate').addEventListener('change', renderAttendance);
}

function saveAttendance(e) {
  e.preventDefault();
  const date = document.getElementById('attendanceDate').value;
  if (!date) { showToast('لطفا تاریخ را وارد کنید', 'error'); return; }

  AppData.attendance[date] = [];
  document.querySelectorAll('#attendanceBody tr').forEach(row => {
    const name = row.querySelector('.att-name')?.textContent || '';
    const role = row.querySelector('.att-role')?.textContent || '';
    const status = row.querySelector('.att-status')?.value || 'حاضر';
    if (name) AppData.attendance[date].push({ name, role, status });
  });
  saveData();
  showToast('حضور و غیاب با موفقیت ثبت شد', 'success');
}

function renderAttendance() {
  const date = document.getElementById('attendanceDate').value;
  const tbody = document.getElementById('attendanceBody');
  if (!tbody) return;

  const records = AppData.attendance[date] || [];
  const activePersonnel = AppData.personnel.filter(p => p.active && p.name);

  if (records.length > 0) {
    tbody.innerHTML = records.map(r => `
      <tr>
        <td class="att-name">${r.name}</td>
        <td class="att-role">${r.role}</td>
        <td>
          <select class="form-control att-status">
            <option value="حاضر" ${r.status === 'حاضر' ? 'selected' : ''}>حاضر</option>
            <option value="غایب" ${r.status === 'غایب' ? 'selected' : ''}>غایب</option>
            <option value="مرخصی" ${r.status === 'مرخصی' ? 'selected' : ''}>مرخصی</option>
            <option value="ماموریت" ${r.status === 'ماموریت' ? 'selected' : ''}>ماموریت</option>
          </select>
        </td>
      </tr>
    `).join('');
  } else if (activePersonnel.length > 0) {
    tbody.innerHTML = activePersonnel.map(p => `
      <tr>
        <td class="att-name">${p.name}</td>
        <td class="att-role">${p.role}</td>
        <td>
          <select class="form-control att-status">
            <option value="حاضر">حاضر</option>
            <option value="غایب">غایب</option>
            <option value="مرخصی">مرخصی</option>
            <option value="ماموریت">ماموریت</option>
          </select>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">لطفا ابتدا پرسنل را در بخش منابع انسانی ثبت کنید</td></tr>';
  }

  // Attendance summary for month
  const prefix = date.substring(0, 7);
  const attDates = Object.keys(AppData.attendance).filter(d => d.startsWith(prefix));
  const summary = {};
  attDates.forEach(d => {
    (AppData.attendance[d] || []).forEach(r => {
      if (!summary[r.name]) summary[r.name] = { present: 0, absent: 0, leave: 0, mission: 0 };
      if (r.status === 'حاضر') summary[r.name].present++;
      else if (r.status === 'غایب') summary[r.name].absent++;
      else if (r.status === 'مرخصی') summary[r.name].leave++;
      else if (r.status === 'ماموریت') summary[r.name].mission++;
    });
  });

  const summaryBody = document.getElementById('attSummaryBody');
  if (summaryBody) {
    summaryBody.innerHTML = Object.entries(summary).map(([name, s]) => {
      const person = AppData.personnel.find(p => p.name === name);
      const wage = person ? person.wage : 0;
      const totalPay = wage * s.present;
      return `<tr>
        <td>${name}</td>
        <td>${s.present}</td>
        <td>${s.absent}</td>
        <td>${s.leave}</td>
        <td>${s.mission}</td>
        <td>${totalPay.toLocaleString()}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center text-muted">داده‌ای موجود نیست</td></tr>';
  }
}

// ============ DATABASE ============
function initDatabase() {
  document.getElementById('importBtn').addEventListener('click', function() {
    document.getElementById('excelFile').click();
  });
  document.getElementById('excelFile').addEventListener('change', function(e) {
    if (this.files.length) {
      importExcel(this.files[0]).then(() => {
        showToast('دیتابیس با موفقیت بارگذاری شد', 'success');
        renderAll();
      }).catch(err => {
        showToast('خطا در بارگذاری فایل: ' + err.message, 'error');
      });
    }
  });
  document.getElementById('exportBtn').addEventListener('click', function() {
    exportExcel();
    showToast('فایل اکسل با موفقیت خروجی گرفته شد', 'success');
  });
  document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm('آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل قابل بازگشت نیست!')) {
      if (confirm('تأیید نهایی: همه داده‌ها پاک خواهند شد')) {
        AppData = {
          actionPlan: [],
          dailyLogs: [],
          personnel: [],
          attendance: {},
          settings: { dailyWageTotal: 40000000, month: '', year: '' }
        };
        saveData();
        renderAll();
        showToast('تمام داده‌ها پاک شدند', 'info');
      }
    }
  });

  // Update info
  document.getElementById('dbLogCount').textContent = AppData.dailyLogs.length;
  document.getElementById('dbPlanCount').textContent = AppData.actionPlan.length;
  document.getElementById('dbPersonnelCount').textContent = AppData.personnel.length;
}

function renderAll() {
  updateDashboard();
  renderDailyLog();
  renderActionPlan();
  renderPersonnel();
  renderAttendance();
}

// ============ REPORTS ============
function initReports() {
  document.getElementById('reportDaily').addEventListener('click', () => generatePDFReport('daily'));
  document.getElementById('reportMonthly').addEventListener('click', () => generatePDFReport('monthly'));
  document.getElementById('reportFull').addEventListener('click', () => generatePDFReport('full'));
  document.getElementById('reportExcel').addEventListener('click', generateExcelReport);
  document.getElementById('reportPrint').addEventListener('click', printReport);

  document.getElementById('reportDept').addEventListener('change', function() {
    const dept = this.value;
    if (dept) {
      document.getElementById('deptReportContainer').innerHTML = generateDeptReport(dept);
    }
  });
}

// ============ SETTINGS ============
function initSettings() {
  document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    AppData.settings.month = document.getElementById('setMonth').value;
    AppData.settings.year = document.getElementById('setYear').value;
    AppData.settings.dailyWageTotal = parseFloat(document.getElementById('setWage').value) || 40000000;
    saveData();
    showToast('تنظیمات با موفقیت ذخیره شد', 'success');
    updateDashboard();
  });

  const today = new Date();
  const jd = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  document.getElementById('setMonth').value = AppData.settings.month || String(jd.jm).padStart(2,'0');
  document.getElementById('setYear').value = AppData.settings.year || String(jd.jy);
  document.getElementById('setWage').value = AppData.settings.dailyWageTotal || 40000000;
}
