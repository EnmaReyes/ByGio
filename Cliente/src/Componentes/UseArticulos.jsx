import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useLocation } from "react-router-dom";

const URL = API_URL;

export function useArticulos() {
  const [articulo, setArticulo] = useState([]);
  const location = useLocation().search;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${URL}/api/posts/${location}`);
        const data = res.data;
        const formattedData = Array.isArray(data)
          ? data.map((art) => ({
              ...art,
              img: typeof art.img === "string" ? JSON.parse(art.img) : art.img,
              sizes:
                typeof art.sizes === "string"
                  ? JSON.parse(art.sizes)
                  : art.sizes,
            }))
          : [];
        setArticulo(formattedData);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [location]);

  return articulo;
}
