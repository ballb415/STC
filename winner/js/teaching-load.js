// ============================================================
//  EDUSCHED AI - TEACHING LOAD MANAGEMENT
//  การจัดการภาระงานสอน — เชื่อมโยงอาจารย์กับรายวิชาและคำนวณชั่วโมงสอน
// ============================================================

const TL = (() => {
  let _loads = [];
  let _teachers = [];
  let _subjects = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const [loadRes, teacherRes, subjRes] = await Promise.all([
        db.from(TABLES.TEACHING_LOADS).select('*').order('id', { ascending: false }),
        db.from(TABLES.TEACHERS).select('*').order('teacher_id'),
        db.from(TABLES.SUBJECTS).select('*').order('subject_id')
      ]);

      if (loadRes.error) throw loadRes.error;

      _loads = loadRes.data || [];
      _teachers = teacherRes.data || [];
      _subjects = subjRes.data || [];

      populateDropdowns();
      renderTable();
    } catch (err) {
      console.error('Error loading teaching loads:', err);
      showToast('error', 'โหลดข้อมูลล้มเหลว', err.message);
      const tbody = document.getElementById('tl-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty text-center" style="color:var(--danger);padding:30px;">
          <i class="fas fa-triangle-exclamation"></i> ไม่สามารถโหลดข้อมูลภาระงานสอนได้: ${err.message}
        </td></tr>`;
      }
    }
  }

  function populateDropdowns() {
    const tSel = document.getElementById('tl-teacher');
    const sSel = document.getElementById('tl-subject');

    if (tSel) {
      tSel.innerHTML = '<option value="">-- เลือกอาจารย์ --</option>' +
        _teachers.map(t => `<option value="${t.teacher_id}">${t.teacher_id} - ${t.teacher_name} (${t.role || 'อาจารย์'})</option>`).join('');
    }

    if (sSel) {
      sSel.innerHTML = '<option value="">-- เลือกรายวิชา --</option>' +
        _subjects.map(s => {
          const totalHours = (s.theory || 0) + (s.practice || 0);
          return `<option value="${s.subject_id}">${s.subject_id} - ${s.subject_name} (${totalHours} ชม./สัปดาห์)</option>`;
        }).join('');
    }
  }

  async function save() {
    const teacherId = document.getElementById('tl-teacher')?.value.trim();
    const subjId = document.getElementById('tl-subject')?.value.trim();

    if (!teacherId || !subjId) {
      showToast('warning', 'กรุณากรอกข้อมูล * ให้ครบ', 'โปรดเลือกทั้งอาจารย์และรายวิชา');
      return;
    }

    // Check duplicate
    const duplicate = _loads.find(l => l.teacher_id === teacherId && l.subject_id === subjId);
    if (duplicate) {
      showToast('warning', 'ข้อมูลซ้ำ', `อาจารย์ ${teacherId} ได้รับมอบหมายรายวิชา ${subjId} ไว้อยู่แล้ว`);
      return;
    }

    const subj = _subjects.find(s => s.subject_id === subjId);
    const hours = subj ? ((subj.theory || 0) + (subj.practice || 0)) : 0;

    const payload = {
      teacher_id: teacherId,
      subject_id: subjId,
      hours_per_week: hours || 2,
      semester: '1',
      academic_year: '2568'
    };

    const btn = document.getElementById('btn-save-tl');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> กำลังบันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.TEACHING_LOADS).insert([payload]);
      if (error) throw error;

      showToast('success', 'บันทึกสำเร็จ', `มอบหมายวิชา ${subjId} ให้กับครู ${teacherId} เรียบร้อยแล้ว`);
      clearForm();
      await loadAll();
      switchTab('table');
    } catch (err) {
      console.error('Error saving teaching load:', err);
      showToast('error', 'บันทึกล้มเหลว', err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล';
      }
    }
  }

  function renderTable(data = _loads) {
    const tbody = document.getElementById('tl-tbody');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty text-center" style="padding:40px;color:var(--text-muted);">
        <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.5;"></i>
        ยังไม่มีข้อมูลภาระงานสอน
      </td></tr>`;
      return;
    }

    const teacherMap = new Map(_teachers.map(t => [t.teacher_id, t]));
    const subjMap = new Map(_subjects.map(s => [s.subject_id, s]));

    tbody.innerHTML = data.map((l, i) => {
      const teacher = teacherMap.get(l.teacher_id) || { teacher_name: '-' };
      const subj = subjMap.get(l.subject_id) || { subject_name: '-' };
      const hours = l.hours_per_week || ((subj.theory || 0) + (subj.practice || 0)) || 0;

      return `<tr>
        <td>${i + 1}</td>
        <td><span class="badge badge-gray font-mono">${l.teacher_id}</span></td>
        <td style="font-weight:600;color:var(--text-primary);">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;">
              ${(teacher.teacher_name || 'T').charAt(0)}
            </div>
            <span>${teacher.teacher_name}</span>
          </div>
        </td>
        <td><span class="badge badge-gray font-mono">${l.subject_id}</span></td>
        <td>
          <div style="font-weight:600;">${subj.subject_name}</div>
          <div style="font-size:11.5px;color:var(--text-muted);">${hours} ชม./สัปดาห์</div>
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="TL.openDeleteModal(${l.id})" title="ลบภาระงานสอน">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  function clearForm() {
    const tSel = document.getElementById('tl-teacher');
    const sSel = document.getElementById('tl-subject');
    if (tSel) tSel.value = '';
    if (sSel) sSel.value = '';
  }

  function switchTab(tab) {
    const formSection = document.getElementById('section-form');
    const tableSection = document.getElementById('section-table');
    const formTab = document.getElementById('tab-form');
    const tableTab = document.getElementById('tab-table');

    if (formSection) formSection.classList.toggle('hidden', tab !== 'form');
    if (tableSection) tableSection.classList.toggle('hidden', tab !== 'table');
    if (formTab) formTab.classList.toggle('active', tab === 'form');
    if (tableTab) tableTab.classList.toggle('active', tab === 'table');
  }

  function filterTable(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      renderTable(_loads);
      return;
    }
    const teacherMap = new Map(_teachers.map(t => [t.teacher_id, t]));
    const subjMap = new Map(_subjects.map(s => [s.subject_id, s]));

    const filtered = _loads.filter(l => {
      const teacher = teacherMap.get(l.teacher_id);
      const subj = subjMap.get(l.subject_id);
      return l.teacher_id.toLowerCase().includes(q) ||
        l.subject_id.toLowerCase().includes(q) ||
        (teacher && teacher.teacher_name.toLowerCase().includes(q)) ||
        (subj && subj.subject_name.toLowerCase().includes(q));
    });
    renderTable(filtered);
  }

  function openDeleteModal(id) {
    _deleteId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    _deleteId = null;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('hidden');
  }

  async function confirmDelete() {
    if (!_deleteId) return;
    try {
      const { error } = await db.from(TABLES.TEACHING_LOADS).delete().eq('id', _deleteId);
      if (error) throw error;
      showToast('success', 'ลบสำเร็จ', 'ลบภาระงานสอนเรียบร้อยแล้ว');
      closeDeleteModal();
      await loadAll();
    } catch (err) {
      console.error('Error deleting teaching load:', err);
      showToast('error', 'ลบล้มเหลว', err.message);
    }
  }

  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    if (_loads.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลภาระงานสอนที่จะส่งออก');
      return;
    }

    const teacherMap = new Map(_teachers.map(t => [t.teacher_id, t]));
    const subjMap = new Map(_subjects.map(s => [s.subject_id, s]));

    const rows = [
      ['ลำดับ', 'รหัสอาจารย์', 'ชื่ออาจารย์', 'รหัสวิชา', 'ชื่อวิชา', 'ชั่วโมง/สัปดาห์', 'ภาคเรียน', 'ปีการศึกษา']
    ];

    _loads.forEach((l, idx) => {
      const teacher = teacherMap.get(l.teacher_id) || {};
      const subj = subjMap.get(l.subject_id) || {};
      const hours = l.hours_per_week || ((subj.theory || 0) + (subj.practice || 0)) || 0;
      rows.push([
        idx + 1,
        l.teacher_id,
        teacher.teacher_name || '',
        l.subject_id,
        subj.subject_name || '',
        hours,
        l.semester || '1',
        l.academic_year || '2568'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ภาระงานสอน');
    XLSX.writeFile(wb, 'EduSched_TeachingLoads.xlsx');
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็น EduSched_TeachingLoads.xlsx');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['teacher_id', 'subject_id', 'hours_per_week'],
      ['T01', '20000-1401', 2],
      ['T02', '30204-2001', 4]
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_TeachingLoads');
    XLSX.writeFile(wb, 'Template_TeachingLoads.xlsx');
    showToast('info', 'ดาวน์โหลดแม่แบบสำเร็จ');
  }

  async function importExcel(input) {
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const sheet = wb.Sheets[wsName];
        const json = XLSX.utils.sheet_to_json(sheet);

        if (!json || json.length === 0) {
          showToast('warning', 'ไฟล์ว่างเปล่า');
          return;
        }

        const validBatch = [];
        const errors = [];

        json.forEach((row, idx) => {
          const rowNum = idx + 2;
          const teacherId = (row['teacher_id'] || row['รหัสอาจารย์'] || '').toString().trim();
          const subjectId = (row['subject_id'] || row['รหัสวิชา'] || '').toString().trim();
          const hours = parseInt(row['hours_per_week'] || row['ชั่วโมงต่อสัปดาห์'] || row['ชั่วโมง'] || 2, 10);

          if (!teacherId || !subjectId) {
            errors.push(`แถวที่ ${rowNum}: ขาดรหัสอาจารย์หรือรหัสวิชา`);
            return;
          }

          validBatch.push({
            teacher_id: teacherId,
            subject_id: subjectId,
            hours_per_week: isNaN(hours) ? 2 : hours,
            semester: '1',
            academic_year: '2568'
          });
        });

        if (errors.length > 0) {
          showToast('warning', 'พบข้อผิดพลาดบางรายการ', errors.slice(0, 3).join(', '));
        }

        if (validBatch.length > 0) {
          const { error } = await db.from(TABLES.TEACHING_LOADS).upsert(validBatch, { onConflict: 'teacher_id,subject_id,semester,academic_year' });
          if (error) throw error;
          showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้าภาระงานสอนสำเร็จ ${validBatch.length} รายการ`);
          await loadAll();
          switchTab('table');
        }
      } catch (err) {
        console.error(err);
        showToast('error', 'การนำเข้าล้มเหลว', err.message);
      } finally {
        input.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return {
    loadAll,
    save,
    clearForm,
    switchTab,
    filterTable,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    exportExcel,
    downloadTemplate,
    importExcel
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  TL.loadAll();
});
