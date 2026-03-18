/*
  Warnings:

  - You are about to drop the column `totalRides` on the `DriverProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DriverProfile" DROP COLUMN "totalRides";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRides" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Booking_passengerId_status_idx" ON "Booking"("passengerId", "status");

-- CreateIndex
CREATE INDEX "Booking_rideId_status_idx" ON "Booking"("rideId", "status");

-- CreateIndex
CREATE INDEX "Booking_rideId_passengerId_status_idx" ON "Booking"("rideId", "passengerId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Ride_driverId_idx" ON "Ride"("driverId");

-- CreateIndex
CREATE INDEX "Ride_status_departureTime_idx" ON "Ride"("status", "departureTime");

-- CreateIndex
CREATE INDEX "Ride_fromLocationId_toLocationId_departureTime_idx" ON "Ride"("fromLocationId", "toLocationId", "departureTime");

-- CreateIndex
CREATE INDEX "Ride_deletedAt_idx" ON "Ride"("deletedAt");
