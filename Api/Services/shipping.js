const { ShippingRate } = require("../DataBase/models/index.js");
const { WAREHOUSE_LAT, WAREHOUSE_LNG } = require("../config.js");
const HttpError = require("../Utils/HttpError.js");

const ZONES = ["medellin", "antioquia", "nacional"];

// Normaliza texto para comparar sin tildes ni mayusculas: "Medellín" -> "medellin"
const normalize = (value) =>
  String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Zona segun departamento/ciudad:
//  - Medellin  -> rangos por distancia
//  - Antioquia (otro municipio) -> tarifa plana departamental
//  - resto del pais -> tarifa plana nacional
const resolveZone = ({ department, city }) => {
  const dept = normalize(department);
  const cityName = normalize(city);

  if (dept.includes("antioquia")) {
    return cityName.includes("medellin") ? "medellin" : "antioquia";
  }
  return "nacional";
};

// Distancia en linea recta (haversine) entre el punto de despacho y el cliente
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isValidCoord = (value) => Number.isFinite(Number(value));

// Elige la tarifa aplicable. Las coordenadas son opcionales: si no llegan,
// se usa la tarifa marcada como isDefault de la zona.
const quoteShipping = async ({
  department,
  city,
  lat,
  lng,
  transaction,
} = {}) => {
  if (!department || !city) {
    throw new HttpError(400, "Departamento y ciudad son obligatorios");
  }

  const zone = resolveZone({ department, city });

  const rates = await ShippingRate.findAll({
    where: { zone, active: true },
    order: [
      ["isDefault", "DESC"],
      ["minKm", "ASC"],
    ],
    ...(transaction ? { transaction } : {}),
  });

  if (rates.length === 0) {
    throw new HttpError(503, "No hay tarifas de envío configuradas");
  }

  const withCoords = isValidCoord(lat) && isValidCoord(lng);
  let distanceKm = null;
  let rate = null;

  if (withCoords) {
    distanceKm = haversineKm(
      WAREHOUSE_LAT,
      WAREHOUSE_LNG,
      Number(lat),
      Number(lng),
    );

    rate = rates.find((r) => {
      const min = r.minKm === null ? null : Number(r.minKm);
      const max = r.maxKm === null ? null : Number(r.maxKm);
      const okMin = min === null || distanceKm >= min;
      const okMax = max === null || distanceKm < max;
      return okMin && okMax;
    });
  }

  if (!rate) {
    rate = rates.find((r) => r.isDefault) || rates[0];
  }

  return {
    zone,
    rateId: rate.id,
    label: rate.label,
    cost: Number(rate.price),
    distanceKm:
      distanceKm === null ? null : Math.round(distanceKm * 100) / 100,
  };
};

// Listado publico (checkout) agrupado por zona
const listShippingRates = async () => {
  const rates = await ShippingRate.findAll({
    where: { active: true },
    order: [
      ["zone", "ASC"],
      ["minKm", "ASC"],
    ],
  });

  return rates.map((rate) => ({
    id: rate.id,
    zone: rate.zone,
    label: rate.label,
    minKm: rate.minKm === null ? null : Number(rate.minKm),
    maxKm: rate.maxKm === null ? null : Number(rate.maxKm),
    price: Number(rate.price),
    isDefault: rate.isDefault,
  }));
};

module.exports = {
  ZONES,
  normalize,
  resolveZone,
  haversineKm,
  quoteShipping,
  listShippingRates,
};
