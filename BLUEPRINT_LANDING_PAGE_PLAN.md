# Blueprint Landing Page - Implementation Plan

## Overview

Build a lead magnet landing page at `/blueprint` that:
1. Captures email addresses
2. Sends emails to Beehiiv via API
3. Triggers automated email nurture sequence
4. Matches existing Atomik branding perfectly

---

## Technical Stack (Matching Existing App)

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Chakra UI |
| Styling | Chakra UI + Emotion (glassmorphism, dark theme) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | FastAPI (Python) |
| Email Service | Beehiiv API (new integration) |
| Colors | Primary: #00C6E0 (cyan), Background: #000000 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER FLOW                                │
└─────────────────────────────────────────────────────────────┘

YouTube/TikTok/X → "Link in bio" → atomiktrades.com/blueprint
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  Landing Page   │
                                   │  /blueprint     │
                                   │                 │
                                   │  [Email Input]  │
                                   │  [Get Access]   │
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  FastAPI        │
                                   │  /api/v1/leads  │
                                   │                 │
                                   │  - Validate     │
                                   │  - Store locally│
                                   │  - Send to      │
                                   │    Beehiiv API  │
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  Beehiiv        │
                                   │                 │
                                   │  - Store sub    │
                                   │  - Trigger      │
                                   │    automation   │
                                   │  - Send 7-email │
                                   │    sequence     │
                                   └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  Success Page   │
                                   │  /blueprint/    │
                                   │  success        │
                                   │                 │
                                   │  "Check your    │
                                   │   inbox!"       │
                                   └─────────────────┘
```

---

## Implementation Tasks

### Phase 1: Frontend Landing Page

#### Task 1.1: Create BlueprintPage Component
**File:** `frontend/src/components/pages/BlueprintPage/BlueprintPage.js`

**Sections:**
1. Hero Section
   - Headline: "Automate Your First Trading Strategy in 30 Minutes"
   - Subheadline: "Free 20-minute video guide. No fluff, just the exact steps."
   - Email capture form (single input + button)

2. What You'll Learn Section
   - 4 bullet points with checkmark icons

3. Who This Is For Section
   - 4 audience bullet points

4. Social Proof Section (optional)
   - Testimonial quotes from Discord users

5. Second CTA Section
   - Repeat email capture form

**Design Specs:**
- Match existing LandingPage.js glassmorphism style
- Cyan (#00C6E0) accent color
- Black background with gradient orbs
- Framer Motion entrance animations
- Mobile-responsive (Chakra breakpoints)

#### Task 1.2: Create Success Page
**File:** `frontend/src/components/pages/BlueprintPage/BlueprintSuccess.js`

**Content:**
- Success message with checkmark animation
- "Check your inbox" instructions
- Link to join Discord while waiting
- Secondary CTA to explore marketplace

#### Task 1.3: Add Routes
**File:** `frontend/src/App.js`

Add routes:
```javascript
<Route path="/blueprint" element={<BlueprintPage />} />
<Route path="/blueprint/success" element={<BlueprintSuccess />} />
```

#### Task 1.4: Create Email Capture Form Component
**File:** `frontend/src/components/pages/BlueprintPage/EmailCaptureForm.js`

**Features:**
- Single email input with validation
- Submit button with loading state
- Error handling and display
- Success redirect to /blueprint/success

---

### Phase 2: Backend API

#### Task 2.1: Create Lead Capture Endpoint
**File:** `fastapi_backend/app/api/v1/endpoints/leads.py`

```python
@router.post("/leads/blueprint")
async def capture_blueprint_lead(
    email: str,
    first_name: Optional[str] = None,
    background_tasks: BackgroundTasks
):
    """
    Capture email for blueprint lead magnet.
    1. Validate email
    2. Store in local database (for backup/analytics)
    3. Send to Beehiiv API
    4. Return success
    """
```

#### Task 2.2: Create Beehiiv Service
**File:** `fastapi_backend/app/services/beehiiv/beehiiv_service.py`

```python
class BeehiivService:
    def __init__(self):
        self.api_key = settings.BEEHIIV_API_KEY
        self.publication_id = settings.BEEHIIV_PUBLICATION_ID
        self.base_url = "https://api.beehiiv.com/v2"

    async def add_subscriber(
        self,
        email: str,
        utm_source: Optional[str] = None,
        referring_site: Optional[str] = None
    ) -> dict:
        """Add a subscriber to Beehiiv publication"""

    async def get_subscriber(self, email: str) -> dict:
        """Check if subscriber exists"""
```

#### Task 2.3: Create Lead Model (Optional - for local storage)
**File:** `fastapi_backend/app/models/lead.py`

```python
class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    source = Column(String)  # "blueprint", "creator-playbook", etc.
    utm_source = Column(String, nullable=True)
    utm_medium = Column(String, nullable=True)
    utm_campaign = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    synced_to_beehiiv = Column(Boolean, default=False)
```

#### Task 2.4: Add Environment Variables
**File:** `fastapi_backend/.env`

```
BEEHIIV_API_KEY=your_api_key_here
BEEHIIV_PUBLICATION_ID=your_publication_id_here
```

#### Task 2.5: Register Router
**File:** `fastapi_backend/app/api/v1/api.py`

```python
from app.api.v1.endpoints import leads
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
```

---

### Phase 3: Beehiiv Configuration

#### Task 3.1: Get Beehiiv API Credentials
1. Go to Beehiiv → Settings → Integrations → API
2. Create new API key
3. Copy Publication ID from URL or settings
4. Add to backend environment variables

#### Task 3.2: Create Email Automation in Beehiiv
1. Go to Automations → Create New
2. Trigger: "When someone subscribes"
3. Add 7 emails with delays:

| Email | Delay | Subject |
|-------|-------|---------|
| 1 | Immediate | Your automation blueprint is ready |
| 2 | 2 days | Why most traders lose (it's not the strategy) |
| 3 | 2 days | He made $7,500 selling his strategy |
| 4 | 3 days | Why I didn't use the other platforms |
| 5 | 2 days | Is $129/month worth it? (Let's do the math) |
| 6 | 2 days | See it running live (Discord invite inside) |
| 7 | 3 days | Last call (then I'll leave you alone) |

#### Task 3.3: Create Email Templates in Beehiiv
Copy the 7 email templates from MARKETING_PLAN_90DAY.md into Beehiiv:
- Replace [LINK] placeholders with actual URLs
- Replace [DISCORD LINK] with Discord invite
- Replace [TRIAL LINK] with trial signup URL
- Add tracking parameters to links

---

### Phase 4: Testing & Launch

#### Task 4.1: Test Full Flow
1. Submit test email on /blueprint
2. Verify email appears in Beehiiv subscribers
3. Verify automation triggers
4. Verify all 7 emails arrive (use test mode if available)
5. Test all links in emails work

#### Task 4.2: Test Edge Cases
- Duplicate email submission
- Invalid email format
- API failure handling
- Mobile responsiveness

#### Task 4.3: Update Social Bios
Once live, update all social bios with:
```
Free guide: atomiktrades.com/blueprint
```

---

## File Structure (New Files)

```
frontend/src/components/pages/BlueprintPage/
├── BlueprintPage.js          # Main landing page
├── BlueprintSuccess.js       # Success/thank you page
├── EmailCaptureForm.js       # Reusable email form
└── index.js                  # Exports

fastapi_backend/app/
├── api/v1/endpoints/
│   └── leads.py              # Lead capture endpoint
├── services/beehiiv/
│   ├── __init__.py
│   └── beehiiv_service.py    # Beehiiv API integration
└── models/
    └── lead.py               # Lead database model (optional)
```

---

## Landing Page Copy

### Hero Section

**Headline:**
```
Automate Your First Trading Strategy in 30 Minutes
```

**Subheadline:**
```
Free 20-minute video guide. No fluff, just the exact steps to connect TradingView alerts to your broker.
```

**CTA Button:**
```
Get Free Access →
```

### What You'll Learn Section

```
✓ The 3 components every automated strategy needs
✓ Step-by-step TradingView webhook setup
✓ Live demo connecting to your broker
✓ Common mistakes that blow up accounts
```

### Who This Is For Section

```
• Traders tired of watching charts all day
• TradingView users who want to automate alerts
• Prop traders managing multiple accounts
• Anyone who's lost money from emotional decisions
```

### Footer Note
```
No spam. Unsubscribe anytime. We respect your inbox.
```

---

## Beehiiv API Reference

### Add Subscriber
```bash
POST https://api.beehiiv.com/v2/publications/{publication_id}/subscriptions

Headers:
  Authorization: Bearer {api_key}
  Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "reactivate_existing": false,
  "send_welcome_email": false,  # We'll use automation instead
  "utm_source": "blueprint_landing",
  "utm_medium": "website",
  "referring_site": "atomiktrades.com"
}
```

### Response
```json
{
  "data": {
    "id": "sub_xxxxx",
    "email": "user@example.com",
    "status": "active",
    "created_at": "2024-12-21T00:00:00Z"
  }
}
```

---

## Timeline Estimate

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1 | Frontend Landing Page | ☐ Not Started |
| Phase 2 | Backend API | ☐ Not Started |
| Phase 3 | Beehiiv Configuration | ☐ Not Started |
| Phase 4 | Testing & Launch | ☐ Not Started |

---

## Next Steps (Tonight)

1. ☐ Get Beehiiv API key and Publication ID
2. ☐ Create BlueprintPage.js component
3. ☐ Create backend endpoint
4. ☐ Create Beehiiv service
5. ☐ Test the integration
6. ☐ Set up email automation in Beehiiv

---

## Notes

- Keep the page simple - one goal (email capture)
- No navigation distractions
- Mobile-first design
- Fast loading (lazy load non-critical elements)
- Track conversions with UTM parameters
