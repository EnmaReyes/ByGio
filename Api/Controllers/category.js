const jwt = require("jsonwebtoken");
const { Category } = require("../DataBase/models/Category.js");

//--------------------- Add Category ---------------------//
const addCategory = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res
        .status(401)
        .json("No estás autenticado para añadir categorías!");
    }

    jwt.verify(token, "jwtkey");

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json("El nombre de la categoría es obligatorio");
    }

    const newCategory = await Category.create({
      name: name.trim(),
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);

    // Categoría duplicada
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json("La categoría ya existe");
    }

    res.status(500).json("Error interno del servidor");
  }
};

//--------------------- Update Category ---------------------//
const updateCategory = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res
        .status(401)
        .json("No estás autenticado para modificar categorías!");
    }

    jwt.verify(token, "jwtkey");

    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json("El nombre de la categoría es obligatorio");
    }

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json("La categoría no existe");
    }

    category.name = name.trim();

    await category.save();

    res.status(200).json(category);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json("Ya existe una categoría con ese nombre");
    }

    res.status(500).json("Error interno del servidor");
  }
};

//--------------------- Get Categories ---------------------//
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error interno del servidor");
  }
};

module.exports = {
  addCategory,
  updateCategory,
  getCategories,
};
