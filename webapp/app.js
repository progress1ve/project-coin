// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Расширяем на весь экран

// Конфигурация API
const API_BASE_URL = 'http://localhost:8000'; // Замените на URL вашего API в продакшене

// DOM элементы
const loadingElement = document.getElementById('loading');
const contentElement = document.getElementById('content');
const pointsCountElement = document.getElementById('points-count');
const levelElement = document.getElementById('level');
const coinElement = document.getElementById('coin');
const coinImgElement = document.getElementById('coin-img');
const pointsPerClickElement = document.getElementById('points-per-click');
const upgradesListElement = document.getElementById('upgrades-list');

// Данные пользователя
let userData = {
    user_id: null,
    username: null,
    points: 0,
    level: 1,
    points_per_click: 1,
    upgrades: []
};

// Инициализация приложения
async function initApp() {
    try {
        // Получаем данные пользователя из Telegram
        if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            // Для тестирования без Telegram
            userData.user_id = 123456789;
            userData.username = 'TestUser';
        } else {
            userData.user_id = tg.initDataUnsafe.user.id;
            userData.username = tg.initDataUnsafe.user.username;
        }

        // Запрашиваем данные пользователя с сервера
        await fetchUserData();

        // Отрисовываем интерфейс
        updateUI();

        // Скрываем загрузочный экран
        loadingElement.classList.add('hidden');
        contentElement.classList.remove('hidden');

        // Инициализируем обработчики событий
        initEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        alert('Произошла ошибка при загрузке приложения. Пожалуйста, попробуйте позже.');
    }
}

// Запрос данных пользователя с сервера
async function fetchUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${userData.user_id}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Обновляем локальные данные
        userData.points = data.points;
        userData.level = data.level;
        userData.points_per_click = data.points_per_click;
        userData.upgrades = data.upgrades;
        
        return data;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        throw error;
    }
}

// Обновление интерфейса
function updateUI() {
    pointsCountElement.textContent = userData.points;
    levelElement.textContent = userData.level;
    pointsPerClickElement.textContent = `+${userData.points_per_click}`;
    
    renderUpgrades();
}

// Отрисовка списка улучшений
function renderUpgrades() {
    upgradesListElement.innerHTML = '';
    
    if (userData.upgrades.length === 0) {
        upgradesListElement.innerHTML = '<p class="no-upgrades">Нет доступных улучшений</p>';
        return;
    }
    
    userData.upgrades.forEach(upgrade => {
        const upgradeItem = document.createElement('div');
        upgradeItem.className = 'upgrade-item';
        
        const canAfford = userData.points >= upgrade.cost;
        
        upgradeItem.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name} ${upgrade.owned > 0 ? `<span class="upgrade-owned">x${upgrade.owned}</span>` : ''}</div>
                <div class="upgrade-description">${upgrade.description}</div>
            </div>
            <div class="upgrade-action">
                <div class="upgrade-cost">${upgrade.cost} очков</div>
                <button class="upgrade-button" data-id="${upgrade.id}" ${!canAfford ? 'disabled' : ''}>Купить</button>
            </div>
        `;
        
        upgradesListElement.appendChild(upgradeItem);
    });
    
    // Добавляем обработчики для кнопок улучшений
    document.querySelectorAll('.upgrade-button').forEach(button => {
        button.addEventListener('click', handleUpgradePurchase);
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Обработчик клика по монете
    coinElement.addEventListener('click', handleCoinClick);
}

// Обработчик клика по монете
async function handleCoinClick() {
    try {
        // Анимация монеты при клике
        coinImgElement.style.animation = 'coinPop 0.3s ease';
        
        // Показываем анимацию очков за клик
        pointsPerClickElement.style.opacity = '1';
        pointsPerClickElement.style.animation = 'clickPointsAnim 0.8s ease-out';
        
        // Сбрасываем анимации после их завершения
        setTimeout(() => {
            coinImgElement.style.animation = '';
            pointsPerClickElement.style.opacity = '0';
            pointsPerClickElement.style.animation = '';
        }, 800);
        
        // Отправляем запрос на сервер
        const response = await fetch(`${API_BASE_URL}/click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.user_id,
                telegram_data: tg.initData || {}
            })
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Обновляем данные пользователя
        userData.points = data.points;
        userData.level = data.level;
        userData.points_per_click = data.points_per_click;
        userData.upgrades = data.upgrades;
        
        // Обновляем интерфейс
        updateUI();
    } catch (error) {
        console.error('Ошибка при обработке клика:', error);
    }
}

// Обработчик покупки улучшения
async function handleUpgradePurchase(event) {
    try {
        const upgradeId = parseInt(event.target.dataset.id);
        
        // Отправляем запрос на сервер
        const response = await fetch(`${API_BASE_URL}/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.user_id,
                upgrade_id: upgradeId,
                telegram_data: tg.initData || {}
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || `Ошибка HTTP: ${response.status}`);
        }
        
        // Обновляем данные пользователя
        userData.points = data.user_data.points;
        userData.level = data.user_data.level;
        userData.points_per_click = data.user_data.points_per_click;
        userData.upgrades = data.user_data.upgrades;
        
        // Обновляем интерфейс
        updateUI();
        
        // Показываем сообщение об успешной покупке
        tg.showPopup({
            title: 'Улучшение приобретено',
            message: data.message,
            buttons: [{ type: 'ok' }]
        });
    } catch (error) {
        console.error('Ошибка при покупке улучшения:', error);
        tg.showPopup({
            title: 'Ошибка',
            message: error.message || 'Произошла ошибка при покупке улучшения',
            buttons: [{ type: 'ok' }]
        });
    }
}

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp); 