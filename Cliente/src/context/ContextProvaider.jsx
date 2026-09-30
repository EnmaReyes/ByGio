import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import axios from "axios";
import { API_URL } from "../config";

export const Context = createContext();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/*
 * ==========================================
 * HELPERS
 * ==========================================
 */

const parseJsonValue = (value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/*
 * ==========================================
 * FORMATEAR ARTICULOS
 * ==========================================
 */

const formatArticulos = (data) =>
  Array.isArray(data)
    ? data.map((art) => ({
        ...art,
        img: parseJsonValue(art.img),
        sizes: parseJsonValue(art.sizes),
      }))
    : [];

/*
 * ==========================================
 * FORMATEAR DTF
 * ==========================================
 *
 * El campo "img" contiene directamente
 * la imagen PNG transparente del DTF.
 */

const formatDtf = (data) =>
  Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        img: parseJsonValue(item.img),
      }))
    : [];

/*
 * ==========================================
 * CONTEXT PROVIDER
 * ==========================================
 */

export const ContextProvaider = ({ children }) => {
  /*
   * ==========================================
   * ESTADOS
   * ==========================================
   */

  const [articulos, setArticulos] = useState([]);

  // Todos los DTF
  const [dtf, setDtf] = useState([]);

  // DTF filtrados por categoría
  const [dtfCategory, setDtfCategory] = useState([]);

  // Categorías
  const [categories, setCategories] = useState([]);

  // Error global
  const [error, setError] = useState(null);

  /*
   * ==========================================
   * LOADING STATES
   * ==========================================
   */

  const [loadingArticulos, setLoadingArticulos] = useState(false);

  const [loadingDtf, setLoadingDtf] = useState(false);

  const [loadingCategories, setLoadingCategories] = useState(false);

  const [loadingDtfCategory, setLoadingDtfCategory] = useState(false);

  /*
   * ==========================================
   * REFS / CACHE
   * ==========================================
   */

  const dtfCategoryAbortRef = useRef(null);
  const dtfLoadedRef = useRef(false);
  const dtfRequestRef = useRef(null);

  /*
   * Cache de DTF por categoría.

   * Ejemplo:
   *
   * {
   *   "uuid-anime": [...],
   *   "uuid-halloween": [...]
   * }
   */
  const dtfCategoryCacheRef = useRef(new Map());

  /*
   * ==========================================
   * LOADING GLOBAL
   * ==========================================
   *
   * Mantiene compatibilidad con los componentes
   * que ya utilizan:
   *
   * const { loading } = useContextProvaider();
   */

  const loading =
    loadingArticulos || loadingDtf || loadingCategories || loadingDtfCategory;

  /*
   * ==========================================
   * OBTENER ARTICULOS
   * ==========================================
   */

  const getArticulos = useCallback(async (search = window.location.search) => {
    setLoadingArticulos(true);
    setError(null);

    try {
      const res = await api.get(`/api/posts/${search}`);

      const formattedData = formatArticulos(res.data);

      setArticulos(formattedData);

      return formattedData;
    } catch (err) {
      setError(err);

      console.error("Error al cargar articulos:", err);

      throw err;
    } finally {
      setLoadingArticulos(false);
    }
  }, []);

  /*
   * ==========================================
   * OBTENER TODOS LOS DTF
   * ==========================================
   *
   * Este request solamente obtiene TODOS los DTF.
   *
   * No se ejecuta para obtener una categoría.
   */

  const getDtf = useCallback(async () => {
    if (dtfLoadedRef.current) {
      setError(null);
      return dtf;
    }

    if (dtfRequestRef.current) {
      return dtfRequestRef.current;
    }

    setLoadingDtf(true);
    setError(null);

    const request = (async () => {
      try {
        const res = await api.get("/api/dtf");

        const formattedData = formatDtf(res.data);

        setDtf(formattedData);
        dtfLoadedRef.current = true;

        return formattedData;
      } catch (err) {
        setError(err);

        console.error("Error al cargar DTF:", err);

        if (err.response) {
          console.error("Status:", err.response.status);

          console.error("Respuesta:", err.response.data);
        }

        throw err;
      } finally {
        if (dtfRequestRef.current === request) {
          dtfRequestRef.current = null;
        }

        setLoadingDtf(false);
      }
    })();

    dtfRequestRef.current = request;

    return request;
  }, [dtf]);

  /*
   * ==========================================
   * OBTENER DTF POR CATEGORIA
   * ==========================================
   *
   * Se ejecuta solamente cuando el usuario
   * solicita una categoría.
   *
   * También utiliza cache.
   */

  const getDtfByCategory = useCallback(async (categoryId) => {
    if (!categoryId) {
      setDtfCategory([]);
      return [];
    }

    /*
     * ------------------------------------------
     * CACHE
     * ------------------------------------------
     */

    const cachedData = dtfCategoryCacheRef.current.get(categoryId);

    if (cachedData !== undefined) {
      setError(null);
      setDtfCategory(cachedData);
      setLoadingDtfCategory(false);

      return cachedData;
    }

    /*
     * ------------------------------------------
     * CANCELAR REQUEST ANTERIOR
     * ------------------------------------------
     */

    dtfCategoryAbortRef.current?.abort();

    const controller = new AbortController();

    dtfCategoryAbortRef.current = controller;

    /*
     * ------------------------------------------
     * LIMPIAR RESULTADOS ANTERIORES
     * ------------------------------------------
     *
     * Esto es lo importante.
     * Evita mostrar los DTF de la categoría
     * anterior mientras cargamos la nueva.
     */

    setDtfCategory([]);

    setLoadingDtfCategory(true);
    setError(null);

    try {
      const res = await api.get("/api/dtf/category", {
        params: {
          categoryId,
        },
        signal: controller.signal,
      });

      const formattedData = formatDtf(res.data);

      /*
       * ------------------------------------------
       * VERIFICAR QUE EL REQUEST SIGA ACTIVO
       * ------------------------------------------
       */

      if (dtfCategoryAbortRef.current !== controller) {
        return [];
      }

      /*
       * ------------------------------------------
       * GUARDAR EN CACHE
       * ------------------------------------------
       */

      dtfCategoryCacheRef.current.set(categoryId, formattedData);

      /*
       * ------------------------------------------
       * ACTUALIZAR ESTADO
       * ------------------------------------------
       *
       * Si formattedData es [],
       * se guarda [] explícitamente.
       */

      setDtfCategory(formattedData);

      return formattedData;
    } catch (err) {
      /*
       * Request cancelado
       */

      if (
        axios.isCancel(err) ||
        err.name === "CanceledError" ||
        err.code === "ERR_CANCELED"
      ) {
        return [];
      }

      setError(err);

      console.error("Error al cargar DTF por categoría:", err);

      if (err.response) {
        console.error("Status:", err.response.status);

        console.error("Respuesta:", err.response.data);
      }

      /*
       * Si la petición actual falla,
       * tampoco dejamos los DTF anteriores.
       */

      if (dtfCategoryAbortRef.current === controller) {
        setDtfCategory([]);
      }

      throw err;
    } finally {
      /*
       * Solo modificar loading si este request
       * sigue siendo el request actual.
       */

      if (dtfCategoryAbortRef.current === controller) {
        setLoadingDtfCategory(false);
      }
    }
  }, []);

  /*
   * ==========================================
   * LIMPIAR CACHE DTF
   * ==========================================
   *
   * Útil después de agregar o actualizar un DTF.
   */

  const clearDtfCache = useCallback(() => {
    dtfCategoryCacheRef.current.clear();
    dtfLoadedRef.current = false;

    setDtfCategory([]);
  }, []);

  /*
   * ==========================================
   * GUARDAR / ACTUALIZAR DTF
   * ==========================================
   */

  const saveDtf = useCallback(
    async (data, id) => {
      try {
        const response = id
          ? await api.put(`/api/dtf/${id}`, data)
          : await api.post("/api/dtf/add", data);

        /*
         * Limpiar cache porque los datos cambiaron.
         */
        clearDtfCache();

        /*
         * Actualizar lista completa.
         *
         * getDtf tiene cache, por lo que primero
         * necesitamos actualizarla explícitamente.
         */
        const res = await api.get("/api/dtf");

        const formattedData = formatDtf(res.data);

        setDtf(formattedData);
        dtfLoadedRef.current = true;

        return response.data;
      } catch (err) {
        setError(err);

        console.error("Error al guardar DTF:", err);

        throw err;
      }
    },
    [clearDtfCache],
  );

  /*
   * ==========================================
   * OBTENER CATEGORIAS
   * ==========================================
   */

  const getCategories = useCallback(
    async (force = false) => {
      if (!force && categories.length > 0) {
        return categories;
      }

      setLoadingCategories(true);
      setError(null);

      try {
        const res = await api.get("/api/category/");

        const data = Array.isArray(res.data) ? res.data : [];

        setCategories(data);

        return data;
      } catch (err) {
        setError(err);

        console.error("Error al cargar categorías:", err);

        if (err.response) {
          console.error("Status:", err.response.status);

          console.error("Respuesta:", err.response.data);
        }

        throw err;
      } finally {
        setLoadingCategories(false);
      }
    },
    [categories],
  );

  /*
   * ==========================================
   * AGREGAR CATEGORIA AL ESTADO
   * ==========================================
   *
   * Útil para tu AddCategory.
   *
   * De esta manera no necesariamente necesitas
   * volver a solicitar todas las categorías.
   */

  const addCategoryToState = useCallback((newCategory) => {
    setCategories((prev) => {
      const exists = prev.some((category) => category.id === newCategory.id);

      if (exists) {
        return prev;
      }

      return [...prev, newCategory];
    });
  }, []);

  /*
   * ==========================================
   * CARGA INICIAL
   * ==========================================
   */

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        /*
         * Artículos y categorías son independientes.
         *
         * Los DTF NO se cargan aquí automáticamente.
         *
         * Se cargarán cuando una pantalla realmente
         * solicite getDtf().
         */

        await Promise.all([getArticulos(), getCategories()]);
      } catch (err) {
        console.error("Error al cargar los datos iniciales:", err);
      }
    };

    fetchInitialData();

    return () => {
      dtfCategoryAbortRef.current?.abort();
    };
  }, [getArticulos, getCategories]);

  /*
   * ==========================================
   * CONTEXT VALUE
   * ==========================================
   */

  // API + actualización del estado
  const addCategory = useCallback(
    async (name) => {
      try {
        const res = await api.post("/api/category/addcategory", { name });

        const newCategory = res.data;

        addCategoryToState(newCategory);

        return newCategory;
      } catch (err) {
        console.error("Error al crear categoría:", err);

        if (err.response) {
          const message =
            typeof err.response.data === "string"
              ? err.response.data
              : err.response.data?.message || "Error al crear la categoría";

          throw new Error(message);
        }

        throw err;
      }
    },
    [addCategoryToState],
  );

  const value = useMemo(
    () => ({
      /*
       * DATA
       */
      articulos,
      dtf,
      dtfCategory,
      categories,

      /*
       * LOADING
       */
      loading,

      loadingArticulos,
      loadingDtf,
      loadingCategories,
      loadingDtfCategory,

      /*
       * ERROR
       */
      error,

      /*
       * ARTICULOS
       */
      getArticulos,

      /*
       * DTF
       */
      getDtf,
      getDtfByCategory,
      saveDtf,
      clearDtfCache,

      /*
       * CATEGORIAS
       */
      getCategories,
      addCategoryToState,
      addCategory,
    }),
    [
      articulos,
      dtf,
      dtfCategory,
      categories,

      loading,
      loadingArticulos,
      loadingDtf,
      loadingCategories,
      loadingDtfCategory,

      error,

      getArticulos,
      getDtf,
      getDtfByCategory,
      saveDtf,
      clearDtfCache,
      getCategories,
      addCategoryToState,
      addCategory,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useContextProvaider = () => useContext(Context);
