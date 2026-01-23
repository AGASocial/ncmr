import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, CheckCircle, Clock, Search, Lock } from 'lucide-react';

// Simple password for app access - change this to your desired password
const APP_PASSWORD = 'ncmr';

export default function NCMRApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('ncmr_auth') === 'true';
    });
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');

    const [ncmrs, setNcmrs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedNcmr, setSelectedNcmr] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [statusError, setStatusError] = useState('');

    const getApiConfig = () => {
        const apiUrl = "https://n8n.aga.social/webhook/1ab2b5db-3984-474f-8aab-e900a8370149".trim();
        const apiUser = "2qy53htsbgqy54uw6jtrnsdf".trim();
        const apiPass = "gawreoigoidsfhvbqaw34gtqa3w".trim();

        if (!apiUrl || !apiUser || !apiPass) {
            throw new Error('Missing NCMR API configuration.');
        }

        const auth = btoa(`${apiUser}:${apiPass}`);
        return { apiUrl, auth };
    };

    const [formData, setFormData] = useState({
        partNumber: '',
        partName: '',
        quantity: '',
        lotNumber: '',
        defectDescription: '',
        dispositionAction: '',
        status: 'open'
    });

    useEffect(() => {
        const fetchNcmrs = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const { apiUrl, auth } = getApiConfig();
                const response = await fetch(apiUrl, {
                    headers: {
                        Authorization: `Basic ${auth}`
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    const detail = errorText ? ` ${errorText}` : '';
                    throw new Error(`Failed to load NCMRs (HTTP ${response.status}).${detail}`);
                }

                const payload = await response.json();
                const records = Array.isArray(payload?.data) ? payload.data : [];
                const mapped = records.map((item) => ({
                    id: item.id,
                    partNumber: item.part_number ?? '',
                    partName: item.part_name ?? '',
                    quantity: item.quantity ?? '',
                    lotNumber: item.lot_number ?? '',
                    defectDescription: item.defect_description ?? '',
                    dispositionAction: item.disposition_action ?? '',
                    status: item.status ?? 'open',
                    createdAt: item.created_at
                        ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
                        : new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
                    // ncmrNumber: item.ncmr_number ?? `NCMR-${String(item.id).padStart(5, '0')}`
                    ncmrNumber: item.part_number ?? `NCMR-${String(item.id).padStart(5, '0')}`
                }));

                setNcmrs(mapped);
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : 'Failed to load NCMRs.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNcmrs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const { apiUrl, auth } = getApiConfig();
            const payload = {
                partNumber: formData.partNumber,
                partName: formData.partName,
                quantity: Number(formData.quantity),
                lotNumber: formData.lotNumber,
                defectDescription: formData.defectDescription,
                dispositionAction: formData.dispositionAction
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                const detail = errorText ? ` ${errorText}` : '';
                throw new Error(`Failed to submit NCMR (HTTP ${response.status}).${detail}`);
            }

            const result = await response.json();
            const item = result?.data;
            const created = item ? {
                id: item.id,
                partNumber: item.part_number ?? payload.partNumber,
                partName: item.part_name ?? payload.partName,
                quantity: item.quantity ?? payload.quantity,
                lotNumber: item.lot_number ?? payload.lotNumber,
                defectDescription: item.defect_description ?? payload.defectDescription,
                dispositionAction: item.disposition_action ?? payload.dispositionAction,
                status: item.status ?? 'open',
                createdAt: item.created_at ?? new Date().toISOString(),
                ncmrNumber: item.ncmr_number ?? `NCMR-${String(item.id ?? ncmrs.length + 1).padStart(5, '0')}`
            } : {
                id: Date.now(),
                ...formData,
                status: 'open',
                createdAt: new Date().toISOString(),
                ncmrNumber: `NCMR-${String(ncmrs.length + 1).padStart(5, '0')}`
            };

            const updated = [created, ...ncmrs];
            setNcmrs(updated);

            setFormData({
                partNumber: '',
                partName: '',
                quantity: '',
                lotNumber: '',
                defectDescription: '',
                dispositionAction: ''
            });
            setShowForm(false);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Failed to submit NCMR.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        const previous = ncmrs;
        const previousStatus = ncmrs.find((ncmr) => ncmr.id === id)?.status ?? 'open';
        const updated = ncmrs.map(ncmr =>
            ncmr.id === id ? { ...ncmr, status: newStatus } : ncmr
        );

        setStatusError('');
        setNcmrs(updated);
        if (selectedNcmr?.id === id) {
            setSelectedNcmr({ ...selectedNcmr, status: newStatus });
        }

        try {
            const { apiUrl, auth } = getApiConfig();
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!response.ok) {
                const errorText = await response.text();
                const detail = errorText ? ` ${errorText}` : '';
                throw new Error(`Failed to update status (HTTP ${response.status}).${detail}`);
            }
        } catch (err) {
            setNcmrs(previous);
            if (selectedNcmr?.id === id) {
                setSelectedNcmr({ ...selectedNcmr, status: previousStatus });
            }
            setStatusError(err instanceof Error ? err.message : 'Failed to update status.');
        }
    };

    const deleteNcmr = (id) => {
        if (window.confirm('Are you sure you want to delete this NCMR?')) {
            const updated = ncmrs.filter(ncmr => ncmr.id !== id);
            setSelectedNcmr(null);
            setNcmrs(updated);
        }
    };

    const filteredNcmrs = ncmrs.filter(ncmr => {
        const matchesSearch =
            ncmr.ncmrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ncmr.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ncmr.partName.toLowerCase().includes(searchTerm.toLowerCase());

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

    const handleLogin = (e) => {
        e.preventDefault();
        if (passwordInput === APP_PASSWORD) {
            localStorage.setItem('ncmr_auth', 'true');
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Incorrect password. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ncmr_auth');
        setIsAuthenticated(false);
        setPasswordInput('');
    };

    const stats = {
        total: ncmrs.length,
        open: ncmrs.filter(n => n.status === 'open').length,
        inProgress: ncmrs.filter(n => n.status === 'in-progress').length,
        closed: ncmrs.filter(n => n.status === 'closed').length
    };

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">NCMR System</h1>
                        <p className="text-gray-600">Enter password to access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                                autoFocus
                            />
                        </div>

                        {authError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                            Enter
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">NCMR System</h1>
                        <p className="text-gray-600">Non-Conformance Material Reports</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Logout
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Total NCMRs</div>
                        <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Open</div>
                        <div className="text-3xl font-bold text-red-600">{stats.open}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">In Progress</div>
                        <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">Closed</div>
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
                                placeholder="Search by number, part..."
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
                            <option value="all">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="closed">Closed</option>
                        </select>

                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            New NCMR
                        </button>
                    </div>
                </div>

                {/* NCMR List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {isLoading && (
                        <div className="col-span-full text-center py-6 bg-white rounded-lg shadow text-gray-600">
                            Loading NCMRs...
                        </div>
                    )}
                    {loadError && !isLoading && (
                        <div className="col-span-full text-center py-6 bg-white rounded-lg shadow text-red-600">
                            {loadError}
                        </div>
                    )}
                    {filteredNcmrs.map(ncmr => (
                        <div
                            key={ncmr.id}
                            onClick={() => setSelectedNcmr(ncmr)}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{ncmr.partNumber} - {ncmr.partName}</h3>
                                    <p className="text-sm text-gray-600">{ncmr.createdAt}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">{ncmr.status} {getStatusIcon(ncmr.status)}</span>
                                </div>

                            </div>

                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Part Number:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.partNumber}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Part Name:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.partName}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.quantity}</span>
                                </div>

                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Lot Number:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.lotNumber}</span>
                                </div>

                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Defect Description:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.defectDescription}</span>
                                </div>

                                <div>
                                    <span className="text-sm font-semibold text-gray-700">Disposition Action:</span>
                                    <span className="text-sm text-gray-600 ml-2">{ncmr.dispositionAction}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!isLoading && !loadError && filteredNcmrs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No NCMRs Found</h3>
                        <p className="text-gray-600">Try adjusting the filters or create a new NCMR</p>
                    </div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-800">New NCMR</h2>
                                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Part Number *
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
                                            Part Name *
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
                                            Quantity *
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
                                            Lot Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lotNumber}
                                            onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Defect Description *
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
                                        Disposition Action
                                    </label>
                                    {/* TODO: Add Disposition Action checkbox list: Sort, Use As Is, Scrap, Rework */}
                                    <div className="flex gap-2" onChange={(e) => setFormData({ ...formData, dispositionAction: e.target.value })}>
                                        <input type="checkbox" value="Sort.  " />
                                        <label>Sort</label>
                                        <input type="checkbox" value="Use As Is. " />
                                        <label>Use As Is</label>
                                        <input type="checkbox" value="Scrap. " />
                                        <label>Scrap</label>
                                        <input type="checkbox" value="Rework. " />
                                        <label>Rework</label>
                                    </div>
                                    <textarea
                                        rows="3"
                                        value={formData.dispositionAction}
                                        onChange={(e) => setFormData({ ...formData, dispositionAction: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Additional information..."
                                    />
                                </div>

                                {submitError && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                                        {submitError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 py-2 px-4 rounded-lg transition-colors font-semibold ${isSubmitting
                                            ? 'bg-blue-400 text-white cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Create NCMR'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Cancel
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
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                        <select
                                            value={selectedNcmr.status}
                                            onChange={(e) => updateStatus(selectedNcmr.id, e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="open">Open</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>
                                {statusError && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                                        {statusError}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Created</p>
                                        <p className="text-gray-900">{new Date(selectedNcmr.createdAt).toLocaleString('en-US')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Lot Number</p>
                                        <p className="text-gray-900">{selectedNcmr.lotNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Product Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Part Number</p>
                                            <p className="text-gray-900">{selectedNcmr.partNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Part Name</p>
                                            <p className="text-gray-900">{selectedNcmr.partName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Quantity</p>
                                            <p className="text-gray-900">{selectedNcmr.quantity}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Defect Description</h3>
                                    <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedNcmr.defectDescription}</p>
                                </div>

                                {selectedNcmr.dispositionAction && (
                                    <div className="border-t pt-4">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">Disposition Action</h3>
                                        <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedNcmr.dispositionAction}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    {/* <button
                                        onClick={() => deleteNcmr(selectedNcmr.id)}
                                        className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                    >
                                        Delete NCMR
                                    </button> */}
                                    <button
                                        onClick={() => setSelectedNcmr(null)}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Close
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