from datetime import date, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def create_test_candidate():
    """
    Create a unique candidate for testing and return the response data.
    """
    # UUID values stay unique across the whole test run, unlike id(object()),
    # whose memory address can be reused after the temporary object is removed.
    unique_email = f"test_{uuid4().hex}@example.com"

    candidate = {
        "full_name": "Automated Test Candidate",
        "email": unique_email,
        "training_track": "FastAPI",
        "is_active": True,
    }

    response = client.post("/api/candidates", json=candidate)

    assert response.status_code == 201

    return response.json()


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy"
    }


# ---------------------------------------------------------
# CANDIDATE TESTS
# ---------------------------------------------------------

def test_create_candidate():
    candidate = create_test_candidate()

    assert "id" in candidate
    assert candidate["full_name"] == "Automated Test Candidate"
    assert candidate["training_track"] == "FastAPI"
    assert candidate["is_active"] is True


def test_list_candidates():
    response = client.get("/api/candidates")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_candidate():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    response = client.get(
        f"/api/candidates/{candidate_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == candidate_id


def test_update_candidate():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    updated_data = {
        "full_name": "Updated Test Candidate",
        "training_track": "Python",
    }

    response = client.put(
        f"/api/candidates/{candidate_id}",
        json=updated_data,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == candidate_id
    assert data["full_name"] == "Updated Test Candidate"
    assert data["training_track"] == "Python"


def test_delete_candidate():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    response = client.delete(
        f"/api/candidates/{candidate_id}"
    )

    assert response.status_code == 204

    check_response = client.get(
        f"/api/candidates/{candidate_id}"
    )

    assert check_response.status_code == 404


# ---------------------------------------------------------
# DAILY STATUS TESTS
# ---------------------------------------------------------

def test_create_daily_status():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    daily_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-20",
        "work_completed": "Completed API testing",
        "topics_learned": "FastAPI and pytest",
        "blockers": "None",
        "next_day_plan": "Continue frontend development",
        "completion_percentage": 80,
    }

    response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert response.status_code == 201

    data = response.json()

    assert "id" in data
    assert data["candidate_id"] == candidate_id
    assert data["status_date"] == "2026-08-20"
    assert data["completion_percentage"] == 80


def test_list_daily_statuses():
    response = client.get("/api/statuses")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_daily_status():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    daily_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-21",
        "work_completed": "Testing GET status",
        "topics_learned": "FastAPI",
        "blockers": "None",
        "next_day_plan": "Continue testing",
        "completion_percentage": 70,
    }

    create_response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert create_response.status_code == 201

    status_id = create_response.json()["id"]

    response = client.get(
        f"/api/statuses/{status_id}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == status_id


def test_update_daily_status():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    daily_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-22",
        "work_completed": "Initial work",
        "topics_learned": "FastAPI",
        "blockers": "None",
        "next_day_plan": "Continue development",
        "completion_percentage": 60,
    }

    create_response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert create_response.status_code == 201

    status_id = create_response.json()["id"]

    updated_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-22",
        "work_completed": "Completed backend testing",
        "topics_learned": "FastAPI and pytest",
        "blockers": "None",
        "next_day_plan": "Start frontend",
        "completion_percentage": 90,
    }

    response = client.put(
        f"/api/statuses/{status_id}",
        json=updated_status,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == status_id
    assert data["completion_percentage"] == 90
    assert data["work_completed"] == "Completed backend testing"


def test_delete_daily_status():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    daily_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-23",
        "work_completed": "Testing delete",
        "topics_learned": "pytest",
        "blockers": "None",
        "next_day_plan": "Continue",
        "completion_percentage": 50,
    }

    create_response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert create_response.status_code == 201

    status_id = create_response.json()["id"]

    response = client.delete(
        f"/api/statuses/{status_id}"
    )

    assert response.status_code == 204

    check_response = client.get(
        f"/api/statuses/{status_id}"
    )

    assert check_response.status_code == 404


# ---------------------------------------------------------
# VALIDATION TESTS
# ---------------------------------------------------------

def test_invalid_email():
    candidate = {
        "full_name": "Invalid Email Test",
        "email": "not-an-email",
        "training_track": "Python",
        "is_active": True,
    }

    response = client.post(
        "/api/candidates",
        json=candidate,
    )

    assert response.status_code == 422


def test_invalid_completion_percentage():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    daily_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-24",
        "work_completed": "Testing validation",
        "topics_learned": "pytest",
        "blockers": "None",
        "next_day_plan": "Continue",
        "completion_percentage": 150,
    }

    response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert response.status_code == 422


def test_duplicate_daily_status():
    candidate = create_test_candidate()
    candidate_id = candidate["id"]

    daily_status = {
        "candidate_id": candidate_id,
        "status_date": "2026-08-25",
        "work_completed": "First report",
        "topics_learned": "FastAPI",
        "blockers": "None",
        "next_day_plan": "Continue",
        "completion_percentage": 50,
    }

    first_response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/statuses",
        json=daily_status,
    )

    assert second_response.status_code == 409


# ---------------------------------------------------------
# DASHBOARD TEST
# ---------------------------------------------------------

def test_dashboard_summary():
    response = client.get(
        "/api/dashboard/summary?date=2026-08-20"
    )

    assert response.status_code == 200

    data = response.json()

    assert "total_active_candidates" in data
    assert "submitted_count" in data
    assert "missing_count" in data
    assert "average_completion_percentage" in data
