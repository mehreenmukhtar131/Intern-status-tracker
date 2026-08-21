from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    training_track: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    daily_statuses: Mapped[list["DailyStatus"]] = relationship(
        "DailyStatus",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )


class DailyStatus(Base):
    __tablename__ = "daily_statuses"

    __table_args__ = (
        UniqueConstraint(
            "candidate_id",
            "status_date",
            name="uq_candidate_status_date"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    status_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True
    )

    work_completed: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    topics_learned: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    blockers: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    next_day_plan: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    completion_percentage: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    candidate: Mapped["Candidate"] = relationship(
        "Candidate",
        back_populates="daily_statuses"
    )
