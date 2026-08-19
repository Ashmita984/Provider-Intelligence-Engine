export interface Provider {
  id: string; // NPI (e.g. "1023094653")
  npi: string;
  name: string;
  title: string;
  specialty: string;
  subSpecialty?: string;
  clinicName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  distanceMiles: number;
  networkTier: 'Tier 1 Preferred' | 'Tier 2 In-Network' | 'Out-of-Network';
  acceptingNewPatients: boolean;
  telehealthAvailable: boolean;
  nextAvailableSlot: string;
  languages: string[];
  lat: number;
  lng: number;
  certifications: string[];
  hospitalAffiliation: string;
}

export type DeliveryChannel = 'sms' | 'call' | 'both';

export type RecipientType = 'patient' | 'insurer';

export type DeliveryStatusType = 
  | 'queued' 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'failed' 
  | 'undelivered' 
  | 'ringing' 
  | 'in-progress' 
  | 'completed';

export interface NotificationRecord {
  id: string;
  sid: string; // Twilio Message SID (SM...) or Call SID (CA...)
  channel: 'sms' | 'call';
  recipientType?: RecipientType;
  recipientPhone: string;
  recipientName: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  providerAddress: string;
  providerPhone: string;
  messageBody: string;
  voiceScript?: string;
  status: DeliveryStatusType;
  timestamp: string;
  deliveryTimeMs?: number;
  errorCode?: string;
  errorMessage?: string;
  carrier?: string;
  price?: string;
  isSimulated: boolean;
}

export interface TwilioConfigStatus {
  hasAccountSid: boolean;
  hasAuthToken: boolean;
  hasPhoneNumber: boolean;
  hasWhatsappNumber?: boolean;
  phoneNumber?: string;
  whatsappNumber?: string;
  testToNumber?: string;
  accountSidMasked?: string;
  isLive: boolean;
  sandboxMode: boolean;
}
