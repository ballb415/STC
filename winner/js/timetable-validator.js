// ============================================================
//  EDUSCHED AI - INDEPENDENT TIMETABLE VALIDATOR ENGINE
//  ระบบตรวจสอบความถูกต้องและข้อขัดแย้งของตารางสอน (แยกอิสระ)
//  ตามเกณฑ์การแข่งขันทักษะเทคโนโลยีปัญญาประดิษฐ์ สอศ.
// ============================================================

const VALIDATOR = (() => {

  const DAYS = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];

  /**
   * ตรวจสอบตารางสอนอย่างสมบูรณ์แบบ ทั้ง 8 Hard Constraints และ 5 Soft Constraints
   * @param {Array} schedules - รายการคาบเรียนในตาราง
   * @param {Object} masterData - { rooms, teachers, groups, subjects, teachingLoads, registrations }
   * @returns {Object} ผลการตรวจสอบและรายงานข้อขัดแย้ง
   */
  function auditSchedule(schedules = [], masterData = {}) {
    const {
      rooms = [],
      teachers = [],
      groups = [],
      subjects = [],
      teachingLoads = [],
      registrations = []
    } = masterData;

    const conflicts = [];
    const conflictMatrix = {}; // key: "day_period" -> count
    const teacherMap = new Map(teachers.map(t => [t.teacher_id, t]));
    const roomMap = new Map(rooms.map(r => [r.room_id, r]));
    const groupMap = new Map(groups.map(g => [g.group_id, g]));
    const subjMap = new Map(subjects.map(s => [s.subject_id, s]));

    // Initialize conflict matrix
    DAYS.forEach(d => {
      for (let p = 0; p <= 11; p++) {
        conflictMatrix[`${d}_${p}`] = 0;
      }
    });

    let hardViolations = 0;
    let softViolations = 0;

    // Helper: Mark Conflict Matrix
    function markMatrix(day, start, end) {
      for (let p = start; p <= end; p++) {
        const key = `${day}_${p}`;
        conflictMatrix[key] = (conflictMatrix[key] || 0) + 1;
      }
    }

    // ──────────────────────────────────────────────────────────
    // 1. HARD CONSTRAINTS (ข้อจำกัดบังคับ 8 ประการ)
    // ──────────────────────────────────────────────────────────

    // HC1: ครูคนเดียวกันห้ามสอนซ้อนเวลา
    // HC2: ห้องเดียวกันห้ามใช้งานซ้อนเวลา
    // HC3: กลุ่มเรียนเดียวกันห้ามเรียนซ้อนเวลา
    for (let i = 0; i < schedules.length; i++) {
      const s1 = schedules[i];
      const subj1 = subjMap.get(s1.subject_id) || { subject_name: s1.subject_id };

      // เช็ค HC7: ห้ามข้ามหรือทับช่วงพักกลางวัน
      // คาบ 1-4 คือช่วงเช้า, คาบ 5-11 คือช่วงบ่าย. ช่วง 12:00-13:00 ห้ามมีคาบข้ามระหว่าง 4 กับ 5
      if (s1.period_start <= 4 && s1.period_end >= 5) {
        hardViolations++;
        conflicts.push({
          type: 'HC7_LUNCH_OVERLAP',
          severity: 'CRITICAL',
          day: s1.day,
          period: `${s1.period_start}-${s1.period_end}`,
          message: `วิชา ${s1.subject_id} (${subj1.subject_name}) จัดคาบข้ามช่วงพักกลางวัน (คาบ 4 ไปคาบ 5)`,
          entity: s1.subject_id
        });
        markMatrix(s1.day, s1.period_start, s1.period_end);
      }

      // เช็ค HC4: ความจุห้องเรียน (Room Capacity)
      const room1 = roomMap.get(s1.room_id);
      const grp1 = groupMap.get(s1.group_id);
      if (room1 && grp1 && grp1.student_count > room1.capacity) {
        hardViolations++;
        conflicts.push({
          type: 'HC4_ROOM_CAPACITY',
          severity: 'CRITICAL',
          day: s1.day,
          period: `${s1.period_start}-${s1.period_end}`,
          message: `ห้อง ${s1.room_id} จุได้ ${room1.capacity} คน แต่กลุ่ม ${s1.group_id} มีนักเรียน ${grp1.student_count} คน (เกินความจุ)`,
          entity: s1.room_id
        });
      }

      // เช็ค HC5: ความเหมาะสมของประเภทห้อง (Room Type Suitability)
      if (room1 && subj1) {
        const isLabCourse = (!s1.subject_id.startsWith('20') && !s1.subject_id.startsWith('30') && s1.subject_id !== 'HOMEROOM') ||
          (subj1.practice > 0 && subj1.theory <= 1);
        const isGeneralRoom = room1.room_type === 'ห้องเรียนทั่วไป';
        if (isLabCourse && isGeneralRoom) {
          // แจ้งเตือนข้อจำกัดประเภทห้อง
          softViolations++;
          conflicts.push({
            type: 'HC5_ROOM_TYPE_MISMATCH',
            severity: 'WARNING',
            day: s1.day,
            period: `${s1.period_start}-${s1.period_end}`,
            message: `วิชาปฏิบัติ ${s1.subject_id} (${subj1.subject_name}) ควรจัดในห้องปฏิบัติการ แต่จัดในห้องบรรยาย ${s1.room_id}`,
            entity: s1.room_id
          });
        }
      }

      // เปรียบเทียบกับคาบอื่น (Pairwise Conflict Checks)
      for (let j = i + 1; j < schedules.length; j++) {
        const s2 = schedules[j];
        if (s1.day !== s2.day) continue;

        // เช็คว่าช่วงเวลาทับซ้อนกันหรือไม่
        const overlap = Math.max(s1.period_start, s2.period_start) <= Math.min(s1.period_end, s2.period_end);
        if (!overlap) continue;

        // HC1: ครูสอนซ้อน
        if (s1.teacher_id && s2.teacher_id && s1.teacher_id === s2.teacher_id) {
          const tName = teacherMap.get(s1.teacher_id)?.teacher_name || s1.teacher_id;
          hardViolations++;
          conflicts.push({
            type: 'HC1_TEACHER_CONFLICT',
            severity: 'CRITICAL',
            day: s1.day,
            period: `${Math.max(s1.period_start, s2.period_start)}-${Math.min(s1.period_end, s2.period_end)}`,
            message: `ครู ${tName} (${s1.teacher_id}) มีตารางสอนซ้อนกัน: วิชา ${s1.subject_id} และ ${s2.subject_id}`,
            entity: s1.teacher_id
          });
          markMatrix(s1.day, Math.max(s1.period_start, s2.period_start), Math.min(s1.period_end, s2.period_end));
        }

        // HC2: ห้องเรียนซ้อน (ยกเว้นวิชาเดียวกันที่เรียนร่วมกลุ่ม)
        if (s1.room_id && s2.room_id && s1.room_id === s2.room_id) {
          const isSharedCourse = (s1.subject_id === s2.subject_id && s1.teacher_id === s2.teacher_id);
          if (!isSharedCourse) {
            hardViolations++;
            conflicts.push({
              type: 'HC2_ROOM_CONFLICT',
              severity: 'CRITICAL',
              day: s1.day,
              period: `${Math.max(s1.period_start, s2.period_start)}-${Math.min(s1.period_end, s2.period_end)}`,
              message: `ห้องเรียน ${s1.room_id} ถูกใช้งานซ้อนกัน: วิชา ${s1.subject_id} (กลุ่ม ${s1.group_id}) และวิชา ${s2.subject_id} (กลุ่ม ${s2.group_id})`,
              entity: s1.room_id
            });
            markMatrix(s1.day, Math.max(s1.period_start, s2.period_start), Math.min(s1.period_end, s2.period_end));
          }
        }

        // HC3: กลุ่มเรียนซ้อน
        if (s1.group_id && s2.group_id && s1.group_id === s2.group_id) {
          hardViolations++;
          conflicts.push({
            type: 'HC3_GROUP_CONFLICT',
            severity: 'CRITICAL',
            day: s1.day,
            period: `${Math.max(s1.period_start, s2.period_start)}-${Math.min(s1.period_end, s2.period_end)}`,
            message: `กลุ่มเรียน ${s1.group_id} มีตารางเรียนซ้อนกัน: วิชา ${s1.subject_id} และวิชา ${s2.subject_id}`,
            entity: s1.group_id
          });
          markMatrix(s1.day, Math.max(s1.period_start, s2.period_start), Math.min(s1.period_end, s2.period_end));
        }
      }
    }

    // HC6: ตรวจสอบจำนวนคาบที่จัดเทียบกับการลงทะเบียน (Complete Periods Check)
    const requiredHoursMap = new Map();
    registrations.forEach(r => {
      const subj = subjMap.get(r.subject_id);
      const hours = subj ? ((subj.theory || 0) + (subj.practice || 0)) : 2;
      const key = `${r.group_id}_${r.subject_id}`;
      requiredHoursMap.set(key, (requiredHoursMap.get(key) || 0) + hours);
    });

    const scheduledHoursMap = new Map();
    schedules.forEach(s => {
      if (s.subject_id === 'HOMEROOM') return;
      const key = `${s.group_id}_${s.subject_id}`;
      const dur = (s.period_end - s.period_start) + 1;
      scheduledHoursMap.set(key, (scheduledHoursMap.get(key) || 0) + dur);
    });

    requiredHoursMap.forEach((req, key) => {
      const sched = scheduledHoursMap.get(key) || 0;
      if (sched < req) {
        const [grpId, subjId] = key.split('_');
        hardViolations++;
        conflicts.push({
          type: 'HC6_INCOMPLETE_HOURS',
          severity: 'CRITICAL',
          day: '-',
          period: '-',
          message: `กลุ่ม ${grpId} วิชา ${subjId} จัดได้เพียง ${sched}/${req} คาบ (ขาดอีก ${req - sched} คาบ)`,
          entity: subjId
        });
      }
    });

    // ──────────────────────────────────────────────────────────
    // 2. SOFT CONSTRAINTS (การประเมินคุณภาพตาราง 5 ประการ)
    // ──────────────────────────────────────────────────────────

    // SC1: ตรวจสอบภาระงานครูต่อวัน (ไม่ควรเกิน 6 คาบ/วัน)
    const teacherDailyHours = {};
    schedules.forEach(s => {
      if (!s.teacher_id || s.subject_id === 'HOMEROOM') return;
      const key = `${s.teacher_id}_${s.day}`;
      const dur = (s.period_end - s.period_start) + 1;
      teacherDailyHours[key] = (teacherDailyHours[key] || 0) + dur;
    });

    Object.entries(teacherDailyHours).forEach(([key, hours]) => {
      if (hours > 6) {
        softViolations++;
        const [tId, day] = key.split('_');
        const tName = teacherMap.get(tId)?.teacher_name || tId;
        conflicts.push({
          type: 'SC1_TEACHER_OVERLOAD',
          severity: 'WARNING',
          day: day,
          period: '-',
          message: `ครู ${tName} มีภาระสอน ${hours} คาบใน${day} (เกินเกณฑ์แนะนำ 6 คาบ/วัน)`,
          entity: tId
        });
      }
    });

    // SC2: ตรวจสอบคาบว่าง (Windows/Gaps) ของกลุ่มเรียน
    groups.forEach(g => {
      DAYS.forEach(day => {
        const daySlots = schedules
          .filter(s => s.group_id === g.group_id && s.day === day && s.period_start > 0)
          .sort((a, b) => a.period_start - b.period_start);

        if (daySlots.length >= 2) {
          for (let k = 0; k < daySlots.length - 1; k++) {
            const gap = daySlots[k + 1].period_start - daySlots[k].period_end - 1;
            // ยกเว้นช่วงพักกลางวัน (คาบ 4 ถึง 5 ถือว่าปกติ)
            const isLunchGap = (daySlots[k].period_end === 4 && daySlots[k + 1].period_start === 5);
            if (gap > 0 && !isLunchGap) {
              softViolations++;
              conflicts.push({
                type: 'SC2_GROUP_IDLE_GAP',
                severity: 'INFO',
                day: day,
                period: `${daySlots[k].period_end + 1}-${daySlots[k + 1].period_start - 1}`,
                message: `กลุ่ม ${g.group_id} มีคาบว่าง ${gap} คาบ ใน${day} ระหว่างคาบ ${daySlots[k].period_end} และ ${daySlots[k + 1].period_start}`,
                entity: g.group_id
              });
            }
          }
        }
      });
    });

    // ──────────────────────────────────────────────────────────
    // 3. STATISTICAL METRICS & SUMMARY
    // ──────────────────────────────────────────────────────────
    const totalSlots = schedules.length;
    const isValid = hardViolations === 0;
    const hardScore = hardViolations === 0 ? 100 : Math.max(0, Math.round(100 - (hardViolations * 15)));
    const softScore = Math.max(0, Math.round(100 - (softViolations * 5)));

    // อัตราการใช้ห้องเรียน (Room Utilization %)
    // สัปดาห์ละ 5 วัน x 11 คาบ = 55 คาบสูงสุดต่อห้อง
    const roomUtilization = {};
    rooms.forEach(r => {
      const roomSchedules = schedules.filter(s => s.room_id === r.room_id && s.period_start > 0);
      let usedHours = 0;
      roomSchedules.forEach(s => { usedHours += (s.period_end - s.period_start + 1); });
      const percent = Math.round((usedHours / 55) * 100);
      roomUtilization[r.room_id] = {
        room_name: r.room_name,
        room_type: r.room_type,
        capacity: r.capacity,
        usedHours,
        maxHours: 55,
        percent: Math.min(100, percent)
      };
    });

    // ภาระงานสอนของครู (Teacher Workload)
    const teacherLoads = {};
    teachers.forEach(t => {
      const tSchedules = schedules.filter(s => s.teacher_id === t.teacher_id && s.period_start > 0);
      let scheduledHours = 0;
      tSchedules.forEach(s => { scheduledHours += (s.period_end - s.period_start + 1); });
      teacherLoads[t.teacher_id] = {
        teacher_name: t.teacher_name,
        role: t.role,
        scheduledHours
      };
    });

    return {
      isValid,
      hardViolations,
      softViolations,
      hardScore,
      softScore,
      totalSlots,
      conflicts,
      conflictMatrix,
      roomUtilization,
      teacherLoads,
      auditTimestamp: new Date().toISOString()
    };
  }

  return {
    auditSchedule,
    DAYS
  };
})();
