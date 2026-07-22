const express = require('express');
const Session = require('../models/Session');
const Classroom = require('../models/Classroom');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// POST /api/sessions/start - Start a live session
router.post('/start', async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can start sessions' });
    }

    const { classroomId } = req.body;
    if (!classroomId) {
      return res.status(400).json({ message: 'Classroom ID required' });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom || classroom.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // End any existing active session
    if (classroom.activeSession) {
      await Session.findByIdAndUpdate(classroom.activeSession, {
        isActive: false,
        endedAt: new Date(),
      });
    }

    const session = new Session({
      classroom: classroomId,
      instructor: req.user.userId,
    });
    await session.save();

    classroom.activeSession = session._id;
    await classroom.save();

    res.status(201).json({ message: 'Session started', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/sessions/:id/end - End a session
router.post('/:id/end', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || session.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    // Close any active polls
    await Poll.updateMany(
      { session: session._id, isActive: true },
      { isActive: false, closedAt: new Date() }
    );

    // Clear active session from classroom
    await Classroom.findByIdAndUpdate(session.classroom, {
      activeSession: null,
    });

    res.json({ message: 'Session ended', session });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sessions/:id - Get session details with polls
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('participants', 'name');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const polls = await Poll.find({ session: session._id }).sort({ launchedAt: -1 });

    res.json({ session, polls });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sessions/:id/report - Get detailed session report (instructor only)
router.get('/:id/report', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('participants', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only the instructor can view the detailed report' });
    }

    const polls = await Poll.find({ session: session._id }).sort({ launchedAt: -1 }).lean();
    
    // Attach responses to each poll
    for (let poll of polls) {
      const responses = await Response.find({ poll: poll._id })
        .populate('student', 'name email')
        .lean();
      poll.responses = responses;
    }

    res.json({ session, polls });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/sessions/:id/analytics/:pollId - Get poll analytics
router.get('/:id/analytics/:pollId', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const responses = await Response.find({ poll: poll._id });
    const session = await Session.findById(req.params.id);

    const totalStudents = session.participants.length;
    const totalResponses = responses.length;
    const participation = totalStudents > 0
      ? Math.round((totalResponses / totalStudents) * 100)
      : 0;

    let distribution = {};
    if (poll.responseType === 'yesno') {
      const yesCount = responses.filter((r) => r.answer === 'yes').length;
      const noCount = responses.filter((r) => r.answer === 'no').length;
      distribution = {
        yes: totalResponses > 0 ? Math.round((yesCount / totalResponses) * 100) : 0,
        no: totalResponses > 0 ? Math.round((noCount / totalResponses) * 100) : 0,
        yesCount,
        noCount,
      };
    } else {
      // Rating distribution
      for (let i = 1; i <= 5; i++) {
        const count = responses.filter((r) => r.answer === String(i)).length;
        distribution[i] = { count, percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0 };
      }
    }

    res.json({
      totalStudents,
      totalResponses,
      participation,
      distribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
