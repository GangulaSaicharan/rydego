import { z } from "zod"

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Please enter a mobile number.")
  .transform((raw) => {
    const digits = raw.replace(/[^\d+]/g, "")
    if (!digits.startsWith("+")) {
      return `+${digits}`
    }
    return digits
  })

export const bookingCreateSchema = z.object({
  rideId: z.string().min(1, "Ride is required."),
  seats: z.number().int().min(1, "At least one seat is required").max(10, "Too many seats requested"),
  pickupNote: z.string().max(500).optional(),
  dropNote: z.string().max(500).optional(),
})

