"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/lib/actions/profile"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Loader2, Mail, User, Phone, FileText, AlertCircle } from "lucide-react"

const BIO_MAX_LENGTH = 500

type EditProfileFormProps = {
  defaultBio: string
  defaultPhone: string
  name: string
  email: string
}

export function EditProfileForm({ defaultBio, defaultPhone, name, email }: EditProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bioLength, setBioLength] = useState(defaultBio.length)
  const [phone, setPhone] = useState(
    defaultPhone ? defaultPhone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10) : "",
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    // Always submit only the 10-digit local phone number (no +91)
    formData.set("phone", phone)
    const result = await updateProfile(formData)

    if (result.success) {
      toast.success("Profile updated")
      router.push("/profile")
      router.refresh()
    } else {
      setError(result.error ?? "Failed to update profile")
      toast.error(result.error ?? "Failed to update profile")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Read-only account fields */}
      <div className="space-y-0 divide-y divide-border/60">
        <div className="flex items-center gap-3 py-3 first:pt-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <Label className="text-xs font-medium text-muted-foreground">Name</Label>
            <p className="text-sm font-medium text-foreground truncate">{name || "—"}</p>
          </div>
          <input type="hidden" name="name" value={name} />
        </div>
        <div className="flex items-center gap-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <Label className="text-xs font-medium text-muted-foreground">Email</Label>
            <p className="text-sm font-medium text-foreground truncate">{email || "—"}</p>
          </div>
          <input type="hidden" name="email" value={email} />
        </div>
      </div>

      {/* Editable fields */}
      <div className="space-y-4 pt-2 border-t border-border/60">
        <p className="text-xs font-medium text-muted-foreground">You can edit</p>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            Phone
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10)
              setPhone(digitsOnly)
            }}
            className="h-10"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio" className="flex items-center gap-2 text-foreground">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Bio
            </Label>
            <span
              className={`text-xs tabular-nums ${bioLength > BIO_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
            >
              {bioLength}/{BIO_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id="bio"
            name="bio"
            placeholder="A short bio about yourself (optional)"
            defaultValue={defaultBio}
            maxLength={BIO_MAX_LENGTH}
            rows={4}
            className="resize-none min-h-[100px]"
            onChange={(e) => setBioLength(e.target.value.length)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
        <Link
          href="/profile"
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium hover:bg-muted hover:text-foreground sm:order-2",
          )}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={loading} className="sm:order-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  )
}
