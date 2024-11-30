import { Router } from "express";
import { IngredientController } from "../controller/IngredientController";

const ingredientController = new IngredientController();
const IngredientRoutes = Router();

IngredientRoutes.get("/", ingredientController.getIngredients.bind(ingredientController));
IngredientRoutes.post("/", ingredientController.createIngredient.bind(ingredientController));
IngredientRoutes.patch("/:id", ingredientController.updateIngredient.bind(ingredientController));
IngredientRoutes.delete("/:id", ingredientController.deleteIngredient.bind(ingredientController));

export default IngredientRoutes;
