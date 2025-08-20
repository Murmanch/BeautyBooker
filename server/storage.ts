import {
  users,
  services,
  schedules,
  appointments,
  type User,
  type UpsertUser,
  type Service,
  type InsertService,
  type Schedule,
  type InsertSchedule,
  type Appointment,
  type InsertAppointment,
  type AppointmentWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Service operations
  getServices(): Promise<Service[]>;
  getActiveServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  
  // Schedule operations
  getSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;
  getScheduleByDay(dayOfWeek: number): Promise<Schedule | undefined>;
  
  // Appointment operations
  getAppointments(): Promise<AppointmentWithDetails[]>;
  getAppointmentsByUser(userId: string): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDate(date: Date): Promise<AppointmentWithDetails[]>;
  getAppointmentsByYmd(ymd: string): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentWithDetails[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  cancelAppointment(id: string): Promise<void>;
  getAppointment(id: string): Promise<AppointmentWithDetails | undefined>;
  getAppointmentByManageToken(token: string): Promise<AppointmentWithDetails | undefined>;
  updateAppointmentByManageToken(token: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  cancelAppointmentByManageToken(token: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User id is required for upsert");
    }

    // Check if user exists
    const existing = await this.getUser(userData.id);

    if (existing) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    }

    // Create new user
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
      })
      .returning();
    return user;
  }

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.name);
  }

  async getActiveServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(services.name);
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Schedule operations
  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.isActive, true)).orderBy(schedules.dayOfWeek);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: string, schedule: Partial<InsertSchedule>): Promise<Schedule> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  async getScheduleByDay(dayOfWeek: number): Promise<Schedule | undefined> {
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.dayOfWeek, dayOfWeek), eq(schedules.isActive, true)));
    return schedule;
  }

  // Appointment operations
  async getAppointments(): Promise<AppointmentWithDetails[]> {
    return await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        email: appointments.email,
        phone: appointments.phone,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        user: users,
        service: services,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getAppointmentsByUser(userId: string): Promise<AppointmentWithDetails[]> {
    return await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        email: appointments.email,
        phone: appointments.phone,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        user: users,
        service: services,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getAppointmentsByDate(date: Date): Promise<AppointmentWithDetails[]> {
    // Treat incoming date as LOCAL date start/end
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const startOfDay = new Date(y, m, d, 0, 0, 0, 0);
    const endOfDay = new Date(y, m, d, 23, 59, 59, 999);

    return await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        email: appointments.email,
        phone: appointments.phone,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        user: users,
        service: services,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      )
      .orderBy(appointments.startTime);
  }

  async getAppointmentsByYmd(ymd: string): Promise<AppointmentWithDetails[]> {
    // Compare by date part only at the database level to avoid timezone shifts
    return await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        email: appointments.email,
        phone: appointments.phone,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        user: users,
        service: services,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(sql`date(${appointments.appointmentDate}) = ${ymd}::date`)
      .orderBy(appointments.startTime);
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentWithDetails[]> {
    return await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        email: appointments.email,
        phone: appointments.phone,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        user: users,
        service: services,
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          gte(appointments.appointmentDate, startDate),
          lte(appointments.appointmentDate, endDate)
        )
      )
      .orderBy(appointments.appointmentDate, appointments.startTime);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async cancelAppointment(id: string): Promise<void> {
    await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, id));
  }

  async getAppointment(id: string): Promise<AppointmentWithDetails | undefined> {
    const [appointment] = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        email: appointments.email,
        phone: appointments.phone,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        user: users,
        service: services,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentByManageToken(token: string): Promise<AppointmentWithDetails | undefined> {
    const [row] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.manageToken, token))
      .leftJoin(users, eq(users.id, appointments.userId))
      .leftJoin(services, eq(services.id, appointments.serviceId)) as unknown as AppointmentWithDetails[];
    return row;
  }

  async updateAppointmentByManageToken(token: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set(appointment)
      .where(eq(appointments.manageToken, token))
      .returning();
    return updated as Appointment;
  }

  async cancelAppointmentByManageToken(token: string): Promise<void> {
    await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(eq(appointments.manageToken, token));
  }
}

export const storage = new DatabaseStorage();
