export type InstallmentFrequency = "monthly" | "quarterly" | "semi_annual";

export type MilestoneStatus = "paid" | "due_soon" | "overdue" | "upcoming";

export interface InstallmentMilestone {
  id: string;
  milestoneNumber: number;
  title: string; // e.g. "Down Payment (15%)", "1st Quarter Installment", "Balloting Surcharge", "Possession Due"
  dueDate: string; // YYYY-MM-DD
  amountPKR: number;
  status: MilestoneStatus;
  paidDate?: string;
  paidAmountPKR?: number;
  paymentMode?: "Online Raast / IBFT" | "Pay Order" | "Cheque" | "Cash Deposit";
  instrumentReference?: string;
  receiptNumber?: string;
  developerCommissionPercent: number; // e.g. 50% commission released on down payment
  developerCommissionPKR: number;
  commissionReleased: boolean;
  notes?: string;
}

export interface InstallmentPlan {
  id: string;
  planTitle: string; // e.g. "Park View City - 1 Kanal Overseas Block"
  projectName: string; // e.g. "Park View City", "Capital Smart City", "Eighteen", "DHA Quetta"
  developerName: string; // e.g. "Vision Group", "FDHL & HRL", "Ora Developers"
  unitOrFileNumber: string; // e.g. "PVC-OVS-8421"
  propertyType: "Residential Plot" | "Commercial Plot" | "Apartment" | "Villa / House";
  size: "5 Marla" | "10 Marla" | "1 Kanal" | "2 Kanal" | "Commercial";
  city: "Islamabad" | "Rawalpindi" | "Lahore" | "Karachi";
  totalPricePKR: number;
  downPaymentPKR: number;
  downPaymentPercent: number; // e.g. 15%
  tenureYears: number; // e.g. 3 or 3.5 or 4
  frequency: InstallmentFrequency;
  totalInstallments: number;
  possessionDuePKR: number;
  clientName: string;
  clientPhone: string;
  clientCnic?: string;
  leadId?: string;
  assignedAgentName: string;
  bankAccountTitle: string;
  bankName: string;
  bankIban: string;
  lateFeeMonthlyPercent: number; // e.g. 1.5%
  milestones: InstallmentMilestone[];
  createdAt: string;
  updatedAt: string;
}
