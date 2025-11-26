from .. import db


class Student(db.Model):

    __tablename__ = "students"

    photo = db.Column(db.String(255), nullable=True)

    id = db.Column(db.String(20), primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    program_id = db.Column(db.Integer, db.ForeignKey("programs.id"), nullable=True)
    year_level = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)

    program = db.relationship("Program", backref="students")

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "program_id": self.program_id,
            "program_name": self.program.name if self.program else "Not Applicable",
            "program_code": self.program.code if self.program else "Not Applicable",
            "year_level": self.year_level,
            "gender": self.gender,
            "photo": self.photo,
        }

    def __repr__(self):
        return f"<Student {self.id}: {self.first_name} {self.last_name}>"