"""Pydantic schemas and allowed patient field values."""

import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, StrictInt, field_validator


Gender = Literal["Male", "Female", "Other"]
Ward = Literal["General", "ICU", "Emergency", "Pediatric", "Maternity"]
Department = Literal[
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "General Medicine",
    "Pediatrics",
    "Gynecology",
]
Doctor = Literal["Dr. Sharma", "Dr. Reddy", "Dr. Kumar", "Dr. Priya"]
PatientStatus = Literal["Admitted", "Discharged"]


class PatientInput(BaseModel):
    """Fields required when creating or replacing a patient's details."""

    model_config = ConfigDict(extra="forbid")

    name: str
    age: StrictInt
    gender: Gender
    ward: Ward
    department: Department
    doctor: Doctor
    admission_date: date

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not re.fullmatch(r"[A-Za-z]+(?: [A-Za-z]+)*", value):
            raise ValueError("Name must contain letters and spaces only")
        return value

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: int) -> int:
        if not 0 <= value <= 120:
            raise ValueError("Age must be between 0 and 120")
        return value

    @field_validator("admission_date")
    @classmethod
    def validate_admission_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Admission date cannot be in the future")
        return value


class PatientCreate(PatientInput):
    """Request body for creating a patient (status is assigned by the API)."""


class PatientUpdate(PatientInput):
    """Request body for replacing editable patient details."""


class PatientResponse(BaseModel):
    """Patient data returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int
    gender: Gender
    ward: Ward
    department: Department
    doctor: Doctor
    admission_date: date
    status: PatientStatus
