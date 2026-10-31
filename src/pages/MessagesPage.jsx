import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import contactService from '../services/contactService';
import {
    Search, Filter, MoreVertical, CheckCircle, Clock,
    MessageSquare, Trash2, Mail, User, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MessagesPage() {
    const { brand: urlBrand } = useParams();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['messages', page, statusFilter, urlBrand],
        queryFn: () => contactService.getMessages({ page, limit: 10, status: statusFilter }),
        keepPreviousData: true
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => contactService.updateMessageStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries(['messages', urlBrand]);
            toast.success('Message status updated');
        },
        onError: (error) => toast.error(error.message || 'Failed to update status')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => contactService.deleteMessage(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['messages', urlBrand]);
            toast.success('Message deleted');
        },
        onError: (error) => toast.error(error.message || 'Failed to delete message')
    });

    const handleStatusUpdate = (id, newStatus) => {
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Read': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Messages</h1>
                    <p className="text-gray-400 mt-0.5 font-bold text-xs">Manage customer inquiries and feedback</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setPage(1) || setStatusFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="New">New</option>
                            <option value="Read">Read</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-64 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6">
                        {data?.data?.map((message) => (
                            <div
                                key={message._id}
                                className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-2 h-full ${message.status === 'New' ? 'bg-blue-500' :
                                        message.status === 'Resolved' ? 'bg-emerald-500' : 'bg-yellow-500'
                                    }`} />

                                <div className="flex flex-col lg:flex-row gap-6 ml-4">
                                    {/* User Info */}
                                    <div className="lg:w-1/4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{message.firstName} {message.lastName}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(message.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{message.email}</span>
                                        </div>

                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${getStatusColor(message.status)}`}>
                                            {message.status === 'New' && <AlertCircle className="w-3 h-3" />}
                                            {message.status === 'Read' && <Clock className="w-3 h-3" />}
                                            {message.status === 'Resolved' && <CheckCircle className="w-3 h-3" />}
                                            {message.status}
                                        </div>
                                    </div>

                                    {/* Message Content */}
                                    <div className="lg:flex-1 space-y-3">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-gray-400" />
                                            {message.subject}
                                        </h4>
                                        <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                            {message.message}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:w-48 flex flex-row lg:flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 pl-0 lg:pl-6">
                                        {message.status !== 'Resolved' && (
                                            <button
                                                onClick={() => handleStatusUpdate(message._id, 'Resolved')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-sm"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                {message.status === 'New' ? 'Resolve' : 'Mark Resolved'}
                                            </button>
                                        )}

                                        {message.status === 'New' && (
                                            <button
                                                onClick={() => handleStatusUpdate(message._id, 'Read')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-50 text-yellow-600 rounded-xl font-bold hover:bg-yellow-100 transition-colors text-sm"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                                Mark Read
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(message._id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {data?.pagination?.pages > 1 && (
                        <div className="flex justify-center gap-2 pt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold disabled:opacity-50 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold">
                                Page {page} of {data.pagination.pages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                                disabled={page === data.pagination.pages}
                                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {data?.data?.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No messages found</h3>
                            <p className="text-gray-500 mt-2">No contact inquiries match your criteria</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
