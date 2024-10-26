import bcrypt from "bcryptjs";
import { Usuarios } from "../DataBase/models/Usuarios.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    //? Verificar usuarios existentes
    const existingUsers = await Usuarios.findAll({
      where: {
        email: req.body.email,
        username: req.body.username,
      },
    });

    if (existingUsers.length > 0) {
      return res.status(409).json("Usuario Existente");
    }
    //? Hash de contraseña y crear usuario
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = await Usuarios.create({
      email: req.body.email,
      username: req.body.username,
      password: hash,
    });
    return res.status(200).json("Usuario creado con éxito");
  } catch (error) {
    return res.status(500).json("Error en el servidor");
  }
};

export const login = async (req, res) => {
  try {
    const existingUser = await Usuarios.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!existingUser) {
      return res.status(404).json("Usuario no existente");
    }

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json("Contraseña Errada");
    }

    const token = jwt.sign(
      { id: existingUser.id, admin: existingUser.admin },
      "jwtkey"
    );

    const { password, ...other } = existingUser.toJSON();
    const isProduction = "production";

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
      })
      .status(200)
      .json(other);
  } catch (error) {
    res.status(500).json("Error interno del servidor");
  }
};
export const logout = async (req, res) => {
  try {
    res
      .clearCookie("access_token", {
        sameSite: "none",
        secure: true,
      })
      .status(204)
      .end();
  } catch (error) {
    res.status(500).json("Error interno del servidor");
  }
};
