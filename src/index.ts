import knex, { Knex } from "knex";
import express, { json } from "express";
import cors from "cors";
import { Request, Response } from "express";
import { generateId } from "./services/Generated";
import dotenv from 'dotenv';
import { Authenticator, AuthenticationData } from "./services/Authenticator";
import bcrypt from "bcryptjs";
import { User } from "./models/UserType"

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

  //os valores vem como string, se converter antes com o number() não funciona
  const pageStr = req.query.page;
  const limitStr = req.query.limit;

  //variáveis pra ordenação
  /*const sort = req.query.sort
  const sortBy = req.query.sortBy || 'title';

  if(sort !== 'asc' && sort !== 'desc' && sort !==undefined ){
    res.status(400).json({ message: "Sort value must be 'asc' or 'desc'." });
    return;
  }

  if (typeof sortBy !== 'string') {
    res.status(400).json({ message: "SortBy value invalid." });
    return;
  }

  const validarSortBy = ['title', 'description', 'prep_time'];

  if (!validarSortBy.includes(sortBy)) {
    res.status(400).json({ message: "Invalid column for sortBy. Value must be title, description or prep_time" });
    return
  }
*/


  if (pageStr !== undefined && (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
    res.status(400).json({ message: "Page must be a positive number." });
    return
  }

  if (limitStr !== undefined && (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
    res.status(400).json({ message: "Limit must be a positive number." });
    return
  }

  const page = Number(pageStr) || 1; // Pagina atual sendo 1
  const limit = Number(limitStr) || 10; // Quantidade de itens por página
  const offset = (page - 1) * limit; // Fazendo o cálculo do offset

  //console.log(`Page: ${page}, Limit: ${limit}, Offset: ${offset}`); pra teste 

  try {
    const recipes = await connection("recipes")
      .select("*")
      //.orderBy( sortBy, sort)
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


// BUSCAR RECEITAS COM TÍTULO ESPECÍFICO
app.get(
  "/recipes/:title",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Os valores vêm como string, se converter antes com o Number() não funciona
      const pageStr = req.query.page;
      const limitStr = req.query.limit;

      // Variáveis para ordenação
      const sort = req.query.sort;
      const sortBy = req.query.sortBy || 'title';

      // Validações de ordenação
      if (sort !== 'asc' && sort !== 'desc' && sort !== undefined) {
        throw new Error("Sort value must be 'asc' or 'desc'.");
      }

      if (typeof sortBy !== 'string') {
        throw new Error("SortBy value invalid.");
      }

      const validarSortBy = ['title', 'description', 'prep_time'];
      if (!validarSortBy.includes(sortBy)) {
        throw new Error("Invalid column for sortBy. Value must be 'title', 'description' or 'prep_time'.");
      }

      // Validações de paginação
      if (pageStr !== undefined && (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
        throw new Error("Page must be a positive number.");
      }

      if (limitStr !== undefined && (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
        throw new Error("Limit must be a positive number.");
      }

      const page = Number(pageStr) || 1; // Página atual sendo 1
      const limit = Number(limitStr) || 10; // Quantidade de itens por página
      const offset = (page - 1) * limit; // Cálculo do offset

      const { title } = req.params;
      if (!title || title.trim() === "") {
        throw new Error("Title is required.");
      }

      const recipes = await connection("recipes")
        .where("title", "ILIKE", `%${title}%`)
        .orderBy(sortBy, sort)
        .limit(limit)
        .offset(offset);

      if (recipes.length === 0) {
        throw new Error("No recipes found.");
      }

      res.status(200).json({
        recipes,
      });
    } catch (error: any) {
      if (error.message === "No recipes found.") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message || "Invalid request." });
      }
    }
  }
);

// DELETAR
app.delete(
  "/recipes/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error("Recipe ID is required.");
      }

      const recipe = await connection("recipes").where("id_recipe", id).first();

      if (!recipe) {
        throw new Error("Recipe not found.");
      }

      await connection("recipes").where("id_recipe", id).del();
      res.status(200).json({ message: "Recipe deleted successfully!" });
    } catch (error: any) {
      if (error.message === "Recipe ID is required.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Recipe not found.") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message || "Error deleting recipe." });
      }
    }
  }
);

// CRIAR RECEITA
app.post("/recipes", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, prep_time, user_id, modo_preparo } = req.body;

    if (!title || !description || !prep_time || !user_id || !modo_preparo) {
      throw new Error("All fields are required.");
    }

    const gerarID = generateId();

    const userExists = await connection("users").where("id_user", user_id).first();

    if (!userExists) {
      throw new Error("User not found.");
    }

    await connection("recipes").insert({
      id_recipe: gerarID,
      title,
      description,
      prep_time,
      user_id,
      modo_preparo,
    });

    res.status(201).json({ message: "Recipe created successfully!" });

  } catch (error: any) {
    if (error.message === "All fields are required.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message || "An unexpected error occurred." });
    }
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

      if (pageStr !== undefined && (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
        throw new Error("Page must be a positive number.");
      }

      if (limitStr !== undefined && (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
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
        .join("ingredients", "recipe_ingredient.id_ingredient", "ingredients.id_ingredient")
        .where("ingredients.name_ingredient", "ILIKE", `%${ingredient}%`)
        .select("recipes.*")
        .limit(limit)
        .offset(offset);

      if (recipes.length === 0) {
        throw new Error("No recipes found with the specified ingredient.");
      }

      res.status(200).json({
        recipes
      });
    } catch (error: any) {
      if (error.message === "Page must be a positive number." || error.message === "Limit must be a positive number.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Invalid ingredient.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "No recipes found with the specified ingredient.") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message || "Error fetching recipes by ingredient" });
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
      recipes
    });

  } catch (error: any) {
    if (error.message === "Invalid username parameter.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else if (error.message === "No recipes found for this user.") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message || "Error fetching recipes for user" });
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

      if (!id_recipe || !id_ingredient) {
        throw new Error("Recipe ID and Ingredient ID are required.");
      }

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

      await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .update({ quantity });

      res.status(200).json({ message: "Ingredient updated successfully!" });

    } catch (error: any) {
      if (error.message === "Recipe ID and Ingredient ID are required.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Recipe not found.") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({
          message: error.message || " error occurred while updating the ingredient.",
        });
      }
    }
  }
);


//DELETAR INGREDIENTE DE UMA RECEITA 
app.delete(
  "/recipes/:id_recipe/ingredients/:id_ingredient",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id_recipe, id_ingredient } = req.params;

      if (!id_recipe || !id_ingredient) {
        throw new Error("Recipe ID and Ingredient ID are required.");
      }

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

      const recipeIngredientExists = await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .first();

      if (!recipeIngredientExists) {
        throw new Error("Ingredient is not associated with this recipe.");
      }

      await connection("recipe_ingredient")
        .where({ id_recipe, id_ingredient })
        .del();

      res.status(200).json({ message: "Ingredient removed from recipe successfully!" });

    } catch (error: any) {
      if (error.message === "Recipe ID and Ingredient ID are required.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Recipe not found.") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Ingredient is not associated with this recipe.") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({
          message: error.message || "An error occurred while removing the ingredient from the recipe.",
        });
      }
    }
  }
);


// ENDPOINTS DO USERS// tá bugando o sort

// BUSCAR TODOS OS USUÁRIOS
app.get("/users", async (req: Request, res: Response): Promise<void> => {

  const page = Number(req.query.page) || 1; // Pagina atual
  const limit = Number(req.query.limit) || 10; // Número de itens por pagina
  const offset = (page - 1) * limit; // Calculo do offset

  //variáveis pra ordenação
  const sort = req.query.sort
  let sortBy = req.query.sortBy?.toString().trim() || 'name_user';

  if (sort !== 'asc' && sort !== 'desc' && sort !== undefined) {
    res.status(400).json({ message: "Sort value must be 'asc' or 'desc'." });
    return;
  }

  if (typeof sortBy !== 'string' || sortBy === undefined) {
    res.status(400).json({ message: "SortBy value invalid." });
    return;
  }

  const validarSortBy = ['name_user', 'sobrenome', 'age'];

  if (!validarSortBy.includes(sortBy)) {
    res.status(400).json({ message: "Invalid column for sortBy. Value must be name_user, sobrenome or age" });
    return
  }

  try {
    const users = await connection("users")
      .select("*") // Seleciona todos os campos da tabela users
      .orderBy(sortBy, sort || 'asc')
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
  const { name_user, sobrenome, age, gender, email, password } = req.body;


  try {
    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser: User = {
      id_user: generateId(),
      name_user,
      sobrenome,
      age,
      gender,
      email,
      password: hashedPassword
    };

    const existUser = await connection('users').where('email', newUser.email).first()

    if(existUser){
      throw new Error("User Alredy exist!")
    }

    if (!newUser.name_user || newUser.name_user.length > 50) {
      throw new Error("Invalid name_user");
    }

    if (!newUser.sobrenome || newUser.sobrenome.length > 50) {
      throw new Error("Invalid sobrenome");
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
    res.status(400).json({ message: error.message || "An unexpected error occurred" });
  }
});



// DELETAR UM USUÁRIO
app.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    if (!id || typeof id !== "string") {
      throw new Error("User ID is required.");
    }

    const userExists = await connection("users").where("id_user", id).first();

    if (!userExists) {
      throw new Error("User not found.");
    }

    await connection("users").where("id_user", id).del();
    res.status(200).json({ message: "User deleted successfully!" });
  } catch (error: any) {
    if (error.message === "User ID is required.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message || "Error deleting user." });
    }
  }
});


// ATUALIZAR UM USUÁRIO
app.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name_user, sobrenome, age, gender } = req.body;

  try {
    if (!id || typeof id !== "string") {
      throw new Error("User ID is required.");
    }

    if (!name_user || typeof name_user !== "string" || name_user.length > 50) {
      throw new Error("Invalid name_user.");
    }

    if (!sobrenome || typeof sobrenome !== "string" || sobrenome.length > 50) {
      throw new Error("Invalid sobrenome.");
    }

    if (typeof age !== "number" || age <= 0) {
      throw new Error("Invalid age.");
    }

    if (!gender || typeof gender !== "string" || gender.length > 12) {
      throw new Error("Invalid gender.");
    }

    const userExists = await connection("users").where("id_user", id).first();

    if (!userExists) {
      throw new Error("User not found.");
    }

    await connection("users")
      .where("id_user", id)
      .update({ name_user, sobrenome, age, gender });

    res.status(200).json({ message: "User updated successfully!" });
  } catch (error: any) {
    if (error.message === "User ID is required.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Invalid name_user.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Invalid sobrenome.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Invalid age.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Invalid gender.") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "User not found.") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message || "Error updating user." });
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
      res.status(500).json({ message: error.message || "Error fetching ingredients." });
    }
  }
});


// CRIAR INGREDIENTE
app.post("/ingredients", async (req: Request, res: Response): Promise<void> => {
  const { name_ingredient, type_ingredient } = req.body;
  const gerarID = generateId();

  try {
    // Validações dentro do bloco try
    if (!name_ingredient || typeof name_ingredient !== "string" || name_ingredient.trim() === "") {
      throw new Error("Invalid name_ingredient. It must be a non-empty string.");
    }

    if (!type_ingredient || typeof type_ingredient !== "string" || type_ingredient.trim() === "") {
      throw new Error("Invalid type_ingredient. It must be a non-empty string.");
    }

    // Inserção no banco de dados
    await connection("ingredients").insert({
      id_ingredient: gerarID,
      name_ingredient,
      type_ingredient,
    });

    res.status(201).json({ message: "Ingredient created successfully!" });
  } catch (error: any) {
    // Tratamento explícito de erros
    if (error.message.includes("Invalid name_ingredient")) {
      res.status(400).json({ message: error.message });
    } else if (error.message.includes("Invalid type_ingredient")) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({
        message: error.message || "An unexpected error occurred while creating the ingredient.",
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
      if (!id) {
        throw new Error("Ingredient ID is required.");
      }

      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id)
        .first();

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      if (name_ingredient && (typeof name_ingredient !== "string" || name_ingredient.trim() === "")) {
        throw new Error("Invalid name_ingredient.");
      }

      if (type_ingredient && (typeof type_ingredient !== "string" || type_ingredient.trim() === "")) {
        throw new Error("Invalid type_ingredient.");
      }

      await connection("ingredients")
        .where("id_ingredient", id)
        .update({ name_ingredient, type_ingredient });

      res.status(200).json({ message: "Ingredient updated successfully!" });
    } catch (error: any) {
      if (error.message === "Ingredient ID is required.") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else if (error.message === "Invalid name_ingredient." || error.message === "Invalid type_ingredient.") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message || "Error updating ingredient." });
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
      if (!id) {
        throw new Error("Ingredient ID is required");
      }

      const ingredientExists = await connection("ingredients")
        .where("id_ingredient", id)
        .first();

      if (!ingredientExists) {
        throw new Error("Ingredient not found.");
      }

      await connection("ingredients").where("id_ingredient", id).del();
      res.status(200).json({ message: "Ingredient deleted successfully!" });
    } catch (error: any) {
      if (error.message === "Ingredient ID is required") {
        res.status(400).json({ message: error.message });
      } else if (error.message === "Ingredient not found.") {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message || "Error deleting ingredient" });
      }
    }
  }
);


app.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await connection("users").where("email", email).first();

    if (!user) {
      res.status(404)
      throw new Error("User not found.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("Invalid password.");
    }

    const payload: AuthenticationData = {
      id: user.id_user
    }
    const token = authenticator.generateToken(payload)

    res.status(200).json({ message: "Login successful", token });

  } catch (error: any) {
    res.json({ message: error.message });
  }
});


// Iniciar o servidor
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
