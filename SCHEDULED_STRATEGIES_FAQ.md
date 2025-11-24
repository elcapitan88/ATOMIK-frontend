# Scheduled Strategies - User FAQ

## 🎯 For Users Who Already Have Scheduled Strategies

### **Q: Will my scheduled strategies work automatically after the fix?**
**A: YES! ✅** If you already created strategies with market hours enabled, they will work automatically once we restart the backend. You don't need to do anything.

### **Q: How do I know if my strategy has scheduling enabled?**
Look for these indicators in the UI:
- When you created the strategy, you toggled "Schedule by Market Hours" ON
- You selected one or more markets (NYSE, LONDON, ASIA/Tokyo)
- The `market_schedule` field was saved to the database with your selections

### **Q: What if I created strategies but didn't enable scheduling?**
Your strategies will continue to work manually as before. To add scheduling:
1. Edit your existing strategy
2. Toggle "Schedule by Market Hours" ON
3. Select your preferred markets
4. Save the changes

## 📊 How Scheduling Works

### **Automatic Behavior (No User Action Required)**

Once the backend restarts with the fix:

1. **Every minute**, the scheduler checks ALL strategies with `market_schedule` set
2. **If ANY selected market is OPEN** → Strategy turns ON
3. **If ALL selected markets are CLOSED** → Strategy turns OFF
4. **Manual override always works** → You can toggle on/off anytime

### **Example Scenarios**

#### User Selected: NYSE + LONDON
- **3:00 AM EST**: London opens → Strategy turns ON ✅
- **11:30 AM EST**: London closes, NYSE still open → Strategy stays ON ✅
- **4:00 PM EST**: NYSE closes → Strategy turns OFF 🔴
- **7:00 PM EST**: All markets closed → Strategy stays OFF 🔴

#### User Selected: NYSE only
- **9:30 AM EST**: NYSE opens → Strategy turns ON ✅
- **4:00 PM EST**: NYSE closes → Strategy turns OFF 🔴

#### User Selected: ASIA only
- **7:00 PM EST**: Tokyo opens → Strategy turns ON ✅
- **1:00 AM EST**: Tokyo closes → Strategy turns OFF 🔴

## 🔍 Database Check Query

To see which strategies have scheduling enabled (for admins):

```sql
-- Check all scheduled strategies
SELECT
    s.id,
    u.email,
    s.ticker,
    s.is_active,
    s.market_schedule,
    s.last_scheduled_toggle
FROM activated_strategies s
JOIN users u ON s.user_id = u.id
WHERE s.market_schedule IS NOT NULL
ORDER BY u.email, s.created_at;

-- Count scheduled vs unscheduled
SELECT
    COUNT(*) FILTER (WHERE market_schedule IS NOT NULL) as scheduled,
    COUNT(*) FILTER (WHERE market_schedule IS NULL) as manual,
    COUNT(*) as total
FROM activated_strategies;
```

## 🚀 What Happens After Backend Restart

### **Immediate Actions (First Minute)**
1. Scheduler initializes and registers jobs
2. Runs first check of all scheduled strategies
3. Toggles any strategies that need adjustment
4. Logs all actions

### **Ongoing (Every Minute)**
```
INFO - Checking X scheduled strategies
INFO - Strategy Y activated by scheduler (markets: NYSE, LONDON)
INFO - Strategy Z deactivated by scheduler (all markets closed)
```

## ❓ Common Questions

### **Q: Do I need to recreate my strategies?**
**A: No.** Existing scheduled strategies will work automatically.

### **Q: Can I still manually toggle my scheduled strategies?**
**A: Yes.** Manual override always works. The scheduler will resume control at the next market event.

### **Q: What if I want to disable scheduling for a strategy?**
**A: Edit the strategy and toggle "Schedule by Market Hours" OFF.**

### **Q: Will I get notified when my strategy auto-toggles?**
**A: Currently, auto-toggles are logged but don't send notifications. This could be added as a future feature.**

## 📈 Market Hours Quick Reference

| Market | Trading Hours (Local) | Trading Hours (EST) | Days |
|--------|----------------------|---------------------|------|
| **NYSE** | 9:30 AM - 4:00 PM EST | 9:30 AM - 4:00 PM | Mon-Fri |
| **London** | 8:00 AM - 4:30 PM GMT | 3:00 AM - 11:30 AM | Mon-Fri |
| **Tokyo** | 9:00 AM - 3:00 PM JST | 7:00 PM - 1:00 AM | Mon-Fri |

## 🎉 Summary

**For users with scheduled strategies:** Your strategies will start auto-toggling as soon as we restart the backend. No action required!

**For users without scheduled strategies:** Continue using manual control, or edit your strategies to add scheduling.

**The scheduler will:**
- Run every minute
- Check all scheduled strategies
- Toggle based on market hours
- Log all actions
- Respect manual overrides

**Status:** Ready to activate - just needs backend restart! 🚀