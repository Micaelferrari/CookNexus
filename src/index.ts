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
        recipes,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: error.message || "Error fetching recipes." });
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

// CRIAR RECEITA
app.post("/recipes", async (req: Request, res: Response): Promise<void> => {
  const { title, description, prep_time, user_id, modo_preparo } = req.body;
  const gerarID = generateId(); // Chamar a função para gerar um ID

  if (!title || !description || !prep_time || !user_id || !modo_preparo) {
    throw new Error("All fields are required");
  }

  try {
    // Verifica se o user_id existe
    const userExists = await connection("users")
      .where("id_user", user_id)
      .first();

    if (!userExists) {
      throw new Error("User not found");
    }

    await connection("recipes").insert({
      id_recipe: gerarID,
      title,
      description,
      prep_time,
      user_id,
      modo_preparo,
    });

    res.status(201).json("Recipe created successfully!");
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
});

// BUSCAR POR RECEITA QUE TENHA UM INGREDIENTE ESPECÍFICO
app.get(
  "/recipes/ingredients/:ingredient",
  async (req: Request, res: Response): Promise<void> => {
    const { ingredient } = req.params;
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

    //console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`); pra teste

    if (typeof ingredient !== "string" || ingredient.trim() === "") {
      throw new Error("Invalid ingredient");
    }

    try {
      const recipes = await connection("recipe_ingredient")
        .join("recipes", "recipe_ingredient.id_recipe", "recipes.id_recipe")
        .join(
          "ingredients",
          "recipe_ingredient.id_ingredient",
          "ingredients.id_ingredient"
        )
        .where("ingredients.name_ingredient", "ILIKE", `%${ingredient}%`)
        .select("recipes.*")
        .limit(limit)
        .offset(offset);

      if (recipes.length === 0) {
        throw new Error("No recipes found with the specified ingredient.");
      }

      res.status(200).json({
        recipes,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Error fetching recipes by ingredient",
      });
    }
  }
);

// buscar receitas de um usuário específico
app.get("/recipes/users/:username", async (req: Request, res: Response) => {
  const { username } = req.params;
  const paginaAtual = Number(req.query.page) || 1; //Exibindo a pagina atual que o padrao eh 1
  const limitarItens = Number(req.query.limit) || 10; //Limitando a quantidade de itens que deve aparecer na tela
  const offset = (paginaAtual - 1) * limitarItens;

  if (!username || typeof username !== "string") {
    throw new Error("Invalid username parameter.");
  }

  try {
    const user = await connection("users").where("name_user", username).first();

    if (!user) {
      throw new Error("User not found");
    }

    const recipes = await connection("recipes")
      .where("user_id", user.id_user)
      .select("recipes.*")
      .limit(limitarItens)
      .offset(offset);

    if (recipes.length === 0) {
      throw new Error("No recipes found for this user.");
    }

    res.status(200).json({
      recipes,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "Error fetching recipes for user" });
  }
});

// ATUALIZAR INGREDIENTE EM UMA RECEITA
app.patch(
  "/recipes/:id_recipe/ingredients/:id_ingredient",
  async (req: Request, res: Response): Promise<void> => {
    const { id_recipe, id_ingredient } = req.params;
    const { quantity } = req.body;

    if (!id_recipe || !id_ingredient) {
      throw new Error("Recipe ID and Ingredient ID are required.");
    }

    try {
      const recipeExists = await connection("recipes")
        .where("id_recipe", id_recipe)
        .first();
      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id_ingredient)
        .first();

      if (!recipeExists) {
        throw new Error("Recipe not found.");
      }

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      // Teste realizado, bloco atualizando a quantidade do ingrediente na receita
      await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .update({ quantity });

      res.status(200).json({ message: "Ingredient updated successfully!" });
    } catch (error: any) {
      res.status(500).json({
        message:
          error.message || "An error occurred while updating the ingredient.",
      });
    }
  }
);

// Atualizar uma receita
app.put("/recipes/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, prep_time, user_id, modo_preparo } = req.body;

  if (!id) {
    res.status(400).json({ message: "Recipe ID is required." });
    return;
  }

  if (!title || !description || !prep_time || !user_id || !modo_preparo) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  try {
    const recipeExists = await connection("recipes")
      .where("id_recipe", id)
      .first();

    if (!recipeExists) {
      throw new Error("Recipe not found.");
    }

    await connection("recipes").where("id_recipe", id).update({
      title,
      description,
      prep_time,
      user_id,
      modo_preparo,
    });

    res.status(200).json({ message: "Recipe updated successfully!" });
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred while updating the recipe.",
      error: error.message,
    });
  }
});

// ENDPOINTS DO USERS

// BUSCAR TODOS OS USUÁRIOS
app.get("/users", async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page) || 1; // Pagina atual
  const limit = Number(req.query.limit) || 10; // Número de itens por pagina
  const offset = (page - 1) * limit; // Calculo do offset

  try {
    const users = await connection("users")
      .select("*") // Seleciona todos os campos da tabela users
      .limit(limit)
      .offset(offset);

    if (users.length === 0) {
      throw new Error("No users found");
    }

    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error fetching users" });
  }
});

// CRIAR UM USUÁRIO
app.post("/users", async (req: Request, res: Response): Promise<void> => {
  const { name_user, sobrenome, age, gender } = req.body;

  const gerarID = generateId();

  if (!name_user || typeof name_user !== "string" || name_user.length > 50) {
    throw new Error("Invalid name_user");
  }

  if (!sobrenome || typeof sobrenome !== "string" || sobrenome.length > 50) {
    throw new Error("Invalid sobrenome");
  }

  if (typeof age !== "number" || age <= 0) {
    throw new Error("Invalid age");
  }

  if (!gender || typeof gender !== "string" || gender.length > 12) {
    throw new Error("Invalid gender");
  }

  try {
    await connection("users").insert({
      id_user: gerarID,
      name_user,
      sobrenome,
      age,
      gender,
    });

    res.status(201).json("User created successfully!");
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "An unexpected error occurred" });
  }
});

// DELETAR UM USUÁRIO
app.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw new Error("User ID is required");
  }

  try {
    const userExists = await connection("users").where("id_user", id).first();

    if (!userExists) {
      throw new Error("User not found");
    }

    await connection("users").where("id_user", id).del();
    res.status(200).json({ message: "User deleted successfully!" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error deleting user" });
  }
});
// ATUALIZAR UM USUÁRIO
app.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name_user, sobrenome, age, gender } = req.body;

  try {
    const userExists = await connection("users").where("id_user", id).first();

    if (!userExists) {
      throw new Error("User not found");
    }

    await connection("users")
      .where("id_user", id)
      .update({ name_user, sobrenome, age, gender });

    res.status(200).json({ message: "User updated successfully!" });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Error updating user" });
  }
});

// ENDPOINTS DOs INGREDIENTES

// BUSCAR TODOS OS INGREDIENTES
app.get("/ingredients", async (req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await connection("ingredients");

    if (ingredients.length === 0) {
      throw new Error("No ingredients found");
    }

    res.status(200).json(ingredients);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "Error fetching ingredients" });
  }
});

// CRIAR INGREDIENTE
app.post("/ingredients", async (req: Request, res: Response): Promise<void> => {
  const { name_ingredient, type_ingredient } = req.body;
  const gerarID = generateId(); // Chamar a função para gerar um ID

  if (!name_ingredient || typeof name_ingredient !== "string") {
    throw new Error("Invalid name_ingredient");
  }

  if (!type_ingredient || typeof type_ingredient !== "string") {
    throw new Error("Invalid type_ingredient");
  }

  try {
    await connection("ingredients").insert({
      id_ingredient: gerarID,
      name_ingredient,
      type_ingredient,
    });

    res.status(201).json("Ingredient created successfully!");
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
