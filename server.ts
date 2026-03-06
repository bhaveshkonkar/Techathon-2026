import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import nodemailer from "nodemailer";

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

let transporter: nodemailer.Transporter;

// Dynamically create a test account so it never expires during development
nodemailer.createTestAccount().then((account) => {
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
  console.log('✅ Nodemailer initialized with active Ethereal dummy account:', account.user);
}).catch(console.error);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("lms.db");
const JWT_SECRET = process.env.JWT_SECRET || "nexus-lms-secret-key-123";

// Set up Multer for handling file uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('instructor', 'student')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    instructor_id INTEGER NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    classroom_id INTEGER NOT NULL,
    UNIQUE(student_id, classroom_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    classroom_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
  );

  CREATE TABLE IF NOT EXISTS subtopics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    sketchfab_id TEXT,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
  );

  DROP TABLE IF EXISTS mcqs;
  CREATE TABLE IF NOT EXISTS mcqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtopic_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON string
    correct_option_index INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    topic_group_id TEXT DEFAULT 'general',
    FOREIGN KEY (subtopic_id) REFERENCES subtopics(id)
  );

  CREATE TABLE IF NOT EXISTS student_assessment_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subtopic_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    difficulty_attempted TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subtopic_id) REFERENCES subtopics(id)
  );

  CREATE TABLE IF NOT EXISTS student_knowledge (
    student_id INTEGER PRIMARY KEY,
    knowledge_json TEXT,
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS student_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subtopic_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT 0,
    mcq_score INTEGER,
    UNIQUE(student_id, subtopic_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subtopic_id) REFERENCES subtopics(id)
  );

  CREATE TABLE IF NOT EXISTS student_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructor_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    classroom_id INTEGER NOT NULL,
    topic_name TEXT,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
  );
`);

try { db.exec("ALTER TABLE student_feedback ADD COLUMN topic_name TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN otp_code TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE users ADD COLUMN otp_expiry INTEGER;"); } catch (e) { }

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static(path.join(__dirname, "uploads")));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, full_name, role } = req.body;
    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 10 * 60 * 1000;
      const stmt = db.prepare("INSERT INTO users (email, password, full_name, role, is_verified, otp_code, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const result = stmt.run(email, password, full_name, role, 0, otpCode, otpExpiry);

      console.log(`\n===========================================`);
      console.log(`🔑 [OTP SYSTEM] New Signup Code Generated!`);
      console.log(`✉️  User: ${email}`);
      console.log(`💬 Code: ${otpCode}`);

      try {
        const info = await transporter.sendMail({
          from: '"GraspIQ 👻" <noreply@graspiq.com>',
          to: email,
          subject: 'GraspIQ - Your Verification Code',
          html: `<p>Welcome to GraspIQ! Your verification code is <strong style="font-size: 24px;">${otpCode}</strong>. It expires in 10 minutes.</p>`
        });
        console.log(`✅ Dummy Email Sent Successfully! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } catch (err) {
        console.warn(`⚠️ Warning: Mock email could not be sent. Error:`, err);
      }

      console.log(`===========================================\n`);

      res.json({ status: 'pending_verification', email, id: result.lastInsertRowid });
    } catch (e: any) {
      if (e.message.includes('UNIQUE')) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(400).json({ error: e.message });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      if (user.is_verified === 0) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 10 * 60 * 1000;
        db.prepare("UPDATE users SET otp_code = ?, otp_expiry = ? WHERE id = ?").run(otpCode, otpExpiry, user.id);

        console.log(`\n===========================================`);
        console.log(`🔑 [OTP SYSTEM] Login Code Generated!`);
        console.log(`✉️  User: ${email}`);
        console.log(`💬 Code: ${otpCode}`);

        try {
          const info = await transporter.sendMail({
            from: '"GraspIQ 👻" <noreply@graspiq.com>',
            to: email,
            subject: 'GraspIQ - Verify your login',
            html: `<p>Welcome back! Your verification code is <strong style="font-size: 24px;">${otpCode}</strong>. It expires in 10 minutes.</p>`
          });
          console.log(`✅ Dummy Email Sent Successfully! Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        } catch (err) {
          console.warn(`⚠️ Warning: Mock email could not be sent. Error:`, err);
        }

        console.log(`===========================================\n`);

        return res.json({ status: 'pending_verification', email, id: user.id });
      }

      const { password: _, otp_code, otp_expiry, is_verified, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otp_code !== otp) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (Date.now() > user.otp_expiry) {
      return res.status(400).json({ error: "Code expired" });
    }

    db.prepare("UPDATE users SET is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE id = ?").run(user.id);

    const verifiedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;
    const { password: _, otp_code, otp_expiry, is_verified, ...userWithoutPassword } = verifiedUser;

    const token = jwt.sign(userWithoutPassword, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json(userWithoutPassword);
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  // Classrooms
  app.post("/api/classrooms", authenticateToken, (req: any, res) => {
    if (req.user.role !== "instructor") return res.status(403).json({ error: "Only instructors can create classes" });
    const { name } = req.body;
    const join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const stmt = db.prepare("INSERT INTO classrooms (name, instructor_id, join_code) VALUES (?, ?, ?)");
      const result = stmt.run(name, req.user.id, join_code);
      res.json({ id: result.lastInsertRowid, name, join_code });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/classrooms", authenticateToken, (req: any, res) => {
    if (req.user.role === "instructor") {
      const classes = db.prepare("SELECT * FROM classrooms WHERE instructor_id = ?").all(req.user.id);
      res.json(classes);
    } else {
      const classes = db.prepare(`
        SELECT c.* FROM classrooms c
        JOIN enrollments e ON c.id = e.classroom_id
        WHERE e.student_id = ?
      `).all(req.user.id);
      res.json(classes);
    }
  });

  app.post("/api/classrooms/join", authenticateToken, (req: any, res) => {
    const { join_code } = req.body;
    const classroom = db.prepare("SELECT * FROM classrooms WHERE join_code = ?").get(join_code) as any;
    if (!classroom) return res.status(404).json({ error: "Invalid join code" });

    try {
      db.prepare("INSERT INTO enrollments (student_id, classroom_id) VALUES (?, ?)").run(req.user.id, classroom.id);
      res.json(classroom);
    } catch (e: any) {
      res.status(400).json({ error: "Already enrolled or error joining" });
    }
  });

  app.get("/api/classrooms/:id/students", authenticateToken, (req: any, res) => {
    if (req.user.role !== "instructor") return res.status(403).json({ error: "Only instructors" });
    try {
      const students = db.prepare(`
        SELECT u.id, u.full_name as name, u.email, k.knowledge_json
        FROM users u
        JOIN enrollments e ON u.id = e.student_id
        LEFT JOIN student_knowledge k ON u.id = k.student_id
        WHERE e.classroom_id = ?
      `).all(req.params.id) as any[];

      const metrics = db.prepare(`
        SELECT m.student_id, m.is_correct, m.response_time, m.timestamp
        FROM student_assessment_metrics m
        JOIN subtopics s ON m.subtopic_id = s.id
        JOIN lessons l ON s.lesson_id = l.id
        WHERE l.classroom_id = ?
      `).all(req.params.id) as any[];

      const statsMap: Record<number, any> = {};
      metrics.forEach(m => {
        if (!statsMap[m.student_id]) {
          statsMap[m.student_id] = { total: 0, correct: 0, time: 0, lastActive: m.timestamp };
        }
        statsMap[m.student_id].total++;
        if (m.is_correct) statsMap[m.student_id].correct++;
        statsMap[m.student_id].time += m.response_time;
        if (new Date(m.timestamp) > new Date(statsMap[m.student_id].lastActive)) {
          statsMap[m.student_id].lastActive = m.timestamp;
        }
      });

      const formatted = students.map(s => {
        const stats = statsMap[s.id];
        let accuracy = stats?.total ? Math.round((stats.correct / stats.total) * 100) : 0;
        let avgSpeed = stats?.total ? Math.round((stats.time / stats.total) * 10) / 10 : 0;
        let score = stats?.total ? ((0.5 * (accuracy / 100)) + (0.3 * Math.max(0, Math.min(1, 15 / (avgSpeed || 15)))) + (0.2 * Math.min(1, stats.total / 5))) * 100 : 0;

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          knowledge: s.knowledge_json ? JSON.parse(s.knowledge_json).concepts : null,
          stats: {
            accuracy,
            avgSpeed,
            score: Math.round(score),
            lastActive: stats?.lastActive || null,
            totalAssessments: stats?.total || 0,
            label: Math.round(score) >= 80 ? 'Advanced' : Math.round(score) >= 50 ? 'On Track' : 'Needs Support'
          }
        };
      });

      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/feedback", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'instructor') return res.status(403).json({ error: "Only instructors" });
    const { student_id, classroom_id, topic_name, message } = req.body;
    try {
      db.prepare(`
        INSERT INTO student_feedback (instructor_id, student_id, classroom_id, topic_name, message)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, student_id, classroom_id, topic_name || null, message);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/student/feedback", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: "Only students" });
    try {
      const feedback = db.prepare(`
        SELECT f.id, f.message, f.timestamp, f.topic_name, c.name as classroom_name, u.full_name as instructor_name
        FROM student_feedback f
        JOIN classrooms c ON f.classroom_id = c.id
        JOIN users u ON f.instructor_id = u.id
        WHERE f.student_id = ?
        ORDER BY f.timestamp DESC
      `).all(req.user.id);
      res.json(feedback);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Lessons & Subtopics
  app.post("/api/lessons", authenticateToken, (req: any, res) => {
    const { classroom_id, title, order_index } = req.body;
    const result = db.prepare("INSERT INTO lessons (classroom_id, title, order_index) VALUES (?, ?, ?)").run(classroom_id, title, order_index);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/classrooms/:id/lessons", authenticateToken, (req: any, res) => {
    const lessons = db.prepare("SELECT * FROM lessons WHERE classroom_id = ? ORDER BY order_index").all(req.params.id);
    for (const lesson of lessons as any[]) {
      lesson.subtopics = db.prepare("SELECT * FROM subtopics WHERE lesson_id = ? ORDER BY order_index").all(lesson.id);
      for (const subtopic of lesson.subtopics as any[]) {
        subtopic.mcqs = db.prepare("SELECT * FROM mcqs WHERE subtopic_id = ?").all(subtopic.id);
        subtopic.mcqs.forEach((m: any) => m.options = JSON.parse(m.options));
      }
    }
    res.json(lessons);
  });

  app.get("/api/student/classrooms/:id/mastery", authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'student') return res.status(403).json({ error: "Only for students" });
      const classroomId = req.params.id;

      const stats = db.prepare(`
        SELECT s.id, s.title name, 
               CAST(SUM(CASE WHEN m.is_correct = 1 THEN 1 ELSE 0 END) AS REAL) as correct,
               CAST(COUNT(m.id) AS REAL) as total
        FROM subtopics s
        JOIN lessons l ON s.lesson_id = l.id
        LEFT JOIN student_assessment_metrics m ON m.subtopic_id = s.id AND m.student_id = ?
        WHERE l.classroom_id = ?
        GROUP BY s.id, s.title
      `).all(req.user.id, classroomId) as any[];

      const radarData = stats.map((st: any) => ({
        name: st.name.length > 15 ? st.name.substring(0, 15) + '...' : st.name,
        full_name: st.name,
        mastery: st.total > 0 ? st.correct / st.total : 0
      }));

      res.json(radarData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subtopics", authenticateToken, upload.single('video'), (req: any, res) => {
    try {
      const lesson_id = parseInt(req.body.lesson_id, 10);
      const title = req.body.title;
      const sketchfab_id = req.body.sketchfab_id || null;
      const order_index = parseInt(req.body.order_index, 10);
      let video_url = null;

      if (req.file) {
        video_url = `/uploads/${req.file.filename}`;
      }

      const result = db.prepare("INSERT INTO subtopics (lesson_id, title, video_url, sketchfab_id, order_index) VALUES (?, ?, ?, ?, ?)").run(lesson_id, title, video_url, sketchfab_id, order_index);
      const subtopicId = result.lastInsertRowid;

      let parsedQuestions = [];
      if (req.body.questions) {
        parsedQuestions = JSON.parse(req.body.questions);
      }

      if (parsedQuestions && Array.isArray(parsedQuestions)) {
        const stmt = db.prepare("INSERT INTO mcqs (subtopic_id, question_text, options, correct_option_index, difficulty, topic_group_id) VALUES (?, ?, ?, ?, ?, ?)");
        for (const q of parsedQuestions) {
          stmt.run(subtopicId, q.question_text, JSON.stringify(q.options), q.correct_option_index, q.difficulty || 'medium', q.topic_group_id || 'general');
        }
      }

      res.json({ id: subtopicId, video_url });
    } catch (e: any) {
      console.error("Error saving subtopic:", e);
      res.status(500).json({ error: e.message || "Failed to create subtopic" });
    }
  });

  app.delete("/api/classrooms/:id", authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'instructor') return res.status(403).json({ error: "Forbidden" });
      const classroomId = req.params.id;

      const lessons = db.prepare("SELECT id FROM lessons WHERE classroom_id = ?").all(classroomId) as any[];
      for (const lesson of lessons) {
        const subtopics = db.prepare("SELECT id FROM subtopics WHERE lesson_id = ?").all(lesson.id) as any[];
        for (const sub of subtopics) {
          db.prepare("DELETE FROM mcqs WHERE subtopic_id = ?").run(sub.id);
          db.prepare("DELETE FROM student_progress WHERE subtopic_id = ?").run(sub.id);
        }
        db.prepare("DELETE FROM subtopics WHERE lesson_id = ?").run(lesson.id);
      }
      db.prepare("DELETE FROM lessons WHERE classroom_id = ?").run(classroomId);
      db.prepare("DELETE FROM enrollments WHERE classroom_id = ?").run(classroomId);
      db.prepare("DELETE FROM classrooms WHERE id = ?").run(classroomId);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/subtopics/:id", authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'instructor') return res.status(403).json({ error: "Forbidden" });
      const subtopicId = req.params.id;
      db.prepare("DELETE FROM mcqs WHERE subtopic_id = ?").run(subtopicId);
      db.prepare("DELETE FROM student_progress WHERE subtopic_id = ?").run(subtopicId);
      db.prepare("DELETE FROM subtopics WHERE id = ?").run(subtopicId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Progress
  app.post("/api/progress", authenticateToken, (req: any, res) => {
    const { subtopic_id, completed, mcq_score } = req.body;
    db.prepare(`
      INSERT INTO student_progress (student_id, subtopic_id, completed, mcq_score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id, subtopic_id) DO UPDATE SET
      completed = excluded.completed,
      mcq_score = excluded.mcq_score
    `).run(req.user.id, subtopic_id, completed ? 1 : 0, mcq_score);
    res.json({ success: true });
  });

  app.get("/api/progress", authenticateToken, (req: any, res) => {
    const progress = db.prepare("SELECT * FROM student_progress WHERE student_id = ?").all(req.user.id);
    res.json(progress);
  });

  // Student Metrics & Dashboard
  app.post("/api/student/metrics", authenticateToken, (req: any, res) => {
    const { subtopic_id, metrics } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO student_assessment_metrics (student_id, subtopic_id, question_id, difficulty_attempted, is_correct, response_time) VALUES (?, ?, ?, ?, ?, ?)");
      const insertProgress = db.prepare(`
        INSERT INTO student_progress (student_id, subtopic_id, completed, mcq_score)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(student_id, subtopic_id) DO UPDATE SET
        completed = 1,
        mcq_score = excluded.mcq_score
      `);

      let correctCount = 0;
      for (const m of metrics) {
        stmt.run(req.user.id, subtopic_id, m.questionId, m.difficulty, m.isCorrect ? 1 : 0, m.timeSpent);
        if (m.isCorrect) correctCount++;
      }

      const score = metrics.length > 0 ? Math.round((correctCount / metrics.length) * 100) : 0;
      insertProgress.run(req.user.id, subtopic_id, score);

      res.json({ success: true });
    } catch (e: any) {
      console.error("POST /api/student/metrics error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/student/dashboard", authenticateToken, (req: any, res) => {
    try {
      const student_id = req.user.id;
      const rawMetrics = db.prepare(`
        SELECT m.*, s.title as subtopic_name, l.title as lesson_name, l.id as lesson_id, l.classroom_id
        FROM student_assessment_metrics m 
        JOIN subtopics s ON m.subtopic_id = s.id 
        JOIN lessons l ON s.lesson_id = l.id 
        WHERE m.student_id = ? 
        ORDER BY m.timestamp ASC
      `).all(student_id) as any[];

      const assessmentsByDay = new Set();

      rawMetrics.forEach(m => {
        assessmentsByDay.add(new Date(m.timestamp + 'Z').toDateString()); // Appending Z for UTC if needed, but timestamp is local, let's just use it
      });

      const sortedDays = Array.from(assessmentsByDay).map(d => new Date(d as string).setHours(0, 0, 0, 0)).sort((a, b) => a - b);
      let currentStreak = 0;
      let maxStreak = 0;
      if (sortedDays.length > 0) {
        currentStreak = 1;
        maxStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const diff = Math.round((sortedDays[i] - sortedDays[i - 1]) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else if (diff > 1) {
            currentStreak = 1;
          }
        }
        const today = new Date().setHours(0, 0, 0, 0);
        const lastDay = sortedDays[sortedDays.length - 1];
        if (Math.round((today - lastDay) / (1000 * 60 * 60 * 24)) > 1) {
          currentStreak = 0;
        }
      }

      const topics: Record<number, any> = {};
      rawMetrics.forEach(m => {
        if (!topics[m.lesson_id]) topics[m.lesson_id] = { id: m.lesson_id, title: m.lesson_name, classroom_id: m.classroom_id, correct: 0, total: 0 };
        topics[m.lesson_id].total++;
        if (m.is_correct) topics[m.lesson_id].correct++;
      });

      const weakTopics = Object.values(topics).map((t: any) => {
        const mastery = t.total ? t.correct / t.total : 0;
        return { ...t, mastery, classification: mastery < 0.5 ? 'Weak' : mastery < 0.75 ? 'Improving' : 'Strong' };
      }).filter(t => t.classification !== 'Strong').sort((a, b) => a.mastery - b.mastery);

      let accuracy = rawMetrics.length ? rawMetrics.filter(m => m.is_correct).length / rawMetrics.length : 0;
      let avgSpeed = rawMetrics.length ? rawMetrics.reduce((acc, m) => acc + m.response_time, 0) / rawMetrics.length : 0;

      let speedScore = Math.max(0, Math.min(1, 15 / (avgSpeed || 15)));
      let score = rawMetrics.length ? ((0.5 * accuracy) + (0.3 * speedScore) + (0.2 * Math.min(1, rawMetrics.length / 5))) * 100 : 0;

      // Calculate assessment scores (bar chart)
      // Group by distinct subtopic attempts
      const attemptsMap: Record<string, { correct: number, total: number }> = {};
      rawMetrics.forEach(m => {
        const dStr = new Date(m.timestamp + 'Z').toLocaleString();
        if (!attemptsMap[m.subtopic_name]) attemptsMap[m.subtopic_name] = { correct: 0, total: 0 };
        attemptsMap[m.subtopic_name].total++;
        if (m.is_correct) attemptsMap[m.subtopic_name].correct++;
      });
      const recentAssessments = Object.keys(attemptsMap).map(k => ({ name: k, score: Math.round((attemptsMap[k].correct / attemptsMap[k].total) * 100) })).slice(-5);

      // Activity
      const recentActivity = rawMetrics.slice(-5).reverse().map(m => ({
        topic: m.subtopic_name,
        is_correct: m.is_correct,
        time_spent: Math.round(m.response_time)
      }));

      // Trend: Group by day
      const trendMap: Record<string, { correct: number, total: number }> = {};
      rawMetrics.forEach(m => {
        const day = new Date(m.timestamp + 'Z').toLocaleDateString();
        if (!trendMap[day]) trendMap[day] = { correct: 0, total: 0 };
        trendMap[day].total++;
        if (m.is_correct) trendMap[day].correct++;
      });
      const accuracyTrend = Object.keys(trendMap).map(k => ({ date: k, accuracy: Math.round((trendMap[k].correct / trendMap[k].total) * 100) }));

      res.json({
        streak: currentStreak,
        maxStreak,
        weakTopics,
        recentAssessments,
        accuracyTrend,
        stats: {
          accuracy: Math.round(accuracy * 100),
          avgSpeed: Math.round(avgSpeed * 10) / 10,
          score: Math.round(score),
          label: score >= 80 ? 'Advanced' : score >= 50 ? 'On Track' : 'Needs Support'
        },
        recentActivity
      });

    } catch (e: any) {
      console.error("GET /api/student/dashboard error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Student Knowledge Graph (RAG)
  app.get("/api/student/subtopic-analytics/:subtopicId", authenticateToken, (req: any, res) => {
    try {
      const subtopicId = req.params.subtopicId;
      const metrics = db.prepare(`
        SELECT * FROM student_assessment_metrics 
        WHERE student_id = ? AND subtopic_id = ? 
        ORDER BY timestamp DESC
      `).all(req.user.id, subtopicId) as any[];

      const progress = db.prepare(`
        SELECT * FROM student_progress 
        WHERE student_id = ? AND subtopic_id = ?
      `).get(req.user.id, subtopicId) as any;

      if (!metrics.length) {
        return res.json({ available: false });
      }

      const totalAtt = metrics.length;
      const correct = metrics.filter(m => m.is_correct).length;
      const accuracy = Math.round((correct / totalAtt) * 100);
      const avgSpeed = (metrics.reduce((acc, m) => acc + m.response_time, 0) / totalAtt).toFixed(1);

      res.json({
        available: true,
        score: progress?.mcq_score || 0,
        accuracy,
        avgSpeed,
        totalQuestions: totalAtt
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/student/knowledge", authenticateToken, (req: any, res) => {
    try {
      const row = db.prepare("SELECT knowledge_json FROM student_knowledge WHERE student_id = ?").get(req.user.id);
      res.json({ knowledge: row ? JSON.parse((row as any).knowledge_json) : null });
    } catch (e: any) {
      console.error("GET /api/student/knowledge error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/student/knowledge", authenticateToken, (req: any, res) => {
    try {
      const { knowledge } = req.body;
      db.prepare(`
        INSERT INTO student_knowledge (student_id, knowledge_json) 
        VALUES (?, ?) 
        ON CONFLICT(student_id) DO UPDATE SET knowledge_json = excluded.knowledge_json
      `).run(req.user.id, JSON.stringify(knowledge));
      res.json({ success: true });
    } catch (e: any) {
      console.error("POST /api/student/knowledge error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Gemini Proxy
  app.post("/api/gemini", authenticateToken, async (req: any, res) => {
    const { prompt, context } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Context: ${context}\n\nQuestion: ${prompt}`,
        config: {
          systemInstruction: "You are a helpful AI tutor in a 3D LMS. Answer the student's question based on the provided context of the lesson subtopic.",
        },
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
