from datetime import datetime
import secrets

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Float,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _new_public_case_id():
    return "FH-{:04d}".format(secrets.randbelow(9999) + 1)


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    public_case_id = Column(
        String(7),
        unique=True,
        nullable=False,
        index=True,
        default=_new_public_case_id,
    )
    name = Column(String(200), nullable=False)
    age = Column(Integer)
    gender = Column(String(50))
    description = Column(Text)
    last_seen_location = Column(String(300))
    clothing = Column(Text)
    identifying_marks = Column(Text)
    status = Column(String(50), default="SEARCHING")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    matches = relationship("Match", back_populates="case")


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    age = Column(Integer)
    gender = Column(String(50))
    physical_description = Column(Text)

    status = Column(String(50), default="UNKNOWN")

    created_at = Column(DateTime, default=datetime.utcnow)


class SourceRecord(Base):
    __tablename__ = "source_records"

    id = Column(Integer, primary_key=True, index=True)

    person_id = Column(
        Integer,
        ForeignKey("persons.id")
    )

    organization = Column(String(200), nullable=False)
    source_type = Column(String(100), nullable=False)

    raw_name = Column(String(200))
    raw_age = Column(Integer)
    raw_description = Column(Text)

    location = Column(String(300))
    recorded_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)

    person_id = Column(
        Integer,
        ForeignKey("persons.id")
    )

    evidence_type = Column(String(100), nullable=False)
    value = Column(Text, nullable=False)

    source = Column(String(200))
    reliability = Column(Float, default=0.5)
    freshness = Column(Float, default=1.0)

    created_at = Column(DateTime, default=datetime.utcnow)


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(
        Integer,
        ForeignKey("cases.id"),
        nullable=False
    )

    person_id = Column(
        Integer,
        ForeignKey("persons.id"),
        nullable=False
    )

    score = Column(Float, default=0.0)

    status = Column(
        String(50),
        default="POTENTIAL_MATCH"
    )

    explanation = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="matches")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)

    person_id = Column(
        Integer,
        ForeignKey("persons.id"),
        nullable=False
    )

    event_type = Column(String(100), nullable=False)
    location = Column(String(300))
    description = Column(Text)
    event_time = Column(DateTime)
    source = Column(String(200))

    created_at = Column(DateTime, default=datetime.utcnow)
