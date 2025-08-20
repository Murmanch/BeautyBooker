import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function ManageBooking() {
  const { toast } = useToast();
  const [, params] = useRoute("/manage/:token");
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const serviceId = appointment?.serviceId as string | undefined;

  const dateStr = useMemo(() => selectedDate ? selectedDate.toISOString().split('T')[0] : undefined, [selectedDate]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/appointments/manage/${token}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAppointment(data);
      } catch (e: any) {
        toast({ title: "Ошибка", description: e.message || "Не удалось загрузить запись", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, toast]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!serviceId || !selectedDate) return;
      const params = new URLSearchParams({ serviceId, date: dateStr! });
      const res = await fetch(`/api/available-slots?${params}`);
      if (res.ok) {
        const slots = await res.json();
        setAvailableSlots(slots);
      }
    };
    fetchSlots();
  }, [serviceId, dateStr]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') newMonth.setMonth(newMonth.getMonth() - 1);
      else newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const formatMonthYear = (date: Date) => date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({ title: "Выберите дату и время", description: "Укажите новые дату и время" });
      return;
    }
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endTime = new Date(selectedDate);
    const duration = 60; // fallback
    endTime.setHours(hours, minutes + duration, 0, 0);

    try {
      const res = await apiRequest('PUT', `/api/appointments/manage/${token}`, {
        appointmentDate: selectedDate.toISOString(),
        startTime: selectedTime,
        endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
      });
      const updated = await res.json();
      setAppointment(updated);
      toast({ title: "Перенесено", description: "Ваша запись успешно перенесена" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось перенести запись", variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    try {
      await apiRequest('DELETE', `/api/appointments/manage/${token}`);
      toast({ title: "Отменено", description: "Ваша запись отменена" });
      setAppointment({ ...appointment, status: 'cancelled' });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось отменить запись", variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-warm-gray">
        Загрузка...
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-warm-gray">
        Не найдена запись
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-warm-gray px-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-2xl text-deep-charcoal">Управление записью</h2>
            <p className="text-gray-600">Статус: <strong>{appointment.status}</strong></p>
            <p className="text-gray-600">Услуга: <strong>{appointment.service?.name || appointment.serviceId}</strong></p>
            <p className="text-gray-600">Дата: <strong>{new Date(appointment.appointmentDate).toLocaleDateString('ru-RU')}</strong></p>
            <p className="text-gray-600">Время: <strong>{appointment.startTime}</strong></p>
          </div>

          {appointment.status !== 'cancelled' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-deep-charcoal">Перенести запись</h3>

              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium text-deep-charcoal min-w-[150px] text-center">
                    {formatMonthYear(currentMonth)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {days.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => date && isDateSelectable(date) && setSelectedDate(date)}
                    disabled={!date || !isDateSelectable(date)}
                    className={`w-10 h-10 text-center text-sm rounded-lg transition-colors ${
                      !date ? 'invisible' : !isDateSelectable(date) ? 'text-gray-400 cursor-not-allowed' : (selectedDate?.toDateString() === date.toDateString() ? 'bg-rose-gold text-white font-medium' : 'text-deep-charcoal hover:bg-rose-gold hover:text-white')
                    }`}
                  >
                    {date?.getDate()}
                  </button>
                ))}
              </div>

              {selectedDate && (
                <div>
                  <h4 className="font-medium text-deep-charcoal mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Доступное время
                  </h4>
                  {availableSlots && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`px-3 py-2 text-sm border-2 rounded-lg transition-all ${selectedTime === slot ? 'border-rose-gold bg-rose-gold text-white' : 'border-gray-200 hover:border-rose-gold hover:bg-rose-gold hover:text-white'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">На выбранную дату нет свободного времени</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReschedule} className="bg-rose-gold text-white" disabled={!selectedDate || !selectedTime}>
                  Перенести
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Отменить запись
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
