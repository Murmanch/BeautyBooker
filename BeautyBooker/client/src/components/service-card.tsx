import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, RussianRuble } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image?: string;
}

interface ServiceCardProps {
  service: Service;
  onBook: () => void;
}

export default function ServiceCard({ service, onBook }: ServiceCardProps) {
  return (
    <Card className="bg-warm-gray hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        {service.image && (
          <img 
            src={service.image} 
            alt={service.name} 
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        )}
        <h3 className="font-heading font-semibold text-xl text-deep-charcoal mb-2">
          {service.name}
        </h3>
        <p className="text-gray-600 mb-4">
          {service.description}
        </p>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Clock className="h-4 w-4 mr-1" />
          <span>{service.duration} мин</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-rose-gold font-bold text-lg">
            <span>от {service.price.toLocaleString()}</span>
            <RussianRuble className="h-4 w-4 ml-1" />
          </div>
          <Button 
            onClick={onBook}
            className="bg-rose-gold text-white px-4 py-2 rounded-lg text-sm hover:bg-rose-gold/90 transition-all"
          >
            Записаться
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
