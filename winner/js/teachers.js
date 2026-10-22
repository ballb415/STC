// ============================================================
//  EDUSCHED AI - TEACHERS MANAGEMENT
// ============================================================

const TEACHERS = (() => {
  let _teachers = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const { data, error } = await db.from(TABLES.TEACHERS).select('*').order('teacher_id');
      if (error) {
        showToast('error', 'โหลดล้มเหลว', error.message);
        return;
      }
      _teachers = data || [];
      renderTable();
    } catch (e) {
      console.error(e);
      showToast('error', 'ข้อผิดพลาดเครือข่าย', e.message);
    }
  }

  async function save() {
    const id = document.getElementById('t-id')?.value.trim();
    const name = document.getElementById('t-name')?.value.trim();
    const role = document.getElementById('t-role')?.value;

    if (!id || !name || !role) {
      showToast('warning', 'กรุณากรอกข้อมูล * ให้ครบ');
      return;
    }

    const payload = {
      teacher_id: id,
      teacher_name: name,
      role: role
    };

    const btn = document.getElementById('btn-save-teacher');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> บันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.TEACHERS).upsert([payload], { onConflict: 'teacher_id' });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', `บันทึกข้อมูลอาจารย์ ${name} เรียบร้อยแล้ว`);
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
    const t = _teachers.find(x => x.id === id);
    if (!t) return;
    document.getElementById('t-id').value = t.teacher_id || '';
    document.getElementById('t-name').value = t.teacher_name || '';
    document.getElementById('t-role').value = t.role || '';
    switchTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderTable(data = _teachers) {
    const tbody = document.getElementById('teachers-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลอาจารย์</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((t, i) => `<tr>
      <td>${i + 1}</td>
      <td><span class="badge badge-gray font-mono">${t.teacher_id}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;">
            ${t.teacher_name.charAt(0)}
          </div>
          <span style="font-weight:600;color:var(--text-primary);">${t.teacher_name}</span>
        </div>
      </td>
      <td><span class="badge ${t.role === 'อาจารย์' ? 'badge-primary' : 'badge-info'}">${t.role}</span></td>
      <td>${formatDate(t.created_at)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="TEACHERS.edit(${t.id})" title="แก้ไข">
            <i class="fas fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="TEACHERS.openModal(${t.id})" title="ลบ">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');
  }

  function clearForm() {
    const tId = document.getElementById('t-id');
    const tName = document.getElementById('t-name');
    const tRole = document.getElementById('t-role');
    if (tId) tId.value = '';
    if (tName) tName.value = '';
    if (tRole) tRole.value = '';
  }

  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  function filter(q) {
    const query = (q || '').toLowerCase();
    renderTable(_teachers.filter(t =>
      t.teacher_id.toLowerCase().includes(query) ||
      t.teacher_name.toLowerCase().includes(query) ||
      (t.role && t.role.toLowerCase().includes(query))
    ));
  }

  function filterRole(role) {
    renderTable(role ? _teachers.filter(t => t.role === role) : _teachers);
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
    const { error } = await db.from(TABLES.TEACHERS).delete().eq('id', _deleteId);
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
      ['ลำดับ', 'รหัสอาจารย์ (teacher_id)', 'ชื่ออาจารย์ (teacher_name)', 'ตำแหน่ง (role)']
    ];
    _teachers.forEach((t, i) => {
      rows.push([i + 1, t.teacher_id, t.teacher_name, t.role]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'อาจารย์');
    XLSX.writeFile(wb, 'EduSched_Teachers.xlsx');
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็น EduSched_Teachers.xlsx');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['teacher_id', 'teacher_name', 'role'],
      ['T01', 'ครูนรินทร์ ชูใจ', 'อาจารย์'],
      ['T02', 'ครูปิยะดา สุขสม', 'อาจารย์']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Teachers');
    XLSX.writeFile(wb, 'Template_Teachers.xlsx');
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
          const teacherId = (row['teacher_id'] || row['รหัสอาจารย์'] || row['รหัสอาจารย์ (teacher_id)'] || '').toString().trim();
          const teacherName = (row['teacher_name'] || row['ชื่ออาจารย์'] || row['ชื่ออาจารย์ (teacher_name)'] || '').toString().trim();
          const role = (row['role'] || row['ตำแหน่ง'] || row['ตำแหน่ง (role)'] || 'อาจารย์').toString().trim();

          if (!teacherId || !teacherName) {
            errors.push(`แถวที่ ${rowNum}: ขาดรหัสอาจารย์หรือชื่ออาจารย์`);
            return;
          }

          validBatch.push({
            teacher_id: teacherId,
            teacher_name: teacherName,
            role: role
          });
        });

        if (errors.length > 0) {
          showToast('warning', 'พบข้อผิดพลาดบางรายการ', errors.slice(0, 3).join(', '));
        }

        if (validBatch.length > 0) {
          const { error } = await db.from(TABLES.TEACHERS).upsert(validBatch, { onConflict: 'teacher_id' });
          if (error) throw error;
          showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้าอาจารย์สำเร็จ ${validBatch.length} ท่าน`);
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
    edit,
    clearForm,
    switchTab,
    filter,
    filterRole,
    openModal,
    closeModal,
    confirmDelete,
    exportExcel,
    downloadTemplate,
    importExcel
  };
})();

document.addEventListener('DOMContentLoaded', () => TEACHERS.loadAll());
