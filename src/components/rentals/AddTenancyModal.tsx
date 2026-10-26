"use client";

import React, { useState } from "react";
import { X, Plus, Key, Building, User, Calendar, ShieldCheck, Check, DollarSign } from "lucide-react";
import { TenancyContract } from "@/types/rental";
import { generateRentLedger } from "@/data/rentalPresets";
import { formatPKR } from "@/lib/formatters";
import { pkrToUrduWords } from "@/lib/pkrWords";
import { useCRM } from "@/context/CRMContext";

interface AddTenancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenancy: (newContract: TenancyContract) => void;
}

export function AddTenancyModal({
  isOpen,
  onClose,
  onAddTenancy,
}: AddTenancyModalProps) {
  const { currentAgent } = useCRM();

  // Property
  const [propertyTitle, setPropertyTitle] = useState("1 Kanal Luxury House (5 Bedrooms)");
  const [propertyType, setPropertyType] = useState<TenancyContract["propertyType"]>("House / Villa");
  const [address, setAddress] = useState("House 142, Street 18, Sector B, DHA Phase 2");
  const [city, setCity] = useState<TenancyContract["city"]>("Islamabad");
  const [societyOrSector, setSocietyOrSector] = useState("DHA Phase 2");

  // Landlord
  const [landlordName, setLandlordName] = useState("Brigadier (R) Tariq Mahmood");
  const [landlordFatherName, setLandlordFatherName] = useState("Haji Abdul Rehman");
  const [landlordCnic, setLandlordCnic] = useState("37405-1234567-1");
  const [landlordPhone, setLandlordPhone] = useState("+92 300 8501234");
  const [landlordAddress, setLandlordAddress] = useState("House 14, Sector F-8/3, Islamabad");

  // Tenant
  const [tenantName, setTenantName] = useState("Dr. Farooq Azam");
  const [tenantFatherName, setTenantFatherName] = useState("Muhammad Azam Khan");
  const [tenantCnic, setTenantCnic] = useState("61101-9876543-1");
  const [tenantPhone, setTenantPhone] = useState("+92 321 5556677");
  const [tenantPermanentAddress, setTenantPermanentAddress] = useState("Village Mohra, Tehsil Gujar Khan, District Rawalpindi");
  const [tenantOccupation, setTenantOccupation] = useState("Consultant Specialist");
  const [tenantTotalOccupants, setTenantTotalOccupants] = useState(4);

  // Financials
  const [monthlyRentPKR, setMonthlyRentPKR] = useState(250_000);
  const [securityDepositMonths, setSecurityDepositMonths] = useState(2);
  const [advanceRentMonths, setAdvanceRentMonths] = useState(1);
  const [annualIncrementPercent, setAnnualIncrementPercent] = useState(10);

  // Dates
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [tenancyTenureMonths, setTenancyTenureMonths] = useState(11);

  // Utilities
  const [electricityMeterNo, setElectricityMeterNo] = useState("IESCO-4819204");
  const [electricityReadingStart, setElectricityReadingStart] = useState("14820 kWh");
  const [gasMeterNo, setGasMeterNo] = useState("SNGPL-0941829");
  const [gasReadingStart, setGasReadingStart] = useState("0842 HM3");
  const [waterMaintenanceChargesPKR, setWaterMaintenanceChargesPKR] = useState(8_500);
  const [policeStationName, setPoliceStationName] = useState("Sihala Police Station / Khidmat Markaz DHA");

  if (!isOpen) return null;

  const securityDepositAmount = monthlyRentPKR * securityDepositMonths;

  // Compute End Date
  const startObj = new Date(startDate);
  const endObj = new Date(startObj);
  endObj.setMonth(endObj.getMonth() + tenancyTenureMonths);
  const endDateStr = endObj.toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentLedger = generateRentLedger(monthlyRentPKR, startDate, tenancyTenureMonths);

    const newTenancy: TenancyContract = {
      id: `lease-${Date.now()}`,
      agreementNumber: `RENT-${city.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      propertyTitle: propertyTitle.trim(),
      propertyType,
      address: address.trim(),
      city,
      societyOrSector: societyOrSector.trim(),
      landlordName: landlordName.trim(),
      landlordFatherName: landlordFatherName.trim(),
      landlordCnic: landlordCnic.trim(),
      landlordPhone: landlordPhone.trim(),
      landlordAddress: landlordAddress.trim(),
      tenantName: tenantName.trim(),
      tenantFatherName: tenantFatherName.trim(),
      tenantCnic: tenantCnic.trim(),
      tenantPhone: tenantPhone.trim(),
      tenantPermanentAddress: tenantPermanentAddress.trim(),
      tenantOccupation: tenantOccupation.trim(),
      tenantTotalOccupants,
      monthlyRentPKR,
      securityDepositPKR: securityDepositAmount,
      securityDepositMonths,
      advanceRentMonths,
      annualIncrementPercent,
      agencyCommissionTenantPKR: Math.round(monthlyRentPKR * 0.5),
      agencyCommissionLandlordPKR: Math.round(monthlyRentPKR * 0.5),
      startDate,
      endDate: endDateStr,
      tenancyTenureMonths,
      noticePeriodDays: 30,
      status: "active",
      electricityMeterNo,
      electricityReadingStart,
      gasMeterNo,
      gasReadingStart,
      waterMaintenanceChargesPKR,
      witness1Name: "Malik Tariq Mehmood",
      witness1Cnic: "37405-5551234-9",
      witness1Phone: "+92 321 5551122",
      witness2Name: "Raja Kamran Abbasi",
      witness2Cnic: "61101-4443322-1",
      witness2Phone: "+92 333 4443322",
      assignedAgentName: currentAgent?.name || "Hamza Malik",
      policeVerificationSubmitted: true,
      policeStationName,
      paymentLedger,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddTenancy(newTenancy);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#EE6427] flex items-center justify-center shadow-xs">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              Register New Tenancy & Rent Agreement (کرایہ داری اندراج)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Landlord & tenant particulars, monthly rent, security deposit, and utility handover readings
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* 1. Property Particulars */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <Building className="w-4 h-4 text-[#EE6427]" />
              Leased Property Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  required
                  value={propertyTitle}
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  placeholder="e.g. 1 Kanal Luxury House"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as TenancyContract["propertyType"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="House / Villa">House / Villa</option>
                  <option value="Apartment / Flat">Apartment / Flat</option>
                  <option value="Portion (Upper/Lower)">Portion (Upper/Lower)</option>
                  <option value="Commercial Plaza">Commercial Plaza</option>
                  <option value="Farmhouse">Farmhouse</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House 142, Street 18, Sector B, DHA Phase 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as TenancyContract["city"])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Financial Terms */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Monthly Rent & Security Deposit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Monthly Rent (PKR) *
                </label>
                <input
                  type="number"
                  required
                  value={monthlyRentPKR}
                  onChange={(e) => setMonthlyRentPKR(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 font-urdu mt-0.5 block">
                  {pkrToUrduWords(monthlyRentPKR)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Security Deposit (Months)
                </label>
                <select
                  value={securityDepositMonths}
                  onChange={(e) => setSecurityDepositMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months (Pakistani Standard)</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                </select>
                <span className="text-[10px] text-emerald-600 font-mono font-semibold mt-0.5 block">
                  Amount: {formatPKR(securityDepositAmount)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Annual Increment %
                </label>
                <select
                  value={annualIncrementPercent}
                  onChange={(e) => setAnnualIncrementPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={10}>10% Standard Legal Increase</option>
                  <option value={15}>15%</option>
                  <option value={20}>20% Commercial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Tenancy Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Tenure (Months)
                </label>
                <select
                  value={tenancyTenureMonths}
                  onChange={(e) => setTenancyTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value={11}>11 Months (Standard Residential)</option>
                  <option value={12}>1 Year</option>
                  <option value={24}>2 Years</option>
                  <option value={36}>3 Years Commercial</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Landlord & Tenant Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Landlord Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <span className="font-bold text-[#EE6427] uppercase tracking-wider text-[11px] block">
                Landlord (مالک مکان)
              </span>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-0.5">Name *</label>
                <input
                  type="text"
                  required
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-0.5">Phone *</label>
                <input
                  type="text"
                  required
                  value={landlordPhone}
                  onChange={(e) => setLandlordPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-0.5">CNIC *</label>
                <input
                  type="text"
                  required
                  value={landlordCnic}
                  onChange={(e) => setLandlordCnic(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Tenant Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px] block">
                Tenant (کرایہ دار)
              </span>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-0.5">Name *</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-0.5">Phone *</label>
                <input
                  type="text"
                  required
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-0.5">CNIC *</label>
                <input
                  type="text"
                  required
                  value={tenantCnic}
                  onChange={(e) => setTenantCnic(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4. Utility Meter Handover Readings */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Utility Meters & Handover Readings (میٹر ریڈنگز)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Electricity Meter (IESCO/LESCO)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={electricityMeterNo}
                    onChange={(e) => setElectricityMeterNo(e.target.value)}
                    placeholder="Meter #"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="text"
                    value={electricityReadingStart}
                    onChange={(e) => setElectricityReadingStart(e.target.value)}
                    placeholder="Start Reading"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Sui Gas Meter (SNGPL/SSGC)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={gasMeterNo}
                    onChange={(e) => setGasMeterNo(e.target.value)}
                    placeholder="Gas Meter #"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="text"
                    value={gasReadingStart}
                    onChange={(e) => setGasReadingStart(e.target.value)}
                    placeholder="Start Reading"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#EE6427] hover:bg-[#DE5518] text-white font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Generate Tenancy Contract</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
