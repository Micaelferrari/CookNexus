import express from "express";
import cors from "cors";
import { RecipeRoutes } from "./routes/RecipeRoutes";
import  UserRoutes  from "./routes/UserRoutes";
import  IngredientRoutes  from "./routes/IngredientRoutes";
import { RecipeIngredientRoutes } from "./routes/RecipeIngredientRoutes";

export const app = express();

app.use(express.json());
app.use(cors());

// Registrar as rotas
app.use("/recipes", RecipeRoutes);
app.use("/users", UserRoutes);
app.use("/ingredients", IngredientRoutes);
app.use("/recipesingredients", RecipeIngredientRoutes);
