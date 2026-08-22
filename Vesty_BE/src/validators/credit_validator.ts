import { z } from 'zod';

export const createCreditSchema = z.object({
    body: z.object({
        creditor_name: z.string({
            message: "Nama kreditur wajib diisi dan harus berupa teks"
        }).min(1, "Nama kreditur tidak boleh kosong"),

        amount: z.number({
            message: "Jumlah wajib diisi dan harus berupa angka"
        }).positive("Jumlah tidak boleh minus atau nol"),

        notes: z.string().optional(),

        date: z.string({
            message: "Tanggal wajib diisi"
        }).refine((val) => !isNaN(Date.parse(val)), {
            message: "Format tanggal tidak valid",
        }),

        due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Format tanggal jatuh tempo tidak valid",
        }).optional().nullable(),
    }),
});