const jwt = require("jsonwebtoken");
const { JWT_SECRET, DTF_PRICE_BASICO, DTF_PRICE_OVERSIZE } = require("../config.js");
const { Dtf } = require("../DataBase/models/Dtf");
const { Category } = require("../DataBase/models/Category");
const { DtfPriceVariant } = require("../DataBase/models/DtfPriceVariant");
const { sequelize } = require("../DataBase/db.js");

// Precios por defecto: hoy el unico diferenciador es el tipo.
const DEFAULT_DTF_PRICES = [
  { tipo: "basico", precio: DTF_PRICE_BASICO },
  { tipo: "oversize", precio: DTF_PRICE_OVERSIZE },
];

const sanitizeVariants = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    return DEFAULT_DTF_PRICES;
  }

  return variants.map((variant) => ({
    tipo: String(variant.tipo || "").trim(),
    precio: Number(variant.precio),
    medidas: variant.medidas ? String(variant.medidas).trim() : null,
    color: variant.color ? String(variant.color).trim() : null,
    activo: variant.activo === undefined ? true : Boolean(variant.activo),
  }));
};

//? Add DTF
const addDtf = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const token = req.cookies.access_token;

    if (!token) {
      await transaction.rollback();
      return res.status(401).json("No estás autenticado para añadir DTF!");
    }

    const userInfo = jwt.verify(token, JWT_SECRET);

    const { categoryId, img, stock, priceVariants } = req.body;

    const categoryExists = await Category.findByPk(categoryId);

    if (!categoryExists) {
      await transaction.rollback();
      return res.status(400).json("La categoría no existe");
    }

    const variants = sanitizeVariants(priceVariants);

    for (const variant of variants) {
      if (!variant.tipo || !Number.isFinite(variant.precio) || variant.precio < 0) {
        await transaction.rollback();
        return res.status(400).json("Variante de precio inválida");
      }
    }

    const newDtf = await Dtf.create(
      {
        categoryId,
        img,
        stock,
        uid: userInfo.id,
      },
      { transaction },
    );

    await DtfPriceVariant.bulkCreate(
      variants.map((variant) => ({ ...variant, dtfId: newDtf.id })),
      { transaction },
    );

    await transaction.commit();

    res.status(201).json(newDtf);
  } catch (error) {
    await transaction.rollback();

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json("Ese diseño ya tiene una variante con el mismo tipo/medida/color");
    }

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
        {
          model: DtfPriceVariant,
          as: "priceVariants",
          attributes: ["id", "tipo", "precio", "medidas", "color", "activo"],
        },
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

    jwt.verify(token, JWT_SECRET);

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
        {
          model: DtfPriceVariant,
          as: "priceVariants",
          attributes: ["id", "tipo", "precio", "medidas", "color", "activo"],
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
