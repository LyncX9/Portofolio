# Implementation Plan: Admin Dashboard CRUD

## Overview

This implementation plan breaks down the Admin Dashboard CRUD feature into discrete, incremental coding tasks. The feature enables portfolio content management through a secure web interface built with Vue 3, TypeScript, Pinia, and Vue Router. Tasks are organized to build foundational components first, then layer on functionality, with testing integrated throughout.

## Tasks

- [x] 1. Set up project structure and core dependencies
  - Create directory structure for admin components, stores, services, and types
  - Install required dependencies: zod for validation, uuid for ID generation
  - Set up TypeScript types and interfaces for all data models
  - Create base API configuration and error handling utilities
  - _Requirements: 9.1, 10.1_

- [x] 2. Implement data models and validation schemas
  - [x] 2.1 Create TypeScript interfaces for all content types
    - Define HeroContent, AboutContent, Skill, Project, Experience, ContactContent interfaces
    - Define AuthCredentials, AuthSession, AuthState interfaces
    - Define ApiResponse and ImageUploadResponse types
    - Create PortfolioData interface combining all content types
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 9.1_

  - [x] 2.2 Create Zod validation schemas
    - Implement heroSchema with required field validation
    - Implement projectSchema with URL and array validation
    - Implement skillSchema, experienceSchema, contactSchema
    - Implement emailSchema and urlSchema validators
    - Create validation utility functions for reuse
    - _Requirements: 2.2, 5.2, 7.2, 11.1, 11.2, 11.3_

  - [ ]* 2.3 Write property test for validation schemas
    - **Property 6: Required Field Validation Prevents Empty Submissions**
    - **Property 7: URL Format Validation**
    - **Property 8: Email Format Validation**
    - **Validates: Requirements 2.2, 5.7, 7.2, 7.6, 11.1, 11.2, 11.3**

- [x] 3. Create initial data store and file structure
  - [x] 3.1 Create portfolio-data.json with initial content
    - Define complete data structure with all sections
    - Populate with placeholder content for testing
    - Add metadata with version and lastUpdated timestamp
    - Store in data/ directory at project root
    - _Requirements: 9.1, 9.2_

  - [x] 3.2 Implement atomic file write utilities
    - Create writeDataAtomic function using temp file + rename strategy
    - Implement file locking mechanism to prevent concurrent writes
    - Add retry logic with exponential backoff
    - Create backup functionality (save to data/backups/)
    - _Requirements: 9.2, 9.6_

  - [ ]* 3.3 Write property test for atomic writes
    - **Property 22: Atomic Updates Prevent Partial Corruption**
    - **Validates: Requirements 9.6**

- [x] 4. Implement authentication backend service
  - [x] 4.1 Create password hashing and credential storage
    - Implement bcrypt password hashing (cost factor 12)
    - Create admin-credentials.json structure
    - Implement credential initialization from environment variables
    - Add credential validation function
    - _Requirements: 1.4_

  - [x] 4.2 Implement session management
    - Create sessions.json storage structure
    - Implement session creation with UUID token generation
    - Implement session validation with expiration checking
    - Add session cleanup for expired sessions
    - Implement sliding window session extension
    - _Requirements: 1.2, 12.1, 12.2_

  - [x] 4.3 Create authentication API endpoints
    - Implement POST /api/auth/login endpoint
    - Implement POST /api/auth/logout endpoint
    - Implement GET /api/auth/session endpoint
    - Add HTTP-only cookie handling with Secure and SameSite flags
    - Implement CSRF protection for state-changing operations
    - _Requirements: 1.2, 1.3, 1.5, 12.3, 12.4, 12.6_

  - [ ]* 4.4 Write property tests for authentication
    - **Property 1: Authentication with Valid Credentials Creates Session**
    - **Property 2: Authentication with Invalid Credentials Displays Error**
    - **Property 3: Expired or Invalid Sessions Redirect to Login**
    - **Property 4: Session Invalidation on Logout**
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.6, 12.2, 12.5**

- [x] 5. Implement content CRUD backend API
  - [x] 5.1 Create content retrieval endpoint
    - Implement GET /api/content endpoint
    - Read and parse portfolio-data.json
    - Add error handling for file read failures
    - Return complete PortfolioData structure
    - _Requirements: 9.3_

  - [x] 5.2 Implement Hero section update endpoint
    - Implement PUT /api/content/hero endpoint
    - Validate request body against heroSchema
    - Update hero section in portfolio data
    - Use atomic write to persist changes
    - Update metadata.lastUpdated timestamp
    - _Requirements: 2.3, 9.2_

  - [x] 5.3 Implement About section update endpoint
    - Implement PUT /api/content/about endpoint
    - Validate request body against aboutSchema
    - Handle multiple paragraphs independently
    - Preserve paragraph formatting
    - Use atomic write to persist changes
    - _Requirements: 3.2, 3.5, 3.6_

  - [x] 5.4 Implement Skills CRUD endpoints
    - Implement POST /api/content/skills (create)
    - Implement PUT /api/content/skills/:id (update)
    - Implement DELETE /api/content/skills/:id (delete)
    - Implement PUT /api/content/skills/reorder (reorder)
    - Generate unique IDs for new skills
    - Calculate order values for positioning
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 5.5 Implement Projects CRUD endpoints
    - Implement POST /api/content/projects (create)
    - Implement PUT /api/content/projects/:id (update)
    - Implement DELETE /api/content/projects/:id (delete)
    - Handle project features array manipulation
    - Handle featured status toggle
    - Validate all URLs (link, githubLink)
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.7_

  - [x] 5.6 Implement Experience CRUD endpoints
    - Implement POST /api/content/experience (create)
    - Implement PUT /api/content/experience/:id (update)
    - Implement DELETE /api/content/experience/:id (delete)
    - Implement PUT /api/content/experience/reorder (reorder)
    - Handle descriptions array manipulation
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.7 Implement Contact section update endpoint
    - Implement PUT /api/content/contact endpoint
    - Validate email format
    - Validate social link URLs
    - Handle social links array manipulation
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 5.8 Write property tests for content CRUD operations
    - **Property 5: Content Data Persistence Round-Trip**
    - **Property 12: Array Manipulation Preserves State**
    - **Property 13: Item Deletion Removes from Data Store**
    - **Property 14: Item Reordering Preserves Order**
    - **Property 15: Paragraph Formatting Preservation**
    - **Property 16: Independent Paragraph Editing**
    - **Property 17: Featured Status Toggle Persistence**
    - **Property 19: Data Validation Prevents Invalid Persistence**
    - **Property 20: Concurrent Reads Return Consistent Data**
    - **Validates: Requirements 2.3, 3.2, 3.3, 3.5, 3.6, 4.3, 4.4, 4.5, 5.4, 5.5, 6.3, 6.4, 6.5, 6.6, 7.3, 7.5, 9.2, 9.4_

- [ ] 6. Implement image upload backend service
  - [ ] 6.1 Create image upload endpoint
    - Implement POST /api/images/upload endpoint
    - Accept multipart/form-data with file
    - Validate file MIME type (jpg, png, gif, webp)
    - Validate file size (max 5MB)
    - Generate unique filename with timestamp and UUID
    - Save to public/uploads/{category}/ directory
    - Return filename and public URL
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [-] 6.2 Create image deletion endpoint
    - Implement DELETE /api/images/:filename endpoint
    - Validate filename format and security
    - Check file exists before deletion
    - Delete file from filesystem
    - _Requirements: 8.5_

  - [ ] 6.3 Implement image replacement logic
    - Create replaceImage utility function
    - Upload new image first
    - Update content reference
    - Delete old image file
    - Handle errors with rollback
    - _Requirements: 8.5_

  - [ ]* 6.4 Write property tests for image upload
    - **Property 9: Image File Type Validation**
    - **Property 10: Image Upload Generates Unique Filenames**
    - **Property 11: Image Replacement Removes Old File**
    - **Property 18: Cascading Delete Removes Associated Images**
    - **Property 25: Upload Failure Displays Error Message**
    - **Validates: Requirements 2.4, 5.6, 8.1, 8.3, 8.5, 8.7_

- [~] 7. Checkpoint - Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Create Pinia stores for state management
  - [~] 8.1 Implement Auth Store
    - Create authStore with state (isAuthenticated, session, user)
    - Implement login action calling auth service
    - Implement logout action
    - Implement checkSession action for validation
    - Implement session initialization on app load
    - Add computed getters for auth status
    - _Requirements: 1.2, 1.3, 1.5_

  - [~] 8.2 Implement Content Store
    - Create contentStore with state for all content sections
    - Implement loadContent action calling content service
    - Implement updateHero, updateAbout, updateContact actions
    - Implement createSkill, updateSkill, deleteSkill, reorderSkills actions
    - Implement createProject, updateProject, deleteProject actions
    - Implement createExperience, updateExperience, deleteExperience, reorderExperience actions
    - Add computed getters for each content section
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [~] 8.3 Implement UI Store
    - Create uiStore with state (loading, notifications, modals)
    - Implement showNotification action (success, error, warning)
    - Implement setLoading action
    - Implement openModal and closeModal actions
    - Add auto-dismiss for notifications
    - _Requirements: 10.5, 10.6_

  - [ ]* 8.4 Write unit tests for stores
    - Test auth store login/logout flows
    - Test content store CRUD operations
    - Test UI store notification management
    - Test optimistic updates and rollback
    - _Requirements: 1.2, 1.3, 2.3, 4.3, 5.3_

- [ ] 9. Implement frontend services layer
  - [~] 9.1 Create Auth Service
    - Implement authenticate(credentials) function
    - Implement logout() function
    - Implement validateSession() function
    - Add error handling and response transformation
    - _Requirements: 1.2, 1.3, 1.5_

  - [~] 9.2 Create Content Service
    - Implement fetchContent() function
    - Implement updateHero(data) function
    - Implement updateAbout(data) function
    - Implement CRUD functions for skills, projects, experience
    - Implement updateContact(data) function
    - Add error handling and validation
    - _Requirements: 2.3, 3.5, 4.3, 5.3, 6.4, 7.5_

  - [~] 9.3 Create Image Service
    - Implement uploadImage(file, category) function
    - Implement deleteImage(filename) function
    - Implement replaceImage(oldFilename, newFile, category) function
    - Add progress tracking for uploads
    - Add file validation before upload
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 9.4 Write unit tests for services
    - Test API call construction and error handling
    - Test response transformation
    - Test retry logic and timeout handling
    - _Requirements: 1.2, 2.3, 8.1_

- [ ] 10. Create reusable form components
  - [~] 10.1 Implement TextInput component
    - Create component with props (modelValue, label, placeholder, required, error)
    - Implement v-model binding with update:modelValue emit
    - Add validation error display
    - Add required field indicator
    - Style with consistent design system
    - _Requirements: 11.4_

  - [~] 10.2 Implement TextArea component
    - Create component with props (modelValue, label, placeholder, rows, required, error)
    - Implement v-model binding
    - Add auto-resize functionality
    - Add character count display
    - Add validation error display
    - _Requirements: 11.4_

  - [~] 10.3 Implement ImageUpload component
    - Create component with props (currentImage, maxSize, acceptedFormats)
    - Implement file input with drag-and-drop support
    - Add image preview functionality
    - Add upload progress indicator
    - Emit upload and remove events
    - Add client-side validation (type, size)
    - Display validation errors
    - _Requirements: 8.1, 8.2, 8.6, 8.7_

  - [~] 10.4 Implement ArrayInput component
    - Create component with props (modelValue: string[], label, placeholder, addButtonText)
    - Implement add/remove item functionality
    - Add drag-and-drop reordering
    - Emit update:modelValue on changes
    - Style with consistent design
    - _Requirements: 3.3, 5.4, 6.3, 7.3_

  - [~] 10.5 Implement ConfirmDialog component
    - Create modal component with props (isOpen, title, message, confirmText, cancelText)
    - Emit confirm and cancel events
    - Add keyboard shortcuts (Enter for confirm, Escape for cancel)
    - Add modal overlay with click-outside to close
    - Style with consistent design
    - _Requirements: 10.4_

  - [~] 10.6 Implement NotificationToast component
    - Create component with props (type, message, duration)
    - Implement auto-dismiss after duration
    - Add manual close button
    - Add enter/exit animations
    - Style based on type (success, error, warning)
    - _Requirements: 10.5, 10.6_

  - [ ]* 10.7 Write unit tests for form components
    - Test v-model binding and emit events
    - Test validation display
    - Test drag-and-drop functionality
    - Test keyboard shortcuts
    - _Requirements: 10.4, 11.4_

- [ ] 11. Implement authentication views
  - [~] 11.1 Create LoginView component
    - Create login form with username and password fields
    - Implement form validation (required fields)
    - Add submit handler calling authStore.login
    - Display error messages from auth failures
    - Add loading state during authentication
    - Redirect to /admin on successful login
    - Style with consistent design
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 11.2 Write integration tests for LoginView
    - Test successful login flow
    - Test failed login with invalid credentials
    - Test validation errors
    - Test redirect after login
    - _Requirements: 1.2, 1.3_

- [ ] 12. Implement admin dashboard layout
  - [~] 12.1 Create AdminDashboard component
    - Create main layout with sidebar and content area
    - Add AdminSidebar with navigation menu
    - Add AdminHeader with user info and logout button
    - Add router-view for dynamic content
    - Implement responsive layout (desktop and tablet)
    - _Requirements: 10.1, 10.2, 10.7_

  - [~] 12.2 Create AdminSidebar component
    - Add navigation links to all content sections
    - Highlight active section
    - Add icons for each section
    - Make responsive (collapsible on mobile)
    - _Requirements: 10.1, 10.2_

  - [~] 12.3 Create AdminHeader component
    - Display current section title
    - Show logged-in username
    - Add logout button
    - Add responsive styling
    - _Requirements: 10.2_

  - [ ]* 12.4 Write unit tests for layout components
    - Test navigation link rendering
    - Test active section highlighting
    - Test logout button functionality
    - _Requirements: 10.1, 10.2_

- [ ] 13. Implement Hero section editor
  - [~] 13.1 Create HeroEditor component
    - Load hero data from contentStore on mount
    - Create form with TextInput components for all text fields
    - Add ImageUpload component for profile image
    - Implement field validation (required fields, URL format)
    - Track dirty state for unsaved changes
    - Add Save and Cancel buttons
    - Display validation errors inline
    - Show success notification on save
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.4_

  - [~] 13.2 Implement Hero editor save logic
    - Validate all fields before save
    - Call contentStore.updateHero with form data
    - Handle image upload if new image selected
    - Update image reference in hero data
    - Show loading state during save
    - Handle errors with error notifications
    - Reset dirty state on successful save
    - _Requirements: 2.3, 2.5, 11.5, 11.6_

  - [ ]* 13.3 Write integration tests for HeroEditor
    - Test loading hero data
    - Test field validation
    - Test save operation
    - Test image upload and replacement
    - Test error handling
    - **Property 21: Failed Save Preserves Unsaved Changes**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 9.5_

- [ ] 14. Implement About section editor
  - [~] 14.1 Create AboutEditor component
    - Load about data from contentStore on mount
    - Create form with TextArea components for each paragraph
    - Add ArrayInput component for skills list
    - Add ImageUpload component for about image
    - Implement field validation
    - Track dirty state for unsaved changes
    - Add Save and Cancel buttons
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.4_

  - [~] 14.2 Implement About editor save logic
    - Validate all fields before save
    - Preserve paragraph formatting (line breaks, spacing)
    - Call contentStore.updateAbout with form data
    - Handle image upload if new image selected
    - Show loading state and notifications
    - Handle errors appropriately
    - _Requirements: 3.2, 3.5, 3.6_

  - [ ]* 14.3 Write integration tests for AboutEditor
    - Test paragraph editing independently
    - Test skills array manipulation
    - Test paragraph formatting preservation
    - Test image upload
    - _Requirements: 3.2, 3.3, 3.6_

- [~] 15. Checkpoint - Content editors progress check
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement Skills manager
  - [~] 16.1 Create SkillsManager component
    - Load skills from contentStore on mount
    - Display skills list with edit and delete buttons
    - Add "Create New Skill" button
    - Implement skill creation form (modal or inline)
    - Implement skill editing form
    - Add drag-and-drop reordering functionality
    - Show confirmation dialog before delete
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [~] 16.2 Implement Skills CRUD operations
    - Implement createSkill handler calling contentStore
    - Implement updateSkill handler calling contentStore
    - Implement deleteSkill handler calling contentStore
    - Implement reorderSkills handler for drag-and-drop
    - Validate required fields (icon, name, category)
    - Show loading states and notifications
    - Handle errors appropriately
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 16.3 Write integration tests for SkillsManager
    - Test skill creation
    - Test skill editing
    - Test skill deletion
    - Test skill reordering
    - Test validation errors
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 17. Implement Projects manager
  - [~] 17.1 Create ProjectsManager component
    - Load projects from contentStore on mount
    - Display projects list with thumbnails
    - Add "Create New Project" button
    - Implement project creation form
    - Implement project editing form
    - Add featured toggle checkbox
    - Show confirmation dialog before delete
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [~] 17.2 Implement Projects CRUD operations
    - Implement createProject handler calling contentStore
    - Implement updateProject handler calling contentStore
    - Implement deleteProject handler with cascading image delete
    - Validate required fields (title, category, description)
    - Validate URLs (link, githubLink)
    - Handle features array manipulation with ArrayInput
    - Handle image upload and replacement
    - Show loading states and notifications
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 17.3 Write integration tests for ProjectsManager
    - Test project creation with image upload
    - Test project editing
    - Test project deletion with image cleanup
    - Test featured status toggle
    - Test features array manipulation
    - Test URL validation
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 18. Implement Experience manager
  - [~] 18.1 Create ExperienceManager component
    - Load experience entries from contentStore on mount
    - Display experience list in chronological order
    - Add "Create New Experience" button
    - Implement experience creation form
    - Implement experience editing form
    - Add drag-and-drop reordering functionality
    - Show confirmation dialog before delete
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 18.2 Implement Experience CRUD operations
    - Implement createExperience handler calling contentStore
    - Implement updateExperience handler calling contentStore
    - Implement deleteExperience handler calling contentStore
    - Implement reorderExperience handler for drag-and-drop
    - Validate required fields (title, company, duration)
    - Handle descriptions array manipulation with ArrayInput
    - Show loading states and notifications
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 18.3 Write integration tests for ExperienceManager
    - Test experience creation
    - Test experience editing
    - Test experience deletion
    - Test experience reordering
    - Test descriptions array manipulation
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 19. Implement Contact section editor
  - [~] 19.1 Create ContactEditor component
    - Load contact data from contentStore on mount
    - Create form with TextInput for email and subtitle
    - Add social links management section
    - Implement add/edit/delete for social links
    - Validate email format
    - Validate social link URLs
    - Track dirty state for unsaved changes
    - Add Save and Cancel buttons
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [~] 19.2 Implement Contact editor save logic
    - Validate email format before save
    - Validate all social link URLs
    - Call contentStore.updateContact with form data
    - Show loading state and notifications
    - Handle errors appropriately
    - _Requirements: 7.2, 7.5, 7.6_

  - [ ]* 19.3 Write integration tests for ContactEditor
    - Test email validation
    - Test social links array manipulation
    - Test URL validation for social links
    - Test save operation
    - _Requirements: 7.2, 7.3, 7.6_

- [ ] 20. Implement routing and navigation guards
  - [~] 20.1 Configure Vue Router with admin routes
    - Add /admin/login route to LoginView
    - Add /admin route to AdminDashboard (protected)
    - Add /admin/hero route to HeroEditor (protected)
    - Add /admin/about route to AboutEditor (protected)
    - Add /admin/skills route to SkillsManager (protected)
    - Add /admin/projects route to ProjectsManager (protected)
    - Add /admin/experience route to ExperienceManager (protected)
    - Add /admin/contact route to ContactEditor (protected)
    - _Requirements: 10.1_

  - [~] 20.2 Implement navigation guards
    - Create beforeEach guard to check authentication
    - Redirect unauthenticated users from /admin/* to /admin/login
    - Redirect authenticated users from /admin/login to /admin
    - Call authStore.checkSession on guard execution
    - _Requirements: 1.5, 1.6_

  - [~] 20.3 Implement unsaved changes warning
    - Create beforeRouteLeave guard in editor components
    - Check dirty state before navigation
    - Show confirmation dialog if unsaved changes exist
    - Allow navigation if user confirms
    - Prevent navigation if user cancels
    - _Requirements: 10.3_

  - [ ]* 20.4 Write integration tests for routing
    - Test authentication guard redirects
    - Test protected route access
    - Test unsaved changes warning
    - **Property 23: Navigation with Unsaved Changes Shows Warning**
    - **Validates: Requirements 1.5, 1.6, 10.3_

- [ ] 21. Integrate content store with public portfolio views
  - [~] 21.1 Update HomeView to use content store
    - Load content from contentStore on mount
    - Update HeroSection to use store data
    - Update ProjectsSection to use store data
    - Update ContactSection to use store data
    - _Requirements: 2.6, 5.6, 7.5_

  - [~] 21.2 Update AboutView to use content store
    - Load content from contentStore on mount
    - Update AboutSection to use store data
    - Update SkillsSection to use store data
    - Update ExperienceSection to use store data
    - _Requirements: 3.5, 4.3, 6.4_

  - [ ]* 21.3 Write integration tests for public views
    - Test content loading from store
    - Test dynamic content display
    - Test updated content appears after save
    - _Requirements: 2.6, 3.5, 4.3, 5.6, 6.4, 7.5_

- [ ] 22. Implement error handling and user feedback
  - [~] 22.1 Add global error handler
    - Create error handling composable
    - Implement error logging
    - Show user-friendly error messages
    - Handle network errors gracefully
    - Handle validation errors with specific messages
    - _Requirements: 10.6_

  - [~] 22.2 Implement loading states
    - Add loading indicators to all async operations
    - Show skeleton loaders for content loading
    - Disable buttons during operations
    - Show progress bars for image uploads
    - _Requirements: 10.5_

  - [~] 22.3 Implement success notifications
    - Show success toast on save operations
    - Show success toast on delete operations
    - Show success toast on image upload
    - Auto-dismiss after 3 seconds
    - _Requirements: 10.5_

  - [ ]* 22.4 Write integration tests for error handling
    - Test network error handling
    - Test validation error display
    - Test success notification display
    - Test loading state management
    - _Requirements: 10.5, 10.6_

- [ ] 23. Implement form validation with Zod
  - [~] 23.1 Create validation composable
    - Create useValidation composable
    - Integrate Zod schemas with form components
    - Implement real-time validation on blur
    - Implement validation on submit
    - Return validation errors for display
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [~] 23.2 Add validation to all editor forms
    - Add validation to HeroEditor
    - Add validation to AboutEditor
    - Add validation to SkillsManager forms
    - Add validation to ProjectsManager forms
    - Add validation to ExperienceManager forms
    - Add validation to ContactEditor
    - Disable save button when validation fails
    - _Requirements: 11.5, 11.6_

  - [ ]* 23.3 Write property tests for validation
    - **Property 24: Validation Errors Prevent Form Submission**
    - **Validates: Requirements 11.5, 11.6**

- [~] 24. Checkpoint - Frontend implementation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Implement end-to-end testing
  - [ ]* 25.1 Set up E2E testing framework
    - Install and configure Playwright or Cypress
    - Create E2E test directory structure
    - Set up test data fixtures
    - Configure test environment

  - [ ]* 25.2 Write E2E tests for authentication flow
    - Test login with valid credentials
    - Test login with invalid credentials
    - Test logout
    - Test session expiration
    - Test protected route access

  - [ ]* 25.3 Write E2E tests for content management
    - Test Hero section editing end-to-end
    - Test Skills CRUD operations end-to-end
    - Test Projects CRUD operations end-to-end
    - Test Experience CRUD operations end-to-end
    - Test Contact section editing end-to-end

  - [ ]* 25.4 Write E2E tests for image upload
    - Test image upload flow
    - Test image replacement
    - Test image validation errors
    - Test image preview

  - [ ]* 25.5 Write E2E tests for validation
    - Test required field validation
    - Test email validation
    - Test URL validation
    - Test form submission prevention with errors

- [ ] 26. Implement responsive design and styling
  - [~] 26.1 Create responsive layout for admin dashboard
    - Implement mobile-friendly sidebar (collapsible)
    - Make all forms responsive for tablet and desktop
    - Add touch-friendly controls for mobile
    - Test on various screen sizes
    - _Requirements: 10.7_

  - [~] 26.2 Apply consistent design system
    - Define color palette and typography
    - Create reusable CSS classes/components
    - Apply consistent spacing and layout
    - Add hover and focus states for accessibility
    - Ensure sufficient color contrast (WCAG AA)

  - [~] 26.3 Add loading skeletons and transitions
    - Create skeleton loaders for content sections
    - Add smooth transitions between views
    - Add animations for notifications and modals
    - Optimize for performance

- [ ] 27. Implement security hardening
  - [~] 27.1 Add CSRF protection
    - Generate CSRF tokens on session creation
    - Include CSRF token in all state-changing requests
    - Validate CSRF token on backend
    - _Requirements: 12.4_

  - [~] 27.2 Implement secure cookie configuration
    - Set HTTP-only flag on session cookies
    - Set Secure flag in production (HTTPS only)
    - Set SameSite=Strict to prevent CSRF
    - _Requirements: 12.3_

  - [~] 27.3 Add input sanitization
    - Sanitize all user inputs on backend
    - Prevent XSS attacks in text fields
    - Validate file uploads thoroughly
    - Prevent path traversal in image operations

  - [~] 27.4 Implement rate limiting
    - Add rate limiting to login endpoint
    - Add rate limiting to image upload endpoint
    - Return 429 Too Many Requests when exceeded

- [ ] 28. Create documentation
  - [~] 28.1 Write API documentation
    - Document all authentication endpoints
    - Document all content CRUD endpoints
    - Document image upload endpoints
    - Include request/response examples
    - Document error codes and messages

  - [~] 28.2 Write admin user guide
    - Create guide for logging in
    - Document how to edit each content section
    - Document image upload process
    - Document validation rules
    - Add troubleshooting section

  - [~] 28.3 Write developer documentation
    - Document project structure
    - Document state management architecture
    - Document data persistence strategy
    - Document security measures
    - Add setup and deployment instructions

- [ ] 29. Implement backup and restore functionality
  - [~] 29.1 Create backup endpoint
    - Implement GET /api/admin/backup endpoint
    - Return current portfolio-data.json as download
    - Include timestamp in filename
    - _Requirements: 9.1_

  - [~] 29.2 Create restore endpoint
    - Implement POST /api/admin/restore endpoint
    - Accept uploaded backup JSON file
    - Validate backup file structure
    - Create backup before restore
    - Restore data atomically
    - _Requirements: 9.2, 9.6_

  - [~] 29.3 Implement automatic backup on save
    - Create backup before each write operation
    - Store in data/backups/ directory
    - Keep last 10 backups
    - Clean up old backups automatically
    - _Requirements: 9.6_

- [ ] 30. Implement deployment preparation
  - [~] 30.1 Set up environment variables
    - Create .env.example file
    - Document all required environment variables
    - Set up admin credentials from environment
    - Configure production vs development settings

  - [~] 30.2 Create production build configuration
    - Configure Vite for production build
    - Optimize bundle size
    - Enable source maps for debugging
    - Configure asset optimization

  - [~] 30.3 Create deployment scripts
    - Create script for initial setup
    - Create script for database initialization
    - Create script for running migrations
    - Document deployment process

  - [~] 30.4 Set up health check endpoint
    - Implement GET /api/health endpoint
    - Return system status and version
    - Check data store accessibility
    - Check file system permissions

- [~] 31. Final checkpoint and testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 32. Integration and final wiring
  - [~] 32.1 Wire all components together
    - Verify all routes are properly configured
    - Verify all stores are properly initialized
    - Verify all services are properly connected
    - Test complete user flows end-to-end

  - [~] 32.2 Perform final testing
    - Test authentication flow completely
    - Test all CRUD operations for each section
    - Test image upload and replacement
    - Test validation and error handling
    - Test responsive design on multiple devices
    - Test session management and expiration

  - [~] 32.3 Performance optimization
    - Optimize image loading and caching
    - Optimize bundle size with code splitting
    - Add lazy loading for admin routes
    - Optimize API calls with caching where appropriate

  - [~] 32.4 Final code review and cleanup
    - Remove console.log statements
    - Remove unused imports and code
    - Ensure consistent code formatting
    - Verify all TypeScript types are properly defined
    - Check for any TODO comments

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- E2E tests validate complete user workflows
- The implementation follows a bottom-up approach: backend services → state management → UI components → integration
- All forms include validation to prevent invalid data submission
- All async operations include loading states and error handling
- Image uploads include client-side and server-side validation
- Security measures are implemented throughout (authentication, CSRF protection, input sanitization)
- The data persistence strategy uses atomic writes to prevent corruption
- Backup functionality ensures data can be recovered if needed
- The admin dashboard is responsive and works on desktop and tablet devices

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["2.3", "3.2"] },
    { "id": 3, "tasks": ["3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 7, "tasks": ["5.5", "5.6", "5.7"] },
    { "id": 8, "tasks": ["5.8", "6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3"] },
    { "id": 10, "tasks": ["6.4"] },
    { "id": 11, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 12, "tasks": ["8.4", "9.1", "9.2", "9.3"] },
    { "id": 13, "tasks": ["9.4", "10.1", "10.2", "10.3"] },
    { "id": 14, "tasks": ["10.4", "10.5", "10.6"] },
    { "id": 15, "tasks": ["10.7", "11.1"] },
    { "id": 16, "tasks": ["11.2", "12.1"] },
    { "id": 17, "tasks": ["12.2", "12.3"] },
    { "id": 18, "tasks": ["12.4", "13.1"] },
    { "id": 19, "tasks": ["13.2"] },
    { "id": 20, "tasks": ["13.3", "14.1"] },
    { "id": 21, "tasks": ["14.2"] },
    { "id": 22, "tasks": ["14.3"] },
    { "id": 23, "tasks": ["16.1"] },
    { "id": 24, "tasks": ["16.2"] },
    { "id": 25, "tasks": ["16.3", "17.1"] },
    { "id": 26, "tasks": ["17.2"] },
    { "id": 27, "tasks": ["17.3", "18.1"] },
    { "id": 28, "tasks": ["18.2"] },
    { "id": 29, "tasks": ["18.3", "19.1"] },
    { "id": 30, "tasks": ["19.2"] },
    { "id": 31, "tasks": ["19.3", "20.1"] },
    { "id": 32, "tasks": ["20.2", "20.3"] },
    { "id": 33, "tasks": ["20.4", "21.1", "21.2"] },
    { "id": 34, "tasks": ["21.3", "22.1", "22.2", "22.3"] },
    { "id": 35, "tasks": ["22.4", "23.1"] },
    { "id": 36, "tasks": ["23.2"] },
    { "id": 37, "tasks": ["23.3"] },
    { "id": 38, "tasks": ["25.1"] },
    { "id": 39, "tasks": ["25.2", "25.3", "25.4", "25.5"] },
    { "id": 40, "tasks": ["26.1", "26.2", "26.3"] },
    { "id": 41, "tasks": ["27.1", "27.2", "27.3", "27.4"] },
    { "id": 42, "tasks": ["28.1", "28.2", "28.3"] },
    { "id": 43, "tasks": ["29.1", "29.2", "29.3"] },
    { "id": 44, "tasks": ["30.1", "30.2", "30.3", "30.4"] },
    { "id": 45, "tasks": ["32.1"] },
    { "id": 46, "tasks": ["32.2", "32.3"] },
    { "id": 47, "tasks": ["32.4"] }
  ]
}
```
