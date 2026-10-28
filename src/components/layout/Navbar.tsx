import { Button } from "@/components/ui/button";
import { useAuth } from "@/src/hooks/useAuth";
import { Church, Menu, X, LogIn, LogOut, Shield, UserPlus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenStaffPortal: () => void;
}

export function Navbar({ onOpenLogin, onOpenRegister, onOpenStaffPortal }: NavbarProps) {
  const { user, isStaff, isSystemAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Ministries", href: "#ministries" },
    { name: "About Pastor", href: "#about-pastor" },
    { name: "Events", href: "#events" },
    { name: "Session", href: "#appointment" },
    { name: "Give", href: "#give" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-church-cream/95 backdrop-blur-md border-b border-church-stone/70 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-church-gold/15 flex items-center justify-center text-church-gold border border-church-gold/30 group-hover:bg-church-gold group-hover:text-white transition-all shadow-xs">
              <Church className="h-6 w-6" />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-church-stone-dark group-hover:text-church-gold-dark transition-colors">
                God The Rock
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-church-gold-dark font-semibold">
                Edwaleni Assembly
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-church-stone-dark/80 hover:text-church-gold-dark font-medium text-sm transition-colors relative py-1"
                id={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.name}
              </a>
            ))}

            <div className="pl-4 border-l border-church-stone flex items-center gap-2.5">
              {user ? (
                <div className="flex items-center gap-3">
                  {isStaff && (
                    <Button
                      size="sm"
                      onClick={onOpenStaffPortal}
                      className="bg-church-rock hover:bg-stone-800 text-amber-300 border border-amber-400/40 text-xs gap-1.5 shadow-xs"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Staff Portal
                    </Button>
                  )}

                  <div className="flex items-center gap-2 pr-1">
                    <div className="h-9 w-9 rounded-full border-2 border-church-gold/50 overflow-hidden ring-2 ring-church-gold/20 shadow-xs">
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'Member'}`} 
                        alt={user.displayName || "User"} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">{user.name}</div>
                      <div className="text-[10px] font-mono text-amber-800 leading-tight truncate max-w-[120px]">
                        {isSystemAdmin ? "System Admin" : isStaff ? "Staff Member" : "Church Member"}
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => signOut()} 
                    className="border-church-stone text-church-stone-dark hover:border-red-300 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={onOpenLogin}
                    size="sm" 
                    variant="outline"
                    className="border-church-gold/40 text-church-gold-dark hover:bg-church-gold/10 font-semibold text-xs gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </Button>
                  <Button 
                    onClick={onOpenRegister}
                    size="sm" 
                    className="bg-church-gold hover:bg-church-gold-hover text-white shadow-xs font-semibold text-xs gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && isStaff && (
              <Button
                size="sm"
                onClick={onOpenStaffPortal}
                className="bg-church-rock text-amber-300 text-xs py-1 px-2.5 h-8 gap-1"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                Staff
              </Button>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2.5 rounded-xl border border-church-stone text-church-stone-dark hover:text-church-gold-dark hover:bg-white transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-church-cream border-t border-church-stone/60 overflow-hidden shadow-lg"
          >
            <div className="px-5 py-6 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-lg font-serif text-church-stone-dark px-2 py-3 border-b border-church-stone/40 hover:text-church-gold-dark transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-2.5">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-2 py-1">
                      <div className="h-10 w-10 rounded-full border-2 border-church-gold overflow-hidden shrink-0">
                        <img 
                          src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'Member'}`} 
                          alt={user.displayName || "User"} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-church-stone-dark">{user.displayName || "Member"}</p>
                        <p className="text-xs text-amber-900 font-mono">{user.loginIdentifier}</p>
                      </div>
                    </div>

                    {isStaff && (
                      <Button
                        onClick={() => { onOpenStaffPortal(); setIsOpen(false); }}
                        className="w-full bg-church-rock text-amber-300 border border-amber-400/40 text-sm gap-2"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        Open Staff & Management Portal
                      </Button>
                    )}

                    <Button 
                      onClick={() => { signOut(); setIsOpen(false); }} 
                      variant="outline" 
                      className="w-full border-church-stone text-church-stone-dark hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      onClick={() => { onOpenLogin(); setIsOpen(false); }} 
                      variant="outline"
                      className="w-full border-church-gold text-church-gold-dark font-semibold py-5 text-sm"
                    >
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => { onOpenRegister(); setIsOpen(false); }} 
                      className="w-full bg-church-gold hover:bg-church-gold-hover text-white shadow-md py-5 text-sm"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
