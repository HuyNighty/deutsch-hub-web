# Business Flows

Business Flows describe how each business area of DeutschHub enables users to accomplish a business objective.

Unlike User Journeys, which focus on the user's long-term experience, Business Flows describe the operational processes inside the platform.

Each Business Flow represents a single business objective and defines the interactions required to complete that objective.

These flows provide a shared understanding for Product Design, UI/UX Design, Frontend, Backend and QA throughout the development process.

---

# Business Area — Learn German

The Learn German business area provides structured learning experiences that guide users from their first lesson to course completion.

---

## Business Flow — Enroll in First Course

### Objective

Enable a learner to enroll in their first German course.

### Business Value

Provide a clear and guided entry point into the learning ecosystem.

### Primary Persona

Study Abroad Learner

### Supporting Personas

- Germany Enthusiast
- Traveler

### Trigger

A learner chooses to begin studying German.

### Entry Points

- Learn German
- Study in Germany → Requirements
- Home
- Google Search
- Shared Course Link
- Explore Germany

### Main Flow

Learn German

↓

Placement Test (Optional)

↓

Learning Path Recommendation

↓

Course Catalog

↓

Course Detail

↓

Authentication (if required)

↓

Course Enrollment

↓

My Learning

### Alternative Flows

#### Skip Placement Test

Learn German

↓

Start with A1

↓

Course Catalog

---

#### Authenticated User

Course Detail

↓

Course Enrollment

↓

My Learning

---

#### Direct Course Access

Google Search

↓

Course Detail

↓

Authentication

↓

Course Enrollment

↓

My Learning

### Completion

The learner has successfully enrolled in a course and is ready to begin learning.

---

## Business Flow — Complete First Lesson

### Objective

Enable a learner to complete their first lesson successfully.

### Business Value

Help learners establish an effective learning habit from the beginning.

### Primary Persona

Study Abroad Learner

### Supporting Personas

- Germany Enthusiast

### Trigger

The learner has enrolled in a course.

### Entry Points

- My Learning
- Continue Learning
- Lesson Link

### Main Flow

My Learning

↓

Course

↓

Section

↓

Lesson

↓

Complete Lesson

↓

Learning Progress Updated

↓

Recommend Next Lesson

### Alternative Flows

- Resume Learning
- Review Completed Lesson

### Completion

The learner completes the lesson and unlocks the next learning activity.

---

## Business Flow — Complete Course

### Objective

Enable a learner to successfully finish a course.

### Business Value

Measure learning achievement and encourage continued learning.

### Primary Persona

Study Abroad Learner

### Trigger

All required lessons and assessments have been completed.

### Entry Points

- Continue Learning

### Main Flow

Continue Learning

↓

Remaining Lessons

↓

Final Assessment

↓

Course Completed

↓

Certificate

↓

Recommend Next Course

### Completion

The learner completes the course and receives recommendations for the next stage of learning.

---

# Business Area — Explore Germany

The Explore Germany business area allows users to discover Germany through reliable and engaging content.

---

## Business Flow — Explore Germany

### Objective

Help users discover information about Germany.

### Business Value

Increase user engagement and strengthen interest in Germany.

### Primary Persona

Germany Enthusiast

### Supporting Personas

- Traveler
- Study Abroad Learner

### Trigger

The user wants to explore Germany.

### Entry Points

- Home
- Search Engine
- Shared Link
- Navigation

### Main Flow

Explore Germany

↓

Select Category

↓

Browse Content

↓

Read Article

↓

Related Content

↓

Continue Exploring

### Categories

- Cities
- Nature
- Culture
- Food

### Alternative Flows

- Search Content
- Browse Featured Content

### Completion

The user discovers valuable information and continues exploring related content.

---

# Business Area — Study in Germany

The Study in Germany business area supports learners throughout their study-abroad preparation.

---

## Business Flow — Discover Study Journey

### Objective

Help learners understand the complete study-abroad process.

### Business Value

Reduce uncertainty by providing a structured preparation journey.

### Primary Persona

Study Abroad Learner

### Trigger

The learner plans to study or work in Germany.

### Entry Points

- Home
- Learn German
- Search Engine

### Main Flow

Study in Germany

↓

Planning

↓

Requirements

↓

Application

↓

Preparation

↓

Life in Germany

### Alternative Flows

- Start from Requirements
- Resume Previous Progress

### Completion

The learner understands the next step in their study-abroad journey.

---

# Business Area — Stories

The Stories business area shares authentic experiences from people connected with Germany.

---

## Business Flow — Read Story

### Objective

Help users learn from real experiences shared by the community.

### Business Value

Build trust, inspiration and community engagement.

### Primary Persona

Germany Enthusiast

### Supporting Personas

- Traveler
- Study Abroad Learner
- Germany Resident

### Trigger

The user wants authentic perspectives.

### Entry Points

- Stories
- Home
- Shared Link

### Main Flow

Stories

↓

Select Story

↓

Read Story

↓

Related Stories

↓

Continue Reading

### Completion

The user gains valuable insights and continues exploring community experiences.

---

# Business Area — Account

The Account business area manages authentication, identity and personal learning information.

---

## Business Flow — Create Account

### Objective

Create a new learner account.

### Business Value

Enable personalized learning experiences.

### Trigger

The user requires features available only to authenticated users.

### Entry Points

- Login
- Course Enrollment
- Header

### Main Flow

Register

↓

Email Verification

↓

Profile Creation

↓

Dashboard

### Completion

The account is successfully created and ready for use.

---

## Business Flow — Authenticate User

### Objective

Authenticate an existing user.

### Business Value

Provide secure access to personalized features.

### Entry Points

- Login
- Protected Resource

### Main Flow

Login

↓

Authentication

↓

Dashboard

### Alternative Flows

- Forgot Password

### Completion

The user successfully accesses their personal workspace.
