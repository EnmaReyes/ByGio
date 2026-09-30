import { Carousel, Spinner } from "react-bootstrap";
import "../App.css";
import { Link } from "react-router-dom";
import { useContextProvaider } from "../context/ContextProvaider.jsx";

const CartaInicial = () => {
  const { articulos, loadingArticulos } = useContextProvaider();
  const PhoneNumber = import.meta.env.VITE_NUMBER_PHONE;

  const generateWhatsAppLink = (art) => {
    const tallaSlected = art.oversize ? "Over size" : "S/M/L";
    const message = `¡Hola!😁 Estoy interesado en:
     ${art.title}
     Valor: $${art.cost.toLocaleString()} por unidad
     ¿Está disponible en ${tallaSlected}?`;
    const imageLink = art?.img[0];
    const whatsappLink = `https://wa.me/${PhoneNumber}?text=${encodeURIComponent(
      message,
    )}%0A%0A${encodeURIComponent(imageLink)}`;
    return whatsappLink;
  };

  return (
    <section className="inital-Container" id="most-seller">
      <Carousel
        className="initial-carousel"
        controls
        indicators
        fade
        interval={1500}
      >
        {loadingArticulos ? (
          <div className="d-flex justify-content-center align-items-center h-100 mt-2">
            <Spinner animation="border" variant="dark" />
          </div>
        ) : (
          articulos
            .filter((art) => art.destacadas === true)
            .slice(0, 4)
            .map((art, index) => (
              <Carousel.Item key={art.id}>
                <div className="carousel-items">
                  <div className="carousel-image-column">
                    {art.img ? (
                      <img
                        className="img-fluid img-carousel"
                        src={art.img[0]}
                        alt={art.title}
                      />
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <Spinner animation="border" variant="dark" />
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="carousel-copy text-md-start text-center">
                    <h2 className="fw-bold titulo-inicial">{art.title}</h2>

                    {art.oversize ? (
                      <p className="m-0">Oversize</p>
                    ) : (
                      <div className="d-flex gap-1 justify-content-center justify-content-md-start">
                        {art.sizes.map(
                          (size, i) =>
                            size !== "" && (
                              <span key={i} className="tallasCartainicial">
                                {size}
                              </span>
                            ),
                        )}
                      </div>
                    )}
                    <p className="des-inicial mt-3">{art.desc}</p>
                    <p className="parrafo-inicial mt-3">No te lo pierdas!</p>

                    <div className="mt-3">
                      <Link to={`/${art.id}`}>
                        <span className="text-muted parrafos pointer explorar-inicial">
                          Explorar
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Carousel.Item>
            ))
        )}
      </Carousel>
    </section>
  );
};

export default CartaInicial;
