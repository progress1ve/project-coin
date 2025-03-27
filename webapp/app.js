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
const mainScreen = document.getElementById('mainScreen');
const boostersScreen = document.getElementById('boostersScreen');
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
    auto_clicker_count: 0,
    upgrades: {
        clickUpgrade: {
            level: 1,
            cost: 10
        },
        autoClicker: {
            level: 0,
            cost: 50
        }
    }
};

// Функция сохранения прогресса в localStorage
function saveProgress() {
    // Обновляем данные перед сохранением
    userData.points = score;
    userData.points_per_click = clickValue;
    userData.auto_clicker_count = autoClickerCount;
    userData.upgrades.clickUpgrade.cost = upgradeCosts.clickUpgrade;
    userData.upgrades.autoClicker.cost = upgradeCosts.autoClicker;
    
    // Сохраняем в localStorage
    localStorage.setItem(`clicker_user_${userData.user_id}`, JSON.stringify(userData));
    
    // Опционально: синхронизируем с сервером
    syncWithServer();
}

// Функция загрузки прогресса из localStorage
function loadProgress() {
    if (!userData.user_id) return false;
    
    const savedData = localStorage.getItem(`clicker_user_${userData.user_id}`);
    if (!savedData) return false;
    
    try {
        const parsedData = JSON.parse(savedData);
        
        // Загружаем данные в текущую сессию
        score = parsedData.points || 0;
        clickValue = parsedData.points_per_click || 1;
        autoClickerCount = parsedData.auto_clicker_count || 0;
        
        if (parsedData.upgrades) {
            upgradeCosts.clickUpgrade = parsedData.upgrades.clickUpgrade?.cost || 10;
            upgradeCosts.autoClicker = parsedData.upgrades.autoClicker?.cost || 50;
        }
        
        // Обновляем остальные данные пользователя
        userData = {...userData, ...parsedData};
        
        // Восстанавливаем авто-кликер, если он был активен
        if (autoClickerCount > 0) {
            if (autoClickerInterval) {
                clearInterval(autoClickerInterval);
            }
            
            autoClickerInterval = setInterval(() => {
                score += autoClickerCount;
                updateDisplay();
                // Автосохранение при получении очков от авто-кликера
                saveProgress();
            }, 1000);
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка при загрузке сохраненных данных:', error);
        return false;
    }
}

// Функция синхронизации с сервером (опционально)
async function syncWithServer() {
    // Если нет ID пользователя, выходим
    if (!userData.user_id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/save-progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userData.user_id,
                username: userData.username,
                progress: {
                    points: score,
                    points_per_click: clickValue,
                    auto_clicker_count: autoClickerCount,
                    upgrades: {
                        clickUpgrade: upgradeCosts.clickUpgrade,
                        autoClicker: upgradeCosts.autoClicker
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при синхронизации с сервером');
        }
        
        console.log('Прогресс успешно синхронизирован с сервером');
    } catch (error) {
        console.error('Ошибка синхронизации с сервером:', error);
        // Сохраняем локально даже если синхронизация не удалась
    }
}

// Функция загрузки прогресса с сервера (опционально)
async function loadFromServer() {
    // Если нет ID пользователя, выходим
    if (!userData.user_id) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-progress?user_id=${userData.user_id}`);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке с сервера');
        }
        
        const serverData = await response.json();
        
        // Обновляем локальные данные из серверных
        if (serverData && serverData.progress) {
            score = serverData.progress.points || 0;
            clickValue = serverData.progress.points_per_click || 1;
            autoClickerCount = serverData.progress.auto_clicker_count || 0;
            
            if (serverData.progress.upgrades) {
                upgradeCosts.clickUpgrade = serverData.progress.upgrades.clickUpgrade || 10;
                upgradeCosts.autoClicker = serverData.progress.upgrades.autoClicker || 50;
            }
            
            // Сохраняем в localStorage для будущего использования
            userData.points = score;
            userData.points_per_click = clickValue;
            userData.auto_clicker_count = autoClickerCount;
            localStorage.setItem(`clicker_user_${userData.user_id}`, JSON.stringify(userData));
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка загрузки прогресса с сервера:', error);
        return false;
    }
}

// Инициализация приложения
async function initApp() {
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

        // Сначала пробуем загрузить с сервера
        const serverLoaded = await loadFromServer();
        
        // Если с сервера не удалось, пробуем из localStorage
        if (!serverLoaded) {
            loadProgress();
        }
        
        // Отображаем данные пользователя
        updateUserProfile();
        
        // Обновляем отображение
        updateDisplay();
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        // Пробуем загрузить из localStorage в случае ошибки
        loadProgress();
        updateUserProfile();
        updateDisplay();
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

// Инициализация обработчиков событий
function initEventListeners() {
    // Клик по монете
    const coinElement = document.getElementById('coin');
    if (coinElement) {
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
            
            // Сохраняем прогресс при каждом 10-м клике
            if (score % 10 === 0) {
                saveProgress();
            }
        });
    }

    // Улучшение клика
    const clickUpgradeButton = document.getElementById('clickUpgradeButton');
    if (clickUpgradeButton) {
        clickUpgradeButton.addEventListener('click', () => {
            if (score >= upgradeCosts.clickUpgrade) {
                score -= upgradeCosts.clickUpgrade;
                clickValue += 1;
                upgradeCosts.clickUpgrade = Math.floor(upgradeCosts.clickUpgrade * 1.5);
                updateDisplay();
                // Сохраняем прогресс после покупки улучшения
                saveProgress();
            }
        });
    }

    // Покупка авто-кликера
    const autoClickerButton = document.getElementById('autoClickerButton');
    if (autoClickerButton) {
        autoClickerButton.addEventListener('click', () => {
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
                    // Автосохранение каждые 10 секунд для авто-кликера
                    if (Math.floor(Date.now() / 1000) % 10 === 0) {
                        saveProgress();
                    }
                }, 1000);
                
                updateDisplay();
                // Сохраняем прогресс после покупки авто-кликера
                saveProgress();
            }
        });
    }

    // Обработчик для переключения между экранами с сохранением прогресса
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Сохраняем прогресс при переключении экранов
            saveProgress();
            
            // Убираем активный класс со всех элементов меню
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Добавляем активный класс текущему элементу
            this.classList.add('active');
            
            // Получаем id экрана для отображения
            const screenId = this.dataset.screen;
            
            // Скрываем все экраны
            screens.forEach(screen => screen.style.display = 'none');
            
            // Показываем нужный экран
            document.getElementById(screenId).style.display = 'flex';
            
            // Обновляем данные на экране, если это экран улучшений
            if (screenId === 'boostersScreen') {
                document.getElementById('score-upgrade').textContent = score;
            }
        });
    });
    
    // Сохранение прогресса при закрытии страницы
    window.addEventListener('beforeunload', () => {
        saveProgress();
    });
    
    // Периодическое автосохранение
    setInterval(saveProgress, 60000); // Каждую минуту
}

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initEventListeners();
});

// Убираем синее выделение при клике
document.addEventListener('DOMContentLoaded', function() {
    // Находим элемент с монетой
    const coinElement = document.querySelector('.coin'); // Замените на ваш селектор

    // Убираем стандартное выделение
    coinElement.style.webkitTapHighlightColor = 'transparent';
    coinElement.style.outline = 'none';
    coinElement.style.userSelect = 'none';
    
});