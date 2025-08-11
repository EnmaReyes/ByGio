const jwt = require("jsonwebtoken");
const { Banner } = require("../DataBase/models/Banner.js");

const getBanner = async (req, res) => {
  console.log("entré al get");

  try {
    const Banners = await Banner.findAll();
    if (!Banners || Banners.length === 0) {
      return res.status(404).json("No Hay Banners");
    }
    res.status(200).json(Banners);
  } catch (error) {
    res.status(500).json("Error interno del servidor");
  }
};

const addBanner = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res
        .status(401)
        .json("No estás autenticado para añadir articulos!");
    }
    const userInfo = jwt.verify(token, "jwtkey");

    const newBanner = {
      img: req.body.img,
      uid: userInfo.id,
    };
    const createdBanner = await Banner.create(newBanner);

    res.json("Articulo creado con éxito!");
  } catch (error) {
    res.status(500).json("Error interno del servidor del post");
  }
};

const EditBanner = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res
        .status(401)
        .json("No estás autenticado para actualizar Banner!");
    }

    const userInfo = jwt.verify(token, "jwtkey");
    const bannerId = req.params.id;

    // Si viene un array, convertirlo a string JSON
    const updateBanner = {
      img: Array.isArray(req.body.img)
        ? JSON.stringify(req.body.img)
        : req.body.img,
    };

    const [rowsUpdated] = await Banner.update(updateBanner, {
      where: {
        id: bannerId,
        uid: userInfo.id,
      },
    });

    if (rowsUpdated === 0) {
      return res.status(404).json("No se encontró el Banner para actualizar");
    }

    res.json("Banner actualizado con éxito!");
  } catch (error) {
    console.error(error);
    res.status(500).json("Error interno del servidor");
  }
};

const deleteBanner = async (req, res) => {
  const token = req.cookies.access_token;

  if (!token) {
    return res
      .status(401)
      .json("No estás autenticado para eliminar el Banner!");
  }
  try {
    const userInfo = jwt.verify(token, "jwtkey");
    const BannerID = req.params.id;

    const Banners = await Banner.findOne({
      where: {
        id: BannerID,
        uid: userInfo.id, // Solo permite eliminar si el post pertenece al usuario
      },
    });
    if (!Banners) {
      return res
        .status(404)
        .json("No se encontró el Banner o no tienes permisos para eliminarlo");
    }

    await Banners.destroy();
    return res.json("Banner eliminado con éxito!");
  } catch (error) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token no válido");
    }
    return res.status(500).json("Error en el servidor");
  }
};
module.exports = {
  getBanner,
  addBanner,
  EditBanner,
  deleteBanner,
};
