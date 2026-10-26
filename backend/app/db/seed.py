import sys
import os
from decimal import Decimal
from datetime import datetime, timezone, timedelta

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.agency import Agency, AgencyMembership
from app.models.user import User
from app.models.lead import Lead, LeadNote, LeadActivity, LeadAssignment, LeadPropertyAssociation
from app.models.property import Property
from app.models.task import FollowUp, SiteVisit
from app.models.deal import Deal


def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_agency = db.query(Agency).filter(Agency.name == "Apex Properties Islamabad").first()
        if existing_agency:
            print("Database already contains seed data for Apex Properties Islamabad. Cleaning up old data for clean seed...")
            # Optional: drop tables and recreate for fresh clean seed
            db.close()
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()

        print("Seeding agencies...")
        # 1. Primary Agency
        apex_agency = Agency(
            name="Apex Properties Islamabad",
            tagline="Premier Residential & Commercial Real Estate Consultants",
            ntn_number="8274192-3",
            contact_email="contact@apexproperties.pk",
            contact_phone="+92 51 2894100",
            whatsapp_business_phone="+92 300 5550192",
            address="Executive Heights, 3rd Floor, Sector F-8 Markaz, Islamabad",
            city="Islamabad",
            currency_format="Crore_Lakh",
            auto_assignment_rule="round_robin",
            default_followup_reminder_hours="24",
            enable_whatsapp_notifications=True,
            enable_sms_alerts=True,
        )
        db.add(apex_agency)

        # 2. Secondary Agency for Multi-Tenant Isolation Testing
        lahore_agency = Agency(
            name="Al-Haram Real Estate Lahore",
            tagline="Trust and Excellence in Lahore Real Estate",
            ntn_number="9182374-1",
            contact_email="info@lahorerealestate.pk",
            contact_phone="+92 42 35789100",
            whatsapp_business_phone="+92 321 4448888",
            address="Plaza 45, Commercial Area, DHA Phase 5, Lahore",
            city="Lahore",
            currency_format="Crore_Lakh",
        )
        db.add(lahore_agency)
        db.flush()

        print("Seeding users...")
        # Users for Apex Properties
        hamza_broker = User(
            email="admin@propstackly.com",
            hashed_password=get_password_hash("Admin123!"),
            full_name="Hamza Malik",
            phone="+92 300 5550192",
            role_title="Principal Broker & CEO",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            monthly_target_pkr=Decimal("150000000.00"),
        )
        ayesha_agent = User(
            email="ayesha@propstackly.com",
            hashed_password=get_password_hash("Agent123!"),
            full_name="Ayesha Khan",
            phone="+92 321 8881234",
            role_title="Senior Sales Manager",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            monthly_target_pkr=Decimal("120000000.00"),
        )
        bilal_agent = User(
            email="bilal@propstackly.com",
            hashed_password=get_password_hash("Agent123!"),
            full_name="Bilal Tariq",
            phone="+92 333 4445566",
            role_title="Commercial Specialist",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            monthly_target_pkr=Decimal("90000000.00"),
        )
        zainab_agent = User(
            email="zainab@propstackly.com",
            hashed_password=get_password_hash("Agent123!"),
            full_name="Zainab Shah",
            phone="+92 345 6789012",
            role_title="Luxury Residential Consultant",
            avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            monthly_target_pkr=Decimal("75000000.00"),
        )

        # User for Lahore Agency
        tariq_broker = User(
            email="tariq@lahorerealestate.pk",
            hashed_password=get_password_hash("Lahore123!"),
            full_name="Tariq Mehmood",
            phone="+92 321 4448888",
            role_title="Managing Director",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            monthly_target_pkr=Decimal("120000000.00"),
        )

        db.add_all([hamza_broker, ayesha_agent, bilal_agent, zainab_agent, tariq_broker])
        db.flush()

        # Memberships
        db.add_all([
            AgencyMembership(agency_id=apex_agency.id, user_id=hamza_broker.id, role="owner", is_active=True),
            AgencyMembership(agency_id=apex_agency.id, user_id=ayesha_agent.id, role="manager", is_active=True),
            AgencyMembership(agency_id=apex_agency.id, user_id=bilal_agent.id, role="agent", is_active=True),
            AgencyMembership(agency_id=apex_agency.id, user_id=zainab_agent.id, role="agent", is_active=True),
            AgencyMembership(agency_id=lahore_agency.id, user_id=tariq_broker.id, role="owner", is_active=True),
        ])
        db.flush()

        print("Seeding properties...")
        # Properties for Apex Properties
        prop_1 = Property(
            agency_id=apex_agency.id,
            title="1 Kanal Luxury Designer Villa",
            slug="1-kanal-luxury-designer-villa-dha-2",
            type="House / Villa",
            city="Islamabad",
            location="Sector B, Street 14",
            society="DHA Phase 2 Islamabad",
            price_pkr=Decimal("85000000.00"),  # Rs. 8.50 Crore
            area_size="1 Kanal (500 Sq. Yds)",
            bedrooms=5,
            bathrooms=6,
            status="available",
            featured=True,
            image_url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
            description="Brand new modern Italian kitchen, Spanish porcelain tiles, solar net-metering installed (15kW), servant quarters, and landscaped front lawn.",
            assigned_agent_id=ayesha_agent.id,
        )
        prop_2 = Property(
            agency_id=apex_agency.id,
            title="10 Marla Brand New Modern House",
            slug="10-marla-brand-new-modern-house-bahria-7",
            type="House / Villa",
            city="Rawalpindi",
            location="Sector C, Commercial Avenue",
            society="Bahria Town Phase 7 Rawalpindi",
            price_pkr=Decimal("42000000.00"),  # Rs. 4.20 Crore
            area_size="10 Marla (250 Sq. Yds)",
            bedrooms=4,
            bathrooms=5,
            status="under_negotiation",
            featured=True,
            image_url="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
            description="Architect-designed double-story residence with double height lobby, Ash wood woodwork, imported bath fittings, and parking for 2 SUVs.",
            assigned_agent_id=zainab_agent.id,
        )
        prop_3 = Property(
            agency_id=apex_agency.id,
            title="5 Kanal Elite Luxury Farmhouse",
            slug="5-kanal-elite-luxury-farmhouse-gulberg",
            type="Farmhouse",
            city="Islamabad",
            location="Block A, Executive Farmhouses",
            society="Gulberg Greens Islamabad",
            price_pkr=Decimal("185000000.00"),  # Rs. 18.50 Crore
            area_size="5 Kanal",
            bedrooms=6,
            bathrooms=8,
            status="available",
            featured=True,
            image_url="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
            description="Stunning resort-style farmhouse with swimming pool, fruit orchards, smart security automation, independent staff annex, and uninterrupted underground electricity.",
            assigned_agent_id=hamza_broker.id,
        )
        prop_4 = Property(
            agency_id=apex_agency.id,
            title="1 Kanal Corner Residential Plot",
            slug="1-kanal-corner-plot-dha-5",
            type="Residential Plot",
            city="Islamabad",
            location="Sector A, Facing Park",
            society="DHA Phase 5 Islamabad",
            price_pkr=Decimal("34000000.00"),  # Rs. 3.40 Crore
            area_size="1 Kanal",
            bedrooms=0,
            bathrooms=0,
            status="available",
            featured=False,
            image_url="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
            description="Prime location corner plot directly facing the 40-kanal community park. Fully developed with possession, ready for immediate house construction.",
            assigned_agent_id=ayesha_agent.id,
        )
        prop_5 = Property(
            agency_id=apex_agency.id,
            title="500 Sq. Ft Corporate Office Suite",
            slug="500-sqft-corporate-office-blue-area",
            type="Commercial Plaza",
            city="Islamabad",
            location="Floor 8, Corporate Tower, Jinnah Avenue",
            society="Blue Area Islamabad",
            price_pkr=Decimal("29000000.00"),  # Rs. 2.90 Crore
            area_size="500 Sq. Ft",
            bedrooms=0,
            bathrooms=1,
            status="available",
            featured=False,
            image_url="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
            description="Grade-A office space with high-speed fiber connectivity, reserved basement parking, 24/7 backup power generators, and high rental yield.",
            assigned_agent_id=bilal_agent.id,
        )
        prop_6 = Property(
            agency_id=apex_agency.id,
            title="3-Bed Luxury Panoramic Penthouse",
            slug="3-bed-luxury-panoramic-penthouse-silver-oaks",
            type="Luxury Apartment",
            city="Islamabad",
            location="Tower B, Silver Oaks Condominiums",
            society="Sector F-10 Markaz Islamabad",
            price_pkr=Decimal("68000000.00"),  # Rs. 6.80 Crore
            area_size="3,200 Sq. Ft",
            bedrooms=3,
            bathrooms=4,
            status="sold",
            featured=False,
            image_url="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
            description="Breathtaking panoramic views of Margalla Hills, double private balcony, fitted Poggenpohl kitchen, gym & club access.",
            assigned_agent_id=ayesha_agent.id,
        )

        # Lahore Property (Belongs strictly to Lahore Agency)
        lahore_prop = Property(
            agency_id=lahore_agency.id,
            title="1 Kanal Modern House DHA Phase 6 Lahore",
            slug="1-kanal-modern-house-dha-6-lahore",
            type="House / Villa",
            city="Lahore",
            location="Block J",
            society="DHA Phase 6 Lahore",
            price_pkr=Decimal("92000000.00"),
            area_size="1 Kanal",
            bedrooms=5,
            bathrooms=6,
            status="available",
            image_url="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
            description="Exclusive DHA Lahore property with Spanish bath tiles and basement entertainment lounge.",
            assigned_agent_id=tariq_broker.id,
        )

        db.add_all([prop_1, prop_2, prop_3, prop_4, prop_5, prop_6, lahore_prop])
        db.flush()

        print("Seeding leads...")
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        two_days_ago = now - timedelta(days=2)
        three_days_ago = now - timedelta(days=3)

        lead_1 = Lead(
            agency_id=apex_agency.id,
            full_name="Chaudhry Kamran Aslam",
            phone="+92 300 8501234",
            email="kamran.aslam@gmail.com",
            city="Islamabad",
            source="Facebook Ads",
            status="site_visit_scheduled",
            priority="high",
            budget_pkr=Decimal("90000000.00"),  # Rs. 9.00 Crore
            property_type_interest="House / Villa",
            preferred_locations="DHA Phase 2 Islamabad",
            purpose="Own Residence",
            assigned_agent_id=ayesha_agent.id,
            last_contacted_at=yesterday,
            next_followup_at=now + timedelta(days=1),
        )
        lead_2 = Lead(
            agency_id=apex_agency.id,
            full_name="Dr. Haroon Rasheed",
            phone="+92 321 5556789",
            email="dr.haroon@shifa.com.pk",
            city="Islamabad",
            source="Zameen.com",
            status="negotiation",
            priority="high",
            budget_pkr=Decimal("45000000.00"),  # Rs. 4.50 Crore
            property_type_interest="House / Villa",
            preferred_locations="Bahria Town Phase 7 Rawalpindi",
            purpose="Own Residence",
            assigned_agent_id=zainab_agent.id,
            last_contacted_at=now,
            next_followup_at=now + timedelta(hours=6),
        )
        lead_3 = Lead(
            agency_id=apex_agency.id,
            full_name="Malik Zubair Ahmed",
            phone="+92 333 9991122",
            email="zubair.textiles@hotmail.com",
            city="Islamabad",
            source="Referral",
            status="won",
            priority="high",
            budget_pkr=Decimal("85000000.00"),  # Rs. 8.50 Crore
            property_type_interest="House / Villa",
            preferred_locations="DHA Phase 2 Islamabad",
            purpose="Own Residence",
            assigned_agent_id=ayesha_agent.id,
            last_contacted_at=two_days_ago,
        )
        lead_4 = Lead(
            agency_id=apex_agency.id,
            full_name="Sardar Usman Abbasi",
            phone="+92 345 5123456",
            email="usman.abbasi@gmail.com",
            city="Islamabad",
            source="WhatsApp",
            status="follow_up",
            priority="medium",
            budget_pkr=Decimal("35000000.00"),  # Rs. 3.50 Crore
            property_type_interest="Residential Plot",
            preferred_locations="DHA Phase 5 Islamabad",
            purpose="Investment",
            assigned_agent_id=ayesha_agent.id,
            last_contacted_at=yesterday,
            next_followup_at=now + timedelta(days=2),
        )
        lead_5 = Lead(
            agency_id=apex_agency.id,
            full_name="Sheikh Farhan Ali",
            phone="+92 301 4455667",
            email="farhan@sheikhtraders.com",
            city="Islamabad",
            source="Phone Call",
            status="contacted",
            priority="high",
            budget_pkr=Decimal("190000000.00"),  # Rs. 19.00 Crore
            property_type_interest="Farmhouse",
            preferred_locations="Gulberg Greens Islamabad",
            purpose="Investment",
            assigned_agent_id=hamza_broker.id,
            last_contacted_at=now,
            next_followup_at=now + timedelta(days=1),
        )
        lead_6 = Lead(
            agency_id=apex_agency.id,
            full_name="Mian Tahir Iqbal",
            phone="+92 312 8877665",
            email="tahir.iqbal@techpakistan.org",
            city="Islamabad",
            source="Facebook Ads",
            status="new",
            priority="medium",
            budget_pkr=Decimal("30000000.00"),  # Rs. 3.00 Crore
            property_type_interest="Commercial Plaza",
            preferred_locations="Blue Area Islamabad",
            purpose="Commercial Rental",
            assigned_agent_id=bilal_agent.id,
            last_contacted_at=None,
            next_followup_at=now + timedelta(hours=4),
        )
        lead_7 = Lead(
            agency_id=apex_agency.id,
            full_name="Raja Waseem Akram",
            phone="+92 302 7766554",
            email="waseem.raja@yahoo.com",
            city="Rawalpindi",
            source="Walk-in",
            status="new",
            priority="low",
            budget_pkr=Decimal("18000000.00"),
            property_type_interest="Residential Plot",
            preferred_locations="Multi Gardens B-17",
            purpose="Investment",
            assigned_agent_id=None,
            last_contacted_at=None,
        )

        # Lead for Lahore Agency (Must NOT be accessible to Apex Properties!)
        lahore_lead = Lead(
            agency_id=lahore_agency.id,
            full_name="Haji Muhammad Nawaz",
            phone="+92 322 1122334",
            email="haji.nawaz@lahorespinning.pk",
            city="Lahore",
            source="Referral",
            status="negotiation",
            priority="high",
            budget_pkr=Decimal("95000000.00"),
            property_type_interest="House / Villa",
            preferred_locations="DHA Phase 6 Lahore",
            purpose="Own Residence",
            assigned_agent_id=tariq_broker.id,
        )

        lead_8 = Lead(
            agency_id=apex_agency.id,
            full_name="Brigadier (R) Tariq Niazi",
            phone="+92 300 5544332",
            email="tariq.niazi@gmail.com",
            city="Islamabad",
            source="WhatsApp",
            status="qualified",
            priority="high",
            budget_pkr=Decimal("120000000.00"),
            property_type_interest="House / Villa",
            preferred_locations="DHA Phase 2 Islamabad",
            purpose="Own Residence",
            assigned_agent_id=bilal_agent.id,
            last_contacted_at=yesterday,
            next_followup_at=now + timedelta(days=1),
        )

        db.add_all([lead_1, lead_2, lead_3, lead_4, lead_5, lead_6, lead_7, lead_8, lahore_lead])
        db.flush()

        # Seed Lead-Property Associations
        db.add_all([
            LeadPropertyAssociation(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                property_id=prop_1.id,
                notes="Primary match requested for tomorrow's client tour.",
            ),
            LeadPropertyAssociation(
                agency_id=apex_agency.id,
                lead_id=lead_2.id,
                property_id=prop_2.id,
                notes="Shortlisted luxury villa; negotiation in progress.",
            ),
        ])

        print("Seeding notes and activities...")
        # Notes & activities for Lead 1 (Chaudhry Kamran)
        db.add_all([
            LeadNote(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                user_id=ayesha_agent.id,
                author_name=ayesha_agent.full_name,
                content="Spoke with client. He is looking for a brand new 1 Kanal house with 5 bedrooms for his family. Relocating from Peshawar next month.",
            ),
            LeadNote(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                user_id=ayesha_agent.id,
                author_name=ayesha_agent.full_name,
                content="Sent photos and video walkthrough of DHA 2 Sector B Villa on WhatsApp. Client loved the interior woodwork.",
            ),
            LeadActivity(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                user_id=ayesha_agent.id,
                performed_by_name=ayesha_agent.full_name,
                type="call",
                title="Phone Discussion with Buyer",
                description="Client confirmed budget of 9.0 Crore and requested site visit on Saturday 3:30 PM.",
            ),
            LeadActivity(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                user_id=ayesha_agent.id,
                performed_by_name=ayesha_agent.full_name,
                type="whatsapp",
                title="Property Brochure Dispatched",
                description="PDF brochure for 1 Kanal Sector B DHA 2 shared via WhatsApp Business.",
            ),
        ])

        # Notes for Lead 2 (Dr. Haroon)
        db.add_all([
            LeadNote(
                agency_id=apex_agency.id,
                lead_id=lead_2.id,
                user_id=zainab_agent.id,
                author_name=zainab_agent.full_name,
                content="Doctor Sahib visited Bahria Phase 7 house with his wife yesterday. Offred Rs. 4.10 Crore. Seller demanding Rs. 4.25 Crore. Closing negotiation gap.",
            ),
            LeadActivity(
                agency_id=apex_agency.id,
                lead_id=lead_2.id,
                user_id=zainab_agent.id,
                performed_by_name=zainab_agent.full_name,
                type="meeting",
                title="In-Person Offer Negotiation",
                description="Met with seller and buyer in Bahria Civic Center office. Counter-offer under review.",
            ),
        ])

        print("Seeding follow-ups and site visits...")
        today_date = now.strftime("%Y-%m-%d")
        tomorrow_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        saturday_date = (now + timedelta(days=2)).strftime("%Y-%m-%d")

        # Follow-ups
        db.add_all([
            FollowUp(
                agency_id=apex_agency.id,
                lead_id=lead_2.id,
                assigned_agent_id=zainab_agent.id,
                scheduled_date=today_date,
                scheduled_time="14:30",
                type="Phone Call",
                notes="Call seller to get final sign-off on Rs. 4.15 Crore offer from Dr. Haroon.",
                priority="high",
                completed=False,
            ),
            FollowUp(
                agency_id=apex_agency.id,
                lead_id=lead_5.id,
                assigned_agent_id=hamza_broker.id,
                scheduled_date=today_date,
                scheduled_time="17:00",
                type="In-Person Meeting",
                notes="Meeting at F-8 office with Sheikh Farhan regarding Gulberg Greens 5 Kanal farmhouse title deed.",
                priority="high",
                completed=False,
            ),
            FollowUp(
                agency_id=apex_agency.id,
                lead_id=lead_4.id,
                assigned_agent_id=ayesha_agent.id,
                scheduled_date=tomorrow_date,
                scheduled_time="11:00",
                type="WhatsApp Message",
                notes="Send updated transfer fee breakdown for DHA Phase 5 Sector A 1 Kanal plot.",
                priority="medium",
                completed=False,
            ),
            FollowUp(
                agency_id=apex_agency.id,
                lead_id=lead_6.id,
                assigned_agent_id=bilal_agent.id,
                scheduled_date=today_date,
                scheduled_time="16:00",
                type="Phone Call",
                notes="Introductory discovery call with Mian Tahir Iqbal regarding Blue Area commercial office rental ROI.",
                priority="medium",
                completed=True,
                completed_at=now,
            ),
        ])

        # Site Visits
        db.add_all([
            SiteVisit(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                property_id=prop_1.id,
                assigned_agent_id=ayesha_agent.id,
                visit_date=saturday_date,
                visit_time="15:30",
                status="scheduled",
                notes="Buyer bringing his brother and architect to inspect structure and Italian kitchen fittings.",
            ),
            SiteVisit(
                agency_id=apex_agency.id,
                lead_id=lead_2.id,
                property_id=prop_2.id,
                assigned_agent_id=zainab_agent.id,
                visit_date=today_date,
                visit_time="11:30",
                status="completed_interested",
                notes="Client inspected the property and loved the layout. Requested final price negotiation.",
                client_feedback="House condition is outstanding. Ready to purchase if price is finalized around 4.15 Crore.",
            ),
            SiteVisit(
                agency_id=apex_agency.id,
                lead_id=lead_5.id,
                property_id=prop_3.id,
                assigned_agent_id=hamza_broker.id,
                visit_date=tomorrow_date,
                visit_time="16:00",
                status="scheduled",
                notes="Visit Gulberg Greens Farmhouse with Sheikh Farhan. Arrange gate clearance.",
            ),
        ])

        print("Seeding Pakistani deal pipeline...")
        # 1. Token Stage Deal
        db.add(
            Deal(
                agency_id=apex_agency.id,
                lead_id=lead_1.id,
                property_id=prop_3.id,
                agent_id=bilal_agent.id,
                title="Sector B-17 Multi Gardens 1 Kanal - Booking Lock",
                stage="token",
                deal_value_pkr=Decimal("38000000.00"),  # Rs. 3.80 Crore
                token_amount_pkr=Decimal("1000000.00"),  # Rs. 10 Lakh
                token_date=today_date,
                token_type="pakka_token",
                commission_side="both_sides_2pct",
                commission_percentage=Decimal("2.00"),
                commission_pkr=Decimal("760000.00"),
                agency_split_percentage=Decimal("50.00"),
                agent_split_percentage=Decimal("50.00"),
                agency_commission_pkr=Decimal("380000.00"),
                agent_commission_pkr=Decimal("380000.00"),
                settlement_status="pending",
                notes="Pakka token received via pay order. Seller agrees to lock inventory for 14 days pending Bayana.",
            )
        )

        # 2. Bayana Stage Deal
        db.add(
            Deal(
                agency_id=apex_agency.id,
                lead_id=lead_2.id,
                property_id=prop_2.id,
                agent_id=zainab_agent.id,
                title="10 Marla Bahria Phase 7 Designer Villa - Signed Iqrarnama",
                stage="bayana",
                deal_value_pkr=Decimal("41500000.00"),  # Rs. 4.15 Crore
                token_amount_pkr=Decimal("1000000.00"),
                token_date=today_date,
                token_type="pakka_token",
                bayana_amount_pkr=Decimal("6000000.00"),  # Rs. 60 Lakh
                bayana_date=today_date,
                iqrarnama_number="STAMP-RWP-2026-9912",
                commission_side="both_sides_2pct",
                commission_percentage=Decimal("2.00"),
                commission_pkr=Decimal("830000.00"),
                agency_split_percentage=Decimal("50.00"),
                agent_split_percentage=Decimal("50.00"),
                agency_commission_pkr=Decimal("415000.00"),
                agent_commission_pkr=Decimal("415000.00"),
                settlement_status="pending",
                notes="Formal Iqrarnama-e-Farokht executed on Rs. 1,200 stamp paper. Closing fixed for 30 days.",
            )
        )

        # 3. NOC & Verification Stage Deal
        db.add(
            Deal(
                agency_id=apex_agency.id,
                lead_id=lead_4.id,
                property_id=prop_4.id,
                agent_id=ayesha_agent.id,
                title="Park View City Overseas Block 10 Marla - NOC Processing",
                stage="noc_verification",
                deal_value_pkr=Decimal("26000000.00"),  # Rs. 2.60 Crore
                token_amount_pkr=Decimal("500000.00"),
                token_type="pakka_token",
                bayana_amount_pkr=Decimal("4000000.00"),
                bayana_date=today_date,
                iqrarnama_number="STAMP-ISB-2026-4410",
                noc_authority="Park View City Society Head Office & CDA",
                ndc_cleared=True,
                commission_side="both_sides_2pct",
                commission_percentage=Decimal("2.00"),
                commission_pkr=Decimal("520000.00"),
                agency_split_percentage=Decimal("50.00"),
                agent_split_percentage=Decimal("50.00"),
                agency_commission_pkr=Decimal("260000.00"),
                agent_commission_pkr=Decimal("260000.00"),
                settlement_status="advance_released",
                notes="Society No Demand Certificate (NDC) cleared. Advance tax challan FBR 236K/236C generated.",
            )
        )

        # 4. Final Transfer Stage Deal
        db.add(
            Deal(
                agency_id=apex_agency.id,
                lead_id=lead_5.id,
                property_id=prop_5.id,
                agent_id=hamza_broker.id,
                title="Gulberg Greens 4 Kanal Luxury Farmhouse - Registry & Transfer",
                stage="final_transfer",
                deal_value_pkr=Decimal("195000000.00"),  # Rs. 19.50 Crore
                token_amount_pkr=Decimal("5000000.00"),
                token_type="pakka_token",
                bayana_amount_pkr=Decimal("35000000.00"),
                bayana_date=today_date,
                iqrarnama_number="STAMP-ISB-2026-0041",
                noc_authority="IBECHS / Gulberg Greens Transfer Directorate",
                ndc_cleared=True,
                transfer_date=saturday_date,
                registry_number="GLB-TRF-2026-8801",
                commission_side="both_sides_2pct",
                commission_percentage=Decimal("2.00"),
                commission_pkr=Decimal("3900000.00"),  # Rs. 39 Lakh
                agency_split_percentage=Decimal("50.00"),
                agent_split_percentage=Decimal("50.00"),
                agency_commission_pkr=Decimal("1950000.00"),  # Rs. 19.50 Lakh
                agent_commission_pkr=Decimal("1950000.00"),   # Rs. 19.50 Lakh
                settlement_status="pending",
                notes="Pay orders for remaining balance prepared. Biometric appointment scheduled for Saturday.",
            )
        )

        # 5. Completed & Settled Deal
        db.add(
            Deal(
                agency_id=apex_agency.id,
                lead_id=lead_3.id,
                property_id=prop_1.id,
                agent_id=ayesha_agent.id,
                title="1 Kanal DHA Phase 2 Sector B Villa - Transferred & Settled",
                stage="completed",
                deal_value_pkr=Decimal("85000000.00"),  # Rs. 8.50 Crore
                token_amount_pkr=Decimal("2000000.00"),
                token_type="pakka_token",
                bayana_amount_pkr=Decimal("15000000.00"),
                iqrarnama_number="STAMP-ISB-2026-1188",
                noc_authority="DHA Islamabad Phase 2 Transfer Office",
                ndc_cleared=True,
                transfer_date=today_date,
                registry_number="DHA-ISB-TRF-9021",
                commission_side="both_sides_2pct",
                commission_percentage=Decimal("2.00"),
                commission_pkr=Decimal("1700000.00"),  # Rs. 17 Lakh
                agency_split_percentage=Decimal("50.00"),
                agent_split_percentage=Decimal("50.00"),
                agency_commission_pkr=Decimal("850000.00"),  # Rs. 8.50 Lakh
                agent_commission_pkr=Decimal("850000.00"),   # Rs. 8.50 Lakh
                settlement_status="fully_settled",
                expected_close_date=today_date,
                closed_at=now,
                notes="Full payment and registry transfer successfully completed. 50/50 commission split disbursed to agency and senior consultant.",
            )
        )

        db.commit()
        print("Database seeded successfully with authentic Pakistani real estate data and multi-tenant setup!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
