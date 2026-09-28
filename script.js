// --- تهيئة البيانات (Mock Data & LocalStorage & database.json) ---
const DB_KEY = 'PropertyManagementSystemDB';
const DB_FILE_NAME = 'database.json';

// ─── بيانات نموذجية افتراضية ────────────────────────────────────────────────
const mockData = {
    properties: [
        { id: 1, name: "عمارة الياسمين", address: "شارع النيل - القاهرة", type: "عمارة", notes: "عمارة سكنية ممتازة", created_at: "2026-01-01", updated_at: "2026-01-01" },
        { id: 2, name: "مول الهدى", address: "المهندسين", type: "عقار تجاري", notes: "", created_at: "2026-01-01", updated_at: "2026-01-01" }
    ],
    units: [
        { id: 1, propertyId: 1, number: "شقة 101", floor: "1", type: "شقة", status: "مؤجرة", area: null, notes: "", created_at: "2026-01-01", updated_at: "2026-01-01" },
        { id: 2, propertyId: 1, number: "شقة 102", floor: "1", type: "شقة", status: "فارغة", area: null, notes: "", created_at: "2026-01-01", updated_at: "2026-01-01" },
        { id: 3, propertyId: 2, number: "محل 1", floor: "الأرضي", type: "محل", status: "مؤجرة", area: null, notes: "", created_at: "2026-01-01", updated_at: "2026-01-01" },
        { id: 4, propertyId: 2, number: "محل 2", floor: "الأرضي", type: "محل", status: "تحت الصيانة", area: null, notes: "", created_at: "2026-01-01", updated_at: "2026-01-01" }
    ],
    tenants: [
        { id: 1, unitId: 1, name: "أحمد محمود", phone: "01012345678", nationalId: "290123456789", email: "", startDate: "2026-01-01", endDate: "2026-12-31", rent: 3000, dueDay: 5, insurance: 3000, notes: "", created_at: "2026-01-01", updated_at: "2026-01-01" },
        { id: 2, unitId: 3, name: "شركة الأمل للتجارة", phone: "01198765432", nationalId: "", email: "", startDate: "2025-06-01", endDate: "2026-09-01", rent: 10000, dueDay: 1, insurance: 20000, notes: "", created_at: "2025-06-01", updated_at: "2025-06-01" }
    ],
    rents: [
        { id: 1, tenantId: 1, month: "2026-01", status: "مدفوع", paidDate: "2026-01-05", amount: 3000, notes: "", created_at: "2026-01-05", updated_at: "2026-01-05" },
        { id: 2, tenantId: 1, month: "2026-02", status: "مدفوع", paidDate: "2026-02-04", amount: 3000, notes: "", created_at: "2026-02-04", updated_at: "2026-02-04" },
        { id: 3, tenantId: 2, month: "2026-06", status: "مدفوع", paidDate: "2026-06-02", amount: 10000, notes: "", created_at: "2026-06-02", updated_at: "2026-06-02" },
        { id: 4, tenantId: 2, month: "2026-07", status: "غير مدفوع", paidDate: null, amount: 10000, notes: "", created_at: "2026-07-01", updated_at: "2026-07-01" }
    ],
    bills: [
        { id: 1, unitId: 1, type: "كهرباء", amount: 450, dueDate: "2026-08-10", status: "غير مدفوعة", tenantId: 1, paidDate: null, notes: "", created_at: "2026-08-01", updated_at: "2026-08-01" },
        { id: 2, unitId: 3, type: "مياه", amount: 200, dueDate: "2026-07-20", status: "غير مدفوعة", tenantId: 2, paidDate: null, notes: "", created_at: "2026-07-01", updated_at: "2026-07-01" }
    ]
};

// ─── تحميل البيانات من localStorage ────────────────────────────────────────
let db = JSON.parse(localStorage.getItem(DB_KEY));
if (!db) {
    db = mockData;
    saveData();
}

// ─── ترقيع بيانات قديمة لضمان توافق الحقول الجديدة ──────────────────────────
db.properties.forEach(p => {
    if (p.notes === undefined) p.notes = "";
    if (p.created_at === undefined) p.created_at = "2026-01-01";
    if (p.updated_at === undefined) p.updated_at = new Date().toISOString().split('T')[0];
});
db.bills.forEach(b => {
    if (b.notes === undefined) b.notes = "";
    if (b.paidDate === undefined) b.paidDate = null;
    if (b.created_at === undefined) b.created_at = "2026-01-01";
    if (b.updated_at === undefined) b.updated_at = new Date().toISOString().split('T')[0];
});
db.rents.forEach(r => {
    if (r.amount === undefined) {
        const tenant = db.tenants.find(t => t.id == r.tenantId);
        r.amount = tenant ? tenant.rent : 0;
    }
    if (r.notes === undefined) r.notes = "";
});
db.tenants.forEach(t => {
    if (t.email === undefined) t.email = "";
    if (t.created_at === undefined) t.created_at = t.startDate || "2026-01-01";
    if (t.updated_at === undefined) t.updated_at = new Date().toISOString().split('T')[0];
});
db.units.forEach(u => {
    if (u.area === undefined) u.area = null;
    if (u.notes === undefined) u.notes = "";
    if (u.created_at === undefined) u.created_at = "2026-01-01";
    if (u.updated_at === undefined) u.updated_at = new Date().toISOString().split('T')[0];
});

// ─── حفظ البيانات في localStorage + تزامن مع database.json ─────────────────
function saveData() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    calculateAlerts();
    // تزامن تلقائي مخفي في الخلفية مع database.json
    _scheduleDatabaseSync();
}

// ─── نظام التزامن التلقائي مع ملف database.json ──────────────────────────────
let _syncTimer = null;
function _scheduleDatabaseSync() {
    // تأجير التزامن 3 ثواني لتجنب الحفظ المتكرر
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
        _updateDatabaseFile();
    }, 3000);
}

function _updateDatabaseFile() {
    // تحديث lastUpdated في الذاكرة للتتبع
    db._lastSyncDate = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/**
 * syncDatabaseToFile() - تصدير قاعدة البيانات الكاملة كملف database.json
 * يُستدعى من زر "نسخ احتياطي" أو يدوياً
 */
function syncDatabaseToFile() {
    const exportData = {
        _metadata: {
            system: "نظام إدارة العقارات والممتلكات",
            version: "1.0.0",
            created: db._createdDate || "2026-09-26",
            last_updated: new Date().toISOString().split('T')[0],
            last_sync: new Date().toISOString(),
            description: "قاعدة بيانات نظام إدارة العقارات - تحتوي على جميع البيانات",
            schema_version: "1.0",
            records_count: {
                properties: db.properties.length,
                units: db.units.length,
                tenants: db.tenants.length,
                rents: db.rents.length,
                bills: db.bills.length
            }
        },
        properties: db.properties,
        units: db.units,
        tenants: db.tenants,
        rents: db.rents,
        bills: db.bills,
        _schema: {
            properties: {
                description: "جدول العقارات الرئيسية",
                fields: { id: "integer", name: "string", address: "string", type: "string", notes: "string", created_at: "date", updated_at: "date" }
            },
            units: {
                description: "جدول الوحدات داخل كل عقار",
                fields: { id: "integer", propertyId: "integer → properties.id", number: "string", floor: "string", type: "string", status: "مؤجرة|فارغة|تحت الصيانة", area: "number|null", notes: "string" }
            },
            tenants: {
                description: "جدول المستأجرين مع بيانات العقد",
                fields: { id: "integer", unitId: "integer → units.id", name: "string", phone: "string", nationalId: "string", email: "string", startDate: "date", endDate: "date", rent: "number", dueDay: "integer 1-31", insurance: "number", notes: "string" }
            },
            rents: {
                description: "جدول سجلات دفع الإيجار الشهري",
                fields: { id: "integer", tenantId: "integer → tenants.id", month: "YYYY-MM", status: "مدفوع|غير مدفوع", paidDate: "date|null", amount: "number", notes: "string" }
            },
            bills: {
                description: "جدول فواتير المرافق",
                fields: { id: "integer", unitId: "integer → units.id", tenantId: "integer → tenants.id", type: "كهرباء|مياه|غاز|صيانة|أخرى", amount: "number", dueDate: "date", status: "مدفوعة|غير مدفوعة", paidDate: "date|null", notes: "string" }
            }
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = DB_FILE_NAME;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير قاعدة البيانات database.json بنجاح!', 'success');
}

/**
 * importFromDatabaseFile(event) - استيراد البيانات من ملف database.json
 */
function importFromDatabaseFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            // التحقق من صحة البنية
            const required = ['properties', 'units', 'tenants', 'rents', 'bills'];
            const missing = required.filter(k => !imported[k]);
            if (missing.length) {
                showToast(`ملف غير صالح! حقول مفقودة: ${missing.join(', ')}`, 'error');
                return;
            }
            if (!confirm(`سيتم استبدال جميع البيانات الحالية ببيانات الملف المستورد.\nهل أنت متأكد؟`)) return;
            db.properties = imported.properties;
            db.units = imported.units;
            db.tenants = imported.tenants;
            db.rents = imported.rents;
            db.bills = imported.bills;
            db._createdDate = imported._metadata?.created || "2026-09-26";
            saveData();
            navigateTo('dashboard', document.querySelector('.sidebar-menu li'));
            showToast('تم استيراد قاعدة البيانات بنجاح!', 'success');
        } catch (err) {
            showToast('حدث خطأ في قراءة الملف. تأكد أنه ملف JSON صحيح.', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// --- تنسيقات مساعدة ---
function fmtMoney(n) {
    return Number(n || 0).toLocaleString('ar-EG');
}
function monthLabel(mStr) {
    const [y, m] = mStr.split('-');
    const names = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return `${names[parseInt(m) - 1]} ${y}`;
}
function last6Months() {
    const arr = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
        const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
        arr.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
}

// --- نظام التنبيهات الديناميكي ---
let systemAlerts = [];

function calculateAlerts() {
    systemAlerts = [];
    const today = new Date();

    // 1. العقود المقاربة على الانتهاء
    db.tenants.forEach(tenant => {
        const endDate = new Date(tenant.endDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const unit = db.units.find(u => u.id == tenant.unitId);

        if (diffDays > 0 && diffDays <= 90) {
            systemAlerts.push({
                type: 'contract', severity: diffDays <= 30 ? 'danger' : 'warning',
                title: 'عقد قارب على الانتهاء',
                message: `عقد المستأجر ${tenant.name} (${unit ? unit.number : ''}) سينتهي خلال ${diffDays} يوماً.`,
                tenantId: tenant.id
            });
        }
    });

    // 2. الفواتير المتأخرة
    db.bills.forEach(bill => {
        if (bill.status === "غير مدفوعة") {
            const dueDate = new Date(bill.dueDate);
            const unit = db.units.find(u => u.id == bill.unitId);
            if (dueDate < today) {
                systemAlerts.push({
                    type: 'bill', severity: 'danger', title: 'فاتورة متأخرة',
                    message: `🚨 فاتورة ${bill.type} بقيمة ${bill.amount} ج للوحدة ${unit ? unit.number : ''} تجاوزت تاريخ الاستحقاق.`
                });
            } else {
                systemAlerts.push({
                    type: 'bill', severity: 'warning', title: 'فاتورة غير مدفوعة',
                    message: `⚡ فاتورة ${bill.type} للوحدة ${unit ? unit.number : ''} مستحقة قريباً.`
                });
            }
        }
    });

    // 3. متأخرات الإيجار
    db.tenants.forEach(tenant => {
        const unit = db.units.find(u => u.id == tenant.unitId);
        const start = new Date(tenant.startDate);
        let unpaidCount = 0;

        for (let d = new Date(start); d <= today; d.setMonth(d.getMonth() + 1)) {
            const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const rentRecord = db.rents.find(r => r.tenantId == tenant.id && r.month === mStr);
            if (!rentRecord || rentRecord.status === "غير مدفوع") {
                unpaidCount++;
            }
        }

        if (unpaidCount >= 2) {
            systemAlerts.push({
                type: 'rent', severity: 'danger', title: 'متأخرات إيجار خطيرة',
                message: `🔴 المستأجر ${tenant.name} (${unit ? unit.number : ''}) متأخر شهرين أو أكثر في الإيجار.`,
                tenantId: tenant.id
            });
        } else if (unpaidCount === 1) {
            systemAlerts.push({
                type: 'rent', severity: 'warning', title: 'تأخير في الإيجار',
                message: `🟡 المستأجر ${tenant.name} متأخر شهر واحد في الإيجار.`,
                tenantId: tenant.id
            });
        }
    });

    const sc = document.getElementById('sidebarAlertsCount');
    const tc = document.getElementById('topbarAlertsCount');
    if (sc) sc.innerText = systemAlerts.length;
    if (tc) tc.innerText = systemAlerts.length;
}

// --- التنقل بين الصفحات ---
function navigateTo(page, element) {
    if (element) {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        element.classList.add('active');
    }

    const container = document.getElementById('app-container');
    container.innerHTML = '';

    switch (page) {
        case 'dashboard': renderDashboard(container); break;
        case 'properties': renderProperties(container); break;
        case 'units': renderUnits(container); break;
        case 'tenants': renderTenants(container); break;
        case 'rents': renderRents(container); break;
        case 'bills': renderBills(container); break;
        case 'reports': renderReports(container); break;
        case 'stocks': renderStocks(container); break;
        case 'alerts': renderAlerts(container); break;
    }

    hideSearchResults();
    if (window.innerWidth <= 992) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// --- البحث الشامل ---
function handleSearch() {
    const q = document.getElementById('globalSearch').value.trim().toLowerCase();
    const resultsBox = document.getElementById('searchResults');
    if (!q) { hideSearchResults(); return; }

    const tenantMatches = db.tenants.filter(t =>
        t.name.toLowerCase().includes(q) || (t.phone || '').includes(q) || (t.nationalId || '').includes(q)
    );
    const unitMatches = db.units.filter(u => u.number.toLowerCase().includes(q));
    const propMatches = db.properties.filter(p => p.name.toLowerCase().includes(q));

    let html = '';
    if (tenantMatches.length) {
        html += `<div class="sr-group-title">مستأجرون</div>`;
        html += tenantMatches.map(t => `
            <div class="sr-item" onclick="viewTenantDetails(${t.id})">
                <span><i class="fa-solid fa-user"></i> ${t.name}</span>
                <small class="text-muted">${t.phone || ''}</small>
            </div>`).join('');
    }
    if (unitMatches.length) {
        html += `<div class="sr-group-title">وحدات</div>`;
        html += unitMatches.map(u => `
            <div class="sr-item" onclick="navigateTo('units'); hideSearchResults();">
                <span><i class="fa-solid fa-door-open"></i> ${u.number}</span>
                <small class="text-muted">${u.status}</small>
            </div>`).join('');
    }
    if (propMatches.length) {
        html += `<div class="sr-group-title">عقارات</div>`;
        html += propMatches.map(p => `
            <div class="sr-item" onclick="navigateTo('properties'); hideSearchResults();">
                <span><i class="fa-solid fa-building"></i> ${p.name}</span>
                <small class="text-muted">${p.type}</small>
            </div>`).join('');
    }
    if (!html) html = `<div class="sr-empty">لا توجد نتائج مطابقة لـ "${q}"</div>`;

    resultsBox.innerHTML = html;
    resultsBox.classList.add('active');
}
function hideSearchResults() {
    const box = document.getElementById('searchResults');
    if (box) { box.classList.remove('active'); box.innerHTML = ''; }
}

// --- الواجهات (Renderers) ---

function renderDashboard(container) {
    calculateAlerts();

    const totalProperties = db.properties.length;
    const totalUnits = db.units.length;
    const rentedUnits = db.units.filter(u => u.status === "مؤجرة").length;
    const emptyUnits = db.units.filter(u => u.status === "فارغة").length;

    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    let expectedRent = 0;
    let collectedRent = 0;

    db.tenants.forEach(t => expectedRent += parseInt(t.rent));
    db.rents.filter(r => r.month === currentMonthStr && r.status === "مدفوع").forEach(r => {
        const t = db.tenants.find(t => t.id == r.tenantId);
        if (t) collectedRent += parseInt(t.rent);
    });

    let alertsHtml = systemAlerts.slice(0, 5).map(a => `
        <div class="alert-item ${a.severity}">
            <i class="fa-solid ${a.type === 'rent' ? 'fa-money-bill' : (a.type === 'bill' ? 'fa-bolt' : 'fa-calendar')} alert-icon"></i>
            <div class="alert-content">
                <h4>${a.title}</h4>
                <p>${a.message}</p>
            </div>
        </div>
    `).join('');

    if (!alertsHtml) alertsHtml = `<p class="text-muted">لا توجد تنبيهات حالياً.</p>`;

    container.innerHTML = `
        <div class="page-header">
            <h2>لوحة التحكم (Dashboard)</h2>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <i class="fa-solid fa-building stat-icon"></i>
                <div class="stat-details"><h4>إجمالي العقارات</h4><p>${totalProperties}</p></div>
            </div>
            <div class="stat-card green">
                <i class="fa-solid fa-door-open stat-icon"></i>
                <div class="stat-details"><h4>الوحدات المؤجرة</h4><p>${rentedUnits} <span style="font-size:1rem;font-weight:normal;color:#6b7280">من ${totalUnits}</span></p></div>
            </div>
            <div class="stat-card orange">
                <i class="fa-solid fa-door-closed stat-icon"></i>
                <div class="stat-details"><h4>الوحدات الفارغة</h4><p>${emptyUnits}</p></div>
            </div>
            <div class="stat-card green">
                <i class="fa-solid fa-wallet stat-icon"></i>
                <div class="stat-details"><h4>محصلات الشهر</h4><p>${fmtMoney(collectedRent)} ج <span style="font-size:0.9rem;font-weight:normal;color:#6b7280">من ${fmtMoney(expectedRent)}</span></p></div>
            </div>
        </div>
        <div class="charts-grid">
            <div class="card-panel">
                <div class="card-header"><h3>التحصيل الشهري (آخر 6 أشهر)</h3></div>
                <div class="chart-box"><canvas id="dashRevenueChart"></canvas></div>
            </div>
            <div class="card-panel">
                <div class="card-header"><h3>حالة إشغال الوحدات</h3></div>
                <div class="chart-box"><canvas id="dashOccupancyChart"></canvas></div>
            </div>
        </div>
        <div class="card-panel">
            <div class="card-header">
                <h3>أهم التنبيهات</h3>
                <button class="btn btn-sm btn-outline" onclick="navigateTo('alerts', document.querySelectorAll('.sidebar-menu li')[8])">عرض الكل</button>
            </div>
            <div>${alertsHtml}</div>
        </div>
    `;

    renderDashboardCharts();
}

let chartInstances = {};
function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function renderDashboardCharts() {
    const months = last6Months();
    const expectedData = [];
    const collectedData = [];

    months.forEach(m => {
        let expected = 0, collected = 0;
        db.tenants.forEach(t => {
            const start = new Date(t.startDate);
            const [y, mo] = m.split('-').map(Number);
            const monthDate = new Date(y, mo - 1, 1);
            if (start <= monthDate) {
                expected += parseInt(t.rent);
                const rec = db.rents.find(r => r.tenantId == t.id && r.month === m);
                if (rec && rec.status === "مدفوع") collected += parseInt(t.rent);
            }
        });
        expectedData.push(expected);
        collectedData.push(collected);
    });

    destroyChart('dashRevenueChart');
    const ctx1 = document.getElementById('dashRevenueChart');
    if (ctx1) {
        chartInstances['dashRevenueChart'] = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: months.map(monthLabel),
                datasets: [
                    { label: 'المتوقع', data: expectedData, backgroundColor: '#e5e7eb' },
                    { label: 'المحصل', data: collectedData, backgroundColor: '#1e3a8a' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    const rentedUnits = db.units.filter(u => u.status === "مؤجرة").length;
    const emptyUnits = db.units.filter(u => u.status === "فارغة").length;
    const maintUnits = db.units.filter(u => u.status === "تحت الصيانة").length;

    destroyChart('dashOccupancyChart');
    const ctx2 = document.getElementById('dashOccupancyChart');
    if (ctx2) {
        chartInstances['dashOccupancyChart'] = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['مؤجرة', 'فارغة', 'تحت الصيانة'],
                datasets: [{ data: [rentedUnits, emptyUnits, maintUnits], backgroundColor: ['#10b981', '#9ca3af', '#f59e0b'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

function renderProperties(container) {
    let rows = db.properties.map(p => {
        const countUnits = db.units.filter(u => u.propertyId == p.id).length;
        return `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.type}</td>
            <td>${p.address}</td>
            <td>${countUnits} وحدة</td>
            <td>
                <div class="action-icons">
                    <button class="icon-btn" onclick="openEditPropertyModal(${p.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn danger" onclick="deleteProperty(${p.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="page-header">
            <h2>إدارة العقارات</h2>
            <button class="btn btn-primary" onclick="openAddPropertyModal()"><i class="fa-solid fa-plus"></i> إضافة عقار</button>
        </div>
        <div class="card-panel table-responsive">
            <table>
                <thead><tr><th>الاسم</th><th>النوع</th><th>العنوان</th><th>عدد الوحدات</th><th>إجراء</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="5" style="text-align:center">لا توجد عقارات</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function renderUnits(container) {
    let rows = db.units.map(u => {
        const prop = db.properties.find(p => p.id == u.propertyId) || {};
        const tenant = db.tenants.find(t => t.unitId == u.id);
        const statusBadge = u.status === 'مؤجرة' ? 'badge-green' : (u.status === 'فارغة' ? 'badge-gray' : 'badge-orange');

        return `
        <tr>
            <td><strong>${u.number}</strong></td>
            <td>${prop.name || '-'}</td>
            <td>${u.type}</td>
            <td>${u.floor}</td>
            <td><span class="badge ${statusBadge}">${u.status}</span></td>
            <td>${tenant ? tenant.name : '-'}</td>
            <td>
                <div class="action-icons">
                    <button class="icon-btn" onclick="openEditUnitModal(${u.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn danger" onclick="deleteUnit(${u.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="page-header">
            <h2>إدارة الوحدات</h2>
            <button class="btn btn-primary" onclick="openAddUnitModal()"><i class="fa-solid fa-plus"></i> إضافة وحدة</button>
        </div>
        <div class="card-panel table-responsive">
            <table>
                <thead><tr><th>رقم الوحدة</th><th>العقار</th><th>النوع</th><th>الدور</th><th>الحالة</th><th>المستأجر</th><th>إجراء</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="7" style="text-align:center">لا توجد وحدات</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function renderTenants(container) {
    let rows = db.tenants.map(t => {
        const unit = db.units.find(u => u.id == t.unitId) || {};
        const today = new Date();
        const endDate = new Date(t.endDate);
        const expiring = endDate > today && (endDate - today) / (1000 * 60 * 60 * 24) <= 30;
        return `
        <tr>
            <td><strong>${t.name}</strong><br><small class="text-muted">${t.phone}</small></td>
            <td>${unit.number || '-'}</td>
            <td>${fmtMoney(t.rent)} ج</td>
            <td><span class="badge ${expiring ? 'badge-red' : 'badge-gray'}">${t.endDate}</span></td>
            <td>
                <div class="action-icons">
                    <button class="btn btn-sm btn-outline" onclick="viewTenantDetails(${t.id})"><i class="fa-solid fa-eye"></i> تفاصيل</button>
                    <button class="icon-btn" onclick="openEditTenantModal(${t.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn danger" onclick="deleteTenant(${t.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="page-header">
            <h2>إدارة المستأجرين</h2>
            <button class="btn btn-primary" onclick="openAddTenantModal()"><i class="fa-solid fa-plus"></i> إضافة مستأجر</button>
        </div>
        <div class="card-panel table-responsive">
            <table>
                <thead><tr><th>المستأجر</th><th>الوحدة</th><th>الإيجار</th><th>نهاية العقد</th><th>إجراء</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="5" style="text-align:center">لا يوجد مستأجرين</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function renderRents(container) {
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    let rows = db.tenants.map(t => {
        const unit = db.units.find(u => u.id == t.unitId) || {};
        let rentRecord = db.rents.find(r => r.tenantId == t.id && r.month === currentMonthStr);
        let isPaid = rentRecord && rentRecord.status === 'مدفوع';

        return `
        <tr>
            <td><strong>${t.name}</strong></td>
            <td>${unit.number || '-'}</td>
            <td>${currentMonthStr}</td>
            <td>${fmtMoney(t.rent)} ج</td>
            <td><span class="badge ${isPaid ? 'badge-green' : 'badge-red'}">${isPaid ? 'مدفوع' : 'غير مدفوع'}</span></td>
            <td>
                <div class="action-icons">
                ${!isPaid ? `<button class="btn btn-sm btn-success" onclick="markRentPaid(${t.id}, '${currentMonthStr}')"><i class="fa-solid fa-check"></i> تم الدفع</button>` : `<small class="text-muted">تم الدفع في ${rentRecord.paidDate}</small> <button class="icon-btn" onclick="printReceipt(${t.id}, '${currentMonthStr}')" title="طباعة إيصال"><i class="fa-solid fa-print"></i></button>`}
                </div>
            </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="page-header">
            <h2>تحصيل الإيجارات (${monthLabel(currentMonthStr)})</h2>
        </div>
        <div class="card-panel table-responsive">
            <table>
                <thead><tr><th>المستأجر</th><th>الوحدة</th><th>الشهر</th><th>القيمة</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="6" style="text-align:center">لا يوجد مستأجرين</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function renderBills(container) {
    let rows = db.bills.map(b => {
        const unit = db.units.find(u => u.id == b.unitId) || {};
        const isPaid = b.status === "مدفوعة";
        return `
        <tr>
            <td><strong>${b.type}</strong></td>
            <td>${unit.number || '-'}</td>
            <td>${fmtMoney(b.amount)} ج</td>
            <td>${b.dueDate}</td>
            <td><span class="badge ${isPaid ? 'badge-green' : 'badge-red'}">${b.status}</span></td>
            <td>
                <div class="action-icons">
                    ${!isPaid ? `<button class="btn btn-sm btn-success" onclick="markBillPaid(${b.id})"><i class="fa-solid fa-check"></i> دفع</button>` : `<button class="icon-btn" onclick="printBillInvoice(${b.id})" title="طباعة فاتورة"><i class="fa-solid fa-print"></i></button>`}
                    <button class="icon-btn" onclick="openEditBillModal(${b.id})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn danger" onclick="deleteBill(${b.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div class="page-header">
            <h2>إدارة الفواتير والمرافق</h2>
            <button class="btn btn-primary" onclick="openAddBillModal()"><i class="fa-solid fa-plus"></i> إضافة فاتورة</button>
        </div>
        <div class="card-panel table-responsive">
            <table>
                <thead><tr><th>النوع</th><th>الوحدة</th><th>القيمة</th><th>الاستحقاق</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="6" style="text-align:center">لا توجد فواتير</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

function renderAlerts(container) {
    calculateAlerts();
    let alertsHtml = systemAlerts.map(a => `
        <div class="alert-item ${a.severity}">
            <i class="fa-solid ${a.type === 'rent' ? 'fa-money-bill' : (a.type === 'bill' ? 'fa-bolt' : 'fa-calendar')} alert-icon"></i>
            <div class="alert-content">
                <h4>${a.title}</h4>
                <p>${a.message}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="page-header">
            <h2>مركز التنبيهات</h2>
        </div>
        <div class="card-panel">
            ${alertsHtml || '<p style="text-align:center; padding:20px; color:var(--text-muted)">لا توجد أي تنبيهات. كل شيء على ما يرام!</p>'}
        </div>
    `;
}

// --- صفحة التقارير والتحليلات ---
function renderReports(container) {
    const totalTenants = db.tenants.length;
    const totalExpected = db.tenants.reduce((s, t) => s + parseInt(t.rent), 0);
    const unpaidBillsTotal = db.bills.filter(b => b.status === "غير مدفوعة").reduce((s, b) => s + parseInt(b.amount), 0);
    const occupancyRate = db.units.length ? Math.round((db.units.filter(u => u.status === "مؤجرة").length / db.units.length) * 100) : 0;

    container.innerHTML = `
        <div class="page-header">
            <h2>التقارير والتحليلات</h2>
            <div class="action-icons">
                <button class="btn btn-outline" onclick="exportTenantsExcel()"><i class="fa-solid fa-file-excel"></i> تصدير المستأجرين</button>
                <button class="btn btn-outline" onclick="exportRentsExcel()"><i class="fa-solid fa-file-excel"></i> تصدير الإيجارات</button>
            </div>
        </div>
        <div class="report-summary-grid">
            <div class="mini-stat"><h5>إجمالي الإيجار الشهري المتوقع</h5><p>${fmtMoney(totalExpected)} ج</p></div>
            <div class="mini-stat"><h5>عدد المستأجرين</h5><p>${totalTenants}</p></div>
            <div class="mini-stat"><h5>معدل الإشغال</h5><p>${occupancyRate}%</p></div>
            <div class="mini-stat"><h5>فواتير غير محصلة</h5><p>${fmtMoney(unpaidBillsTotal)} ج</p></div>
        </div>
        <div class="charts-grid">
            <div class="card-panel">
                <div class="card-header"><h3>اتجاه التحصيل (6 أشهر)</h3></div>
                <div class="chart-box"><canvas id="repRevenueChart"></canvas></div>
            </div>
            <div class="card-panel">
                <div class="card-header"><h3>الإيجار حسب المستأجر</h3></div>
                <div class="chart-box"><canvas id="repTenantChart"></canvas></div>
            </div>
        </div>
    `;

    const months = last6Months();
    const collectedData = months.map(m => {
        let collected = 0;
        db.rents.filter(r => r.month === m && r.status === "مدفوع").forEach(r => {
            const t = db.tenants.find(t => t.id == r.tenantId);
            if (t) collected += parseInt(t.rent);
        });
        return collected;
    });

    destroyChart('repRevenueChart');
    const ctxA = document.getElementById('repRevenueChart');
    if (ctxA) {
        chartInstances['repRevenueChart'] = new Chart(ctxA, {
            type: 'line',
            data: {
                labels: months.map(monthLabel),
                datasets: [{ label: 'محصل', data: collectedData, borderColor: '#1e3a8a', backgroundColor: 'rgba(30,58,138,0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    destroyChart('repTenantChart');
    const ctxB = document.getElementById('repTenantChart');
    if (ctxB) {
        chartInstances['repTenantChart'] = new Chart(ctxB, {
            type: 'pie',
            data: {
                labels: db.tenants.map(t => t.name),
                datasets: [{ data: db.tenants.map(t => parseInt(t.rent)), backgroundColor: ['#1e3a8a', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'] }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// --- تحليل الأسهم (Stocks Analysis) ---
const STOCKS_KEY = 'PropertyManagementSystemStocks';
const STOCKS_API_KEY = 'PropertyManagementSystemAlphaVantageKey';
const DEFAULT_STOCK_API_KEY = 'X2O3LAK4PVTO071Z';

function getStockWatchlist() {
    return JSON.parse(localStorage.getItem(STOCKS_KEY) || '["AAPL","MSFT","GOOGL"]');
}
function saveStockWatchlist(list) {
    localStorage.setItem(STOCKS_KEY, JSON.stringify(list));
}
function getStockApiKey() {
    const stored = localStorage.getItem(STOCKS_API_KEY);
    return stored !== null ? stored : DEFAULT_STOCK_API_KEY;
}
function saveStockApiKey(key) {
    localStorage.setItem(STOCKS_API_KEY, key);
}

// بيانات تجريبية تُستخدم عند عدم توفر مفتاح API
const DEMO_STOCK_DATA = {
    AAPL: { price: 231.45, change: 1.82, changePercent: 0.79, history: [225, 227, 224, 229, 231, 228, 231.45] },
    MSFT: { price: 512.30, change: -3.10, changePercent: -0.60, history: [520, 517, 515, 510, 508, 515, 512.30] },
    GOOGL: { price: 198.77, change: 2.44, changePercent: 1.24, history: [190, 192, 194, 193, 196, 197, 198.77] },
    AMZN: { price: 236.90, change: 0.55, changePercent: 0.23, history: [232, 234, 235, 233, 236, 235, 236.90] },
    TSLA: { price: 341.20, change: -8.75, changePercent: -2.50, history: [360, 355, 350, 345, 349, 352, 341.20] },
    NVDA: { price: 182.60, change: 4.30, changePercent: 2.41, history: [172, 175, 178, 176, 180, 179, 182.60] }
};

let stocksLoading = false;

function renderStocks(container) {
    const watchlist = getStockWatchlist();
    const apiKey = getStockApiKey();

    container.innerHTML = `
        <div class="page-header">
            <h2>تحليل الأسهم</h2>
            <div class="action-icons">
                <button class="btn btn-outline" onclick="openStockApiKeyModal()"><i class="fa-solid fa-key"></i> ${apiKey ? 'تغيير مفتاح API' : 'إضافة مفتاح API'}</button>
                <button class="btn btn-primary" onclick="openAddStockModal()"><i class="fa-solid fa-plus"></i> إضافة سهم</button>
            </div>
        </div>
        ${!apiKey ? `<div class="alert-item warning" style="margin-bottom:20px">
            <i class="fa-solid fa-triangle-exclamation alert-icon"></i>
            <div class="alert-content">
                <h4>وضع البيانات التجريبية</h4>
                <p>البيانات المعروضة الآن تجريبية وليست حية. للحصول على أسعار حقيقية، أضف مفتاح API مجاني من
                <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener">alphavantage.co</a> (مجاني، بدون بطاقة ائتمان).</p>
            </div>
        </div>` : ''}
        <div class="stats-grid" id="stocksGrid"></div>
        <div class="card-panel">
            <div class="card-header">
                <h3 id="stockChartTitle">حركة السهم</h3>
            </div>
            <div class="chart-box"><canvas id="stockDetailChart"></canvas></div>
        </div>
    `;

    renderStocksGrid(watchlist, apiKey);
}

async function renderStocksGrid(watchlist, apiKey) {
    const grid = document.getElementById('stocksGrid');
    if (!grid) return;

    if (watchlist.length === 0) {
        grid.innerHTML = `<p class="text-muted">لم تتم إضافة أي أسهم بعد.</p>`;
        return;
    }

    grid.innerHTML = watchlist.map(sym => `
        <div class="stat-card" id="stockCard-${sym}" style="cursor:pointer" onclick="showStockChart('${sym}')">
            <i class="fa-solid fa-chart-simple stat-icon"></i>
            <div class="stat-details">
                <h4>${sym} <button class="icon-btn danger" style="width:24px;height:24px;float:left" onclick="event.stopPropagation(); removeStock('${sym}')" title="إزالة"><i class="fa-solid fa-xmark" style="font-size:0.7rem"></i></button></h4>
                <p id="stockPrice-${sym}"><i class="fa-solid fa-spinner fa-spin"></i></p>
            </div>
        </div>
    `).join('');

    for (const sym of watchlist) {
        fetchStockQuote(sym, apiKey);
    }

    // اعرض أول سهم في القائمة تلقائياً
    if (watchlist[0]) showStockChart(watchlist[0]);
}

async function fetchStockQuote(sym, apiKey) {
    const priceEl = document.getElementById(`stockPrice-${sym}`);
    const cardEl = document.getElementById(`stockCard-${sym}`);
    if (!priceEl) return;

    try {
        let price, change, changePercent;
        if (apiKey) {
            const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${apiKey}`);
            const data = await res.json();
            const q = data['Global Quote'];
            if (!q || !q['05. price']) throw new Error('لا توجد بيانات');
            price = parseFloat(q['05. price']);
            change = parseFloat(q['09. change']);
            changePercent = parseFloat((q['10. change percent'] || '0%').replace('%', ''));
        } else {
            const demo = DEMO_STOCK_DATA[sym] || { price: (Math.random() * 300 + 50).toFixed(2), change: 0, changePercent: 0 };
            price = demo.price; change = demo.change; changePercent = demo.changePercent;
        }

        const isUp = change >= 0;
        priceEl.innerHTML = `${fmtMoney(price)} <span style="font-size:0.85rem;font-weight:600;color:${isUp ? '#10b981' : '#ef4444'}">
            <i class="fa-solid ${isUp ? 'fa-caret-up' : 'fa-caret-down'}"></i> ${Math.abs(changePercent).toFixed(2)}%
        </span>`;
        if (cardEl) cardEl.classList.add(isUp ? 'green' : 'red');
    } catch (err) {
        priceEl.innerHTML = `<span style="font-size:0.85rem;color:var(--text-muted)">تعذر الجلب</span>`;
    }
}

async function showStockChart(sym) {
    const apiKey = getStockApiKey();
    const titleEl = document.getElementById('stockChartTitle');
    if (titleEl) titleEl.innerText = `حركة سهم ${sym}`;

    let labels = [];
    let prices = [];

    try {
        if (apiKey) {
            const res = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${sym}&apikey=${apiKey}`);
            const data = await res.json();
            const series = data['Time Series (Daily)'];
            if (!series) throw new Error('لا توجد بيانات تاريخية');
            const dates = Object.keys(series).slice(0, 30).reverse();
            labels = dates;
            prices = dates.map(d => parseFloat(series[d]['4. close']));
        } else {
            const demo = DEMO_STOCK_DATA[sym];
            if (demo) {
                prices = demo.history;
                labels = prices.map((_, i) => `يوم ${i + 1}`);
            } else {
                showToast('لا توجد بيانات تجريبية لهذا الرمز، أضف مفتاح API', 'error');
                return;
            }
        }
    } catch (err) {
        showToast('تعذر جلب بيانات الرسم البياني', 'error');
        return;
    }

    destroyChart('stockDetailChart');
    const ctx = document.getElementById('stockDetailChart');
    if (!ctx) return;
    const isUp = prices.length > 1 && prices[prices.length - 1] >= prices[0];
    chartInstances['stockDetailChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: sym, data: prices,
                borderColor: isUp ? '#10b981' : '#ef4444',
                backgroundColor: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                fill: true, tension: 0.3, pointRadius: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function openAddStockModal() {
    const html = `
        <div class="form-grid">
            <div class="form-group full-width">
                <label>رمز السهم (Ticker)</label>
                <input type="text" id="stockSymbol" class="form-control" placeholder="مثال: AAPL" style="text-transform:uppercase">
                <small class="text-muted">استخدم الرمز كما يظهر في السوق الأمريكي (مثال: AAPL, TSLA, MSFT)</small>
            </div>
        </div>
    `;
    openModal("إضافة سهم للمتابعة", html, () => {
        const sym = document.getElementById('stockSymbol').value.trim().toUpperCase();
        if (!sym) return alert("أدخل رمز السهم");
        const list = getStockWatchlist();
        if (list.includes(sym)) { showToast("السهم موجود بالفعل في القائمة", "error"); return; }
        list.push(sym);
        saveStockWatchlist(list);
        closeModal(null, true);
        renderStocks(document.getElementById('app-container'));
        showToast("تم إضافة السهم", "success");
    });
}

function removeStock(sym) {
    let list = getStockWatchlist();
    list = list.filter(s => s !== sym);
    saveStockWatchlist(list);
    renderStocks(document.getElementById('app-container'));
    showToast("تم إزالة السهم", "success");
}

function openStockApiKeyModal() {
    const current = getStockApiKey();
    const html = `
        <div class="form-grid">
            <div class="form-group full-width">
                <label>مفتاح Alpha Vantage API</label>
                <input type="text" id="stockApiKeyInput" class="form-control" value="${current}" placeholder="أدخل المفتاح هنا">
                <small class="text-muted">احصل على مفتاح مجاني من <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener">alphavantage.co</a> (بدون بطاقة ائتمان، حتى 25 طلب يومياً). يُحفظ المفتاح على جهازك فقط.</small>
            </div>
        </div>
    `;
    openModal("إعداد مفتاح API للأسهم", html, () => {
        const key = document.getElementById('stockApiKeyInput').value.trim();
        saveStockApiKey(key);
        closeModal(null, true);
        renderStocks(document.getElementById('app-container'));
        showToast(key ? "تم حفظ المفتاح، سيتم جلب بيانات حقيقية الآن" : "تم مسح المفتاح، سيتم استخدام بيانات تجريبية", "success");
    });
}

// --- تفاصيل المستأجر ---
function viewTenantDetails(tenantId) {
    hideSearchResults();
    const t = db.tenants.find(t => t.id == tenantId);
    if (!t) return;
    const unit = db.units.find(u => u.id == t.unitId) || {};
    const property = db.units.find(u => u.id == t.unitId) ? db.properties.find(p => p.id == unit.propertyId) : null;

    const history = db.rents.filter(r => r.tenantId == t.id).sort((a, b) => b.month.localeCompare(a.month));
    let historyRows = history.map(r => `
        <tr>
            <td>${monthLabel(r.month)}</td>
            <td><span class="badge ${r.status === 'مدفوع' ? 'badge-green' : 'badge-red'}">${r.status}</span></td>
            <td>${r.paidDate || '-'}</td>
            <td>${r.status === 'مدفوع' ? `<button class="icon-btn" onclick="printReceipt(${t.id}, '${r.month}')" title="طباعة إيصال"><i class="fa-solid fa-print"></i></button>` : `<button class="btn btn-sm btn-success" onclick="markRentPaid(${t.id}, '${r.month}'); viewTenantDetails(${t.id});"><i class="fa-solid fa-check"></i> تأكيد الدفع</button>`}</td>
        </tr>
    `).join('');

    const html = `
        <div class="detail-grid">
            <div class="detail-item"><h5>الاسم</h5><p>${t.name}</p></div>
            <div class="detail-item"><h5>الهاتف</h5><p>${t.phone || '-'}</p></div>
            <div class="detail-item"><h5>الرقم القومي</h5><p>${t.nationalId || '-'}</p></div>
            <div class="detail-item"><h5>الوحدة</h5><p>${unit.number || '-'} ${property ? '- ' + property.name : ''}</p></div>
            <div class="detail-item"><h5>قيمة الإيجار</h5><p>${fmtMoney(t.rent)} ج</p></div>
            <div class="detail-item"><h5>يوم الاستحقاق</h5><p>${t.dueDay || '-'}</p></div>
            <div class="detail-item"><h5>التأمين</h5><p>${fmtMoney(t.insurance || 0)} ج</p></div>
            <div class="detail-item"><h5>بداية العقد</h5><p>${t.startDate}</p></div>
            <div class="detail-item"><h5>نهاية العقد</h5><p>${t.endDate}</p></div>
        </div>
        ${t.notes ? `<p style="margin-bottom:15px"><strong>ملاحظات:</strong> ${t.notes}</p>` : ''}
        <div class="card-header"><h3>سجل الإيجارات</h3></div>
        <div class="table-responsive">
            <table>
                <thead><tr><th>الشهر</th><th>الحالة</th><th>تاريخ الدفع</th><th>إجراء</th></tr></thead>
                <tbody>${historyRows || '<tr><td colspan="4" style="text-align:center">لا يوجد سجل بعد</td></tr>'}</tbody>
            </table>
        </div>
    `;

    modalTitle.innerText = `تفاصيل المستأجر`;
    modalBody.innerHTML = html;
    modalSaveBtn.style.display = 'none';
    modalOverlay.classList.add('active');
}

// --- العمليات والنوافذ المنبثقة (Modals) ---

const modalOverlay = document.getElementById('mainModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalSaveBtn = document.getElementById('modalSaveBtn');

function openModal(title, contentHtml, onSave) {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHtml;
    modalSaveBtn.style.display = onSave ? 'inline-flex' : 'none';
    modalSaveBtn.onclick = onSave;
    modalOverlay.classList.add('active');
}

function closeModal(e, force = false) {
    if (force || e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        modalSaveBtn.style.display = 'inline-flex';
    }
}

// 1. إضافة / تعديل عقار
function openAddPropertyModal() {
    const html = `
        <div class="form-grid">
            <div class="form-group full-width"><label>اسم العقار</label><input type="text" id="pName" class="form-control" required></div>
            <div class="form-group"><label>النوع</label>
                <select id="pType" class="form-control">
                    <option>عمارة</option><option>منزل</option><option>عقار تجاري</option>
                </select>
            </div>
            <div class="form-group"><label>العنوان</label><input type="text" id="pAddress" class="form-control"></div>
            <div class="form-group full-width"><label>ملاحظات</label><textarea id="pNotes" class="form-control"></textarea></div>
        </div>
    `;
    openModal("إضافة عقار جديد", html, () => {
        const name = document.getElementById('pName').value;
        if (!name) return alert("الاسم مطلوب");
        db.properties.push({
            id: Date.now(), name,
            type: document.getElementById('pType').value,
            address: document.getElementById('pAddress').value,
            notes: document.getElementById('pNotes').value
        });
        saveData(); closeModal(null, true); renderProperties(document.getElementById('app-container'));
        showToast("تم إضافة العقار بنجاح", "success");
    });
}

function openEditPropertyModal(id) {
    const p = db.properties.find(p => p.id == id);
    if (!p) return;
    const html = `
        <div class="form-grid">
            <div class="form-group full-width"><label>اسم العقار</label><input type="text" id="pName" class="form-control" value="${p.name}" required></div>
            <div class="form-group"><label>النوع</label>
                <select id="pType" class="form-control">
                    <option ${p.type === 'عمارة' ? 'selected' : ''}>عمارة</option>
                    <option ${p.type === 'منزل' ? 'selected' : ''}>منزل</option>
                    <option ${p.type === 'عقار تجاري' ? 'selected' : ''}>عقار تجاري</option>
                </select>
            </div>
            <div class="form-group"><label>العنوان</label><input type="text" id="pAddress" class="form-control" value="${p.address || ''}"></div>
            <div class="form-group full-width"><label>ملاحظات</label><textarea id="pNotes" class="form-control">${p.notes || ''}</textarea></div>
        </div>
    `;
    openModal("تعديل بيانات العقار", html, () => {
        p.name = document.getElementById('pName').value;
        p.type = document.getElementById('pType').value;
        p.address = document.getElementById('pAddress').value;
        p.notes = document.getElementById('pNotes').value;
        saveData(); closeModal(null, true); renderProperties(document.getElementById('app-container'));
        showToast("تم تحديث بيانات العقار", "success");
    });
}

// 2. إضافة / تعديل وحدة
function openAddUnitModal() {
    let propOptions = db.properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const html = `
        <div class="form-grid">
            <div class="form-group"><label>العقار التابع له</label><select id="uProp" class="form-control">${propOptions}</select></div>
            <div class="form-group"><label>رقم/اسم الوحدة</label><input type="text" id="uNum" class="form-control" required></div>
            <div class="form-group"><label>النوع</label><select id="uType" class="form-control"><option>شقة</option><option>محل</option><option>مكتب</option></select></div>
            <div class="form-group"><label>الدور</label><input type="text" id="uFloor" class="form-control"></div>
        </div>
    `;
    openModal("إضافة وحدة جديدة", html, () => {
        if (db.properties.length === 0) return alert("يجب إضافة عقار أولاً");
        db.units.push({
            id: Date.now(), propertyId: document.getElementById('uProp').value,
            number: document.getElementById('uNum').value,
            type: document.getElementById('uType').value,
            floor: document.getElementById('uFloor').value,
            status: "فارغة"
        });
        saveData(); closeModal(null, true); renderUnits(document.getElementById('app-container'));
        showToast("تم إضافة الوحدة بنجاح", "success");
    });
}

function openEditUnitModal(id) {
    const u = db.units.find(u => u.id == id);
    if (!u) return;
    let propOptions = db.properties.map(p => `<option value="${p.id}" ${p.id == u.propertyId ? 'selected' : ''}>${p.name}</option>`).join('');
    const statuses = ["فارغة", "مؤجرة", "تحت الصيانة"];
    let statusOptions = statuses.map(s => `<option ${s === u.status ? 'selected' : ''}>${s}</option>`).join('');
    const html = `
        <div class="form-grid">
            <div class="form-group"><label>العقار التابع له</label><select id="uProp" class="form-control">${propOptions}</select></div>
            <div class="form-group"><label>رقم/اسم الوحدة</label><input type="text" id="uNum" class="form-control" value="${u.number}" required></div>
            <div class="form-group"><label>النوع</label><select id="uType" class="form-control">
                <option ${u.type === 'شقة' ? 'selected' : ''}>شقة</option>
                <option ${u.type === 'محل' ? 'selected' : ''}>محل</option>
                <option ${u.type === 'مكتب' ? 'selected' : ''}>مكتب</option>
            </select></div>
            <div class="form-group"><label>الدور</label><input type="text" id="uFloor" class="form-control" value="${u.floor || ''}"></div>
            <div class="form-group"><label>الحالة</label><select id="uStatus" class="form-control">${statusOptions}</select></div>
        </div>
    `;
    openModal("تعديل بيانات الوحدة", html, () => {
        u.propertyId = document.getElementById('uProp').value;
        u.number = document.getElementById('uNum').value;
        u.type = document.getElementById('uType').value;
        u.floor = document.getElementById('uFloor').value;
        u.status = document.getElementById('uStatus').value;
        saveData(); closeModal(null, true); renderUnits(document.getElementById('app-container'));
        showToast("تم تحديث بيانات الوحدة", "success");
    });
}

// 3. إضافة / تعديل مستأجر
function openAddTenantModal() {
    let emptyUnits = db.units.filter(u => u.status === "فارغة");
    let unitOptions = emptyUnits.map(u => `<option value="${u.id}">${u.number}</option>`).join('');

    if (emptyUnits.length === 0) {
        alert("لا توجد وحدات فارغة للإيجار. قم بإضافة وحدة جديدة أولاً.");
        return;
    }

    const html = `
        <div class="form-grid">
            <div class="form-group"><label>الاسم</label><input type="text" id="tName" class="form-control" required></div>
            <div class="form-group"><label>رقم الهاتف</label><input type="text" id="tPhone" class="form-control"></div>
            <div class="form-group"><label>الرقم القومي</label><input type="text" id="tNationalId" class="form-control"></div>
            <div class="form-group"><label>الوحدة</label><select id="tUnit" class="form-control">${unitOptions}</select></div>
            <div class="form-group"><label>قيمة الإيجار (شهري)</label><input type="number" id="tRent" class="form-control"></div>
            <div class="form-group"><label>يوم الدفع</label><input type="number" min="1" max="31" id="tDay" class="form-control"></div>
            <div class="form-group"><label>مبلغ التأمين</label><input type="number" id="tInsurance" class="form-control"></div>
            <div class="form-group"><label>بداية العقد</label><input type="date" id="tStart" class="form-control"></div>
            <div class="form-group"><label>نهاية العقد</label><input type="date" id="tEnd" class="form-control"></div>
            <div class="form-group full-width"><label>ملاحظات</label><textarea id="tNotes" class="form-control"></textarea></div>
        </div>
    `;
    openModal("إضافة مستأجر وعقد جديد", html, () => {
        let unitId = document.getElementById('tUnit').value;
        const name = document.getElementById('tName').value;
        if (!name) return alert("الاسم مطلوب");
        db.tenants.push({
            id: Date.now(), unitId: unitId,
            name,
            phone: document.getElementById('tPhone').value,
            nationalId: document.getElementById('tNationalId').value,
            rent: document.getElementById('tRent').value || 0,
            dueDay: document.getElementById('tDay').value,
            insurance: document.getElementById('tInsurance').value || 0,
            startDate: document.getElementById('tStart').value,
            endDate: document.getElementById('tEnd').value,
            notes: document.getElementById('tNotes').value
        });
        let u = db.units.find(u => u.id == unitId);
        if (u) u.status = "مؤجرة";

        saveData(); closeModal(null, true); renderTenants(document.getElementById('app-container'));
        showToast("تم إضافة المستأجر بنجاح", "success");
    });
}

function openEditTenantModal(id) {
    const t = db.tenants.find(t => t.id == id);
    if (!t) return;
    // الوحدات المتاحة = الوحدة الحالية + الوحدات الفارغة
    let availableUnits = db.units.filter(u => u.status === "فارغة" || u.id == t.unitId);
    let unitOptions = availableUnits.map(u => `<option value="${u.id}" ${u.id == t.unitId ? 'selected' : ''}>${u.number}</option>`).join('');

    const html = `
        <div class="form-grid">
            <div class="form-group"><label>الاسم</label><input type="text" id="tName" class="form-control" value="${t.name}" required></div>
            <div class="form-group"><label>رقم الهاتف</label><input type="text" id="tPhone" class="form-control" value="${t.phone || ''}"></div>
            <div class="form-group"><label>الرقم القومي</label><input type="text" id="tNationalId" class="form-control" value="${t.nationalId || ''}"></div>
            <div class="form-group"><label>الوحدة</label><select id="tUnit" class="form-control">${unitOptions}</select></div>
            <div class="form-group"><label>قيمة الإيجار (شهري)</label><input type="number" id="tRent" class="form-control" value="${t.rent}"></div>
            <div class="form-group"><label>يوم الدفع</label><input type="number" min="1" max="31" id="tDay" class="form-control" value="${t.dueDay || ''}"></div>
            <div class="form-group"><label>مبلغ التأمين</label><input type="number" id="tInsurance" class="form-control" value="${t.insurance || 0}"></div>
            <div class="form-group"><label>بداية العقد</label><input type="date" id="tStart" class="form-control" value="${t.startDate || ''}"></div>
            <div class="form-group"><label>نهاية العقد</label><input type="date" id="tEnd" class="form-control" value="${t.endDate || ''}"></div>
            <div class="form-group full-width"><label>ملاحظات</label><textarea id="tNotes" class="form-control">${t.notes || ''}</textarea></div>
        </div>
    `;
    openModal("تعديل بيانات المستأجر", html, () => {
        const oldUnitId = t.unitId;
        const newUnitId = document.getElementById('tUnit').value;

        t.name = document.getElementById('tName').value;
        t.phone = document.getElementById('tPhone').value;
        t.nationalId = document.getElementById('tNationalId').value;
        t.unitId = newUnitId;
        t.rent = document.getElementById('tRent').value || 0;
        t.dueDay = document.getElementById('tDay').value;
        t.insurance = document.getElementById('tInsurance').value || 0;
        t.startDate = document.getElementById('tStart').value;
        t.endDate = document.getElementById('tEnd').value;
        t.notes = document.getElementById('tNotes').value;

        if (oldUnitId != newUnitId) {
            const oldUnit = db.units.find(u => u.id == oldUnitId);
            if (oldUnit) oldUnit.status = "فارغة";
            const newUnit = db.units.find(u => u.id == newUnitId);
            if (newUnit) newUnit.status = "مؤجرة";
        }

        saveData(); closeModal(null, true); renderTenants(document.getElementById('app-container'));
        showToast("تم تحديث بيانات المستأجر", "success");
    });
}

// 4. إضافة / تعديل فاتورة
function openAddBillModal() {
    let unitOptions = db.units.map(u => `<option value="${u.id}">${u.number}</option>`).join('');
    const html = `
        <div class="form-grid">
            <div class="form-group"><label>نوع الفاتورة</label><select id="bType" class="form-control"><option>كهرباء</option><option>مياه</option><option>صيانة</option><option>غاز</option><option>أخرى</option></select></div>
            <div class="form-group"><label>الوحدة</label><select id="bUnit" class="form-control">${unitOptions}</select></div>
            <div class="form-group"><label>القيمة (ج)</label><input type="number" id="bAmount" class="form-control"></div>
            <div class="form-group"><label>تاريخ الاستحقاق</label><input type="date" id="bDate" class="form-control"></div>
            <div class="form-group full-width"><label>ملاحظات</label><textarea id="bNotes" class="form-control"></textarea></div>
        </div>
    `;
    openModal("إضافة فاتورة", html, () => {
        const unitId = document.getElementById('bUnit').value;
        const unit = db.units.find(u => u.id == unitId);
        const tenant = unit ? db.tenants.find(t => t.unitId == unit.id) : null;
        db.bills.push({
            id: Date.now(), unitId: unitId,
            type: document.getElementById('bType').value,
            amount: document.getElementById('bAmount').value || 0,
            dueDate: document.getElementById('bDate').value,
            status: "غير مدفوعة",
            tenantId: tenant ? tenant.id : null,
            notes: document.getElementById('bNotes').value
        });
        saveData(); closeModal(null, true); renderBills(document.getElementById('app-container'));
        showToast("تم إضافة الفاتورة", "success");
    });
}

function openEditBillModal(id) {
    const b = db.bills.find(b => b.id == id);
    if (!b) return;
    let unitOptions = db.units.map(u => `<option value="${u.id}" ${u.id == b.unitId ? 'selected' : ''}>${u.number}</option>`).join('');
    const types = ["كهرباء", "مياه", "صيانة", "غاز", "أخرى"];
    let typeOptions = types.map(ty => `<option ${ty === b.type ? 'selected' : ''}>${ty}</option>`).join('');
    const html = `
        <div class="form-grid">
            <div class="form-group"><label>نوع الفاتورة</label><select id="bType" class="form-control">${typeOptions}</select></div>
            <div class="form-group"><label>الوحدة</label><select id="bUnit" class="form-control">${unitOptions}</select></div>
            <div class="form-group"><label>القيمة (ج)</label><input type="number" id="bAmount" class="form-control" value="${b.amount}"></div>
            <div class="form-group"><label>تاريخ الاستحقاق</label><input type="date" id="bDate" class="form-control" value="${b.dueDate || ''}"></div>
            <div class="form-group full-width"><label>ملاحظات</label><textarea id="bNotes" class="form-control">${b.notes || ''}</textarea></div>
        </div>
    `;
    openModal("تعديل الفاتورة", html, () => {
        const unitId = document.getElementById('bUnit').value;
        const unit = db.units.find(u => u.id == unitId);
        const tenant = unit ? db.tenants.find(t => t.unitId == unit.id) : null;
        b.unitId = unitId;
        b.type = document.getElementById('bType').value;
        b.amount = document.getElementById('bAmount').value || 0;
        b.dueDate = document.getElementById('bDate').value;
        b.tenantId = tenant ? tenant.id : null;
        b.notes = document.getElementById('bNotes').value;
        saveData(); closeModal(null, true); renderBills(document.getElementById('app-container'));
        showToast("تم تحديث الفاتورة", "success");
    });
}

// --- وظائف مساعدة ---
function markRentPaid(tenantId, monthStr) {
    let record = db.rents.find(r => r.tenantId == tenantId && r.month === monthStr);
    if (record) {
        record.status = "مدفوع";
        record.paidDate = new Date().toISOString().split('T')[0];
    } else {
        db.rents.push({ id: Date.now(), tenantId, month: monthStr, status: "مدفوع", paidDate: new Date().toISOString().split('T')[0] });
    }
    saveData();
    const container = document.getElementById('app-container');
    if (document.querySelector('.sidebar-menu li.active')?.innerText.includes('الإيجارات')) renderRents(container);
    showToast("تم تأكيد دفع الإيجار", "success");
}

function markBillPaid(billId) {
    let b = db.bills.find(b => b.id == billId);
    if (b) b.status = "مدفوعة";
    saveData(); renderBills(document.getElementById('app-container'));
    showToast("تم تأكيد دفع الفاتورة", "success");
}

function deleteProperty(id) {
    const hasUnits = db.units.some(u => u.propertyId == id);
    if (hasUnits && !confirm("هذا العقار يحتوي على وحدات مرتبطة به. هل أنت متأكد من الحذف؟")) return;
    if (!hasUnits && !confirm("هل أنت متأكد من الحذف؟")) return;
    db.properties = db.properties.filter(p => p.id != id);
    saveData(); renderProperties(document.getElementById('app-container'));
    showToast("تم حذف العقار", "success");
}
function deleteUnit(id) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    db.units = db.units.filter(u => u.id != id);
    saveData(); renderUnits(document.getElementById('app-container'));
    showToast("تم حذف الوحدة", "success");
}
function deleteTenant(id) {
    if (!confirm("سيتم حذف المستأجر وتحرير الوحدة المرتبطة به. هل أنت متأكد؟")) return;
    const t = db.tenants.find(t => t.id == id);
    if (t) {
        const unit = db.units.find(u => u.id == t.unitId);
        if (unit) unit.status = "فارغة";
    }
    db.tenants = db.tenants.filter(t => t.id != id);
    saveData(); renderTenants(document.getElementById('app-container'));
    showToast("تم حذف المستأجر", "success");
}
function deleteBill(id) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    db.bills = db.bills.filter(b => b.id != id);
    saveData(); renderBills(document.getElementById('app-container'));
    showToast("تم حذف الفاتورة", "success");
}

// --- الطباعة (إيصالات وفواتير) ---
function openPrintWindow(title, bodyHtml) {
    const w = window.open('', '_blank', 'width=700,height=800');
    w.document.write(`
        <html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
        <style>
            body{font-family: Tahoma, Arial, sans-serif; padding:30px; color:#1f2937;}
            .p-header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e3a8a;padding-bottom:15px;margin-bottom:20px;}
            .p-header h2{color:#1e3a8a;}
            table{width:100%;border-collapse:collapse;margin-top:15px;}
            th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;}
            th{background:#f3f4f6;}
            .p-total{text-align:left;margin-top:20px;font-size:1.3rem;font-weight:bold;color:#1e3a8a;}
            .p-footer{margin-top:40px;font-size:0.85rem;color:#6b7280;text-align:center;}
        </style></head><body>${bodyHtml}
        <script>window.onload = () => { window.print(); }<\/script>
        </body></html>
    `);
    w.document.close();
}

function printReceipt(tenantId, monthStr) {
    const t = db.tenants.find(t => t.id == tenantId);
    const rec = db.rents.find(r => r.tenantId == tenantId && r.month === monthStr);
    if (!t || !rec) return;
    const unit = db.units.find(u => u.id == t.unitId) || {};
    const html = `
        <div class="p-header">
            <h2><i class="fa-solid fa-building"></i> إيصال استلام إيجار</h2>
            <div>رقم: ${rec.id}</div>
        </div>
        <p><strong>المستأجر:</strong> ${t.name}</p>
        <p><strong>الوحدة:</strong> ${unit.number || '-'}</p>
        <p><strong>الشهر:</strong> ${monthLabel(monthStr)}</p>
        <p><strong>تاريخ الدفع:</strong> ${rec.paidDate || '-'}</p>
        <div class="p-total">المبلغ المستلم: ${fmtMoney(t.rent)} جنيه</div>
        <div class="p-footer">تم إصدار هذا الإيصال إلكترونياً من نظام إدارة الأملاك</div>
    `;
    openPrintWindow('إيصال إيجار', html);
}

function printBillInvoice(billId) {
    const b = db.bills.find(b => b.id == billId);
    if (!b) return;
    const unit = db.units.find(u => u.id == b.unitId) || {};
    const tenant = db.tenants.find(t => t.id == b.tenantId);
    const html = `
        <div class="p-header">
            <h2><i class="fa-solid fa-file-invoice"></i> فاتورة ${b.type}</h2>
            <div>رقم: ${b.id}</div>
        </div>
        <p><strong>الوحدة:</strong> ${unit.number || '-'}</p>
        <p><strong>المستأجر:</strong> ${tenant ? tenant.name : '-'}</p>
        <p><strong>تاريخ الاستحقاق:</strong> ${b.dueDate || '-'}</p>
        <p><strong>الحالة:</strong> ${b.status}</p>
        <div class="p-total">القيمة: ${fmtMoney(b.amount)} جنيه</div>
        <div class="p-footer">تم إصدار هذه الفاتورة إلكترونياً من نظام إدارة الأملاك</div>
    `;
    openPrintWindow('فاتورة', html);
}

// --- تصدير Excel ---
function exportTenantsExcel() {
    const data = db.tenants.map(t => {
        const unit = db.units.find(u => u.id == t.unitId) || {};
        return {
            "الاسم": t.name, "الهاتف": t.phone, "الرقم القومي": t.nationalId,
            "الوحدة": unit.number || '-', "الإيجار الشهري": t.rent, "يوم الاستحقاق": t.dueDay,
            "التأمين": t.insurance, "بداية العقد": t.startDate, "نهاية العقد": t.endDate
        };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المستأجرون");
    XLSX.writeFile(wb, "tenants.xlsx");
    showToast("تم تصدير ملف المستأجرين", "success");
}

function exportRentsExcel() {
    const data = db.rents.map(r => {
        const t = db.tenants.find(t => t.id == r.tenantId) || {};
        return { "المستأجر": t.name || '-', "الشهر": r.month, "الحالة": r.status, "تاريخ الدفع": r.paidDate || '-', "القيمة": t.rent || 0 };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الإيجارات");
    XLSX.writeFile(wb, "rents.xlsx");
    showToast("تم تصدير ملف الإيجارات", "success");
}

// --- النسخ الاحتياطي والاستعادة (متوافق مع database.json) ---
function exportBackup() {
    // تصدير كملف database.json منظم مع metadata كاملة
    syncDatabaseToFile();
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            // دعم كلا الصيغتين: القديمة والجديدة (database.json)
            const data = parsed.properties ? parsed : null;
            if (!data || !data.properties || !data.units || !data.tenants) {
                throw new Error("ملف غير صالح");
            }
            if (!confirm("سيتم استبدال جميع البيانات الحالية بالنسخة المستوردة. هل تريد المتابعة؟")) return;
            db.properties = data.properties;
            db.units = data.units;
            db.tenants = data.tenants;
            db.rents = data.rents || [];
            db.bills = data.bills || [];
            // استرجاع metadata لو موجودة
            if (parsed._metadata) {
                db._createdDate = parsed._metadata.created;
            }
            saveData();
            navigateTo('dashboard', document.querySelectorAll('.sidebar-menu li')[0]);
            showToast("تم استعادة النسخة الاحتياطية بنجاح ✅", "success");
        } catch (err) {
            showToast("فشل استيراد الملف: تأكد من صحة الملف", "error");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Toasts System
function showToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- بدء التشغيل ---
window.onload = () => {
    calculateAlerts();
    navigateTo('dashboard', document.querySelectorAll('.sidebar-menu li')[0]);
};
