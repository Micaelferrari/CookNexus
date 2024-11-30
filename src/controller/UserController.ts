import { generateId } from './../services/Generated';
import { Request, Response } from "express";
import { UserBusiness } from "../business/UserBusiness";
import { Authenticator } from "../services/Authenticator";
import bcrypt from "bcryptjs";
import { connection } from "../connection";
import { User } from "../models/UserType";

const userBusiness = new UserBusiness();

export class UserController {

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, sort = "asc", sortBy = "name_user" } = req.query;

      const users = await userBusiness.getUsers(
        Number(page),
        Number(limit),
        String(sort),
        String(sortBy)
      );

      res.status(200).json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name_user, surname, age, gender, email, password }: User = req.body;

      // Validação do corpo da requisição
      if (!name_user || name_user.length < 3 || name_user.length > 50) {
        throw new Error("Name must be between 3 and 50 characters.");
      }

      if (!surname || surname.length < 3 || surname.length > 50) {
        throw new Error("Surname must be between 3 and 50 characters.");
      }

      if (!age || age < 18) {
        throw new Error("Age must be 18 or older.");
      }

      if (!gender || !["male", "female", "other"].includes(gender)) {
        throw new Error("Gender must be one of: male, female, other.");
      }

      if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        throw new Error("Invalid email format.");
      }

      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser: User = {
        id_user: generateId(),
        name_user,
        surname,
        age,
        gender,
        email,
        password: hashedPassword,
      };

      const existUser = await connection("users").where("email", email).first();
      if (existUser) {
        throw new Error("User already exists.");
      }

      await connection("users").insert(newUser);
      res.status(201).json({ message: "User created successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Authorization token is required.");
      }

      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (id !== tokenData.id) {
        throw new Error("You are not authorized to delete this user.");
      }

      const userExists = await connection("users").where("id_user", id).first();
      if (!userExists) {
        throw new Error("User not found.");
      }

      await connection("users").where("id_user", id).del();
      res.status(200).json({ message: "User deleted successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: Partial<User> = req.body;
      const token = req.headers.authorization;

      if (!token) {
        throw new Error("Authorization token is required.");
      }

      const authenticator = new Authenticator();
      const tokenData = authenticator.getTokenData(token);

      if (id !== tokenData.id) {
        throw new Error("You are not authorized to update this user.");
      }

      // Validações no corpo da requisição para a atualização
      if (updates.name_user && (updates.name_user.length < 3 || updates.name_user.length > 50)) {
        throw new Error("Name must be between 3 and 50 characters.");
      }

      if (updates.surname && (updates.surname.length < 3 || updates.surname.length > 50)) {
        throw new Error("Surname must be between 3 and 50 characters.");
      }

      if (updates.age && updates.age < 18) {
        throw new Error("Age must be 18 or older.");
      }

      if (updates.gender && !["male", "female", "other"].includes(updates.gender)) {
        throw new Error("Gender must be one of: male, female, other.");
      }

      if (updates.email && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(updates.email)) {
        throw new Error("Invalid email format.");
      }

      if (updates.password && updates.password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      const userExists = await connection("users").where("id_user", id).first();
      if (!userExists) {
        throw new Error("User not found.");
      }

      await connection("users").where("id_user", id).update(updates);
      res.status(200).json({ message: "User updated successfully!" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validação do login
      if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
        throw new Error("Invalid email format.");
      }

      /*if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }*/               

      const user = await connection("users").where("email", email).first();
      if (!user) {
        throw new Error("User not found.");
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new Error("Invalid password.");
      }

      const authenticator = new Authenticator();
      const token = authenticator.generateToken({ id: user.id_user });

      res.status(200).json({ message: "Login successful", token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
