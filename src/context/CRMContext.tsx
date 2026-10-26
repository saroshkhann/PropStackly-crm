"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Lead,
  Property,
  Agent,
  FollowUp,
  SiteVisit,
  LeadNote,
  LeadActivity,
  AgencySettings,
  LeadStatus,
} from "@/types/crm";
import {
  initialAgencySettings,
  initialAgents,
  initialProperties,
  initialLeads,
  initialFollowUps,
  initialSiteVisits,
  initialLeadNotes,
  initialActivities,
} from "@/data/mockData";
import { CurrencyCode, formatCurrency } from "@/lib/currency";
import api, {
  AuthUser,
  BackendLead,
  BackendProperty,
  BackendFollowUp,
  BackendSiteVisit,
  BackendAgentPerformance,
  BackendAgencySettings,
  BackendNotification,
} from "@/lib/api";

export interface ToastNotification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface CRMContextType {
  currentUser: AuthUser | null;
  isOwner: boolean;
  isManager: boolean;
  isAgent: boolean;
  logout: () => Promise<void>;
  leads: Lead[];
  properties: Property[];
  agents: Agent[];
  followUps: FollowUp[];
  siteVisits: SiteVisit[];
  notes: Record<string, LeadNote[]>;
  activities: LeadActivity[];
  settings: AgencySettings;
  currentAgent: Agent;
  toasts: ToastNotification[];
  backendConnected: boolean;
  isLoading: boolean;
  backendError: string | null;
  refreshData: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;

  // Currencies & Overseas
  activeCurrency: CurrencyCode;
  setActiveCurrency: (currency: CurrencyCode) => void;
  formatActiveCurrency: (amountPKR: number, compact?: boolean) => string;

  // Notifications & Real-Time Push
  notifications: BackendNotification[];
  unreadNotificationsCount: number;
  realtimeConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  triggerTestNotification: () => Promise<void>;
  playNotificationChime: () => void;

  // Leads
  addLead: (leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "notesCount">) => Promise<string>;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  reassignLead: (id: string, agentId: string) => void;
  archiveLead: (id: string) => Promise<void>;
  unarchiveLead: (id: string) => Promise<void>;
  associatePropertyToLead: (leadId: string, propertyId: string, notes?: string) => Promise<void>;
  removePropertyFromLead: (leadId: string, propertyId: string) => Promise<void>;

  // Notes & Activity
  addNote: (leadId: string, content: string) => void;
  logActivity: (leadId: string, activity: Omit<LeadActivity, "id" | "createdAt">) => void;

  // Properties
  addProperty: (propertyData: Omit<Property, "id" | "addedAt">) => string;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Follow-ups
  addFollowUp: (followUpData: Omit<FollowUp, "id" | "completed">) => string;
  toggleFollowUp: (id: string) => void;
  deleteFollowUp: (id: string) => void;

  // Site Visits
  addSiteVisit: (siteVisitData: Omit<SiteVisit, "id">) => Promise<string>;
  updateSiteVisitStatus: (id: string, status: SiteVisit["status"], clientFeedback?: string) => void;
  deleteSiteVisit: (id: string) => void;

  // Agents & Settings
  addAgent: (agentData: Omit<Agent, "id" | "activeLeadsCount" | "closedDealsCount" | "totalSalesVolumePKR" | "conversionRate"> & { password?: string; systemRole?: string }) => void;
  removeAgent: (agentId: string) => void;
  toggleAgentStatus: (agentId: string) => void;
  setCurrentAgentId: (agentId: string) => void;
  updateSettings: (settingsUpdates: Partial<AgencySettings>) => void;
  resetToDemoData: () => void;

  // 3-Day Free Trial & Subscription Licensing
  activateSubscription: (data: {
    plan?: string;
    duration_months?: number;
    payment_method?: string;
    payment_reference?: string;
    notes?: string;
  }) => Promise<void>;
  resetTrial: (trial_days?: number) => Promise<void>;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialRemainingHours: number;
  trialRemainingFormatted: string;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY = "propstackly_crm_data_v1";

const fallbackAgent: Agent = {
  id: "agent-1",
  name: "Hamza Malik",
  email: "admin@propstackly.com",
  phone: "+92 300 5550192",
  role: "Principal Broker",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  activeLeadsCount: 14,
  closedDealsCount: 19,
  totalSalesVolumePKR: 142500000,
  monthlyTargetPKR: 120000000,
  conversionRate: 15.2,
  status: "active",
};

function mapBackendLead(b: BackendLead): Lead {
  return {
    id: b.id,
    fullName: b.full_name || "Lead",
    phone: b.phone || "",
    email: b.email,
    city: (b.city as any) || "Islamabad",
    source: (b.source as any) || "Facebook Ads",
    status: (b.status as any) || "new",
    priority: (b.priority as any) || "medium",
    assignedAgentId: b.assigned_agent_id || "agent-1",
    budgetPKR: Number(b.budget_pkr) || 0,
    propertyTypeInterest: (b.property_type_interest as any) || "House / Villa",
    preferredLocations: typeof b.preferred_locations === "string" && b.preferred_locations.length > 0
      ? b.preferred_locations.split(", ")
      : ["DHA Phase 2 Islamabad"],
    purpose: (b.purpose as any) || "Own Residence",
    notesCount: Array.isArray(b.notes) ? b.notes.length : 0,
    lastContactedAt: b.last_contacted_at,
    isArchived: Boolean(b.is_archived),
    createdByName: b.created_by_name,
    updatedByName: b.updated_by_name,
    associatedProperties: Array.isArray(b.associated_properties)
      ? b.associated_properties.map((ap) => ({
          id: ap.id,
          propertyId: ap.property_id,
          propertyTitle: ap.property_title,
          propertyPricePKR: Number(ap.property_price_pkr) || 0,
          propertyLocation: ap.property_location,
          propertySociety: ap.property_society,
          propertyType: (ap.property_type as any) || "House / Villa",
          propertyStatus: (ap.property_status as any) || "available",
          propertyImageUrl: ap.property_image_url,
          notes: ap.notes,
          associatedAt: ap.associated_at,
        }))
      : undefined,
    createdAt: b.created_at || new Date().toISOString(),
    updatedAt: b.updated_at || new Date().toISOString(),
  };
}

function mapBackendProperty(p: BackendProperty): Property {
  return {
    id: p.id,
    title: p.title || "Property",
    slug: p.slug || p.id,
    type: (p.type as any) || "House / Villa",
    city: (p.city as any) || "Islamabad",
    location: p.location || "Islamabad",
    society: p.society || "DHA Islamabad",
    pricePKR: Number(p.price_pkr) || 0,
    areaSize: p.area_size || "1 Kanal",
    bedrooms: p.bedrooms || 0,
    bathrooms: p.bathrooms || 0,
    status: (p.status as any) || "available",
    featured: Boolean(p.featured),
    imageUrl: p.image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    description: p.description || "",
    assignedAgentId: p.assigned_agent_id || "agent-1",
    addedAt: p.created_at ? p.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

function mapBackendFollowUp(f: BackendFollowUp): FollowUp {
  return {
    id: f.id,
    leadId: f.lead_id,
    leadName: f.lead_name || "Lead",
    leadPhone: f.lead_phone || "",
    assignedAgentId: f.assigned_agent_id || "agent-1",
    agentName: f.assigned_agent_name || "Assigned Consultant",
    scheduledDate: f.scheduled_date || new Date().toISOString().split("T")[0],
    scheduledTime: f.scheduled_time || "12:00",
    type: (f.type as any) || "Phone Call",
    notes: f.notes || "",
    priority: (f.priority as any) || "high",
    completed: Boolean(f.completed),
    completedAt: f.completed_at,
    completedByName: f.completed_by_name,
  };
}

function mapBackendSiteVisit(s: BackendSiteVisit): SiteVisit {
  return {
    id: s.id,
    leadId: s.lead_id,
    leadName: s.lead_name || "Lead",
    leadPhone: s.lead_phone || "",
    propertyId: s.property_id,
    propertyTitle: s.property_title || "Property",
    propertyLocation: s.property_location || "Islamabad",
    assignedAgentId: s.assigned_agent_id || "agent-1",
    agentName: s.assigned_agent_name || "Assigned Consultant",
    visitDate: s.visit_date || new Date().toISOString().split("T")[0],
    visitTime: s.visit_time || "14:00",
    status: (s.status as any) || "scheduled",
    notes: s.notes || "",
    clientFeedback: s.client_feedback,
  };
}

function mapBackendAgent(a: BackendAgentPerformance): Agent {
  return {
    id: a.id,
    name: a.name || "Agent",
    email: a.email || "agent@propstackly.pk",
    phone: a.phone || "+92 300 0000000",
    role: (a.role as any) || "Property Consultant",
    avatar: a.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    activeLeadsCount: a.active_leads || 0,
    closedDealsCount: a.deals_closed || 0,
    totalSalesVolumePKR: Number(a.revenue_pkr) || 0,
    monthlyTargetPKR: Number(a.target_pkr) || 80000000,
    conversionRate: a.conversion_rate || 0,
    status: a.status?.toLowerCase() === "inactive" ? "offline" : "active",
    systemRole: (a.system_role as any) || "agent",
  };
}

function mapBackendSettings(s: BackendAgencySettings): AgencySettings {
  return {
    agencyName: s.name || "Apex Properties Islamabad",
    tagline: s.tagline || "",
    ntnNumber: s.ntn_number || "",
    contactEmail: s.contact_email || "contact@apexproperties.pk",
    contactPhone: s.contact_phone || "+92 51 2894100",
    whatsappBusinessPhone: s.whatsapp_business_phone || "+92 300 5550192",
    address: s.address || "Executive Heights, Sector F-8 Markaz, Islamabad",
    city: s.city || "Islamabad",
    currencyFormat: (s.currency_format as any) || "Crore_Lakh",
    autoAssignmentRule: (s.auto_assignment_rule as any) || "round_robin",
    defaultFollowupReminderHours: Number(s.default_followup_reminder_hours) || 24,
    enableWhatsAppNotifications: Boolean(s.enable_whatsapp_notifications),
    enableSmsAlerts: Boolean(s.enable_sms_alerts),
    subscriptionStatus: (s.subscription_status as any) || "trial",
    subscriptionPlan: (s.subscription_plan as any) || "starter",
    trialEndsAt: s.trial_ends_at || null,
    subscriptionExpiresAt: s.subscription_expires_at || null,
  };
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => api.getUser());
  const isOwner = currentUser?.role === "owner";
  const isManager = currentUser?.role === "manager" || isOwner;
  const isAgent = currentUser?.role === "agent";

  // Check if active session is the demo seed account
  const isDemoUser = !currentUser || currentUser?.email === "admin@propstackly.com";

  const getStorageKey = useCallback((agencyId?: string) => {
    return `propstackly_crm_data_${agencyId || "guest"}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (currentUser?.agency_id) {
        localStorage.removeItem(getStorageKey(currentUser.agency_id));
      }
      localStorage.removeItem("propstackly_crm_data_v1");
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [currentUser?.agency_id, getStorageKey]);

  // Initial states: ONLY demo account gets initial mock data; real agencies start clean and isolated!
  const [leads, setLeads] = useState<Lead[]>(() => (isDemoUser ? initialLeads : []));
  const [properties, setProperties] = useState<Property[]>(() => (isDemoUser ? initialProperties : []));
  const [agents, setAgents] = useState<Agent[]>(() => {
    if (isDemoUser) return initialAgents;
    if (currentUser) {
      return [
        {
          id: currentUser.id,
          name: currentUser.full_name || "Principal Broker",
          email: currentUser.email,
          phone: currentUser.phone || "+92 300 0000000",
          role: (currentUser.role_title as any) || (currentUser.role === "owner" ? "Principal Broker" : "Property Consultant"),
          avatar: currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          activeLeadsCount: 0,
          closedDealsCount: 0,
          totalSalesVolumePKR: 0,
          monthlyTargetPKR: 100000000,
          conversionRate: 0,
          status: "active",
          systemRole: (currentUser.role as any) || "owner",
        },
      ];
    }
    return [];
  });
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => (isDemoUser ? initialFollowUps : []));
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(() => (isDemoUser ? initialSiteVisits : []));
  const [notes, setNotes] = useState<Record<string, LeadNote[]>>(() => (isDemoUser ? initialLeadNotes : {}));
  const [activities, setActivities] = useState<LeadActivity[]>(() => (isDemoUser ? initialActivities : []));
  const [settings, setSettings] = useState<AgencySettings>(() => {
    if (isDemoUser) return initialAgencySettings;
    return {
      ...initialAgencySettings,
      agencyName: currentUser?.agency_name || "My Real Estate Agency",
      city: "Islamabad",
      contactEmail: currentUser?.email || "",
      contactPhone: currentUser?.phone || "",
    };
  });
  const [currentAgentId, setCurrentAgentIdState] = useState<string>(() => currentUser?.id || "agent-1");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>("PKR");

  // Web Audio Chime Synthesizer (Zero-latency pleasant dual-tone chime: 659Hz -> 880Hz)
  const playNotificationChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const playChimeTones = () => {
        const now = ctx.currentTime;

        // Tone 1: E5 (659.25 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.28);

        // Tone 2: A5 (880.00 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.0, now + 0.1);
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0.38, now + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.7);
      };

      if (ctx.state === "suspended") {
        ctx.resume().then(playChimeTones).catch(() => {});
      } else {
        playChimeTones();
      }
    } catch (err) {
      console.debug("Web Audio chime could not play:", err);
    }
  }, []);

  const formatActiveCurrency = useCallback(
    (amountPKR: number, compact: boolean = true) => {
      return formatCurrency(amountPKR, activeCurrency, compact);
    },
    [activeCurrency]
  );

  // Toast Helper
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.notifications.getAll({ limit: 40 });
      if (res && Array.isArray(res.items)) {
        setNotifications(res.items);
        setUnreadNotificationsCount(res.unread_count);
      }
    } catch {
      // ignore
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadNotificationsCount(0);
      showToast("All notifications marked as read");
    } catch {
      // ignore
    }
  }, [showToast]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.notifications.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const countRes = await api.notifications.getUnreadCount();
      if (countRes) setUnreadNotificationsCount(countRes.unread_count);
    } catch {
      // ignore
    }
  }, []);

  const triggerTestNotification = useCallback(async () => {
    try {
      await api.notifications.triggerTestPush();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger real-time alert";
      showToast(msg, "error");
    }
  }, [showToast]);

  // Sync from Backend API
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setBackendError(null);
    try {
      // 1. Verify and fetch active authenticated session
      let userProfile: AuthUser | null = api.getUser();
      try {
        const meRes = await api.auth.me();
        userProfile = meRes.user;
        setCurrentUser(meRes.user);
      } catch {
        // Not authenticated
      }

      if (!userProfile) {
        setBackendConnected(false);
        setIsLoading(false);
        return;
      }

      const isDemo = userProfile.email === "admin@propstackly.com";

      // 2. Fetch live data safely
      const [leadsRes, propsRes, fuRes, svRes, teamRes, agencyRes] = await Promise.all([
        api.leads.getAll({ size: 100 }).catch(() => null),
        api.properties.getAll({ size: 100 }).catch(() => null),
        api.followUps.getAll().catch(() => null),
        api.siteVisits.getAll().catch(() => null),
        api.team.getAll().catch(() => null),
        api.settings.getAgency().catch(() => null),
      ]);

      let connected = false;

      if (leadsRes && Array.isArray(leadsRes.items)) {
        const liveLeads = leadsRes.items.map(mapBackendLead);
        setLeads(liveLeads);
        connected = true;

        const liveNotes: Record<string, LeadNote[]> = {};
        const liveActs: LeadActivity[] = [];
        leadsRes.items.forEach((bl) => {
          if (Array.isArray(bl.notes) && bl.notes.length > 0) {
            liveNotes[bl.id] = bl.notes.map((n) => ({
              id: n.id,
              leadId: n.lead_id,
              content: n.content,
              createdAt: n.created_at,
              author: n.author_name,
            }));
          }
          if (Array.isArray(bl.activities) && bl.activities.length > 0) {
            bl.activities.forEach((a) => {
              liveActs.push({
                id: a.id,
                leadId: a.lead_id,
                type: a.type as any,
                title: a.title,
                description: a.description,
                createdAt: a.created_at,
                performedBy: a.performed_by_name || "Agent",
              });
            });
          }
        });
        setNotes(liveNotes);
        setActivities(liveActs);
      } else if (!isDemo) {
        setLeads([]);
        setNotes({});
        setActivities([]);
      }

      if (propsRes && Array.isArray(propsRes.items)) {
        setProperties(propsRes.items.map(mapBackendProperty));
        connected = true;
      } else if (!isDemo) {
        setProperties([]);
      }

      if (Array.isArray(fuRes)) {
        setFollowUps(fuRes.map(mapBackendFollowUp));
        connected = true;
      } else if (!isDemo) {
        setFollowUps([]);
      }

      if (Array.isArray(svRes)) {
        setSiteVisits(svRes.map(mapBackendSiteVisit));
        connected = true;
      } else if (!isDemo) {
        setSiteVisits([]);
      }

      if (Array.isArray(teamRes) && teamRes.length > 0) {
        const liveAgents = teamRes.map(mapBackendAgent);
        setAgents(liveAgents);
        if (userProfile && !liveAgents.some((a) => a.id === currentAgentId)) {
          setCurrentAgentIdState(userProfile.id);
        }
        connected = true;
      } else if (userProfile) {
        setAgents([
          {
            id: userProfile.id,
            name: userProfile.full_name || "Principal Broker",
            email: userProfile.email,
            phone: userProfile.phone || "+92 300 0000000",
            role: (userProfile.role_title as any) || (userProfile.role === "owner" ? "Principal Broker" : "Property Consultant"),
            avatar: userProfile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            activeLeadsCount: 0,
            closedDealsCount: 0,
            totalSalesVolumePKR: 0,
            monthlyTargetPKR: 100000000,
            conversionRate: 0,
            status: "active",
            systemRole: (userProfile.role as any) || "owner",
          },
        ]);
        setCurrentAgentIdState(userProfile.id);
      }

      if (agencyRes && agencyRes.name) {
        setSettings(mapBackendSettings(agencyRes));
        connected = true;
      } else if (userProfile && userProfile.agency_name) {
        setSettings((prev) => ({
          ...prev,
          agencyName: userProfile!.agency_name || prev.agencyName,
        }));
      }

      if (connected) {
        fetchNotifications().catch(() => {});
      }

      setBackendConnected(connected);
    } catch (err: any) {
      setBackendConnected(false);
      setBackendError(err.message || "Failed to reach backend");
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [currentAgentId]);

  // Initial load once on mount
  useEffect(() => {
    // 1. Wipe legacy un-scoped key
    try {
      localStorage.removeItem("propstackly_crm_data_v1");
    } catch {}

    const user = api.getUser();
    if (user?.agency_id) {
      const storageKey = getStorageKey(user.agency_id);
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.leads)) setLeads(parsed.leads);
          if (Array.isArray(parsed.properties)) setProperties(parsed.properties);
          if (Array.isArray(parsed.agents)) setAgents(parsed.agents);
          if (Array.isArray(parsed.followUps)) setFollowUps(parsed.followUps);
          if (Array.isArray(parsed.siteVisits)) setSiteVisits(parsed.siteVisits);
          if (parsed.notes && typeof parsed.notes === "object") setNotes(parsed.notes);
          if (Array.isArray(parsed.activities)) setActivities(parsed.activities);
          if (parsed.settings && typeof parsed.settings === "object") setSettings(parsed.settings);
          if (parsed.currentAgentId) setCurrentAgentIdState(parsed.currentAgentId);
        }
      } catch {
        // ignore
      }
    }

    refreshData();
  }, [getStorageKey, refreshData]);

  // Periodic notification polling fallback
  useEffect(() => {
    if (backendConnected && currentUser) {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [backendConnected, currentUser, fetchNotifications]);

  // Real-Time Server-Sent Events (SSE) Push Stream
  useEffect(() => {
    if (!backendConnected || !currentUser) {
      setRealtimeConnected(false);
      return;
    }

    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    const setupSSE = () => {
      try {
        es = new EventSource("/api/backend/notifications/stream", { withCredentials: true });

        es.addEventListener("open", () => {
          if (isSubscribed) setRealtimeConnected(true);
        });

        es.addEventListener("connected", () => {
          if (isSubscribed) setRealtimeConnected(true);
        });

        es.addEventListener("notification", (evt: MessageEvent) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(evt.data) as BackendNotification;
            if (!data || !data.id) return;

            // 1. Play dual-tone executive chime
            playNotificationChime();

            // 2. Prepend event to notifications list
            setNotifications((prev) => {
              if (prev.some((n) => n.id === data.id)) return prev;
              return [data, ...prev];
            });

            // 3. Increment unread counter
            setUnreadNotificationsCount((prev) => prev + 1);

            // 4. Pop up instant interactive toast
            const alertText = data.title ? `${data.title} — ${data.message}` : data.message;
            showToast(alertText, "info");

            // 5. Refresh leads/deals immediately if lead or deal event
            if (
              data.type === "lead_assigned" ||
              data.entity_type === "lead" ||
              data.entity_type === "deal"
            ) {
              refreshData().catch(() => {});
            }
          } catch (e) {
            console.error("Error processing SSE notification:", e);
          }
        });

        es.onerror = () => {
          if (isSubscribed) setRealtimeConnected(false);
          if (es) {
            es.close();
            es = null;
          }
          if (isSubscribed && !reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              if (isSubscribed) setupSSE();
            }, 4000);
          }
        };
      } catch (err) {
        console.error("Failed to initialize SSE stream:", err);
        if (isSubscribed) setRealtimeConnected(false);
      }
    };

    setupSSE();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) es.close();
      setRealtimeConnected(false);
    };
  }, [backendConnected, currentUser, playNotificationChime, refreshData, showToast]);

  // Sync to tenant-scoped localStorage
  useEffect(() => {
    if (!isInitialized || !currentUser?.agency_id) return;
    try {
      const storageKey = getStorageKey(currentUser.agency_id);
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          leads,
          properties,
          agents,
          followUps,
          siteVisits,
          notes,
          activities,
          settings,
          currentAgentId,
        })
      );
    } catch {
      // ignore
    }
  }, [
    isInitialized,
    currentUser?.agency_id,
    getStorageKey,
    leads,
    properties,
    agents,
    followUps,
    siteVisits,
    notes,
    activities,
    settings,
    currentAgentId,
  ]);

  const currentAgent: Agent =
    (agents && agents.length > 0
      ? agents.find(
          (a) =>
            (currentUser?.id && a.id === currentUser.id) ||
            (currentUser?.email && a.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            a.id === currentAgentId
        ) || agents[0]
      : null) ||
    (currentUser
      ? {
          id: currentUser.id,
          name: currentUser.full_name || "Principal Broker",
          email: currentUser.email,
          phone: currentUser.phone || "+92 300 0000000",
          role:
            (currentUser.role_title as any) ||
            (currentUser.role === "owner"
              ? "Principal Broker"
              : currentUser.role === "manager"
              ? "Senior Sales Manager"
              : "Property Consultant"),
          avatar: currentUser.avatar_url || fallbackAgent.avatar,
          activeLeadsCount: 0,
          closedDealsCount: 0,
          totalSalesVolumePKR: 0,
          monthlyTargetPKR: 80000000,
          conversionRate: 0,
          status: "active",
        }
      : fallbackAgent);

  // Lead Actions
  const addLead = async (leadData: Omit<Lead, "id" | "createdAt" | "updatedAt" | "notesCount">): Promise<string> => {
    const tempId = `lead-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    if (backendConnected) {
      try {
        const created = await api.leads.create({
          full_name: leadData.fullName,
          phone: leadData.phone,
          email: leadData.email,
          city: leadData.city,
          source: leadData.source,
          status: leadData.status,
          priority: leadData.priority,
          budget_pkr: leadData.budgetPKR,
          property_type_interest: leadData.propertyTypeInterest,
          preferred_locations: Array.isArray(leadData.preferredLocations)
            ? leadData.preferredLocations.join(", ")
            : "DHA Phase 2 Islamabad",
          purpose: leadData.purpose,
          assigned_agent_id: leadData.assignedAgentId.startsWith("agent-") ? undefined : leadData.assignedAgentId,
        });

        const mapped = mapBackendLead(created);
        setLeads((prev) => [mapped, ...prev]);

        const act: LeadActivity = {
          id: `act-${Date.now()}`,
          leadId: mapped.id,
          type: "status_change",
          title: "Lead Created",
          description: `New lead enquiry registered via ${leadData.source}`,
          createdAt: now,
          performedBy: currentAgent.name,
        };
        setActivities((prev) => [act, ...prev]);
        showToast(`Lead for ${leadData.fullName} registered successfully.`);
        return mapped.id;
      } catch (err: any) {
        showToast(err.message || "Failed to register lead", "error");
        throw err;
      }
    } else {
      const newLead: Lead = {
        ...leadData,
        id: tempId,
        notesCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      setLeads((prev) => [newLead, ...prev]);
      const act: LeadActivity = {
        id: `act-${Date.now()}`,
        leadId: tempId,
        type: "status_change",
        title: "Lead Created",
        description: `New lead enquiry registered via ${leadData.source}`,
        createdAt: now,
        performedBy: currentAgent.name,
      };
      setActivities((prev) => [act, ...prev]);
      showToast(`Lead for ${leadData.fullName} registered successfully.`);
      return tempId;
    }
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          return {
            ...lead,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return lead;
      })
    );

    if (backendConnected && !id.startsWith("lead-")) {
      const payload: any = {};
      if (updates.fullName) payload.full_name = updates.fullName;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.email) payload.email = updates.email;
      if (updates.status) payload.status = updates.status;
      if (updates.priority) payload.priority = updates.priority;
      if (updates.budgetPKR) payload.budget_pkr = updates.budgetPKR;
      if (updates.propertyTypeInterest) payload.property_type_interest = updates.propertyTypeInterest;
      if (updates.preferredLocations) {
        payload.preferred_locations = Array.isArray(updates.preferredLocations)
          ? updates.preferredLocations.join(", ")
          : updates.preferredLocations;
      }
      if (updates.assignedAgentId) payload.assigned_agent_id = updates.assignedAgentId;

      api.leads.update(id, payload).catch(() => {});
    }

    showToast("Lead details updated.");
  };

  const deleteLead = (id: string) => {
    const lead = leads.find((l) => l.id === id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setFollowUps((prev) => prev.filter((f) => f.leadId !== id));
    setSiteVisits((prev) => prev.filter((s) => s.leadId !== id));

    if (backendConnected && !id.startsWith("lead-")) {
      api.leads.delete(id).catch(() => {});
    }

    showToast(`Lead ${lead?.fullName || ""} has been removed.`);
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l))
    );

    if (backendConnected && !id.startsWith("lead-")) {
      api.leads.update(id, { status }).catch(() => {});
    }

    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: id,
      type: "status_change",
      title: `Status changed to ${status.replace("_", " ").toUpperCase()}`,
      description: `Updated by ${currentAgent.name}`,
      createdAt: new Date().toISOString(),
      performedBy: currentAgent.name,
    };
    setActivities((prev) => [act, ...prev]);
    showToast(`Status updated to "${status.replace("_", " ")}"`);
  };

  const reassignLead = (id: string, agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, assignedAgentId: agentId, updatedAt: new Date().toISOString() } : l))
    );

    if (backendConnected && !id.startsWith("lead-") && !agentId.startsWith("agent-")) {
      api.leads.assign(id, agentId).catch(() => {});
    }

    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: id,
      type: "status_change",
      title: `Assigned to ${agent.name}`,
      description: `Reassigned from previous consultant`,
      createdAt: new Date().toISOString(),
      performedBy: currentAgent.name,
    };
    setActivities((prev) => [act, ...prev]);
    showToast(`Lead reassigned to ${agent.name}.`);
  };

  const archiveLead = async (id: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, isArchived: true, updatedAt: new Date().toISOString() } : l)));
    if (backendConnected && !id.startsWith("lead-")) {
      try {
        await api.leads.archive(id);
      } catch (err: any) {
        showToast(err.message || "Failed to archive lead", "error");
        return;
      }
    }
    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: id,
      type: "status_change",
      title: "Lead Archived",
      description: `Lead moved to archive by ${currentAgent.name}`,
      createdAt: new Date().toISOString(),
      performedBy: currentAgent.name,
    };
    setActivities((prev) => [act, ...prev]);
    showToast("Lead moved to archive.");
  };

  const unarchiveLead = async (id: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, isArchived: false, updatedAt: new Date().toISOString() } : l)));
    if (backendConnected && !id.startsWith("lead-")) {
      try {
        await api.leads.unarchive(id);
      } catch (err: any) {
        showToast(err.message || "Failed to restore lead", "error");
        return;
      }
    }
    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: id,
      type: "status_change",
      title: "Lead Restored",
      description: `Lead restored to active pipeline by ${currentAgent.name}`,
      createdAt: new Date().toISOString(),
      performedBy: currentAgent.name,
    };
    setActivities((prev) => [act, ...prev]);
    showToast("Lead restored to active pipeline.");
  };

  const associatePropertyToLead = async (leadId: string, propertyId: string, notes?: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) throw new Error("Property not found");

    if (backendConnected && !leadId.startsWith("lead-") && !propertyId.startsWith("prop-")) {
      try {
        const res = await api.leads.associateProperty(leadId, propertyId, notes);
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === leadId) {
              const currentAssoc = l.associatedProperties || [];
              const newAssoc = {
                id: res.id,
                propertyId: res.property_id,
                propertyTitle: res.property_title,
                propertyPricePKR: Number(res.property_price_pkr) || prop.pricePKR,
                propertyLocation: res.property_location || prop.location,
                propertySociety: res.property_society || prop.society,
                propertyType: (res.property_type as any) || prop.type,
                propertyStatus: (res.property_status as any) || prop.status,
                propertyImageUrl: res.property_image_url || prop.imageUrl,
                notes: res.notes,
                associatedAt: res.associated_at || new Date().toISOString(),
              };
              return { ...l, associatedProperties: [newAssoc, ...currentAssoc] };
            }
            return l;
          })
        );
      } catch (err: any) {
        showToast(err.message || "Failed to link property", "error");
        throw err;
      }
    } else {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === leadId) {
            const currentAssoc = l.associatedProperties || [];
            const newAssoc = {
              id: `assoc-${Date.now()}`,
              propertyId: prop.id,
              propertyTitle: prop.title,
              propertyPricePKR: prop.pricePKR,
              propertyLocation: prop.location,
              propertySociety: prop.society,
              propertyType: prop.type,
              propertyStatus: prop.status,
              propertyImageUrl: prop.imageUrl,
              notes,
              associatedAt: new Date().toISOString(),
            };
            return { ...l, associatedProperties: [newAssoc, ...currentAssoc] };
          }
          return l;
        })
      );
    }

    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: "meeting",
      title: "Property Shortlisted",
      description: `Linked ${prop.title} to buyer requirements`,
      createdAt: new Date().toISOString(),
      performedBy: currentAgent.name,
    };
    setActivities((prev) => [act, ...prev]);
    showToast(`Property "${prop.title}" linked to lead.`);
  };

  const removePropertyFromLead = async (leadId: string, propertyId: string) => {
    if (backendConnected && !leadId.startsWith("lead-") && !propertyId.startsWith("prop-")) {
      try {
        await api.leads.removeAssociatedProperty(leadId, propertyId);
      } catch (err: any) {
        showToast(err.message || "Failed to remove property link", "error");
        throw err;
      }
    }

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            associatedProperties: (l.associatedProperties || []).filter((p) => p.propertyId !== propertyId),
          };
        }
        return l;
      })
    );
    showToast("Property unlinked from lead.");
  };

  // Notes & Activity
  const addNote = (leadId: string, content: string) => {
    const newNote: LeadNote = {
      id: `note-${Date.now()}`,
      leadId,
      content,
      createdAt: new Date().toISOString(),
      author: currentAgent.name,
    };

    setNotes((prev) => ({
      ...prev,
      [leadId]: [newNote, ...(prev[leadId] || [])],
    }));

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, notesCount: (l.notesCount || 0) + 1 } : l))
    );

    if (backendConnected && !leadId.startsWith("lead-")) {
      api.leads.addNote(leadId, content).catch(() => {});
    }

    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: "note",
      title: "Note Added",
      description: content.slice(0, 80) + (content.length > 80 ? "..." : ""),
      createdAt: new Date().toISOString(),
      performedBy: currentAgent.name,
    };
    setActivities((prev) => [act, ...prev]);
    showToast("Note recorded.");
  };

  const logActivity = (leadId: string, activityData: Omit<LeadActivity, "id" | "createdAt">) => {
    const newAct: LeadActivity = {
      ...activityData,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);

    if (backendConnected && !leadId.startsWith("lead-")) {
      api.leads
        .logActivity(leadId, {
          type: activityData.type,
          title: activityData.title,
          description: activityData.description,
        })
        .catch(() => {});
    }

    showToast("Activity logged.");
  };

  // Properties
  const addProperty = (propData: Omit<Property, "id" | "addedAt">): string => {
    const id = `prop-${Date.now().toString().slice(-4)}`;
    const newProp: Property = {
      ...propData,
      id,
      addedAt: new Date().toISOString().split("T")[0],
    };
    setProperties((prev) => [newProp, ...prev]);

    if (backendConnected) {
      api.properties
        .create({
          title: propData.title,
          slug: propData.slug,
          type: propData.type,
          city: propData.city,
          location: propData.location,
          society: propData.society,
          price_pkr: propData.pricePKR,
          area_size: propData.areaSize,
          bedrooms: propData.bedrooms,
          bathrooms: propData.bathrooms,
          status: propData.status,
          featured: propData.featured,
          image_url: propData.imageUrl,
          description: propData.description,
          assigned_agent_id: propData.assignedAgentId.startsWith("agent-") ? undefined : propData.assignedAgentId,
        })
        .then((created) => {
          setProperties((prev) => prev.map((p) => (p.id === id ? mapBackendProperty(created) : p)));
        })
        .catch(() => {});
    }

    showToast("New property inventory listed.");
    return id;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    if (backendConnected && !id.startsWith("prop-")) {
      const payload: any = {};
      if (updates.title) payload.title = updates.title;
      if (updates.type) payload.type = updates.type;
      if (updates.pricePKR) payload.price_pkr = updates.pricePKR;
      if (updates.status) payload.status = updates.status;
      if (updates.society) payload.society = updates.society;
      if (updates.location) payload.location = updates.location;
      if (updates.areaSize) payload.area_size = updates.areaSize;
      if (updates.bedrooms !== undefined) payload.bedrooms = updates.bedrooms;
      if (updates.bathrooms !== undefined) payload.bathrooms = updates.bathrooms;
      if (updates.featured !== undefined) payload.featured = updates.featured;
      if (updates.description) payload.description = updates.description;

      api.properties.update(id, payload).catch(() => {});
    }

    showToast("Property listing updated.");
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));

    if (backendConnected && !id.startsWith("prop-")) {
      api.properties.delete(id).catch(() => {});
    }

    showToast("Property listing removed.");
  };

  // Follow-ups
  const addFollowUp = (data: Omit<FollowUp, "id" | "completed">): string => {
    const id = `fu-${Date.now().toString().slice(-4)}`;
    const newFU: FollowUp = {
      ...data,
      id,
      completed: false,
    };
    setFollowUps((prev) => [newFU, ...prev]);

    if (backendConnected && !data.leadId.startsWith("lead-")) {
      api.followUps
        .create({
          lead_id: data.leadId,
          scheduled_date: data.scheduledDate,
          scheduled_time: data.scheduledTime,
          type: data.type,
          notes: data.notes,
          priority: data.priority,
          assigned_agent_id: data.assignedAgentId.startsWith("agent-") ? undefined : data.assignedAgentId,
        })
        .then((created) => {
          setFollowUps((prev) => prev.map((f) => (f.id === id ? mapBackendFollowUp(created) : f)));
        })
        .catch(() => {});
    }

    showToast("Follow-up task scheduled.");
    return id;
  };

  const toggleFollowUp = (id: string) => {
    let nextCompleted = false;
    setFollowUps((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          nextCompleted = !f.completed;
          return {
            ...f,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return f;
      })
    );

    if (backendConnected && !id.startsWith("fu-")) {
      api.followUps.update(id, { completed: nextCompleted }).catch(() => {});
    }

    showToast("Follow-up status updated.");
  };

  const deleteFollowUp = (id: string) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));

    if (backendConnected && !id.startsWith("fu-")) {
      api.followUps.delete(id).catch(() => {});
    }

    showToast("Follow-up removed.");
  };

  // Site Visits
  const addSiteVisit = async (data: Omit<SiteVisit, "id">): Promise<string> => {
    const tempId = `sv-${Date.now().toString().slice(-4)}`;

    if (backendConnected && !data.leadId.startsWith("lead-") && !data.propertyId.startsWith("prop-")) {
      try {
        const created = await api.siteVisits.create({
          lead_id: data.leadId,
          property_id: data.propertyId,
          visit_date: data.visitDate,
          visit_time: data.visitTime,
          status: data.status,
          notes: data.notes,
          assigned_agent_id: data.assignedAgentId.startsWith("agent-") ? undefined : data.assignedAgentId,
        });

        const mapped = mapBackendSiteVisit(created);
        setSiteVisits((prev) => [mapped, ...prev]);
        updateLeadStatus(data.leadId, "site_visit_scheduled");
        showToast("Site visit scheduled successfully.");
        return mapped.id;
      } catch (err: any) {
        showToast(err.message || "Failed to schedule site visit", "error");
        throw err;
      }
    } else {
      const newVisit: SiteVisit = {
        ...data,
        id: tempId,
      };
      setSiteVisits((prev) => [newVisit, ...prev]);
      updateLeadStatus(data.leadId, "site_visit_scheduled");
      showToast("Site visit scheduled successfully.");
      return tempId;
    }
  };

  const updateSiteVisitStatus = (id: string, status: SiteVisit["status"], clientFeedback?: string) => {
    setSiteVisits((prev) =>
      prev.map((sv) => (sv.id === id ? { ...sv, status, clientFeedback: clientFeedback ?? sv.clientFeedback } : sv))
    );

    if (backendConnected && !id.startsWith("sv-")) {
      api.siteVisits.update(id, { status, client_feedback: clientFeedback }).catch(() => {});
    }

    showToast("Site visit status updated.");
  };

  const deleteSiteVisit = (id: string) => {
    setSiteVisits((prev) => prev.filter((sv) => sv.id !== id));

    if (backendConnected && !id.startsWith("sv-")) {
      api.siteVisits.delete(id).catch(() => {});
    }

    showToast("Site visit record removed.");
  };

  // Agents & Settings
  const addAgent = (agentData: Omit<Agent, "id" | "activeLeadsCount" | "closedDealsCount" | "totalSalesVolumePKR" | "conversionRate"> & { password?: string; systemRole?: string }) => {
    const id = `agent-${Date.now().toString().slice(-4)}`;
    const newAgent: Agent = {
      name: agentData.name,
      email: agentData.email,
      phone: agentData.phone,
      role: agentData.role,
      avatar: agentData.avatar,
      monthlyTargetPKR: agentData.monthlyTargetPKR,
      status: agentData.status,
      id,
      activeLeadsCount: 0,
      closedDealsCount: 0,
      totalSalesVolumePKR: 0,
      conversionRate: 0,
    };
    setAgents((prev) => [...prev, newAgent]);

    if (backendConnected) {
      api.team
        .create({
          email: agentData.email,
          full_name: agentData.name,
          phone: agentData.phone,
          password: agentData.password || "DefaultPassword123!",
          role: agentData.systemRole || "agent",
          role_title: agentData.role,
          avatar_url: agentData.avatar,
          monthly_target_pkr: agentData.monthlyTargetPKR,
        })
        .catch(() => {});
    }

    showToast(`Team member ${agentData.name} added.`);
  };

  const removeAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    if (backendConnected) {
      api.team.delete(agentId).catch(() => {});
    }
    showToast("Team member removed from agency.");
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const nextStatus = a.status === "active" ? "offline" : "active";
          if (backendConnected) {
            api.team.update(agentId, { is_active: nextStatus === "active" }).catch(() => {});
          }
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
    showToast("Agent status updated.");
  };

  const setCurrentAgentId = (agentId: string) => {
    setCurrentAgentIdState(agentId);
    const agent = agents.find((a) => a.id === agentId);
    showToast(`Switched active profile to ${agent?.name || "Agent"}`);
  };

  const updateSettings = (updates: Partial<AgencySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));

    if (backendConnected) {
      const payload: any = {};
      if (updates.agencyName) payload.name = updates.agencyName;
      if (updates.tagline) payload.tagline = updates.tagline;
      if (updates.ntnNumber) payload.ntn_number = updates.ntnNumber;
      if (updates.contactEmail) payload.contact_email = updates.contactEmail;
      if (updates.contactPhone) payload.contact_phone = updates.contactPhone;
      if (updates.whatsappBusinessPhone) payload.whatsapp_business_phone = updates.whatsappBusinessPhone;
      if (updates.address) payload.address = updates.address;
      if (updates.city) payload.city = updates.city;
      if (updates.currencyFormat) payload.currency_format = updates.currencyFormat;
      if (updates.autoAssignmentRule) payload.auto_assignment_rule = updates.autoAssignmentRule;
      if (updates.defaultFollowupReminderHours !== undefined) {
        payload.default_followup_reminder_hours = String(updates.defaultFollowupReminderHours);
      }
      if (updates.enableWhatsAppNotifications !== undefined) {
        payload.enable_whatsapp_notifications = updates.enableWhatsAppNotifications;
      }
      if (updates.enableSmsAlerts !== undefined) {
        payload.enable_sms_alerts = updates.enableSmsAlerts;
      }

      api.settings.updateAgency(payload).catch(() => {});
    }

    showToast("Agency configuration saved.");
  };

  const resetToDemoData = () => {
    setLeads(initialLeads);
    setProperties(initialProperties);
    setAgents(initialAgents);
    setFollowUps(initialFollowUps);
    setSiteVisits(initialSiteVisits);
    setNotes(initialLeadNotes);
    setActivities(initialActivities);
    setSettings(initialAgencySettings);
    setCurrentAgentIdState("agent-1");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast("Demo dataset restored to initial state.", "info");
  };

  // Subscription & 3-Day Trial Helpers
  const subStatus = settings.subscriptionStatus || "trial";
  const trialEndsAtMs = settings.trialEndsAt ? new Date(settings.trialEndsAt).getTime() : 0;
  const nowMs = typeof window !== "undefined" ? Date.now() : 0;
  const isTrialActive = subStatus === "trial" && (trialEndsAtMs === 0 || nowMs <= trialEndsAtMs);
  const isTrialExpired = subStatus === "trial" && trialEndsAtMs > 0 && nowMs > trialEndsAtMs;
  const trialDiffMs = Math.max(0, trialEndsAtMs - nowMs);
  const trialRemainingHours = Math.floor(trialDiffMs / (1000 * 60 * 60));

  let trialRemainingFormatted = "3 Days Free Trial";
  if (subStatus === "active") {
    trialRemainingFormatted = "Pro License Active";
  } else if (isTrialExpired) {
    trialRemainingFormatted = "Trial Expired";
  } else if (trialRemainingHours > 24) {
    const days = Math.floor(trialRemainingHours / 24);
    const hrs = trialRemainingHours % 24;
    trialRemainingFormatted = `${days}d ${hrs}h Left`;
  } else if (trialRemainingHours > 0) {
    trialRemainingFormatted = `${trialRemainingHours}h Left`;
  } else {
    trialRemainingFormatted = "< 1h Left";
  }

  const activateSubscription = async (data: {
    plan?: string;
    duration_months?: number;
    payment_method?: string;
    payment_reference?: string;
    notes?: string;
  }) => {
    try {
      const res = await api.settings.activateSubscription(data);
      setSettings(mapBackendSettings(res));
      showToast("Agency Pro license activated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to activate subscription", "error");
    }
  };

  const resetTrial = async (trial_days: number = 3) => {
    try {
      const res = await api.settings.resetTrial(trial_days);
      setSettings(mapBackendSettings(res));
      showToast(`Trial renewed for ${trial_days} days!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to reset trial", "error");
    }
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        isOwner,
        isManager,
        isAgent,
        logout,
        leads,
        properties,
        agents,
        followUps,
        siteVisits,
        notes,
        activities,
        settings,
        currentAgent,
        toasts,
        backendConnected,
        isLoading,
        backendError,
        activeCurrency,
        setActiveCurrency,
        formatActiveCurrency,
        refreshData,
        showToast,
        removeToast,
        notifications,
        unreadNotificationsCount,
        realtimeConnected,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        triggerTestNotification,
        playNotificationChime,
        addLead,
        updateLead,
        deleteLead,
        updateLeadStatus,
        reassignLead,
        archiveLead,
        unarchiveLead,
        associatePropertyToLead,
        removePropertyFromLead,
        addNote,
        logActivity,
        addProperty,
        updateProperty,
        deleteProperty,
        addFollowUp,
        toggleFollowUp,
        deleteFollowUp,
        addSiteVisit,
        updateSiteVisitStatus,
        deleteSiteVisit,
        addAgent,
        removeAgent,
        toggleAgentStatus,
        setCurrentAgentId,
        updateSettings,
        resetToDemoData,
        activateSubscription,
        resetTrial,
        isTrialActive,
        isTrialExpired,
        trialRemainingHours,
        trialRemainingFormatted,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
}
