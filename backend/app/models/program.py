"""Program model."""

from .. import db


class Program(db.Model):
    """Program model representing a program within a college."""

    __tablename__ = "programs"

    id = db.Column(db.Integer, primary_key=True)
    college_id = db.Column(db.Integer, db.ForeignKey("colleges.id"), nullable=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)

    # Relationship to College
    college = db.relationship("College", backref="programs")

    def to_dict(self):
        """Convert program to dictionary."""
        return {
            "id": self.id,
            "college_id": self.college_id,
            "college_name": self.college.name if self.college else "Not Applicable",
            "code": self.code,
            "name": self.name,
        }

    def __repr__(self):
        return f"<Program {self.code}: {self.name}>"

