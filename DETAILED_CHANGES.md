# Authentication Flow - Detailed Changes Reference

## 1. Backend Auth Controller Changes

### File: `backend/controllers/authController.js`

#### Change 1: Google Login - Handle New Users
**Location**: `googleLogin` function

**What Changed**:
- Added `role` parameter to the request body handling
- When new user detected and no role provided: returns `status: 'new_user'` response
- When new user detected with role: creates account with `isOnboarded: false`
- New Google users get default location (Delhi coordinates) and temporary phone number

**Why**: 
- Allows users to select role BEFORE account creation
- Ensures new providers don't skip onboarding
- Maintains security by creating proper account

**Code Pattern**:
```javascript
if (!user) {
  if (!role) {
    return res.status(200).json({
      status: 'new_user',
      email: normalizedEmail,
      name: name || '',
      message: 'Please select your role (provider or customer)'
    });
  }
  // Create with selected role
  user = await User.create({
    googleId,
    email: normalizedEmail,
    name: name || 'User',
    phone: `GOOGLE_${googleId.substring(0, 10)}`,
    role: role || 'provider',
    preferredLanguage: 'en',
    location: { type: 'Point', coordinates: [77.2090, 28.6139] },
    isOnboarded: false // New users need onboarding
  });
}
```

#### Change 2: Get Me Endpoint - Include Onboarding Status
**Location**: `getMe` function

**What Changed**:
- Changed response from raw user object to formatted response
- Ensures consistent `isOnboarded` field in all auth endpoints

**Why**: 
- Consistent API responses across all auth endpoints
- Frontend can rely on `isOnboarded` being present in all responses

**Before**: `res.status(200).json(user);`  
**After**: `res.status(200).json(formatUserResponse(user));`

#### Change 3: OTP Verification - Set Onboarding Status
**Location**: `verifyOtp` function

**What Changed**:
- New users created via OTP now have `isOnboarded: false`
- Changed response to use `formatUserResponse` for consistency

**Why**: 
- Ensures new providers are forced through onboarding
- Consistent with signup flow

**Code Addition**:
```javascript
isOnboarded: false // New users must complete onboarding
```

#### Change 4: User Registration - Role-Based Onboarding
**Location**: `registerUser` function

**What Changed**:
- Added `isOnboarded` field to new user data
- Set to `true` for customers (no onboarding needed)
- Set to `false` for providers (onboarding required)

**Why**: 
- Customers should go directly to dashboard
- Providers must complete onboarding profile

**Code Addition**:
```javascript
isOnboarded: role === 'customer' ? true : false
```

## 2. Frontend Context Changes

### File: `frontend/src/context/AuthContext.jsx`

#### Change: Google Login Method Enhancement
**Location**: `googleLogin` function

**What Changed**:
- Added optional `role` parameter
- Now handles `status: 'new_user'` responses
- Does not set user state if response is for new user

**Why**: 
- Allows two-step Google login for new users
- First call: detect new user
- Second call with role: create account

**Code Pattern**:
```javascript
const googleLogin = async (credential, role = null) => {
  const payload = { credential };
  if (role) {
    payload.role = role;
  }
  const { data } = await api.post('/auth/google', payload);
  
  // If new user, return response without setting state
  if (data.status === 'new_user') {
    return data;
  }
  
  // Otherwise, set user state
  setUser(data);
  // ... rest of logic
};
```

## 3. Frontend Login Page Changes

### File: `frontend/src/pages/Login.jsx`

#### Change: Enhanced Google Success Handler
**Location**: `handleGoogleSuccess` function

**What Changed**:
- Detects `status: 'new_user'` response from backend
- Calls googleLogin again with user's selected role
- Routes based on role:
  - Customer: Dashboard
  - Provider: Onboarding (will be forced by App.jsx if `isOnboarded = false`)

**Why**: 
- Completes the two-step Google flow for new users
- Ensures correct routing based on user role

**Code Pattern**:
```javascript
const handleGoogleSuccess = async (credentialResponse) => {
  const result = await googleLogin(credentialResponse.credential);
  
  if (result?.status === 'new_user') {
    // Call again with selected role
    const resultWithRole = await googleLogin(
      credentialResponse.credential, 
      role
    );
    
    // Navigate based on role
    if (role === 'customer') {
      onNavigate('dashboard');
    } else {
      onNavigate('onboarding');
    }
  } else {
    // Existing user - check onboarding status
    if (result?.isOnboarded) {
      onNavigate('dashboard');
    } else {
      onNavigate('onboarding');
    }
  }
};
```

## 4. No Changes Needed (Already Correct)

### App.jsx Navigation
- ✓ Already checks both `user.role` and `user.isOnboarded`
- ✓ Routes providers to onboarding if not completed
- ✓ Routes customers to dashboard

### OnboardingFlow
- ✓ Already sets `isOnboarded: true` via PUT /users/profile
- ✓ Already generates AI bio using Gemini
- ✓ Already extracts skills from user input

### User Endpoints
- ✓ Already support updating `isOnboarded` field
- ✓ Already return `isOnboarded` in responses

### Translation Files
- ✓ No merge conflicts found
- ✓ All three languages valid JSON
- ✓ No updates needed

## API Response Format

### Before Changes
```json
{
  "_id": "...",
  "name": "...",
  "role": "provider",
  // isOnboarded might not be included
}
```

### After Changes
All auth endpoints now return:
```json
{
  "_id": "...",
  "name": "...",
  "phone": "...",
  "email": "...",
  "role": "provider",
  "preferredLanguage": "en",
  "location": {...},
  "skills": [...],
  "bio": "...",
  "availability": true,
  "isOnboarded": false  ← NOW ALWAYS INCLUDED
}
```

## Flow Decision Trees

### Google Login Flow
```
Google Login Clicked
  ├─ First call: googleLogin(credential)
  │  ├─ Account exists
  │  │  └─ Return user with isOnboarded
  │  └─ Account does NOT exist
  │     └─ Return status: 'new_user'
  │
  └─ If new_user response
     └─ User selects role
        └─ Second call: googleLogin(credential, role)
           └─ Create account
           └─ Return new user with isOnboarded = false
              └─ Navigate based on role
```

### Auth Redirect Flow (App.jsx)
```
After user state updates
  └─ If user exists
     ├─ If role === provider
     │  ├─ If NOT isOnboarded
     │  │  └─ Redirect to onboarding (if trying dashboard/login/signup)
     │  └─ If isOnboarded
     │     └─ Redirect to dashboard (if trying login/signup/onboarding)
     │
     └─ If role === customer
        └─ Redirect to dashboard (if trying onboarding)
```

## Testing Scenarios

### Scenario 1: New Provider via ProviderEntry
1. Landing → [I Want to Earn]
2. App converts to provider-entry view
3. ProviderEntry collects age/household
4. Pushes to login state
5. Login OTP flow
6. Backend verifyOtp: creates account with `isOnboarded = false`
7. Frontend calls `onNavigate('dashboard')`
8. App.jsx detects `isOnboarded = false` → redirects to onboarding
9. OnboardingFlow completes → sets `isOnboarded = true`
10. Next login → goes straight to dashboard

### Scenario 2: New Customer via Signup
1. Landing → [I Want to Hire]
2. App renders Signup view
3. Signup form submitted
4. Backend: creates account with `isOnboarded = true`
5. Frontend: navigates to dashboard
6. Customer sees dashboard immediately

### Scenario 3: New Google Provider
1. Login → Google Sign-In button
2. Frontend: calls googleLogin(credential)
3. Backend: returns `status: 'new_user'`
4. Frontend shows role selector
5. User selects [I Want to Earn]
6. Frontend: calls googleLogin(credential, 'provider')
7. Backend: creates account with `isOnboarded = false`
8. Frontend: navigates to onboarding
9. Same as Scenario 1 onwards

### Scenario 4: Returning Provider
1. Landing → [Sign In]
2. Login OTP flow
3. Backend: finds existing user, `isOnboarded = true`
4. Frontend: user.role = 'provider', isOnboarded = true
5. Frontend: navigates to dashboard
6. App.jsx: allows dashboard to show
7. Provider sees dashboard immediately (no onboarding)
