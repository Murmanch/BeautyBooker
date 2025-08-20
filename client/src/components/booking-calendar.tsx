import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@shared/schema";
import { Input } from "@/components/ui/input";

interface BookingCalendarProps {
  services: Service[];
}

export default function BookingCalendar({ services }: BookingCalendarProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [manageLink, setManageLink] = useState<string | null>(null);

  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;

  const { data: availableSlots } = useQuery<string[]>({
    queryKey: ["/api/available-slots", { date: dateStr, serviceId: selectedService }],
    enabled: !!selectedDate && !!selectedService,
    retry: false,
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedDate || !selectedTime) {
        throw new Error("Выберите услугу, дату и время");
      }

      if (!customerEmail && !customerPhone) {
        throw new Error("Укажите телефон или email для связи");
      }

      const selectedServiceData = services.find(s => s.id === selectedService);
      if (!selectedServiceData) throw new Error("Услуга не найдена");

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endTime = new Date(selectedDate);
      endTime.setHours(hours, minutes + selectedServiceData.duration, 0, 0);

      const res = await apiRequest("POST", "/api/appointments", {
        serviceId: selectedService,
        appointmentDate: selectedDate.toISOString(),
        startTime: selectedTime,
        endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
        status: "scheduled",
        notes: customerName ? `Клиент: ${customerName}` : undefined,
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
      });
      const data = await res.json();
      return data;
    },
    onSuccess: (data: any) => {
      const origin = window.location.origin;
      const link = data?.manageToken ? `${origin}/manage/${data.manageToken}` : null;
      if (link) setManageLink(link);
      toast({
        title: "Успешно!",
        description: link ? "Ссылка для управления записью создана" : "Ваша запись создана",
      });
      setSelectedService("");
      setSelectedDate(null);
      setSelectedTime("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: (error as any).message || "Не удалось создать запись",
        variant: "destructive",
      });
    },
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const days = getDaysInMonth(currentMonth);
  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <Card className="bg-white shadow-xl max-w-4xl mx-auto">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Selection */}
          <div className="lg:col-span-1">
            <h3 className="font-heading font-semibold text-xl text-deep-charcoal mb-4">Выберите услугу</h3>
            <RadioGroup value={selectedService} onValueChange={setSelectedService}>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-rose-gold cursor-pointer transition-all">
                    <RadioGroupItem value={service.id} id={service.id} />
                    <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium text-deep-charcoal">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.duration} мин • {service.price.toLocaleString()} ₽</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-semibold text-xl text-deep-charcoal">Выберите дату</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 font-medium text-deep-charcoal min-w-[150px] text-center">
                  {formatMonthYear(currentMonth)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              
              {days.map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && isDateSelectable(date) && setSelectedDate(date)}
                  disabled={!date || !isDateSelectable(date)}
                  className={`
                    w-10 h-10 text-center text-sm rounded-lg transition-colors
                    ${!date 
                      ? 'invisible' 
                      : !isDateSelectable(date)
                      ? 'text-gray-400 cursor-not-allowed'
                      : selectedDate?.toDateString() === date.toDateString()
                      ? 'bg-rose-gold text-white font-medium'
                      : 'text-deep-charcoal hover:bg-rose-gold hover:text-white'
                    }
                  `}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>

            {/* Time Slots */}
            {selectedDate && selectedService && (
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
                        className={`
                          px-3 py-2 text-sm border-2 rounded-lg transition-all
                          ${selectedTime === slot
                            ? 'border-rose-gold bg-rose-gold text-white'
                            : 'border-gray-200 hover:border-rose-gold hover:bg-rose-gold hover:text-white'
                          }
                        `}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    На выбранную дату нет свободного времени
                  </p>
                )}
              </div>
            )}

            {selectedService && selectedDate && selectedTime && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-blush-pink rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-deep-charcoal mb-2">Детали записи:</h5>
                  <p className="text-sm text-gray-600">
                    <strong>Услуга:</strong> {selectedServiceData?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Дата:</strong> {selectedDate.toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Время:</strong> {selectedTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Стоимость:</strong> {selectedServiceData?.price.toLocaleString()} ₽
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label htmlFor="name">Имя (необязательно)</Label>
                    <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ваше имя" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="you@email.com" type="email" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+7 9XX XXX-XX-XX" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">Укажите email или телефон, чтобы получить ссылку для управления записью.</p>
                
                <Button 
                  onClick={() => bookingMutation.mutate()}
                  disabled={bookingMutation.isPending}
                  className="w-full bg-rose-gold text-white py-4 rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
                >
                  {bookingMutation.isPending ? "Создается запись..." : "Подтвердить запись"}
                </Button>

                {manageLink && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm break-all">
                    Ссылка для управления записью: <a className="text-rose-gold underline" href={manageLink}>{manageLink}</a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
