"""Patient CRUD and discharge endpoints."""

from typing import get_args

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient
from app.schemas import (
    Department,
    Doctor,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
    Ward,
)


router = APIRouter(prefix="/api/patients", tags=["Patients"])


def normalize_filter(value: str | None, allowed_values: tuple[str, ...], label: str) -> str | None:
    """Trim a filter, match it case-insensitively, and reject unknown choices."""
    if value is None or not value.strip():
        return None

    normalized = value.strip().casefold()
    for allowed_value in allowed_values:
        if allowed_value.casefold() == normalized:
            return allowed_value

    allowed = ", ".join(allowed_values)
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail=f"Invalid {label}. Allowed values: {allowed}",
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(patient_data: PatientCreate, db: Session = Depends(get_db)) -> Patient:
    """Create a patient with the initial status set to Admitted."""
    patient = Patient(**patient_data.model_dump(), status="Admitted")
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientResponse])
def get_patients(
    search: str | None = Query(
        default=None,
        description="Trimmed, case-insensitive partial patient-name search",
    ),
    ward: str | None = Query(
        default=None,
        description=f"Case-insensitive ward filter. Allowed: {', '.join(get_args(Ward))}",
    ),
    department: str | None = Query(
        default=None,
        description=f"Case-insensitive department filter. Allowed: {', '.join(get_args(Department))}",
    ),
    doctor: str | None = Query(
        default=None,
        description=f"Case-insensitive doctor filter. Allowed: {', '.join(get_args(Doctor))}",
    ),
    db: Session = Depends(get_db),
) -> list[Patient]:
    """Return patients matching all supplied filters, ordered by ID."""
    search = search.strip() if search and search.strip() else None
    ward = normalize_filter(ward, get_args(Ward), "ward")
    department = normalize_filter(department, get_args(Department), "department")
    doctor = normalize_filter(doctor, get_args(Doctor), "doctor")

    statement = select(Patient)
    if search:
        escaped_search = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        statement = statement.where(Patient.name.ilike(f"%{escaped_search}%", escape="\\"))
    if ward:
        statement = statement.where(func.lower(Patient.ward) == ward.casefold())
    if department:
        statement = statement.where(func.lower(Patient.department) == department.casefold())
    if doctor:
        statement = statement.where(func.lower(Patient.doctor) == doctor.casefold())

    statement = statement.order_by(Patient.id)
    return list(db.scalars(statement).all())


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)) -> Patient:
    """Return one patient or a 404 response if the ID is unknown."""
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
) -> Patient:
    """Replace editable patient details without changing admission status."""
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    for field, value in patient_data.model_dump().items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    """Delete a patient and return a short confirmation."""
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return {"detail": "Patient deleted successfully"}


@router.patch("/{patient_id}/discharge", response_model=PatientResponse)
def discharge_patient(patient_id: int, db: Session = Depends(get_db)) -> Patient:
    """Mark a patient as discharged; repeating the request is safe."""
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    patient.status = "Discharged"
    db.commit()
    db.refresh(patient)
    return patient
