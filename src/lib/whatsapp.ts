import { format } from "date-fns";

type WhatsAppBookingPayload = {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  appointmentAt: string;
  notes?: string;
};

const normalizePhone = (value: string | undefined): string => {
  if (!value) return "";
  return value.replace(/[^\d]/g, "");
};

const buildBookingMessage = (payload: WhatsAppBookingPayload): string => {
  const date = format(new Date(payload.appointmentAt), "dd/MM/yyyy");
  const time = format(new Date(payload.appointmentAt), "HH:mm");
  const notesBlock = payload.notes?.trim() ? `\nNotas: ${payload.notes.trim()}` : "";

  return [
    "Hola! Acabo de reservar un turno.",
    `Nombre: ${payload.clientName}`,
    `Teléfono: ${payload.clientPhone}`,
    `Servicio: ${payload.serviceName}`,
    `Fecha: ${date}`,
    `Hora: ${time}${notesBlock}`,
  ].join("\n");
};

export const getBookingWhatsAppUrl = (payload: WhatsAppBookingPayload): string | null => {
  const phone = normalizePhone(import.meta.env.VITE_WHATSAPP_BOOKING_PHONE);
  if (!phone) return null;

  const message = buildBookingMessage(payload);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
