const express = require('express');
const { z } = require('zod');
const Institute = require('../models/Institute');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

const createSchema = z.object({
  name: z.string().min(1).max(200).trim(),
});

const joinSchema = z.object({
  instituteId: z.string().min(1).max(20).trim(),
});

// POST /api/institutes - Create institute (instructor only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can create institutes' });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid institute name' });
    }

    const institute = new Institute({
      name: parsed.data.name,
      owner: req.user.userId,
      members: [req.user.userId],
    });
    await institute.save();

    // Add institute to user
    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { institutes: institute._id },
    });

    res.status(201).json({
      message: 'Institute created',
      institute,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/institutes/join - Join institute (student)
router.post('/join', async (req, res) => {
  try {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid institute ID' });
    }

    const institute = await Institute.findOne({
      instituteId: parsed.data.instituteId.toUpperCase(),
    });
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Check if already a member
    if (institute.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    institute.members.push(req.user.userId);
    await institute.save();

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { institutes: institute._id },
    });

    res.json({ message: 'Joined institute successfully', institute });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/institutes - List user's institutes
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('institutes');
    res.json({ institutes: user.institutes || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/institutes/:id - Get institute details
router.get('/:id', async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id).populate(
      'members',
      'name email role'
    );
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Verify user is a member
    if (!institute.members.some((m) => m._id.toString() === req.user.userId)) {
      return res.status(403).json({ message: 'Not a member of this institute' });
    }

    res.json({ institute });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
