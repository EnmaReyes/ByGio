const {
  Articulos,
  Dtf,
  Category,
} = require("../DataBase/models/index.js");
const HttpError = require("../Utils/HttpError.js");
const {
  articleTipo,
  resolvePrice,
  COMBO_TIPO,
  decorateArticle,
  decorateDtf,
} = require("./prices.js");

// El precio y la disponibilidad SIEMPRE se resuelven en el backend.
// Lo que envie el cliente (cost, precio, total) se ignora por completo.

const MAX_ITEMS = 50;
const MAX_QUANTITY = 20;

// El frontend envia "basic" | "oversize"; en la BD el tipo es "basico".
const DTF_TIPO_MAP = {
  basic: "basico",
  basico: "basico",
  oversize: "oversize",
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const firstImage = (value) => {
  if (Array.isArray(value)) return value[0] || null;
  if (typeof value === "string" && value.trim()) return value;
  return null;
};

const parseQuantity = (quantity) => {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(400, "Cantidad inválida");
  }
  if (parsed > MAX_QUANTITY) {
    throw new HttpError(400, `Máximo ${MAX_QUANTITY} unidades por producto`);
  }
  return parsed;
};

const buildPriceSnapshot = (price, productType, tipo, kind) => ({
  source: price.source,
  priceVariantId: price.priceVariantId,
  productPriceId: price.productPriceId,
  productType,
  tipo,
  kind,
  precio: Number(price.precio),
  precioAnterior: price.precioAnterior ?? null,
  capturedAt: new Date().toISOString(),
});

// ------------------------------- Articulos -------------------------------
const resolveArticle = async (item, transaction) => {
  const quantity = parseQuantity(item.quantity);

  const articulo = await Articulos.findByPk(item.productId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!articulo) {
    throw new HttpError(404, "El producto ya no existe");
  }
  if (!articulo.stock) {
    throw new HttpError(409, `"${articulo.title}" está agotado`);
  }

  const sizes = toArray(articulo.sizes);
  const oversize = Boolean(articulo.oversize);
  let size = null;

  if (!oversize) {
    const requested = String(item.size || "").trim();
    if (!requested) {
      throw new HttpError(400, `Selecciona una talla para "${articulo.title}"`);
    }
    if (!sizes.includes(requested)) {
      throw new HttpError(400, `Talla inválida para "${articulo.title}"`);
    }
    size = requested;
  }

  // Un combo es un articulo con un precio distinto. El monto vive en
  // product_prices (kind = "combo"), no en la tabla de articulos.
  const kind = articulo.combo ? "combo" : "unit";
  const tipo = articulo.combo ? COMBO_TIPO : articleTipo(articulo);

  const price = await resolvePrice({
    productType: "articulo",
    productId: articulo.id,
    tipo,
    kind,
    transaction,
  });

  if (!price) {
    throw new HttpError(
      409,
      articulo.combo
        ? "El combo no tiene un precio configurado"
        : "El producto no tiene un precio configurado",
    );
  }

  const unitPrice = Number(price.precio);
  const decorated = await decorateArticle(articulo, transaction);

  return {
    line: {
      productType: "articulo",
      productId: articulo.id,
      variantId: price.productPriceId || price.priceVariantId || null,
      title: articulo.title,
      imageUrl: firstImage(articulo.img),
      size,
      oversize,
      shirtColor: null,
      shirtName: null,
      dtfSize: null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      productSnapshot: decorated,
      priceSnapshot: buildPriceSnapshot(
        price,
        "articulo",
        tipo,
        kind,
      ),
    },
    discount: 0,
  };
};

// --------------------------------- DTF ----------------------------------
const resolveDtf = async (item, transaction) => {
  const quantity = parseQuantity(item.quantity);

  // El lock se toma solo sobre "dtfs": Postgres no permite FOR UPDATE con
  // un LEFT JOIN (la categoria se consulta aparte).
  const dtf = await Dtf.findByPk(item.productId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!dtf) {
    throw new HttpError(404, "El diseño DTF ya no existe");
  }
  if (!dtf.stock) {
    throw new HttpError(409, "El diseño DTF está agotado");
  }

  const tipo = DTF_TIPO_MAP[String(item.dtfSize || "").trim().toLowerCase()];
  if (!tipo) {
    throw new HttpError(400, "Selecciona el tamaño del DTF");
  }

  const category = await Category.findByPk(dtf.categoryId, { transaction });
  const price = await resolvePrice({
    productType: "dtf",
    productId: dtf.id,
    tipo,
    kind: "unit",
    transaction,
  });

  if (!price) {
    throw new HttpError(409, "El diseño DTF no tiene un precio configurado");
  }

  const unitPrice = Number(price.precio);
  if (unitPrice <= 0) {
    throw new HttpError(409, "El diseño DTF no tiene un precio válido");
  }

  const categoryName = category?.name || "Sin categoría";
  const decorated = await decorateDtf(dtf, transaction);

  return {
    line: {
      productType: "dtf",
      productId: dtf.id,
      variantId: price.productPriceId || price.priceVariantId || null,
      title: `Diseño DTF · ${categoryName}`,
      imageUrl: dtf.img || null,
      size: null,
      oversize: tipo === "oversize",
      shirtColor: item.shirtColor ? String(item.shirtColor).slice(0, 50) : null,
      shirtName: item.shirtName ? String(item.shirtName).slice(0, 100) : null,
      dtfSize: tipo,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      productSnapshot: {
        ...decorated,
        category: category ? category.toJSON() : null,
      },
      priceSnapshot: buildPriceSnapshot(price, "dtf", tipo, "unit"),
    },
    discount: 0,
  };
};

// ------------------------------ Carrito ---------------------------------
const buildOrderLines = async (items, transaction) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, "El carrito está vacío");
  }
  if (items.length > MAX_ITEMS) {
    throw new HttpError(400, "Demasiados productos en el pedido");
  }

  const lines = [];
  let subtotal = 0;
  let discountTotal = 0;

  for (const rawItem of items) {
    const item = rawItem || {};
    const productType = String(
      item.productType || item.type || "",
    ).toLowerCase();
    const productId = item.productId || item.id;

    if (!productId) {
      throw new HttpError(400, "Falta el producto en uno de los ítems");
    }

    let resolved = null;

    if (productType === "articulo" || productType === "article") {
      resolved = await resolveArticle({ ...item, productId }, transaction);
    } else if (productType === "dtf") {
      resolved = await resolveDtf({ ...item, productId }, transaction);
    } else {
      throw new HttpError(400, "Tipo de producto inválido");
    }

    lines.push(resolved.line);
    subtotal += resolved.line.lineTotal;
    discountTotal += resolved.discount;
  }

  return { lines, subtotal, discountTotal };
};

module.exports = { buildOrderLines, DTF_TIPO_MAP, firstImage };
