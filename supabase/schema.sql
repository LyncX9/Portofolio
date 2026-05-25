-- ============================================================
-- Portfolio Data Table
-- Run once in the Supabase SQL Editor, or apply as a migration.
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_data (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS portfolio_data_single_row
  ON portfolio_data ((id = 1));

ALTER TABLE portfolio_data DISABLE ROW LEVEL SECURITY;

INSERT INTO portfolio_data (id, data, updated_at)
VALUES (
  1,
  $portfolio$
  {
    "hero": {
      "greeting": "Hello",
      "name": "Concurrent 4",
      "title": "Software Developer",
      "description": "Building amazing things",
      "bio": "Passionate developer",
      "profileImage": "/images/profile.jpg",
      "universityLink": "https://university.edu"
    },
    "about": {
      "paragraphs": [
        "First paragraph",
        "Second paragraph"
      ],
      "skills": [
        "JavaScript",
        "TypeScript",
        "Vue",
        "Python",
        "Tailwind",
        "Flutter",
        "Laravel"
      ],
      "aboutImage": "/images/about.jpg"
    },
    "skills": [
      {
        "id": "1",
        "name": "JavaScript",
        "icon": "js-icon",
        "category": "Frontend",
        "order": 1
      }
    ],
    "projects": [],
    "certificates": [],
    "experience": [],
    "contact": {
      "email": "bagaskazama3818@gmail.com",
      "subtitle": "Ready to collaborate, build something useful, or talk about a new opportunity? Pick your favorite channel below.",
      "socialLinks": [
        {
          "id": "1",
          "icon": "github",
          "label": "GitHub",
          "href": "https://github.com/LyncX9"
        },
        {
          "id": "2",
          "icon": "gmail",
          "label": "Gmail",
          "href": "https://mail.google.com/mail/?view=cm&fs=1&to=bagaskazama3818%40gmail.com"
        },
        {
          "id": "3",
          "icon": "whatsapp",
          "label": "WhatsApp",
          "href": "https://wa.me/6281234567890"
        },
        {
          "id": "4",
          "icon": "linkedin",
          "label": "LinkedIn",
          "href": "https://www.linkedin.com/in/bagas-firmansyah-a4a16a262"
        }
      ]
    },
    "metadata": {
      "lastUpdated": "2026-05-25T21:54:53.771Z",
      "version": "1.0.0"
    }
  }
  $portfolio$::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data,
    updated_at = NOW();
