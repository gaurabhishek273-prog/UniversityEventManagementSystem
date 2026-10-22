# University Event Management System (UEMS)

A complete event management system for universities based on the provided ER diagram relationships.

## Database Schema

The system implements the exact ER relationships:

1. **Faculty (1) — (N) Event** - Faculty coordinates events
2. **Event (1) — (N) SubEvent** - Events can have sub-events
3. **Event (N) — (1) Venue** - Events held in venues
4. **Event (1) — (1) Budget** - Each event has budget
5. **Event (1) — (N) Sponsor** - Events can have sponsors
6. **Event (1) — (N) Committee** - Events have committees
7. **Committee (1) — (N) Member** - Committees have members
8. **Member (N) — (1) User** - Members are users
9. **User (M) — (N) Event** - Users register for events
10. **User (M) — (N) Event** - Users give feedback
11. **DiscountScheme (1) — (N) Event** - Discount schemes for events
12. **BudgetCategory (1) — (N) Budget** - Budget categories

## Setup Instructions

### 1. Database Setup
```sql
-- Import the schema
mysql -u root -p < database/schema.sql
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Database
Edit `config/database.js` with your MySQL credentials:
```javascript
const dbConfig = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'uems'
};
```

### 4. Start Server
```bash
npm start
```

### 5. Access Application
Open browser to `http://localhost:3000`

## Demo Accounts

### Faculty/Admin Accounts:
- **Faculty:** faculty@uems.edu / faculty123
- **Admin:** admin@uems.edu / admin123

### Student Accounts:
- **BETN1CS24023:** BETN1CS24023@uems.edu / BETN1CS24023
- **BETN1CS24033:** BETN1CS24033@uems.edu / BETN1CS24033
- **BETN1CS24004:** BETN1CS24004@uems.edu / BETN1CS24004
- **BETN1CS24032:** BETN1CS24032@uems.edu / BETN1CS24032
- **BETN1CS24006:** BETN1CS24006@uems.edu / BETN1CS24006

## Features

### Faculty Dashboard
- Create events with venue selection
- Add sub-events to existing events
- Apply discount schemes
- View all events and sub-events

### User Portal
- View all available events
- Register for events
- Submit feedback and ratings
- View event details and sub-events

### Database Features
- Complete relational structure
- Foreign key constraints
- Sample data included
- Support for all ER relationships

## API Endpoints

### Authentication
- `POST /api/login` - User/Faculty login
- `POST /api/logout` - Logout

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (faculty only)
- `POST /api/events/:id/subevents` - Add sub-event

### User Actions
- `POST /api/register/:eventId` - Register for event
- `POST /api/feedback/:eventId` - Submit feedback

### Data
- `GET /api/venues` - Get all venues
- `GET /api/discount-schemes` - Get discount schemes

## File Structure

```
event m/
├── server.js              # Main server file
├── package.json           # Dependencies
├── config/
│   └── database.js        # Database configuration
├── database/
│   └── schema.sql         # Complete database schema
├── public/
│   ├── login.html         # Login page
│   ├── faculty.html       # Faculty dashboard
│   └── user.html          # User portal
└── README.md              # Documentation
```

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript
- **Session Management:** Express-session
- **Database Driver:** mysql2

## Database Tables

1. Faculty, User, Venue, BudgetCategory, DiscountScheme
2. Event (references Faculty, Venue, DiscountScheme)
3. SubEvent (references Event)
4. Budget (references Event, BudgetCategory)
5. Sponsor, Committee (reference Event)
6. Member (references Committee, User)
7. Registration, Feedback (Many-to-Many tables)

The system fully implements the provided ER diagram with proper foreign key relationships and constraints.