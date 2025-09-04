# Postman Collection for Bodyweight Training API

This directory contains Postman collection and environment files for testing the Bodyweight Adaptive Training API.

## 📥 Import Instructions

### Option 1: Import OpenAPI Specification
1. Open Postman
2. Click "Import" button
3. Select the `openapi.yaml` file from the parent directory (`../openapi.yaml`)
4. Postman will automatically generate a collection with all endpoints

### Option 2: Manual Collection Setup
If you prefer to create requests manually, follow these steps:

## 🔧 Environment Setup

Create a new environment in Postman with these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `https://your-project.supabase.co/functions/v1` | `{{baseUrl}}` |
| `jwtToken` | `your-jwt-token-here` | `{{jwtToken}}` |
| `sessionId` | | `{{sessionId}}` |

### Getting Your JWT Token

1. **From Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Users
   - Find your user and copy the JWT token

2. **From Browser (if logged into web app):**
   ```javascript
   // Run in browser console on your app
   const { data: { session } } = await supabase.auth.getSession();
   console.log(session.access_token);
   ```

3. **Programmatically:**
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(url, key);
   const { data: { user }, error } = await supabase.auth.signInWithPassword({
     email: 'your-email@example.com',
     password: 'your-password'
   });
   console.log(data.session.access_token);
   ```

## 📋 Pre-request Scripts

Add this pre-request script to automatically set authorization headers:

```javascript
// Auto-set Authorization header
if (pm.environment.get("jwtToken")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("jwtToken")
    });
}

// Auto-set Content-Type for POST requests
if (pm.request.method === "POST") {
    pm.request.headers.add({
        key: "Content-Type", 
        value: "application/json"
    });
}
```

## 🧪 Test Scripts

### Extract Session ID from Generate Routine Response
```javascript
// For generate-routine request
pm.test("Extract session ID", function () {
    const jsonData = pm.response.json();
    if (jsonData.trainingPlan && jsonData.trainingPlan.current_session) {
        pm.environment.set("sessionId", jsonData.trainingPlan.current_session.id);
        console.log("Session ID saved: " + jsonData.trainingPlan.current_session.id);
    }
});
```

### Validate Response Structure
```javascript
// Generic response validation
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is JSON", function () {
    pm.response.to.be.json;
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```

### ICA Score Validation
```javascript
// For calculate-ica request
pm.test("ICA score is valid", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.ica_score).to.be.a('number');
    pm.expect(jsonData.ica_score).to.be.at.least(0.1);
    pm.expect(jsonData.ica_score).to.be.at.most(5.0);
});

pm.test("Has adherence rate", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.adherence_rate).to.be.a('number');
    pm.expect(jsonData.adherence_rate).to.be.at.least(0);
    pm.expect(jsonData.adherence_rate).to.be.at.most(1);
});
```

## 🔄 Collection Organization

### Folder Structure
```
Bodyweight Training API/
├── 🏋️ Routines/
│   ├── Generate Routine (Basic)
│   ├── Generate Routine (With Biometrics)
│   └── Get Current Routine
├── 📊 Analytics/
│   ├── Calculate ICA
│   ├── Analyze Muscle Groups
│   └── Analyze Evolution
├── 💾 Sessions/
│   ├── Save Session Feedback (Basic)
│   └── Save Session Feedback (Detailed)
├── 🩺 Biometrics/
│   └── Get Latest Biometrics
└── 🔧 Progressions/
    └── Update Progressions
```

## 📝 Sample Requests

### 1. Generate Basic Routine
```http
POST {{baseUrl}}/generate-routine
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "daysToGenerate": 1
}
```

### 2. Generate Routine with Biometrics
```http
POST {{baseUrl}}/generate-routine
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "daysToGenerate": 1,
  "biometricData": {
    "weight": 75.0,
    "body_fat_percentage": 18.0,
    "resting_hr": 65,
    "training_hr_avg": 145,
    "sleep_hours": 7.5,
    "sleep_quality": 4,
    "fatigue_level": 2
  }
}
```

### 3. Save Session Feedback
```http
POST {{baseUrl}}/save-session-feedback
Authorization: Bearer {{jwtToken}}
Content-Type: application/json

{
  "sessionId": "{{sessionId}}",
  "feedback": {
    "rpe_reported": 7,
    "completion_rate": 0.9,
    "technical_quality": 4,
    "enjoyment_level": 4,
    "recovery_feeling": 3,
    "actual_duration": 35
  }
}
```

## 🚀 Workflow Testing

### Complete Workflow Runner
Create a collection runner with this sequence:

1. **Calculate ICA** - Get baseline metrics
2. **Get Latest Biometrics** - Check current biometric data  
3. **Generate Routine** - Create personalized workout
4. **Save Session Feedback** - Complete workout simulation
5. **Analyze Muscle Groups** - Check balance after session
6. **Analyze Evolution** - View progress trends

### Runner Configuration
- **Iterations**: 1
- **Delay**: 1000ms between requests
- **Data**: None (uses environment variables)
- **Persist Variables**: Yes

## 🐛 Debugging Tips

### Common Issues

1. **401 Unauthorized**
   - Check JWT token is valid and not expired
   - Ensure token is properly set in environment
   - Verify Bearer prefix in Authorization header

2. **404 Not Found**
   - Verify base URL is correct
   - Check endpoint spelling
   - Ensure Supabase project is active

3. **500 Internal Server Error**
   - Check request payload format
   - Verify user profile exists in database
   - Review Supabase function logs

### Debug Headers
Add these headers for debugging:
```
X-Debug: true
X-Client-Info: postman-collection
```

### Response Inspection
Use these tests to inspect responses:
```javascript
// Log full response
console.log("Response Body:", pm.response.text());

// Log specific fields
const jsonData = pm.response.json();
console.log("ICA Score:", jsonData.ica_score);
console.log("Recommendations:", jsonData.recommendations);
```

## 📈 Performance Testing

### Load Testing Setup
1. Create a separate environment for load testing
2. Use collection runner with multiple iterations
3. Monitor response times in Postman console
4. Set reasonable delays between requests

### Monitoring Scripts
```javascript
// Track response times
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000); // 5 seconds
});

// Log performance metrics
console.log("Response time:", pm.response.responseTime + "ms");
console.log("Response size:", pm.response.responseSize + " bytes");
```

## 🔐 Security Best Practices

1. **Environment Variables**: Store sensitive data in environment variables
2. **Token Rotation**: Regularly rotate JWT tokens
3. **HTTPS Only**: Always use HTTPS endpoints
4. **Rate Limiting**: Respect API rate limits
5. **Data Privacy**: Don't log sensitive biometric data

## 💡 Pro Tips

1. **Use Variables**: Leverage Postman variables for dynamic data
2. **Chain Requests**: Use test scripts to pass data between requests
3. **Organize Collections**: Group related requests in folders
4. **Documentation**: Add descriptions to requests and folders
5. **Mock Servers**: Create mock servers for development testing
6. **Monitors**: Set up Postman monitors for API health checks

---

**Need Help?**
- Check the main API documentation in `../README.md`
- Review the OpenAPI specification in `../openapi.yaml`
- Submit issues to the project repository