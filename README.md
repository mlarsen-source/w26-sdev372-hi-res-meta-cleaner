## 1. Project Overview

### Project Name: Hi-Res Meta Cleaner

### Tagline:

Simplify and automate audio metadata management for your music collection.

### Problem Statement:

Music collectors with large audio libraries face a frustrating problem:
inconsistent, missing, or incorrect
metadata tags across hundreds or thousands of audio files. Manual editing is
tedious and time-consuming.
There's no easy way to batch-edit metadata, standardize formatting across a
collection, or identify inconsistencies
without clicking through files one by one.
Hi-Res Meta Cleaner solves this by providing a web-based platform where users can
upload audio files, view and edit
metadata in a unified interface, apply batch edits across multiple tracks, and
export their cleaned collection with updated tags.

### Target Users

- Music collectors with large personal libraries who want consistent tagging
- Archivists digitizing and organizing audio collections
- Anyone frustrated by the tedious process of manually fixing metadata tags

---

## 2. Feature Breakdown

### MVP Features (Sprint 1)

**Core functionality that establishes the basic workflow:**

- File Upload System: Users can upload audio files individually or in batches
- Metadata Extraction: Automatically read and display existing metadata tags
- Collection View: Display all uploaded files in a sortable table showing metadata
  fields
- Individual Field Edit: Click any field to edit metadata for a single track
- Export Functionality: Export modified audio files with updated tags

### MVP Feature Details (Sprint 2)

- User Authentication: Simple login system to keep collections private per user
- Make Collection View table sortable
- Dupo Checking
- Nav Bar with links to Upload, View Collection, Export

### Extended Features (Sprint 3+)

- Batch Edit: Select multiple tracks and edit shared fields
- Automated Cleanup: Trim whitespace, standardize capitalization, remove special
  characters or normalize formatting
- Duplicate Detection: Identify potential duplicate tracks
- External API Integration: Fetch missing metadata from external sources
- Album Art Management: Upload, edit, or fetch album artwork for audio files

---

## 3. Data Model Planning

### Core Entities

**Users**

- Stores user account information
- Fields: `user_id` (PK), `username`, `email`, `password_hash`, `created_at`
  **AudioFiles**
- Represents each uploaded audio file with its original state
- Fields: `file_id` (PK), `user_id` (FK), `original_filename`, `file_path`,
  `file_size`, `duration`, `format`, `upload_date`
  **Metadata**
- Stores the current metadata for each audio file
- Fields: `metadata_id` (PK), `file_id` (FK), `title`, `artist`, `album`, `year`,
  `genre`, `track_number`

### Key Relationships

- **Users → AudioFiles**: One-to-Many (a user can upload many audio files)
- **AudioFiles → Metadata**: One-to-One (each file has one set of metadata)

---

## 4. User Experience

### User Flows

**Upload and View Collection**

1. User logs in and uploads audio files
2. System extracts metadata and displays it in a sortable table
   **Edit Individual**
3. User clicks any metadata field to edit inline
4. Types new value and saves
5. Change is immediately reflected
   **Batch Edit** _(Extended Feature)_
6. User selects multiple tracks via checkboxes
7. Opens batch edit modal and modifies shared fields
8. Applies changes to all selected tracks
   **Export**
9. User exports cleaned audio files

### Wireframes/Sketches

**Single Page Application - Main View**

````
+----------------------------------------------------------+
| [Export] [Login/Logout]|
+----------------------------------------------------------+
| UPLOAD SECTION |
| +----------------------------------------------------+ |
| | | |
| | Drag & Drop Files Here or Click to Browse | |
| | | |
| | | |
| +----------------------------------------------------+ |
+----------------------------------------------------------+
| YOUR COLLECTION |
+----------------------------------------------------------+
| Search: [___________] Filter: [All ▼] |
+----------------------------------------------------------+
| [ ] | Title | Artist | Album | Year |☐
|-----|--------------|-------------|-------------|----------|
| [ ] | Track One | Artist A | Album X | 2020 |☐
| [ ] | Track Two | Artist A | Album X | 2020 |☐
| [ ] | Track Three | Artist B | Album Y | 2019 |☐
+-----------

---
## 5. Testing

**Server coverage**
- Unit tests cover authentication middleware, JWT helpers, password hashing, request validation, file validation, response mappers, empty-field removal, and file-size formatting.
- Integration tests cover user creation, login cookie handling, protected uploads, invalid file rejection, duplicate upload handling, metadata retrieval, metadata updates, and download error handling.

**Front-end coverage**
- Unit tests cover audio-file filtering, metadata formatting helpers, filename splitting, inline edit requests, the authenticated fetch wrapper, and the upload and collection hooks.
- Integration tests cover login and register page behavior, upload-to-collection workflow behavior, duplicate upload messaging, and inline metadata editing.
- Cypress end-to-end tests cover signed-out home behavior, registration, login, invalid login handling, and logout in a browser flow.

**Quality checks**
- Front-end ESLint
- Front-end TypeScript type checking
- Front-end production build
- Server ESLint

### Install Dependencies
Install dependencies in both workspaces before running tests:

```bash
cd server
npm ci

cd ../front-end
npm ci
```

### Run Tests Individually

The commands below assume you start from the repository root in Bash.

**Server**

Run all server tests:

```bash
cd server
npm test
```

Run only server unit tests:

```bash
cd server
npm test -- --exclude=__tests__/api.integration.test.js
```

Run only the server integration tests:

```bash
cd server
npm test -- __tests__/api.integration.test.js
```

Run server lint:

```bash
cd server
npm run lint
```

**Front-end**

Run all front-end Vitest tests:

```bash
cd front-end
npm test
```

Run only front-end unit tests:

```bash
cd front-end
npm test -- --exclude=__tests__/*.integration.test.tsx
```

Run only the front-end integration tests:

```bash
cd front-end
npm test -- __tests__/auth-pages.integration.test.tsx __tests__/workflows.integration.test.tsx
```

Run front-end lint:

```bash
cd front-end
npm run lint
```

Run front-end type checks:

```bash
cd front-end
npm run typecheck
```

Run the front-end production build:

```bash
cd front-end
npm run build
```

### Run Cypress Tests

The Cypress suite depends on the API being available at `http://localhost:3001`.

Start the server in one terminal:

```bash
cd server
npm run dev
```

Then use one of the following in a second terminal:

Open Cypress interactively:

```bash
cd front-end
npm run dev
```

In a third terminal:

```bash
cd front-end
npm run cy:open
```

Run Cypress headlessly against an already running front-end:

```bash
cd front-end
npm run dev
```

In a third terminal:

```bash
cd front-end
npm run cy:run
```

Run the E2E workflow with Next.js started automatically:

```bash
cd front-end
npm run test:e2e
```

`npm run test:e2e` starts the Next.js app automatically, waits for `http://localhost:3000`, and then runs Cypress. The backend still needs to be running separately.
````
