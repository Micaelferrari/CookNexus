import { Router } from "express";
import { RecipeIngredientController } from "../controller/RecipeIngredientController";

const recipeIngredientController = new RecipeIngredientController();
export const RecipeIngredientRoutes = Router();

RecipeIngredientRoutes.post(
  "/:id_recipe/ingredients/:id_ingredient",
  recipeIngredientController.addIngredientToRecipe.bind(recipeIngredientController)
);

/*RecipeIngredientRoutes.delete(
  "/:id_recipe/ingredients/:id_ingredient",
  recipeIngredientController.removeIngredientFromRecipe.bind(recipeIngredientController)
);*/

RecipeIngredientRoutes.get(
  "/ingredients/:ingredient",
  recipeIngredientController.getRecipesByIngredient.bind(recipeIngredientController)
);
RecipeIngredientRoutes.patch(
  "/:id_recipe/ingredients/:id_ingredient", 
  recipeIngredientController.addIngredientToRecipe.bind(recipeIngredientController)
);