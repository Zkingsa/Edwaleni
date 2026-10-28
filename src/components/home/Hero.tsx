import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Calendar, MapPin, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1548625361-195fe61a55c3?q=80&w=2000&auto=format&fit=crop"
          alt="God The Rock Sanctuary"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Multilayer gradient overlays for maximum contrast and warmth */}
        <div className="absolute inset-0 bg-gradient-to-b from-church-rock/80 via-church-rock/65 to-church-rock/90" />
        <div className="absolute inset-0 bg-radial from-transparent via-church-rock/30 to-church-rock/80" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-16">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-200 text-xs sm:text-sm uppercase tracking-[0.22em] font-sans font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>God The Rock Assembly • Edwaleni</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-6 leading-[1.08] tracking-tight drop-shadow-md">
            Built Upon The <span className="italic text-amber-300">Rock</span>, <br />
            Rooted in <span className="italic text-amber-100">His Grace</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Experience heartfelt worship, authentic fellowship, and the transforming power of Jesus Christ in our community.
          </p>

          {/* Call to actions with high contrast and tactile feel */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a href="#events" className="w-full sm:w-auto">
              <Button size="xl" className="w-full sm:w-auto bg-church-gold hover:bg-church-gold-hover text-white shadow-xl shadow-amber-950/40">
                Join Our Service
              </Button>
            </a>
            <a href="#about-pastor" className="w-full sm:w-auto">
              <Button size="xl" variant="white-outline" className="w-full sm:w-auto">
                Meet Our Pastor
              </Button>
            </a>
          </div>

          {/* Service Time Quick Badges */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 text-white/90 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Sunday Worship:</strong> 10:00 AM & 6:00 PM</span>
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Edwaleni Sanctuary</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Gradient transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-church-cream to-transparent z-0 pointer-events-none" />
    </section>
  );
}
