from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CandidateBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    training_track: str = Field(min_length=2, max_length=100)
    is_active: bool = True


class CandidateCreate(CandidateBase):
    """Data required to create a candidate."""


class CandidateUpdate(BaseModel):
    """All fields are optional so a client can update only what changed."""

    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    email: EmailStr | None = None
    training_track: str | None = Field(default=None, min_length=2, max_length=100)
    is_active: bool | None = None


class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyStatusCreate(BaseModel):
    candidate_id: int = Field(gt=0)
    status_date: date
    work_completed: str = Field(min_length=1)
    topics_learned: str = Field(min_length=1)
    blockers: str = Field(min_length=1)
    next_day_plan: str = Field(min_length=1)
    completion_percentage: int = Field(ge=0, le=100)


class DailyStatusResponse(DailyStatusCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DailyStatusUpdate(BaseModel):
    candidate_id: int | None = Field(default=None, gt=0)
    status_date: date | None = None
    work_completed: str | None = Field(default=None, min_length=1)
    topics_learned: str | None = Field(default=None, min_length=1)
    blockers: str | None = Field(default=None, min_length=1)
    next_day_plan: str | None = Field(default=None, min_length=1)
    completion_percentage: int | None = Field(default=None, ge=0, le=100)
