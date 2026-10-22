// ============================================================
//  EDUSCHED AI - REGISTRATIONS MANAGEMENT
//  ข้อมูลการลงทะเบียนเรียน เชื่อมโยงรายวิชากับกลุ่มนักเรียน
// ============================================================

const REG = (() => {
  let _registrations = [];
  let _subjects = [];
  let _groups = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const [regRes, subjRes, grpRes] = await Promise.all([
        db.from(TABLES.REGISTRATIONS).select('*').order('id', { ascending: false }),
        db.from(TABLES.SUBJECTS).select('*').order('subject_id'),
        db.from(TABLES.GROUPS).select('*').order('group_id')
      ]);

      if (regRes.error) throw regRes.error;

      _registrations = regRes.data || [];
      _subjects = subjRes.data || [];
      _groups = grpRes.data || [];

      populateDropdowns();
      renderTable();
    } catch (err) {
      console.error('Error loading registrations:', err);
      showToast('error', 'โหลดข้อมูลล้มเหลว', err.message);
      const tbody = document.getElementById('reg-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty text-center" style="color:var(--danger);padding:30px;">
          <i class="fas fa-triangle-exclamation"></i> ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${err.message}
        </td></tr>`;
      }
    }
  }

  function populateDropdowns() {
    const subjSel = document.getElementById('reg-subject');
    const grp1Sel = document.getElementById('reg-group1');

    if (subjSel) {
      subjSel.innerHTML = '<option value="">-- เลือกรายวิชา --</option>' +
        _subjects.map(s => {
          const type = (s.subject_id.startsWith('20') || s.subject_id.startsWith('30')) ? 'สามัญ' : 'ปฏิบัติ';
          return `<option value="${s.subject_id}">[${type}] ${s.subject_id} - ${s.subject_name} (${(s.theory || 0) + (s.practice || 0)} คาบ)</option>`;
        }).join('');
    }

    if (grp1Sel) {
      grp1Sel.innerHTML = '<option value="">-- เลือกกลุ่มเรียน --</option>' +
        _groups.map(g => `<option value="${g.group_id}">${g.group_id} - ${g.group_name} (${g.student_count || 0} คน)</option>`).join('');
    }
  }

  async function save() {
    const subjId = document.getElementById('reg-subject')?.value.trim();
    const grp1Id = document.getElementById('reg-group1')?.value.trim();

    if (!subjId || !grp1Id) {
      showToast('warning', 'กรุณากรอกข้อมูล * ให้ครบ', 'โปรดเลือกทั้งรายวิชาและกลุ่มเรียน');
      return;
    }

    // Check duplicate
    const duplicate = _registrations.find(r => r.subject_id === subjId && r.group_id === grp1Id);
    if (duplicate) {
      showToast('warning', 'ข้อมูลซ้ำ', `กลุ่มเรียน ${grp1Id} ได้ลงทะเบียนรายวิชา ${subjId} ไว้แล้ว`);
      return;
    }

    const subj = _subjects.find(s => s.subject_id === subjId);
    const isGeneral = subjId.startsWith('20') || subjId.startsWith('30');
    const subjectType = isGeneral ? 'สามัญ' : 'ปฏิบัติ';

    const payload = {
      subject_id: subjId,
      group_id: grp1Id,
      subject_type: subjectType,
      semester: '1',
      academic_year: '2568'
    };

    const btn = document.getElementById('btn-save-reg');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> กำลังบันทึก...';
    }

    try {
      const { data, error } = await db.from(TABLES.REGISTRATIONS).insert([payload]).select();
      if (error) throw error;

      showToast('success', 'บันทึกสำเร็จ', `ลงทะเบียนวิชา ${subjId} ให้กับกลุ่ม ${grp1Id} เรียบร้อยแล้ว`);
      clearForm();
      await loadAll();
      switchTab('table');
    } catch (err) {
      console.error('Error saving registration:', err);
      showToast('error', 'บันทึกล้มเหลว', err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล';
      }
    }
  }

  function renderTable(data = _registrations) {
    const tbody = document.getElementById('reg-tbody');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty text-center" style="padding:40px;color:var(--text-muted);">
        <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.5;"></i>
        ยังไม่มีรายการลงทะเบียนรายวิชา
      </td></tr>`;
      return;
    }

    const subjMap = new Map(_subjects.map(s => [s.subject_id, s]));
    const grpMap = new Map(_groups.map(g => [g.group_id, g]));

    tbody.innerHTML = data.map((r, i) => {
      const subj = subjMap.get(r.subject_id) || { subject_name: '-' };
      const grp = grpMap.get(r.group_id) || { group_name: '-' };
      const type = r.subject_type || ((r.subject_id.startsWith('20') || r.subject_id.startsWith('30')) ? 'สามัญ' : 'ปฏิบัติ');
      const typeBadge = type === 'สามัญ' ? 'badge-primary' : 'badge-warning';

      return `<tr>
        <td>${i + 1}</td>
        <td style="white-space:nowrap;">
          <div style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
            <span class="badge badge-gray font-mono">${r.subject_id}</span>
            <span class="badge ${typeBadge}" style="font-size:11px;white-space:nowrap;">${type}</span>
          </div>
        </td>
        <td style="font-weight:600;color:var(--text-primary);">${subj.subject_name}</td>
        <td><span class="badge badge-gray font-mono">${r.group_id}</span></td>
        <td>${grp.group_name}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="REG.openDeleteModal(${r.id})" title="ลบการลงทะเบียน">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  function clearForm() {
    const subjSel = document.getElementById('reg-subject');
    const grp1Sel = document.getElementById('reg-group1');
    if (subjSel) subjSel.value = '';
    if (grp1Sel) grp1Sel.value = '';
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
      renderTable(_registrations);
      return;
    }
    const subjMap = new Map(_subjects.map(s => [s.subject_id, s]));
    const grpMap = new Map(_groups.map(g => [g.group_id, g]));

    const filtered = _registrations.filter(r => {
      const subj = subjMap.get(r.subject_id);
      const grp = grpMap.get(r.group_id);
      return r.subject_id.toLowerCase().includes(q) ||
        r.group_id.toLowerCase().includes(q) ||
        (subj && subj.subject_name.toLowerCase().includes(q)) ||
        (grp && grp.group_name.toLowerCase().includes(q));
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
      const { error } = await db.from(TABLES.REGISTRATIONS).delete().eq('id', _deleteId);
      if (error) throw error;
      showToast('success', 'ลบสำเร็จ', 'ลบรายการลงทะเบียนเรียบร้อยแล้ว');
      closeDeleteModal();
      await loadAll();
    } catch (err) {
      console.error('Error deleting registration:', err);
      showToast('error', 'ลบล้มเหลว', err.message);
    }
  }

  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    if (_registrations.length === 0) {
      showToast('warning', 'ไม่มีข้อมูลลงทะเบียนที่จะส่งออก');
      return;
    }

    const subjMap = new Map(_subjects.map(s => [s.subject_id, s]));
    const grpMap = new Map(_groups.map(g => [g.group_id, g]));

    const rows = [
      ['ลำดับ', 'รหัสวิชา', 'ชื่อวิชา', 'ประเภทวิชา', 'รหัสกลุ่มเรียน', 'ชื่อกลุ่มเรียน', 'ภาคเรียน', 'ปีการศึกษา']
    ];

    _registrations.forEach((r, idx) => {
      const subj = subjMap.get(r.subject_id) || {};
      const grp = grpMap.get(r.group_id) || {};
      rows.push([
        idx + 1,
        r.subject_id,
        subj.subject_name || '',
        r.subject_type || '',
        r.group_id,
        grp.group_name || '',
        r.semester || '1',
        r.academic_year || '2568'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลการลงทะเบียน');
    XLSX.writeFile(wb, 'EduSched_Registrations.xlsx');
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็น EduSched_Registrations.xlsx');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['subject_id', 'group_id', 'subject_type'],
      ['20000-1401', '672190101', 'สามัญ'],
      ['30204-2001', '672190101', 'ปฏิบัติ']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Registrations');
    XLSX.writeFile(wb, 'Template_Registrations.xlsx');
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
          const subjectId = (row['subject_id'] || row['รหัสวิชา'] || '').toString().trim();
          const groupId = (row['group_id'] || row['รหัสกลุ่ม'] || row['รหัสกลุ่มเรียน'] || '').toString().trim();
          let type = (row['subject_type'] || row['ประเภทวิชา'] || '').toString().trim();

          if (!subjectId || !groupId) {
            errors.push(`แถวที่ ${rowNum}: ขาดรหัสวิชาหรือรหัสกลุ่มเรียน`);
            return;
          }

          if (!type) {
            type = (subjectId.startsWith('20') || subjectId.startsWith('30')) ? 'สามัญ' : 'ปฏิบัติ';
          }

          validBatch.push({
            subject_id: subjectId,
            group_id: groupId,
            subject_type: type,
            semester: '1',
            academic_year: '2568'
          });
        });

        if (errors.length > 0) {
          showToast('warning', 'พบข้อผิดพลาดบางรายการ', errors.slice(0, 3).join(', '));
        }

        if (validBatch.length > 0) {
          const { error } = await db.from(TABLES.REGISTRATIONS).upsert(validBatch, { onConflict: 'subject_id,group_id,semester,academic_year' });
          if (error) throw error;
          showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้าการลงทะเบียนสำเร็จ ${validBatch.length} รายการ`);
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
  REG.loadAll();
});
