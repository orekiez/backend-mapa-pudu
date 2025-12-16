import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Modal, Button, Form, ProgressBar, Table, Toast, ToastContainer, Badge } from 'react-bootstrap';
import L from 'leaflet';
import axios from 'axios';
import './App.css';

// URL DE TU API (Backend en Railway)
const API_URL = 'https://backend-mapa-pudu-production.up.railway.app/api/puntos/';

// --- SISTEMA DE ICONOS ---
const tiposResiduo = {
  'Vidrio':   { color: '#198754', icon: 'bi-cup-straw', label: 'Vidrio' },
  'Plástico': { color: '#0dcaf0', icon: 'bi-water', label: 'Plástico' },
  'Cartón':   { color: '#ffc107', icon: 'bi-box-seam', label: 'Cartón' },
  'General':  { color: '#6c757d', icon: 'bi-trash', label: 'General' },
  'Usuario':  { color: '#dc3545', icon: 'bi-geo-alt-fill', label: 'Yo' }
};

const crearIconoPro = (tipo) => {
  const config = tiposResiduo[tipo] || tiposResiduo['General'];
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="background-color: ${config.color}" class="marker-pin"></div>
      <i class="bi ${config.icon} marker-icon"></i>
    `,
    iconSize: [40, 42],
    iconAnchor: [20, 42],
    popupAnchor: [0, -45]
  });
};

function App() {
  const [puntos, setPuntos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [vista, setVista] = useState('mapa'); // 'mapa' o 'lista'
  const [showModal, setShowModal] = useState(false);
  
  // Estado para la Notificación (Toast)
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [formulario, setFormulario] = useState({ 
      id: null, 
      nombre: '', 
      latitud: 0, 
      longitud: 0, 
      estado_llenado: 0, 
      tipo_residuo: 'Vidrio' 
  });
  
  const [miUbicacion, setMiUbicacion] = useState(null);

  // --- CARGAR DATOS ---
  const cargarPuntos = async () => {
    try {
      const res = await axios.get(API_URL);
      if (Array.isArray(res.data)) {
        setPuntos(res.data);
      } else {
        setPuntos([]); 
      }
    } catch (error) {
      console.error("Error cargando mapa:", error);
      setPuntos([]); 
    }
  };

  useEffect(() => { cargarPuntos(); }, []);

  const listaSegura = Array.isArray(puntos) ? puntos : [];
  const puntosVisibles = filtro === 'Todos' 
      ? listaSegura 
      : listaSegura.filter(p => p.tipo_residuo === filtro);

  // --- GUARDAR ---
  const guardarPunto = async () => {
    try {
      if (formulario.id) {
        await axios.put(`${API_URL}${formulario.id}/`, formulario);
        mostrarNotificacion("✅ Punto actualizado correctamente");
      } else {
        await axios.post(API_URL, formulario);
        mostrarNotificacion("🎉 ¡Nuevo punto creado con éxito!");
      }
      setShowModal(false);
      cargarPuntos();
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar. Revisa la consola.");
    }
  };

  const mostrarNotificacion = (mensaje) => {
    setToastMsg(mensaje);
    setShowToast(true);
  };

  // --- ELIMINAR ---
  const eliminarPunto = async () => {
    if (!formulario.id) return; 
    const confirmar = window.confirm("⚠️ ¿Estás seguro de eliminar este punto?");
    if (confirmar) {
        try {
            await axios.delete(`${API_URL}${formulario.id}/`);
            mostrarNotificacion("🗑️ Punto eliminado");
            setShowModal(false); 
            cargarPuntos();      
        } catch (error) {
            alert("No se pudo eliminar.");
        }
    }
  };

  const abrirEdicion = (punto) => {
    setFormulario({
      id: punto.id,
      nombre: punto.nombre,
      latitud: punto.latitud,
      longitud: punto.longitud,
      estado_llenado: punto.estado_llenado,
      tipo_residuo: punto.tipo_residuo
    });
    setShowModal(true);
  };

  const DetectorClics = () => {
    useMapEvents({
      click(e) {
        setFormulario({ 
          id: null, 
          nombre: '', 
          latitud: e.latlng.lat, 
          longitud: e.latlng.lng, 
          estado_llenado: 0, 
          tipo_residuo: 'Vidrio' 
        });
        setShowModal(true);
      },
    });
    return null;
  };

  const BotonGPS = () => {
    const map = useMap();
    const irAMiUbicacion = () => {
      map.locate().on("locationfound", (e) => {
        setMiUbicacion(e.latlng);
        map.flyTo(e.latlng, 15, { duration: 1.5 });
      });
    };
    return (
      <button className="gps-fab" onClick={irAMiUbicacion} title="Mi Ubicación">
        <i className="bi bi-crosshair"></i>
      </button>
    );
  };

  const getColorBarra = (valor) => {
      if (valor >= 90) return 'danger';
      if (valor >= 50) return 'warning';
      return 'success';
  };

  // Formatea la fecha "2023-10-05T14:30:00Z" a algo legible
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "Desconocida";
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-CL', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="map-container">
      
      {/* PANEL SUPERIOR */}
      <div className="dashboard-panel">
        <div className="brand-title">
          <i className="bi bi-recycle text-success"></i> Reciclaje Pudú
        </div>
        
        {/* BOTONES DE VISTA (MAPA vs LISTA) */}
        <div className="d-flex justify-content-center gap-2 my-2">
            <Button 
                variant={vista === 'mapa' ? 'success' : 'outline-secondary'} 
                size="sm" 
                onClick={() => setVista('mapa')}
            >
                <i className="bi bi-map-fill"></i> Mapa
            </Button>
            <Button 
                variant={vista === 'lista' ? 'success' : 'outline-secondary'} 
                size="sm" 
                onClick={() => setVista('lista')}
            >
                <i className="bi bi-table"></i> Datos
            </Button>
        </div>

        <div className="stats-row">
          <span>Total: {puntos.length}</span>
          <span className="text-success">🟢 Online</span>
        </div>
        
        {vista === 'mapa' && (
            <>
                <hr style={{ borderColor: '#eee', margin: '10px 0 15px 0' }} />
                <div className="filter-pills">
                <button className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`} onClick={() => setFiltro('Todos')}>Todos</button>
                <button className={`filter-btn vidrio ${filtro === 'Vidrio' ? 'active' : ''}`} onClick={() => setFiltro('Vidrio')}><i className="bi bi-cup-straw"></i> Vidrio</button>
                <button className={`filter-btn plastico ${filtro === 'Plástico' ? 'active' : ''}`} onClick={() => setFiltro('Plástico')}><i className="bi bi-water"></i> Plástico</button>
                </div>
            </>
        )}
      </div>

      {/* VISTA MAPA */}
      {vista === 'mapa' && (
          <MapContainer 
            center={[-39.8142, -73.2459]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <DetectorClics />
            <BotonGPS />

            {puntosVisibles.map((p) => (
              <Marker key={p.id} position={[p.latitud, p.longitud]} icon={crearIconoPro(p.tipo_residuo)}>
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0">{p.nombre}</h6>
                        <button className="btn btn-sm btn-outline-secondary py-0 px-1" onClick={() => abrirEdicion(p)}>
                            <i className="bi bi-pencil-square"></i>
                        </button>
                    </div>
                    <span className="badge bg-light text-dark border mb-2">{p.tipo_residuo}</span>
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Nivel</span>
                      <span>{p.estado_llenado}%</span>
                    </div>
                    <ProgressBar now={p.estado_llenado} variant={getColorBarra(p.estado_llenado)} style={{ height: '6px' }} className="mb-3"/>
                    <div className="d-grid">
                        <Button variant="dark" size="sm" onClick={() => abrirEdicion(p)}>Actualizar Estado</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {miUbicacion && (
               <Marker position={miUbicacion} icon={crearIconoPro('Usuario')}>
                  <Popup><strong>¡Estás aquí!</strong></Popup>
               </Marker>
            )}
          </MapContainer>
      )}

      {/* VISTA LISTA DE DATOS */}
      {vista === 'lista' && (
          <div className="container pt-5 mt-5" style={{ height: '100vh', overflowY: 'auto', background: '#f8f9fa' }}>
              <div className="card shadow-sm border-0">
                  <div className="card-header bg-white fw-bold">
                      📋 Registro de Puntos
                  </div>
                  <div className="card-body p-0">
                      <div className="table-responsive">
                          <Table hover className="mb-0 align-middle">
                              <thead className="bg-light">
                                  <tr>
                                      <th>Nombre</th>
                                      <th>Tipo</th>
                                      <th>Llenado</th>
                                      <th>Creado el</th>
                                      <th>Acción</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {listaSegura.map((p) => (
                                      <tr key={p.id}>
                                          <td className="fw-bold">{p.nombre}</td>
                                          <td><Badge bg="light" text="dark" className="border">{p.tipo_residuo}</Badge></td>
                                          <td>
                                              <Badge bg={getColorBarra(p.estado_llenado)}>{p.estado_llenado}%</Badge>
                                          </td>
                                          <td className="small text-muted">
                                              {/* Aquí mostramos la fecha de creación */}
                                              {formatearFecha(p.fecha_creacion)}
                                          </td>
                                          <td>
                                              <Button variant="outline-dark" size="sm" onClick={() => { setVista('mapa'); abrirEdicion(p); }}>
                                                  <i className="bi bi-geo-alt"></i> Ir
                                              </Button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </Table>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-bold">{formulario.id ? '✏️ Gestionar Punto' : '📍 Nuevo Punto'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">NOMBRE UBICACIÓN</Form.Label>
              <Form.Control type="text" value={formulario.nombre} onChange={(e) => setFormulario({...formulario, nombre: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
               <Form.Label className="small text-muted fw-bold">TIPO DE RESIDUO</Form.Label>
               <Form.Select value={formulario.tipo_residuo} onChange={(e) => setFormulario({...formulario, tipo_residuo: e.target.value})}>
                 <option value="Vidrio">Vidrio</option>
                 <option value="Plástico">Plástico</option>
                 <option value="Cartón">Cartón</option>
               </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3 p-3 bg-light rounded border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="small text-muted fw-bold mb-0">NIVEL ACTUAL</Form.Label>
                  <span className={`badge bg-${getColorBarra(formulario.estado_llenado)}`}>{formulario.estado_llenado}%</span>
              </div>
              <Form.Range min={0} max={100} step={25} value={formulario.estado_llenado} onChange={(e) => setFormulario({...formulario, estado_llenado: parseInt(e.target.value)})} />
              <div className="d-flex justify-content-between small text-muted mt-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
          {formulario.id && (<Button variant="danger" onClick={eliminarPunto}><i className="bi bi-trash"></i> Eliminar</Button>)}
          <div className="d-flex gap-2">
            <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button variant="dark" onClick={guardarPunto} className="px-4">Guardar</Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* NOTIFICACIÓN FLOTANTE (TOAST) */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="success">
          <Toast.Header>
            <strong className="me-auto text-success">Sistema de Reciclaje</strong>
            <small>Ahora</small>
          </Toast.Header>
          <Toast.Body className="text-white fw-bold">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>

    </div>
  );
}

export default App;