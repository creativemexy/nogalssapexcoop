/*
  Warnings:

  - Added the required column `bankAccountName` to the `cooperatives` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cooperatives" ADD COLUMN     "bankAccountName" TEXT NOT NULL;
