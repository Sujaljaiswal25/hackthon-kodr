const express = require('express');
const { z } = require('zod');
const Classroom = require('../models/Classroom');
const Institute = require('../models/Institute');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

const createSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  instituteId: z.string().min(1),
});

// POST /api/classrooms - Create classroom (instructor only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can create classrooms' });
    }

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Verify instructor owns the institute
    const institute = await Institute.findById(parsed.data.instituteId);
    if (!institute || institute.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized for this institute' });
    }

    const classroom = new Classroom({
      name: parsed.data.name,
      institute: institute._id,
      instructor: req.user.userId,
    });
    await classroom.save();

    res.status(201).json({ message: 'Classroom created', classroom });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/join - Join classroom (student)
router.post('/:id/join', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify student is a member of the institute
    const institute = await Institute.findById(classroom.institute);
    if (!institute.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Join the institute first' });
    }

    if (classroom.students.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already in this classroom' });
    }

    classroom.students.push(req.user.userId);
    await classroom.save();

    res.json({ message: 'Joined classroom', classroom });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/institute/:instituteId - List classrooms for institute
router.get('/institute/:instituteId', async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      institute: req.params.instituteId,
    }).populate('instructor', 'name');

    res.json({ classrooms });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id - Get classroom details
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('instructor', 'name')
      .populate('students', 'name email')
      .populate('activeSession');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    res.json({ classroom });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
