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
    const input = value.replace(/\s+/g, "")
    // Accept common Indian formats:
    //  - 10 digit mobile (e.g. 9876543210)
    //  - 0 followed by 10 digits (e.g. 09876543210)
    //  - +91 followed by 10 digits (e.g. +919876543210)
    if (!/^\+?[0-9]+$/.test(input)) return false
    if (/^[6-9][0-9]{9}$/.test(input)) return true
    if (/^0[6-9][0-9]{9}$/.test(input)) return true
    if (/^\+91[6-9][0-9]{9}$/.test(input)) return true
    return false
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
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10"
              autoComplete="tel"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Use a 10-digit mobile number starting with 6–9. You can include{" "}
              <span className="font-medium">+91</span> or a leading 0.
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
