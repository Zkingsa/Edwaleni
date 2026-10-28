import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Calendar, Heart, Shield, Sparkles } from "lucide-react";

export function AboutPastor() {
  return (
    <section id="about-pastor" className="py-24 bg-church-cream-dark/40 relative border-y border-church-stone/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Pastor Image Card */}
          <div className="lg:w-1/2 relative w-full max-w-lg lg:max-w-none mx-auto">
            {/* Decorative stone background accent */}
            <div className="absolute -inset-4 border-2 border-church-gold/30 rounded-[3rem] -z-10 translate-x-3 translate-y-3 hidden sm:block" />
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-church-stone bg-white">
              <img 
                src="https://images.unsplash.com/photo-1544717297-fa95ec9fb0af?q=80&w=2070&auto=format&fit=crop" 
                alt="Pastor of God The Rock Assembly" 
                className="w-full aspect-[4/5] object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-church-rock via-church-rock/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-church-gold/90 text-white text-xs font-semibold uppercase tracking-wider mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Lead Servant
                </div>
                <p className="font-serif text-3xl sm:text-4xl font-bold mb-1">Pastor S. Khaya</p>
                <p className="font-light text-white/80 uppercase tracking-widest text-xs">God The Rock Assembly • Edwaleni</p>
              </div>
            </div>
          </div>
          
          {/* Narrative Content */}
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 text-church-gold-dark uppercase tracking-[0.25em] text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Pastoral Heart</span>
            </div>
            
            <h2 className="font-serif text-4xl sm:text-5xl text-church-stone-dark mb-6 leading-tight">
              Shepherding with Truth, <br />
              <span className="italic text-church-gold-dark">Walking in Steadfast Love.</span>
            </h2>

            <div className="space-y-5 text-church-stone-dark/80 text-base sm:text-lg leading-relaxed">
              <p>
                At God The Rock Assembly (Edwaleni), our pastoral vision is firmly anchored in the unshakeable foundation of Jesus Christ. We are dedicated to nurturing each soul with biblical truth, compassionate prayer, and genuine community.
              </p>
              <p>
                Whether you are walking through life's deepest trials, seeking wisdom for a major crossroad, or simply hungry to deepen your relationship with God, our pastoral team is committed to walking beside you.
              </p>
            </div>

            {/* Testimonial Quote */}
            <div className="mt-8 p-6 bg-white rounded-2xl border-l-4 border-church-gold border-y border-r border-church-stone/60 shadow-xs">
              <p className="italic text-church-stone-dark/90 font-serif text-lg sm:text-xl">
                "The Lord is my rock, my fortress and my deliverer; my God is my rock, in whom I take refuge."
              </p>
              <span className="block mt-2 text-xs uppercase tracking-widest text-church-gold-dark font-sans font-bold">
                — Psalm 18:2
              </span>
            </div>

            <div className="mt-10 flex flex-wrap gap-4 items-center">
              <a href="#appointment">
                <Button size="lg" className="bg-church-gold hover:bg-church-gold-hover text-white shadow-md rounded-full px-8 gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule a Pastoral Session
                </Button>
              </a>
              <a href="#give">
                <Button size="lg" variant="outline" className="rounded-full px-8 gap-2">
                  <Heart className="w-4 h-4" />
                  Support Our Ministry
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
