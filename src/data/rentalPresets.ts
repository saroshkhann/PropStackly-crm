import { TenancyContract, RentPaymentMonth, TenancyStatus, RentPaymentStatus } from "@/types/rental";

export function generateRentLedger(
  monthlyRentPKR: number,
  startDateStr: string,
  tenureMonths: number
): RentPaymentMonth[] {
  const ledger: RentPaymentMonth[] = [];
  const start = new Date(startDateStr);
  const today = new Date();

  for (let i = 0; i < tenureMonths; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);

    const monthName = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    const dueDate = d.toISOString().split("T")[0];

    let status: RentPaymentStatus = "upcoming";
    let paidDate: string | undefined = undefined;
    let paidAmount: number | undefined = undefined;
    let paymentMode: RentPaymentMonth["paymentMode"] = undefined;
    let instrumentReference: string | undefined = undefined;
    let receiptNumber: string | undefined = undefined;

    if (d < today) {
      if (i <= 2) {
        status = "paid";
        paidDate = dueDate;
        paidAmount = monthlyRentPKR;
        paymentMode = "Online Raast / IBFT";
        instrumentReference = `RAAST-RENT-${Math.floor(100000 + Math.random() * 900000)}`;
        receiptNumber = `RCP-RENT-${(i + 1).toString().padStart(2, "0")}`;
      } else {
        status = "overdue";
      }
    } else {
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 15) {
        status = "due_soon";
      } else {
        status = "upcoming";
      }
    }

    ledger.push({
      id: `pay-${i + 1}`,
      monthYear: monthName,
      dueDate,
      rentAmountPKR: monthlyRentPKR,
      status,
      paidDate,
      paidAmountPKR: paidAmount,
      paymentMode,
      instrumentReference,
      receiptNumber,
    });
  }

  return ledger;
}

export const INITIAL_TENANCIES: TenancyContract[] = [
  {
    id: "lease-dha2-101",
    agreementNumber: "RENT-DHA2-2026-081",
    propertyTitle: "1 Kanal Luxury Designer House (5 Bedrooms)",
    propertyType: "House / Villa",
    address: "House 142, Street 18, Sector B, DHA Phase 2",
    city: "Islamabad",
    societyOrSector: "DHA Phase 2",

    // Landlord
    landlordName: "Brigadier (R) Tariq Mahmood",
    landlordFatherName: "Haji Abdul Rehman",
    landlordCnic: "37405-1234567-1",
    landlordPhone: "+92 300 8501234",
    landlordAddress: "House 14, Sector F-8/3, Islamabad",
    landlordBankName: "Meezan Bank Limited",
    landlordAccountTitle: "Tariq Mahmood Rentals",
    landlordIban: "PK44MEZN0001048591024001",

    // Tenant
    tenantName: "Dr. Farooq Azam",
    tenantFatherName: "Muhammad Azam Khan",
    tenantCnic: "61101-9876543-1",
    tenantPhone: "+92 321 5556677",
    tenantPermanentAddress: "Village Mohra, Tehsil Gujar Khan, District Rawalpindi",
    tenantOccupation: "Consultant Neurosurgeon (Shifa International Hospital)",
    tenantEmergencyContactName: "Tariq Azam (Brother)",
    tenantEmergencyContactPhone: "+92 333 4445566",
    tenantTotalOccupants: 5,

    // Financial Terms
    monthlyRentPKR: 280_000, // 2.80 Lakh / month
    securityDepositPKR: 560_000, // 2 months
    securityDepositMonths: 2,
    advanceRentMonths: 2,
    annualIncrementPercent: 10,
    agencyCommissionTenantPKR: 140_000, // 15 days rent
    agencyCommissionLandlordPKR: 140_000,

    // Dates
    startDate: "2026-08-01",
    endDate: "2027-06-30",
    tenancyTenureMonths: 11,
    noticePeriodDays: 30,
    status: "active",

    // Utilities
    electricityMeterNo: "IESCO-4819204",
    electricityReadingStart: "14820 kWh",
    gasMeterNo: "SNGPL-0941829",
    gasReadingStart: "0842 HM3",
    waterMaintenanceChargesPKR: 8_500,

    // Witnesses
    witness1Name: "Malik Jahangir Khan",
    witness1Cnic: "37405-5551234-9",
    witness1Phone: "+92 321 5551122",
    witness2Name: "Raja Kamran Abbasi",
    witness2Cnic: "61101-4443322-1",
    witness2Phone: "+92 333 4443322",

    assignedAgentName: "Hamza Malik",
    policeVerificationSubmitted: true,
    policeStationName: "Sihala Police Station / Khidmat Markaz DHA",

    paymentLedger: generateRentLedger(280_000, "2026-08-01", 11),
    createdAt: "2026-07-28T10:00:00Z",
    updatedAt: "2026-10-24T10:00:00Z",
  },
  {
    id: "lease-f7-202",
    propertyTitle: "Executive 4-Bedroom Diplomatic House",
    agreementNumber: "RENT-ISB-F7-042",
    propertyType: "House / Villa",
    address: "House 28, Street 12, Sector F-7/2",
    city: "Islamabad",
    societyOrSector: "Sector F-7/2",

    // Landlord
    landlordName: "Sheikh Nadeem Akhtar",
    landlordFatherName: "Sheikh Akhtar Hussain",
    landlordCnic: "37405-3344556-7",
    landlordPhone: "+92 300 9988776",
    landlordAddress: "Sector F-6/1, Islamabad",
    landlordBankName: "Standard Chartered Bank Pakistan",
    landlordAccountTitle: "Nadeem Akhtar Collection",
    landlordIban: "PK19SCBL0003891024810291",

    // Tenant
    tenantName: "Jean-Pierre Laurent (UN Mission)",
    tenantFatherName: "Claude Laurent",
    tenantCnic: "F-PASS-74910293",
    tenantPhone: "+92 301 7776655",
    tenantPermanentAddress: "Embassy of France / UN WFP Country Office Islamabad",
    tenantOccupation: "Country Director (International NGO / UN Staff)",
    tenantEmergencyContactName: "Security Office WFP",
    tenantEmergencyContactPhone: "+92 51 2894100",
    tenantTotalOccupants: 3,

    // Financial Terms
    monthlyRentPKR: 450_000, // 4.50 Lakh / month
    securityDepositPKR: 1_350_000, // 3 months
    securityDepositMonths: 3,
    advanceRentMonths: 6,
    annualIncrementPercent: 10,
    agencyCommissionTenantPKR: 225_000,
    agencyCommissionLandlordPKR: 225_000,

    // Dates
    startDate: "2026-06-01",
    endDate: "2027-05-31",
    tenancyTenureMonths: 12,
    noticePeriodDays: 60,
    status: "active",

    // Utilities
    electricityMeterNo: "IESCO-9988112",
    electricityReadingStart: "29104 kWh",
    gasMeterNo: "SNGPL-7744112",
    gasReadingStart: "1290 HM3",
    waterMaintenanceChargesPKR: 15_000,

    // Witnesses
    witness1Name: "Hamza Malik",
    witness1Cnic: "37405-8899001-3",
    witness1Phone: "+92 300 8541290",
    witness2Name: "Chaudhry Pervaiz Iqbal",
    witness2Cnic: "37405-5554433-2",
    witness2Phone: "+92 300 5554433",

    assignedAgentName: "Hamza Malik",
    policeVerificationSubmitted: true,
    policeStationName: "Kohsar Police Station F-7",

    paymentLedger: generateRentLedger(450_000, "2026-06-01", 12),
    createdAt: "2026-05-25T11:00:00Z",
    updatedAt: "2026-10-24T09:30:00Z",
  },
  {
    id: "lease-bahria8-303",
    propertyTitle: "Brand New 10 Marla Double Unit House",
    agreementNumber: "RENT-BHR8-2026-119",
    propertyType: "House / Villa",
    address: "House 74, Street 9, Usman Block, Bahria Town Phase 8",
    city: "Rawalpindi",
    societyOrSector: "Bahria Town Phase 8",

    // Landlord
    landlordName: "Chaudhry Tanveer",
    landlordFatherName: "Chaudhry Muhammad Afzal",
    landlordCnic: "37405-5544112-8",
    landlordPhone: "+92 300 5544112",
    landlordAddress: "Chaudhry Plaza, Saddar Rawalpindi",
    landlordBankName: "Habib Bank Limited (HBL)",
    landlordAccountTitle: "Tanveer Afzal Rentals",
    landlordIban: "PK82HABB0002981047291002",

    // Tenant
    tenantName: "Muhammad Usman Qureshi",
    tenantFatherName: "Muhammad Tariq Qureshi",
    tenantCnic: "61101-3344556-9",
    tenantPhone: "+92 321 4455891",
    tenantPermanentAddress: "House 18, Block D, Satellite Town, Rawalpindi",
    tenantOccupation: "Senior Software Architect (Tech Firm)",
    tenantEmergencyContactName: "Bilal Qureshi",
    tenantEmergencyContactPhone: "+92 333 5566778",
    tenantTotalOccupants: 4,

    // Financial Terms
    monthlyRentPKR: 140_000, // 1.40 Lakh / month
    securityDepositPKR: 280_000, // 2 months
    securityDepositMonths: 2,
    advanceRentMonths: 1,
    annualIncrementPercent: 10,
    agencyCommissionTenantPKR: 70_000,
    agencyCommissionLandlordPKR: 70_000,

    // Dates
    startDate: "2026-09-01",
    endDate: "2027-07-31",
    tenancyTenureMonths: 11,
    noticePeriodDays: 30,
    status: "active",

    // Utilities
    electricityMeterNo: "IESCO-5544119",
    electricityReadingStart: "00412 kWh",
    gasMeterNo: "SNGPL-3322119",
    gasReadingStart: "0018 HM3",
    waterMaintenanceChargesPKR: 5_000,

    // Witnesses
    witness1Name: "Rana Imran",
    witness1Cnic: "37405-6677889-1",
    witness1Phone: "+92 300 6677889",
    witness2Name: "Syed Bilal Shah",
    witness2Cnic: "61101-2233887-5",
    witness2Phone: "+92 321 2233887",

    assignedAgentName: "Ayesha Khan",
    policeVerificationSubmitted: true,
    policeStationName: "Rawat Police Station / Khidmat Markaz Phase 7",

    paymentLedger: generateRentLedger(140_000, "2026-09-01", 11),
    createdAt: "2026-08-25T14:00:00Z",
    updatedAt: "2026-10-24T08:00:00Z",
  },
  {
    id: "lease-e11-404",
    propertyTitle: "2-Bedroom Luxury Executive Apartment",
    agreementNumber: "RENT-E11-2026-056",
    propertyType: "Apartment / Flat",
    address: "Flat 402, 4th Floor, Fortune Residency, Sector E-11/2",
    city: "Islamabad",
    societyOrSector: "Sector E-11/2",

    // Landlord
    landlordName: "Malik Aftab Awan",
    landlordFatherName: "Malik Muhammad Awan",
    landlordCnic: "37405-9911223-9",
    landlordPhone: "+92 300 9911223",
    landlordAddress: "Sector F-10/3, Islamabad",
    landlordBankName: "Bank Alfalah Limited",
    landlordAccountTitle: "Aftab Awan",
    landlordIban: "PK56ALFH0001849102840192",

    // Tenant
    tenantName: "Bilal Ahmed Qureshi",
    tenantFatherName: "Bashir Ahmed",
    tenantCnic: "37405-5566778-3",
    tenantPhone: "+92 333 5566778",
    tenantPermanentAddress: "Mohalla Chah, Abbottabad, KPK",
    tenantOccupation: "Corporate Financial Analyst",
    tenantEmergencyContactName: "Zahid Ahmed",
    tenantEmergencyContactPhone: "+92 345 8899112",
    tenantTotalOccupants: 2,

    // Financial Terms
    monthlyRentPKR: 85_000, // 85k / month
    securityDepositPKR: 170_000, // 2 months
    securityDepositMonths: 2,
    advanceRentMonths: 1,
    annualIncrementPercent: 10,
    agencyCommissionTenantPKR: 42_500,
    agencyCommissionLandlordPKR: 42_500,

    // Dates
    startDate: "2026-05-15",
    endDate: "2027-04-14",
    tenancyTenureMonths: 11,
    noticePeriodDays: 30,
    status: "active",

    // Utilities
    electricityMeterNo: "IESCO-2233441",
    electricityReadingStart: "12840 kWh",
    gasMeterNo: "SNGPL-SubMeter",
    gasReadingStart: "0490 HM3",
    waterMaintenanceChargesPKR: 6_000,

    // Witnesses
    witness1Name: "Kamran Siddiqui",
    witness1Cnic: "37405-5566778-3",
    witness1Phone: "+92 333 5566778",
    witness2Name: "Faisal Abbasi",
    witness2Cnic: "61101-8899112-7",
    witness2Phone: "+92 345 8899112",

    assignedAgentName: "Ayesha Khan",
    policeVerificationSubmitted: true,
    policeStationName: "Golra Sharif Police Station / Khidmat Markaz F-6",

    paymentLedger: generateRentLedger(85_000, "2026-05-15", 11),
    createdAt: "2026-05-10T16:00:00Z",
    updatedAt: "2026-10-24T11:00:00Z",
  },
];
