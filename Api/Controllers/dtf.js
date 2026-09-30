const jwt = require("jsonwebtoken");
const { Dtf } = require("../DataBase/models/Dtf");
const { Category } = require("../DataBase/models/Category");

//? Add DTF
const addDtf = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json("No estás autenticado para añadir DTF!");
    }

    jwt.verify(token, "jwtkey");

    const { categoryId, img, stock } = req.body;

    const categoryExists = await Category.findByPk(categoryId);

    if (!categoryExists) {
      return res.status(400).json("La categoría no existe");
    }

    const newDtf = await Dtf.create({
      categoryId,
      img,
      stock,
    });

    res.status(201).json(newDtf);
  } catch (error) {
    console.error(error);

    res.status(500).json("Error interno del servidor");
  }
};

//? Get DTF
const getDtf = async (req, res) => {
  try {
    const dtfItems = await Dtf.findAll({
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(dtfItems);
  } catch (error) {
    console.error("❌ ERROR GET DTF:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: error.message });
  }
};

//? Update DTF
const updateDtf = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json("No estás autenticado para actualizar DTF!");
    }

    jwt.verify(token, "jwtkey");

    const dtfId = req.params.id;

    const { categoryId, img, stock } = req.body;

    const categoryExists = await Category.findByPk(categoryId);

    if (!categoryExists) {
      return res.status(400).json("La categoría no existe");
    }

    const [rowsUpdated] = await Dtf.update(
      {
        categoryId,
        img,
        stock,
      },
      {
        where: {
          id: dtfId,
        },
      },
    );

    if (rowsUpdated === 0) {
      return res.status(404).json("No se encontró el DTF para actualizar");
    }

    res.status(200).json("DTF actualizado con éxito!");
  } catch (error) {
    console.error(error);

    res.status(500).json("Error interno del servidor");
  }
};

//? Get DTF by category
const getDtfByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json("No se proporcionó una categoría");
    }

    const categoryExists = await Category.findByPk(categoryId);

    if (!categoryExists) {
      return res.status(404).json("La categoría no existe");
    }

    const dtfItems = await Dtf.findAll({
      where: {
        categoryId,
      },

      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(dtfItems);
  } catch (error) {
    console.error(error);

    res.status(500).json("Error interno del servidor");
  }
};

module.exports = {
  addDtf,
  getDtf,
  updateDtf,
  getDtfByCategory,
};
