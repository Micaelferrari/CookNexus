import { connection } from './../connection';
import { verifyToken } from './../services/VerifyToken';
import { Request, Response } from "express";
import { RecipeIngredientBusiness } from "../business/RecipeIngredientBusiness";



export class RecipeIngredientController {
   recipeIngredientBusiness = new RecipeIngredientBusiness();

  async addIngredientToRecipe(req: Request, res: Response): Promise<void> {
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

      const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

      const userId = verifyToken(tokenWithoutBearer);

      const recipe = await connection("recipes").where("id_recipe", id_recipe).first();
      if (!recipe) {
        throw new Error("Recipe not found.");
      }

      if (recipe.user_id !== userId) {
        throw new Error("You are not authorized to modify this recipe.");
      }

      await this.recipeIngredientBusiness.addIngredientToRecipe({
        id_recipe,
        id_ingredient,
        quantity,
      });

      res.status(200).json({ message: "Ingredient added or updated successfully in the recipe!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Unexpected error." });
    }
  }

  /*
  NÃO ESTÁ FUNCIONANDO, TENHOQ QUE RRUMAR, MAS POR HORA VAI ASSIM
  
  async removeIngredientFromRecipe(req: Request, res: Response): Promise<void> {
    try {
      const { id_recipe, id_ingredient } = req.params;

      await this.recipeIngredientBusiness.removeIngredientFromRecipe(id_recipe, id_ingredient);

      res.status(200).json({ message: "Ingredient removed from recipe successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Unexpected error." });
    }
  }*/

  async getRecipesByIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { ingredient } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const recipes = await this.recipeIngredientBusiness.getRecipesByIngredient(
        ingredient,
        page,
        limit
      );

      if (recipes.length === 0) throw new Error("No recipes found for the specified ingredient.");

      res.status(200).json(recipes);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Unexpected error." });
    }
  }
}
