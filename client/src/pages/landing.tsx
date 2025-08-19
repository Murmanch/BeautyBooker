import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Phone,
  MessageSquare,
  Calendar,
  Award,
  Heart,
  Instagram,
  Mail,
  MapPin,
} from "lucide-react";
import ServiceCard from "@/components/service-card";
import BookingCalendar from "@/components/booking-calendar";
import Navigation from "@/components/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";

export default function Landing() {
  const services = [
    {
      id: "1",
      name: "Чистка лица",
      description:
          "Глубокое очищение пор, удаление комедонов, увлажнение и питание кожи",
      duration: 90,
      price: 2500,
      image:
          "https://avatars.mds.yandex.net/get-ydo/1649611/2a0000017e587fa3205493a66e8257986d6a/diploma",
    },
    {
      id: "2",
      name: "Пилинги",
      description:
          "Химические и механические пилинги для обновления и омоложения кожи",
      duration: 60,
      price: 3500,
      image: "https://sklad-zdorovo.ru/images/goods/28042.jpg",
    },
    {
      id: "3",
      name: "Массаж лица",
      description:
          "Антивозрастной массаж для улучшения тонуса и эластичности кожи",
      duration: 45,
      price: 2000,
      image:
          "https://avatars.mds.yandex.net/get-ydo/11397567/2a0000018c58d8082ffddcffe50251a8d09e/diploma",
    },
    {
      id: "4",
      name: "Микротоковая терапия",
      description:
          "Cлабые импульсные токи для омоложения кожи, улучшения лимфодренажа и коррекции овала лица",
      duration: 45,
      price: 3500,
      image:
          "https://s4.stc.all.kpcdn.net/russia/wp-content/uploads/2023/09/kosmetologicheskie-kliniki-Rostova-na-Donu-yunona.jpg",
    },
    {
      id: "5",
      name: "Ботокс",
      description:
          "Инъекции ботулинотерапии для разглаживания мимических морщин",
      duration: 30,
      price: 8000,
      image:
          "https://slkclinic.com/wp-content/uploads/2022/10/botox-2048x1367.jpg",
    },
    {
      id: "6",
      name: "Биоревитализация>",
      description:
          "Введении гиалуроновой кислоты в кожу для глубокого увлажнения, омоложения и запуска регенеративных процессов",
      duration: 60,
      price: 3800,
      image:
          "https://renovacio-med.ru/upload/iblock/d9e/n0v9kqviz18wjvcyci4ilemldsu2vlsl/inj-1-1568x936.jpg",
    },
  ];

  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="font-body bg-warm-gray text-deep-charcoal">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-16 bg-gradient-to-br from-blush-pink to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-heading font-bold text-4xl lg:text-6xl text-deep-charcoal mb-6">
                Профессиональная
                <span className="text-rose-gold"> косметология</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Индивидуальный подход к каждому клиенту. Современные технологии
                и проверенные методики для вашей красоты и здоровья кожи.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={scrollToBooking}
                  className="bg-rose-gold text-white px-8 py-4 rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
                >
                  Записаться на процедуру
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToServices}
                  className="border-2 border-rose-gold text-rose-gold px-8 py-4 rounded-lg font-semibold hover:bg-rose-gold hover:text-white transition-all"
                >
                  Посмотреть услуги
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://sun9-62.userapi.com/s/v1/if1/0QrIHO9Xtyo06eTClDx3G2xZQdPTm68wN4-WJG6Q6_vpEElC2Ly2hp0BbEKzLLLS_bjwBeK-.jpg?quality=96&as=32x24,48x36,72x54,108x81,160x119,240x179,360x269,480x358,540x403,640x478,720x538,1080x807,1280x956,1440x1075,2560x1912&from=bu&cs=2560x0"
                alt="Современный салон красоты"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-rose-gold p-3 rounded-full">
                    <Star className="text-white h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-deep-charcoal">4.9/5</p>
                    <p className="text-sm text-gray-500">150+ отзывов</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-deep-charcoal mb-4">
              Наши услуги
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Широкий спектр косметологических процедур для ухода за кожей лица
              и тела
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service as any}
                onBook={scrollToBooking}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section
        id="booking"
        className="py-20 bg-gradient-to-br from-blush-pink to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-deep-charcoal mb-4">
              Онлайн запись
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Выберите удобное время и запишитесь на процедуру в несколько
              кликов
            </p>
          </div>

          <BookingCalendar services={services} />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/api/assets/photo_from_work.png"
                alt="Ирина - мастер косметолог"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
            <div>
              <h2 className="font-heading font-bold text-3xl lg:text-4xl text-deep-charcoal mb-6">
                О мастере
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Ирина - сертифицированный косметолог с более чем 20-летним
                опытом работы в сфере эстетической медицины. Индивидуальный
                подход к каждому клиенту и использование только качественных
                препаратов европейского производства.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-rose-gold p-2 rounded-full">
                    <Award className="text-white h-4 w-4" />
                  </div>
                  <span className="text-gray-700">
                    Медицинское образование
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-rose-gold p-2 rounded-full">
                    <Award className="text-white h-4 w-4" />
                  </div>
                  <span className="text-gray-700">
                    Сертификаты международных курсов
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-rose-gold p-2 rounded-full">
                    <Heart className="text-white h-4 w-4" />
                  </div>
                  <span className="text-gray-700">
                    Более 1000 довольных клиентов
                  </span>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button className="bg-rose-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-gold/90 transition-all">
                  <Phone className="h-4 w-4 mr-2" />
                  Позвонить
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-rose-gold text-rose-gold px-6 py-3 rounded-lg font-semibold hover:bg-rose-gold hover:text-white transition-all"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-deep-charcoal mb-4">
              Фото работ и клиентов
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Результаты процедур и довольные клиенты – лучшая реклама профессионализма
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Вставь сюда изображения до/после или фото клиентов */}
            <img src="/api/assets/work3.jpg" alt="Работа 1"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work9.jpg" alt="Работа 2"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work2.jpg" alt="Работа 3"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work1.jpg" alt="Работа 4"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work4.jpg" alt="Работа 5"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work8.jpg" alt="Работа 6"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work6.jpg" alt="Работа 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/work7.jpg" alt="Работа 8"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>

            {/* Добавь больше, если нужно */}
          </div>
        </div>
      </section>


      {/* Certificates Section */}
      <section id="certificates" className="py-20 bg-gradient-to-br from-white to-blush-pink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl text-deep-charcoal mb-4">
              Сертификаты мастера
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Повышение квалификации и международные курсы, подтвержденные дипломами и сертификатами
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Вставь сюда изображения сертификатов */}
            <img src="/api/assets/cert1.jpg" alt="Сертификат 1"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/cert2.jpg" alt="Сертификат 2"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/cert3.jpg" alt="Сертификат 3"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/cert4.jpg" alt="Сертификат 4"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/cert5.jpg" alt="Сертификат 5"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/cert6.jpg" alt="Сертификат 6"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            <img src="/api/assets/cert7.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover"/>
            {/* Добавь больше, если нужно */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-charcoal text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-heading font-bold text-2xl text-rose-gold mb-4">
                Ирина Красота
              </h3>
              <p className="text-gray-300 mb-6 max-w-md">
                Профессиональная косметология для вашей красоты и здоровья.
                Индивидуальный подход и современные технологии.
              </p>
              <div className="flex space-x-4">
                <div className="bg-rose-gold p-3 rounded-full hover:bg-rose-gold/80 transition-all cursor-pointer">
                  <Instagram className="text-white h-4 w-4" />
                </div>
                <div className="bg-rose-gold p-3 rounded-full hover:bg-rose-gold/80 transition-all cursor-pointer">
                  <MessageSquare className="text-white h-4 w-4" />
                </div>
                <div className="bg-rose-gold p-3 rounded-full hover:bg-rose-gold/80 transition-all cursor-pointer">
                  <Mail className="text-white h-4 w-4" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Контакты</h4>
              <div className="space-y-3">
                <p className="text-gray-300">
                  <Phone className="inline text-rose-gold mr-2 h-4 w-4" />
                  +7 (921) 282-56-26
                </p>
                <p className="text-gray-300">
                  <Mail className="inline text-rose-gold mr-2 h-4 w-4" />
                  yashnov.mail@gmail.com
                </p>
                <p className="text-gray-300">
                  <MapPin className="inline text-rose-gold mr-2 h-4 w-4" />
                  г. Мурманск, ул. Коминтерна, 5
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Режим работы</h4>
              <div className="space-y-2 text-gray-300">
                <p>Пн-Пт: 10:00 - 19:00</p>
                <p>Сб: 10:00 - 16:00</p>
                <p>Вс: выходной</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 Ирина Красота. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
