import React, { useEffect, useState, useRef } from 'react'
import {
  Search,
  FileText,
  DownloadCloud,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import './ReportesCatalogo.css'
import {
  getReportesResumenRequest,
  getObrasAdminRequest,
  exportarCultoresPdfRequest,
  exportarCultoresExcelRequest,
  exportarObrasCsvRequest,
  exportarObrasPorMunicipioExcelRequest,
  exportarCatalogoConsolidadoRequest,
  exportarFichaCultorRequest,
} from '../../services/api'

const MUNICIPIO_COLORS = ['#B4533C', '#A87F32', '#5D4037', '#807471', '#707C55', '#c9a227']

function formatearFechaCorta(fechaISO) {
  if (!fechaISO) return 'Sin fecha'
  return new Date(fechaISO).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Gráfica SVG de línea: Tendencia de Crecimiento ──────────────────────────
function LineChart({ puntos }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  const W = 380
  const H = 160
  const PAD_LEFT = 42
  const PAD_RIGHT = 12
  const PAD_TOP = 14
  const PAD_BOTTOM = 28

  const maxValor = Math.max(...puntos.map((p) => p.acumulado), 1)
  // Techo redondeado para que el máximo no quede pegado al borde superior
  const techo = maxValor <= 5 ? maxValor + 1 : Math.ceil(maxValor * 1.15)

  const chartW = W - PAD_LEFT - PAD_RIGHT
  const chartH = H - PAD_TOP - PAD_BOTTOM

  const cx = (i) => PAD_LEFT + (puntos.length > 1 ? (i / (puntos.length - 1)) * chartW : chartW / 2)
  const cy = (v) => PAD_TOP + chartH - (v / techo) * chartH

  // Curva suave (Catmull-Rom → Bezier, tensión 0.4) en vez de segmentos rectos.
  const puntosXY = puntos.map((p, i) => [cx(i), cy(p.acumulado)])
  const TENSION = 0.4 / 3
  let linePath = puntosXY.length
    ? `M ${puntosXY[0][0].toFixed(1)} ${puntosXY[0][1].toFixed(1)}`
    : ''
  for (let i = 0; i < puntosXY.length - 1; i++) {
    const [x0, y0] = puntosXY[i === 0 ? i : i - 1]
    const [x1, y1] = puntosXY[i]
    const [x2, y2] = puntosXY[i + 1]
    const [x3, y3] = puntosXY[i + 2 < puntosXY.length ? i + 2 : i + 1]
    const cp1x = x1 + (x2 - x0) * TENSION
    const cp1y = y1 + (y2 - y0) * TENSION
    const cp2x = x2 - (x3 - x1) * TENSION
    const cp2y = y2 - (y3 - y1) * TENSION
    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  const areaPath = `${linePath} L ${cx(puntos.length - 1).toFixed(1)} ${(PAD_TOP + chartH).toFixed(1)} L ${cx(0).toFixed(1)} ${(PAD_TOP + chartH).toFixed(1)} Z`

  // Etiquetas eje Y: 0, mitad, techo (sin líneas de cuadrícula: diseño "Modern Heritage" limpio)
  const yLabels = [0, Math.round(techo / 2), techo]

  return (
    <div className="svg-chart-container" style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B4533C" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#B4533C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {yLabels.map((v, i) => (
          <text key={i} x={PAD_LEFT - 6} y={cy(v) + 3} textAnchor="end" className="svg-axis-text">{v}</text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#lineAreaGradient)" />

        {/* Line */}
        <path d={linePath} className="svg-chart-line" />

        {/* X-axis labels & dots */}
        {puntos.map((p, i) => (
          <g key={p.mes}>
            <text x={cx(i)} y={H - 4} textAnchor="middle" className="svg-axis-text">{p.mes}</text>
            <circle
              cx={cx(i)}
              cy={cy(p.acumulado)}
              r="4.5"
              className="svg-chart-dot"
              onMouseEnter={(e) => {
                const svgRect = svgRef.current?.getBoundingClientRect()
                if (!svgRect) return
                const scaleX = svgRect.width / W
                const scaleY = svgRect.height / H
                setTooltip({
                  x: cx(i) * scaleX,
                  y: cy(p.acumulado) * scaleY,
                  mes: p.mes,
                  acumulado: p.acumulado,
                  nuevas: p.cantidad,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip flotante */}
      {tooltip && (
        <div
          className="line-chart-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y - 52,
          }}
        >
          <span className="tooltip-mes">{tooltip.mes}</span>
          <span className="tooltip-acumulado">Total: <strong>{tooltip.acumulado}</strong></span>
          <span className="tooltip-nuevas">Nuevas: <strong>{tooltip.nuevas}</strong></span>
        </div>
      )}
    </div>
  )
}

const ReportesCatalogo = () => {
  const [resumen, setResumen] = useState(null)
  const [catalogList, setCatalogList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [modalMunicipios, setModalMunicipios] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('auth-token')
      const [reportesData, obrasData] = await Promise.all([
        getReportesResumenRequest(token),
        getObrasAdminRequest(token),
      ])
      setResumen(reportesData)
      setLastUpdated(new Date())
      setCatalogList(obrasData.map((obra) => ({
        id: obra.id_obra,
        cultorId: obra.cultor?.id_cultor || null,
        title: obra.titulo || 'Sin título',
        author: obra.cultor ? `${obra.cultor.primer_nombre || ''} ${obra.cultor.primer_apellido || ''}`.trim() : 'Sin cultor asociado',
        technique: obra.categoria?.nombre || 'Sin categoría',
        date: formatearFechaCorta(obra.fecha_postulacion),
      })))
    } catch (err) {
      console.error('Error al cargar reportes y catálogo:', err)
      setError(err.message || 'No se pudo cargar la información de reportes y catálogo.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // States
  const [catalogQuery, setCatalogQuery] = useState('')
  const [isDownloading, setIsDownloading] = useState({
    pdf: false,
    excel: false,
    cultoresExcel: false,
    municipioExcel: false,
    consolidated: false
  })
  const [notificationMsg, setNotificationMsg] = useState('')

  // Filter catalog list
  const filteredCatalog = catalogList.filter(item =>
    item.title.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    item.author.toLowerCase().includes(catalogQuery.toLowerCase()) ||
    item.technique.toLowerCase().includes(catalogQuery.toLowerCase())
  )

  // Descarga real del archivo generado por el backend (PDF o CSV según el formato)
  const handleExportFile = async (format, label, downloadFn) => {
    if (isDownloading[format]) return

    setIsDownloading(prev => ({ ...prev, [format]: true }))
    setNotificationMsg('')

    try {
      const token = localStorage.getItem('auth-token')
      await downloadFn(token)
      setNotificationMsg(`¡Descarga completada! Se ha generado el archivo "${label}" correctamente.`)
    } catch (err) {
      console.error(`Error al exportar ${format}:`, err)
      setNotificationMsg(`No se pudo generar el archivo "${label}": ${err.message}`)
    } finally {
      setIsDownloading(prev => ({ ...prev, [format]: false }))
    }
  }

  return (
    <div className="reportes-module-container">
      {/* 1. Cabecera de la Sección */}
      <header className="page-header">
        <div className="breadcrumbs-title">
          <nav className="breadcrumbs">
            <span>ARCHIVO</span>
            <span className="separator">&gt;</span>
            <span className="current">REPORTES Y CATÁLOGO</span>
          </nav>
          <h1>Reportes y Catálogo Digital</h1>
          <p className="cultor-subinfo text-light" style={{ fontSize: '14px', marginTop: '4px' }}>
            Análisis estadístico del patrimonio y exportación de catálogos para investigadores.
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="charts-loading-state">
          <div className="loading-spinner" />
          <span>Consultando datos del sistema...</span>
        </div>
      )}
      {!isLoading && error && (
        <div className="charts-error-state">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className="btn-retry" onClick={fetchData}>
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && resumen && (
      <>
      {/* 2. Panel de Indicadores (KPIs) */}
      <section className="kpis-grid">
        {/* KPI 1 */}
        <div className="kpi-card kpi-cultores">
          <span className="kpi-label">Total Cultores Registrados</span>
          <div className="kpi-value-row">
            <span className="kpi-value">{resumen.totalCultores.toLocaleString('es-VE')}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card kpi-inventario">
          <span className="kpi-label">Piezas en Inventario</span>
          <div className="kpi-value-row">
            <span className="kpi-value">{resumen.totalObras.toLocaleString('es-VE')}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card kpi-consultas">
          <span className="kpi-label">Categorías de Patrimonio</span>
          <div className="kpi-value-row">
            <span className="kpi-value">{resumen.totalCategorias.toLocaleString('es-VE')}</span>
          </div>
        </div>
      </section>

      {/* 3. Sección de Gráficos de Análisis */}
      <div className="charts-section-header">
        <span className="live-badge">
          <span className="live-dot" />
          Datos en vivo
        </span>
        {lastUpdated && (
          <span className="last-updated-text">
            Actualizado: {lastUpdated.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button
          className="btn-refresh-charts"
          onClick={fetchData}
          disabled={isLoading}
          title="Recargar datos"
        >
          <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
          Recargar
        </button>
      </div>

      <section className="charts-grid">
        {/* Left Chart: Patrimonio por Municipio */}
        <div className="chart-card municipio-chart-card">
          <div className="chart-card-header">
            <h3>Patrimonio por Municipio</h3>
            <span className="chart-total-badge">
              {resumen.totalObras} obra{resumen.totalObras !== 1 ? 's' : ''} en inventario
              &nbsp;&bull;&nbsp;
              {resumen.patrimonioPorMunicipio.length} municipios
            </span>
          </div>

          <div className="municipio-bars-container">
            {resumen.patrimonioPorMunicipio.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Aún no hay obras con ubicación registrada.</p>
            )}
            {resumen.patrimonioPorMunicipio.slice(0, 5).map((item, index) => (
              <div className={`municipio-bar-item${item.cantidad === 0 ? ' sin-obras' : ''}`} key={item.municipio}>
                <div className="municipio-bar-label-row">
                  <span className="municipio-name">{item.municipio}</span>
                  <span className="municipio-stats">
                    <strong>{item.cantidad}</strong> obra{item.cantidad !== 1 ? 's' : ''}
                    <span className="municipio-pct">{item.porcentaje}%</span>
                  </span>
                </div>
                <div className="municipio-bar-track">
                  <div className="municipio-bar-fill" style={{ width: `${item.porcentaje}%`, backgroundColor: MUNICIPIO_COLORS[index % MUNICIPIO_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>

          {resumen.patrimonioPorMunicipio.length > 5 && (
            <button className="btn-ver-municipios" onClick={() => setModalMunicipios(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 8l4 4-4 4M7 16l-4-4 4-4"/><line x1="21" y1="12" x2="3" y2="12"/></svg>
              Ver todos los municipios ({resumen.patrimonioPorMunicipio.length})
            </button>
          )}
        </div>

        {/* Right Chart: Growth Line Chart via Inline SVG */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Tendencia de Crecimiento del Inventario</h3>
            {resumen.tendenciaMensual.length > 0 && (
              <span className="chart-total-badge">
                {resumen.tendenciaMensual.at(-1)?.acumulado ?? 0} acumuladas
              </span>
            )}
          </div>
          {resumen.tendenciaMensual.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 'auto 0' }}>Aún no hay obras con fecha registrada.</p>
          ) : (
            <LineChart puntos={resumen.tendenciaMensual} />
          )}
        </div>
      </section>

      {/* ===== MODAL: Todos los Municipios ===== */}
      {modalMunicipios && (
        <div className="municipios-modal-overlay" onClick={() => setModalMunicipios(false)}>
          <div className="municipios-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="municipios-modal-header">
              <div>
                <h2 className="municipios-modal-title">Patrimonio por Municipio</h2>
                <p className="municipios-modal-subtitle">
                  {resumen.totalObras} obra{resumen.totalObras !== 1 ? 's' : ''} en el inventario — {resumen.patrimonioPorMunicipio.reduce((s, i) => s + i.cantidad, 0)} con municipio registrado en {resumen.patrimonioPorMunicipio.filter(i => i.cantidad > 0).length} de {resumen.patrimonioPorMunicipio.length} municipios
                </p>
              </div>
              <button className="municipios-modal-close" onClick={() => setModalMunicipios(false)} aria-label="Cerrar">
                ×
              </button>
            </div>


            {/* Lista completa en dos columnas */}
            <div className="municipios-modal-grid">
              {resumen.patrimonioPorMunicipio.map((item, index) => (
                <div className={`modal-mun-item${item.cantidad === 0 ? ' modal-mun-empty' : ''}`} key={item.municipio}>
                  <div className="modal-mun-header">
                    <div className="modal-mun-dot" style={{ backgroundColor: item.cantidad > 0 ? MUNICIPIO_COLORS[index % MUNICIPIO_COLORS.length] : '#d9d4cf' }} />
                    <span className="modal-mun-name">{item.municipio}</span>
                    <span className="modal-mun-count">{item.cantidad}</span>
                  </div>
                  <div className="modal-mun-bar-track">
                    <div
                      className="modal-mun-bar-fill"
                      style={{
                        width: `${item.porcentaje}%`,
                        backgroundColor: item.cantidad > 0 ? MUNICIPIO_COLORS[index % MUNICIPIO_COLORS.length] : '#e8e4e0',
                      }}
                    />
                  </div>
                  {item.cantidad > 0 && (
                    <span className="modal-mun-pct">{item.porcentaje}% del total</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Módulo de Exportación y Catálogo */}
      <section className="export-catalog-card">
        {/* Left Column: Technical Reports */}
        <div className="export-column">
          <div>
            <h3>Exportación de Reportes Técnicos</h3>
            <p>Descarga informes consolidados formateados para revisiones gubernamentales, auditorías y memoria académica.</p>
          </div>

          <div className="export-buttons-stack">
            <button
              className="btn-export-pdf"
              disabled={isDownloading.pdf}
              onClick={() => handleExportFile('pdf', 'reporte_cultores_registrados.pdf', exportarCultoresPdfRequest)}
            >
              <FileText size={18} />
              <span>{isDownloading.pdf ? 'Generando PDF...' : 'Descargar Registros de Cultores PDF'}</span>
            </button>

            <button
              className="btn-export-excel"
              disabled={isDownloading.excel}
              onClick={() => handleExportFile('excel', 'inventario_obras.xlsx', exportarObrasCsvRequest)}
            >
              <FileText size={18} />
              <span>{isDownloading.excel ? 'Generando Excel...' : 'Descargar Excel de Registro por Región'}</span>
            </button>

            <button
              className="btn-export-cultores-excel"
              disabled={isDownloading.cultoresExcel}
              onClick={() => handleExportFile('cultoresExcel', 'reporte_cultores_registrados.xlsx', exportarCultoresExcelRequest)}
            >
              <FileText size={18} />
              <span>{isDownloading.cultoresExcel ? 'Generando Excel...' : 'Descargar Excel de Cultores'}</span>
            </button>

            <button
              className="btn-export-municipio-excel"
              disabled={isDownloading.municipioExcel}
              onClick={() => handleExportFile('municipioExcel', 'patrimonio_por_municipio.xlsx', exportarObrasPorMunicipioExcelRequest)}
            >
              <FileText size={18} />
              <span>{isDownloading.municipioExcel ? 'Generando Excel...' : 'Descargar Patrimonio por Municipio'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Searchable Catalog */}
        <div className="catalog-column">
          <div>
            <h3>Catálogo Digital e Investigadores</h3>
            <p>Filtrar y exportar fichas técnicas estructuradas específicas para citaciones en proyectos de investigación y difusión.</p>
          </div>

          {/* Search bar inside catalog */}
          <div className="catalog-search-wrapper">
            <Search className="search-input-icon" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar catálogo para exportación (Ej. Vasija, Cera...)" 
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
            />
          </div>

          {/* Simple Table list */}
          <div className="catalog-table-wrapper">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>TÍTULO</th>
                  <th>CULTOR</th>
                  <th>TÉCNICA</th>
                  <th className="text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700' }}>{item.title}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{item.date}</span>
                        </div>
                      </td>
                      <td>{item.author}</td>
                      <td>{item.technique}</td>
                      <td className="text-right">
                        <button
                          className="btn-export-inline"
                          disabled={!item.cultorId || isDownloading[`ficha-${item.id}`]}
                          onClick={() => handleExportFile(
                            `ficha-${item.id}`,
                            `ficha_cultor_${item.cultorId}.pdf`,
                            (token) => exportarFichaCultorRequest(item.cultorId, token)
                          )}
                        >
                          {isDownloading[`ficha-${item.id}`] ? 'Generando...' : 'Exportar Ficha'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No se encontraron coincidencias en el catálogo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </>
      )}

      {/* Notification Banner */}
      {notificationMsg && (
        <div className="success-banner-alert" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg('')} style={{ color: 'inherit', fontWeight: '700', border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Cerrar</button>
        </div>
      )}

      {/* 5. Botón de Acción Principal */}
      <footer className="consolidated-action-container">
        <button
          className="btn-consolidated-pdf"
          disabled={isDownloading.consolidated}
          onClick={() => handleExportFile('consolidated', 'catalogo_consolidado_archivo.pdf', exportarCatalogoConsolidadoRequest)}
        >
          <DownloadCloud size={18} />
          <span>
            {isDownloading.consolidated 
              ? 'Consolidando Catálogo Completo (PDF)...' 
              : 'Generar Catálogo Consolidado del Archivo (PDF Completo)'
            }
          </span>
        </button>
      </footer>
    </div>
  )
}

export default ReportesCatalogo
