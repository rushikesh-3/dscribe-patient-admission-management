import { useRef, useState } from "react";

const genders = ["Male", "Female", "Other"];
const wards = ["General", "ICU", "Emergency", "Pediatric", "Maternity"];
const departments = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "General Medicine",
  "Pediatrics",
  "Gynecology",
];
const doctors = ["Dr. Sharma", "Dr. Reddy", "Dr. Kumar", "Dr. Priya"];

function localDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formValues(patient) {
  return {
    name: patient?.name || "",
    age: patient ? String(patient.age) : "",
    gender: patient?.gender || "",
    ward: patient?.ward || "",
    department: patient?.department || "",
    doctor: patient?.doctor || "",
    admission_date: patient?.admission_date || "",
  };
}

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Name is required.";
  else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) errors.name = "Name must contain letters and spaces only.";

  if (!values.age.trim()) errors.age = "Age is required.";
  else if (!/^\d+$/.test(values.age) || Number(values.age) > 120) errors.age = "Age must be an integer between 0 and 120.";

  for (const field of ["gender", "ward", "department", "doctor"]) {
    if (!values[field]) errors[field] = `${field[0].toUpperCase()}${field.slice(1)} is required.`;
  }

  if (!values.admission_date) errors.admission_date = "Admission date is required.";
  else if (values.admission_date > localDateString()) errors.admission_date = "Admission date cannot be in the future.";
  return errors;
}

function FormField({ id, label, error, children }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}<span className="required-mark" aria-hidden="true"> *</span></label>
      {children}
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function SelectField({ id, label, value, options, error, onChange }) {
  return (
    <FormField id={id} label={label} error={error}>
      <select id={id} name={id} value={value} required onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </FormField>
  );
}

export default function PatientForm({ patient, onCancel, onSubmit, submitting, serverError }) {
  const [values, setValues] = useState(() => formValues(patient));
  const [errors, setErrors] = useState({});
  const submitInProgress = useRef(false);
  const isEditing = Boolean(patient);

  function changeField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitInProgress.current || submitting) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    submitInProgress.current = true;
    try {
      await onSubmit({
        name: values.name.trim(),
        age: Number(values.age),
        gender: values.gender,
        ward: values.ward,
        department: values.department,
        doctor: values.doctor,
        admission_date: values.admission_date,
      });
    } finally {
      submitInProgress.current = false;
    }
  }

  return (
    <div className="dialog-backdrop">
      <section className="dialog form-dialog" role="dialog" aria-modal="true" aria-labelledby="patient-form-title">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Patient record</p>
            <h2 id="patient-form-title">{isEditing ? "Edit patient" : "Add patient"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} disabled={submitting} aria-label="Close form">×</button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <FormField id="name" label="Name" error={errors.name}>
              <input id="name" name="name" type="text" autoComplete="name" required value={values.name} onChange={changeField} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
            </FormField>
            <FormField id="age" label="Age" error={errors.age}>
              <input id="age" name="age" type="number" min="0" max="120" step="1" inputMode="numeric" required value={values.age} onChange={changeField} aria-invalid={Boolean(errors.age)} aria-describedby={errors.age ? "age-error" : undefined} />
            </FormField>
            <SelectField id="gender" label="Gender" value={values.gender} options={genders} error={errors.gender} onChange={changeField} />
            <SelectField id="ward" label="Ward" value={values.ward} options={wards} error={errors.ward} onChange={changeField} />
            <SelectField id="department" label="Department" value={values.department} options={departments} error={errors.department} onChange={changeField} />
            <SelectField id="doctor" label="Doctor" value={values.doctor} options={doctors} error={errors.doctor} onChange={changeField} />
            <FormField id="admission_date" label="Admission date" error={errors.admission_date}>
              <input id="admission_date" name="admission_date" type="date" max={localDateString()} required value={values.admission_date} onChange={changeField} aria-invalid={Boolean(errors.admission_date)} aria-describedby={errors.admission_date ? "admission_date-error" : undefined} />
            </FormField>
          </div>

          {serverError && <p className="inline-error" role="alert">{serverError}</p>}
          <div className="dialog-actions">
            <button className="button button--secondary" type="button" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Save changes" : "Add patient"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
