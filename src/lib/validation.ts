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
  vehicleId: z.string().min(1, "Vehicle is required."),
  fromLocationId: z.string().min(1, "From city is required."),
  toLocationId: z.string().min(1, "To city is required."),
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

export const vehicleCreateSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required.").max(50, "Brand is too long."),
  model: z.string().trim().min(1, "Model is required.").max(50, "Model is too long."),
  plateNumber: z
    .string()
    .trim()
    .min(1, "Plate number is required.")
    .max(20, "Plate number is too long.")
    .transform((v) => v.toUpperCase()),
  color: z.string().trim().max(30, "Color is too long.").optional(),
  seats: z
    .string()
    .min(1, "Seats are required.")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 10, {
      message: "Seats must be between 1 and 10.",
    }),
})

export const rideSearchSchema = z
  .object({
    fromLocationId: z.string().min(1, "From city is required."),
    toLocationId: z.string().min(1, "To city is required."),
    date: z.string().min(1, "Date is required."),
    sort: z.enum(["soonest", "cheapest", "most_seats"]).optional(),
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(50).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.fromLocationId && val.toLocationId && val.fromLocationId === val.toLocationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "From and To city cannot be the same",
        path: ["toLocationId"],
      })
    }
  })

