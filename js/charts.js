let chartInstances = {};

function renderDashboardCharts(year, month) {
  const prefix = year && month ? `${year}/${String(month).padStart(2,'0')}` : '';
  const logs = prefix ? AppData.dailyLogs.filter(d => d.date.startsWith(prefix)) : AppData.dailyLogs;

  const dailyMap = {};
  logs.forEach(log => {
    if (!dailyMap[log.date]) dailyMap[log.date] = { date: log.date, actual: 0, plan: 0 };
    const plan = AppData.actionPlan.find(p => p.dept === log.dept && p.activity === log.activity);
    if (plan) dailyMap[log.date].actual += log.qty * plan.unitPrice;
  });

  const dates = Object.keys(dailyMap).sort();
  const actuals = dates.map(d => dailyMap[d].actual);
  const dailyWage = AppData.settings.dailyWageTotal || 40000000;
  const wages = dates.map(() => dailyWage);

  destroyChart('dailyTrendChart');

  const ctx = document.getElementById('dailyTrendChart');
  if (ctx && dates.length) {
    chartInstances.dailyTrendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          { label: 'درآمد واقعی (ریال)', data: actuals, backgroundColor: '#0f9d58', borderRadius: 4 },
          { label: 'هزینه دستمزد (ریال)', data: wages, backgroundColor: '#ea4335', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { family: 'Vazirmatn' } } } },
        scales: {
          x: { ticks: { font: { family: 'Vazirmatn' } } },
          y: { ticks: { font: { family: 'Vazirmatn' }, callback: v => (v / 1000000).toFixed(0) + 'M' } }
        }
      }
    });
  }

  // Dept pie chart
  destroyChart('deptPieChart');
  const deptCtx = document.getElementById('deptPieChart');
  if (deptCtx) {
    const deptData = {};
    logs.forEach(log => {
      if (!deptData[log.dept]) deptData[log.dept] = 0;
      deptData[log.dept] += log.qty;
    });
    const labels = Object.keys(deptData).map(d => departmentNames[d] || d);
    const values = Object.values(deptData);
    const colors = ['#1a73e8','#f4b400','#0f9d58'];
    if (values.length) {
      chartInstances.deptPieChart = new Chart(deptCtx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: colors.slice(0, values.length) }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn', size: 12 } } }
          }
        }
      });
    }
  }

  // Plan progress chart
  destroyChart('progressChart');
  const progCtx = document.getElementById('progressChart');
  if (progCtx) {
    const progress = getPlanProgress();
    const labels = progress.map(p => p.activity);
    const planData = progress.map(p => p.plan);
    const doneData = progress.map(p => p.done);
    if (labels.length) {
      chartInstances.progressChart = new Chart(progCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'برنامه', data: planData, backgroundColor: '#1a73e8', borderRadius: 4 },
            { label: 'انجام شده', data: doneData, backgroundColor: '#0f9d58', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { position: 'top', labels: { font: { family: 'Vazirmatn' } } } },
          scales: {
            x: { ticks: { font: { family: 'Vazirmatn' } } },
            y: { ticks: { font: { family: 'Vazirmatn', size: 10 } } }
          }
        }
      });
    }
  }

  // Profit/Loss chart
  destroyChart('profitChart');
  const profitCtx = document.getElementById('profitChart');
  if (profitCtx && dates.length) {
    const profits = dates.map(d => (dailyMap[d].actual - dailyWage));
    chartInstances.profitChart = new Chart(profitCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'سود/زیان (ریال)', data: profits,
          borderColor: '#1a73e8', backgroundColor: 'rgba(26,115,232,.1)',
          fill: true, tension: .4, pointBackgroundColor: profits.map(v => v >= 0 ? '#0f9d58' : '#ea4335')
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Vazirmatn' } } }
        },
        scales: {
          x: { ticks: { font: { family: 'Vazirmatn' } } },
          y: { ticks: { font: { family: 'Vazirmatn' }, callback: v => (v / 1000000).toFixed(0) + 'M' } }
        }
      }
    });
  }
}

function destroyChart(name) {
  if (chartInstances[name]) {
    chartInstances[name].destroy();
    delete chartInstances[name];
  }
}
