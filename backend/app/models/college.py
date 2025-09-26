"""College model."""

from .. import db


class College(db.Model):
    """College model representing a college/department."""

    __tablename__ = "colleges"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        """Convert college to dictionary."""
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
        }

    def __repr__(self):
        return f"<College {self.code}: {self.name}>"

