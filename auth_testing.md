# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session

```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  is_admin: true,
  is_owner: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API

```bash
# Test auth endpoint
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Test protected endpoints
curl -X GET "$REACT_APP_BACKEND_URL/api/admin/users" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing

```python
# Set cookie and navigate
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "localhost",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}]);
await page.goto("http://localhost:3000");
```

## Critical Notes

1. **MongoDB Schema**: Users have `id` field (string), sessions reference this via `user_id`
2. **Session Token**: Store in both cookie and can be passed via Authorization header
3. **Expiry**: Sessions expire after 7 days (timezone-aware datetime)
4. **Admin vs Owner**: Owner can manage admin access, admin can only manage products/categories

## Success Indicators

✅ `/api/auth/me` returns user data
✅ Admin panel loads without redirect
✅ CRUD operations work on products/categories
✅ Owner can manage admin access

## Failure Indicators

❌ "Not authenticated" errors
❌ 401/403 responses
❌ Redirect to login page when authenticated
