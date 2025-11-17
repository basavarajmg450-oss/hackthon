import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    GraduationCap,
    LayoutDashboard,
    Clock,
    Calendar,
    Users,
    BookOpen,
    MessageCircle,
    LogOut,
    Menu,
    X,
    User
} from 'lucide-react';

const Navigation = ({ user, onLogout }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/attendance', icon: Clock, label: 'Attendance' },
        { path: '/courses', icon: BookOpen, label: 'Courses' },
        { path: '/events', icon: Calendar, label: 'Events' },
        { path: '/study-groups', icon: Users, label: 'Study Groups' },
        { path: '/chat', icon: MessageCircle, label: 'AI Helper' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex bg-white/90 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <GraduationCap className="w-8 h-8 text-indigo-600" />
                            <span className="text-2xl font-bold text-gray-900">EduHub</span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="flex items-center space-x-1">
                            {navItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive(item.path)
                                                ? 'bg-indigo-600 text-white shadow-lg'
                                                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                            }`}
                                        data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3 text-gray-700">
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-sm">
                                    <div className="font-semibold" data-testid="user-name">{user.full_name}</div>
                                    <div className="text-gray-500 capitalize" data-testid="user-role">{user.role}</div>
                                </div>
                            </div>
                            <button
                                onClick={onLogout}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                data-testid="logout-button"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav className="lg:hidden bg-white/90 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
                <div className="px-4 sm:px-6">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <GraduationCap className="w-8 h-8 text-indigo-600" />
                            <span className="text-xl font-bold text-gray-900">EduHub</span>
                        </Link>

                        {/* User Info & Menu Button */}
                        <div className="flex items-center space-x-3">
                            <div className="text-sm text-right">
                                <div className="font-semibold text-gray-900" data-testid="mobile-user-name">{user.full_name}</div>
                                <div className="text-gray-500 capitalize text-xs" data-testid="mobile-user-role">{user.role}</div>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors duration-200"
                                data-testid="mobile-menu-toggle"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="pb-4 border-t border-gray-100 pt-4" data-testid="mobile-menu">
                            <div className="space-y-2">
                                {navItems.map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                                    ? 'bg-indigo-600 text-white shadow-lg'
                                                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                }`}
                                            data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                                        >
                                            <IconComponent className="w-5 h-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {/* Mobile Logout */}
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        onLogout();
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    data-testid="mobile-logout-button"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navigation;