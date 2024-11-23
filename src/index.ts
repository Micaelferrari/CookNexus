import { Recipe } from "./models/RecipeType";
import knex, { Knex } from "knex";
import express, { json } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { generateId } from "./services/Generated";
import dotenv from "dotenv";
import { Authenticator, AuthenticationData } from "./services/Authenticator";
import bcrypt from "bcryptjs";
import { User } from "./models/UserType";

const authenticator = new Authenticator();

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
  try {
    const pageStr = req.query.page as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const sort = req.query.sort as string | undefined;
    const sortBy = (req.query.sortBy as string | undefined) || "title";

    const validarSortBy = ["title", "description", "prep_time"];

    // Validação de ordenação
    if (sort !== undefined && sort !== "asc" && sort !== "desc") {
      throw new Error("Sort value must be 'asc' or 'desc'.");
    }

    if (!validarSortBy.includes(sortBy)) {
      throw new Error(
        `Invalid column for sortBy. Value must be one of: ${validarSortBy.join(
          ", "
        )}.`
      );
    }

    // Validação de paginação
    if (
      pageStr !== undefined &&
      (isNaN(Number(pageStr)) || Number(pageStr) < 1)
    ) {
      throw new Error("Page must be a positive number.");
    }

    if (
      limitStr !== undefined &&
      (isNaN(Number(limitStr)) || Number(limitStr) < 1)
    ) {
      throw new Error("Limit must be a positive number.");
    }

    const page = Number(pageStr) || 1;
    const limit = Number(limitStr) || 10;
    const offset = (page - 1) * limit;

    const recipes = await connection("recipes")
      .select("*")
      .orderBy(sortBy, sort || "asc")
      .limit(limit)
      .offset(offset);

    if (recipes.length === 0) {
      throw new Error("No recipes found.");
    }

    res.status(200).json({ recipes });
  } catch (error: any) {
    if (error.message === "No recipes found.") {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(400)
        .json({ message: error.message || "An unexpected error occurred." });
    }
  }
});

// BUSCAR RECEITAS COM TÍTULO ESPECÍFICO
app.get(
  "/recipes/:title",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const pageStr = req.query.page as string | undefined;
      const limitStr = req.query.limit as string | undefined;
      const sort = req.query.sort as string | undefined;
      const sortBy = (req.query.sortBy as string | undefined) || "title";

      const validarSortBy = ["title", "description", "prep_time"];

      if (sort !== undefined && sort !== "asc" && sort !== "desc") {
        throw new Error("Sort value must be 'asc' or 'desc'.");
      }

      if (!validarSortBy.includes(sortBy)) {
        throw new Error(
          `Invalid column for sortBy. Value must be one of: ${validarSortBy.join(
            ", "
          )}.`
        );
      }

      if (
        pageStr !== undefined &&
        (isNaN(Number(pageStr)) || Number(pageStr) < 1)
      ) {
        throw new Error("Page must be a positive number.");
      }

      if (
        limitStr !== undefined &&
        (isNaN(Number(limitStr)) || Number(limitStr) < 1)
      ) {
        throw new Error("Limit must be a positive number.");
      }

      const page = Number(pageStr) || 1;
      const limit = Number(limitStr) || 10;
      const offset = (page - 1) * limit;

      const { title } = req.params;
      if (!title || title.trim() === "") {
        throw new Error("Title is required.");
      }

      const recipes = await connection("recipes")
        .where("title", "ILIKE", `%${title.trim()}%`)
        .orderBy(sortBy, sort || "asc")
        .limit(limit)
        .offset(offset);

      if (recipes.length === 0) {
        throw new Error("No recipes found.");
      }

      res.status(200).json({ recipes });
    } catch (error: any) {
      if (error.message === "No recipes found.") {
        res.status(404).json({ message: error.message });
      } else {
        res
          .status(400)
          .json({ message: error.message || "An unexpected error occurred." });
      }
    }
  }
);

// DELETAR RECEITA
app.delete(
  "/recipes/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const token = req.headers.authorization;
      if (!token) {
        throw new Error("Authorization token is required.");
      }

      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (!tokenData || !tokenData.id) {
        throw new Error("Invalid or missing token.");
      }

      const userId = tokenData.id;

      // Verificar se o ID da receita foi fornecido
      if (!id || typeof id !== "string" || id.trim() === "") {
        throw new Error("Recipe ID is required and must be a valid string.");
      }

      // Verificar se a receita existe
      const recipe = await connection("recipes")
        .where("id_recipe", id.trim())
        .first();

      if (!recipe) {
        throw new Error("Recipe not found.");
      }

      // Verificar se o usuário é o dono da receita
      if (recipe.user_id !== userId) {
        throw new Error("You are not authorized to delete this recipe.");
      }

      // Excluir a receita
      await connection("recipes").where("id_recipe", id.trim()).del();

      res.status(200).json({ message: "Recipe deleted successfully!" });
    } catch (error: any) {
      if (error.message === "Recipe not found.") {
        res.status(404).json({ message: error.message });
      } else if (
        error.message === "Recipe ID is required and must be a valid string."
      ) {
        res.status(400).json({ message: error.message });
      } else if (
        error.message === "You are not authorized to delete this recipe."
      ) {
        res.status(403).json({ message: error.message });
      } else if (error.message === "Authorization token is required.") {
        res.status(401).json({ message: error.message });
      } else {
        res
          .status(500)
          .json({ message: error.message || "Error deleting recipe." });
      }
    }
  }
);

// CRIAR RECEITA
app.post("/recipes", async (req: Request, res: Response): Promise<void> => {
  const { title, description, prep_time, user_id, modo_preparo } = req.body;

  try {
    if (
      !title ||
      typeof title !== "string" ||
      title.trim().length === 0 ||
      title.length > 40
    ) {
      throw new Error(
        "Invalid title. Title must be a non-empty string with a maximum of 40 characters."
      );
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim().length === 0
    ) {
      throw new Error(
        "Invalid description. Description must be a non-empty string."
      );
    }

    if (
      !prep_time ||
      typeof prep_time !== "string" ||
      prep_time.trim().length === 0
    ) {
      throw new Error(
        "Invalid prep_time. Prep_time must be a non-empty string."
      );
    }

    if (
      !user_id ||
      typeof user_id !== "string" ||
      user_id.trim().length === 0
    ) {
      throw new Error("Invalid user_id. User_id must be a valid string.");
    }

    if (
      !modo_preparo ||
      typeof modo_preparo !== "string" ||
      modo_preparo.trim().length === 0
    ) {
      throw new Error(
        "Invalid modo_preparo. Modo_preparo must be a non-empty string."
      );
    }

    // usuário existe ?
    const userExists = await connection("users")
      .where("id_user", user_id)
      .first();
    if (!userExists) {
      throw new Error("User not found.");
    }

    const newRecipe: Recipe = {
      id_recipe: generateId(),
      title,
      description,
      prep_time,
      user_id,
      modo_preparo,
    };

    await connection("recipes").insert(newRecipe);

    res.status(201).json({ message: "Recipe created successfully!" });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: error.message || "An unexpected error occurred." });
  }
});

// BUSCAR POR RECEITA QUE TENHA UM INGREDIENTE ESPECÍFICO
app.get(
  "/recipes/ingredients/:ingredient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { ingredient } = req.params;
      const pageStr = req.query.page;
      const limitStr = req.query.limit;

      if (
        pageStr !== undefined &&
        (isNaN(Number(pageStr)) || Number(pageStr) < 1)
      ) {
        throw new Error("Page must be a positive number.");
      }

      if (
        limitStr !== undefined &&
        (isNaN(Number(limitStr)) || Number(limitStr) < 1)
      ) {
        throw new Error("Limit must be a positive number.");
      }

      const page = Number(pageStr) || 1; // Página atual sendo 1
      const limit = Number(limitStr) || 10; // Quantidade de itens por página
      const offset = (page - 1) * limit; // Cálculo do offset

      if (typeof ingredient !== "string" || ingredient.trim() === "") {
        throw new Error("Invalid ingredient.");
      }

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
      if (
        error.message === "Page must be a positive number." ||
        error.message === "Limit must be a positive number."
      ) {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Invalid ingredient.") {
        res.status(400).json({ message: error.message });
      } else if (
        error.message === "No recipes found with the specified ingredient."
      ) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({
          message: error.message || "Error fetching recipes by ingredient",
        });
      }
    }
  }
);

//BUSCAR RECEITA DE UM USUÁRIO ESPECÍFICO
app.get("/recipes/users/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const paginaAtual = Number(req.query.page) || 1; // Página atual com valor padrão 1
    const limitarItens = Number(req.query.limit) || 10; // Limitar a quantidade de itens por página
    const offset = (paginaAtual - 1) * limitarItens; // Cálculo do offset

    if (!username || typeof username !== "string") {
      throw new Error("Invalid username parameter.");
    }

    const user = await connection("users").where("name_user", username).first();

    if (!user) {
      throw new Error("User not found.");
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
    if (error.message === "Invalid username parameter.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No recipes found for this user.") {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: error.message || "Error fetching recipes for user" });
    }
  }
});

// ATUALIZAR INGREDIENTE EM UMA RECEITA
app.patch(
  "/recipes/:id_recipe/ingredients/:id_ingredient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id_recipe, id_ingredient } = req.params;
      const { quantity } = req.body;

      if (!quantity || typeof quantity !== "number" || quantity <= 0) {
        throw new Error("Invalid quantity. It must be a positive number.");
      }

      // Recuperar o token do cabeçalho de autorização
      const token = req.headers.authorization;
      if (!token) {
        throw new Error("Authorization token is required.");
      }

      // Decodificar o token para obter o `id_user`
      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (!tokenData || !tokenData.id) {
        throw new Error("Invalid or missing token.");
      }

      const userId = tokenData.id;

      // Verificar se a receita existe
      const recipe = await connection("recipes")
        .where("id_recipe", id_recipe)
        .first();

      if (!recipe) {
        throw new Error("Recipe not found.");
      }

      // Verificar se o usuário é o dono da receita
      if (recipe.user_id !== userId) {
        throw new Error("You are not authorized to update this recipe.");
      }

      // Verificar se o ingrediente existe
      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id_ingredient)
        .first();

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      // Verificar se o ingrediente já está associado à receita
      const recipeIngredientExists = await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .first();

      if (recipeIngredientExists) {
        // Atualizar a quantidade do ingrediente
        await connection("recipe_ingredient")
          .where({ id_recipe, id_ingredient })
          .update({ quantity });
      } else {
        // Inserir o ingrediente na receita
        await connection("recipe_ingredient").insert({
          id_recipe,
          id_ingredient,
          quantity,
        });
      }

      res.status(200).json({
        message: "Ingredient successfully added or updated in the recipe!",
      });
    } catch (error: any) {
      if (error.message === "Authorization token is required.") {
        res.status(401).json({ message: error.message });
      } else if (error.message === "Invalid or missing token.") {
        res.status(403).json({ message: error.message });
      } else if (error.message === "Recipe not found.") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else if (
        error.message === "You are not authorized to update this recipe."
      ) {
        res.status(403).json({ message: error.message });
      } else if (
        error.message === "Invalid quantity. It must be a positive number."
      ) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({
          message:
            error.message ||
            "An error occurred while adding or updating the ingredient.",
        });
      }
    }
  }
);


//ATUALIZAR RECEITA
app.put("/recipes/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, prep_time, user_id, modo_preparo } = req.body;

    if (!id) {
      throw new Error("Recipe ID is required.");
    }

    if (!title || !description || !prep_time || !user_id || !modo_preparo) {
      throw new Error("All fields are required.");
    }

    const token = req.headers.authorization;
    if (!token) {
      throw new Error("Authorization token is required.");
    }

    const authenticator = new Authenticator();
    const tokenData = authenticator.getTokenData(token);

    if (!tokenData || !tokenData.id) {
      throw new Error("Invalid or missing token.");
    }

    const userId = tokenData.id;

    const recipe = await connection("recipes").where("id_recipe", id.trim()).first();
    if (!recipe) {
      throw new Error("Recipe not found.");
    }

    if (recipe.user_id !== userId) {
      throw new Error("You are not authorized to update this recipe.");
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
    if (error.message === "Authorization token is required.") {
      res.status(401).json({ message: error.message });
    } else if (error.message === "Invalid or missing token.") {
      res.status(403).json({ message: error.message });
    } else if (error.message === "Recipe ID is required.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Recipe not found.") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "You are not authorized to update this recipe.") {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({
        message: error.message || "An error occurred while updating the recipe.",
      });
    }
  }
});


//DELETAR INGREDIENTE DE UMA RECEITA
app.delete(
  "/recipes/:id_recipe/ingredients/:id_ingredient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id_recipe, id_ingredient } = req.params;

      // Recuperar o token do cabeçalho de autorização
      const token = req.headers.authorization;
      if (!token) {
        throw new Error("Authorization token is required.");
      }

      // Decodificar o token para obter o id_user
      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (!tokenData || !tokenData.id) {
        throw new Error("Invalid or missing token.");
      }

      const userId = tokenData.id;

      // Validar os IDs da receita e do ingrediente
      if (!id_recipe || !id_ingredient) {
        throw new Error("Recipe ID and Ingredient ID are required.");
      }

      // Verificar se a receita existe e pertence ao usuário autenticado
      const recipe = await connection("recipes")
        .where("id_recipe", id_recipe)
        .first();

      if (!recipe) {
        throw new Error("Recipe not found.");
      }

      if (recipe.user_id !== userId) {
        throw new Error(
          "You are not authorized to remove ingredients from this recipe."
        );
      }

      // Verificar se o ingrediente existe
      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id_ingredient)
        .first();

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      // Verificar se o ingrediente está associado à receita
      const recipeIngredientExists = await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .first();

      if (!recipeIngredientExists) {
        throw new Error("Ingredient is not associated with this recipe.");
      }

      // Remover o ingrediente da receita
      await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .del();

      res
        .status(200)
        .json({ message: "Ingredient removed from recipe successfully!" });
    } catch (error: any) {
      if (error.message === "Authorization token is required.") {
        res.status(401).json({ message: error.message });
      } else if (error.message === "Invalid or missing token.") {
        res.status(403).json({ message: error.message });
      } else if (
        error.message === "Recipe ID and Ingredient ID are required."
      ) {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Recipe not found.") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else if (
        error.message === "Ingredient is not associated with this recipe."
      ) {
        res.status(404).json({ message: error.message });
      } else if (
        error.message ===
        "You are not authorized to remove ingredients from this recipe."
      ) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({
          message:
            error.message ||
            "An error occurred while removing the ingredient from the recipe.",
        });
      }
    }
  }
);

// ENDPOINTS DO USERS

// BUSCAR TODOS OS USUÁRIOS
app.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sort = req.query.sort as string | undefined;
    const sortBy =
      (req.query.sortBy as string | undefined)?.trim() || "name_user";

    if (isNaN(page) || page < 1) {
      throw new Error("Page must be a positive number.");
    }

    if (isNaN(limit) || limit < 1) {
      throw new Error("Limit must be a positive number.");
    }

    if (sort && sort !== "asc" && sort !== "desc") {
      throw new Error("Sort value must be 'asc' or 'desc'.");
    }

    const validarSortBy = ["name_user", "surname", "age"];
    if (!validarSortBy.includes(sortBy)) {
      throw new Error(
        `Invalid column for sortBy. Value must be one of: ${validarSortBy.join(
          ", "
        )}.`
      );
    }

    const users = await connection("users")
      .select("*")
      .orderBy(sortBy, sort || "asc")
      .limit(limit)
      .offset(offset);

    if (users.length === 0) {
      throw new Error("No users found.");
    }

    res.status(200).json(users);
  } catch (error: any) {
    if (error.message === "No users found.") {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(400)
        .json({ message: error.message || "Error fetching users." });
    }
  }
});

// CRIAR UM USUÁRIO
app.post("/users", async (req: Request, res: Response): Promise<void> => {
  const { name_user, surname, age, gender, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id_user: generateId(),
      name_user,
      surname,
      age,
      gender,
      email,
      password: hashedPassword,
    };

    const existUser = await connection("users")
      .where("email", newUser.email)
      .first();

    if (existUser) {
      throw new Error("User Alredy exist!");
    }

    if (!newUser.name_user || newUser.name_user.length > 50) {
      throw new Error("Invalid name_user");
    }

    if (!newUser.surname || newUser.surname.length > 50) {
      throw new Error("Invalid surname");
    }

    if (typeof newUser.age !== "number" || newUser.age <= 0) {
      throw new Error("Invalid age");
    }

    if (!newUser.gender || newUser.gender.length > 12) {
      throw new Error("Invalid gender");
    }

    if (!newUser.email || newUser.email.length > 100) {
      throw new Error("Invalid email");
    }

    if (!password || typeof password !== "string") {
      throw new Error("Invalid password. Password must be a non-empty string.");
    }

    await connection("users").insert(newUser);
    res.status(201).json({ message: "User created successfully!" });
  } catch (error: any) {
    res
      .status(400)
      .json({ message: error.message || "An unexpected error occurred" });
  }
});

// DELETAR UM USUÁRIO
app.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Recuperar o token do cabeçalho de autorização
    const token = req.headers.authorization;
    if (!token) {
      throw new Error("Authorization token is required.");
    }

    // Decodificar o token para obter o id_user
    const authenticator = new Authenticator();
    const tokenData = authenticator.getTokenData(token);

    if (!tokenData || !tokenData.id) {
      throw new Error("Invalid or missing token.");
    }

    const userId = tokenData.id;

    // Verificar se o ID do parâmetro é válido
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error("User ID is required.");
    }

    // Verificar se o usuário está tentando deletar a si mesmo
    if (userId !== id.trim()) {
      throw new Error("You are not authorized to delete this user.");
    }

    // Verificar se o usuário existe
    const userExists = await connection("users")
      .where("id_user", id.trim())
      .first();

    if (!userExists) {
      throw new Error("User not found.");
    }

    // Deletar o usuário
    await connection("users").where("id_user", id.trim()).del();
    res.status(200).json({ message: "User deleted successfully!" });
  } catch (error: any) {
    if (error.message === "Authorization token is required.") {
      res.status(401).json({ message: error.message });
    } else if (error.message === "Invalid or missing token.") {
      res.status(403).json({ message: error.message });
    } else if (error.message === "User ID is required.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else if (
      error.message === "You are not authorized to delete this user."
    ) {
      res.status(403).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: error.message || "Error deleting user." });
    }
  }
});

// ATUALIZAR UM USUÁRIO
app.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name_user, surname, age, gender } = req.body;

  try {
    // Recuperar o token do cabeçalho de autorização
    const token = req.headers.authorization;
    if (!token) {
      throw new Error("Authorization token is required.");
    }

    const authenticator = new Authenticator();
    const tokenData = authenticator.getTokenData(token);

    if (!tokenData || !tokenData.id) {
      throw new Error("Invalid or missing token.");
    }

    const userId = tokenData.id;

    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error("User ID is required.");
    }

    if (userId !== id.trim()) {
      throw new Error("You are not authorized to update this user.");
    }

    if (
      !name_user ||
      typeof name_user !== "string" ||
      name_user.trim().length === 0 ||
      name_user.length > 50
    ) {
      throw new Error("Invalid name_user.");
    }

    if (
      !surname ||
      typeof surname !== "string" ||
      surname.trim().length === 0 ||
      surname.length > 50
    ) {
      throw new Error("Invalid surname.");
    }

    if (typeof age !== "number" || age <= 0) {
      throw new Error("Invalid age.");
    }

    if (
      !gender ||
      typeof gender !== "string" ||
      gender.trim().length === 0 ||
      gender.length > 12
    ) {
      throw new Error("Invalid gender.");
    }

    const userExists = await connection("users")
      .where("id_user", id.trim())
      .first();

    if (!userExists) {
      throw new Error("User not found.");
    }

    await connection("users")
      .where("id_user", id.trim())
      .update({ name_user, surname, age, gender });

    res.status(200).json({ message: "User updated successfully!" });
  } catch (error: any) {
    if (error.message === "Authorization token is required.") {
      res.status(401).json({ message: error.message });
    } else if (error.message === "Invalid or missing token.") {
      res.status(403).json({ message: error.message });
    } else if (error.message === "User ID is required.") {
      res.status(400).json({ message: error.message });
    } else if (
      [
        "Invalid name_user.",
        "Invalid surname.",
        "Invalid age.",
        "Invalid gender.",
      ].includes(error.message)
    ) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else if (
      error.message === "You are not authorized to update this user."
    ) {
      res.status(403).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: error.message || "Error updating user." });
    }
  }
});

// ENDPOINTS DO INGREDIENTS

// BUSCAR TODOS OS INGREDIENTES
app.get("/ingredients", async (req: Request, res: Response): Promise<void> => {
  try {
    const ingredients = await connection("ingredients").select("*");

    if (!ingredients || ingredients.length === 0) {
      throw new Error("No ingredients found.");
    }

    res.status(200).json(ingredients);
  } catch (error: any) {
    if (error.message === "No ingredients found.") {
      res.status(404).json({ message: error.message });
    } else {
      res
        .status(500)
        .json({ message: error.message || "Error fetching ingredients." });
    }
  }
});

// CRIAR INGREDIENTE
app.post("/ingredients", async (req: Request, res: Response): Promise<void> => {
  const { name_ingredient, type_ingredient } = req.body;
  const gerarID = generateId();

  try {
    if (
      !name_ingredient ||
      typeof name_ingredient !== "string" ||
      name_ingredient.trim().length === 0
    ) {
      throw new Error(
        "Invalid name_ingredient. It must be a non-empty string."
      );
    }

    if (
      !type_ingredient ||
      typeof type_ingredient !== "string" ||
      type_ingredient.trim().length === 0
    ) {
      throw new Error(
        "Invalid type_ingredient. It must be a non-empty string."
      );
    }

    await connection("ingredients").insert({
      id_ingredient: gerarID,
      name_ingredient: name_ingredient.trim(),
      type_ingredient: type_ingredient.trim(),
    });

    res.status(201).json({ message: "Ingredient created successfully!" });
  } catch (error: any) {
    if (error.message.includes("Invalid name_ingredient")) {
      res.status(400).json({ message: error.message });
    } else if (error.message.includes("Invalid type_ingredient")) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message:
          error.message ||
          "An unexpected error occurred while creating the ingredient.",
      });
    }
  }
});

// ATUALIZAR INGREDIENTE
app.patch(
  "/ingredients/:id",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name_ingredient, type_ingredient } = req.body;

    try {
      // Recuperar o token do cabeçalho de autorização
      const token = req.headers.authorization;
      if (!token) {
        throw new Error("Authorization token is required.");
      }

      // Decodificar o token para obter o id_user
      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (!tokenData || !tokenData.id) {
        throw new Error("Invalid or missing token.");
      }

      const userId = tokenData.id;

      // Verificar se o ID do ingrediente é válido
      if (!id) {
        throw new Error("Ingredient ID is required.");
      }

      // Verificar se o ingrediente existe
      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id)
        .first();

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      // Verificar se o ingrediente foi criado pelo usuário autenticado
      if (ingredientExists.user_id !== userId) {
        throw new Error("You are not authorized to update this ingredient.");
      }

      // Validar os dados do corpo da requisição
      if (
        name_ingredient &&
        (typeof name_ingredient !== "string" || name_ingredient.trim() === "")
      ) {
        throw new Error("Invalid name_ingredient.");
      }

      if (
        type_ingredient &&
        (typeof type_ingredient !== "string" || type_ingredient.trim() === "")
      ) {
        throw new Error("Invalid type_ingredient.");
      }

      // Atualizar o ingrediente
      await connection("ingredients")
        .where("id_ingredient", id)
        .update({ name_ingredient, type_ingredient });

      res.status(200).json({ message: "Ingredient updated successfully!" });
    } catch (error: any) {
      if (error.message === "Authorization token is required.") {
        res.status(401).json({ message: error.message });
      } else if (error.message === "Invalid or missing token.") {
        res.status(403).json({ message: error.message });
      } else if (error.message === "Ingredient ID is required.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else if (
        error.message === "Invalid name_ingredient." ||
        error.message === "Invalid type_ingredient."
      ) {
        res.status(400).json({ message: error.message });
      } else if (
        error.message === "You are not authorized to update this ingredient."
      ) {
        res.status(403).json({ message: error.message });
      } else {
        res
          .status(500)
          .json({ message: error.message || "Error updating ingredient." });
      }
    }
  }
);


// DELETAR INGREDIENTE
app.delete(
  "/ingredients/:id",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    try {
      // Recuperar o token do cabeçalho de autorização
      const token = req.headers.authorization;
      if (!token) {
        throw new Error("Authorization token is required.");
      }

      // Decodificar o token para obter o id_user
      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (!tokenData || !tokenData.id) {
        throw new Error("Invalid or missing token.");
      }

      const userId = tokenData.id;

      // Verificar se o ID do ingrediente é válido
      if (!id || typeof id !== "string" || id.trim() === "") {
        throw new Error("Ingredient ID is required.");
      }

      // Verificar se o ingrediente existe
      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id)
        .first();

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      // Verificar se o ingrediente está associado a uma receita do usuário autenticado
      const ingredientRecipe = await connection("recipe_ingredient")
        .join("recipes", "recipe_ingredient.id_recipe", "recipes.id_recipe")
        .where("recipe_ingredient.id_ingredient", id)
        .first();

      if (!ingredientRecipe || ingredientRecipe.user_id !== userId) {
        throw new Error("You are not authorized to delete this ingredient.");
      }

      // Excluir o ingrediente
      await connection("ingredients").where("id_ingredient", id).del();
      res.status(200).json({ message: "Ingredient deleted successfully!" });
    } catch (error: any) {
      if (error.message === "Authorization token is required.") {
        res.status(401).json({ message: error.message });
      } else if (error.message === "Invalid or missing token.") {
        res.status(403).json({ message: error.message });
      } else if (error.message === "Ingredient ID is required.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else if (
        error.message === "You are not authorized to delete this ingredient."
      ) {
        res.status(403).json({ message: error.message });
      } else {
        res
          .status(500)
          .json({ message: error.message || "Error deleting ingredient" });
      }
    }
  }
);

app.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || typeof email !== "string" || email.trim() === "") {
      throw new Error("Email is required and must be a valid string.");
    }

    if (!password || typeof password !== "string" || password.trim() === "") {
      throw new Error("Password is required and must be a valid string.");
    }

    const user = await connection("users").where("email", email.trim()).first();

    if (!user) {
      res.status(404);
      throw new Error("User not found.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401);
      throw new Error("Invalid password.");
    }

    const payload: AuthenticationData = {
      id: user.id_user,
    };
    const token = authenticator.generateToken(payload);

    res.status(200).json({ message: "Login successful", token });
  } catch (error: any) {
    if (error.message === "Email is required and must be a valid string.") {
      res.status(400).json({ message: error.message });
    } else if (
      error.message === "Password is required and must be a valid string."
    ) {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "Invalid password.") {
      res.status(401).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
