const jwt = require("jsonwebtoken");
const { Dtf } = require("../DataBase/models/Dtf");

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
      category: req.body.category,
      img: req.body.img,
      cost: req.body.cost,
      costwithShirtOversize: req.body.costwithShirtOversize,
      costwithShirt: req.body.costwithShirt,
      stock: req.body.stock,
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
  addDtf,
  getDtf,
  updateDtf,
  getDtfByCategory,
};
