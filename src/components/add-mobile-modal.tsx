"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Phone } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
} from "@/components/ui"
import { updatePhone } from "@/lib/actions/profile"


export function AddMobileModal({ hasPhone }: { hasPhone: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (!hasPhone) {
      setOpen(true)
    }
  }, [hasPhone])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error("Please enter a mobile number.")
      return
    }
    setLoading(true)
    try {
      const result = await updatePhone(phone.trim())
      if (result.success) {
        toast.success("Mobile number added")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to add number")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Add mobile number
          </AlertDialogTitle>
          <AlertDialogDescription>
            Add your mobile number so you can book rides, and be reached by other users.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="add-mobile-phone">Mobile number</Label>
            <Input
              id="add-mobile-phone"
              type="tel"
              placeholder="e.g. +1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10"
              autoComplete="tel"
              disabled={loading}
            />
          </div>
          <AlertDialogFooter>
            {/* <AlertDialogCancel type="button" disabled={loading}>
              Maybe later
            </AlertDialogCancel> */}
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add number"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
