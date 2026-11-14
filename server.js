// server.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// server/store.ts
import fs from "fs";
import path from "path";
var DATA_FILE_PATH = path.resolve(process.cwd(), "server", "data.json");
var DataStore = class {
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.events = /* @__PURE__ */ new Map();
    this.rawEventsSecret = /* @__PURE__ */ new Map();
    this.applications = /* @__PURE__ */ new Map();
    this.chatMessages = /* @__PURE__ */ new Map();
    // eventId -> messages
    this.questions = /* @__PURE__ */ new Map();
    // eventId -> pre-approval Q&A
    this.reviews = /* @__PURE__ */ new Map();
    // targetUserId -> reviews
    this.reports = /* @__PURE__ */ new Map();
    this.notifications = /* @__PURE__ */ new Map();
    // userId -> notifications
    this.activeUserId = "user-anna";
    if (!this.loadFromFile()) {
      this.seedData();
      this.seedExtendedCatalog();
      this.seedQuestions();
      this.seedReviews();
      this.seedDemoApplications();
      this.saveToFile();
    } else {
      this.seedExtendedCatalog();
      this.seedReviews();
      this.seedDemoApplications();
      this.saveToFile();
    }
  }
  loadFromFile() {
    try {
      if (!fs.existsSync(DATA_FILE_PATH)) return false;
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.users || !parsed.events) return false;
      this.users = new Map(parsed.users);
      this.events = new Map(parsed.events);
      this.rawEventsSecret = new Map(parsed.rawEventsSecret || []);
      this.applications = new Map(parsed.applications || []);
      this.chatMessages = new Map(parsed.chatMessages || []);
      this.questions = new Map(parsed.questions || []);
      this.reviews = new Map(parsed.reviews || []);
      this.reports = new Map(parsed.reports || []);
      this.notifications = new Map(parsed.notifications || []);
      this.activeUserId = parsed.activeUserId || "user-anna";
      return true;
    } catch (e) {
      console.warn("Could not load server/data.json, seeding fresh data:", e);
      return false;
    }
  }
  saveToFile() {
    try {
      const payload = {
        users: Array.from(this.users.entries()),
        events: Array.from(this.events.entries()),
        rawEventsSecret: Array.from(this.rawEventsSecret.entries()),
        applications: Array.from(this.applications.entries()),
        chatMessages: Array.from(this.chatMessages.entries()),
        questions: Array.from(this.questions.entries()),
        reviews: Array.from(this.reviews.entries()),
        reports: Array.from(this.reports.entries()),
        notifications: Array.from(this.notifications.entries()),
        activeUserId: this.activeUserId
      };
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to persist store to server/data.json:", e);
    }
  }
  seedData() {
    const anna = {
      id: "user-anna",
      name: "\u0410\u043D\u043D\u0430 \u0412\u043E\u0440\u043E\u043D\u043E\u0432\u0430",
      age: 28,
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      occupation: "\u0410\u0440\u0442-\u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440 & \u0411\u0440\u0435\u043D\u0434-\u0434\u0438\u0437\u0430\u0439\u043D\u0435\u0440",
      companyOrIndustry: "\u041A\u0440\u0435\u0430\u0442\u0438\u0432\u043D\u043E\u0435 \u0430\u0433\u0435\u043D\u0442\u0441\u0442\u0432\u043E",
      avatarUrl: "/src/assets/images/avatar_host_anna_1794332914629.jpg",
      photos: [
        "/src/assets/images/avatar_host_anna_1794332914629.jpg",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
      ],
      bio: "\u041B\u044E\u0431\u043B\u044E \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0435 \u0433\u0430\u0441\u0442\u0440\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043C\u0435\u0441\u0442\u0430, \u0441\u043B\u0443\u0448\u0430\u0442\u044C \u0434\u0436\u0430\u0437 \u0438 \u0441\u043E\u0431\u0438\u0440\u0430\u0442\u044C \u0443\u044E\u0442\u043D\u044B\u0435 \u0434\u0443\u0448\u0435\u0432\u043D\u044B\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438. \u0420\u0430\u0431\u043E\u0442\u0430\u044E \u0432 \u043A\u0440\u0435\u0430\u0442\u0438\u0432\u0435.",
      interests: ["\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D\u044B / \u0411\u0430\u0440\u044B", "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F", "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442", "\u0418\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u043E", "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430"],
      reliability: {
        score: 4.95,
        eventsAttended: 14,
        eventsOrganized: 6,
        cancellations: 0,
        noShows: 0,
        attendanceRate: 100,
        positiveReviewsCount: 18
      },
      onlineStatus: "online",
      lastSeen: "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441",
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: true,
      phoneNumber: "+7 (916) 555-01-92",
      email: "anna.voronova@example.com",
      role: "user",
      status: "active",
      blockedUserIds: [],
      favoriteCategories: ["\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F", "\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440", "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438"],
      savedEventIds: ["ev-2"]
    };
    const mikhail = {
      id: "user-mikhail",
      name: "\u041C\u0438\u0445\u0430\u0438\u043B \u0421\u043E\u043A\u043E\u043B\u043E\u0432",
      age: 29,
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      occupation: "Senior Backend Engineer",
      companyOrIndustry: "FinTech / E-commerce",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      photos: [
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
      ],
      bio: "\u041D\u0435\u0434\u0430\u0432\u043D\u043E \u043F\u0435\u0440\u0435\u0435\u0445\u0430\u043B \u0432 \u041C\u043E\u0441\u043A\u0432\u0443 \u0438\u0437 \u041D\u043E\u0432\u043E\u0441\u0438\u0431\u0438\u0440\u0441\u043A\u0430. \u0423\u0432\u043B\u0435\u043A\u0430\u044E\u0441\u044C \u0441\u043B\u043E\u0436\u043D\u044B\u043C\u0438 \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0430\u043C\u0438, \u0445\u0430\u0439\u043A\u0438\u043D\u0433\u043E\u043C \u0438 \u0445\u043E\u0440\u043E\u0448\u0438\u043C \u043A\u043E\u0444\u0435.",
      interests: ["\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B", "\u041A\u0432\u0438\u0437 / \u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442", "\u0421\u043F\u043E\u0440\u0442", "\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435", "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442"],
      reliability: {
        score: 4.88,
        eventsAttended: 9,
        eventsOrganized: 2,
        cancellations: 1,
        noShows: 0,
        attendanceRate: 95,
        positiveReviewsCount: 10
      },
      onlineStatus: "recent",
      lastSeen: "\u0411\u044B\u043B(\u0430) 15 \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434",
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: false,
      phoneNumber: "+7 (925) 444-12-88",
      email: "mikhail.dev@example.com",
      role: "user",
      status: "active",
      blockedUserIds: [],
      favoriteCategories: ["\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B", "\u0421\u043F\u043E\u0440\u0442"],
      savedEventIds: ["ev-1"]
    };
    const elena = {
      id: "user-elena",
      name: "\u0415\u043B\u0435\u043D\u0430 \u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432\u0430",
      age: 26,
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      occupation: "\u0410\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432",
      companyOrIndustry: "\u0410\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u043D\u043E\u0435 \u0431\u044E\u0440\u043E",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      photos: [
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
      ],
      bio: "\u0410\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440, \u043E\u0431\u043E\u0436\u0430\u044E \u0432\u044B\u0441\u0442\u0430\u0432\u043A\u0438, \u0432\u0438\u043D\u0438\u043B\u043E\u0432\u044B\u0435 \u043F\u043B\u0430\u0441\u0442\u0438\u043D\u043A\u0438 \u0438 \u043F\u0438\u043A\u043D\u0438\u043A\u0438 \u0432 \u043F\u0430\u0440\u043A\u0430\u0445. \u0412\u0441\u0435\u0433\u0434\u0430 \u0437\u0430 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043F\u0440\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F!",
      interests: ["\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438", "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442", "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430", "\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440"],
      reliability: {
        score: 5,
        eventsAttended: 8,
        eventsOrganized: 1,
        cancellations: 0,
        noShows: 0,
        attendanceRate: 100,
        positiveReviewsCount: 9
      },
      onlineStatus: "online",
      lastSeen: "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441",
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: true,
      phoneNumber: "+7 (903) 777-34-21",
      email: "elena.arch@example.com",
      role: "user",
      status: "active",
      blockedUserIds: [],
      favoriteCategories: ["\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438", "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442"],
      savedEventIds: []
    };
    const admin = {
      id: "user-admin",
      name: "\u0421\u043B\u0443\u0436\u0431\u0430 \u0434\u043E\u0432\u0435\u0440\u0438\u044F \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438",
      age: 35,
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      bio: "\u041C\u043E\u0434\u0435\u0440\u0430\u0442\u043E\u0440 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B Kompany. \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0439 \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435 \u0441\u043F\u043E\u0440\u043D\u044B\u0445 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0439.",
      interests: [],
      reliability: {
        score: 5,
        eventsAttended: 50,
        eventsOrganized: 20,
        cancellations: 0,
        noShows: 0,
        attendanceRate: 100,
        positiveReviewsCount: 45
      },
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: true,
      phoneNumber: "+7 (800) 555-35-35",
      email: "security@kompany.app",
      role: "admin",
      status: "active",
      blockedUserIds: [],
      favoriteCategories: [],
      savedEventIds: []
    };
    this.users.set(anna.id, anna);
    this.users.set(mikhail.id, mikhail);
    this.users.set(elena.id, elena);
    this.users.set(admin.id, admin);
    const event1 = {
      id: "ev-1",
      title: "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0432 \u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D\u0435: \u0443\u044E\u0442\u043D\u0430\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F \u0438 \u0437\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u0430",
      category: "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F",
      description: "\u041C\u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F 28 \u043B\u0435\u0442! \u0425\u043E\u0447\u0443 \u0441\u043E\u0431\u0440\u0430\u0442\u044C \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0443\u044E \u0434\u0443\u0448\u0435\u0432\u043D\u0443\u044E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E (5-6 \u0447\u0435\u043B\u043E\u0432\u0435\u043A), \u043F\u043E\u0441\u0438\u0434\u0435\u0442\u044C \u0432 \u043F\u0440\u0438\u044F\u0442\u043D\u043E\u043C \u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D\u0435, \u0432\u043A\u0443\u0441\u043D\u043E \u043F\u043E\u0443\u0436\u0438\u043D\u0430\u0442\u044C, \u043F\u043E\u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F \u0438 \u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442\u044C\u0441\u044F \u0441 \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u043D\u044B\u043C\u0438 \u043B\u044E\u0434\u044C\u043C\u0438. \u041D\u0438\u043A\u0430\u043A\u0438\u0445 \u0444\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0435\u0439 \u2014 \u043F\u0440\u043E\u0441\u0442\u043E \u0442\u0435\u043F\u043B\u043E\u0435 \u043E\u0431\u0449\u0435\u043D\u0438\u0435.",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // TODAY!
      time: "19:30",
      isToday: true,
      totalSpots: 6,
      occupiedSpots: 4,
      budget: "1 000\u20133 000 \u20BD",
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      approximateArea: "\u0425\u0430\u043C\u043E\u0432\u043D\u0438\u043A\u0438, ~2.5 \u043A\u043C \u043E\u0442 \u0446\u0435\u043D\u0442\u0440\u0430",
      distanceKm: 2.5,
      imageUrl: "/src/assets/images/hero_community_event_1794332913246.jpg",
      organizerId: anna.id,
      organizer: {
        id: anna.id,
        name: anna.name,
        age: anna.age,
        avatarUrl: anna.avatarUrl,
        reliability: anna.reliability,
        isPhoneVerified: anna.isPhoneVerified,
        isEmailVerified: anna.isEmailVerified
      },
      status: "open",
      requirements: "23-35 \u043B\u0435\u0442, \u043F\u043E\u0437\u0438\u0442\u0438\u0432\u043D\u044B\u0439 \u043D\u0430\u0441\u0442\u0440\u043E\u0439, \u0432\u0437\u0430\u0438\u043C\u043D\u043E\u0435 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435, \u0431\u0435\u0437 \u0430\u043B\u043A\u043E\u0433\u043E\u043B\u044C\u043D\u044B\u0445 \u043A\u0440\u0430\u0439\u043D\u043E\u0441\u0442\u0435\u0439",
      rules: [
        "\u0421\u0447\u0435\u0442 \u0434\u0435\u043B\u0438\u043C \u043F\u043E\u0440\u043E\u0432\u043D\u0443 \u043F\u043E \u0447\u0435\u043A\u0443 \u0438\u043B\u0438 \u043A\u0430\u0436\u0434\u044B\u0439 \u043F\u043B\u0430\u0442\u0438\u0442 \u0437\u0430 \u0441\u0432\u043E\u0438 \u0431\u043B\u044E\u0434\u0430",
        "\u0423\u0432\u0435\u0434\u043E\u043C\u0438\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C \u0437\u0430 3 \u0447\u0430\u0441\u0430, \u0435\u0441\u043B\u0438 \u043F\u043B\u0430\u043D\u044B \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u0441\u044F",
        "\u0411\u044B\u0442\u044C \u0433\u043E\u0442\u043E\u0432\u044B\u043C \u043A \u043B\u0435\u0433\u043A\u043E\u043C\u0443 \u0438 \u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u043E\u043C\u0443 \u0434\u0438\u0430\u043B\u043E\u0433\u0443"
      ],
      approvedParticipantIds: [elena.id, "user-external-1", "user-external-2"],
      createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
      vibe: "\u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0432\u0430\u0439\u0431",
      musicOrMood: "\u0422\u0435\u043F\u043B\u044B\u0439 \u0441\u0432\u0435\u0442 \u0441\u0432\u0435\u0447\u0435\u0439, \u043D\u0435\u0433\u0440\u043E\u043C\u043A\u0438\u0439 \u043B\u0430\u0443\u043D\u0436 \u0438 \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0430\u044F \u043A\u0443\u0445\u043D\u044F",
      icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u0435 \u0437\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0433\u043E\u0434 \u0437\u0430\u043F\u043E\u043C\u043D\u0438\u043B\u043E\u0441\u044C \u0432\u0430\u043C \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0435\u0433\u043E?"
    };
    this.rawEventsSecret.set(event1.id, {
      exactVenue: '\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D "\u0413\u043E\u0440\u044B\u043D\u044B\u0447", 2 \u044D\u0442\u0430\u0436, \u0432\u0435\u0440\u0430\u043D\u0434\u0430 \u0441 \u043F\u0430\u043D\u043E\u0440\u0430\u043C\u043D\u044B\u043C \u0432\u0438\u0434\u043E\u043C',
      exactAddress: "\u0420\u043E\u0436\u0434\u0435\u0441\u0442\u0432\u0435\u043D\u0441\u043A\u0438\u0439 \u0431\u0443\u043B\u044C\u0432\u0430\u0440, \u0434. 1 (\u043C. \u0422\u0440\u0443\u0431\u043D\u0430\u044F)",
      organizerPhone: "+7 (916) 555-01-92",
      privateInstructions: '\u0421\u0442\u043E\u043B \u0437\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D \u043D\u0430 \u0438\u043C\u044F \u0410\u043D\u043D\u044B. \u041F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0441\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C "\u0413\u043E\u0441\u0442\u0438 \u0410\u043D\u043D\u044B". \u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 \u0433\u043B\u0430\u0432\u043D\u044B\u0439 \u0445\u043E\u043B\u043B.',
      allowPhoneSharing: true
    });
    const event2 = {
      id: "ev-2",
      title: "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B: \u041F\u043E\u043A\u043E\u0440\u0435\u043D\u0438\u0435 \u041C\u0430\u0440\u0441\u0430 \u0438 \u041A\u043E\u0434\u043E\u0432\u044B\u0435 \u0418\u043C\u0435\u043D\u0430",
      category: "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B",
      description: "\u0418\u0449\u0435\u043C 2-3 \u0447\u0435\u043B\u043E\u0432\u0435\u043A \u0441\u044B\u0433\u0440\u0430\u0442\u044C \u0432 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0438! \u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u043E\u0431\u044A\u044F\u0441\u043D\u0438\u043C \u0437\u0430 10 \u043C\u0438\u043D\u0443\u0442, \u043E\u043F\u044B\u0442 \u043D\u0435 \u0432\u0430\u0436\u0435\u043D \u2014 \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u0436\u0435\u043B\u0430\u043D\u0438\u0435 \u043F\u043E\u0434\u0443\u043C\u0430\u0442\u044C \u0438 \u043F\u043E\u0441\u043C\u0435\u044F\u0442\u044C\u0441\u044F. \u0417\u0430\u043A\u0430\u0437\u0430\u043B\u0438 \u0447\u0430\u0439\u043D\u0438\u043A \u0447\u0430\u044F \u0438 \u0434\u0435\u0441\u0435\u0440\u0442\u044B.",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // TODAY!
      time: "18:00",
      isToday: true,
      totalSpots: 5,
      occupiedSpots: 3,
      budget: "\u0434\u043E 1 000 \u20BD",
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      approximateArea: "\u0411\u0430\u0441\u043C\u0430\u043D\u043D\u044B\u0439 \u0440\u0430\u0439\u043E\u043D, ~1.8 \u043A\u043C",
      distanceKm: 1.8,
      imageUrl: "/src/assets/images/event_board_games_1794332913325.jpg",
      organizerId: mikhail.id,
      organizer: {
        id: mikhail.id,
        name: mikhail.name,
        age: mikhail.age,
        avatarUrl: mikhail.avatarUrl,
        reliability: mikhail.reliability,
        isPhoneVerified: mikhail.isPhoneVerified,
        isEmailVerified: mikhail.isEmailVerified
      },
      status: "open",
      requirements: "\u041B\u044E\u0431\u043E\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438, \u043F\u0443\u043D\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
      rules: ["\u041E\u043F\u043B\u0430\u0442\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0432 \u0430\u043D\u0442\u0438\u043A\u0430\u0444\u0435 (~300 \u0440\u0443\u0431/\u0447\u0430\u0441)", "\u0411\u0435\u0440\u0435\u0436\u043D\u043E\u0435 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0435 \u043A \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0430\u043C \u0438\u0433\u0440"],
      approvedParticipantIds: ["user-external-3"],
      createdAt: new Date(Date.now() - 864e5).toISOString(),
      vibe: "\u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0438\u0433\u0440\u0430",
      musicOrMood: "\u0410\u0437\u0430\u0440\u0442\u043D\u0430\u044F \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044F, \u0434\u0440\u0443\u0436\u0435\u0441\u043A\u0438\u0435 \u0448\u0443\u0442\u043A\u0438 \u0438 \u0430\u0440\u043E\u043C\u0430\u0442\u043D\u044B\u0439 \u0443\u043B\u0443\u043D",
      icebreakerQuestion: "\u0412 \u043A\u0430\u043A\u0443\u044E \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0443 \u0438\u043B\u0438 \u0438\u0433\u0440\u0443 \u0432\u044B \u0433\u043E\u0442\u043E\u0432\u044B \u0438\u0433\u0440\u0430\u0442\u044C \u0432\u0441\u044E \u043D\u043E\u0447\u044C \u043D\u0430\u043F\u0440\u043E\u043B\u0435\u0442?"
    };
    this.rawEventsSecret.set(event2.id, {
      exactVenue: '\u0410\u043D\u0442\u0438\u043A\u0430\u0444\u0435 "CheckPoint", \u0437\u0430\u043B "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430", \u0441\u0442\u043E\u043B \u21164',
      exactAddress: "\u041B\u0443\u0431\u044F\u043D\u0441\u043A\u0438\u0439 \u043F\u0440\u043E\u0435\u0437\u0434, 19, \u0441\u0442\u0440. 1 (\u043C. \u041A\u0438\u0442\u0430\u0439-\u0433\u043E\u0440\u043E\u0434)",
      organizerPhone: "+7 (925) 444-12-88",
      privateInstructions: '\u041D\u0430 \u0440\u0435\u0441\u0435\u043F\u0448\u0435\u043D\u0435 \u0441\u043A\u0430\u0437\u0430\u0442\u044C "\u0418\u0433\u0440\u043E\u0432\u043E\u0439 \u0441\u0442\u043E\u043B \u041C\u0438\u0445\u0430\u0438\u043B\u0430". \u0423 \u043D\u0430\u0441 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0441\u0442\u043E\u043B \u0443 \u043E\u043A\u043D\u0430 \u0441 \u0433\u0438\u0440\u043B\u044F\u043D\u0434\u0430\u043C\u0438.',
      allowPhoneSharing: true
    });
    const event3 = {
      id: "ev-3",
      title: "\u0410\u043A\u0443\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0432\u0435\u0447\u0435\u0440 \u0438\u043D\u0434\u0438-\u043C\u0443\u0437\u044B\u043A\u0438 \u0432 \u0443\u044E\u0442\u043D\u043E\u043C \u0431\u0430\u0440\u0435",
      category: "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442",
      description: "\u0412\u044B\u0441\u0442\u0443\u043F\u0430\u0435\u0442 \u043A\u043B\u0430\u0441\u0441\u043D\u044B\u0439 \u0438\u043D\u0434\u0438-\u0434\u0443\u044D\u0442 \u0441 \u0432\u0438\u043E\u043B\u043E\u043D\u0447\u0435\u043B\u044C\u044E \u0438 \u0433\u0438\u0442\u0430\u0440\u043E\u0439. \u041C\u043E\u0438 \u0434\u0440\u0443\u0437\u044C\u044F \u043D\u0435 \u0441\u043C\u043E\u0433\u043B\u0438 \u043F\u043E\u0439\u0442\u0438, \u0430 \u0431\u0438\u043B\u0435\u0442 \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u0435\u0442, \u0434\u0430 \u0438 \u043E\u0434\u043D\u043E\u043C\u0443 \u0441\u043A\u0443\u0447\u043D\u043E. \u0411\u0443\u0434\u0435\u043C \u0441\u043B\u0443\u0448\u0430\u0442\u044C \u0436\u0438\u0432\u0443\u044E \u043C\u0443\u0437\u044B\u043A\u0443 \u0438 \u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0435 \u043B\u0438\u043C\u043E\u043D\u0430\u0434\u044B/\u043D\u0430\u043F\u0438\u0442\u043A\u0438.",
      date: new Date(Date.now() + 864e5).toISOString().split("T")[0],
      // Tomorrow
      time: "20:00",
      isToday: false,
      totalSpots: 4,
      occupiedSpots: 2,
      budget: "1 000\u20133 000 \u20BD",
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      approximateArea: "\u0410\u0440\u0431\u0430\u0442, ~3.2 \u043A\u043C",
      distanceKm: 3.2,
      imageUrl: "/src/assets/images/event_live_concert_1794332915302.jpg",
      organizerId: elena.id,
      organizer: {
        id: elena.id,
        name: elena.name,
        age: elena.age,
        avatarUrl: elena.avatarUrl,
        reliability: elena.reliability,
        isPhoneVerified: elena.isPhoneVerified,
        isEmailVerified: elena.isEmailVerified
      },
      status: "open",
      requirements: "\u041B\u044E\u0431\u043E\u0432\u044C \u043A \u0445\u043E\u0440\u043E\u0448\u0435\u0439 \u0436\u0438\u0432\u043E\u0439 \u043C\u0443\u0437\u044B\u043A\u0435",
      rules: ["\u0412\u0445\u043E\u0434\u043D\u043E\u0439 \u0431\u0438\u043B\u0435\u0442 800 \u0440\u0443\u0431 \u043E\u043F\u043B\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043C\u0435\u0441\u0442\u0435", "\u041F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u0431\u0435\u0437 \u043E\u043F\u043E\u0437\u0434\u0430\u043D\u0438\u0439"],
      approvedParticipantIds: ["user-external-4"],
      createdAt: new Date(Date.now() - 864e5 * 3).toISOString(),
      vibe: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430",
      musicOrMood: "\u0416\u0438\u0432\u0430\u044F \u0432\u0438\u043E\u043B\u043E\u043D\u0447\u0435\u043B\u044C, \u0438\u043D\u0434\u0438-\u0444\u043E\u043B\u043A \u0438 \u043A\u0430\u043C\u0435\u0440\u043D\u0430\u044F \u0430\u043A\u0443\u0441\u0442\u0438\u043A\u0430",
      icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u043A\u043E\u043D\u0446\u0435\u0440\u0442 \u0432 \u0432\u0430\u0448\u0435\u0439 \u0436\u0438\u0437\u043D\u0438 \u043E\u0441\u0442\u0430\u0432\u0438\u043B \u0441\u0430\u043C\u043E\u0435 \u0441\u0438\u043B\u044C\u043D\u043E\u0435 \u0432\u043F\u0435\u0447\u0430\u0442\u043B\u0435\u043D\u0438\u0435?"
    };
    this.rawEventsSecret.set(event3.id, {
      exactVenue: '\u041A\u043B\u0443\u0431-\u0431\u0430\u0440 "Powerhouse", \u043C\u0430\u043B\u044B\u0439 \u0437\u0430\u043B',
      exactAddress: "\u0413\u043E\u043D\u0447\u0430\u0440\u043D\u0430\u044F \u0443\u043B., 7/4 (\u043C. \u0422\u0430\u0433\u0430\u043D\u0441\u043A\u0430\u044F)",
      organizerPhone: "+7 (903) 777-34-21",
      privateInstructions: "\u0412\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0437\u0430 15 \u043C\u0438\u043D\u0443\u0442 \u0434\u043E \u043D\u0430\u0447\u0430\u043B\u0430 \u0443 \u0432\u0445\u043E\u0434\u0430 \u0432\u043E\u0437\u043B\u0435 \u043D\u0435\u043E\u043D\u043E\u0432\u043E\u0439 \u0432\u044B\u0432\u0435\u0441\u043A\u0438.",
      allowPhoneSharing: false
    });
    const event4 = {
      id: "ev-4",
      title: "\u0412\u0435\u0441\u0435\u043D\u043D\u0438\u0439 \u043F\u0438\u043A\u043D\u0438\u043A \u0441 \u0433\u0440\u0438\u043B\u0435\u043C \u0438 \u0444\u0440\u0438\u0441\u0431\u0438 \u0432 \u043F\u0430\u0440\u043A\u0435",
      category: "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438",
      description: "\u041F\u0440\u043E\u0433\u043D\u043E\u0437 \u043E\u0431\u0435\u0449\u0430\u0435\u0442 \u0441\u043E\u043B\u043D\u0446\u0435 \u0438 +18! \u0411\u0435\u0440\u0435\u043C \u043F\u043B\u0435\u0434\u044B, \u043F\u043E\u0440\u0442\u0430\u0442\u0438\u0432\u043D\u044B\u0439 \u0433\u0440\u0438\u043B\u044C, \u043C\u0430\u0440\u0448\u043C\u0435\u043B\u043B\u043E\u0443, \u0431\u0443\u0440\u0433\u0435\u0440\u044B \u0438 \u0442\u0430\u0440\u0435\u043B\u043A\u0443 \u0444\u0440\u0438\u0441\u0431\u0438. \u0421 \u043D\u0430\u0441 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0438 \u043A\u043E\u0441\u0442\u0435\u0440, \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B \u0441\u043A\u0438\u0434\u044B\u0432\u0430\u0435\u043C\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435.",
      date: new Date(Date.now() + 864e5 * 2).toISOString().split("T")[0],
      // In 2 days
      time: "14:00",
      isToday: false,
      totalSpots: 8,
      occupiedSpots: 5,
      budget: "1 000\u20133 000 \u20BD",
      city: "\u041C\u043E\u0441\u043A\u0432\u0430",
      approximateArea: "\u041F\u0430\u0440\u043A \u0413\u043E\u0440\u044C\u043A\u043E\u0433\u043E / \u041D\u0435\u0441\u043A\u0443\u0447\u043D\u044B\u0439 \u0441\u0430\u0434, ~4.1 \u043A\u043C",
      distanceKm: 4.1,
      imageUrl: "/src/assets/images/event_outdoor_picnic_1794332913731.jpg",
      organizerId: anna.id,
      organizer: {
        id: anna.id,
        name: anna.name,
        age: anna.age,
        avatarUrl: anna.avatarUrl,
        reliability: anna.reliability,
        isPhoneVerified: anna.isPhoneVerified,
        isEmailVerified: anna.isEmailVerified
      },
      status: "open",
      requirements: "\u0423\u0434\u043E\u0431\u043D\u0430\u044F \u043E\u0431\u0443\u0432\u044C, \u0442\u0435\u043F\u043B\u0430\u044F \u043A\u043E\u0444\u0442\u0430 \u043D\u0430 \u0432\u0435\u0447\u0435\u0440, \u0433\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u044C \u0430\u043A\u0442\u0438\u0432\u043D\u043E \u0434\u0432\u0438\u0433\u0430\u0442\u044C\u0441\u044F",
      rules: ["\u0423\u0431\u0438\u0440\u0430\u0435\u043C \u0437\u0430 \u0441\u043E\u0431\u043E\u0439 \u0432\u0435\u0441\u044C \u043C\u0443\u0441\u043E\u0440", "\u0421\u0443\u043C\u043C\u0443 \u0437\u0430 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B (~1 200 \u20BD) \u0434\u0435\u043B\u0438\u043C \u043F\u043E\u0440\u043E\u0432\u043D\u0443 \u0432 \u0447\u0430\u0442\u0435"],
      approvedParticipantIds: [elena.id, mikhail.id, "user-external-5"],
      createdAt: new Date(Date.now() - 864e5 * 4).toISOString(),
      vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
      musicOrMood: "\u0421\u043E\u043B\u043D\u0435\u0447\u043D\u0430\u044F \u043F\u043E\u043B\u044F\u043D\u0430, \u0444\u0440\u0438\u0441\u0431\u0438, \u0433\u0440\u0438\u043B\u044C \u0438 \u0438\u043D\u0434\u0438-\u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442 \u043D\u0430 \u043A\u043E\u043B\u043E\u043D\u043A\u0435",
      icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0435 \u0432\u0430\u0448\u0435 \u0438\u0434\u0435\u0430\u043B\u044C\u043D\u043E\u0435 \u043C\u0435\u0441\u0442\u043E \u0434\u043B\u044F \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0433\u043E \u043F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u044F \u043D\u0430 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0435?"
    };
    this.rawEventsSecret.set(event4.id, {
      exactVenue: "\u041D\u0435\u0441\u043A\u0443\u0447\u043D\u044B\u0439 \u0441\u0430\u0434, \u043F\u043E\u043B\u044F\u043D\u0430 \u0432\u043E\u0437\u043B\u0435 \u0410\u043D\u0434\u0440\u0435\u0435\u0432\u0441\u043A\u0438\u0445 \u043F\u0440\u0443\u0434\u043E\u0432",
      exactAddress: "\u041B\u0435\u043D\u0438\u043D\u0441\u043A\u0438\u0439 \u043F\u0440\u043E\u0441\u043F\u0435\u043A\u0442, 18 (\u0432\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 \u043F\u0430\u0440\u043A\u043E\u0432\u0443\u044E \u0430\u043B\u043B\u0435\u044E)",
      organizerPhone: "+7 (916) 555-01-92",
      privateInstructions: "\u0413\u0435\u043E\u043C\u0435\u0442\u043A\u0430 \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u0432 \u0433\u0440\u0443\u043F\u043F\u043E\u0432\u043E\u0439 \u0447\u0430\u0442 \u0437\u0430 30 \u043C\u0438\u043D\u0443\u0442. \u0418\u0449\u0438\u0442\u0435 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0431\u0438\u0440\u044E\u0437\u043E\u0432\u044B\u0439 \u043F\u043B\u0435\u0434 \u0438 \u0441\u0435\u0440\u044B\u0439 \u043C\u0430\u043D\u0433\u0430\u043B.",
      allowPhoneSharing: true
    });
    this.events.set(event1.id, event1);
    this.events.set(event2.id, event2);
    this.events.set(event3.id, event3);
    this.events.set(event4.id, event4);
    const app1 = {
      id: "app-1",
      eventId: event1.id,
      eventTitle: event1.title,
      userId: mikhail.id,
      user: {
        id: mikhail.id,
        name: mikhail.name,
        age: mikhail.age,
        avatarUrl: mikhail.avatarUrl,
        city: mikhail.city,
        bio: mikhail.bio,
        interests: mikhail.interests,
        reliability: mikhail.reliability,
        isPhoneVerified: mikhail.isPhoneVerified,
        isEmailVerified: mikhail.isEmailVerified
      },
      note: "\u041F\u0440\u0438\u0432\u0435\u0442, \u0410\u043D\u043D\u0430! \u041D\u0435\u0434\u0430\u0432\u043D\u043E \u043F\u0435\u0440\u0435\u0435\u0445\u0430\u043B \u0432 \u041C\u043E\u0441\u043A\u0432\u0443, \u043F\u043E\u043A\u0430 \u043A\u0440\u0443\u0433 \u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u0439. \u041E\u0431\u043E\u0436\u0430\u044E \u0432\u043A\u0443\u0441\u043D\u044B\u0435 \u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D\u044B \u0438 \u0434\u0443\u0448\u0435\u0432\u043D\u044B\u0435 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u044B. \u0421 \u0443\u0434\u043E\u0432\u043E\u043B\u044C\u0441\u0442\u0432\u0438\u0435\u043C \u043F\u043E\u0437\u0434\u0440\u0430\u0432\u043B\u044E \u0438 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E!",
      status: "pending",
      createdAt: new Date(Date.now() - 36e5 * 2).toISOString(),
      attendanceStatus: "not_marked"
    };
    this.applications.set(app1.id, app1);
    this.chatMessages.set(event1.id, [
      {
        id: "msg-1",
        eventId: event1.id,
        senderId: anna.id,
        senderName: anna.name,
        senderAvatar: anna.avatarUrl,
        text: "\u0412\u0441\u0435\u043C \u043F\u0440\u0438\u0432\u0435\u0442! \u0421\u043F\u0430\u0441\u0438\u0431\u043E, \u0447\u0442\u043E \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0438\u0441\u044C. \u0421\u0442\u043E\u043B \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D \u043D\u0430 19:30, \u044F \u0431\u0443\u0434\u0443 \u0447\u0443\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0442\u044C \u0432\u0441\u0435\u0445 \u0443 \u0433\u0430\u0440\u0434\u0435\u0440\u043E\u0431\u0430 \u043D\u0430 2 \u044D\u0442\u0430\u0436\u0435.",
        timestamp: "15:20",
        isSystemMessage: false
      },
      {
        id: "msg-2",
        eventId: event1.id,
        senderId: elena.id,
        senderName: elena.name,
        senderAvatar: elena.avatarUrl,
        text: "\u0421\u0443\u043F\u0435\u0440! \u0421 \u0434\u043D\u0435\u043C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0437\u0430\u0440\u0430\u043D\u0435\u0435 \u{1F382} \u0411\u0443\u0434\u0443 \u0440\u043E\u0432\u043D\u043E \u0432\u043E\u0432\u0440\u0435\u043C\u044F!",
        timestamp: "15:25",
        isSystemMessage: false
      },
      {
        id: "msg-3",
        eventId: event1.id,
        senderId: "system",
        senderName: "Kompany Safety",
        senderAvatar: "",
        text: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u043E \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438: \u0442\u043E\u0447\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043E\u0442\u043A\u0440\u044B\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u0430\u043C. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B \u0442\u0440\u0435\u0442\u044C\u0438\u043C \u043B\u0438\u0446\u0430\u043C.",
        timestamp: "15:26",
        isSystemMessage: true
      }
    ]);
    this.seedReviews();
    this.notifications.set(anna.id, [
      {
        id: "notif-1",
        userId: anna.id,
        title: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 \u0443\u0447\u0430\u0441\u0442\u0438\u0435",
        message: '\u041C\u0438\u0445\u0430\u0438\u043B \u0421\u043E\u043A\u043E\u043B\u043E\u0432 (\u0440\u0435\u0439\u0442\u0438\u043D\u0433 4.9, 95% \u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0439) \u0445\u043E\u0447\u0435\u0442 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F \u043A \u0432\u0430\u0448\u0435\u043C\u0443 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044E "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F".',
        type: "application_received",
        relatedEventId: event1.id,
        isRead: false,
        createdAt: new Date(Date.now() - 36e5 * 2).toISOString()
      }
    ]);
    this.notifications.set(mikhail.id, [
      {
        id: "notif-2",
        userId: mikhail.id,
        title: "\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430",
        message: '\u0412\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F" \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0443. \u041E\u0436\u0438\u0434\u0430\u0439\u0442\u0435 \u043E\u0442\u0432\u0435\u0442\u0430.',
        type: "application_received",
        relatedEventId: event1.id,
        isRead: true,
        createdAt: new Date(Date.now() - 36e5 * 2).toISOString()
      }
    ]);
  }
  seedExtendedCatalog() {
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const tomorrowStr = new Date(Date.now() + 864e5).toISOString().split("T")[0];
    const inTwoDaysStr = new Date(Date.now() + 864e5 * 2).toISOString().split("T")[0];
    const inThreeDaysStr = new Date(Date.now() + 864e5 * 3).toISOString().split("T")[0];
    const inFourDaysStr = new Date(Date.now() + 864e5 * 4).toISOString().split("T")[0];
    const extraUsers = [
      {
        id: "user-external-1",
        name: "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u041C\u043E\u0440\u043E\u0437\u043E\u0432",
        age: 30,
        city: "\u041C\u043E\u0441\u043A\u0432\u0430",
        occupation: "\u041F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432\u044B\u0439 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440",
        companyOrIndustry: "IT / \u041C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        photos: [
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
        ],
        bio: "\u041B\u044E\u0431\u043B\u044E \u0433\u0430\u0441\u0442\u0440\u043E\u043D\u043E\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F, \u0441\u043A\u0432\u043E\u0448, \u043F\u0430\u0434\u0435\u043B \u0438 \u043A\u0432\u0438\u0437\u044B \u043F\u043E \u043F\u044F\u0442\u043D\u0438\u0446\u0430\u043C.",
        interests: ["\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440", "\u0421\u043F\u043E\u0440\u0442", "\u041A\u0432\u0438\u0437 / \u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442", "\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435"],
        reliability: {
          score: 4.94,
          eventsAttended: 16,
          eventsOrganized: 4,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 15
        },
        onlineStatus: "online",
        lastSeen: "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441",
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: "dmitry.pm@example.com",
        role: "user",
        status: "active",
        blockedUserIds: []
      },
      {
        id: "user-external-2",
        name: "\u0421\u043E\u0444\u0438\u044F \u041B\u0435\u0431\u0435\u0434\u0435\u0432\u0430",
        age: 25,
        city: "\u041C\u043E\u0441\u043A\u0432\u0430",
        occupation: "\u041A\u0438\u043D\u043E\u043F\u0440\u043E\u0434\u044E\u0441\u0435\u0440 & \u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444",
        companyOrIndustry: "\u041D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u0430\u044F \u0441\u0442\u0443\u0434\u0438\u044F",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        photos: [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
        ],
        bio: "\u0421\u043D\u0438\u043C\u0430\u044E \u043D\u0430 \u043F\u043B\u0435\u043D\u043A\u0443 35\u043C\u043C, \u043A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u0438\u0440\u0443\u044E \u0432\u0438\u043D\u0438\u043B \u0438 \u043E\u0431\u043E\u0436\u0430\u044E \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u043E\u0435 \u043A\u0438\u043D\u043E \u0438 \u043A\u0430\u043C\u0435\u0440\u043D\u044B\u0435 \u043A\u043E\u043D\u0446\u0435\u0440\u0442\u044B.",
        interests: ["\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442", "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430", "\u0418\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u043E", "\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440"],
        reliability: {
          score: 4.98,
          eventsAttended: 12,
          eventsOrganized: 5,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 14
        },
        onlineStatus: "online",
        lastSeen: "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441",
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: "sofia.film@example.com",
        role: "user",
        status: "active",
        blockedUserIds: []
      },
      {
        id: "user-external-3",
        name: "\u0410\u0440\u0442\u0451\u043C \u0413\u0440\u043E\u043C\u043E\u0432",
        age: 27,
        city: "\u041C\u043E\u0441\u043A\u0432\u0430",
        occupation: "\u0413\u0435\u0439\u043C\u0434\u0438\u0437\u0430\u0439\u043D\u0435\u0440",
        companyOrIndustry: "Indie Game Studio",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        photos: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
        ],
        bio: "\u041C\u0430\u0441\u0442\u0435\u0440 \u043F\u043E\u0434\u0437\u0435\u043C\u0435\u043B\u0438\u0439 \u0432 D&D, \u0444\u0430\u043D\u0430\u0442 \u043A\u043E\u043E\u043F\u0435\u0440\u0430\u0442\u0438\u0432\u043D\u044B\u0445 \u043D\u0430\u0441\u0442\u043E\u043B\u043E\u043A, \u0432\u0435\u043B\u043E\u043F\u0440\u043E\u0433\u0443\u043B\u043E\u043A \u0438 \u0445\u043E\u0440\u043E\u0448\u0435\u0433\u043E \u043A\u0440\u0430\u0444\u0442\u0430.",
        interests: ["\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B", "\u041A\u0432\u0438\u0437 / \u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442", "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430", "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438"],
        reliability: {
          score: 4.91,
          eventsAttended: 19,
          eventsOrganized: 7,
          cancellations: 1,
          noShows: 0,
          attendanceRate: 97,
          positiveReviewsCount: 18
        },
        onlineStatus: "recent",
        lastSeen: "\u0411\u044B\u043B(\u0430) 10 \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434",
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: "artem.gamedev@example.com",
        role: "user",
        status: "active",
        blockedUserIds: []
      },
      {
        id: "user-external-4",
        name: "\u041F\u043E\u043B\u0438\u043D\u0430 \u0420\u043E\u043C\u0430\u043D\u043E\u0432\u0430",
        age: 26,
        city: "\u041C\u043E\u0441\u043A\u0432\u0430",
        occupation: "\u0428\u0435\u0444-\u043A\u043E\u043D\u0434\u0438\u0442\u0435\u0440 & \u0424\u0443\u0434-\u0441\u0442\u0438\u043B\u0438\u0441\u0442",
        companyOrIndustry: "\u0413\u0430\u0441\u0442\u0440\u043E-\u0430\u0442\u0435\u043B\u044C\u0435",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        photos: [
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
        ],
        bio: "\u0417\u043D\u0430\u044E \u0432\u0441\u0435 \u0441\u0435\u043A\u0440\u0435\u0442\u043D\u044B\u0435 \u043F\u0435\u043A\u0430\u0440\u043D\u0438 \u0438 \u0432\u0438\u043D\u043D\u044B\u0435 \u0431\u0430\u0440\u044B \u0433\u043E\u0440\u043E\u0434\u0430. \u041B\u044E\u0431\u043B\u044E \u0431\u0435\u0433 \u043F\u043E \u0443\u0442\u0440\u0430\u043C \u0438 \u0432\u044B\u0435\u0437\u0434\u044B \u043D\u0430 \u043F\u0440\u0438\u0440\u043E\u0434\u0443.",
        interests: ["\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440", "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438", "\u0421\u043F\u043E\u0440\u0442", "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F"],
        reliability: {
          score: 5,
          eventsAttended: 11,
          eventsOrganized: 3,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 12
        },
        onlineStatus: "online",
        lastSeen: "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441",
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: "polina.pastry@example.com",
        role: "user",
        status: "active",
        blockedUserIds: []
      },
      {
        id: "user-external-5",
        name: "\u041C\u0430\u043A\u0441\u0438\u043C \u0412\u043E\u043B\u043A\u043E\u0432",
        age: 31,
        city: "\u041C\u043E\u0441\u043A\u0432\u0430",
        occupation: "\u0422\u0440\u0435\u0432\u0435\u043B-\u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444 & \u0413\u0438\u0434",
        companyOrIndustry: "\u0410\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0435 \u044D\u043A\u0441\u043F\u0435\u0434\u0438\u0446\u0438\u0438",
        avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
        photos: [
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80"
        ],
        bio: "\u041E\u0431\u044A\u0435\u0445\u0430\u043B 40 \u0440\u0435\u0433\u0438\u043E\u043D\u043E\u0432 \u0420\u043E\u0441\u0441\u0438\u0438. \u0421\u043E\u0431\u0438\u0440\u0430\u044E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u043D\u0430 \u0445\u0430\u0439\u043A\u0438\u043D\u0433, \u0441\u0430\u043F-\u0431\u043E\u0440\u0434\u044B \u0438 \u0443\u0438\u043A\u0435\u043D\u0434\u044B \u0432 \u043C\u0430\u043B\u044B\u0445 \u0438\u0441\u0442\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0433\u043E\u0440\u043E\u0434\u0430\u0445.",
        interests: ["\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435", "\u0421\u043F\u043E\u0440\u0442", "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438", "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430"],
        reliability: {
          score: 4.97,
          eventsAttended: 22,
          eventsOrganized: 11,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 25
        },
        onlineStatus: "recent",
        lastSeen: "\u0411\u044B\u043B(\u0430) 25 \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434",
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: "maxim.travel@example.com",
        role: "user",
        status: "active",
        blockedUserIds: []
      }
    ];
    for (const u of extraUsers) {
      if (!this.users.has(u.id)) {
        this.users.set(u.id, u);
      }
    }
    const anna = this.users.get("user-anna");
    const mikhail = this.users.get("user-mikhail");
    const elena = this.users.get("user-elena");
    const dmitry = this.users.get("user-external-1");
    const sofia = this.users.get("user-external-2");
    const artem = this.users.get("user-external-3");
    const polina = this.users.get("user-external-4");
    const maxim = this.users.get("user-external-5");
    const toOrg = (u) => ({
      id: u.id,
      name: u.name,
      age: u.age,
      avatarUrl: u.avatarUrl,
      reliability: u.reliability,
      isPhoneVerified: u.isPhoneVerified,
      isEmailVerified: u.isEmailVerified
    });
    const extraEvents = [
      {
        event: {
          id: "ev-5",
          title: "\u0414\u0435\u0433\u0443\u0441\u0442\u0430\u0446\u0438\u044F \u0433\u0440\u0443\u0437\u0438\u043D\u0441\u043A\u0438\u0445 \u0432\u0438\u043D \u0438 \u0445\u0430\u0447\u0430\u043F\u0443\u0440\u0438 \u0438\u0437 \u0434\u0440\u043E\u0432\u044F\u043D\u043E\u0439 \u043F\u0435\u0447\u0438",
          category: "\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440",
          description: "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C\u0441\u044F \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0435\u0439 \u043B\u044E\u0431\u0438\u0442\u0435\u043B\u0435\u0439 \u0433\u0440\u0443\u0437\u0438\u043D\u0441\u043A\u043E\u0439 \u043A\u0443\u0445\u043D\u0438! \u0412 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435 \u043B\u043E\u0434\u043E\u0447\u043A\u0438 \u043F\u043E-\u0430\u0434\u0436\u0430\u0440\u0441\u043A\u0438, \u043F\u0445\u0430\u043B\u0438, \u0445\u0438\u043D\u043A\u0430\u043B\u0438 \u0438 \u0441\u0435\u0442 \u0438\u0437 4 \u0430\u0432\u0442\u043E\u0445\u0442\u043E\u043D\u043D\u044B\u0445 \u0432\u0438\u043D \u0438\u0437 \u043A\u0432\u0435\u0432\u0440\u0438 \u0441 \u0440\u0430\u0441\u0441\u043A\u0430\u0437\u043E\u043C \u0441\u043E\u043C\u0435\u043B\u044C\u0435.",
          date: todayStr,
          time: "20:00",
          isToday: true,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0427\u0438\u0441\u0442\u044B\u0435 \u043F\u0440\u0443\u0434\u044B, ~1.4 \u043A\u043C",
          distanceKm: 1.4,
          imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
          organizerId: polina.id,
          organizer: toOrg(polina),
          status: "open",
          vibe: "\u0413\u0430\u0441\u0442\u0440\u043E-\u0432\u0435\u0447\u0435\u0440",
          musicOrMood: "\u0413\u0440\u0443\u0437\u0438\u043D\u0441\u043A\u043E\u0435 \u043C\u043D\u043E\u0433\u043E\u0433\u043E\u043B\u043E\u0441\u0438\u0435 \u0432 \u0441\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435, \u0430\u0440\u043E\u043C\u0430\u0442 \u0441\u0432\u0435\u0436\u0435\u0439 \u0432\u044B\u043F\u0435\u0447\u043A\u0438",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0435 \u0431\u043B\u044E\u0434\u043E \u0432\u044B \u0433\u043E\u0442\u043E\u0432\u044B \u0437\u0430\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0432 \u043A\u0430\u0436\u0434\u043E\u043C \u043D\u043E\u0432\u043E\u043C \u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D\u0435?",
          requirements: "\u041B\u044E\u0431\u043E\u0432\u044C \u043A \u0433\u0440\u0443\u0437\u0438\u043D\u0441\u043A\u043E\u0439 \u043A\u0443\u0445\u043D\u0435 \u0438 \u0434\u0443\u0448\u0435\u0432\u043D\u044B\u043C \u0442\u043E\u0441\u0442\u0430\u043C",
          rules: ["\u0411\u043B\u044E\u0434\u0430 \u0432 \u0441\u0442\u043E\u043B \u0434\u0435\u043B\u0438\u043C \u043F\u043E\u0440\u043E\u0432\u043D\u0443", "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0443\u0447\u0430\u0441\u0442\u0438\u044F \u0437\u0430 2 \u0447\u0430\u0441\u0430"],
          approvedParticipantIds: [anna.id, dmitry.id, sofia.id],
          createdAt: new Date(Date.now() - 36e5 * 6).toISOString()
        },
        secret: {
          exactVenue: '\u0412\u0438\u043D\u043D\u044B\u0439 \u043F\u043E\u0433\u0440\u0435\u0431\u043E\u043A "\u041C\u0435\u0433\u043E\u0431\u0430\u0440\u0438", \u0437\u0430\u043B \u0441 \u043A\u0430\u043C\u0438\u043D\u043E\u043C',
          exactAddress: "\u0443\u043B. \u041C\u0430\u0440\u043E\u0441\u0435\u0439\u043A\u0430, 15 (\u043C. \u041A\u0438\u0442\u0430\u0439-\u0433\u043E\u0440\u043E\u0434 / \u0427\u0438\u0441\u0442\u044B\u0435 \u043F\u0440\u0443\u0434\u044B)",
          organizerPhone: "+7 (916) 210-45-11",
          privateInstructions: "\u0421\u0442\u043E\u043B \u21167 \u0432 \u0434\u0430\u043B\u044C\u043D\u0435\u043C \u0437\u0430\u043B\u0435 \u0443 \u043A\u0438\u0440\u043F\u0438\u0447\u043D\u043E\u0439 \u0430\u0440\u043A\u0438, \u0431\u0440\u043E\u043D\u044C \u043D\u0430 \u0438\u043C\u044F \u041F\u043E\u043B\u0438\u043D\u044B.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-6",
          title: "\u0412\u0435\u0447\u0435\u0440\u043D\u0438\u0439 \u043F\u0430\u0434\u0435\u043B-\u0442\u0435\u043D\u043D\u0438\u0441 \u0434\u043B\u044F \u043D\u0430\u0447\u0438\u043D\u0430\u044E\u0449\u0438\u0445 (\u043A\u043E\u0440\u0442 \u0437\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D)",
          category: "\u0421\u043F\u043E\u0440\u0442",
          description: "\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u043A\u0440\u044B\u0442\u044B\u0439 \u043F\u0430\u043D\u043E\u0440\u0430\u043C\u043D\u044B\u0439 \u043A\u043E\u0440\u0442 \u043D\u0430 1.5 \u0447\u0430\u0441\u0430! \u0418\u0449\u0435\u043C \u0435\u0449\u0435 \u043E\u0434\u043D\u043E\u0433\u043E-\u0434\u0432\u0443\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 \u0434\u043B\u044F \u043F\u0430\u0440\u043D\u043E\u0439 \u0438\u0433\u0440\u044B 2 \u043D\u0430 2. \u0420\u0430\u043A\u0435\u0442\u043A\u0438 \u0438 \u043C\u044F\u0447\u0438 \u0435\u0441\u0442\u044C \u043D\u0430 \u043C\u0435\u0441\u0442\u0435, \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u0441\u0443\u043F\u0435\u0440 \u043F\u0440\u043E\u0441\u0442\u044B\u0435 \u2014 \u0432\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0448\u044C\u0441\u044F \u0437\u0430 5 \u043C\u0438\u043D\u0443\u0442.",
          date: todayStr,
          time: "21:00",
          isToday: true,
          totalSpots: 4,
          occupiedSpots: 3,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041B\u0443\u0436\u043D\u0438\u043A\u0438, ~2.9 \u043A\u043C",
          distanceKm: 2.9,
          imageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
          organizerId: dmitry.id,
          organizer: toOrg(dmitry),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u0414\u0438\u043D\u0430\u043C\u0438\u0447\u043D\u044B\u0439 \u0441\u043F\u043E\u0440\u0442, \u0441\u043C\u0435\u0445 \u0438 \u0441\u043C\u0443\u0437\u0438 \u043F\u043E\u0441\u043B\u0435 \u043C\u0430\u0442\u0447\u0430",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u0432\u0438\u0434 \u0441\u043F\u043E\u0440\u0442\u0430 \u0432\u044B \u0434\u0430\u0432\u043D\u043E \u0445\u043E\u0442\u0435\u043B\u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C?",
          requirements: "\u041A\u0440\u043E\u0441\u0441\u043E\u0432\u043A\u0438 \u0441\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043F\u043E\u0434\u043E\u0448\u0432\u043E\u0439, \u0441\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u0430\u044F \u0444\u043E\u0440\u043C\u0430",
          rules: ["\u0410\u0440\u0435\u043D\u0434\u0430 \u043A\u043E\u0440\u0442\u0430 \u0434\u0435\u043B\u0438\u0442\u0441\u044F \u043D\u0430 4 \u0438\u0433\u0440\u043E\u043A\u043E\u0432 (~1 100 \u20BD \u0441 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430)", "\u041F\u0440\u0438\u0445\u043E\u0434\u0438\u043C \u0437\u0430 15 \u043C\u0438\u043D\u0443\u0442 \u043D\u0430 \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0443"],
          approvedParticipantIds: [mikhail.id, maxim.id],
          createdAt: new Date(Date.now() - 36e5 * 8).toISOString()
        },
        secret: {
          exactVenue: '\u041F\u0430\u0434\u0435\u043B-\u043A\u043B\u0443\u0431 "\u041B\u0443\u0436\u043D\u0438\u043A\u0438", \u043A\u043E\u0440\u0442 \u21163',
          exactAddress: "\u041B\u0443\u0436\u043D\u0435\u0446\u043A\u0430\u044F \u043D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u0430\u044F, 24, \u0441\u0442\u0440. 4",
          organizerPhone: "+7 (926) 881-34-90",
          privateInstructions: "\u0412\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0443 \u0441\u0442\u043E\u0439\u043A\u0438 \u0440\u0435\u0441\u0435\u043F\u0448\u0435\u043D\u0430 \u0432 20:45. \u0420\u0430\u0437\u0434\u0435\u0432\u0430\u043B\u043A\u0438 \u043D\u0430 1 \u044D\u0442\u0430\u0436\u0435.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-7",
          title: "\u0412\u0435\u0447\u0435\u0440\u043D\u044F\u044F \u0444\u043E\u0442\u043E\u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0430 \u043F\u043E \u043F\u0435\u0440\u0435\u0443\u043B\u043A\u0430\u043C \u041A\u0438\u0442\u0430\u0439-\u0433\u043E\u0440\u043E\u0434\u0430 (\u043F\u043B\u0435\u043D\u043A\u0430 \u0438 \u0441\u043C\u0430\u0440\u0442\u0444\u043E\u043D)",
          category: "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430",
          description: "\u0413\u0443\u043B\u044F\u0435\u043C \u043F\u043E \u0441\u0442\u0430\u0440\u044B\u043C \u043C\u043E\u0441\u043A\u043E\u0432\u0441\u043A\u0438\u043C \u0434\u0432\u043E\u0440\u0438\u043A\u0430\u043C, \u043F\u0430\u043B\u0430\u0442\u0430\u043C XVII \u0432\u0435\u043A\u0430 \u0438 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u043D\u044B\u043C \u043B\u0435\u0441\u0442\u043D\u0438\u0446\u0430\u043C. \u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0440\u0443\u0435\u043C \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u043D\u0430 \u043F\u043B\u0435\u043D\u043A\u0443 \u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D, \u043B\u043E\u0432\u0438\u043C \u0437\u043E\u043B\u043E\u0442\u043E\u0439 \u0447\u0430\u0441 \u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u043C \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0447\u0430\u0435\u043C \u0432 \u0441\u0435\u043A\u0440\u0435\u0442\u043D\u043E\u0439 \u0447\u0430\u0439\u043D\u043E\u0439.",
          date: todayStr,
          time: "18:30",
          isToday: true,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041A\u0438\u0442\u0430\u0439-\u0433\u043E\u0440\u043E\u0434, ~1.1 \u043A\u043C",
          distanceKm: 1.1,
          imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
          organizerId: sofia.id,
          organizer: toOrg(sofia),
          status: "open",
          vibe: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430",
          musicOrMood: "\u0429\u0435\u043B\u0447\u043A\u0438 \u0437\u0430\u0442\u0432\u043E\u0440\u0430 \u043A\u0430\u043C\u0435\u0440\u044B, \u0442\u0438\u0445\u0438\u0435 \u0434\u0432\u043E\u0440\u0438\u043A\u0438 \u0438 \u044D\u0441\u0442\u0435\u0442\u0438\u043A\u0430 \u0441\u0442\u0430\u0440\u043E\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u0432\u0430\u0448 \u0441\u0430\u043C\u044B\u0439 \u043B\u044E\u0431\u0438\u043C\u044B\u0439 \u0443\u0433\u043E\u043B\u043E\u043A \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0443\u043B\u043E\u043A \u0432 \u0433\u043E\u0440\u043E\u0434\u0435?",
          requirements: "\u041B\u044E\u0431\u0430\u044F \u043A\u0430\u043C\u0435\u0440\u0430 \u0438\u043B\u0438 \u043F\u0440\u043E\u0441\u0442\u043E \u0442\u0435\u043B\u0435\u0444\u043E\u043D, \u0443\u0434\u043E\u0431\u043D\u0430\u044F \u043E\u0431\u0443\u0432\u044C",
          rules: ["\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u0430\u044F, \u0447\u0430\u0439 \u0432 \u043A\u043E\u043D\u0446\u0435 \u2014 \u043F\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044E"],
          approvedParticipantIds: [elena.id, anna.id, artem.id],
          createdAt: new Date(Date.now() - 36e5 * 10).toISOString()
        },
        secret: {
          exactVenue: "\u0421\u043A\u0432\u0435\u0440 \u0443 \u043F\u0430\u043C\u044F\u0442\u043D\u0438\u043A\u0430 \u041A\u0438\u0440\u0438\u043B\u043B\u0443 \u0438 \u041C\u0435\u0444\u043E\u0434\u0438\u044E (\u0432\u044B\u0445\u043E\u0434 \u211610)",
          exactAddress: "\u0421\u043B\u0430\u0432\u044F\u043D\u0441\u043A\u0430\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u044C, \u0434. 2 (\u043C. \u041A\u0438\u0442\u0430\u0439-\u0433\u043E\u0440\u043E\u0434)",
          organizerPhone: "+7 (905) 334-12-77",
          privateInstructions: "\u042F \u0431\u0443\u0434\u0443 \u0432 \u0431\u0435\u0436\u0435\u0432\u043E\u043C \u0442\u0440\u0435\u043D\u0447\u0435 \u0441 \u043F\u043B\u0435\u043D\u043E\u0447\u043D\u044B\u043C \u0444\u043E\u0442\u043E\u0430\u043F\u043F\u0430\u0440\u0430\u0442\u043E\u043C Olympus \u043D\u0430 \u0440\u0435\u043C\u043D\u0435.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-8",
          title: "\u041A\u0438\u043D\u043E-\u043C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u0432\u0438\u0437 \xAB\u0423\u0433\u0430\u0434\u0430\u0439 \u0441\u0430\u0443\u043D\u0434\u0442\u0440\u0435\u043A \u0438 \u043A\u0430\u0434\u0440 \u0437\u0430 10 \u0441\u0435\u043A\u0443\u043D\u0434\xBB",
          category: "\u041A\u0432\u0438\u0437 / \u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442",
          description: '\u0412 \u043D\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u0435 "\u041D\u043E\u0447\u043D\u044B\u0435 \u0441\u043E\u0432\u044B" \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u043B\u043E\u0441\u044C 2 \u043C\u0435\u0441\u0442\u0430 \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0438\u0439 \u043A\u0438\u043D\u043E-\u043C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u0432\u0438\u0437! 7 \u0440\u0430\u0443\u043D\u0434\u043E\u0432 \u043F\u0440\u043E \u043A\u0443\u043B\u044C\u0442\u043E\u0432\u044B\u0435 \u0444\u0438\u043B\u044C\u043C\u044B, \u0441\u0435\u0440\u0438\u0430\u043B\u044B \u0438 \u0445\u0438\u0442\u044B 90-\u0445\u20132020-\u0445. \u0411\u0435\u0437 \u0434\u0443\u0448\u043D\u043E\u0439 \u044D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u0447\u043D\u043E\u0441\u0442\u0438 \u2014 \u0447\u0438\u0441\u0442\u044B\u0439 \u043A\u0430\u0439\u0444.',
          date: todayStr,
          time: "19:30",
          isToday: true,
          totalSpots: 8,
          occupiedSpots: 6,
          budget: "\u0434\u043E 1 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0422\u0432\u0435\u0440\u0441\u043A\u0430\u044F / \u041F\u0443\u0448\u043A\u0438\u043D\u0441\u043A\u0430\u044F, ~1.6 \u043A\u043C",
          distanceKm: 1.6,
          imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
          organizerId: artem.id,
          organizer: toOrg(artem),
          status: "open",
          vibe: "\u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0438\u0433\u0440\u0430",
          musicOrMood: "\u0410\u0437\u0430\u0440\u0442 \u0443\u0433\u0430\u0434\u044B\u0432\u0430\u043D\u0438\u044F \u0441 \u043F\u0435\u0440\u0432\u044B\u0445 \u043D\u043E\u0442, \u043A\u043E\u043C\u0430\u043D\u0434\u043D\u044B\u0439 \u0434\u0440\u0430\u0439\u0432 \u0438 \u0437\u0430\u043A\u0443\u0441\u043A\u0438",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u0444\u0438\u043B\u044C\u043C \u0438\u043B\u0438 \u0441\u0435\u0440\u0438\u0430\u043B \u0432\u044B \u043F\u0435\u0440\u0435\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u043B\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 \u0442\u0440\u0435\u0445 \u0440\u0430\u0437?",
          requirements: "\u0425\u043E\u0440\u043E\u0448\u0435\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 \u0438 \u043B\u044E\u0431\u043E\u0432\u044C \u043A \u043A\u0438\u043D\u043E \u0438\u043B\u0438 \u043C\u0443\u0437\u044B\u043A\u0435",
          rules: ["\u0412\u0437\u043D\u043E\u0441 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0430\u043C \u043A\u0432\u0438\u0437\u0430 \u2014 700 \u20BD \u0441 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430", "\u0421\u0431\u043E\u0440 \u0437\u0430 15 \u043C\u0438\u043D\u0443\u0442 \u0434\u043E \u0441\u0442\u0430\u0440\u0442\u0430 \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0440\u0430\u0443\u043D\u0434\u0430"],
          approvedParticipantIds: [mikhail.id, dmitry.id, sofia.id, polina.id],
          createdAt: new Date(Date.now() - 36e5 * 12).toISOString()
        },
        secret: {
          exactVenue: '\u0413\u0430\u0441\u0442\u0440\u043E\u043F\u0430\u0431 "\u041A\u0440\u0430\u0444\u0442 \u0438 \u041A\u0432\u0438\u0437", \u0441\u0442\u043E\u043B \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u211612 "\u041D\u043E\u0447\u043D\u044B\u0435 \u0441\u043E\u0432\u044B"',
          exactAddress: "\u0421\u0442\u0440\u0430\u0441\u0442\u043D\u043E\u0439 \u0431\u0443\u043B\u044C\u0432\u0430\u0440, 8\u0410 (\u043C. \u0427\u0435\u0445\u043E\u0432\u0441\u043A\u0430\u044F)",
          organizerPhone: "+7 (999) 114-56-23",
          privateInstructions: "\u041D\u0430 \u0432\u0445\u043E\u0434\u0435 \u0445\u043E\u0441\u0442\u0435\u0441 \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0441\u0442\u043E\u043B \u211612 \u0432 \u0446\u0435\u043D\u0442\u0440\u0435 \u0437\u0430\u043B\u0430 \u0432\u043E\u0437\u043B\u0435 \u044D\u043A\u0440\u0430\u043D\u0430.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-9",
          title: "\u0418\u043C\u0435\u043D\u0438\u043D\u043D\u044B\u0439 \u0431\u0440\u0430\u043D\u0447 \u0441 \u043F\u0430\u043D\u043A\u0435\u0439\u043A\u0430\u043C\u0438 \u0438 \u0441\u043F\u0435\u0448\u0435\u043B\u0442\u0438-\u043A\u043E\u0444\u0435 \u043D\u0430 \u0432\u0435\u0440\u0430\u043D\u0434\u0435",
          category: "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F",
          description: "\u041F\u0440\u0430\u0437\u0434\u043D\u0443\u044E \u0441\u0432\u043E\u0439 \u0434\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 \u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0433\u043E \u0441\u043E\u043B\u043D\u0435\u0447\u043D\u043E\u0433\u043E \u0431\u0440\u0430\u043D\u0447\u0430! \u0411\u0443\u0434\u0435\u043C \u043F\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440-\u043A\u043E\u0444\u0435, \u0435\u0441\u0442\u044C \u0431\u0435\u043D\u0435\u0434\u0438\u043A\u0442\u044B \u0438 \u0432\u043E\u0437\u0434\u0443\u0448\u043D\u044B\u0435 \u043F\u0430\u043D\u043A\u0435\u0439\u043A\u0438 \u0441 \u044F\u0433\u043E\u0434\u0430\u043C\u0438, \u0431\u043E\u043B\u0442\u0430\u0442\u044C \u043E\u0431 \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435, \u043F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u044F\u0445 \u0438 \u043F\u043B\u0430\u043D\u0430\u0445 \u043D\u0430 \u043B\u0435\u0442\u043E.",
          date: tomorrowStr,
          time: "12:00",
          isToday: false,
          totalSpots: 5,
          occupiedSpots: 3,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041F\u0430\u0442\u0440\u0438\u0430\u0440\u0448\u0438\u0435 \u043F\u0440\u0443\u0434\u044B, ~2.1 \u043A\u043C",
          distanceKm: 2.1,
          imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80",
          organizerId: sofia.id,
          organizer: toOrg(sofia),
          status: "open",
          vibe: "\u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0432\u0430\u0439\u0431",
          musicOrMood: "\u0410\u0440\u043E\u043C\u0430\u0442 \u0441\u0432\u0435\u0436\u0435\u043E\u0431\u0436\u0430\u0440\u0435\u043D\u043D\u043E\u0439 \u0430\u0440\u0430\u0431\u0438\u043A\u0438, \u0446\u0432\u0435\u0442\u044B \u043D\u0430 \u0441\u0442\u043E\u043B\u0435 \u0438 \u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0435 \u0441\u043E\u043B\u043D\u0446\u0435",
          icebreakerQuestion: "\u0418\u0437 \u0447\u0435\u0433\u043E \u0441\u043E\u0441\u0442\u043E\u0438\u0442 \u0432\u0430\u0448 \u0438\u0434\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u043D\u0435\u0441\u043F\u0435\u0448\u043D\u044B\u0439 \u0437\u0430\u0432\u0442\u0440\u0430\u043A?",
          requirements: "\u041B\u0435\u0433\u043A\u043E\u0441\u0442\u044C \u043D\u0430 \u043F\u043E\u0434\u044A\u0435\u043C \u0438 \u043B\u044E\u0431\u043E\u0432\u044C \u043A \u0434\u043E\u043B\u0433\u0438\u043C \u0437\u0430\u0432\u0442\u0440\u0430\u043A\u0430\u043C",
          rules: ["\u0421 \u043C\u0435\u043D\u044F \u043F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0442\u043E\u0440\u0442 \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u0433\u043E\u0441\u0442\u0435\u0439, \u043A\u043E\u0444\u0435 \u0438 \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u0431\u043B\u044E\u0434\u0430 \u2014 \u043A\u0430\u0436\u0434\u044B\u0439 \u0437\u0430 \u0441\u0435\u0431\u044F"],
          approvedParticipantIds: [anna.id, elena.id],
          createdAt: new Date(Date.now() - 36e5 * 14).toISOString()
        },
        secret: {
          exactVenue: '\u041A\u0430\u0444\u0435 "\u0423\u0442\u0440\u043E \u043D\u0430 \u041F\u0430\u0442\u0440\u0438\u0430\u0440\u0448\u0438\u0445", \u0441\u0432\u0435\u0442\u043B\u044B\u0439 \u0437\u0430\u043B \u0443 \u043F\u0430\u043D\u043E\u0440\u0430\u043C\u043D\u044B\u0445 \u043E\u043A\u043E\u043D',
          exactAddress: "\u041C\u0430\u043B\u044B\u0439 \u041A\u043E\u0437\u0438\u0445\u0438\u043D\u0441\u043A\u0438\u0439 \u043F\u0435\u0440., 10",
          organizerPhone: "+7 (905) 334-12-77",
          privateInstructions: "\u041A\u0440\u0443\u0433\u043B\u044B\u0439 \u0441\u0442\u043E\u043B \u043D\u0430 5 \u043F\u0435\u0440\u0441\u043E\u043D \u0443 \u043E\u043A\u043D\u0430 \u0441 \u0431\u0443\u043A\u0435\u0442\u043E\u043C \u043F\u0438\u043E\u043D\u043E\u0432.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-10",
          title: "\u0412\u0435\u0447\u0435\u0440 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0438\u0433\u0440 \xAB\u0411\u0443\u043D\u043A\u0435\u0440\xBB \u0438 \xAB\u041D\u0435\u0447\u0442\u043E\xBB \u0432 \u043B\u043E\u0444\u0442\u0435",
          category: "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B",
          description: "\u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0431\u043E\u043B\u044C\u0448\u0443\u044E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E \u043D\u0430 \u0434\u0438\u0441\u043A\u0443\u0441\u0441\u0438\u043E\u043D\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u043E\u043B\u043A\u0438! \u0412 \xAB\u0411\u0443\u043D\u043A\u0435\u0440\u0435\xBB \u043F\u0440\u043E\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u043C \u043A\u0440\u0430\u0441\u043D\u043E\u0440\u0435\u0447\u0438\u0435 \u0438 \u0443\u0431\u0435\u0436\u0434\u0430\u0435\u043C \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0445, \u043F\u043E\u0447\u0435\u043C\u0443 \u0438\u043C\u0435\u043D\u043D\u043E \u0432\u0430\u0448 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436 \u0441\u043F\u0430\u0441\u0435\u0442 \u0447\u0435\u043B\u043E\u0432\u0435\u0447\u0435\u0441\u0442\u0432\u043E. \u0411\u0443\u0434\u0435\u0442 \u043F\u0438\u0446\u0446\u0430 \u0438 \u043B\u0438\u043C\u043E\u043D\u0430\u0434\u044B!",
          date: todayStr,
          time: "20:30",
          isToday: true,
          totalSpots: 10,
          occupiedSpots: 8,
          budget: "\u0434\u043E 1 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041A\u0440\u0430\u0441\u043D\u044B\u0439 \u041E\u043A\u0442\u044F\u0431\u0440\u044C, ~2.3 \u043A\u043C",
          distanceKm: 2.3,
          imageUrl: "./assets/images/event_board_games_1794332913325.jpg",
          organizerId: artem.id,
          organizer: toOrg(artem),
          status: "open",
          vibe: "\u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0438\u0433\u0440\u0430",
          musicOrMood: "\u0413\u043E\u0440\u044F\u0447\u0438\u0435 \u0434\u0435\u0431\u0430\u0442\u044B, \u043D\u0435\u043E\u0436\u0438\u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u044E\u0436\u0435\u0442\u043D\u044B\u0435 \u043F\u043E\u0432\u043E\u0440\u043E\u0442\u044B \u0438 \u0441\u043C\u0435\u0445 \u0434\u043E \u0441\u043B\u0435\u0437",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u0441\u0430\u043C\u044B\u0439 \u043D\u0435\u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u043D\u0430\u0432\u044B\u043A \u043F\u043E\u043C\u043E\u0433 \u0431\u044B \u0432\u0430\u043C \u0432\u044B\u0436\u0438\u0442\u044C \u043D\u0430 \u043D\u0435\u043E\u0431\u0438\u0442\u0430\u0435\u043C\u043E\u043C \u043E\u0441\u0442\u0440\u043E\u0432\u0435?",
          requirements: "\u0416\u0435\u043B\u0430\u043D\u0438\u0435 \u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F \u0438 \u0448\u0443\u0442\u0438\u0442\u044C",
          rules: ["\u0421\u043A\u0438\u0434\u044B\u0432\u0430\u0435\u043C\u0441\u044F \u043F\u043E 800 \u20BD \u043D\u0430 \u0430\u0440\u0435\u043D\u0434\u0443 \u043B\u043E\u0444\u0442\u0430 \u0438 \u0433\u043E\u0440\u044F\u0447\u0443\u044E \u043F\u0438\u0446\u0446\u0443"],
          approvedParticipantIds: [mikhail.id, dmitry.id, elena.id, polina.id, maxim.id],
          createdAt: new Date(Date.now() - 36e5 * 15).toISOString()
        },
        secret: {
          exactVenue: '\u0418\u0433\u0440\u043E\u0432\u043E\u0439 \u043B\u043E\u0444\u0442 "\u041C\u0430\u043D\u0441\u0430\u0440\u0434\u0430", 3 \u044D\u0442\u0430\u0436',
          exactAddress: "\u0411\u0435\u0440\u0441\u0435\u043D\u0435\u0432\u0441\u043A\u0430\u044F \u043D\u0430\u0431., 6, \u0441\u0442\u0440. 3",
          organizerPhone: "+7 (999) 114-56-23",
          privateInstructions: "\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 \u0430\u0440\u043A\u0443 \u0441\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u043D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u043E\u0439, \u043A\u043E\u0434 \u0434\u043E\u043C\u043E\u0444\u043E\u043D\u0430 42#. \u041F\u043E\u0434\u043D\u0438\u043C\u0430\u0439\u0442\u0435\u0441\u044C \u043D\u0430 \u043C\u0430\u043D\u0441\u0430\u0440\u0434\u0443.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-11",
          title: "\u0420\u0435\u0442\u0440\u043E\u0441\u043F\u0435\u043A\u0442\u0438\u0432\u0430 \u0425\u0430\u044F\u043E \u041C\u0438\u044F\u0434\u0437\u0430\u043A\u0438 \u043D\u0430 \u0431\u043E\u043B\u044C\u0448\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435 + \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0435 \u0437\u0430 \u0440\u0430\u043C\u0435\u043D\u043E\u043C",
          category: "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442",
          description: "\u0418\u0434\u0435\u043C \u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \xAB\u0423\u043D\u0435\u0441\u0435\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u0437\u0440\u0430\u043A\u0430\u043C\u0438\xBB \u0432 \u043A\u0430\u043C\u0435\u0440\u043D\u043E\u043C \u043A\u0438\u043D\u043E\u0437\u0430\u043B\u0435 \u043D\u0430 \u044F\u043F\u043E\u043D\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435 \u0441 \u0440\u0443\u0441\u0441\u043A\u0438\u043C\u0438 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u0430\u043C\u0438, \u0430 \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u0441\u0435\u0430\u043D\u0441\u0430 \u0437\u0430\u0433\u043B\u044F\u043D\u0435\u043C \u0432 \u0441\u043E\u0441\u0435\u0434\u043D\u044E\u044E \u0440\u0430\u043C\u0435\u043D\u043D\u0443\u044E \u043E\u0431\u0441\u0443\u0434\u0438\u0442\u044C \u0441\u0438\u043C\u0432\u043E\u043B\u0438\u0437\u043C \u0444\u0438\u043B\u044C\u043C\u0430.",
          date: tomorrowStr,
          time: "19:45",
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0411\u0430\u0443\u043C\u0430\u043D\u0441\u043A\u0430\u044F / \u0421\u0430\u0434 \u0411\u0430\u0443\u043C\u0430\u043D\u0430, ~2.7 \u043A\u043C",
          distanceKm: 2.7,
          imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
          organizerId: elena.id,
          organizer: toOrg(elena),
          status: "open",
          vibe: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430",
          musicOrMood: "\u0412\u043E\u043B\u0448\u0435\u0431\u043D\u0430\u044F \u043C\u0443\u0437\u044B\u043A\u0430 \u0414\u0437\u0451 \u0425\u0438\u0441\u0430\u0438\u0441\u0438 \u0438 \u0443\u044E\u0442\u043D\u0430\u044F \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0430 \u0441\u0442\u0430\u0440\u043E\u0433\u043E \u043A\u0438\u043D\u043E\u0442\u0435\u0430\u0442\u0440\u0430",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u043C\u0443\u043B\u044C\u0442\u0444\u0438\u043B\u044C\u043C \u0438\u043B\u0438 \u0444\u0438\u043B\u044C\u043C \u0438\u0437 \u0434\u0435\u0442\u0441\u0442\u0432\u0430 \u0434\u043E \u0441\u0438\u0445 \u043F\u043E\u0440 \u0432\u0434\u043E\u0445\u043D\u043E\u0432\u043B\u044F\u0435\u0442 \u0432\u0430\u0441?",
          requirements: "\u041D\u0435 \u043E\u043F\u0430\u0437\u0434\u044B\u0432\u0430\u0442\u044C \u043A \u043D\u0430\u0447\u0430\u043B\u0443 \u0441\u0435\u0430\u043D\u0441\u0430",
          rules: ["\u0411\u0438\u043B\u0435\u0442\u044B \u0431\u0435\u0440\u0435\u043C \u0432 \u043E\u0434\u043D\u043E\u043C \u0440\u044F\u0434\u0443 (600 \u20BD), \u0440\u0430\u043C\u0435\u043D \u043F\u043E\u0441\u043B\u0435 \u043A\u0438\u043D\u043E \u2014 \u043F\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044E"],
          approvedParticipantIds: [mikhail.id, sofia.id, artem.id],
          createdAt: new Date(Date.now() - 36e5 * 16).toISOString()
        },
        secret: {
          exactVenue: "\u041A\u0438\u043D\u043E\u0442\u0435\u0430\u0442\u0440 \u0432 \u0421\u0430\u0434\u0443 \u0438\u043C. \u0411\u0430\u0443\u043C\u0430\u043D\u0430, \u043C\u0430\u043B\u044B\u0439 \u0437\u0430\u043B, \u0440\u044F\u0434 5",
          exactAddress: "\u0443\u043B. \u0421\u0442\u0430\u0440\u0430\u044F \u0411\u0430\u0441\u043C\u0430\u043D\u043D\u0430\u044F, 15\u0410",
          organizerPhone: "+7 (903) 777-34-21",
          privateInstructions: "\u0412\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0432 \u0444\u043E\u0439\u0435 \u0443 \u043A\u043E\u0444\u0435\u0439\u043D\u043E\u0439 \u0441\u0442\u043E\u0439\u043A\u0438 \u0437\u0430 15 \u043C\u0438\u043D\u0443\u0442 \u0434\u043E \u043F\u043E\u043A\u0430\u0437\u0430.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-12",
          title: "\u0412\u044B\u0435\u0437\u0434 \u0432 \u0421\u0443\u0437\u0434\u0430\u043B\u044C \u043D\u0430 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0435: \u0441\u044B\u0440\u043E\u0432\u0430\u0440\u043D\u044F, \u0441\u0430\u043F\u044B \u043F\u043E \u041A\u0430\u043C\u0435\u043D\u043A\u0435 \u0438 \u0437\u0430\u043A\u0430\u0442\u044B",
          category: "\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435",
          description: "\u0415\u0434\u0435\u043C \u043D\u0430 \u0434\u0432\u0443\u0445 \u043C\u0430\u0448\u0438\u043D\u0430\u0445 \u0432 \u0421\u0443\u0437\u0434\u0430\u043B\u044C \u043D\u0430 \u0441\u0443\u0431\u0431\u043E\u0442\u0443 \u0438 \u0432\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u0435! \u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u044B\u0439 \u0433\u043E\u0441\u0442\u0435\u0432\u043E\u0439 \u0434\u043E\u043C \u0441 \u0432\u0435\u0440\u0430\u043D\u0434\u043E\u0439. \u0412 \u043F\u043B\u0430\u043D\u0430\u0445: \u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u043F\u0430\u0445 \u043F\u043E \u0440\u0435\u043A\u0435 \u0441 \u0432\u0438\u0434\u043E\u043C \u043D\u0430 \u043C\u043E\u043D\u0430\u0441\u0442\u044B\u0440\u0438, \u0434\u0435\u0433\u0443\u0441\u0442\u0430\u0446\u0438\u044F \u0444\u0435\u0440\u043C\u0435\u0440\u0441\u043A\u0438\u0445 \u0441\u044B\u0440\u043E\u0432 \u0438 \u0432\u0435\u0447\u0435\u0440 \u0443 \u043A\u0430\u043C\u0438\u043D\u0430.",
          date: inTwoDaysStr,
          time: "08:30",
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: "5 000+ \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0421\u0431\u043E\u0440 \u0443 \u043C. \u041A\u0443\u0440\u0441\u043A\u0430\u044F, ~2.6 \u043A\u043C",
          distanceKm: 2.6,
          imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80",
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u0420\u043E\u0443\u0434-\u0442\u0440\u0438\u043F \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442 \u0432 \u043C\u0430\u0448\u0438\u043D\u0435, \u0442\u0443\u043C\u0430\u043D \u043D\u0430\u0434 \u0440\u0435\u043A\u043E\u0439 \u0438 \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u043E\u0435 \u0437\u043E\u0434\u0447\u0435\u0441\u0442\u0432\u043E",
          icebreakerQuestion: "\u041A\u0430\u043A\u0430\u044F \u043F\u043E\u0435\u0437\u0434\u043A\u0430 \u043D\u0430 \u043C\u0430\u0448\u0438\u043D\u0435 \u0437\u0430\u043F\u043E\u043C\u043D\u0438\u043B\u0430\u0441\u044C \u0432\u0430\u043C \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0435\u0433\u043E?",
          requirements: "\u0413\u043E\u0442\u043E\u0432\u043D\u043E\u0441\u0442\u044C \u043A \u0440\u0430\u043D\u043D\u0435\u043C\u0443 \u0432\u044B\u0435\u0437\u0434\u0443 \u0432 \u0441\u0443\u0431\u0431\u043E\u0442\u0443 \u0443\u0442\u0440\u043E\u043C",
          rules: ["\u0411\u0435\u043D\u0437\u0438\u043D \u0438 \u0430\u0440\u0435\u043D\u0434\u0443 \u0433\u043E\u0441\u0442\u0435\u0432\u043E\u0433\u043E \u0434\u043E\u043C\u0430 \u0434\u0435\u043B\u0438\u043C \u043F\u043E\u0440\u043E\u0432\u043D\u0443 (~5 500 \u20BD \u0441 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 \u0437\u0430 \u0432\u0441\u0451)"],
          approvedParticipantIds: [anna.id, mikhail.id, polina.id],
          createdAt: new Date(Date.now() - 36e5 * 18).toISOString()
        },
        secret: {
          exactVenue: '\u041F\u0430\u0440\u043A\u043E\u0432\u043A\u0430 \u0443 \u0422\u0426 "\u0410\u0442\u0440\u0438\u0443\u043C" \u0441\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u0417\u0435\u043C\u043B\u044F\u043D\u043E\u0433\u043E \u0412\u0430\u043B\u0430',
          exactAddress: "\u0443\u043B. \u0417\u0435\u043C\u043B\u044F\u043D\u043E\u0439 \u0412\u0430\u043B, 33 (\u043C. \u041A\u0443\u0440\u0441\u043A\u0430\u044F)",
          organizerPhone: "+7 (915) 602-88-19",
          privateInstructions: "\u0421\u0438\u043D\u0438\u0439 \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u0435\u0440 Subaru Outback, \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0443 \u043A\u043E\u0444\u0435\u0439\u043D\u0438 \u043D\u0430 1 \u044D\u0442\u0430\u0436\u0435 \u043F\u0435\u0440\u0435\u0434 \u0432\u044B\u0435\u0437\u0434\u043E\u043C.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-13",
          title: "\u041A\u043E\u0440\u0435\u0439\u0441\u043A\u043E\u0435 \u0431\u0430\u0440\u0431\u0435\u043A\u044E \u0438 \u0440\u0430\u043C\u0435\u043D-\u0442\u0443\u0440 \u0432 \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0447\u043D\u043E\u043C \u0431\u0438\u0441\u0442\u0440\u043E",
          category: "\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440",
          description: "\u0418\u0449\u0435\u043C \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E \u0438\u0437 4 \u0447\u0435\u043B\u043E\u0432\u0435\u043A, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u043D\u044F\u0442\u044C \u0441\u0442\u043E\u043B \u0441\u043E \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u043C \u043A\u043E\u0440\u0435\u0439\u0441\u043A\u0438\u043C \u0433\u0440\u0438\u043B\u0435\u043C! \u0411\u0443\u0434\u0435\u043C \u0441\u0430\u043C\u0438 \u0436\u0430\u0440\u0438\u0442\u044C \u043C\u0440\u0430\u043C\u043E\u0440\u043D\u044B\u0435 \u0441\u043B\u0430\u0439\u0441\u044B, \u0437\u0430\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0442\u044C \u0432 \u043B\u0438\u0441\u0442\u044C\u044F \u0441\u0430\u043B\u0430\u0442\u0430 \u0441 \u043A\u0438\u043C\u0447\u0438 \u0438 \u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0434\u043E\u043C\u0430\u0448\u043D\u0438\u0439 \u0440\u0430\u043C\u0435\u043D.",
          date: todayStr,
          time: "19:00",
          isToday: true,
          totalSpots: 4,
          occupiedSpots: 3,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0426\u0432\u0435\u0442\u043D\u043E\u0439 \u0431\u0443\u043B\u044C\u0432\u0430\u0440, ~1.5 \u043A\u043C",
          distanceKm: 1.5,
          imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
          organizerId: mikhail.id,
          organizer: toOrg(mikhail),
          status: "open",
          vibe: "\u0413\u0430\u0441\u0442\u0440\u043E-\u0432\u0435\u0447\u0435\u0440",
          musicOrMood: "\u0428\u0438\u043F\u0435\u043D\u0438\u0435 \u0433\u0440\u0438\u043B\u044F, \u043D\u0435\u043E\u043D\u043E\u0432\u044B\u0435 \u0432\u044B\u0432\u0435\u0441\u043A\u0438 \u0421\u0435\u0443\u043B\u0430 \u0438 \u043F\u0440\u044F\u043D\u044B\u0435 \u0441\u043E\u0443\u0441\u044B",
          icebreakerQuestion: "\u041B\u044E\u0431\u0438\u0442\u0435 \u043B\u0438 \u0432\u044B \u043E\u0441\u0442\u0440\u0443\u044E \u0430\u0437\u0438\u0430\u0442\u0441\u043A\u0443\u044E \u043A\u0443\u0445\u043D\u044E \u043E\u0442 1 \u0434\u043E 10?",
          requirements: "\u0410\u043F\u043F\u0435\u0442\u0438\u0442 \u0438 \u0438\u043D\u0442\u0435\u0440\u0435\u0441 \u043A \u0430\u0437\u0438\u0430\u0442\u0441\u043A\u043E\u0439 \u0433\u0430\u0441\u0442\u0440\u043E\u043D\u043E\u043C\u0438\u0438",
          rules: ["\u0421\u0435\u0442 \u0434\u043B\u044F \u0433\u0440\u0438\u043B\u044F \u0434\u0435\u043B\u0438\u043C \u043D\u0430 \u0432\u0441\u0435\u0445 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0441\u0442\u043E\u043B\u0430"],
          approvedParticipantIds: [dmitry.id, artem.id],
          createdAt: new Date(Date.now() - 36e5 * 5).toISOString()
        },
        secret: {
          exactVenue: '\u041A\u043E\u0440\u0435\u0439\u0441\u043A\u043E\u0435 \u0431\u0438\u0441\u0442\u0440\u043E "Seoul Grill", \u0433\u0440\u0438\u043B\u044C-\u0441\u0442\u043E\u043B \u21164',
          exactAddress: "\u0426\u0432\u0435\u0442\u043D\u043E\u0439 \u0431\u0443\u043B\u044C\u0432\u0430\u0440, 21, \u0441\u0442\u0440. 2",
          organizerPhone: "+7 (925) 444-12-88",
          privateInstructions: "\u0411\u0440\u043E\u043D\u044C \u043D\u0430 \u0438\u043C\u044F \u041C\u0438\u0445\u0430\u0438\u043B\u0430. \u0417\u0430\u0445\u043E\u0434\u0438\u0442\u0435 \u0432\u043D\u0443\u0442\u0440\u044C \u043C\u0438\u043C\u043E \u043D\u0435\u043E\u043D\u043E\u0432\u043E\u0439 \u0432\u044B\u0432\u0435\u0441\u043A\u0438.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-14",
          title: "\u0423\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043F\u0440\u043E\u0431\u0435\u0436\u043A\u0430 5 \u043A\u043C \u0432 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043D\u043E\u043C \u0442\u0435\u043C\u043F\u0435 + \u0444\u0438\u043B\u044C\u0442\u0440-\u043A\u043E\u0444\u0435 \u0438 \u043A\u0440\u0443\u0430\u0441\u0441\u0430\u043D\u044B",
          category: "\u0421\u043F\u043E\u0440\u0442",
          description: "\u0411\u0435\u0436\u0438\u043C \u043B\u0435\u0433\u043A\u0438\u0435 5 \u043A\u043C \u043F\u043E \u043D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u043E\u0439 \u0432 \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u043D\u043E\u043C \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043D\u043E\u043C \u0442\u0435\u043C\u043F\u0435 (6:15\u20136:30 \u043C\u0438\u043D/\u043A\u043C), \u0434\u0435\u043B\u0430\u0435\u043C \u0441\u0443\u0441\u0442\u0430\u0432\u043D\u0443\u044E \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0443, \u0430 \u043D\u0430 \u0444\u0438\u043D\u0438\u0448\u0435 \u0438\u0434\u0435\u043C \u043F\u0438\u0442\u044C \u0441\u043F\u0435\u0448\u0435\u043B\u0442\u0438-\u043A\u043E\u0444\u0435 \u0441\u043E \u0441\u0432\u0435\u0436\u0438\u043C\u0438 \u043C\u0438\u043D\u0434\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u043A\u0440\u0443\u0430\u0441\u0441\u0430\u043D\u0430\u043C\u0438.",
          date: tomorrowStr,
          time: "09:30",
          isToday: false,
          totalSpots: 8,
          occupiedSpots: 5,
          budget: "\u0434\u043E 1 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041F\u0430\u0440\u043A \u0413\u043E\u0440\u044C\u043A\u043E\u0433\u043E / \u041D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u0430\u044F, ~2.8 \u043A\u043C",
          distanceKm: 2.8,
          imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80",
          organizerId: polina.id,
          organizer: toOrg(polina),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u0421\u0432\u0435\u0436\u0438\u0439 \u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 \u0432\u043E\u0437\u0434\u0443\u0445 \u0443 \u0432\u043E\u0434\u044B, \u0437\u0430\u0440\u044F\u0434 \u0431\u043E\u0434\u0440\u043E\u0441\u0442\u0438 \u0438 \u0433\u043E\u0440\u044F\u0447\u0438\u0439 \u043A\u043E\u0444\u0435",
          icebreakerQuestion: "\u0427\u0442\u043E \u043F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u0432\u0430\u043C \u043F\u0440\u043E\u0441\u044B\u043F\u0430\u0442\u044C\u0441\u044F \u043F\u043E \u0443\u0442\u0440\u0430\u043C \u0432 \u043E\u0442\u043B\u0438\u0447\u043D\u043E\u043C \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0438?",
          requirements: "\u0422\u0435\u043C\u043F \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0439 \u2014 \u043D\u0438\u043A\u0442\u043E \u043D\u0438\u043A\u043E\u0433\u043E \u043D\u0435 \u0431\u0440\u043E\u0441\u0430\u0435\u0442 \u043F\u043E\u0437\u0430\u0434\u0438",
          rules: ["\u041F\u0440\u043E\u0431\u0435\u0436\u043A\u0430 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u0430\u044F, \u043A\u043E\u0444\u0435 \u043D\u0430 \u0444\u0438\u043D\u0438\u0448\u0435 \u043F\u043E \u0436\u0435\u043B\u0430\u043D\u0438\u044E"],
          approvedParticipantIds: [dmitry.id, maxim.id, elena.id, mikhail.id],
          createdAt: new Date(Date.now() - 36e5 * 9).toISOString()
        },
        secret: {
          exactVenue: "\u041A\u043E\u0444\u0435\u0439\u043D\u044B\u0439 \u043F\u043E\u0438\u043D\u0442 \u0443 \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E \u0432\u0445\u043E\u0434\u0430 \u0432 \u041F\u0430\u0440\u043A \u0413\u043E\u0440\u044C\u043A\u043E\u0433\u043E (\u0441\u043B\u0435\u0432\u0430 \u043E\u0442 \u0430\u0440\u043A\u0438)",
          exactAddress: "\u0443\u043B. \u041A\u0440\u044B\u043C\u0441\u043A\u0438\u0439 \u0412\u0430\u043B, 9",
          organizerPhone: "+7 (916) 210-45-11",
          privateInstructions: "\u0415\u0441\u0442\u044C \u0448\u043A\u0430\u0444\u0447\u0438\u043A\u0438 \u0434\u043B\u044F \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0432\u0435\u0449\u0435\u0439 \u0432 \u0431\u0435\u0433\u043E\u0432\u043E\u043C \u0446\u0435\u043D\u0442\u0440\u0435 \u0440\u044F\u0434\u043E\u043C \u0441\u043E \u0441\u0442\u0430\u0440\u0442\u043E\u043C.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-15",
          title: "\u0417\u0430\u043A\u0430\u0442\u043D\u044B\u0439 \u0437\u0430\u043F\u043B\u044B\u0432 \u043D\u0430 \u0441\u0430\u043F-\u0431\u043E\u0440\u0434\u0430\u0445 \u0438 \u043F\u0438\u043A\u043D\u0438\u043A \u0441 \u0447\u0430\u0435\u043C \u043D\u0430 \u0431\u0435\u0440\u0435\u0433\u0443",
          category: "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438",
          description: "\u041F\u043B\u044B\u0432\u0435\u043C \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0442\u044C \u0437\u0430\u043A\u0430\u0442 \u043F\u043E \u0442\u0438\u0445\u0438\u043C \u0436\u0438\u0432\u043E\u043F\u0438\u0441\u043D\u044B\u043C \u0437\u0430\u043B\u0438\u0432\u0430\u043C! \u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0432\u044B\u0434\u0430\u0441\u0442 \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u044B\u0435 \u0434\u043E\u0441\u043A\u0438 \u0438 \u0441\u043F\u0430\u0441\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0436\u0438\u043B\u0435\u0442\u044B, \u0430 \u043F\u043E\u0441\u043B\u0435 \u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0438 \u0443\u0441\u0442\u0440\u043E\u0438\u043C \u043F\u0438\u043A\u043D\u0438\u043A \u043D\u0430 \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u043E\u043C \u043F\u0438\u0440\u0441\u0435 \u0441 \u0442\u0440\u0430\u0432\u044F\u043D\u044B\u043C \u0447\u0430\u0435\u043C \u0438 \u044F\u0433\u043E\u0434\u0430\u043C\u0438.",
          date: inThreeDaysStr,
          time: "17:30",
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 5,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u044B\u0439 \u0411\u043E\u0440, ~5.4 \u043A\u043C",
          distanceKm: 5.4,
          imageUrl: "https://images.unsplash.com/photo-1526188717906-ab4a2f949f48?auto=format&fit=crop&w=900&q=80",
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u0420\u043E\u0437\u043E\u0432\u044B\u0439 \u0437\u0430\u043A\u0430\u0442 \u043D\u0430 \u0432\u043E\u0434\u0435, \u0441\u043E\u0441\u043D\u044B \u0438 \u043F\u043E\u043B\u043D\u043E\u0435 \u043E\u0449\u0443\u0449\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0443\u0441\u043A\u0430",
          icebreakerQuestion: "\u041C\u043E\u0440\u0435, \u0433\u043E\u0440\u044B \u0438\u043B\u0438 \u043B\u0435\u0441\u043D\u043E\u0435 \u043E\u0437\u0435\u0440\u043E \u2014 \u0433\u0434\u0435 \u0432\u044B \u043E\u0442\u0434\u044B\u0445\u0430\u0435\u0442\u0435 \u0434\u0443\u0448\u043E\u0439 \u043B\u0443\u0447\u0448\u0435 \u0432\u0441\u0435\u0433\u043E?",
          requirements: "\u0421\u043C\u0435\u043D\u043D\u0430\u044F \u043E\u0434\u0435\u0436\u0434\u0430 \u043D\u0430 \u0432\u0441\u044F\u043A\u0438\u0439 \u0441\u043B\u0443\u0447\u0430\u0439, \u0443\u043C\u0435\u043D\u0438\u0435 \u043F\u043B\u0430\u0432\u0430\u0442\u044C",
          rules: ["\u041F\u0440\u043E\u043A\u0430\u0442 SUP-\u0431\u043E\u0440\u0434\u0430 \u043D\u0430 2 \u0447\u0430\u0441\u0430 \u2014 1 800 \u20BD, \u0447\u0430\u0439 \u0438 \u0443\u0433\u043E\u0449\u0435\u043D\u0438\u044F \u0431\u0435\u0440\u0435\u043C \u0441 \u0441\u043E\u0431\u043E\u0439"],
          approvedParticipantIds: [anna.id, elena.id, sofia.id, dmitry.id],
          createdAt: new Date(Date.now() - 36e5 * 20).toISOString()
        },
        secret: {
          exactVenue: '\u0421\u0442\u0430\u043D\u0446\u0438\u044F SUP-\u0441\u0435\u0440\u0444\u0438\u043D\u0433\u0430 "\u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u044B\u0439 \u043F\u0440\u0438\u0447\u0430\u043B", \u043F\u043B\u044F\u0436 \u21163',
          exactAddress: "4-\u044F \u043B\u0438\u043D\u0438\u044F \u0425\u043E\u0440\u043E\u0448\u0451\u0432\u0441\u043A\u043E\u0433\u043E \u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u043E\u0433\u043E \u0411\u043E\u0440\u0430, \u0432\u043B. 19",
          organizerPhone: "+7 (915) 602-88-19",
          privateInstructions: "\u0412\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0443 \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u043E\u0433\u043E \u0448\u0430\u0442\u0440\u0430 \u043F\u0440\u043E\u043A\u0430\u0442\u0430, \u0432\u044B\u0434\u0430\u044E\u0442 \u0433\u0435\u0440\u043C\u043E\u043C\u0435\u0448\u043A\u0438 \u0434\u043B\u044F \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u0432.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-16",
          title: "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430 \u043F\u043E \u0441\u043A\u0440\u044B\u0442\u044B\u043C \u043F\u0430\u0440\u0430\u0434\u043D\u044B\u043C \u0438 \u0434\u043E\u0445\u043E\u0434\u043D\u044B\u043C \u0434\u043E\u043C\u0430\u043C \u044D\u043F\u043E\u0445\u0438 \u043C\u043E\u0434\u0435\u0440\u043D\u0430",
          category: "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430",
          description: "\u041A\u0430\u043A \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440, \u043F\u043E\u043A\u0430\u0436\u0443 \u0432\u0430\u043C 7 \u043D\u0435\u0432\u0435\u0440\u043E\u044F\u0442\u043D\u044B\u0445 \u0434\u043E\u0445\u043E\u0434\u043D\u044B\u0445 \u0434\u043E\u043C\u043E\u0432 \u043D\u0430\u0447\u0430\u043B\u0430 XX \u0432\u0435\u043A\u0430 \u0441 \u0432\u0438\u0442\u0440\u0430\u0436\u0430\u043C\u0438, \u043C\u0435\u0442\u043B\u0430\u0445\u0441\u043A\u043E\u0439 \u043F\u043B\u0438\u0442\u043A\u043E\u0439 \u0438 \u0447\u0443\u0433\u0443\u043D\u043D\u044B\u043C\u0438 \u043B\u0435\u0441\u0442\u043D\u0438\u0446\u0430\u043C\u0438, \u043C\u0438\u043C\u043E \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0432\u0441\u0435 \u043E\u0431\u044B\u0447\u043D\u043E \u043F\u0440\u043E\u0445\u043E\u0434\u044F\u0442 \u043D\u0435 \u0433\u043B\u044F\u0434\u044F.",
          date: tomorrowStr,
          time: "16:00",
          isToday: false,
          totalSpots: 7,
          occupiedSpots: 5,
          budget: "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0421\u0440\u0435\u0442\u0435\u043D\u043A\u0430 / \u0427\u0438\u0441\u0442\u044B\u0435 \u043F\u0440\u0443\u0434\u044B, ~1.3 \u043A\u043C",
          distanceKm: 1.3,
          imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80",
          organizerId: elena.id,
          organizer: toOrg(elena),
          status: "open",
          vibe: "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430",
          musicOrMood: "\u0412\u0434\u043E\u0445\u043D\u043E\u0432\u043B\u044F\u044E\u0449\u0430\u044F \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430 \u043C\u043E\u0434\u0435\u0440\u043D\u0430, \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0436\u0438\u043B\u044C\u0446\u043E\u0432 \u0438 \u043A\u043E\u0444\u0435 \u043F\u043E \u043F\u0443\u0442\u0438",
          icebreakerQuestion: "\u0412 \u0434\u043E\u043C\u0435 \u043A\u0430\u043A\u043E\u0439 \u044D\u043F\u043E\u0445\u0438 \u0432\u044B \u0431\u044B \u0445\u043E\u0442\u0435\u043B\u0438 \u043F\u043E\u0436\u0438\u0442\u044C \u0445\u043E\u0442\u044F \u0431\u044B \u043D\u0435\u0434\u0435\u043B\u044E?",
          requirements: "\u0422\u0438\u0448\u0438\u043D\u0430 \u0438 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435 \u043A \u0436\u0438\u0442\u0435\u043B\u044F\u043C \u0432\u043D\u0443\u0442\u0440\u0438 \u043F\u043E\u0434\u044A\u0435\u0437\u0434\u043E\u0432",
          rules: ["\u041D\u0435\u043A\u043E\u043C\u043C\u0435\u0440\u0447\u0435\u0441\u043A\u0430\u044F \u0434\u0440\u0443\u0436\u0435\u0441\u043A\u0430\u044F \u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0430, \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u0439\u0434\u0435\u043C \u0432 \u043A\u043E\u0444\u0435\u0439\u043D\u044E"],
          approvedParticipantIds: [anna.id, sofia.id, mikhail.id, dmitry.id],
          createdAt: new Date(Date.now() - 36e5 * 22).toISOString()
        },
        secret: {
          exactVenue: "\u0423 \u0432\u0445\u043E\u0434\u0430 \u0432 \u0442\u0435\u0430\u0442\u0440 Et Cetera \u0432\u043E \u0424\u0440\u043E\u043B\u043E\u0432\u043E\u043C \u043F\u0435\u0440\u0435\u0443\u043B\u043A\u0435",
          exactAddress: "\u0424\u0440\u043E\u043B\u043E\u0432 \u043F\u0435\u0440., 2 (\u043C. \u0422\u0443\u0440\u0433\u0435\u043D\u0435\u0432\u0441\u043A\u0430\u044F)",
          organizerPhone: "+7 (903) 777-34-21",
          privateInstructions: "\u0412\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0443 \u0433\u043B\u0430\u0432\u043D\u044B\u0445 \u043A\u043E\u043B\u043E\u043D\u043D \u0442\u0435\u0430\u0442\u0440\u0430, \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0437\u0430\u0439\u043C\u0435\u0442 \u043E\u043A\u043E\u043B\u043E 1.5 \u0447\u0430\u0441\u043E\u0432.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-17",
          title: "\u0411\u043E\u0443\u043B\u0438\u043D\u0433, \u0440\u0435\u0442\u0440\u043E-\u0430\u0440\u043A\u0430\u0434\u044B \u0438 \u043D\u0435\u0430\u043F\u043E\u043B\u0438\u0442\u0430\u043D\u0441\u043A\u0430\u044F \u043F\u0438\u0446\u0446\u0430 \u0432 \u0447\u0435\u0441\u0442\u044C 30-\u043B\u0435\u0442\u0438\u044F!",
          category: "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F",
          description: "\u041E\u0442\u043C\u0435\u0447\u0430\u044E \u044E\u0431\u0438\u043B\u0435\u0439 \u0431\u0435\u0437 \u0441\u043A\u0443\u0447\u043D\u044B\u0445 \u0431\u0430\u043D\u043A\u0435\u0442\u043E\u0432! \u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043B \u0434\u0432\u0435 \u0434\u043E\u0440\u043E\u0436\u043A\u0438 \u0431\u043E\u0443\u043B\u0438\u043D\u0433\u0430, \u0436\u0435\u0442\u043E\u043D\u044B \u043D\u0430 \u0440\u0435\u0442\u0440\u043E-\u0430\u0432\u0442\u043E\u043C\u0430\u0442\u044B (\u0430\u044D\u0440\u043E\u0445\u043E\u043A\u043A\u0435\u0439, \u043F\u0438\u043D\u0431\u043E\u043B, \u0433\u043E\u043D\u043A\u0438) \u0438 \u0433\u043E\u0440\u0443 \u0433\u043E\u0440\u044F\u0447\u0435\u0439 \u043F\u0438\u0446\u0446\u044B \u0438\u0437 \u0434\u0440\u043E\u0432\u044F\u043D\u043E\u0439 \u043F\u0435\u0447\u0438. \u0411\u0443\u0434\u0443 \u0440\u0430\u0434 \u043D\u043E\u0432\u044B\u043C \u0434\u0440\u0443\u0437\u044C\u044F\u043C!",
          date: inTwoDaysStr,
          time: "20:00",
          isToday: false,
          totalSpots: 8,
          occupiedSpots: 6,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041F\u0430\u0440\u043A \u041A\u0443\u043B\u044C\u0442\u0443\u0440\u044B, ~2.4 \u043A\u043C",
          distanceKm: 2.4,
          imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=900&q=80",
          organizerId: dmitry.id,
          organizer: toOrg(dmitry),
          status: "open",
          vibe: "\u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0432\u0430\u0439\u0431",
          musicOrMood: "\u0421\u0442\u0440\u0430\u0439\u043A\u0438, \u043D\u0435\u043E\u043D\u043E\u0432\u044B\u0439 \u0441\u0432\u0435\u0442 \u0430\u0440\u043A\u0430\u0434\u043D\u044B\u0445 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u043E\u0432 \u0438 \u0444\u0430\u043D\u043A-\u043C\u0443\u0437\u044B\u043A\u0430",
          icebreakerQuestion: "\u0412 \u043A\u0430\u043A\u043E\u0439 \u0430\u0440\u043A\u0430\u0434\u043D\u043E\u0439 \u0438\u0433\u0440\u0435 \u0432\u0430\u043C \u043D\u0435\u0442 \u0440\u0430\u0432\u043D\u044B\u0445?",
          requirements: "\u0410\u0437\u0430\u0440\u0442 \u0438 \u043F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u043E\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435",
          rules: ["\u0414\u043E\u0440\u043E\u0436\u043A\u0438 \u0431\u043E\u0443\u043B\u0438\u043D\u0433\u0430 \u0441 \u043C\u0435\u043D\u044F \u043A\u0430\u043A \u0441 \u0438\u043C\u0435\u043D\u0438\u043D\u043D\u0438\u043A\u0430, \u043D\u0430\u043F\u0438\u0442\u043A\u0438 \u0438 \u043A\u0443\u0445\u043D\u044F \u2014 \u0432 \u0441\u043A\u043B\u0430\u0434\u0447\u0438\u043D\u0443"],
          approvedParticipantIds: [anna.id, mikhail.id, artem.id, polina.id, elena.id],
          createdAt: new Date(Date.now() - 36e5 * 25).toISOString()
        },
        secret: {
          exactVenue: '\u0411\u043E\u0443\u043B\u0438\u043D\u0433-\u043B\u0430\u0443\u043D\u0436 "\u0421\u0442\u0440\u0430\u0439\u043A & \u041F\u0438\u0446\u0446\u0430", \u0434\u043E\u0440\u043E\u0436\u043A\u0438 \u21165 \u0438 \u21166',
          exactAddress: "\u041A\u043E\u043C\u0441\u043E\u043C\u043E\u043B\u044C\u0441\u043A\u0438\u0439 \u043F\u0440\u043E\u0441\u043F\u0435\u043A\u0442, 28 (\u043C. \u0424\u0440\u0443\u043D\u0437\u0435\u043D\u0441\u043A\u0430\u044F / \u041F\u0430\u0440\u043A \u041A\u0443\u043B\u044C\u0442\u0443\u0440\u044B)",
          organizerPhone: "+7 (926) 881-34-90",
          privateInstructions: "\u0421\u043F\u0443\u0441\u043A\u0430\u0439\u0442\u0435\u0441\u044C \u043D\u0430 -1 \u044D\u0442\u0430\u0436 \u043A \u0437\u043E\u043D\u0435 \u043D\u0435\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0431\u0430\u0440\u0430, \u0434\u043E\u0440\u043E\u0436\u043A\u0438 \u043F\u0440\u044F\u043C\u043E \u043D\u0430\u043F\u0440\u043E\u0442\u0438\u0432.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-18",
          title: "\u0412\u0430\u043D\u0448\u043E\u0442 Dungeons & Dragons \u0434\u043B\u044F \u043D\u043E\u0432\u0438\u0447\u043A\u043E\u0432 (\u0433\u043E\u0442\u043E\u0432\u044B\u0435 \u0433\u0435\u0440\u043E\u0438 \u0438 \u043A\u0443\u0431\u0438\u043A\u0438)",
          category: "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B",
          description: "\u041F\u0440\u043E\u0432\u043E\u0436\u0443 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u043D\u043E\u0435 \u0434\u0435\u0442\u0435\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u043F\u0440\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0432 \u043C\u0438\u0440\u0435 D&D \u043D\u0430 \u043E\u0434\u0438\u043D \u0432\u0435\u0447\u0435\u0440 (4 \u0447\u0430\u0441\u0430). \u041D\u0438\u0447\u0435\u0433\u043E \u0443\u0447\u0438\u0442\u044C \u0437\u0430\u0440\u0430\u043D\u0435\u0435 \u043D\u0435 \u043D\u0443\u0436\u043D\u043E: \u044F \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u043B \u043A\u0440\u0430\u0441\u0438\u0432\u044B\u0445 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u0439, \u043C\u0438\u043D\u0438\u0430\u0442\u044E\u0440\u044B, \u043A\u0430\u0440\u0442\u044B, \u0437\u0432\u0443\u043A\u043E\u0432\u043E\u0435 \u0441\u043E\u043F\u0440\u043E\u0432\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u0438 \u043D\u0430\u0431\u043E\u0440\u044B \u043A\u0443\u0431\u0438\u043A\u043E\u0432!",
          date: inTwoDaysStr,
          time: "15:00",
          isToday: false,
          totalSpots: 5,
          occupiedSpots: 4,
          budget: "\u0434\u043E 1 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041C\u0435\u043D\u0434\u0435\u043B\u0435\u0435\u0432\u0441\u043A\u0430\u044F / \u041D\u043E\u0432\u043E\u0441\u043B\u043E\u0431\u043E\u0434\u0441\u043A\u0430\u044F, ~2.2 \u043A\u043C",
          distanceKm: 2.2,
          imageUrl: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=80",
          organizerId: artem.id,
          organizer: toOrg(artem),
          status: "open",
          vibe: "\u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0438\u0433\u0440\u0430",
          musicOrMood: "\u0424\u044D\u043D\u0442\u0435\u0437\u0438-\u0441\u0430\u0443\u043D\u0434\u0442\u0440\u0435\u043A, \u0431\u0440\u043E\u0441\u043A\u0438 \u0434\u0432\u0430\u0434\u0446\u0430\u0442\u0438\u0433\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043A\u0443\u0431\u0438\u043A\u0430 \u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u043D\u043E\u0435 \u043F\u0440\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435",
          icebreakerQuestion: "\u041A\u0435\u043C \u0431\u044B \u0432\u044B \u0431\u044B\u043B\u0438 \u0432 \u0444\u044D\u043D\u0442\u0435\u0437\u0438-\u043C\u0438\u0440\u0435: \u043C\u0430\u0433\u043E\u043C, \u0441\u043B\u0435\u0434\u043E\u043F\u044B\u0442\u043E\u043C, \u0431\u0430\u0440\u0434\u043E\u043C \u0438\u043B\u0438 \u043F\u043B\u0443\u0442\u043E\u043C?",
          requirements: "\u0424\u0430\u043D\u0442\u0430\u0437\u0438\u044F \u0438 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435 \u043A \u0445\u043E\u0434\u0443 \u0434\u0440\u0443\u0433\u0438\u0445 \u0438\u0433\u0440\u043E\u043A\u043E\u0432",
          rules: ["\u041E\u043F\u043B\u0430\u0442\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u0437\u0430 \u043A\u043E\u043C\u043D\u0430\u0442\u0443 \u0432 \u043A\u043B\u0443\u0431\u0435 (~600 \u20BD \u0441 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430), \u0447\u0430\u0439 \u0438 \u043F\u0435\u0447\u0435\u043D\u044C\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B"],
          approvedParticipantIds: [mikhail.id, sofia.id, elena.id],
          createdAt: new Date(Date.now() - 36e5 * 28).toISOString()
        },
        secret: {
          exactVenue: '\u041A\u043B\u0443\u0431 \u0440\u043E\u043B\u0435\u0432\u044B\u0445 \u0438\u0433\u0440 "\u0422\u0430\u0432\u0435\u0440\u043D\u0430 \u0412\u043E\u0441\u044C\u043C\u0438\u0433\u0440\u0430\u043D\u043D\u0438\u043A", VIP-\u043A\u043E\u043C\u043D\u0430\u0442\u0430 "\u0417\u0430\u043C\u043E\u043A"',
          exactAddress: "\u0443\u043B. \u041D\u043E\u0432\u043E\u0441\u043B\u043E\u0431\u043E\u0434\u0441\u043A\u0430\u044F, 36/1, \u0441\u0442\u0440. 1",
          organizerPhone: "+7 (999) 114-56-23",
          privateInstructions: "2 \u044D\u0442\u0430\u0436, \u0434\u0432\u0435\u0440\u044C \u0441 \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u043E\u0439 \u0432\u044B\u0432\u0435\u0441\u043A\u043E\u0439 \u0434\u0440\u0430\u043A\u043E\u043D\u0430.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-19",
          title: "\u0414\u0436\u0430\u0437 \u043F\u0440\u0438 \u0441\u0432\u0435\u0447\u0430\u0445 \u0432 \u0442\u0440\u043E\u043F\u0438\u0447\u0435\u0441\u043A\u043E\u0439 \u043E\u0440\u0430\u043D\u0436\u0435\u0440\u0435\u0435: \u0441\u0430\u043A\u0441\u043E\u0444\u043E\u043D \u0438 \u0440\u043E\u044F\u043B\u044C",
          category: "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442",
          description: "\u0412\u0435\u0447\u0435\u0440 \u043A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043D\u044C\u044E-\u0439\u043E\u0440\u043A\u0441\u043A\u043E\u0433\u043E \u0434\u0436\u0430\u0437\u0430 \u0441\u0440\u0435\u0434\u0438 \u0436\u0438\u0432\u044B\u0445 \u043F\u0430\u043B\u044C\u043C, \u043E\u0440\u0445\u0438\u0434\u0435\u0439 \u0438 \u0441\u043E\u0442\u0435\u043D \u0441\u0432\u0435\u0447\u0435\u0439. \u0418\u0434\u0435\u043C \u043A\u0440\u0430\u0441\u0438\u0432\u043E\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0435\u0439 \u043D\u0430\u0441\u043B\u0430\u0434\u0438\u0442\u044C\u0441\u044F \u0436\u0438\u0432\u044B\u043C \u0437\u0432\u0443\u043A\u043E\u043C, \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u0432 \u0441\u0430\u0434\u0443 \u0438 \u043F\u043E\u0441\u043B\u0435 \u043A\u043E\u043D\u0446\u0435\u0440\u0442\u0430 \u0432\u044B\u043F\u0438\u0442\u044C \u043A\u0430\u043A\u0430\u043E.",
          date: todayStr,
          time: "20:00",
          isToday: true,
          totalSpots: 4,
          occupiedSpots: 3,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041F\u0440\u043E\u0441\u043F\u0435\u043A\u0442 \u041C\u0438\u0440\u0430, ~2.8 \u043A\u043C",
          distanceKm: 2.8,
          imageUrl: "./assets/images/event_live_concert_1794332915302.jpg",
          organizerId: anna.id,
          organizer: toOrg(anna),
          status: "open",
          vibe: "\u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0432\u0430\u0439\u0431",
          musicOrMood: "\u041C\u044F\u0433\u043A\u0438\u0439 \u0441\u0430\u043A\u0441\u043E\u0444\u043E\u043D, \u0442\u0440\u043E\u043F\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0437\u0435\u043B\u0435\u043D\u044C \u0438 \u043C\u0435\u0440\u0446\u0430\u043D\u0438\u0435 \u0441\u0432\u0435\u0447\u0435\u0439",
          icebreakerQuestion: "\u041A\u0430\u043A\u0430\u044F \u043C\u0443\u0437\u044B\u043A\u0430 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0442 \u0432\u0430\u043C \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u0434\u043D\u044F?",
          requirements: "\u041A\u043E\u043A\u0442\u0435\u0439\u043B\u044C\u043D\u044B\u0439 \u0438\u043B\u0438 smart-casual \u0441\u0442\u0438\u043B\u044C \u043F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442\u0441\u044F",
          rules: ["\u0411\u0438\u043B\u0435\u0442\u044B \u0432 \u043F\u0430\u0440\u0442\u0435\u0440 (1 900 \u20BD), \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0437\u0430 25 \u043C\u0438\u043D\u0443\u0442 \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0433\u0443\u043B\u044F\u0442\u044C \u043F\u043E \u0441\u0430\u0434\u0443"],
          approvedParticipantIds: [sofia.id, dmitry.id],
          createdAt: new Date(Date.now() - 36e5 * 4).toISOString()
        },
        secret: {
          exactVenue: "\u0422\u0440\u043E\u043F\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0440\u0430\u043D\u0436\u0435\u0440\u0435\u044F \u0411\u043E\u0442\u0430\u043D\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0441\u0430\u0434\u0430, \u0438\u0441\u0442\u043E\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0430\u0432\u0438\u043B\u044C\u043E\u043D",
          exactAddress: "\u041F\u0440\u043E\u0441\u043F\u0435\u043A\u0442 \u041C\u0438\u0440\u0430, 26, \u0441\u0442\u0440. 1",
          organizerPhone: "+7 (916) 555-01-92",
          privateInstructions: "\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 \u0441\u0442\u0435\u043A\u043B\u044F\u043D\u043D\u044B\u0439 \u0430\u0442\u0440\u0438\u0443\u043C \u043E\u0440\u0430\u043D\u0436\u0435\u0440\u0435\u0438, \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0443 \u0444\u043E\u043D\u0442\u0430\u043D\u0430 \u0432\u043D\u0443\u0442\u0440\u0438.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-20",
          title: "\u041E\u0434\u043D\u043E\u0434\u043D\u0435\u0432\u043D\u044B\u0439 \u0445\u0430\u0439\u043A\u0438\u043D\u0433 \u0432\u0434\u043E\u043B\u044C \u0431\u0435\u0440\u0435\u0433\u0430 \u041E\u043A\u0438 \u0438 \u043E\u0431\u0435\u0434 \u043D\u0430 \u043A\u043E\u0441\u0442\u0440\u0435 \u0432 \u0441\u043E\u0441\u043D\u043E\u0432\u043E\u043C \u0431\u043E\u0440\u0443",
          category: "\u041F\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0438\u0435",
          description: "\u041F\u0440\u043E\u0445\u043E\u0434\u0438\u043C \u0436\u0438\u0432\u043E\u043F\u0438\u0441\u043D\u044B\u0439 \u043B\u0435\u0441\u043D\u043E\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 14 \u043A\u043C \u043F\u043E \u043F\u0435\u0441\u0447\u0430\u043D\u044B\u043C \u0442\u0440\u043E\u043F\u0430\u043C \u0432\u0434\u043E\u043B\u044C \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u0431\u0435\u0440\u0435\u0433\u0430 \u041E\u043A\u0438, \u0437\u0430\u0445\u043E\u0434\u0438\u043C \u0432 \u0437\u0430\u043F\u043E\u0432\u0435\u0434\u043D\u0438\u043A \u0438 \u0443\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043F\u0440\u0438\u0432\u0430\u043B \u0441 \u043F\u043E\u0445\u043E\u0434\u043D\u044B\u043C \u0441\u0443\u043F\u043E\u043C \u0438 \u043A\u043E\u0444\u0435 \u0432 \u0433\u0435\u0439\u0437\u0435\u0440\u043D\u043E\u0439 \u0442\u0443\u0440\u043A\u0435 \u043D\u0430 \u0433\u043E\u0440\u0435\u043B\u043A\u0435.",
          date: inThreeDaysStr,
          time: "08:45",
          isToday: false,
          totalSpots: 8,
          occupiedSpots: 6,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0412\u044B\u0435\u0437\u0434 \u0441 \u041A\u0443\u0440\u0441\u043A\u043E\u0433\u043E \u0432\u043E\u043A\u0437\u0430\u043B\u0430, ~2.5 \u043A\u043C",
          distanceKm: 2.5,
          imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80",
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u0417\u0430\u043F\u0430\u0445 \u0441\u043E\u0441\u043D\u043E\u0432\u043E\u0439 \u0445\u0432\u043E\u0438, \u043F\u0430\u043D\u043E\u0440\u0430\u043C\u0430 \u0440\u0435\u043A\u0438 \u0438 \u0433\u043E\u0440\u044F\u0447\u0438\u0439 \u043A\u043E\u0444\u0435 \u0438\u0437 \u043A\u0440\u0443\u0436\u043A\u0438",
          icebreakerQuestion: "\u0421\u0430\u043C\u043E\u0435 \u043A\u0440\u0430\u0441\u0438\u0432\u043E\u0435 \u043F\u0440\u0438\u0440\u043E\u0434\u043D\u043E\u0435 \u043C\u0435\u0441\u0442\u043E, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u044B \u0432\u0438\u0434\u0435\u043B\u0438 \u0441\u0432\u043E\u0438\u043C\u0438 \u0433\u043B\u0430\u0437\u0430\u043C\u0438?",
          requirements: "\u0422\u0440\u0435\u043A\u043A\u0438\u043D\u0433\u043E\u0432\u044B\u0435 \u0431\u043E\u0442\u0438\u043D\u043A\u0438 \u0438\u043B\u0438 \u043A\u0440\u043E\u0441\u0441\u043E\u0432\u043A\u0438 \u0441 \u043F\u0440\u043E\u0442\u0435\u043A\u0442\u043E\u0440\u043E\u043C, \u0442\u0435\u0440\u043C\u043E\u0441 \u0441 \u0432\u043E\u0434\u043E\u0439",
          rules: ["\u042D\u043B\u0435\u043A\u0442\u0440\u0438\u0447\u043A\u0430-\u044D\u043A\u0441\u043F\u0440\u0435\u0441\u0441 + \u043E\u0431\u0449\u0438\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B \u043D\u0430 \u043F\u0440\u0438\u0432\u0430\u043B (~1 400 \u20BD \u0441 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430)"],
          approvedParticipantIds: [mikhail.id, elena.id, dmitry.id, artem.id, polina.id],
          createdAt: new Date(Date.now() - 36e5 * 30).toISOString()
        },
        secret: {
          exactVenue: "\u041A\u0443\u0440\u0441\u043A\u0438\u0439 \u0432\u043E\u043A\u0437\u0430\u043B, \u0437\u0430\u043B \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u044D\u043A\u0441\u043F\u0440\u0435\u0441\u0441\u043E\u0432 \u0443 \u0432\u044B\u0445\u043E\u0434\u0430 \u043A \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430\u043C",
          exactAddress: "\u0443\u043B. \u0417\u0435\u043C\u043B\u044F\u043D\u043E\u0439 \u0412\u0430\u043B, 29",
          organizerPhone: "+7 (915) 602-88-19",
          privateInstructions: "\u0411\u0435\u0440\u0435\u043C \u0431\u0438\u043B\u0435\u0442\u044B \u0432\u043E 2 \u0432\u0430\u0433\u043E\u043D \u044D\u043A\u0441\u043F\u0440\u0435\u0441\u0441\u0430 \u043D\u0430 \u0421\u0435\u0440\u043F\u0443\u0445\u043E\u0432. \u042F \u0441 \u0437\u0435\u043B\u0435\u043D\u044B\u043C \u0442\u0443\u0440\u0438\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0440\u044E\u043A\u0437\u0430\u043A\u043E\u043C Osprey.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-21",
          title: "\u0421\u0435\u043A\u0440\u0435\u0442\u043D\u044B\u0439 \u0441\u043F\u0438\u043A\u0438\u0437\u0438-\u0431\u0430\u0440 \u0437\u0430 \u043A\u043D\u0438\u0436\u043D\u044B\u043C \u0448\u043A\u0430\u0444\u043E\u043C: \u0434\u0435\u0433\u0443\u0441\u0442\u0430\u0446\u0438\u044F \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0445 \u043C\u0438\u043A\u0441\u043E\u0432",
          category: "\u0420\u0435\u0441\u0442\u043E\u0440\u0430\u043D / \u0411\u0430\u0440",
          description: "\u0418\u0434\u0435\u043C \u0432 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u043D\u044B\u0439 \u0431\u0430\u0440 \u0431\u0435\u0437 \u0432\u044B\u0432\u0435\u0441\u043A\u0438, \u0432\u0445\u043E\u0434 \u0432 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u043F\u0440\u044F\u0442\u0430\u043D \u0437\u0430 \u0441\u0442\u0430\u0440\u0438\u043D\u043D\u044B\u043C \u043A\u043D\u0438\u0436\u043D\u044B\u043C \u0448\u043A\u0430\u0444\u043E\u043C. \u0412 \u043C\u0435\u043D\u044E \u043A\u0430\u043A \u0441\u043B\u043E\u0436\u043D\u044B\u0435 \u0431\u043E\u0442\u0430\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0431\u0435\u0437\u0430\u043B\u043A\u043E\u0433\u043E\u043B\u044C\u043D\u044B\u0435 \u043C\u0438\u043A\u0441\u044B, \u0442\u0430\u043A \u0438 \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0430\u044F \u043A\u043B\u0430\u0441\u0441\u0438\u043A\u0430 + \u0442\u0430\u043F\u0430\u0441.",
          date: todayStr,
          time: "21:00",
          isToday: true,
          totalSpots: 5,
          occupiedSpots: 3,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041F\u043E\u043A\u0440\u043E\u0432\u043A\u0430 / \u041C\u0430\u0440\u043E\u0441\u0435\u0439\u043A\u0430, ~0.9 \u043A\u043C",
          distanceKm: 0.9,
          imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80",
          organizerId: anna.id,
          organizer: toOrg(anna),
          status: "open",
          vibe: "\u0413\u0430\u0441\u0442\u0440\u043E-\u0432\u0435\u0447\u0435\u0440",
          musicOrMood: "\u0412\u0438\u043D\u0438\u043B\u043E\u0432\u044B\u0439 \u0444\u0430\u043D\u043A, \u043F\u0440\u0438\u0433\u043B\u0443\u0448\u0435\u043D\u043D\u044B\u0439 \u0441\u0432\u0435\u0442 \u0438 \u043A\u0430\u043C\u0435\u0440\u043D\u044B\u0435 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u044B",
          icebreakerQuestion: "\u0415\u0441\u043B\u0438 \u0431\u044B \u0432\u044B \u043E\u0442\u043A\u0440\u044B\u043B\u0438 \u0441\u0432\u043E\u0435 \u0437\u0430\u0432\u0435\u0434\u0435\u043D\u0438\u0435, \u043A\u0430\u043A\u0438\u043C \u0431\u044B \u043E\u043D\u043E \u0431\u044B\u043B\u043E?",
          requirements: "21+, \u0443\u0432\u0430\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u0449\u0435\u043D\u0438\u0435",
          rules: ["\u041A\u0430\u0436\u0434\u044B\u0439 \u043E\u043F\u043B\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u0441\u0432\u043E\u0439 \u0437\u0430\u043A\u0430\u0437 \u043F\u043E \u043C\u0435\u043D\u044E"],
          approvedParticipantIds: [dmitry.id, polina.id],
          createdAt: new Date(Date.now() - 36e5 * 3).toISOString()
        },
        secret: {
          exactVenue: '\u0421\u043F\u0438\u043A\u0438\u0437\u0438-\u0433\u043E\u0441\u0442\u0438\u043D\u0430\u044F "\u041A\u0430\u0431\u0438\u043D\u0435\u0442 \u0410\u0440\u0445\u0438\u0432\u0430\u0440\u0438\u0443\u0441\u0430"',
          exactAddress: "\u0443\u043B. \u041F\u043E\u043A\u0440\u043E\u0432\u043A\u0430, 17 (\u0432\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 \u0431\u0443\u043A\u0438\u043D\u0438\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u043B\u0430\u0432\u043A\u0443)",
          organizerPhone: "+7 (916) 555-01-92",
          privateInstructions: "\u0412\u043D\u0443\u0442\u0440\u0438 \u043B\u0430\u0432\u043A\u0438 \u043F\u043E\u0442\u044F\u043D\u0438\u0442\u0435 \u0437\u0430 \u0442\u043E\u043C \u044D\u043D\u0446\u0438\u043A\u043B\u043E\u043F\u0435\u0434\u0438\u0438 \u043D\u0430 \u0442\u0440\u0435\u0442\u044C\u0435\u0439 \u043F\u043E\u043B\u043A\u0435 \u0441\u043B\u0435\u0432\u0430. \u0411\u0440\u043E\u043D\u044C \u043D\u0430 \u0410\u043D\u043D\u0443.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-22",
          title: "\u0411\u043E\u0443\u043B\u0434\u0435\u0440\u0438\u043D\u0433 \u043D\u0430 \u0441\u043A\u0430\u043B\u043E\u0434\u0440\u043E\u043C\u0435 \u0434\u043B\u044F \u043B\u044E\u0431\u043E\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F + \u043F\u0443\u044D\u0440 \u0432 \u0447\u0430\u0439\u043D\u043E\u0439 \u0437\u043E\u043D\u0435",
          category: "\u0421\u043F\u043E\u0440\u0442",
          description: "\u041B\u0430\u0437\u0430\u0435\u043C \u043F\u0440\u043E\u0441\u0442\u044B\u0435 \u0438 \u0441\u0440\u0435\u0434\u043D\u0438\u0435 \u0442\u0440\u0430\u0441\u0441\u044B \u043D\u0430 \u043D\u0435\u0432\u044B\u0441\u043E\u043A\u043E\u043C \u0441\u043A\u0430\u043B\u043E\u0434\u0440\u043E\u043C\u0435 \u0441 \u043C\u044F\u0433\u043A\u0438\u043C\u0438 \u043C\u0430\u0442\u0430\u043C\u0438 (\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u043A\u0430 \u0432\u0435\u0440\u0435\u0432\u043A\u0430\u043C\u0438 \u043D\u0435 \u043D\u0443\u0436\u043D\u0430). \u041E\u0447\u0435\u043D\u044C \u0432\u0435\u0441\u0435\u043B\u043E \u0440\u0430\u0437\u0433\u0430\u0434\u044B\u0432\u0430\u0442\u044C \u0442\u0440\u0430\u0441\u0441\u044B \u0432\u043C\u0435\u0441\u0442\u0435 \u0438 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0437\u0430\u0446\u0435\u043F\u043A\u0438!",
          date: tomorrowStr,
          time: "19:30",
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0421\u0430\u0432\u0435\u043B\u043E\u0432\u0441\u043A\u0430\u044F / \u0414\u0438\u043D\u0430\u043C\u043E, ~3.6 \u043A\u043C",
          distanceKm: 3.6,
          imageUrl: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80",
          organizerId: mikhail.id,
          organizer: toOrg(mikhail),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u0421\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u044B\u0439 \u0430\u0437\u0430\u0440\u0442, \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0438 \u043A\u0438\u0442\u0430\u0439\u0441\u043A\u0438\u0439 \u0447\u0430\u0439 \u043F\u043E\u0441\u043B\u0435 \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438",
          icebreakerQuestion: "\u0411\u043E\u0438\u0442\u0435\u0441\u044C \u043B\u0438 \u0432\u044B \u0432\u044B\u0441\u043E\u0442\u044B \u0438\u043B\u0438 \u043D\u0430\u043E\u0431\u043E\u0440\u043E\u0442 \u043B\u044E\u0431\u0438\u0442\u0435 \u0437\u0430\u0431\u0438\u0440\u0430\u0442\u044C\u0441\u044F \u043F\u043E\u0432\u044B\u0448\u0435?",
          requirements: "\u0423\u0434\u043E\u0431\u043D\u044B\u0435 \u0441\u043F\u043E\u0440\u0442\u0438\u0432\u043D\u044B\u0435 \u0448\u0442\u0430\u043D\u044B \u0438 \u0444\u0443\u0442\u0431\u043E\u043B\u043A\u0430, \u0441\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0442\u0443\u0444\u043B\u0438 \u0434\u0430\u044E\u0442 \u0432 \u043F\u0440\u043E\u043A\u0430\u0442\u0435",
          rules: ["\u0412\u0445\u043E\u0434 \u043D\u0430 \u0441\u043A\u0430\u043B\u043E\u0434\u0440\u043E\u043C \u0438 \u043F\u0440\u043E\u043A\u0430\u0442 \u0441\u043A\u0430\u043B\u044C\u043D\u0438\u043A\u043E\u0432 (~1 200 \u20BD)"],
          approvedParticipantIds: [maxim.id, elena.id, artem.id],
          createdAt: new Date(Date.now() - 36e5 * 11).toISOString()
        },
        secret: {
          exactVenue: '\u0421\u043A\u0430\u043B\u043E\u0434\u0440\u043E\u043C "Limestone", \u0437\u043E\u043D\u0430 \u043E\u0442\u0434\u044B\u0445\u0430 \u0443 \u0447\u0430\u0439\u043D\u043E\u0433\u043E \u0431\u0430\u0440\u0430',
          exactAddress: "\u041B\u0435\u043D\u0438\u043D\u0433\u0440\u0430\u0434\u0441\u043A\u0438\u0439 \u043F\u0440\u043E\u0441\u043F\u0435\u043A\u0442, 36, \u0441\u0442\u0440. 29",
          organizerPhone: "+7 (925) 444-12-88",
          privateInstructions: '\u0412\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u043C\u0441\u044F \u0432 19:20 \u0443 \u0440\u0435\u0441\u0435\u043F\u0448\u0435\u043D\u0430, \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0437\u043C\u0438\u043D\u043A\u0438 \u0438\u0434\u0435\u043C \u043A \u0441\u0435\u043A\u0442\u043E\u0440\u0443 "\u041D\u043E\u0432\u0438\u0447\u043E\u043A".',
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-23",
          title: "\u0413\u0440\u0438\u043B\u044C-\u043F\u0438\u043A\u043D\u0438\u043A \u0432 \u043B\u0435\u0441\u043D\u043E\u0439 \u0431\u0435\u0441\u0435\u0434\u043A\u0435 \u0443 \u043E\u0437\u0435\u0440\u0430: \u0445\u0430\u043B\u0443\u043C\u0438, \u0441\u0442\u0435\u0439\u043A\u0438 \u0438 \u0433\u0438\u0442\u0430\u0440\u0430",
          category: "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438",
          description: "\u0410\u0440\u0435\u043D\u0434\u043E\u0432\u0430\u043B\u0438 \u0443\u044E\u0442\u043D\u0443\u044E \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u0443\u044E \u0431\u0435\u0441\u0435\u0434\u043A\u0443 \u0441 \u043C\u0430\u043D\u0433\u0430\u043B\u043E\u043C \u043D\u0430 \u0431\u0435\u0440\u0435\u0433\u0443 \u043B\u0435\u0441\u043D\u043E\u0433\u043E \u043E\u0437\u0435\u0440\u0430! \u0416\u0430\u0440\u0438\u043C \u0441\u044B\u0440 \u0445\u0430\u043B\u0443\u043C\u0438, \u043E\u0432\u043E\u0449\u0438 \u043D\u0430 \u0433\u0440\u0438\u043B\u0435, \u0441\u0442\u0435\u0439\u043A\u0438, \u0437\u0430\u0432\u0430\u0440\u0438\u0432\u0430\u0435\u043C \u043E\u0431\u043B\u0435\u043F\u0438\u0445\u043E\u0432\u044B\u0439 \u0447\u0430\u0439 \u0438 \u043F\u043E\u0435\u043C \u043B\u044E\u0431\u0438\u043C\u044B\u0435 \u043F\u0435\u0441\u043D\u0438 \u043F\u043E\u0434 \u0430\u043A\u0443\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0443\u044E \u0433\u0438\u0442\u0430\u0440\u0443.",
          date: inFourDaysStr,
          time: "14:30",
          isToday: false,
          totalSpots: 10,
          occupiedSpots: 7,
          budget: "1 000\u20133 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041C\u0435\u0449\u0435\u0440\u0441\u043A\u0438\u0439 \u043F\u0430\u0440\u043A, ~6.2 \u043A\u043C",
          distanceKm: 6.2,
          imageUrl: "./assets/images/event_outdoor_picnic_1794332913731.jpg",
          organizerId: polina.id,
          organizer: toOrg(polina),
          status: "open",
          vibe: "\u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0432\u0430\u0439\u0431",
          musicOrMood: "\u0422\u0440\u0435\u0441\u043A \u0443\u0433\u043B\u0435\u0439, \u0441\u043E\u0441\u043D\u043E\u0432\u044B\u0439 \u043B\u0435\u0441, \u0433\u0438\u0442\u0430\u0440\u0430 \u0438 \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0435 \u0441\u043E\u0443\u0441\u044B \u043E\u0442 \u0448\u0435\u0444\u0430",
          icebreakerQuestion: "\u041A\u0430\u043A\u0443\u044E \u043F\u0435\u0441\u043D\u044E \u0443 \u043A\u043E\u0441\u0442\u0440\u0430 \u0432\u044B \u0437\u043D\u0430\u0435\u0442\u0435 \u043D\u0430\u0438\u0437\u0443\u0441\u0442\u044C \u043E\u0442 \u043D\u0430\u0447\u0430\u043B\u0430 \u0434\u043E \u043A\u043E\u043D\u0446\u0430?",
          requirements: "\u0422\u0435\u043F\u043B\u044B\u0439 \u0441\u0432\u0438\u0442\u0435\u0440 \u043D\u0430 \u0432\u0435\u0447\u0435\u0440 \u0438 \u043E\u0442\u043B\u0438\u0447\u043D\u043E\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435",
          rules: ["\u0417\u0430\u043A\u0443\u043F\u043A\u0443 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432 \u0438 \u0430\u0440\u0435\u043D\u0434\u0443 \u0431\u0435\u0441\u0435\u0434\u043A\u0438 \u0434\u0435\u043B\u0438\u043C \u043F\u043E\u0440\u043E\u0432\u043D\u0443 (~1 600 \u20BD \u0441 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430)"],
          approvedParticipantIds: [anna.id, mikhail.id, elena.id, dmitry.id, sofia.id, maxim.id],
          createdAt: new Date(Date.now() - 36e5 * 35).toISOString()
        },
        secret: {
          exactVenue: '\u041F\u0438\u043A\u043D\u0438\u043A\u043E\u0432\u0430\u044F \u0437\u043E\u043D\u0430 "\u041B\u0435\u0441\u043D\u0430\u044F \u0431\u0443\u0445\u0442\u0430", \u0431\u0435\u0441\u0435\u0434\u043A\u0430 \u21164 \u0443 \u0432\u043E\u0434\u044B',
          exactAddress: "\u041C\u0435\u0449\u0435\u0440\u0441\u043A\u0438\u0439 \u043F\u0430\u0440\u043A, \u0432\u0445\u043E\u0434 \u0441\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u041D\u043E\u0432\u043E\u043C\u0435\u0449\u0435\u0440\u0441\u043A\u043E\u0433\u043E \u043F\u0440\u043E\u0435\u0437\u0434\u0430, 15",
          organizerPhone: "+7 (916) 210-45-11",
          privateInstructions: "\u041E\u0442 \u043F\u0430\u0440\u043A\u043E\u0432\u043A\u0438 400 \u043C\u0435\u0442\u0440\u043E\u0432 \u043F\u043E \u0434\u0435\u0440\u0435\u0432\u044F\u043D\u043D\u043E\u043C\u0443 \u043D\u0430\u0441\u0442\u0438\u043B\u0443 \u0432\u0434\u043E\u043B\u044C \u0431\u0435\u0440\u0435\u0433\u0430 \u043E\u0437\u0435\u0440\u0430.",
          allowPhoneSharing: true
        }
      },
      {
        event: {
          id: "ev-24",
          title: "\u0412\u0435\u0447\u0435\u0440\u043D\u0438\u0439 \u0432\u0435\u043B\u043E\u0437\u0430\u0435\u0437\u0434 \u043F\u043E \u043E\u0433\u043D\u044F\u043C \u043D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u044B\u0445 \u043E\u0442 \u0421\u0438\u0442\u0438 \u0434\u043E \u0417\u0430\u0440\u044F\u0434\u044C\u044F",
          category: "\u041F\u0440\u043E\u0433\u0443\u043B\u043A\u0430",
          description: "\u041A\u0430\u0442\u0438\u043C \u043D\u0435\u0441\u043F\u0435\u0448\u043D\u044B\u043C \u043F\u0440\u043E\u0433\u0443\u043B\u043E\u0447\u043D\u044B\u043C \u0442\u0435\u043C\u043F\u043E\u043C \u043F\u043E \u0441\u0430\u043C\u044B\u043C \u043A\u0440\u0430\u0441\u0438\u0432\u044B\u043C \u043E\u0441\u0432\u0435\u0449\u0435\u043D\u043D\u044B\u043C \u0432\u0435\u043B\u043E\u0434\u043E\u0440\u043E\u0436\u043A\u0430\u043C \u0432\u0434\u043E\u043B\u044C \u041C\u043E\u0441\u043A\u0432\u044B-\u0440\u0435\u043A\u0438! \u041C\u043E\u0436\u043D\u043E \u043D\u0430 \u0441\u0432\u043E\u0435\u043C \u0432\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434\u0435 \u0438\u043B\u0438 \u0432\u0437\u044F\u0442\u044C \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0439 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u0432\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434 \u0432 \u043F\u0440\u043E\u043A\u0430\u0442\u0435 \u043F\u0440\u044F\u043C\u043E \u043D\u0430 \u0441\u0442\u0430\u0440\u0442\u0435.",
          date: todayStr,
          time: "21:30",
          isToday: true,
          totalSpots: 8,
          occupiedSpots: 5,
          budget: "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u041F\u0440\u0435\u0441\u043D\u0435\u043D\u0441\u043A\u0430\u044F \u043D\u0430\u0431. / \u041B\u0443\u0436\u043D\u0438\u043A\u0438, ~3.1 \u043A\u043C",
          distanceKm: 3.1,
          imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80",
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: "open",
          vibe: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0434\u0432\u0438\u0436",
          musicOrMood: "\u041E\u0433\u043D\u0438 \u043D\u043E\u0447\u043D\u043E\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430 \u0432 \u0432\u043E\u0434\u0435, \u0442\u0435\u043F\u043B\u044B\u0439 \u0432\u0435\u0442\u0435\u0440 \u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u043D\u0430 \u0441\u043C\u043E\u0442\u0440\u043E\u0432\u044B\u0445",
          icebreakerQuestion: "\u0412\u0430\u0448 \u043B\u044E\u0431\u0438\u043C\u044B\u0439 \u043C\u0430\u0440\u0448\u0440\u0443\u0442 \u0434\u043B\u044F \u0432\u0435\u0447\u0435\u0440\u043D\u0435\u0439 \u043F\u0440\u043E\u0433\u0443\u043B\u043A\u0438 \u043F\u043E \u0433\u043E\u0440\u043E\u0434\u0443?",
          requirements: "\u0412\u0435\u043B\u043E\u0441\u0438\u043F\u0435\u0434 \u0438\u043B\u0438 \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0439 \u0432\u0435\u043B\u043E\u043F\u0440\u043E\u043A\u0430\u0442, \u043F\u0435\u0440\u0435\u0434\u043D\u0438\u0439/\u0437\u0430\u0434\u043D\u0438\u0439 \u0444\u043E\u043D\u0430\u0440\u0438\u043A",
          rules: ["\u0415\u0434\u0435\u043C \u0430\u043A\u043A\u0443\u0440\u0430\u0442\u043D\u043E \u043A\u043E\u043B\u043E\u043D\u043D\u043E\u0439, \u0436\u0434\u0435\u043C \u0432\u0441\u0435\u0445 \u043D\u0430 \u0441\u0432\u0435\u0442\u043E\u0444\u043E\u0440\u0430\u0445 \u0438 \u043C\u043E\u0441\u0442\u0430\u0445"],
          approvedParticipantIds: [mikhail.id, dmitry.id, artem.id, sofia.id],
          createdAt: new Date(Date.now() - 36e5 * 2).toISOString()
        },
        secret: {
          exactVenue: '\u0421\u043C\u043E\u0442\u0440\u043E\u0432\u0430\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0430 \u0443 \u043C\u043E\u0441\u0442\u0430 "\u0411\u0430\u0433\u0440\u0430\u0442\u0438\u043E\u043D" \u0441\u043E \u0441\u0442\u043E\u0440\u043E\u043D\u044B \u041F\u0440\u0435\u0441\u043D\u0435\u043D\u0441\u043A\u043E\u0439 \u043D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u043E\u0439',
          exactAddress: "\u041F\u0440\u0435\u0441\u043D\u0435\u043D\u0441\u043A\u0430\u044F \u043D\u0430\u0431\u0435\u0440\u0435\u0436\u043D\u0430\u044F, 2",
          organizerPhone: "+7 (915) 602-88-19",
          privateInstructions: "\u0420\u044F\u0434\u043E\u043C \u0441\u043E \u0441\u0442\u0430\u043D\u0446\u0438\u0435\u0439 \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0433\u043E \u0432\u0435\u043B\u043E\u043F\u0440\u043E\u043A\u0430\u0442\u0430 \u2116142 \u0443 \u0441\u043F\u0443\u0441\u043A\u0430 \u043A \u0432\u043E\u0434\u0435.",
          allowPhoneSharing: true
        }
      }
    ];
    for (const item of extraEvents) {
      if (!this.events.has(item.event.id)) {
        this.events.set(item.event.id, item.event);
      }
      if (!this.rawEventsSecret.has(item.event.id)) {
        this.rawEventsSecret.set(item.event.id, item.secret);
      }
    }
    const annaNotifs = this.notifications.get(anna.id) || [];
    if (!annaNotifs.some((n) => n.id === "notif-anna-2")) {
      annaNotifs.push({
        id: "notif-anna-2",
        userId: anna.id,
        title: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 \u0441\u043F\u0438\u043A\u0438\u0437\u0438-\u0431\u0430\u0440",
        message: "\u0421\u043E\u0444\u0438\u044F \u041B\u0435\u0431\u0435\u0434\u0435\u0432\u0430 (\u0440\u0435\u0439\u0442\u0438\u043D\u0433 4.98) \u0445\u043E\u0447\u0435\u0442 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F \u043A \xAB\u0421\u0435\u043A\u0440\u0435\u0442\u043D\u044B\u0439 \u0441\u043F\u0438\u043A\u0438\u0437\u0438-\u0431\u0430\u0440 \u0437\u0430 \u043A\u043D\u0438\u0436\u043D\u044B\u043C \u0448\u043A\u0430\u0444\u043E\u043C\xBB.",
        type: "application_received",
        relatedEventId: "ev-21",
        isRead: false,
        createdAt: new Date(Date.now() - 18e5).toISOString()
      });
      this.notifications.set(anna.id, annaNotifs.map((n) => ({ ...n, isRead: false })));
    }
  }
  // --- PRIVACY SANITIZATION (The Core Security Law) ---
  sanitizeEvent(event, viewerUserId) {
    const isOrganizer = viewerUserId && event.organizerId === viewerUserId;
    const isApprovedParticipant = viewerUserId && event.approvedParticipantIds.includes(viewerUserId);
    const hasFullAccess = isOrganizer || isApprovedParticipant;
    const participants = (event.approvedParticipantIds || []).map((id) => this.users.get(id)).filter((u) => Boolean(u)).map((u) => ({
      id: u.id,
      name: u.name,
      age: u.age,
      avatarUrl: u.avatarUrl,
      occupation: u.occupation || "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A",
      onlineStatus: u.onlineStatus || (u.id === this.activeUserId ? "online" : "recent"),
      lastSeen: u.lastSeen || (u.id === this.activeUserId ? "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441" : "\u0411\u044B\u043B(\u0430) \u043D\u0435\u0434\u0430\u0432\u043D\u043E"),
      reliability: u.reliability
    }));
    const existingApp = viewerUserId ? Array.from(this.applications.values()).find((a) => a.eventId === event.id && a.userId === viewerUserId) : void 0;
    let myApplicationStatus = null;
    if (isApprovedParticipant) {
      myApplicationStatus = "accepted";
    } else if (existingApp) {
      if (existingApp.status === "accepted") myApplicationStatus = "accepted";
      else if (existingApp.status === "rejected") myApplicationStatus = "rejected";
      else if (existingApp.status === "pending") myApplicationStatus = "pending";
    }
    const secret = this.rawEventsSecret.get(event.id);
    const sanitized = {
      ...event,
      approvedParticipants: participants,
      // Always available public summary
      exactVenue: hasFullAccess ? secret?.exactVenue : void 0,
      exactAddress: hasFullAccess ? secret?.exactAddress : void 0,
      yandexMapsUrl: hasFullAccess ? secret?.yandexMapsUrl : void 0,
      coordinates: hasFullAccess ? secret?.coordinates : void 0,
      organizerPhone: hasFullAccess && secret?.allowPhoneSharing ? secret?.organizerPhone : void 0,
      privateInstructions: hasFullAccess ? secret?.privateInstructions : void 0,
      myApplicationStatus,
      myApplicationNote: existingApp?.note
    };
    return sanitized;
  }
  seedDemoApplications() {
    const seedApp = (id, eventId, userId, status, note) => {
      if (this.applications.has(id)) return;
      const ev = this.events.get(eventId);
      const u = this.users.get(userId);
      if (!ev || !u) return;
      this.applications.set(id, {
        id,
        eventId: ev.id,
        eventTitle: ev.title,
        userId: u.id,
        user: {
          id: u.id,
          name: u.name,
          age: u.age,
          avatarUrl: u.avatarUrl,
          city: u.city,
          bio: u.bio,
          interests: u.interests,
          reliability: u.reliability,
          isPhoneVerified: u.isPhoneVerified,
          isEmailVerified: u.isEmailVerified
        },
        note,
        status,
        createdAt: "2026-11-11T15:30:00.000Z",
        attendanceStatus: "not_marked"
      });
    };
    seedApp(
      "app-demo-anna-pending",
      "ev-3",
      "user-anna",
      "pending",
      "\u041F\u0440\u0438\u0432\u0435\u0442, \u0415\u043B\u0435\u043D\u0430! \u041E\u0431\u043E\u0436\u0430\u044E \u043A\u0430\u043C\u0435\u0440\u043D\u0443\u044E \u0438\u043D\u0434\u0438-\u043C\u0443\u0437\u044B\u043A\u0443 \u0438 \u0436\u0438\u0432\u043E\u0439 \u0437\u0432\u0443\u043A, \u0441 \u0440\u0430\u0434\u043E\u0441\u0442\u044C\u044E \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E \u043D\u0430 \u0432\u0435\u0447\u0435\u0440!"
    );
    seedApp(
      "app-demo-anna-rejected",
      "ev-6",
      "user-anna",
      "rejected",
      "\u0425\u043E\u0442\u0435\u043B\u0430 \u0431\u044B \u043F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u043F\u0430\u0434\u0435\u043B-\u0442\u0435\u043D\u043D\u0438\u0441 \u0432\u043F\u0435\u0440\u0432\u044B\u0435, \u0435\u0441\u043B\u0438 \u0435\u0449\u0435 \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043C\u0435\u0441\u0442\u043E \u043D\u0430 \u043A\u043E\u0440\u0442\u0435!"
    );
    seedApp(
      "app-demo-mikhail-rejected",
      "ev-3",
      "user-mikhail",
      "rejected",
      "\u041F\u0440\u0438\u0432\u0435\u0442! \u0411\u0443\u0434\u0443 \u0440\u044F\u0434\u043E\u043C \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0431\u043E\u0442\u044B, \u0441 \u0443\u0434\u043E\u0432\u043E\u043B\u044C\u0441\u0442\u0432\u0438\u0435\u043C \u043F\u043E\u0441\u043B\u0443\u0448\u0430\u044E \u0430\u043A\u0443\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0441\u0435\u0442."
    );
    seedApp(
      "app-demo-elena-pending",
      "ev-2",
      "user-elena",
      "pending",
      "\u041F\u0440\u0438\u0432\u0435\u0442, \u041C\u0438\u0445\u0430\u0438\u043B! \u041E\u0447\u0435\u043D\u044C \u0445\u043E\u0447\u0443 \u0441\u044B\u0433\u0440\u0430\u0442\u044C \u043F\u0430\u0440\u0442\u0438\u044E \u0432 \xAB\u041F\u043E\u043A\u043E\u0440\u0435\u043D\u0438\u0435 \u041C\u0430\u0440\u0441\u0430\xBB, \u0431\u044B\u0441\u0442\u0440\u043E \u0441\u0445\u0432\u0430\u0442\u044B\u0432\u0430\u044E \u043F\u0440\u0430\u0432\u0438\u043B\u0430."
    );
    seedApp(
      "app-demo-elena-rejected",
      "ev-8",
      "user-elena",
      "rejected",
      "\u041E\u0431\u043E\u0436\u0430\u044E \u043C\u0443\u0437\u044B\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043A\u0432\u0438\u0437\u044B \u0438 \u0441\u0430\u0443\u043D\u0434\u0442\u0440\u0435\u043A\u0438 \u0438\u0437 \u043A\u0438\u043D\u043E, \u0432\u043E\u0437\u044C\u043C\u0435\u0442\u0435 \u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u0443?"
    );
    if (!this.events.has("ev-wedding-1")) {
      const anna = this.users.get("user-anna");
      if (anna) {
        const weddingEvent = {
          id: "ev-wedding-1",
          title: "\u041A\u0430\u043C\u0435\u0440\u043D\u0430\u044F \u0441\u0432\u0430\u0434\u044C\u0431\u0430-\u0432\u0435\u0447\u0435\u0440\u0438\u043D\u043A\u0430 \u043D\u0430 \u0442\u0435\u0440\u0440\u0430\u0441\u0435 \u0432 \u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u043E\u043C \u0411\u043E\u0440\u0443",
          category: "\u0421\u0432\u0430\u0434\u044C\u0431\u0430",
          description: "\u041F\u0440\u0430\u0437\u0434\u043D\u0443\u0435\u043C \u043D\u0430\u0448\u0443 \u043A\u0430\u043C\u0435\u0440\u043D\u0443\u044E \u0441\u0432\u0430\u0434\u044C\u0431\u0443 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 \u0442\u0451\u043F\u043B\u043E\u0439 \u043B\u0435\u0442\u043D\u0435\u0439 \u0432\u0435\u0447\u0435\u0440\u0438\u043D\u043A\u0438 \u0443 \u0432\u043E\u0434\u044B \u0431\u0435\u0437 \u043E\u0444\u0438\u0446\u0438\u043E\u0437\u0430! \u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0430\u0435\u043C \u0434\u0440\u0443\u0437\u0435\u0439 \u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0445 \u0442\u0432\u043E\u0440\u0447\u0435\u0441\u043A\u0438\u0445 \u0440\u0435\u0431\u044F\u0442 \u0440\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u044C \u0441 \u043D\u0430\u043C\u0438 \u044D\u0442\u043E\u0442 \u0432\u0435\u0447\u0435\u0440: \u0436\u0438\u0432\u043E\u0439 \u0434\u0436\u0430\u0437-\u0431\u044D\u043D\u0434, \u0444\u0443\u0440\u0448\u0435\u0442, \u0442\u0430\u043D\u0446\u044B \u043D\u0430 \u043F\u0438\u0440\u0441\u0435 \u0438 \u0431\u0435\u043D\u0433\u0430\u043B\u044C\u0441\u043A\u0438\u0435 \u043E\u0433\u043D\u0438.",
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          time: "18:30",
          isToday: true,
          totalSpots: 24,
          occupiedSpots: 5,
          budget: "3 000\u20135 000 \u20BD",
          city: "\u041C\u043E\u0441\u043A\u0432\u0430",
          approximateArea: "\u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u044B\u0439 \u0411\u043E\u0440, \u0431\u0435\u0440\u0435\u0433 \u0440\u0435\u043A\u0438, ~4.5 \u043A\u043C",
          distanceKm: 4.5,
          imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
          organizerId: anna.id,
          organizer: {
            id: anna.id,
            name: anna.name,
            age: anna.age,
            avatarUrl: anna.avatarUrl,
            reliability: anna.reliability,
            isPhoneVerified: anna.isPhoneVerified,
            isEmailVerified: anna.isEmailVerified
          },
          status: "open",
          vibe: "\u041F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u044B\u0439 \u0432\u0430\u0439\u0431",
          musicOrMood: "\u0416\u0438\u0432\u043E\u0439 \u0434\u0436\u0430\u0437, \u0433\u0438\u0440\u043B\u044F\u043D\u0434\u044B \u0443 \u0432\u043E\u0434\u044B, \u0448\u0430\u043C\u043F\u0430\u043D\u0441\u043A\u043E\u0435 \u0438 \u0442\u0430\u043D\u0446\u044B",
          icebreakerQuestion: "\u041A\u0430\u043A\u043E\u0439 \u0441\u0430\u043C\u044B\u0439 \u043D\u0435\u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0438\u043B\u0438 \u0442\u0440\u043E\u0433\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0442\u043E\u0441\u0442 \u0432\u044B \u0441\u043B\u044B\u0448\u0430\u043B\u0438 \u0432 \u0436\u0438\u0437\u043D\u0438?",
          requirements: "23-38 \u043B\u0435\u0442, \u043F\u0440\u0430\u0437\u0434\u043D\u0438\u0447\u043D\u043E\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435, smart casual / \u043A\u043E\u043A\u0442\u0435\u0439\u043B\u044C\u043D\u044B\u0439 \u0434\u0440\u0435\u0441\u0441-\u043A\u043E\u0434",
          rules: ["\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0443\u0447\u0430\u0441\u0442\u0438\u0435 \u0437\u0430\u0440\u0430\u043D\u0435\u0435", "\u041F\u043E\u0437\u0438\u0442\u0438\u0432\u043D\u044B\u0439 \u043D\u0430\u0441\u0442\u0440\u043E\u0439 \u0438 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435 \u043A \u0433\u043E\u0441\u0442\u044F\u043C"],
          approvedParticipantIds: ["user-elena", "user-mikhail", "user-external-1", "user-external-2"],
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.events.set(weddingEvent.id, weddingEvent);
        this.rawEventsSecret.set(weddingEvent.id, {
          exactVenue: "\u0411\u0430\u043D\u043A\u0435\u0442\u043D\u044B\u0439 \u0448\u0430\u0442\u0451\u0440 \u0438 \u043F\u0438\u0440\u0441 \xAB\u0421\u0435\u0440\u0435\u0431\u0440\u044F\u043D\u044B\u0439 \u0411\u043E\u0440\xBB",
          exactAddress: "\u0422\u0430\u043C\u0430\u043D\u0441\u043A\u0430\u044F \u0443\u043B., \u0434. 46, \u0441\u0442\u0440. 1",
          yandexMapsUrl: "https://yandex.ru/maps/?ll=37.4342%2C55.7789&z=16&pt=37.4342%2C55.7789%2Cpm2rdm",
          coordinates: { lat: 55.7789, lon: 37.4342 },
          organizerPhone: anna.phoneNumber || "+7 (916) 555-01-92",
          privateInstructions: "\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 \u0446\u0435\u043D\u0442\u0440\u0430\u043B\u044C\u043D\u0443\u044E \u0430\u043B\u043B\u0435\u044E \u043A \u043F\u0438\u0440\u0441\u0443 \u21162, \u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 \u2014 \u0431\u0435\u043B\u0430\u044F \u0430\u0440\u043A\u0430 \u0441 \u0440\u0435\u0442\u0440\u043E-\u0433\u0438\u0440\u043B\u044F\u043D\u0434\u0430\u043C\u0438.",
          allowPhoneSharing: true
        });
      }
    }
  }
  getEvents(viewerUserId, filters) {
    const activeViewer = viewerUserId ? this.users.get(viewerUserId) : void 0;
    const blockedIds = activeViewer?.blockedUserIds || [];
    let list = Array.from(this.events.values()).filter((ev) => ev.status !== "cancelled" || ev.organizerId === viewerUserId).filter((ev) => !blockedIds.includes(ev.organizerId));
    if (filters?.category && filters.category !== "\u0412\u0441\u0435") {
      list = list.filter((ev) => ev.category === filters.category);
    }
    if (filters?.onlyToday) {
      list = list.filter((ev) => ev.isToday);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (ev) => ev.title.toLowerCase().includes(q) || ev.description.toLowerCase().includes(q) || ev.approximateArea.toLowerCase().includes(q) || ev.category.toLowerCase().includes(q)
      );
    }
    return list.map((ev) => this.sanitizeEvent(ev, viewerUserId));
  }
  getEventById(id, viewerUserId) {
    const ev = this.events.get(id);
    if (!ev) return null;
    return this.sanitizeEvent(ev, viewerUserId);
  }
  createEvent(data) {
    const organizer = this.users.get(data.organizerId);
    if (!organizer) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    const id = `ev-${Date.now()}`;
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const isToday = data.date === todayStr;
    let fallbackImg = "/src/assets/images/hero_community_event_1794332913246.jpg";
    if (data.category === "\u0421\u0432\u0430\u0434\u044C\u0431\u0430") fallbackImg = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80";
    else if (data.category === "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B") fallbackImg = "/src/assets/images/event_board_games_1794332913325.jpg";
    else if (data.category === "\u041F\u0438\u043A\u043D\u0438\u043A / \u0428\u0430\u0448\u043B\u044B\u043A\u0438") fallbackImg = "/src/assets/images/event_outdoor_picnic_1794332913731.jpg";
    else if (data.category === "\u041A\u0438\u043D\u043E / \u041A\u043E\u043D\u0446\u0435\u0440\u0442") fallbackImg = "/src/assets/images/event_live_concert_1794332915302.jpg";
    const newEvent = {
      id,
      title: data.title,
      category: data.category,
      description: data.description,
      date: data.date,
      time: data.time,
      isToday,
      totalSpots: Math.max(2, Number(data.totalSpots) || 4),
      occupiedSpots: 1,
      // Organizer is spot 1
      budget: data.budget,
      city: data.city || "\u041C\u043E\u0441\u043A\u0432\u0430",
      approximateArea: data.approximateArea || "\u0426\u0435\u043D\u0442\u0440, ~2 \u043A\u043C",
      distanceKm: 2,
      imageUrl: data.imageUrl || fallbackImg,
      organizerId: organizer.id,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        age: organizer.age,
        avatarUrl: organizer.avatarUrl,
        reliability: organizer.reliability,
        isPhoneVerified: organizer.isPhoneVerified,
        isEmailVerified: organizer.isEmailVerified
      },
      status: "open",
      requirements: data.requirements || "\u0414\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u0438\u0435 \u0438 \u043F\u0443\u043D\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
      rules: data.rules || ["\u0423\u0432\u0435\u0434\u043E\u043C\u0438\u0442\u044C \u043F\u0440\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0438 \u043F\u043B\u0430\u043D\u043E\u0432"],
      approvedParticipantIds: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      vibe: data.vibe || "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430",
      musicOrMood: data.musicOrMood || "\u0423\u044E\u0442\u043D\u0430\u044F \u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u0430\u044F \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0430",
      icebreakerQuestion: data.icebreakerQuestion || ""
    };
    this.rawEventsSecret.set(id, {
      exactVenue: data.exactVenue,
      exactAddress: data.exactAddress,
      yandexMapsUrl: data.yandexMapsUrl || `https://yandex.ru/maps/?text=${encodeURIComponent(
        `${data.city || "\u041C\u043E\u0441\u043A\u0432\u0430"}, ${data.exactAddress || data.exactVenue || ""}`
      )}`,
      coordinates: data.coordinates || { lat: 55.7558, lon: 37.6173 },
      organizerPhone: data.organizerPhone || organizer.phoneNumber || "",
      privateInstructions: data.privateInstructions || "",
      allowPhoneSharing: data.allowPhoneSharing ?? true
    });
    this.events.set(id, newEvent);
    this.chatMessages.set(id, [{
      id: `msg-${Date.now()}`,
      eventId: id,
      senderId: "system",
      senderName: "Kompany",
      senderAvatar: "",
      text: "\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043E. \u0417\u0430\u043A\u0440\u044B\u0442\u044B\u0439 \u0447\u0430\u0442 \u0438 \u0442\u043E\u0447\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u0430\u043C \u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043D\u044B\u043C \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430\u043C.",
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSystemMessage: true
    }]);
    organizer.reliability.eventsOrganized += 1;
    this.saveToFile();
    return this.sanitizeEvent(newEvent, data.organizerId);
  }
  applyToEvent(eventId, userId, note) {
    const event = this.events.get(eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    const user = this.users.get(userId);
    if (!user) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    if (event.organizerId === userId) {
      throw new Error("\u0412\u044B \u044F\u0432\u043B\u044F\u0435\u0442\u0435\u0441\u044C \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u043E\u043C \u044D\u0442\u043E\u0433\u043E \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044F");
    }
    if (event.approvedParticipantIds.includes(userId)) {
      throw new Error("\u0412\u044B \u0443\u0436\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0435\u0441\u044C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043D\u044B\u043C \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u043C");
    }
    const existing = Array.from(this.applications.values()).find((a) => a.eventId === eventId && a.userId === userId && a.status === "pending");
    if (existing) {
      throw new Error("\u0412\u044B \u0443\u0436\u0435 \u043F\u043E\u0434\u0430\u043B\u0438 \u0437\u0430\u044F\u0432\u043A\u0443 \u043D\u0430 \u044D\u0442\u043E \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435");
    }
    const app2 = {
      id: `app-${Date.now()}`,
      eventId,
      eventTitle: event.title,
      userId,
      user: {
        id: user.id,
        name: user.name,
        age: user.age,
        avatarUrl: user.avatarUrl,
        city: user.city,
        bio: user.bio,
        interests: user.interests,
        reliability: user.reliability,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified
      },
      note: note.trim() || "\u0425\u043E\u0447\u0443 \u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442\u044C\u0441\u044F \u0438 \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u0432\u0440\u0435\u043C\u044F \u0432\u043C\u0435\u0441\u0442\u0435!",
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      attendanceStatus: "not_marked"
    };
    this.applications.set(app2.id, app2);
    const userNotifications = this.notifications.get(event.organizerId) || [];
    userNotifications.unshift({
      id: `notif-${Date.now()}`,
      userId: event.organizerId,
      title: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435",
      message: `${user.name} \u0445\u043E\u0447\u0435\u0442 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F \u043A "${event.title}": "${app2.note.slice(0, 70)}..."`,
      type: "application_received",
      relatedEventId: event.id,
      isRead: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.notifications.set(event.organizerId, userNotifications);
    this.saveToFile();
    return app2;
  }
  handleApplication(appId, organizerId, action) {
    const app2 = this.applications.get(appId);
    if (!app2) throw new Error("\u0417\u0430\u044F\u0432\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
    const event = this.events.get(app2.eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    if (event.organizerId !== organizerId) {
      throw new Error("\u0422\u043E\u043B\u044C\u043A\u043E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438");
    }
    if (action === "accept") {
      if (event.occupiedSpots >= event.totalSpots) {
        throw new Error("\u0412\u0441\u0435 \u043C\u0435\u0441\u0442\u0430 \u0443\u0436\u0435 \u0437\u0430\u043D\u044F\u0442\u044B");
      }
      app2.status = "accepted";
      if (!event.approvedParticipantIds.includes(app2.userId)) {
        event.approvedParticipantIds.push(app2.userId);
        event.occupiedSpots = Math.min(event.totalSpots, event.occupiedSpots + 1);
        if (event.occupiedSpots >= event.totalSpots) {
          event.status = "full";
        }
      }
      const chat = this.chatMessages.get(event.id) || [];
      chat.push({
        id: `msg-${Date.now()}`,
        eventId: event.id,
        senderId: "system",
        senderName: "Kompany",
        senderAvatar: "",
        text: `\u041A \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u043B\u0441\u044F(\u043B\u0430\u0441\u044C) ${app2.user.name}! \u0422\u0435\u043F\u0435\u0440\u044C \u0435\u043C\u0443(\u0435\u0439) \u043E\u0442\u043A\u0440\u044B\u0442 \u0442\u043E\u0447\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0432\u0441\u0442\u0440\u0435\u0447\u0438.`,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSystemMessage: true
      });
      this.chatMessages.set(event.id, chat);
      const notifs = this.notifications.get(app2.userId) || [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        userId: app2.userId,
        title: "\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0430! \u{1F389}",
        message: `\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u043B \u0432\u0430\u0448\u0435 \u0443\u0447\u0430\u0441\u0442\u0438\u0435 \u0432 "${event.title}". \u0422\u0435\u043F\u0435\u0440\u044C \u0432\u0430\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0442\u043E\u0447\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0438 \u0433\u0440\u0443\u043F\u043F\u043E\u0432\u043E\u0439 \u0447\u0430\u0442!`,
        type: "application_accepted",
        relatedEventId: event.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.notifications.set(app2.userId, notifs);
    } else {
      app2.status = "rejected";
      const notifs = this.notifications.get(app2.userId) || [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        userId: app2.userId,
        title: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u044F\u0432\u043A\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D",
        message: `\u041A \u0441\u043E\u0436\u0430\u043B\u0435\u043D\u0438\u044E, \u043D\u0430 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 "${event.title}" \u043C\u0435\u0441\u0442 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0442 \u0438\u043B\u0438 \u0437\u0430\u044F\u0432\u043A\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u043E\u043C.`,
        type: "application_rejected",
        relatedEventId: event.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.notifications.set(app2.userId, notifs);
    }
    this.saveToFile();
    return app2;
  }
  cancelEvent(eventId, organizerId, reason) {
    const event = this.events.get(eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    if (event.organizerId !== organizerId) {
      throw new Error("\u0422\u043E\u043B\u044C\u043A\u043E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435");
    }
    event.status = "cancelled";
    event.cancelledReason = reason || "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u043E\u043C";
    for (const participantId of event.approvedParticipantIds) {
      const notifs = this.notifications.get(participantId) || [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        userId: participantId,
        title: "\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u043E",
        message: `\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440 \u043E\u0442\u043C\u0435\u043D\u0438\u043B \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 "${event.title}": ${event.cancelledReason}`,
        type: "event_cancelled",
        relatedEventId: event.id,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.notifications.set(participantId, notifs);
    }
    const org = this.users.get(organizerId);
    if (org) {
      org.reliability.cancellations += 1;
    }
    this.saveToFile();
    return this.sanitizeEvent(event, organizerId);
  }
  sendChatMessage(eventId, senderId, text) {
    const event = this.events.get(eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    const user = this.users.get(senderId);
    if (!user) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    const isApproved = event.organizerId === senderId || event.approvedParticipantIds.includes(senderId);
    if (!isApproved) {
      throw new Error("\u0414\u043E\u0441\u0442\u0443\u043F \u043A \u0437\u0430\u043A\u0440\u044B\u0442\u043E\u043C\u0443 \u0447\u0430\u0442\u0443 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0437\u0430\u044F\u0432\u043A\u0438");
    }
    const msg = {
      id: `msg-${Date.now()}`,
      eventId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text: text.trim(),
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    const list = this.chatMessages.get(eventId) || [];
    list.push(msg);
    this.chatMessages.set(eventId, list);
    this.saveToFile();
    return msg;
  }
  markAttendance(eventId, organizerId, participantId, status) {
    const event = this.events.get(eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    if (event.organizerId !== organizerId) throw new Error("\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432");
    const participant = this.users.get(participantId);
    if (!participant) throw new Error("\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    if (status === "attended") {
      participant.reliability.eventsAttended += 1;
    } else {
      participant.reliability.noShows += 1;
    }
    const total = participant.reliability.eventsAttended + participant.reliability.noShows;
    participant.reliability.attendanceRate = total > 0 ? Math.round(participant.reliability.eventsAttended / total * 100) : 100;
    this.saveToFile();
    return participant;
  }
  submitReview(data) {
    const author = this.users.get(data.authorId);
    const target = this.users.get(data.targetUserId);
    const event = this.events.get(data.eventId);
    if (!author || !target || !event) throw new Error("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u043E\u0442\u0437\u044B\u0432\u0430");
    const rev = {
      id: `rev-${Date.now()}`,
      eventId: data.eventId,
      eventTitle: event.title,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatarUrl,
      targetUserId: target.id,
      rating: Math.min(5, Math.max(1, data.rating)),
      tags: data.tags || [],
      text: data.text.trim(),
      createdAt: "\u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u043E"
    };
    const targetReviews = this.reviews.get(target.id) || [];
    targetReviews.unshift(rev);
    this.reviews.set(target.id, targetReviews);
    const avg = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
    target.reliability.score = Math.round(avg * 100) / 100;
    if (rev.rating >= 4) {
      target.reliability.positiveReviewsCount += 1;
    }
    this.saveToFile();
    return rev;
  }
  submitReport(data) {
    const reporter = this.users.get(data.reporterId);
    if (!reporter) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    let targetTitle = "";
    if (data.targetType === "event") {
      targetTitle = this.events.get(data.targetId)?.title || "\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435";
    } else {
      targetTitle = this.users.get(data.targetId)?.name || "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C";
    }
    const report = {
      id: `rep-${Date.now()}`,
      reporterId: reporter.id,
      reporterName: reporter.name,
      targetType: data.targetType,
      targetId: data.targetId,
      targetTitle,
      reason: data.reason,
      details: data.details,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.reports.set(report.id, report);
    this.saveToFile();
    return report;
  }
  blockUser(userId, targetUserId) {
    const user = this.users.get(userId);
    if (!user) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    if (!user.blockedUserIds) user.blockedUserIds = [];
    if (!user.blockedUserIds.includes(targetUserId)) {
      user.blockedUserIds.push(targetUserId);
    }
    this.saveToFile();
    return user;
  }
  seedQuestions() {
    this.questions.set("ev-1", [
      {
        id: "qa-1",
        eventId: "ev-1",
        askerId: "user-mikhail",
        askerName: "\u041C\u0438\u0445\u0430\u0438\u043B \u0421\u043E\u043A\u043E\u043B\u043E\u0432",
        askerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
        question: "\u041F\u043E\u0434\u0441\u043A\u0430\u0436\u0438\u0442\u0435, \u043A\u0430\u043A\u043E\u0439 \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u043E \u0444\u043E\u0440\u043C\u0430\u0442 \u043A\u0443\u0445\u043D\u0438 \u0432 \u0440\u0435\u0441\u0442\u043E\u0440\u0430\u043D\u0435 \u0438 \u0435\u0441\u0442\u044C \u043B\u0438 \u0434\u0440\u0435\u0441\u0441-\u043A\u043E\u0434?",
        answer: "\u0421\u0440\u0435\u0434\u0438\u0437\u0435\u043C\u043D\u043E\u043C\u043E\u0440\u0441\u043A\u0430\u044F \u0438 \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0430\u044F \u043A\u0443\u0445\u043D\u044F, \u043F\u0435\u0447\u044C \u043D\u0430 \u0434\u0440\u043E\u0432\u0430\u0445! \u0414\u0440\u0435\u0441\u0441-\u043A\u043E\u0434 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0439 (smart casual), \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u0447\u0442\u043E\u0431\u044B \u0432\u0430\u043C \u0431\u044B\u043B\u043E \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u043D\u043E.",
        createdAt: "14:10",
        answeredAt: "14:22"
      }
    ]);
    this.questions.set("ev-2", [
      {
        id: "qa-2",
        eventId: "ev-2",
        askerId: "user-elena",
        askerName: "\u0415\u043B\u0435\u043D\u0430 \u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432\u0430",
        askerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        question: "\u0415\u0441\u043B\u0438 \u044F \u0440\u0430\u043D\u044C\u0448\u0435 \u043D\u0435 \u0438\u0433\u0440\u0430\u043B\u0430 \u0432 \xAB\u041F\u043E\u043A\u043E\u0440\u0435\u043D\u0438\u0435 \u041C\u0430\u0440\u0441\u0430\xBB, \u043D\u0435 \u0431\u0443\u0434\u0443 \u043B\u0438 \u044F \u0442\u043E\u0440\u043C\u043E\u0437\u0438\u0442\u044C \u043F\u0430\u0440\u0442\u0438\u044E?",
        answer: "\u0421\u043E\u0432\u0441\u0435\u043C \u043D\u0435\u0442! \u041C\u044B \u043F\u0435\u0440\u0432\u044B\u0435 15 \u043C\u0438\u043D\u0443\u0442 \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E \u0440\u0430\u0437\u0431\u0438\u0440\u0430\u0435\u043C \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u0438 \u0438\u0433\u0440\u0430\u0435\u043C \u043F\u0435\u0440\u0432\u0443\u044E \u044D\u043F\u043E\u0445\u0443 \u0432 \u043E\u0442\u043A\u0440\u044B\u0442\u0443\u044E \u0441 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430\u043C\u0438.",
        createdAt: "13:05",
        answeredAt: "13:15"
      }
    ]);
  }
  seedReviews() {
    const anna = this.users.get("user-anna");
    const mikhail = this.users.get("user-mikhail");
    const elena = this.users.get("user-elena");
    if (anna && (!this.reviews.has(anna.id) || (this.reviews.get(anna.id)?.length || 0) < 3)) {
      this.reviews.set(anna.id, [
        {
          id: "rev-1",
          eventId: "ev-past-1",
          eventTitle: "\u041F\u043E\u0445\u043E\u0434 \u043D\u0430 \u0434\u0436\u0430\u0437\u043E\u0432\u044B\u0439 \u043A\u043E\u043D\u0446\u0435\u0440\u0442",
          authorId: "user-elena",
          authorName: elena?.name || "\u0415\u043B\u0435\u043D\u0430 \u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432\u0430",
          authorAvatar: elena?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
          targetUserId: anna.id,
          rating: 5,
          tags: ["\u041E\u0442\u043B\u0438\u0447\u043D\u0430\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", "\u041B\u0435\u0433\u043A\u043E \u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F", "\u041F\u0443\u043D\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439"],
          text: "\u0410\u043D\u043D\u0430 \u2014 \u043D\u0435\u0432\u0435\u0440\u043E\u044F\u0442\u043D\u044B\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440! \u0421\u043E\u0431\u0440\u0430\u043B\u0430 \u043A\u043B\u0430\u0441\u0441\u043D\u044B\u0445 \u043B\u044E\u0434\u0435\u0439, \u0432\u0441\u0435 \u043F\u0440\u043E\u0448\u043B\u043E \u0442\u0435\u043F\u043B\u043E \u0438 \u0431\u0435\u0437 \u0437\u0430\u043C\u0438\u043D\u043E\u043A. \u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u043E\u0439\u0434\u0443 \u0435\u0449\u0435!",
          createdAt: "2 \u043D\u0435\u0434\u0435\u043B\u0438 \u043D\u0430\u0437\u0430\u0434"
        },
        {
          id: "rev-2",
          eventId: "ev-past-2",
          eventTitle: "\u0411\u0440\u0430\u043D\u0447 \u043D\u0430 \u041F\u0430\u0442\u0440\u0438\u0430\u0440\u0448\u0438\u0445",
          authorId: "user-mikhail",
          authorName: mikhail?.name || "\u041C\u0438\u0445\u0430\u0438\u043B \u0421\u043E\u043A\u043E\u043B\u043E\u0432",
          authorAvatar: mikhail?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
          targetUserId: anna.id,
          rating: 5,
          tags: ["\u0414\u0443\u0448\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", "\u041F\u0440\u0438\u044F\u0442\u043D\u044B\u0439 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A", "\u041E\u0442\u043B\u0438\u0447\u043D\u0430\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F"],
          text: "\u0411\u044B\u043B\u043E \u043E\u0447\u0435\u043D\u044C \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u043D\u043E, \u0431\u0443\u0434\u0442\u043E \u0437\u043D\u0430\u043A\u043E\u043C\u044B \u0441\u0442\u043E \u043B\u0435\u0442. \u0410\u043D\u043D\u0430 \u043F\u043E\u0442\u0440\u044F\u0441\u0430\u044E\u0449\u0435 \u0447\u0443\u0432\u0441\u0442\u0432\u0443\u0435\u0442 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0443 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0438 \u043B\u0435\u0433\u043A\u043E \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0435\u0442 \u043D\u0435\u0437\u043D\u0430\u043A\u043E\u043C\u044B\u0445 \u043B\u044E\u0434\u0435\u0439.",
          createdAt: "\u041C\u0435\u0441\u044F\u0446 \u043D\u0430\u0437\u0430\u0434"
        },
        {
          id: "rev-3",
          eventId: "ev-4",
          eventTitle: "\u0412\u0435\u0441\u0435\u043D\u043D\u0438\u0439 \u043F\u0438\u043A\u043D\u0438\u043A \u0432 \u041D\u0435\u0441\u043A\u0443\u0447\u043D\u043E\u043C \u0441\u0430\u0434\u0443",
          authorId: "user-dimitry",
          authorName: "\u0414\u043C\u0438\u0442\u0440\u0438\u0439 \u041C\u043E\u0440\u043E\u0437\u043E\u0432",
          authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
          targetUserId: anna.id,
          rating: 5,
          tags: ["\u041E\u0442\u043B\u0438\u0447\u043D\u0430\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", "\u0412\u043D\u0438\u043C\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C", "\u0414\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u0430\u044F"],
          text: "\u041F\u0440\u0435\u043A\u0440\u0430\u0441\u043D\u043E \u043F\u0440\u043E\u0432\u0435\u043B\u0438 \u0432\u0440\u0435\u043C\u044F \u043D\u0430 \u0441\u0432\u0435\u0436\u0435\u043C \u0432\u043E\u0437\u0434\u0443\u0445\u0435! \u0410\u043D\u043D\u0430 \u043F\u043E\u0437\u0430\u0431\u043E\u0442\u0438\u043B\u0430\u0441\u044C \u043E\u0431\u043E \u0432\u0441\u0435\u0445 \u0434\u0435\u0442\u0430\u043B\u044F\u0445, \u043D\u0438\u043A\u0442\u043E \u043D\u0435 \u0447\u0443\u0432\u0441\u0442\u0432\u043E\u0432\u0430\u043B \u0441\u0435\u0431\u044F \u043E\u0434\u0438\u043D\u043E\u043A\u043E.",
          createdAt: "1.5 \u043C\u0435\u0441\u044F\u0446\u0430 \u043D\u0430\u0437\u0430\u0434"
        }
      ]);
    }
    if (mikhail && (!this.reviews.has(mikhail.id) || (this.reviews.get(mikhail.id)?.length || 0) === 0)) {
      this.reviews.set(mikhail.id, [
        {
          id: "rev-m-1",
          eventId: "ev-2",
          eventTitle: "\u041D\u0430\u0441\u0442\u043E\u043B\u044C\u043D\u044B\u0435 \u0438\u0433\u0440\u044B: \u041F\u043E\u043A\u043E\u0440\u0435\u043D\u0438\u0435 \u041C\u0430\u0440\u0441\u0430",
          authorId: "user-anna",
          authorName: anna?.name || "\u0410\u043D\u043D\u0430 \u0412\u043E\u0440\u043E\u043D\u043E\u0432\u0430",
          authorAvatar: anna?.avatarUrl || "/src/assets/images/avatar_host_anna_1794332914629.jpg",
          targetUserId: mikhail.id,
          rating: 5,
          tags: ["\u041F\u0443\u043D\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439", "\u041B\u0435\u0433\u043A\u043E \u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F", "\u0414\u0443\u0448\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438"],
          text: "\u041C\u0438\u0445\u0430\u0438\u043B \u2014 \u043F\u043E\u0442\u0440\u044F\u0441\u0430\u044E\u0449\u0438\u0439 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A \u0432\u0441\u0442\u0440\u0435\u0447! \u041F\u0440\u0438\u0448\u0435\u043B \u0432\u043E\u0432\u0440\u0435\u043C\u044F, \u0437\u0430 10 \u043C\u0438\u043D\u0443\u0442 \u043E\u0431\u044A\u044F\u0441\u043D\u0438\u043B \u0441\u043B\u043E\u0436\u043D\u044B\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u0441\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u0438 \u0438 \u0432\u0435\u0441\u044C \u0432\u0435\u0447\u0435\u0440 \u0448\u0443\u0442\u0438\u043B. \u0421 \u0443\u0434\u043E\u0432\u043E\u043B\u044C\u0441\u0442\u0432\u0438\u0435\u043C \u043F\u043E\u0439\u0434\u0443 \u043D\u0430 \u043B\u044E\u0431\u043E\u0435 \u0435\u0433\u043E \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435!",
          createdAt: "3 \u043D\u0435\u0434\u0435\u043B\u0438 \u043D\u0430\u0437\u0430\u0434"
        },
        {
          id: "rev-m-2",
          eventId: "ev-past-quiz",
          eventTitle: "\u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u0432\u0438\u0437 \u0432 \u0446\u0435\u043D\u0442\u0440\u0435",
          authorId: "user-elena",
          authorName: elena?.name || "\u0415\u043B\u0435\u043D\u0430 \u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432\u0430",
          authorAvatar: elena?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
          targetUserId: mikhail.id,
          rating: 5,
          tags: ["\u041A\u043E\u043C\u0430\u043D\u0434\u043D\u044B\u0439 \u0438\u0433\u0440\u043E\u043A", "\u041F\u0440\u0438\u044F\u0442\u043D\u044B\u0439 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043D\u0438\u043A", "\u042D\u0440\u0443\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439"],
          text: "\u0418\u0433\u0440\u0430\u043B\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0432 \u043E\u0434\u043D\u043E\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u0435 \u043D\u0430 \u043A\u0432\u0438\u0437\u0435. \u041C\u0438\u0445\u0430\u0438\u043B \u043E\u0447\u0435\u043D\u044C \u0442\u0430\u043A\u0442\u0438\u0447\u043D\u044B\u0439, \u044D\u0440\u0443\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0438 \u043F\u043E\u0437\u0438\u0442\u0438\u0432\u043D\u044B\u0439, \u043F\u0440\u0438\u043D\u0435\u0441 \u043D\u0430\u043C \u043F\u043E\u0431\u0435\u0434\u0443 \u0432 \u043D\u0430\u0443\u0447\u043D\u043E\u043C \u0440\u0430\u0443\u043D\u0434\u0435!",
          createdAt: "1 \u043C\u0435\u0441\u044F\u0446 \u043D\u0430\u0437\u0430\u0434"
        }
      ]);
    }
    if (elena && (!this.reviews.has(elena.id) || (this.reviews.get(elena.id)?.length || 0) === 0)) {
      this.reviews.set(elena.id, [
        {
          id: "rev-e-1",
          eventId: "ev-3",
          eventTitle: "\u0410\u043A\u0443\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0432\u0435\u0447\u0435\u0440 \u0438\u043D\u0434\u0438-\u043C\u0443\u0437\u044B\u043A\u0438",
          authorId: "user-anna",
          authorName: anna?.name || "\u0410\u043D\u043D\u0430 \u0412\u043E\u0440\u043E\u043D\u043E\u0432\u0430",
          authorAvatar: anna?.avatarUrl || "/src/assets/images/avatar_host_anna_1794332914629.jpg",
          targetUserId: elena.id,
          rating: 5,
          tags: ["\u041E\u0442\u043B\u0438\u0447\u043D\u044B\u0439 \u0432\u043A\u0443\u0441", "\u041B\u0435\u0433\u043A\u043E \u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F", "\u041F\u0443\u043D\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F"],
          text: "\u0415\u043B\u0435\u043D\u0430 \u2014 \u043D\u0435\u0432\u0435\u0440\u043E\u044F\u0442\u043D\u043E \u0447\u0443\u0442\u043A\u0438\u0439 \u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0447\u0435\u043B\u043E\u0432\u0435\u043A! \u0411\u044B\u043B\u043E \u0431\u0435\u0437\u0443\u043C\u043D\u043E \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u043D\u043E \u043E\u0431\u0441\u0443\u0434\u0438\u0442\u044C \u043C\u0443\u0437\u044B\u043A\u0443 \u0438 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0443, \u0432\u0435\u0447\u0435\u0440 \u043F\u0440\u043E\u043B\u0435\u0442\u0435\u043B \u043D\u0430 \u043E\u0434\u043D\u043E\u043C \u0434\u044B\u0445\u0430\u043D\u0438\u0438.",
          createdAt: "10 \u0434\u043D\u0435\u0439 \u043D\u0430\u0437\u0430\u0434"
        },
        {
          id: "rev-e-2",
          eventId: "ev-4",
          eventTitle: "\u0412\u0435\u0441\u0435\u043D\u043D\u0438\u0439 \u043F\u0438\u043A\u043D\u0438\u043A \u0432 \u041D\u0435\u0441\u043A\u0443\u0447\u043D\u043E\u043C \u0441\u0430\u0434\u0443",
          authorId: "user-mikhail",
          authorName: mikhail?.name || "\u041C\u0438\u0445\u0430\u0438\u043B \u0421\u043E\u043A\u043E\u043B\u043E\u0432",
          authorAvatar: mikhail?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
          targetUserId: elena.id,
          rating: 5,
          tags: ["\u0418\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u043D\u0430\u044F", "\u0414\u0443\u0448\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", "\u041D\u0430\u0434\u0435\u0436\u043D\u044B\u0439 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A"],
          text: "\u0415\u043B\u0435\u043D\u0430 \u043F\u0440\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u043B\u0430 \u0434\u043B\u044F \u0432\u0441\u0435\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u0430\u0432\u0442\u043E\u0440\u0441\u043A\u0438\u0439 \u043B\u0438\u043C\u043E\u043D\u0430\u0434 \u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u043B\u0430 \u043B\u044E\u0431\u044B\u0435 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 \u043E\u0442 \u0444\u0440\u0438\u0441\u0431\u0438 \u0434\u043E \u0434\u0443\u0448\u0435\u0432\u043D\u044B\u0445 \u0440\u0430\u0437\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u0443 \u043A\u043E\u0441\u0442\u0440\u0430.",
          createdAt: "3 \u043D\u0435\u0434\u0435\u043B\u0438 \u043D\u0430\u0437\u0430\u0434"
        }
      ]);
    }
  }
  toggleSaveEvent(userId, eventId) {
    const user = this.users.get(userId);
    if (!user) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    if (!user.savedEventIds) user.savedEventIds = [];
    if (user.savedEventIds.includes(eventId)) {
      user.savedEventIds = user.savedEventIds.filter((id) => id !== eventId);
    } else {
      user.savedEventIds.push(eventId);
    }
    this.saveToFile();
    return user;
  }
  maskContactsInPublicText(text) {
    return text.replace(/(\+7|8)[\s\-()]?\d{3}[\s\-()]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g, "[\u041D\u043E\u043C\u0435\u0440 \u0441\u043A\u0440\u044B\u0442 \u0437\u0430\u0449\u0438\u0442\u043E\u0439 Kompany]").replace(/@[a-zA-Z0-9_]{3,}/g, "[\u041A\u043E\u043D\u0442\u0430\u043A\u0442 \u0441\u043A\u0440\u044B\u0442 \u0434\u043E \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u044F]");
  }
  getQuestions(eventId) {
    return this.questions.get(eventId) || [];
  }
  askQuestion(eventId, userId, questionText) {
    const event = this.events.get(eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    const user = this.users.get(userId);
    if (!user) throw new Error("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    const safeQuestion = this.maskContactsInPublicText(questionText.trim());
    const q = {
      id: `qa-${Date.now()}`,
      eventId,
      askerId: user.id,
      askerName: user.name,
      askerAvatar: user.avatarUrl,
      question: safeQuestion,
      createdAt: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    const list = this.questions.get(eventId) || [];
    list.push(q);
    this.questions.set(eventId, list);
    this.saveToFile();
    return q;
  }
  answerQuestion(eventId, questionId, organizerId, answerText) {
    const event = this.events.get(eventId);
    if (!event) throw new Error("\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
    if (event.organizerId !== organizerId) {
      throw new Error("\u0422\u043E\u043B\u044C\u043A\u043E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u044B");
    }
    const list = this.questions.get(eventId) || [];
    const q = list.find((item) => item.id === questionId);
    if (!q) throw new Error("\u0412\u043E\u043F\u0440\u043E\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    q.answer = this.maskContactsInPublicText(answerText.trim());
    q.answeredAt = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    this.saveToFile();
    return q;
  }
};
var store = new DataStore();

// server/ai.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function generateEventDescription(params) {
  try {
    const prompt = `\u0422\u044B \u2014 AI-\u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A \u0441\u0435\u0440\u0432\u0438\u0441\u0430 Kompany, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u043B\u044E\u0434\u044F\u043C \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u044C \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E \u0434\u043B\u044F \u043F\u0440\u0430\u0437\u0434\u043D\u0438\u043A\u043E\u0432, \u043D\u0430\u0441\u0442\u043E\u043B\u043E\u043A, \u043A\u0430\u0444\u0435, \u043F\u0440\u043E\u0433\u0443\u043B\u043E\u043A \u0438 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0439 (\u041D\u0415 \u0434\u0435\u0439\u0442\u0438\u043D\u0433!).
\u0421\u043E\u0441\u0442\u0430\u0432\u044C \u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u043E\u0435, \u043F\u0440\u0438\u0432\u043B\u0435\u043A\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0438 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044F.

\u0412\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435:
- \u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F: ${params.category}
- \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 / \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A: ${params.title}
- \u0411\u044E\u0434\u0436\u0435\u0442: ${params.budget}
- \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432: ${params.targetParticipants}
- \u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u0436\u0435\u043B\u0430\u043D\u0438\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0430: ${params.notes || "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B"}

\u0412\u0435\u0440\u043D\u0438 \u043E\u0442\u0432\u0435\u0442 \u0441\u0442\u0440\u043E\u0433\u043E \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 JSON \u0441\u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u043C\u0438 \u043F\u043E\u043B\u044F\u043C\u0438:
{
  "description": "\u0422\u0435\u043F\u043B\u044B\u0439 \u0436\u0438\u0432\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u043E\u0442 \u043B\u0438\u0446\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0430 (2-3 \u0430\u0431\u0437\u0430\u0446\u0430), \u043F\u043E\u0447\u0435\u043C\u0443 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F, \u043A\u0430\u043A\u0430\u044F \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0430 \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u0442\u0441\u044F, \u043A\u043E\u0433\u043E \u0440\u0430\u0434\u044B \u0432\u0438\u0434\u0435\u0442\u044C",
  "suggestedAgenda": ["\u041A\u0440\u0430\u0442\u043A\u0438\u0439 \u043F\u0440\u0438\u043C\u0435\u0440\u043D\u044B\u0439 \u0442\u0430\u0439\u043C\u0438\u043D\u0433 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u043F\u043E \u043F\u0443\u043D\u043A\u0442\u0430\u043C (3-4 \u043F\u0443\u043D\u043A\u0442\u0430)"],
  "suggestedIcebreaker": "\u041E\u0434\u043D\u0430 \u043B\u0435\u0433\u043A\u0430\u044F \u043D\u0435\u043D\u0430\u0432\u044F\u0437\u0447\u0438\u0432\u0430\u044F \u0442\u0435\u043C\u0430 \u0438\u043B\u0438 \u0432\u043E\u043F\u0440\u043E\u0441 \u0434\u043B\u044F \u0437\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u0430 \u0432 \u043D\u0430\u0447\u0430\u043B\u0435",
  "safetyTip": "\u041A\u043E\u0440\u043E\u0442\u043A\u0430\u044F \u0434\u0440\u0443\u0436\u0435\u0441\u043A\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F \u043F\u043E \u043A\u043E\u043C\u0444\u043E\u0440\u0442\u0443 \u0438 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438 \u0432\u0441\u0442\u0440\u0435\u0447\u0438"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      description: parsed.description || "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0430\u044E \u0441\u043E\u0431\u0440\u0430\u0442\u044C\u0441\u044F \u0434\u0443\u0448\u0435\u0432\u043D\u043E\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0435\u0439, \u0432\u043A\u0443\u0441\u043D\u043E \u043F\u0440\u043E\u0432\u0435\u0441\u0442\u0438 \u0432\u0440\u0435\u043C\u044F \u0438 \u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442\u044C\u0441\u044F!",
      suggestedAgenda: parsed.suggestedAgenda || ["19:00 \u2014 \u0421\u0431\u043E\u0440 \u0438 \u0437\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u043E", "19:30 \u2014 \u0417\u0430\u043A\u0430\u0437 \u0431\u043B\u044E\u0434 \u0438 \u043E\u0431\u0449\u0435\u043D\u0438\u0435", "21:00 \u2014 \u0421\u0432\u043E\u0431\u043E\u0434\u043D\u0430\u044F \u0431\u0435\u0441\u0435\u0434\u0430"],
      suggestedIcebreaker: parsed.suggestedIcebreaker || "\u0420\u0430\u0441\u0441\u043A\u0430\u0436\u0438\u0442\u0435 \u043E \u0441\u0430\u043C\u043E\u043C \u043D\u0435\u043E\u0431\u044B\u0447\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435, \u0433\u0434\u0435 \u0432\u044B \u0431\u044B\u0432\u0430\u043B\u0438 \u0437\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0433\u043E\u0434.",
      safetyTip: parsed.safetyTip || "\u0412\u0441\u0442\u0440\u0435\u0447\u0430 \u0432 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435. \u041B\u0438\u0447\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B \u0438 \u0442\u043E\u0447\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u0432\u0437\u0430\u0438\u043C\u043D\u043E\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F."
    };
  } catch (error) {
    console.error("AI describe error:", error);
    return {
      description: `\u041F\u0440\u0438\u0432\u0435\u0442! \u0421\u043E\u0431\u0438\u0440\u0430\u044E \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u0443\u044E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E \u0434\u043B\u044F ${params.category.toLowerCase()}. \u041F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u043C \u043F\u043E\u0441\u0438\u0434\u0435\u0442\u044C \u0432 \u043F\u0440\u0438\u044F\u0442\u043D\u043E\u043C \u043C\u0435\u0441\u0442\u0435, \u043F\u043E\u043E\u0431\u0449\u0430\u0442\u044C\u0441\u044F \u0438 \u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442\u044C\u0441\u044F \u0441 \u043D\u043E\u0432\u044B\u043C\u0438 \u043B\u044E\u0434\u044C\u043C\u0438. \u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435\u0441\u044C!`,
      suggestedAgenda: ["\u0421\u0431\u043E\u0440 \u0438 \u0437\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u043E", "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C", "\u0421\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0434\u0443\u0448\u0435\u0432\u043D\u043E\u0435 \u043E\u0431\u0449\u0435\u043D\u0438\u0435"],
      suggestedIcebreaker: "\u041A\u0430\u043A\u043E\u0435 \u0432\u0430\u0448\u0435 \u043B\u044E\u0431\u0438\u043C\u043E\u0435 \u0445\u043E\u0431\u0431\u0438, \u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043C\u0430\u043B\u043E \u043A\u0442\u043E \u0437\u043D\u0430\u0435\u0442?",
      safetyTip: "\u0412\u0441\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u043F\u0440\u043E\u0445\u043E\u0434\u044F\u0442 \u0432 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0445 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u0430\u0445."
    };
  }
}
async function getSmartRecommendations(params) {
  try {
    const prompt = `\u0422\u044B \u2014 \u0430\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u0443\u043C\u043D\u044B\u0445 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0439 \u0434\u043B\u044F \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E\u0433\u043E \u0434\u043E\u0441\u0443\u0433\u0430 Kompany.
\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C:
- \u0412\u043E\u0437\u0440\u0430\u0441\u0442: ${params.age}
- \u0413\u043E\u0440\u043E\u0434: ${params.city}
- \u0418\u043D\u0442\u0435\u0440\u0435\u0441\u044B: ${params.userInterests.join(", ")}

\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044F:
${JSON.stringify(params.events, null, 2)}

\u041F\u043E\u0434\u0431\u0435\u0440\u0438 \u043D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044F \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (\u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 3).
\u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0443\u043A\u0430\u0436\u0438:
- eventId (\u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0432\u044B\u0448\u0435)
- matchScore (\u043E\u0442 70 \u0434\u043E 99)
- matchReason (\u043E\u0434\u043D\u043E \u0436\u0438\u0432\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C, \u043F\u043E\u0447\u0435\u043C\u0443 \u044D\u0442\u043E \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u0442\u043E\u0447\u043D\u043E \u043F\u043E\u043D\u0440\u0430\u0432\u0438\u0442\u0441\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E \u0441 \u0435\u0433\u043E \u0438\u043D\u0442\u0435\u0440\u0435\u0441\u0430\u043C\u0438).

\u0412\u0435\u0440\u043D\u0438 JSON \u043C\u0430\u0441\u0441\u0438\u0432 \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error("AI recommendations error:", error);
  }
  return params.events.slice(0, 3).map((e, idx) => ({
    eventId: e.id,
    matchScore: 95 - idx * 5,
    matchReason: `\u041F\u043E\u0434\u0445\u043E\u0434\u0438\u0442 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 "${e.category}" \u0438 \u0444\u043E\u0440\u043C\u0430\u0442\u0443 \u0434\u0440\u0443\u0436\u0435\u043B\u044E\u0431\u043D\u044B\u0445 \u0432\u0441\u0442\u0440\u0435\u0447.`
  }));
}
async function scanEventSafety(params) {
  try {
    const prompt = `\u041F\u0440\u043E\u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043E \u043F\u043E\u0438\u0441\u043A\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u043D\u0430 \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438:
\u0417\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u043E:
- \u0421\u0435\u043A\u0441\u0443\u0430\u043B\u044C\u043D\u044B\u0435 \u0443\u0441\u043B\u0443\u0433\u0438 \u0438\u043B\u0438 \u0437\u0430\u0432\u0443\u0430\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u044D\u0441\u043A\u043E\u0440\u0442
- \u0421\u0431\u043E\u0440 \u0431\u043E\u043B\u044C\u0448\u0438\u0445 \u043F\u0440\u0435\u0434\u043E\u043F\u043B\u0430\u0442 \u0438\u043B\u0438 \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u0435 \u043F\u0438\u0440\u0430\u043C\u0438\u0434\u044B
- \u041F\u0440\u043E\u0434\u0430\u0436\u0430 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u043D\u044B\u0445 \u0432\u0435\u0449\u0435\u0441\u0442\u0432
- \u0410\u0433\u0440\u0435\u0441\u0441\u0438\u044F, \u0434\u0438\u0441\u043A\u0440\u0438\u043C\u0438\u043D\u0430\u0446\u0438\u044F
- \u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u0432 \u043F\u043E\u0434\u043E\u0437\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0431\u0435\u0437\u043B\u044E\u0434\u043D\u044B\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u044B\u0435 \u043C\u0435\u0441\u0442\u0430 \u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F

\u041E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435:
\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435: ${params.title}
\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435: ${params.description}
\u0411\u044E\u0434\u0436\u0435\u0442: ${params.budget}

\u0412\u0435\u0440\u043D\u0438 JSON:
{
  "isSafe": true/false,
  "score": \u0447\u0438\u0441\u043B\u043E \u043E\u0442 0 \u0434\u043E 100 (\u0433\u0434\u0435 100 \u2014 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E),
  "warning": "\u043A\u0440\u0430\u0442\u043A\u043E\u0435 \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 null"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      isSafe: parsed.isSafe ?? true,
      score: parsed.score ?? 98,
      warning: parsed.warning
    };
  } catch (err) {
    console.error("Safety scan error:", err);
    return { isSafe: true, score: 95 };
  }
}

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json());
function getRequesterId(req) {
  const headerUserId = req.headers["x-user-id"];
  return headerUserId || store.activeUserId;
}
app.get("/api/auth/me", (req, res) => {
  const userId = getRequesterId(req);
  const user = store.users.get(userId);
  if (!user) {
    return res.status(404).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  res.json(user);
});
app.post("/api/auth/switch-user", (req, res) => {
  const { userId } = req.body;
  if (!store.users.has(userId)) {
    return res.status(404).json({ error: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  }
  store.activeUserId = userId;
  store.saveToFile();
  res.json({ success: true, user: store.users.get(userId) });
});
app.get("/api/auth/available-users", (_req, res) => {
  const demoIds = ["user-anna", "user-mikhail", "user-elena", "user-admin"];
  const users = Array.from(store.users.values()).filter((u) => demoIds.includes(u.id)).map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatarUrl: u.avatarUrl,
    age: u.age,
    bio: u.bio,
    reliability: u.reliability
  }));
  res.json(users);
});
app.post("/api/auth/update-profile", (req, res) => {
  const userId = getRequesterId(req);
  const user = store.users.get(userId);
  if (!user) return res.status(404).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  const { name, bio, interests, city, avatarUrl, photos, phoneNumber, occupation, companyOrIndustry } = req.body;
  if (name) user.name = name;
  if (bio !== void 0) user.bio = bio;
  if (interests) user.interests = interests;
  if (city) user.city = city;
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (Array.isArray(photos)) user.photos = photos;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (occupation !== void 0) user.occupation = occupation;
  if (companyOrIndustry !== void 0) user.companyOrIndustry = companyOrIndustry;
  store.saveToFile();
  res.json(user);
});
app.get("/api/users/:id", (req, res) => {
  const targetId = req.params.id;
  const target = store.users.get(targetId);
  if (!target) return res.status(404).json({ error: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
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
    onlineStatus: target.id === store.activeUserId ? "online" : target.onlineStatus || "recent",
    lastSeen: target.id === store.activeUserId ? "\u041E\u043D\u043B\u0430\u0439\u043D \u0441\u0435\u0439\u0447\u0430\u0441" : target.lastSeen || "\u0411\u044B\u043B(\u0430) \u043D\u0435\u0434\u0430\u0432\u043D\u043E",
    isPhoneVerified: target.isPhoneVerified,
    isEmailVerified: target.isEmailVerified,
    isIdentityVerified: target.isIdentityVerified,
    favoriteCategories: target.favoriteCategories
  };
  const userReviews = store.reviews.get(targetId) || [];
  res.json({ profile: publicProfile, reviews: userReviews });
});
app.get("/api/events", (req, res) => {
  const viewerUserId = getRequesterId(req);
  const category = req.query.category;
  const city = req.query.city;
  const onlyToday = req.query.onlyToday === "true";
  const query = req.query.q;
  const events = store.getEvents(viewerUserId, { category, city, onlyToday, query });
  res.json(events);
});
app.get("/api/events/:id", (req, res) => {
  const viewerUserId = getRequesterId(req);
  const event = store.getEventById(req.params.id, viewerUserId);
  if (!event) return res.status(404).json({ error: "\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
  const existingApp = Array.from(store.applications.values()).find((a) => a.eventId === req.params.id && a.userId === viewerUserId);
  res.json({
    event,
    myApplication: existingApp || null
  });
});
app.post("/api/events", async (req, res) => {
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
      yandexMapsUrl,
      coordinates,
      organizerPhone,
      privateInstructions,
      requirements,
      rules,
      allowPhoneSharing,
      imageUrl,
      vibe,
      musicOrMood,
      icebreakerQuestion
    } = req.body;
    if (!title || !category || !date || !time) {
      return res.status(400).json({ error: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F (\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E, \u0434\u0430\u0442\u0443 \u0438 \u0432\u0440\u0435\u043C\u044F)" });
    }
    const safety = await scanEventSafety({ title, description, budget });
    if (!safety.isSafe) {
      return res.status(400).json({
        error: `\u041E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E \u0441\u0438\u0441\u0442\u0435\u043C\u043E\u0439 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438: ${safety.warning || "\u043D\u0435\u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B"}`
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
      yandexMapsUrl,
      coordinates,
      organizerPhone,
      privateInstructions,
      requirements,
      rules,
      allowPhoneSharing,
      imageUrl,
      organizerId,
      vibe,
      musicOrMood,
      icebreakerQuestion
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u044F" });
  }
});
app.patch("/api/events/:id/cancel", (req, res) => {
  const organizerId = getRequesterId(req);
  const { reason } = req.body;
  try {
    const cancelled = store.cancelEvent(req.params.id, organizerId, reason);
    res.json(cancelled);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/events/:id/toggle-save", (req, res) => {
  const userId = getRequesterId(req);
  try {
    const updatedUser = store.toggleSaveEvent(userId, req.params.id);
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get("/api/events/:id/questions", (req, res) => {
  res.json(store.getQuestions(req.params.id));
});
app.post("/api/events/:id/questions", (req, res) => {
  const userId = getRequesterId(req);
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u0430" });
  }
  try {
    const q = store.askQuestion(req.params.id, userId, question);
    res.status(201).json(q);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/events/:id/questions/:qId/answer", (req, res) => {
  const organizerId = getRequesterId(req);
  const { answer } = req.body;
  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442 \u043E\u0442\u0432\u0435\u0442\u0430" });
  }
  try {
    const q = store.answerQuestion(req.params.id, req.params.qId, organizerId, answer);
    res.json(q);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/events/:id/apply", (req, res) => {
  const userId = getRequesterId(req);
  const { note } = req.body;
  try {
    const appRecord = store.applyToEvent(req.params.id, userId, note);
    res.status(201).json(appRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get("/api/events/:id/applications", (req, res) => {
  const organizerId = getRequesterId(req);
  const event = store.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: "\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
  if (event.organizerId !== organizerId) {
    return res.status(403).json({ error: "\u0414\u043E\u0441\u0442\u0443\u043F \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0443" });
  }
  const apps = Array.from(store.applications.values()).filter((a) => a.eventId === req.params.id);
  res.json(apps);
});
app.post("/api/applications/:id/decision", (req, res) => {
  const organizerId = getRequesterId(req);
  const { action } = req.body;
  if (action !== "accept" && action !== "reject") {
    return res.status(400).json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435" });
  }
  try {
    const updated = store.handleApplication(req.params.id, organizerId, action);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get("/api/events/:id/chat", (req, res) => {
  const userId = getRequesterId(req);
  const event = store.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: "\u041C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
  const isApproved = event.organizerId === userId || event.approvedParticipantIds.includes(userId);
  if (!isApproved) {
    return res.status(403).json({
      error: "\u0417\u0430\u043A\u0440\u044B\u0442\u044B\u0439 \u0433\u0440\u0443\u043F\u043F\u043E\u0432\u043E\u0439 \u0447\u0430\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043D\u044B\u043C \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430\u043C \u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0442\u043E\u0440\u0443"
    });
  }
  const messages = store.chatMessages.get(req.params.id) || [];
  res.json(messages);
});
app.post("/api/events/:id/chat", (req, res) => {
  const userId = getRequesterId(req);
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C" });
  }
  try {
    const msg = store.sendChatMessage(req.params.id, userId, text);
    res.status(201).json(msg);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});
app.post("/api/events/:id/attendance", (req, res) => {
  const organizerId = getRequesterId(req);
  const { participantId, status } = req.body;
  try {
    const updatedUser = store.markAttendance(req.params.id, organizerId, participantId, status);
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/reviews", (req, res) => {
  const authorId = getRequesterId(req);
  const { eventId, targetUserId, rating, tags, text } = req.body;
  try {
    const review = store.submitReview({
      eventId,
      authorId,
      targetUserId,
      rating,
      tags,
      text
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/reports", (req, res) => {
  const reporterId = getRequesterId(req);
  const { targetType, targetId, reason, details } = req.body;
  try {
    const rep = store.submitReport({
      reporterId,
      targetType,
      targetId,
      reason,
      details
    });
    res.status(201).json(rep);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.post("/api/blocks", (req, res) => {
  const userId = getRequesterId(req);
  const { targetUserId } = req.body;
  try {
    const user = store.blockUser(userId, targetUserId);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get("/api/notifications", (req, res) => {
  const userId = getRequesterId(req);
  const list = store.notifications.get(userId) || [];
  res.json(list);
});
app.post("/api/notifications/:id/read", (req, res) => {
  const userId = getRequesterId(req);
  const list = store.notifications.get(userId) || [];
  const notif = list.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    store.saveToFile();
  }
  res.json({ success: true });
});
app.post("/api/ai/describe", async (req, res) => {
  const { category, title, budget, targetParticipants, notes } = req.body;
  const result = await generateEventDescription({
    category: category || "\u0412\u0441\u0442\u0440\u0435\u0447\u0430",
    title: title || "\u041F\u0440\u0438\u044F\u0442\u043D\u044B\u0439 \u0432\u0435\u0447\u0435\u0440",
    budget: budget || "\u0434\u043E 1 000 \u20BD",
    targetParticipants: targetParticipants || 4,
    notes
  });
  res.json(result);
});
app.post("/api/ai/recommendations", async (req, res) => {
  const userId = getRequesterId(req);
  const user = store.users.get(userId);
  if (!user) return res.status(404).json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
  const events = Array.from(store.events.values()).map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    description: e.description
  }));
  const recommendations = await getSmartRecommendations({
    userInterests: user.interests,
    city: user.city,
    age: user.age,
    events
  });
  res.json(recommendations);
});
app.get("/api/download/build", (req, res) => {
  const format = req.query.format === "tar" ? "tar" : "zip";
  if (format === "tar") {
    const archivePath2 = path2.resolve(process.cwd(), "dist-bundle.tar.gz");
    if (fs2.existsSync(archivePath2)) {
      return res.download(archivePath2, "kompany-build.tar.gz");
    }
  }
  const zipPath = path2.resolve(process.cwd(), "dist-bundle.zip");
  if (fs2.existsSync(zipPath)) {
    return res.download(zipPath, "kompany-build.zip");
  }
  const archivePath = path2.resolve(process.cwd(), "dist-bundle.tar.gz");
  if (fs2.existsSync(archivePath)) {
    return res.download(archivePath, "kompany-build.tar.gz");
  }
  res.status(404).json({ error: "\u0410\u0440\u0445\u0438\u0432 \u0441\u0431\u043E\u0440\u043A\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
});
app.get("/api/admin/overview", (req, res) => {
  const userId = getRequesterId(req);
  const requester = store.users.get(userId);
  if (requester?.role !== "admin") {
  }
  const allEvents = Array.from(store.events.values());
  const allUsers = Array.from(store.users.values());
  const allReports = Array.from(store.reports.values());
  const allApps = Array.from(store.applications.values());
  const completedCount = allEvents.filter((e) => e.status === "completed").length;
  const activeCount = allEvents.filter((e) => e.status === "open" || e.status === "full").length;
  const acceptedAppsCount = allApps.filter((a) => a.status === "accepted").length;
  res.json({
    kpi: {
      totalUsers: allUsers.length,
      totalEvents: allEvents.length,
      activeEvents: activeCount,
      completedEvents: completedCount,
      totalApplications: allApps.length,
      acceptanceRatePercent: allApps.length > 0 ? Math.round(acceptedAppsCount / allApps.length * 100) : 0,
      pendingReports: allReports.filter((r) => r.status === "pending").length
    },
    reports: allReports,
    flaggedUsers: allUsers.filter((u) => u.status === "blocked"),
    recentEvents: allEvents.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      organizerName: e.organizer.name,
      status: e.status,
      occupiedSpots: e.occupiedSpots,
      totalSpots: e.totalSpots
    }))
  });
});
app.post("/api/admin/reports/:id/action", (req, res) => {
  const { action } = req.body;
  const report = store.reports.get(req.params.id);
  if (!report) return res.status(404).json({ error: "\u0416\u0430\u043B\u043E\u0431\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
  if (action === "dismiss") {
    report.status = "dismissed";
  } else if (action === "block_user") {
    report.status = "action_taken";
    if (report.targetType === "user") {
      const u = store.users.get(report.targetId);
      if (u) u.status = "blocked";
    }
  } else if (action === "delete_event") {
    report.status = "action_taken";
    if (report.targetType === "event") {
      store.events.delete(report.targetId);
    }
  }
  store.saveToFile();
  res.json(report);
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use("/src/assets", express.static(path2.resolve(process.cwd(), "src/assets")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
