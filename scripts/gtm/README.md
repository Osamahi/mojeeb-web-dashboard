# Google Tag Manager Automation

Automate the setup of Google Tag Manager tags, triggers, and variables for Mojeeb analytics tracking.

## Features

- ✅ Automated creation of Data Layer variables
- ✅ Custom event triggers for signup and agent creation
- ✅ OAuth2 authentication with token persistence
- ✅ Dry-run mode to preview changes
- ✅ Status reporting of current GTM container
- ✅ Idempotent operations (safe to run multiple times)

## Prerequisites

### 1. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable "Tag Manager API":
   - Go to APIs & Services → Library
   - Search for "Tag Manager API"
   - Click "Enable"

### 2. OAuth2 Credentials

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Desktop app**
4. Name: `GTM Automation`
5. Click "Create"
6. Download the JSON file
7. Save it as `credentials.json` in this directory

### 3. Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values:
   ```bash
   # GTM Account ID - Find in GTM URL after /accounts/
   GTM_ACCOUNT_ID=123456

   # GTM Container ID (with GTM- prefix)
   GTM_CONTAINER_ID=GTM-PQZD9VM8

   # Google Analytics 4 Measurement ID
   GA4_MEASUREMENT_ID=G-XXXXXXXXXX

   # Meta Pixel ID (15 digits)
   META_PIXEL_ID=123456789012345
   ```

#### Finding Your GTM Account ID

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Look at the URL: `tagmanager.google.com/#/container/accounts/123456/containers/789`
3. The number after `/accounts/` is your Account ID (e.g., `123456`)

#### Finding Your GA4 Measurement ID

1. Go to [analytics.google.com](https://analytics.google.com)
2. Admin → Data Streams
3. Select your web stream
4. Copy the **Measurement ID** (starts with `G-`)

#### Finding Your Meta Pixel ID

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Data Sources → Select your Pixel
3. Copy the **Pixel ID** (15-digit number at the top)

## Installation

```bash
# Install dependencies
npm install
```

## Usage

### Step 1: Authenticate

Run this once to authenticate with Google:

```bash
npm run auth
```

This will:
1. Open a browser window for Google OAuth consent
2. Ask you to authorize the app
3. Save the token to `~/.gtm-credentials.json`

### Step 2: Preview Changes (Dry Run)

See what will be created without making actual changes:

```bash
npm run dry-run
```

### Step 3: Create GTM Configuration

Create variables and triggers in GTM:

```bash
npm run setup
```

This will create:
- **6 Data Layer Variables** (user_id, user_email, user_name, signup_method, agent_id, agent_name)
- **2 Custom Event Triggers** (signup_successful, agent_created)

### Step 4: Check Container Status

View current state of your GTM container:

```bash
npm run status
```

### Step 5: Manual Steps (GTM UI Required)

**The script creates variables and triggers, but TAGS must be created manually** due to API complexity.

After running `npm run setup`, go to GTM and create these tags:

#### GA4 Tags

1. **GA4 Configuration Tag**
   - Tag Type: Google Analytics: GA4 Configuration
   - Measurement ID: `G-XXXXXXXXXX`
   - Trigger: All Pages

2. **GA4 Signup Event**
   - Tag Type: Google Analytics: GA4 Event
   - Configuration Tag: (select GA4 Configuration)
   - Event Name: `sign_up`
   - Parameters:
     - `method` → `{{DL - Signup Method}}`
     - `user_id` → `{{DL - User ID}}`
   - Trigger: Event - Signup Successful

3. **GA4 Agent Created Event**
   - Tag Type: Google Analytics: GA4 Event
   - Configuration Tag: (select GA4 Configuration)
   - Event Name: `agent_created`
   - Parameters:
     - `agent_id` → `{{DL - Agent ID}}`
     - `agent_name` → `{{DL - Agent Name}}`
   - Trigger: Event - Agent Created

#### Meta Pixel Tags

1. **Meta Pixel Base Code**
   - Tag Type: Custom HTML
   - HTML: See `.env` for Meta Pixel base code template
   - Trigger: All Pages

2. **Meta Signup Event**
   - Tag Type: Custom HTML
   - HTML: `fbq('track', 'CompleteRegistration', { method: {{DL - Signup Method}} });`
   - Trigger: Event - Signup Successful

3. **Meta Agent Created Event**
   - Tag Type: Custom HTML
   - HTML: `fbq('trackCustom', 'AgentCreated', { agent_id: {{DL - Agent ID}} });`
   - Trigger: Event - Agent Created

### Step 6: Test in Preview Mode

1. In GTM, click **Preview**
2. Enter your website URL
3. Test the events:
   - Sign up with Google → Should fire signup event
   - Create an agent → Should fire agent_created event

### Step 7: Publish

1. In GTM, click **Submit** (blue button)
2. Add version name and description
3. Click **Publish**

## Alternative: Manual Container Import

If the API setup is too complex, we provide a pre-configured container JSON:

```bash
# Generate container JSON (future feature)
npm run export-json
```

Then import it manually:
1. GTM → Admin → Import Container
2. Upload the JSON file
3. Choose workspace
4. Review and publish

## Troubleshooting

### Authentication Failed

```
Error: invalid_grant
```

**Solution:** Delete `~/.gtm-credentials.json` and run `npm run auth` again

### API Not Enabled

```
Error: Tag Manager API has not been used
```

**Solution:** Enable Tag Manager API in Google Cloud Console

### Container Not Found

```
Error: Container not found
```

**Solution:** Verify `GTM_ACCOUNT_ID` and `GTM_CONTAINER_ID` in `.env`

### Rate Limit Exceeded

```
Error: Rate limit exceeded
```

**Solution:** The script includes automatic retry with exponential backoff. If it persists, wait a few minutes and try again.

## File Structure

```
scripts/gtm/
├── setup-gtm.js          # Main automation script
├── package.json          # Dependencies
├── .env.example          # Configuration template
├── .env                  # Your actual config (not committed)
├── credentials.json      # OAuth credentials (not committed)
└── README.md            # This file
```

## Security Notes

**Do NOT commit these files:**
- `.env` - Contains API keys
- `credentials.json` - OAuth credentials
- `~/.gtm-credentials.json` - Authentication token

These files are in `.gitignore` by default.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Tag Manager API documentation: https://developers.google.com/tag-platform/tag-manager/api/v2
3. Check GTM UI for detailed error messages

## License

MIT
