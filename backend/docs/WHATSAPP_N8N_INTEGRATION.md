# PropStackly CRM: Official WhatsApp Business Platform & n8n Integration Guide

This guide details the end-to-end integration architecture, Meta compliance requirements, security model, and testing procedures for connecting PropStackly CRM with the official Meta WhatsApp Business Platform using an n8n automation pipeline.

---

## 1. Architectural Overview

```
┌────────────────────────┐         Outbound Webhook        ┌─────────────────────────┐
│   PropStackly CRM      │ ──────────────────────────────> │      n8n Workflow       │
│  (FastAPI Backend)     │   POST /webhook (HMAC-SHA256)   │                         │
│                        │                                 │ 1. Validate Signature   │
│ • Source of Truth      │                                 │ 2. Transform Payload    │
│ • Opt-in Guard         │                                 │ 3. Call Meta Graph API  │
└────────────────────────┘                                 └────────────┬────────────┘
            ▲                                                           │
            │ Inbound Delivery Status Callback                          ▼
            │ POST /api/v1/automations/webhooks/n8n/callback  ┌─────────────────────────┐
            └──────────────────────────────────────────────── │  Meta WhatsApp Cloud    │
                                 (Signed with Agency Secret)  │        API v21.0        │
                                                              └─────────────────────────┘
```

### Core Design Principles
1. **FastAPI is the Source of Truth**: All lead data, agent assignments, delivery audit logs, and in-app notifications originate and reside in the CRM database.
2. **Decoupled Outbound Automation**: Core lead creation never halts or errors if an external n8n webhook times out or experiences a transient outage.
3. **Truth-in-Messaging**: Outbound dispatches are marked `"delivered"` to the webhook queue. A message is **never** marked as `"confirmed"` (sent/delivered) until Meta or the provider confirms success via an authenticated callback.
4. **Zero Frontend Secret Exposure**: API secrets and HMAC tokens are configured strictly via the backend and never exposed in client bundles or public endpoints.

---

## 2. Meta WhatsApp Business Platform Requirements

To dispatch automated WhatsApp messages to Pakistani numbers (+92 3XX XXXXXXX) and international clients without account restrictions, real estate developers and agencies must satisfy the following official Meta criteria:

### A. Business Verification
- **Meta Business Portfolio (Manager)**: An authenticated business account at [business.facebook.com](https://business.facebook.com).
- **Pakistani Legal Entity Verification**: Official submission of NTN (National Tax Number) certificate from FBR (Federal Board of Revenue) and business registration documents (e.g. SECP incorporation or municipal trade license).
- **Display Name Approval**: The WhatsApp display name (e.g., *Apex Properties Islamabad*) must exactly reflect the branding on your official website, portal listings, and NTN certificate.

### B. Two Conversation Windows & Template Approval
Under Meta Cloud API policies:
1. **User-Initiated (Customer Care Window - 24 Hours)**:
   - Starts when a buyer sends a message to your WhatsApp Business number.
   - Allows free-form messaging for 24 hours.
2. **Business-Initiated (Outside 24 Hours / New Inquiries)**:
   - **Must use a pre-approved WhatsApp Message Template**. Free-form text messages are rejected by Meta with HTTP 400.
   - Templates fall into three categories: **Utility** (recommended for inquiries & follow-ups), **Marketing**, and **Authentication**.

### C. Opt-In Consent & Anti-Spam Compliance (PTA & Meta Rules)
- **Explicit Consent**: Under Pakistan Telecommunication Authority (PTA) regulations and Meta Commercial Terms, you must obtain opt-in consent before initiating contact.
- **Opt-in Sources**:
  - Facebook Lead Ads containing the opt-in checkbox *"I consent to receiving property details on WhatsApp"*.
  - Website forms with explicit confirmation.
  - Direct buyer requests ("Please WhatsApp me the floor plan").
- **Opt-Out Handling**: If a client replies with "STOP" or "UNSUBSCRIBE", the CRM flags the lead and suppresses further automated outbound triggers.

---

## 3. Approved Message Templates

### Template 1: `welcome_lead_intro` (Category: UTILITY)
- **Language**: English (`en_US`) or Urdu (`ur_PK`)
- **Body Text**:
  > *Assalam-o-Alaikum {{1}}! Thank you for your inquiry with {{2}}. Your dedicated property consultant {{3}} has received your request regarding {{4}} and will assist you shortly.*
- **Variable Mapping**:
  - `{{1}}`: Client Full Name (e.g. *Chaudhry Kamran Aslam*)
  - `{{2}}`: Agency Name (e.g. *Apex Properties Islamabad*)
  - `{{3}}`: Assigned Agent Name (e.g. *Ayesha Khan*)
  - `{{4}}`: Property Interest / Society (e.g. *1 Kanal Villa in DHA Phase 2*)

### Template 2: `site_visit_reminder_2h` (Category: UTILITY)
- **Body Text**:
  > *Dear {{1}}, your scheduled site tour for {{2}} is confirmed for {{3}} at {{4}}. Your property guide is {{5}} ({{6}}). Please reply to this message if you need directions.*
- **Variable Mapping**:
  - `{{1}}`: Client Name | `{{2}}`: Property Title | `{{3}}`: Date | `{{4}}`: Time | `{{5}}`: Agent Name | `{{6}}`: Agent Phone

---

## 4. Setting Up the n8n Workflow

> **Quick Import**: A pre-built, ready-to-import n8n workflow file is available at:
> [`backend/docs/propstackly_whatsapp_n8n_workflow.json`](file:///Users/mac2019/projects/real-estate-CRM/backend/docs/propstackly_whatsapp_n8n_workflow.json)
> In n8n: Click **Workflows -> Import from File** and select this file to get the complete 4-node pipeline instantly.

### Step 1: Webhook Trigger Node (Inbound from PropStackly)
1. In n8n, create a new workflow: `PropStackly CRM -> WhatsApp Cloud API`.
2. Add a **Webhook** node:
   - **HTTP Method**: `POST`
   - **Path**: `propstackly-new-lead`
   - **Authentication**: None (handled via HMAC signature verification in code or Crypto node)
3. Copy the production/test Webhook URL (e.g., `https://n8n.youragency.com/webhook/propstackly-new-lead`).

### Step 2: Signature Verification (Crypto Node / Code Node)
Validate that `X-PropStackly-Signature` matches the computed HMAC-SHA256 of the raw payload using your agency's `n8n_webhook_secret`.

### Step 3: Meta WhatsApp Cloud API HTTP Node
Add an **HTTP Request** node to dispatch the official template:
- **Method**: `POST`
- **URL**: `https://graph.facebook.com/v21.0/{{$env.WHATSAPP_PHONE_NUMBER_ID}}/messages`
- **Headers**:
  - `Authorization`: `Bearer {{$env.META_WHATSAPP_SYSTEM_USER_TOKEN}}`
  - `Content-Type`: `application/json`
- **Body (JSON)**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "={{$json.whatsapp_config.recipient_phone}}",
  "type": "template",
  "template": {
    "name": "={{$json.whatsapp_config.template_name}}",
    "language": {
      "code": "en_US"
    },
    "components": "={{$json.whatsapp_config.components}}"
  }
}
```

### Step 4: Provider Confirmation Callback Node
When Meta returns HTTP 200 with `{"messages": [{"id": "wamid.HBg..."}]}`, post the confirmation back to PropStackly CRM:
- **HTTP Method**: `POST`
- **URL**: `https://api.propstackly.com/api/v1/automations/webhooks/n8n/callback?agency_id={{$json.agency_id}}`
- **Headers**:
  - `Content-Type`: `application/json`
  - `X-PropStackly-Signature`: `{{$node["ComputeHMAC"].json["signature"]}}`
- **Body**:
```json
{
  "event_id": "={{$json.event_id}}",
  "lead_id": "={{$json.lead.id}}",
  "status": "delivered",
  "provider_message_id": "={{$json.messages[0].id}}",
  "recipient_phone": "={{$json.lead.phone}}",
  "template_name": "welcome_lead_intro"
}
```

---

## 5. Development & Testing Procedure

### Safe Local Simulation Mode
You can test the entire pipeline locally without registering with Meta or consuming WhatsApp API message credits:

1. **Configure Agency Automation in CRM Settings**:
   - Go to **Settings -> Lead Inflow & Automation**.
   - Enable **WhatsApp Business Automation**.
   - Input your test n8n webhook URL.
   - Enter a test secret (e.g. `test_dev_secret_394812`).
2. **Click "Test Webhook Connection"**:
   - Sends a `propstackly.test_ping` event with HMAC signature.
   - Verifies network connectivity and latency in milliseconds.
3. **Create a Test Lead**:
   - Add a lead with a Pakistani mobile number (e.g., `+92 300 5550192`).
   - Observe the audit entry in `GET /api/v1/automations/logs` with `status: "delivered"`.
4. **Simulate Provider Confirmation**:
   - Send a mock callback payload to `POST /api/v1/automations/webhooks/n8n/callback`:
   ```bash
   curl -X POST "http://localhost:8000/api/v1/automations/webhooks/n8n/callback?agency_id=<AGENCY_ID>" \
     -H "Content-Type: application/json" \
     -H "X-PropStackly-Signature: <HMAC_SIG>" \
     -d '{
       "lead_id": "<LEAD_ID>",
       "status": "delivered",
       "provider_message_id": "wamid.test_mock_12345",
       "template_name": "welcome_lead_intro"
     }'
   ```
   - The lead's activity timeline will immediately record:
     `"WhatsApp Template Delivered (welcome_lead_intro) - Confirmed by Provider."`
   - The assigned sales agent receives an in-app notification confirming delivery.
