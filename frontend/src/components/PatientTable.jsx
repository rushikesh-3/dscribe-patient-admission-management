import StatusBadge from "./StatusBadge.jsx";

function displayDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(year, month - 1, day));
}

export default function PatientTable({ patients, onEdit, onDelete, onDischarge, busyPatientIds }) {
  return (
    <div className="table-scroll" role="region" aria-label="Patient records" tabIndex="0">
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Age</th>
            <th scope="col">Gender</th>
            <th scope="col">Ward</th>
            <th scope="col">Department</th>
            <th scope="col">Doctor</th>
            <th scope="col">Admission date</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => {
            const isBusy = busyPatientIds.has(patient.id);
            return (
              <tr key={patient.id}>
                <th className="patient-name" scope="row">{patient.name}</th>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.ward}</td>
                <td>{patient.department}</td>
                <td>{patient.doctor}</td>
                <td className="date-cell">{displayDate(patient.admission_date)}</td>
                <td><StatusBadge status={patient.status} /></td>
                <td>
                  <div className="row-actions">
                    <button className="text-button" type="button" onClick={() => onEdit(patient)} disabled={isBusy}>Edit</button>
                    {patient.status === "Admitted" ? (
                      <button className="text-button" type="button" onClick={() => onDischarge(patient)} disabled={isBusy}>
                        {isBusy ? "Discharging..." : "Discharge"}
                      </button>
                    ) : <span className="completed-action">Discharged</span>}
                    <button className="text-button text-button--danger" type="button" onClick={() => onDelete(patient)} disabled={isBusy}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
