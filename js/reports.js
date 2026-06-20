function generatePDFReport(type) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('Vazirmatn', 'normal');
  const rightMargin = 10;

  // Persian support requires custom font - use simple text for now
  doc.setFontSize(18);
  doc.text('SCDP - گزارش عملکرد کارگاه', pageWidth - rightMargin, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`تاریخ گزارش: ${getTodayShamsi()}`, pageWidth - rightMargin, 28, { align: 'right' });

  let y = 40;

  if (type === 'daily' || type === 'full') {
    const today = getTodayShamsi();
    const pl = calcDailyProfitLoss(today);
    doc.setFontSize(14);
    doc.text(`--- گزارش روزانه - ${today} ---`, pageWidth - rightMargin, y, { align: 'right' });
    y += 10;
    doc.setFontSize(10);
    doc.text(`درآمد واقعی: ${pl.actualValue.toLocaleString()} ریال`, pageWidth - rightMargin, y, { align: 'right' });
    y += 7;
    doc.text(`هزینه دستمزد: ${pl.totalWage.toLocaleString()} ریال`, pageWidth - rightMargin, y, { align: 'right' });
    y += 7;
    const plText = pl.profitLoss >= 0 ? 'سود' : 'زیان';
    doc.text(`${plText}: ${Math.abs(pl.profitLoss).toLocaleString()} ریال`, pageWidth - rightMargin, y, { align: 'right' });
    y += 15;
  }

  if (type === 'monthly' || type === 'full') {
    const today = new Date();
    const jd = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const ms = getMonthlySummary(jd.jy, jd.jm);
    doc.setFontSize(14);
    doc.text(`--- گزارش ماهانه ${getJalaaliMonthName(jd.jm)} ${jd.jy} ---`, pageWidth - rightMargin, y, { align: 'right' });
    y += 10;
    doc.setFontSize(10);
    doc.text(`جمع درآمد واقعی: ${ms.totalActual.toLocaleString()} ریال`, pageWidth - rightMargin, y, { align: 'right' });
    y += 7;
    doc.text(`جمع هزینه دستمزد: ${ms.totalWages.toLocaleString()} ریال`, pageWidth - rightMargin, y, { align: 'right' });
    y += 7;
    const mplText = ms.profitLoss >= 0 ? 'سود' : 'زیان';
    doc.text(`${mplText} کل: ${Math.abs(ms.profitLoss).toLocaleString()} ریال`, pageWidth - rightMargin, y, { align: 'right' });
    y += 15;

    // Plan progress
    doc.setFontSize(14);
    doc.text('--- پیشرفت اکشن پلن ---', pageWidth - rightMargin, y, { align: 'right' });
    y += 10;
    const progress = getPlanProgress();
    progress.forEach(p => {
      doc.setFontSize(8);
      const pct = p.plan > 0 ? ((p.done / p.plan) * 100).toFixed(1) : '0';
      doc.text(`${p.dept} - ${p.activity}: ${p.done}/${p.plan} ${p.unit} (${pct}%)`, pageWidth - rightMargin, y, { align: 'right' });
      y += 5;
      if (y > 190) { doc.addPage(); y = 20; }
    });
    y += 10;
  }

  if (type === 'full') {
    // Daily breakdown
    doc.setFontSize(14);
    doc.text('--- تفکیک روزانه ---', pageWidth - rightMargin, y, { align: 'right' });
    y += 10;
    const today = new Date();
    const jd2 = toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const ms2 = getMonthlySummary(jd2.jy, jd2.jm);
    ms2.days.sort((a,b) => a.date.localeCompare(b.date)).forEach(day => {
      doc.setFontSize(9);
      const dpl = day.profitLoss >= 0 ? 'سود' : 'زیان';
      doc.text(`${day.date}: درآمد=${day.actual.toLocaleString()} | ${dpl}=${Math.abs(day.profitLoss).toLocaleString()}`, pageWidth - rightMargin, y, { align: 'right' });
      y += 5;
      if (y > 190) { doc.addPage(); y = 20; }
    });
  }

  doc.save(`SCDP_Report_${getTodayShamsi().replace(/\//g,'-')}.pdf`);
}

function generateExcelReport() {
  exportExcel();
}

function printReport() {
  window.print();
}

function generateDeptReport(dept) {
  const logs = AppData.dailyLogs.filter(d => d.dept === dept);
  const progress = getPlanProgress().filter(p => p.dept === dept);

  const deptName = departmentNames[dept] || dept;
  let html = `
    <div class="card">
      <div class="card-header">گزارش بخش ${deptName}</div>
      <div class="mb-3"><strong>نام بخش:</strong> ${deptName} (${dept})</div>
      <div class="mb-3"><strong>تعداد فعالیت‌های ثبت شده:</strong> ${logs.length}</div>
      <h4 class="mb-2">پیشرفت اکشن پلن</h4>
      <div class="table-wrap">
        <table>
          <tr><th>فعالیت</th><th>برنامه</th><th>انجام شده</th><th>درصد</th><th>واحد</th></tr>`;
  progress.forEach(p => {
    const pct = p.plan > 0 ? ((p.done / p.plan) * 100).toFixed(1) : '0';
    html += `<tr><td>${p.activity}</td><td>${p.plan}</td><td>${p.done}</td><td>${pct}%</td><td>${p.unit}</td></tr>`;
  });
  html += `</table></div></div>`;
  return html;
}

function showModal(title, content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span>${title}</span>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
      </div>
      ${content}
    </div>
  `;
  overlay.addEventListener('click', function(e) { if (e.target === this) this.remove(); });
  document.body.appendChild(overlay);
}

function showToast(msg, type = 'success') {
  const colors = { success: '#0f9d58', error: '#ea4335', info: '#1a73e8', warning: '#f4b400' };
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.background = colors[type] || colors.info;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
