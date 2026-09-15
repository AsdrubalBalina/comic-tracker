# Comic Tracker

A full-stack web application for managing personal comic book collections, built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

Comic Tracker allows users to manually manage their collection or search for comic book issues through the Metron API and import their metadata directly into the application.

## Features

* Create, view, update, and delete comics
* Search comics in the local collection
* Filter comics by publisher and reading status
* Sort comics by title, publication year, and rating
* Track reading status and personal ratings
* Search the external Metron comic catalog
* Filter Metron searches by series, issue number, and year
* Navigate paginated catalog results
* Import individual comics from Metron
* Select and import multiple comics in batches
* Automatically import comic metadata, covers, creators, and creator roles
* Prevent duplicate external imports
* PostgreSQL transactions with rollback for comic imports
* Separate development and test databases
* REST API integration tests with Jest and Supertest
* Docker-based PostgreSQL environment
* Responsive web interface

## Tech Stack

### Backend

* Node.js
* Express.js
* PostgreSQL
* `pg`
* `dotenv`

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Fetch API

### Testing

* Jest
* Supertest

### Infrastructure

* Docker
* Docker Compose
* PostgreSQL 16

### External API

* Metron API

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
├── .env.example
├── .env.test.example
├── docker-compose.yml
├── package.json
└── README.md
```

The backend follows a separation of concerns between routes, controllers, services, and database configuration.

## Database

Comic Tracker uses PostgreSQL as its relational database.

The main data model includes:

* `comics` — comic information, reading status, ratings, and external metadata
* `creators` — creators imported from external sources
* `comic_creators` — many-to-many relationship between comics and creators, including their role

A unique index on the external source and comic identifier prevents the same external comic from being imported multiple times.

Creator relationships use foreign keys with cascading deletion.

## Metron Integration

Comic Tracker integrates with the Metron API to retrieve comic book information.

The integration supports:

* Searching by series
* Filtering by issue number
* Filtering by publication year
* Paginated results
* Comic detail retrieval
* Cover images
* Publisher information
* Publication dates
* Descriptions
* Creators and their roles

API authentication is configured through the `METRON_API_TOKEN` environment variable.

Imported data is normalized by the backend before being stored in PostgreSQL.

## Import Transactions

External comic imports use PostgreSQL transactions to keep related database operations consistent.

A comic and its associated creators are inserted as part of the import process. If an operation fails, the transaction is rolled back instead of leaving partially imported data in the database.

Batch imports also detect duplicate identifiers and report comics as imported, duplicated, or failed.

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

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Configure the required variables in `.env`:

```env
DB_USER=comic_user
DB_HOST=localhost
DB_NAME=comic_tracker
DB_PASSWORD=comic_password
DB_PORT=5432

METRON_API_TOKEN=your_metron_api_token
```

Replace `your_metron_api_token` with your own Metron API token.

## Starting the Database

Start the development and test PostgreSQL containers:

```bash
docker compose up -d
```

Docker Compose creates:

* Development database on port `5432`
* Test database on port `5433`

The database schema is automatically initialized from `database/init.sql`.

To check the containers:

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

The Express server provides both the REST API and the static frontend.

## Running Tests

Create the test environment file:

Windows PowerShell:

```powershell
Copy-Item .env.test.example .env.test
```

macOS/Linux:

```bash
cp .env.test.example .env.test
```

Make sure the test PostgreSQL container is running, then execute:

```bash
npm test
```

The current integration test suite covers:

* Retrieving the comic collection
* Handling nonexistent comics
* Request validation
* Creating comics
* Retrieving individual comics
* Updating comics
* Deleting comics
* Verifying deletion

Tests use a dedicated PostgreSQL database instead of the development database.

## REST API

### Comics

```text
GET    /api/comics
GET    /api/comics/:id
POST   /api/comics
PUT    /api/comics/:id
DELETE /api/comics/:id
```

Collection queries support search, publisher filtering, reading-status filtering, and sorting.

### External Catalog

```text
GET /api/catalog/search
GET /api/catalog/issues/:id
```

### Imports

```text
POST /api/comics/import
POST /api/comics/import-batch
```

## Testing Status

Current automated test suite:

```text
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

## Project Status

Comic Tracker is currently under active development.

Current functionality includes collection management, filtering and sorting, Metron catalog integration, transactional imports, batch importing, duplicate prevention, Dockerized PostgreSQL databases, and automated CRUD integration tests.

Future development may include expanded automated testing for external catalog and import functionality, additional collection-management features, and further backend validation.

## Author

**Asdrúbal Baliña Novoa**

Computer Engineering graduate specialized in Networks and Systems.
