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

  if (
    pageStr !== undefined &&
    (isNaN(Number(pageStr)) || Number(pageStr) < 1)
  ) {
    res.status(400).json({ message: "Page must be a positive number." });
    return;
  }

  if (
    limitStr !== undefined &&
    (isNaN(Number(limitStr)) || Number(limitStr) < 1)
  ) {
    res.status(400).json({ message: "Limit must be a positive number." });
    return;
  }
  
  const page = Number(pageStr) || 1; // Pagina atual sendo 1
  const limit = Number(limitStr) || 10; // Quantidade de itens por página
  const offset = (page - 1) * limit; // Fazendo o cálculo do offset
  
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


// Buscar receitas com titulo especifico
app.get(
  "/recipes/:title",
  async (req: Request, res: Response): Promise<void> => {
    
    const pageStr = req.query.page; 
    const limitStr = req.query.limit; 

    if (pageStr !== undefined && (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
      res.status(400).json({ message: "Page must be a positive number." });
      return;
    }

    if (limitStr !== undefined && (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
      res.status(400).json({ message: "Limit must be a positive number." });
      return;
    }

    const page = Number(pageStr) || 1; // Página atual sendo 1
    const limit = Number(limitStr) || 10; // Quantidade de itens por página
    const offset = (page - 1) * limit; // Fazendo o cálculo do offset

    const { title } = req.params;

    if (!title || title.trim() === "") {
      res.status(400).json({ message: "Title is required." });
      return;
    }

    try {
      const recipes = await connection("recipes")
        .where("title", "ILIKE", `%${title}%`)
        .limit(limit)
        .offset(offset);

      if (recipes.length === 0) {
        res.status(404).json({ message: "No recipes found." });
        return;
      }

      res.status(200).json({
        recipes
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error fetching recipes." });
    }
  }
);

// Rota para excluir receita por ID (completa)
app.delete(
  "/recipes/:id",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      throw new Error("Recipe ID is required");
    }

    try {
      const recipe = await connection("recipes").where("id_recipe", id).first();

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      await connection("recipes").where("id_recipe", id).del();
      res.status(200).json({ message: "Recipe deleted successfully!" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Error deleting recipe" });
      
    }
  }
);

// Iniciar o servidor
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
