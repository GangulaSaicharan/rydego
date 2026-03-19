/*
  Warnings:

  - You are about to drop the column `city` on the `RideStop` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `RideStop` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `RideStop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rideId,locationId]` on the table `RideStop` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `locationId` to the `RideStop` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_passengerId_idx";

-- DropIndex
DROP INDEX "Booking_rideId_idx";

-- DropIndex
DROP INDEX "Booking_rideId_passengerId_status_idx";

-- DropIndex
DROP INDEX "Notification_userId_read_idx";

-- DropIndex
DROP INDEX "Ride_deletedAt_idx";

-- DropIndex
DROP INDEX "Ride_driverId_idx";

-- DropIndex
DROP INDEX "Ride_fromLocationId_departureTime_idx";

-- DropIndex
DROP INDEX "Ride_fromLocationId_idx";

-- DropIndex
DROP INDEX "Ride_toLocationId_departureTime_idx";

-- DropIndex
DROP INDEX "Ride_toLocationId_idx";

-- DropIndex
DROP INDEX "RideStop_rideId_idx";

-- AlterTable
ALTER TABLE "RideStop" DROP COLUMN "city",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Ride_driverId_status_departureTime_idx" ON "Ride"("driverId", "status", "departureTime");

-- CreateIndex
CREATE UNIQUE INDEX "RideStop_rideId_locationId_key" ON "RideStop"("rideId", "locationId");

-- AddForeignKey
ALTER TABLE "RideStop" ADD CONSTRAINT "RideStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
