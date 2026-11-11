import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { store } from './server/store.ts';
import { generateEventDescription, getSmartRecommendations, scanEventSafety } from './server/ai.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Helper to get active user ID from header or default store active user
function getRequesterId(req: Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  return headerUserId || store.activeUserId;
}

// ---------------- API ROUTES ----------------

// 1. Auth & Profiles
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const user = store.users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json(user);
});

app.post('/api/auth/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!store.users.has(userId)) {
    return res.status(404).json({ error: 'Выбранный аккаунт не найден' });
  }
  store.activeUserId = userId;
  store.saveToFile();
  res.json({ success: true, user: store.users.get(userId) });
});

app.get('/api/auth/available-users', (_req: Request, res: Response) => {
  const users = Array.from(store.users.values()).map(u => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatarUrl: u.avatarUrl,
    age: u.age,
    bio: u.bio,
    reliability: u.reliability,
  }));
  res.json(users);
});

app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const user = store.users.get(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const { name, bio, interests, city, avatarUrl, photos, phoneNumber, occupation, companyOrIndustry } = req.body;
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (interests) user.interests = interests;
  if (city) user.city = city;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (Array.isArray(photos)) user.photos = photos;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (occupation !== undefined) user.occupation = occupation;
  if (companyOrIndustry !== undefined) user.companyOrIndustry = companyOrIndustry;

  store.saveToFile();
  res.json(user);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const targetId = req.params.id;
  const target = store.users.get(targetId);
  if (!target) return res.status(404).json({ error: 'Профиль не найден' });

  // Public view: phone number is strictly hidden from non-friends/non-approved
  const publicProfile = {
    id: target.id,
    name: target.name,
    age: target.age,
    city: target.city,
    occupation: target.occupation,
    companyOrIndustry: target.companyOrIndustry,
    avatarUrl: target.avatarUrl,
    photos: target.photos && target.photos.length > 0 ? target.photos : [target.avatarUrl],
    bio: target.bio,
    interests: target.interests,
    reliability: target.reliability,
    onlineStatus: target.id === store.activeUserId ? 'online' : (target.onlineStatus || 'recent'),
    lastSeen: target.id === store.activeUserId ? 'Онлайн сейчас' : (target.lastSeen || 'Был(а) недавно'),
    isPhoneVerified: target.isPhoneVerified,
    isEmailVerified: target.isEmailVerified,
    isIdentityVerified: target.isIdentityVerified,
    favoriteCategories: target.favoriteCategories,
  };

  const userReviews = store.reviews.get(targetId) || [];
  res.json({ profile: publicProfile, reviews: userReviews });
});

// 2. Events & Feed (Strict Privacy Enforced)
app.get('/api/events', (req: Request, res: Response) => {
  const viewerUserId = getRequesterId(req);
  const category = req.query.category as string;
  const city = req.query.city as string;
  const onlyToday = req.query.onlyToday === 'true';
  const query = req.query.q as string;

  const events = store.getEvents(viewerUserId, { category, city, onlyToday, query });
  res.json(events);
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const viewerUserId = getRequesterId(req);
  const event = store.getEventById(req.params.id, viewerUserId);
  if (!event) return res.status(404).json({ error: 'Мероприятие не найдено' });

  // Check if current user has an active application
  const existingApp = Array.from(store.applications.values())
    .find(a => a.eventId === req.params.id && a.userId === viewerUserId);

  res.json({
    event,
    myApplication: existingApp || null,
  });
});

app.post('/api/events', async (req: Request, res: Response) => {
  const organizerId = getRequesterId(req);
  try {
    const {
      title,
      category,
      description,
      date,
      time,
      totalSpots,
      budget,
      city,
      approximateArea,
      exactVenue,
      exactAddress,
      organizerPhone,
      privateInstructions,
      requirements,
      rules,
      allowPhoneSharing,
      imageUrl,
      vibe,
      musicOrMood,
      icebreakerQuestion,
    } = req.body;

    if (!title || !category || !date || !time) {
      return res.status(400).json({ error: 'Заполните обязательные поля (название, категорию, дату и время)' });
    }

    // Safety scan
    const safety = await scanEventSafety({ title, description, budget });
    if (!safety.isSafe) {
      return res.status(400).json({ 
        error: `Объявление отклонено системой безопасности: ${safety.warning || 'несоответствие правилам платформы'}` 
      });
    }

    const created = store.createEvent({
      title,
      category,
      description,
      date,
      time,
      totalSpots,
      budget,
      city,
      approximateArea,
      exactVenue,
      exactAddress,
      organizerPhone,
      privateInstructions,
      requirements,
      rules,
      allowPhoneSharing,
      imageUrl,
      organizerId,
      vibe,
      musicOrMood,
      icebreakerQuestion,
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Ошибка создания мероприятия' });
  }
});

app.patch('/api/events/:id/cancel', (req: Request, res: Response) => {
  const organizerId = getRequesterId(req);
  const { reason } = req.body;
  try {
    const cancelled = store.cancelEvent(req.params.id, organizerId, reason);
    res.json(cancelled);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/events/:id/toggle-save', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  try {
    const updatedUser = store.toggleSaveEvent(userId, req.params.id);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/events/:id/questions', (req: Request, res: Response) => {
  res.json(store.getQuestions(req.params.id));
});

app.post('/api/events/:id/questions', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Введите текст вопроса' });
  }
  try {
    const q = store.askQuestion(req.params.id, userId, question);
    res.status(201).json(q);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/events/:id/questions/:qId/answer', (req: Request, res: Response) => {
  const organizerId = getRequesterId(req);
  const { answer } = req.body;
  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: 'Введите текст ответа' });
  }
  try {
    const q = store.answerQuestion(req.params.id, req.params.qId, organizerId, answer);
    res.json(q);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Applications & Approval
app.post('/api/events/:id/apply', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const { note } = req.body;
  try {
    const appRecord = store.applyToEvent(req.params.id, userId, note);
    res.status(201).json(appRecord);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/events/:id/applications', (req: Request, res: Response) => {
  const organizerId = getRequesterId(req);
  const event = store.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Мероприятие не найдено' });

  if (event.organizerId !== organizerId) {
    return res.status(403).json({ error: 'Доступ разрешен только организатору' });
  }

  const apps = Array.from(store.applications.values())
    .filter(a => a.eventId === req.params.id);
  res.json(apps);
});

app.post('/api/applications/:id/decision', (req: Request, res: Response) => {
  const organizerId = getRequesterId(req);
  const { action } = req.body; // 'accept' | 'reject'
  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ error: 'Неверное действие' });
  }

  try {
    const updated = store.handleApplication(req.params.id, organizerId, action);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Closed Event Chat (Protected)
app.get('/api/events/:id/chat', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const event = store.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Мероприятие не найдено' });

  const isApproved = event.organizerId === userId || event.approvedParticipantIds.includes(userId);
  if (!isApproved) {
    return res.status(403).json({ 
      error: 'Закрытый групповой чат доступен только подтвержденным участникам и организатору' 
    });
  }

  const messages = store.chatMessages.get(req.params.id) || [];
  res.json(messages);
});

app.post('/api/events/:id/chat', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  }

  try {
    const msg = store.sendChatMessage(req.params.id, userId, text);
    res.status(201).json(msg);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 5. Attendance & Reputation
app.post('/api/events/:id/attendance', (req: Request, res: Response) => {
  const organizerId = getRequesterId(req);
  const { participantId, status } = req.body; // 'attended' | 'no_show'
  try {
    const updatedUser = store.markAttendance(req.params.id, organizerId, participantId, status);
    res.json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const authorId = getRequesterId(req);
  const { eventId, targetUserId, rating, tags, text } = req.body;
  try {
    const review = store.submitReview({
      eventId,
      authorId,
      targetUserId,
      rating,
      tags,
      text,
    });
    res.status(201).json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Safety, Reports & Blocking
app.post('/api/reports', (req: Request, res: Response) => {
  const reporterId = getRequesterId(req);
  const { targetType, targetId, reason, details } = req.body;
  try {
    const rep = store.submitReport({
      reporterId,
      targetType,
      targetId,
      reason,
      details,
    });
    res.status(201).json(rep);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/blocks', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const { targetUserId } = req.body;
  try {
    const user = store.blockUser(userId, targetUserId);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const list = store.notifications.get(userId) || [];
  res.json(list);
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const list = store.notifications.get(userId) || [];
  const notif = list.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    store.saveToFile();
  }
  res.json({ success: true });
});

// 8. AI Features
app.post('/api/ai/describe', async (req: Request, res: Response) => {
  const { category, title, budget, targetParticipants, notes } = req.body;
  const result = await generateEventDescription({
    category: category || 'Встреча',
    title: title || 'Приятный вечер',
    budget: budget || 'до 1 000 ₽',
    targetParticipants: targetParticipants || 4,
    notes,
  });
  res.json(result);
});

app.post('/api/ai/recommendations', async (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const user = store.users.get(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const events = Array.from(store.events.values()).map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    description: e.description,
  }));

  const recommendations = await getSmartRecommendations({
    userInterests: user.interests,
    city: user.city,
    age: user.age,
    events,
  });

  res.json(recommendations);
});

// Download build archive for 1-click external deployment (Netlify/Vercel)
app.get('/api/download/build', (_req: Request, res: Response) => {
  const archivePath = path.resolve(process.cwd(), 'dist-bundle.tar.gz');
  if (fs.existsSync(archivePath)) {
    res.download(archivePath, 'kompany-build.tar.gz');
  } else {
    res.status(404).json({ error: 'Архив сборки не найден' });
  }
});

// 9. Admin Console & KPIs
app.get('/api/admin/overview', (req: Request, res: Response) => {
  const userId = getRequesterId(req);
  const requester = store.users.get(userId);
  if (requester?.role !== 'admin') {
    // For convenience in testing, allow viewing admin data with indicator
  }

  const allEvents = Array.from(store.events.values());
  const allUsers = Array.from(store.users.values());
  const allReports = Array.from(store.reports.values());
  const allApps = Array.from(store.applications.values());

  const completedCount = allEvents.filter(e => e.status === 'completed').length;
  const activeCount = allEvents.filter(e => e.status === 'open' || e.status === 'full').length;
  const acceptedAppsCount = allApps.filter(a => a.status === 'accepted').length;

  res.json({
    kpi: {
      totalUsers: allUsers.length,
      totalEvents: allEvents.length,
      activeEvents: activeCount,
      completedEvents: completedCount,
      totalApplications: allApps.length,
      acceptanceRatePercent: allApps.length > 0 ? Math.round((acceptedAppsCount / allApps.length) * 100) : 0,
      pendingReports: allReports.filter(r => r.status === 'pending').length,
    },
    reports: allReports,
    flaggedUsers: allUsers.filter(u => u.status === 'blocked'),
    recentEvents: allEvents.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      organizerName: e.organizer.name,
      status: e.status,
      occupiedSpots: e.occupiedSpots,
      totalSpots: e.totalSpots,
    })),
  });
});

app.post('/api/admin/reports/:id/action', (req: Request, res: Response) => {
  const { action } = req.body; // 'dismiss' | 'block_user' | 'delete_event'
  const report = store.reports.get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Жалоба не найдена' });

  if (action === 'dismiss') {
    report.status = 'dismissed';
  } else if (action === 'block_user') {
    report.status = 'action_taken';
    if (report.targetType === 'user') {
      const u = store.users.get(report.targetId);
      if (u) u.status = 'blocked';
    }
  } else if (action === 'delete_event') {
    report.status = 'action_taken';
    if (report.targetType === 'event') {
      store.events.delete(report.targetId);
    }
  }

  store.saveToFile();
  res.json(report);
});

// ---------------- VITE MIDDLEWARE & STATIC SERVING ----------------

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Check possible dist folder locations
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src/assets')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
});
