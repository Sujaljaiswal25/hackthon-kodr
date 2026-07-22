require('dotenv').config({ path: '../.env' });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { setupSocket } = require('./socket/handler');

// Route imports
const authRoutes = require('./routes/auth');
const instituteRoutes = require('./routes/institute');
const classroomRoutes = require('./routes/classroom');
const sessionRoutes = require('./routes/session');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", CLIENT_URL],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup socket handlers
setupSocket(io);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`PulseClass server running on http://127.0.0.1:${PORT}`);
  });
});
