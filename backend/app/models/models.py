"""
SQLAlchemy models for Battle.Net Quiz Platform
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, CheckConstraint,
    ForeignKey, UniqueConstraint, Index, JSON, and_
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Session(Base):
    """
    Quiz session model.
    
    Stores all quiz sessions (active and completed).
    """
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(6), primary_key=True)
    moderator_token: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        default=uuid4,
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20),
        CheckConstraint("status IN ('active', 'completed')"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    question_catalog: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    current_question_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    
    # Game mode settings
    game_mode: Mapped[str] = mapped_column(
        String(20),
        CheckConstraint("game_mode IN ('free-for-all', 'team')"),
        default="free-for-all",
        nullable=False
    )
    team_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    players: Mapped[list["Player"]] = relationship(
        "Player",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(
        "Event",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="session",
        cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index("idx_sessions_status", "status"),
        Index("idx_sessions_created_at", "created_at"),
        Index("idx_sessions_moderator_token", "moderator_token"),
        CheckConstraint(
            "(status = 'active' AND ended_at IS NULL) OR "
            "(status = 'completed' AND ended_at IS NOT NULL)",
            name="check_ended_at"
        ),
    )

    def __repr__(self) -> str:
        return f"<Session(id={self.id}, status={self.status}, mode={self.game_mode})>"


class Player(Base):
    """
    Player model.
    
    Stores all players in a session.
    """
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    connected: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Team membership (nullable for free-for-all mode)
    team_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="players")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer",
        back_populates="player",
        cascade="all, delete-orphan"
    )
    buzzer_presses: Mapped[list["BuzzerPress"]] = relationship(
        "BuzzerPress",
        back_populates="player",
        cascade="all, delete-orphan"
    )

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("session_id", "name", name="unique_player_name_per_session"),
        CheckConstraint("score >= 0", name="check_score_non_negative"),
        CheckConstraint("LENGTH(TRIM(name)) > 0", name="check_name_not_empty"),
        Index("idx_players_session_id", "session_id"),
        Index("idx_players_score", "session_id", "score"),
        Index("idx_players_connected", "session_id", "connected"),
    )

    def __repr__(self) -> str:
        return f"<Player(id={self.id}, name={self.name}, score={self.score})>"


class Event(Base):
    """
    Event model.
    
    Audit log for all important session events.
    """
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    actor: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="events")

    # Indexes
    __table_args__ = (
        Index("idx_events_session_id", "session_id"),
        Index("idx_events_timestamp", "session_id", "timestamp"),
        Index("idx_events_type", "event_type"),
    )

    def __repr__(self) -> str:
        return f"<Event(id={self.id}, type={self.event_type}, actor={self.actor})>"


class Question(Base):
    """
    Question model.
    
    Cache for questions from uploaded catalog.
    """
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    category_id: Mapped[str] = mapped_column(String(50), nullable=False)
    category_name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(
        String(30),
        CheckConstraint(
            "type IN ('input-text', 'input-number', 'slider', 'multiple-choice', "
            "'buzzer', 'image-question', 'hotspot', 'sorting')"
        ),
        nullable=False
    )
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    correct_answer: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    order_in_category: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer",
        back_populates="question",
        foreign_keys="[Answer.session_id, Answer.question_id]",
        primaryjoin="and_(Question.session_id == Answer.session_id, Question.id == Answer.question_id)",
        cascade="all, delete-orphan"
    )
    buzzer_presses: Mapped[list["BuzzerPress"]] = relationship(
        "BuzzerPress",
        back_populates="question",
        foreign_keys="[BuzzerPress.session_id, BuzzerPress.question_id]",
        primaryjoin="and_(Question.session_id == BuzzerPress.session_id, Question.id == BuzzerPress.question_id)",
        cascade="all, delete-orphan"
    )

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("session_id", "id", name="unique_question_id_per_session"),
        CheckConstraint("points > 0", name="check_points_positive"),
        Index("idx_questions_session_id", "session_id"),
        Index("idx_questions_category", "session_id", "category_id", "order_in_category"),
    )

    def __repr__(self) -> str:
        return f"<Question(id={self.id}, type={self.type})>"


class Answer(Base):
    """
    Answer model.
    
    Stores all player answers for analysis.
    """
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    question_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    player_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False
    )
    answer: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    points_awarded: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    evaluated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    evaluated_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    player: Mapped["Player"] = relationship("Player", back_populates="answers")
    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="answers",
        foreign_keys="[Answer.session_id, Answer.question_id]",
        primaryjoin="and_(Answer.session_id == Question.session_id, Answer.question_id == Question.id)"
    )

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint(
            "session_id", "question_id", "player_id",
            name="unique_answer_per_player_question"
        ),
        Index("idx_answers_session_id", "session_id"),
        Index("idx_answers_question_id", "session_id", "question_id"),
        Index("idx_answers_player_id", "player_id"),
        Index("idx_answers_submitted_at", "submitted_at"),
    )

    def __repr__(self) -> str:
        return f"<Answer(id={self.id}, player={self.player_id}, correct={self.is_correct})>"


class BuzzerPress(Base):
    """
    BuzzerPress model.
    
    Stores all buzzer events for winner determination.
    """
    __tablename__ = "buzzer_presses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    question_id: Mapped[str] = mapped_column(String(50), nullable=False)
    player_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False
    )
    client_timestamp: Mapped[int] = mapped_column(Integer, nullable=False)
    server_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    player: Mapped["Player"] = relationship("Player", back_populates="buzzer_presses")
    question: Mapped["Question"] = relationship(
        "Question",
        back_populates="buzzer_presses",
        foreign_keys="[BuzzerPress.session_id, BuzzerPress.question_id]",
        primaryjoin="and_(BuzzerPress.session_id == Question.session_id, BuzzerPress.question_id == Question.id)"
    )

    # Indexes
    __table_args__ = (
        Index("idx_buzzer_session_question", "session_id", "question_id"),
        Index("idx_buzzer_server_timestamp", "server_timestamp"),
    )

    def __repr__(self) -> str:
        return f"<BuzzerPress(id={self.id}, player={self.player_id}, winner={self.is_winner})>"


class QuizCatalog(Base):
    """
    Quiz Catalog model.
    
    Stores quiz catalogs with questions that can be reused across sessions.
    """
    __tablename__ = "quiz_catalogs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    questions: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Indexes
    __table_args__ = (
        Index("idx_quiz_catalogs_title", "title"),
        Index("idx_quiz_catalogs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<QuizCatalog(id={self.id}, title={self.title})>"
