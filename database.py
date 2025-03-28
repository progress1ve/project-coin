import sqlite3
import logging
from config import DB_NAME

class Database:
    def __init__(self, db_name=DB_NAME):
        self.db_name = db_name
        self.connection = None
        self.cursor = None
        self._init_db()
    
    def _init_db(self):
        """Инициализация базы данных и создание таблиц если их нет."""
        try:
            self.connection = sqlite3.connect(self.db_name)
            self.cursor = self.connection.cursor()
            
            # Создаем таблицу пользователей
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                points INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                points_per_click INTEGER DEFAULT 1,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Создаем таблицу улучшений
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS upgrades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                cost INTEGER NOT NULL,
                points_boost INTEGER NOT NULL,
                required_level INTEGER DEFAULT 1
            )
            ''')
            
            # Создаем таблицу для связи пользователей и их улучшений
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_upgrades (
                user_id INTEGER,
                upgrade_id INTEGER,
                quantity INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (user_id),
                FOREIGN KEY (upgrade_id) REFERENCES upgrades (id),
                PRIMARY KEY (user_id, upgrade_id)
            )
            ''')
            
            # Добавляем базовые улучшения, если их еще нет
            self._add_default_upgrades()
            
            self.connection.commit()
            logging.info("База данных инициализирована успешно")
            
        except sqlite3.Error as e:
            logging.error(f"Ошибка при инициализации базы данных: {e}")
            if self.connection:
                self.connection.rollback()
    
    def _add_default_upgrades(self):
        """Добавление базовых улучшений в базу данных."""
        default_upgrades = [
            ("Кликер новичка", "Увеличивает количество очков за клик на 1", 50, 1, 1),
            ("Кликер любителя", "Увеличивает количество очков за клик на 3", 200, 3, 2),
            ("Кликер профессионала", "Увеличивает количество очков за клик на 5", 500, 5, 3),
            ("Кликер мастера", "Увеличивает количество очков за клик на 10", 1000, 10, 5),
            ("Кликер легенды", "Увеличивает количество очков за клик на 25", 2500, 25, 8),
        ]
        
        try:
            # Проверка наличия улучшений в базе
            self.cursor.execute("SELECT COUNT(*) FROM upgrades")
            count = self.cursor.fetchone()[0]
            
            if count == 0:
                self.cursor.executemany(
                    "INSERT INTO upgrades (name, description, cost, points_boost, required_level) VALUES (?, ?, ?, ?, ?)",
                    default_upgrades
                )
                self.connection.commit()
                logging.info("Добавлены базовые улучшения")
        except sqlite3.Error as e:
            logging.error(f"Ошибка при добавлении базовых улучшений: {e}")
    
    def close(self):
        """Закрытие соединения с базой данных."""
        if self.connection:
            self.connection.close()
            logging.info("Соединение с базой данных закрыто")
    
    def get_or_create_user(self, user_id, username=None):
        """Получение пользователя или создание нового."""
        try:
            self.cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            user = self.cursor.fetchone()
            
            if not user:
                self.cursor.execute(
                    "INSERT INTO users (user_id, username) VALUES (?, ?)",
                    (user_id, username)
                )
                self.connection.commit()
                logging.info(f"Создан новый пользователь с ID {user_id}")
                return self.get_or_create_user(user_id, username)
            
            return {
                "user_id": user[0],
                "username": user[1],
                "points": user[2],
                "level": user[3],
                "points_per_click": user[4],
                "last_activity": user[5]
            }
        except sqlite3.Error as e:
            logging.error(f"Ошибка при получении/создании пользователя: {e}")
            return None
    
    def update_user_points(self, user_id, points_to_add):
        """Обновление количества очков пользователя."""
        try:
            user = self.get_or_create_user(user_id)
            new_points = user["points"] + points_to_add
            
            self.cursor.execute(
                "UPDATE users SET points = ?, last_activity = CURRENT_TIMESTAMP WHERE user_id = ?",
                (new_points, user_id)
            )
            self.connection.commit()
            
            # Проверка на повышение уровня
            self._check_level_up(user_id, new_points)
            
            return new_points
        except sqlite3.Error as e:
            logging.error(f"Ошибка при обновлении очков пользователя: {e}")
            return None
    
    def _check_level_up(self, user_id, points):
        """Проверка и повышение уровня пользователя на основе очков."""
        try:
            # Простая формула: каждые 1000 очков = новый уровень
            new_level = max(1, points // 1000 + 1)
            
            self.cursor.execute("SELECT level FROM users WHERE user_id = ?", (user_id,))
            current_level = self.cursor.fetchone()[0]
            
            if new_level > current_level:
                self.cursor.execute(
                    "UPDATE users SET level = ? WHERE user_id = ?", 
                    (new_level, user_id)
                )
                self.connection.commit()
                logging.info(f"Пользователь {user_id} повысил уровень до {new_level}")
                return True
            
            return False
        except sqlite3.Error as e:
            logging.error(f"Ошибка при проверке повышения уровня: {e}")
            return False
    
    def get_available_upgrades(self, user_id):
        """Получение доступных улучшений для пользователя."""
        try:
            user = self.get_or_create_user(user_id)
            
            self.cursor.execute("""
                SELECT u.*, COALESCE(uu.quantity, 0) as owned
                FROM upgrades u
                LEFT JOIN user_upgrades uu ON u.id = uu.upgrade_id AND uu.user_id = ?
                WHERE u.required_level <= ?
                ORDER BY u.cost ASC
            """, (user_id, user["level"]))
            
            upgrades = []
            for row in self.cursor.fetchall():
                upgrades.append({
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "cost": row[3],
                    "points_boost": row[4],
                    "required_level": row[5],
                    "owned": row[6]
                })
            
            return upgrades
        except sqlite3.Error as e:
            logging.error(f"Ошибка при получении доступных улучшений: {e}")
            return []
    
    def purchase_upgrade(self, user_id, upgrade_id):
        """Покупка улучшения пользователем."""
        try:
            # Начинаем транзакцию
            self.connection.execute("BEGIN TRANSACTION")
            
            # Получаем данные пользователя
            user = self.get_or_create_user(user_id)
            
            # Получаем данные улучшения
            self.cursor.execute("SELECT * FROM upgrades WHERE id = ?", (upgrade_id,))
            upgrade = self.cursor.fetchone()
            
            if not upgrade:
                self.connection.rollback()
                return {"success": False, "message": "Улучшение не найдено"}
            
            if user["level"] < upgrade[5]:  # required_level
                self.connection.rollback()
                return {"success": False, "message": "Недостаточный уровень для покупки"}
            
            if user["points"] < upgrade[3]:  # cost
                self.connection.rollback()
                return {"success": False, "message": "Недостаточно очков для покупки"}
            
            # Проверяем, есть ли у пользователя это улучшение
            self.cursor.execute(
                "SELECT quantity FROM user_upgrades WHERE user_id = ? AND upgrade_id = ?",
                (user_id, upgrade_id)
            )
            result = self.cursor.fetchone()
            
            if result:
                # Увеличиваем количество улучшений
                new_quantity = result[0] + 1
                self.cursor.execute(
                    "UPDATE user_upgrades SET quantity = ? WHERE user_id = ? AND upgrade_id = ?",
                    (new_quantity, user_id, upgrade_id)
                )
            else:
                # Добавляем запись о покупке улучшения
                self.cursor.execute(
                    "INSERT INTO user_upgrades (user_id, upgrade_id, quantity) VALUES (?, ?, 1)",
                    (user_id, upgrade_id)
                )
            
            # Вычитаем стоимость улучшения из очков пользователя
            new_points = user["points"] - upgrade[3]
            self.cursor.execute(
                "UPDATE users SET points = ? WHERE user_id = ?",
                (new_points, user_id)
            )
            
            # Увеличиваем очки за клик
            new_points_per_click = user["points_per_click"] + upgrade[4]  # points_boost
            self.cursor.execute(
                "UPDATE users SET points_per_click = ? WHERE user_id = ?",
                (new_points_per_click, user_id)
            )
            
            # Завершаем транзакцию
            self.connection.commit()
            
            return {
                "success": True,
                "message": f"Улучшение '{upgrade[1]}' успешно приобретено",
                "new_points": new_points,
                "new_points_per_click": new_points_per_click
            }
        except sqlite3.Error as e:
            logging.error(f"Ошибка при покупке улучшения: {e}")
            if self.connection:
                self.connection.rollback()
            return {"success": False, "message": str(e)}

    def get_top_users(self, limit=10):
        """Получение списка пользователей с наибольшим количеством SLC."""
        try:
            self.cursor.execute("""
                SELECT user_id, username, points, level, points_per_click
                FROM users
                ORDER BY points DESC
                LIMIT ?
            """, (limit,))
            
            top_users = []
            for row in self.cursor.fetchall():
                top_users.append({
                    "user_id": row[0],
                    "username": row[1] or f"User{row[0]}",
                    "points": row[2],
                    "level": row[3],
                    "points_per_click": row[4]
                })
            
            return top_users
        except sqlite3.Error as e:
            logging.error(f"Ошибка при получении топа пользователей: {e}")
            return []

# Создание глобального экземпляра базы данных
db = Database() 