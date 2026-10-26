export type TenancyStatus = "active" | "notice_period" | "renewed" | "expired" | "terminated";

export type RentPaymentStatus = "paid" | "due_soon" | "overdue" | "upcoming";

export interface RentPaymentMonth {
  id: string;
  monthYear: string; // e.g. "November 2026"
  dueDate: string; // YYYY-MM-DD
  rentAmountPKR: number;
  status: RentPaymentStatus;
  paidDate?: string;
  paidAmountPKR?: number;
  paymentMode?: "Online Raast / IBFT" | "Cheque" | "Cash" | "Pay Order";
  instrumentReference?: string;
  receiptNumber?: string;
  lateFeeChargedPKR?: number;
  maintenanceDeductionPKR?: number;
  maintenanceNote?: string;
  notes?: string;
}

export interface TenancyContract {
  id: string;
  agreementNumber: string; // e.g. "RENT-ISB-2026-104"
  propertyTitle: string; // e.g. "1 Kanal Luxury House, Sector F-7/2, Islamabad"
  propertyType: "House / Villa" | "Apartment / Flat" | "Portion (Upper/Lower)" | "Commercial Plaza" | "Farmhouse";
  address: string;
  city: "Islamabad" | "Rawalpindi" | "Lahore" | "Karachi";
  societyOrSector: string; // e.g. "Sector F-7/2" or "DHA Phase 2"

  // Landlord Particulars (مالک مکان)
  landlordName: string;
  landlordFatherName: string;
  landlordCnic: string;
  landlordPhone: string;
  landlordAddress: string;
  landlordBankName?: string;
  landlordAccountTitle?: string;
  landlordIban?: string;

  // Tenant Particulars (کرایہ دار)
  tenantName: string;
  tenantFatherName: string;
  tenantCnic: string;
  tenantPhone: string;
  tenantPermanentAddress: string;
  tenantOccupation: string;
  tenantEmergencyContactName?: string;
  tenantEmergencyContactPhone?: string;
  tenantTotalOccupants: number;

  // Financial Terms
  monthlyRentPKR: number;
  securityDepositPKR: number; // e.g. 2 months refundable security deposit
  securityDepositMonths: number;
  advanceRentMonths: number; // e.g. 1 month or 6 months advance
  annualIncrementPercent: number; // standard 10% per annum
  agencyCommissionTenantPKR: number; // e.g. 15 days or 1 month rent
  agencyCommissionLandlordPKR: number;

  // Agreement Dates
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  tenancyTenureMonths: number; // e.g. 11 months or 24 months
  noticePeriodDays: number; // standard 30 or 60 days
  status: TenancyStatus;

  // Utility Meter Readings at Handover (میٹر ریڈنگز)
  electricityMeterNo: string;
  electricityReadingStart: string;
  gasMeterNo: string;
  gasReadingStart: string;
  waterMaintenanceChargesPKR: number;

  // Witnesses (گواہان)
  witness1Name: string;
  witness1Cnic: string;
  witness1Phone: string;
  witness2Name: string;
  witness2Cnic: string;
  witness2Phone: string;

  assignedAgentName: string;
  policeVerificationSubmitted: boolean;
  policeStationName: string;

  paymentLedger: RentPaymentMonth[];
  createdAt: string;
  updatedAt: string;
}
