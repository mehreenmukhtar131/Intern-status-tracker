from typing import Annotated
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select,func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app import models
from app.schemas import (
    CandidateCreate,
    CandidateResponse,
    CandidateUpdate,
    DailyStatusCreate,
    DailyStatusResponse,
    DailyStatusUpdate,
)
from app.routers import candidates



Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Intern Status Tracker",
    description="API for tracking candidates' daily work status",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@app.get("/")
def root():
    return {
        "message": "Intern Status Tracker API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


def get_candidate_or_404(candidate_id: int, db: Session) -> models.Candidate:
    candidate = db.get(models.Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


def get_status_or_404(status_id: int, db: Session) -> models.DailyStatus:
    daily_status = db.get(models.DailyStatus, status_id)
    if daily_status is None:
        raise HTTPException(status_code=404, detail="Status not found")
    return daily_status


@app.post(
    "/api/candidates",
    response_model=CandidateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_candidate(candidate_data: CandidateCreate, db: DatabaseSession):
    candidate = models.Candidate(**candidate_data.model_dump())
    db.add(candidate)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A candidate with this email already exists")

    db.refresh(candidate)
    return candidate


@app.get("/api/candidates", response_model=list[CandidateResponse])
def list_candidates(db: DatabaseSession):
    return db.scalars(select(models.Candidate).order_by(models.Candidate.full_name)).all()


@app.get("/api/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: DatabaseSession):
    return get_candidate_or_404(candidate_id, db)


@app.put("/api/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: int, candidate_data: CandidateUpdate, db: DatabaseSession):
    candidate = get_candidate_or_404(candidate_id, db)

    for field, value in candidate_data.model_dump(exclude_unset=True).items():
        setattr(candidate, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A candidate with this email already exists")

    db.refresh(candidate)
    return candidate


@app.delete("/api/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: DatabaseSession):
    candidate = get_candidate_or_404(candidate_id, db)
    db.delete(candidate)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/api/statuses",
    response_model=DailyStatusResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_daily_status(status_data: DailyStatusCreate, db: DatabaseSession):
    get_candidate_or_404(status_data.candidate_id, db)

    daily_status = models.DailyStatus(**status_data.model_dump())
    db.add(daily_status)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This candidate already has a status for the selected date",
        )

    db.refresh(daily_status)
    return daily_status


@app.get("/api/statuses", response_model=list[DailyStatusResponse])
def list_daily_statuses(
    db: DatabaseSession,
    candidate_id: int | None = Query(default=None, gt=0),
    status_date: date | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=422,
            detail="date_from must be before or equal to date_to",
        )

    statement = select(models.DailyStatus)

    if candidate_id is not None:
        statement = statement.where(models.DailyStatus.candidate_id == candidate_id)
    if status_date is not None:
        statement = statement.where(models.DailyStatus.status_date == status_date)
    if date_from is not None:
        statement = statement.where(models.DailyStatus.status_date >= date_from)
    if date_to is not None:
        statement = statement.where(models.DailyStatus.status_date <= date_to)

    statement = statement.order_by(models.DailyStatus.status_date.desc())
    return db.scalars(statement).all()


@app.get("/api/statuses/{status_id}", response_model=DailyStatusResponse)
def get_daily_status(status_id: int, db: DatabaseSession):
    return get_status_or_404(status_id, db)


@app.put("/api/statuses/{status_id}", response_model=DailyStatusResponse)
def update_daily_status(
    status_id: int,
    status_data: DailyStatusUpdate,
    db: DatabaseSession,
):
    daily_status = get_status_or_404(status_id, db)
    changes = status_data.model_dump(exclude_unset=True)

    if "candidate_id" in changes:
        get_candidate_or_404(changes["candidate_id"], db)

    for field, value in changes.items():
        setattr(daily_status, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This candidate already has a status for the selected date",
        )

    db.refresh(daily_status)
    return daily_status
@app.delete(
    "/api/statuses/{status_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_daily_status(
    status_id: int,
    db: DatabaseSession,
):
    daily_status = get_status_or_404(status_id, db)

    db.delete(daily_status)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
@app.get("/api/dashboard/summary")
def dashboard_summary(
    date: date,
    db: DatabaseSession,
):
    active_candidates = db.scalars(
        select(models.Candidate)
        .where(models.Candidate.is_active.is_(True))
        .order_by(models.Candidate.full_name)
    ).all()

    statuses = db.scalars(
        select(models.DailyStatus)
        .where(models.DailyStatus.status_date == date)
    ).all()

    status_by_candidate = {
        daily_status.candidate_id: daily_status
        for daily_status in statuses
    }

    submitted_candidates = []
    missing_candidates = []
    latest_statuses = []

    for candidate in active_candidates:
        daily_status = status_by_candidate.get(candidate.id)

        if daily_status:
            submitted_candidates.append({
                "candidate_id": candidate.id,
                "full_name": candidate.full_name,
                "completion_percentage": daily_status.completion_percentage,
            })

            latest_statuses.append({
                "candidate_id": candidate.id,
                "full_name": candidate.full_name,
                "status_id": daily_status.id,
                "status_date": daily_status.status_date,
                "completion_percentage": daily_status.completion_percentage,
            })
        else:
            missing_candidates.append({
                "candidate_id": candidate.id,
                "full_name": candidate.full_name,
            })

    if statuses:
        average_completion = sum(
            daily_status.completion_percentage
            for daily_status in statuses
        ) / len(statuses)
    else:
        average_completion = 0

    submitted_candidates.sort(
        key=lambda candidate: candidate["completion_percentage"],
        reverse=True,
    )

    return {
        "date": date,
        "total_active_candidates": len(active_candidates),
        "submitted_count": len(submitted_candidates),
        "missing_count": len(missing_candidates),
        "average_completion_percentage": round(average_completion, 2),
        "submitted_candidates": submitted_candidates,
        "missing_candidates": missing_candidates,
        "latest_statuses": latest_statuses,
        "candidates_by_completion": submitted_candidates,
    }
 