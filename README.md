Intern Status Tracker

 1. Project Overview

Intern Status Tracker is a full-stack web application designed to manage internship candidates and track their daily work progress.
The system allows users to create and manage candidate profiles, record daily status reports, monitor completion percentages, view status history, filter reports, and identify candidates who have not submitted their status for a selected date.
The application consists of a FastAPI backend, PostgreSQL database, and a plain HTML, CSS, and JavaScript frontend. Docker Compose is used to run the complete application.

 Main Features

•	Add, view, edit, and delete candidates
•	Mark candidates as active or inactive
•	Create and manage daily status reports
•	Prevent duplicate daily status submissions
•	Filter statuses by candidate and date
•	Filter statuses using date ranges
•	Dashboard statistics
•	Identify missing status submissions
•	Display latest status from every active candidate
•	Sort candidates by completion percentage
•	Input validation and error handling
•	PostgreSQL persistent data storage
•	Docker-based deployment
•	Automated backend testing


 2. Architecture

The application follows a three-tier architecture:
 

Frontend
The frontend is built using plain HTML, CSS, and JavaScript.
It provides:
•	Dashboard
•	Candidate management
•	Daily status submission
•	Status history
•	Candidate filtering
•	Date filtering
•	Loading and error messages
•	Form validation
•	Delete confirmations
The frontend communicates with the FastAPI backend using the JavaScript fetch() API.
Backend
The backend is implemented using FastAPI.
It provides REST API endpoints for:
•	Candidate CRUD operations
•	Daily status CRUD operations
•	Dashboard statistics
•	Candidate and date filtering
•	Input validation
•	Error handling
Database
PostgreSQL is used as the application database.
SQLAlchemy is used to communicate with PostgreSQL and manage database models.
A persistent PostgreSQL Docker volume is used so that data remains available after container restarts.
3. Setup Instructions
Prerequisites
The following software is required:
•	Docker Desktop
•	Git
A local PostgreSQL installation is not required because PostgreSQL runs inside Docker.
Clone the Repository
git clone https://github.com/mehreenmukhtar131/Intern-status-tracker.git
Move into the project directory:
cd Intern-status-tracker
Environment Configuration
The project contains an .env.example file.
Create the local .env file from the example.
On Windows:
copy .env.example .e 
The .env file contains the PostgreSQL configuration.
Example:
POSTGRES_DB=intern_tracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:your_password@db:5432/intern_tracker

The actual .env file should not be committed to Git.
Start the Application
The complete application can be started with one Docker Compose command:
docker compose up --build
After the containers start successfully:
Frontend:
http://localhost:8080
FastAPI backend:
http://localhost:8000
FastAPI interactive API documentation:
http://localhost:8000/docs
Stop the Application
To stop the running containers:
docker compose down
The PostgreSQL data remains available because a persistent Docker volume is used.
4. API Endpoint List
Candidate Endpoints
Create Candidate
POST /api/candidates
Creates a new candidate.
Get All Candidates
GET /api/candidates
Returns all candidates.
Get Candidate
GET /api/candidates/{id}
Returns a specific candidate.
Update Candidate
PUT /api/candidates/{id}
Updates candidate information.
Delete Candidate
DELETE /api/candidates/{id}
Deletes a candidate.
Daily Status Endpoints
Create Daily Status
POST /api/statuses
Creates a daily status for a candidate.
Get Statuses
GET /api/statuses
Returns daily statuses.
The endpoint supports the following filters:
candidate_id
status_date
date_from
date_to
Example:
GET /api/statuses?candidate_id=3
Example:
GET /api/statuses?status_date=2026-08-21
Example:
GET /api/statuses?date_from=2026-08-20&date_to=2026-08-21
Get Daily Status
GET /api/statuses/{id}
Returns a specific daily status.
Update Daily Status
PUT /api/statuses/{id}
Updates an existing daily status.
Delete Daily Status
DELETE /api/statuses/{id}
Deletes a daily status.
Dashboard Endpoint
GET /api/dashboard/summary?date=YYYY-MM-DD
Returns dashboard information for the selected date.
The response includes:
•	Total active candidates
•	Submitted count
•	Missing count
•	Average completion percentage
•	Submitted candidates
•	Missing candidates
•	Latest status from every active candidate
•	Candidates sorted by completion percentage
Health Endpoint
GET /health
Returns the health status of the backend.
Root Endpoint
GET /
Returns a message confirming that the Intern Status Tracker API is running.
5. Database Design
The application uses two main database tables:
•	candidates
•	daily_statuses
Candidates Table
candidates
--------------------------------
id
full_name
email
training_track
is_active
created_at
updated_at
Fields
Field	Description
Id	Unique candidate identifier
full_name	Candidate's full name
Email	Candidate's email address
training_track	Candidate's training track
is_active	Indicates whether the candidate is active
created_at	Candidate creation timestamp
updated_at	Last update timestamp
Daily Statuses Table
daily_statuses
--------------------------------
id
candidate_id
status_date
work_completed
topics_learned
blockers
next_day_plan
completion_percentage
created_at
updated_at
Fields
Field	Description
Id	Unique status identifier
candidate_id	Candidate associated with the status
status_date	Date of the daily report
work_completed	Work completed by the candidate
topics_learned	Topics learned
blockers	Problems or blockers
next_day_plan	Plan for the next day
completion_percentage	Completion percentage from 0 to 100
created_at	Status creation timestamp
updated_at	Last update timestamp
Relationship
There is a foreign-key relationship between:
daily_statuses.candidate_id
                |
                v
        candidates.id
This means each daily status belongs to a candidate.
Duplicate Status Prevention
The database prevents a candidate from submitting more than one status for the same date.
A unique constraint is applied to:
candidate_id + status_date
Therefore:
Candidate 1 + 2026-08-21
can exist only once.
6. Validation
The application uses Pydantic validation for API input.
Validation includes:
•	Required fields
•	Valid email addresses
•	Candidate information length
•	Completion percentage between 0 and 100
•	Valid candidate IDs
•	Valid dates
•	Valid date ranges
For date-range filtering:
date_from <= date_to
must be satisfied.
7. Error Handling
The application provides clear error responses using appropriate HTTP status codes.
Candidate Not Found
404 Not Found
{
  "detail": "Candidate not found"
}
Status Not Found
404 Not Found
{
  "detail": "Status not found"
}
Duplicate Daily Status
409 Conflict
{
  "detail": "This candidate already has a status for the selected date"
}
Duplicate Candidate Email
A candidate cannot be created or updated with an email that already exists.
The API returns:
409 Conflict
Invalid Input
Invalid input is handled using FastAPI/Pydantic validation and returns an appropriate validation response.
8. Dashboard
The dashboard provides an overview of candidate reporting progress for a selected date.
It displays:
•	Total active candidates
•	Number of submitted candidates
•	Number of missing candidates
•	Average completion percentage
•	Submitted candidate list
•	Missing candidate list
•	Latest status from every active candidate
•	Candidates sorted by completion percentage
Candidates who have not submitted their status are clearly highlighted.
Dashboard Logic
The dashboard compares active candidates with daily statuses for the selected date.
If an active candidate has a status for the selected date:
Submitted
If the candidate does not have a status:
Missing
The dashboard also retrieves the latest available status from each active candidate.
9. Docker Configuration
The project uses Docker Compose to run the complete application.
The main services are:
frontend
backend
db
Frontend Service
The frontend is served using Nginx.
Backend Service
The backend runs FastAPI using Uvicorn.
Database Service
The database service uses PostgreSQL.
A persistent volume is configured for PostgreSQL data.
The application also uses a database health check to help ensure that the backend starts when the database is available.
10. Environment Variables
Database credentials are stored using environment variables.
The project includes:
.env.example
Example:
POSTGRES_DB=intern_tracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:your_password@db:5432/intern_tracker

The actual .env file is excluded from Git using .gitignore.
Passwords and other local configuration values should not be committed to the repository.
11. Testing
Automated backend tests are included using Pytest.
Run the tests with Docker:
docker compose exec backend pytest -q
The tests cover important application functionality, including:
1.	Creating a candidate
2.	Creating a daily status
3.	Rejecting duplicate daily status
4.	Updating a status
5.	Handling missing records
6.	Identifying candidates who missed a selected date
The current test suite contains:
15 passed
The tests were successfully executed inside the Docker backend container.
12. Frontend
The frontend uses plain:
•	HTML
•	CSS
•	JavaScript
No frontend framework such as React, Angular, or Vue is used.
The frontend communicates with FastAPI using:
fetch()
The interface provides:
•	Dashboard
•	Candidate list
•	Add candidate form
•	Edit candidate form
•	Daily status form
•	Status history table
•	Candidate filter
•	Date filters
•	Loading messages
•	Error messages
•	Form validation
•	Delete confirmation dialogs
•	Responsive styling
Candidate IDs remain available internally for API requests and database relationships but are not unnecessarily displayed to users.
13. Project Structure
Intern-status-tracker/
│
├── app/
│   ├── __init__.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── test_db.py
│   │
│   ├── routers/
│   │   └── __init__.py
│   │
│   └── tests/
│       └── test_api.py
│
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── .gitignore
14. Data Persistence
PostgreSQL uses a persistent Docker volume.
This ensures that database records remain available after containers are stopped and started again.
The project does not use SQLite as a replacement for PostgreSQL.
15. Assumptions
The following assumptions are used in the application:
•	Each candidate can submit only one daily status for a particular date.
•	Only active candidates are considered when calculating dashboard active-candidate statistics.
•	Missing candidates are determined from active candidates who do not have a status for the selected date.
•	Completion percentage must be between 0 and 100.
•	PostgreSQL is the required database.
•	Docker Compose is used to run the complete application.
•	Candidate IDs are internal identifiers used for database relationships and API operations.
•	Candidate IDs are not unnecessarily displayed in the frontend.
•	The actual .env file is kept locally and is not committed to Git.
16. Verification
The application was verified using Docker Compose.
The complete application successfully builds using:
docker compose up --build
The backend starts successfully with FastAPI/Uvicorn.
The frontend is served successfully through Nginx.
The automated backend test suite reports:
15 passed
The following application functionality was tested:
•	Candidate creation
•	Candidate editing
•	Candidate deletion
•	Active/inactive candidate status
•	Daily status creation
•	Daily status editing
•	Daily status deletion
•	Duplicate daily status prevention
•	Candidate filtering
•	Date filtering
•	Dashboard statistics
•	Missing candidate identification
•	Completion percentage
•	PostgreSQL data persistence
17. Conclusion
Intern Status Tracker provides a complete full-stack solution for managing internship candidates and monitoring their daily progress.
The project combines FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Docker Compose, Nginx, HTML, CSS, JavaScript, and Pytest.
The application supports candidate management, daily status tracking, dashboard reporting, filtering, validation, duplicate prevention, persistent database storage, and automated backend testing.

After you paste and save it, run:

cmd
git status
Then you can commit it with:
git add app/README.md
git commit -m "Add project README documentation"
git push origin main
screenshots:

 



 



 





 


 


