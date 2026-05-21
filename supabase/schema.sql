-- ============================================================
-- Portfolio Data Table
-- Run this once in the Supabase SQL Editor before deploying
-- ============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS portfolio_data (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  data       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ensure only one row ever exists (the app always uses id = 1)
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_data_single_row
  ON portfolio_data ((id = 1));

-- Disable Row Level Security — access is controlled by the service role key
-- which is only used server-side and never exposed to the browser
ALTER TABLE portfolio_data DISABLE ROW LEVEL SECURITY;

-- Seed the initial row so the first upsert works correctly
INSERT INTO portfolio_data (id, data)
VALUES (1, '{
  "hero": {
    "greeting": "Hello! I Am",
    "name": "Bagas Firmansyah",
    "title": "Aspiring Web Developer",
    "description": "Currently learning and building frontend projects while studying at",
    "bio": "I am a web development enthusiast who enjoys turning ideas into simple, usable interfaces.",
    "profileImage": "",
    "universityLink": "https://nusaputra.ac.id"
  },
  "about": {
    "paragraphs": [
      "I am a frontend development student who enjoys turning ideas into simple, usable web interfaces.",
      "I started learning web development on my own, experimenting with small features and gradually understanding how real websites are built.",
      "Right now, I am focused on becoming a better frontend engineer by learning modern tools and writing cleaner code."
    ],
    "skills": ["HTML", "CSS", "JavaScript", "Vue.js"],
    "aboutImage": ""
  },
  "skills": [
    {"id": "1", "name": "HTML", "icon": "⚡", "category": "Frontend", "order": 1},
    {"id": "2", "name": "CSS", "icon": "🟢", "category": "Frontend", "order": 2},
    {"id": "3", "name": "JavaScript", "icon": "🔷", "category": "Language", "order": 3},
    {"id": "4", "name": "Vue.js", "icon": "💙", "category": "Frontend", "order": 4}
  ],
  "projects": [
    {
      "id": "1",
      "title": "PocketExpenseMonitor",
      "category": "Featured Project",
      "description": "A mobile app to track daily expenses and manage budgets effectively.",
      "features": ["Responsive Design", "Offline Support", "Data Visualization"],
      "image": "",
      "link": "https://github.com/LyncX9/PocketExpenseMonitor.git",
      "featured": true,
      "order": 1
    }
  ],
  "experience": [
    {
      "id": "1",
      "title": "Network Technician (Fiber Optic)",
      "company": "PT Putra Jaya Raharja",
      "duration": "2022 - 2023",
      "descriptions": [
        "Installing and terminating fiber optic cables for customer network needs.",
        "Handling internet outage troubleshooting in the field.",
        "Coordinating with the backend team to ensure tickets are resolved quickly.",
        "Performing routine network maintenance to maintain connection quality."
      ],
      "order": 1
    }
  ],
  "contact": {
    "email": "bagaskazama3818@gmail.com",
    "subtitle": "I am available for roles where I can contribute as a Web Developer. Feel free to contact me.",
    "socialLinks": [
      {"id": "1", "icon": "📧", "label": "Email", "href": "mailto:bagaskazama3818@gmail.com"},
      {"id": "2", "icon": "💼", "label": "LinkedIn", "href": "https://www.linkedin.com/in/bagas-firmansyah-a4a16a262"},
      {"id": "3", "icon": "🐙", "label": "GitHub", "href": "https://github.com/LyncX9"}
    ]
  },
  "metadata": {
    "lastUpdated": "2026-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
