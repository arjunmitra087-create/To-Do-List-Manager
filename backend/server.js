import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { UserModel, TodoModel, OtpRecordModel } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'todo_workshop_jwt_secret_key';
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY || '';

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// Auth Middleware
// -------------------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token.' });
    }
    req.user = decodedUser;
    next();
  });
}

// Helper: Format phone number for WhatsApp OTP delivery (defaults to +91 if no country code provided)
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = rawPhone.toString().trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

// -------------------------------------------------------------
// Endpoint 1: POST /api/auth/send-otp
// -------------------------------------------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    const formattedPhone = normalizePhoneNumber(phone);
    let minimothStatus = 'not_configured';

    if (MINIMOTH_API_KEY && !MINIMOTH_API_KEY.includes('your_')) {
      try {
        console.log(`[Minimoth WhatsApp] Dispatching OTP to ${formattedPhone}...`);
        const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': MINIMOTH_API_KEY
          },
          body: JSON.stringify({ phone: formattedPhone })
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          minimothStatus = 'sent_via_whatsapp';
          console.log(`[Minimoth WhatsApp] ✅ OTP successfully sent to ${formattedPhone}! OTP ID:`, data.otp_id);
        } else {
          console.warn('[Minimoth WhatsApp] ❌ Minimoth API response error:', response.status, data);
          return res.status(response.status).json({
            error: data.message || data.error || 'Failed to deliver OTP via WhatsApp. Check phone format.'
          });
        }
      } catch (apiErr) {
        console.warn('[Minimoth WhatsApp] ❌ Network error:', apiErr.message);
        return res.status(502).json({ error: 'Network error connecting to WhatsApp OTP service.' });
      }
    } else {
      // Local dev mode fallback when no key is set
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      OtpRecordModel.create({ phone: formattedPhone, otpCode, expiresAt });
      console.log(`[DEV MODE] OTP for ${formattedPhone}: ${otpCode}`);
      minimothStatus = 'dev_mode';
    }

    return res.status(200).json({
      message: 'OTP sent successfully to your WhatsApp number.',
      phone: formattedPhone,
      status: minimothStatus
    });
  } catch (err) {
    console.error('Error in /api/auth/send-otp:', err);
    return res.status(500).json({ error: 'Failed to send OTP. Try again.' });
  }
});

// -------------------------------------------------------------
// Endpoint 2: POST /api/auth/verify-otp
// -------------------------------------------------------------
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required.' });
    }

    const formattedPhone = normalizePhoneNumber(phone);
    const cleanOtp = String(otp).trim();
    let isVerified = false;

    if (MINIMOTH_API_KEY && !MINIMOTH_API_KEY.includes('your_')) {
      try {
        console.log(`[Minimoth WhatsApp] Verifying OTP code for ${formattedPhone}...`);
        const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': MINIMOTH_API_KEY
          },
          body: JSON.stringify({
            phone: formattedPhone,
            code: cleanOtp
          })
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          isVerified = true;
          console.log(`[Minimoth WhatsApp] ✅ OTP successfully verified for ${formattedPhone}!`);
        } else {
          console.warn('[Minimoth WhatsApp] ❌ Verification failed:', response.status, data);
          return res.status(400).json({ error: data.message || data.error || 'Invalid or expired OTP code.' });
        }
      } catch (apiErr) {
        console.warn('[Minimoth WhatsApp] Network error during verify:', apiErr.message);
        return res.status(502).json({ error: 'Network error connecting to OTP verification service.' });
      }
    } else {
      const validRecord = OtpRecordModel.findValidOtp(formattedPhone, cleanOtp);
      if (validRecord) {
        OtpRecordModel.markVerified(validRecord.id);
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    // Find or create User
    let user = UserModel.findByPhone(formattedPhone);
    if (!user) {
      user = UserModel.create({
        phone: formattedPhone,
        name: name?.trim() || `User ${formattedPhone.slice(-4)}`
      });
    } else if (name && name.trim()) {
      user.name = name.trim();
    }

    // Issue JWT Token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Authentication successful.',
      token,
      user
    });
  } catch (err) {
    console.error('Error in /api/auth/verify-otp:', err);
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

// -------------------------------------------------------------
// Endpoint 3: GET /api/todos
// -------------------------------------------------------------
app.get('/api/todos', authenticateToken, (req, res) => {
  try {
    const todos = TodoModel.findByUserId(req.user.id);
    return res.status(200).json({ todos });
  } catch (err) {
    console.error('Error in GET /api/todos:', err);
    return res.status(500).json({ error: 'Failed to retrieve todos.' });
  }
});

// -------------------------------------------------------------
// Endpoint 4: POST /api/todos
// -------------------------------------------------------------
app.post('/api/todos', authenticateToken, (req, res) => {
  try {
    const { text, priority } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Todo text cannot be empty.' });
    }

    const newTodo = TodoModel.create({
      userId: req.user.id,
      text: text.trim(),
      priority: priority || 'normal'
    });

    return res.status(201).json({ todo: newTodo });
  } catch (err) {
    console.error('Error in POST /api/todos:', err);
    return res.status(500).json({ error: 'Failed to create todo.' });
  }
});

// -------------------------------------------------------------
// Endpoint 5: PATCH /api/todos/:id (Handles toggle, update, delete)
// -------------------------------------------------------------
app.patch('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { completed, text, priority, _delete } = req.body;

    if (_delete === true) {
      const deleted = TodoModel.delete(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Todo not found.' });
      }
      return res.status(200).json({ message: 'Todo deleted successfully.', id });
    }

    const updates = {};
    if (typeof completed === 'boolean') updates.completed = completed;
    if (typeof text === 'string' && text.trim()) updates.text = text.trim();
    if (['low', 'normal', 'high'].includes(priority)) updates.priority = priority;

    const updatedTodo = TodoModel.update(id, req.user.id, updates);
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found or unauthorized.' });
    }

    return res.status(200).json({ todo: updatedTodo });
  } catch (err) {
    console.error('Error in PATCH /api/todos/:id:', err);
    return res.status(500).json({ error: 'Failed to update todo.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 To-Do Manager Backend running on http://localhost:${PORT}`);
  console.log(`🔑 Minimoth API Key: ${MINIMOTH_API_KEY ? 'Configured' : 'Missing (Development Mode)'}`);
});
