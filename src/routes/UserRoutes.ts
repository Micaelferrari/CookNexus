import { Router } from "express";
import { UserController } from "../controller/UserController";

const userController = new UserController();
const UserRoutes = Router();

UserRoutes.get("/", userController.getUsers.bind(userController));
UserRoutes.post("/", userController.createUser.bind(userController));
UserRoutes.delete("/:id", userController.deleteUser.bind(userController));
UserRoutes.put("/:id", userController.updateUser.bind(userController));
UserRoutes.post("/login", userController.login.bind(userController));

export default UserRoutes;
