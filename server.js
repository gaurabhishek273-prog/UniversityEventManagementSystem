require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./config/database');
const { askGemini } = require('./ai/gemini');

const app = express();
const PORT = 3000;

// In-memory data store (fallback if MySQL not available)
const memoryStore = {
  faculty: [
    { Faculty_id: 1, name: 'Dr. John Smith', email: 'faculty@uems.edu', password: 'faculty123', department: 'Computer Science', phone: '9876543210' },
    { Faculty_id: 2, name: 'Dr. Jane Doe', email: 'admin@uems.edu', password: 'admin123', department: 'Administration', phone: '9876543211' }
  ],
  users: [
    { User_id: 1, name: 'BETN1CS24023', email: 'BETN1CS24023@uems.edu', password: 'BETN1CS24023', role: 'student' },
    { User_id: 2, name: 'BETN1CS24033', email: 'BETN1CS24033@uems.edu', password: 'BETN1CS24033', role: 'student' },
    { User_id: 3, name: 'BETN1CS24004', email: 'BETN1CS24004@uems.edu', password: 'BETN1CS24004', role: 'student' },
    { User_id: 4, name: 'BETN1CS24032', email: 'BETN1CS24032@uems.edu', password: 'BETN1CS24032', role: 'student' },
    { User_id: 5, name: 'BETN1CS24006', email: 'BETN1CS24006@uems.edu', password: 'BETN1CS24006', role: 'student' }
  ],
  venues: [
    { Venue_id: 1, name: 'Naad', location: 'Naad Auditorium', capacity: 500 },
    { Venue_id: 2, name: 'LDV 1st floor', location: 'LDV Building 1st Floor', capacity: 200 },
    { Venue_id: 3, name: 'LDV 2nd floor', location: 'LDV Building 2nd Floor', capacity: 200 },
    { Venue_id: 4, name: 'Sports Ground', location: 'Campus Sports Ground', capacity: 1000 },
    { Venue_id: 5, name: 'Mg 1st floor', location: 'MG Building 1st Floor', capacity: 150 },
    { Venue_id: 6, name: 'Mg 2nd floor', location: 'MG Building 2nd Floor', capacity: 150 },
    { Venue_id: 7, name: 'Seminar hall(Mg506)', location: 'MG Building Room 506', capacity: 100 },
    { Venue_id: 8, name: 'LDV seminar hall', location: 'LDV Building Seminar Hall', capacity: 80 }
  ],
  discountSchemes: [
    { Scheme_id: 1, name: 'Student Discount', discount_percentage: 20.00 },
    { Scheme_id: 2, name: 'Early Bird', discount_percentage: 15.00 }
  ],
  events: [],
  subEvents: [],
  registrations: [],
  feedback: [],
  eventCounter: 1,
  subEventCounter: 1,
  registrationCounter: 1,
  feedbackCounter: 1
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use(session({
  secret: 'uems-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ==================== AI EVENT ASSISTANT ====================

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question } = req.body;

// Current date for date-based AI searches
const today = new Date();

const todayDate = today.toISOString().split('T')[0];

const next7DaysDate = new Date(today);
next7DaysDate.setDate(next7DaysDate.getDate() + 7);

const next7Days = next7DaysDate.toISOString().split('T')[0];

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a question.'
      });
    }

// Get event information from MySQL
const [events] = await db.query(`
  SELECT
    e.Event_id,
    e.title,
    e.description,
    e.start_date,
    e.end_date,
    e.start_time,
    e.end_time,
    e.status,

    e.Faculty_id,
    f.name AS faculty_name,
    f.department AS department,

    e.coordinator_name,
    e.coordinator_phone,

    e.Venue_id,
    v.name AS venue_name,
    v.location AS venue_location,
    v.capacity AS venue_capacity,
    v.facilities AS venue_facilities,

    e.Scheme_id

  FROM event e

  LEFT JOIN faculty f
    ON e.Faculty_id = f.Faculty_id

  LEFT JOIN venue v
    ON e.Venue_id = v.Venue_id

  ORDER BY e.start_date ASC, e.start_time ASC
`);
    // Convert database results into text for Gemini
    const context =
     JSON.stringify(events, null, 2);
     // Smart Event Search instructions
const smartSearchInstructions = `
You are the UEMS AI Event Management Assistant.

Use ONLY the event data provided in the database context.

When the user asks about events:
- Today's date is ${todayDate}.
- The next 7 days are from ${todayDate} to ${next7Days}.
- "this week" means events between ${todayDate} and ${next7Days}.
- "upcoming" means events after ${todayDate}.
- "tomorrow" means the day after ${todayDate}.
- If the user mentions a venue, filter by venue name.
- If the user mentions a department such as Computer Science, filter by department.
- If the user asks for free events, only show events that are free if payment information is available.
- If no matching events exist, clearly say that no matching events were found.
- Never invent an event, venue, coordinator, date, or registration number.

Give concise answers and include useful details such as:
event name, date, time, venue, coordinator, and status.
`;

    // Ask Gemini
    
    const answer = await askGemini(
  `${smartSearchInstructions}

User question:
${question}

Database context:
${context}`,
  context
);

    res.json({
      success: true,
      answer: answer
    });

  } catch (error) {
    console.error('AI Chat Error:', error);

    res.status(500).json({
      success: false,
      message: 'AI assistant could not process your request.'
    });
  }
});



// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  next();
};

const requireFaculty = (req, res, next) => {
  if (!req.session.userId || req.session.userType !== 'faculty') {
    return res.status(403).json({ error: 'Faculty access required' });
  }
  next();
};

// Routes
app.post('/api/login', async (req, res) => {
  const { email, password, userType } = req.body;
  
  console.log('Login attempt:', { email, password, userType });
  console.log('Available faculty:', memoryStore.faculty);
  console.log('Available users:', memoryStore.users);
  
  try {
    let user = null;
    
    if (userType === 'faculty') {
      user = memoryStore.faculty.find(f => f.email === email && f.password === password);
      console.log('Faculty search result:', user);
      if (user) {
        req.session.userId = user.Faculty_id;
        req.session.userType = 'faculty';
        req.session.userName = user.name;
      }
    } else {
      user = memoryStore.users.find(u => u.email === email && u.password === password);
      console.log('User search result:', user);
      if (user) {
        req.session.userId = user.User_id;
        req.session.userType = 'user';
        req.session.userName = user.name;
      }
    }
    
    if (user) {
      console.log('Login successful for:', user.name);
      res.json({ success: true, userType, name: user.name });
    } else {
      console.log('Login failed - no matching user found');
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.log('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Validation functions
const validateDateTime = (startDate, endDate, startTime, endTime) => {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  const now = new Date();
  
  if (start < now) return 'Event cannot be scheduled in the past';
  if (start >= end) return 'End date/time must be after start date/time';
  return null;
};

const checkVenueConflict = (venueId, startDate, endDate, startTime, endTime, excludeEventId = null) => {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);
  
  return memoryStore.events.some(event => {
    if (excludeEventId && event.Event_id === excludeEventId) return false;
    if (event.Venue_id !== parseInt(venueId)) return false;
    
    const eventStart = new Date(`${event.start_date}T${event.start_time}`);
    const eventEnd = new Date(`${event.end_date}T${event.end_time}`);
    
    return (start < eventEnd && end > eventStart);
  });
};

// Event management
app.post('/api/events', requireFaculty, async (req, res) => {
  try {
  const { title, description, start_date, end_date, start_time, end_time, venue_name, scheme_id, coordinator_name, coordinator_phone, budget, sponsor, media, is_paid, price, discount_attendance, discount_exam_score, discount_amount } = req.body;
  
  // Validate required fields
  if (!coordinator_name) {
    return res.status(400).json({ error: 'Coordinator name is required' });
  }
  
  if (!coordinator_phone) {
    return res.status(400).json({ error: 'Coordinator phone is required' });
  }
  
  // Validate pricing
  if (is_paid && (!price || price <= 0)) {
    return res.status(400).json({ error: 'Price is required for paid events' });
  }
  
  // Validate date/time
  const dateError = validateDateTime(start_date, end_date, start_time, end_time);
  if (dateError) {
    return res.status(400).json({ error: dateError });
  }

  // Find the selected venue in MySQL
const [venues] = await db.query(
  'SELECT Venue_id, name FROM venue WHERE name = ?',
  [venue_name]
);

if (venues.length === 0) {
  return res.status(400).json({
    error: 'Selected venue was not found in database'
  });
}

const venueId = venues[0].Venue_id;
  
  const event = {
    Event_id: memoryStore.eventCounter++,
    title,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    Faculty_id: req.session.userId,
    Venue_id: venueId,
    venue_name: venue_name,
    Scheme_id: scheme_id ? parseInt(scheme_id) : null,
    coordinator_name: coordinator_name,
    coordinator_phone: coordinator_phone,
    budget: budget ? parseFloat(budget) : null,
    sponsor: sponsor || null,
    media: media || null,
    is_paid: is_paid || false,
    price: is_paid ? parseFloat(price) : 0,
    discount_attendance: discount_attendance ? parseFloat(discount_attendance) : null,
    discount_exam_score: discount_exam_score ? parseFloat(discount_exam_score) : null,
    discount_amount: discount_amount ? parseFloat(discount_amount) : null,
    status: 'planned',
    subEvents: []
  };
  
// Save event to MySQL
const [result] = await db.query(
  `INSERT INTO event
   (title, description, start_date, end_date, start_time, end_time,
    status, Faculty_id, Venue_id, Scheme_id,
    coordinator_name, coordinator_phone)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    title,
    description || null,
    start_date,
    end_date,
    start_time,
    end_time,
    'planned',
    req.session.userId,
    venueId,
    scheme_id ? parseInt(scheme_id) : null,
    coordinator_name || 'Not available',
    coordinator_phone || ''
  ]
);

// Keep it in memoryStore for the existing frontend
event.Event_id = result.insertId;
memoryStore.events.push(event);

res.json({
  success: true,
  eventId: result.insertId
});

  } catch (error) {
    console.error('CREATE EVENT ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.get('/api/events', async (req, res) => {
  try {
    const [events] = await db.query(`
      SELECT
        e.Event_id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.start_time,
        e.end_time,
        e.status,

        e.Faculty_id,

        e.coordinator_name,
        e.coordinator_phone,

        e.Venue_id,
        v.name AS venue_name,
        v.location AS venue_location,
        v.capacity AS venue_capacity,
        v.facilities AS venue_facilities,

        e.Scheme_id

      FROM event e

      LEFT JOIN venue v
        ON e.Venue_id = v.Venue_id

      ORDER BY e.start_date ASC, e.start_time ASC
    `);
     
    res.json(events);

  } catch (error) {
    console.error('Events loading error:', error);

    res.status(500).json({
      error: 'Failed to load events',
      details: error.message
    });
  }
});
app.post('/api/events/:eventId/subevents', requireFaculty, async (req, res) => {
  const { eventId } = req.params;
  const { title, description, location } = req.body;
  
  const event = memoryStore.events.find(e => e.Event_id === parseInt(eventId));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const subEvent = {
    SubEvent_id: memoryStore.subEventCounter++,
    title,
    description,
    location,
    Event_id: parseInt(eventId)
  };
  
  event.subEvents.push(subEvent);
  res.json({ success: true });
});


app.get('/api/venues', async (req, res) => {
  try {
    const [venues] = await db.query(
      'SELECT Venue_id, name, location, capacity, facilities FROM venue ORDER BY Venue_id'
    );

    res.json(venues);
  } catch (error) {
    console.error('Venues loading error:', error);
    res.status(500).json({
      error: 'Failed to load venues'
    });
  }
});
app.get('/api/discount-schemes', async (req, res) => {
  res.json(memoryStore.discountSchemes);
});

// Admin endpoints
app.get('/api/registrations/:eventId', requireFaculty, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const eventRegistrations = memoryStore.registrations.filter(r => r.Event_id === eventId);
  res.json(eventRegistrations);
});

app.get('/api/feedback/:eventId', requireFaculty, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const eventFeedback = memoryStore.feedback.filter(f => f.Event_id === eventId);
  res.json(eventFeedback);
});

app.get('/api/all-registrations', requireFaculty, async (req, res) => {
  const registrationsWithEvents = memoryStore.registrations.map(reg => {
    const event = memoryStore.events.find(e => e.Event_id === reg.Event_id);
    return {
      ...reg,
      event_title: event ? event.title : 'Unknown Event'
    };
  });
  res.json(registrationsWithEvents);
});

app.get('/api/download-registrations/:eventId', requireFaculty, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const event = memoryStore.events.find(e => e.Event_id === eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const eventRegistrations = memoryStore.registrations.filter(r => r.Event_id === eventId);
    
    if (eventRegistrations.length === 0) {
      return res.status(404).json({ error: 'No registrations found for this event' });
    }
    
    const registrationsWithDetails = eventRegistrations.map(reg => ({
      'Student Name': reg.name,
      'Roll Number': reg.rollNo,
      'Branch': reg.branch,
      'Mobile': reg.mobile,
      'Email': reg.email,
      'Event Title': event.title,
      'Event Date': `${event.start_date} to ${event.end_date}`,
      'Event Time': `${event.start_time} - ${event.end_time}`,
      'Venue': event.venue_name,
      'Coordinator': event.coordinator_name,
      'Coordinator Phone': event.coordinator_phone,
      'Budget': event.budget ? `₹${event.budget}` : 'N/A',
      'Sponsor': event.sponsor || 'N/A',
      'Event Type': event.is_paid ? `Paid (₹${event.price})` : 'Free',
      'Final Price Paid': `₹${reg.final_price || 0}`,
      'Discount Applied': reg.discount_applied ? 'Yes' : 'No',
      'Attendance %': reg.attendance || 'N/A',
      'Exam Score %': reg.exam_score || 'N/A',
      'Registration Date': new Date(reg.registration_date).toLocaleDateString()
    }));
    
    const headers = Object.keys(registrationsWithDetails[0]);
    const csvContent = [
      headers.join(','),
      ...registrationsWithDetails.map(row => 
        headers.map(header => `"${row[header]}"`).join(',')
      )
    ].join('\n');
    
    const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_registrations.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate download' });
  }
});

app.put('/api/events/:eventId', requireFaculty, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const { title, description, start_date, end_date, start_time, end_time, venue_name, coordinator_name, coordinator_phone, budget, sponsor, media, status, is_paid, price, discount_attendance, discount_exam_score, discount_amount } = req.body;
  
  const event = memoryStore.events.find(e => e.Event_id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  // If updating date/time/venue, validate
  if (start_date && end_date && start_time && end_time) {
    const dateError = validateDateTime(start_date, end_date, start_time, end_time);
    if (dateError) {
      return res.status(400).json({ error: dateError });
    }
    
    // Venue conflict checking removed for manual venue names
  }
  
  // Update fields
  if (title) event.title = title;
  if (description) event.description = description;
  if (start_date) event.start_date = start_date;
  if (end_date) event.end_date = end_date;
  if (start_time) event.start_time = start_time;
  if (end_time) event.end_time = end_time;
  if (venue_name) event.venue_name = venue_name;
  if (coordinator_name !== undefined) event.coordinator_name = coordinator_name;
  if (coordinator_phone !== undefined) event.coordinator_phone = coordinator_phone;
  if (budget !== undefined) event.budget = budget ? parseFloat(budget) : null;
  if (sponsor !== undefined) event.sponsor = sponsor || null;
  if (media !== undefined) event.media = media || null;
  if (status) event.status = status;
  
  // Handle pricing fields properly
  if (is_paid !== undefined) {
    event.is_paid = is_paid;
    event.price = is_paid && price ? parseFloat(price) : 0;
  }
  if (discount_attendance !== undefined) event.discount_attendance = discount_attendance ? parseFloat(discount_attendance) : null;
  if (discount_exam_score !== undefined) event.discount_exam_score = discount_exam_score ? parseFloat(discount_exam_score) : null;
  if (discount_amount !== undefined) event.discount_amount = discount_amount ? parseFloat(discount_amount) : null;
  
  res.json({ success: true });
});

app.delete('/api/events/:eventId', requireFaculty, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  
  memoryStore.events = memoryStore.events.filter(e => e.Event_id !== eventId);
  memoryStore.registrations = memoryStore.registrations.filter(r => r.Event_id !== eventId);
  memoryStore.feedback = memoryStore.feedback.filter(f => f.Event_id !== eventId);
  
  res.json({ success: true });
});

app.put('/api/events/:eventId/subevents/:subEventId', requireFaculty, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const subEventId = parseInt(req.params.subEventId);
  const { title, description, location } = req.body;
  
  const event = memoryStore.events.find(e => e.Event_id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  const subEvent = event.subEvents.find(sub => sub.SubEvent_id === subEventId);
  if (!subEvent) {
    return res.status(404).json({ error: 'Sub-event not found' });
  }
  
  // Update sub-event fields
  if (title) subEvent.title = title;
  if (description) subEvent.description = description;
  if (location) subEvent.location = location;
  
  res.json({ success: true });
});

app.delete('/api/events/:eventId/subevents/:subEventId', requireFaculty, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const subEventId = parseInt(req.params.subEventId);
  
  const event = memoryStore.events.find(e => e.Event_id === eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  event.subEvents = event.subEvents.filter(sub => sub.SubEvent_id !== subEventId);
  res.json({ success: true });
});

// User registration for events
app.post('/api/register/:eventId', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'user') {
      return res.status(403).json({ error: 'User login required' });
    }
    
    const eventId = parseInt(req.params.eventId);
    const { name, rollNo, branch, mobile, email, attendance, exam_score } = req.body;
    
    // Validate required fields
    if (!name || !rollNo || !branch || !mobile || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Server-side validation - allow common name characters
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2-50 characters' });
    }
    if (!/^[A-Za-z\s.''-]+$/.test(name)) {
      return res.status(400).json({ error: 'Name contains invalid characters' });
    }
    
    if (!/^BETN1CS24[0-9]{3}$/.test(rollNo)) {
      return res.status(400).json({ error: 'Invalid roll number format. Use format: BETN1CS24XXX' });
    }
    
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if user already registered for this event (by User_id)
    const existing = memoryStore.registrations.find(r => r.User_id === req.session.userId && r.Event_id === eventId);
    if (existing) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }
    
    const event = memoryStore.events.find(e => e.Event_id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Calculate final price with discount
    let finalPrice = event.price || 0;
    let discountApplied = false;
    let discountAmountApplied = 0;
    
    if (event.is_paid && (event.discount_attendance || event.discount_exam_score) && event.discount_amount) {
      const attendanceQualifies = event.discount_attendance && attendance >= event.discount_attendance;
      const examQualifies = event.discount_exam_score && exam_score >= event.discount_exam_score;
      
      if (attendanceQualifies || examQualifies) {
        discountAmountApplied = event.discount_amount;
        finalPrice = Math.max(0, finalPrice - discountAmountApplied);
        discountApplied = true;
      }
    }
    
    const registration = {
      Registration_id: memoryStore.registrationCounter++,
      User_id: req.session.userId,
      Event_id: eventId,
      name: name,
      rollNo: rollNo,
      branch: branch,
      mobile: mobile,
      email: email,
      attendance: attendance || null,
      exam_score: exam_score || null,
      final_price: finalPrice,
      discount_applied: discountApplied,
      discount_amount_applied: discountAmountApplied,
      registration_date: new Date().toISOString(),
      status: 'registered'
    };
    
    memoryStore.registrations.push(registration);
    res.json({ success: true, message: 'Registration successful!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Feedback
app.post('/api/feedback/:eventId', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userType !== 'user') {
      return res.status(403).json({ error: 'User login required' });
    }
    
    const eventId = parseInt(req.params.eventId);
    const userId = req.session.userId;
    const { rating, comments } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }
    
    const user = memoryStore.users.find(u => u.User_id === userId);
    
    // Remove existing feedback if any
    memoryStore.feedback = memoryStore.feedback.filter(f => !(f.User_id === userId && f.Event_id === eventId));
    
    const feedback = {
      Feedback_id: memoryStore.feedbackCounter++,
      User_id: userId,
      Event_id: eventId,
      user_name: user.name,
      user_email: user.email,
      rating: rating,
      comments: comments || '',
      feedback_date: new Date().toISOString()
    };
    
    memoryStore.feedback.push(feedback);
    res.json({ success: true, message: 'Feedback submitted!' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/faculty', requireAuth, (req, res) => {
  if (req.session.userType !== 'faculty') {
    return res.redirect('/user');
  }
  res.sendFile(path.join(__dirname, 'public', 'faculty.html'));
});

app.get('/user', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  if (req.session.userType !== 'faculty') {
    return res.redirect('/user');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`UEMS Server running on http://localhost:${PORT}`);
  console.log('Demo Accounts:');
  console.log('Faculty: faculty@uems.edu / faculty123');
  console.log('Admin: admin@uems.edu / admin123');
  console.log('Students:');
  console.log('  BETN1CS24023@uems.edu / BETN1CS24023');
  console.log('  BETN1CS24033@uems.edu / BETN1CS24033');
  console.log('  BETN1CS24004@uems.edu / BETN1CS24004');
  console.log('  BETN1CS24032@uems.edu / BETN1CS24032');
  console.log('  BETN1CS24006@uems.edu / BETN1CS24006');
});