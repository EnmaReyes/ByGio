const { Op } = require("sequelize");
const { Articulos } = require("../DataBase/models/Articulos.js");

// CRUD de articulos.
// Las rutas de escritura estan protegidas con requireAdmin (ver Rutas/posts.js),
// por eso aqui se asume que req.user existe y es administrador.
// Las respuestas siguen la convencion de la API: strings planos.

const ARTICLE_FIELDS = [
  "title",
  "desc",
  "img",
  "sizes",
  "oversize",
  "cost",
  "stock",
  "destacadas",
  "combo",
  "descuento",
];

// Construye el objeto de escritura solo con los campos enviados, para no
// borrar datos existentes cuando el panel hace un PUT parcial.
const pickArticleFields = (body = {}) => {
  const data = {};
  for (const field of ARTICLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

const addArticle = async (req, res) => {
  try {
    const newArticule = {
      ...pickArticleFields(req.body),
      uid: req.user.id,
    };

    const createdArt = await Articulos.create(newArticule);

    res.status(201).json({
      message: "Artículo creado con éxito!",
      article: createdArt,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json(error.errors?.[0]?.message || "Datos del artículo inválidos");
    }
    console.error("Error en addArticle:", error);
    res.status(500).json("Error interno del servidor del post");
  }
};

const getArticle = async (req, res) => {
  try {
    const Article = await Articulos.findAll({
      order: [["createdAt", "DESC"]], // Último creado primero
    });
    if (!Article || Article.length === 0) {
      return res.status(404).json("No Hay Articulos");
    }
    res.status(200).json(Article);
  } catch (error) {
    console.error("Error en getArticle:", error);
    res.status(500).json("Error interno del servidor");
  }
};

// GET /api/posts/search?title=...
const getArticleByTitle = async (req, res) => {
  try {
    const articleName = String(req.query.title || "").trim();
    if (!articleName) {
      return res.status(400).json("Indica el título a buscar");
    }

    const posts = await Articulos.findAll({
      where: {
        title: {
          [Op.iLike]: `%${articleName}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    // Lista vacia es una respuesta valida, no un error.
    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error en getArticleByTitle:", error);
    return res.status(500).json("Error interno del servidor");
  }
};

const deleteArticle = async (req, res) => {
  try {
    const Article = await Articulos.findByPk(req.params.id);

    if (!Article) {
      return res.status(404).json("No se encontró el artículo");
    }

    await Article.destroy();
    return res.json("Post eliminado con éxito!");
  } catch (error) {
    console.error("Error en deleteArticle:", error);
    return res.status(500).json("Error en el servidor");
  }
};

const updateArticle = async (req, res) => {
  try {
    const Article = await Articulos.findByPk(req.params.id);

    if (!Article) {
      return res.status(404).json("No se encontró el post para actualizar");
    }

    const updatedArticle = pickArticleFields(req.body);
    await Article.update(updatedArticle);

    return res.json("Post actualizado con éxito!");
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json(error.errors?.[0]?.message || "Datos del artículo inválidos");
    }
    console.error("Error en updateArticle:", error);
    return res.status(500).json("Error interno del servidor");
  }
};

const getArticleByID = async (req, res) => {
  try {
    const articleId = req.params.id;
    const article = await Articulos.findByPk(articleId);

    if (!article) {
      return res.status(404).json("No Hay Articulos por ID");
    }
    res.status(200).json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error interno del servidor");
  }
};

module.exports = {
  addArticle,
  getArticle,
  getArticleByTitle,
  deleteArticle,
  updateArticle,
  getArticleByID,
};
