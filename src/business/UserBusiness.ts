import { connection } from "../connection";
import { User } from "../models/UserType";
import bcrypt from "bcryptjs";
import { generateId } from "../services/Generated";
import { Authenticator } from "../services/Authenticator";

export class UserBusiness {
  async getUsers(page: number, limit: number, sort: string, sortBy: string) {
    const offset = (page - 1) * limit;

    const validarSortBy = ["name_user", "surname", "age"];
    if (!validarSortBy.includes(sortBy)) {
      throw new Error(
        `Invalid column for sortBy. Value must be one of: ${validarSortBy.join(", ")}`
      );
    }

    const users = await connection("users")
      .select("*")
      .orderBy(sortBy, sort)
      .limit(limit)
      .offset(offset);

    if (!users.length) throw new Error("No users found.");

    return users;
  }

  async createUser(data: User) {
    const { name_user, surname, age, gender, email, password } = data;


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
    if (existUser) throw new Error("User already exists.");

    await connection("users").insert(newUser);
    return "User created successfully!";
  }

  async deleteUser(id: string, userId: string) {
    if (id !== userId) throw new Error("You are not authorized to delete this user.");

    const userExists = await connection("users").where("id_user", id).first();
    if (!userExists) throw new Error("User not found.");

    await connection("users").where("id_user", id).del();
    return "User deleted successfully!";
  }

  async updateUser(id: string, userId: string, updates: Partial<User>) {
    if (id !== userId) throw new Error("You are not authorized to update this user.");

    const userExists = await connection("users").where("id_user", id).first();
    if (!userExists) throw new Error("User not found.");

    await connection("users").where("id_user", id).update(updates);
    return "User updated successfully!";
  }

  async login(email: string, password: string) {
    const user = await connection("users").where("email", email).first();
    if (!user) throw new Error("User not found.");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("Invalid password.");

    const authenticator = new Authenticator();
    const token = authenticator.generateToken({ id: user.id_user });

    return { message: "Login successful", token };
  }
}
