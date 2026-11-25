const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const fieldLabels = {
  name: "Name",
  age: "Age",
  gender: "Gender",
  ward: "Ward",
  department: "Department",
  doctor: "Doctor",
  admission_date: "Admission date",
};

function validationMessage(detail) {
  if (!Array.isArray(detail)) return null;

  const firstError = detail[0];
  const field = firstError?.loc?.at(-1);
  const label = fieldLabels[field];
  const message = (firstError?.msg || "").replace(/^Value error, /, "");

  if (message === "Field required" && label) return `${label} is required.`;
  if (message.includes("letters and spaces only")) return "Name must contain letters and spaces only.";
  if (message.includes("between 0 and 120")) return "Age must be an integer between 0 and 120.";
  if (message.includes("future")) return "Admission date cannot be in the future.";
  if (label && message.startsWith("Input should be")) return `Please choose a valid ${label.toLowerCase()}.`;
  if (label) return `Please check the ${label.toLowerCase()} field.`;
  return "Please check the submitted information.";
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to connect to the server. Please try again.");
  }

  const body = response.status === 204 ? null : await response.json().catch((error) => {
    if (error.name === "AbortError" || options.signal?.aborted) {
      throw new DOMException("The request was cancelled.", "AbortError");
    }
    return null;
  });
  if (options.signal?.aborted) {
    throw new DOMException("The request was cancelled.", "AbortError");
  }
  if (!response.ok) {
    if (response.status === 404) {
      const message = typeof body?.detail === "string" ? body.detail : "This patient could not be found. Refresh and try again.";
      throw new Error(message);
    }
    if (response.status === 422) {
      const detail = body?.detail;
      const message = validationMessage(detail) || (typeof detail === "string" ? detail : "Please check the submitted information.");
      throw new Error(message);
    }
    if (typeof body?.detail === "string" && response.status < 500) {
      throw new Error(body.detail);
    }
    throw new Error("The request could not be completed. Please try again.");
  }
  return body;
}

export function getPatients(filters = {}, signal) {
  const query = new URLSearchParams();
  for (const key of ["search", "ward", "department", "doctor"]) {
    const value = filters[key]?.trim();
    if (value) query.set(key, value);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return request(`/api/patients${suffix}`, { signal });
}

export function createPatient(patient) {
  return request("/api/patients", {
    method: "POST",
    body: JSON.stringify(patient),
  });
}

export function updatePatient(patientId, patient) {
  return request(`/api/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(patient),
  });
}

export function deletePatient(patientId) {
  return request(`/api/patients/${patientId}`, { method: "DELETE" });
}

export function dischargePatient(patientId) {
  return request(`/api/patients/${patientId}/discharge`, { method: "PATCH" });
}
