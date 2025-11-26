class CollegeSchema:

    @staticmethod
    def validate_create(data: dict) -> tuple[bool, str | None]:
        code = data.get("code", "").strip()
        name = data.get("name", "").strip()

        if not code:
            return False, "College code is required."
        if not name:
            return False, "College name is required."

        return True, None

