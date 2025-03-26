import os
from dotenv import load_dotenv

# Загрузка переменных окружения из .env файла
load_dotenv()

# Токен бота Telegram
BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN")

# URL веб-приложения
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:3000")

# Настройка базы данных
DB_NAME = os.getenv("DB_NAME", "coin_clicker.db") 