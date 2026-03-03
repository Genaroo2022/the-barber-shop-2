import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, isBefore, isSameDay, startOfToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  BarberResponse,
  ServiceCatalogResponse,
  CreateAppointmentRequest,
  PublicAppointmentResponse,
  PublicOccupiedAppointmentResponse,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getBookingWhatsAppUrl } from "@/lib/whatsapp";

type Step = "service" | "date" | "time" | "info" | "confirm" | "success";

export default function BookingSection() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<ServiceCatalogResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<PublicAppointmentResponse | null>(null);
  const [whatsAppRedirectUrl, setWhatsAppRedirectUrl] = useState<string | null>(null);

  const { data: services } = useQuery({
    queryKey: ["public-services"],
    queryFn: () => api.get<ServiceCatalogResponse[]>("/api/public/services"),
  });
  const { data: barbers, isLoading: barbersLoading } = useQuery({
    queryKey: ["public-barbers"],
    queryFn: () => api.get<BarberResponse[]>("/api/public/barbers"),
  });

  useEffect(() => {
    if (!barbers || barbers.length === 0) {
      setSelectedBarberId("");
      return;
    }

    const selectedExists = barbers.some((barber) => barber.id === selectedBarberId);
    if (!selectedExists) {
      setSelectedBarberId(barbers[0].id);
    }
  }, [barbers, selectedBarberId]);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: occupied } = useQuery({
    queryKey: ["occupied", selectedService?.id, dateStr, selectedBarberId],
    queryFn: () =>
      api.get<PublicOccupiedAppointmentResponse[]>(
        `/api/public/appointments/occupied?serviceId=${selectedService!.id}&date=${dateStr}&barberId=${selectedBarberId}`
      ),
    enabled: !!selectedService && !!dateStr && !!selectedBarberId,
  });

  const occupiedTimes = new Set(
    occupied?.map((o) => format(parseISO(o.appointmentAt), "HH:mm")) || []
  );

  const timeSlots = generateTimeSlots(selectedDate);
  const availableSlots = timeSlots.filter((t) => !occupiedTimes.has(t));

  const mutation = useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      api.post<PublicAppointmentResponse>("/api/public/appointments", data),
    onSuccess: (data) => {
      const redirectUrl = getBookingWhatsAppUrl({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        serviceName: data.serviceName,
        appointmentAt: data.appointmentAt,
        notes: notes.trim() || undefined,
      });
      setWhatsAppRedirectUrl(redirectUrl);
      setResult(data);
      setStep("success");
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 409) {
        toast({
          title: "Horario ocupado",
          description:
            "Lo sentimos, este turno acaba de ser reservado por otra persona. Por favor, elige otro horario.",
          variant: "destructive",
        });
        setStep("time");
        return;
      }
      const msg = err instanceof ApiError ? err.message : "Error al crear el turno";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleConfirm = () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (clientName.trim().length < 2 || clientName.trim().length > 120) {
      toast({
        title: "Nombre inválido",
        description: "Ingresá un nombre entre 2 y 120 caracteres.",
        variant: "destructive",
      });
      setStep("info");
      return;
    }
    if (clientPhone.trim().length < 7 || clientPhone.trim().length > 40) {
      toast({
        title: "Teléfono inválido",
        description: "Ingresá un teléfono válido.",
        variant: "destructive",
      });
      setStep("info");
      return;
    }
    if (notes.length > 300) {
      toast({
        title: "Notas inválidas",
        description: "Las notas no pueden superar 300 caracteres.",
        variant: "destructive",
      });
      setStep("info");
      return;
    }
    const appointmentAt = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`;
    if (!selectedBarberId) {
      toast({
        title: "Barbero inv\u00e1lido",
        description: "Seleccion\u00e1 un barbero para continuar.",
        variant: "destructive",
      });
      setStep("time");
      return;
    }
    if (new Date(appointmentAt) <= new Date()) {
      toast({
        title: "Horario inv\u00e1lido",
        description: "No pod\u00e9s reservar un turno en un horario que ya pas\u00f3.",
        variant: "destructive",
      });
      setStep("time");
      return;
    }
    mutation.mutate({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId: selectedService.id,
      barberId: selectedBarberId,
      appointmentAt,
      notes: notes.trim() || undefined,
    });
  };

  useEffect(() => {
    if (step !== "success" || !whatsAppRedirectUrl) return;
    const timeoutId = window.setTimeout(() => {
      window.location.assign(whatsAppRedirectUrl);
    }, 900);
    return () => window.clearTimeout(timeoutId);
  }, [step, whatsAppRedirectUrl]);

  return (
    <section id="reservar" className="py-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-2">Agendá tu visita</p>
          <h2 className="text-5xl md:text-7xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Reservar Turno
          </h2>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(["service", "date", "time", "info", "confirm"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                (["service", "date", "time", "info", "confirm"] as Step[]).indexOf(step) >= i
                  ? "bg-primary w-10"
                  : "bg-border w-6"
              }`}
            />
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === "service" && (
              <StepWrapper key="service">
                <h3 className="text-2xl mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Elegí un servicio
                </h3>
                <div className="grid gap-3">
                  {services?.filter(s => s.active).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedService(s); setStep("date"); }}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all text-left"
                    >
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.durationMinutes} min</p>
                      </div>
                      <span className="text-primary font-bold">${s.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </StepWrapper>
            )}

            {step === "date" && (
              <StepWrapper key="date">
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setStep("service")} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Elegí una fecha
                  </h3>
                </div>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); if (d) setStep("time"); }}
                    disabled={(d) => isBefore(d, startOfToday()) || isBefore(addDays(new Date(), 30), d)}
                    className="rounded-lg border border-border"
                  />
                </div>
              </StepWrapper>
            )}

            {step === "time" && (
              <StepWrapper key="time">
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setStep("date")} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Elegí un horario
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">Barbero</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {barbers?.map((barber) => (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => setSelectedBarberId(barber.id)}
                        className={`p-3 text-sm border rounded-lg transition-all text-left ${
                          selectedBarberId === barber.id
                            ? "border-primary text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {barber.name}
                      </button>
                    ))}
                  </div>
                  {barbersLoading && (
                    <p className="text-xs text-muted-foreground mt-2">Cargando barberos...</p>
                  )}
                  {!barbersLoading && (!barbers || barbers.length === 0) && (
                    <p className="text-xs text-destructive mt-2">
                      No hay barberos activos para agendar. Contactá a la barbería.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setSelectedTime(t); setStep("info"); }}
                      className="p-3 text-sm border border-border rounded-lg hover:border-primary hover:text-primary transition-all"
                    >
                      {t}
                    </button>
                  ))}
                  {availableSlots.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  )}
                </div>
              </StepWrapper>
            )}

            {step === "info" && (
              <StepWrapper key="info">
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setStep("time")} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Tus datos
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Nombre</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Tu nombre completo"
                      minLength={2}
                      maxLength={120}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Teléfono</label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+54 11 1234-5678"
                      minLength={7}
                      maxLength={40}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Notas (opcional)</label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Algo que quieras aclarar"
                      maxLength={300}
                      className="bg-background"
                    />
                  </div>
                  <Button
                    onClick={() => setStep("confirm")}
                    disabled={clientName.trim().length < 2 || clientPhone.trim().length < 7}
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
                  >
                    Continuar <ChevronRight size={16} />
                  </Button>
                </div>
              </StepWrapper>
            )}

            {step === "confirm" && (
              <StepWrapper key="confirm">
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setStep("info")} className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="text-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Confirmar turno
                  </h3>
                </div>
                <div className="space-y-3 mb-6 text-sm">
                  <Row label="Servicio" value={selectedService?.name || ""} />
                  <Row label="Fecha" value={selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""} />
                  <Row label="Hora" value={selectedTime || ""} />
                  <Row label="Nombre" value={clientName} />
                  <Row label="Teléfono" value={clientPhone} />
                  {notes && <Row label="Notas" value={notes} />}
                  <Row label="Precio" value={`$${selectedService?.price.toLocaleString()}`} highlight />
                </div>
                <Button
                  onClick={handleConfirm}
                  disabled={mutation.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
                >
                  {mutation.isPending ? <Loader2 className="animate-spin" size={18} /> : "Confirmar reserva"}
                </Button>
              </StepWrapper>
            )}

            {step === "success" && (
              <StepWrapper key="success">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="text-primary" size={32} />
                  </div>
                  <h3 className="text-3xl mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    ¡Turno confirmado!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Tu turno para <strong className="text-foreground">{result?.serviceName}</strong> fue agendado.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {whatsAppRedirectUrl
                      ? "Te estamos redirigiendo a WhatsApp para continuar."
                      : "Redirección a WhatsApp pendiente de configuración."}
                  </p>
                </div>
              </StepWrapper>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b border-border">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "text-primary font-bold" : "text-foreground"}>{value}</span>
    </div>
  );
}

function generateTimeSlots(selectedDate?: Date): string[] {
  const slots: string[] = [];
  const now = new Date();
  for (let h = 9; h <= 20; h++) {
    const hour = String(h).padStart(2, "0");
    const candidates = [`${hour}:00`, ...(h < 20 ? [`${hour}:30`] : [])];
    for (const slot of candidates) {
      if (selectedDate && isSameDay(selectedDate, now)) {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        const slotDate = new Date(selectedDate);
        slotDate.setHours(slotHour, slotMinute, 0, 0);
        if (slotDate <= now) continue;
      }
      slots.push(slot);
    }
  }
  return slots;
}
