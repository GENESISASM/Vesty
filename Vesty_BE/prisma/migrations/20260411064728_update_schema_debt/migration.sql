-- DropForeignKey
ALTER TABLE "debt_items" DROP CONSTRAINT "debt_items_debt_id_fkey";

-- DropForeignKey
ALTER TABLE "debt_money" DROP CONSTRAINT "debt_money_debt_id_fkey";

-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_debt_id_fkey";

-- AlterTable
ALTER TABLE "finances" ADD COLUMN     "reference_id" TEXT;

-- AlterTable
ALTER TABLE "stock_histories" ADD COLUMN     "reference_id" TEXT;

-- AddForeignKey
ALTER TABLE "debt_items" ADD CONSTRAINT "debt_items_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_money" ADD CONSTRAINT "debt_money_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
