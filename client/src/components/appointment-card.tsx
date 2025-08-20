import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, RussianRuble, Edit, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { AppointmentWithDetails } from "@shared/schema";

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  showActions?: boolean;
  isAdmin?: boolean;
}

export default function AppointmentCard({ appointment, showActions = false, isAdmin = false }: AppointmentCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/appointments/${appointment.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Запись отменена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
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
        description: "Не удалось отменить запись",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Запланировано</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Завершено</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Отменено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isPast = new Date(appointment.appointmentDate) < new Date();

  return (
    <Card className="bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-deep-charcoal">{appointment.service.name}</h4>
              {getStatusBadge(appointment.status)}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formatDate(appointment.appointmentDate)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{appointment.startTime} - {appointment.endTime}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>
                    {(appointment.user?.firstName || '') + ' ' + (appointment.user?.lastName || '')}
                    {appointment.user?.phone || appointment.phone ? ` • ${appointment.user?.phone || appointment.phone}` : ''}
                    {appointment.user?.email || appointment.email ? ` • ${appointment.user?.email || appointment.email}` : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center text-rose-gold font-medium">
                <RussianRuble className="h-4 w-4 mr-1" />
                <span>{appointment.service.price.toLocaleString()}</span>
              </div>
            </div>

            {appointment.notes && (
              <p className="text-sm text-gray-500 mt-2 italic">
                {appointment.notes}
              </p>
            )}
          </div>

          {showActions && appointment.status === 'scheduled' && !isPast && (
            <div className="flex space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
