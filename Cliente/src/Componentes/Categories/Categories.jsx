import { useEffect } from "react";
import { Form } from "react-bootstrap";
import { useContextProvaider } from "../../context/ContextProvaider";

const Categories = ({ value, onChange }) => {
  const { categories, getCategories, loading } = useContextProvaider();

  useEffect(() => {
    if (!categories || categories.length === 0) {
      getCategories();
    }
  }, [categories, getCategories]);

  return (
    <Form.Select value={value || ""} onChange={onChange} disabled={loading}>
      <option value="">
        {loading ? "Cargando categorías..." : "Selecciona una categoría"}
      </option>

      {categories?.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </Form.Select>
  );
};

export default Categories;
