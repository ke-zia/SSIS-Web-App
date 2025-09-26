"""College schema for validation."""


class CollegeSchema:
    """Schema for college validation."""

    @staticmethod
    def validate_create(data: dict) -> tuple[bool, str | None]:
        """
        Validate college creation data.

        Args:
            data: Dictionary containing 'code' and 'name'

        Returns:
            Tuple of (is_valid, error_message)
        """
        code = data.get("code", "").strip()
        name = data.get("name", "").strip()

        if not code:
            return False, "College code is required."
        if not name:
            return False, "College name is required."

        return True, None

