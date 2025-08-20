import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  LogOut, 
  Home,
  Edit,
  X
} from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import AppointmentCard from "@/components/appointment-card";
import type { AppointmentWithDetails, Schedule, Service } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
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
  }, [isAuthenticated, isLoading, user, toast]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments", { date: selectedDate }],
    retry: false,
  });

  const { data: allAppointments } = useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
    retry: false,
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      // Save schedules for each working day
      const promises = [0, 1, 2, 3, 4, 5, 6].map(async (dayOfWeek) => {
        const isWorking = workingDays.includes(dayOfWeek);
        const existingSchedule = schedules?.find(s => s.dayOfWeek === dayOfWeek);
        
        if (isWorking) {
          const scheduleData = {
            dayOfWeek,
            startTime,
            endTime,
            lunchStart,
            lunchEnd,
            isActive: true,
          };

          if (existingSchedule) {
            await apiRequest("PUT", `/api/schedules/${existingSchedule.id}`, scheduleData);
          } else {
            await apiRequest("POST", "/api/schedules", scheduleData);
          }
        } else if (existingSchedule) {
          await apiRequest("PUT", `/api/schedules/${existingSchedule.id}`, { isActive: false });
        }
      });
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Расписание сохранено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить расписание",
        variant: "destructive",
      });
    },
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

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-warm-gray">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <X className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
              <p className="text-sm text-gray-600">
                Только администраторы могут получить доступ к этой странице.
              </p>
              <Link href="/">
                <Button className="mt-4">Вернуться на главную</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekAppointments = allAppointments?.filter(apt => {
    const appointmentDate = new Date(apt.appointmentDate);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return appointmentDate >= weekStart && appointmentDate <= weekEnd;
  }) || [];

  const weekRevenue = weekAppointments.reduce((sum, apt) => sum + apt.service.price, 0);
  const newClientsThisMonth = allAppointments?.filter(apt => {
    const appointmentDate = new Date(apt.appointmentDate);
    const monthStart = new Date();
    monthStart.setDate(1);
    return appointmentDate >= monthStart;
  }).length || 0;

  const occupancy = Math.round((weekAppointments.length / (workingDays.length * 10)) * 100);

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div className="min-h-screen bg-warm-gray">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="font-heading font-bold text-xl text-rose-gold">Ирина Админ</h1>
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
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Главная
                </Button>
              </Link>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-rose-gold to-pink-400 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Сегодня</p>
                  <p className="text-2xl font-bold">{todayAppointments?.length || 0}</p>
                  <p className="text-white/80 text-sm">записей</p>
                </div>
                <Calendar className="text-white/60 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent-gold to-yellow-400 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Эта неделя</p>
                  <p className="text-2xl font-bold">{weekRevenue.toLocaleString()}</p>
                  <p className="text-white/80 text-sm">рублей</p>
                </div>
                <TrendingUp className="text-white/60 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-400 to-green-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Новые клиенты</p>
                  <p className="text-2xl font-bold">{newClientsThisMonth}</p>
                  <p className="text-white/80 text-sm">этот месяц</p>
                </div>
                <Users className="text-white/60 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Загруженность</p>
                  <p className="text-2xl font-bold">{occupancy}%</p>
                  <p className="text-white/80 text-sm">на неделе</p>
                </div>
                <Clock className="text-white/60 h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card className="bg-warm-gray">
            <CardHeader>
              <CardTitle>Расписание на сегодня</CardTitle>
              <div className="flex items-center space-x-2">
                <Label htmlFor="date">Дата:</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-gold mx-auto mb-4"></div>
                  <p className="text-gray-500">Загрузка записей...</p>
                </div>
              ) : todayAppointments?.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Записей на выбранную дату нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments?.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment}
                      showActions={true}
                      isAdmin={true}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Management */}
          <Card className="bg-warm-gray">
            <CardHeader>
              <CardTitle>Управление расписанием</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Рабочие дни</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${index}`}
                          checked={workingDays.includes(index)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setWorkingDays([...workingDays, index]);
                            } else {
                              setWorkingDays(workingDays.filter(d => d !== index));
                            }
                          }}
                        />
                        <Label htmlFor={`day-${index}`} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 mb-2 block">
                      Начало работы
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 mb-2 block">
                      Конец работы
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart" className="text-sm font-medium text-gray-700 mb-2 block">
                      Обед с
                    </Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={lunchStart}
                      onChange={(e) => setLunchStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lunchEnd" className="text-sm font-medium text-gray-700 mb-2 block">
                      Обед до
                    </Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={lunchEnd}
                      onChange={(e) => setLunchEnd(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => saveScheduleMutation.mutate()}
                  disabled={saveScheduleMutation.isPending}
                  className="w-full bg-rose-gold text-white hover:bg-rose-gold/90"
                >
                  {saveScheduleMutation.isPending ? "Сохраняется..." : "Сохранить расписание"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Schedules Overview */}
          <Card className="bg-warm-gray">
            <CardHeader>
              <CardTitle>Текущее расписание по дням недели</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0,1,2,3,4,5,6].map((dow) => {
                  const s = schedules?.find(sc => sc.dayOfWeek === dow);
                  const name = dayNames[dow];
                  const active = s?.isActive;
                  return (
                    <div key={dow} className="p-3 border rounded-lg bg-white/70">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-deep-charcoal">{name}</span>
                        <Badge variant={active ? "default" : "secondary"}>
                          {active ? "Активен" : "Не активен"}
                        </Badge>
                      </div>
                      {active ? (
                        <div className="text-sm text-gray-700">
                          <div>Работа: {s?.startTime} — {s?.endTime}</div>
                          {s?.lunchStart && s?.lunchEnd ? (
                            <div>Обед: {s?.lunchStart} — {s?.lunchEnd}</div>
                          ) : (
                            <div>Обед: не указан</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Нет рабочего времени</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3">Изменить можно в блоке "Управление расписанием" выше: выберите дни и время, затем нажмите "Сохранить расписание".</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
