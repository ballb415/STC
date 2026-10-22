// ============================================================
//  EDUSCHED AI - AUTOMATED COMPETITION SYSTEM VERIFICATION
//  ชุดทดสอบจำลองเพื่อประเมินความสอดคล้องตามเกณฑ์การแข่งขัน
// ============================================================

const fs = require('fs');
const path = require('path');

// Mock browser globals for Node testing
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

const vm = require('vm');
const compDataContent = fs.readFileSync(path.join(__dirname, '../js/competition-data.js'), 'utf8');
const validatorContent = fs.readFileSync(path.join(__dirname, '../js/timetable-validator.js'), 'utf8');

vm.runInThisContext(compDataContent);
vm.runInThisContext(validatorContent);

console.log('====================================================');
console.log('🎯 EDUSCHED AI - COMPETITION AUTOMATED TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(cond, name) {
  totalTests++;
  if (cond) {
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
  }
}

// ── TEST 1: Benchmark Data Integrity ──
console.log('1. ตรวจสอบความถูกต้องของชุดข้อมูลตัวอย่าง (Benchmark Datasets):');
assert(COMPETITION_DATA.SMALL_DATASET.rooms.length === 4, 'Small dataset has 4 rooms');
assert(COMPETITION_DATA.SMALL_DATASET.teachers.length === 5, 'Small dataset has 5 teachers');
assert(COMPETITION_DATA.SMALL_DATASET.groups.length === 3, 'Small dataset has 3 groups');
assert(COMPETITION_DATA.SMALL_DATASET.subjects.length === 6, 'Small dataset has 6 subjects');

assert(COMPETITION_DATA.LARGE_DATASET.rooms.length >= 10, 'Large dataset has >= 10 rooms');
assert(COMPETITION_DATA.LARGE_DATASET.teachers.length >= 10, 'Large dataset has >= 10 teachers');
assert(COMPETITION_DATA.LARGE_DATASET.groups.length === 6, 'Large dataset has 6 groups');

assert(COMPETITION_DATA.INFEASIBLE_DATASET.subjects[0].theory + COMPETITION_DATA.INFEASIBLE_DATASET.subjects[0].practice > 40, 'Infeasible dataset has overloaded subject hours');

// ── TEST 2: Hard Constraint 1 - Teacher Conflict ──
console.log('\n2. ทดสอบ Hard Constraint 1 (ครูสอนซ้อนเวลา):');
{
  const mockMaster = {
    rooms: [{ room_id: 'R101' }, { room_id: 'R102' }],
    teachers: [{ teacher_id: 'T01', teacher_name: 'ครูนรินทร์' }],
    groups: [{ group_id: 'G1', student_count: 20 }, { group_id: 'G2', student_count: 20 }],
    subjects: [{ subject_id: 'S1', theory: 2, practice: 0 }, { subject_id: 'S2', theory: 2, practice: 0 }],
    teachingLoads: [],
    registrations: []
  };

  const clashingSchedules = [
    { subject_id: 'S1', teacher_id: 'T01', room_id: 'R101', group_id: 'G1', day: 'วันจันทร์', period_start: 1, period_end: 2 },
    { subject_id: 'S2', teacher_id: 'T01', room_id: 'R102', group_id: 'G2', day: 'วันจันทร์', period_start: 2, period_end: 3 }
  ];

  const res = VALIDATOR.auditSchedule(clashingSchedules, mockMaster);
  assert(!res.isValid, 'Validator detects invalid schedule due to teacher clash');
  assert(res.conflicts.some(c => c.type === 'HC1_TEACHER_CONFLICT'), 'Conflict type HC1_TEACHER_CONFLICT correctly identified');
}

// ── TEST 3: Hard Constraint 2 - Room Conflict ──
console.log('\n3. ทดสอบ Hard Constraint 2 (ห้องเรียนใช้งานซ้อนเวลา):');
{
  const mockMaster = {
    rooms: [{ room_id: 'R101' }],
    teachers: [{ teacher_id: 'T01' }, { teacher_id: 'T02' }],
    groups: [{ group_id: 'G1', student_count: 20 }, { group_id: 'G2', student_count: 20 }],
    subjects: [{ subject_id: 'S1' }, { subject_id: 'S2' }],
    teachingLoads: [],
    registrations: []
  };

  const clashingSchedules = [
    { subject_id: 'S1', teacher_id: 'T01', room_id: 'R101', group_id: 'G1', day: 'วันอังคาร', period_start: 3, period_end: 4 },
    { subject_id: 'S2', teacher_id: 'T02', room_id: 'R101', group_id: 'G2', day: 'วันอังคาร', period_start: 4, period_end: 5 }
  ];

  const res = VALIDATOR.auditSchedule(clashingSchedules, mockMaster);
  assert(!res.isValid, 'Validator detects invalid schedule due to room clash');
  assert(res.conflicts.some(c => c.type === 'HC2_ROOM_CONFLICT'), 'Conflict type HC2_ROOM_CONFLICT correctly identified');
}

// ── TEST 4: Hard Constraint 3 - Group Conflict ──
console.log('\n4. ทดสอบ Hard Constraint 3 (กลุ่มเรียนมีคาบซ้อนเวลา):');
{
  const mockMaster = {
    rooms: [{ room_id: 'R101' }, { room_id: 'R102' }],
    teachers: [{ teacher_id: 'T01' }, { teacher_id: 'T02' }],
    groups: [{ group_id: 'G1', student_count: 25 }],
    subjects: [{ subject_id: 'S1' }, { subject_id: 'S2' }],
    teachingLoads: [],
    registrations: []
  };

  const clashingSchedules = [
    { subject_id: 'S1', teacher_id: 'T01', room_id: 'R101', group_id: 'G1', day: 'วันพุธ', period_start: 5, period_end: 6 },
    { subject_id: 'S2', teacher_id: 'T02', room_id: 'R102', group_id: 'G1', day: 'วันพุธ', period_start: 6, period_end: 7 }
  ];

  const res = VALIDATOR.auditSchedule(clashingSchedules, mockMaster);
  assert(!res.isValid, 'Validator detects invalid schedule due to group clash');
  assert(res.conflicts.some(c => c.type === 'HC3_GROUP_CONFLICT'), 'Conflict type HC3_GROUP_CONFLICT correctly identified');
}

// ── TEST 5: Hard Constraint 4 - Room Capacity ──
console.log('\n5. ทดสอบ Hard Constraint 4 (ความจุห้องเรียนไม่เพียงพอ):');
{
  const mockMaster = {
    rooms: [{ room_id: 'R101', capacity: 20 }],
    teachers: [{ teacher_id: 'T01' }],
    groups: [{ group_id: 'G_LARGE', student_count: 45 }],
    subjects: [{ subject_id: 'S1' }],
    teachingLoads: [],
    registrations: []
  };

  const clashingSchedules = [
    { subject_id: 'S1', teacher_id: 'T01', room_id: 'R101', group_id: 'G_LARGE', day: 'วันพฤหัสบดี', period_start: 1, period_end: 2 }
  ];

  const res = VALIDATOR.auditSchedule(clashingSchedules, mockMaster);
  assert(res.conflicts.some(c => c.type === 'HC4_ROOM_CAPACITY'), 'Conflict type HC4_ROOM_CAPACITY correctly identified (45 students in 20-capacity room)');
}

// ── TEST 6: Hard Constraint 7 - Lunch Break Overlap ──
console.log('\n6. ทดสอบ Hard Constraint 7 (ห้ามจัดคาบข้ามช่วงพักกลางวัน 12:00 - 13:00):');
{
  const mockMaster = {
    rooms: [{ room_id: 'R101', capacity: 40 }],
    teachers: [{ teacher_id: 'T01' }],
    groups: [{ group_id: 'G1', student_count: 20 }],
    subjects: [{ subject_id: 'S1' }],
    teachingLoads: [],
    registrations: []
  };

  const clashingSchedules = [
    { subject_id: 'S1', teacher_id: 'T01', room_id: 'R101', group_id: 'G1', day: 'วันศุกร์', period_start: 4, period_end: 5 }
  ];

  const res = VALIDATOR.auditSchedule(clashingSchedules, mockMaster);
  assert(res.conflicts.some(c => c.type === 'HC7_LUNCH_OVERLAP'), 'Conflict type HC7_LUNCH_OVERLAP correctly identified (period 4 to 5)');
}

// ── TEST 7: Complete Valid Schedule Validation ──
console.log('\n7. ทดสอบตารางที่ถูกต้องสมบูรณ์ 100% (Valid Clean Schedule):');
{
  const mockMaster = {
    rooms: [{ room_id: 'R101', capacity: 40 }, { room_id: 'LAB501', capacity: 35, room_type: 'ห้องปฏิบัติการคอมพิวเตอร์' }],
    teachers: [{ teacher_id: 'T01' }, { teacher_id: 'T02' }],
    groups: [{ group_id: 'G1', student_count: 25 }],
    subjects: [{ subject_id: '20000-1401', theory: 2, practice: 0 }, { subject_id: '30204-2001', theory: 2, practice: 2 }],
    teachingLoads: [],
    registrations: [
      { subject_id: '20000-1401', group_id: 'G1' },
      { subject_id: '30204-2001', group_id: 'G1' }
    ]
  };

  const cleanSchedules = [
    // จันทร์: คาบ 1-2 วิชา 20000-1401
    { subject_id: '20000-1401', teacher_id: 'T01', room_id: 'R101', group_id: 'G1', day: 'วันจันทร์', period_start: 1, period_end: 2 },
    // อังคาร: คาบ 5-6 วิชา 30204-2001
    { subject_id: '30204-2001', teacher_id: 'T02', room_id: 'LAB501', group_id: 'G1', day: 'วันอังคาร', period_start: 5, period_end: 6 },
    // พุธ: คาบ 5-6 วิชา 30204-2001
    { subject_id: '30204-2001', teacher_id: 'T02', room_id: 'LAB501', group_id: 'G1', day: 'วันพุธ', period_start: 5, period_end: 6 }
  ];

  const res = VALIDATOR.auditSchedule(cleanSchedules, mockMaster);
  assert(res.isValid, 'Clean schedule passes validation (isValid = true)');
  assert(res.hardScore === 100, 'Hard constraints score is 100%');
  assert(res.hardViolations === 0, 'Hard violations count is 0');
}

// ── TEST 8: Full CSP Solver on Small Benchmark ──
console.log('\n8. ทดสอบ CSP Solver บนชุดข้อมูล Small Benchmark (End-to-End):');
{
  const ds = COMPETITION_DATA.SMALL_DATASET;
  const DAYS = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์'];

  // Deconstruct blocks
  const blocks = [];
  const subjMap = new Map(ds.subjects.map(s => [s.subject_id, s]));
  const grpMap = new Map(ds.groups.map(g => [g.group_id, g]));

  ds.registrations.forEach(r => {
    const subj = subjMap.get(r.subject_id);
    const grp = grpMap.get(r.group_id);
    const tLoad = ds.teachingLoads.find(l => l.subject_id === r.subject_id);
    const teacherId = tLoad ? tLoad.teacher_id : grp.advisor;
    const isLab = !r.subject_id.startsWith('20') && !r.subject_id.startsWith('30');
    const totalHours = (subj.theory || 0) + (subj.practice || 0) || 2;

    const candidateRooms = ds.rooms.filter(room => {
      if (room.capacity < grp.student_count) return false;
      if (isLab) return room.room_type.includes('คอมพิวเตอร์') || room.room_type.includes('ปฏิบัติการ');
      return true;
    }).map(rm => rm.room_id);

    const dur = totalHours >= 4 ? 2 : totalHours;
    blocks.push({
      subject_id: r.subject_id,
      teacher_id: teacherId,
      candidateRooms: candidateRooms.length ? candidateRooms : ds.rooms.map(x => x.room_id),
      group_id: r.group_id,
      duration: dur
    });
    if (totalHours >= 4) {
      blocks.push({
        subject_id: r.subject_id,
        teacher_id: teacherId,
        candidateRooms: candidateRooms.length ? candidateRooms : ds.rooms.map(x => x.room_id),
        group_id: r.group_id,
        duration: totalHours - dur
      });
    }
  });

  // Sort blocks: duration descending
  blocks.sort((a, b) => b.duration - a.duration);

  const candidateSlots = [];
  DAYS.forEach(day => {
    [1, 2, 3, 4].forEach(p => candidateSlots.push({ day, start: p, isMorning: true }));
    [5, 6, 7, 8, 9, 10, 11].forEach(p => candidateSlots.push({ day, start: p, isMorning: false }));
  });

  const generatedSchedules = [];

  function isSlotFree(day, start, end, teacherId, roomId, groupId) {
    for (const s of generatedSchedules) {
      if (s.day !== day) continue;
      const overlap = Math.max(start, s.period_start) <= Math.min(end, s.period_end);
      if (!overlap) continue;
      if (teacherId && s.teacher_id === teacherId) return false;
      if (roomId && s.room_id === roomId) return false;
      if (groupId && s.group_id === groupId) return false;
    }
    return true;
  }

  let placed = 0;
  for (const b of blocks) {
    let success = false;
    for (const slot of candidateSlots) {
      const end = slot.start + b.duration - 1;
      if (slot.isMorning && end > 4) continue;
      if (!slot.isMorning && end > 11) continue;

      for (const roomId of b.candidateRooms) {
        if (isSlotFree(slot.day, slot.start, end, b.teacher_id, roomId, b.group_id)) {
          generatedSchedules.push({
            subject_id: b.subject_id,
            teacher_id: b.teacher_id,
            room_id: roomId,
            group_id: b.group_id,
            day: slot.day,
            period_start: slot.start,
            period_end: end
          });
          placed++;
          success = true;
          break;
        }
      }
      if (success) break;
    }
  }

  assert(placed === blocks.length, `CSP solver successfully placed all ${blocks.length} blocks without missing`);

  const auditResult = VALIDATOR.auditSchedule(generatedSchedules, {
    rooms: ds.rooms,
    teachers: ds.teachers,
    groups: ds.groups,
    subjects: ds.subjects,
    teachingLoads: ds.teachingLoads,
    registrations: ds.registrations
  });

  assert(auditResult.isValid, 'Solver output passes 100% Hard Constraints validation');
  assert(auditResult.hardViolations === 0, 'Solver output has 0 hard violations');
}

console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('====================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
