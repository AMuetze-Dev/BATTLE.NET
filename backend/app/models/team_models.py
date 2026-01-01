"""
Team models for Battle.Net Quiz Platform

Provides team functionality including team definitions, membership, and scoring.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    String, Integer, Boolean, DateTime,
    ForeignKey, UniqueConstraint, Index, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Team(Base):
    """
    Team model.
    
    Stores team definitions for a session with team mode enabled.
    """
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        String(6),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember",
        back_populates="team",
        cascade="all, delete-orphan"
    )

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("session_id", "id", name="unique_team_id_per_session"),
        UniqueConstraint("session_id", "name", name="unique_team_name_per_session"),
        Index("idx_teams_session_id", "session_id"),
    )

    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name={self.name}, session={self.session_id})>"


class TeamMember(Base):
    """
    Team member model.
    
    Links players to teams within a session.
    """
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    team_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("teams.id", ondelete="CASCADE"),
        nullable=False
    )
    player_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False
    )
    is_active_player: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False
    )  # For input questions where one player is designated
    joined_team_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    team: Mapped["Team"] = relationship("Team", back_populates="members")

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("player_id", name="unique_player_team_membership"),
        Index("idx_team_members_team_id", "team_id"),
        Index("idx_team_members_player_id", "player_id"),
    )

    def __repr__(self) -> str:
        return f"<TeamMember(team={self.team_id}, player={self.player_id})>"
