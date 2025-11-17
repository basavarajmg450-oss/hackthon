import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    Plus,
    Search,
    Filter,
    Tag,
    User
} from 'lucide-react';
import api from '../lib/axiosConfig';

const Events = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [registering, setRegistering] = useState({});

    const categories = [
        { id: '', label: 'All Events' },
        { id: 'academic', label: 'Academic' },
        { id: 'cultural', label: 'Cultural' },
        { id: 'sports', label: 'Sports' },
        { id: 'workshop', label: 'Workshop' }
    ];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        setRegistering({ ...registering, [eventId]: true });

        try {
            await api.post(`/events/${eventId}/register`);
            alert('Successfully registered for the event!');
            fetchEvents(); // Refresh events to update registration status
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to register for event';
            alert(errorMessage);
        } finally {
            setRegistering({ ...registering, [eventId]: false });
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === '' || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (category) => {
        const colors = {
            academic: 'bg-blue-100 text-blue-700',
            cultural: 'bg-purple-100 text-purple-700',
            sports: 'bg-green-100 text-green-700',
            workshop: 'bg-orange-100 text-orange-700'
        };
        return colors[category] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div className="min-h-screen p-4 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, index) => (
                                <div key={index} className="h-64 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 lg:p-8" data-testid="events-page">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Campus Events
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Discover and join exciting events happening on campus.
                        </p>
                    </div>

                    {user.role !== 'student' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 lg:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
                            data-testid="create-event-button"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Event</span>
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 shadow-lg mb-8" data-testid="events-filters">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                data-testid="search-events"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                                data-testid="category-filter"
                            >
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="events-grid">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => {
                            const isRegistered = event.registered_users?.includes(user.id);
                            const isFull = event.max_participants &&
                                event.registered_users?.length >= event.max_participants;

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                                    data-testid={`event-card-${event.id}`}
                                >
                                    {/* Event Image */}
                                    <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-600 relative">
                                        {event.image_url ? (
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-16 h-16 text-white opacity-80" />
                                            </div>
                                        )}

                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(event.category)}`}>
                                                <Tag className="w-4 h-4 inline mr-1" />
                                                {event.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Event Details */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                            {event.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                            {event.description}
                                        </p>

                                        {/* Event Info */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {new Date(event.date).toLocaleDateString()} at{' '}
                                                    {new Date(event.date).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm">{event.location}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {event.registered_users?.length || 0}
                                                    {event.max_participants && ` / ${event.max_participants}`} registered
                                                </span>
                                            </div>
                                        </div>

                                        {/* Registration Button */}
                                        <button
                                            onClick={() => handleRegister(event.id)}
                                            disabled={isRegistered || isFull || registering[event.id]}
                                            className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${isRegistered
                                                    ? 'bg-green-100 text-green-700 cursor-default'
                                                    : isFull
                                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            data-testid={`register-event-${event.id}`}
                                        >
                                            {registering[event.id] ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                    <span>Registering...</span>
                                                </div>
                                            ) : isRegistered ? (
                                                'Already Registered'
                                            ) : isFull ? (
                                                'Event Full'
                                            ) : (
                                                'Register Now'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || selectedCategory
                                    ? 'No events match your current filters.'
                                    : 'No events are currently available.'
                                }
                            </p>
                            {(searchTerm || selectedCategory) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('');
                                    }}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Event Modal - Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="create-event-modal">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Event</h3>
                        <p className="text-gray-600 mb-6">
                            Event creation feature will be available in the next update.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                            data-testid="close-create-modal"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
