// Plantilla de Politica de Tratamiento de Datos Personales para Colombia
// (Ley 1581 de 2012, Decreto 1377 de 2013 y Decreto 1074 de 2015).
// IMPORTANTE: completar todos los campos [PENDIENTE: ...] y validar con un
// abogado antes de usarla comercialmente.

const PoliticaPrivacidad = () => {
  return (
    <div className="container py-5 mt-5" style={{ maxWidth: "860px" }}>
      <h1 className="mb-4">
        Política de Tratamiento de Protección de Datos Personales
      </h1>
      <p className="text-muted">Última actualización: 01/10/2026</p>

      <h2 className="fs-4 mt-4">1. Responsable del tratamiento</h2>
      <p>
        ByGio — Gionay Eloisa Dorado Meneses , con CI: 1017279082, domiciliada
        en Calle 63 #58c 20 Antioquia-Colombia. Correo de contacto:
        bygionay.88@gmail.com, Teléfono/WhatsApp: +57 320 3775834.
      </p>

      <h2 className="fs-4 mt-4">2. Marco legal</h2>
      <p>
        Esta política se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013,
        el Decreto 1074 de 2015 y demás normas que las modifiquen o
        complementen, sobre protección de datos personales en Colombia.
      </p>

      <h2 className="fs-4 mt-4">3. Datos personales que recolectamos</h2>
      <ul>
        <li>
          Datos de registro de cuenta: nombre, correo electrónico y contraseña
          cifrada.
        </li>
        <li>
          Datos de contacto proporcionados voluntariamente: número de WhatsApp
          al contactarnos por ese medio.
        </li>
        <li>
          Datos de navegación: páginas visitadas, interacciones y datos técnicos
          (dirección IP, tipo de navegador), recolectados mediante cookies y
          tecnologías similares solo si el usuario otorga su consentimiento (ver
          sección 7).
        </li>
      </ul>

      <h2 className="fs-4 mt-4">4. Finalidades del tratamiento</h2>
      <ul>
        <li>Crear y gestionar la cuenta del usuario.</li>
        <li>Atender consultas, pedidos y solicitudes de contacto.</li>
        <li>Realizar análisis estadísticos de uso del sitio web.</li>
        <li>
          Ejecutar campañas de mercadeo digital y remarketing mediante Meta
          Pixel, únicamente con el consentimiento del usuario.
        </li>
        <li>Cumplir obligaciones legales y contractuales.</li>
      </ul>

      <h2 className="fs-4 mt-4">5. Derechos del titular de los datos</h2>
      <p>
        Conforme al artículo 8 de la Ley 1581 de 2012, el titular puede:
        conocer, actualizar y rectificar sus datos; solicitar prueba de la
        autorización otorgada; ser informado sobre el uso de sus datos;
        presentar quejas ante la Superintendencia de Industria y Comercio (SIC);
        revocar la autorización y solicitar la supresión de sus datos cuando no
        exista un deber legal o contractual de conservarlos.
      </p>

      <h2 className="fs-4 mt-4">6. Procedimiento de consultas y reclamos</h2>
      <p>
        El titular puede ejercer sus derechos escribiendo a
        bygionay.88@gmail.com . Las consultas se resolverán en un máximo de diez
        (10) días hábiles y los reclamos en un máximo de quince (15) días
        hábiles, conforme a los artículos 14 y 15 de la Ley 1581 de 2012.
      </p>

      <h2 className="fs-4 mt-4">7. Cookies y tecnologías de seguimiento</h2>
      <p>
        Este sitio utiliza <strong>Meta Pixel (Facebook Pixel)</strong>, una
        herramienta de análisis y publicidad de Meta Platforms, Inc. que emplea
        cookies (_fbp, _fbc) para medir la navegación y la efectividad de
        campañas publicitarias. El píxel{" "}
        <strong>
          solo se carga y activa después de que el usuario acepta las cookies
        </strong>{" "}
        en el banner de consentimiento. Si el usuario rechaza, no se carga
        ningún script de Meta ni se instala ninguna cookie de seguimiento.
      </p>
      <p>
        El usuario puede modificar su decisión en cualquier momento desde el
        enlace “Preferencias de cookies” en el pie de página del sitio.
      </p>

      <h2 className="fs-4 mt-4">8. Transferencias de datos</h2>
      <p>
        Los datos de navegación recolectados por Meta Pixel pueden ser
        transferidos y almacenados en servidores de Meta Platforms, Inc. fuera
        de Colombia, bajo las políticas de privacidad de dicha empresa, en
        cumplimiento del capítulo de transferencias internacionales del Decreto
        1377 de 2013.
      </p>

      <h2 className="fs-4 mt-4">9. Seguridad y vigencia</h2>
      <p>
        Adoptamos medidas técnicas y administrativas razonables para proteger
        los datos personales. Esta política rige a partir del 10/13/2026 y
        cualquier cambio será publicado en esta misma página.
      </p>
    </div>
  );
};

export default PoliticaPrivacidad;
