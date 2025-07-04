# Pricing Update - January 2025

## Overview
This document outlines the pricing changes made to the Atomik Trading platform and the steps needed to deploy them on January 1st, 2025.

## Changes Made

### Price Updates
- **Starter Plan** (internally "pro" in Stripe):
  - Monthly: $49 → **$129**
  - Yearly: $468 → **$1,290** (~$107.50/month, 17% discount)
  
- **Pro Plan** (internally "elite" in Stripe):
  - Monthly: $89 → **$189**
  - Yearly: $828 → **$1,890** (~$157.50/month, 17% discount)

- **Lifetime Plan**:
  - Consolidated both tiers into a single **$2,990** unlimited lifetime plan
  - Previous: $990 (Starter) and $1,990 (Pro) separate lifetime options

### Code Changes
All changes have been committed to the `pricing-update-jan2025` branch:
- Updated pricing in `src/components/pages/PricingPage.js`
- Modified lifetime plan to use single environment variable
- Added "Unlimited Everything" text for lifetime option

## Deployment Steps for January 1st

### 1. Create New Prices in Stripe Dashboard

Navigate to your Stripe Dashboard and add the following prices:

#### For "Pro" Product (displays as Starter):
- **New Monthly Price**: $129
- **New Yearly Price**: $1,290

#### For "Elite" Product (displays as Pro):
- **New Monthly Price**: $189
- **New Yearly Price**: $1,890
- **New Lifetime Price**: $2,990 (one-time payment)

**Important**: Create NEW price objects, do NOT modify existing ones. This ensures current subscribers keep their rates.

### 2. Update Environment Variables

Add these new price IDs to your `.env` file:

```bash
# Pro tier (Starter) prices
REACT_APP_STRIPE_PRICE_PRO_MONTHLY=price_xxx    # New $129 monthly price ID
REACT_APP_STRIPE_PRICE_PRO_YEARLY=price_xxx     # New $1,290 yearly price ID

# Elite tier (Pro) prices  
REACT_APP_STRIPE_PRICE_ELITE_MONTHLY=price_xxx  # New $189 monthly price ID
REACT_APP_STRIPE_PRICE_ELITE_YEARLY=price_xxx   # New $1,890 yearly price ID

# Single lifetime price for both tiers
REACT_APP_STRIPE_PRICE_LIFETIME=price_xxx       # New $2,990 lifetime price ID
```

### 3. Deploy the Code

1. **Merge the branch**:
   ```bash
   git checkout main
   git merge pricing-update-jan2025
   ```

2. **Push to production**:
   ```bash
   git push origin main
   ```

3. **Deploy your application** (using your normal deployment process)

## Important Notes

### Existing Customers
- Current subscribers will continue at their locked-in rates
- They will only see new pricing if they choose to change plans
- This is standard practice and expected behavior

### Stripe Configuration
- The internal Stripe product names (Pro/Elite) differ from display names (Starter/Pro)
- This is already handled in the code - no changes needed
- The lifetime plan is attached to the Elite product but available for both tiers

### Testing Recommendations
Before going live:
1. Test the checkout flow with Stripe test mode
2. Verify environment variables are correctly set
3. Ensure the pricing page displays correctly
4. Test both monthly and yearly billing options
5. Verify the lifetime plan checkout works

## Rollback Plan
If issues arise:
1. Revert environment variables to old price IDs
2. Run: `git revert HEAD` to undo the merge
3. Redeploy with original code

## Questions or Issues?
The pricing structure is designed to:
- Increase revenue for bootstrap phase
- Maintain customer satisfaction with grandfathered rates
- Simplify lifetime offering to single unlimited option

Contact support if you encounter any issues during deployment.