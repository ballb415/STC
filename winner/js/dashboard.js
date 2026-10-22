// ============================================================
//  EDUSCHED AI - DASHBOARD STATS & REAL DIAGNOSTICS
//  คำนวณและวิเคราะห์สถิติจริงจากฐานข้อมูลตามเกณฑ์การแข่งขัน
// ============================================================

const DASH = (() => {
  async function loadStats() {
    const statusEl = document.getElementById('system-status-list');
    if (statusEl) {
      statusEl.innerHTML = '<div class="page-loader" style="padding:20px;"><div class="spinner"></div> กำลังดึงข้อมูลและคำนวณสถิติจริง...</div>';
    }

    try {
      const [rRes, gRes, sRes, lRes, tRes, regRes, scRes] = await Promise.all([
        db.from(TABLES.ROOMS).select('*'),
        db.from(TABLES.GROUPS).select('*'),
        db.from(TABLES.SUBJECTS).select('*'),
        db.from(TABLES.TEACHING_LOADS).select('*'),
        db.from(TABLES.TEACHERS).select('*'),
        db.from(TABLES.REGISTRATIONS).select('*'),
        db.from(TABLES.SCHEDULES).select('*')
      ]);

      const rooms = rRes.data || [];
      const groups = gRes.data || [];
      const subjects = sRes.data || [];
      const loads = lRes.data || [];
      const teachers = tRes.data || [];
      const registrations = regRes.data || [];
      const schedules = scRes.data || [];

      // 1. Calculate Real Metrics
      const totalRooms = rooms.length;
      const totalGroups = groups.length;
      const totalSubjects = subjects.length;
      const totalTeachers = teachers.length;
      const totalRegistrations = registrations.length;
      const totalSchedules = schedules.length;

      // Calculate total teaching load hours
      let totalLoadHours = 0;
      loads.forEach(l => {
        totalLoadHours += (l.hours_per_week || 0);
      });

      // Run Independent Validator for real schedule analytics
      let validation = null;
      let conflictCount = 0;
      let avgRoomUtil = 0;

      if (typeof VALIDATOR !== 'undefined') {
        validation = VALIDATOR.auditSchedule(schedules, {
          rooms,
          teachers,
          groups,
          subjects,
          teachingLoads: loads,
          registrations
        });
        conflictCount = validation.hardViolations;
        const uValues = Object.values(validation.roomUtilization).map(x => x.percent);
        if (uValues.length > 0) {
          avgRoomUtil = Math.round(uValues.reduce((a, b) => a + b, 0) / uValues.length);
        }
      }

      // 2. Set Stat Card Values
      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val !== null && val !== undefined ? val : '0';
      };

      setEl('stat-rooms', totalRooms);
      setEl('stat-groups', totalGroups);
      setEl('stat-subjects', totalSubjects);
      setEl('stat-teachers', totalTeachers);
      setEl('stat-loads', totalLoadHours);
      setEl('stat-regs', totalRegistrations);
      setEl('stat-room-util', `${avgRoomUtil}%`);
      setEl('stat-conflicts', conflictCount === 0 ? '0' : conflictCount);

      const conflictCard = document.getElementById('stat-conflicts')?.closest('.stat-card');
      const conflictVal = document.getElementById('stat-conflicts');
      if (conflictCard) {
        // Reset manual background override if any
        conflictCard.style.background = '';
        if (conflictCount === 0 && totalSchedules > 0) {
          conflictCard.classList.remove('card-has-conflict');
          conflictCard.classList.add('card-no-conflict');
          const subEl = conflictCard.querySelector('.stat-card-sub');
          if (subEl) subEl.textContent = 'ตารางสมบูรณ์ 100% (0 ข้อขัดแย้ง)';
        } else if (conflictCount > 0) {
          conflictCard.classList.remove('card-no-conflict');
          conflictCard.classList.add('card-has-conflict');
          const subEl = conflictCard.querySelector('.stat-card-sub');
          if (subEl) subEl.textContent = `พบข้อขัดแย้ง ${conflictCount} จุด (คลิกเพื่อแก้ไข)`;
        } else {
          conflictCard.classList.remove('card-has-conflict', 'card-no-conflict');
        }
      }

      // 3. Render Real System Status & Diagnostics
      if (statusEl) {
        if (totalRooms === 0 && totalTeachers === 0) {
          statusEl.innerHTML = `
            <div style="text-align:center;padding:24px 10px;color:var(--text-muted);">
              <i class="fas fa-inbox" style="font-size:32px;margin-bottom:10px;display:block;opacity:0.6;"></i>
              <div style="font-weight:600;color:var(--text-primary);margin-bottom:6px;">ยังไม่มีข้อมูลในระบบ</div>
              <p style="font-size:12.5px;margin-bottom:16px;">เริ่มต้นโดยการนำเข้าชุดข้อมูลจำลองการแข่งขัน หรือเพิ่มข้อมูลพื้นฐาน</p>
              <button class="btn btn-primary btn-sm" onclick="DASH.quickLoadDemo('small')">
                <i class="fas fa-download"></i> โหลดชุดข้อมูลจำลอง (Small Benchmark)
              </button>
            </div>
          `;
          return;
        }

        const avgTeacherLoad = totalTeachers > 0 ? (totalLoadHours / totalTeachers).toFixed(1) : 0;
        const schedStatusBadge = totalSchedules > 0
          ? (conflictCount === 0 ? '<span class="badge badge-success"><i class="fas fa-circle-check"></i> สมบูรณ์ (0 ข้อขัดแย้ง)</span>' : `<span class="badge badge-danger"><i class="fas fa-triangle-exclamation"></i> พบข้อขัดแย้ง ${conflictCount} จุด</span>`)
          : '<span class="badge badge-warning"><i class="fas fa-clock"></i> ยังไม่ได้จัดตาราง</span>';

        statusEl.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;">
                <i class="fas fa-database" style="color:var(--cyan);margin-right:8px;"></i>การเชื่อมต่อฐานข้อมูล
              </span>
              <span class="badge badge-success font-mono"><i class="fas fa-link"></i> Supabase Online</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;">
                <i class="fas fa-calendar-check" style="color:var(--primary-light);margin-right:8px;"></i>สถานะตารางสอน
              </span>
              ${schedStatusBadge}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;">
                <i class="fas fa-clock" style="color:var(--warning);margin-right:8px;"></i>ภาระงานครูเฉลี่ย
              </span>
              <span class="badge badge-info">${avgTeacherLoad} คาบ/คน</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;">
                <i class="fas fa-door-open" style="color:var(--cyan);margin-right:8px;"></i>อัตราการใช้ห้องเรียน
              </span>
              <span class="badge ${avgRoomUtil > 0 ? 'badge-primary' : 'badge-gray'}">${avgRoomUtil}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:var(--text-secondary);font-size:13px;">
                <i class="fas fa-list-check" style="color:var(--success);margin-right:8px;"></i>คาบเรียนในระบบ
              </span>
              <span class="badge badge-gray font-mono">${totalSchedules} คาบ</span>
            </div>
          </div>
        `;
      }
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="color:var(--danger);padding:14px;font-size:13px;">
            <i class="fas fa-circle-exclamation"></i> ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${e.message}
          </div>
        `;
      }
    }
  }

  async function quickLoadDemo(type = 'small') {
    if (typeof COMPETITION_DATA !== 'undefined') {
      const ok = await COMPETITION_DATA.loadDataset(type);
      if (ok) {
        await loadStats();
      }
    }
  }

  return {
    loadStats,
    quickLoadDemo
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof DASH !== 'undefined') DASH.loadStats();
});
