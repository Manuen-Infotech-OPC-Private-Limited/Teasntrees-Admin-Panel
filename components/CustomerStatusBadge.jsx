import React from 'react';

const CustomerStatusBadge = ({ isActive }) => {
    if (isActive) {
        return (
            <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
                Active
            </span>
        );
    }

    return (
        <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 border border-gray-100">
            Inactive
        </span>
    );
};

export default CustomerStatusBadge;
