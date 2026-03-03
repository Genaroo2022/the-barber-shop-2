export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface ServiceCatalogResponse {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string | null;
  active: boolean;
}

export interface GalleryImageResponse {
  id: string;
  title: string;
  category: string | null;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
}

export interface PublicOccupiedAppointmentResponse {
  appointmentAt: string;
}

export interface BarberResponse {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface CreateAppointmentRequest {
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId: string;
  appointmentAt: string;
  notes?: string;
}

export interface PublicAppointmentResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  appointmentAt: string;
  status: AppointmentStatus;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface AppointmentResponse {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  appointmentAt: string;
  status: AppointmentStatus;
  notes: string | null;
}

export interface StalePendingAppointmentResponse {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  appointmentAt: string;
  createdAt: string;
  minutesPending: number;
}

export interface ClientSummaryResponse {
  id: string;
  clientName: string;
  clientPhone: string;
  totalAppointments: number;
  lastVisit: string | null;
}

export interface AdminServiceUpsertRequest {
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
  active: boolean;
}

export interface AdminGalleryImageUpsertRequest {
  title: string;
  category?: string;
  imageUrl: string;
  sortOrder: number;
  active: boolean;
}

export interface AdminGalleryUploadResponse {
  imageUrl: string;
  timestamp: number;
}

export interface AdminBarberUpsertRequest {
  name: string;
  sortOrder: number;
  active: boolean;
}

export interface AdminGalleryUploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  publicId: string;
  signature: string;
}

export interface OverviewMetricsResponse {
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  uniqueClients: number;
  popularService: string;
}

export interface IncomeBreakdownItem {
  serviceName: string;
  count: number;
  total: number;
}

export interface ManualIncomeEntryResponse {
  id: string;
  amount: number;
  tipAmount: number;
  total: number;
  occurredOn: string;
  notes: string | null;
}

export interface IncomeMetricsResponse {
  registeredIncome: number;
  manualIncome: number;
  totalTips: number;
  totalIncome: number;
  monthlyIncome: number;
  breakdown: IncomeBreakdownItem[];
  manualEntries: ManualIncomeEntryResponse[];
}

export interface CreateManualIncomeRequest {
  amount: number;
  tipAmount: number;
  occurredOn: string;
  notes?: string;
}

export interface AdminClientUpsertRequest {
  name: string;
  phone: string;
}

export interface MergeClientsRequest {
  sourceClientId: string;
  targetClientId: string;
}

export interface AdminUserResponse {
  id: string;
  email: string | null;
  role: string;
  active: boolean;
  firebaseLinked: boolean;
  createdAt: string;
}

export interface AdminUserCreateRequest {
  email: string;
  password?: string;
  active: boolean;
}

export interface AdminUserUpdateRequest {
  email?: string;
  password?: string;
  active?: boolean;
}


