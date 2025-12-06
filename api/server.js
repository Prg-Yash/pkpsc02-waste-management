import express from 'express';
import { PrismaClient } from './generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await prisma.user.create({
            data: { name, email }
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));