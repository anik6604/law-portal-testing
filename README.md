# TAMU Law Resume Portal

A secure, student-developed web application for Texas A&M University School of Law to assist with adjunct faculty hiring and resume management.  
This frontend prototype includes a mock login, a landing dashboard, and a fully functional adjunct application form with validation and file uploads.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Form Behavior](#form-behavior)
- [Planned Integrations](#planned-integrations)
- [Credits](#credits)
- [License](#license)
- [Contact](#contact)

---

## Overview
The TAMU Law Resume Portal provides a foundation for managing adjunct faculty applications.  
It is built with React and will later integrate with Texas A&M’s NetID system and an on-premise backend database for secure resume storage and AI-assisted querying.

**Current functionality:**
- Mock login screen that simulates authentication  
- Landing page with navigation tiles  
- Adjunct application submission form with validation and confirmation  

---

## Features

### Modern React Frontend
- Built with React + Vite + React Router  
- Clean CSS with TAMU maroon theme  

### Login Page
- Simulated “Login with NetID” button  
- Redirects to the main faculty portal  

### Landing Page
- Two sections:  
  - AI Chatbot (disabled placeholder)  
  - Adjunct Application Portal (active and accessible)  

### Adjunct Application Page
- Required fields: Full Name, Email, Phone, Resume (PDF)  
- Optional fields: Cover Letter, Comments / Notes  
- **Phone input:**  
  - Accepts digits only  
  - Auto-formats to `xxx-xxx-xxxx`  
  - Strips country codes (`+1`, `001`) and extensions  
  - Enforces exactly 10 U.S. digits before allowing submission  
- Confirmation popup before submission  
- Inline success banner (no browser alerts)  
- Cancel button returns to the landing page  

### Form Validation
- Uses native HTML validation plus custom JS for strict input enforcement  

---

## Requirements
- Node.js v18 or later  
- npm v9 or later (or Yarn / pnpm)  
- Compatible with modern browsers: Chrome, Edge, Firefox, Safari  

No backend or authentication setup is required yet.

---

## Installation
```bash
# Clone the repository
git clone https://github.com/<your-repo-name>.git
cd tamu-law-resume-portal

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Then open:

http://localhost:5173/

## Project Structure
```plaintext
src/
│
├── components/
│   ├── TopBar.jsx                 # Shared top bar (TAMU Law branding and logout)
│   └── TileCard.jsx               # Reusable card component for landing page tiles
│
├── pages/
│   ├── LoginPage.jsx              # Mock NetID login page
│   ├── LandingPage.jsx            # Main faculty portal landing page
│   └── AdjunctApplicationPage.jsx # Application form (auto-formatting phone, confirm modal)
│
├── App.jsx                        # Defines routes and navigation logic
└── theme.css                      # Global colors, layout, and component styles
```


---

## Usage
1. Run `npm run dev` and open [http://localhost:5173/](http://localhost:5173/)  
2. Click **Login with NetID** to enter the portal (mock login)  
3. Use the **Adjunct Application Portal** tile to access the form  
4. Fill in required fields and upload a PDF resume  
5. Confirm submission in the modal  
6. The form displays an inline success banner upon submission  

---

## Form Behavior

### Phone Input
- Normalizes away `+1`, `1`, spaces, parentheses, and extensions  
- Forces exactly 10 numeric digits  
- Automatically formats as `###-###-####`  

### File Uploads
- Accepts only `.pdf` files  
- Clears uploaded files after successful submission  

### Validation Flow
1. User completes form and clicks “Submit Application”  
2. Input validation occurs  
3. A confirmation modal appears  
4. Upon confirmation, form data is “submitted” (mock)  
5. Inline success banner is displayed  

---

## Planned Integrations

### NetID / Entra ID Authentication
- Future integration using Microsoft Entra ID (OIDC)  
- Will replace the mock login and restrict access to TAMU accounts  

### Backend and Database
- Planned backend: Node.js + Express + PostgreSQL/MySQL  
- Endpoint: `/api/applications` for storing submissions  
- Schema will include applicant data and file metadata  

### AI Resume Processing
- Future local AI service to extract structured data from PDF resumes  
- Enables search queries such as “Who can teach Cyber Law?”  

---

## Credits
- Anik Momin – Developer and Project Lead  
- Steven Vaughn – Project Sponsor, Director of Graduate Programs (TAMU Law)  
- Dr. Pauline Wade – Course Instructor, Professor of Practice (CSCE)  
- Brady Kincaid Testa – Teaching Assistant (CSCE)

## License
This project is licensed under the **MIT License**.

---

## Contact
For project information or future collaboration:

- **Anik Momin** – [anikmomin@tamu.edu](mailto:anikmomin@tamu.edu)
- **Mitchell Good** – [gm10073103@tamu.edu](mailto:gm10073103@tamu.edu)  
- **Adeeb Momin** – [adeeb_momin@tamu.edu](mailto:adeeb_momin@tamu.edu)  
- **Abhinav Devireddy** – [abhidev979@tamu.edu](mailto:abhidev979@tamu.edu)  
- **Ryan Mohammadian** – [ryanm64@tamu.edu](mailto:ryanm64@tamu.edu)
- **Steven Vaughn** – [steven.vaughn@law.tamu.edu](mailto:steven.vaughn@law.tamu.edu)  
- **Dr. Pauline Wade** – [paulinewade@tamu.edu](mailto:paulinewade@tamu.edu)  
- **Brady Kincaid Testa** – [btesta@tamu.edu](mailto:btesta@tamu.edu)  


