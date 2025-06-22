const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteDatabase {
    constructor() {
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '../../data/bot.db');
            
            // Ensure data directory exists
            const fs = require('fs');
            const dataDir = path.dirname(dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('❌ Error connecting to SQLite:', err);
                    reject(err);
                } else {
                    console.log('✅ Connected to SQLite database');
                    this.isConnected = true;
                    this.initTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS guilds (
                guildId TEXT PRIMARY KEY,
                guildName TEXT NOT NULL,
                prefix TEXT DEFAULT '!',
                moderation_enabled INTEGER DEFAULT 1,
                log_channel TEXT,
                welcome_channel TEXT,
                auto_mod_enabled INTEGER DEFAULT 0,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT NOT NULL,
                userId TEXT NOT NULL,
                moderatorId TEXT NOT NULL,
                reason TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                active INTEGER DEFAULT 1,
                appealed INTEGER DEFAULT 0,
                appeal_reason TEXT,
                appeal_status TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT,
                userId TEXT,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS bot_status (
                botId TEXT PRIMARY KEY,
                status TEXT DEFAULT 'offline',
                guild_count INTEGER DEFAULT 0,
                user_count INTEGER DEFAULT 0,
                uptime INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else {
                    this.isConnected = false;
                    console.log('✅ Disconnected from SQLite');
                    resolve();
                }
            });
        });
    }

    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create singleton instance
const sqliteDB = new SQLiteDatabase();

module.exports = {
    connectDatabase: () => sqliteDB.connect(),
    disconnectDatabase: () => sqliteDB.close(),
    getConnectionStatus: () => sqliteDB.getConnectionStatus(),
    db: sqliteDB
}; 