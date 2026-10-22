// ============================================================
//  EDUSCHED AI - ROOMS MANAGEMENT
// ============================================================

const ROOMS = (() => {
  let _rooms = [];
  let _deleteId = null;

  async function loadAll() {
    try {
      const { data, error } = await db.from(TABLES.ROOMS).select('*').order('room_id');
      if (error) {
        showToast('error', 'โหลดล้มเหลว', error.message);
        return;
      }
      _rooms = data || [];
      renderTable();
    } catch (e) {
      console.error(e);
      showToast('error', 'ข้อผิดพลาดเครือข่าย', e.message);
    }
  }

  async function save() {
    const id = document.getElementById('r-id')?.value.trim();
    const name = document.getElementById('r-name')?.value.trim();
    const type = document.getElementById('r-type')?.value;
    const capacity = document.getElementById('r-capacity')?.value;

    if (!id || !name || !type) {
      showToast('warning', 'กรุณากรอกข้อมูล * ให้ครบ');
      return;
    }

    const payload = {
      room_id: id,
      room_name: name,
      room_type: type,
      capacity: capacity ? parseInt(capacity, 10) : 40
    };

    const btn = document.getElementById('btn-save-room');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> บันทึก...';
    }

    try {
      const { error } = await db.from(TABLES.ROOMS).upsert([payload], { onConflict: 'room_id' });
      if (error) throw error;
      showToast('success', 'บันทึกสำเร็จ', `บันทึกข้อมูลห้อง ${id} เรียบร้อยแล้ว`);
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
    const r = _rooms.find(x => x.id === id);
    if (!r) return;
    document.getElementById('r-id').value = r.room_id || '';
    document.getElementById('r-name').value = r.room_name || '';
    document.getElementById('r-type').value = r.room_type || '';
    const capEl = document.getElementById('r-capacity');
    if (capEl) capEl.value = r.capacity || '';
    switchTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderTable(data = _rooms) {
    const tbody = document.getElementById('rooms-tbody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">ไม่มีข้อมูลห้องเรียน</td></tr>';
      return;
    }

    tbody.innerHTML = data.map((r, i) => `<tr>
      <td>${i + 1}</td>
      <td><span class="badge badge-gray font-mono">${r.room_id}</span></td>
      <td style="font-weight:600;color:var(--text-primary);">${r.room_name}</td>
      <td>
        <span class="badge ${r.room_type.includes('คอมพิวเตอร์') || r.room_type.includes('ปฏิบัติการ') ? 'badge-warning' : 'badge-primary'}">
          ${r.room_type}
        </span>
      </td>
      <td><span class="badge badge-info">${r.capacity || 40} ที่นั่ง</span></td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="ROOMS.edit(${r.id})" title="แก้ไข">
            <i class="fas fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="ROOMS.openModal(${r.id})" title="ลบ">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');
  }

  function clearForm() {
    const rId = document.getElementById('r-id');
    const rName = document.getElementById('r-name');
    const rType = document.getElementById('r-type');
    const rCap = document.getElementById('r-capacity');
    if (rId) rId.value = '';
    if (rName) rName.value = '';
    if (rType) rType.value = '';
    if (rCap) rCap.value = '';
  }

  function switchTab(tab) {
    document.getElementById('section-form')?.classList.toggle('hidden', tab !== 'form');
    document.getElementById('section-table')?.classList.toggle('hidden', tab !== 'table');
    document.getElementById('tab-form')?.classList.toggle('active', tab === 'form');
    document.getElementById('tab-table')?.classList.toggle('active', tab === 'table');
  }

  function filter(q) {
    const query = (q || '').toLowerCase();
    renderTable(_rooms.filter(r =>
      r.room_id.toLowerCase().includes(query) ||
      r.room_name.toLowerCase().includes(query) ||
      (r.room_type && r.room_type.toLowerCase().includes(query))
    ));
  }

  function filterType(t) {
    renderTable(t ? _rooms.filter(r => r.room_type === t) : _rooms);
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
    const { error } = await db.from(TABLES.ROOMS).delete().eq('id', _deleteId);
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
      ['ลำดับ', 'รหัสห้อง (room_id)', 'ชื่อห้อง (room_name)', 'ประเภทห้อง (room_type)', 'ความจุ (capacity)']
    ];
    _rooms.forEach((r, i) => {
      rows.push([i + 1, r.room_id, r.room_name, r.room_type, r.capacity || 40]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ห้องเรียน');
    XLSX.writeFile(wb, 'EduSched_Rooms.xlsx');
    showToast('success', 'ส่งออกสำเร็จ', 'บันทึกเป็น EduSched_Rooms.xlsx');
  }

  function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      showToast('error', 'ไม่พบไลบรารี XLSX');
      return;
    }
    const rows = [
      ['room_id', 'room_name', 'room_type', 'capacity'],
      ['R101', 'ห้องเรียนทฤษฎี 101', 'ห้องเรียนทั่วไป', 40],
      ['LAB501', 'ห้องปฏิบัติการคอมพิวเตอร์ 1', 'ห้องปฏิบัติการคอมพิวเตอร์', 30]
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Rooms');
    XLSX.writeFile(wb, 'Template_Rooms.xlsx');
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
          const roomId = (row['room_id'] || row['รหัสห้อง'] || row['รหัสห้อง (room_id)'] || '').toString().trim();
          const roomName = (row['room_name'] || row['ชื่อห้อง'] || row['ชื่อห้อง (room_name)'] || '').toString().trim();
          const roomType = (row['room_type'] || row['ประเภทห้อง'] || row['ประเภทห้อง (room_type)'] || 'ห้องเรียนทั่วไป').toString().trim();
          const capacity = parseInt(row['capacity'] || row['ความจุ'] || row['ความจุ (capacity)'] || 40, 10);

          if (!roomId || !roomName) {
            errors.push(`แถวที่ ${rowNum}: ขาดรหัสห้องหรือชื่อห้อง`);
            return;
          }

          validBatch.push({
            room_id: roomId,
            room_name: roomName,
            room_type: roomType,
            capacity: isNaN(capacity) ? 40 : capacity
          });
        });

        if (errors.length > 0) {
          showToast('warning', 'พบข้อผิดพลาดบางรายการ', errors.slice(0, 3).join(', '));
        }

        if (validBatch.length > 0) {
          const { error } = await db.from(TABLES.ROOMS).upsert(validBatch, { onConflict: 'room_id' });
          if (error) throw error;
          showToast('success', 'นำเข้าข้อมูลสำเร็จ', `นำเข้าห้องเรียนสำเร็จ ${validBatch.length} รายการ`);
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
    exportExcel,
    downloadTemplate,
    importExcel
  };
})();

document.addEventListener('DOMContentLoaded', () => ROOMS.loadAll());
