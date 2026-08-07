// Professional Marketplace Types

export interface ProfessionalProfile {
  id: string;
  userId?: string;
  deviceId?: string;
  name: string;
  phone: string;
  email: string;
  bio: string;
  experience: string; // e.g. "5 years"
  workingAreas: string[]; // e.g. ["Mumbai", "Thane", "Navi Mumbai"]
  currentLocation: {
    city: string;
    lat?: number;
    lng?: number;
  };
  availability: boolean;
  services: string[]; // Service IDs from HOUSEHOLD_SERVICES
  photoUrl: string | null;
  rating: number;
  completedJobs: number;
  registeredAt: string;
}

export type BookingRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface BookingRequest {
  id: string;
  serviceId: string;
  serviceTitle: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  address: string;
  city: string;
  scheduledDate: string;
  scheduledTime?: string;
  notes: string;
  status: BookingRequestStatus;
  professionalId: string | null;
  professionalName?: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface ProRating {
  id: string;
  proId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  bookingId?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export type ChatMessageType = 'text' | 'system';
export type SenderType = 'user' | 'professional';

export interface ChatMessage {
  id: string;
  bookingId: string; // can be booking request ID or direct conversation ID `chat_user_pro`
  senderId: string;
  senderType: SenderType;
  senderName: string;
  message: string;
  timestamp: string;
  type: ChatMessageType;
  read: boolean;
}

export type AppRole = 'user' | 'professional' | null;
