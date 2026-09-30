import { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

import { useContextProvaider } from "../../context/ContextProvaider";

const AddCategory = ({ show, onHide }) => {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  const { addCategory } = useContextProvaider();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = categoryName.trim();

    if (!name) {
      toast.error("El nombre de la categoría es obligatorio.");
      return;
    }

    setLoading(true);

    try {
      await toast.promise(addCategory(name), {
        pending: "Agregando categoría...",
        success: "Categoría agregada exitosamente.",
        error: "Error al crear la categoría.",
      });

      setCategoryName("");

      onHide();
    } catch (error) {
      console.error("Error al crear categoría:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setCategoryName("");
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop="static"
      keyboard={!loading}
      className="add-category-modal"
    >
      <Modal.Header className="border-0 pb-1">
        <Modal.Title className="titulos">Agregar categoría</Modal.Title>

        <button
          type="button"
          className="add-category-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Cerrar ventana"
        >
          ×
        </button>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-2">
          <Form.Group controlId="categoryName">
            <Form.Label className="titulos">Nombre de la categoría</Form.Label>

            <Form.Control
              type="text"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ej. Anime"
              autoFocus
              disabled={loading}
              maxLength={100}
              autoComplete="off"
            />

            <Form.Text className="text-muted">
              Usa un nombre corto y fácil de identificar.
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-2">
          <Button
            type="button"
            variant="outline-secondary"
            onClick={handleClose}
            disabled={loading}
            className="add-category-cancel"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="dark"
            disabled={loading || !categoryName.trim()}
            className="add-category-submit"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2"
                  aria-hidden="true"
                />
                Agregando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Agregar categoría
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddCategory;
