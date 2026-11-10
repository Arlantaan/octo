export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone: string;
  service: string;
  message: string;
}

export interface QuoteData {
  id: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  services: string[];
  complexity: number;
  timeline: number;
  totalPrice: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  basePrice: number;
}

export interface StatItem {
  number: number;
  label: string;
  icon: string;
}

