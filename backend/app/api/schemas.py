"""
Pydantic schemas for API request/response models
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


# Session Schemas
class SessionCreate(BaseModel):
    """Schema for creating a session."""
    pass


class SessionResponse(BaseModel):
    """Schema for session response."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    moderator_token: UUID
    status: str
    created_at: datetime
    ended_at: Optional[datetime] = None
    question_catalog: Optional[Dict[str, Any]] = None
    current_question_id: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = Field(None, serialization_alias="metadata")
    game_mode: str = "free-for-all"
    team_config: Optional[Dict[str, Any]] = None


class SessionUpdate(BaseModel):
    """Schema for updating session."""
    question_catalog: Optional[Dict[str, Any]] = None
    current_question_id: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")


# Player Schemas
class PlayerCreate(BaseModel):
    """Schema for creating a player."""
    name: str = Field(..., min_length=1, max_length=50)


class PlayerResponse(BaseModel):
    """Schema for player response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    session_id: str
    name: str
    score: int
    connected: bool
    joined_at: datetime
    last_seen: datetime
    team_id: Optional[str] = None


class PlayerUpdate(BaseModel):
    """Schema for updating player."""
    score: Optional[int] = None
    connected: Optional[bool] = None


class ScoreUpdate(BaseModel):
    """Schema for updating player score."""
    points: int
    reason: Optional[str] = "answer"


# Question Schemas
class QuestionCreate(BaseModel):
    """Schema for creating a question."""
    session_id: str
    id: str
    question_type: str
    prompt: str
    data: Dict[str, Any]
    correct_answer: Dict[str, Any]
    max_time_seconds: int = 30
    points: int = 1
    image_url: Optional[str] = None


class QuestionResponse(BaseModel):
    """Schema for question response."""
    model_config = ConfigDict(from_attributes=True)
    
    session_id: str
    id: str
    type: str
    content: Dict[str, Any]
    points: int
    time_limit: Optional[int] = None
    media: Optional[Dict[str, str]] = None


# Answer Schemas
class AnswerCreate(BaseModel):
    """Schema for submitting an answer."""
    player_id: int
    question_id: str
    answer: Dict[str, Any]
    time_taken_seconds: int


class AnswerResponse(BaseModel):
    """Schema for answer response."""
    model_config = ConfigDict(from_attributes=True)
    
    session_id: str
    question_id: str
    id: int
    text: str
    is_correct: bool


# Leaderboard Schema
class LeaderboardEntry(BaseModel):
    """Schema for leaderboard entry."""
    player_id: int
    player_name: str
    score: int
    rank: int


class LeaderboardResponse(BaseModel):
    """Schema for leaderboard response."""
    session_id: str
    entries: List[LeaderboardEntry]
    total_players: int


# Error Schema
class ErrorResponse(BaseModel):
    """Schema for error response."""
    detail: str
    status_code: int


# Quiz Catalog Schemas
class QuizCatalogCreate(BaseModel):
    """Schema for creating a quiz catalog."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    questions: List[Any]  # Array of question objects


class QuizCatalogResponse(BaseModel):
    """Schema for quiz catalog response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    description: Optional[str] = None
    questions: List[Any]  # Array of question objects
    created_at: datetime
    updated_at: datetime


class QuizCatalogUpdate(BaseModel):
    """Schema for updating a quiz catalog."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    questions: Optional[List[Any]] = None  # Array of question objects
