const { Op } = require("sequelize");
const {
  PriceVariant,
  ProductPrice,
} = require("../DataBase/models/index.js");

const PRODUCT_TYPES = ["articulo", "dtf"];
const ARTICLE_TIPOS = ["basico", "oversize"];

const toPlain = (row) => (row?.toJSON ? row.toJSON() : row);

const normalizePrevious = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const articleTipo = (articulo) =>
  articulo?.oversize ? "oversize" : "basico";

// tipo que usa un combo: no depende de la talla
const COMBO_TIPO = "unico";

// Resuelve el precio de un producto. La excepcion activa gana sobre la
// tarifa global. Devuelve null si no hay ninguna fila valida.
const resolvePrice = async ({
  productType,
  productId,
  tipo,
  kind = "unit",
  transaction,
}) => {
  const [global, override] = await Promise.all([
    PriceVariant.findOne({
      where: { productType, tipo, activo: true },
      transaction,
    }),
    ProductPrice.findOne({
      where: {
        productType,
        productId,
        tipo,
        kind,
        activo: true,
      },
      transaction,
    }),
  ]);

  const source = override || global;

  if (!source) return null;

  const precio = Number(source.precio);
  if (!Number.isFinite(precio) || precio <= 0) return null;

  return {
    ...toPlain(source),
    precio,
    precioAnterior: normalizePrevious(source.precioAnterior),
    source: override ? "product" : "global",
    priceVariantId: global?.id || null,
    productPriceId: override?.id || null,
  };
};

const getGlobalPriceMap = async (productType, transaction) => {
  const rows = await PriceVariant.findAll({
    where: { productType, activo: true },
    transaction,
  });

  return new Map(rows.map((row) => [row.tipo, row]));
};

const getOverrides = async (productType, productIds, transaction) => {
  if (!productIds.length) return [];

  const rows = await ProductPrice.findAll({
    where: {
      productType,
      productId: { [Op.in]: productIds },
      activo: true,
    },
    transaction,
  });

  return rows.map(toPlain);
};

const findOverride = (overrides, productId, tipo, kind) =>
  overrides.find(
    (row) =>
      row.productId === productId &&
      row.tipo === tipo &&
      row.kind === kind,
  ) || null;

const buildPriceFields = (price, source) => ({
  precio: Number(price?.precio) || null,
  precioAnterior: normalizePrevious(price?.precioAnterior),
  priceSource: source,
});

// Agrega los precios resueltos a una lista de articulos. Hace 2 consultas
// en total, no una por producto.
const decorateArticles = async (articulos, transaction) => {
  const list = (articulos || []).map(toPlain);
  if (list.length === 0) return [];

  const [globalMap, overrides] = await Promise.all([
    getGlobalPriceMap("articulo", transaction),
    getOverrides(
      "articulo",
      list.map((articulo) => articulo.id),
      transaction,
    ),
  ]);

  return list.map((articulo) => {
    const tipo = articleTipo(articulo);
    const global = globalMap.get(tipo);

    const unitOverride = findOverride(
      overrides,
      articulo.id,
      tipo,
      "unit",
    );
    const comboOverride = findOverride(
      overrides,
      articulo.id,
      COMBO_TIPO,
      "combo",
    );

    const unitPrice = unitOverride || global;
    const effective = articulo.combo ? comboOverride : unitPrice;

    const unitFields = buildPriceFields(
      unitPrice,
      unitOverride ? "product" : global ? "global" : null,
    );
    const effectiveSource = articulo.combo
      ? comboOverride
        ? "product"
        : null
      : unitOverride
        ? "product"
        : global
          ? "global"
          : null;
    const effectiveFields = buildPriceFields(effective, effectiveSource);

    return {
      ...articulo,
      ...effectiveFields,
      // Precio de la tarifa unitaria, por si la UI necesita mostrarlo
      // aunque el articulo sea combo.
      precioUnitario: unitFields.precio,
      precioUnitarioAnterior: unitFields.precioAnterior,
      precioCombo: comboOverride
        ? Number(comboOverride.precio) || null
        : null,
      precioAnteriorCombo: normalizePrevious(
        comboOverride?.precioAnterior,
      ),
      tieneCombo: Boolean(articulo.combo && comboOverride),
    };
  });
};

const decorateArticle = async (articulo, transaction) => {
  const [decorated] = await decorateArticles([articulo], transaction);
  return decorated;
};

// Agrega priceVariants (compatibilidad con el frontend actual) y los campos
// precio/precioAnterior a una lista de DTF.
const decorateDtfs = async (dtfs, transaction) => {
  const list = (dtfs || []).map(toPlain);
  if (list.length === 0) return [];

  const [globalMap, overrides] = await Promise.all([
    getGlobalPriceMap("dtf", transaction),
    getOverrides(
      "dtf",
      list.map((dtf) => dtf.id),
      transaction,
    ),
  ]);

  return list.map((dtf) => {
    const priceVariants = ARTICLE_TIPOS.map((tipo) => {
      const override = findOverride(
        overrides,
        dtf.id,
        tipo,
        "unit",
      );
      const global = globalMap.get(tipo);
      const source = override || global;

      return {
        id: source?.id || `${dtf.id}:${tipo}`,
        tipo,
        precio: Number(source?.precio) || null,
        precioAnterior: normalizePrevious(source?.precioAnterior),
        activo: source ? source.activo !== false : false,
        source: override ? "product" : global ? "global" : null,
        productPriceId: override?.id || null,
        priceVariantId: global?.id || null,
      };
    });

    const basico = priceVariants.find((variant) => variant.tipo === "basico");

    return {
      ...dtf,
      priceVariants,
      precio: basico?.precio || null,
      precioAnterior: basico?.precioAnterior || null,
      priceSource: basico?.source || null,
    };
  });
};

const decorateDtf = async (dtf, transaction) => {
  const [decorated] = await decorateDtfs([dtf], transaction);
  return decorated;
};

module.exports = {
  PRODUCT_TYPES,
  ARTICLE_TIPOS,
  COMBO_TIPO,
  articleTipo,
  normalizePrevious,
  resolvePrice,
  decorateArticles,
  decorateArticle,
  decorateDtfs,
  decorateDtf,
  getGlobalPriceMap,
  getOverrides,
};
