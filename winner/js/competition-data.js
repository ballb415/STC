// ============================================================
//  EDUSCHED AI - COMPETITION DATASETS & BENCHMARKS
//  ชุดข้อมูลตัวอย่างระดับการแข่งขันทักษะเทคโนโลยีปัญญาประดิษฐ์ สอศ.
//  ปีการศึกษา 2568-2572
// ============================================================

const COMPETITION_DATA = (() => {

  // ── 1. SMALL BENCHMARK (ชุดข้อมูลขนาดเล็ก - 3 กลุ่มเรียน, 5 ครู, 6 วิชา, 4 ห้อง) ──
  const SMALL_DATASET = {
    name: 'ชุดทดสอบขนาดเล็ก (Small Benchmark)',
    description: 'เหมาะสำหรับการทดสอบระบบอย่างรวดเร็วและการตรวจสอบ Feasibility พื้นฐาน',
    rooms: [
      { room_id: 'R101', room_name: 'ห้องบรรยาย 101', room_type: 'ห้องเรียนทั่วไป', capacity: 40 },
      { room_id: 'R102', room_name: 'ห้องบรรยาย 102', room_type: 'ห้องเรียนทั่วไป', capacity: 40 },
      { room_id: 'LAB501', room_name: 'ห้องปฏิบัติการคอมพิวเตอร์ 1', room_type: 'ห้องปฏิบัติการคอมพิวเตอร์', capacity: 35 },
      { room_id: 'LAB502', room_name: 'ห้องปฏิบัติการเครือข่าย', room_type: 'ห้องปฏิบัติการ', capacity: 30 }
    ],
    teachers: [
      { teacher_id: 'T01', teacher_name: 'ครูนรินทร์ ชูใจ', role: 'อาจารย์' },
      { teacher_id: 'T02', teacher_name: 'ครูปิยะดา สุขสม', role: 'อาจารย์' },
      { teacher_id: 'T03', teacher_name: 'ครูพงษ์ศักดิ์ ภักดี', role: 'หัวหน้าแผนก' },
      { teacher_id: 'T04', teacher_name: 'ครูวิภา บุญเรือง', role: 'อาจารย์' },
      { teacher_id: 'T05', teacher_name: 'ครูธนกร วงศ์ษา', role: 'ครูพิเศษ' }
    ],
    groups: [
      { group_id: '672190101', group_name: 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1/1', student_count: 25, advisor: 'T01' },
      { group_id: '672190102', group_name: 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1/2', student_count: 24, advisor: 'T02' },
      { group_id: '672040101', group_name: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ ปวช.1/1', student_count: 28, advisor: 'T03' }
    ],
    subjects: [
      { subject_id: 'HOMEROOM', subject_name: 'กิจกรรมหน้าเสาธงและโฮมรูม', theory: 1, practice: 0, credit: 0 },
      { subject_id: '20000-1401', subject_name: 'ภาษาไทยพื้นฐาน', theory: 2, practice: 0, credit: 2 },
      { subject_id: '30000-1201', subject_name: 'ภาษาอังกฤษเพื่อการสื่อสาร', theory: 2, practice: 0, credit: 2 },
      { subject_id: '30204-2001', subject_name: 'ระบบเครือข่ายคอมพิวเตอร์', theory: 2, practice: 2, credit: 3 },
      { subject_id: '30204-2002', subject_name: 'การเขียนโปรแกรมคอมพิวเตอร์', theory: 2, practice: 2, credit: 3 },
      { subject_id: '20901-2005', subject_name: 'งานซ่อมบำรุงคอมพิวเตอร์', theory: 1, practice: 3, credit: 2 }
    ],
    teachingLoads: [
      { teacher_id: 'T01', subject_id: '30204-2001', hours_per_week: 4 },
      { teacher_id: 'T02', subject_id: '30204-2002', hours_per_week: 4 },
      { teacher_id: 'T03', subject_id: '20901-2005', hours_per_week: 4 },
      { teacher_id: 'T04', subject_id: '20000-1401', hours_per_week: 2 },
      { teacher_id: 'T05', subject_id: '30000-1201', hours_per_week: 2 }
    ],
    registrations: [
      { subject_id: '20000-1401', group_id: '672190101', subject_type: 'สามัญ' },
      { subject_id: '30000-1201', group_id: '672190101', subject_type: 'สามัญ' },
      { subject_id: '30204-2001', group_id: '672190101', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2002', group_id: '672190101', subject_type: 'ปฏิบัติ' },
      { subject_id: '20000-1401', group_id: '672190102', subject_type: 'สามัญ' },
      { subject_id: '30000-1201', group_id: '672190102', subject_type: 'สามัญ' },
      { subject_id: '30204-2001', group_id: '672190102', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2002', group_id: '672190102', subject_type: 'ปฏิบัติ' },
      { subject_id: '20000-1401', group_id: '672040101', subject_type: 'สามัญ' },
      { subject_id: '20901-2005', group_id: '672040101', subject_type: 'ปฏิบัติ' }
    ]
  };

  // ── 2. LARGE BENCHMARK (ชุดข้อมูลขนาดใหญ่ - 18 ห้อง, 15 ครู, 25 วิชา, 6 กลุ่มเรียน) ──
  const LARGE_DATASET = {
    name: 'ชุดทดสอบขนาดใหญ่ (Large Competition Benchmark)',
    description: 'ทดสอบประสิทธิภาพ AI Solver ในระดับวิทยาลัย/สถาบันอาชีวศึกษาเต็มรูปแบบ',
    rooms: [
      { room_id: 'R101', room_name: 'ห้องเรียนทฤษฎี 101', room_type: 'ห้องเรียนทั่วไป', capacity: 45 },
      { room_id: 'R102', room_name: 'ห้องเรียนทฤษฎี 102', room_type: 'ห้องเรียนทั่วไป', capacity: 45 },
      { room_id: 'R103', room_name: 'ห้องเรียนทฤษฎี 103', room_type: 'ห้องเรียนทั่วไป', capacity: 45 },
      { room_id: 'R201', room_name: 'ห้องเรียนทฤษฎี 201', room_type: 'ห้องเรียนทั่วไป', capacity: 40 },
      { room_id: 'R202', room_name: 'ห้องเรียนทฤษฎี 202', room_type: 'ห้องเรียนทั่วไป', capacity: 40 },
      { room_id: 'LAB501', room_name: 'ห้องปฏิบัติการคอมพิวเตอร์ 1', room_type: 'ห้องปฏิบัติการคอมพิวเตอร์', capacity: 35 },
      { room_id: 'LAB502', room_name: 'ห้องปฏิบัติการคอมพิวเตอร์ 2', room_type: 'ห้องปฏิบัติการคอมพิวเตอร์', capacity: 35 },
      { room_id: 'LAB503', room_name: 'ห้องปฏิบัติการ AI & Data Science', room_type: 'ห้องปฏิบัติการคอมพิวเตอร์', capacity: 30 },
      { room_id: 'LAB504', room_name: 'ห้องปฏิบัติการเครือข่ายและความมั่นคงไซเบอร์', room_type: 'ห้องปฏิบัติการ', capacity: 30 },
      { room_id: 'LAB601', room_name: 'ห้องปฏิบัติการ IoT และสมองกลฝังตัว', room_type: 'ห้องปฏิบัติการ', capacity: 30 },
      { room_id: 'R301', room_name: 'ห้องสัมมนาวิชาการ', room_type: 'ห้องประชุม', capacity: 60 }
    ],
    teachers: [
      { teacher_id: 'T01', teacher_name: 'ครูนรินทร์ ชูใจ', role: 'อาจารย์' },
      { teacher_id: 'T02', teacher_name: 'ครูปิยะดา สุขสม', role: 'อาจารย์' },
      { teacher_id: 'T03', teacher_name: 'ครูพงษ์ศักดิ์ ภักดี', role: 'หัวหน้าแผนก' },
      { teacher_id: 'T04', teacher_name: 'ครูวิภา บุญเรือง', role: 'อาจารย์' },
      { teacher_id: 'T05', teacher_name: 'ครูธนกร วงศ์ษา', role: 'อาจารย์' },
      { teacher_id: 'T06', teacher_name: 'ครูศิริพร เจริญสุข', role: 'อาจารย์' },
      { teacher_id: 'T07', teacher_name: 'ครูเอกชัย ยิ่งยง', role: 'อาจารย์' },
      { teacher_id: 'T08', teacher_name: 'ครูชัชวาลย์ มีทรัพย์', role: 'ครูพิเศษ' },
      { teacher_id: 'T09', teacher_name: 'ครูกัลยาณี ศรีสวัสดิ์', role: 'อาจารย์' },
      { teacher_id: 'T10', teacher_name: 'ครูณัฐพล รุ่งเรือง', role: 'อาจารย์' },
      { teacher_id: 'T11', teacher_name: 'ครูพิมพ์ใจ แสงทอง', role: 'อาจารย์' },
      { teacher_id: 'T12', teacher_name: 'ครูอภิสิทธิ์ เพชรดี', role: 'อาจารย์' }
    ],
    groups: [
      { group_id: '672190101', group_name: 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1/1', student_count: 26, advisor: 'T01' },
      { group_id: '672190102', group_name: 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1/2', student_count: 25, advisor: 'T02' },
      { group_id: '662190101', group_name: 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.2/1', student_count: 24, advisor: 'T03' },
      { group_id: '672040101', group_name: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ ปวช.1/1', student_count: 30, advisor: 'T04' },
      { group_id: '672040102', group_name: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ ปวช.1/2', student_count: 28, advisor: 'T05' },
      { group_id: '662040101', group_name: 'สาขาวิชาคอมพิวเตอร์ธุรกิจ ปวช.2/1', student_count: 27, advisor: 'T06' }
    ],
    subjects: [
      { subject_id: 'HOMEROOM', subject_name: 'กิจกรรมหน้าเสาธงและโฮมรูม', theory: 1, practice: 0, credit: 0 },
      { subject_id: '20000-1401', subject_name: 'ภาษาไทยพื้นฐาน', theory: 2, practice: 0, credit: 2 },
      { subject_id: '20000-1201', subject_name: 'ภาษาอังกฤษเพื่อการสื่อสาร', theory: 2, practice: 0, credit: 2 },
      { subject_id: '30000-1201', subject_name: 'ภาษาอังกฤษเชิงเทคนิค', theory: 2, practice: 0, credit: 2 },
      { subject_id: '20000-1101', subject_name: 'สังคมศึกษา', theory: 2, practice: 0, credit: 2 },
      { subject_id: '30204-2001', subject_name: 'ระบบเครือข่ายคอมพิวเตอร์', theory: 2, practice: 2, credit: 3 },
      { subject_id: '30204-2002', subject_name: 'การพัฒนาโปรแกรมบนอุปกรณ์เคลื่อนที่', theory: 2, practice: 2, credit: 3 },
      { subject_id: '30204-2003', subject_name: 'ปัญญาประดิษฐ์เพื่องานธุรกิจ', theory: 2, practice: 2, credit: 3 },
      { subject_id: '30204-2004', subject_name: 'ระบบจัดการฐานข้อมูล', theory: 2, practice: 2, credit: 3 },
      { subject_id: '30204-2005', subject_name: 'โครงงานพัฒนาซอฟต์แวร์ 1', theory: 1, practice: 3, credit: 2 },
      { subject_id: '20901-2001', subject_name: 'หลักการเขียนโปรแกรม', theory: 2, practice: 2, credit: 3 },
      { subject_id: '20901-2002', subject_name: 'คอมพิวเตอร์และการบำรุงรักษา', theory: 1, practice: 3, credit: 2 },
      { subject_id: '20901-2003', subject_name: 'ระบบปฏิบัติการเบื้องต้น', theory: 2, practice: 0, credit: 2 },
      { subject_id: '20901-2004', subject_name: 'งานกราฟิกและสื่อดิจิทัล', theory: 1, practice: 3, credit: 2 }
    ],
    teachingLoads: [
      { teacher_id: 'T01', subject_id: '30204-2001', hours_per_week: 4 },
      { teacher_id: 'T02', subject_id: '30204-2002', hours_per_week: 4 },
      { teacher_id: 'T03', subject_id: '30204-2003', hours_per_week: 4 },
      { teacher_id: 'T07', subject_id: '30204-2004', hours_per_week: 4 },
      { teacher_id: 'T03', subject_id: '30204-2005', hours_per_week: 4 },
      { teacher_id: 'T08', subject_id: '20901-2001', hours_per_week: 4 },
      { teacher_id: 'T09', subject_id: '20901-2002', hours_per_week: 4 },
      { teacher_id: 'T10', subject_id: '20901-2003', hours_per_week: 2 },
      { teacher_id: 'T11', subject_id: '20901-2004', hours_per_week: 4 },
      { teacher_id: 'T04', subject_id: '20000-1401', hours_per_week: 2 },
      { teacher_id: 'T05', subject_id: '20000-1201', hours_per_week: 2 },
      { teacher_id: 'T06', subject_id: '30000-1201', hours_per_week: 2 },
      { teacher_id: 'T12', subject_id: '20000-1101', hours_per_week: 2 }
    ],
    registrations: [
      // ปวส.1/1
      { subject_id: '30000-1201', group_id: '672190101', subject_type: 'สามัญ' },
      { subject_id: '30204-2001', group_id: '672190101', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2002', group_id: '672190101', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2004', group_id: '672190101', subject_type: 'ปฏิบัติ' },
      // ปวส.1/2
      { subject_id: '30000-1201', group_id: '672190102', subject_type: 'สามัญ' },
      { subject_id: '30204-2001', group_id: '672190102', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2002', group_id: '672190102', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2004', group_id: '672190102', subject_type: 'ปฏิบัติ' },
      // ปวส.2/1
      { subject_id: '30204-2003', group_id: '662190101', subject_type: 'ปฏิบัติ' },
      { subject_id: '30204-2005', group_id: '662190101', subject_type: 'ปฏิบัติ' },
      // ปวช.1/1
      { subject_id: '20000-1401', group_id: '672040101', subject_type: 'สามัญ' },
      { subject_id: '20000-1201', group_id: '672040101', subject_type: 'สามัญ' },
      { subject_id: '20901-2001', group_id: '672040101', subject_type: 'ปฏิบัติ' },
      { subject_id: '20901-2002', group_id: '672040101', subject_type: 'ปฏิบัติ' },
      // ปวช.1/2
      { subject_id: '20000-1401', group_id: '672040102', subject_type: 'สามัญ' },
      { subject_id: '20000-1201', group_id: '672040102', subject_type: 'สามัญ' },
      { subject_id: '20901-2001', group_id: '672040102', subject_type: 'ปฏิบัติ' },
      { subject_id: '20901-2002', group_id: '672040102', subject_type: 'ปฏิบัติ' },
      // ปวช.2/1
      { subject_id: '20000-1101', group_id: '662040101', subject_type: 'สามัญ' },
      { subject_id: '20901-2003', group_id: '662040101', subject_type: 'สามัญ' },
      { subject_id: '20901-2004', group_id: '662040101', subject_type: 'ปฏิบัติ' }
    ]
  };

  // ── 3. INFEASIBLE BENCHMARK (กรณีทดสอบที่ไม่มีคำตอบ เพื่อประเมินระบบแจ้งเตือนข้อขัดแย้ง) ──
  const INFEASIBLE_DATASET = {
    name: 'ชุดทดสอบข้อขัดแย้ง (Infeasible Benchmark)',
    description: 'ทดสอบการตรวจพบ Infeasible State โดยกำหนดให้ครู 1 คนมีภาระงานเกินความจุเวลาของสัปดาห์ หรือห้องเรียนไม่เพียงพอ',
    rooms: [
      { room_id: 'LAB_TIGHT', room_name: 'ห้องแล็บเฉพาะทางจำกัด', room_type: 'ห้องปฏิบัติการคอมพิวเตอร์', capacity: 20 }
    ],
    teachers: [
      { teacher_id: 'T_OVERLOAD', teacher_name: 'ครูผู้มีภาระงานเกินขีดจำกัด', role: 'อาจารย์' }
    ],
    groups: [
      { group_id: 'GRP_BIG', group_name: 'กลุ่มนักเรียนขนาดใหญ่พิเศษ', student_count: 65, advisor: 'T_OVERLOAD' }
    ],
    subjects: [
      { subject_id: 'SUBJ_IMPOSSIBLE', subject_name: 'วิชาปฏิบัติการขนาดมหึมา', theory: 20, practice: 25, credit: 10 }
    ],
    teachingLoads: [
      { teacher_id: 'T_OVERLOAD', subject_id: 'SUBJ_IMPOSSIBLE', hours_per_week: 45 }
    ],
    registrations: [
      { subject_id: 'SUBJ_IMPOSSIBLE', group_id: 'GRP_BIG', subject_type: 'ปฏิบัติ' }
    ]
  };

  // ── ฟังก์ชันโหลด Dataset เข้าสู่ระบบจริง ──────────────────────────
  async function loadDataset(type) {
    let dataset;
    if (type === 'small') dataset = SMALL_DATASET;
    else if (type === 'large') dataset = LARGE_DATASET;
    else if (type === 'infeasible') dataset = INFEASIBLE_DATASET;
    else return false;

    if (!confirm(`คุณต้องการแทนที่ข้อมูลปัจจุบันด้วย "${dataset.name}" ใช่หรือไม่?\n\n(ข้อมูลตารางสอนเดิมจะถูกล้างเพื่อให้พร้อมคำนวณใหม่)`)) {
      return false;
    }

    try {
      showToast('info', 'กำลังนำเข้าชุดข้อมูล...', dataset.name);

      // ล้างตาราง schedules เดิมก่อน
      await db.from(TABLES.SCHEDULES).delete().neq('id', 0);
      await db.from(TABLES.REGISTRATIONS).delete().neq('id', 0);
      await db.from(TABLES.TEACHING_LOADS).delete().neq('id', 0);

      // อัปเดตตารางหลักแบบ Upsert
      if (dataset.rooms?.length) await db.from(TABLES.ROOMS).upsert(dataset.rooms, { onConflict: 'room_id' });
      if (dataset.teachers?.length) await db.from(TABLES.TEACHERS).upsert(dataset.teachers, { onConflict: 'teacher_id' });
      if (dataset.groups?.length) await db.from(TABLES.GROUPS).upsert(dataset.groups, { onConflict: 'group_id' });
      if (dataset.subjects?.length) await db.from(TABLES.SUBJECTS).upsert(dataset.subjects, { onConflict: 'subject_id' });

      // แทรกภาระงานและการลงทะเบียน
      if (dataset.teachingLoads?.length) {
        const loads = dataset.teachingLoads.map(l => ({ ...l, semester: '1', academic_year: '2568' }));
        await db.from(TABLES.TEACHING_LOADS).insert(loads);
      }
      if (dataset.registrations?.length) {
        const regs = dataset.registrations.map(r => ({ ...r, semester: '1', academic_year: '2568' }));
        await db.from(TABLES.REGISTRATIONS).insert(regs);
      }

      showToast('success', 'นำเข้าชุดข้อมูลสำเร็จ!', `โหลด "${dataset.name}" เรียบร้อยแล้ว`);
      return true;
    } catch (err) {
      console.error('Error loading dataset:', err);
      showToast('error', 'นำเข้าชุดข้อมูลล้มเหลว', err.message);
      return false;
    }
  }

  return {
    SMALL_DATASET,
    LARGE_DATASET,
    INFEASIBLE_DATASET,
    loadDataset
  };
})();
