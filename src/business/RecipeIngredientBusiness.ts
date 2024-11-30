import { connection } from "../connection";
import { RecipeIngredient } from "../models/RecipeIngredient";

export class RecipeIngredientBusiness {
  async addIngredientToRecipe(recipeIngredient: RecipeIngredient): Promise<void> {
    const exists = await connection("recipe_ingredient")
      .where({
        id_recipe: recipeIngredient.id_recipe,
        id_ingredient: recipeIngredient.id_ingredient,
      })
      .first();

    if (exists) {
      await connection("recipe_ingredient")
        .where({
          id_recipe: recipeIngredient.id_recipe,
          id_ingredient: recipeIngredient.id_ingredient,
        })
        .update({ quantity: recipeIngredient.quantity });
    } else {
      await connection("recipe_ingredient").insert(recipeIngredient);
    }
  }


  //TENHO QUE FAZER DEPOIS UM ENDPOINT QUE REMOVE O INGREDINTE DA RECEITA
  /*async removeIngredientFromRecipe(id_recipe: string, id_ingredient: string): Promise<void> {
    const exists = await connection("recipe_ingredient")
      .where({ id_recipe, id_ingredient })
      .first();

    if (!exists) throw new Error("Ingredient not associated with the recipe.");

    await connection("recipe_ingredient").where({ id_recipe, id_ingredient }).del();
  }*/

  async getRecipesByIngredient(ingredient: string, page: number, limit: number): Promise<any[]> {
    const offset = (page - 1) * limit;

    return connection("recipe_ingredient")
      .join("recipes", "recipe_ingredient.id_recipe", "recipes.id_recipe")
      .join("ingredients", "recipe_ingredient.id_ingredient", "ingredients.id_ingredient")
      .where("ingredients.name_ingredient", "ILIKE", `%${ingredient}%`)
      .select("recipes.*")
      .limit(limit)
      .offset(offset);
  }
}
