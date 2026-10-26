/**
 * PropStackly CRM Centralized API Client
 * Uses secure HttpOnly session cookies for all authentication.
 * Sensitive authentication tokens are NEVER stored in browser localStorage.
 */

// In browser, route requests through same-origin Next.js proxy /api/backend to forward HttpOnly cookies
const isBrowser = typeof window !== "undefined";
const API_BASE_URL = isBrowser
  ? "/api/backend"
  : (process.env.FASTAPI_INTERNAL_URL || "http://127.0.0.1:8000/api/v1");

const USER_KEY = "propstackly_current_user_profile";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role_title?: string;
  role: "owner" | "manager" | "agent" | string;
  avatar_url?: string;
  agency_id?: string;
  agency_name?: string;
}

export interface BackendAssociatedProperty {
  id: string;
  lead_id: string;
  property_id: string;
  property_title: string;
  property_price_pkr: number | string;
  property_location: string;
  property_society: string;
  property_type: string;
  property_status: string;
  property_image_url?: string;
  notes?: string;
  associated_at: string;
}

export interface BackendMatchedProperty {
  id: string;
  title: string;
  type: string;
  location: string;
  society: string;
  city: string;
  price_pkr: number | string;
  area_size: string;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  image_url?: string;
  match_score: number;
  match_level: "exceptional" | "strong" | "moderate";
  budget_fit: "exact" | "within_budget" | "below_budget" | "above_budget";
  budget_difference_pkr: number | string;
  reasons: string[];
  whatsapp_pitch_text: string;
  whatsapp_pitch_text_urdu?: string;
}

export interface BackendLeadMatchesResponse {
  lead_id: string;
  lead_name: string;
  budget_pkr: number | string;
  property_type: string;
  preferred_locations: string;
  total_matches: number;
  matches: BackendMatchedProperty[];
}

export interface BackendLead {
  id: string;
  agency_id: string;
  full_name: string;
  phone: string;
  email?: string;
  city: string;
  source: string;
  status: string;
  priority: string;
  budget_pkr: string | number;
  property_type_interest: string;
  preferred_locations: string;
  purpose: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  last_contacted_at?: string;
  next_followup_at?: string;
  is_archived?: boolean;
  created_by_id?: string;
  created_by_name?: string;
  updated_by_id?: string;
  updated_by_name?: string;
  associated_properties?: BackendAssociatedProperty[];
  created_at: string;
  updated_at: string;
  notes?: Array<{
    id: string;
    lead_id: string;
    author_name: string;
    content: string;
    created_at: string;
  }>;
  activities?: Array<{
    id: string;
    lead_id: string;
    type: string;
    title: string;
    description: string;
    performed_by_name?: string;
    created_at: string;
  }>;
}

export interface BackendProperty {
  id: string;
  agency_id: string;
  title: string;
  slug: string;
  type: string;
  city: string;
  location: string;
  society: string;
  price_pkr: string | number;
  area_size: string;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  featured: boolean;
  image_url: string;
  description: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendFollowUp {
  id: string;
  agency_id: string;
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  scheduled_date: string;
  scheduled_time: string;
  type: string;
  notes: string;
  priority: string;
  completed: boolean;
  completed_at?: string;
  completed_by_id?: string;
  completed_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendSiteVisit {
  id: string;
  agency_id: string;
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  property_id: string;
  property_title?: string;
  property_location?: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  visit_date: string;
  visit_time: string;
  status: string;
  notes?: string;
  client_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendAgentPerformance {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  deals_closed: number;
  revenue_pkr: string | number;
  target_pkr: string | number;
  active_leads: number;
  conversion_rate: number;
  status: string;
  system_role?: string;
}

export type PakistaniDealStage =
  | "token"
  | "bayana"
  | "noc_verification"
  | "final_transfer"
  | "completed"
  | "cancelled";

export type TokenType = "kacha_token" | "pakka_token";

export type CommissionSide =
  | "both_sides_2pct"
  | "buyer_side_1pct"
  | "seller_side_1pct"
  | "custom";

export interface BackendDeal {
  id: string;
  agency_id: string;
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  property_id?: string;
  property_title?: string;
  property_location?: string;
  agent_id?: string;
  agent_name?: string;
  title: string;
  stage: PakistaniDealStage;
  deal_value_pkr: number | string;
  // Stage 1: Token
  token_amount_pkr: number | string;
  token_date?: string;
  token_type?: TokenType;
  // Stage 2: Bayana
  bayana_amount_pkr: number | string;
  bayana_date?: string;
  iqrarnama_number?: string;
  // Stage 3: NOC & Society Clearance
  noc_authority?: string;
  ndc_cleared: boolean;
  // Stage 4: Transfer & Registry
  transfer_date?: string;
  registry_number?: string;
  // Commission Settlement & Splits
  commission_side: CommissionSide;
  commission_percentage: number | string;
  commission_pkr: number | string;
  agency_split_percentage: number | string;
  agent_split_percentage: number | string;
  agency_commission_pkr: number | string;
  agent_commission_pkr: number | string;
  settlement_status: "pending" | "advance_released" | "fully_settled" | string;
  expected_close_date?: string;
  closed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxCalculationRequest {
  property_price: number;
  fbr_valuation?: number;
  society: string;
  property_type: string;
  area_size: string;
  buyer_tax_status: "filer" | "late_filer" | "non_filer";
  seller_tax_status: "filer" | "late_filer" | "non_filer";
  is_first_transfer_membership?: boolean;
  is_urgent_transfer?: boolean;
  province?: "punjab" | "ict" | "sindh" | "kpk";
}

export interface BuyerExpenseBreakdown {
  section_236k_rate: number;
  section_236k_amount: number;
  stamp_duty_rate: number;
  stamp_duty_amount: number;
  tma_tax_rate: number;
  tma_tax_amount: number;
  society_transfer_fee: number;
  society_membership_fee: number;
  urgent_transfer_fee: number;
  total_buyer_closing_cost: number;
  total_buyer_out_of_pocket: number;
  filer_savings_vs_non_filer: number;
}

export interface SellerDeductionBreakdown {
  section_236c_rate: number;
  section_236c_amount: number;
  society_ndc_fee: number;
  total_seller_deductions: number;
  net_seller_proceeds: number;
  filer_savings_vs_non_filer: number;
}

export interface CombinedClosingSummary {
  total_government_taxes: number;
  total_society_fees: number;
  grand_total_closing_cost: number;
}

export interface TaxCalculationResponse {
  property_price: number;
  taxable_base: number;
  society: string;
  property_type: string;
  area_size: string;
  buyer_tax_status: string;
  seller_tax_status: string;
  buyer: BuyerExpenseBreakdown;
  seller: SellerDeductionBreakdown;
  combined: CombinedClosingSummary;
  whatsapp_breakdown_en: string;
  whatsapp_breakdown_ur: string;
}

export interface TaxOptionsResponse {
  societies: Array<{ id: string; name: string; has_tma: boolean }>;
  area_sizes: string[];
  property_types: string[];
  provinces: Array<{ id: string; name: string; stamp_duty_rate: number }>;
  fbr_tax_slabs_summary: Record<string, Record<string, string>>;
}

export interface CommissionCalculationRequest {
  deal_value_pkr: number;
  commission_side?: CommissionSide;
  custom_commission_percentage?: number;
  agency_split_percentage?: number;
  agent_split_percentage?: number;
}

export interface CommissionCalculationResponse {
  deal_value_pkr: number | string;
  commission_side: string;
  commission_percentage: number | string;
  total_commission_pkr: number | string;
  agency_commission_pkr: number | string;
  agent_commission_pkr: number | string;
  formatted_deal_value: string;
  formatted_total_commission: string;
  formatted_agency_commission: string;
  formatted_agent_commission: string;
}

export interface BackendAgencySettings {
  id: string;
  name: string;
  tagline?: string;
  ntn_number?: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_business_phone?: string;
  address?: string;
  city: string;
  currency_format: string;
  auto_assignment_rule: string;
  default_followup_reminder_hours: string;
  followup_reminder_minutes_before?: number;
  enable_whatsapp_notifications: boolean;
  enable_sms_alerts: boolean;
  n8n_webhook_url?: string;
  whatsapp_template_name?: string;
  whatsapp_enabled?: boolean;
  subscription_status?: string;
  subscription_plan?: string;
  trial_ends_at?: string | null;
  subscription_expires_at?: string | null;
}

export interface BackendNotification {
  id: string;
  agency_id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  link_url?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface BackendAutomationConfig {
  n8n_webhook_url?: string;
  has_webhook_secret: boolean;
  whatsapp_template_name: string;
  whatsapp_enabled: boolean;
  followup_reminder_minutes_before: number;
  official_whatsapp_compliance: {
    provider: string;
    documentation_path: string;
    compliance_notes: string[];
    supported_templates: Array<{
      name: string;
      category: string;
      status: string;
      body: string;
    }>;
  };
}

export interface BackendShareLink {
  id: string;
  property_id: string;
  property_title: string;
  lead_id?: string;
  token: string;
  share_url: string;
  target_buyer_name?: string;
  target_buyer_country?: string;
  target_buyer_city?: string;
  target_buyer_phone?: string;
  custom_pitch?: string;
  default_currency: string;
  views_count: number;
  last_viewed_at?: string;
  created_at: string;
  whatsapp_share_text: string;
}

export interface BackendPublicDossier {
  token: string;
  property_id: string;
  title: string;
  slug: string;
  type: string;
  city: string;
  location: string;
  society: string;
  price_pkr: number;
  formatted_pkr: string;
  currencies: Record<
    string,
    {
      amount: number;
      formatted: string;
      currency: string;
      symbol: string;
      flag: string;
    }
  >;
  exchange_rates: Record<string, any>;
  area_size: string;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  featured: boolean;
  image_url: string;
  gallery_images: string[];
  description: string;
  video_url?: string;
  noc_status: string;
  documents_verified: boolean;
  allotment_status: string;
  possession_status: string;
  legal_assurances: string[];
  target_buyer_name?: string;
  target_buyer_country?: string;
  target_buyer_city?: string;
  custom_pitch?: string;
  default_currency: string;
  agent: {
    name: string;
    role_title: string;
    phone: string;
    email: string;
    avatar_url: string;
  };
  agency: {
    name: string;
    tagline: string;
    ntn_number: string;
    city: string;
    address: string;
    contact_email: string;
    contact_phone: string;
  };
  direct_whatsapp_url: string;
  supported_timezones: Array<{
    id: string;
    code: string;
    city: string;
    country: string;
    flag: string;
    utc_offset: string;
  }>;
}

export interface BackendBookVirtualTourRequest {
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_timezone: string;
  visit_date: string;
  visit_time: string;
  is_time_in_client_tz?: boolean;
  platform?: string;
  notes?: string;
}

export interface BackendBookVirtualTourResponse {
  success: boolean;
  message: string;
  site_visit_id: string;
  visit_date: string;
  client_local_time: string;
  pkt_time: string;
  platform: string;
  invitation_text: string;
  direct_whatsapp_url: string;
}

class ApiClient {
  public setUser(user: AuthUser) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
    }
  }

  public getUser(): AuthUser | null {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(USER_KEY) || localStorage.getItem("veltrivo_current_user_profile");
        if (stored) return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  public clearUser() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("veltrivo_current_user_profile");
      } catch {
        // ignore
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Transmit HttpOnly authentication cookie automatically
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- Auth Endpoints (handled securely via HttpOnly session cookies) ---
  public auth = {
    login: async (email: string, password: string): Promise<{ success: boolean; user: AuthUser }> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      this.setUser(data.user);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("propstackly_crm_data_v1");
        } catch {}
      }
      return data;
    },

    register: async (payload: {
      agency_name: string;
      full_name: string;
      email: string;
      phone: string;
      city?: string;
      password: string;
    }): Promise<{ success: boolean; user: AuthUser }> => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      this.setUser(data.user);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("propstackly_crm_data_v1");
        } catch {}
      }
      return data;
    },

    logout: async (): Promise<void> => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
      this.clearUser();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },

    me: async (): Promise<{ user: AuthUser; agency: any }> => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      const data = await response.json();
      this.setUser(data.user);
      return data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
      return this.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
    },
  };

  // --- Leads Endpoints ---
  public leads = {
    getAll: async (params: Record<string, string | number> = {}): Promise<{ items: BackendLead[]; total: number; page: number; pages: number }> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ items: BackendLead[]; total: number; page: number; pages: number }>(`/leads${qStr}`);
    },
    getById: async (id: string): Promise<BackendLead> => {
      return this.request<BackendLead>(`/leads/${id}`);
    },
    create: async (data: any): Promise<BackendLead> => {
      return this.request<BackendLead>("/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, updates: any): Promise<BackendLead> => {
      return this.request<BackendLead>(`/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    delete: async (id: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/leads/${id}`, {
        method: "DELETE",
      });
    },
    assign: async (id: string, agentId: string): Promise<BackendLead> => {
      return this.request<BackendLead>(`/leads/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({ agent_id: agentId }),
      });
    },
    addNote: async (id: string, content: string): Promise<any> => {
      return this.request(`/leads/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    logActivity: async (id: string, activity: { type: string; title: string; description: string }): Promise<any> => {
      return this.request(`/leads/${id}/activities`, {
        method: "POST",
        body: JSON.stringify(activity),
      });
    },
    archive: async (id: string): Promise<{ message: string; lead_id: string; is_archived: boolean }> => {
      return this.request<{ message: string; lead_id: string; is_archived: boolean }>(`/leads/${id}/archive`, {
        method: "POST",
      });
    },
    unarchive: async (id: string): Promise<{ message: string; lead_id: string; is_archived: boolean }> => {
      return this.request<{ message: string; lead_id: string; is_archived: boolean }>(`/leads/${id}/unarchive`, {
        method: "POST",
      });
    },
    getAssociatedProperties: async (id: string): Promise<BackendAssociatedProperty[]> => {
      return this.request<BackendAssociatedProperty[]>(`/leads/${id}/properties`);
    },
    associateProperty: async (id: string, propertyId: string, notes?: string): Promise<BackendAssociatedProperty> => {
      return this.request<BackendAssociatedProperty>(`/leads/${id}/properties`, {
        method: "POST",
        body: JSON.stringify({ property_id: propertyId, notes }),
      });
    },
    removeAssociatedProperty: async (id: string, propertyId: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/leads/${id}/properties/${propertyId}`, {
        method: "DELETE",
      });
    },
    getMatches: async (id: string, minScore = 20): Promise<BackendLeadMatchesResponse> => {
      return this.request<BackendLeadMatchesResponse>(`/leads/${id}/matches?min_score=${minScore}`);
    },
  };

  // --- Properties Endpoints ---
  public properties = {
    getAll: async (params: Record<string, string | number> = {}): Promise<{ items: BackendProperty[]; total: number; page: number; pages: number }> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ items: BackendProperty[]; total: number; page: number; pages: number }>(`/properties${qStr}`);
    },
    getById: async (id: string): Promise<BackendProperty> => {
      return this.request<BackendProperty>(`/properties/${id}`);
    },
    create: async (data: any): Promise<BackendProperty> => {
      return this.request<BackendProperty>("/properties", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, updates: any): Promise<BackendProperty> => {
      return this.request<BackendProperty>(`/properties/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    delete: async (id: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/properties/${id}`, {
        method: "DELETE",
      });
    },
    uploadImage: async (file: File): Promise<{ image_url: string; filename: string; size_bytes: number }> => {
      const formData = new FormData();
      formData.append("file", file);
      const url = `${API_BASE_URL}/properties/upload-image`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        let errMsg = "Image upload failed";
        try {
          const err = await response.json();
          if (err.detail) errMsg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        } catch {
          // default
        }
        throw new Error(errMsg);
      }
      return response.json();
    },
  };

  // --- Follow-ups Endpoints ---
  public followUps = {
    getAll: async (params: Record<string, any> = {}): Promise<BackendFollowUp[]> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<BackendFollowUp[]>(`/follow-ups${qStr}`);
    },
    create: async (data: any): Promise<BackendFollowUp> => {
      return this.request<BackendFollowUp>("/follow-ups", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, updates: any): Promise<BackendFollowUp> => {
      return this.request<BackendFollowUp>(`/follow-ups/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    delete: async (id: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/follow-ups/${id}`, {
        method: "DELETE",
      });
    },
  };

  // --- Site Visits Endpoints ---
  public siteVisits = {
    getAll: async (params: Record<string, any> = {}): Promise<BackendSiteVisit[]> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<BackendSiteVisit[]>(`/site-visits${qStr}`);
    },
    create: async (data: any): Promise<BackendSiteVisit> => {
      return this.request<BackendSiteVisit>("/site-visits", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, updates: any): Promise<BackendSiteVisit> => {
      return this.request<BackendSiteVisit>(`/site-visits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    delete: async (id: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/site-visits/${id}`, {
        method: "DELETE",
      });
    },
  };

  // --- Team Endpoints ---
  public team = {
    getAll: async (): Promise<BackendAgentPerformance[]> => {
      return this.request<BackendAgentPerformance[]>("/team");
    },
    create: async (data: any): Promise<any> => {
      return this.request("/team", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (userId: string, data: any): Promise<any> => {
      return this.request(`/team/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (userId: string): Promise<any> => {
      return this.request(`/team/${userId}`, {
        method: "DELETE",
      });
    },
    resetPassword: async (userId: string, newPassword: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/team/${userId}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      });
    },
  };

  // --- Analytics Endpoints ---
  public analytics = {
    getDashboard: async (): Promise<any> => {
      return this.request("/analytics/dashboard");
    },
    getReports: async (): Promise<any> => {
      return this.request("/analytics/reports");
    },
  };

  // --- Settings Endpoints ---
  public settings = {
    getAgency: async (): Promise<BackendAgencySettings> => {
      return this.request<BackendAgencySettings>("/settings/agency");
    },
    updateAgency: async (data: any): Promise<BackendAgencySettings> => {
      return this.request<BackendAgencySettings>("/settings/agency", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    activateSubscription: async (data: {
      plan?: string;
      duration_months?: number;
      payment_method?: string;
      payment_reference?: string;
      notes?: string;
    }): Promise<BackendAgencySettings> => {
      return this.request<BackendAgencySettings>("/settings/agency/activate-subscription", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    resetTrial: async (trial_days: number = 3): Promise<BackendAgencySettings> => {
      return this.request<BackendAgencySettings>("/settings/agency/reset-trial", {
        method: "POST",
        body: JSON.stringify({ trial_days }),
      });
    },
  };

  // --- Notifications Endpoints ---
  public notifications = {
    getAll: async (params: { unread_only?: boolean; limit?: number; offset?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.unread_only !== undefined) query.append("unread_only", String(params.unread_only));
      if (params.limit !== undefined) query.append("limit", String(params.limit));
      if (params.offset !== undefined) query.append("offset", String(params.offset));
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ items: BackendNotification[]; total: number; unread_count: number }>(`/notifications${qStr}`);
    },
    getUnreadCount: async () => {
      return this.request<{ unread_count: number }>("/notifications/unread-count");
    },
    triggerTestPush: async () => {
      return this.request<BackendNotification>("/notifications/test-push", {
        method: "POST",
      });
    },
    markRead: async (id: string) => {
      return this.request<BackendNotification>(`/notifications/${id}/read`, {
        method: "PATCH",
      });
    },
    markAllRead: async () => {
      return this.request<{ count: number; message: string }>("/notifications/mark-all-read", {
        method: "POST",
      });
    },
    delete: async (id: string) => {
      return this.request<{ message: string }>(`/notifications/${id}`, {
        method: "DELETE",
      });
    },
  };

  // --- Automations Endpoints ---
  public automations = {
    getConfig: async () => {
      return this.request<BackendAutomationConfig>("/automations/config");
    },
    updateConfig: async (data: Partial<BackendAutomationConfig> & { n8n_webhook_secret?: string }) => {
      return this.request<BackendAutomationConfig>("/automations/config", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    testWebhook: async (data: { webhook_url?: string; webhook_secret?: string } = {}) => {
      return this.request<{
        success: boolean;
        status_code?: number;
        response_time_ms: number;
        message: string;
        payload_preview: any;
      }>("/automations/test-n8n-webhook", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    runReminders: async () => {
      return this.request<{
        success: boolean;
        agencies_processed: number;
        upcoming_reminders_sent: number;
        overdue_reminders_sent: number;
        elapsed_ms: number;
        message: string;
      }>("/automations/run-reminders", {
        method: "POST",
      });
    },
    getLogs: async (params: { status?: string; limit?: number; offset?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append("status", params.status);
      if (params.limit !== undefined) query.append("limit", String(params.limit));
      if (params.offset !== undefined) query.append("offset", String(params.offset));
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ items: any[]; total: number }>(`/automations/logs${qStr}`);
    },
  };

  // --- Overseas Buyer Experience & Public Portal ---
  public overseas = {
    createShareLink: async (
      propertyId: string,
      data: {
        lead_id?: string;
        target_buyer_name?: string;
        target_buyer_country?: string;
        target_buyer_city?: string;
        target_buyer_phone?: string;
        custom_pitch?: string;
        default_currency?: string;
      }
    ): Promise<BackendShareLink> => {
      return this.request<BackendShareLink>(`/overseas/properties/${propertyId}/share-link`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getShareLinks: async (propertyId: string): Promise<BackendShareLink[]> => {
      return this.request<BackendShareLink[]>(`/overseas/properties/${propertyId}/share-links`);
    },
    getPublicDossier: async (token: string): Promise<BackendPublicDossier> => {
      return this.request<BackendPublicDossier>(`/public/share/${token}`);
    },
    bookVirtualTour: async (
      token: string,
      data: BackendBookVirtualTourRequest
    ): Promise<BackendBookVirtualTourResponse> => {
      return this.request<BackendBookVirtualTourResponse>(`/public/share/${token}/book-tour`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getCurrencies: async () => {
      return this.request<{ base_currency: string; currencies: Record<string, any> }>("/public/currencies");
    },
    getTimezones: async () => {
      return this.request<any[]>("/public/timezones");
    },
  };

  // --- Pakistani Deal Flow & Commission Settlement ---
  public deals = {
    getAll: async (params: {
      stage?: string;
      agent_id?: string;
      lead_id?: string;
      search?: string;
      skip?: number;
      limit?: number;
    } = {}): Promise<BackendDeal[]> => {
      const query = new URLSearchParams();
      if (params.stage) query.append("stage", params.stage);
      if (params.agent_id) query.append("agent_id", params.agent_id);
      if (params.lead_id) query.append("lead_id", params.lead_id);
      if (params.search) query.append("search", params.search);
      if (params.skip !== undefined) query.append("skip", String(params.skip));
      if (params.limit !== undefined) query.append("limit", String(params.limit));
      const qStr = query.toString() ? `?${query.toString()}` : "";
      return this.request<BackendDeal[]>(`/deals${qStr}`);
    },
    getById: async (dealId: string): Promise<BackendDeal> => {
      return this.request<BackendDeal>(`/deals/${dealId}`);
    },
    create: async (data: Partial<BackendDeal>): Promise<BackendDeal> => {
      return this.request<BackendDeal>("/deals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (dealId: string, data: Partial<BackendDeal>): Promise<BackendDeal> => {
      return this.request<BackendDeal>(`/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (dealId: string): Promise<void> => {
      return this.request<void>(`/deals/${dealId}`, {
        method: "DELETE",
      });
    },
    calculateCommission: async (
      data: CommissionCalculationRequest
    ): Promise<CommissionCalculationResponse> => {
      return this.request<CommissionCalculationResponse>("/deals/calculate-commission", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  };

  // --- Pakistani Property Tax & Society Transfer Fee Calculator ---
  public tax = {
    calculate: async (data: TaxCalculationRequest): Promise<TaxCalculationResponse> => {
      return this.request<TaxCalculationResponse>("/tax/calculate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getOptions: async (): Promise<TaxOptionsResponse> => {
      return this.request<TaxOptionsResponse>("/tax/options");
    },
  };
}

export const api = new ApiClient();
export default api;
