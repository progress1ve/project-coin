import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.client.default import DefaultBotProperties
from config import BOT_TOKEN, WEBAPP_URL

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Инициализация бота и диспетчера
bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

# Обработчик команды /start
@dp.message(CommandStart())
async def command_start_handler(message: types.Message) -> None:
    """Обработчик команды /start с кнопкой для мини-приложения."""
    
    # Создаем клавиатуру с кнопкой для запуска мини-приложения
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🪙 Играть в кликер", 
                    web_app=types.WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )
    
    await message.answer(
        f"Привет, {message.from_user.full_name}! 👋\n\n"
        f"Нажми на кнопку ниже, чтобы открыть мини-приложение и начать кликать монетку.",
        reply_markup=keyboard
    )

# Обработчик данных от веб-приложения
@dp.message()
async def process_webapp_data(message: types.Message):
    """Обработчик данных, полученных от веб-приложения."""
    if message.web_app_data:
        try:
            # Получение данных из веб-приложения
            data = message.web_app_data.data
            await message.answer(f"Получены данные: {data}")
        except Exception as e:
            await message.answer(f"Ошибка обработки данных: {e}")

# Запуск бота
async def main() -> None:
    """Функция запуска бота."""
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
