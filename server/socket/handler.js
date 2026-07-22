const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const Session = require('../models/Session');
const Poll = require('../models/Poll');
const Response = require('../models/Response');

// Predefined question templates
const QUESTION_TEMPLATES = {
  understanding: [
    { question: 'Did everyone understand the concept?', responseType: 'yesno' },
    { question: 'Are you able to follow?', responseType: 'yesno' },
    { question: 'Was this topic difficult?', responseType: 'yesno' },
  ],
  revision: [
    { question: 'Should I explain this topic again?', responseType: 'yesno' },
    { question: 'Need another example?', responseType: 'yesno' },
    { question: 'Would you like a quick revision?', responseType: 'yesno' },
  ],
  pace: [
    { question: 'Is the pace comfortable?', responseType: 'yesno' },
    { question: 'Ready for the next topic?', responseType: 'yesno' },
    { question: 'Is the pace too fast?', responseType: 'yesno' },
  ],
  doubt: [
    { question: 'Are you facing any doubts?', responseType: 'yesno' },
    { question: 'Need mentor support?', responseType: 'yesno' },
    { question: 'Want more practice questions?', responseType: 'yesno' },
  ],
  feedback: [
    { question: "Was today's session useful?", responseType: 'yesno' },
    { question: 'Rate your understanding.', responseType: 'rating' },
  ],
};

function setupSocket(io) {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      });
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a session room
    socket.on('join-session', async ({ sessionId }) => {
      try {
        if (!sessionId) return;
        const session = await Session.findById(sessionId);
        if (!session || !session.isActive) return;

        socket.join(`session:${sessionId}`);

        // Add student as participant
        if (socket.user.role === 'student') {
          if (!session.participants.includes(socket.user.userId)) {
            session.participants.push(socket.user.userId);
            await session.save();
          }

          // Notify instructor of updated participant count
          io.to(`session:${sessionId}`).emit('participant-update', {
            count: session.participants.length,
          });
        }

        // Send current active poll if any
        const activePoll = await Poll.findOne({
          session: sessionId,
          isActive: true,
        });
        if (activePoll) {
          socket.emit('pulse-launched', {
            pollId: activePoll._id,
            question: activePoll.question,
            category: activePoll.category,
            responseType: activePoll.responseType,
            timer: activePoll.timer,
            launchedAt: activePoll.launchedAt,
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Launch a pulse question (instructor only)
    socket.on('launch-pulse', async ({ sessionId, question, category, responseType, timer }) => {
      try {
        if (socket.user.role !== 'instructor') return;
        if (!sessionId || !question || !category || !responseType) return;

        // Validate timer
        const validTimers = [3, 5, 10];
        const pollTimer = validTimers.includes(timer) ? timer : 5;

        // Close any existing active poll
        await Poll.updateMany(
          { session: sessionId, isActive: true },
          { isActive: false, closedAt: new Date() }
        );

        // Create new poll
        const poll = new Poll({
          session: sessionId,
          question,
          category,
          responseType,
          timer: pollTimer,
        });
        await poll.save();

        // Broadcast to all students in the session
        io.to(`session:${sessionId}`).emit('pulse-launched', {
          pollId: poll._id,
          question: poll.question,
          category: poll.category,
          responseType: poll.responseType,
          timer: poll.timer,
          launchedAt: poll.launchedAt,
        });

        // Auto-close poll after timer expires
        setTimeout(async () => {
          try {
            const p = await Poll.findById(poll._id);
            if (p && p.isActive) {
              p.isActive = false;
              p.closedAt = new Date();
              await p.save();

              // Send final analytics
              const responses = await Response.find({ poll: poll._id });
              const session = await Session.findById(sessionId);
              const analytics = computeAnalytics(responses, session, poll);

              io.to(`session:${sessionId}`).emit('pulse-closed', {
                pollId: poll._id,
                analytics,
              });
            }
          } catch (err) {
            // Timer cleanup error - non-critical
          }
        }, pollTimer * 1000);
      } catch (err) {
        socket.emit('error', { message: 'Failed to launch pulse' });
      }
    });

    // Submit response (student only)
    socket.on('submit-response', async ({ pollId, answer }) => {
      try {
        if (socket.user.role !== 'student') return;
        if (!pollId || !answer) return;

        const poll = await Poll.findById(pollId);
        if (!poll || !poll.isActive) {
          socket.emit('response-error', { message: 'Poll is no longer active' });
          return;
        }

        // Validate answer
        const validAnswers =
          poll.responseType === 'yesno'
            ? ['yes', 'no']
            : ['1', '2', '3', '4', '5'];
        if (!validAnswers.includes(answer)) {
          socket.emit('response-error', { message: 'Invalid answer' });
          return;
        }

        // Create or update response (upsert)
        await Response.findOneAndUpdate(
          { poll: pollId, student: socket.user.userId },
          { $set: { answer } },
          { upsert: true, new: true }
        );

        socket.emit('response-submitted', { pollId });

        // Send live analytics update
        const responses = await Response.find({ poll: pollId });
        const session = await Session.findById(poll.session);
        const analytics = computeAnalytics(responses, session, poll);

        io.to(`session:${poll.session}`).emit('analytics-update', {
          pollId,
          analytics,
        });
      } catch (err) {
        if (err.code === 11000) {
          socket.emit('response-error', { message: 'Already responded' });
        } else {
          socket.emit('error', { message: 'Failed to submit response' });
        }
      }
    });

    // Get question templates
    socket.on('get-templates', () => {
      socket.emit('templates', QUESTION_TEMPLATES);
    });

    // End session (instructor only)
    socket.on('end-session', async ({ sessionId }) => {
      try {
        if (socket.user.role !== 'instructor') return;

        io.to(`session:${sessionId}`).emit('session-ended');
      } catch (err) {
        socket.emit('error', { message: 'Failed to end session' });
      }
    });

    socket.on('disconnect', () => {
      // Cleanup handled by Socket.io room management
    });
  });
}

function computeAnalytics(responses, session, poll) {
  const totalStudents = session ? session.participants.length : 0;
  const totalResponses = responses.length;
  const participation =
    totalStudents > 0 ? Math.round((totalResponses / totalStudents) * 100) : 0;

  let distribution = {};
  if (poll.responseType === 'yesno') {
    const yesCount = responses.filter((r) => r.answer === 'yes').length;
    const noCount = responses.filter((r) => r.answer === 'no').length;
    distribution = {
      yes:
        totalResponses > 0
          ? Math.round((yesCount / totalResponses) * 100)
          : 0,
      no:
        totalResponses > 0
          ? Math.round((noCount / totalResponses) * 100)
          : 0,
      yesCount,
      noCount,
    };
  } else {
    for (let i = 1; i <= 5; i++) {
      const count = responses.filter((r) => r.answer === String(i)).length;
      distribution[i] = {
        count,
        percentage:
          totalResponses > 0
            ? Math.round((count / totalResponses) * 100)
            : 0,
      };
    }
  }

  return { totalStudents, totalResponses, participation, distribution };
}

module.exports = { setupSocket, QUESTION_TEMPLATES };
