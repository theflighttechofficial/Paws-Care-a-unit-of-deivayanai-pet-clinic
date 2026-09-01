import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Edit3, Phone, Plus, Trash2, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import AdminSidebar from "../../components/AdminSidebar"
import apiRequest from "../../lib/api"
import EmptyState from "../../components/EmptyState"
import { SERVICE_ICONS, getServiceIcon } from "../../lib/serviceIcons"

const emptyService = { title: "", description: "", duration: "", price: "", icon: "stethoscope", phoneOnly: false }

export default function Services() {
  const { logout } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] = useState(null) // { mode: "add" | "edit", service }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    apiRequest("/services")
      .then((response) => setServices(response.services || []))
      .catch((requestError) => setError(requestError.message || "Unable to load services."))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const saveService = async (form) => {
    if (modal.mode === "add") {
      const response = await apiRequest("/services", { method: "POST", body: JSON.stringify(form) })
      setServices((current) => [...current, response.service])
    } else {
      const response = await apiRequest(`/services/${modal.service.id}`, { method: "PUT", body: JSON.stringify(form) })
      setServices((current) => current.map((service) => (service.id === response.service.id ? response.service : service)))
    }
    setModal(null)
  }

  const removeService = async () => {
    await apiRequest(`/services/${deleteTarget.id}`, { method: "DELETE" })
    setServices((current) => current.filter((service) => service.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#17221e]">
      <AdminSidebar active="services" />

      <main className="lg:ml-64">
        <header className="border-b border-[#e1e6e2] bg-white px-5 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#87928c]">Clinic catalog</p>
              <h1 className="mt-1 text-xl font-semibold">Services</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/admin" className="text-xs font-semibold text-[#285b4c]">
                ← Overview
              </Link>
              <button onClick={logout} className="text-xs font-semibold text-[#52615a]">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4c806c]">Offered to owners at booking</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Services</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#718079]">
                These are the services owners can choose from in Step 2 of the booking flow. Changes here apply immediately.
              </p>
            </div>

            <button
              onClick={() => setModal({ mode: "add", service: emptyService })}
              className="flex items-center gap-2 rounded-full bg-[#173b31] px-5 py-3 text-xs font-semibold text-white"
            >
              <Plus size={14} />
              Add service
            </button>
          </div>

          {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          {loading && (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-48 animate-pulse rounded-[2rem] bg-[#f1f4f1]" />
              ))}
            </div>
          )}

          {!loading && services.length === 0 && (
            <div className="mt-8">
              <EmptyState title="No services yet" description="Add your first service to show it in the booking flow." />
            </div>
          )}

          {!loading && services.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {services.map((service) => {
                const Icon = getServiceIcon(service.icon)
                return (
                  <div key={service.id} className="rounded-[2rem] border border-[#e1e7e2] bg-white p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f0e9] text-[#285b4c]">
                        <Icon size={19} />
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setModal({
                              mode: "edit",
                              service: {
                                id: service.id,
                                title: service.title,
                                description: service.description,
                                duration: service.duration ?? "",
                                price: service.price ?? "",
                                icon: service.icon,
                                phoneOnly: service.phoneOnly,
                              },
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f5f3]"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(service)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-6 font-semibold">{service.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-[#87928c]">{service.description}</p>

                    {service.phoneOnly ? (
                      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold text-[#4c806c]">
                        <Phone size={11} />
                        Phone consultation only
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-3 text-[10px] text-[#718079]">
                        <span>{service.duration ? `${service.duration} min` : "Duration not set"}</span>
                        <span>•</span>
                        <span>{service.price != null ? `₹${service.price}` : "Price not set"}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <ServiceModal
          mode={modal.mode}
          service={modal.service}
          onClose={() => setModal(null)}
          onSave={saveService}
        />
      )}

      {deleteTarget && (
        <DeleteServiceModal
          name={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onDelete={removeService}
        />
      )}
    </div>
  )
}

function ServiceModal({ mode, service, onClose, onSave }) {
  const [form, setForm] = useState(service)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await onSave(form)
    } catch (err) {
      setError(err.message || "Unable to save service.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#10241d]/30 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-7">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">{mode === "add" ? "Add service" : `Edit ${service.title}`}</h2>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <label className="mt-6 block text-xs font-semibold">
          Title
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            required
            className="mt-2 w-full rounded-xl border p-3 text-sm"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold">
          Description
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className="mt-2 min-h-20 w-full rounded-xl border p-3 text-sm"
          />
        </label>

        <label className="mt-4 flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={form.phoneOnly}
            onChange={(event) => update("phoneOnly", event.target.checked)}
          />
          Phone consultation only (no slot/price shown at booking)
        </label>

        {!form.phoneOnly && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Duration (minutes)
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(event) => update("duration", event.target.value)}
                className="mt-2 w-full rounded-xl border p-3 text-sm"
              />
            </label>

            <label className="text-xs font-semibold">
              Price (₹)
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                className="mt-2 w-full rounded-xl border p-3 text-sm"
              />
            </label>
          </div>
        )}

        <label className="mt-4 block text-xs font-semibold">
          Icon
          <select
            value={form.icon}
            onChange={(event) => update("icon", event.target.value)}
            className="mt-2 w-full rounded-xl border p-3 text-sm"
          >
            {Object.keys(SERVICE_ICONS).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>

        <button disabled={saving} className="mt-6 w-full rounded-full bg-[#173b31] py-3 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving…" : mode === "add" ? "Add service" : "Save changes"}
        </button>
      </form>
    </div>
  )
}

function DeleteServiceModal({ name, onClose, onDelete }) {
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  const confirm = async () => {
    setDeleting(true)
    setError("")
    try {
      await onDelete()
    } catch (err) {
      setError(err.message || "Unable to remove service.")
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-7">
        <h2 className="text-xl font-semibold">Remove {name}?</h2>
        <p className="mt-3 text-sm text-[#718079]">
          This will remove {name} from the booking flow. Owners will no longer be able to select it.
        </p>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-7 flex gap-3">
          <button onClick={onClose} disabled={deleting} className="flex-1 rounded-full border py-3 text-xs font-semibold disabled:opacity-50">
            Keep
          </button>
          <button onClick={confirm} disabled={deleting} className="flex-1 rounded-full bg-red-600 py-3 text-xs font-semibold text-white disabled:opacity-50">
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  )
}
