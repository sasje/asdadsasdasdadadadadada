// Глобальные функции для работы с пользователем, арендой серверов

function checkAuthAndRedirect() {
  const user = sessionStorage.getItem('currentUser');
  if (!user && window.location.pathname.includes('rentals.html')) {
    window.location.href = 'login.html';
  }
  return user ? JSON.parse(user) : null;
}

function updateHeaderUI() {
  const userRaw = sessionStorage.getItem('currentUser');
  const authDiv = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userNameSpan = document.getElementById('userName');
  if (userRaw) {
    const user = JSON.parse(userRaw);
    if (authDiv) authDiv.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      if (userNameSpan) userNameSpan.innerText = user.name;
    }
  } else {
    if (authDiv) authDiv.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function rentItem(type, itemId, itemName, price) {
  if (type !== 'server') return false; // только серверы
  const user = sessionStorage.getItem('currentUser');
  if (!user) {
    alert('Необходимо войти в аккаунт');
    window.location.href = 'login.html';
    return false;
  }
  const userId = JSON.parse(user).id;
  let rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
  const already = rentals.some(r => r.userId === userId && r.itemId === itemId && r.type === type);
  if (already) {
    alert('Вы уже арендовали этот сервер');
    return false;
  }
  const newRental = {
    id: Date.now(),
    userId,
    type,
    itemId,
    name: itemName,
    price,
    date: new Date().toISOString().slice(0,10)
  };
  rentals.push(newRental);
  localStorage.setItem('rentals', JSON.stringify(rentals));
  alert('Сервер добавлен в аренду! Перейдите в "Мои аренды"');
  return true;
}

function renderProductsList(products, containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = products.map(p => `
    <div class="plan-card ${p.featured ? 'featured' : ''}">
      <div class="plan-badge">${p.badge}</div>
      <h3>${p.name}</h3>
      <div class="price">$${p.price} <span>/мес</span></div>
      <ul>
        ${p.cpu ? `<li><i class="fas fa-microchip"></i> ${p.cpu}</li>` : ''}
        ${p.ram ? `<li><i class="fas fa-memory"></i> ${p.ram}</li>` : ''}
        ${p.disk ? `<li><i class="fas fa-hdd"></i> ${p.disk}</li>` : ''}
        ${p.traffic ? `<li><i class="fas fa-globe"></i> ${p.traffic}</li>` : ''}
      </ul>
      <button class="btn btn-primary rent-btn" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-type="server">Арендовать →</button>
    </div>
  `).join('');
  document.querySelectorAll('.rent-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      rentItem('server', id, name, price);
    });
  });
}

function renderUserRentals() {
  const user = sessionStorage.getItem('currentUser');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const userId = JSON.parse(user).id;
  const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
  const userRentals = rentals.filter(r => r.userId === userId && r.type === 'server');
  const rentalsContainer = document.getElementById('rentalsList');
  const emptyDiv = document.getElementById('emptyRentals');
  if (!rentalsContainer) return;
  if (userRentals.length === 0) {
    rentalsContainer.innerHTML = '';
    if(emptyDiv) emptyDiv.style.display = 'block';
    return;
  }
  if(emptyDiv) emptyDiv.style.display = 'none';
  rentalsContainer.innerHTML = userRentals.map(rent => `
    <div class="rental-item" data-rentid="${rent.id}">
      <div>
        <strong>${rent.name}</strong> (Сервер)<br>
        <small>${rent.price} $/мес, дата аренды: ${rent.date}</small>
      </div>
      <button class="cancel-btn" data-id="${rent.id}">Отменить аренду</button>
    </div>
  `).join('');
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rentId = parseInt(btn.dataset.id);
      let rentalsAll = JSON.parse(localStorage.getItem('rentals') || '[]');
      rentalsAll = rentalsAll.filter(r => r.id !== rentId);
      localStorage.setItem('rentals', JSON.stringify(rentalsAll));
      renderUserRentals();
    });
  });
}

// Экспорт/импорт данных
function exportAllData() {
  const users = localStorage.getItem('users') || '[]';
  const rentals = localStorage.getItem('rentals') || '[]';
  const fullData = {
    users: JSON.parse(users),
    rentals: JSON.parse(rentals),
    exportDate: new Date().toISOString()
  };
  const dataStr = JSON.stringify(fullData, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `serverhost_backup_${new Date().toISOString().slice(0,19)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Данные экспортированы в JSON-файл.');
}

function importAllData(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.users) localStorage.setItem('users', JSON.stringify(imported.users));
      if (imported.rentals) localStorage.setItem('rentals', JSON.stringify(imported.rentals));
      alert('Данные успешно импортированы! Перезагрузите страницу.');
      window.location.reload();
    } catch(err) {
      alert('Ошибка: неверный формат файла.');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm('ВНИМАНИЕ: будут удалены ВСЕ пользователи, аренды и сессии. Продолжить?')) {
    localStorage.removeItem('users');
    localStorage.removeItem('rentals');
    sessionStorage.removeItem('currentUser');
    alert('База данных очищена. Страница будет перезагружена.');
    window.location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateHeaderUI();
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  if (window.location.pathname.includes('rentals.html')) {
    checkAuthAndRedirect();
  }
  const toggle = document.getElementById('mobileToggle');
  const navUl = document.querySelector('.main-nav ul');
  if (toggle && navUl) {
    toggle.addEventListener('click', () => navUl.classList.toggle('show-mobile'));
  }
});