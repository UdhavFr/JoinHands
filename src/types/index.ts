// src/types/index.ts

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_type: 'volunteer' | 'ngo';
  created_at: string;
  status?: string;
  username?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string; // Assuming events have a location field
  ngo_id: string;
  image_url?: string | null;
  slots_available: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventCardProps {
  event: Event;
  onRegister: (eventId: string) => Promise<void>;
  isRegistering: boolean;
  registrationStatus?: 'pending' | 'confirmed' | 'rejected'; // Updated to match EventRegistration
  isDisabled: boolean;
}

export interface NGOProfile {
  id: string;
  name: string;
  description: string;
  logo_url?: string | null; // Updated to match Supabase nullable field
  website?: string | null; // Updated to match Supabase nullable field
  cause_areas: string[];
  user_id: string;
  created_at: string | null; // Updated to match Supabase nullable field
  updated_at: string | null; // Updated to match Supabase nullable field
  image_url?: string | null; // Updated to match Supabase nullable field
  status?: string;
  created_by?: string;
  location?: string | null; // Made optional to match DB
}