import { Router } from "express";
import { RecipeController } from "../controller/RecipeController";

const recipeController = new RecipeController();
export const RecipeRoutes = Router();

RecipeRoutes.get("/", recipeController.getAllRecipes.bind(recipeController));
RecipeRoutes.get("/:title", recipeController.getRecipesByTitle.bind(recipeController));
RecipeRoutes.post("/", recipeController.createRecipe.bind(recipeController));
RecipeRoutes.delete("/:id", recipeController.deleteRecipe.bind(recipeController));
RecipeRoutes.put("/:id", recipeController.updateRecipe.bind(recipeController));
RecipeRoutes.get("/ingredients/:ingredient",recipeController.getRecipesByIngredient.bind(recipeController));
RecipeRoutes.get("/users/:username",recipeController.getRecipesByUser.bind(recipeController));
  