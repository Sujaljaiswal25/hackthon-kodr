# PulseClass MVP - Project Context

This document provides a complete snapshot of the PulseClass MVP project state. It is designed to allow a new AI coding assistant or developer to seamlessly continue development without needing previous conversation history.

---

## 1. Project Overview & Architecture
PulseClass is a real-time classroom engagement platform designed for offline and hybrid classrooms. It allows instructors to launch one-click "pulse checks" (polls) and receive live student responses within seconds. 

The primary goal is speed, simplicity, and uninterrupted classroom interaction. There is **no typing required** during a live session.

**Tech Stack (MERN + WebSockets):**
*   **Frontend:** React.js (Vite), Tailwind CSS, React Router, Socket.io-client.
*   **Backend:** Node.js, Express.js, Socket.io.
*   **Database:** MongoDB via Mongoose ODM.
*   **Authentication:** JWT (JSON Web Tokens) with `bcrypt` for password hashing.
*   **Security:** `helmet`, `cors`, `express-rate-limit`, and `zod` for input validation.

---

## 2. Folder Structure
```text
hackthon/
├── .env                        # Core environment variables
├── PROJECT_CONTEXT.md          # This file
├── server/                     # Backend Node.js/Express Application
│   ├── package.json
│   ├── index.js                # Server entry point (Express & Socket setup)
│   ├── config/
│   │   └── db.js               # MongoDB connection logic
│   ├── middleware/
│   │   ├── auth.js             # JWT verification middleware
│   │   └── rateLimiter.js      # API and Auth rate limiting
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Institute.js
│   │   ├── Classroom.js
│   │   ├── Session.js
│   │   ├── Poll.js
│   │   └── Response.js
│   ├── routes/                 # Express REST API routes
│   │   ├── auth.js
│   │   ├── institute.js
│   │   ├── classroom.js
│   │   └── session.js
│   └── socket/
│       └── handler.js          # Socket.io event logic & predefined templates
└── client/                     # Frontend Vite/React Application
    ├── package.json
    ├── vite.config.js          # Configured to proxy /api and /socket.io to backend
    ├── src/
    │   ├── main.jsx            # React root
    │   ├── App.jsx             # React Router setup
    │   ├── index.css           # Custom Design System (CSS variables & component classes)
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Manages JWT and user state
    │   │   └── SocketContext.jsx # Manages Socket.io connection lifecycle
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── InstructorDashboard.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   └── LiveSession.jsx   # Core real-time UI (Dual view for Instructor/Student)
    │   └── components/
    │       ├── Navbar.jsx
    │       ├── ProtectedRoute.jsx
    │       ├── LiveAnalytics.jsx     # Renders live bar charts and stats
    │       ├── QuestionTemplates.jsx # One-click predefined question grid
    │       ├── StudentPulse.jsx      # Student view of a question with countdown ring
    │       ├── SessionReport.jsx     # Detailed end-of-session report for instructors
    │       └── TimerSelect.jsx       # 3s/5s/10s toggle
```

---

## 3. Implemented Features
*   **Authentication Flow:** Signup/Login with role selection (Instructor vs. Student). Passwords are hashed with bcrypt (salt rounds: 12).
*   **Institute & Classroom Management:**
    *   Instructors can create Institutes (generates a random hex `instituteId`) and Classrooms.
    *   Students can join Institutes using the `instituteId` and then enroll in Classrooms.
*   **Real-Time Live Sessions:**
    *   Instructors can start a live session for a classroom.
    *   Students see a "Live" badge and can join the session.
    *   Instructors launch predefined questions (Understanding, Revision, Pace, Doubt, Feedback) with 3s/5s/10s timers.
    *   Questions broadcast instantly via WebSockets.
    *   Students submit Yes/No or 1-5 Rating responses.
    *   Instructor dashboard updates live with participation percentages and response distributions.
    *   Polls automatically close when the timer expires, syncing state across all clients.
    *   **Post-Session Report:** When the instructor ends the session, they receive a detailed breakdown of all questions asked, specifically identifying which students answered "No" or gave low ratings to help them target interventions. Students only see a generic "Session Ended" screen.

---

## 4. Database Schemas (Mongoose)
1.  **User:** `name`, `email`, `password` (hashed), `role` ('instructor' or 'student'), `institutes` (refs).
2.  **Institute:** `name`, `instituteId` (unique random 4-byte hex), `owner` (ref User), `members` (refs User).
3.  **Classroom:** `name`, `institute` (ref), `instructor` (ref), `students` (refs), `activeSession` (ref Session).
4.  **Session:** `classroom` (ref), `instructor` (ref), `isActive` (boolean), `participants` (refs User), `startedAt`, `endedAt`.
5.  **Poll:** `session` (ref), `question`, `category` (enum), `responseType` ('yesno' or 'rating'), `timer` (number), `isActive`, `launchedAt`, `closedAt`.
6.  **Response:** `poll` (ref), `student` (ref), `answer` (string: 'yes', 'no', '1'-'5'). Uses a unique compound index on `{ poll: 1, student: 1 }`.

---

## 5. REST APIs (`/api`)
*   **Auth:** 
    *   `POST /auth/signup` (Requires Zod validation)
    *   `POST /auth/login`
    *   `GET /auth/me` (Validates JWT)
*   **Institutes:** 
    *   `POST /institutes` (Instructor creates)
    *   `POST /institutes/join` (Student joins via ID)
    *   `GET /institutes` (List user's institutes)
    *   `GET /institutes/:id` (Get details)
*   **Classrooms:** 
    *   `POST /classrooms` (Instructor creates)
    *   `POST /classrooms/:id/join` (Student joins)
    *   `GET /classrooms/institute/:instituteId`
    *   `GET /classrooms/:id`
*   **Sessions:** 
    *   `POST /sessions/start`
    *   `POST /sessions/:id/end`
    *   `GET /sessions/:id` (Get session + history)
    *   `GET /sessions/:id/analytics/:pollId` (Get exact math for a poll)
    *   `GET /sessions/:id/report` (Get detailed student response report - Instructor Only)

---

## 6. Socket.io Events
*   **Connection Validation:** WebSockets require the JWT token in the `auth` handshake payload.
*   **Client -> Server (Emits):**
    *   `join-session { sessionId }` - Joins a socket room (`session:{id}`).
    *   `launch-pulse { sessionId, question, category, responseType, timer }`
    *   `submit-response { pollId, answer }`
    *   `get-templates`
    *   `end-session { sessionId }`
*   **Server -> Client (Listens):**
    *   `participant-update { count }` - Broadcasts live student count.
    *   `pulse-launched { pollId, question, category, responseType, timer, launchedAt }`
    *   `pulse-closed { pollId, analytics }` - Fired when the backend `setTimeout` timer expires.
    *   `analytics-update { pollId, analytics }` - Fired on every student response.
    *   `response-submitted { pollId }` - Confirmation to the student.
    *   `response-error { message }`
    *   `session-ended`

---

## 7. Design Decisions & Security Highlights
1.  **Custom CSS Design System:** Instead of cluttering React components with massive Tailwind utility strings, a clean design system was built in `index.css` leveraging CSS variables. Components use semantic classes like `.card`, `.btn-primary`, and `.pulse-card`.
2.  **Strict Validation:** `zod` is used on the backend to validate all POST payloads (email formatting, password strength, trimming strings).
3.  **Rate Limiting:** Global API rate limiting (100 req/15m) and strict Auth rate limiting (20 req/15m) via `express-rate-limit`.
4.  **JWT Handling:** 
    *   The `HS256` algorithm is hardcoded; `none` algorithm is explicitly rejected. 
    *   The secret relies on a multi-tiered fallback (Environment Variable -> Local File -> Ephemeral Random string with a loud console warning).
5.  **No `dangerouslySetInnerHTML`:** React natively escapes outputs to prevent XSS.
6.  **Timer Logic:** Timers are handled on the *server* (`setTimeout` in Socket handler) to prevent client-side manipulation, ensuring the poll closes authoritatively.

---

## 8. Environment Variables
Currently located in `/Users/yashdevani/Desktop/hackthon/.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pulseclass
JWT_SECRET=<strong_secret_key>
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 9. Current Status, Known Bugs & Next Steps
*   **Status:** MVP is functionally complete. The backend and frontend development servers are both successfully communicating. The MongoDB Atlas connection has been established. The Instructor Post-Session Report feature is complete.
*   **Known Bugs:** None actively blocking development. Previous port conflict (`EADDRINUSE 5000`), IP whitelisting issues, and React "stale closure" bugs regarding socket listeners were fully resolved.
*   **Pending Tasks (Next Development Steps):**
    1.  **Security Debt (`TODO(security)`):** 
        *   Migrate JWT storage from `localStorage` to `httpOnly` secure cookies.
        *   Implement OAuth providers (Google/GitHub).
        *   Implement Multi-Factor Authentication (MFA).
    2.  **Production Readiness:** Ensure mTLS is configured for MongoDB in production, and properly build the Vite frontend (`npm run build`) to be served statically or via a CDN.
    3.  **UI Polish:** Add subtle micro-animations for transitions between screens, and improve the empty states.
    4.  **History/Export:** Allow instructors to view past historical session reports from the dashboard and export data (CSV/PDF).
