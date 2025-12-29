"""
Tests for SQLAlchemy models
"""
import pytest
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Session, Player, Event, Question, Answer, BuzzerPress


@pytest.mark.asyncio
class TestSessionModel:
    """Test Session model."""

    async def test_create_session(self, test_db: AsyncSession):
        """Test creating a session."""
        session = Session(
            id="ABC123",
            status="active"
        )
        test_db.add(session)
        await test_db.commit()
        await test_db.refresh(session)

        assert session.id == "ABC123"
        assert session.status == "active"
        assert session.moderator_token is not None
        assert session.created_at is not None
        assert session.ended_at is None

    async def test_session_with_ended_at(self, test_db: AsyncSession):
        """Test session with ended_at timestamp."""
        now = datetime.now(timezone.utc)
        session = Session(
            id="XYZ789",
            status="completed",
            ended_at=now
        )
        test_db.add(session)
        await test_db.commit()
        await test_db.refresh(session)

        assert session.status == "completed"
        assert session.ended_at is not None

    async def test_session_cascade_delete_players(self, test_db: AsyncSession):
        """Test cascade delete of players when session is deleted."""
        session = Session(id="DEL123", status="active")
        player = Player(session_id="DEL123", name="TestPlayer", score=10)
        
        test_db.add(session)
        test_db.add(player)
        await test_db.commit()

        # Delete session
        await test_db.delete(session)
        await test_db.commit()

        # Player should be deleted too
        result = await test_db.execute(select(Player).where(Player.session_id == "DEL123"))
        assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
class TestPlayerModel:
    """Test Player model."""

    async def test_create_player(self, test_db: AsyncSession):
        """Test creating a player."""
        session = Session(id="PL123", status="active")
        test_db.add(session)
        await test_db.commit()

        player = Player(
            session_id="PL123",
            name="Alice",
            score=0
        )
        test_db.add(player)
        await test_db.commit()
        await test_db.refresh(player)

        assert player.name == "Alice"
        assert player.score == 0
        assert player.connected is True
        assert player.joined_at is not None

    async def test_player_unique_name_per_session(self, test_db: AsyncSession):
        """Test that player names must be unique per session."""
        session = Session(id="UN123", status="active")
        test_db.add(session)
        await test_db.commit()

        player1 = Player(session_id="UN123", name="Alice")
        test_db.add(player1)
        await test_db.commit()

        # Try to create duplicate player
        player2 = Player(session_id="UN123", name="Alice")
        test_db.add(player2)
        
        with pytest.raises(Exception):  # Should raise IntegrityError
            await test_db.commit()

    async def test_player_score_update(self, test_db: AsyncSession):
        """Test updating player score."""
        session = Session(id="SC123", status="active")
        player = Player(session_id="SC123", name="Bob", score=10)
        
        test_db.add(session)
        test_db.add(player)
        await test_db.commit()

        # Update score
        player.score += 5
        await test_db.commit()
        await test_db.refresh(player)

        assert player.score == 15


@pytest.mark.asyncio
class TestEventModel:
    """Test Event model."""

    async def test_create_event(self, test_db: AsyncSession):
        """Test creating an event."""
        session = Session(id="EV123", status="active")
        test_db.add(session)
        await test_db.commit()

        event = Event(
            session_id="EV123",
            event_type="QUESTION_STARTED",
            actor="moderator",
            payload={"question_id": "q1"}
        )
        test_db.add(event)
        await test_db.commit()
        await test_db.refresh(event)

        assert event.event_type == "QUESTION_STARTED"
        assert event.actor == "moderator"
        assert event.payload is not None
        assert event.payload["question_id"] == "q1"
        assert event.timestamp is not None

    async def test_event_without_actor(self, test_db: AsyncSession):
        """Test creating event without actor (system event)."""
        session = Session(id="SYS123", status="active")
        test_db.add(session)
        await test_db.commit()

        event = Event(
            session_id="SYS123",
            event_type="SESSION_CREATED"
        )
        test_db.add(event)
        await test_db.commit()

        assert event.actor is None


@pytest.mark.asyncio
class TestQuestionModel:
    """Test Question model."""

    async def test_create_question(self, test_db: AsyncSession):
        """Test creating a question."""
        session = Session(id="Q123", status="active")
        test_db.add(session)
        await test_db.commit()

        question = Question(
            id="q1",
            session_id="Q123",
            category_id="cat1",
            category_name="Geography",
            type="input-text",
            prompt="What is the capital of Germany?",
            data={"required_correct": 1},
            correct_answer={"answers": ["Berlin", "berlin"]},
            points=1,
            order_in_category=1
        )
        test_db.add(question)
        await test_db.commit()
        await test_db.refresh(question)

        assert question.type == "input-text"
        assert question.prompt == "What is the capital of Germany?"
        assert question.points == 1

    async def test_question_with_image(self, test_db: AsyncSession):
        """Test question with image URL."""
        session = Session(id="IMG123", status="active")
        test_db.add(session)
        await test_db.commit()

        question = Question(
            id="q_img",
            session_id="IMG123",
            category_id="cat1",
            category_name="Images",
            type="image-question",
            prompt="What is in this image?",
            data={},
            image_url="media/test.jpg",
            points=1,
            order_in_category=1
        )
        test_db.add(question)
        await test_db.commit()

        assert question.image_url == "media/test.jpg"


@pytest.mark.asyncio
class TestAnswerModel:
    """Test Answer model."""

    async def test_create_answer(self, test_db: AsyncSession):
        """Test creating an answer."""
        session = Session(id="A123", status="active")
        player = Player(session_id="A123", name="Charlie")
        question = Question(
            id="q_ans",
            session_id="A123",
            category_id="cat1",
            category_name="Test",
            type="input-text",
            prompt="Test?",
            data={},
            points=1,
            order_in_category=1
        )
        
        test_db.add_all([session, player, question])
        await test_db.commit()
        await test_db.refresh(player)

        answer = Answer(
            session_id="A123",
            question_id="q_ans",
            player_id=player.id,
            answer={"text": "Berlin"},
            is_correct=True,
            points_awarded=1
        )
        test_db.add(answer)
        await test_db.commit()

        assert answer.is_correct is True
        assert answer.points_awarded == 1

    async def test_answer_unique_per_player_question(self, test_db: AsyncSession):
        """Test that each player can only answer once per question."""
        session = Session(id="UNQ123", status="active")
        player = Player(session_id="UNQ123", name="David")
        question = Question(
            id="q_unq",
            session_id="UNQ123",
            category_id="cat1",
            category_name="Test",
            type="input-text",
            prompt="Test?",
            data={},
            points=1,
            order_in_category=1
        )
        
        test_db.add_all([session, player, question])
        await test_db.commit()
        await test_db.refresh(player)

        answer1 = Answer(
            session_id="UNQ123",
            question_id="q_unq",
            player_id=player.id,
            answer={"text": "Answer1"}
        )
        test_db.add(answer1)
        await test_db.commit()

        # Try to create duplicate answer
        answer2 = Answer(
            session_id="UNQ123",
            question_id="q_unq",
            player_id=player.id,
            answer={"text": "Answer2"}
        )
        test_db.add(answer2)
        
        with pytest.raises(Exception):  # Should raise IntegrityError
            await test_db.commit()


@pytest.mark.asyncio
class TestBuzzerPressModel:
    """Test BuzzerPress model."""

    async def test_create_buzzer_press(self, test_db: AsyncSession):
        """Test creating a buzzer press."""
        session = Session(id="BZ123", status="active")
        player = Player(session_id="BZ123", name="Eve")
        question = Question(
            id="q_bz",
            session_id="BZ123",
            category_id="cat1",
            category_name="Buzzer",
            type="buzzer",
            prompt="Buzz!",
            data={},
            points=3,
            order_in_category=1
        )
        
        test_db.add_all([session, player, question])
        await test_db.commit()
        await test_db.refresh(player)

        buzzer = BuzzerPress(
            session_id="BZ123",
            question_id="q_bz",
            player_id=player.id,
            client_timestamp=1234567890,
            is_winner=True
        )
        test_db.add(buzzer)
        await test_db.commit()

        assert buzzer.is_winner is True
        assert buzzer.client_timestamp == 1234567890

    async def test_multiple_buzzer_presses(self, test_db: AsyncSession):
        """Test multiple buzzer presses for same question."""
        session = Session(id="MBZ123", status="active")
        player1 = Player(session_id="MBZ123", name="Fast")
        player2 = Player(session_id="MBZ123", name="Slow")
        question = Question(
            id="q_mbz",
            session_id="MBZ123",
            category_id="cat1",
            category_name="Buzzer",
            type="buzzer",
            prompt="Buzz!",
            data={},
            points=3,
            order_in_category=1
        )
        
        test_db.add_all([session, player1, player2, question])
        await test_db.commit()
        await test_db.refresh(player1)
        await test_db.refresh(player2)

        buzzer1 = BuzzerPress(
            session_id="MBZ123",
            question_id="q_mbz",
            player_id=player1.id,
            client_timestamp=1000,
            is_winner=True
        )
        buzzer2 = BuzzerPress(
            session_id="MBZ123",
            question_id="q_mbz",
            player_id=player2.id,
            client_timestamp=2000,
            is_winner=False
        )
        
        test_db.add_all([buzzer1, buzzer2])
        await test_db.commit()

        # Query all buzzer presses
        result = await test_db.execute(
            select(BuzzerPress).where(BuzzerPress.question_id == "q_mbz")
        )
        presses = result.scalars().all()

        assert len(presses) == 2
        assert sum(1 for p in presses if p.is_winner) == 1
