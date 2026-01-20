import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';

export default function NCMRApp() {
    const [ncmrs, setNcmrs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedNcmr, setSelectedNcmr] = useState(null);

    const [formData, setFormData] = useState({
        partNumber: '',
        partName: '',
        quantity: '',
        supplier: '',
        lotNumber: '',
        defectDescription: '',
        severity: 'minor',
        reportedBy: '',
        department: '',
        dispositionAction: ''
    });

    useEffect(() => {
        const stored = localStorage.getItem('ncmrs');
        if (stored) {
            setNcmrs(JSON.parse(stored));
        }
    }, []);

    const saveToStorage = (data) => {
        localStorage.setItem('ncmrs', JSON.stringify(data));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newNcmr = {
            id: Date.now(),
            ...formData,
            status: 'open',
            createdAt: new Date().toISOString(),
            ncmrNumber: `NCMR-${String(ncmrs.length + 1).padStart(5, '0')}`
        };

        const updated = [newNcmr, ...ncmrs];
        setNcmrs(updated);
        saveToStorage(updated);

        setFormData({
            partNumber: '',
            partName: '',
            quantity: '',
            supplier: '',
            lotNumber: '',
            defectDescription: '',
            severity: 'minor',
            reportedBy: '',
            department: '',
            dispositionAction: ''
        });
        setShowForm(false);
    };

    const updateStatus = (id, newStatus) => {
        const updated = ncmrs.map(ncmr =>
            ncmr.id === id ? { ...ncmr, status: newStatus } : ncmr
        );
        setNcmrs(updated);
        saveToStorage(updated);
    };

    const deleteNcmr = (id) => {
        if (confirm('¿Estás seguro de eliminar este NCMR?')) {
            const updated = ncmrs.filter(ncmr => ncmr.id !== id);
            setNcmrs(updated);
            saveToStorage(updated);
            setSelectedNcmr(null);
        }
    };

    const filteredNcmrs = ncmrs.filter(ncmr => {
        const matchesSearch =
            ncmr.ncmrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ncmr.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ncmr.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ncmr.supplier.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' || ncmr.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'open': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'closed': return <CheckCircle className="w-5 h-5 text-green-500" />;
            default: return null;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-300';
            case 'major': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const stats = {
        total: ncmrs.length,
        open: ncmrs.filter(n => n.status === 'open').length,
        inProgress: ncmrs.filter(n => n.status === 'in-progress').length,
        closed: ncmrs.filter(n => n.status === 'closed').length
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Sistema NCMR</h1>
                    <p className="text-gray-600">Non-Conformance Material Reports</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Total NCMRs</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Abiertos</div>
                        <div className="text-3xl font-bold text-red-600">{stats.open}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">En Proceso</div>
                        <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Cerrados</div>
                        <div className="text-3xl font-bold text-green-600">{stats.closed}</div>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 w-full md:w-auto relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por número, parte, o proveedor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="open">Abiertos</option>
                            <option value="in-progress">En Proceso</option>
                            <option value="closed">Cerrados</option>
                        </select>

                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo NCMR
                        </button>
                    </div>
                </div>

                {/* NCMR List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredNcmrs.map(ncmr => (
                        <div
                            key={ncmr.id}
                            onClick={() => setSelectedNcmr(ncmr)}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{ncmr.ncmrNumber}</h3>
                                    <p className="text-sm text-gray-600">{new Date(ncmr.createdAt).toLocaleDateString('es-ES')}</p>
                                </div>
                                {getStatusIcon(ncmr.status)}
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Parte:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.partNumber} - {ncmr.partName}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Proveedor:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.supplier}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Cantidad:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(ncmr.severity)}`}>
                                        {ncmr.severity === 'critical' ? 'Crítico' : ncmr.severity === 'major' ? 'Mayor' : 'Menor'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredNcmrs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron NCMRs</h3>
                        <p className="text-gray-600">Intenta ajustar los filtros o crea un nuevo NCMR</p>
                    </div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">Nuevo NCMR</h2>
                                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Número de Parte *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.partNumber}
                                            onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Nombre de Parte *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.partName}
                                            onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Cantidad *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Proveedor *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Número de Lote
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lotNumber}
                                            onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Severidad *
                                        </label>
                                        <select
                                            required
                                            value={formData.severity}
                                            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="minor">Menor</option>
                                            <option value="major">Mayor</option>
                                            <option value="critical">Crítico</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Reportado Por *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.reportedBy}
                                            onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Departamento *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Descripción del Defecto *
                                    </label>
                                    <textarea
                                        required
                                        rows="3"
                                        value={formData.defectDescription}
                                        onChange={(e) => setFormData({ ...formData, defectDescription: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Acción de Disposición
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={formData.dispositionAction}
                                        onChange={(e) => setFormData({ ...formData, dispositionAction: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Use as-is, Rework, Scrap, Return to vendor..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                    >
                                        Crear NCMR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedNcmr && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">{selectedNcmr.ncmrNumber}</h2>
                                <button onClick={() => setSelectedNcmr(null)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getSeverityColor(selectedNcmr.severity)}`}>
                                        {selectedNcmr.severity === 'critical' ? 'Crítico' : selectedNcmr.severity === 'major' ? 'Mayor' : 'Menor'}
                                    </span>
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                                        <select
                                            value={selectedNcmr.status}
                                            onChange={(e) => updateStatus(selectedNcmr.id, e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="open">Abierto</option>
                                            <option value="in-progress">En Proceso</option>
                                            <option value="closed">Cerrado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Creado</p>
                                        <p className="text-gray-900">{new Date(selectedNcmr.createdAt).toLocaleString('es-ES')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Reportado Por</p>
                                        <p className="text-gray-900">{selectedNcmr.reportedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Departamento</p>
                                        <p className="text-gray-900">{selectedNcmr.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Número de Lote</p>
                                        <p className="text-gray-900">{selectedNcmr.lotNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Información del Producto</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Número de Parte</p>
                                            <p className="text-gray-900">{selectedNcmr.partNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Nombre de Parte</p>
                                            <p className="text-gray-900">{selectedNcmr.partName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Proveedor</p>
                                            <p className="text-gray-900">{selectedNcmr.supplier}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Cantidad</p>
                                            <p className="text-gray-900">{selectedNcmr.quantity}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Descripción del Defecto</h3>
                                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedNcmr.defectDescription}</p>
                                </div>

                                {selectedNcmr.dispositionAction && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">Acción de Disposición</h3>
                                        <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedNcmr.dispositionAction}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => deleteNcmr(selectedNcmr.id)}
                                        className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                    >
                                        Eliminar NCMR
                                    </button>
                                    <button
                                        onClick={() => setSelectedNcmr(null)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}