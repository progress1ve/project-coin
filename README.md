# Монетный Кликер - Telegram Mini App

Игра-кликер в виде мини-приложения Telegram, где пользователи кликают по монете, зарабатывают очки и приобретают улучшения.

## Демо-версия

Мини-приложение доступно по адресу: [https://progress1ve.github.io/project-coin/](https://progress1ve.github.io/project-coin/)

## Функциональность

- 🪙 Кликер монеты для заработка очков
- 💎 Система улучшений с различными бонусами
- 📊 Система уровней и прогресса
- 🔄 Сохранение прогресса в базе данных
- 🎮 Простой и интуитивно понятный интерфейс

## Технический стек

- **Backend**: Python (aiogram, FastAPI)
- **Frontend**: HTML/CSS/JavaScript
- **База данных**: SQLite
- **Интеграция**: Telegram Bot API, Telegram Mini Apps

## Установка и запуск

1. Клонируйте репозиторий:

   ```
   git clone https://github.com/progress1ve/project-coin.git
   cd project-coin
   ```

2. Установите зависимости:

   ```
   pip install -r requirements.txt
   ```

3. Создайте файл `.env` в корневой директории проекта:

   ```
   BOT_TOKEN=ваш_токен_бота_здесь
   WEBAPP_URL=https://progress1ve.github.io/project-coin/
   ```

4. Запустите сервер API:

   ```
   python -m uvicorn api:app --host 0.0.0.0 --port 8000
   ```

5. Запустите телеграм-бота:
   ```
   python main.py
   ```

## Структура проекта

- `main.py` - Основной файл телеграм-бота
- `api.py` - API сервер для взаимодействия с веб-приложением
- `database.py` - Работа с базой данных SQLite
- `config.py` - Конфигурация проекта
- `webapp/` - Директория с файлами мини-приложения
  - `index.html` - HTML-структура веб-приложения
  - `styles.css` - Стили веб-приложения
  - `app.js` - JavaScript-логика веб-приложения

## Размещение на GitHub Pages

Мини-приложение размещено на GitHub Pages с использованием ветки `gh-pages`.
URL мини-приложения: https://progress1ve.github.io/project-coin/

## Лицензия

MIT
