export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "follow_up"
  | "site_visit_scheduled"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSource =
  | "Facebook Ads"
  | "Zameen.com"
  | "WhatsApp"
  | "Phone Call"
  | "Graana"
  | "Website Form"
  | "Walk-in"
  | "Referral";

export type LeadPriority = "high" | "medium" | "low";

export type PropertyType =
  | "Residential Plot"
  | "Commercial Plot"
  | "House / Villa"
  | "Apartment / Penthouse"
  | "Commercial Plaza"
  | "Farmhouse";

export type PropertyStatus = "available" | "under_negotiation" | "sold" | "reserved";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: "call" | "whatsapp" | "meeting" | "site_visit" | "note" | "status_change";
  title: string;
  description: string;
  createdAt: string;
  performedBy: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface AssociatedProperty {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPricePKR: number;
  propertyLocation: string;
  propertySociety: string;
  propertyType: PropertyType;
  propertyStatus: PropertyStatus;
  propertyImageUrl?: string;
  notes?: string;
  associatedAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city: "Islamabad" | "Rawalpindi" | "Lahore" | "Karachi" | "Peshawar" | "Multan" | "Overseas";
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedAgentId: string;
  budgetPKR: number; // in PKR rupees
  propertyTypeInterest: PropertyType;
  preferredLocations: string[]; // e.g. ["DHA Islamabad Phase 2", "Bahria Town Phase 8"]
  purpose: "Investment" | "Own Residence" | "Commercial Rental";
  notesCount?: number;
  lastContactedAt?: string;
  isArchived?: boolean;
  createdByName?: string;
  updatedByName?: string;
  associatedProperties?: AssociatedProperty[];
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  city: "Islamabad" | "Rawalpindi" | "Lahore" | "Karachi";
  location: string; // e.g. "Sector J, Phase 2, DHA"
  society: string; // e.g. "DHA Islamabad", "Bahria Town Rawalpindi"
  pricePKR: number; // in PKR rupees
  areaSize: string; // e.g. "10 Marla", "1 Kanal", "5 Marla", "1800 Sq Ft"
  bedrooms?: number;
  bathrooms?: number;
  status: PropertyStatus;
  featured: boolean;
  imageUrl: string;
  description: string;
  videoUrl?: string;
  nocStatus?: string;
  documentsVerified?: boolean;
  allotmentStatus?: string;
  possessionStatus?: string;
  galleryImages?: string[];
  assignedAgentId: string;
  addedAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  assignedAgentId: string;
  agentName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  type: "Phone Call" | "WhatsApp Message" | "In-Person Meeting" | "Documentation";
  notes: string;
  priority: LeadPriority;
  completed: boolean;
  completedAt?: string;
  completedByName?: string;
}

export interface SiteVisit {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  assignedAgentId: string;
  agentName: string;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:MM
  status: "scheduled" | "completed_interested" | "completed_not_interested" | "cancelled" | "rescheduled";
  notes?: string;
  clientFeedback?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Principal Broker" | "Senior Sales Manager" | "Property Consultant" | "Lead Specialist" | string;
  avatar: string;
  activeLeadsCount: number;
  closedDealsCount: number;
  totalSalesVolumePKR: number; // PKR
  monthlyTargetPKR: number; // PKR
  conversionRate: number; // %
  status: "active" | "on_site" | "busy" | "offline";
  systemRole?: "owner" | "manager" | "agent";
}

export interface AgencySettings {
  agencyName: string;
  tagline: string;
  ntnNumber: string;
  contactEmail: string;
  contactPhone: string;
  whatsappBusinessPhone: string;
  address: string;
  city: string;
  currencyFormat: "Crore_Lakh" | "Full_PKR" | "Millions";
  autoAssignmentRule: "round_robin" | "load_balanced" | "senior_priority";
  defaultFollowupReminderHours: number;
  enableWhatsAppNotifications: boolean;
  enableSmsAlerts: boolean;
  subscriptionStatus?: "trial" | "active" | "expired" | "past_due";
  subscriptionPlan?: "starter" | "growth" | "enterprise";
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
}
