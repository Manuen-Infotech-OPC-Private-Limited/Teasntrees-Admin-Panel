import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, FeatureGroup, Polygon, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { MapPin, Save, X, AlertCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for default Leaflet marker icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ServiceAreas = () => {
    // Default Guntur location
    const DEFAULT_CENTER = [16.3090716, 80.4308257];
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { socket } = useSocket();

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [tempLayer, setTempLayer] = useState(null);
    const [zoneForm, setZoneForm] = useState({ name: '', deliveryCharge: '' });

    // Refs
    const featureGroupRef = useRef();

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            fetchSettings();
        };
        socket.on('settings:updated', handleUpdate); // Assuming service areas are part of settings updates
        socket.on('zone:updated', handleUpdate);
        return () => {
            socket.off('settings:updated', handleUpdate);
            socket.off('zone:updated', handleUpdate);
        };
    }, [socket]);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings/delivery-zones');
            const generalResponse = await api.get('/admin/settings');

            if (response.data.success && generalResponse.data.success) {
                setSettings({
                    serviceAreas: response.data.data,
                    maxDeliveryDistance: generalResponse.data.data.maxDeliveryDistance || 10
                });
            }
        } catch (error) {
            console.error('Error fetching zones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreated = (e) => {
        const layer = e.layer;
        // Don't add to map yet (wait for modal confirmation)
        // We temporarily remove it, or keep it references
        // react-leaflet-draw adds it automatically. We'll remove it if they cancel.
        setTempLayer(layer);
        setZoneForm({ name: '', deliveryCharge: '' });
        setShowModal(true);
    };

    const handleModalSave = () => {
        if (!tempLayer || !zoneForm.name || !zoneForm.deliveryCharge) return;

        // Get coordinates from layer
        // Leaflet Polygon latlngs: array of objects {lat, lng}
        // Backend expects [[lat, lng], [lat, lng]]
        const latLngs = tempLayer.getLatLngs()[0];
        const coordinates = latLngs.map(ll => [ll.lat, ll.lng]);

        const newArea = {
            name: zoneForm.name,
            deliveryCharge: parseFloat(zoneForm.deliveryCharge),
            coordinates: coordinates
        };

        setSettings(prev => ({
            ...prev,
            serviceAreas: [...(prev.serviceAreas || []), newArea]
        }));

        // Remove the drawn layer from the FeatureGroup because we will render it via React state
        if (featureGroupRef.current) {
            featureGroupRef.current.removeLayer(tempLayer);
        }

        setShowModal(false);
        setTempLayer(null);
    };

    const handleModalCancel = () => {
        // Remove the layer that was just drawn
        if (featureGroupRef.current && tempLayer) {
            featureGroupRef.current.removeLayer(tempLayer);
        }
        setShowModal(false);
        setTempLayer(null);
    };

    const handleEdited = (e) => {
        const layers = e.layers;
        layers.eachLayer(layer => {
            // Find which zone this corresponds to and update it
            // This is tricky with declarative React. 
            // EASIER STRATEGY: 
            // We use the "Draw" tools primarily for creation.
            // Editing existing ones via the toolbar is hard to sync back to state indices nicely.
            // BUT: If we rely on the Internal Leaflet ID, we don't have that in our DB.

            // WORKAROUND:
            // For now, we only support CREATING new zones and DELETING existing ones.
            // Full shape editing requires mapping Leaflet IDs to our State IDs.
            // Since we are re-rendering from state, the toolbar "Edit" button won't easily grab our React-rendered polygons unless we attach them.

            // To properly support Edit, we'd need to assume the Order matches or use a custom property.
        });

        // Actually, let's keep it simple:
        // We only allow DELETING specific zones via a button in their popup.
        // We allow ADDING new zones via the toolbar.
        // Editing shapes is disabled for V1 to ensure stability.
    };

    const handleDeleted = (e) => {
        // Same issue as Edited - syncing IDs.
        // We will implement DELETE via the Popup button instead.
    };

    const deleteZone = (index) => {
        if (window.confirm('Are you sure you want to delete this zone?')) {
            const updatedAreas = [...settings.serviceAreas];
            updatedAreas.splice(index, 1);
            setSettings({ ...settings, serviceAreas: updatedAreas });
        }
    };

    const saveAllZones = async () => {
        setSaving(true);
        try {
            const response = await api.put('/admin/settings/delivery-zones', {
                serviceAreas: settings.serviceAreas
            });
            if (response.data.success) {
                alert('Delivery zones saved successfully!');
            }
        } catch (error) {
            console.error('Error saving zones:', error);
            alert('Failed to save zones');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading map...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto flex flex-col relative pb-10">
            {/* Header */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center z-10">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center border border-gray-100 shadow-sm">
                        <MapPin className="w-10 h-10 text-emerald-900" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Delivery Zones</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Manage Areas</p>
                    </div>
                </div>
                <button
                    onClick={saveAllZones}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-70 hover:scale-105 active:scale-95"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Syncing...' : 'Save Zones'}
                </button>
            </div>

            {/* Map Container */}
            <div className="h-[650px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative z-0">
                <MapContainer
                    center={DEFAULT_CENTER}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FeatureGroup ref={featureGroupRef}>
                        <EditControl
                            position="topright"
                            onCreated={handleCreated}
                            draw={{
                                rectangle: false,
                                circle: false,
                                circlemarker: false,
                                marker: false,
                                polyline: false,
                                polygon: {
                                    allowIntersection: false,
                                    drawError: {
                                        color: '#e1e100',
                                        message: '<strong>Error:</strong> Illegal Polygon Intersection'
                                    },
                                    shapeOptions: {
                                        color: '#059669',
                                        weight: 4
                                    }
                                }
                            }}
                            edit={{
                                edit: false,
                                remove: false
                            }}
                        />
                    </FeatureGroup>

                    {/* Max Delivery Radius Circle */}
                    <Circle
                        center={DEFAULT_CENTER}
                        radius={(settings?.maxDeliveryDistance || 10) * 1000}
                        pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.05, dashArray: '10, 20', weight: 2 }}
                    />

                    {/* Render Saved Service Areas */}
                    {settings?.serviceAreas?.map((area, index) => (
                        <Polygon
                            key={index}
                            positions={area.coordinates}
                            pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.4, weight: 3 }}
                        >
                            <Popup className="neo-popup">
                                <div className="p-4 min-w-[200px] text-center">
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg mb-1">{area.name}</h3>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Surcharge: ₹{area.deliveryCharge}</p>
                                    <button
                                        onClick={() => deleteZone(index)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                        Delete Zone
                                    </button>
                                </div>
                            </Popup>
                        </Polygon>
                    ))}
                </MapContainer>
            </div>

            {/* Zone Information Overlay */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-start gap-6">
                <div className="p-3 bg-gray-50 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-emerald-900" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">How to use</h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Use the <strong className="text-emerald-900">Polygon Tool</strong> (Top-Right) to draw new zones.
                        The <strong className="text-emerald-900">Dotted Circle</strong> shows your standard delivery range. You can add extra charges for zones outside this area.
                    </p>
                </div>
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-emerald-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">Add New Zone</h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Zone Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. North Area"
                                    value={zoneForm.name}
                                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                                    className="w-full px-6 py-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-black text-sm uppercase placeholder:text-gray-300"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Delivery Fee (₹)</label>
                                <input
                                    type="number"
                                    placeholder="00"
                                    value={zoneForm.deliveryCharge}
                                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryCharge: e.target.value })}
                                    className="w-full px-6 py-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-black text-sm uppercase placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={handleModalCancel}
                                className="flex-1 px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalSave}
                                disabled={!zoneForm.name || !zoneForm.deliveryCharge}
                                className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                            >
                                Create Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceAreas;
