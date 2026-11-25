import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import PatientForm from "./components/PatientForm.jsx";
import PatientTable from "./components/PatientTable.jsx";
import SearchFilters from "./components/SearchFilters.jsx";
import { createPatient, deletePatient, dischargePatient, getPatients, updatePatient } from "./services/patientApi.js";

const emptyFilters = { search: "", ward: "", department: "", doctor: "" };

export default function App() {
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [notice, setNotice] = useState(null);
  const [formPatient, setFormPatient] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [busyPatientIds, setBusyPatientIds] = useState(() => new Set());
  const formRequestInProgress = useRef(false);
  const deleteRequestInProgress = useRef(false);
  const dischargeRequestsInProgress = useRef(new Set());

  const hasFilters = useMemo(() => Object.values(filters).some((value) => value.trim()), [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError("");
    const timer = window.setTimeout(async () => {
      try {
        const result = await getPatients(filters, controller.signal);
        setPatients(result);
      } catch (error) {
        if (error.name !== "AbortError") setListError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, filters.search ? 300 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filters, refreshKey]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function changeFilter(key, value) {
    setLoading(true);
    setListError("");
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setLoading(true);
    setListError("");
    setFilters({ ...emptyFilters });
  }

  function retryPatientLoad() {
    setLoading(true);
    setListError("");
    setRefreshKey((value) => value + 1);
  }

  function openAddForm() {
    setFormPatient(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(patient) {
    setFormPatient(patient);
    setFormError("");
    setFormOpen(true);
  }

  async function savePatient(values) {
    if (formRequestInProgress.current) return;
    formRequestInProgress.current = true;
    setFormBusy(true);
    setFormError("");
    try {
      if (formPatient) {
        await updatePatient(formPatient.id, values);
        setNotice({ type: "success", text: "Patient updated successfully." });
      } else {
        await createPatient(values);
        setNotice({ type: "success", text: "Patient added successfully." });
      }
      setFormOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setFormError(error.message);
    } finally {
      formRequestInProgress.current = false;
      setFormBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteRequestInProgress.current) return;
    deleteRequestInProgress.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePatient(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteError("");
      setNotice({ type: "success", text: "Patient deleted successfully." });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      deleteRequestInProgress.current = false;
      setDeleting(false);
    }
  }

  async function markDischarged(patient) {
    if (dischargeRequestsInProgress.current.has(patient.id)) return;
    dischargeRequestsInProgress.current.add(patient.id);
    setBusyPatientIds((current) => new Set(current).add(patient.id));
    try {
      await dischargePatient(patient.id);
      setNotice({ type: "success", text: "Patient marked as discharged." });
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      dischargeRequestsInProgress.current.delete(patient.id);
      setBusyPatientIds((current) => {
        const next = new Set(current);
        next.delete(patient.id);
        return next;
      });
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark" aria-hidden="true">D</div>
          <div>
            <p className="brand-title">DScribe</p>
            <p className="brand-subtitle">Hospital operations</p>
          </div>
        </div>
      </header>

      <main className="page-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Admissions</p>
            <h1>Patient admissions</h1>
            <p className="page-description">Manage patient records, admission details, and discharge status.</p>
          </div>
          <button className="button button--primary add-button" type="button" onClick={openAddForm}>
            <span aria-hidden="true">+</span> Add patient
          </button>
        </section>

        {notice && (
          <div className={`notice notice--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
            <span>{notice.text}</span>
            <button className="notice-close" type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">×</button>
          </div>
        )}

        <section className="records-panel" aria-labelledby="records-title">
          <div className="panel-heading">
            <div>
              <h2 id="records-title">Patient list</h2>
              <p>Search and filter admissions by patient or care team.</p>
            </div>
            {!loading && !listError && <span className="record-count">{patients.length} {patients.length === 1 ? "record" : "records"}</span>}
          </div>

          <SearchFilters
            filters={filters}
            onChange={changeFilter}
            hasFilters={hasFilters}
            onClear={clearFilters}
          />

          {loading ? (
            <div className="state-panel" role="status"><span className="loading-indicator" aria-hidden="true" />Loading patients…</div>
          ) : listError ? (
            <div className="state-panel state-panel--error" role="alert">
              <strong>Unable to load patients</strong>
              <span>{listError}</span>
              <button className="button button--secondary" type="button" onClick={retryPatientLoad}>Try again</button>
            </div>
          ) : patients.length === 0 ? (
            <div className="state-panel empty-state">
              <div className="empty-mark" aria-hidden="true">—</div>
              <strong>{hasFilters ? "No patients match these filters" : "No patients yet"}</strong>
              <span>{hasFilters ? "Try changing your search or filters, or clear them to see all records." : "Add a patient to begin managing admissions."}</span>
              {hasFilters ? (
                <button className="button button--secondary" type="button" onClick={clearFilters}>Clear filters</button>
              ) : (
                <button className="button button--primary" type="button" onClick={openAddForm}>Add patient</button>
              )}
            </div>
          ) : (
            <PatientTable
              patients={patients}
              onEdit={openEditForm}
              onDelete={(patient) => {
                setDeleteError("");
                setDeleteTarget(patient);
              }}
              onDischarge={markDischarged}
              busyPatientIds={busyPatientIds}
            />
          )}
        </section>
        <footer className="page-footer">Patient records are saved to the hospital admissions database.</footer>
      </main>

      {formOpen && (
        <PatientForm
          patient={formPatient}
          onCancel={() => setFormOpen(false)}
          onSubmit={savePatient}
          submitting={formBusy}
          serverError={formError}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          patient={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          deleting={deleting}
          error={deleteError}
        />
      )}
    </div>
  );
}
