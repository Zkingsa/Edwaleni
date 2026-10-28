import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/src/hooks/useAuth";
import { Coins, Gift, HandHeart, Heart, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const donationTypes = [
  { id: "tithe", label: "Tithe", icon: <Coins className="h-5 w-5" />, description: "Faithful return of 10% of our earnings." },
  { id: "offering", label: "Offering", icon: <Gift className="h-5 w-5" />, description: "Voluntary sacrificial gift of gratitude." },
  { id: "project", label: "Building & Rock Fund", icon: <HandHeart className="h-5 w-5" />, description: "Edwaleni sanctuary expansion & maintenance." },
  { id: "community", label: "Benevolence & Care", icon: <Heart className="h-5 w-5" />, description: "Helping widows, orphans, and local families in need." },
];

export function DonationPortal() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<"USD" | "ZAR">("USD");
  const [amount, setAmount] = useState("100");
  const [selectedType, setSelectedType] = useState("tithe");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successAmount, setSuccessAmount] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("donation_success") === "true" || params.get("success") === "true") {
      setShowSuccessBanner(true);
      setSuccessAmount(params.get("amount"));
      toast.success("Thank you for your generous gift to God The Rock Assembly!");
      // Clean query parameter without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const quickAmounts = currency === "USD" 
    ? ["25", "50", "100", "250", "500", "1000"]
    : ["100", "250", "500", "1000", "2500", "5000"];

  const handleDonate = async () => {
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid gift amount.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/donations/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          currency: currency.toLowerCase(),
          type: selectedType,
          userId: user?.uid || "guest",
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to process donation right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currencySymbol = currency === "USD" ? "$" : "R";

  return (
    <section id="give" className="py-24 bg-church-cream-dark/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-church-gold-dark uppercase tracking-[0.25em] text-xs font-bold block mb-3">
            Worship Through Giving
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl text-church-stone-dark mb-4">
            Online Giving & Stewardship
          </h2>
          <div className="w-16 h-1 bg-church-gold mx-auto mb-5 rounded-full" />
          <p className="text-church-stone-dark/80 max-w-2xl mx-auto text-base sm:text-lg italic font-serif">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
          </p>
          <span className="text-xs text-church-gold-dark uppercase tracking-widest font-sans font-semibold mt-1 block">
            — 2 Corinthians 9:7
          </span>
        </div>

        {/* Success Banner if redirected from checkout */}
        {showSuccessBanner && (
          <div className="max-w-3xl mx-auto mb-12 p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl text-center shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-serif text-2xl font-bold text-emerald-950 mb-1">
              Thank You for Your Generous Giving!
            </h3>
            <p className="text-emerald-800 text-sm max-w-lg mx-auto">
              Your contribution {successAmount ? `of ${currencySymbol}${successAmount}` : ""} to God The Rock Assembly (Edwaleni) has been processed. May God richly bless and multiply your seed!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-6xl mx-auto">
          {/* Donation Category Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <p className="text-sm font-semibold uppercase tracking-wider text-church-stone-dark/70 px-1 mb-2">
              Select Giving Category
            </p>
            {donationTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                    isSelected
                      ? "bg-church-rock border-church-gold text-white shadow-md ring-2 ring-church-gold/40"
                      : "bg-white border-church-stone text-church-stone-dark hover:border-church-gold/50 hover:bg-amber-50/30"
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isSelected ? "bg-church-gold text-white" : "bg-church-cream text-church-gold-dark"
                  }`}>
                    {type.icon}
                  </div>
                  <div>
                    <h3 className={`font-serif text-xl font-bold mb-0.5 ${isSelected ? "text-amber-200" : "text-church-stone-dark"}`}>
                      {type.label}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isSelected ? "text-white/80" : "text-church-stone-dark/70"}`}>
                      {type.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Amount Card & Checkout (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border border-church-stone shadow-xl rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-8 sm:p-10">
                <div className="space-y-8">
                  {/* Currency Toggle */}
                  <div className="flex items-center justify-between pb-4 border-b border-church-stone">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-church-stone-dark/70">
                        Selected Fund
                      </span>
                      <p className="font-serif text-xl font-bold text-church-gold-dark">
                        {donationTypes.find(t => t.id === selectedType)?.label}
                      </p>
                    </div>
                    <div className="inline-flex p-1 bg-church-cream rounded-xl border border-church-stone text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          currency === "USD" ? "bg-church-gold text-white shadow-xs" : "text-church-stone-dark hover:text-church-gold-dark"
                        }`}
                      >
                        USD ($)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("ZAR")}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          currency === "ZAR" ? "bg-church-gold text-white shadow-xs" : "text-church-stone-dark hover:text-church-gold-dark"
                        }`}
                      >
                        ZAR (R)
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-3">
                    <Label htmlFor="donation-amount" className="text-church-stone-dark font-medium text-base">
                      Enter Custom Gift Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-serif text-church-gold-dark font-bold">
                        {currencySymbol}
                      </span>
                      <Input
                        id="donation-amount"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-church-cream/40 border-church-stone h-20 pl-16 text-3xl sm:text-4xl font-serif font-bold rounded-2xl text-church-stone-dark focus-visible:ring-church-gold"
                      />
                    </div>
                  </div>

                  {/* Preset Amount Chips */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-church-stone-dark/70 block mb-2.5">
                      Or Choose a Preset Amount
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {quickAmounts.map((val) => {
                        const isValSelected = amount === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAmount(val)}
                            className={`py-2.5 px-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                              isValSelected
                                ? "bg-church-gold text-white border-church-gold shadow-sm font-bold scale-[1.03]"
                                : "bg-church-cream/60 border-church-stone text-church-stone-dark hover:bg-amber-50 hover:border-church-gold/60"
                            }`}
                          >
                            {currencySymbol}{val}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Give CTA Button */}
                  <Button
                    onClick={handleDonate}
                    disabled={isLoading}
                    size="xl"
                    className="w-full bg-church-gold hover:bg-church-gold-hover text-white shadow-lg shadow-amber-950/20 text-lg sm:text-xl font-serif font-bold tracking-wide py-7 rounded-2xl"
                  >
                    {isLoading ? (
                      "Connecting to Secure Giving..."
                    ) : (
                      <span>
                        Give {currencySymbol}{amount || "0"} to {donationTypes.find(t => t.id === selectedType)?.label}
                      </span>
                    )}
                  </Button>

                  {/* Security footer */}
                  <div className="flex items-center justify-center gap-2 text-church-stone-dark/60 text-xs pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>256-Bit Encrypted Giving • God The Rock Assembly (Edwaleni)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
