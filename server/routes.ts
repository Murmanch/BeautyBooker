import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminAuth } from "./firebase";
import { z } from "zod";
import { insertServiceSchema, insertScheduleSchema, insertAppointmentSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import path from "path";
import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Session using Postgres store (works on any host)
function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Sessions and request user hydration
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(async (req, _res, next) => {
    try {
      const userId = (req.session as any)?.userId as string | undefined;
      if (userId) {
        const user = await storage.getUser(userId);
        (req as any).user = user;
      }
    } catch (_e) {
      // ignore hydration errors
    }
    next();
  });

  // Initial seed for services and schedules if database is empty
  try {
    const existingServices = await storage.getServices();
    const desired = [
      {
        name: "Чистка лица",
        description: "Глубокое очищение пор, удаление комедонов, увлажнение и питание кожи",
        duration: 90,
        price: 3500,
        isActive: true,
        imageUrl: "https://avatars.mds.yandex.net/get-ydo/1649611/2a0000017e587fa3205493a66e8257986d6a/diploma",
      },
      {
        name: "Пилинги",
        description: "Химические и механические пилинги для обновления и омоложения кожи",
        duration: 60,
        price: 3500,
        isActive: true,
        imageUrl: "https://sklad-zdorovo.ru/images/goods/28042.jpg",
      },
      {
        name: "Массаж лица",
        description: "Антивозрастной массаж для улучшения тонуса и эластичности кожи",
        duration: 45,
        price: 2000,
        isActive: true,
        imageUrl: "https://avatars.mds.yandex.net/get-ydo/11397567/2a0000018c58d8082ffddcffe50251a8d09e/diploma",
      },
      {
        name: "Микротоковая терапия",
        description: "Слабые импульсные токи для омоложения кожи, улучшения лимфодренажа и коррекции овала лица",
        duration: 45,
        price: 3500,
        isActive: true,
        imageUrl: "https://s4.stc.all.kpcdn.net/russia/wp-content/uploads/2023/09/kosmetologicheskie-kliniki-Rostova-na-Donu-yunona.jpg",
      },
      {
        name: "Ботокс",
        description: "Инъекции ботулинотерапии для разглаживания мимических морщин",
        duration: 30,
        price: 8000,
        isActive: true,
        imageUrl: "https://slkclinic.com/wp-content/uploads/2022/10/botox-2048x1367.jpg",
      },
      {
        name: "Биоревитализация",
        description: "Введение гиалуроновой кислоты в кожу для глубокого увлажнения и омоложения",
        duration: 60,
        price: 10000,
        isActive: true,
        imageUrl: "https://renovacio-med.ru/upload/iblock/d9e/n0v9kqviz18wjvcyci4ilemldsu2vlsl/inj-1-1568x936.jpg",
      },
    ];

    // Cleanup/normalize: if old singular "Пилинг" exists, migrate it
    const singular = existingServices.find((s) => s.name === "Пилинг");
    const plural = existingServices.find((s) => s.name === "Пилинги");
    if (singular && !plural) {
      await storage.updateService(singular.id, {
        name: "Пилинги",
        duration: 60,
        price: 3500,
        isActive: true,
        imageUrl: "https://sklad-zdorovo.ru/images/goods/28042.jpg",
      } as any);
    } else if (singular && plural) {
      // Deactivate duplicate singular to avoid showing both
      await storage.updateService(singular.id, { isActive: false } as any);
    }

    for (const d of desired) {
      const existing = existingServices.find(s => s.name === d.name);
      if (!existing) {
        await storage.createService(d as any);
      } else if (!('imageUrl' in existing) || !(existing as any).imageUrl) {
        // Добавить изображение для уже существующей услуги, если его нет
        await storage.updateService(existing.id, { imageUrl: d.imageUrl } as any);
      }
    }

    // Форс-исправление картинки для "Микротоковая терапия"
    const micro = (await storage.getServices()).find(s => s.name === "Микротоковая терапия");
    if (micro && (micro as any).imageUrl !== "https://s4.stc.all.kpcdn.net/russia/wp-content/uploads/2023/09/kosmetologicheskie-kliniki-Rostova-na-Donu-yunona.jpg") {
      await storage.updateService(micro.id, { imageUrl: "https://s4.stc.all.kpcdn.net/russia/wp-content/uploads/2023/09/kosmetologicheskie-kliniki-Rostova-na-Donu-yunona.jpg" } as any);
    }

    const existingSchedules = await storage.getSchedules();
    if (existingSchedules.length === 0) {
      const workingDays = [1, 2, 3, 4, 5]; // Mon-Fri
      for (const dayOfWeek of workingDays) {
        await storage.createSchedule({
          dayOfWeek,
          startTime: "10:00",
          endTime: "18:00",
          lunchStart: "13:00",
          lunchEnd: "14:00",
          isActive: true,
        });
      }
    }
  } catch (e) {
    console.warn("Seed skipped:", (e as Error).message);
  }

  // Auth routes (simple session-based)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // POST /api/auth/phone { idToken }
  app.post('/api/auth/phone', express.json(), async (req: any, res) => {
    try {
      const { idToken } = req.body || {};
      if (!idToken) return res.status(400).json({ message: 'idToken required' });

      // Verify Firebase ID token
      const decoded = await adminAuth.verifyIdToken(idToken);
      const phone = decoded.phone_number as string | undefined;
      const uid = decoded.uid as string;

      // Create or update user using phone as id when present; otherwise uid
      const id = phone || uid;
      const user = await storage.upsertUser({
        id,
        phone: phone,
        ...(phone && process.env.ADMIN_PHONE && phone === process.env.ADMIN_PHONE ? { isAdmin: true } : {}),
      });

      (req.session as any).userId = user.id;
      res.json(user);
    } catch (error) {
      console.error('Phone auth failed', error);
      res.status(401).json({ message: 'Phone auth failed' });
    }
  });

  // GET /api/login supports quick guest login and optional admin via ?adminToken=
  app.get('/api/login', async (req: any, res) => {
    try {
      const email = (req.query.email as string) || `guest-${Date.now()}@example.com`;
      const firstName = (req.query.firstName as string) || undefined;
      const lastName = (req.query.lastName as string) || undefined;
      const isAdmin = (req.query.adminToken as string | undefined) === process.env.ADMIN_TOKEN ? true : undefined;

      // Use email as stable id for simplicity (varchar PK)
      const user = await storage.upsertUser({
        id: email,
        email,
        firstName,
        lastName,
        ...(isAdmin ? { isAdmin: true } : {}),
      });

      (req.session as any).userId = user.id;
      const redirect = (req.query.redirect as string) || '/';
      res.redirect(redirect);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // POST /api/login { email, firstName?, lastName?, adminToken? }
  app.post('/api/login', express.json(), async (req: any, res) => {
    try {
      const body = req.body || {};
      const email = body.email as string;
      if (!email) return res.status(400).json({ message: "email is required" });
      const firstName = (body.firstName as string) || undefined;
      const lastName = (body.lastName as string) || undefined;
      const isAdmin = (body.adminToken as string | undefined) === process.env.ADMIN_TOKEN ? true : undefined;

      const user = await storage.upsertUser({
        id: email,
        email,
        firstName,
        lastName,
        ...(isAdmin ? { isAdmin: true } : {}),
      });

      (req.session as any).userId = user.id;
      res.json(user);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get('/api/logout', (req: any, res) => {
    req.session?.destroy(() => {
      res.redirect('/');
    });
  });

  // Service routes
  app.get('/api/services', async (_req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(req.params.id, serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Schedule routes
  app.get('/api/schedules', async (_req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post('/api/schedules', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.put('/api/schedules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const scheduleData = insertScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateSchedule(req.params.id, scheduleData);
      res.json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      let appointments;
      if (user?.isAdmin) {
        if (req.query.date) {
          const raw = String(req.query.date);
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            const [y, m, d] = raw.split('-').map(Number);
            const start = new Date(Date.UTC(y, (m as number) - 1, d, 0, 0, 0, 0));
            const end = new Date(Date.UTC(y, (m as number) - 1, d, 23, 59, 59, 999));
            appointments = await storage.getAppointmentsByDateRange(start, end);
          } else {
            const date = new Date(raw);
            appointments = await storage.getAppointmentsByDate(date);
          }
        } else {
          appointments = await storage.getAppointments();
        }
      } else {
        appointments = await storage.getAppointmentsByUser(user.id);
      }

      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Schemas for incoming appointment requests (coercing date strings)
  const createAppointmentRequestSchema = z.object({
    serviceId: z.string(),
    appointmentDate: z.coerce.date(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string().optional(),
    notes: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  });

  const updateAppointmentByTokenSchema = z.object({
    appointmentDate: z.coerce.date().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
  });

  // Create appointment (authenticated or anonymous)
  app.post('/api/appointments', express.json(), async (req: any, res) => {
    try {
      const user = req.user;

      const base = createAppointmentRequestSchema.parse(req.body || {});

      // If not authenticated, require phone for WhatsApp
      if (!user && !base.phone) {
        return res.status(400).json({ message: "Phone is required for anonymous booking" });
      }

      const normalizePhone = (phone?: string) => {
        if (!phone) return undefined as undefined | string;
        const digits = phone.replace(/\D/g, "");
        if (digits.startsWith("8") && digits.length === 11) return `7${digits.slice(1)}`;
        return digits;
      };

      const appointmentData = {
        serviceId: base.serviceId,
        appointmentDate: base.appointmentDate,
        startTime: base.startTime,
        endTime: base.endTime,
        status: base.status || "scheduled",
        notes: base.notes,
        // Если указаны контактные данные в запросе, считаем запись анонимной даже при наличии сессии
        userId: (base.email || base.phone) ? undefined : user?.id,
        email: base.email,
        phone: normalizePhone(base.phone),
        manageToken: user ? undefined : nanoid(32),
      } as any;

      const appointment = await storage.createAppointment(appointmentData);

      // Try to send WhatsApp message with manage link for anonymous booking
      if (!user && appointment.phone && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        const origin = `${req.protocol}://${req.get('host')}`;
        const link = `${origin}/manage/${appointment.manageToken}`;
        const text = `Ваша запись создана. Управляйте ею по ссылке: ${link}`;
        try {
          await sendWhatsAppMessage(appointment.phone, text);
        } catch (e) {
          console.warn("Failed to send WhatsApp message:", (e as Error).message);
        }
      }

      // Return manage token (only for anonymous bookings)
      const response = user ? appointment : { ...appointment, manageToken: appointment.manageToken };
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Anonymous management by token: get details
  app.get('/api/appointments/manage/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const appt = await storage.getAppointmentByManageToken(token);
      if (!appt) return res.status(404).json({ message: "Appointment not found" });
      res.json(appt);
    } catch (error) {
      console.error("Error fetching appointment by token:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  // Anonymous reschedule by token
  app.put('/api/appointments/manage/:token', express.json(), async (req, res) => {
    try {
      const token = req.params.token;
      const allowed = updateAppointmentByTokenSchema.parse(req.body || {});
      const update: any = {};
      if (allowed.appointmentDate) update.appointmentDate = allowed.appointmentDate;
      if (allowed.startTime) update.startTime = allowed.startTime;
      if (allowed.endTime) update.endTime = allowed.endTime;
      if (allowed.notes !== undefined) update.notes = allowed.notes;
      if (allowed.status !== undefined) update.status = allowed.status;

      const updated = await storage.updateAppointmentByManageToken(token, update);
      res.json(updated);
    } catch (error) {
      console.error("Error updating appointment by token:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Anonymous cancel by token
  app.delete('/api/appointments/manage/:token', async (req, res) => {
    try {
      const token = req.params.token;
      await storage.cancelAppointmentByManageToken(token);
      res.json({ message: "Appointment cancelled" });
    } catch (error) {
      console.error("Error cancelling appointment by token:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      if (!user?.isAdmin && appointment.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const updatedAppointment = await storage.updateAppointment(req.params.id, appointmentData);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      if (!user?.isAdmin && appointment.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.cancelAppointment(req.params.id);
      res.json({ message: "Appointment cancelled" });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  // Static files for uploaded assets
  app.use('/api/assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // Available time slots endpoint (public)
  app.get('/api/available-slots', async (req, res) => {
    try {
      const { date, serviceId } = req.query;

      if (!date || !serviceId) {
        return res.status(400).json({ message: "Date and serviceId are required" });
      }

      const selectedDate = new Date(date as string);
      const dayOfWeek = selectedDate.getDay();

      const schedule = await storage.getScheduleByDay(dayOfWeek);
      if (!schedule) {
        return res.json([]);
      }

      const appointments = await storage.getAppointmentsByDate(selectedDate);

      const services = await storage.getActiveServices();
      const service = services.find(s => s.id === serviceId);
      if (!service) {
        return res.status(400).json({ message: "Service not found" });
      }

      const slots = generateAvailableSlots(schedule, appointments, service.duration);
      res.json(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ message: "Failed to fetch available slots" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateAvailableSlots(schedule: any, appointments: any[], serviceDuration: number) {
  const slots = [] as string[];
  const workStart = timeToMinutes(schedule.startTime);
  const workEnd = timeToMinutes(schedule.endTime);
  const lunchStart = schedule.lunchStart ? timeToMinutes(schedule.lunchStart) : null;
  const lunchEnd = schedule.lunchEnd ? timeToMinutes(schedule.lunchEnd) : null;

  const sortedAppointments = appointments
    .filter(apt => apt.status === 'scheduled')
    .map(apt => ({
      start: timeToMinutes(apt.startTime),
      end: timeToMinutes(apt.endTime)
    }))
    .sort((a, b) => a.start - b.start);

  let currentTime = workStart;

  for (const appointment of sortedAppointments) {
    if (currentTime + serviceDuration <= appointment.start) {
      if (!lunchStart || !lunchEnd ||
          (currentTime + serviceDuration <= lunchStart) ||
          (currentTime >= lunchEnd)) {
        slots.push(minutesToTime(currentTime));
      }
    }
    currentTime = Math.max(currentTime, appointment.end);
  }

  while (currentTime + serviceDuration <= workEnd) {
    if (!lunchStart || !lunchEnd ||
        (currentTime + serviceDuration <= lunchStart) ||
        (currentTime >= lunchEnd)) {
      slots.push(minutesToTime(currentTime));
    }
    currentTime += 30;
  }

  return slots;
}

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Send WhatsApp message via Meta WhatsApp Cloud API
// Requires env vars: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
async function sendWhatsAppMessage(phoneE164Digits: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: `+${phoneE164Digits}`,
    type: "text",
    text: { body: text },
  } as const;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${body}`);
  }
}
