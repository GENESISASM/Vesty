import { z } from 'zod';

export const createFinanceSchema = z.object({
    body: z.object({
        type: z.enum(['income', 'expense'], { 
            message: "Tipe harus berupa 'income' atau 'expense'" 
        }),
        amount: z.number({
            message: "Jumlah wajib diisi dan harus berupa angka"
        }).positive("Jumlah tidak boleh minus atau nol"),
        category: z.string({
            message: "Kategori wajib diisi"
        }).min(1, "Kategori tidak boleh kosong"),
        description: z.string().optional().nullable(),
        date: z.string({
            message: "Tanggal wajib diisi"
        }).refine((val) => !isNaN(Date.parse(val)), {
            message: "Format tanggal tidak valid",
        }),
    }),
});