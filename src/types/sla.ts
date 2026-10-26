import { LeadSource } from "./crm";

export interface SpeedToLeadConfig {
  enabled: boolean;
  firstResponseTargetMinutes: number; // e.g. 5 minutes
  agentWarningMinutes: number; // e.g. 3 minutes (warn agent)
  managerEscalationMinutes: number; // e.g. 10 minutes (alert manager)
  autoReassignEnabled: boolean; // optional auto-reassign
  autoReassignMinutes: number; // e.g. 15 minutes
  reassignStrategy: "round_robin" | "least_busy" | "senior_first";
  businessHoursOnly: boolean;
  businessHoursStart: string; // "09:00"
  businessHoursEnd: string; // "21:00"
  notifyChannels: {
    inApp: boolean;
    whatsappAlert: boolean;
    soundChime: boolean;
  };
  priorityTargets: {
    high: number; // e.g. 5 minutes
    medium: number; // e.g. 15 minutes
    low: number; // e.g. 30 minutes
  };
}

export type SLAState =
  | "safe" // green, countdown running comfortably
  | "warning" // amber, approaching SLA target
  | "breached" // red, target missed
  | "escalated" // purple, manager alerted
  | "reassigned" // blue, auto-reassigned to another agent
  | "responded_on_time" // emerald, first contact logged within target
  | "responded_late"; // orange, contacted after SLA target passed

export interface LeadSLAInfo {
  leadId: string;
  leadName: string;
  phone: string;
  source: LeadSource;
  priority: "high" | "medium" | "low";
  assignedAgentId: string;
  assignedAgentName: string;
  createdAt: string;
  firstResponseAt?: string;
  firstResponseMinutes?: number;
  firstResponseType?: "call" | "whatsapp" | "meeting" | "note";
  targetMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  state: SLAState;
  isManagerAlerted: boolean;
  isReassigned: boolean;
  reassignedFromAgentName?: string;
  reassignedAt?: string;
}

export interface SLAEscalationLog {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  source: LeadSource;
  agentId: string;
  agentName: string;
  eventType: "warning" | "manager_alert" | "auto_reassign" | "sla_met";
  timestamp: string;
  targetMinutes: number;
  elapsedMinutes: number;
  reassignedToAgentName?: string;
  message: string;
}

export interface AgentSLAPerformance {
  agentId: string;
  agentName: string;
  agentRole: string;
  avatar: string;
  totalLeads: number;
  respondedCount: number;
  avgResponseMinutes: number;
  targetMetCount: number;
  complianceRate: number; // %
  warningCount: number;
  breachCount: number;
  reassignedOutCount: number;
  rating: "Elite (< 5m)" | "Good (5-10m)" | "Average (10-20m)" | "Critical (> 20m)";
}

export interface SourceSLAPerformance {
  source: LeadSource;
  totalLeads: number;
  respondedCount: number;
  avgResponseMinutes: number;
  complianceRate: number; // %
  fastestMinutes: number;
  slowestMinutes: number;
  riskLevel: "Low" | "Medium" | "High";
}
