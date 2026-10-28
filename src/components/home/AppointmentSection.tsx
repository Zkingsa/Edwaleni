import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/src/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { db } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Video, Home, Phone, Calendar as CalendarIcon, CheckCircle2, UserCheck, ShieldCheck } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Please enter your name."),
  contactInfo: z.string().min(5, "Please enter an email or phone number."),
  date: z.date({ 
    message: "A date of appointment is required."
  }),
  timeSlot: z.string().min(1, "Please pick a preferred time."),
  type: z.string().min(1, "Please select an appointment type."),
  notes: z.string().max(500).optional(),
});

export function AppointmentSection({ onOpenLogin }: { onOpenLogin?: () => void }) {
  const { user, signInWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<Date | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      contactInfo: user?.email || "",
      timeSlot: "10:00 AM",
      type: "in-person",
      notes: "",
    },
  });

  // Sync form when user logs in
  if (user && !form.getValues("fullName") && user.displayName) {
    form.setValue("fullName", user.displayName);
  }
  if (user && !form.getValues("contactInfo") && user.email) {
    form.setValue("contactInfo", user.email);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "appointments"), {
        userId: user?.uid || "guest",
        userName: values.fullName,
        contactInfo: values.contactInfo,
        userEmail: user?.email || (values.contactInfo.includes("@") ? values.contactInfo : ""),
        dateTime: values.date.toISOString(),
        timeSlot: values.timeSlot,
        type: values.type,
        notes: values.notes || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSubmittedDate(values.date);
      toast.success("Pastoral session request received! Pastor's office will reach out to confirm.");
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit request. Please try again or call the office.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="appointment" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left Column: Context & Guidelines */}
          <div className="lg:w-5/12">
            <span className="text-church-gold-dark uppercase tracking-[0.25em] text-xs font-bold block mb-3">
              Pastoral Care & Counseling
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-church-stone-dark mb-6 leading-tight">
              Schedule a Session with Our Pastor
            </h2>
            <p className="text-church-stone-dark/80 text-base sm:text-lg mb-8 leading-relaxed">
              We believe in the healing ministry of pastoral counsel, confidential prayer, and spiritual guidance. Whether you are seeking marriage counsel, family prayer, or spiritual direction, our doors are open.
            </p>

            {/* Session options */}
            <div className="space-y-4 mb-10">
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-church-cream/70 border border-church-stone/60">
                <div className="bg-white p-3 rounded-xl text-church-gold-dark shadow-xs shrink-0 border border-church-stone/40">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-church-stone-dark">In-Person at Edwaleni Sanctuary</h4>
                  <p className="text-church-stone-dark/70 text-sm">Private conversation in the pastoral study at the church office.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-church-cream/70 border border-church-stone/60">
                <div className="bg-white p-3 rounded-xl text-church-gold-dark shadow-xs shrink-0 border border-church-stone/40">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-church-stone-dark">Online Video Consultation</h4>
                  <p className="text-church-stone-dark/70 text-sm">Join a private Google Meet link from wherever you are.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-church-cream/70 border border-church-stone/60">
                <div className="bg-white p-3 rounded-xl text-church-gold-dark shadow-xs shrink-0 border border-church-stone/40">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-church-stone-dark">Telephone Prayer Line</h4>
                  <p className="text-church-stone-dark/70 text-sm">A direct prayer call for urgent needs or encouragement.</p>
                </div>
              </div>
            </div>

            {/* Quick sign-in banner */}
            {!user ? (
              <div className="p-6 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-amber-950">Member Fast-Track</p>
                  <p className="text-xs text-amber-900/80">Sign in with Google to prefill your member details.</p>
                </div>
                <Button 
                  type="button"
                  onClick={() => (onOpenLogin ? onOpenLogin() : signInWithGoogle())} 
                  size="sm" 
                  className="bg-church-gold hover:bg-church-gold-hover text-white shadow-xs shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  Sign In
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900 font-medium">
                  Signed in as <strong>{user.displayName || user.email}</strong>. Your appointments are synced to your account.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Appointment Booking Form */}
          <div className="lg:w-7/12 w-full">
            <Card className="border border-church-stone shadow-xl rounded-3xl bg-church-cream/40 p-6 sm:p-10">
              <div className="mb-8 border-b border-church-stone/60 pb-5">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-church-stone-dark mb-1">
                  Book a Pastoral Appointment
                </h3>
                <p className="text-church-stone-dark/70 text-sm">
                  Please select your preferred date, session type, and contact details below.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name and Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-church-stone-dark font-medium text-sm">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              className="bg-white border-church-stone focus-visible:ring-church-gold h-12 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-church-stone-dark font-medium text-sm">Phone or Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Phone number or email"
                              className="bg-white border-church-stone focus-visible:ring-church-gold h-12 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Calendar Date Picker */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-church-stone-dark font-medium text-sm flex items-center justify-between mb-1">
                          <span>Select Consultation Date</span>
                          {field.value && (
                            <span className="text-church-gold-dark font-semibold text-xs">
                              Selected: {field.value.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </FormLabel>
                        <div className="p-3 bg-white rounded-2xl border border-church-stone shadow-xs flex justify-center">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                            className="w-full max-w-xs"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Session Type and Preferred Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-church-stone-dark font-medium text-sm">Session Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white rounded-xl border-church-stone h-12">
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-church-stone">
                              <SelectItem value="in-person">In-Person (Sanctuary)</SelectItem>
                              <SelectItem value="online">Online Video (Google Meet)</SelectItem>
                              <SelectItem value="phone">Telephone Call</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-church-stone-dark font-medium text-sm">Preferred Time</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white rounded-xl border-church-stone h-12">
                                <SelectValue placeholder="Pick a time slot" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-church-stone">
                              <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                              <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                              <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                              <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                              <SelectItem value="06:00 PM">06:00 PM (Evening)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes / Prayer Subject */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-church-stone-dark font-medium text-sm">
                          Notes or Prayer Request <span className="text-church-stone-dark/50 text-xs font-normal">(Confidential)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share briefly what you'd like to discuss or pray about..."
                            className="bg-white rounded-xl border-church-stone min-h-[100px] text-sm focus-visible:ring-church-gold"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full bg-church-gold hover:bg-church-gold-hover text-white rounded-xl text-base font-semibold shadow-md py-6"
                  >
                    {isSubmitting ? (
                      "Submitting Request..."
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Confirm Session Request
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-xs text-church-stone-dark/60">
                    All communications and pastoral meetings are held in strict biblical confidence.
                  </p>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
