import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// In-memory Telemetry Log for Live Backend Inspector
const backendLogs = [];

function logTelemetry(req, res, responseBody, durationMs) {
  const logEntry = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    durationMs: durationMs,
    clientIp: req.ip || '127.0.0.1',
    requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : null,
    responseSnippet: typeof responseBody === 'object' ? JSON.stringify(responseBody).slice(0, 200) : String(responseBody).slice(0, 200),
    pipelineSteps: [
      { step: "1. HTTP Request Received", status: "ok", time: `${durationMs}ms` },
      { step: "2. CORS & JSON Middleware", status: "ok" },
      { step: "3. Express Router & Logic Execution", status: res.statusCode < 400 ? "ok" : "warning" },
      { step: "4. JSON File Sync (data.json)", status: "ok" },
      { step: "5. Audit Activity Logged", status: "ok" }
    ]
  };

  backendLogs.unshift(logEntry);
  if (backendLogs.length > 200) backendLogs.pop();
}

// Telemetry Middleware interceptor
app.use((req, res, next) => {
  const start = Date.now();
  const originalResJson = res.json;

  res.json = function (body) {
    const duration = Date.now() - start;
    logTelemetry(req, res, body, duration);
    return originalResJson.call(this, body);
  };

  next();
});

const uid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const DEFAULT_COURSES = [
  {
    id: "course_defensive",
    name: "Advanced Defensive Driving Masterclass",
    category: "Four Wheeler",
    vehicleType: "four_wheeler",
    badge: "Premium Certified",
    fee: 450,
    duration: "4 Weeks",
    durationDays: 28,
    transmission: "Automatic / Manual",
    prerequisite: "Valid Learner's Permit",
    description: "Master critical road awareness and collision avoidance techniques. Designed for experienced drivers seeking complete confidence and safety mastery in high-stakes environments.",
    syllabus: [
      "Vehicle Controls & Emergency Response",
      "Clutch-Brake Coordination & Hill Holds",
      "Parallel & Reverse Precision Parking",
      "City & High-Speed Highway Merging",
      "Night & Adverse Weather Navigation",
      "Final RTO Practical Test Simulation"
    ],
    packages: [
      { name: "Beginner Course", fee: 450, popular: true, hours: 15 },
      { name: "Intensive Masterclass", fee: 850, popular: false, hours: 30 }
    ]
  },
  {
    id: "course_standard",
    name: "Standard Car License Course",
    category: "Four Wheeler",
    vehicleType: "four_wheeler",
    badge: "Most Popular",
    fee: 450,
    duration: "3 Weeks",
    durationDays: 21,
    transmission: "Manual",
    prerequisite: "Age 18+",
    description: "Complete hands-on practical driving program covering essential vehicle controls, city driving, reversing, parking, and full RTO license test preparation.",
    syllabus: ["Basic Controls", "Steering Control", "City Traffic", "Parking", "Mock Test"]
  },
  {
    id: "course_2w",
    name: "Motorcycle Rider License Course",
    category: "Two Wheeler",
    vehicleType: "two_wheeler",
    badge: "Fast Track",
    fee: 320,
    duration: "2 Weeks",
    durationDays: 14,
    transmission: "Manual / Gearless",
    prerequisite: "Age 18+",
    description: "Master balance, clutch control, slalom maneuvers, traffic riding, and road safety regulations for geared and non-geared two-wheelers.",
    syllabus: ["Balance & Clutch", "Gear Shifting", "Slalom & Figure 8", "Traffic Rules", "RTO Test"]
  }
];

const DEFAULT_TRAINERS = [
  {
    id: "tr_marcus",
    name: "Marcus Thorne",
    role: "Senior Defensive Driving Specialist",
    rating: 4.9,
    experienceYrs: 12,
    languages: ["English", "Spanish", "Tamil"],
    certified: true,
    bio: "With over 12 years of experience, Marcus specializes in building confidence for nervous drivers and advanced defensive driving techniques. His calm demeanor and methodical approach ensure a secure learning environment.",
    assignedVehicle: "2025 Toyota Corolla (Dual-Control Automatic)",
    vehicleRegNo: "TN-01-AX-9922",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    availableSlots: [
      { date: "Oct 12", slots: ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM"] },
      { date: "Oct 13", slots: ["09:00 AM", "10:30 AM", "03:30 PM"] },
      { date: "Oct 14", slots: ["10:30 AM", "12:00 PM", "02:00 PM", "05:00 PM"] },
      { date: "Oct 15", slots: ["08:30 AM", "10:00 AM", "01:30 PM"] }
    ]
  },
  {
    id: "tr_sarah",
    name: "Sarah J.",
    role: "Lead Driving Instructor",
    rating: 4.95,
    experienceYrs: 9,
    languages: ["English", "Tamil", "Hindi"],
    certified: true,
    bio: "Friendly and highly attentive instructor dedicated to city driving mastery and step-by-step parallel parking skills.",
    assignedVehicle: "2024 Hyundai i10 Dual-Control",
    vehicleRegNo: "TN-01-BC-3344",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    availableSlots: [
      { date: "Oct 12", slots: ["08:00 AM", "10:00 AM", "04:00 PM"] },
      { date: "Oct 13", slots: ["09:00 AM", "11:00 AM", "02:00 PM"] }
    ]
  }
];

const DEFAULT_VEHICLES = [
  { id: "veh_1", name: "Toyota Corolla 2025 (Dual-Control)", type: "four_wheeler", regNo: "TN-01-AX-9922", status: "active" },
  { id: "veh_2", name: "Hyundai i10 (LMV 2)", type: "four_wheeler", regNo: "TN-01-BC-3344", status: "active" },
  { id: "veh_3", name: "Honda Shine (2W)", type: "two_wheeler", regNo: "TN-01-EF-9012", status: "active" }
];

const DEFAULT_STUDENT = {
  id: "std_alex",
  name: "Alex Mercer",
  email: "alex.mercer@example.com",
  phone: "+1 (555) 234-5678",
  studentIdNo: "LDS-6043",
  permitStatus: "Learner's Permit ACTIVE",
  nextLesson: {
    title: "Practical Driving Session",
    dateStr: "Tomorrow, 10:00 AM",
    instructor: "Sarah J.",
    status: "Confirmed"
  },
  progressScore: 75,
  skills: [
    { name: "Parking / Parallel & Reverse", percentage: 80 },
    { name: "Highway Driving & Merging", percentage: 70 },
    { name: "Traffic Signals & Intersections", percentage: 90 },
    { name: "Advanced Defensive Maneuvers", percentage: 65 },
    { name: "Nervous Driver Specialist", percentage: 85 }
  ],
  instructorFeedback: "Great improvement on clutch control today! Need to refine focus on mirror checks before changing lanes on the highway.",
  instructorName: "Marcus Thorne",
  attendance: { completed: 12, total: 15 },
  documents: [
    { type: "Identity Proof", filename: "passport_v1.pdf", status: "verified", verifiedAt: "2026-08-01" },
    { type: "Medical Certificate", filename: "req_medical_cert.pdf", status: "pending", verifiedAt: null }
  ]
};

const DEFAULT_SETTINGS = {
  schoolName: "Lakshmi Driving School",
  portalName: "Lakshmi Driving Portal",
  tagline: "Precision. Confidence. Safety.",
  ownerName: "Shanmugam V",
  address: "Kandiyur, Vadhiyam Post",
  district: "Karur District",
  state: "Tamil Nadu",
  country: "India",
  pincode: "639114",
  contactNumber: "9976514300",
  whatsappNumber: "9976514300",
  email: "contact@lakshmidrivingschool.com",
  workingHours: "07:00 AM - 07:00 PM (Mon - Sat)"
};

function getInitialData() {
  return {
    settings: DEFAULT_SETTINGS,
    student: DEFAULT_STUDENT,
    courses: DEFAULT_COURSES,
    trainers: DEFAULT_TRAINERS,
    vehicles: DEFAULT_VEHICLES,
    users: [
      {
        id: "usr_admin",
        role: "owner",
        name: "Shanmugam V",
        phone: "9976514300",
        password: "admin123",
        createdAt: todayStr(),
      },
      {
        id: "usr_alex",
        role: "student",
        name: "Alex Mercer",
        email: "alex.mercer@example.com",
        phone: "+1 (555) 234-5678",
        password: "password123",
        createdAt: todayStr()
      }
    ],
    bookings: [
      {
        id: "bk_1001",
        studentId: "std_alex",
        studentName: "Alex Mercer",
        courseId: "course_defensive",
        courseName: "Advanced Defensive Driving Masterclass",
        trainerId: "tr_marcus",
        trainerName: "Marcus Thorne",
        date: "2026-10-15",
        timeSlot: "08:30 AM - 10:00 AM",
        status: "confirmed",
        fee: 612,
        createdAt: new Date().toISOString()
      }
    ],
    payments: [
      {
        id: "pay_9901",
        bookingId: "bk_1001",
        studentName: "Alex Mercer",
        amount: 612,
        currency: "USD",
        method: "Credit Card",
        status: "completed",
        breakdown: {
          tuition: 540,
          rtoReg: 85,
          practicalTest: 65,
          tax: 22
        },
        date: todayStr()
      }
    ],
    activity: [
      {
        id: uid("act"),
        actorName: "Backend Engine",
        action: "Express Server Initialized",
        detail: "Lakshmi Driving Portal backend running with conflict detection and telemetry inspector.",
        timestamp: new Date().toISOString()
      }
    ]
  };
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      settings: parsed.settings || DEFAULT_SETTINGS,
      student: parsed.student || DEFAULT_STUDENT,
      courses: Array.isArray(parsed.courses) ? parsed.courses : DEFAULT_COURSES,
      trainers: Array.isArray(parsed.trainers) ? parsed.trainers : DEFAULT_TRAINERS,
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : DEFAULT_VEHICLES,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      activity: Array.isArray(parsed.activity) ? parsed.activity : []
    };
  } catch (e) {
    console.error("Error loading data.json:", e);
    return getInitialData();
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving data.json:", e);
  }
}

let db = loadData();

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    app: "Lakshmi Driving Portal Backend",
    timestamp: new Date().toISOString(),
    counts: {
      users: db.users.length,
      bookings: db.bookings.length,
      trainers: db.trainers.length,
      courses: db.courses.length,
      payments: db.payments.length
    }
  });
});

// GET /api/backend-logs (Telemetry stream)
app.get('/api/backend-logs', (req, res) => {
  res.json({
    logs: backendLogs,
    activeDbCounts: {
      bookings: db.bookings.length,
      users: db.users.length,
      payments: db.payments.length
    }
  });
});

// GET /api/db-dump
app.get('/api/db-dump', (req, res) => {
  res.json(db);
});

// GET /api/settings
app.get('/api/settings', (req, res) => {
  res.json(db.settings || DEFAULT_SETTINGS);
});

// GET /api/student
app.get('/api/student', (req, res) => {
  res.json(db.student || DEFAULT_STUDENT);
});

// GET /api/courses
app.get('/api/courses', (req, res) => {
  res.json(db.courses);
});

// GET /api/trainers
app.get('/api/trainers', (req, res) => {
  res.json(db.trainers);
});

// GET /api/trainers/:id
app.get('/api/trainers/:id', (req, res) => {
  const trainer = db.trainers.find(t => t.id === req.params.id) || db.trainers[0];
  res.json(trainer);
});

// GET /api/bookings
app.get('/api/bookings', (req, res) => {
  res.json(db.bookings);
});

// POST /api/bookings (Conflict Detection & Booking creation)
app.post('/api/bookings', (req, res) => {
  const { studentName, courseId, trainerId, date, timeSlot, packageSelected, transmission } = req.body || {};

  if (!courseId || !date || !timeSlot) {
    return res.status(400).json({ error: "Missing required booking details (courseId, date, timeSlot)." });
  }

  // Conflict validation: Check if instructor is already booked for this exact slot & date
  if (trainerId) {
    const isConflict = db.bookings.some(
      b => b.trainerId === trainerId && b.date === date && b.timeSlot === timeSlot && b.status !== "cancelled"
    );
    if (isConflict) {
      return res.status(409).json({
        error: "Conflict Detected! Selected trainer is already booked for this date and time slot.",
        conflictType: "TRAINER_DOUBLE_BOOKING"
      });
    }
  }

  const course = db.courses.find(c => c.id === courseId) || db.courses[0];
  const trainer = db.trainers.find(t => t.id === trainerId) || db.trainers[0];

  const newBooking = {
    id: uid("bk"),
    studentId: "std_alex",
    studentName: studentName || "Alex Mercer",
    courseId: course.id,
    courseName: course.name,
    trainerId: trainer ? trainer.id : null,
    trainerName: trainer ? trainer.name : "Auto-Assigned Instructor",
    date,
    timeSlot,
    packageSelected: packageSelected || "Beginner Course",
    transmission: transmission || "Automatic",
    status: "confirmed",
    totalFee: course.fee || 450,
    createdAt: new Date().toISOString()
  };

  db.bookings.unshift(newBooking);

  // Add activity record
  db.activity.unshift({
    id: uid("act"),
    actorName: studentName || "Alex Mercer",
    action: "New Course Booking Secured",
    detail: `Booked ${course.name} on ${date} (${timeSlot}) with ${newBooking.trainerName}.`,
    timestamp: new Date().toISOString()
  });

  saveData(db);
  res.status(201).json(newBooking);
});

// POST /api/payments (Process Payment & Update Status)
app.post('/api/payments', (req, res) => {
  const { bookingId, amount, paymentMethod, cardDetails } = req.body || {};

  const newPayment = {
    id: uid("pay"),
    bookingId: bookingId || "bk_1001",
    amount: amount || 612,
    currency: "USD",
    method: paymentMethod || "Credit Card",
    cardNumberMasked: cardDetails?.cardNumber ? `**** **** **** ${cardDetails.cardNumber.slice(-4)}` : "**** 4242",
    status: "completed",
    transactionId: `TXN_${Date.now()}`,
    date: todayStr(),
    createdAt: new Date().toISOString()
  };

  db.payments.unshift(newPayment);

  db.activity.unshift({
    id: uid("act"),
    actorName: "Payment Gateway",
    action: "Payment Executed & Receipt Issued",
    detail: `Successfully processed ${newPayment.currency} $${newPayment.amount} via ${newPayment.method} (TXN: ${newPayment.transactionId}).`,
    timestamp: new Date().toISOString()
  });

  saveData(db);
  res.status(201).json(newPayment);
});

// POST /api/documents/upload (Simulated Document Upload)
app.post('/api/documents/upload', (req, res) => {
  const { docType, fileName } = req.body || {};

  if (!db.student.documents) db.student.documents = [];

  const existingIdx = db.student.documents.findIndex(d => d.type === docType);
  if (existingIdx >= 0) {
    db.student.documents[existingIdx] = {
      type: docType,
      filename: fileName || `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      status: "verified",
      verifiedAt: todayStr()
    };
  } else {
    db.student.documents.push({
      type: docType,
      filename: fileName || `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      status: "verified",
      verifiedAt: todayStr()
    });
  }

  db.activity.unshift({
    id: uid("act"),
    actorName: db.student.name,
    action: "Document Upload Verified",
    detail: `Uploaded ${docType} (${fileName || 'document.pdf'}) - Verified by Backend OCR.`,
    timestamp: new Date().toISOString()
  });

  saveData(db);
  res.json({ success: true, documents: db.student.documents });
});

// GET /api/activity
app.get('/api/activity', (req, res) => {
  res.json(db.activity);
});

// Start Express Listener
app.listen(PORT, () => {
  console.log(`Lakshmi Driving Portal Backend running on http://localhost:${PORT}`);
});
