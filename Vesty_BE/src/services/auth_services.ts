import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import { signToken } from '../utils/jwt';

export class AuthService {
    static getService() {
        return new AuthService();
    }

    async register(name: string, email: string, password: string) {
        const existingUser = await prisma.user.findUnique({ 
            where: { email },
        });

        if (existingUser) {
            const error: any = new Error('Email already registered');
            error.code = '400';
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                created_at: true
            }
        })
        const token = signToken({ id: user.id, email: user.email });
        return { user, token };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user) {
            const error: any = new Error('Invalid credentials');
            error.code = '401';
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
        const error: any = new Error('Invalid email or password');
        error.code = '401';
        throw error;
        }

        const token = signToken({ id: user.id, email: user.email });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            },
            token
        }
    }
}