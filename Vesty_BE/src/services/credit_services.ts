import prisma from '../config/prisma';

export class CreditService {
    static getService() {
        return new CreditService();
    }

    async createCredit(userId: string, payload: { creditor_name: string; notes?: string; date: string; due_date?: string; amount: number; }) {
        return await prisma.credit.create({
            data: {
                user_id: userId,
                creditor_name: payload.creditor_name,
                status: 'unpaid',
                notes: payload.notes ?? null,
                date: new Date(payload.date),
                due_date: payload.due_date ? new Date(payload.due_date) : null,
                amount: payload.amount
            },
        });
    }

    async getAllCredits(userId: string) {
        return await prisma.credit.findMany({
            where: { user_id: userId },
            include: { credit_payments: true },
            orderBy: { date: 'desc' },
        });
    }

    async getCreditById(userId: string, id: string) {
        const credit = await prisma.credit.findFirst({
            where: { id, user_id: userId },
            include: { credit_payments: true },
        });
        if (!credit) {
            const error: any = new Error('Credit not found'); error.code = '404'; throw error;
        }
        return credit;
    }

    async updateCredit(userId: string, id: string, payload: { creditor_name: string; notes?: string; date: string; due_date?: string; amount: number; }) {
        await this.getCreditById(userId, id);

        return await prisma.$transaction(async (tx) => {
            await tx.credit.update({
                where: { id },
                data: {
                    creditor_name: payload.creditor_name,
                    notes: payload.notes ?? null,
                    date: new Date(payload.date),
                    due_date: payload.due_date ? new Date(payload.due_date) : null,
                    amount: payload.amount
                },
            });

            const allPayments = await tx.creditPayment.findMany({ where: { credit_id: id } });
            const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

            let newStatus = 'unpaid';
            if (totalPaid >= payload.amount && payload.amount > 0) newStatus = 'paid';
            else if (totalPaid > 0) newStatus = 'partial';

            await tx.credit.update({ where: { id }, data: { status: newStatus } });
            return true;
        });
    }

    async addPayment(userId: string, creditId: string, payload: { amount: number; notes?: string; date: string; }) {
        const credit = await this.getCreditById(userId, creditId);

        return await prisma.$transaction(async (tx) => {
            const newPayment = await tx.creditPayment.create({
                data: {
                    credit_id: creditId,
                    amount: payload.amount,
                    notes: payload.notes ?? null,
                    date: new Date(payload.date),
                },
            });

            // LOGIKA OTOMATIS: Mencatat cicilan sebagai pengeluaran (Expense)
            await tx.finance.create({
                data: {
                    user_id: userId,
                    type: 'expense',
                    amount: payload.amount,
                    category: 'Credit Payment',
                    description: `Pembayaran cicilan ke ${credit.creditor_name}`,
                    date: new Date(payload.date),
                    reference_id: creditId
                },
            });

            const allPayments = await tx.creditPayment.findMany({ where: { credit_id: creditId } });
            const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

            let newStatus = 'unpaid';
            if (totalPaid >= Number(credit.amount) && Number(credit.amount) > 0) newStatus = 'paid';
            else if (totalPaid > 0) newStatus = 'partial';

            await tx.credit.update({ where: { id: creditId }, data: { status: newStatus } });

            return newPayment;
        });
    }

    async deleteCredit(userId: string, id: string) {
        await this.getCreditById(userId, id);
        await prisma.$transaction(async (tx) => {
            await tx.finance.deleteMany({ where: { reference_id: id } });
            await tx.credit.delete({ where: { id } });
        });
        return true;
    }

    async getSummary(userId: string) {
        const credits = await prisma.credit.findMany({ where: { user_id: userId } });
        let totalUnpaid = 0;
        let totalPartial = 0;
        let totalPaid = 0;

        for (const credit of credits) {
            const amount = Number(credit.amount);
            if (credit.status == 'unpaid') totalUnpaid += amount;
            else if (credit.status == 'partial') totalPartial += amount;
            else if (credit.status == 'paid') totalPaid += amount;
        }

        return {
            totalCredits: credits.length,
            unpaidCount: credits.filter(c => c.status == 'unpaid').length,
            partialCount: credits.filter(c => c.status == 'partial').length,
            paidCount: credits.filter(c => c.status == 'paid').length,
            totalUnpaid,
            totalPartial,
            totalPaid,
        };
    }
}