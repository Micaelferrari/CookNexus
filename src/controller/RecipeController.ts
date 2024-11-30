import { Request, Response } from "express";
import { RecipeBusiness } from "../business/RecipeBusiness";
import { generateId } from "../services/Generated";
import { Recipe } from "../models/RecipeType";
import { verifyToken } from "../services/VerifyToken"

export class RecipeController {
  private recipeBusiness = new RecipeBusiness();

  async getAllRecipes(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const sortBy = (req.query.sortBy as string) || "title";
      const sort = (req.query.sort as string) || "asc";

      const recipes = await this.recipeBusiness.getAllRecipes(page, limit, sortBy, sort);

      res.status(200).json({ recipes });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getRecipesByTitle(req: Request, res: Response) {
    try {
      const { title } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const sortBy = (req.query.sortBy as string) || "title";
      const sort = (req.query.sort as string) || "asc";

      const recipes = await this.recipeBusiness.getRecipesByTitle(title, page, limit, sortBy, sort);

      res.status(200).json({ recipes });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async createRecipe(req: Request, res: Response) {
    try {
      const { title, description, prep_time, user_id, modo_preparo } = req.body;

      const newRecipe: Recipe = {
        id_recipe: generateId(),
        title,
        description,
        prep_time,
        user_id,
        modo_preparo,
      };

      await this.recipeBusiness.createRecipe(newRecipe);

      res.status(201).json({ message: "Recipe created successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteRecipe(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Authorization token is required.");
      }

      const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

      const userId = verifyToken(tokenWithoutBearer);

     await this.recipeBusiness.deleteRecipe(id,userId );

      res.status(200).json({ message: "Recipe deleted successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateRecipe(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Authorization token is required.");
      }

      const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

      const userId = verifyToken(tokenWithoutBearer);
      
      await this.recipeBusiness.updateRecipe(id, req.body, userId);

      res.status(200).json({ message: "Recipe updated successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getRecipesByIngredient(req: Request, res: Response) {
    try {
      const { ingredient } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
  
      if (!ingredient || ingredient.trim() === "") {
        throw new Error("Invalid ingredient.");
      }
  
      const recipes = await this.recipeBusiness.getRecipesByIngredient(
        ingredient,
        page,
        limit
      );
  
      res.status(200).json({ recipes });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  
  async getRecipesByUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
  
      if (!username || typeof username !== "string") {
        throw new Error("Invalid username parameter.");
      }
  
      const recipes = await this.recipeBusiness.getRecipesByUser(
        username,
        page,
        limit
      );
  
      res.status(200).json({ recipes });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
