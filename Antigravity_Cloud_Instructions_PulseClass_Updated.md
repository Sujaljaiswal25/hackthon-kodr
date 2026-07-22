# Antigravity Cloud - Build Instructions for PulseClass MVP

## Project Name

PulseClass - Continuous Pulse Mode

---

## Objective

Build a real-time classroom engagement platform for offline and hybrid classrooms that allows instructors to launch one-click classroom pulse checks and receive live student responses within seconds.

The primary goal of this MVP is speed, simplicity, and uninterrupted classroom interaction.

---

## Important Guidelines

1. Prioritize performance and real-time communication.
2. Keep the UI simple, clean, and distraction-free.
3. Poll creation must never require typing during a live session.
4. All classroom interactions should happen without page reloads.
5. Use Socket.io for all live communication.
6. The instructor should be able to launch the next question in a single click.

---

## Tech Stack (Mandatory)

Use the MERN stack for the entire application.

Frontend:
- React.js
- Tailwind CSS (for simple and clean styling)

Backend:
- Node.js
- Express.js

Database:
- MongoDB
- Mongoose ODM

Real-Time Communication:
- Socket.io

Authentication:
- JWT Authentication

Deployment:
- Vercel (Frontend)
- Render (Backend)

---

## UI/UX Guidelines

The UI should be:

- Minimalistic
- Fast and responsive
- Clean and modern
- Mobile friendly
- Easy to use during live teaching sessions

Avoid:

- Complex dashboards
- Heavy animations
- Fancy gradients and unnecessary effects
- Multi-step forms during live sessions

Design Principles:

- One-click actions wherever possible.
- Large and easily clickable buttons.
- Maximum information with minimum visual clutter.
- Real-time updates without page refreshes.

Instructor Dashboard should focus on:

- Current live question.
- Live analytics.
- Next recommended questions.
- Student participation count.
- One-click question launch.

Student Dashboard should focus on:

- Current active question.
- Countdown timer.
- Submit response button.
- Waiting state for next pulse.

---

## User Roles

### Instructor

Capabilities:
- Login and Signup
- Create an Institute
- Create Classrooms
- Start and End Live Sessions
- Launch predefined pulse questions
- View live analytics
- Continuously switch between pulse questions

### Student

Capabilities:
- Login and Signup
- Join Institute using Institute ID
- Join Classroom
- Participate in live pulse questions
- View poll results if enabled

---

## MVP Features

### Authentication

Required:
- Login
- Signup
- Role Selection

---

### Institute Management

Instructor:
- Create Institute
- Generate Institute ID

Student:
- Join Institute using Institute ID

---

### Classroom Management

Required:
- Create Classroom
- Join Classroom
- View active students

Example Classrooms:
- DSA
- System Design
- Web Development
- UI/UX Design

---

### Live Session Management

Required:
- Start Session
- End Session
- Track active participants

---

## Continuous Pulse Mode

Workflow:

Teach Topic -> Launch Pulse Question -> Students Respond -> Analytics Displayed -> Launch Next Question -> Repeat

---

## Predefined Question Templates

### Understanding Check
- Did everyone understand the concept?
- Are you able to follow?
- Was this topic difficult?

### Revision Check
- Should I explain this topic again?
- Need another example?
- Would you like a quick revision?

### Pace Check
- Is the pace comfortable?
- Ready for the next topic?
- Is the pace too fast?

### Doubt Check
- Are you facing any doubts?
- Need mentor support?
- Want more practice questions?

### Session Feedback
- Was today's session useful?
- Rate your understanding.

Response Types Supported:
- Yes / No
- Rating (1-5)

---

## Ultra Fast Question Switching

After every pulse, the instructor should immediately see the next recommended questions and launch them with a single click.

---

## Poll Timers

Supported Timers:
- 3 Seconds
- 5 Seconds (Default)
- 10 Seconds

---

## Student Experience

Receive Question -> Submit Response -> Wait for Next Question -> Receive New Question Automatically

No page refreshes are allowed.

---

## Real-Time Analytics

Instructor Dashboard should display:

- Total Students Joined
- Responses Received
- Participation Percentage
- Yes / No Distribution

Example:

- Students Joined: 80
- Responses: 76
- Participation: 95%
- YES: 72%
- NO: 28%

---

## Database Collections

Required Collections:

- Users
- Institutes
- Classrooms
- Sessions
- Polls
- Responses

---

## Features NOT Included in MVP

Do NOT build:

- AI-generated questions
- Attendance system
- Custom poll creation
- Leaderboards
- Gamification
- LMS features
- Payments
- Advanced analytics
- Multi-instructor support

---

## Performance Requirements

- Poll delivery should feel instant.
- Question switching should happen in less than one second.
- Real-time analytics should update immediately.
- Support at least 50 concurrent students during the demo.

---

## Product Pitch

PulseClass is a one-click classroom pulse platform that enables instructors to continuously launch predefined classroom questions and instantly understand student comprehension in real time without disrupting the flow of teaching.
