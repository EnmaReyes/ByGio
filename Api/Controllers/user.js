import jwt from "jsonwebtoken";
import { Usuarios } from "../DataBase/models/Usuarios.js";

export const userById = async (req, res) => {
    try {
      const token = req.cookies.access_token;
      if (!token) {
        return res
          .status(401)
          .json("No estas autenticado para actualizar Usuario");
      }
      const userInfo = jwt.verify(token, "jwtkey");
  
      const user = await Usuarios.findByPk(userInfo.id);
  
      if (!user) {
        return res.status(404).json("No Hay Usuario con este ID");
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json("Error interno del servidor");
      console.log(error);
    }
  };
  
  export const updateUser = async (req, res) => {
    try {
      const token = req.cookies.access_token;
      if (!token) {
        return res
          .status(401)
          .json("No estas autenticado para actualizar Usuario");
      }
      const userInfo = jwt.verify(token, "jwtkey");
  
      const userUpdate = {
        image: req.body.image,
        email: req.body.email,
        name: req.body.name,
        lastName: req.body.lastName,
      };
  
      const [rowsUpdated] = await Usuarios.update(userUpdate, {
        where: {
          id: userInfo.id,
        },
      });
  
      if (rowsUpdated === 0) {
        return res.status(404).json("No se encontró el usuario para actualizar");
      }
      res.json("Usuario actualizado con éxito!");
    } catch (updateError) {
      console.error("Error al actualizar el usuario:", updateError);
      res.status(500).json("Error al actualizar el usuario");
    }
  };