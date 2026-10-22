// ============================================================
//  EDUSCHED AI - GROUPS MANAGEMENT
// ============================================================

const GROUPS = (() => {
  let _groups = [];
  let _teachers = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const { data, error } = await db.from(TABLES.GROUPS).select('*').order('group_id');
      if (error) {
        showToast('error', 'โหลดล้มเหลว', error.message);
        return;
      }
      _groups = data || [];
      renderTable();
    } catch (e) {
      console.error(e);
      showToast('error', 'ข้อผิดพลาดเครือข่าย', e.message);
    }
  }

  async function loadAdvisors() {
    const sel = document.getElementById('g-advisor');
    if (!sel) return;
    try {
      const { data } = await db.from(TABLES.TEACHERS).select('*').order('teacher_name');
      _teachers = data || [];
      sel.innerHTML = '<option value="">-- เลือกอาจารย์ที่ปรึกษา --</option>' +
        _teachers.map(t => `<option value="${t.teacher_id}">${t.teacher_name} (${t.teacher_id})</option>`).join('');
    } catch (e) {
      console.error('Error loading advisors:', e);
    }
  }

  async function save() {
    const id = document.getElementById('g-id')?.value.trim();
    const name = document.getElementById('g-name')?.value.trim();
    const count = document.getElementById('g-count')?.value;
    const advisor = document.getElementById('g-advisor')?.value;

    if (!id || !name) {
      showToast('warning', 'กรุณากรอกข้อมูล * ให้ครบ');
      return;
    }

    const payload = {
      group_id: id,
      group_name: name,
      student_count: count ? parseInt(count, 10) : 0,
      advisor: advisor || null
    };

    const btn = document.getElementById('btn-save-group');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> บันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.GROUPS).upsert([payload], { onConflict: 'group_id' });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', `บันทึกกลุ่มเรียน ${id} เรียบร้อยแล้ว`);
      clearForm();
      await loadAll();
      switchTab('table');
    } catch (err) {
      showToast('error', 'บันทึกล้มเหลว', err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-floppy-disk"></i> บันทึกข้อมูล';
      }
    }
  }

  function edit(id) {
    const g = _groups.find(x => x.id === id);
    if (!g) return;
    document.getElementById('g-id').value = g.group_id || '';
    document.getElementById('g-name').value = g.group_name || '';
    document.getElementById('g-count').value = g.student_count || 0;
    const advEl = document.getElementById('g-advisor');
    if (advEl) advEl.value = g.advisor || '';
    switchTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderTable(data = _groups) {
    const tbody = document.getElementById('groups-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลกลุ่มนักเรียน</td></tr>';
      return;
    }

    const teacherMap = new Map(_teachers.map(t => [t.teacher_id, t]));

    tbody.innerHTML = data.map((g, i) => {
      const advisorObj = teacherMap.get(g.advisor);
      const advisorLabel = advisorObj ? `${advisorObj.teacher_name} (${g.advisor})` : (g.advisor || '-');

      return `<tr>
        <td>${i + 1}</td>
        <td><span class="badge badge-gray font-mono">${g.group_id}</span></td>
        <td style="font-weight:600;color:var(--text-primary);">${g.group_name}</td>
        <td><span class="badge badge-info">${g.student_count || 0} คน</span></td>
        <td>${advisorLabel}</td>
        <td>${formatDate(g.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost btn-sm" onclick="GROUPS.edit(${g.id})" title="แก้ไข">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="GROUPS.openModal(${g.id})" title="ลบ">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function clearForm() {
    const gId = document.getElementById('g-id');
    const gName = document.getElementById('g-name');
    const gCount = document.getElementById('g-count');
    const gAdv = document.getElementById('g-advisor');
    if (gId) gId.value = '';
    if (gName) gName.value = '';
    if (gCount) gCount.value = '';
    if (gAdv) gAdv.value = '';
  }

  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  function filter(q) {
    const query = (q || '').toLowerCase();
    renderTable(_groups.filter(g =>
      g.group_id.toLowerCase().includes(query) ||
      g.group_name.toLowerCase().includes(query) ||
      (g.advisor && g.advisor.toLowerCase().includes(query))
    ));
  }

  function openModal(id) {
    _deleteId = id;
    document.getElementById('deleteModal')?.classList.remove('hidden');
  }

  function closeModal() {
    _deleteId = null;
    document.getElementById('deleteModal')?.classList.add('hidden');
  }

  async function confirmDelete() {
    if (!_deleteId) return;
    const { error } = await db.from(TABLES.GROUPS).delete().eq('id', _deleteId);
    if (error) {
      showToast('error', 'ลบล้มเหลว', error.message);
      return;
    }
    showToast('success', 'ลบสำเร็จ');
    closeModal();
    loadAll();
  }

  function exportExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['ลำดับ', 'รหัสกลุ่ม (group_id)', 'ชื่อกลุ่ม (group_name)', 'จำนวนนักเรียน (student_count)', 'อาจารย์ที่ปรึกษา (advisor)']
    ];
    _groups.forEach((g, i) => {
      rows.push([i + 1, g.group_id, g.group_name, g.student_count || 0, g.advisor || '']);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'กลุ่มนักเรียน');
    XLSX.writeFile(wb, 'EduSched_Groups.xlsx');
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็น EduSched_Groups.xlsx');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['group_id', 'group_name', 'student_count', 'advisor'],
      ['672190101', 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1/1', 25, 'T01'],
      ['672190102', 'สาขาวิชาเทคโนโลยีสารสนเทศ ปวส.1/2', 25, 'T02']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Groups');
    XLSX.writeFile(wb, 'Template_Groups.xlsx');
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
          const groupId = (row['group_id'] || row['รหัสกลุ่ม'] || row['รหัสกลุ่ม (group_id)'] || '').toString().trim();
          const groupName = (row['group_name'] || row['ชื่อกลุ่ม'] || row['ชื่อกลุ่ม (group_name)'] || '').toString().trim();
          const count = parseInt(row['student_count'] || row['จำนวนนักเรียน'] || 0, 10);
          const advisor = (row['advisor'] || row['อาจารย์ที่ปรึกษา'] || '').toString().trim();

          if (!groupId || !groupName) {
            errors.push(`แถวที่ ${rowNum}: ขาดรหัสกลุ่มหรือชื่อกลุ่ม`);
            return;
          }

          validBatch.push({
            group_id: groupId,
            group_name: groupName,
            student_count: isNaN(count) ? 0 : count,
            advisor: advisor || null
          });
        });

        if (errors.length > 0) {
          showToast('warning', 'พบข้อผิดพลาดบางรายการ', errors.slice(0, 3).join(', '));
        }

        if (validBatch.length > 0) {
          const { error } = await db.from(TABLES.GROUPS).upsert(validBatch, { onConflict: 'group_id' });
          if (error) throw error;
          showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้ากลุ่มเรียนสำเร็จ ${validBatch.length} กลุ่ม`);
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
    loadAdvisors,
    save,
    edit,
    clearForm,
    switchTab,
    filter,
    openModal,
    closeModal,
    confirmDelete,
    exportExcel,
    downloadTemplate,
    importExcel
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  GROUPS.loadAll();
  GROUPS.loadAdvisors();
});
