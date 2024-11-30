import { verifyToken } from './../services/VerifyToken';
import { Request, Response } from "express";
import { IngredientBusiness } from "../business/IngredientBusiness";

const ingredientBusiness = new IngredientBusiness();

export class IngredientController {
  async getIngredients(req: Request, res: Response): Promise<void> {
    try {
      const ingredients = await ingredientBusiness.getIngredients();
      res.status(200).json(ingredients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async createIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { name_ingredient, type_ingredient, user_id } = req.body;
      const message = await ingredientBusiness.createIngredient({
        name_ingredient,
        type_ingredient,
        user_id,
      });
      res.status(201).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name_ingredient, type_ingredient } = req.body;
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Authorization token is required.");
      }

      const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

      const userId = verifyToken(tokenWithoutBearer);

   
      const message = await ingredientBusiness.updateIngredient(id, userId, {
        name_ingredient,
        type_ingredient,
      });

      res.status(200).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Authorization token is required.");
      }

            const tokenWithoutBearer = token.startsWith("Bearer ") ? token.slice(7) : token;

      const userId = verifyToken(tokenWithoutBearer);

      const message = await ingredientBusiness.deleteIngredient(id, userId);

      res.status(200).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
