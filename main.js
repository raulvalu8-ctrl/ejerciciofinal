const STORAGE = {
  units: 'prj_units',
  careers: 'prj_careers',
  users: 'prj_users',
  equipment: 'prj_equipment',
  loans: 'prj_loans'
};

const state = {
  units: [],
  careers: [],
  users: [],
  equipment: [],
  loans: []
};

function getData(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const SUPABASE_URL = 'https://lcyolmppvlpnyavwmdyq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XmM9huFPfGjduN1XlmuQIw_ZrP9FpDu';
const useSupabase = true;
let supabaseClient = null;

function nextId(collection) {
  return collection.length ? Math.max(...collection.map(item => item.id)) + 1 : 1;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast visible ${type}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.className = 'toast';
  }, 2800);
}

async function initSupabase() {
  if (!useSupabase) return;
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadRemoteData() {
  if (!useSupabase) return;

  const tables = [
    { key: 'units', name: 'academic_units' },
    { key: 'careers', name: 'careers' },
    { key: 'users', name: 'users' },
    { key: 'equipment', name: 'equipment' },
    { key: 'loans', name: 'loans' }
  ];

  for (const table of tables) {
    const { data, error } = await supabaseClient.from(table.name).select('*').order('id', { ascending: true });
    if (error) {
      showToast(`Error cargando ${table.name}: ${error.message}`, 'error');
      return;
    }
    state[table.key] = data || [];
  }

  state.loans.sort((a,b) => b.id - a.id);
}

async function initializeStorage() {
  if (useSupabase) {
    await initSupabase();
    await loadRemoteData();
    return;
  }

  state.units = getData(STORAGE.units);
  state.careers = getData(STORAGE.careers);
  state.users = getData(STORAGE.users);
  state.equipment = getData(STORAGE.equipment);
  state.loans = getData(STORAGE.loans);

  if (!state.units.length) {
    state.units = [
      { id: 1, name: 'Facultad de Ingeniería Mochis' },
      { id: 2, name: 'Facultad de Enfermería' }
    ];
  }
  if (!state.careers.length) {
    state.careers = [
      { id: 1, name: 'Ingeniería Civil', unitId: 1 },
      { id: 2, name: 'Ingeniería Geodésica', unitId: 1 },
      { id: 3, name: 'Ingeniería de Software', unitId: 1 },
      { id: 4, name: 'Licenciatura en Enfermería', unitId: 2 }
    ];
  }
  if (!state.users.length) {
    state.users = [
      { id: 1, name: 'Ana López', type: 'Alumno', careerId: 3 },
      { id: 2, name: 'Luis Pérez', type: 'Profesor', careerId: 1 },
      { id: 3, name: 'María García', type: 'Alumno', careerId: 2 }
    ];
  }
  if (!state.equipment.length) {
    state.equipment = [
      { id: 1, name: 'Proyector de video', serial: 'PRJ-0001', quantity: 2 },
      { id: 2, name: 'Equipo laptop', serial: 'LTP-2211', quantity: 5 },
      { id: 3, name: 'Router inalámbrico', serial: 'RTR-4350', quantity: 3 },
      { id: 4, name: 'Centro de cómputo', serial: 'CPU-1002', quantity: 1 }
    ];
  }
  if (!state.loans.length) {
    state.loans = [
      { id: 1, userId: 1, equipmentId: 1, dateOut: '2026-06-01', dateIn: '', status: 'Prestado', quantity: 1 },
      { id: 2, userId: 2, equipmentId: 2, dateOut: '2026-05-27', dateIn: '2026-05-29', status: 'Entregado', quantity: 1 }
    ];
  }

  saveAll();
}

function saveAll() {
  if (useSupabase) return;
  saveData(STORAGE.units, state.units);
  saveData(STORAGE.careers, state.careers);
  saveData(STORAGE.users, state.users);
  saveData(STORAGE.equipment, state.equipment);
  saveData(STORAGE.loans, state.loans);
}

function findName(collection, id) {
  const item = collection.find(entry => entry.id === id);
  return item ? item.name : '-';
}

function renderDashboard() {
  document.getElementById('total-units').textContent = state.units.length;
  document.getElementById('total-careers').textContent = state.careers.length;
  document.getElementById('total-users').textContent = state.users.length;
  document.getElementById('total-equipment').textContent = state.equipment.length;
  document.getElementById('total-loans').textContent = state.loans.length;

  const latestBody = document.getElementById('latest-loans');
  latestBody.innerHTML = '';
  const latest = [...state.loans].sort((a,b) => b.id - a.id).slice(0,5);
  if (!latest.length) {
    latestBody.innerHTML = '<tr><td colspan="6">No hay préstamos registrados.</td></tr>';
    return;
  }
  latest.forEach(loan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${loan.id}</td>
      <td>${findName(state.users, loan.userId)}</td>
      <td>${findName(state.equipment, loan.equipmentId)}</td>
      <td>${loan.dateOut}</td>
      <td>${loan.dateIn || '-'}</td>
      <td>${loan.status}</td>
    `;
    latestBody.appendChild(row);
  });
}

function renderUnits() {
  document.getElementById('unit-name').value = '';
  document.getElementById('unit-id').value = '';
  const tbody = document.getElementById('unit-list');
  tbody.innerHTML = '';
  if (!state.units.length) {
    tbody.innerHTML = '<tr><td colspan="3">No hay unidades registradas.</td></tr>';
    return;
  }
  state.units.forEach(unit => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${unit.id}</td>
      <td>${unit.name}</td>
      <td class="actions">
        <button data-action="edit-unit" data-id="${unit.id}">Editar</button>
        <button data-action="delete-unit" data-id="${unit.id}" class="button-secondary">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderCareerSelects() {
  const careerUnitSelect = document.getElementById('career-unit');
  const userCareerSelect = document.getElementById('user-career');
  const reportCareerSelect = document.getElementById('report-career');
  const careerOptions = ['<option value="">Selecciona una unidad</option>'];
  state.units.forEach(unit => {
    careerOptions.push(`<option value="${unit.id}">${unit.name}</option>`);
  });
  careerUnitSelect.innerHTML = careerOptions.join('');

  userCareerSelect.innerHTML = state.careers.length ? state.careers.map(career => `<option value="${career.id}">${career.name}</option>`).join('') : '<option value="">No hay carreras</option>';
  reportCareerSelect.innerHTML = '<option value="">Todas</option>' + state.careers.map(career => `<option value="${career.id}">${career.name}</option>`).join('');
}

function renderCareers() {
  renderCareerSelects();
  document.getElementById('career-name').value = '';
  document.getElementById('career-id').value = '';
  const tbody = document.getElementById('career-list');
  tbody.innerHTML = '';
  if (!state.careers.length) {
    tbody.innerHTML = '<tr><td colspan="4">No hay carreras registradas.</td></tr>';
    return;
  }
  state.careers.forEach(career => {
    const unit = state.units.find(unit => unit.id === career.unitId);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${career.id}</td>
      <td>${career.name}</td>
      <td>${unit ? unit.name : '-'}</td>
      <td class="actions">
        <button data-action="edit-career" data-id="${career.id}">Editar</button>
        <button data-action="delete-career" data-id="${career.id}" class="button-secondary">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderUsers() {
  const userSelect = document.getElementById('loan-user');
  const reportUser = document.getElementById('report-user');
  document.getElementById('user-name').value = '';
  document.getElementById('user-id').value = '';
  const tbody = document.getElementById('user-list');
  tbody.innerHTML = '';

  if (!state.users.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay usuarios registrados.</td></tr>';
    userSelect.innerHTML = '<option value="">No hay usuarios</option>';
    reportUser.innerHTML = '<option value="">Todos</option>';
    return;
  }

  userSelect.innerHTML = '<option value="">Selecciona un usuario</option>' + state.users.map(user => `<option value="${user.id}">${user.name} (${user.type})</option>`).join('');
  reportUser.innerHTML = '<option value="">Todos</option>' + state.users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');

  state.users.forEach(user => {
    const career = state.careers.find(c => c.id === user.careerId);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>${user.type}</td>
      <td>${career ? career.name : '-'}</td>
      <td class="actions">
        <button data-action="edit-user" data-id="${user.id}">Editar</button>
        <button data-action="delete-user" data-id="${user.id}" class="button-secondary">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderEquipment() {
  const equipmentSelect = document.getElementById('loan-equipment');
  document.getElementById('equipment-name').value = '';
  document.getElementById('equipment-serial').value = '';
  document.getElementById('equipment-quantity').value = 1;
  document.getElementById('equipment-id').value = '';
  const tbody = document.getElementById('equipment-list');
  tbody.innerHTML = '';

  if (!state.equipment.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay equipos registrados.</td></tr>';
    equipmentSelect.innerHTML = '<option value="">No hay equipos</option>';
    return;
  }

  equipmentSelect.innerHTML = '<option value="">Selecciona un equipo</option>' + state.equipment.map(eq => `<option value="${eq.id}">${eq.name} (${eq.quantity})</option>`).join('');

  state.equipment.forEach(eq => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${eq.id}</td>
      <td>${eq.name}</td>
      <td>${eq.serial || '-'}</td>
      <td>${eq.quantity}</td>
      <td class="actions">
        <button data-action="edit-equipment" data-id="${eq.id}">Editar</button>
        <button data-action="delete-equipment" data-id="${eq.id}" class="button-secondary">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderLoans() {
  document.getElementById('loan-id').value = '';
  document.getElementById('loan-date-out').value = new Date().toISOString().slice(0,10);
  document.getElementById('loan-quantity').value = 1;
  document.getElementById('loan-status').value = 'Prestado';
  document.getElementById('loan-date-in').value = '';

  const tbody = document.getElementById('loan-list');
  tbody.innerHTML = '';
  if (!state.loans.length) {
    tbody.innerHTML = '<tr><td colspan="8">No hay préstamos registrados.</td></tr>';
    return;
  }
  state.loans.slice().sort((a,b) => b.id - a.id).forEach(loan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${loan.id}</td>
      <td>${findName(state.users, loan.userId)}</td>
      <td>${findName(state.equipment, loan.equipmentId)}</td>
      <td>${loan.dateOut}</td>
      <td>${loan.dateIn || '-'}</td>
      <td>${loan.status}</td>
      <td>${loan.quantity}</td>
      <td class="actions">
        <button data-action="edit-loan" data-id="${loan.id}">Editar</button>
        <button data-action="delete-loan" data-id="${loan.id}" class="button-secondary">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function updateReportOptions() {
  renderCareerSelects();
  renderEquipmentReports();
  const reportUser = document.getElementById('report-user');
  reportUser.innerHTML = '<option value="">Todos</option>' + state.users.map(user => `<option value="${user.id}">${user.name}</option>`).join('');
}

function renderReports() {
  const reportCareer = document.getElementById('report-career').value;
  const reportEquipment = document.getElementById('report-equipment').value;
  const reportUser = document.getElementById('report-user').value;

  const filtered = state.loans.filter(loan => {
    const matchCareer = !reportCareer || state.users.find(u => u.id === loan.userId)?.careerId === Number(reportCareer);
    const matchEquipment = !reportEquipment || loan.equipmentId === Number(reportEquipment);
    const matchUser = !reportUser || loan.userId === Number(reportUser);
    return matchCareer && matchEquipment && matchUser;
  });

  const careerCounts = {};
  const equipmentCounts = {};
  const userCounts = {};

  filtered.forEach(loan => {
    const user = state.users.find(u => u.id === loan.userId);
    const career = state.careers.find(c => c.id === user?.careerId);
    const equipment = state.equipment.find(eq => eq.id === loan.equipmentId);

    if (career) careerCounts[career.name] = (careerCounts[career.name] || 0) + 1;
    if (equipment) equipmentCounts[equipment.name] = (equipmentCounts[equipment.name] || 0) + 1;
    if (user) userCounts[user.name] = (userCounts[user.name] || 0) + 1;
  });

  document.getElementById('report-careers').innerHTML = Object.entries(careerCounts).map(([name,count]) => `<p>${name}: <strong>${count}</strong></p>`).join('') || '<p>No hay datos.</p>';
  document.getElementById('report-equipment-counts').innerHTML = Object.entries(equipmentCounts).map(([name,count]) => `<p>${name}: <strong>${count}</strong></p>`).join('') || '<p>No hay datos.</p>';
  document.getElementById('report-users').innerHTML = Object.entries(userCounts).map(([name,count]) => `<p>${name}: <strong>${count}</strong></p>`).join('') || '<p>No hay datos.</p>';

  const reportBody = document.getElementById('report-list');
  reportBody.innerHTML = '';
  if (!filtered.length) {
    reportBody.innerHTML = '<tr><td colspan="7">No hay préstamos con esos filtros.</td></tr>';
    return;
  }

  filtered.sort((a,b) => b.id - a.id).forEach(loan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${loan.id}</td>
      <td>${findName(state.users, loan.userId)}</td>
      <td>${findName(state.equipment, loan.equipmentId)}</td>
      <td>${loan.dateOut}</td>
      <td>${loan.dateIn || '-'}</td>
      <td>${loan.status}</td>
      <td>${loan.quantity}</td>
    `;
    reportBody.appendChild(row);
  });
}

function renderEquipmentReports() {
  const reportEquipment = document.getElementById('report-equipment');
  reportEquipment.innerHTML = '<option value="">Todos</option>' + state.equipment.map(eq => `<option value="${eq.id}">${eq.name}</option>`).join('');
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(section => section.classList.toggle('active-view', section.id === viewId));
  document.querySelectorAll('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === viewId));
  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'units') renderUnits();
  if (viewId === 'careers') renderCareers();
  if (viewId === 'users') renderUsers();
  if (viewId === 'equipment') renderEquipment();
  if (viewId === 'loans') renderLoans();
  if (viewId === 'reports') {
    updateReportOptions();
    renderReports();
  }
}

function handleNavClick(event) {
  const view = event.target.dataset.view;
  if (view) switchView(view);
}

function findUnit(id) {
  return state.units.find(u => u.id === id);
}

function findCareer(id) {
  return state.careers.find(c => c.id === id);
}

async function submitUnit(event) {
  event.preventDefault();
  const name = document.getElementById('unit-name').value.trim();
  const id = document.getElementById('unit-id').value;
  if (!name) {
    showToast('El nombre de la unidad es obligatorio.', 'warning');
    return;
  }

  if (useSupabase) {
    const payload = { name };
    if (id) payload.id = Number(id);
    const { error } = await supabaseClient.from('academic_units').upsert(payload);
    if (error) {
      showToast(`Error guardando unidad: ${error.message}`, 'error');
      return;
    }
    await loadRemoteData();
    showToast(id ? 'Unidad académica actualizada.' : 'Unidad académica agregada.', 'success');
  } else {
    if (id) {
      const unit = state.units.find(item => item.id === Number(id));
      unit.name = name;
      showToast('Unidad académica actualizada.', 'success');
    } else {
      state.units.push({ id: nextId(state.units), name });
      showToast('Unidad académica agregada.', 'success');
    }
    saveAll();
  }

  renderUnits();
}

async function submitCareer(event) {
  event.preventDefault();
  const name = document.getElementById('career-name').value.trim();
  const unitId = Number(document.getElementById('career-unit').value);
  const id = document.getElementById('career-id').value;
  if (!name || !unitId) {
    showToast('El nombre y la unidad son obligatorios.', 'warning');
    return;
  }
  if (useSupabase) {
    const payload = { name, unitId };
    if (id) payload.id = Number(id);
    const { error } = await supabaseClient.from('careers').upsert(payload);
    if (error) {
      showToast(`Error guardando carrera: ${error.message}`, 'error');
      return;
    }
    await loadRemoteData();
    showToast(id ? 'Carrera actualizada.' : 'Carrera agregada.', 'success');
  } else {
    if (id) {
      const career = state.careers.find(item => item.id === Number(id));
      career.name = name;
      career.unitId = unitId;
      showToast('Carrera actualizada.', 'success');
    } else {
      state.careers.push({ id: nextId(state.careers), name, unitId });
      showToast('Carrera agregada.', 'success');
    }
    saveAll();
  }
  renderCareers();
}

async function submitUser(event) {
  event.preventDefault();
  const name = document.getElementById('user-name').value.trim();
  const type = document.getElementById('user-type').value;
  const careerId = Number(document.getElementById('user-career').value);
  const id = document.getElementById('user-id').value;
  if (!name || !type || !careerId) {
    showToast('Nombre, tipo y carrera son obligatorios.', 'warning');
    return;
  }
  if (useSupabase) {
    const payload = { name, type, careerId };
    if (id) payload.id = Number(id);
    const { error } = await supabaseClient.from('users').upsert(payload);
    if (error) {
      showToast(`Error guardando usuario: ${error.message}`, 'error');
      return;
    }
    await loadRemoteData();
    showToast(id ? 'Usuario actualizado.' : 'Usuario agregado.', 'success');
  } else {
    if (id) {
      const user = state.users.find(item => item.id === Number(id));
      user.name = name;
      user.type = type;
      user.careerId = careerId;
      showToast('Usuario actualizado.', 'success');
    } else {
      state.users.push({ id: nextId(state.users), name, type, careerId });
      showToast('Usuario agregado.', 'success');
    }
    saveAll();
  }
  renderUsers();
}

async function submitEquipment(event) {
  event.preventDefault();
  const name = document.getElementById('equipment-name').value.trim();
  const serial = document.getElementById('equipment-serial').value.trim();
  const quantity = Number(document.getElementById('equipment-quantity').value);
  const id = document.getElementById('equipment-id').value;
  if (!name || quantity < 1) {
    showToast('Nombre y cantidad válidos son obligatorios.', 'warning');
    return;
  }
  if (useSupabase) {
    const payload = { name, serial, quantity };
    if (id) payload.id = Number(id);
    const { error } = await supabaseClient.from('equipment').upsert(payload);
    if (error) {
      showToast(`Error guardando equipo: ${error.message}`, 'error');
      return;
    }
    await loadRemoteData();
    showToast(id ? 'Equipo actualizado.' : 'Equipo agregado.', 'success');
  } else {
    if (id) {
      const eq = state.equipment.find(item => item.id === Number(id));
      eq.name = name;
      eq.serial = serial;
      eq.quantity = quantity;
      showToast('Equipo actualizado.', 'success');
    } else {
      state.equipment.push({ id: nextId(state.equipment), name, serial, quantity });
      showToast('Equipo agregado.', 'success');
    }
    saveAll();
  }
  renderEquipment();
}

async function submitLoan(event) {
  event.preventDefault();
  const id = document.getElementById('loan-id').value;
  const userId = Number(document.getElementById('loan-user').value);
  const equipmentId = Number(document.getElementById('loan-equipment').value);
  const dateOut = document.getElementById('loan-date-out').value;
  const quantity = Number(document.getElementById('loan-quantity').value);
  const status = document.getElementById('loan-status').value;
  const dateIn = document.getElementById('loan-date-in').value;
  if (!userId || !equipmentId || !dateOut || quantity < 1) {
    showToast('Todos los datos de préstamo son obligatorios.', 'warning');
    return;
  }
  if (useSupabase) {
    const payload = { userId, equipmentId, dateOut, quantity, status, dateIn };
    if (id) payload.id = Number(id);
    const { error } = await supabaseClient.from('loans').upsert(payload);
    if (error) {
      showToast(`Error guardando préstamo: ${error.message}`, 'error');
      return;
    }
    await loadRemoteData();
    showToast(id ? 'Préstamo actualizado.' : 'Préstamo registrado.', 'success');
  } else {
    if (id) {
      const loan = state.loans.find(item => item.id === Number(id));
      loan.userId = userId;
      loan.equipmentId = equipmentId;
      loan.dateOut = dateOut;
      loan.quantity = quantity;
      loan.status = status;
      loan.dateIn = dateIn;
      showToast('Préstamo actualizado.', 'success');
    } else {
      state.loans.push({ id: nextId(state.loans), userId, equipmentId, dateOut, quantity, status, dateIn });
      showToast('Préstamo registrado.', 'success');
    }
    saveAll();
  }
  renderLoans();
  renderReports();
}

async function handleTableAction(event) {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);
  if (!action || !id) return;

  switch (action) {
    case 'edit-unit': {
      const unit = state.units.find(item => item.id === id);
      document.getElementById('unit-name').value = unit.name;
      document.getElementById('unit-id').value = unit.id;
      switchView('units');
      break;
    }
    case 'delete-unit': {
      if (useSupabase) {
        const { error } = await supabaseClient.from('academic_units').delete().eq('id', id);
        if (error) {
          showToast(`Error eliminando unidad: ${error.message}`, 'error');
          return;
        }
        await loadRemoteData();
      } else {
        state.units = state.units.filter(item => item.id !== id);
        const removedCareerIds = state.careers.filter(career => career.unitId === id).map(career => career.id);
        state.careers = state.careers.filter(career => career.unitId !== id);
        const removedUserIds = state.users.filter(user => removedCareerIds.includes(user.careerId)).map(user => user.id);
        state.users = state.users.filter(user => !removedUserIds.includes(user.id));
        state.loans = state.loans.filter(loan => !removedUserIds.includes(loan.userId));
        saveAll();
      }
      renderUnits();
      renderCareers();
      renderUsers();
      showToast('Unidad y datos asociados eliminados.', 'warning');
      break;
    }
    case 'edit-career': {
      const career = state.careers.find(item => item.id === id);
      document.getElementById('career-name').value = career.name;
      document.getElementById('career-unit').value = career.unitId;
      document.getElementById('career-id').value = career.id;
      switchView('careers');
      break;
    }
    case 'delete-career': {
      if (useSupabase) {
        const { error } = await supabaseClient.from('careers').delete().eq('id', id);
        if (error) {
          showToast(`Error eliminando carrera: ${error.message}`, 'error');
          return;
        }
        await loadRemoteData();
      } else {
        state.careers = state.careers.filter(item => item.id !== id);
        const removedUserIds = state.users.filter(user => user.careerId === id).map(user => user.id);
        state.users = state.users.filter(user => user.careerId !== id);
        state.loans = state.loans.filter(loan => !removedUserIds.includes(loan.userId));
        saveAll();
      }
      renderCareers();
      renderUsers();
      showToast('Carrera y usuarios asociados eliminados.', 'warning');
      break;
    }
    case 'edit-user': {
      const user = state.users.find(item => item.id === id);
      document.getElementById('user-name').value = user.name;
      document.getElementById('user-type').value = user.type;
      document.getElementById('user-career').value = user.careerId;
      document.getElementById('user-id').value = user.id;
      switchView('users');
      break;
    }
    case 'delete-user': {
      if (useSupabase) {
        const { error } = await supabaseClient.from('users').delete().eq('id', id);
        if (error) {
          showToast(`Error eliminando usuario: ${error.message}`, 'error');
          return;
        }
        await loadRemoteData();
      } else {
        state.users = state.users.filter(item => item.id !== id);
        state.loans = state.loans.filter(loan => loan.userId !== id);
        saveAll();
      }
      renderUsers();
      renderLoans();
      renderReports();
      showToast('Usuario eliminado.', 'warning');
      break;
    }
    case 'edit-equipment': {
      const eq = state.equipment.find(item => item.id === id);
      document.getElementById('equipment-name').value = eq.name;
      document.getElementById('equipment-serial').value = eq.serial;
      document.getElementById('equipment-quantity').value = eq.quantity;
      document.getElementById('equipment-id').value = eq.id;
      switchView('equipment');
      break;
    }
    case 'delete-equipment': {
      if (useSupabase) {
        const { error } = await supabaseClient.from('equipment').delete().eq('id', id);
        if (error) {
          showToast(`Error eliminando equipo: ${error.message}`, 'error');
          return;
        }
        await loadRemoteData();
      } else {
        state.equipment = state.equipment.filter(item => item.id !== id);
        state.loans = state.loans.filter(loan => loan.equipmentId !== id);
        saveAll();
      }
      renderEquipment();
      renderLoans();
      renderReports();
      showToast('Equipo eliminado.', 'warning');
      break;
    }
    case 'edit-loan': {
      const loan = state.loans.find(item => item.id === id);
      document.getElementById('loan-id').value = loan.id;
      document.getElementById('loan-user').value = loan.userId;
      document.getElementById('loan-equipment').value = loan.equipmentId;
      document.getElementById('loan-date-out').value = loan.dateOut;
      document.getElementById('loan-quantity').value = loan.quantity;
      document.getElementById('loan-status').value = loan.status;
      document.getElementById('loan-date-in').value = loan.dateIn || '';
      switchView('loans');
      break;
    }
    case 'delete-loan': {
      if (useSupabase) {
        const { error } = await supabaseClient.from('loans').delete().eq('id', id);
        if (error) {
          showToast(`Error eliminando préstamo: ${error.message}`, 'error');
          return;
        }
        await loadRemoteData();
      } else {
        state.loans = state.loans.filter(item => item.id !== id);
        saveAll();
      }
      renderLoans();
      renderReports();
      showToast('Préstamo eliminado.', 'warning');
      break;
    }
  }
}

function cancelForm(event) {
  const targetId = event.target.id;
  if (targetId === 'unit-cancel') {
    document.getElementById('unit-name').value = '';
    document.getElementById('unit-id').value = '';
  }
  if (targetId === 'career-cancel') {
    document.getElementById('career-name').value = '';
    document.getElementById('career-id').value = '';
  }
  if (targetId === 'user-cancel') {
    document.getElementById('user-name').value = '';
    document.getElementById('user-id').value = '';
  }
  if (targetId === 'equipment-cancel') {
    document.getElementById('equipment-name').value = '';
    document.getElementById('equipment-id').value = '';
  }
  if (targetId === 'loan-cancel') {
    document.getElementById('loan-id').value = '';
    document.getElementById('loan-date-out').value = new Date().toISOString().slice(0,10);
    document.getElementById('loan-status').value = 'Prestado';
    document.getElementById('loan-date-in').value = '';
  }
}

function filterReports() {
  renderReports();
}

function clearReports() {
  document.getElementById('report-career').value = '';
  document.getElementById('report-equipment').value = '';
  document.getElementById('report-user').value = '';
  renderReports();
}

function setupEvents() {
  document.querySelector('.main-nav').addEventListener('click', handleNavClick);
  document.getElementById('unit-form').addEventListener('submit', submitUnit);
  document.getElementById('career-form').addEventListener('submit', submitCareer);
  document.getElementById('user-form').addEventListener('submit', submitUser);
  document.getElementById('equipment-form').addEventListener('submit', submitEquipment);
  document.getElementById('loan-form').addEventListener('submit', submitLoan);
  document.getElementById('unit-list').addEventListener('click', handleTableAction);
  document.getElementById('career-list').addEventListener('click', handleTableAction);
  document.getElementById('user-list').addEventListener('click', handleTableAction);
  document.getElementById('equipment-list').addEventListener('click', handleTableAction);
  document.getElementById('loan-list').addEventListener('click', handleTableAction);
  document.getElementById('unit-cancel').addEventListener('click', cancelForm);
  document.getElementById('career-cancel').addEventListener('click', cancelForm);
  document.getElementById('user-cancel').addEventListener('click', cancelForm);
  document.getElementById('equipment-cancel').addEventListener('click', cancelForm);
  document.getElementById('loan-cancel').addEventListener('click', cancelForm);
  document.getElementById('report-filter').addEventListener('click', filterReports);
  document.getElementById('report-clear').addEventListener('click', clearReports);
}

async function loadApp() {
  await initializeStorage();
  setupEvents();
  switchView('dashboard');
}

window.addEventListener('DOMContentLoaded', loadApp);
