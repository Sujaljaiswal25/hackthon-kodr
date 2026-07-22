const express = require('express');
const { z } = require('zod');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Input validation schemas
const signupSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(254).trim().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(['instructor', 'student']),
});

const loginSchema = z.object({
  email: z.string().email().max(254).trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.issues.map((i) => i.message),
      });
    }

    const { name, email, password, role } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    const token = generateToken({
      userId: user._id,
      role: user.role,
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user._id,
      role: user.role,
    });

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
const { auth } = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
