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

  function isPhoneValid(value: string) {
    const digits = value.replace(/\D/g, "")
    // Require exactly 10 digits starting with 6–9
    return /^[6-9][0-9]{9}$/.test(digits)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error("Please enter a mobile number.")
      return
    }
    if (!isPhoneValid(phone)) {
      toast.error("Please enter a valid mobile number.")
      return
    }
    const digits = phone.replace(/\D/g, "").slice(0, 10)
    setLoading(true)
    try {
      const result = await updatePhone(digits)
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
            <span>Add mobile number</span>
          </AlertDialogTitle>
          <AlertDialogDescription>  
            Add your mobile number so you can book rides and be reached by other
            users.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="add-mobile-phone">Mobile number</Label>
            <Input
              id="add-mobile-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10)
                setPhone(digitsOnly)
              }}
              className="h-10"
              autoComplete="tel"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter your 10-digit mobile number starting with 6–9. 
              </p>
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
