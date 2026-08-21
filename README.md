# 🤝 SilverHands

### AI-Powered Opportunity & Service Matching Platform for Senior Citizens and Homemakers

SilverHands is an AI-powered platform designed to connect **service providers such as senior citizens and homemakers with customers who need their services**.

The platform supports the complete journey — from profile creation and AI-powered matchmaking to communication, confirmation, service completion, earnings, ratings, reviews, forecasting, and trust & safety.

---

## 🌟 Why SilverHands?

Many senior citizens and homemakers have valuable skills, experience, and time but face difficulties finding suitable opportunities.

At the same time, customers often struggle to find trustworthy and relevant people who match their specific requirements.

SilverHands bridges this gap using:

- 🤖 AI-powered matchmaking
- 🎙️ Multilingual AI voice assistance
- 💬 Persistent Provider–Customer messaging
- 📊 Personalized opportunity forecasting
- ⭐ Ratings and reviews
- 💰 Earnings tracking
- 🛡️ Trust & safety reporting
- 👤 Personalized profiles

### Our Vision

> **Connect people with meaningful opportunities while making digital interaction simple, accessible, personalized, and trustworthy.**

---

# 🚀 Key Features

## 🤖 AI-Powered Matchmaking

SilverHands matches customers with relevant providers based on their profiles and requirements.

The matching system considers information such as:

- Skills
- Services offered
- Customer requirements
- Location
- Experience
- Availability
- Profile information

Semantic matching can be used to identify relevant matches beyond simple keyword matching.

### Matching Flow

```text
Customer creates a request
          ↓
Customer requirements processed
          ↓
Provider profiles analyzed
          ↓
Semantic matching
          ↓
Relevant Providers ranked
          ↓
Customer receives matches
```

---

# 🎙️ Sakhi AI Voice Assistant

**Sakhi** is an AI-powered voice assistant designed primarily for Providers.

It reduces the digital barrier for users who may not be comfortable navigating complex applications or typing queries.

Providers can interact with Sakhi naturally using voice.

### Supported Languages

- 🇬🇧 English
- 🇮🇳 Tamil
- 🇮🇳 Hindi

The assistant uses the language selected by the Provider.

### Voice Interaction

```text
Provider speaks
      ↓
Speech-to-Text
      ↓
Sakhi understands intent
      ↓
Provider profile/context retrieved
      ↓
AI generates response
      ↓
Text-to-Speech
      ↓
Provider hears response
```

Sakhi can use relevant Provider information such as:

- Skills
- Experience
- Location
- Availability
- Services
- Profile information

This enables more personalized assistance.

---

# 💬 Provider–Customer Messaging

After a relevant match is established and accepted, SilverHands provides a persistent communication thread between the Provider and Customer.

Users can communicate about:

- Service requirements
- Availability
- Timing
- Service details
- Other relevant information

### Communication Flow

```text
AI Match
   ↓
Provider accepts
   ↓
Conversation created
   ↓
Provider ↔ Customer
   ↓
Both confirm
   ↓
Service
```

Messages are stored persistently so conversations remain available after:

- Logout
- Login
- Page refresh
- Browser restart

---

# 📋 Application & Match Tracking

SilverHands uses a simple four-stage workflow designed to be easy to understand.

```text
Applied → Accepted → Confirmed → Completed
```

### 1. Applied

The Customer's request has been submitted and the Provider has received the application.

### 2. Accepted

The Provider has accepted the request and communication can take place.

### 3. Confirmed

Both the Provider and Customer have confirmed the service.

### 4. Completed

The Provider marks the service as completed after receiving payment.

---

## Confirmation & Rejection

Both sides can explicitly confirm or reject the service.

```text
Provider → Confirm
Customer → Confirm

        ↓

Both confirmed

        ↓

CONFIRMED
```

If either side rejects:

```text
Provider → Reject
       OR
Customer → Reject

        ↓

REJECTED
```

Rejected applications remain available in the respective user's previous match/application history.

---

# 💰 Earnings Tracking

Providers can track earnings from completed services.

The earnings workflow is:

```text
CONFIRMED
    ↓
Service takes place
    ↓
Payment received
    ↓
Provider marks as COMPLETED
    ↓
COMPLETED
    ↓
Earnings updated
```

The system keeps track of completed service payments so Providers can monitor their earnings.

The Earnings page can display:

- Total earnings
- Completed services
- Individual earning transactions
- Earnings history

---

# ⭐ Ratings & Reviews

After a service reaches:

```text
COMPLETED
```

the Customer can rate and review the Provider.

Customers can provide:

- ⭐ 1–5 star rating
- Written review

The rating option is available only after the associated service has been completed.

A Customer can submit one review for a particular completed service.

### Provider Profile

The Provider profile displays the overall rating and reviews.

Example:

```text
⭐ 4.8
Based on 24 reviews
```

Reviews remain persistent and are stored in the database.

---

# 📅 AI-Powered Opportunity Forecasting

SilverHands helps Providers discover upcoming opportunities based on seasonal events, festivals, and demand patterns.

The platform provides:

### ⭐ Most Relevant For You

Personalized suggestions based on:

- Provider skills
- Bio
- Services
- Location
- Experience
- Availability
- Event relevance

For example:

A Provider with cooking experience may receive:

> "Wedding season may be highly relevant to your cooking skills because demand for cooking and catering services may increase."

A Provider with tutoring experience may receive:

> "School reopening may create increased demand for tutoring services."

### 📅 All Upcoming Opportunities

The platform also displays general upcoming opportunities such as:

- Wedding seasons
- School reopening
- Major festivals
- Seasonal demand
- Other relevant events

This provides both:

```text
⭐ Personalized Opportunities

+

📅 All Upcoming Opportunities
```

---

# 🗓️ Festival & Calendar Intelligence

SilverHands can incorporate major festivals and events from different religious and cultural traditions.

Examples include festivals from:

- Hindu traditions
- Muslim traditions
- Christian traditions
- Sikh traditions
- Buddhist traditions
- Jain traditions

Festival dates should come from reliable calendar data or verified datasets rather than being guessed by an AI model.

AI is used to explain the relevance of an event to a Provider's profile rather than inventing event dates.

---

# 🛡️ Trust & Safety

SilverHands provides a reporting mechanism for suspicious or unsafe user behavior.

Users can report issues such as:

- 🚨 Scam / Fraud
- 💰 Payment Fraud
- 👤 Fake Profile
- 💬 Harassment
- 🔗 Suspicious Links
- 🛑 Unsafe Behaviour
- Other

### Report Flow

```text
User reports another user
          ↓
Report stored securely
          ↓
Admin / Trust & Safety Dashboard
          ↓
Admin reviews:
- Profile
- Match
- Relevant conversation
- Report details
          ↓
Action
```

Possible administrative actions include:

- Dismiss
- Warn
- Suspend
- Ban

AI can assist with report classification and prioritization, while the final moderation decision remains with an administrator.

---

# 👤 Customer Profile

Customers have a dedicated profile page where they can view and edit their information.

Relevant information can include:

- Name
- City / Location
- Contact information
- Service needed
- Service category
- Requirements
- Preferred timing
- Availability

Profile changes are persisted in the backend and can be used by the matchmaking system.

---

# 👥 Provider Profile

Providers can create profiles containing information such as:

- Name
- Skills
- Services
- Experience
- Location
- Availability
- Bio
- Preferred work
- Languages

Provider profile information is used for:

- AI matchmaking
- Personalized forecasting
- Sakhi AI assistance
- Customer discovery
- Profile recommendations

---

# 🧠 AI & Hallucination Prevention

SilverHands follows an important principle:

> **AI should assist the platform, but it should not be the source of truth for critical data.**

The system separates AI responsibilities from deterministic backend operations.

### AI handles

- Natural-language understanding
- Voice interaction
- Personalized recommendations
- Semantic matching
- Forecast explanations
- Conversational assistance

### Backend handles

- User profiles
- Match status
- Application status
- Payments
- Earnings
- Reviews
- Authentication
- Verified dates
- Reports

For example, the system does not ask an LLM:

> "Has this Provider received payment?"

Instead, the backend checks the actual payment state.

This helps reduce AI hallucinations and improves reliability for critical workflows.

---

# 🔐 Authentication & Persistence

SilverHands provides separate experiences for:

- Providers
- Customers

After login, users are redirected to their corresponding dashboard.

User information, matches, messages, applications, reviews, and earnings are persisted in the database.

Data remains available after:

- Logout
- Login
- Page refresh
- Browser restart

---

# 🏗️ System Architecture

```text
                         SILVERHANDS
                              │
              ┌───────────────┴───────────────┐
              │                               │
          CUSTOMER                         PROVIDER
              │                               │
              ↓                               ↓
       Service Request                  Profile Creation
              │                               │
              └───────────────┬───────────────┘
                              ↓
                       AI MATCHMAKING
                              │
                              ↓
                    Relevant Matches
                              │
                              ↓
                     Application Flow
                              │
                  ┌───────────┴───────────┐
                  ↓                       ↓
             Messaging               Confirmation
                                          │
                                          ↓
                                      Service
                                          │
                                          ↓
                                      Payment
                                          │
                                          ↓
                                     COMPLETED
                                      /       \
                                     ↓         ↓
                                Earnings    Reviews
                                               ↓
                                      Provider Rating
```

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- JavaScript

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- MongoDB Atlas
- MongoDB Atlas Vector Search

## AI

- Google Gemini
- Embeddings
- Semantic Matching
- Sakhi AI
- AI-powered Recommendations
- Voice AI

## Other Technologies

- REST APIs
- Speech-to-Text
- Text-to-Speech
- Persistent Messaging
- Calendar / Forecast Data
- Role-Based Authentication

---

# 📁 Project Structure

```text
SilverHands/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── ...
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have:

- Node.js
- npm
- MongoDB Atlas account
- Google Gemini API access
- Required environment variables

---

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/SilverHands.git

cd SilverHands
```

---

## 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Add any other environment variables required by the project.

**Never commit your `.env` file or API keys to GitHub.**

---

# 🗄️ MongoDB Atlas Vector Search

SilverHands can use MongoDB Atlas Vector Search for semantic matchmaking.

The vector index should be created on the collection containing Provider embeddings.

Example configuration:

```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "role",
      "type": "filter"
    }
  ]
}
```

The application should use the same configured index name, for example:

```text
vector_index
```

The stored embedding dimensions must match the vector index configuration.

---

# ▶️ Running the Project

## Start Backend

```bash
cd backend
npm run dev
```

or:

```bash
npm start
```

depending on the project configuration.

---

## Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Then open the local URL provided by Vite.

---

# 🔄 Complete Application Workflow

```text
                    SIGN UP / LOGIN
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
          CUSTOMER                    PROVIDER
              │                         │
              ↓                         ↓
       Create Request             Create Profile
              │                         │
              └────────────┬────────────┘
                           ↓
                    AI MATCHMAKING
                           ↓
                      MATCH FOUND
                           ↓
                        APPLIED
                           ↓
                       ACCEPTED
                           ↓
                 Provider ↔ Customer
                    Messaging
                           ↓
                    Both Confirm
                           ↓
                      CONFIRMED
                           ↓
                    Service + Payment
                           ↓
                     COMPLETED
                       /       \
                      ↓         ↓
                 Earnings    Review
                               ↓
                      Provider Rating
```

---

# 🎯 Project Goals

SilverHands aims to:

- Create meaningful opportunities for senior citizens and homemakers.
- Make digital interaction easier through voice AI.
- Connect customers with suitable service providers.
- Improve matchmaking using AI and semantic understanding.
- Provide a complete communication and service workflow.
- Build trust through reviews and reporting.
- Help Providers discover upcoming opportunities.
- Provide personalized recommendations.
- Maintain a simple and accessible user experience.

---

# 🌱 Future Enhancements

Potential future improvements include:

- More Indian regional languages
- Improved multilingual voice interaction
- Advanced demand forecasting
- Smarter personalized recommendations
- Enhanced trust & safety automation
- Payment gateway integration
- Notifications and reminders
- Mobile application
- Advanced Provider analytics
- More sophisticated fraud detection

---

# 🏆 Hackathon Innovation

SilverHands is more than a simple service marketplace.

It combines:

```text
AI
+
Accessibility
+
Personalization
+
Semantic Matchmaking
+
Voice Assistance
+
Communication
+
Trust & Safety
+
End-to-End Service Tracking
```

The platform supports the entire journey:

```text
Discover
   ↓
Match
   ↓
Connect
   ↓
Confirm
   ↓
Serve
   ↓
Pay
   ↓
Complete
   ↓
Review
```

### Our Core Idea

> **SilverHands connects people with opportunities while making the entire experience accessible, personalized, and trustworthy.**

---

# 📜 License

This project is developed for educational, hackathon, and demonstration purposes.

