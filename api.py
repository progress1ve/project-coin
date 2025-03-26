import json
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from database import db

# Инициализация FastAPI
app = FastAPI(title="Coin Clicker API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Для продакшена нужно указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class ClickRequest(BaseModel):
    user_id: int
    telegram_data: Optional[Dict[str, Any]] = None

class PurchaseRequest(BaseModel):
    user_id: int
    upgrade_id: int
    telegram_data: Optional[Dict[str, Any]] = None

class UserDataResponse(BaseModel):
    user_id: int
    username: Optional[str] = None
    points: int
    level: int
    points_per_click: int
    upgrades: List[Dict[str, Any]]

# Функция для проверки Telegram данных (в продакшене нужно реализовать полную проверку)
async def validate_telegram_data(request: Request):
    try:
        # В реальном проекте здесь должна быть проверка валидности данных от Telegram
        return True
    except Exception as e:
        logging.error(f"Ошибка валидации данных Telegram: {e}")
        raise HTTPException(status_code=403, detail="Невалидные данные Telegram")

# Роуты API
@app.get("/")
async def root():
    return {"message": "Добро пожаловать в API Coin Clicker!"}

@app.post("/click")
async def handle_click(data: ClickRequest, _: bool = Depends(validate_telegram_data)):
    """Обрабатывает клик по монете и возвращает обновленную информацию."""
    try:
        user = db.get_or_create_user(data.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Добавляем очки за клик
        new_points = db.update_user_points(data.user_id, user["points_per_click"])
        
        # Получаем обновленные данные пользователя
        updated_user = db.get_or_create_user(data.user_id)
        upgrades = db.get_available_upgrades(data.user_id)
        
        return UserDataResponse(
            user_id=updated_user["user_id"],
            username=updated_user["username"],
            points=updated_user["points"],
            level=updated_user["level"],
            points_per_click=updated_user["points_per_click"],
            upgrades=upgrades
        )
    except Exception as e:
        logging.error(f"Ошибка при обработке клика: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/purchase")
async def purchase_upgrade(data: PurchaseRequest, _: bool = Depends(validate_telegram_data)):
    """Обрабатывает покупку улучшения и возвращает обновленную информацию."""
    try:
        # Выполняем покупку улучшения
        result = db.purchase_upgrade(data.user_id, data.upgrade_id)
        
        if not result["success"]:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": result["message"]}
            )
        
        # Получаем обновленные данные пользователя
        updated_user = db.get_or_create_user(data.user_id)
        upgrades = db.get_available_upgrades(data.user_id)
        
        return {
            "success": True,
            "message": result["message"],
            "user_data": UserDataResponse(
                user_id=updated_user["user_id"],
                username=updated_user["username"],
                points=updated_user["points"],
                level=updated_user["level"],
                points_per_click=updated_user["points_per_click"],
                upgrades=upgrades
            )
        }
    except Exception as e:
        logging.error(f"Ошибка при покупке улучшения: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}")
async def get_user_data(user_id: int, _: bool = Depends(validate_telegram_data)):
    """Получает данные пользователя и доступные улучшения."""
    try:
        user = db.get_or_create_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        upgrades = db.get_available_upgrades(user_id)
        
        return UserDataResponse(
            user_id=user["user_id"],
            username=user["username"],
            points=user["points"],
            level=user["level"],
            points_per_click=user["points_per_click"],
            upgrades=upgrades
        )
    except Exception as e:
        logging.error(f"Ошибка при получении данных пользователя: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Запуск сервера
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 