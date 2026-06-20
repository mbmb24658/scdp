const departments = ['Electrical', 'Telecome', 'EARTH'];
const departmentNames = { Electrical: 'برق', Telecome: 'مخابرات', EARTH: 'ارتینگ' };

const defaultActivities = [
  { id:1, dept:'Electrical', main:'Electrical', sub:'Support Fabrication' },
  { id:2, dept:'Electrical', main:'Electrical', sub:'Lights Pole' },
  { id:3, dept:'Electrical', main:'Electrical', sub:'Lighting Fixture' },
  { id:4, dept:'Electrical', main:'Electrical', sub:'Junction Box' },
  { id:5, dept:'Electrical', main:'Electrical', sub:'Secondary Cable Tray & Ladders' },
  { id:6, dept:'Electrical', main:'Electrical', sub:'Secondary Cable Pulling' },
  { id:7, dept:'Electrical', main:'Electrical', sub:'Small Power' },
  { id:8, dept:'Electrical', main:'Electrical', sub:'Gland & Termination' },
  { id:9, dept:'Telecome', main:'Telecome', sub:'Support Fabrication' },
  { id:10, dept:'Telecome', main:'Telecome', sub:'Secondary Cable Tray & Ladders' },
  { id:11, dept:'Telecome', main:'Telecome', sub:'Secondary Cable Pulling' },
  { id:12, dept:'Telecome', main:'Telecome', sub:'Junction Box' },
  { id:13, dept:'Telecome', main:'Telecome', sub:'Conduit Any Size With All Acc.' },
  { id:14, dept:'Telecome', main:'Telecome', sub:'Gland & Termination' },
  { id:15, dept:'EARTH', main:'EARTH', sub:'Earth Cables' },
  { id:16, dept:'EARTH', main:'EARTH', sub:'Dispatcher' },
  { id:17, dept:'EARTH', main:'EARTH', sub:'C CLAMP' },
  { id:18, dept:'EARTH', main:'EARTH', sub:'CABLE SHOE &EARTH Termination' },
  { id:19, dept:'EARTH', main:'EARTH', sub:'CAD WELD' },
  { id:20, dept:'EARTH', main:'EARTH', sub:'نصب EARTH LOG به همراه زنگ زدایی' },
  { id:21, dept:'EARTH', main:'EARTH', sub:'EARTH & BONDING cable tray' },
  { id:22, dept:'EARTH', main:'EARTH', sub:'Earthing Rod' }
];

const itemActivities = [
  'Socket B','Earth Cables','کانکشن Fixture','نصب JB-Non Ex','نصب Base plate 20x20',
  'نصب Base plate 25x25','نصب Fixture','نصب L-JB','نصب Lighting pole','نصب S-JB',
  'Support Fabrication','نصب سینی 100 mm','نصب سینی 15','نصب سینی 50mm',
  'نصب شرود A20','نصب شرود M25','نصب کابل 2.5*3','نصب گلند 421-M20',
  'نصب گلند 453-M20','نصب گلند 453-M25','نصب ناودانی 10','نصب ناودانی 5'
];

const itemToSubMap = {
  'Socket B': { main:'EARTH', sub:'Earth Cables' },
  'Earth Cables': { main:'EARTH', sub:'Earth Cables' },
  'کانکشن Fixture': { main:'Electrical', sub:'Lighting Fixture' },
  'نصب JB-Non Ex': { main:'Electrical', sub:'Junction Box' },
  'نصب Base plate 20x20': { main:'Telecome', sub:'Support Fabrication' },
  'نصب Base plate 25x25': { main:'Electrical', sub:'Support Fabrication' },
  'نصب Fixture': { main:'Electrical', sub:'Lighting Fixture' },
  'نصب L-JB': { main:'Telecome', sub:'Junction Box' },
  'نصب Lighting pole': { main:'Electrical', sub:'Lights Pole' },
  'نصب S-JB': { main:'Electrical', sub:'Junction Box' },
  'Support Fabrication': { main:'Electrical', sub:'Support Fabrication' },
  'نصب سینی 100 mm': { main:'Electrical', sub:'Secondary Cable Tray & Ladders' },
  'نصب سینی 15': { main:'Telecome', sub:'Secondary Cable Tray & Ladders' },
  'نصب سینی 50mm': { main:'Telecome', sub:'Secondary Cable Tray & Ladders' },
  'نصب شرود A20': { main:'Electrical', sub:'Gland & Termination' },
  'نصب شرود M25': { main:'Electrical', sub:'Gland & Termination' },
  'نصب کابل 2.5*3': { main:'Electrical', sub:'Secondary Cable Pulling' },
  'نصب گلند 421-M20': { main:'Electrical', sub:'Gland & Termination' },
  'نصب گلند 453-M20': { main:'Telecome', sub:'Gland & Termination' },
  'نصب گلند 453-M25': { main:'Telecome', sub:'Gland & Termination' },
  'نصب ناودانی 10': { main:'Electrical', sub:'Secondary Cable Tray & Ladders' },
  'نصب ناودانی 5': { main:'Telecome', sub:'Secondary Cable Tray & Ladders' }
};

const roleWages = {
  'سرپرست کارگاه': 0,'کارشناس برنامه ریزی و کنترل پروژه': 0,
  'سرپرست اجرا': 0,'انباردار': 0,'استادکار': 0,'اداری': 0,'کمکی': 0,'کابل کش': 0
};

let AppData = {
  actionPlan: [],
  dailyLogs: [],
  personnel: [],
  attendance: {},
  settings: { dailyWageTotal: 40000000, month: '', year: '' }
};

function getTodayShamsi() {
  const d = new Date();
  const jd = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${jd.jy}/${String(jd.jm).padStart(2,'0')}/${String(jd.jd).padStart(2,'0')}`;
}

function toJalaali(gy, gm, gd) {
  const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + ~~((gy + 3) / 4) - ~~((gy + 99) / 100) + ~~((gy + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * ~~(days / 12053));
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) { jy += ~~((days - 1) / 365); days = (days - 1) % 365; }
  let jm = (days < 186) ? 1 + ~~(days / 31) : 7 + ~~((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

function toGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gd = days % 30 + 1;
  let gm = 1;
  let gy = jy;
  // simplified - for display only
  return `${gy}/${String(gm).padStart(2,'0')}/${String(gd).padStart(2,'0')}`;
}

function calcJalaaliMonthDays(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return (jy % 4 === 3) ? 30 : 29;
}

function getJalaaliMonthName(jm) {
  const names = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  return names[jm - 1] || '';
}

function saveData() {
  try {
    localStorage.setItem('scdpAppData', JSON.stringify(AppData));
  } catch(e) {}
}

function loadData() {
  try {
    const raw = localStorage.getItem('scdpAppData');
    if (raw) {
      const parsed = JSON.parse(raw);
      AppData = { ...AppData, ...parsed };
    }
  } catch(e) {}
}

function exportExcel() {
  const wb = XLSX.utils.book_new();
  const sheets = {};

  sheets['ActionPlan'] = [
    ['بخش اجرایی','نام فعالیت','مقدار','واحد','قیمت واحد','قیمت کل'],
    ...AppData.actionPlan.map(a => [a.dept, a.activity, a.qty, a.unit, a.unitPrice, a.totalPrice])
  ];
  sheets['DailyLogs'] = [
    ['تاریخ','بخش','MainActivity','SubActivity','نام فعالیت','مقدار','واحد','توضیحات'],
    ...AppData.dailyLogs.map(d => [d.date, d.dept, d.mainActivity, d.subActivity, d.activity, d.qty, d.unit, d.note || ''])
  ];
  sheets['Personnel'] = [
    ['عنوان شغلی','نام و نام خانوادگی','دستمزد روزانه','نوع قرارداد','فعال'],
    ...AppData.personnel.map(p => [p.role, p.name, p.wage, p.contractType || 'رسمی', p.active ? 'بله' : 'خیر'])
  ];
  sheets['Attendance'] = [
    ['تاریخ','نام','عنوان شغلی','وضعیت'],
    ...Object.entries(AppData.attendance).flatMap(([date, records]) =>
      records.map(r => [date, r.name, r.role, r.status])
    )
  ];
  sheets['Settings'] = [
    ['کلید','مقدار'],
    ['dailyWageTotal', AppData.settings.dailyWageTotal],
    ['month', AppData.settings.month],
    ['year', AppData.settings.year]
  ];

  Object.entries(sheets).forEach(([name, data]) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = data[0] ? data[0].map(() => ({ wch: 25 })) : [];
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, `SCDP_Data_${getTodayShamsi().replace(/\//g,'-')}.xlsx`);
}

function importExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        if (wb.SheetNames.includes('ActionPlan')) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets['ActionPlan'], { header: 1 });
          if (data.length > 1) {
            AppData.actionPlan = data.slice(1).filter(r => r[0]).map(r => ({
              dept: r[0], activity: r[1], qty: Number(r[2]) || 0,
              unit: r[3] || 'NO.', unitPrice: Number(r[4]) || 0, totalPrice: Number(r[5]) || 0
            }));
          }
        }
        if (wb.SheetNames.includes('DailyLogs')) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets['DailyLogs'], { header: 1 });
          if (data.length > 1) {
            AppData.dailyLogs = data.slice(1).filter(r => r[0]).map(r => ({
              date: r[0], dept: r[1], mainActivity: r[2], subActivity: r[3],
              activity: r[4], qty: Number(r[5]) || 0, unit: r[6] || 'NO.', note: r[7] || ''
            }));
          }
        }
        if (wb.SheetNames.includes('Personnel')) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets['Personnel'], { header: 1 });
          if (data.length > 1) {
            AppData.personnel = data.slice(1).filter(r => r[0]).map(r => ({
              role: r[0], name: r[1] || '', wage: Number(r[2]) || 0,
              contractType: r[3] || 'رسمی', active: (r[4] || 'بله') === 'بله'
            }));
          }
        }
        if (wb.SheetNames.includes('Attendance')) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets['Attendance'], { header: 1 });
          if (data.length > 1) {
            AppData.attendance = {};
            data.slice(1).filter(r => r[0]).forEach(r => {
              if (!AppData.attendance[r[0]]) AppData.attendance[r[0]] = [];
              AppData.attendance[r[0]].push({ name: r[1], role: r[2], status: r[3] });
            });
          }
        }
        if (wb.SheetNames.includes('Settings')) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets['Settings'], { header: 1 });
          data.slice(1).filter(r => r[0]).forEach(r => {
            if (r[0] === 'dailyWageTotal') AppData.settings.dailyWageTotal = Number(r[1]) || 40000000;
            if (r[0] === 'month') AppData.settings.month = r[1] || '';
            if (r[0] === 'year') AppData.settings.year = r[1] || '';
          });
        }
        saveData();
        resolve(true);
      } catch(err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

function getDeptSummary(dateFrom, dateTo) {
  const logs = AppData.dailyLogs.filter(d => (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo));
  const summary = {};
  departments.forEach(d => { summary[d] = { qty: 0, count: 0, activities: {} }; });
  logs.forEach(log => {
    const d = log.dept;
    if (!summary[d]) return;
    summary[d].qty += log.qty;
    summary[d].count++;
    if (!summary[d].activities[log.activity]) summary[d].activities[log.activity] = 0;
    summary[d].activities[log.activity] += log.qty;
  });
  return summary;
}

function getPlanProgress() {
  const planMap = {};
  AppData.actionPlan.forEach(p => {
    const key = `${p.dept}|${p.activity}`;
    planMap[key] = { plan: p.qty, dept: p.dept, activity: p.activity, unit: p.unit, unitPrice: p.unitPrice, totalPrice: p.totalPrice, done: 0 };
  });
  AppData.dailyLogs.forEach(log => {
    const key = `${log.dept}|${log.activity}`;
    if (planMap[key]) planMap[key].done += log.qty;
  });
  return Object.values(planMap);
}

function calcDailyProfitLoss(date) {
  const logs = AppData.dailyLogs.filter(d => d.date === date);
  let actualValue = 0;
  logs.forEach(log => {
    const plan = AppData.actionPlan.find(p => p.dept === log.dept && p.activity === log.activity);
    if (plan && plan.unitPrice) {
      actualValue += log.qty * plan.unitPrice;
    }
  });
  const totalWage = AppData.settings.dailyWageTotal || 40000000;
  return { actualValue, totalWage, profitLoss: actualValue - totalWage };
}

function getMonthlySummary(year, month) {
  const prefix = `${year}/${String(month).padStart(2,'0')}`;
  const logs = AppData.dailyLogs.filter(d => d.date.startsWith(prefix));
  const days = {};
  let totalActual = 0, totalWages = 0;
  logs.forEach(log => {
    if (!days[log.date]) days[log.date] = { date: log.date, actual: 0, wage: 0, logs: [] };
    const plan = AppData.actionPlan.find(p => p.dept === log.dept && p.activity === log.activity);
    const value = plan ? log.qty * plan.unitPrice : 0;
    days[log.date].actual += value;
    days[log.date].logs.push(log);
  });
  Object.keys(days).forEach(d => {
    const pl = calcDailyProfitLoss(d);
    days[d].wage = pl.totalWage;
    days[d].profitLoss = days[d].actual - days[d].wage;
    totalActual += days[d].actual;
    totalWages += days[d].wage;
  });
  return { days: Object.values(days), totalActual, totalWages, profitLoss: totalActual - totalWages };
}

function getPlanTotalValue() {
  return AppData.actionPlan.reduce((s, p) => s + (p.totalPrice || 0), 0);
}

function getActualTotalValue(dateFrom, dateTo) {
  let total = 0;
  const logs = AppData.dailyLogs.filter(d => (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo));
  logs.forEach(log => {
    const plan = AppData.actionPlan.find(p => p.dept === log.dept && p.activity === log.activity);
    if (plan) total += log.qty * plan.unitPrice;
  });
  return total;
}
