# PropStackly CRM — Real Estate Lead & Property Management System

**PropStackly CRM** is a modern, high-performance real estate lead management platform purpose-built for Pakistani real estate agencies and property developers. It consolidates incoming enquiries from Facebook Ads, Zameen.com, WhatsApp Business, direct inbound calls, Graana.com, and website landing pages into an organized, high-converting sales pipeline.

---

## 🇵🇰 Pakistani Real Estate Localization
- **Currency & Denominations**: Native PKR formatting supporting **Crore (Cr)** and **Lakh / Lac** (e.g. `PKR 4.25 Cr`, `PKR 75 Lac`).
- **Target Cities & Societies**:
  - **Islamabad**: DHA Phase 2, DHA Phase 5, Bahria Town Phase 8, Gulberg Greens Farmhouses, Blue Area Corporate, Eighteen Islamabad, Sector B-17 Multi Gardens, Park View City.
  - **Rawalpindi**: Bahria Town Rawalpindi, Chaklala Scheme 3.
  - **Lahore**: DHA Lahore Phase 6, Gulberg III, Lake City.
- **Pakistani Units & Plots**: 5 Marla, 7 Marla, 10 Marla, 1 Kanal, 2 Kanal, and 4 Kanal Farmhouses.
- **WhatsApp Quick Actions**: One-click direct WhatsApp links (`wa.me`) with pre-templated Urdu/English polite greetings for instant outreach.
- **Local Phone Formats**: Clean formatting for Pakistani mobile networks (`+92 300`, `+92 321`, `+92 333`, etc.).

---

## 🚀 Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 & custom design tokens
- **Icons**: Lucide React (`lucide-react`)
- **Charts**: Recharts (`recharts`)
- **Persistence**: Reactive React Context (`CRMContext`) with automatic `localStorage` synchronization

---

## 📱 Pages Built (Phase 1 Scope)

1. **Login Page (`/login`)**:
   - Executive B2B SaaS authentication interface.
   - Quick one-click demo logins for **Hamza Malik** (Principal Broker), **Ayesha Khan** (Senior Sales Manager), and **Usman Tariq** (Consultant).

2. **Executive Dashboard (`/dashboard` & `/`)**:
   - Live KPI cards: Total Leads, New Enquiries, Follow-ups Due, Site Visits Scheduled, Pipeline Volume (PKR), and Conversion Rate.
   - Recharts visual analytics: Weekly Lead Acquisition & Site Visits, Lead Inflow by Channel.
   - Actionable widgets: Follow-ups Due Today (with one-click check & WhatsApp link), Upcoming Site Visits, and Live Activity Stream.

3. **Leads Management (`/leads`)**:
   - Multi-criteria data grid with live search across name, phone, email, and societies.
   - Filter by Pipeline Stage, Lead Source, Assigned Agent, and City.
   - Add New Lead modal with Pakistani budget & requirements validation.
   - Edit & Delete Lead dialogs.
   - Client-side **Export to CSV** generator.
   - Direct Call and WhatsApp action triggers.

4. **Lead Detail Page (`/leads/[id]`)**:
   - Complete buyer profile: Phone, Email, Target Locations, Purpose (Residence / Investment), Budget in PKR.
   - Instant Pipeline Stage changer (New -> Contacted -> Follow-up -> Site Visit -> Under Negotiation -> Deal Won -> Lost).
   - Agent reassignment.
   - **Smart Inventory Recommendations**: Automatically suggests matching properties from inventory within the client's budget.
   - Internal consultant note logger with timestamps and author signatures.
   - Chronological activity timeline.
   - Linked follow-ups and site visit tour booker.

5. **Property Inventory (`/properties`)**:
   - Toggle between **Card Grid View** and **Table View**.
   - Filters for Property Type (Plot, Villa, Commercial Plaza, Penthouse, Farmhouse), City, Society, and Availability Status.
   - Add Property Inventory modal with Marla/Kanal specifications, images, and pricing.
   - One-click **Share on WhatsApp** button prefilling listing specifications.

6. **Follow-ups Manager (`/follow-ups`)**:
   - Task management filtering by Pending, Completed, or All.
   - Schedule new follow-ups with channel selector (Phone, WhatsApp, Meeting, Transfer Papers).
   - Direct calling and WhatsApp messaging shortcuts.

7. **Site Visits Calendar (`/site-visits`)**:
   - In-person property tour coordinator for DHA, Bahria, and Gulberg Greens.
   - Schedule new site visits with guide agent and property selection.
   - Tour outcome and client feedback logger (Interested vs Not Interested).

8. **Sales Team & Performance (`/team`)**:
   - Agent leaderboard tracking PKR sales volume, active lead allocation, and target progress bars.
   - One-click **Active Profile Switcher** allowing the user to experience the CRM from any agent's view.
   - Add new team member modal.

9. **Reports & Analytics (`/reports`)**:
   - Full-funnel conversion analysis from online enquiry to deal closing.
   - Closed sales volume breakdown by society (DHA Islamabad, Gulberg Greens, Bahria, etc.).
   - Marketing Channel ROI analysis (CPL vs gross volume generated).

10. **Agency Settings (`/settings`)**:
    - Agency Profile: Name ("PropStackly Prime Properties"), FBR NTN, Blue Area Islamabad head office address.
    - Automated Lead Routing algorithm (Round Robin, Load Balanced, Senior Priority).
    - Currency preferences and WhatsApp Business API settings.
    - **Reset to Demo Data** button to quickly restore initial state anytime.

---

## 🛠️ Running the Application

### Development Server:
```bash
npm run dev
```

### Production Build & Serve:
```bash
npm run build
npm run start
```
The application will be accessible at `http://localhost:3000`.

---

## 🔮 Phase 2 Roadmap
- Python FastAPI backend with JWT authentication and webhook ingestors for Facebook Lead Ads and Zameen.com webhooks.
- PostgreSQL database schema with SQLAlchemy / asyncpg.
- Direct Meta Cloud WhatsApp API messaging inside lead detail view.
