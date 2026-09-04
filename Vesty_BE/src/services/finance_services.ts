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

    async getAllFinances(
        userId: string,
        page: number = 1,
        limit: number = 100,
        filters: any = {},
        sort: any = {}
    ) {
        const skip = (page - 1) * limit;
        let where: any = { user_id: userId };
        if (filters.search) {
            where.OR = [
                { type: { contains: filters.search, mode: 'insensitive' } },
                { category: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.types && filters.types.length > 0) {
            where.type = { in: filters.types.split(',') };
        }
        if (filters.categories && filters.categories.length > 0) {
            where.category = { in: filters.categories.split(',') };
        }

        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = new Date(filters.startDate);
            if (filters.endDate) where.date.lte = new Date(filters.endDate);
        }

        let orderBy: any = { date: 'desc' };
        if (sort.key && sort.direction) {
            let sortKey = sort.key == 'amount_num' ? 'amount' : sort.key;
            orderBy = { [sortKey]: sort.direction };
        }

        const [data, total] = await Promise.all([
            prisma.finance.findMany({
                where,
                orderBy,
                skip: skip,
                take: limit,
            }),
            prisma.finance.count({ where })
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

    async getUniqueCategories(userId: string) {
        const categories = await prisma.finance.findMany({
            where: { user_id: userId },
            select: { category: true },
            distinct: ['category'],
        });

        return categories.map(c => c.category).filter(Boolean).sort();
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