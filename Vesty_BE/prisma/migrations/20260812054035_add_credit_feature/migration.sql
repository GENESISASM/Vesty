-- CreateTable
CREATE TABLE "credits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "creditor_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_payments" (
    "id" TEXT NOT NULL,
    "credit_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_payments" ADD CONSTRAINT "credit_payments_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "credits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
