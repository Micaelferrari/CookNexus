import { connection } from "../connection";
import { Recipe } from "../models/RecipeType";

export class RecipeBusiness {
  async getAllRecipes(page: number, limit: number, sortBy: string, sort: string) {
    const offset = (page - 1) * limit;
    const recipes = await connection("recipes")
      .select("*")
      .orderBy(sortBy, sort)
      .limit(limit)
      .offset(offset);

    if (recipes.length === 0) {
      throw new Error("No recipes found.");
    }

    return recipes;
  }

  async getRecipesByTitle(title: string, page: number, limit: number, sortBy: string, sort: string) {
    const offset = (page - 1) * limit;
    const recipes = await connection("recipes")
      .where("title", "ILIKE", `%${title}%`)
      .orderBy(sortBy, sort)
      .limit(limit)
      .offset(offset);

    if (recipes.length === 0) {
      throw new Error("No recipes found.");
    }

    return recipes;
  }

  async createRecipe(recipe: Recipe): Promise<void> {
    await connection("recipes").insert(recipe);
  }

  async deleteRecipe(id: string, userId: string): Promise<void> {
    const recipe = await connection("recipes").where("id_recipe", id).first();

    if (!recipe) {
      throw new Error("Recipe not found.");
    }

    if (recipe.user_id !== userId) {
      throw new Error("You are not authorized to delete this recipe.");
    }

    await connection("recipes").where("id_recipe", id).del();
  }

  async updateRecipe(id: string, recipeData: Partial<Recipe>, userId: string): Promise<void> {
    const recipe = await connection("recipes").where("id_recipe", id).first();

    if (!recipe) {
      throw new Error("Recipe not found.");
    }

    if (recipe.user_id !== userId) {
      throw new Error("You are not authorized to update this recipe.");
    }

    await connection("recipes").where("id_recipe", id).update(recipeData);
  }
  async getRecipesByIngredient(ingredient: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
  
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
  
    return recipes;
  }
  
  async getRecipesByUser(username: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
  
    const user = await connection("users").where("name_user", username).first();
  
    if (!user) {
      throw new Error("User not found.");
    }
  
    const recipes = await connection("recipes")
      .where("user_id", user.id_user)
      .select("recipes.*")
      .limit(limit)
      .offset(offset);
  
    if (recipes.length === 0) {
      throw new Error("No recipes found for this user.");
    }
  
    return recipes;
  }
}
