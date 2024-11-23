"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = __importDefault(require("knex"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const Generated_1 = require("./services/Generated");
const dotenv_1 = __importDefault(require("dotenv"));
const Authenticator_1 = require("./services/Authenticator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const authenticator = new Authenticator_1.Authenticator();
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const connection = (0, knex_1.default)({
    client: "pg",
    connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    },
});
connection
    .raw("SELECT 1")
    .then(() => {
    console.log("Conectado ao PostgreSQL com sucesso!");
})
    .catch((err) => {
    console.error("Erro ao conectar ao PostgreSQL:", err);
});
app.get("/recipes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageStr = req.query.page;
        const limitStr = req.query.limit;
        const sort = req.query.sort;
        const sortBy = req.query.sortBy || "title";
        const validarSortBy = ["title", "description", "prep_time"];
        if (sort !== undefined && sort !== "asc" && sort !== "desc") {
            throw new Error("Sort value must be 'asc' or 'desc'.");
        }
        if (!validarSortBy.includes(sortBy)) {
            throw new Error(`Invalid column for sortBy. Value must be one of: ${validarSortBy.join(", ")}.`);
        }
        if (pageStr !== undefined &&
            (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
            throw new Error("Page must be a positive number.");
        }
        if (limitStr !== undefined &&
            (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
            throw new Error("Limit must be a positive number.");
        }
        const page = Number(pageStr) || 1;
        const limit = Number(limitStr) || 10;
        const offset = (page - 1) * limit;
        const recipes = yield connection("recipes")
            .select("*")
            .orderBy(sortBy, sort || "asc")
            .limit(limit)
            .offset(offset);
        if (recipes.length === 0) {
            throw new Error("No recipes found.");
        }
        res.status(200).json({ recipes });
    }
    catch (error) {
        if (error.message === "No recipes found.") {
            res.status(404).json({ message: error.message });
        }
        else {
            res
                .status(400)
                .json({ message: error.message || "An unexpected error occurred." });
        }
    }
}));
app.get("/recipes/:title", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageStr = req.query.page;
        const limitStr = req.query.limit;
        const sort = req.query.sort;
        const sortBy = req.query.sortBy || "title";
        const validarSortBy = ["title", "description", "prep_time"];
        if (sort !== undefined && sort !== "asc" && sort !== "desc") {
            throw new Error("Sort value must be 'asc' or 'desc'.");
        }
        if (!validarSortBy.includes(sortBy)) {
            throw new Error(`Invalid column for sortBy. Value must be one of: ${validarSortBy.join(", ")}.`);
        }
        if (pageStr !== undefined &&
            (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
            throw new Error("Page must be a positive number.");
        }
        if (limitStr !== undefined &&
            (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
            throw new Error("Limit must be a positive number.");
        }
        const page = Number(pageStr) || 1;
        const limit = Number(limitStr) || 10;
        const offset = (page - 1) * limit;
        const { title } = req.params;
        if (!title || title.trim() === "") {
            throw new Error("Title is required.");
        }
        const recipes = yield connection("recipes")
            .where("title", "ILIKE", `%${title.trim()}%`)
            .orderBy(sortBy, sort || "asc")
            .limit(limit)
            .offset(offset);
        if (recipes.length === 0) {
            throw new Error("No recipes found.");
        }
        res.status(200).json({ recipes });
    }
    catch (error) {
        if (error.message === "No recipes found.") {
            res.status(404).json({ message: error.message });
        }
        else {
            res
                .status(400)
                .json({ message: error.message || "An unexpected error occurred." });
        }
    }
}));
app.delete("/recipes/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        if (!id || typeof id !== "string" || id.trim() === "") {
            throw new Error("Recipe ID is required and must be a valid string.");
        }
        const recipe = yield connection("recipes")
            .where("id_recipe", id.trim())
            .first();
        if (!recipe) {
            throw new Error("Recipe not found.");
        }
        if (recipe.user_id !== userId) {
            throw new Error("You are not authorized to delete this recipe.");
        }
        yield connection("recipes").where("id_recipe", id.trim()).del();
        res.status(200).json({ message: "Recipe deleted successfully!" });
    }
    catch (error) {
        if (error.message === "Recipe not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "Recipe ID is required and must be a valid string.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to delete this recipe.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error deleting recipe." });
        }
    }
}));
app.post("/recipes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, prep_time, user_id, modo_preparo } = req.body;
    try {
        if (!title ||
            typeof title !== "string" ||
            title.trim().length === 0 ||
            title.length > 40) {
            throw new Error("Invalid title. Title must be a non-empty string with a maximum of 40 characters.");
        }
        if (!description ||
            typeof description !== "string" ||
            description.trim().length === 0) {
            throw new Error("Invalid description. Description must be a non-empty string.");
        }
        if (!prep_time ||
            typeof prep_time !== "string" ||
            prep_time.trim().length === 0) {
            throw new Error("Invalid prep_time. Prep_time must be a non-empty string.");
        }
        if (!user_id ||
            typeof user_id !== "string" ||
            user_id.trim().length === 0) {
            throw new Error("Invalid user_id. User_id must be a valid string.");
        }
        if (!modo_preparo ||
            typeof modo_preparo !== "string" ||
            modo_preparo.trim().length === 0) {
            throw new Error("Invalid modo_preparo. Modo_preparo must be a non-empty string.");
        }
        const userExists = yield connection("users")
            .where("id_user", user_id)
            .first();
        if (!userExists) {
            throw new Error("User not found.");
        }
        const newRecipe = {
            id_recipe: (0, Generated_1.generateId)(),
            title,
            description,
            prep_time,
            user_id,
            modo_preparo,
        };
        yield connection("recipes").insert(newRecipe);
        res.status(201).json({ message: "Recipe created successfully!" });
    }
    catch (error) {
        res
            .status(400)
            .json({ message: error.message || "An unexpected error occurred." });
    }
}));
app.get("/recipes/ingredients/:ingredient", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ingredient } = req.params;
        const pageStr = req.query.page;
        const limitStr = req.query.limit;
        if (pageStr !== undefined &&
            (isNaN(Number(pageStr)) || Number(pageStr) < 1)) {
            throw new Error("Page must be a positive number.");
        }
        if (limitStr !== undefined &&
            (isNaN(Number(limitStr)) || Number(limitStr) < 1)) {
            throw new Error("Limit must be a positive number.");
        }
        const page = Number(pageStr) || 1;
        const limit = Number(limitStr) || 10;
        const offset = (page - 1) * limit;
        if (typeof ingredient !== "string" || ingredient.trim() === "") {
            throw new Error("Invalid ingredient.");
        }
        const recipes = yield connection("recipe_ingredient")
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
            recipes,
        });
    }
    catch (error) {
        if (error.message === "Page must be a positive number." ||
            error.message === "Limit must be a positive number.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "Invalid ingredient.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "No recipes found with the specified ingredient.") {
            res.status(404).json({ message: error.message });
        }
        else {
            res.status(500).json({
                message: error.message || "Error fetching recipes by ingredient",
            });
        }
    }
}));
app.get("/recipes/users/:username", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.params;
        const paginaAtual = Number(req.query.page) || 1;
        const limitarItens = Number(req.query.limit) || 10;
        const offset = (paginaAtual - 1) * limitarItens;
        if (!username || typeof username !== "string") {
            throw new Error("Invalid username parameter.");
        }
        const user = yield connection("users").where("name_user", username).first();
        if (!user) {
            throw new Error("User not found.");
        }
        const recipes = yield connection("recipes")
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
    }
    catch (error) {
        if (error.message === "Invalid username parameter.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "User not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "No recipes found for this user.") {
            res.status(404).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error fetching recipes for user" });
        }
    }
}));
app.patch("/recipes/:id_recipe/ingredients/:id_ingredient", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_recipe, id_ingredient } = req.params;
        const { quantity } = req.body;
        if (!quantity || typeof quantity !== "number" || quantity <= 0) {
            throw new Error("Invalid quantity. It must be a positive number.");
        }
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        const recipe = yield connection("recipes")
            .where("id_recipe", id_recipe)
            .first();
        if (!recipe) {
            throw new Error("Recipe not found.");
        }
        if (recipe.user_id !== userId) {
            throw new Error("You are not authorized to update this recipe.");
        }
        const ingredientExists = yield connection("ingredients")
            .where("id_ingredient", id_ingredient)
            .first();
        if (!ingredientExists) {
            throw new Error("Ingredient not found.");
        }
        const recipeIngredientExists = yield connection("recipe_ingredient")
            .where({ id_recipe, id_ingredient })
            .first();
        if (recipeIngredientExists) {
            yield connection("recipe_ingredient")
                .where({ id_recipe, id_ingredient })
                .update({ quantity });
        }
        else {
            yield connection("recipe_ingredient").insert({
                id_recipe,
                id_ingredient,
                quantity,
            });
        }
        res.status(200).json({
            message: "Ingredient successfully added or updated in the recipe!",
        });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Recipe not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "Ingredient not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to update this recipe.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Invalid quantity. It must be a positive number.") {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(500).json({
                message: error.message ||
                    "An error occurred while adding or updating the ingredient.",
            });
        }
    }
}));
app.put("/recipes/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        const recipe = yield connection("recipes").where("id_recipe", id.trim()).first();
        if (!recipe) {
            throw new Error("Recipe not found.");
        }
        if (recipe.user_id !== userId) {
            throw new Error("You are not authorized to update this recipe.");
        }
        yield connection("recipes").where("id_recipe", id).update({
            title,
            description,
            prep_time,
            user_id,
            modo_preparo,
        });
        res.status(200).json({ message: "Recipe updated successfully!" });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Recipe ID is required.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "Recipe not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to update this recipe.") {
            res.status(403).json({ message: error.message });
        }
        else {
            res.status(500).json({
                message: error.message || "An error occurred while updating the recipe.",
            });
        }
    }
}));
app.delete("/recipes/:id_recipe/ingredients/:id_ingredient", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_recipe, id_ingredient } = req.params;
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        if (!id_recipe || !id_ingredient) {
            throw new Error("Recipe ID and Ingredient ID are required.");
        }
        const recipe = yield connection("recipes")
            .where("id_recipe", id_recipe)
            .first();
        if (!recipe) {
            throw new Error("Recipe not found.");
        }
        if (recipe.user_id !== userId) {
            throw new Error("You are not authorized to remove ingredients from this recipe.");
        }
        const ingredientExists = yield connection("ingredients")
            .where("id_ingredient", id_ingredient)
            .first();
        if (!ingredientExists) {
            throw new Error("Ingredient not found.");
        }
        const recipeIngredientExists = yield connection("recipe_ingredient")
            .where({ id_recipe, id_ingredient })
            .first();
        if (!recipeIngredientExists) {
            throw new Error("Ingredient is not associated with this recipe.");
        }
        yield connection("recipe_ingredient")
            .where({ id_recipe, id_ingredient })
            .del();
        res
            .status(200)
            .json({ message: "Ingredient removed from recipe successfully!" });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Recipe ID and Ingredient ID are required.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "Recipe not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "Ingredient not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "Ingredient is not associated with this recipe.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message ===
            "You are not authorized to remove ingredients from this recipe.") {
            res.status(403).json({ message: error.message });
        }
        else {
            res.status(500).json({
                message: error.message ||
                    "An error occurred while removing the ingredient from the recipe.",
            });
        }
    }
}));
app.get("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sort = req.query.sort;
        const sortBy = ((_a = req.query.sortBy) === null || _a === void 0 ? void 0 : _a.trim()) || "name_user";
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
            throw new Error(`Invalid column for sortBy. Value must be one of: ${validarSortBy.join(", ")}.`);
        }
        const users = yield connection("users")
            .select("*")
            .orderBy(sortBy, sort || "asc")
            .limit(limit)
            .offset(offset);
        if (users.length === 0) {
            throw new Error("No users found.");
        }
        res.status(200).json(users);
    }
    catch (error) {
        if (error.message === "No users found.") {
            res.status(404).json({ message: error.message });
        }
        else {
            res
                .status(400)
                .json({ message: error.message || "Error fetching users." });
        }
    }
}));
app.post("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name_user, surname, age, gender, email, password } = req.body;
    try {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = {
            id_user: (0, Generated_1.generateId)(),
            name_user,
            surname,
            age,
            gender,
            email,
            password: hashedPassword,
        };
        const existUser = yield connection("users")
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
        yield connection("users").insert(newUser);
        res.status(201).json({ message: "User created successfully!" });
    }
    catch (error) {
        res
            .status(400)
            .json({ message: error.message || "An unexpected error occurred" });
    }
}));
app.delete("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        if (!id || typeof id !== "string" || id.trim() === "") {
            throw new Error("User ID is required.");
        }
        if (userId !== id.trim()) {
            throw new Error("You are not authorized to delete this user.");
        }
        const userExists = yield connection("users")
            .where("id_user", id.trim())
            .first();
        if (!userExists) {
            throw new Error("User not found.");
        }
        yield connection("users").where("id_user", id.trim()).del();
        res.status(200).json({ message: "User deleted successfully!" });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "User ID is required.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "User not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to delete this user.") {
            res.status(403).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error deleting user." });
        }
    }
}));
app.put("/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name_user, surname, age, gender } = req.body;
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
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
        if (!name_user ||
            typeof name_user !== "string" ||
            name_user.trim().length === 0 ||
            name_user.length > 50) {
            throw new Error("Invalid name_user.");
        }
        if (!surname ||
            typeof surname !== "string" ||
            surname.trim().length === 0 ||
            surname.length > 50) {
            throw new Error("Invalid surname.");
        }
        if (typeof age !== "number" || age <= 0) {
            throw new Error("Invalid age.");
        }
        if (!gender ||
            typeof gender !== "string" ||
            gender.trim().length === 0 ||
            gender.length > 12) {
            throw new Error("Invalid gender.");
        }
        const userExists = yield connection("users")
            .where("id_user", id.trim())
            .first();
        if (!userExists) {
            throw new Error("User not found.");
        }
        yield connection("users")
            .where("id_user", id.trim())
            .update({ name_user, surname, age, gender });
        res.status(200).json({ message: "User updated successfully!" });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "User ID is required.") {
            res.status(400).json({ message: error.message });
        }
        else if ([
            "Invalid name_user.",
            "Invalid surname.",
            "Invalid age.",
            "Invalid gender.",
        ].includes(error.message)) {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "User not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to update this user.") {
            res.status(403).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error updating user." });
        }
    }
}));
app.get("/ingredients", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ingredients = yield connection("ingredients").select("*");
        if (!ingredients || ingredients.length === 0) {
            throw new Error("No ingredients found.");
        }
        res.status(200).json(ingredients);
    }
    catch (error) {
        if (error.message === "No ingredients found.") {
            res.status(404).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error fetching ingredients." });
        }
    }
}));
app.post("/ingredients", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name_ingredient, type_ingredient, user_id } = req.body;
    const gerarID = (0, Generated_1.generateId)();
    try {
        if (!name_ingredient ||
            typeof name_ingredient !== "string" ||
            name_ingredient.trim().length === 0) {
            throw new Error("Invalid name_ingredient. It must be a non-empty string.");
        }
        if (!type_ingredient ||
            typeof type_ingredient !== "string" ||
            type_ingredient.trim().length === 0) {
            throw new Error("Invalid type_ingredient. It must be a non-empty string.");
        }
        const existUser = yield connection("users")
            .where("id_user", user_id).first();
        if (!existUser) {
            throw new Error("Para criar um ingrediente o usuário deve ser válido");
        }
        yield connection("ingredients").insert({
            id_ingredient: gerarID,
            name_ingredient: name_ingredient.trim(),
            type_ingredient: type_ingredient.trim(),
            user_id: user_id
        });
        res.status(201).json({ message: "Ingredient created successfully!" });
    }
    catch (error) {
        if (error.message.includes("Invalid name_ingredient")) {
            res.status(400).json({ message: error.message });
        }
        else if (error.message.includes("Invalid type_ingredient")) {
            res.status(400).json({ message: error.message });
        }
        else {
            res.status(500).json({
                message: error.message ||
                    "An unexpected error occurred while creating the ingredient.",
            });
        }
    }
}));
app.patch("/ingredients/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name_ingredient, type_ingredient } = req.body;
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        if (!id) {
            throw new Error("Ingredient ID is required.");
        }
        const ingredientExists = yield connection("ingredients")
            .where("id_ingredient", id)
            .first();
        if (!ingredientExists) {
            throw new Error("Ingredient not found.");
        }
        if (ingredientExists.user_id && ingredientExists.user_id !== userId) {
            throw new Error("You are not authorized to delete this ingredient.");
        }
        if (name_ingredient &&
            (typeof name_ingredient !== "string" || name_ingredient.trim() === "")) {
            throw new Error("Invalid name_ingredient.");
        }
        if (type_ingredient &&
            (typeof type_ingredient !== "string" || type_ingredient.trim() === "")) {
            throw new Error("Invalid type_ingredient.");
        }
        yield connection("ingredients")
            .where("id_ingredient", id)
            .update({ name_ingredient, type_ingredient });
        res.status(200).json({ message: "Ingredient updated successfully!" });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Ingredient ID is required.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "Ingredient not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "Invalid name_ingredient." ||
            error.message === "Invalid type_ingredient.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to update this ingredient.") {
            res.status(403).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error updating ingredient." });
        }
    }
}));
app.delete("/ingredients/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const authenticator = new Authenticator_1.Authenticator();
        const tokenData = authenticator.getTokenData(token);
        if (!tokenData || !tokenData.id) {
            throw new Error("Invalid or missing token.");
        }
        const userId = tokenData.id;
        const ingredientExists = yield connection("ingredients")
            .where("id_ingredient", id)
            .first();
        if (!ingredientExists) {
            throw new Error("Ingredient not found.");
        }
        if (ingredientExists.user_id && ingredientExists.user_id !== userId) {
            throw new Error("You are not authorized to delete this ingredient.");
        }
        yield connection("ingredients").where("id_ingredient", id).del();
        res.status(200).json({ message: "Ingredient deleted successfully!" });
    }
    catch (error) {
        if (error.message === "Authorization token is required.") {
            res.status(401).json({ message: error.message });
        }
        else if (error.message === "Invalid or missing token.") {
            res.status(403).json({ message: error.message });
        }
        else if (error.message === "Ingredient ID is required.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "Ingredient not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "You are not authorized to delete this ingredient.") {
            res.status(403).json({ message: error.message });
        }
        else {
            res
                .status(500)
                .json({ message: error.message || "Error deleting ingredient" });
        }
    }
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        if (!email || typeof email !== "string" || email.trim() === "") {
            throw new Error("Email is required and must be a valid string.");
        }
        if (!password || typeof password !== "string" || password.trim() === "") {
            throw new Error("Password is required and must be a valid string.");
        }
        const user = yield connection("users").where("email", email.trim()).first();
        if (!user) {
            res.status(404);
            throw new Error("User not found.");
        }
        const passwordMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            res.status(401);
            throw new Error("Invalid password.");
        }
        const payload = {
            id: user.id_user,
        };
        const token = authenticator.generateToken(payload);
        res.status(200).json({ message: "Login successful", token });
    }
    catch (error) {
        if (error.message === "Email is required and must be a valid string.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "Password is required and must be a valid string.") {
            res.status(400).json({ message: error.message });
        }
        else if (error.message === "User not found.") {
            res.status(404).json({ message: error.message });
        }
        else if (error.message === "Invalid password.") {
            res.status(401).json({ message: error.message });
        }
        else {
            res.status(500).json({ message: "An unexpected error occurred." });
        }
    }
}));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
//# sourceMappingURL=index.js.map