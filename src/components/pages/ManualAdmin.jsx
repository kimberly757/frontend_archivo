import { useRef } from 'react'
import html2pdf from 'html2pdf.js'
import logoM from '../../assets/LogoM.png'
import PageHeader from '../PageHeader'

const secciones = [
  {
    id: 'introduccion',
    titulo: '1. Introducción',
    contenido: (
      <p>
        El <strong>Panel Administrativo del Archivo Regional del Folklore y Patrimonio Cultural "Luis Felipe Ramón y Rivera"</strong> es la herramienta
        central para gestionar la información de los cultores, el inventario patrimonial y
        la configuración del portal web público. Este manual le guiará a través de cada
        sección del panel para que pueda aprovechar todas sus funcionalidades.
      </p>
    ),
  },
  {
    id: 'acceso',
    titulo: '2. Acceso al Sistema',
    contenido: (
      <>
        <p>
          Para ingresar al panel administrativo, abra su navegador web y diríjase a la URL
          proporcionada por el administrador del sistema.
        </p>
        <h4>Credenciales de Acceso</h4>
        <ul>
          <li>Ingrese su <strong>correo electrónico</strong> registrado en el sistema.</li>
          <li>Ingrese su <strong>contraseña</strong> (si es su primer inicio, use la contraseña temporal).</li>
          <li>Haga clic en <strong>"Iniciar Sesión"</strong>.</li>
        </ul>
        <div className="manual-nota">
          <strong>Nota:</strong> Si ha olvidado su contraseña, use el enlace <em>"¿Olvidaste tu contraseña?"</em>
          en la pantalla de inicio para restablecerla. Se le enviará un enlace a su correo electrónico.
        </div>
        <h4>Cambio de Contraseña Temporal</h4>
        <p>
          Al iniciar sesión por primera vez con una contraseña temporal, el sistema le mostrará
          un aviso en la parte superior. Deberá cambiarla desde la sección <strong>"Mi Perfil"</strong>
          en el menú lateral, haciendo clic en <strong>"Cambiar ahora"</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'dashboard',
    titulo: '3. Dashboard',
    contenido: (
      <>
        <p>
          El Dashboard es la pantalla principal que se muestra al iniciar sesión. Aquí encontrará
          un resumen visual de las estadísticas más importantes del archivo.
        </p>
        <ul>
          <li><strong>Tarjetas de resumen:</strong> Total de cultores registrados, obras en inventario, solicitudes de registro pendientes y usuarios activos.</li>
          <li><strong>Gráficos estadísticos:</strong> Distribución de cultores por municipio, obras por tipo de patrimonio, y tendencias de registro.</li>
          <li><strong>Exportaciones rápidas:</strong> Botones para descargar reportes en PDF o Excel.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'solicitudes',
    titulo: '4. Solicitudes de Registro',
    contenido: (
      <>
        <p>
          Esta sección permite gestionar las solicitudes de registro enviadas por los
          cultores desde el portal web público.
        </p>
        <h4>Revisar Solicitudes</h4>
        <ul>
          <li>Las solicitudes pendientes aparecen listadas con los datos del solicitante.</li>
          <li>Puede <strong>aprobar</strong> o <strong>rechazar</strong> cada solicitud.</li>
          <li>Al aprobar, el sistema genera automáticamente las credenciales de acceso para el cultor.</li>
          <li>Opcionalmente, puede registrar un cultor de forma manual usando el botón <strong>"Registro Manual"</strong>.</li>
        </ul>
        <h4>Notificaciones</h4>
        <p>
          Al aprobar o rechazar una solicitud, el sistema notifica al cultor vía correo electrónico
          y mediante notificaciones en el portal web.
        </p>
      </>
    ),
  },
  {
    id: 'directorio',
    titulo: '5. Directorio de Cultores',
    contenido: (
      <>
        <p>
          El Directorio de Cultores muestra todos los cultores registrados en el archivo.
          Aquí puede buscar, visualizar y editar la información de cada cultor.
        </p>
        <h4>Funcionalidades</h4>
        <ul>
          <li><strong>Búsqueda:</strong> Filtre por nombre, apellido, cédula, oficio o municipio.</li>
          <li><strong>Ver perfil:</strong> Haga clic en un cultor para ver todos sus datos y obras asociadas.</li>
          <li><strong>Editar:</strong> Modifique la información personal, foto de perfil y datos de contacto.</li>
          <li><strong>Exportar ficha:</strong> Descargue la ficha completa de un cultor en PDF.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'inventario',
    titulo: '6. Inventario Patrimonial',
    contenido: (
      <>
        <p>
          El Inventario Patrimonial gestiona las obras y expresiones culturales postuladas
          por los cultores. Cada obra debe ser revisada y aprobada por un administrador.
        </p>
        <h4>Gestión de Obras</h4>
        <ul>
          <li><strong>Revisar obras:</strong> Filtre por estado (pendiente, aprobada, rechazada).</li>
          <li><strong>Aprobar/Rechazar:</strong> Cada obra pendiente tiene botones para aprobarla o rechazarla con un comentario.</li>
          <li><strong>Ver detalle:</strong> Haga clic en una obra para ver su información completa, incluyendo imágenes y documentos.</li>
          <li><strong>Editar:</strong> Modifique los datos de la obra si es necesario.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'salas',
    titulo: '7. Gestión de Salas y Ubicaciones',
    contenido: (
      <>
        <p>
          El módulo de Gestión de Salas permite administrar los espacios físicos y de
          depósito donde se ubican las obras del inventario patrimonial. Puede crear,
          editar y deshabilitar salas, así como mover obras entre ellas.
        </p>
        <h4>Tipos de Salas</h4>
        <ul>
          <li><strong>Exhibición:</strong> Espacios abiertos al público para la exposición de obras (código EXH-XXX).</li>
          <li><strong>Almacén:</strong> Áreas de resguardo cerradas al público (código ALM-XXX).</li>
          <li><strong>Taller:</strong> Espacios de restauración o producción (código TLL-XXX).</li>
        </ul>
        <h4>Crear una Sala</h4>
        <ul>
          <li>Haga clic en <strong>"Nueva Sala"</strong> en la cabecera del módulo.</li>
          <li>Seleccione el <strong>tipo de espacio</strong> (Exhibición, Almacén o Taller).</li>
          <li>Ingrese el <strong>nombre de la sala</strong> y, opcionalmente, una <strong>descripción</strong> y la <strong>capacidad máxima</strong> de obras.</li>
          <li>El sistema generará automáticamente un código único (Ej: EXH-001, ALM-015).</li>
          <li>Haga clic en <strong>"Guardar"</strong> para registrarla.</li>
        </ul>
        <h4>Vista General (KPIs)</h4>
        <ul>
          <li>El panel superior muestra el total de obras en exhibición, en almacén y en taller, calculadas automáticamente según la ubicación de cada obra.</li>
        </ul>
        <h4>Acciones por Sala</h4>
        <ul>
          <li><strong>Ver Ficha:</strong> Haga clic en el ojo para ver los detalles de la sala y las obras que contiene.</li>
          <li><strong>Editar:</strong> Modifique el nombre, tipo, descripción o capacidad de una sala existente.</li>
          <li><strong>Trasladar Obras:</strong> Seleccione una sala de destino para mover todas las obras de una sala a otra.</li>
          <li><strong>Deshabilitar Sala:</strong> Marque una sala como deshabilitada. Si tiene obras asignadas, deberá seleccionar una sala de destino para reubicarlas antes de deshabilitar.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'configuracion',
    titulo: '8. Configuración del Portal Web',
    contenido: (
      <>
        <p>
          Esta sección permite personalizar el contenido del portal web público del
          Archivo de Folklore.
        </p>
        <h4>Opciones de Configuración</h4>
        <ul>
          <li><strong>Portada principal:</strong> Cambie la imagen de portada y el texto de bienvenida.</li>
          <li><strong>Sección Acerca de:</strong> Modifique la descripción institucional y la imagen representativa.</li>
          <li><strong>Eventos y Efemérides:</strong> Gestione los eventos culturales y fechas conmemorativas que se muestran al público.</li>
          <li><strong>Galería:</strong> Administre las imágenes de la galería multimedia del portal.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'usuarios',
    titulo: '9. Gestión de Usuarios',
    contenido: (
      <>
        <p>
          En Gestión de Usuarios puede administrar las cuentas de los administradores
          del sistema. Solo los usuarios con rol de superadministrador pueden acceder
          a esta sección.
        </p>
        <h4>Acciones Disponibles</h4>
        <ul>
          <li><strong>Crear usuario:</strong> Registre un nuevo administrador con su correo y rol.</li>
          <li><strong>Editar usuario:</strong> Modifique el nombre, correo o rol de un usuario existente.</li>
          <li><strong>Desactivar/Activar:</strong> Suspenda o reactive el acceso de un usuario.</li>
          <li><strong>Restablecer contraseña:</strong> Envíe una nueva contraseña temporal al usuario.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'reportes',
    titulo: '10. Reportes y Catálogo',
    contenido: (
      <>
        <p>
          La sección de Reportes y Catálogo permite generar documentos y exportaciones
          con la información del archivo para fines administrativos y de difusión.
        </p>
        <h4>Reportes Disponibles</h4>
        <ul>
          <li><strong>Catálogo consolidado:</strong> Listado completo de cultores y obras en formato PDF.</li>
          <li><strong>Reporte de cultores:</strong> Exporte la lista de cultores en PDF o Excel.</li>
          <li><strong>Reporte de obras:</strong> Exporte el inventario de obras en Excel.</li>
          <li><strong>Obras por municipio:</strong> Reporte agrupado por ubicación geográfica.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'perfil',
    titulo: '11. Perfil y Cambio de Contraseña',
    contenido: (
      <>
        <p>
          Desde la sección <strong>"Mi Perfil"</strong> en el menú lateral (icono de candado)
          puede actualizar su información personal y cambiar su contraseña.
        </p>
        <h4>Cambiar Contraseña</h4>
        <ul>
          <li>Ingrese su <strong>contraseña actual</strong>.</li>
          <li>Ingrese su <strong>nueva contraseña</strong> (mínimo 8 caracteres, al menos una mayúscula y un carácter especial).</li>
          <li>Confirme la nueva contraseña.</li>
          <li>Haga clic en <strong>"Guardar Cambios"</strong>.</li>
        </ul>
        <div className="manual-nota">
          <strong>Recomendación:</strong> Cambie su contraseña periódicamente y no la comparta con nadie.
        </div>
      </>
    ),
  },
]

export default function ManualAdmin() {
  const contentRef = useRef(null)

  const descargarPDF = () => {
    const el = contentRef.current
    if (!el) return
    const opt = {
      margin: [0, 0, 0, 0],
      filename: 'Manual_Admin_Archivo_Folklore.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }
    html2pdf().set(opt).from(el).save()
  }

  return (
    <div className="manual-page">
      <PageHeader
        breadcrumbs={[
          { label: 'ARCHIVO' },
          { label: 'MANUAL DE USO', active: true },
        ]}
        title="Manual de Uso"
        description="Panel Administrativo · Archivo de Folklore Región Táchira"
        actionButton={
          <button className="ph-action-btn" onClick={descargarPDF}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Descargar PDF</span>
          </button>
        }
      />

      <div className="manual-content" ref={contentRef}>
        <div className="manual-portada">
          <img src={logoM} alt="Museo del Táchira" className="h-24 w-auto mx-auto mb-4" />
          <h2>Archivo Regional del Folklore y Patrimonio Cultural</h2>
          <h3>"LUIS FELIPE RAMÓN Y RIVERA"</h3>
          <p className="manual-portada-sub">Manual de Uso — Panel Administrativo</p>
          <p className="manual-portada-version">Versión 1.0</p>
        </div>

        <div className="manual-indice">
          <h3>Índice</h3>
          <ol>
            {secciones.map((s) => (
              <li key={s.id}>{s.titulo.replace(/^\d+\.\s*/, '')}</li>
            ))}
          </ol>
        </div>

        {secciones.map((s) => (
          <section key={s.id} id={s.id} className="manual-seccion">
            <h3>{s.titulo}</h3>
            {s.contenido}
          </section>
        ))}

        <div className="manual-footer-page">
          <p>Archivo Regional del Folklore y Patrimonio Cultural "Luis Felipe Ramón y Rivera" — Documento generado electrónicamente</p>
        </div>
      </div>

      <style>{`
        .manual-page {
          padding: 24px 32px;
        }
        .manual-content {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          padding: 48px 56px;
          font-family: 'Work Sans', system-ui, sans-serif;
          color: #2c1e19;
          line-height: 1.7;
        }
        .manual-portada {
          text-align: center;
          padding: 32px 20px 24px;
          border-bottom: 2px solid #f0ebe0;
          margin-bottom: 24px;
        }
        .manual-portada h2 {
          font-family: 'Libre Caslon Text', Georgia, serif;
          font-size: 28px;
          margin: 0 0 6px;
          color: #2c1e19;
        }
        .manual-portada h3 {
          font-family: 'Work Sans', system-ui, sans-serif;
          font-size: 14px;
          letter-spacing: 0.15em;
          color: #807471;
          margin: 0 0 16px;
          font-weight: 500;
        }
        .manual-portada-sub {
          font-size: 15px;
          color: #5c4631;
          margin: 0 0 6px;
        }
        .manual-portada-version {
          font-size: 12px;
          color: #a09080;
        }
        .manual-indice {
          background: #f9f6ef;
          border-radius: 12px;
          padding: 20px 28px;
          margin-bottom: 24px;
        }
        .manual-indice h3 {
          font-family: 'Work Sans', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #807471;
          margin: 0 0 12px;
        }
        .manual-indice ol {
          margin: 0;
          padding-left: 20px;
        }
        .manual-indice li {
          font-size: 14px;
          color: #2c1e19;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .manual-seccion {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f0ebe0;
        }
        .manual-seccion:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .manual-seccion h3 {
          font-family: 'Libre Caslon Text', Georgia, serif;
          font-size: 20px;
          color: #2c1e19;
          margin: 0 0 12px;
        }
        .manual-seccion p,
        .manual-seccion ul,
        .manual-seccion ol,
        .manual-seccion li,
        .manual-seccion h3,
        .manual-seccion h4 {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .manual-seccion h4 {
          font-family: 'Work Sans', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #5c4631;
          margin: 14px 0 6px;
        }
        .manual-seccion p {
          font-size: 14px;
          color: #3d322b;
          margin: 0 0 8px;
        }
        .manual-seccion ul {
          margin: 0 0 8px;
          padding-left: 20px;
        }
        .manual-seccion li {
          font-size: 14px;
          color: #3d322b;
          margin-bottom: 4px;
        }
        .manual-nota {
          page-break-inside: avoid;
          break-inside: avoid;
          border-left: 4px solid #d4a68c;
          padding: 10px 14px;
          border-radius: 0 8px 8px 0;
          margin: 12px 0;
          font-size: 13px;
          color: #5c4631;
        }
        .manual-footer-page {
          text-align: center;
          padding-top: 12px;
          margin-top: 4px;
          border-top: 2px solid #f0ebe0;
        }
        .manual-footer-page p {
          font-size: 11px;
          color: #a09080;
          margin: 0;
        }
        @media (max-width: 768px) {
          .manual-page { padding: 16px; }
          .manual-content { padding: 24px 20px; }
          .manual-portada h2 { font-size: 22px; }
          .manual-portada-sub { font-size: 13px; }
          .manual-seccion h3 { font-size: 17px; }
        }
        @media (max-width: 480px) {
          .manual-page { padding: 12px; }
          .manual-content { padding: 16px 14px; border-radius: 12px; }
          .manual-portada { padding: 20px 12px 16px; }
          .manual-portada h2 { font-size: 18px; }
          .manual-portada h3 { font-size: 12px; }
          .manual-portada-sub { font-size: 12px; }
          .manual-indice { padding: 14px 16px; }
          .manual-seccion h3 { font-size: 15px; }
          .manual-seccion p,
          .manual-seccion li { font-size: 13px; }
        }
        @media print {
          .manual-page { padding: 0; }
          .manual-content { box-shadow: none; border-radius: 0; padding: 20px; }
        }
      `}</style>
    </div>
  )
}
