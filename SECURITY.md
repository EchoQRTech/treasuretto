# Security Implementation Guide

## Overview
This document outlines the comprehensive security measures implemented in the TreasureTto application, including Row Level Security (RLS), data validation, audit logging, and best practices.

## 🔒 Row Level Security (RLS) Policies

### Profiles Table
- **SELECT**: Users can only view their own profile (`auth.uid() = id`)
- **INSERT**: Users can only insert their own profile (`auth.uid() = id`)
- **UPDATE**: Users can only update their own profile (`auth.uid() = id`)
- **DELETE**: Users can only delete their own profile (`auth.uid() = id`)

### Subscriptions Table
- **SELECT**: Users can only view their own subscription (`auth.uid() = user_id`)
- **INSERT**: Users can only insert their own subscription (`auth.uid() = user_id`)
- **UPDATE**: Users can only update their own subscription (`auth.uid() = user_id`)
- **DELETE**: Users can only delete their own subscription (`auth.uid() = user_id`)

### Audit Logs Table
- **ALL**: Only admin users can access audit logs
- Admin detection: Email contains `@admin` or `@treasuretto.com`

## 🛡️ Data Validation Functions

### Email Validation
```sql
validate_email(email TEXT) RETURNS BOOLEAN
```
- Validates email format using regex pattern
- Ensures proper email structure

### Input Sanitization
```sql
sanitize_text(input_text TEXT) RETURNS TEXT
```
- Removes potentially dangerous characters (`<>"'&`)
- Prevents XSS attacks

### Subscription Data Validation
```sql
validate_subscription_data(p_user_id UUID, p_variant_id TEXT, p_status TEXT) RETURNS BOOLEAN
```
- Validates user exists
- Ensures variant_id is numeric
- Validates status is in allowed values

## 🔐 Secure Update Functions

### Profile Updates
```sql
secure_update_profile(p_email TEXT, p_created_at TIMESTAMPTZ) RETURNS BOOLEAN
```
- Validates email format before update
- Only allows users to update their own profile

### Subscription Updates
```sql
secure_update_subscription(p_variant_id TEXT, p_status TEXT, p_started_at TIMESTAMPTZ, p_current_period_end TIMESTAMPTZ) RETURNS BOOLEAN
```
- Validates all subscription data before update
- Ensures data integrity

## 📊 Audit Trail

### Audit Logs Table
- Tracks all INSERT, UPDATE, DELETE operations
- Records old and new data
- Stores user ID, IP address, and user agent
- Automatic cleanup of old records (older than 1 hour)

### Audit Triggers
- Automatically logs all changes to profiles and subscriptions
- No manual intervention required
- Maintains complete audit trail

## 🚫 Rate Limiting

### Rate Limits Table
- Tracks API requests per user per endpoint
- Configurable limits and time windows
- Automatic cleanup of old records

### Rate Limit Function
```sql
check_rate_limit(p_endpoint TEXT, p_max_requests INTEGER, p_window_minutes INTEGER) RETURNS BOOLEAN
```
- Default: 100 requests per minute per endpoint
- Prevents abuse and DDoS attacks

## 🔍 Utility Functions

### Admin Detection
```sql
is_admin(user_uuid UUID) RETURNS BOOLEAN
```
- Checks if user has admin privileges
- Based on email domain

### Subscription Status
```sql
get_user_subscription_status(user_uuid UUID) RETURNS TEXT
```
- Returns current subscription status
- Defaults to 'trial' if no subscription

### Active Subscription Check
```sql
has_active_subscription(user_uuid UUID) RETURNS BOOLEAN
```
- Checks if user has active subscription
- Used for feature access control

## 📋 Data Constraints

### Profiles Table
- Email length ≤ 255 characters
- Email format validation
- Created_at ≤ current time

### Subscriptions Table
- Status must be: 'active', 'inactive', 'cancelled', 'past_due', 'trial'
- Variant_id must be numeric
- Started_at ≤ current_period_end
- Unique user constraint (one subscription per user)

## 🛠️ Best Practices

### 1. Always Use Secure Functions
Instead of direct table updates, use the provided secure functions:
```sql
-- ❌ Don't do this
UPDATE profiles SET email = 'new@email.com' WHERE id = auth.uid();

-- ✅ Do this
SELECT secure_update_profile('new@email.com');
```

### 2. Validate Input Data
Always validate data before processing:
```sql
-- Check subscription status
SELECT has_active_subscription();

-- Validate email
SELECT validate_email('user@example.com');
```

### 3. Use Rate Limiting
Implement rate limiting for API endpoints:
```sql
-- Check rate limit before processing
SELECT check_rate_limit('/api/user', 100, 1);
```

### 4. Monitor Audit Logs
Regularly review audit logs for suspicious activity:
```sql
-- View recent audit logs (admin only)
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

## 🔧 Security Checklist

- [x] RLS enabled on all tables
- [x] Comprehensive RLS policies implemented
- [x] Data validation functions created
- [x] Input sanitization implemented
- [x] Audit trail established
- [x] Rate limiting configured
- [x] Data constraints added
- [x] Secure update functions created
- [x] Admin detection implemented
- [x] Subscription validation added

## 🚨 Security Alerts

### Monitor These Events
1. **Failed Login Attempts**: Multiple failed auth attempts
2. **Suspicious Data Changes**: Unusual profile or subscription updates
3. **Rate Limit Violations**: Users hitting rate limits frequently
4. **Admin Access**: Non-admin users attempting admin functions

### Response Actions
1. **Immediate**: Block suspicious IP addresses
2. **Short-term**: Review audit logs for affected users
3. **Long-term**: Update security policies based on patterns

## 📞 Security Contact

For security issues or questions:
- Email: security@treasuretto.com
- Priority: High for security-related issues

---

**Last Updated**: $(date)
**Version**: 1.0
**Status**: Production Ready
