import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../ToastContext";
import { GENDER_LABELS, STATUS_LABELS, todayISO } from "../utils";
import Icon from "./Icons";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  course: "",
  cgpa: "",
  status: "ACTIVE",
  enrollmentDate: todayISO(),
};

function fromStudent(s) {
  return {
    name: s.name ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    age: s.age != null ? String(s.age) : "",
    gender: s.gender ?? "",
    course: s.course ?? "",
    cgpa: s.cgpa != null ? String(s.cgpa) : "",
    status: s.status ?? "ACTIVE",
    enrollmentDate: s.enrollmentDate ?? todayISO(),
  };
}

// Same rules as the backend, so people get instant feedback
function validate(v) {
  const errors = {};
  if (!v.name.trim()) errors.name = "Enter the student's name";
  if (!v.email.trim()) errors.email = "Enter an email address";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = "Enter a valid email address";
  if (v.phone.trim() && !/^[0-9+()\- ]{7,15}$/.test(v.phone.trim())) errors.phone = "Phone must be 7-15 digits";
  const age = Number(v.age);
  if (!v.age) errors.age = "Enter the age";
  else if (!Number.isInteger(age) || age < 1 || age > 120) errors.age = "Age must be between 1 and 120";
  if (!v.course.trim()) errors.course = "Enter a course";
  if (v.cgpa !== "" && (Number(v.cgpa) < 0 || Number(v.cgpa) > 10)) errors.cgpa = "CGPA must be between 0 and 10";
  return errors;
}

export default function StudentFormModal({ student, courses, onClose, onSaved }) {
  const isEditing = Boolean(student);
  const toast = useToast();

  const [values, setValues] = useState(() => (student ? fromStudent(student) : EMPTY));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((errs) => ({ ...errs, [field]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      age: Number(values.age),
      gender: values.gender || null,
      course: values.course.trim(),
      cgpa: values.cgpa === "" ? null : Number(values.cgpa),
      status: values.status,
      enrollmentDate: values.enrollmentDate || null,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await api.updateStudent(student.id, payload);
      } else {
        await api.createStudent(payload);
      }
      toast.success(isEditing ? "Changes saved" : "Student added");
      onSaved();
    } catch (error) {
      // show the server's field messages next to the fields when we have them
      if (error.errors && Object.keys(error.errors).length > 0) {
        setErrors(error.errors);
      }
      if (error.status === 409) {
        setErrors((errs) => ({ ...errs, email: error.message }));
      } else {
        setFormError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function field(name, label, input) {
    return (
      <div className={`field ${errors[name] ? "has-error" : ""}`}>
        <label htmlFor={`f-${name}`}>{label}</label>
        {input}
        {errors[name] && <p className="field-error">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id="student-form-title">{isEditing ? "Edit student" : "Add student"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {field("name", "Full name", (
              <input id="f-name" value={values.name} onChange={set("name")} autoFocus maxLength={100} />
            ))}
            {field("email", "Email", (
              <input id="f-email" type="email" value={values.email} onChange={set("email")} maxLength={150} />
            ))}
            {field("phone", "Phone (optional)", (
              <input id="f-phone" type="tel" value={values.phone} onChange={set("phone")} />
            ))}
            {field("age", "Age", (
              <input id="f-age" type="number" min="1" max="120" value={values.age} onChange={set("age")} />
            ))}
            {field("course", "Course", (
              <>
                <input id="f-course" list="course-options" value={values.course} onChange={set("course")} maxLength={100} />
                <datalist id="course-options">
                  {courses.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            ))}
            {field("gender", "Gender (optional)", (
              <select id="f-gender" value={values.gender} onChange={set("gender")}>
                <option value="">Not specified</option>
                {Object.entries(GENDER_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            ))}
            {field("cgpa", "CGPA (0–10, optional)", (
              <input id="f-cgpa" type="number" step="0.1" min="0" max="10" value={values.cgpa} onChange={set("cgpa")} />
            ))}
            {field("status", "Status", (
              <select id="f-status" value={values.status} onChange={set("status")}>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            ))}
            {field("enrollmentDate", "Enrolled on", (
              <input id="f-enrollmentDate" type="date" value={values.enrollmentDate} onChange={set("enrollmentDate")} />
            ))}
          </div>

          {formError && <p className="alert alert-error" role="alert">{formError}</p>}

          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Add student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
