import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, BookOpen, Music, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const ministries = [
  {
    id: "youth",
    title: "Youth & Young Adults",
    icon: <Users className="h-6 w-6" />,
    description: "Empowering the next generation to lead with boldness, integrity, and passion for Christ.",
    schedule: "Fridays at 6:30 PM",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "worship",
    title: "Worship & Praise Team",
    icon: <Music className="h-6 w-6" />,
    description: "Cultivating an atmosphere of reverent and joyful worship that ushers people into God's presence.",
    schedule: "Thursdays at 7:00 PM",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "bible-study",
    title: "Biblical Life Studies",
    icon: <BookOpen className="h-6 w-6" />,
    description: "Rooting our faith in Scripture through thoughtful study, question-and-answer, and fellowship.",
    schedule: "Wednesdays at 7:00 PM",
    image: "https://images.unsplash.com/photo-1504052434139-015802ef6070?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "outreach",
    title: "Edwaleni Community Outreach",
    icon: <Heart className="h-6 w-6" />,
    description: "Extending Christ's hands to our neighbors through food drives, mentorship, and community care.",
    schedule: "1st Saturday Monthly",
    image: "https://images.unsplash.com/photo-1469571485303-3467e2a9e52c?q=80&w=1200&auto=format&fit=crop"
  }
];

export function Ministries() {
  const [joined, setJoined] = useState<Record<string, boolean>>({});

  const handleJoin = (id: string, title: string) => {
    setJoined(prev => ({ ...prev, [id]: true }));
    toast.success(`Thank you for your interest in ${title}! Ministry leaders will connect with you.`);
  };

  return (
    <section id="ministries" className="py-24 bg-church-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-church-gold-dark uppercase tracking-[0.25em] text-xs font-bold block mb-3">
            Life Together
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl text-church-stone-dark mb-4">
            Our Ministries & Fellowships
          </h2>
          <div className="w-16 h-1 bg-church-gold mx-auto mb-5 rounded-full" />
          <p className="text-church-stone-dark/70 max-w-2xl mx-auto text-base sm:text-lg">
            There is a meaningful place for you, your gifts, and your family at God The Rock Assembly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {ministries.map((ministry, idx) => (
            <motion.div
              key={ministry.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group overflow-hidden border border-church-stone/60 shadow-xs hover:shadow-xl transition-all duration-300 rounded-3xl bg-white h-full flex flex-col justify-between">
                <div>
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={ministry.image}
                      alt={ministry.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl text-church-gold-dark shadow-sm">
                      {ministry.icon}
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 text-xs font-medium text-white/90 bg-black/40 backdrop-blur-xs py-1 px-3 rounded-lg w-fit">
                      {ministry.schedule}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif text-2xl text-church-stone-dark mb-3 group-hover:text-church-gold-dark transition-colors">
                      {ministry.title}
                    </h3>
                    <p className="text-church-stone-dark/75 text-sm leading-relaxed mb-6">
                      {ministry.description}
                    </p>
                  </CardContent>
                </div>
                
                <div className="px-6 pb-6 pt-0">
                  <Button
                    onClick={() => handleJoin(ministry.id, ministry.title)}
                    variant={joined[ministry.id] ? "secondary" : "outline"}
                    className={`w-full rounded-xl transition-all ${
                      joined[ministry.id] 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "hover:bg-church-gold hover:text-white hover:border-church-gold"
                    }`}
                  >
                    {joined[ministry.id] ? "Interest Registered ✓" : (
                      <span className="flex items-center justify-center gap-2">
                        Get Involved <ArrowRight className="w-4 h-4" />
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
