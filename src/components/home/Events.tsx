import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Calendar, CheckCircle2, BellRing } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const events = [
  {
    id: "sunday-worship",
    title: "Sunday Celebration & Worship",
    time: "Sundays at 10:00 AM & 6:00 PM",
    location: "Main Sanctuary • Edwaleni",
    description: "Joyous worship, anointed preaching, and dedicated children's church ministry.",
    image: "https://images.unsplash.com/photo-1438232992991-995b7058633e?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "midweek-prayer",
    title: "Mid-Week Prayer & Word",
    time: "Wednesdays at 7:00 PM",
    location: "Prayer Chapel & Online",
    description: "Deep dive into scripture and intercessory prayer for families, health, and community.",
    image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "community-day",
    title: "Edwaleni Community Day",
    time: "1st Saturday Monthly at 9:00 AM",
    location: "Community Center Grounds",
    description: "Hands-on blessing through grocery packs, prayer tents, and youth sports activities.",
    image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=1200&auto=format&fit=crop"
  }
];

export function Events() {
  const [registered, setRegistered] = useState<Record<string, boolean>>({});

  const handleRegister = (id: string, title: string) => {
    setRegistered(prev => ({ ...prev, [id]: true }));
    toast.success(`You're on the list for "${title}"! A reminder will be sent.`);
  };

  return (
    <section id="events" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <span className="text-church-gold-dark uppercase tracking-[0.25em] text-xs font-bold block mb-3">
              Gather Together
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-church-stone-dark mb-4">
              Upcoming Gatherings
            </h2>
            <p className="text-church-stone-dark/70 text-base sm:text-lg max-w-xl">
              Join us in person at our Edwaleni sanctuary or connect with our weekly prayer times.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => toast.info("Full seasonal calendar available in the church foyer or via bulletin email.")}
              className="border-church-stone text-church-stone-dark hover:border-church-gold hover:text-church-gold-dark"
            >
              <Calendar className="w-4 h-4 mr-2 text-church-gold-dark" />
              Church Calendar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group overflow-hidden border border-church-stone/60 shadow-xs hover:shadow-xl transition-all duration-300 rounded-[2.2rem] bg-church-cream/30 h-full flex flex-col justify-between">
                <div>
                  <div className="h-60 overflow-hidden relative">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-church-rock/70 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-church-stone-dark shadow-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-church-gold-dark" />
                      <span>Regular Event</span>
                    </div>
                  </div>

                  <CardContent className="p-7">
                    <h3 className="font-serif text-2xl text-church-stone-dark mb-4 group-hover:text-church-gold-dark transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-3 text-church-stone-dark/80 text-sm font-medium">
                        <Clock className="h-4 w-4 text-church-gold-dark shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-church-stone-dark/70 text-sm">
                        <MapPin className="h-4 w-4 text-church-gold-dark shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <p className="text-church-stone-dark/70 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </CardContent>
                </div>

                <div className="p-7 pt-0">
                  <Button
                    onClick={() => handleRegister(event.id, event.title)}
                    variant={registered[event.id] ? "secondary" : "default"}
                    className={`w-full rounded-xl transition-all font-medium ${
                      registered[event.id]
                        ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-300"
                        : "bg-church-rock hover:bg-church-gold text-white shadow-xs"
                    }`}
                  >
                    {registered[event.id] ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Reminder Saved
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <BellRing className="w-4 h-4" /> RSVP / Set Reminder
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
