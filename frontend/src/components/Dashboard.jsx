import React, { useState, useEffect } from 'react';
import {
    Clock,
    Calendar,
    Users,
    BookOpen,
    TrendingUp,
    Award,
    Bell,
    ChevronRight
} from 'lucide-react';
import api from '../lib/axiosConfig';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState({});
    const [recentEvents, setRecentEvents] = useState([]);
    const [studyGroups, setStudyGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsResponse, eventsResponse, groupsResponse] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/events'),
                api.get('/study-groups')
            ]);

            setStats(statsResponse.data);
            setRecentEvents(eventsResponse.data.slice(0, 3));
            setStudyGroups(groupsResponse.data.slice(0, 3));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'Mark Attendance',
            description: 'Check in to your current class',
            icon: Clock,
            link: '/attendance',
            gradient: 'from-green-400 to-blue-500'
        },
        {
            title: 'View Events',
            description: 'Discover upcoming campus events',
            icon: Calendar,
            link: '/events',
            gradient: 'from-purple-400 to-pink-500'
        },
        {
            title: 'Join Study Group',
            description: 'Connect with your classmates',
            icon: Users,
            link: '/study-groups',
            gradient: 'from-orange-400 to-red-500'
        },
        {
            title: 'AI Campus Helper',
            description: 'Get instant answers to your questions',
            icon: BookOpen,
            link: '/chat',
            gradient: 'from-teal-400 to-green-500'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen p-4 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 lg:p-8" data-testid="dashboard">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        Welcome back, {user.full_name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Here's what's happening in your campus today.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="stat-card primary" data-testid="attendance-stat">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Attendance Records</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.attendance_records || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card success" data-testid="events-stat">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Registered Events</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.registered_events || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card warning" data-testid="study-groups-stat">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Study Groups</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.study_groups || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card info" data-testid="courses-stat">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Total Courses</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total_courses || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                to={action.link}
                                className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                data-testid={`quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <div className={`w-12 h-12 bg-gradient-to-r ${action.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                                <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                                <div className="flex items-center text-indigo-600 font-medium text-sm group-hover:text-indigo-700">
                                    <span>Get started</span>
                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Events */}
                    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="recent-events">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
                            <Link
                                to="/events"
                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                data-testid="view-all-events"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentEvents.length > 0 ? (
                                recentEvents.map((event) => (
                                    <div key={event.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                                            <p className="text-gray-600 text-sm mt-1">{event.location}</p>
                                            <p className="text-gray-500 text-xs mt-2">
                                                {new Date(event.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No upcoming events</p>
                                    <Link
                                        to="/events"
                                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-2 inline-block"
                                    >
                                        Browse events
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Study Groups */}
                    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="study-groups">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Your Study Groups</h3>
                            <Link
                                to="/study-groups"
                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                data-testid="view-all-study-groups"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {studyGroups.length > 0 ? (
                                studyGroups.map((group) => (
                                    <div key={group.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Users className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{group.name}</h4>
                                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{group.description}</p>
                                            <p className="text-gray-500 text-xs mt-2">
                                                {group.members?.length || 0} members
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No study groups joined</p>
                                    <Link
                                        to="/study-groups"
                                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-2 inline-block"
                                    >
                                        Find groups
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
