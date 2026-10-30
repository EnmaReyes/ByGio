/*
 * Configuración de navegación del panel (dashboard).
 * Se centraliza aquí para que la barra lateral, las migas de pan y las
 * tarjetas de acceso de la portada usen exactamente las mismas secciones.
 *
 * `soloAdmin` marca los bloques que requieren rol de administrador.
 * `end` fuerza que el enlace solo se marque activo en su ruta exacta
 * (evita que "Inicio" quede activo en todas las subsecciones).
 */
import {
  faBell,
  faBoxOpen,
  faChartColumn,
  faChartLine,
  faCircleQuestion,
  faClipboardList,
  faGaugeHigh,
  faImage,
  faPalette,
  faShirt,
  faTags,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export const NAV_PANEL = [
  {
    grupo: "Cuenta",
    items: [
      {
        to: "/dashboard",
        label: "Inicio",
        icon: faGaugeHigh,
        end: true,
        descripcion: "Resumen de tu cuenta",
      },
      {
        to: "/dashboard/pedidos",
        label: "Mis pedidos",
        icon: faBoxOpen,
        descripcion: "Historial y seguimiento",
      },
      {
        to: "/dashboard/perfil",
        label: "Mi perfil",
        icon: faUser,
        descripcion: "Tus datos personales",
      },
      {
        to: "/dashboard/notificaciones",
        label: "Notificaciones",
        icon: faBell,
        descripcion: "Novedades de tu cuenta",
      },
      {
        to: "/dashboard/soporte",
        label: "Soporte y ayuda",
        icon: faCircleQuestion,
        descripcion: "Canales de atención",
      },
    ],
  },
  {
    grupo: "Administración",
    soloAdmin: true,
    items: [
      {
        to: "/dashboard/admin",
        label: "Resumen",
        icon: faChartLine,
        end: true,
        descripcion: "Indicadores del negocio",
      },
      {
        to: "/dashboard/admin/pedidos",
        label: "Gestionar pedidos",
        icon: faClipboardList,
        descripcion: "Ver y administrar pedidos",
      },
      {
        to: "/dashboard/admin/usuarios",
        label: "Usuarios",
        icon: faUsers,
        descripcion: "Cuentas registradas",
      },
      {
        to: "/dashboard/admin/ventas",
        label: "Contabilidad",
        icon: faChartColumn,
        descripcion: "Ventas por período",
      },
      {
        to: "/dashboard/admin/articulos",
        label: "Crear artículo",
        icon: faShirt,
        descripcion: "Publicar en el catálogo",
      },
      {
        to: "/dashboard/admin/dtf",
        label: "Crear diseño DTF",
        icon: faPalette,
        descripcion: "Subir un diseño DTF",
      },
      {
        to: "/dashboard/admin/precios",
        label: "Precios",
        icon: faTags,
        descripcion: "Tarifas globales",
      },
      {
        to: "/dashboard/admin/banners",
        label: "Editar banners",
        icon: faImage,
        descripcion: "Carrusel de la portada",
      },
    ],
  },
];

// Bloques visibles según el rol.
export const bloquesDeNav = (esAdmin) =>
  NAV_PANEL.filter((bloque) => !bloque.soloAdmin || esAdmin);

// Lista plana de enlaces visibles según el rol.
export const itemsDeNav = (esAdmin) =>
  bloquesDeNav(esAdmin).flatMap((bloque) => bloque.items);
