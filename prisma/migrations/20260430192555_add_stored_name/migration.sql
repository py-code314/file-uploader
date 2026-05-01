/*
  Warnings:

  - A unique constraint covering the columns `[storedName]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storedName` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_name_key";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "storedName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_storedName_key" ON "File"("storedName");
