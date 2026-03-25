"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Loader2, Car, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  createVehicleAction,
  deleteVehicleAction,
  listMyVehiclesAction,
  updateVehicleAction,
} from "@/lib/actions/vehicle"

const VEHICLES_CACHE_KEY = "my-vehicles-v1"

type Vehicle = {
  id: string
  brand: string
  model: string
  color: string | null
  plateNumber: string
  seats: number
  createdAt: string
}

export function VehiclesManager({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const subtitle = useMemo(() => {
    if (vehicles.length === 0) return "No vehicles yet. Add one to start publishing rides."
    if (vehicles.length === 1) return "1 vehicle"
    return `${vehicles.length} vehicles (max 2)`
  }, [vehicles.length])

  const canAddMore = vehicles.length < 2

  function writeCache(next: Vehicle[]) {
    try {
      sessionStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  async function refreshVehicles() {
    const res = await listMyVehiclesAction()
    if (res.success && res.vehicles) {
      const next = res.vehicles.map((v) => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        color: v.color ?? null,
        plateNumber: v.plateNumber,
        seats: v.seats,
        createdAt: String(v.createdAt),
      }))
      setVehicles(next)
      writeCache(next)
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)

    const form = event.currentTarget
    const formData = new FormData(form)

    try {
      const res = await createVehicleAction(formData)
      if (res.success) {
        toast.success("Vehicle added")
        form.reset()
        setOpen(false)
        await refreshVehicles()
      } else {
        toast.error(res.error ?? "Failed to add vehicle")
      }
    } catch {
      toast.error("Failed to add vehicle")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || editSubmitting) return
    setEditSubmitting(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await updateVehicleAction(editing.id, formData)
      if (res.success) {
        toast.success("Vehicle updated")
        setEditing(null)
        await refreshVehicles()
      } else {
        toast.error(res.error ?? "Failed to update vehicle")
      }
    } catch {
      toast.error("Failed to update vehicle")
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingId || deleteSubmitting) return
    setDeleteSubmitting(true)
    try {
      const res = await deleteVehicleAction(deletingId)
      if (res.success) {
        toast.success("Vehicle deleted")
        setDeletingId(null)
        await refreshVehicles()
      } else {
        toast.error(res.error ?? "Failed to delete vehicle")
      }
    } catch {
      toast.error("Failed to delete vehicle")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-row items-start justify-end mb-3">
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={<Button className="shrink-0" disabled={!canAddMore} />}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add vehicle
          </AlertDialogTrigger>

          <AlertDialogContent className="max-w-lg" size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>Add vehicle</AlertDialogTitle>
            </AlertDialogHeader>

            <form onSubmit={handleCreate} className="space-y-4">
              {!canAddMore && (
                <p className="text-sm text-muted-foreground">
                  You&apos;ve reached the maximum of 2 vehicles.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" placeholder="e.g. Maruti" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" placeholder="e.g. Swift" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Plate number</Label>
                  <Input id="plateNumber" name="plateNumber" placeholder="e.g. TS09AB1234" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color (optional)</Label>
                  <Input id="color" name="color" placeholder="e.g. White" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seats">Seats</Label>
                <Input id="seats" name="seats" type="number" min="1" max="10" defaultValue="4" required />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-3">
        <AlertDialog open={!!editing} onOpenChange={(v) => (v ? null : setEditing(null))}>
          <AlertDialogContent className="max-w-lg" size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit vehicle</AlertDialogTitle>
            </AlertDialogHeader>
            {editing && (
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <Input id="edit-brand" name="brand" defaultValue={editing.brand} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-model">Model</Label>
                    <Input id="edit-model" name="model" defaultValue={editing.model} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-plateNumber">Plate number</Label>
                    <Input
                      id="edit-plateNumber"
                      name="plateNumber"
                      defaultValue={editing.plateNumber}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-color">Color (optional)</Label>
                    <Input id="edit-color" name="color" defaultValue={editing.color ?? ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-seats">Seats</Label>
                  <Input
                    id="edit-seats"
                    name="seats"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={editing.seats}
                    required
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={editSubmitting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction type="submit" disabled={editSubmitting}>
                    {editSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            )}
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deletingId} onOpenChange={(v) => (v ? null : setDeletingId(null))}>
          <AlertDialogContent size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">
              This will remove it from your vehicle list. Existing rides will still keep their selected vehicle.
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
              >
                {deleteSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {vehicles.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
            <p className="font-medium">No vehicles</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a vehicle and then you can select it while publishing a ride.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {v.plateNumber}
                      {v.color ? ` • ${v.color}` : ""} • {v.seats} seats
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(v)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    {/* <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingId(v.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

