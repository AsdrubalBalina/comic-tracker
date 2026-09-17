# Comic Tracker

A full-stack web application for managing personal comic book collections, built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

Comic Tracker lets users manage their collection manually or discover and import comic book issues through the Metron API. It includes individual comic detail pages, series-based navigation, reading progress, and batch imports.

## Features

### Collection management

* Create, view, update, and delete comics
* Open an individual detail page for each comic
* View covers, descriptions, publication information, and creators
* Search comics in the local collection
* Filter by publisher and reading status
* Sort by title, publication year, and rating
* Track reading status and personal ratings
* Browse the collection by individual comics or series
* View owned and missing issues within a series
* Responsive web interface

### Metron integration

* Search the external Metron comic catalog
* Filter searches by series, issue number, and year
* Navigate paginated catalog results
* Import individual comics or multiple selected issues
* Automatically import metadata, covers, creators, and creator roles
* Prevent duplicate external imports
* Retrieve series issues with in-memory caching
* Handle external API errors, including rate limits and service unavailability

### Backend and testing

* REST API built with Express
* PostgreSQL transactions with rollback for comic imports
* Separate development and test databases
* Automated tests with Jest and Supertest
* Docker-based PostgreSQL environment

## Tech Stack

| Area           | Technologies                               |
| -------------- | ------------------------------------------ |
| Backend        | Node.js, Express.js, `pg`, `dotenv`        |
| Frontend       | HTML5, CSS3, vanilla JavaScript, Fetch API |
| Database       | PostgreSQL 16                              |
| Testing        | Jest, Supertest                            |
| Infrastructure | Docker, Docker Compose                     |
| External API   | Metron API                                 |

## Project Structure

```text
comic-tracker/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── app.js
│   ├── db.js
│   └── server.js
├── database/
│   └── init.sql
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── comic.html
│   ├── comic.js
│   ├── comic.css
│   ├── series.html
│   ├── series.js
│   ├── add-comic.html
│   └── add-comic.js
├── .env.example
├── .env.test.example
├── docker-compose.yml
├── package.json
└── README.md
```

The backend separates routing, request handling, external API services, and database configuration.

The Express server serves both the REST API and the static frontend.

## Database

Comic Tracker uses PostgreSQL as its relational database.

The main data model includes:

* `comics` — comic information, reading status, ratings, series identifiers, and external metadata
* `creators` — creators imported from external sources
* `comic_creators` — many-to-many relationship between comics and creators, including their roles

A unique index on the external source and comic identifier prevents duplicate external imports.

Creator relationships use foreign keys with cascading deletion.

## Metron Integration

Comic Tracker integrates with the Metron API to retrieve comic book information, including:

* Series and issue information
* Cover images
* Publisher information
* Publication dates
* Descriptions
* Creators and their roles

Imported data is normalized by the backend before being stored in PostgreSQL.

### Error handling

The Metron service centralizes external API requests and handles network failures, authentication errors, rate limits, unavailable resources, and invalid responses.

When Metron returns a rate-limit error during a batch import, the application stops requesting additional issues while preserving comics that were successfully imported earlier in the batch.

### Series issue caching

Series issue lists are cached in memory for 15 minutes to reduce repeated requests to Metron.

Concurrent requests for the same series share an in-progress request. Incomplete or failed downloads are not stored in the cache.

The cache is temporary and is cleared when the backend process restarts.

## Import Transactions

External comic imports use PostgreSQL transactions to keep related database operations consistent.

A comic and its associated creators are inserted as part of the import process. If an operation fails, the transaction is rolled back instead of leaving partially imported data in the database.

Batch imports detect duplicate identifiers and return a summary of imported, duplicated, and failed issues.

## Requirements

Before running the project, install:

* Node.js
* npm
* Docker
* Docker Compose

A Metron API token is required to use the external catalog functionality.

## Installation

Clone the repository:

```bash
git clone https://github.com/AsdrubalBalina/comic-tracker.git
cd comic-tracker
```

Install the Node.js dependencies:

```bash
npm install
```

Create your development environment file from the provided example.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Configure the required variables in `.env` using the values defined for your local database:

```dotenv
DB_USER=comic_user
DB_HOST=localhost
DB_NAME=comic_tracker
DB_PASSWORD=your_database_password
DB_PORT=5432

METRON_API_TOKEN=your_metron_api_token
```

Replace the placeholder values with your own database credentials and Metron API token.

Do not commit `.env`, `.env.test`, or real credentials to version control.

## Starting the Database

Start the development and test PostgreSQL containers:

```bash
docker compose up -d
```

Docker Compose provides:

* Development database on port `5432`
* Test database on port `5433`

The database schema is initialized from `database/init.sql`.

Check the containers:

```bash
docker compose ps
```

## Running the Application

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

From the collection, select a comic card to open its individual detail page.

The detail page displays the available comic metadata and provides links to return to the collection or edit the comic.

## Running Tests

Create the test environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.test.example .env.test
```

**macOS/Linux:**

```bash
cp .env.test.example .env.test
```

Configure `.env.test` with the credentials and port of the dedicated test database.

Make sure the test PostgreSQL container is running, then execute:

```bash
npm test
```

The automated tests cover:

* Comic CRUD operations and request validation
* Metron API error handling
* Series issue caching
* Concurrent request deduplication
* Prevention of caching incomplete results
* Batch import behavior when Metron reaches its rate limit
* Preservation of successful imports when a later request fails

The CRUD integration tests use a dedicated PostgreSQL database instead of the development database. Metron service and batch import tests use mocks to verify external API and database interactions.

## REST API

### Comics

```http
GET    /api/comics
GET    /api/comics/:id
POST   /api/comics
PUT    /api/comics/:id
DELETE /api/comics/:id
```

Collection queries support search, publisher filtering, reading-status filtering, and sorting.

### External Catalog

```http
GET /api/catalog/search
GET /api/catalog/issues/:id
```

### Series

```http
GET /api/series
GET /api/series/:id/issues
```

### Imports

```http
POST /api/comics/import
POST /api/comics/import-batch
```

## Testing Status

Latest verified local test run:

```text
Tests: 16 passed, 16 total
```

## Project Status

Comic Tracker is under active development.

The application currently supports collection management, individual comic detail pages, series navigation, reading progress, filtering and sorting, Metron catalog integration, transactional imports, batch importing, duplicate prevention, Dockerized PostgreSQL databases, and automated testing.

Potential future improvements include expanded test coverage, richer creator information on comic detail pages, and additional collection-management features.

## Author

**Asdrúbal Baliña Novoa**

Computer Engineering graduate specialized in Networks and Systems.
