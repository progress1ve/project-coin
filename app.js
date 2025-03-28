// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Расширяем на весь экран

// Конфигурация API
const API_BASE_URL = 'http://localhost:8000'; // Замените на URL вашего API в продакшене

// Флаг локального режима (без подключения к серверу)
let isLocalMode = true;

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

// Добавляем недостающие переменные
let totalMined = 0;
let airdropWeight = 1;
let coolingMultiplier = 1;
let energyEfficiency = 0;
let signalBoostChance = 0;

// Обновляем конфигурацию улучшений
let upgradeCosts = {
    clickUpgrade: 10,
    autoClicker: 50,
    cooling: 100,     // Добавляем новые улучшения
    energy: 150,
    signal: 200
};

// Добавляем уровни улучшений
let upgradeLevel = {
    clickUpgrade: 1,
    autoClicker: 0,
    cooling: 0,
    energy: 0,
    signal: 0
};

let autoClickerInterval = null;
let autoClickerCount = 0;

// Элементы DOM
const scoreElement = document.getElementById('score');
const scoreUpgradeElement = document.getElementById('score-upgrade');
const scoreProfileElement = document.getElementById('score-profile');
const scoreTasksElement = document.getElementById('score-tasks');
const scoreFriendsElement = document.getElementById('score-friends');
const scoreLeaderboardElement = document.getElementById('score-leaderboard');
const clickValueElement = document.getElementById('clickValue');
const mainScreen = document.getElementById('mainScreen');
const boostersScreen = document.getElementById('boostersScreen');
const userAvatarElement = document.getElementById('userAvatar');
const userNameElement = document.getElementById('userName');
const userAvatarUpgradeElement = document.getElementById('userAvatarUpgrade');
const userNameUpgradeElement = document.getElementById('userNameUpgrade');

// Дополнительные элементы DOM для загрузочного экрана
const loadingScreen = document.getElementById('loadingScreen');
const mainContainer = document.getElementById('mainContainer');
const loadingMessage = document.querySelector('.loading-message');

// Добавим переменные для новых элементов интерфейса
const dailyIncomeElement = document.getElementById('dailyIncome');
const userRankElement = document.getElementById('userRank');
const rankBlockElement = document.querySelector('.rank-block');
const leaderboardScreen = document.getElementById('leaderboardScreen');

// Добавляем переменные для топа пользователей
const topUsersContainer = document.getElementById('topUsersContainer');
let topUsers = [];

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
    total_mined: 0,
    airdrop_weight: 1,
    cooling_multiplier: 1,
    energy_efficiency: 0,
    signal_boost_chance: 0,
    daily_tasks: {
        collect_points: {
            target: 1000,
            progress: 0,
            claimed: false
        },
        buy_upgrade: {
            target: 1,
            progress: 0,
            claimed: false
        }
    },
    airdrop_tasks: {
        subscribe_channel: false,
        invite_friend: false
    },
    upgrades: {
        clickUpgrade: {
            level: 1,
            cost: 10
        },
        autoClicker: {
            level: 0,
            cost: 50
        },
        cooling: {
            level: 0,
            cost: 100
        },
        energy: {
            level: 0,
            cost: 150
        },
        signal: {
            level: 0,
            cost: 200
        }
    }
};

// Переменные для идентификации пользователя в топе
let currentUserId = null;
let userName = "Вы";

// Инициализация данных из Telegram
function initTelegramData() {
    try {
        console.log('Инициализация данных из Telegram WebApp');
        
        // Проверяем, доступен ли Telegram WebApp API
        if (window.Telegram && window.Telegram.WebApp) {
            const webAppData = window.Telegram.WebApp.initDataUnsafe || {};
            
            // Получаем данные пользователя
            if (webAppData.user) {
                userData.user_id = webAppData.user.id || Math.floor(Math.random() * 100000);
                userData.username = webAppData.user.username || `user${userData.user_id}`;
                userData.first_name = webAppData.user.first_name || 'Пользователь';
                userData.last_name = webAppData.user.last_name || '';
                userData.photo_url = webAppData.user.photo_url || '';
                
                console.log('Данные пользователя получены из Telegram:', userData.username);
            } else {
                console.log('Данные пользователя недоступны, используем демо-режим');
                // Генерируем демо-данные для пользователя
                userData.user_id = Math.floor(Math.random() * 100000);
                userData.username = `demo_user${userData.user_id}`;
                userData.first_name = 'Демо';
                userData.last_name = 'Пользователь';
            }
            
            // Устанавливаем текущий идентификатор пользователя для топа
            currentUserId = userData.user_id;
            userName = userData.first_name + (userData.last_name ? ' ' + userData.last_name : '');
            
        } else {
            console.log('Telegram WebApp API недоступен, используем локальный режим');
            // Генерируем тестовые данные для локального режима
            userData.user_id = Math.floor(Math.random() * 100000);
            userData.username = `local_user${userData.user_id}`;
            userData.first_name = 'Локальный';
            userData.last_name = 'Пользователь';
            
            // Устанавливаем текущий идентификатор пользователя для топа
            currentUserId = userData.user_id;
            userName = userData.first_name + (userData.last_name ? ' ' + userData.last_name : '');
        }
        
        // Устанавливаем флаг локального режима
        isLocalMode = !(window.Telegram && window.Telegram.WebApp);
        
    } catch (error) {
        console.error('Ошибка при инициализации данных Telegram:', error);
        
        // Устанавливаем демо-данные в случае ошибки
        userData.user_id = Math.floor(Math.random() * 100000);
        userData.username = `error_user${userData.user_id}`;
        userData.first_name = 'Пользователь';
        userData.last_name = '';
        
        // Устанавливаем текущий идентификатор пользователя для топа
        currentUserId = userData.user_id;
        userName = 'Пользователь';
        
        isLocalMode = true;
    }
}

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
    
    // Добавляем проверку на локальный режим с выключенным сервером
    const isLocalMode = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.protocol === 'file:';
    
    // В локальном режиме просто выходим без запросов к серверу
    if (isLocalMode) {
        // console.log('Локальный режим: синхронизация с сервером отключена');
        return;
    }
    
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
    
    // Добавляем проверку на локальный режим с выключенным сервером
    const isLocalMode = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.protocol === 'file:';
    
    // В локальном режиме просто выходим без запросов к серверу
    if (isLocalMode) {
        // console.log('Локальный режим: загрузка с сервера отключена');
        return false;
    }
    
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

// Функция для обновления сообщения загрузки с анимацией прогресс-бара
function updateLoadingMessage(message, progress = null) {
    const loadingMessageElement = document.querySelector('.loading-message');
    const progressFill = document.getElementById('loadingProgressFill');
    
    if (loadingMessageElement) {
        loadingMessageElement.textContent = message;
    }
    
    // Если указан прогресс, обновляем прогресс-бар
    if (progress !== null && progressFill) {
        progressFill.style.width = `${progress}%`;
    } else if (progressFill) {
        // Если прогресс не указан, но есть прогресс-бар, 
        // увеличиваем его значение в зависимости от текущего состояния
        const currentWidth = parseInt(progressFill.style.width || '0');
        let newWidth = Math.min(currentWidth + 15, 90); // Не доходим до 100%, пока не закончится загрузка
        
        progressFill.style.width = `${newWidth}%`;
    }
}

// Запуск анимации загрузочного экрана
function startLoadingAnimation() {
    const coinImg = document.querySelector('.animated-coin');
    
    // Анимация монеты
    if (coinImg) {
        // Добавляем CSS для пульсирующей анимации монеты
        coinImg.style.animation = 'pulse 1.5s infinite alternate';
    }
    
    // Инициализация прогресс-бара
    const progressFill = document.getElementById('loadingProgressFill');
    if (progressFill) {
        progressFill.style.width = '10%';
    }
    
    // Запускаем анимацию точек загрузки
    const loadingDots = document.querySelectorAll('.loading-dots div');
    if (loadingDots.length > 0) {
        loadingDots.forEach((dot, index) => {
            dot.style.animation = `loading-dots 1.2s ${index * 0.16}s infinite ease-in-out`;
        });
    }
    
    // Устанавливаем начальное сообщение
    updateLoadingMessage('Подключение к блокчейну...', 10);
}

// Функция для загрузки и отображения топа пользователей
function loadTopUsers() {
    try {
        // Проверяем, в локальном ли режиме работаем (без сервера)
        const isLocalMode = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.protocol === 'file:';
        
        // Для реального сервера пытаемся получить данные через API
        if (!isLocalMode) {
            fetch(`${API_BASE_URL}/top-users?limit=5`)
                .then(response => response.json())
                .then(data => {
                    if (data.top_users && data.top_users.length > 0) {
                        // Если в базе есть пользователи, отображаем их
                        updateTopUsersDisplay(data.top_users);
                        
                        // Находим текущего пользователя в списке
                        const userIndex = data.top_users.findIndex(user => user.user_id === userData.user_id);
                        const userRank = userIndex !== -1 ? userIndex + 1 : data.top_users.length + 1;
                        
                        // Обновляем ранг в интерфейсе
                        const rankCircle = document.querySelector('.rank-circle');
                        if (rankCircle) {
                            rankCircle.textContent = userRank;
                        }
                    } else {
                        // Если база пуста, отображаем только текущего пользователя
                        displayOnlyCurrentUser();
                    }
                })
                .catch(error => {
                    console.error("Ошибка при загрузке топа пользователей:", error);
                    displayOnlyCurrentUser();
                });
        } else {
            // Для локального режима (демонстрационный вариант)
            displayOnlyCurrentUser();
        }
    } catch (error) {
        console.error("Ошибка при загрузке топа пользователей:", error);
        displayOnlyCurrentUser();
    }
}

// Функция для отображения только текущего пользователя
function displayOnlyCurrentUser() {
    // Создаем объект пользователя с текущими данными
    const currentUser = {
        user_id: userData.user_id || 1,
        username: userName || userData.first_name || "Вы",
        points: score,
        level: userData.level || 1,
        points_per_click: clickValue
    };
    
    // Отображаем только текущего пользователя в списке
    updateTopUsersDisplay([currentUser]);
    
    // Устанавливаем ранг как 1 (единственный пользователь)
    const rankCircle = document.querySelector('.rank-circle');
    if (rankCircle) {
        rankCircle.textContent = "1";
    }
}

// Функция для обновления отображения топ-пользователей
function updateTopUsersDisplay(users) {
    const topUsersContainer = document.getElementById('topUsersContainer');
    if (!topUsersContainer) return;
    
    topUsersContainer.innerHTML = '';
    
    // Создаем заголовок
    const header = document.createElement('div');
    header.className = 'top-header';
    header.textContent = 'Топ майнеры';
    topUsersContainer.appendChild(header);
    
    // Создаем контейнер для списка
    const topList = document.createElement('div');
    topList.className = 'top-list';
    
    // Отображаем пользователей
    users.forEach((user, index) => {
        // Проверяем, является ли этот пользователь текущим
        // Используем или user.id (для демо данных) или user.user_id (для данных с сервера)
        const isCurrentUser = (user.user_id && user.user_id === userData.user_id) || 
                              (user.id && user.id === currentUserId);
        
        const userItem = document.createElement('div');
        userItem.className = `top-item ${isCurrentUser ? 'current-user' : ''}`;
        
        // Определяем, какое поле использовать для хешрейта (points_per_click или pointsPerClick)
        const hashRate = user.points_per_click || user.pointsPerClick || 1;
        
        userItem.innerHTML = `
            <div class="top-position">${index + 1}</div>
            <div class="top-username">${user.username}</div>
            <div class="top-hashrate">${formatNumber(hashRate)} H/s</div>
            <div class="top-points">${formatNumber(user.points)}</div>
        `;
        
        topList.appendChild(userItem);
    });
    
    topUsersContainer.appendChild(topList);
}

// Запускаем инициализацию при полной загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM полностью загружен');
    
    // Визуальные индикаторы загрузки
    updateLoadingMessage('Инициализация майнера...', 10);
    
    // Мини-задержка перед началом инициализации для корректного отображения загрузочного экрана
    setTimeout(() => {
        try {
            // Запускаем основную инициализацию
            initApp();
            
            // Настраиваем обработчики событий
            initEventListeners();
            
            // Настраиваем анимацию монеты
            setupCoinAnimation();
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
            // Показываем сообщение об ошибке
            updateLoadingMessage('Ошибка загрузки. Перезагрузите страницу...', 100);
        }
    }, 300);
});

// Обновлённая версия функции для обработки процесса инициализации
async function initApp() {
    try {
        console.log('Инициализация приложения...');
        
        // Получаем данные из Telegram Web App
        initTelegramData();
        
        // Устанавливаем анимацию загрузки
        startLoadingAnimation();
        
        // Загружаем сохраненный прогресс
        updateLoadingMessage('Загрузка прогресса...', 30);
        loadProgress();
        
        // Инициализируем начальные переходы между экранами
        updateLoadingMessage('Подготовка интерфейса...', 50);
        initScreenTransitions();
        
        // Пытаемся загрузить данные с сервера, если доступно
        updateLoadingMessage('Синхронизация с сервером...', 70);
        
        // Если функция доступна, обрабатываем телеграм-данные
        if (window.Telegram && window.Telegram.WebApp) {
            await syncWithServer();
        } else {
            console.log('WebApp API недоступен, работаем в локальном режиме');
        }
        
        // Устанавливаем обработчики событий
        updateLoadingMessage('Настройка интерфейса...', 85);
        setupNavigation();
        setupEventListeners();
        setupCoinAnimation();
        setupUpgradeButtons();
        setupAutoClicker();
        setupOtherUpgradeButtons();
        
        // Устанавливаем начальные значения для пользовательского интерфейса
        updateUserProfile();
        updateDisplay();
        animateMainScreenElements();
        initTasks();
        
        // Добавляем атрибут с активным экраном при загрузке страницы
        document.body.setAttribute('data-active-screen', 'mainScreen');
        
        // Показываем основной контейнер и скрываем загрузку
        updateLoadingMessage('Готово!', 100);
        setTimeout(() => {
            hideLoadingScreen();
            
            // Переходим на последний активный экран, если он был сохранен
            const lastActiveScreen = localStorage.getItem('lastActiveScreen');
            if (lastActiveScreen && lastActiveScreen !== 'mainScreen') {
                switchScreen(lastActiveScreen);
            }
        }, 500);
        
    } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
        updateLoadingMessage('Произошла ошибка! Перезагрузите страницу', 100);
    }
}

// Инициализация переходов между экранами
function initScreenTransitions() {
    console.log('Инициализация переходов между экранами');
    
    const screens = document.querySelectorAll('.screen');
    const mainScreen = document.getElementById('mainScreen');
    
    // Устанавливаем начальное состояние всех экранов
    screens.forEach(screen => {
        if (screen !== mainScreen) {
            screen.style.display = 'none';
            screen.classList.remove('active');
        } else {
            screen.classList.add('active');
            // Убедимся, что главный экран готов к отображению
            screen.style.display = 'flex';
            screen.style.opacity = '0';
            screen.style.transform = 'translateY(10px)';
            console.log('Главный экран подготовлен');
        }
    });
}

// Функция анимации элементов главного экрана
function animateMainScreenElements() {
    // Массив с ID элементов, которые нужно анимировать, и задержками
    const elements = [
        { id: 'balance-header', delay: 100 },
        { id: 'stats-container', delay: 200 },
        { id: 'coin-container', delay: 300 },
        { id: 'rank-container', delay: 400 }
    ];
    
    // Добавим класс для анимации к каждому элементу с соответствующей задержкой
    elements.forEach(item => {
        const element = document.getElementById(item.id) || document.querySelector(`.${item.id}`);
        if (element) {
            // Сначала устанавливаем начальное состояние
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            
            // После загрузки добавим класс для анимации с нужной задержкой
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, item.delay);
            });
        }
    });
}

// Обновление профиля пользователя
function updateUserProfile() {
    // Проверяем, существуют ли нужные элементы
    if (!userNameElement || !userAvatarElement) {
        console.warn('Элементы профиля пользователя не найдены в DOM');
        return;
    }
    
    // Формируем имя для отображения
    const displayName = userData.first_name + (userData.last_name ? ' ' + userData.last_name : '');
    
    // Устанавливаем имя пользователя
    userNameElement.textContent = displayName;
    
    // Устанавливаем аватар пользователя
    if (userData.photo_url) {
        // Если есть URL фото, создаем элемент изображения
        const avatarImg = document.createElement('img');
        avatarImg.src = userData.photo_url;
        avatarImg.alt = 'Аватар';
        
        userAvatarElement.innerHTML = '';
        userAvatarElement.appendChild(avatarImg);
    } else {
        // Если нет фото, показываем первую букву имени
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        userAvatarElement.innerHTML = `<div class="default-avatar">${firstLetter}</div>`;
    }
    
    // Обновляем аватары и имена на других экранах, если они существуют
    const avatarProfiles = ['userAvatarProfile', 'userAvatarTasks', 'userAvatarFriends', 'userAvatarUpgrade'];
    const nameProfiles = ['userNameProfile', 'userNameTasks', 'userNameFriends', 'userNameUpgrade'];
    
    // Устанавливаем аватары
    avatarProfiles.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = userAvatarElement.innerHTML;
        }
    });
    
    // Устанавливаем имена
    nameProfiles.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = displayName;
        }
    });
}

// Расчет дневного дохода
function calculateDailyIncome() {
    // Базовый доход в час (можно адаптировать под вашу логику)
    const hourlyIncome = autoClickerCount * coolingMultiplier * 3600; 
    return Math.round(hourlyIncome * 24);
}

// Обновление отображения
function updateDisplay() {
    try {
        // Находим все элементы по ID или классу
        const scoreElement = document.getElementById('score');
        const scoreUpgradeElement = document.getElementById('score-upgrade');
        const scoreProfileElement = document.getElementById('score-profile');
        const scoreTasksElement = document.getElementById('score-tasks');
        const scoreFriendsElement = document.getElementById('score-friends');
        const scoreLeaderboardElement = document.getElementById('score-leaderboard');
        const clickValueElement = document.getElementById('clickValue');
        const dailyIncomeElement = document.getElementById('dailyIncome');
        const rankCircle = document.querySelector('.rank-circle');
        
        // Обновляем балансы на всех экранах
        if (scoreElement) scoreElement.textContent = formatNumber(score);
        if (scoreUpgradeElement) scoreUpgradeElement.textContent = formatNumber(score);
        if (scoreProfileElement) scoreProfileElement.textContent = formatNumber(score);
        if (scoreTasksElement) scoreTasksElement.textContent = formatNumber(score);
        if (scoreFriendsElement) scoreFriendsElement.textContent = formatNumber(score);
        if (scoreLeaderboardElement) scoreLeaderboardElement.textContent = formatNumber(score);
        
        // Обновляем хешрейт
        if (clickValueElement) clickValueElement.textContent = formatNumber(clickValue);
        
        // Обновляем доход за секунду
        if (dailyIncomeElement) {
            const secondIncome = Math.round(autoClickerCount * coolingMultiplier);
            dailyIncomeElement.textContent = formatNumber(secondIncome, true);
        }
        
        // Обновляем ранг (место)
        if (rankCircle && userData.rank) {
            rankCircle.textContent = userData.rank;
        } else if (rankCircle) {
            const rank = upgradeLevel.clickUpgrade + upgradeLevel.autoClicker * 2 + 
                        upgradeLevel.cooling * 3 + upgradeLevel.energy * 4 + 
                        upgradeLevel.signal * 5;
            rankCircle.textContent = rank || '-';
        }
        
        // Обновляем кнопки улучшений
        updateUpgradeButtons();
        
        // Обновляем задания, если они есть
        updateTasks();
        
        // Обновляем статистику профиля
        updateProfileStats();
    } catch (error) {
        console.error('Ошибка при обновлении отображения:', error);
    }
}

// Обновление кнопок улучшений
function updateUpgradeButtons() {
    const clickUpgradeButton = document.getElementById('clickUpgradeButton');
    const autoClickerButton = document.getElementById('autoClickerButton');
    const coolingSystemButton = document.getElementById('coolingSystemButton');
    const energyEfficiencyButton = document.getElementById('energyEfficiencyButton');
    const signalBoostButton = document.getElementById('signalBoostButton');
    
    if (clickUpgradeButton) {
        clickUpgradeButton.textContent = `Оптимизация Алгоритма (+1) - ${formatNumber(upgradeCosts.clickUpgrade)} SLC`;
        clickUpgradeButton.disabled = score < upgradeCosts.clickUpgrade;
    }
    
    if (autoClickerButton) {
        autoClickerButton.textContent = `Майнинг-Риг на GPU (${autoClickerCount}) - ${formatNumber(upgradeCosts.autoClicker)} SLC`;
        autoClickerButton.disabled = score < upgradeCosts.autoClicker;
    }
    
    if (coolingSystemButton) {
        const nextMultiplier = (coolingMultiplier + 0.2).toFixed(1);
        coolingSystemButton.textContent = `Система Охлаждения (x${nextMultiplier}) - ${formatNumber(upgradeCosts.cooling)} SLC`;
        coolingSystemButton.disabled = score < upgradeCosts.cooling;
    }
    
    if (energyEfficiencyButton) {
        const nextEfficiency = energyEfficiency + 10;
        energyEfficiencyButton.textContent = `Энергоэффективность (-${nextEfficiency}%) - ${formatNumber(upgradeCosts.energy)} SLC`;
        energyEfficiencyButton.disabled = score < upgradeCosts.energy;
    }
    
    if (signalBoostButton) {
        const nextChance = ((signalBoostChance + 0.05) * 100).toFixed(0);
        signalBoostButton.textContent = `Усиление Сигнала (+${nextChance}%) - ${formatNumber(upgradeCosts.signal)} SLC`;
        signalBoostButton.disabled = score < upgradeCosts.signal;
    }
}

// Обновляем функцию для заданий
function updateTasks() {
    if (!userData.daily_tasks) return;
    
    const taskProgressElements = document.querySelectorAll('.task-progress');
    const taskClaimButtons = document.querySelectorAll('.task-claim-btn');
    
    if (taskProgressElements && taskProgressElements.length >= 1) {
        // Задание на сбор SLC
        taskProgressElements[0].textContent = `${formatNumber(Math.min(score, userData.daily_tasks.collect_points.target))}/${formatNumber(userData.daily_tasks.collect_points.target)}`;
        
        if (taskClaimButtons && taskClaimButtons.length >= 1) {
            taskClaimButtons[0].disabled = !(score >= userData.daily_tasks.collect_points.target && !userData.daily_tasks.collect_points.claimed);
        }
        
        // Задание на покупку улучшений
        if (taskProgressElements.length >= 2 && userData.daily_tasks.buy_upgrade) {
            const currentProgress = userData.daily_tasks.buy_upgrade.progress || 0;
            const target = userData.daily_tasks.buy_upgrade.target || 1;
            
            taskProgressElements[1].textContent = `${formatNumber(Math.min(currentProgress, target))}/${formatNumber(target)}`;
            
            if (taskClaimButtons && taskClaimButtons.length >= 2) {
                taskClaimButtons[1].disabled = !(currentProgress >= target && !userData.daily_tasks.buy_upgrade.claimed);
            }
        }
    }
}

// Функция для обновления счета в локальном режиме
function updateScoreLocally(amount) {
    // Базовое увеличение очков
    const miningAmount = Math.round(amount * coolingMultiplier);
    score += miningAmount;
    totalMined += miningAmount;
    
    // Проверяем шанс на бонусный блок
    if (Math.random() < signalBoostChance) {
        const bonusAmount = Math.floor(miningAmount * 0.5);
        score += bonusAmount;
        totalMined += bonusAmount;
        showBonusBlock(bonusAmount);
    }
    
    updateDisplay();
    
    // Сохраняем прогресс при каждом 10-м клике
    if (score % 10 === 0) {
        saveProgress();
    }
}

// Функция для отображения бонусного блока
function showBonusBlock(amount) {
    const coinContainer = document.querySelector('.coin-container');
    if (!coinContainer) return;
    
    // Создаем элемент бонусного блока
    const bonusBlock = document.createElement('div');
    bonusBlock.className = 'bonus-indicator';
    bonusBlock.textContent = `БОНУС! +${amount}`;
    
    // Добавляем в контейнер монеты
    coinContainer.appendChild(bonusBlock);
    
    // Играем специальный звук бонуса
    const bonusAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-magical-coin-win-1936.mp3');
    bonusAudio.volume = 0.4;
    bonusAudio.play().catch(() => {});
    
    // Удаляем элемент после анимации
    setTimeout(() => {
        bonusBlock.remove();
    }, 2000);
}

// Обновляем функцию updateProfileStats для проверки существования элементов
function updateProfileStats() {
    const hashrateStatsElement = document.getElementById('hashrate-stats');
    const totalMinedElement = document.getElementById('total-mined');
    const airdropWeightElement = document.getElementById('airdrop-weight');
    
    if (hashrateStatsElement) {
        const manualHashrate = clickValue;
        const autoHashrate = autoClickerCount * coolingMultiplier;
        hashrateStatsElement.textContent = `${manualHashrate} H/s (ручн.) + ${autoHashrate.toFixed(1)} H/s (авто)`;
    }
    
    if (totalMinedElement) {
        totalMinedElement.textContent = `${totalMined} SLC`;
    }
    
    if (airdropWeightElement) {
        airdropWeightElement.textContent = `${airdropWeight.toFixed(1)}x`;
    }
    
    // ... existing code ...
}

// Добавляем функцию initTasks, которая вызывается, но не определена
function initTasks() {
    // Инициализация данных для ежедневных заданий
    if (!userData.daily_tasks) {
        userData.daily_tasks = {
            collect_points: {
                target: 1000,
                progress: 0,
                claimed: false
            },
            buy_upgrade: {
                target: 1,
                progress: 0,
                claimed: false
            }
        };
    }
    
    // Обновляем отображение заданий
    const taskProgressElements = document.querySelectorAll('.task-progress');
    const taskClaimButtons = document.querySelectorAll('.task-claim-btn');
    
    if (taskProgressElements && taskProgressElements.length >= 1) {
        // Задание на сбор SLC
        taskProgressElements[0].textContent = `${Math.min(score, userData.daily_tasks.collect_points.target)}/${userData.daily_tasks.collect_points.target}`;
        
        if (taskClaimButtons && taskClaimButtons.length >= 1) {
            taskClaimButtons[0].disabled = !(score >= userData.daily_tasks.collect_points.target && !userData.daily_tasks.collect_points.claimed);
            
            // Добавляем обработчик для кнопки получения награды
            if (!taskClaimButtons[0].hasEventListener) {
                taskClaimButtons[0].addEventListener('click', function() {
                    if (score >= userData.daily_tasks.collect_points.target && !userData.daily_tasks.collect_points.claimed) {
                        // Начисляем награду (например, 200 SLC)
                        score += 200;
                        userData.daily_tasks.collect_points.claimed = true;
                        this.disabled = true;
                        
                        // Сохраняем прогресс и обновляем интерфейс
                        saveProgress();
                        updateDisplay();
                        
                        // Уведомление о награде
                        alert('Вы получили 200 SLC за выполнение задания!');
                    }
                });
                taskClaimButtons[0].hasEventListener = true;
            }
        }
        
        // Задание на покупку улучшений
        if (taskProgressElements.length >= 2) {
            taskProgressElements[1].textContent = `${Math.min(userData.daily_tasks.buy_upgrade.progress, userData.daily_tasks.buy_upgrade.target)}/${userData.daily_tasks.buy_upgrade.target}`;
            
            if (taskClaimButtons && taskClaimButtons.length >= 2) {
                taskClaimButtons[1].disabled = !(userData.daily_tasks.buy_upgrade.progress >= userData.daily_tasks.buy_upgrade.target && !userData.daily_tasks.buy_upgrade.claimed);
                
                // Добавляем обработчик для кнопки получения награды
                if (!taskClaimButtons[1].hasEventListener) {
                    taskClaimButtons[1].addEventListener('click', function() {
                        if (userData.daily_tasks.buy_upgrade.progress >= userData.daily_tasks.buy_upgrade.target && !userData.daily_tasks.buy_upgrade.claimed) {
                            // Начисляем награду (например, 300 SLC)
                            score += 300;
                            userData.daily_tasks.buy_upgrade.claimed = true;
                            this.disabled = true;
                            
                            // Сохраняем прогресс и обновляем интерфейс
                            saveProgress();
                            updateDisplay();
                            
                            // Уведомление о награде
                            alert('Вы получили 300 SLC за выполнение задания!');
                        }
                    });
                    taskClaimButtons[1].hasEventListener = true;
                }
            }
        }
    }
}

// Функция инициализации обработчиков событий
function setupEventListeners() {
    console.log('Инициализация обработчиков событий');
    
    // Обработчик нажатия на "Место"
    const rankIndicator = document.getElementById('rankIndicator');
    if (rankIndicator) {
        rankIndicator.addEventListener('click', function() {
            switchScreen('leaderboardScreen');
            loadTopUsers();
        });
    }
    
    // Обработчик для кнопки возврата из рейтинга
    const backToMainButton = document.getElementById('backToMainButton');
    if (backToMainButton) {
        backToMainButton.addEventListener('click', function() {
            switchScreen('mainScreen');
        });
    }

    // Обработчик клика по монете
    const coin = document.getElementById('coin');
    const coinContainer = document.querySelector('.coin-container');
    
    if (coin) {
        coin.addEventListener('click', function() {
            // Базовое увеличение очков
            const miningAmount = Math.round(clickValue * coolingMultiplier);
            score += miningAmount;
            updateDisplay();
            
            // Показываем анимацию клика
            showClickIndicator(miningAmount);
            
            // Сохраняем прогресс после клика
            if (score % 5 === 0) {
                saveProgress();
            }
        });
    }

    // Обработчики для кнопок улучшений
    setupUpgradeButtons();
    
    // Автосохранение каждую минуту
    setInterval(saveProgress, 60000);
}

// Обработчики для кнопок навигации
function setupNavigation() {
    // Находим все кнопки навигации
    const navItems = document.querySelectorAll('.nav-item');
    
    // Добавляем обработчики для каждой кнопки
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Получаем ID целевого экрана
            const targetScreenId = this.getAttribute('data-screen');
            
            // Переключаемся на этот экран
            switchScreen(targetScreenId);
            
            // Если переключаемся на экран рейтинга, обновляем топ пользователей
            if (targetScreenId === 'leaderboardScreen') {
                loadTopUsers();
            }
        });
    });
}

// Обработчики для кнопок улучшений
function setupUpgradeButtons() {
    // Улучшение клика
    const clickUpgradeButton = document.getElementById('clickUpgradeButton');
    if (clickUpgradeButton) {
        clickUpgradeButton.addEventListener('click', function() {
            if (score >= upgradeCosts.clickUpgrade) {
                score -= upgradeCosts.clickUpgrade;
                clickValue += 1;
                upgradeLevel.clickUpgrade += 1;
                upgradeCosts.clickUpgrade = Math.floor(upgradeCosts.clickUpgrade * 1.5);
                
                // Отмечаем прогресс задания на покупку улучшений
                if (userData.daily_tasks && userData.daily_tasks.buy_upgrade) {
                    userData.daily_tasks.buy_upgrade.progress += 1;
                }
                
                updateDisplay();
                saveProgress();
            }
        });
    }
    
    // Покупка Майнинг-Рига
    const autoClickerButton = document.getElementById('autoClickerButton');
    if (autoClickerButton) {
        autoClickerButton.addEventListener('click', function() {
            if (score >= upgradeCosts.autoClicker) {
                score -= upgradeCosts.autoClicker;
                autoClickerCount += 1;
                upgradeLevel.autoClicker += 1;
                upgradeCosts.autoClicker = Math.floor(upgradeCosts.autoClicker * 1.5);
                
                // Отмечаем прогресс задания
                if (userData.daily_tasks && userData.daily_tasks.buy_upgrade) {
                    userData.daily_tasks.buy_upgrade.progress += 1;
                }
                
                // Настраиваем автокликер
                setupAutoClicker();
                
                updateDisplay();
                saveProgress();
            }
        });
    }
    
    // Остальные кнопки улучшений...
    setupOtherUpgradeButtons();
}

// Настройка автокликера
function setupAutoClicker() {
    // Очищаем предыдущий интервал
    if (autoClickerInterval) {
        clearInterval(autoClickerInterval);
    }
    
    // Устанавливаем новый интервал с учетом бонусов
    if (autoClickerCount > 0) {
        autoClickerInterval = setInterval(() => {
            const miningAmount = Math.round(autoClickerCount * coolingMultiplier);
            score += miningAmount;
            totalMined += miningAmount;
            
            // Проверяем шанс на бонусный блок
            if (Math.random() < signalBoostChance) {
                const bonusAmount = Math.floor(miningAmount * 0.5);
                score += bonusAmount;
                totalMined += bonusAmount;
                showBonusBlock(bonusAmount);
            }
            
            updateDisplay();
        }, 1000);
    }
}

// Обработчики для остальных кнопок улучшений
function setupOtherUpgradeButtons() {
    // Система охлаждения
    const coolingSystemButton = document.getElementById('coolingSystemButton');
    if (coolingSystemButton) {
        coolingSystemButton.addEventListener('click', function() {
            if (score >= upgradeCosts.cooling) {
                score -= upgradeCosts.cooling;
                coolingMultiplier += 0.2;
                upgradeLevel.cooling += 1;
                upgradeCosts.cooling = Math.floor(upgradeCosts.cooling * 1.5);
                
                // Отмечаем прогресс задания
                if (userData.daily_tasks && userData.daily_tasks.buy_upgrade) {
                    userData.daily_tasks.buy_upgrade.progress += 1;
                }
                
                updateDisplay();
                saveProgress();
                
                // Обновляем автокликер с новым множителем
                setupAutoClicker();
            }
        });
    }
    
    // Энергоэффективность
    const energyEfficiencyButton = document.getElementById('energyEfficiencyButton');
    if (energyEfficiencyButton) {
        energyEfficiencyButton.addEventListener('click', function() {
            if (score >= upgradeCosts.energy) {
                score -= upgradeCosts.energy;
                energyEfficiency += 10;
                upgradeLevel.energy += 1;
                upgradeCosts.energy = Math.floor(upgradeCosts.energy * 1.5);
                
                // Отмечаем прогресс задания
                if (userData.daily_tasks && userData.daily_tasks.buy_upgrade) {
                    userData.daily_tasks.buy_upgrade.progress += 1;
                }
                
                // Снижаем стоимость следующих улучшений
                const discountFactor = 1 - (energyEfficiency / 100);
                upgradeCosts.clickUpgrade = Math.floor(upgradeCosts.clickUpgrade * discountFactor);
                upgradeCosts.autoClicker = Math.floor(upgradeCosts.autoClicker * discountFactor);
                upgradeCosts.cooling = Math.floor(upgradeCosts.cooling * discountFactor);
                upgradeCosts.signal = Math.floor(upgradeCosts.signal * discountFactor);
                
                updateDisplay();
                saveProgress();
            }
        });
    }
    
    // Усиление сигнала
    const signalBoostButton = document.getElementById('signalBoostButton');
    if (signalBoostButton) {
        signalBoostButton.addEventListener('click', function() {
            if (score >= upgradeCosts.signal) {
                score -= upgradeCosts.signal;
                signalBoostChance += 0.05;
                upgradeLevel.signal += 1;
                upgradeCosts.signal = Math.floor(upgradeCosts.signal * 1.5);
                
                // Отмечаем прогресс задания
                if (userData.daily_tasks && userData.daily_tasks.buy_upgrade) {
                    userData.daily_tasks.buy_upgrade.progress += 1;
                }
                
                updateDisplay();
                saveProgress();
            }
        });
    }
}

// Обновляем топ пользователей каждую минуту
setInterval(loadTopUsers, 60000);

// Совершенно новая функция для переключения между экранами
function switchScreen(screenId) {
    console.log(`Переключение на экран: ${screenId}`);
    
    // Получаем все экраны
    const screens = document.querySelectorAll('.screen');
    
    // Сначала делаем все экраны невидимыми
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    // Находим нужный экран
    const targetScreen = document.getElementById(screenId);
    
    // Проверяем существование целевого экрана
    if (!targetScreen) {
        console.error(`Экран с ID ${screenId} не найден!`);
        return;
    }
    
    // Устанавливаем display: flex перед добавлением класса active
    targetScreen.style.display = 'flex';
    
    // Добавляем класс active для активации всех CSS стилей
    targetScreen.classList.add('active');
    
    // Устанавливаем необходимые стили
    targetScreen.style.backgroundColor = 'var(--tg-theme-bg-color)';
    targetScreen.style.opacity = '1';
    targetScreen.style.visibility = 'visible';
    
    // Если это экран майнинга, применяем особые правила
    if (screenId === 'mainScreen') {
        // Запускаем восстановление разметки с небольшой задержкой
        setTimeout(restoreMainScreenLayout, 10);
    }
    
    // Обновляем атрибут body для стилизации хедера
    document.body.setAttribute('data-active-screen', screenId);
    
    // Обновляем активную кнопку в навигации
    updateActiveNavItem(screenId);
    
    // Обновляем данные на экране
    updateDisplay();
    
    console.log(`Экран ${screenId} активирован`);
}

// Улучшенная функция для восстановления правильного расположения блоков
function restoreMainScreenLayout() {
    setTimeout(() => {
        console.log('Исправление расположения блоков на экране майнинга');
        
        const mainScreen = document.getElementById('mainScreen');
        if (!mainScreen) return;
        
        const content = mainScreen.querySelector('.content');
        if (!content) return;
        
        // Удаляем все inline стили, которые могли повлиять на отображение
        const elementsToRestore = [
            '.balance-header',
            '.stats-container',
            '.stats-box',
            '.metrics-box',
            '.place-box',
            '.coin-container',
            '.coin',
            '.rank-container',
            '.rank-block'
        ];
        
        elementsToRestore.forEach(selector => {
            const elements = content.querySelectorAll(selector);
            elements.forEach(el => {
                el.removeAttribute('style');
            });
        });
        
        // Удаляем стили у content
        content.removeAttribute('style');
        
        // Исправляем расположение блока с "Место"
        const rankContainer = content.querySelector('.rank-container');
        if (rankContainer) {
            // Корректируем отступы для блока с рейтингом
            rankContainer.style.marginTop = 'auto'; // Прижимаем к нижней части
            rankContainer.style.marginBottom = '10px'; // Добавляем небольшой отступ снизу
        }
        
        // Исправляем расстояние между блоком баланса и блоком статистики
        const balanceHeader = content.querySelector('.balance-header');
        const statsContainer = content.querySelector('.stats-container');
        
        if (balanceHeader && statsContainer) {
            balanceHeader.style.marginBottom = '8px'; // Добавляем отступ внизу блока баланса
            statsContainer.style.marginTop = '0'; // Убираем отступ сверху у статистики
        }
        
        // Оптимизируем размер монеты и контейнера монеты
        const coinContainer = content.querySelector('.coin-container');
        if (coinContainer) {
            coinContainer.style.flex = '1';
            coinContainer.style.minHeight = '150px'; // Устанавливаем минимальную высоту
            coinContainer.style.display = 'flex';
            coinContainer.style.justifyContent = 'center';
            coinContainer.style.alignItems = 'center';
        }
        
        console.log('Расположение блоков восстановлено');
    }, 100);
}

// Обновляем функцию hideLoadingScreen, чтобы вызвать restoreMainScreenLayout
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContainer = document.getElementById('mainContainer');
    
    if (!loadingScreen || !mainContainer) return;
    
    // Предварительно показываем основной контейнер, но с нулевой непрозрачностью
    mainContainer.style.display = 'flex';
    mainContainer.style.opacity = '0';
    
    // Плавное затухание загрузочного экрана
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transform = 'scale(1.05)';
    
    // Плавное появление основного контейнера
    setTimeout(() => {
        mainContainer.style.opacity = '1';
        mainContainer.style.transform = 'none';
        mainContainer.classList.add('visible');
        
        // Полностью удаляем загрузочный экран после завершения анимации
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 700);
    }, 300);
}

// Добавляем обработчик для автоматического исправления вёрстки
document.addEventListener('DOMContentLoaded', function() {
    // Основной обработчик для кнопки майнинга
    const mainNavItem = document.querySelector('.nav-item[data-screen="mainScreen"]');
    if (mainNavItem) {
        // Заменяем существующий обработчик
        const mainNavItemClone = mainNavItem.cloneNode(true);
        mainNavItem.parentNode.replaceChild(mainNavItemClone, mainNavItem);
        
        // Добавляем новый обработчик
        mainNavItemClone.addEventListener('click', function() {
            switchScreen('mainScreen');
            // Восстанавливаем расположение блоков с задержкой
            setTimeout(restoreMainScreenLayout, 100);
        });
    }
    
    // Проверяем и исправляем разметку при загрузке страницы
    setTimeout(() => {
        // Если текущий активный экран - экран майнинга, исправляем разметку
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id === 'mainScreen') {
            restoreMainScreenLayout();
        }
    }, 500);
});

// Добавляем также обработчик для принудительного исправления при видимом экране майнинга
function fixMiningScreenLayout() {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id === 'mainScreen') {
        restoreMainScreenLayout();
    }
}

// Устанавливаем интервал для периодической проверки и исправления верстки экрана майнинга
// Это поможет поддерживать правильное отображение, даже если что-то пойдет не так
setInterval(fixMiningScreenLayout, 2000);

// Функция для форматирования чисел (разделение тысячных разрядов)
function formatNumber(num, abbreviated = false) {
    if (typeof num !== 'number') return '0';
    
    // Для сокращенного формата (например, "10.5K" вместо "10500")
    if (abbreviated && num >= 1000) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
    }
    
    // Для обычного формата с разделителями тысяч
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Функция для скрытия загрузочного экрана
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContainer = document.getElementById('mainContainer');
    
    if (!loadingScreen || !mainContainer) return;
    
    // Предварительно показываем основной контейнер, но с нулевой непрозрачностью
    mainContainer.style.display = 'flex';
    mainContainer.style.opacity = '0';
    
    // Плавное затухание загрузочного экрана
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transform = 'scale(1.05)';
    
    // Плавное появление основного контейнера
    setTimeout(() => {
        mainContainer.style.opacity = '1';
        mainContainer.style.transform = 'none';
        mainContainer.classList.add('visible');
        
        // Полностью удаляем загрузочный экран после завершения анимации
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 700);
    }, 300);
}

// Добавляем эффект при нажатии на монету
function setupCoinAnimation() {
    const coin = document.getElementById('coin');
    const coinContainer = document.querySelector('.coin-container');
    
    if (coin) {
        // Убираем стандартное выделение при фокусе
        coin.addEventListener('focus', function(e) {
            e.preventDefault();
            coin.blur();
        });
        
        // Предотвращаем стандартное выделение при клике на мобильных устройствах
        coin.addEventListener('touchstart', function(e) {
            e.preventDefault();
        });
        
        coin.addEventListener('click', function(e) {
            // Предотвращаем стандартное действие
            e.preventDefault();
            
            // Добавляем класс для анимации нажатия
            coin.classList.add('coin-click');
            
            // Добавляем класс для анимации свечения
            coinContainer.classList.add('mining');
            
            // Удаляем классы после завершения анимации
            setTimeout(() => {
                coinContainer.classList.remove('mining');
            }, 2000);
            
            // Удаляем класс анимации нажатия
            setTimeout(() => {
                coin.classList.remove('coin-click');
            }, 300);
        });
    }
}

// Функция обновления активного пункта в навигации
function updateActiveNavItem(screenId) {
    // Находим все элементы навигации
    const navItems = document.querySelectorAll('.nav-item');
    
    // Обновляем активный элемент в меню навигации
    navItems.forEach(item => {
        // Если элемент навигации ведет на выбранный экран, делаем его активным
        if (item.getAttribute('data-screen') === screenId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
} 

// Обновляем принудительное обновление стилей после загрузки
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем стили всех экранов для предотвращения черного экрана
    setTimeout(() => {
        // Принудительно обновляем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.backgroundColor = 'var(--tg-theme-bg-color)';
        });
        
        // Принудительно обновляем основной контейнер
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.style.backgroundColor = 'var(--tg-theme-bg-color)';
        }
        
        // Убедимся, что активный экран видим
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            activeScreen.style.display = 'flex';
            activeScreen.style.visibility = 'visible';
            activeScreen.style.opacity = '1';
        }
    }, 500);
});

// Функция для исправления загрузочного экрана
function fixLoadingScreenLayout() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    // Плавный переход от загрузочного экрана
    document.body.style.overflow = 'hidden';
    
    // Размер экрана
    const screenHeight = window.innerHeight;
    
    // Размер спиннера
    const spinner = loadingScreen.querySelector('.spinner');
    if (spinner) {
        const spinnerSize = Math.min(60, screenHeight * 0.08);
        spinner.style.width = `${spinnerSize}px`;
        spinner.style.height = `${spinnerSize}px`;
        spinner.style.marginBottom = `${screenHeight * 0.05}px`;
    }
    
    // Размер текста в зависимости от экрана
    const titleElement = loadingScreen.querySelector('h2');
    if (titleElement) {
        const fontSize = Math.min(26, screenHeight * 0.035);
        titleElement.style.fontSize = `${fontSize}px`;
    }
    
    // Прогресс-бар
    const progressBar = loadingScreen.querySelector('.loading-progress');
    if (progressBar) {
        progressBar.style.width = `${Math.min(300, window.innerWidth * 0.85)}px`;
    }
    
    // Центрирование всех элементов
    loadingScreen.style.paddingTop = '0px';
    loadingScreen.style.paddingBottom = '0px';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.textAlign = 'center';
} 

