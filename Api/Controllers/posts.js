const jwt = require("jsonwebtoken");
const { Articulos } = require("../DataBase/models/Articulos.js");

const addArticle = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res
        .status(401)
        .json("No estás autenticado para añadir articulos!");
    }
    const userInfo = jwt.verify(token, "jwtkey");

    const newArticule = {
      title: req.body.title,
      desc: req.body.desc,
      img: req.body.img,
      sizes: req.body.sizes,
      oversize: req.body.oversize,
      cost: req.body.cost,
      stock: req.body.stock,
      destacadas: req.body.destacadas,
      descuento: req.body.descuento,
      uid: userInfo.id,
    };
    const createdArt = await Articulos.create(newArticule);

    res.json("Articulo creado con éxito!");
  } catch (error) {
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
    res.status(500).json("Error interno del servidor");
  }
};

const getArticleByTitle = async (req, res) => {
  try {
    const articleName = req.query.title.toLowerCase();
    if (!articleName) {
      return res.status(400).json("No hay artículos");
    }
    const posts = await Articulos.findAll({
      where: {
        title: {
          [Op.iLike]: `%${articleName}%`,
        },
      },
    });
  } catch (error) {}
};

const deleteArticle = async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json("No estás autenticado para eliminar post!");
  }
  try {
    const userInfo = jwt.verify(token, "jwtkey");
    const ArticletId = req.params.id;

    const Article = await Articulos.findOne({
      where: {
        id: ArticletId,
        uid: userInfo.id, // Solo permite eliminar si el post pertenece al usuario
      },
    });
    if (!Article) {
      return res
        .status(404)
        .json("No se encontró el post o no tienes permisos para eliminarlo");
    }

    await Article.destroy();
    return res.json("Post eliminado con éxito!");
  } catch (error) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token no válido");
    }
    return res.status(500).json("Error en el servidor");
  }
};

const updateArticle = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res
        .status(401)
        .json("No estás autenticado para actualizar Articulos!");
    }

    const userInfo = jwt.verify(token, "jwtkey");

    const articletId = req.params.id;

    const updatedArticle = {
      title: req.body.title,
      desc: req.body.desc,
      img: req.body.img,
      sizes: req.body.sizes,
      oversize: req.body.oversize,
      cost: req.body.cost,
      stock: req.body.stock,
      descuento: req.body.descuento,
      destacadas: req.body.destacadas,
    };

    const [rowsUpdated] = await Articulos.update(updatedArticle, {
      where: {
        id: articletId,
        uid: userInfo.id,
      },
    });

    if (rowsUpdated === 0) {
      return res.status(404).json("No se encontró el post para actualizar");
    }

    res.json("Post actualizado con éxito!");
  } catch (error) {
    res.status(500).json("Error interno del servidor");
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
    console.error(err);
    res.status(500).json("Error interno del servidor");
  }
};

// ---------------------------- DTF Controllers ---------------------------- \\

//? Add DTF
const addDtf = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json("No estás autenticado para añadir DTF!");
    }
    const userInfo = jwt.verify(token, "jwtkey");

    const newDtf = await Dtf.create({
      category: req.body.category,
      img: req.body.img,
      cost: req.body.cost,
      costwithShirtOversize: req.body.costwithShirtOversize,
      costwithShirt: req.body.costwithShirt,
      stock: req.body.stock,
      uid: userInfo.id,
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
      order: [["createdAt", "DESC"]],
    });
    if (!dtfItems || dtfItems.length === 0) {
      return res.status(404).json("No Hay DTF");
    }
    res.status(200).json(dtfItems);
  } catch (error) {
    console.error(error);
    res.status(500).json("Error interno del servidor");
  }
};

//? update DTF
const updateDtf = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json("No estás autenticado para actualizar DTF!");
    }
    const userInfo = jwt.verify(token, "jwtkey");

    const dtfId = req.params.id;

    const updatedDtf = {
      title: req.body.title,
      category: req.body.category,
      img: req.body.img,
      cost: req.body.cost,
      stock: req.body.stock,
      descuento: req.body.descuento,
    };

    const [rowsUpdated] = await Dtf.update(updatedDtf, {
      where: {
        id: dtfId,
        uid: userInfo.id,
      },
    });

    if (rowsUpdated === 0) {
      return res.status(404).json("No se encontró el DTF para actualizar");
    }

    res.json("DTF actualizado con éxito!");
  } catch (error) {
    console.error(error);
    res.status(500).json("Error interno del servidor");
  }
};

//? Get DTF by category
const getDtfByCategory = async (req, res) => {
  try {
    const category = req.query.category;
    if (!category) {
      return res.status(400).json("No se proporcionó una categoría");
    }
    const dtfItems = await Dtf.findAll({
      where: {
        category: category,
      },
    });
    if (!dtfItems || dtfItems.length === 0) {
      return res.status(404).json("No Hay DTF en esa categoría");
    }
    res.status(200).json(dtfItems);
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
