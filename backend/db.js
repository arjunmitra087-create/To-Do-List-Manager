import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize local database file if not present
const initialData = {
  users: [],
  todos: [],
  otpRecords: []
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// -------------------------------------------------------------
// Entity 1: User Model
// -------------------------------------------------------------
export const UserModel = {
  findByPhone: (phone) => {
    const db = readDb();
    return db.users.find((u) => u.phone === phone) || null;
  },
  findById: (id) => {
    const db = readDb();
    return db.users.find((u) => u.id === id) || null;
  },
  create: ({ phone, name }) => {
    const db = readDb();
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      phone,
      name: name || 'Workshop User',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  }
};

// -------------------------------------------------------------
// Entity 2: Todo Model
// -------------------------------------------------------------
export const TodoModel = {
  findByUserId: (userId) => {
    const db = readDb();
    return db.todos
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  create: ({ userId, text, priority = 'normal' }) => {
    const db = readDb();
    const newTodo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      text: text.trim(),
      priority: ['low', 'normal', 'high'].includes(priority) ? priority : 'normal',
      completed: false,
      createdAt: new Date().toISOString()
    };
    db.todos.push(newTodo);
    writeDb(db);
    return newTodo;
  },
  update: (id, userId, updates) => {
    const db = readDb();
    const index = db.todos.findIndex((t) => t.id === id && t.userId === userId);
    if (index === -1) return null;

    db.todos[index] = {
      ...db.todos[index],
      ...updates
    };
    writeDb(db);
    return db.todos[index];
  },
  delete: (id, userId) => {
    const db = readDb();
    const index = db.todos.findIndex((t) => t.id === id && t.userId === userId);
    if (index === -1) return false;

    db.todos.splice(index, 1);
    writeDb(db);
    return true;
  }
};

// -------------------------------------------------------------
// Entity 3: OtpRecord Model
// -------------------------------------------------------------
export const OtpRecordModel = {
  create: ({ phone, otpCode, expiresAt }) => {
    const db = readDb();
    const record = {
      id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      phone,
      otpCode: String(otpCode),
      expiresAt: expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      verified: false,
      createdAt: new Date().toISOString()
    };
    db.otpRecords.push(record);
    writeDb(db);
    return record;
  },
  findValidOtp: (phone, otpCode) => {
    const db = readDb();
    const now = new Date();
    return db.otpRecords.find(
      (r) =>
        r.phone === phone &&
        r.otpCode === String(otpCode) &&
        !r.verified &&
        new Date(r.expiresAt) > now
    ) || null;
  },
  markVerified: (id) => {
    const db = readDb();
    const record = db.otpRecords.find((r) => r.id === id);
    if (record) {
      record.verified = true;
      writeDb(db);
    }
  }
};
