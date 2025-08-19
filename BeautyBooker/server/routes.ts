import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminAuth } from "./firebase";
import { z } from "zod";
import { insertServiceSchema, insertScheduleSchema, insertAppointmentSchema } from "@shared/schema";
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
    if (existingServices.length === 0) {
      await storage.createService({
        name: "Чистка лица",
        description: "Глубокое очищение пор, удаление комедонов, увлажнение и питание кожи",
        duration: 90,
        price: 2500,
        isActive: true,
      });
      await storage.createService({
        name: "Пилинг",
        description: "Обновление кожи с помощью химических и механических методов",
        duration: 60,
        price: 3500,
        isActive: true,
      });
      await storage.createService({
        name: "Массаж лица",
        description: "Антивозрастной массаж для улучшения тонуса кожи",
        duration: 45,
        price: 2000,
        isActive: true,
      });
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
          const date = new Date(req.query.date as string);
          appointments = await storage.getAppointmentsByDate(date);
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

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const appointmentData = {
        ...insertAppointmentSchema.parse(req.body),
        userId: user.id,
      };

      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
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
