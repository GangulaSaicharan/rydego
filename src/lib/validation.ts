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

export const rideFormSchema = z.object({
  fromCity: z.string().min(1, "From city is required."),
  toCity: z.string().min(1, "To city is required."),
  departureTime: z.string().min(1, "Departure time is required."),
  arrivalTime: z.string().min(1, "Arrival time is required."),
  pricePerSeat: z
    .string()
    .min(1, "Price is required.")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
      message: "Price must be a valid non‑negative number.",
    }),
  seatsTotal: z
    .string()
    .min(1, "Seats are required.")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 10, {
      message: "Seats must be between 1 and 10.",
    }),
  description: z.string().max(1000).optional(),
  fromSlotStart: z.string().optional(),
  fromSlotEnd: z.string().optional(),
})

