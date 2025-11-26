class ProgramSchema:

    @staticmethod
    def validate_create(data: dict) -> tuple[bool, str | None]:
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


