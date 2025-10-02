"""Program schema for validation."""


class ProgramSchema:
    """Schema for program validation."""

    @staticmethod
    def validate_create(data: dict) -> tuple[bool, str | None]:
        """
        Validate program creation data.

        Args:
            data: Dictionary containing 'college_id', 'code', and 'name'

        Returns:
            Tuple of (is_valid, error_message)
        """
        college_id = data.get("college_id")
        code = data.get("code", "").strip()
        name = data.get("name", "").strip()

        if not college_id:
            return False, "College ID is required."
        if not code:
            return False, "Program code is required."
        if not name:
            return False, "Program name is required."

        return True, None


