import prisma from "../config/prisma";

export class FinanceService {
    static getService() {
        return new FinanceService();
    }

    async createFinance(userId: string, payload: {
        type: 'income' | 'expense';
        amount: number;
        category: string;
        description?: string;
        date: string;
    }) {
        let finance = await prisma.finance.create({
            data: {
                user_id: userId,
                type: payload.type,
                amount: payload.amount,
                category: payload.category,
                description: payload.description,
                date: new Date(payload.date)
            }
        })
        return finance
    }

    async getAllFinances(userId: string, page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            prisma.finance.findMany({
                where: { user_id: userId },
                orderBy: { date: 'desc' },
                skip: skip,
                take: limit,
            }),
            prisma.finance.count({ where: { user_id: userId } })
        ]);
        return {
            data: data,
            meta: {
                total_data: total,
                current_page: page,
                total_pages: Math.ceil(total / limit),
                limit: limit
            }
        };
    }

    async getFinanceById(userId: string, id: string) {
        let finance = await prisma.finance.findFirst({
            where: { id, user_id: userId }
        })

        if (!finance) {
            let error: any = new Error('Finance record not found')
            error.code = '404'
            throw error
        }

        return finance
    }

    async updateFinance(userId: string, id: string, payload: {
        type?: 'income' | 'expense';
        amount?: number;
        category?: string;
        description?: string;
        date?: string;
    }) {
        await this.getFinanceById(userId, id);

        let finance = await prisma.finance.update({
            where: { id },
            data: {
                ...(payload.type && { type: payload.type }),
                ...(payload.amount && { amount: payload.amount }),
                ...(payload.category && { category: payload.category }),
                ...(payload.description != undefined && { description: payload.description }),
                ...(payload.date && { date: new Date(payload.date) }),
            }
        })

        return finance
    }

    async deleteFinance(userId: string, id: string) {
        await this.getFinanceById(userId, id);

        await prisma.finance.delete({
            where: { id },
        });

        return true;
    }

    async getFinanceSummary(userId: string) {
        let finances = await prisma.finance.findMany({
            where: { user_id: userId }
        })

        let totalIncome = finances
            .filter(f => f.type == 'income')
            .reduce((sum, f) => sum + Number(f.amount), 0)

        let totalExpense = finances
            .filter(f => f.type == 'expense')
            .reduce((sum, f) => sum + Number(f.amount), 0);

        let balance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, balance };
    }

    async getAllForDashboard(userId: string) {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        
        twelveMonthsAgo.setMonth(today.getMonth() - 12);
        return await prisma.finance.findMany({
            where: {
                user_id: userId,
                date: {
                    gte: twelveMonthsAgo
                }
            },
            orderBy: { date: 'asc' },
        });
    }
}