import React, { useState } from 'react';
import { Settings as SettingsIcon, Map, LayoutGrid } from 'lucide-react';
import GeneralSettings from '../components/settings/GeneralSettings';
import ServiceAreas from '../components/settings/ServiceAreas';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: LayoutGrid },
        { id: 'zones', label: 'Delivery Zones', icon: Map },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-10">
                <SettingsIcon className="w-10 h-10 text-black p-2 bg-gray-100 rounded-2xl" />
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">App Control</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage your app rules and delivery areas</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-100 mb-10">
                <div className="flex gap-12">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-5 px-1 flex items-center gap-3 transition-all relative text-xs font-black uppercase tracking-[0.2em] ${activeTab === tab.id
                                    ? 'text-black'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#56763D] rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'general' ? <GeneralSettings /> : <ServiceAreas />}
            </div>
        </div>
    );
};

export default Settings;
