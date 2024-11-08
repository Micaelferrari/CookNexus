import knex, { Knex } from "knex";
import express, { json } from "express";
import cors from "cors";
import { Request, Response } from "express";
import dotenv from "dotenv";

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

// BUSCAR TODAS AS RECEITAS

app.get("/recipes", async (req: Request, res: Response): Promise<void> => {
  //os valores vem como string, se converter antes com o number() não funciona
  const pageStr = req.query.page;
  const limitStr = req.query.limit;
  const page = Number(pageStr) || 1; // Pagina atual sendo 1
  const limit = Number(limitStr) || 10; // Quantidade de itens por página
  const offset = (page - 1) * limit; // Fazendo o cálculo do offset

  //console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`); pra teste

  try {
    const recipes = await connection("recipes")
      .select("*")
      .limit(limit)
      .offset(offset);

    if (recipes.length === 0) {
      throw new Error("No recipes found");
    }

    res.status(200).json(recipes);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
