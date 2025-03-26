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

// Начальные значения
let score = 0;
let clickValue = 1;
let upgradeCosts = {
    clickUpgrade: 10,
    autoClicker: 50
};
let autoClickerInterval = null;
let autoClickerCount = 0;

// Элементы DOM
const scoreElement = document.getElementById('score');
const scoreUpgradeElement = document.getElementById('score-upgrade');
const clickValueElement = document.getElementById('clickValue');
const upgradeContainer = document.getElementById('upgradeContainer');
const mainScreen = document.getElementById('mainScreen');
const upgradeScreen = document.getElementById('upgradeScreen');
const upgradeButton = document.getElementById('upgradeButton');
const backButton = document.getElementById('backButton');
const userAvatarElement = document.getElementById('userAvatar');
const userNameElement = document.getElementById('userName');
const userAvatarUpgradeElement = document.getElementById('userAvatarUpgrade');
const userNameUpgradeElement = document.getElementById('userNameUpgrade');

// Данные пользователя
let userData = {
    user_id: null,
    username: null,
    first_name: null,
    last_name: null,
    photo_url: null,
    points: 0,
    level: 1,
    points_per_click: 1,
    upgrades: []
};

// Инициализация приложения
function initApp() {
    try {
        // Получаем данные пользователя из Telegram
        if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
            // Для тестирования без Telegram
            userData.user_id = 123456789;
            userData.username = 'TestUser';
            userData.first_name = 'Тестовый';
            userData.last_name = 'Пользователь';
            userData.photo_url = null;
        } else {
            const user = tg.initDataUnsafe.user;
            userData.user_id = user.id;
            userData.username = user.username;
            userData.first_name = user.first_name;
            userData.last_name = user.last_name || '';
            userData.photo_url = user.photo_url;
        }

        // Отображаем данные пользователя
        updateUserProfile();
        
        // Обновляем отображение
        updateDisplay();
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
    }
}

// Обновление профиля пользователя
function updateUserProfile() {
    // Формируем имя для отображения
    const displayName = userData.first_name + (userData.last_name ? ' ' + userData.last_name : '');
    
    // Устанавливаем имя пользователя
    userNameElement.textContent = displayName;
    userNameUpgradeElement.textContent = displayName;
    
    // Устанавливаем аватар пользователя
    if (userData.photo_url) {
        // Если есть URL фото, создаем элемент изображения
        const avatarImg = document.createElement('img');
        avatarImg.src = userData.photo_url;
        avatarImg.alt = 'Аватар';
        
        userAvatarElement.innerHTML = '';
        userAvatarElement.appendChild(avatarImg);
        
        // Копируем аватар на экран улучшений
        const avatarImgUpgrade = avatarImg.cloneNode(true);
        userAvatarUpgradeElement.innerHTML = '';
        userAvatarUpgradeElement.appendChild(avatarImgUpgrade);
    } else {
        // Если нет фото, показываем первую букву имени
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        userAvatarElement.innerHTML = `<div class="default-avatar">${firstLetter}</div>`;
        userAvatarUpgradeElement.innerHTML = `<div class="default-avatar">${firstLetter}</div>`;
    }
}

// Обновление отображения
function updateDisplay() {
    scoreElement.textContent = score;
    scoreUpgradeElement.textContent = score;
    clickValueElement.textContent = clickValue;
    
    document.getElementById('clickUpgradeButton').textContent = 
        `Улучшить клик (+1) - ${upgradeCosts.clickUpgrade} очков`;
    document.getElementById('autoClickerButton').textContent = 
        `Авто-кликер (${autoClickerCount}) - ${upgradeCosts.autoClicker} очков`;
    
    // Проверка доступности улучшений
    document.getElementById('clickUpgradeButton').disabled = score < upgradeCosts.clickUpgrade;
    document.getElementById('autoClickerButton').disabled = score < upgradeCosts.autoClicker;
}

// Обработка клика по монете
coinElement.addEventListener('click', () => {
    score += clickValue;
    updateDisplay();
    
    // Анимация при клике
    coinElement.classList.add('coin-click');
    setTimeout(() => {
        coinElement.classList.remove('coin-click');
    }, 150);
    
    // Создаем летящие числа при клике
    const clickIndicator = document.createElement('div');
    clickIndicator.className = 'click-indicator';
    clickIndicator.textContent = `+${clickValue}`;
    clickIndicator.style.left = `${Math.random() * 100}px`;
    coinElement.appendChild(clickIndicator);
    
    setTimeout(() => {
        clickIndicator.remove();
    }, 1000);
});

// Улучшение клика
document.getElementById('clickUpgradeButton').addEventListener('click', () => {
    if (score >= upgradeCosts.clickUpgrade) {
        score -= upgradeCosts.clickUpgrade;
        clickValue += 1;
        upgradeCosts.clickUpgrade = Math.floor(upgradeCosts.clickUpgrade * 1.5);
        updateDisplay();
    }
});

// Покупка авто-кликера
document.getElementById('autoClickerButton').addEventListener('click', () => {
    if (score >= upgradeCosts.autoClicker) {
        score -= upgradeCosts.autoClicker;
        autoClickerCount += 1;
        upgradeCosts.autoClicker = Math.floor(upgradeCosts.autoClicker * 1.5);
        
        // Очищаем предыдущий интервал
        if (autoClickerInterval) {
            clearInterval(autoClickerInterval);
        }
        
        // Устанавливаем новый интервал
        autoClickerInterval = setInterval(() => {
            score += autoClickerCount;
            updateDisplay();
        }, 1000);
        
        updateDisplay();
    }
});

// Переключение экранов
upgradeButton.addEventListener('click', () => {
    mainScreen.style.display = 'none';
    upgradeScreen.style.display = 'block';
});

backButton.addEventListener('click', () => {
    mainScreen.style.display = 'flex';
    upgradeScreen.style.display = 'none';
});

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp); 