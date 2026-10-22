class MemoryBank {
  constructor() {
    this.events = new Map();
    this.users = new Map();
    this.sessions = new Map();
    this.eventCounter = 1;
    this.userCounter = 1;
  }

  // Event Management
  addEvent(eventData) {
    const eventId = this.eventCounter++;
    const event = {
      id: eventId,
      ...eventData,
      subEvents: [],
      createdAt: new Date()
    };
    this.events.set(eventId, event);
    return event;
  }

  addSubEvent(eventId, subEventData) {
    const event = this.events.get(eventId);
    if (!event) return null;
    
    const subEvent = {
      id: Date.now(),
      ...subEventData,
      createdAt: new Date()
    };
    event.subEvents.push(subEvent);
    return subEvent;
  }

  getAllEvents() {
    return Array.from(this.events.values());
  }

  getEvent(eventId) {
    return this.events.get(eventId);
  }

  // User Management
  addUser(userData) {
    const userId = this.userCounter++;
    const user = {
      id: userId,
      ...userData,
      createdAt: new Date()
    };
    this.users.set(userId, user);
    return user;
  }

  getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // Session Management
  createSession(userId, role) {
    const sessionId = Date.now().toString();
    this.sessions.set(sessionId, { userId, role, createdAt: new Date() });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  // Initialize with default admin and user
  init() {
    this.addUser({
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      name: 'Administrator'
    });
    this.addUser({
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
      name: 'Regular User'
    });
  }
}

module.exports = new MemoryBank();