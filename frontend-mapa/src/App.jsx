import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Modal, Button, Form, ProgressBar } from 'react-bootstrap';
import L from 'leaflet';
import axios from 'axios';
import './App.css';

// URL DE TU API (Asegúrate de que sea la correcta, local o nube)
const API_URL = 'http://127.0.0.1:8000/api/puntos/';

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
  const [showModal, setShowModal] = useState(false);
  
  // Estado del formulario (ahora incluye ID para saber si editamos)
  const [formulario, setFormulario] = useState({ 
      id: null, // Si es null, es nuevo. Si tiene número, es edición.
      nombre: '', 
      latitud: 0, 
      longitud: 0, 
      estado_llenado: 0, 
      tipo_residuo: 'Vidrio' 
  });
  
  const [miUbicacion, setMiUbicacion] = useState(null);

  // Cargar datos
  const cargarPuntos = async () => {
    try {
      const res = await axios.get(API_URL);
      setPuntos(res.data);
    } catch (error) { console.error("Error cargando:", error); }
  };

  useEffect(() => { cargarPuntos(); }, []);

  const puntosVisibles = filtro === 'Todos' 
      ? puntos 
      : puntos.filter(p => p.tipo_residuo === filtro);

  // --- LÓGICA INTELIGENTE DE GUARDADO (CREAR vs EDITAR) ---
  const guardarPunto = async () => {
    try {
      if (formulario.id) {
        // MODO EDICIÓN (PUT) -> Actualizamos el existente
        // Agregamos el slash final '/' que Django a veces exige
        await axios.put(`${API_URL}${formulario.id}/`, formulario);
      } else {
        // MODO CREACIÓN (POST) -> Creamos uno nuevo
        await axios.post(API_URL, formulario);
      }
      
      setShowModal(false);
      cargarPuntos(); // Recargamos para ver la nueva predicción
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar. Revisa la consola.");
    }
  };

  // Función para abrir el modal en MODO EDICIÓN
  const abrirEdicion = (punto) => {
    setFormulario({
      id: punto.id, // ¡Importante! Guardamos el ID
      nombre: punto.nombre,
      latitud: punto.latitud,
      longitud: punto.longitud,
      estado_llenado: punto.estado_llenado,
      tipo_residuo: punto.tipo_residuo
    });
    setShowModal(true);
  };

  // Función para abrir el modal en MODO CREACIÓN (Click en mapa vacío)
  const DetectorClics = () => {
    useMapEvents({
      click(e) {
        setFormulario({ 
          id: null, // Sin ID = Nuevo
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

  return (
    <div className="map-container">
      
      {/* PANEL FLOTANTE */}
      <div className="dashboard-panel">
        <div className="brand-title">
          <i className="bi bi-recycle text-success"></i> Reciclaje Pudú
        </div>
        <div className="stats-row">
          <span>Estado: 🟢 Online</span>
          <span>{puntos.length} Puntos</span>
        </div>
        <hr style={{ borderColor: '#eee', margin: '10px 0 15px 0' }} />
        <div className="filter-pills">
          <button className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`} onClick={() => setFiltro('Todos')}>Todos</button>
          <button className={`filter-btn vidrio ${filtro === 'Vidrio' ? 'active' : ''}`} onClick={() => setFiltro('Vidrio')}><i className="bi bi-cup-straw"></i> Vidrio</button>
          <button className={`filter-btn plastico ${filtro === 'Plástico' ? 'active' : ''}`} onClick={() => setFiltro('Plástico')}><i className="bi bi-water"></i> Plástico</button>
          <button className={`filter-btn carton ${filtro === 'Cartón' ? 'active' : ''}`} onClick={() => setFiltro('Cartón')}><i className="bi bi-box-seam"></i> Cartón</button>
        </div>
      </div>

      {/* MAPA */}
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
          <Marker
            key={p.id}
            position={[p.latitud, p.longitud]}
            icon={crearIconoPro(p.tipo_residuo)}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold mb-0">{p.nombre}</h6>
                    {/* BOTÓN DE EDICIÓN (LÁPIZ) */}
                    <button 
                        className="btn btn-sm btn-outline-secondary py-0 px-1" 
                        onClick={() => abrirEdicion(p)}
                        title="Editar estado"
                    >
                        <i className="bi bi-pencil-square"></i>
                    </button>
                </div>

                <span className="badge bg-light text-dark border mb-2">{p.tipo_residuo}</span>
                
                <div className="alert alert-primary py-1 px-2 my-2 small d-flex align-items-center gap-2">
                  <i className="bi bi-stopwatch-fill"></i> 
                  <span>Lleno en: <strong>{p.estimacion_dias}</strong></span>
                </div>

                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Capacidad</span>
                  <span>{p.estado_llenado}%</span>
                </div>
                <ProgressBar 
                  now={p.estado_llenado} 
                  variant={p.estado_llenado > 80 ? 'danger' : p.estado_llenado > 50 ? 'warning' : 'success'} 
                  style={{ height: '6px' }} 
                  className="mb-3"
                />
                
                {/* Botón rápido para actualizar */}
                <div className="d-grid">
                    <Button variant="dark" size="sm" onClick={() => abrirEdicion(p)}>
                        Actualizar Estado
                    </Button>
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

      {/* MODAL INTELIGENTE (Sirve para Crear y Editar) */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-bold">
            {formulario.id ? '✏️ Actualizar Punto' : '📍 Nuevo Punto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted fw-bold">NOMBRE UBICACIÓN</Form.Label>
              <Form.Control 
                type="text" 
                value={formulario.nombre}
                onChange={(e) => setFormulario({...formulario, nombre: e.target.value})} 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
               <Form.Label className="small text-muted fw-bold">TIPO DE RESIDUO</Form.Label>
               <Form.Select 
                  value={formulario.tipo_residuo}
                  onChange={(e) => setFormulario({...formulario, tipo_residuo: e.target.value})}
               >
                 <option value="Vidrio">Vidrio</option>
                 <option value="Plástico">Plástico</option>
                 <option value="Cartón">Cartón</option>
               </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3 p-3 bg-light rounded border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="small text-muted fw-bold mb-0">NIVEL ACTUAL</Form.Label>
                  <span className={`badge ${formulario.estado_llenado > 80 ? 'bg-danger' : 'bg-success'}`}>
                      {formulario.estado_llenado}%
                  </span>
              </div>
              <Form.Range 
                  min={0} 
                  max={100} 
                  value={formulario.estado_llenado}
                  onChange={(e) => setFormulario({...formulario, estado_llenado: e.target.value})} 
              />
              <div className="d-flex justify-content-between small text-muted mt-1">
                <span>Vacío (0%)</span>
                <span>Crítico (100%)</span>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="dark" onClick={guardarPunto} className="px-4">
              {formulario.id ? 'Guardar Cambios' : 'Crear Punto'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;