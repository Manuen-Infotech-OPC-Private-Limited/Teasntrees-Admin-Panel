import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ExportButton({
    resource,
    brand,
    filters = {},
    buttonText = 'Export',
    className = ''
}) {
    const { brand: routeBrand } = useParams();
    const effectiveBrand = brand || routeBrand || 'teasntrees';
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDownload = async (format) => {
        setIsExporting(true);
        setIsOpen(false);
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (effectiveBrand) params.append('brand', effectiveBrand);

            if (filters && typeof filters === 'object') {
                Object.entries(filters).forEach(([key, val]) => {
                    if (val !== undefined && val !== null && val !== '') {
                        params.append(key, val);
                    }
                });
            }

            const response = await api.get(`/admin/export/${resource}?${params.toString()}`, {
                responseType: 'blob'
            });

            const ext = format === 'xlsx' ? 'xlsx' : 'csv';
            const mimeType =
                format === 'xlsx'
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : 'text/csv;charset=utf-8;';

            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().slice(0, 10);
            link.download = `${resource}-${effectiveBrand}-${dateStr}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`${resource.toUpperCase()} (${ext.toUpperCase()}) downloaded`);
        } catch (err) {
            console.error('Export error:', err);
            toast.error(`Failed to export ${resource}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xs hover:border-gray-900 hover:shadow-sm transition-all disabled:opacity-50"
            >
                {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
                ) : (
                    <Download className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span>{buttonText}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-gray-50">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Export Format</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleDownload('csv')}
                        className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-black text-gray-800 uppercase tracking-wider">CSV File (.csv)</div>
                            <div className="text-[10px] font-medium text-gray-400">Comma-separated text</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleDownload('xlsx')}
                        className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-xs font-black text-gray-800 uppercase tracking-wider">Excel Workbook (.xlsx)</div>
                            <div className="text-[10px] font-medium text-gray-400">Microsoft Excel format</div>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}

