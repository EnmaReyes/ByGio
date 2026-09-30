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

const formatArticulos = (data) =>
  Array.isArray(data)
    ? data.map((art) => ({
        ...art,
        img: parseJsonValue(art.img),
        sizes: parseJsonValue(art.sizes),
      }))
    : [];

const formatDtf = (data) =>
  Array.isArray(data)
    ? data.map((item) => ({
        ...item,
        img: parseJsonValue(item.img),
      }))
    : [];

/*
 * ==========================================
 * PROVIDER
 * ==========================================
 */

export const ContextProvaider = ({ children }) => {
  /*
   * ========================================
   * DATA
   * ========================================
   */

  const [articulos, setArticulos] = useState([]);
  const [dtf, setDtf] = useState([]);
  const [dtfCategory, setDtfCategory] = useState([]);
  const [categories, setCategories] = useState([]);

  const [error, setError] = useState(null);

  /*
   * ========================================
   * LOADING STATES
   * ========================================
   */

  const [loadingArticulos, setLoadingArticulos] = useState(false);
  const [loadingDtf, setLoadingDtf] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingDtfCategory, setLoadingDtfCategory] = useState(false);

  // Loading exclusivamente de la carga inicial
  const [loadingInitial, setLoadingInitial] = useState(true);

  /*
   * ========================================
   * REFS - ARTICULOS
   * ========================================
   */

  const articulosRequestRef = useRef(null);
  const articulosRequestKeyRef = useRef(null);

  /*
   * ========================================
   * REFS - DTF
   * ========================================
   */

  const dtfRef = useRef([]);
  const dtfLoadedRef = useRef(false);
  const dtfRequestRef = useRef(null);

  /*
   * ========================================
   * REFS - CATEGORIES
   * ========================================
   */

  const categoriesRef = useRef([]);
  const categoriesLoadedRef = useRef(false);
  const categoriesRequestRef = useRef(null);

  /*
   * ========================================
   * REFS - DTF CATEGORY
   * ========================================
   */

  const dtfCategoryAbortRef = useRef(null);
  const dtfCategoryCacheRef = useRef(new Map());

  /*
   * ========================================
   * KEEP REFS SYNCHRONIZED
   * ========================================
   */

  useEffect(() => {
    dtfRef.current = dtf;
  }, [dtf]);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  /*
   * ========================================
   * GET ARTICULOS
   * ========================================
   */

  const getArticulos = useCallback(async (search = window.location.search) => {
    const requestKey = search || "";

    /*
     * Si ya existe una petición para exactamente
     * la misma búsqueda, reutilizamos esa petición.
     */
    if (
      articulosRequestRef.current &&
      articulosRequestKeyRef.current === requestKey
    ) {
      return articulosRequestRef.current;
    }

    setLoadingArticulos(true);
    setError(null);

    const request = (async () => {
      try {
        const res = await api.get(`/api/posts/${requestKey}`);

        const formattedData = formatArticulos(res.data);

        setArticulos(formattedData);

        return formattedData;
      } catch (err) {
        setError(err);

        console.error("Error al cargar articulos:", err);

        throw err;
      } finally {
        if (articulosRequestRef.current === request) {
          articulosRequestRef.current = null;
          articulosRequestKeyRef.current = null;
        }

        setLoadingArticulos(false);
      }
    })();

    articulosRequestRef.current = request;
    articulosRequestKeyRef.current = requestKey;

    return request;
  }, []);

  /*
   * ========================================
   * GET DTF
   * ========================================
   */

  const getDtf = useCallback(async () => {
    /*
     * Ya tenemos los DTF cargados.
     */
    if (dtfLoadedRef.current) {
      setError(null);
      return dtfRef.current;
    }

    /*
     * Ya existe una petición.
     * Reutilizamos la misma.
     */
    if (dtfRequestRef.current) {
      return dtfRequestRef.current;
    }

    setLoadingDtf(true);
    setError(null);

    const request = (async () => {
      try {
        const res = await api.get("/api/dtf");

        const formattedData = formatDtf(res.data);

        dtfRef.current = formattedData;
        dtfLoadedRef.current = true;

        setDtf(formattedData);

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
  }, []);

  /*
   * ========================================
   * GET DTF BY CATEGORY
   * ========================================
   */

  const getDtfByCategory = useCallback(async (categoryId) => {
    /*
     * Si no hay categoría seleccionada,
     * limpiamos solamente el resultado.
     */
    if (!categoryId) {
      setDtfCategory([]);
      return [];
    }

    /*
     * Revisamos primero la caché.
     */
    if (dtfCategoryCacheRef.current.has(categoryId)) {
      const cachedData = dtfCategoryCacheRef.current.get(categoryId);

      setDtfCategory(cachedData);

      return cachedData;
    }

    /*
     * Cancelamos la petición anterior si todavía existe.
     *
     * Esto evita que una respuesta vieja llegue después
     * y sobrescriba la categoría actualmente seleccionada.
     */
    if (dtfCategoryAbortRef.current) {
      dtfCategoryAbortRef.current.abort();
    }

    const controller = new AbortController();

    dtfCategoryAbortRef.current = controller;

    /*
     * IMPORTANTE:
     *
     * NO hacemos:
     *
     * setDtfCategory([]);
     *
     * antes de la petición.
     *
     * De esta manera la UI conserva los DTF actuales
     * mientras llegan los nuevos.
     */

    setLoadingDtfCategory(true);
    setError(null);

    try {
      const res = await api.get(`/api/dtf/category?categoryId=${categoryId}`, {
        signal: controller.signal,
      });

      /*
       * Verificamos que esta siga siendo
       * la petición activa.
       */
      if (dtfCategoryAbortRef.current !== controller) {
        return [];
      }

      const formattedData = formatDtf(res.data);

      /*
       * Guardamos en caché.
       */
      dtfCategoryCacheRef.current.set(categoryId, formattedData);

      setDtfCategory(formattedData);

      return formattedData;
    } catch (err) {
      /*
       * Axios puede devolver diferentes códigos
       * dependiendo de la versión.
       */
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return [];
      }

      setError(err);

      console.error("Error al cargar DTF por categoría:", err);

      if (dtfCategoryAbortRef.current === controller) {
        setDtfCategory([]);
      }

      throw err;
    } finally {
      if (dtfCategoryAbortRef.current === controller) {
        dtfCategoryAbortRef.current = null;
        setLoadingDtfCategory(false);
      }
    }
  }, []);

  /*
   * ========================================
   * CLEAR DTF CACHE
   * ========================================
   */

  const clearDtfCache = useCallback(() => {
    /*
     * Caché de DTF generales.
     */
    dtfLoadedRef.current = false;
    dtfRef.current = [];

    /*
     * Caché por categoría.
     */
    dtfCategoryCacheRef.current.clear();

    /*
     * No necesitamos borrar inmediatamente
     * los DTF visibles.
     *
     * Esto evita un flash visual innecesario.
     */
  }, []);

  /*
   * ========================================
   * SAVE DTF
   * ========================================
   */

  const saveDtf = useCallback(
    async (data, id) => {
      try {
        const response = id
          ? await api.put(`/api/dtf/${id}`, data)
          : await api.post("/api/dtf/add", data);

        /*
         * Invalidamos las cachés.
         */
        clearDtfCache();

        /*
         * Volvemos a cargar los DTF mediante
         * la misma función centralizada.
         *
         * Esto mantiene loadingDtf consistente.
         */
        await getDtf();

        return response.data;
      } catch (err) {
        setError(err);

        console.error("Error al guardar DTF:", err);

        if (err.response) {
          console.error("Status:", err.response.status);
          console.error("Respuesta:", err.response.data);
        }

        throw err;
      }
    },
    [clearDtfCache, getDtf],
  );

  /*
   * ========================================
   * GET CATEGORIES
   * ========================================
   */

  const getCategories = useCallback(async (force = false) => {
    /*
     * Si ya están cargadas y no se pidió
     * una actualización forzada, usamos memoria.
     */
    if (!force && categoriesLoadedRef.current) {
      return categoriesRef.current;
    }

    /*
     * Si ya existe una petición activa,
     * reutilizamos esa misma petición.
     *
     * Esto evita varias llamadas simultáneas.
     */
    if (categoriesRequestRef.current) {
      return categoriesRequestRef.current;
    }

    setLoadingCategories(true);
    setError(null);

    const request = (async () => {
      try {
        const res = await api.get("/api/category/");

        const data = Array.isArray(res.data) ? res.data : [];

        categoriesRef.current = data;
        categoriesLoadedRef.current = true;

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
        if (categoriesRequestRef.current === request) {
          categoriesRequestRef.current = null;
        }

        setLoadingCategories(false);
      }
    })();

    categoriesRequestRef.current = request;

    return request;
  }, []);

  /*
   * ========================================
   * ADD CATEGORY TO STATE
   * ========================================
   */

  const addCategoryToState = useCallback((newCategory) => {
    setCategories((prev) => {
      const exists = prev.some((category) => category.id === newCategory.id);

      if (exists) {
        return prev;
      }

      const updatedCategories = [...prev, newCategory];

      /*
       * Actualizamos también la ref para que
       * getCategories() no devuelva información vieja.
       */
      categoriesRef.current = updatedCategories;

      return updatedCategories;
    });
  }, []);

  /*
   * ========================================
   * ADD CATEGORY
   * ========================================
   */

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

  /*
   * ========================================
   * INITIAL DATA
   * ========================================
   *
   * SOLO carga lo necesario para el inicio.
   *
   * Los DTF NO se cargan aquí.
   */

  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async () => {
      setLoadingInitial(true);

      try {
        /*
         * Ambas peticiones comienzan al mismo tiempo.
         */
        await Promise.all([getArticulos(), getCategories()]);
      } catch (err) {
        console.error("Error al cargar los datos iniciales:", err);
      } finally {
        if (mounted) {
          setLoadingInitial(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      mounted = false;

      /*
       * Cancelamos solamente la petición
       * de DTF por categoría.
       */
      if (dtfCategoryAbortRef.current) {
        dtfCategoryAbortRef.current.abort();
      }
    };
  }, [getArticulos, getCategories]);

  /*
   * ========================================
   * GLOBAL LOADING
   * ========================================
   */

  const loading = loadingInitial;

  /*
   * ========================================
   * CONTEXT VALUE
   * ========================================
   */

  const contextValue = useMemo(
    () => ({
      /*
       * DATA
       */
      articulos,
      dtf,
      dtfCategory,
      categories,

      /*
       * LOADING GLOBAL
       */
      loading,
      loadingInitial,

      /*
       * LOADING INDIVIDUAL
       */
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
       * CATEGORIES
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
      loadingInitial,

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

  /*
   * ========================================
   * PROVIDER
   * ========================================
   */

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

/*
 * ==========================================
 * CUSTOM HOOK
 * ==========================================
 */

export const useContextProvaider = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error(
      "useContextProvaider debe utilizarse dentro de ContextProvaider",
    );
  }

  return context;
};
