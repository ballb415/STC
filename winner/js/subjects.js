// ============================================================
//  EDUSCHED AI - SUBJECTS MANAGEMENT
// ============================================================

const SUBJECTS = (() => {
  let _subjects = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const { data, error } = await db.from(TABLES.SUBJECTS).select('*').order('subject_id');
      if (error) {
        showToast('error', 'โหลดล้มเหลว', error.message);
        return;
      }
      _subjects = data || [];
      renderTable();
    } catch (e) {
      console.error(e);
      showToast('error', 'ข้อผิดพลาดเครือข่าย', e.message);
    }
  }

  async function save() {
    const id = document.getElementById('s-id')?.value.trim();
    const name = document.getElementById('s-name')?.value.trim();
    const theory = document.getElementById('s-theory')?.value;
    const practice = document.getElementById('s-practice')?.value;
    const credit = document.getElementById('s-credit')?.value;

    if (!id || !name) {
      showToast('warning', 'กรุณากรอกข้อมูล * ให้ครบ');
      return;
    }

    const payload = {
      subject_id: id,
      subject_name: name,
      theory: theory ? parseInt(theory, 10) : 0,
      practice: practice ? parseInt(practice, 10) : 0,
      credit: credit ? parseInt(credit, 10) : 0
    };

    const btn = document.getElementById('btn-save-subject');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> บันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.SUBJECTS).upsert([payload], { onConflict: 'subject_id' });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', `บันทึกวิชา ${name} (${id}) เรียบร้อยแล้ว`);
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
    const s = _subjects.find(x => x.id === id);
    if (!s) return;
    document.getElementById('s-id').value = s.subject_id || '';
    document.getElementById('s-name').value = s.subject_name || '';
    document.getElementById('s-theory').value = s.theory || 0;
    document.getElementById('s-practice').value = s.practice || 0;
    document.getElementById('s-credit').value = s.credit || 0;
    autoDetectType(s.subject_id || '');
    switchTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function autoDetectType(val) {
    const clean = val.replace(/[^0-9]/g, '');
    const hint = document.getElementById('subject-type-hint');
    if (!hint) return;
    if (clean.startsWith('20') || clean.startsWith('30')) {
      hint.innerHTML = '<span style="color:var(--primary-light)"><i class="fas fa-users"></i> วิชาสามัญ</span>';
    } else if (clean.length > 2) {
      hint.innerHTML = '<span style="color:var(--warning)"><i class="fas fa-flask"></i> วิชาปฏิบัติ</span>';
    } else {
      hint.innerHTML = '';
    }
  }

  function calcCredit() {
    const theory = parseInt(document.getElementById('s-theory')?.value, 10) || 0;
    const practice = parseInt(document.getElementById('s-practice')?.value, 10) || 0;
    const creditEl = document.getElementById('s-credit');
    if (creditEl) creditEl.value = theory + Math.floor(practice / 2);
  }

  function renderTable(data = _subjects) {
    const tbody = document.getElementById('subjects-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลรายวิชา</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((s, i) => {
      const type = (s.subject_id.startsWith('20') || s.subject_id.startsWith('30')) ? 'สามัญ' : 'ปฏิบัติ';
      const typeClass = type === 'สามัญ' ? 'badge-primary' : 'badge-warning';
      const totalHours = (s.theory || 0) + (s.practice || 0);

      return `<tr>
        <td>${i + 1}</td>
        <td><span class="badge ${typeClass}">${type}</span></td>
        <td><span class="badge badge-gray font-mono">${s.subject_id}</span></td>
        <td style="font-weight:600;color:var(--text-primary);white-space:nowrap;">${s.subject_name}</td>
        <td>${s.theory || 0}</td>
        <td>${s.practice || 0}</td>
        <td><span class="badge badge-info">${s.credit || 0}</span></td>
        <td><span class="badge badge-gray">${totalHours} คาบ</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost btn-sm" onclick="SUBJECTS.edit(${s.id})" title="แก้ไข">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="SUBJECTS.openModal(${s.id})" title="ลบ">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function clearForm() {
    const sId = document.getElementById('s-id');
    const sName = document.getElementById('s-name');
    const sTh = document.getElementById('s-theory');
    const sPr = document.getElementById('s-practice');
    const sCr = document.getElementById('s-credit');
    if (sId) sId.value = '';
    if (sName) sName.value = '';
    if (sTh) sTh.value = '';
    if (sPr) sPr.value = '';
    if (sCr) sCr.value = '';
    const hint = document.getElementById('subject-type-hint');
    if (hint) hint.innerHTML = '';
  }

  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  function filter(q) {
    const query = (q || '').toLowerCase();
    renderTable(_subjects.filter(s =>
      s.subject_id.toLowerCase().includes(query) ||
      s.subject_name.toLowerCase().includes(query)
    ));
  }

  function filterType(type) {
    ['all', 'samarn', 'practice'].forEach(k => document.getElementById(`ftab-${k}`)?.classList.remove('active'));
    const tabId = type === 'all' ? 'ftab-all' : type === 'สามัญ' ? 'ftab-samarn' : 'ftab-practice';
    document.getElementById(tabId)?.classList.add('active');

    if (type === 'all') renderTable(_subjects);
    else if (type === 'สามัญ') renderTable(_subjects.filter(s => s.subject_id.startsWith('20') || s.subject_id.startsWith('30')));
    else renderTable(_subjects.filter(s => !s.subject_id.startsWith('20') && !s.subject_id.startsWith('30')));
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
    const { error } = await db.from(TABLES.SUBJECTS).delete().eq('id', _deleteId);
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
      ['ลำดับ', 'รหัสวิชา (subject_id)', 'ชื่อวิชา (subject_name)', 'ทฤษฎี (theory)', 'ปฏิบัติ (practice)', 'หน่วยกิต (credit)', 'รวมคาบ/สัปดาห์']
    ];
    _subjects.forEach((s, i) => {
      rows.push([i + 1, s.subject_id, s.subject_name, s.theory || 0, s.practice || 0, s.credit || 0, (s.theory || 0) + (s.practice || 0)]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายวิชา');
    XLSX.writeFile(wb, 'EduSched_Subjects.xlsx');
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็น EduSched_Subjects.xlsx');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['subject_id', 'subject_name', 'theory', 'practice', 'credit'],
      ['20000-1401', 'ภาษาไทยพื้นฐาน', 2, 0, 2],
      ['30204-2001', 'เครือข่ายคอมพิวเตอร์และความปลอดภัย', 2, 2, 3]
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Subjects');
    XLSX.writeFile(wb, 'Template_Subjects.xlsx');
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
          const subjectId = (row['subject_id'] || row['รหัสวิชา'] || row['รหัสวิชา (subject_id)'] || '').toString().trim();
          const subjectName = (row['subject_name'] || row['ชื่อวิชา'] || row['ชื่อวิชา (subject_name)'] || '').toString().trim();
          const theory = parseInt(row['theory'] || row['ทฤษฎี'] || 0, 10);
          const practice = parseInt(row['practice'] || row['ปฏิบัติ'] || 0, 10);
          const credit = parseInt(row['credit'] || row['หน่วยกิต'] || (theory + Math.floor(practice / 2)), 10);

          if (!subjectId || !subjectName) {
            errors.push(`แถวที่ ${rowNum}: ขาดรหัสวิชาหรือชื่อวิชา`);
            return;
          }

          validBatch.push({
            subject_id: subjectId,
            subject_name: subjectName,
            theory: isNaN(theory) ? 0 : theory,
            practice: isNaN(practice) ? 0 : practice,
            credit: isNaN(credit) ? 0 : credit
          });
        });

        if (errors.length > 0) {
          showToast('warning', 'พบข้อผิดพลาดบางรายการ', errors.slice(0, 3).join(', '));
        }

        if (validBatch.length > 0) {
          const { error } = await db.from(TABLES.SUBJECTS).upsert(validBatch, { onConflict: 'subject_id' });
          if (error) throw error;
          showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้ารายวิชาสำเร็จ ${validBatch.length} วิชา`);
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
    filterType,
    openModal,
    closeModal,
    confirmDelete,
    autoDetectType,
    calcCredit,
    exportExcel,
    downloadTemplate,
    importExcel
  };
})();

document.addEventListener('DOMContentLoaded', () => SUBJECTS.loadAll());
