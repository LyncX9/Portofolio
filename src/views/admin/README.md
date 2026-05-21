# Admin Views

This directory contains top-level view components for the admin dashboard.

## Views

- **LoginView**: Admin authentication page
- **AdminDashboard**: Main admin dashboard layout with navigation
- **HeroEditor**: Hero section content editor
- **AboutEditor**: About section content editor
- **SkillsManager**: Skills CRUD interface
- **ProjectsManager**: Projects CRUD interface
- **ExperienceManager**: Experience CRUD interface
- **ContactEditor**: Contact information editor

## Routing

All admin views are protected by authentication guards and require a valid session to access.

Routes:
- `/admin/login` - Login page (public)
- `/admin` - Dashboard home (protected)
- `/admin/hero` - Hero editor (protected)
- `/admin/about` - About editor (protected)
- `/admin/skills` - Skills manager (protected)
- `/admin/projects` - Projects manager (protected)
- `/admin/experience` - Experience manager (protected)
- `/admin/contact` - Contact editor (protected)
