"""
Comprehensive tests for points calculation service.
"""
import pytest
import math

from app.services.points_service import PointsService, PointsCalculationError


@pytest.fixture
def points_service():
    """Create points service instance."""
    return PointsService()


class TestPointsServiceInitialization:
    """Test PointsService initialization."""

    def test_init(self):
        """Test initialization."""
        service = PointsService()
        assert service is not None


class TestInputTextQuestions:
    """Test points calculation for input-text questions."""

    def test_correct_answer(self, points_service):
        """Test correct answer gets full points."""
        question_data = {
            'points': 10,
            'answers': ['Berlin', 'berlin']
        }
        answer_data = {'answer': 'Berlin'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_case_insensitive(self, points_service):
        """Test case-insensitive matching."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': 'BERLIN'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_whitespace_trimmed(self, points_service):
        """Test whitespace is trimmed."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': '  Berlin  '}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_wrong_answer(self, points_service):
        """Test wrong answer gets zero points."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': 'Paris'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_empty_answer(self, points_service):
        """Test empty answer gets zero points."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': ''}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_multiple_correct_answers(self, points_service):
        """Test question with multiple correct answers."""
        question_data = {
            'points': 10,
            'answers': ['Berlin', 'Deutschland', 'Germany']
        }
        answer_data = {'answer': 'Deutschland'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_with_time_bonus(self, points_service):
        """Test time bonus application."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': 'Berlin'}
        
        # Instant answer (0 seconds) should get 20% bonus
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data,
            time_taken=0,
            max_time=10
        )
        
        assert points == 12  # 10 * 1.2

    def test_with_time_bonus_half_time(self, points_service):
        """Test time bonus at half time."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': 'Berlin'}
        
        # Half time should get 10% bonus
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data,
            time_taken=5,
            max_time=10
        )
        
        assert points == 11  # 10 * 1.1

    def test_with_time_bonus_max_time(self, points_service):
        """Test no bonus at max time."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {'answer': 'Berlin'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data,
            time_taken=10,
            max_time=10
        )
        
        assert points == 10  # No bonus

    def test_dict_format_answers(self, points_service):
        """Test answers in dict format."""
        question_data = {
            'points': 10,
            'answers': [
                {'text': 'Berlin', 'correct': True},
                {'text': 'Paris', 'correct': False}
            ]
        }
        answer_data = {'answer': 'Berlin'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10


class TestInputNumberQuestions:
    """Test points calculation for input-number questions."""

    def test_exact_match(self, points_service):
        """Test exact number match."""
        question_data = {
            'points': 10,
            'correct_value': 42,
            'tolerance': 0
        }
        answer_data = {'answer': 42}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_within_tolerance(self, points_service):
        """Test answer within tolerance."""
        question_data = {
            'points': 10,
            'correct_value': 100,
            'tolerance': 5
        }
        answer_data = {'answer': 103}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_outside_tolerance(self, points_service):
        """Test answer outside tolerance."""
        question_data = {
            'points': 10,
            'correct_value': 100,
            'tolerance': 5
        }
        answer_data = {'answer': 110}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_negative_numbers(self, points_service):
        """Test with negative numbers."""
        question_data = {
            'points': 10,
            'correct_value': -50,
            'tolerance': 2
        }
        answer_data = {'answer': -51}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_float_values(self, points_service):
        """Test with float values."""
        question_data = {
            'points': 10,
            'correct_value': 3.14159,
            'tolerance': 0.01
        }
        answer_data = {'answer': 3.14}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_invalid_number_format(self, points_service):
        """Test invalid number format."""
        question_data = {
            'points': 10,
            'correct_value': 42,
            'tolerance': 0
        }
        answer_data = {'answer': 'not a number'}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_missing_correct_value(self, points_service):
        """Test missing correct value."""
        question_data = {
            'points': 10,
            'tolerance': 0
        }
        answer_data = {'answer': 42}
        
        points = points_service.calculate_points(
            'input-number',
            question_data,
            answer_data
        )
        
        assert points == 0


class TestSliderQuestions:
    """Test points calculation for slider questions."""

    def test_exact_value(self, points_service):
        """Test exact slider value."""
        question_data = {
            'points': 10,
            'correct_value': 50,
            'min': 0,
            'max': 100,
            'tolerance': 0
        }
        answer_data = {'value': 50}
        
        points = points_service.calculate_points(
            'slider',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_within_tolerance(self, points_service):
        """Test value within tolerance gets full points."""
        question_data = {
            'points': 10,
            'correct_value': 50,
            'min': 0,
            'max': 100,
            'tolerance': 5
        }
        answer_data = {'value': 53}
        
        points = points_service.calculate_points(
            'slider',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_proportional_scoring(self, points_service):
        """Test proportional scoring outside tolerance."""
        question_data = {
            'points': 10,
            'correct_value': 50,
            'min': 0,
            'max': 100,
            'tolerance': 0
        }
        answer_data = {'value': 75}  # 25 units away, range = 100
        
        points = points_service.calculate_points(
            'slider',
            question_data,
            answer_data
        )
        
        # Distance: 25, Max distance: 100, Proportion: 0.75
        # Points: 10 * 0.75 = 7.5 -> 7
        assert points == 7

    def test_max_distance_zero_points(self, points_service):
        """Test maximum distance gives zero points."""
        question_data = {
            'points': 10,
            'correct_value': 0,
            'min': 0,
            'max': 100,
            'tolerance': 0
        }
        answer_data = {'value': 100}
        
        points = points_service.calculate_points(
            'slider',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_negative_range(self, points_service):
        """Test slider with negative range."""
        question_data = {
            'points': 10,
            'correct_value': -50,
            'min': -100,
            'max': 0,
            'tolerance': 5
        }
        answer_data = {'value': -48}
        
        points = points_service.calculate_points(
            'slider',
            question_data,
            answer_data
        )
        
        assert points == 10


class TestMultipleChoiceQuestions:
    """Test points calculation for multiple-choice questions."""

    def test_single_select_correct(self, points_service):
        """Test single-select correct answer."""
        question_data = {
            'points': 10,
            'required_correct': 1,
            'options': [
                {'id': 'a', 'correct': True},
                {'id': 'b', 'correct': False},
                {'id': 'c', 'correct': False}
            ]
        }
        answer_data = {'selections': ['a']}
        
        points = points_service.calculate_points(
            'multiple-choice',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_single_select_wrong(self, points_service):
        """Test single-select wrong answer."""
        question_data = {
            'points': 10,
            'required_correct': 1,
            'options': [
                {'id': 'a', 'correct': True},
                {'id': 'b', 'correct': False}
            ]
        }
        answer_data = {'selections': ['b']}
        
        points = points_service.calculate_points(
            'multiple-choice',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_multi_select_all_correct(self, points_service):
        """Test multi-select with all correct."""
        question_data = {
            'points': 10,
            'required_correct': 2,
            'options': [
                {'id': 'a', 'correct': True},
                {'id': 'b', 'correct': True},
                {'id': 'c', 'correct': False}
            ]
        }
        answer_data = {'selections': ['a', 'b']}
        
        points = points_service.calculate_points(
            'multiple-choice',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_multi_select_partial_credit(self, points_service):
        """Test multi-select partial credit."""
        question_data = {
            'points': 10,
            'required_correct': 2,
            'options': [
                {'id': 'a', 'correct': True},
                {'id': 'b', 'correct': True},
                {'id': 'c', 'correct': False}
            ]
        }
        answer_data = {'selections': ['a']}  # Only 1 of 2 required
        
        points = points_service.calculate_points(
            'multiple-choice',
            question_data,
            answer_data
        )
        
        assert points == 5  # 10 * (1/2)

    def test_multi_select_with_wrong_selection(self, points_service):
        """Test multi-select with wrong selection gives zero."""
        question_data = {
            'points': 10,
            'required_correct': 2,
            'options': [
                {'id': 'a', 'correct': True},
                {'id': 'b', 'correct': True},
                {'id': 'c', 'correct': False}
            ]
        }
        answer_data = {'selections': ['a', 'c']}  # One wrong
        
        points = points_service.calculate_points(
            'multiple-choice',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_empty_selections(self, points_service):
        """Test empty selections."""
        question_data = {
            'points': 10,
            'required_correct': 1,
            'options': [
                {'id': 'a', 'correct': True}
            ]
        }
        answer_data = {'selections': []}
        
        points = points_service.calculate_points(
            'multiple-choice',
            question_data,
            answer_data
        )
        
        assert points == 0


class TestBuzzerQuestions:
    """Test points calculation for buzzer questions."""

    def test_first_place_correct(self, points_service):
        """Test first place correct answer."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {
            'answer': 'Berlin',
            'buzzer_position': 1
        }
        
        points = points_service.calculate_points(
            'buzzer',
            question_data,
            answer_data
        )
        
        assert points == 10  # 100%

    def test_second_place_correct(self, points_service):
        """Test second place correct answer."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {
            'answer': 'Berlin',
            'buzzer_position': 2
        }
        
        points = points_service.calculate_points(
            'buzzer',
            question_data,
            answer_data
        )
        
        assert points == 7  # 75% of 10 = 7.5 -> 7

    def test_third_place_correct(self, points_service):
        """Test third place correct answer."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {
            'answer': 'Berlin',
            'buzzer_position': 3
        }
        
        points = points_service.calculate_points(
            'buzzer',
            question_data,
            answer_data
        )
        
        assert points == 5  # 50%

    def test_fourth_place_correct(self, points_service):
        """Test fourth+ place correct answer."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {
            'answer': 'Berlin',
            'buzzer_position': 4
        }
        
        points = points_service.calculate_points(
            'buzzer',
            question_data,
            answer_data
        )
        
        assert points == 2  # 25% of 10 = 2.5 -> 2

    def test_wrong_answer(self, points_service):
        """Test wrong answer regardless of position."""
        question_data = {
            'points': 10,
            'answers': ['Berlin']
        }
        answer_data = {
            'answer': 'Paris',
            'buzzer_position': 1
        }
        
        points = points_service.calculate_points(
            'buzzer',
            question_data,
            answer_data
        )
        
        assert points == 0


class TestImageQuestions:
    """Test points calculation for image-question type."""

    def test_correct_answer(self, points_service):
        """Test image question (same as input-text)."""
        question_data = {
            'points': 10,
            'answers': ['Eiffel Tower']
        }
        answer_data = {'answer': 'Eiffel Tower'}
        
        points = points_service.calculate_points(
            'image-question',
            question_data,
            answer_data
        )
        
        assert points == 10


class TestHotspotQuestions:
    """Test points calculation for hotspot questions."""

    def test_click_in_rectangle(self, points_service):
        """Test click inside rectangle hotspot."""
        question_data = {
            'points': 10,
            'hotspots': [
                {
                    'shape': 'rectangle',
                    'x': 100,
                    'y': 100,
                    'width': 50,
                    'height': 50
                }
            ]
        }
        answer_data = {'x': 120, 'y': 120}
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_click_outside_rectangle(self, points_service):
        """Test click outside rectangle hotspot."""
        question_data = {
            'points': 10,
            'hotspots': [
                {
                    'shape': 'rectangle',
                    'x': 100,
                    'y': 100,
                    'width': 50,
                    'height': 50
                }
            ]
        }
        answer_data = {'x': 200, 'y': 200}
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_click_in_circle(self, points_service):
        """Test click inside circle hotspot."""
        question_data = {
            'points': 10,
            'hotspots': [
                {
                    'shape': 'circle',
                    'cx': 100,
                    'cy': 100,
                    'radius': 50
                }
            ]
        }
        answer_data = {'x': 110, 'y': 110}
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_click_outside_circle(self, points_service):
        """Test click outside circle hotspot."""
        question_data = {
            'points': 10,
            'hotspots': [
                {
                    'shape': 'circle',
                    'cx': 100,
                    'cy': 100,
                    'radius': 50
                }
            ]
        }
        answer_data = {'x': 200, 'y': 200}
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_click_on_circle_edge(self, points_service):
        """Test click exactly on circle edge."""
        question_data = {
            'points': 10,
            'hotspots': [
                {
                    'shape': 'circle',
                    'cx': 100,
                    'cy': 100,
                    'radius': 50
                }
            ]
        }
        answer_data = {'x': 150, 'y': 100}  # Exactly radius away
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_multiple_hotspots(self, points_service):
        """Test multiple hotspot regions."""
        question_data = {
            'points': 10,
            'hotspots': [
                {'shape': 'rectangle', 'x': 0, 'y': 0, 'width': 50, 'height': 50},
                {'shape': 'circle', 'cx': 200, 'cy': 200, 'radius': 30}
            ]
        }
        answer_data = {'x': 210, 'y': 210}  # In circle
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_missing_coordinates(self, points_service):
        """Test missing click coordinates."""
        question_data = {
            'points': 10,
            'hotspots': [{'shape': 'rectangle', 'x': 0, 'y': 0, 'width': 50, 'height': 50}]
        }
        answer_data = {}
        
        points = points_service.calculate_points(
            'hotspot',
            question_data,
            answer_data
        )
        
        assert points == 0


class TestSortingQuestions:
    """Test points calculation for sorting questions."""

    def test_perfect_order(self, points_service):
        """Test perfect sorting order."""
        question_data = {
            'points': 10,
            'correct_order': ['A', 'B', 'C', 'D']
        }
        answer_data = {'order': ['A', 'B', 'C', 'D']}
        
        points = points_service.calculate_points(
            'sorting',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_completely_wrong_order(self, points_service):
        """Test completely wrong order."""
        question_data = {
            'points': 10,
            'correct_order': ['A', 'B', 'C', 'D']
        }
        answer_data = {'order': ['D', 'C', 'B', 'A']}
        
        points = points_service.calculate_points(
            'sorting',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_partial_correct_order(self, points_service):
        """Test partial credit for sorting."""
        question_data = {
            'points': 10,
            'correct_order': ['A', 'B', 'C', 'D']
        }
        answer_data = {'order': ['A', 'B', 'D', 'C']}  # 2 out of 4 correct positions
        
        points = points_service.calculate_points(
            'sorting',
            question_data,
            answer_data
        )
        
        assert points == 5  # 10 * (2/4)

    def test_wrong_length(self, points_service):
        """Test sorting with wrong number of items."""
        question_data = {
            'points': 10,
            'correct_order': ['A', 'B', 'C', 'D']
        }
        answer_data = {'order': ['A', 'B', 'C']}  # Too few
        
        points = points_service.calculate_points(
            'sorting',
            question_data,
            answer_data
        )
        
        assert points == 0

    def test_empty_order(self, points_service):
        """Test empty sorting answer."""
        question_data = {
            'points': 10,
            'correct_order': ['A', 'B', 'C']
        }
        answer_data = {'order': []}
        
        points = points_service.calculate_points(
            'sorting',
            question_data,
            answer_data
        )
        
        assert points == 0


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_unknown_question_type(self, points_service):
        """Test unknown question type raises error."""
        with pytest.raises(PointsCalculationError) as exc_info:
            points_service.calculate_points(
                'unknown-type',
                {},
                {}
            )
        
        assert 'unknown question type' in str(exc_info.value).lower()

    def test_empty_question_type(self, points_service):
        """Test empty question type raises error."""
        with pytest.raises(PointsCalculationError) as exc_info:
            points_service.calculate_points(
                '',
                {},
                {}
            )
        
        assert 'required' in str(exc_info.value).lower()

    def test_none_question_type(self, points_service):
        """Test None question type raises error."""
        with pytest.raises(PointsCalculationError) as exc_info:
            points_service.calculate_points(
                None,
                {},
                {}
            )
        
        assert 'required' in str(exc_info.value).lower()

    def test_negative_points_floored_to_zero(self, points_service):
        """Test negative points are floored to zero."""
        # This shouldn't happen in practice, but ensure safety
        question_data = {
            'points': -10,  # Invalid, but handle gracefully
            'answers': ['test']
        }
        answer_data = {'answer': 'test'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 0


class TestLeaderboard:
    """Test leaderboard calculation."""

    def test_calculate_leaderboard_single_player(self, points_service):
        """Test leaderboard with single player."""
        players_answers = [
            {
                'player_id': 'player1',
                'answers': [
                    {
                        'question_type': 'input-text',
                        'question_data': {'points': 10, 'answers': ['Berlin']},
                        'answer_data': {'answer': 'Berlin'},
                        'time_taken': None,
                        'max_time': None
                    }
                ]
            }
        ]
        
        leaderboard = points_service.calculate_leaderboard_scores(players_answers)
        
        assert len(leaderboard) == 1
        assert leaderboard[0]['player_id'] == 'player1'
        assert leaderboard[0]['total_score'] == 10

    def test_calculate_leaderboard_multiple_players(self, points_service):
        """Test leaderboard with multiple players sorted by score."""
        players_answers = [
            {
                'player_id': 'player1',
                'answers': [
                    {
                        'question_type': 'input-text',
                        'question_data': {'points': 10, 'answers': ['A']},
                        'answer_data': {'answer': 'A'},
                        'time_taken': None,
                        'max_time': None
                    }
                ]
            },
            {
                'player_id': 'player2',
                'answers': [
                    {
                        'question_type': 'input-text',
                        'question_data': {'points': 10, 'answers': ['A']},
                        'answer_data': {'answer': 'A'},
                        'time_taken': None,
                        'max_time': None
                    },
                    {
                        'question_type': 'input-text',
                        'question_data': {'points': 10, 'answers': ['B']},
                        'answer_data': {'answer': 'B'},
                        'time_taken': None,
                        'max_time': None
                    }
                ]
            }
        ]
        
        leaderboard = points_service.calculate_leaderboard_scores(players_answers)
        
        assert len(leaderboard) == 2
        assert leaderboard[0]['player_id'] == 'player2'
        assert leaderboard[0]['total_score'] == 20
        assert leaderboard[1]['player_id'] == 'player1'
        assert leaderboard[1]['total_score'] == 10

    def test_calculate_leaderboard_with_errors(self, points_service):
        """Test leaderboard skips invalid answers."""
        players_answers = [
            {
                'player_id': 'player1',
                'answers': [
                    {
                        'question_type': 'input-text',
                        'question_data': {'points': 10, 'answers': ['A']},
                        'answer_data': {'answer': 'A'},
                        'time_taken': None,
                        'max_time': None
                    },
                    {
                        'question_type': 'invalid-type',  # Should be skipped
                        'question_data': {},
                        'answer_data': {},
                        'time_taken': None,
                        'max_time': None
                    }
                ]
            }
        ]
        
        leaderboard = points_service.calculate_leaderboard_scores(players_answers)
        
        assert len(leaderboard) == 1
        assert leaderboard[0]['total_score'] == 10  # Only valid answer counted


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_very_large_points(self, points_service):
        """Test with very large point values."""
        question_data = {
            'points': 1000000,
            'answers': ['test']
        }
        answer_data = {'answer': 'test'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 1000000

    def test_unicode_answers(self, points_service):
        """Test with Unicode characters."""
        question_data = {
            'points': 10,
            'answers': ['北京', 'Москва']
        }
        answer_data = {'answer': '北京'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_special_characters_in_answers(self, points_service):
        """Test with special characters."""
        question_data = {
            'points': 10,
            'answers': ['O\'Brien', 'CO₂']
        }
        answer_data = {'answer': 'CO₂'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data
        )
        
        assert points == 10

    def test_time_taken_exceeds_max_time(self, points_service):
        """Test time taken exceeding max time (should clamp to max)."""
        question_data = {
            'points': 10,
            'answers': ['test']
        }
        answer_data = {'answer': 'test'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data,
            time_taken=20,  # Exceeds max
            max_time=10
        )
        
        assert points == 10  # No bonus, but still correct

    def test_negative_time_taken(self, points_service):
        """Test negative time taken (should clamp to 0)."""
        question_data = {
            'points': 10,
            'answers': ['test']
        }
        answer_data = {'answer': 'test'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data,
            time_taken=-5,  # Invalid
            max_time=10
        )
        
        assert points == 12  # Max bonus (treated as 0 seconds)

    def test_zero_max_time(self, points_service):
        """Test with zero max time (no bonus applied)."""
        question_data = {
            'points': 10,
            'answers': ['test']
        }
        answer_data = {'answer': 'test'}
        
        points = points_service.calculate_points(
            'input-text',
            question_data,
            answer_data,
            time_taken=5,
            max_time=0  # Invalid
        )
        
        assert points == 10  # No bonus applied
