import { connection } from "../connection";
import { generateId } from "../services/Generated";
import { Ingredient } from "../models/IngredientType";

export class IngredientBusiness {
  async getIngredients(): Promise<Ingredient[]> {
    const ingredients = await connection("ingredients").select("*");
    if (!ingredients || ingredients.length === 0) throw new Error("No ingredients found.");
    return ingredients;
  }

  async createIngredient(data: Omit<Ingredient, "id_ingredient">): Promise<string> {
    const { name_ingredient, type_ingredient, user_id } = data;

    // Validações
    if (!name_ingredient || name_ingredient.trim().length === 0) {
      throw new Error("Invalid name_ingredient.");
    }
    if (!type_ingredient || type_ingredient.trim().length === 0) {
      throw new Error("Invalid type_ingredient.");
    }

    // Verifica se o usuário existe
    const userExists = await connection("users").where("id_user", user_id).first();
    if (!userExists) throw new Error("Para criar um ingrediente o usuário deve ser válido");

    // Gera o ID do ingrediente
    const newIngredient: Ingredient = {
      id_ingredient: generateId(), // Gera ID aqui
      name_ingredient: name_ingredient.trim(),
      type_ingredient: type_ingredient.trim(),
      user_id,
    };

    // Insere no banco de dados
    await connection("ingredients").insert(newIngredient);
    return "Ingredient created successfully!";
  }

  async updateIngredient(
    id: string,
    userId: string,
    data: Partial<Omit<Ingredient, "id_ingredient">>
  ): Promise<string> {
    const ingredientExists = await connection("ingredients").where("id_ingredient", id).first();
    if (!ingredientExists) throw new Error("Ingredient not found.");

    if (ingredientExists.user_id !== userId) throw new Error("You are not authorized to update this ingredient.");

    if (data.name_ingredient && data.name_ingredient.trim().length === 0) throw new Error("Invalid name_ingredient.");
    if (data.type_ingredient && data.type_ingredient.trim().length === 0) throw new Error("Invalid type_ingredient.");

    await connection("ingredients").where("id_ingredient", id).update(data);
    return "Ingredient updated successfully!";
  }

  async deleteIngredient(id: string, userId: string): Promise<string> {
    const ingredientExists = await connection("ingredients").where("id_ingredient", id).first();
    if (!ingredientExists) throw new Error("Ingredient not found.");

    if (ingredientExists.user_id !== userId) throw new Error("You are not authorized to delete this ingredient.");

    await connection("ingredients").where("id_ingredient", id).del();
    return "Ingredient deleted successfully!";
  }
}
