import prisma from '../config/prisma';

export class DebtService {
    static getService() {
        return new DebtService();
    }

    async createDebt(userId: string, payload: {
        debtor_name: string;
        type: 'money' | 'item';
        notes?: string;
        date: string;
        due_date?: string;
        amount?: number;
        items?: {
            item_name: string;
            quantity: number;
            unit: string;
            category?: string;
            price_per_unit?: number;
            total_price?: number;
        }[];
    }) {
        const debt = await prisma.$transaction(async (tx) => {
            const newDebt = await tx.debt.create({
                data: {
                    user_id: userId,
                    debtor_name: payload.debtor_name,
                    type: payload.type,
                    status: 'unpaid',
                    notes: payload.notes ?? null,
                    date: new Date(payload.date),
                    due_date: payload.due_date ? new Date(payload.due_date) : null,
                },
            });

            if (payload.type == 'money' && payload.amount) {
                await tx.debtMoney.create({
                    data: {
                        debt_id: newDebt.id,
                        amount: payload.amount,
                    },
                });
            }

            if (payload.type == 'item' && payload.items && payload.items.length > 0) {
                for (const item of payload.items) {
                    await tx.debtItem.create({
                        data: {
                            debt_id: newDebt.id,
                            item_name: item.item_name,
                            quantity: item.quantity,
                            unit: item.unit,
                            price_per_unit: item.price_per_unit ?? null,
                            total_price: item.total_price ?? null,
                        },
                    });
                    
                    let stock = await tx.stock.findFirst({
                        where: {
                            user_id: userId,
                            item_name: { equals: item.item_name, mode: 'insensitive' },
                        },
                    });

                    if (!stock) {
                        stock = await tx.stock.create({
                            data: {
                                user_id: userId,
                                item_name: item.item_name,
                                unit: item.unit,
                                category: item.category ?? null,
                                current_stock: 1000,
                            },
                        });
                    }

                    if (stock.current_stock < item.quantity) {
                        throw new Error(`Stok tidak cukup untuk ${item.item_name}. Tersisa: ${stock.current_stock}`);
                    }

                    await tx.stock.update({
                        where: { id: stock.id },
                        data: {
                            current_stock: { decrement: item.quantity }
                        },
                    });

                    await tx.stockHistory.create({
                        data: {
                            stock_id: stock.id,
                            type: 'out',
                            quantity: item.quantity,
                            notes: `Hutang ${payload.debtor_name}`,
                            date: new Date(payload.date),
                            reference_id: newDebt.id
                        },
                    });
                }
            }

            return newDebt;
        });

        return this.getDebtById(userId, debt.id);
    }

    async getAllDebts(userId: string) {
        const debts = await prisma.debt.findMany({
            where: { user_id: userId },
            include: {
                debt_items: true,
                debt_money: true,
                debt_payments: true,
            },
            orderBy: { date: 'desc' },
        });
        const stocks = await prisma.stock.findMany({
            where: { user_id: userId },
            select: { item_name: true, category: true }
        });
        const stockMap = new Map(stocks.map(s => [s.item_name.toLowerCase(), s.category]));
        return debts.map(debt => ({
            ...debt,
            debt_items: debt.debt_items.map(item => ({
                ...item,
                category: stockMap.get(item.item_name.toLowerCase()) ?? null
            }))
        }));
    }

    async getDebtById(userId: string, id: string) {
        const debt = await prisma.debt.findFirst({
            where: { id, user_id: userId },
            include: {
                debt_items: true,
                debt_money: true,
                debt_payments: true,
            },
        });

        if (!debt) {
            const error: any = new Error('Debt not found');
            error.code = '404';
            throw error;
        }

        const itemNames = debt.debt_items.map(i => i.item_name);
        const stocks = await prisma.stock.findMany({
            where: { 
                user_id: userId,
                item_name: { in: itemNames }
            },
            select: { item_name: true, category: true }
        });
        const stockMap = new Map(stocks.map(s => [s.item_name.toLowerCase(), s.category]));

        return {
            ...debt,
            debt_items: debt.debt_items.map(item => ({
                ...item,
                category: stockMap.get(item.item_name.toLowerCase()) ?? null
            }))
        };
    }

    async updateDebtStatus(userId: string, id: string, status: 'unpaid' | 'partial' | 'paid') {
        await this.getDebtById(userId, id);

        return await prisma.debt.update({
            where: { id },
            data: { status },
        });
    }

    async updateDebt(userId: string, id: string, payload: {
        debtor_name: string;
        type: 'money' | 'item';
        notes?: string;
        date: string;
        due_date?: string;
        amount?: number;
        items?: {
            item_name: string;
            quantity: number;
            unit: string;
            category?: string;
            price_per_unit?: number;
            total_price?: number;
        }[];
    }) {
        const existingDebt = await prisma.debt.findFirst({
            where: { id, user_id: userId },
            include: { debt_items: true, debt_money: true }
        });

        if (!existingDebt) {
            const error: any = new Error('Debt not found');
            error.code = '404';
            throw error;
        }

        // if (existingDebt.status != 'unpaid') {
        //     return await prisma.debt.update({
        //         where: { id },
        //         data: {
        //             debtor_name: payload.debtor_name,
        //             notes: payload.notes ?? null,
        //             due_date: payload.due_date ? new Date(payload.due_date) : null,
        //         },
        //     });
        // }

        return await prisma.$transaction(async (tx) => {
            await tx.debt.update({
                where: { id },
                data: {
                    debtor_name: payload.debtor_name,
                    type: payload.type,
                    notes: payload.notes ?? null,
                    date: new Date(payload.date),
                    due_date: payload.due_date ? new Date(payload.due_date) : null,
                },
            });

            if (existingDebt.type == 'money') {
                await tx.debtMoney.deleteMany({ where: { debt_id: id } });
            } else if (existingDebt.type == 'item') {
                for (const oldItem of existingDebt.debt_items) {
                    const stock = await tx.stock.findFirst({
                        where: { user_id: userId, item_name: { equals: oldItem.item_name, mode: 'insensitive' } }
                    });
                    if (stock) {
                        await tx.stock.update({
                            where: { id: stock.id },
                            data: { current_stock: { increment: oldItem.quantity } }
                        });
                    }
                }
                await tx.debtItem.deleteMany({ where: { debt_id: id } });
                await tx.stockHistory.deleteMany({ 
                    where: { reference_id: id, type: 'out' } 
                });
            }

            if (payload.type == 'money' && payload.amount) {
                await tx.debtMoney.create({
                    data: { debt_id: id, amount: payload.amount },
                });
            } else if (payload.type == 'item' && payload.items && payload.items.length > 0) {
                for (const item of payload.items) {
                    await tx.debtItem.create({
                        data: {
                            debt_id: id,
                            item_name: item.item_name,
                            quantity: item.quantity,
                            unit: item.unit,
                            price_per_unit: item.price_per_unit ?? null,
                            total_price: item.total_price ?? null,
                        },
                    });
                    
                    let stock = await tx.stock.findFirst({
                        where: { user_id: userId, item_name: { equals: item.item_name, mode: 'insensitive' } },
                    });

                    if (!stock) {
                        stock = await tx.stock.create({
                            data: {
                                user_id: userId,
                                item_name: item.item_name,
                                unit: item.unit,
                                category: item.category ?? null,
                                current_stock: 1000,
                            },
                        });
                    }

                    if (stock.current_stock < item.quantity) {
                        throw new Error(`Stok tidak cukup untuk ${item.item_name}. Tersisa: ${stock.current_stock}`);
                    }

                    await tx.stock.update({
                        where: { id: stock.id },
                        data: { current_stock: { decrement: item.quantity } },
                    });

                    await tx.stockHistory.create({
                        data: {
                            stock_id: stock.id,
                            type: 'out',
                            quantity: item.quantity,
                            notes: `Hutang ${payload.debtor_name} (Edited)`,
                            date: new Date(payload.date),
                            reference_id: id
                        },
                    });
                }
            }

            const allPayments = await tx.debtPayment.findMany({ where: { debt_id: id } });
            const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
            
            let totalDebt = 0;
            if (payload.type == 'money' && payload.amount) {
                totalDebt = Number(payload.amount);
            } else if (payload.type == 'item' && payload.items) {
                totalDebt = payload.items.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);
            }

            let newStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
            if (totalPaid >= totalDebt && totalDebt > 0) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partial';
            }

            await tx.debt.update({
                where: { id },
                data: { status: newStatus },
            });

            return true;
        });
    }

    async addPayment(userId: string, debtId: string, payload: {
        amount: number;
        payment_type: 'money' | 'item';
        notes?: string;
        date: string;
    }) {
        const debt = await this.getDebtById(userId, debtId);

        return await prisma.$transaction(async (tx) => {
            const newPayment = await tx.debtPayment.create({
                data: {
                    debt_id: debtId,
                    amount: payload.amount,
                    payment_type: payload.payment_type,
                    notes: payload.notes ?? null,
                    date: new Date(payload.date),
                },
            });

            if (payload.payment_type == 'money') {
                await tx.finance.create({
                    data: {
                        user_id: userId,
                        type: 'income',
                        amount: payload.amount,
                        category: 'Debt Payment',
                        description: `Pembayaran hutang dari ${debt.debtor_name}`,
                        date: new Date(payload.date),
                        reference_id: debtId
                    },
                });
            }

            const allPayments = await tx.debtPayment.findMany({
                where: { debt_id: debtId },
            });

            const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

            let totalDebt = 0;
            if (debt.type == 'money' && debt.debt_money) {
                totalDebt = Number(debt.debt_money.amount);
            } else if (debt.type == 'item' && debt.debt_items) {
                totalDebt = debt.debt_items.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);
            }

            let newStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
            if (totalPaid >= totalDebt && totalDebt > 0) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partial';
            }

            await tx.debt.update({
                where: { id: debtId },
                data: { status: newStatus },
            });

            return newPayment;
        })
    }

    async getPayments(userId: string, debtId: string) {
        await this.getDebtById(userId, debtId);

        return await prisma.debtPayment.findMany({
            where: { debt_id: debtId },
            orderBy: { date: 'desc' },
        });
    }

    async deleteDebt(userId: string, id: string) {
        const debt = await prisma.debt.findFirst({
            where: { id, user_id: userId },
            include: { debt_items: true } 
        });

        if (!debt) {
            throw new Error('Debt not found')
        }

        await prisma.$transaction(async (tx) => {
            if (debt.type == 'item') {
                for (const item of debt.debt_items) {
                    const stock = await tx.stock.findFirst({
                        where: { 
                            user_id: userId, 
                            item_name: { equals: item.item_name, mode: 'insensitive' } 
                        }
                    });

                    if (stock) {
                        await tx.stock.update({
                            where: { id: stock.id },
                            data: { current_stock: { increment: item.quantity } }
                        });
                    }
                }
            }

            await tx.finance.deleteMany({
                where: { reference_id: id }
            });
            await tx.stockHistory.deleteMany({
                where: { reference_id: id }
            });

            await tx.debt.delete({ where: { id } });
        });
        
        return true;
    }

    async getDebtSummary(userId: string) {
        const debts = await prisma.debt.findMany({
            where: { user_id: userId },
            include: {
                debt_money: true,
                debt_items: true,
                debt_payments: true,
            },
        });

        let totalUnpaid = 0;
        let totalPartial = 0;
        let totalPaid = 0;

        for (const debt of debts) {
            let amount = 0;
            if (debt.type == 'money' && debt.debt_money) {
                amount = Number(debt.debt_money.amount);
            } else if (debt.type == 'item') {
                amount = debt.debt_items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0);
            }

            if (debt.status == 'unpaid') {
                totalUnpaid += amount;
            } else if (debt.status == 'partial') {
                totalPartial += amount;
            } else if (debt.status == 'paid') {
                totalPaid += amount;
            }
        }

        return {
            totalDebts: debts.length,
            unpaidCount: debts.filter(d => d.status == 'unpaid').length,
            partialCount: debts.filter(d => d.status == 'partial').length,
            paidCount: debts.filter(d => d.status == 'paid').length,
            totalUnpaid,
            totalPartial,
            totalPaid,
        };
    }
}