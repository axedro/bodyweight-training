# Bodyweight Adaptive Training API Documentation

This directory contains comprehensive API documentation for the Bodyweight Adaptive Training System.

## 📁 Documentation Structure

```
docs/api/
├── README.md                 # This file - API documentation overview
├── openapi.yaml             # Complete OpenAPI 3.0 specification
├── examples/                # API usage examples and code samples
│   ├── javascript/          # JavaScript/Node.js examples
│   ├── python/              # Python examples
│   ├── curl/                # cURL command examples
│   └── postman/             # Postman collection
├── schemas/                 # JSON Schema files for validation
└── changelog.md             # API version history and changes
```

## 🚀 Quick Start

### 1. Authentication

All API endpoints require Supabase JWT authentication:

```bash
# Get your JWT token from Supabase Auth
Authorization: Bearer <your-jwt-token>
```

### 2. Base URL

```
https://<your-supabase-project>.supabase.co/functions/v1
```

### 3. Basic Usage Example

```bash
# Generate a training routine
curl -X POST \
  https://your-project.supabase.co/functions/v1/generate-routine \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysToGenerate": 1,
    "biometricData": {
      "weight": 75.0,
      "sleep_hours": 7.5,
      "sleep_quality": 4,
      "fatigue_level": 2
    }
  }'
```

## 📋 Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-routine` | POST | Generate personalized training routine |
| `/calculate-ica` | POST | Calculate user's current ability index |
| `/save-session-feedback` | POST | Save workout session feedback |
| `/analyze-muscle-groups` | POST | Analyze muscle group balance |
| `/analyze-evolution` | POST | Analyze training evolution over time |
| `/get-latest-biometrics` | POST | Get user's latest biometric data |
| `/get-current-routine` | POST | Get current active routine |
| `/update-progressions` | POST | Update exercise progressions |

## 🔍 Documentation Tools

### Swagger UI

You can view the interactive API documentation using any Swagger UI tool:

1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Import the `openapi.yaml` file
3. Explore endpoints interactively

### Postman

Import the OpenAPI specification into Postman:

1. Open Postman
2. Click "Import"
3. Select the `openapi.yaml` file
4. Configure your environment with base URL and JWT token

### Code Generation

Generate client libraries using the OpenAPI spec:

```bash
# Generate JavaScript client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g javascript \
  -o ./clients/javascript

# Generate Python client
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./clients/python
```

## 🏗️ API Architecture

### Core Concepts

- **ICA (Index of Current Ability)**: Personalized score that adapts training to user capability
- **Progressive System**: 7-level progression system for each exercise category
- **Biometric Integration**: Historical tracking of physiological indicators
- **Adaptive Algorithm**: Machine learning-based routine generation

### Data Flow

1. **User Onboarding** → Profile creation with biometric baseline
2. **Routine Generation** → Algorithm generates personalized workout
3. **Session Execution** → User completes workout with feedback
4. **Progress Analysis** → System analyzes performance and updates progressions
5. **Evolution Tracking** → Long-term trends and predictions

### Security

- **Row Level Security (RLS)**: All user data is isolated
- **JWT Authentication**: Secure token-based authentication
- **CORS Headers**: Proper cross-origin resource sharing
- **Input Validation**: All inputs are validated and sanitized

## 🔄 Integration Patterns

### Mobile App Integration

```javascript
// Example React Native integration
import { supabase } from './supabase-client';

const generateRoutine = async (biometricData) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/generate-routine`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        daysToGenerate: 1,
        biometricData
      })
    }
  );
  
  return response.json();
};
```

### Web App Integration

```javascript
// Example Next.js integration
import { createBrowserClient } from '@supabase/ssr';

const routineService = {
  async generateRoutine(biometricData) {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-routine`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysToGenerate: 1, biometricData })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to generate routine');
    }
    
    return response.json();
  }
};
```

### Third-Party Integration

```python
# Example Python client
import requests
import json

class BodyweightAPI:
    def __init__(self, supabase_url, jwt_token):
        self.base_url = f"{supabase_url}/functions/v1"
        self.headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json"
        }
    
    def generate_routine(self, biometric_data=None):
        payload = {"daysToGenerate": 1}
        if biometric_data:
            payload["biometricData"] = biometric_data
            
        response = requests.post(
            f"{self.base_url}/generate-routine",
            headers=self.headers,
            json=payload
        )
        
        response.raise_for_status()
        return response.json()
    
    def save_feedback(self, session_id, feedback, exercise_performance=None):
        payload = {
            "sessionId": session_id,
            "feedback": feedback
        }
        if exercise_performance:
            payload["exercisePerformance"] = exercise_performance
            
        response = requests.post(
            f"{self.base_url}/save-session-feedback",
            headers=self.headers,
            json=payload
        )
        
        response.raise_for_status()
        return response.json()

# Usage
api = BodyweightAPI("https://your-project.supabase.co", "your-jwt-token")

# Generate routine with biometric data
routine = api.generate_routine({
    "weight": 75.0,
    "sleep_hours": 7.5,
    "sleep_quality": 4,
    "fatigue_level": 2
})

# Save session feedback
feedback = api.save_feedback(
    session_id="123e4567-e89b-12d3-a456-426614174000",
    feedback={
        "rpe_reported": 7,
        "completion_rate": 0.9,
        "technical_quality": 4
    }
)
```

## 📊 Rate Limits & Performance

- **Rate Limits**: Standard Supabase Edge Function limits apply
- **Response Times**: Typical response times are 200-2000ms depending on complexity
- **Concurrent Requests**: Supports multiple concurrent users
- **Caching**: Some responses are cached for performance optimization

## 🐛 Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid JWT)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error

### Error Handling Best Practices

```javascript
const handleAPIRequest = async (apiCall) => {
  try {
    const response = await apiCall();
    return { success: true, data: response };
  } catch (error) {
    if (error.status === 401) {
      // Handle authentication error
      await refreshToken();
      return handleAPIRequest(apiCall); // Retry
    } else if (error.status === 429) {
      // Handle rate limit
      await delay(1000);
      return handleAPIRequest(apiCall); // Retry after delay
    } else {
      // Handle other errors
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  }
};
```

## 📈 Monitoring & Analytics

### Key Metrics

- **Response Times**: Monitor API latency
- **Error Rates**: Track error frequency by endpoint
- **User Engagement**: Monitor routine generation and completion rates
- **Data Quality**: Track biometric data completeness and accuracy

### Logging

All API calls are logged with:
- Request timestamp
- User ID (from JWT)
- Endpoint called
- Response time
- Success/error status

## 🔮 Roadmap

### Planned Features

- [ ] **Webhook Support**: Real-time notifications for events
- [ ] **Batch Operations**: Process multiple operations in single request
- [ ] **GraphQL Interface**: Alternative query interface
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Wearable Integration**: Direct device data sync
- [ ] **API Versioning**: Backward compatibility support

### Version History

- **v2.8.0** (Current) - Complete biometric tracking system
- **v2.7.0** - Muscle group analysis and balance tracking
- **v2.6.0** - Algorithm unification and Edge Function optimization
- **v2.5.0** - Enhanced progression system and new user handling

## 🛠️ Development

### Running Documentation Locally

```bash
# Serve OpenAPI docs with Swagger UI
npx swagger-ui-serve docs/api/openapi.yaml

# Validate OpenAPI specification
npx swagger-codegen validate -i docs/api/openapi.yaml

# Generate documentation
npx redoc-cli serve docs/api/openapi.yaml
```

### Contributing

When updating the API:

1. Update the OpenAPI specification (`openapi.yaml`)
2. Add examples in the `examples/` directory
3. Update this README if needed
4. Test all endpoints with the updated specification
5. Update version number and changelog

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **Documentation**: This directory and OpenAPI spec
- **Examples**: Check the `examples/` directory

---

**Last Updated**: September 2024  
**API Version**: 2.8.0  
**Specification**: OpenAPI 3.0.3