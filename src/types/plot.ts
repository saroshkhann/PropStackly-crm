export type PlotStatus = "available" | "token_paid" | "bayana_done" | "sold" | "hold";

export type PlotCategory =
  | "standard"
  | "corner"
  | "park_facing"
  | "boulevard"
  | "corner_park"
  | "corner_boulevard"
  | "commercial";

export type PossessionType =
  | "possession_ready"
  | "balloted_file"
  | "open_file"
  | "under_development";

export type AllotmentType =
  | "Allotment Letter"
  | "Affidavit File"
  | "Intiqal / Registry"
  | "Direct Transfer";

export interface SocietyPlot {
  id: string;
  plotNumber: string; // e.g. "Plot 142"
  societyId: string; // e.g. "dha_phase_2"
  societyName: string; // e.g. "DHA Phase 2"
  sector: string; // e.g. "Sector B"
  street: string; // e.g. "Street 14"
  size: "5 Marla" | "10 Marla" | "1 Kanal" | "2 Kanal" | "4 Marla Commercial" | "8 Marla Commercial";
  dimensions: string; // e.g. "50' x 90'"
  category: PlotCategory;
  possession: PossessionType;
  status: PlotStatus;
  demandPricePKR: number; // e.g. 48_500_000
  minimumTokenPKR: number; // e.g. 1_000_000
  isCorner: boolean;
  isParkFacing: boolean;
  isBoulevard: boolean;
  roadWidthFt: number; // 40, 60, 80, 100, 150
  ownerName: string;
  ownerPhone: string;
  ownerCnic?: string;
  directDealer?: string;
  allotmentType: AllotmentType;
  ndcStatus: "Cleared" | "Pending" | "Not Required";
  gridRow: number;
  gridCol: number;
  notes?: string;
  associatedDealId?: string;
  associatedLeadId?: string;
  updatedAt: string;
}

export interface SocietyMaster {
  id: string;
  name: string;
  city: "Islamabad" | "Rawalpindi" | "Lahore" | "Karachi";
  developer: string;
  totalSectors: number;
  sectors: {
    id: string;
    name: string;
    description: string;
    boulevard: string;
    amenities: string[];
    defaultSize: "5 Marla" | "10 Marla" | "1 Kanal" | "2 Kanal" | "Commercial";
  }[];
}
