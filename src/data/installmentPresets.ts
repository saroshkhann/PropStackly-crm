import { InstallmentPlan, InstallmentMilestone, InstallmentFrequency } from "@/types/installment";

export function generateInstallmentMilestones(
  totalPricePKR: number,
  downPaymentPercent: number,
  tenureYears: number,
  frequency: InstallmentFrequency,
  possessionPercent: number,
  startDateStr?: string
): InstallmentMilestone[] {
  const milestones: InstallmentMilestone[] = [];
  const start = startDateStr ? new Date(startDateStr) : new Date();

  const downPaymentAmount = Math.round((totalPricePKR * downPaymentPercent) / 100);
  const possessionAmount = Math.round((totalPricePKR * possessionPercent) / 100);
  const remainingForInstallments = totalPricePKR - downPaymentAmount - possessionAmount;

  const totalCycles =
    frequency === "monthly"
      ? tenureYears * 12
      : frequency === "quarterly"
      ? tenureYears * 4
      : tenureYears * 2;

  const perInstallmentAmount = Math.round(remainingForInstallments / totalCycles);

  // 1. Milestone 0: Down Payment
  milestones.push({
    id: `m-0`,
    milestoneNumber: 0,
    title: `Booking & Down Payment (${downPaymentPercent}%)`,
    dueDate: start.toISOString().split("T")[0],
    amountPKR: downPaymentAmount,
    status: "paid",
    paidDate: start.toISOString().split("T")[0],
    paidAmountPKR: downPaymentAmount,
    paymentMode: "Pay Order",
    instrumentReference: "PO-Meezan-784102",
    receiptNumber: "RCP-BOOK-001",
    developerCommissionPercent: 50,
    developerCommissionPKR: Math.round(totalPricePKR * 0.02 * 0.5), // 50% of 2%
    commissionReleased: true,
    notes: "Initial booking confirmed. File allocation letter issued.",
  });

  // Month interval step
  const monthInterval = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 6;

  // 2. Installments
  for (let i = 1; i <= totalCycles; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i * monthInterval);
    const dateStr = d.toISOString().split("T")[0];

    // Determine sample status based on date relative to current time
    const today = new Date();
    let status: InstallmentMilestone["status"] = "upcoming";
    let paidDate: string | undefined = undefined;
    let paidAmount: number | undefined = undefined;
    let paymentMode: InstallmentMilestone["paymentMode"] = undefined;
    let instrumentReference: string | undefined = undefined;
    let receiptNumber: string | undefined = undefined;

    if (d < today) {
      if (i <= 2) {
        status = "paid";
        paidDate = dateStr;
        paidAmount = perInstallmentAmount;
        paymentMode = "Online Raast / IBFT";
        instrumentReference = `RAAST-${Math.floor(100000 + Math.random() * 900000)}`;
        receiptNumber = `RCP-INS-${i.toString().padStart(2, "0")}`;
      } else {
        status = "overdue";
      }
    } else {
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        status = "due_soon";
      } else {
        status = "upcoming";
      }
    }

    const frequencyLabel =
      frequency === "monthly"
        ? `Month ${i} Installment`
        : frequency === "quarterly"
        ? `Quarter ${i} Installment`
        : `Half-Year ${i} Installment`;

    milestones.push({
      id: `m-${i}`,
      milestoneNumber: i,
      title: frequencyLabel,
      dueDate: dateStr,
      amountPKR: perInstallmentAmount,
      status,
      paidDate,
      paidAmountPKR: paidAmount,
      paymentMode,
      instrumentReference,
      receiptNumber,
      developerCommissionPercent: i === Math.floor(totalCycles / 2) ? 50 : 0,
      developerCommissionPKR: i === Math.floor(totalCycles / 2) ? Math.round(totalPricePKR * 0.02 * 0.5) : 0,
      commissionReleased: status === "paid" && i === Math.floor(totalCycles / 2),
      notes: status === "overdue" ? "Late fee surcharge applicable after 15-day grace period." : undefined,
    });
  }

  // 3. Possession Milestone
  const possessionDate = new Date(start);
  possessionDate.setFullYear(possessionDate.getFullYear() + tenureYears);
  milestones.push({
    id: `m-possession`,
    milestoneNumber: totalCycles + 1,
    title: `On Physical Possession & NDC Clear (${possessionPercent}%)`,
    dueDate: possessionDate.toISOString().split("T")[0],
    amountPKR: possessionAmount,
    status: "upcoming",
    developerCommissionPercent: 0,
    developerCommissionPKR: 0,
    commissionReleased: false,
    notes: "Payable upon handover of physical site demarcation and utility meters.",
  });

  return milestones;
}

export const INITIAL_INSTALLMENT_PLANS: InstallmentPlan[] = [
  {
    id: "plan-pvc-101",
    planTitle: "Park View City - 1 Kanal Overseas Block",
    projectName: "Park View City",
    developerName: "Vision Group (Aleem Khan)",
    unitOrFileNumber: "PVC-OVS-8421",
    propertyType: "Residential Plot",
    size: "1 Kanal",
    city: "Islamabad",
    totalPricePKR: 45_000_000, // 4.5 Crore
    downPaymentPKR: 6_750_000,
    downPaymentPercent: 15,
    tenureYears: 3,
    frequency: "quarterly",
    totalInstallments: 12,
    possessionDuePKR: 4_500_000, // 10%
    clientName: "Raja Kamran Abbasi",
    clientPhone: "+92 300 8541290",
    clientCnic: "37405-1234567-3",
    leadId: "lead-101",
    assignedAgentName: "Hamza Malik",
    bankAccountTitle: "Park View City Collection Account",
    bankName: "Meezan Bank Limited",
    bankIban: "PK44MEZN0001048591024001",
    lateFeeMonthlyPercent: 1.5,
    milestones: generateInstallmentMilestones(45_000_000, 15, 3, "quarterly", 10, "2026-01-15"),
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-10-24T10:00:00Z",
  },
  {
    id: "plan-csc-202",
    planTitle: "Capital Smart City - 10 Marla Executive Block",
    projectName: "Capital Smart City",
    developerName: "FDHL & Habib Rafiq (Pvt) Ltd",
    unitOrFileNumber: "CSC-EXEC-5912",
    propertyType: "Residential Plot",
    size: "10 Marla",
    city: "Islamabad",
    totalPricePKR: 24_000_000, // 2.4 Crore
    downPaymentPKR: 4_800_000,
    downPaymentPercent: 20,
    tenureYears: 3.5,
    frequency: "quarterly",
    totalInstallments: 14,
    possessionDuePKR: 2_400_000,
    clientName: "Muhammad Usman Qureshi",
    clientPhone: "+92 321 4455891",
    clientCnic: "61101-9876543-1",
    leadId: "lead-102",
    assignedAgentName: "Ayesha Khan",
    bankAccountTitle: "Future Developments Holdings Escrow",
    bankName: "Habib Bank Limited (HBL)",
    bankIban: "PK82HABB0002981047291002",
    lateFeeMonthlyPercent: 2.0,
    milestones: generateInstallmentMilestones(24_000_000, 20, 3.5, "quarterly", 10, "2025-11-01"),
    createdAt: "2025-11-01T12:00:00Z",
    updatedAt: "2026-10-24T09:00:00Z",
  },
  {
    id: "plan-18-303",
    planTitle: "Eighteen Islamabad - 4-Bedroom Luxury Villa",
    projectName: "Eighteen Islamabad",
    developerName: "Ora Developers & Kohistan",
    unitOrFileNumber: "18-VIL-0419",
    propertyType: "Villa / House",
    size: "2 Kanal",
    city: "Islamabad",
    totalPricePKR: 165_000_000, // 16.5 Crore
    downPaymentPKR: 24_750_000,
    downPaymentPercent: 15,
    tenureYears: 4,
    frequency: "quarterly",
    totalInstallments: 16,
    possessionDuePKR: 16_500_000,
    clientName: "Sheikh Nadeem Akhtar",
    clientPhone: "+92 300 9988776",
    clientCnic: "37405-3344556-7",
    leadId: "lead-103",
    assignedAgentName: "Hamza Malik",
    bankAccountTitle: "Elite Estates Eighteen Collection",
    bankName: "Bank Alfalah Premier",
    bankIban: "PK19ALFH0003891024810291",
    lateFeeMonthlyPercent: 1.5,
    milestones: generateInstallmentMilestones(165_000_000, 15, 4, "quarterly", 10, "2025-06-20"),
    createdAt: "2025-06-20T14:30:00Z",
    updatedAt: "2026-10-24T08:30:00Z",
  },
  {
    id: "plan-dhaq-404",
    planTitle: "DHA Quetta - 1 Kanal Early Bird Allocation File",
    projectName: "DHA Quetta",
    developerName: "Defence Housing Authority",
    unitOrFileNumber: "DHAQ-EB-1082",
    propertyType: "Residential Plot",
    size: "1 Kanal",
    city: "Islamabad",
    totalPricePKR: 18_000_000, // 1.8 Crore
    downPaymentPKR: 3_600_000,
    downPaymentPercent: 20,
    tenureYears: 3,
    frequency: "quarterly",
    totalInstallments: 12,
    possessionDuePKR: 1_800_000,
    clientName: "Chaudhry Pervaiz Iqbal",
    clientPhone: "+92 300 5554433",
    clientCnic: "37405-5554433-2",
    leadId: "lead-104",
    assignedAgentName: "Ayesha Khan",
    bankAccountTitle: "DHA Quetta Main Project Collection",
    bankName: "Askari Bank Limited",
    bankIban: "PK56ASKA0001849102840192",
    lateFeeMonthlyPercent: 2.0,
    milestones: generateInstallmentMilestones(18_000_000, 20, 3, "quarterly", 10, "2026-03-01"),
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-10-24T11:00:00Z",
  },
];
