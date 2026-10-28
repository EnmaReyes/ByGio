import Hero from "../Componentes/Hero";
import CartaInicial from "../Componentes/CartaInicial";
import Banner from "../Componentes/Banner";
import Colecciones from "../Componentes/Colecciones";
import {
  ArticulosCombo,
  ArtiulosOferta,
} from "../Componentes/CartaDeArticulos";
import BandaBeneficios from "../Componentes/BandaBeneficios";

/*
 * Inicio: hero a sangre, destacados con la rejilla del catálogo,
 * el banner existente, las colecciones y las ofertas. Cierra con
 * la banda de beneficios, igual que el detalle de artículo.
 */
const Inicio = () => (
  <>
    <Hero />

    <CartaInicial />

    <Banner />

    <Colecciones />

    <ArticulosCombo limite={4} />

    <ArtiulosOferta limite={4} />

    <BandaBeneficios />
  </>
);

export default Inicio;
