"""
Service for calculating points based on question types and answers.
"""
from typing import Dict, Any, List, Optional
from decimal import Decimal
import math


class PointsCalculationError(Exception):
    """Exception raised for points calculation errors."""
    pass


class PointsService:
    """
    Service for calculating points earned from question answers.
    
    Supports all 8 question types with different scoring algorithms.
    """

    def calculate_points(
        self,
        question_type: str,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float] = None,
        max_time: Optional[float] = None
    ) -> int:
        """
        Calculate points for an answer based on question type.
        
        Args:
            question_type: Type of question (input-text, multiple-choice, etc.)
            question_data: Question configuration from XML
            answer_data: Player's answer data
            time_taken: Time taken to answer in seconds (optional)
            max_time: Maximum time allowed in seconds (optional)
        
        Returns:
            Points earned (0 or positive integer)
        
        Raises:
            PointsCalculationError: If calculation fails
        """
        if not question_type:
            raise PointsCalculationError("Question type is required")
        
        # Normalize question type
        question_type = question_type.lower().strip()
        
        # Route to specific calculator
        calculators = {
            'input-text': self._calculate_input_text,
            'input-number': self._calculate_input_number,
            'slider': self._calculate_slider,
            'multiple-choice': self._calculate_multiple_choice,
            'buzzer': self._calculate_buzzer,
            'image-question': self._calculate_image_question,
            'hotspot': self._calculate_hotspot,
            'sorting': self._calculate_sorting
        }
        
        calculator = calculators.get(question_type)
        if not calculator:
            raise PointsCalculationError(f"Unknown question type: {question_type}")
        
        try:
            points = calculator(question_data, answer_data, time_taken, max_time)
            return max(0, int(points))  # Ensure non-negative integer
        except Exception as e:
            raise PointsCalculationError(f"Failed to calculate points: {str(e)}")

    def _calculate_input_text(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for input-text question.
        
        Answer is correct if it matches any of the correct answers (case-insensitive).
        """
        player_answer = answer_data.get('answer', '').strip().lower()
        if not player_answer:
            return 0
        
        correct_answers = question_data.get('answers', [])
        base_points = question_data.get('points', 0)
        
        # Check if answer matches any correct answer
        for correct in correct_answers:
            if isinstance(correct, dict):
                correct_text = correct.get('text', '').strip().lower()
            else:
                correct_text = str(correct).strip().lower()
            
            if player_answer == correct_text:
                return self._apply_time_bonus(base_points, time_taken, max_time)
        
        return 0

    def _calculate_input_number(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for input-number question.
        
        Can use exact match or tolerance-based matching.
        """
        try:
            player_answer = float(answer_data.get('answer', 0))
        except (ValueError, TypeError):
            return 0
        
        correct_value = question_data.get('correct_value')
        if correct_value is None:
            return 0
        
        try:
            correct_value = float(correct_value)
        except (ValueError, TypeError):
            return 0
        
        base_points = question_data.get('points', 0)
        tolerance = question_data.get('tolerance', 0)
        
        # Check if answer is within tolerance
        if abs(player_answer - correct_value) <= abs(tolerance):
            return self._apply_time_bonus(base_points, time_taken, max_time)
        
        return 0

    def _calculate_slider(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for slider question.
        
        Uses proportional scoring based on distance from correct value.
        """
        try:
            player_value = float(answer_data.get('value', 0))
        except (ValueError, TypeError):
            return 0
        
        correct_value = question_data.get('correct_value')
        if correct_value is None:
            return 0
        
        try:
            correct_value = float(correct_value)
        except (ValueError, TypeError):
            return 0
        
        min_value = question_data.get('min', 0)
        max_value = question_data.get('max', 100)
        base_points = question_data.get('points', 0)
        tolerance = question_data.get('tolerance', 0)
        
        # Check if within perfect range
        if abs(player_value - correct_value) <= abs(tolerance):
            return self._apply_time_bonus(base_points, time_taken, max_time)
        
        # Proportional scoring based on distance
        value_range = max_value - min_value
        if value_range <= 0:
            return 0
        
        distance = abs(player_value - correct_value)
        max_distance = value_range
        
        # Linear decay: points decrease with distance
        proportion = 1 - (distance / max_distance)
        proportion = max(0, min(1, proportion))  # Clamp to [0, 1]
        
        points = int(base_points * proportion)
        return self._apply_time_bonus(points, time_taken, max_time)

    def _calculate_multiple_choice(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for multiple-choice question.
        
        Can be single-select or multi-select. For multi-select, partial credit available.
        """
        player_selections = answer_data.get('selections', [])
        if not isinstance(player_selections, list):
            player_selections = [player_selections]
        
        # Normalize to set of strings
        player_selections = {str(s).strip() for s in player_selections if s is not None}
        
        if not player_selections:
            return 0
        
        options = question_data.get('options', [])
        base_points = question_data.get('points', 0)
        required_correct = question_data.get('required_correct', 1)
        
        # Build sets of correct and incorrect options
        correct_options = set()
        incorrect_options = set()
        
        for opt in options:
            if isinstance(opt, dict):
                opt_id = str(opt.get('id', '')).strip()
                is_correct = opt.get('correct', False)
                
                if is_correct:
                    correct_options.add(opt_id)
                else:
                    incorrect_options.add(opt_id)
        
        if not correct_options:
            return 0
        
        # Calculate correct and incorrect selections
        correct_selected = len(player_selections & correct_options)
        incorrect_selected = len(player_selections & incorrect_options)
        
        # If single select mode (required_correct == 1) and exactly one correct option
        if required_correct == 1 and len(correct_options) == 1:
            # Must select exactly the correct option
            if player_selections == correct_options:
                return self._apply_time_bonus(base_points, time_taken, max_time)
            return 0
        
        # Multi-select: partial credit
        # Penalty for incorrect selections
        if incorrect_selected > 0:
            return 0
        
        # Award partial credit based on how many correct options were selected
        if correct_selected >= required_correct:
            # Full points if required minimum met
            return self._apply_time_bonus(base_points, time_taken, max_time)
        else:
            # Partial credit
            proportion = correct_selected / required_correct
            points = int(base_points * proportion)
            return self._apply_time_bonus(points, time_taken, max_time)

    def _calculate_buzzer(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for buzzer question.
        
        Points based on buzzer position (1st, 2nd, 3rd, etc.) and correctness of answer.
        """
        # Check if answer is correct first
        player_answer = answer_data.get('answer', '').strip().lower()
        correct_answers = question_data.get('answers', [])
        
        is_correct = False
        for correct in correct_answers:
            if isinstance(correct, dict):
                correct_text = correct.get('text', '').strip().lower()
            else:
                correct_text = str(correct).strip().lower()
            
            if player_answer == correct_text:
                is_correct = True
                break
        
        if not is_correct:
            return 0
        
        # Award points based on buzzer position
        position = answer_data.get('buzzer_position', 99)
        base_points = question_data.get('points', 0)
        
        # Points decrease with position: 1st = 100%, 2nd = 75%, 3rd = 50%, 4th+ = 25%
        position_multipliers = {
            1: 1.0,
            2: 0.75,
            3: 0.50
        }
        
        multiplier = position_multipliers.get(position, 0.25)
        points = int(base_points * multiplier)
        
        return points  # No time bonus for buzzer questions (time is implicit in position)

    def _calculate_image_question(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for image-question.
        
        Similar to input-text but with an image prompt.
        """
        # Same logic as input-text
        return self._calculate_input_text(question_data, answer_data, time_taken, max_time)

    def _calculate_hotspot(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for hotspot question.
        
        Check if clicked coordinates fall within correct hotspot regions.
        """
        click_x = answer_data.get('x')
        click_y = answer_data.get('y')
        
        if click_x is None or click_y is None:
            return 0
        
        try:
            click_x = float(click_x)
            click_y = float(click_y)
        except (ValueError, TypeError):
            return 0
        
        hotspots = question_data.get('hotspots', [])
        base_points = question_data.get('points', 0)
        
        # Check each hotspot region
        for hotspot in hotspots:
            if not isinstance(hotspot, dict):
                continue
            
            shape = hotspot.get('shape', 'rectangle').lower()
            
            if shape == 'rectangle':
                if self._point_in_rectangle(click_x, click_y, hotspot):
                    return self._apply_time_bonus(base_points, time_taken, max_time)
            elif shape == 'circle':
                if self._point_in_circle(click_x, click_y, hotspot):
                    return self._apply_time_bonus(base_points, time_taken, max_time)
        
        return 0

    def _calculate_sorting(
        self,
        question_data: Dict[str, Any],
        answer_data: Dict[str, Any],
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Calculate points for sorting question.
        
        Award points based on how many items are in correct positions.
        """
        player_order = answer_data.get('order', [])
        if not isinstance(player_order, list):
            return 0
        
        correct_order = question_data.get('correct_order', [])
        if not isinstance(correct_order, list) or not correct_order:
            return 0
        
        base_points = question_data.get('points', 0)
        
        # Normalize both lists to strings
        player_order = [str(item).strip() for item in player_order]
        correct_order = [str(item).strip() for item in correct_order]
        
        # Check if lists have same length
        if len(player_order) != len(correct_order):
            return 0
        
        # Count correct positions
        correct_positions = sum(
            1 for i in range(len(correct_order))
            if i < len(player_order) and player_order[i] == correct_order[i]
        )
        
        # Perfect match required for full points
        if correct_positions == len(correct_order):
            return self._apply_time_bonus(base_points, time_taken, max_time)
        
        # Partial credit based on correct positions
        proportion = correct_positions / len(correct_order)
        points = int(base_points * proportion)
        
        return self._apply_time_bonus(points, time_taken, max_time)

    def _apply_time_bonus(
        self,
        base_points: int,
        time_taken: Optional[float],
        max_time: Optional[float]
    ) -> int:
        """
        Apply time bonus to base points.
        
        Faster answers get more points (up to 20% bonus).
        """
        if time_taken is None or max_time is None or max_time <= 0:
            return base_points
        
        # Clamp time_taken to [0, max_time]
        time_taken = max(0, min(time_taken, max_time))
        
        # Calculate time ratio (0 = instant, 1 = max time)
        time_ratio = time_taken / max_time
        
        # Bonus decreases linearly: 20% bonus at time_ratio=0, 0% at time_ratio=1
        bonus_multiplier = 1.0 + (0.2 * (1 - time_ratio))
        
        points_with_bonus = int(base_points * bonus_multiplier)
        return points_with_bonus

    def _point_in_rectangle(self, x: float, y: float, rect: Dict[str, Any]) -> bool:
        """Check if point (x, y) is inside rectangle."""
        try:
            rect_x = float(rect.get('x', 0))
            rect_y = float(rect.get('y', 0))
            width = float(rect.get('width', 0))
            height = float(rect.get('height', 0))
            
            return (rect_x <= x <= rect_x + width and
                    rect_y <= y <= rect_y + height)
        except (ValueError, TypeError):
            return False

    def _point_in_circle(self, x: float, y: float, circle: Dict[str, Any]) -> bool:
        """Check if point (x, y) is inside circle."""
        try:
            center_x = float(circle.get('cx', 0))
            center_y = float(circle.get('cy', 0))
            radius = float(circle.get('radius', 0))
            
            distance = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
            return distance <= radius
        except (ValueError, TypeError):
            return False

    def calculate_leaderboard_scores(
        self,
        players_answers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Calculate total scores for all players.
        
        Args:
            players_answers: List of dicts with player_id, answers list
        
        Returns:
            List of dicts with player_id and total_score, sorted by score
        """
        leaderboard = []
        
        for player_data in players_answers:
            player_id = player_data.get('player_id')
            answers = player_data.get('answers', [])
            
            total_score = 0
            for answer in answers:
                question_type = answer.get('question_type')
                question_data = answer.get('question_data', {})
                answer_data = answer.get('answer_data', {})
                time_taken = answer.get('time_taken')
                max_time = answer.get('max_time')
                
                try:
                    points = self.calculate_points(
                        question_type,
                        question_data,
                        answer_data,
                        time_taken,
                        max_time
                    )
                    total_score += points
                except PointsCalculationError:
                    continue  # Skip invalid answers
            
            leaderboard.append({
                'player_id': player_id,
                'total_score': total_score
            })
        
        # Sort by score descending
        leaderboard.sort(key=lambda x: x['total_score'], reverse=True)
        
        return leaderboard
