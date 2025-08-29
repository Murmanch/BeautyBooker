import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useState } from "react";
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
import AOS from 'aos';
import 'aos/dist/aos.css';
import React from "react";

export default function Landing() {
  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    retry: false,
    queryFn: async () => {
      try {
        const apiRes = await fetch("/api/services", { credentials: "include" });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            return apiData;
          }
          // Пустая БД — используем локальный файл как запасной источник
          const localRes = await fetch("/services.json");
          return await localRes.json();
        }
        throw new Error(String(apiRes.status));
      } catch {
        const res = await fetch("/services.json");
        return res.json();
      }
    },
  });

  const portfolioSlides = [
    { src: "/assets/work3.jpg" },
    { src: "/assets/work9.jpg" },
    { src: "/assets/work2.jpg" },
    { src: "/assets/work1.jpg" },
    { src: "/assets/work4.jpg" },
    { src: "/assets/work8.jpg" },
    { src: "/assets/work6.jpg" },
    { src: "/assets/work7.jpg" },
    { src: "/assets/work10.jpg" },
  ];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  // Инициализация AOS
  React.useEffect(() => {
    AOS.init({ once: true, duration: 800 });
  }, []);

  return (
    <div className="font-body bg-warm-gray text-deep-charcoal">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-16 bg-gradient-to-br from-blush-pink to-white" data-aos="fade-up">
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
      <section id="services" className="py-20 bg-white" data-aos="fade-up">
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
            {(services || []).map((service) => (
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
        data-aos="fade-up"
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

          <BookingCalendar services={services || []} />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="/assets/photo_from_work.png"
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
                <a
                  href="tel:+79212825626"
                  className="bg-rose-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-gold/90 transition-all flex items-center"
                  style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Позвонить
                </a>
                <a
                  href="https://wa.me/79212825626"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-rose-gold text-rose-gold px-6 py-3 rounded-lg font-semibold hover:bg-rose-gold hover:text-white transition-all flex items-center"
                  style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-white" data-aos="fade-up">
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
            {portfolioSlides.map((slide, i) => (
              <img
                key={i}
                src={slide.src}
                alt={`Работа ${i + 1}`}
                className="rounded-xl shadow-lg w-full h-auto object-cover cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={portfolioSlides}
        carousel={{ finite: true }}
      />

      {/* Certificates Section */}
      <section id="certificates" className="py-20 bg-gradient-to-br from-white to-blush-pink" data-aos="fade-up">
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
            <img src="/assets/cert7.jpg" alt="Сертификат 1"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert2.jpg" alt="Сертификат 2"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert4.jpg" alt="Сертификат 4"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert3.jpg" alt="Сертификат 3"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert5.jpg" alt="Сертификат 5"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert6.jpg" alt="Сертификат 6"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert99.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert8.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert9.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert10.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert11.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert12.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert13.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>
            <img src="/assets/cert1.jpg" alt="Сертификат 7"
                 className="rounded-xl shadow-lg w-full h-auto object-cover transition-transform duration-300 hover:scale-105 hover:shadow-2xl"/>                                                                                     
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
                Косметология Мурманск
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
              &copy; 2025 Косметология Мурманск. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
