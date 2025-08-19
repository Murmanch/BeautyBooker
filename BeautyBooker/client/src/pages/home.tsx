import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import AppointmentCard from "@/components/appointment-card";
import BookingCalendar from "@/components/booking-calendar";
import type { AppointmentWithDetails, Service } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    retry: false,
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-warm-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-gold mx-auto mb-4"></div>
          <p className="text-deep-charcoal">Загрузка...</p>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments?.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.appointmentDate) >= new Date()
  ) || [];

  const pastAppointments = appointments?.filter(apt => 
    apt.status === 'completed' || new Date(apt.appointmentDate) < new Date()
  ) || [];

  return (
    <div className="min-h-screen bg-warm-gray">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="font-heading font-bold text-xl text-rose-gold">Елена Красота</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={user.profileImageUrl || "https://via.placeholder.com/32"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-deep-charcoal font-medium">
                  {user.firstName || user.email}
                </span>
              </div>
              {user.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Админ
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card className="bg-warm-gray">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-rose-gold" />
                  Личная информация
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <img 
                    src={user.profileImageUrl || "https://via.placeholder.com/80"} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-deep-charcoal">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                  {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Всего визитов:</span>
                    <span className="font-medium">{pastAppointments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Запланировано:</span>
                    <span className="font-medium">{upcomingAppointments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Статус:</span>
                    <Badge variant="secondary" className="text-rose-gold">
                      {pastAppointments.length > 10 ? "VIP клиент" : "Клиент"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-rose-gold" />
                  Мои записи
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-gold mx-auto mb-4"></div>
                    <p className="text-gray-500">Загрузка записей...</p>
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">У вас пока нет запланированных записей</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <AppointmentCard 
                        key={appointment.id} 
                        appointment={appointment}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Booking Section */}
        <div className="mt-12">
          <h2 className="font-heading font-bold text-2xl text-deep-charcoal mb-8 text-center">
            Записаться на новую процедуру
          </h2>
          
          {servicesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-gold mx-auto mb-4"></div>
              <p className="text-gray-500">Загрузка услуг...</p>
            </div>
          ) : (
            <BookingCalendar services={services || []} />
          )}
        </div>
      </div>
    </div>
  );
}
