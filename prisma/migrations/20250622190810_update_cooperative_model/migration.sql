/*
  Warnings:

  - Added the required column `bankAccountNumber` to the `cooperatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankName` to the `cooperatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `cooperatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lga` to the `cooperatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `cooperatives` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cooperatives" ADD COLUMN     "bankAccountNumber" TEXT NOT NULL,
ADD COLUMN     "bankName" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "lga" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;
