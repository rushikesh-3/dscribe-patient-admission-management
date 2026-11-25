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

function FilterSelect({ label, value, options, onChange }) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <label className="filter-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function SearchFilters({ filters, onChange, onClear, hasFilters }) {
  return (
    <section className="filter-panel" aria-label="Search and filter patients">
      <label className="search-field" htmlFor="patient-search">
        <span>Search</span>
        <input
          id="patient-search"
          type="search"
          placeholder="Search by patient name"
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
        />
      </label>
      <FilterSelect label="Ward" value={filters.ward} options={wards} onChange={(value) => onChange("ward", value)} />
      <FilterSelect label="Department" value={filters.department} options={departments} onChange={(value) => onChange("department", value)} />
      <FilterSelect label="Doctor" value={filters.doctor} options={doctors} onChange={(value) => onChange("doctor", value)} />
      {hasFilters && (
        <button className="button button--quiet clear-filters" type="button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </section>
  );
}
