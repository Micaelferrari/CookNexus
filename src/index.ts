import knex, { Knex } from "knex";
import express, { json } from "express";
import cors from "cors";
import { Request, Response } from "express";
import dotenv from 'dotenv';

dotenv.config();


// servidor
const app = express();
app.use(express.json());
app.use(cors());

const connection = knex({
    client: "pg",
    connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
});

// Testando a conexão
connection
    .raw("SELECT 1")
    .then(() => {
        console.log("Conectado ao PostgreSQL com sucesso!");
    })
    .catch((err: any) => {
        console.error("Erro ao conectar ao PostgreSQL:", err);
    });




// Iniciar o servidor
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});