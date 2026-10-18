# Student Management System

A full-stack web application for managing students, courses and enrolment. It has a **Spring Boot REST API** secured with **JWT**, a **MySQL** database, and a **React** dashboard with search, filters, charts and CSV export.

> Built as a learning project to practise layered backend design, authentication and a modern React UI.


## Features

**Authentication and security**
- Register / log in with JWT (stateless sessions) and BCrypt-hashed passwords
- Role-based access: `ADMIN` can delete students; `USER` can view, add and edit
- New accounts are always `USER`; the first `ADMIN` is created from configuration
- Clean JSON `401` / `403` responses, expired tokens log the user out automatically
- Secrets are read from environment variables (`.env` is git-ignored)

**Student management**
- Create, read, update and delete students (name, email, phone, age, gender, course, CGPA, status, enrolment date)
- Server-side search, filter by course and status, sorting and pagination
- Export the filtered list to CSV
- Validation on both client and server, duplicate-email detection (`409 Conflict`)

**Dashboard**
- Totals, active students, number of courses, average CGPA
- Enrolments over the last 6 months, status breakdown, students per course, recently added students
- Light and dark theme, responsive layout (works on phones)

**Engineering**
- Layered architecture (controller, service, repository) with DTOs
- Global exception handler with consistent error JSON
- Swagger UI for the API (`/swagger-ui.html`)
- Unit tests (JUnit 5 + Mockito) that run without MySQL
- Docker Compose to start MySQL, backend and frontend together

## Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA (Hibernate), Spring Security, JJWT, Bean Validation |
| Database | MySQL 8 |
| Frontend | React 19, Vite, React Router, Recharts, plain CSS |
| API docs | springdoc-openapi (Swagger UI) |
| Testing | JUnit 5, Mockito, H2 (tests only) |
| DevOps | Docker, Docker Compose, Nginx |

## Project structure

```
student-management-system/
├── backend/                     Spring Boot application
│   ├── src/main/java/com/example/student_management/
│   │   ├── controller/          REST endpoints
│   │   ├── service/             business logic (StudentService, UserService, JwtService)
│   │   ├── repository/          Spring Data JPA repositories
│   │   ├── dto/                 request / response objects
│   │   ├── enums/               Gender, StudentStatus
│   │   ├── security/            JWT authentication filter
│   │   ├── config/              security, CORS, OpenAPI, first-run data
│   │   └── Exception/           custom exceptions + global handler
│   ├── src/test/                unit tests
│   └── pom.xml
├── frontend/                    React application
│   └── src/
│       ├── pages/               Login, Dashboard, Students
│       ├── components/          Layout, forms, dialogs, pagination, icons
│       ├── api.js               every call to the backend
│       └── AuthContext.jsx      login state, role, auto-logout
├── docs/database.sql            reference schema
└── docker-compose.yml
```

## Getting started (without Docker)

**You need:** Java 21, Node.js 20+ and MySQL 8 running locally.

### 1. Backend

```bash
cd backend
cp .env.example .env        # then open .env and fill in your values
./mvnw spring-boot:run      # on Windows: mvnw.cmd spring-boot:run
```

In `.env` you must set at least `DB_PASSWORD` and `JWT_SECRET` (32+ characters, generate one with `openssl rand -base64 48`).
The database `student_db` is created automatically. On first run the app also creates an admin account and about 24 demo students.

The API runs at <http://localhost:8080> and Swagger UI at <http://localhost:8080/swagger-ui.html>.

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # optional: only needed if the backend is not on localhost:8080
npm install
npm run dev
```

Open <http://localhost:5173> and log in with the admin account from your `.env` (defaults: `admin` / `Admin@123`). **Change the default password** before putting this anywhere public.

## Getting started (Docker)

```bash
cp .env.example .env        # set DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
docker compose up --build
```

Frontend: <http://localhost:3000> · API: <http://localhost:8080> · Swagger: <http://localhost:8080/swagger-ui.html>

## API overview

All endpoints except `/auth/**` and the Swagger pages need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create a `USER` account (`{"username","password"}`) |
| POST | `/auth/login` | public | Form fields `username`, `password`; returns the JWT as text |
| GET | `/students` | any | All students (no pagination) |
| GET | `/students/search` | any | Search, filter, sort and paginate (see below) |
| GET | `/students/stats` | any | Dashboard numbers and chart data |
| GET | `/students/courses` | any | Distinct course names |
| GET | `/students/export` | any | CSV download (same filters as search) |
| GET | `/students/{id}` | any | One student |
| POST | `/students` | any | Add a student |
| PUT | `/students/{id}` | any | Update a student |
| DELETE | `/students/{id}` | `ADMIN` | Delete a student |

`/students/search` query parameters: `search`, `course`, `status` (`ACTIVE`, `INACTIVE`, `GRADUATED`), `page` (from 0), `size` (max 100), `sortBy` (`id`, `name`, `age`, `course`, `email`, `cgpa`, `status`, `enrollmentDate`), `direction` (`asc` / `desc`).

Errors share one shape: `{"message": "...", "status": 400, "errors": {"field": "message"}}`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | local MySQL, database `student_db` | JDBC connection string |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / empty | Database login |
| `JWT_SECRET` | **required** | Signing key, 32+ characters |
| `JWT_EXPIRATION_MS` | `3600000` | Token lifetime (1 hour) |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma separated frontend URLs |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `Admin@123` | First admin account |
| `SEED_DEMO_DATA` | `true` | Insert demo students when the table is empty |
| `SHOW_SQL` | `false` | Print SQL statements |

Frontend: `VITE_API_URL` (default `http://localhost:8080`).

## Running the tests

```bash
cd backend
./mvnw test
```

Tests use an in-memory H2 database, so MySQL does not need to be running.




## Author

**Sonu chawda** 