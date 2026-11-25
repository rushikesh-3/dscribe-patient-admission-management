export default function ConfirmDialog({ patient, onCancel, onConfirm, deleting, error }) {
  return (
    <div className="dialog-backdrop">
      <section className="dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Remove record</p>
            <h2 id="delete-title">Delete patient?</h2>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} disabled={deleting} aria-label="Close confirmation">×</button>
        </div>
        <p id="delete-description">Are you sure you want to delete <strong>{patient.name}</strong>? This action cannot be undone.</p>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button className="button button--secondary" type="button" onClick={onCancel} disabled={deleting}>Cancel</button>
          <button className="button button--danger" type="button" onClick={onConfirm} disabled={deleting}>{deleting ? "Deleting..." : "Delete patient"}</button>
        </div>
      </section>
    </div>
  );
}
