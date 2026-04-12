import prisma from '../config/prisma';

export class StockService {
    static getService() {
        return new StockService();
    }

    async createStock(userId: string, payload: {
        item_name: string;
        category?: string;
        unit: string;
        current_stock?: number;
    }) {
        let stock = await prisma.stock.create({
        data: {
            user_id: userId,
            item_name: payload.item_name,
            category: payload.category ?? null,
            unit: payload.unit,
            current_stock: payload.current_stock ?? 0,
        },
        });
        return stock;
    }

    async getAllStocks(userId: string) {
        let stocks = await prisma.stock.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
        
        return stocks;
    }

    async getStockById(userId: string, id: string) {
        let stock = await prisma.stock.findFirst({ where: { id, user_id: userId } });
        if (!stock) {
            let error: any = new Error('Stock not found');
            error.code = '404';
            throw error;
        }

        return stock;
    }

    async updateStock(userId: string, id: string, payload: {
        item_name?: string;
        category?: string;
        unit?: string;
        current_stock?: number;
    }) {
        await this.getStockById(userId, id);
        let stock = await prisma.stock.update({
            where: { id },
            data: {
                ...(payload.item_name && { item_name: payload.item_name }),
                ...(payload.category != undefined && { category: payload.category }),
                ...(payload.unit && { unit: payload.unit }),
                ...(payload.current_stock != undefined && { current_stock: Number(payload.current_stock) }),
            },
        });

        return stock;
    }

    async deleteStock(userId: string, id: string) {
        await this.getStockById(userId, id);
        await prisma.stockHistory.deleteMany({ where: { stock_id: id } });
        await prisma.stock.delete({ where: { id } });

        return true;
    }

    async stockIn(userId: string, stockId: string, payload: {
        quantity: number;
        notes?: string;
        date: string;
    }) {
        let stock = await this.getStockById(userId, stockId);
        let history = await prisma.stockHistory.create({
            data: {
                stock_id: stockId,
                type: 'in',
                quantity: payload.quantity,
                notes: payload.notes ?? null,
                date: new Date(payload.date),
                },
        });

        await prisma.stock.update({
            where: { id: stockId },
            data: {
                current_stock: stock.current_stock + payload.quantity,
            },
        });

        return history;
    }

    async stockOut(userId: string, stockId: string, payload: {
        quantity: number;
        notes?: string;
        date: string;
    }) {
        let stock = await this.getStockById(userId, stockId);

        if (stock.current_stock < payload.quantity) {
            let error: any = new Error(
                `Insufficient stock. Current stock: ${stock.current_stock} ${stock.unit}`
            );
            error.code = '400';
            throw error;
        }

        let history = await prisma.stockHistory.create({
            data: {
                stock_id: stockId,
                type: 'out',
                quantity: payload.quantity,
                notes: payload.notes ?? null,
                date: new Date(payload.date),
            },
        });

        await prisma.stock.update({
            where: { id: stockId },
            data: {
                current_stock: stock.current_stock - payload.quantity,
            },
        });

        return history;
    }

    async getStockHistory(userId: string, stockId: string) {
        await this.getStockById(userId, stockId);
        let history = await prisma.stockHistory.findMany({
            where: { stock_id: stockId },
            orderBy: { date: 'desc' },
        });

        return history;
    }
}