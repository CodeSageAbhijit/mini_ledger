# Meta WhatsApp Cloud API Setup Guide for MiniLedger

MiniLedger uses the **Meta WhatsApp Cloud API** to deliver 6-digit one-time passwords (OTP) directly to users' WhatsApp accounts.

---

## 1. Cost & Free Tier Reality

- **Free Tier:** Meta provides a **free test phone number** for sandbox development.
- **Allowed Recipients:** You can send authentication OTPs to a verified list of recipient phone numbers at **₹0 cost**.
- **Production Pricing:** In production, authentication template messages are billed per delivery by country (India is approximately a fraction of a US cent per message). For testing and demo interviews, the sandbox test number + verified numbers is completely free.

---

## 2. Step-by-Step Meta Developer Setup

### Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com/) and log in.
2. Click **My Apps** > **Create App**.
3. Select **Other** as the use case > Next.
4. Select **Business** as the app type > Next.
5. Enter an app name (e.g. `MiniLedger OTP`) and create the app.

### Step 2: Add WhatsApp Product
1. On your App Dashboard, locate **WhatsApp** and click **Set up**.
2. Accept the terms to initialize the WhatsApp Business sandbox.

### Step 3: Add Verified Test Recipient
1. In the sidebar under **WhatsApp**, click **API Setup**.
2. Locate the **"To"** dropdown and select **Manage phone number list**.
3. Add your personal WhatsApp phone number (with country code `+91`).
4. Meta will send a 6-digit verification code to your WhatsApp. Enter the code to verify your number.

### Step 4: Copy API Credentials
Under **API Setup**:
1. Copy **Phone number ID** (e.g. `109876543210123`).
2. Copy the **Temporary access token** (valid for 24 hours).
   > **Tip for permanent token:** In Meta Business Manager, create a System User with `whatsapp_business_messaging` permission to generate a non-expiring token.

### Step 5: Create the Authentication Message Template
1. Under **WhatsApp** in the sidebar, open **Message Templates**.
2. Click **Create Template**.
3. Select:
   - **Category:** `Authentication`
   - **Name:** `miniledger_otp`
   - **Language:** `English` (or `en`)
4. Choose the **One-time password (OTP)** format with the **Copy Code** button.
5. Click **Submit for Review**. Authentication templates are typically approved within 2–5 minutes.

---

## 3. Configure MiniLedger `.env`

Add your credentials to `.env` in the root of the project:

```env
# OTP Delivery Channel
OTP_CHANNEL=whatsapp
OTP_FALLBACK_TO_CONSOLE=true

# WhatsApp Cloud API Credentials
WHATSAPP_ACCESS_TOKEN=your_meta_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_TEMPLATE_NAME=miniledger_otp
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_API_VERSION=v21.0
```

---

## 4. Switching Channels Zero-Code

MiniLedger uses the **`OtpSender`** interface pattern. You can switch channels at any time without changing any code:

- **WhatsApp Cloud API:** Set `OTP_CHANNEL=whatsapp`
- **Local Console (no credentials required):** Set `OTP_CHANNEL=console`
- **SMS Stub (MSG91 / Twilio ready):** Set `OTP_CHANNEL=sms`

When `OTP_FALLBACK_TO_CONSOLE=true` is enabled in non-production environments, if the WhatsApp API fails (e.g. expired token or unverified recipient), MiniLedger automatically logs the OTP code to the console so your demo never fails!
