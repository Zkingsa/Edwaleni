import { Church, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Heart, ArrowUp } from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-church-rock text-white pt-20 pb-12 border-t border-church-rock-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-church-gold/20 flex items-center justify-center text-church-gold border border-church-gold/40 shadow-xs">
                <Church className="h-6 w-6" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-serif text-2xl font-bold tracking-tight text-white">God The Rock</span>
                <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-amber-400 font-semibold">Edwaleni Assembly</span>
              </div>
            </div>
            
            <p className="text-white/75 font-light leading-relaxed text-sm">
              Rooted in the eternal truth of God's Word and serving the community of Edwaleni. A church where everyone is welcomed, loved, and transformed by Christ.
            </p>

            <div className="flex gap-3">
              <a 
                href="#" 
                aria-label="Facebook"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-church-gold flex items-center justify-center transition-all text-white hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                aria-label="Instagram"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-church-gold flex items-center justify-center transition-all text-white hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                aria-label="YouTube"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-church-gold flex items-center justify-center transition-all text-white hover:text-white"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Service Times */}
          <div>
            <h4 className="font-serif text-xl font-bold mb-6 text-amber-300 border-b border-white/10 pb-2">
              Worship Times
            </h4>
            <ul className="space-y-4 text-white/80 text-sm font-light">
              <li className="space-y-1">
                <div className="font-semibold text-white">Sunday Worship Services</div>
                <div className="text-white/70">10:00 AM — Main Morning Celebration</div>
                <div className="text-white/70">06:00 PM — Evening Revival & Prayer</div>
              </li>
              <li className="space-y-1 pt-2">
                <div className="font-semibold text-white">Wednesday Night Service</div>
                <div className="text-white/70">07:00 PM — Word Exposition & Intercession</div>
              </li>
              <li className="space-y-1 pt-2">
                <div className="font-semibold text-white">Youth Fellowship</div>
                <div className="text-white/70">Fridays at 06:30 PM</div>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-serif text-xl font-bold mb-6 text-amber-300 border-b border-white/10 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-3 text-white/80 text-sm font-light">
              <li><a href="#ministries" className="hover:text-amber-300 transition-colors">Ministries & Groups</a></li>
              <li><a href="#about-pastor" className="hover:text-amber-300 transition-colors">Our Pastor & Leadership</a></li>
              <li><a href="#events" className="hover:text-amber-300 transition-colors">Upcoming Gatherings</a></li>
              <li><a href="#appointment" className="hover:text-amber-300 transition-colors">Book Pastoral Session</a></li>
              <li><a href="#give" className="hover:text-amber-300 transition-colors">Online Tithes & Giving</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-xl font-bold mb-6 text-amber-300 border-b border-white/10 pb-2">
              Reach Our Church
            </h4>
            <ul className="space-y-4 text-white/80 text-sm font-light">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-amber-400 shrink-0" />
                <span>Edwaleni Sanctuary Grounds, Edwaleni</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-400 shrink-0" />
                <span>+268 7600 0000 / (082) 000-0000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-400 shrink-0" />
                <span>pastor@godtherock.org</span>
              </li>
              <li className="pt-2">
                <a 
                  href="#give" 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-church-gold hover:bg-church-gold-hover text-white text-xs font-semibold tracking-wide shadow-sm transition-all"
                >
                  <Heart className="w-3.5 h-3.5" /> Support the Ministry
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/50 text-xs font-light">
          <p>© {new Date().getFullYear()} God The Rock Assembly (Edwaleni). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="italic">Built upon the Rock, Christ Jesus</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
