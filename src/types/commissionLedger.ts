export type CommissionTier = "Associate (50/50)" | "Senior (60/40)" | "Executive (70/30)" | "Principal (80/20)";

export type DeductionType =
  | "portal_marketing" // Zameen.com / Graana / FB ad listing fee
  | "fuel_travel" // Site visit transport / petrol allowance
  | "client_entertainment" // Client tea / lunch during deal signing
  | "fbr_wht_tax" // Section 233 Withholding Tax (12% for filers)
  | "advance_recovery" // Deduction against past cash advance
  | "office_admin_fee" // Legal paper / stamp duty admin fee
  | "other";

export interface CommissionDeduction {
  id: string;
  type: DeductionType;
  description: string;
  amountPKR: number;
}

export interface AgentWallet {
  agentId: string;
  agentName: string;
  role: string;
  tier: CommissionTier;
  avatar: string;
  phone: string;
  email: string;
  cnic: string;
  bankName: string;
  iban: string;
  accountTitle: string;
  totalEarnedPKR: number;
  totalDisbursedPKR: number;
  pendingClearancePKR: number;
  advanceBalancePKR: number; // outstanding loan/advance borrowed
  netAvailablePKR: number; // ready to disburse: (totalEarnedPKR - totalDisbursedPKR - advanceBalancePKR)
  dealsClosedCount: number;
  lastPayoutDate?: string;
}

export interface DealCommissionItem {
  id: string;
  dealNumber: string;
  dealTitle: string;
  propertyTitle: string;
  society: string;
  dealValuePKR: number;
  grossCommissionPKR: number; // 2% or 1%
  agencySplitPct: number;
  agentSplitPct: number;
  agentSharePKR: number;
  agentId: string;
  agentName: string;
  clientBuyerName: string;
  clientSellerName: string;
  stage: "bayana" | "registry_transfer" | "completed";
  commissionStatus: "unpaid" | "partially_paid" | "settled";
  completedDate: string;
}

export interface AgentAdvanceRecord {
  id: string;
  agentId: string;
  agentName: string;
  amountPKR: number;
  dateGiven: string;
  reason: string;
  recoveredPKR: number;
  remainingPKR: number;
  status: "active" | "fully_recovered";
  approvedBy: string;
}

export interface CommissionPayoutVoucher {
  id: string;
  voucherNumber: string; // e.g. "VCH-2026-041"
  payoutDate: string;
  agentId: string;
  agentName: string;
  agentCnic: string;
  agentPhone: string;
  bankName: string;
  iban: string;
  accountTitle: string;
  deals: {
    dealNumber: string;
    dealTitle: string;
    society: string;
    dealValuePKR: number;
    grossCommissionPKR: number;
    agentSplitPct: number;
    agentSharePKR: number;
  }[];
  grossEarnedPKR: number;
  deductions: CommissionDeduction[];
  totalDeductionsPKR: number;
  whtTaxPct: number; // e.g. 12%
  whtTaxAmountPKR: number;
  netDisbursedPKR: number;
  paymentMode: "IBFT_Bank_Transfer" | "Cross_Cheque" | "Cash";
  transactionRef: string; // IBFT ID or Cheque #
  approvedBy: string;
  notes?: string;
  createdAt: string;
}
