// Plantilla de Terminos y Condiciones para Colombia.
// Base: Ley 1480 de 2011 (Estatuto del Consumidor), Decreto 587 de 2016
// (comercio electronico) y Ley 527 de 1999.
// IMPORTANTE: completar todos los campos [PENDIENTE: ...] y validar con un
// abogado antes de habilitar la pasarela de pago.

const TerminosCondiciones = () => {
  return (
    <div className="container py-5" style={{ maxWidth: "860px" }}>
      <h1 className="mb-4">Términos y Condiciones de Uso</h1>
      <p className="text-muted">Última actualización: 01/10/2026</p>

      <h2 className="fs-4 mt-4">1. Titular del sitio</h2>
      <p>
        Este sitio web es operado por ByGio — Gionay Eloisa Dorado Meneses , con
        CI: 1017279082, domiciliada en Calle 63 #58c 20 Antioquia-Colombia.
        Correo de contacto: bygionay.88@gmail.com, Teléfono/WhatsApp: +57 320
        3775834.
      </p>

      <h2 className="fs-4 mt-4">2. Objeto y naturaleza del sitio</h2>
      <p>
        Actualmente este sitio funciona como{" "}
        <strong>catálogo de productos</strong>. Los precios mostrados son
        referenciales, están expresados en pesos colombianos (COP) y pueden
        cambiar sin previo aviso. Los pedidos se concretan por los canales de
        contacto oficiales (WhatsApp/Instagram). Cuando se habilite la venta en
        línea con pasarela de pago, estos términos se actualizarán y se
        informará al usuario antes de la compra.
      </p>

      <h2 className="fs-4 mt-4">3. Cuenta de usuario</h2>
      <p>
        El usuario es responsable de la veracidad de los datos registrados y de
        la confidencialidad de su contraseña. ByGio podrá suspender cuentas que
        incumplan estos términos o la legislación aplicable.
      </p>

      <h2 className="fs-4 mt-4">4. Productos personalizados (DTF)</h2>
      <p>
        Los productos de impresión DTF se confeccionan conforme a las
        especificaciones del cliente (diseños, medidas y cantidades). Una vez
        confirmado y aprobado el diseño por el cliente, el pedido se considera
        personalizado.
      </p>

      <h2 className="fs-4 mt-4">5. Derecho de retracto</h2>
      <p>
        Conforme al artículo 47 de la Ley 1480 de 2011 y el Decreto 587 de 2016,
        en las ventas a distancia el consumidor podrá ejercer el derecho de
        retracto dentro de los cinco (5) días hábiles siguientes a la entrega,
        siempre que el producto no se haya usado y se devuelva en las mismas
        condiciones.{" "}
        <strong>
          Este derecho NO aplica para bienes confeccionados conforme a las
          especificaciones del consumidor
        </strong>{" "}
        (productos DTF personalizados), según el numeral 2 del mismo artículo.
      </p>

      <h2 className="fs-4 mt-4">6. Garantías</h2>
      <p>
        Los productos cuentan con la garantía legal establecida en la Ley 1480
        de 2011. Para hacerla efectiva, el cliente deberá presentar el
        comprobante de compra y reportar el defecto dentro del término de la
        garantía.{" "}
        {/*[PENDIENTE: definir condiciones y plazos comerciales de
        garantía adicionales, si aplica]*/}
      </p>

      <h2 className="fs-4 mt-4">7. Pagos y reversa del pago</h2>
      <p>
        Cuando se habilite la pasarela de pago, los pagos serán procesados por
        un tercero autorizado. Si el pago es rechazado o duplicado por causas no
        atribuibles al consumidor, este podrá solicitar la reversa del pago
        conforme al artículo 51 de la Ley 1480 de 2011.{" "}
        {/*[PENDIENTE: actualizar
        al activar la pasarela de pago]*/}
      </p>

      <h2 className="fs-4 mt-4">8. Propiedad intelectual</h2>
      <p>
        Los contenidos del sitio (fotografías, textos, logotipos y marca ByGio)
        son propiedad de ByGio o de sus licenciantes y no pueden reproducirse
        sin autorización. El cliente que envía diseños para impresión DTF
        declara tener los derechos para usar dichos diseños y exime a ByGio de
        cualquier reclamación de terceros.
      </p>

      <h2 className="fs-4 mt-4">9. Legislación aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República de Colombia.
        Cualquier controversia se resolverá ante los jueces de Atioquia.
      </p>
    </div>
  );
};

export default TerminosCondiciones;
