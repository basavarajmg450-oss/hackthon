import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Users,
    Calendar,
    MessageCircle,
    ChevronRight,
    GraduationCap,
    Clock,
    MapPin
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <GraduationCap className="w-8 h-8 text-indigo-600" />
                            <span className="text-2xl font-bold text-gray-900">EduHub</span>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
                            data-testid="login-button"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pt-16 pb-32">
                <div className="absolute inset-0 opacity-50">
                    <div style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat'
                    }} className="w-full h-full">
                    </div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 fade-in">
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                                Your Complete
                                <span className="text-gradient block">Campus Solution</span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Streamline your university experience with smart attendance tracking,
                                AI-powered campus assistance, event management, and collaborative learning tools.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="group bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                    data-testid="get-started-btn"
                                >
                                    Get Started Today
                                    <ChevronRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                    data-testid="learn-more-btn"
                                >
                                    Learn More
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-8 pt-8">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-indigo-600">500+</div>
                                    <div className="text-gray-600">Students</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-indigo-600">50+</div>
                                    <div className="text-gray-600">Courses</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-indigo-600">99%</div>
                                    <div className="text-gray-600">Uptime</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative slide-up">
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1576495199011-eb94736d05d6"
                                    alt="Modern Campus"
                                    className="w-full h-96 object-cover rounded-2xl shadow-2xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white" data-testid="features-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need for Campus Life
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our comprehensive platform brings together all the tools students and faculty need
                            for a seamless campus experience.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Smart Attendance */}
                        <div className="card bounce-in text-center group">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Clock className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Attendance</h3>
                            <p className="text-gray-600 mb-4">
                                Multiple methods including QR codes, geolocation, and manual check-in for flexible attendance tracking.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">QR Code</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">GPS</span>
                            </div>
                        </div>

                        {/* AI Campus Helper */}
                        <div className="card bounce-in text-center group" style={{ animationDelay: '0.1s' }}>
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Campus Helper</h3>
                            <p className="text-gray-600 mb-4">
                                Get instant answers about courses, campus navigation, and academic support with our intelligent chatbot.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">24/7 Support</span>
                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">Gemini AI</span>
                            </div>
                        </div>

                        {/* Event Management */}
                        <div className="card bounce-in text-center group" style={{ animationDelay: '0.2s' }}>
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Event Management</h3>
                            <p className="text-gray-600 mb-4">
                                Discover, create, and manage campus events with easy registration and real-time updates.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Create Events</span>
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Register</span>
                            </div>
                        </div>

                        {/* Peer Learning */}
                        <div className="card bounce-in text-center group" style={{ animationDelay: '0.3s' }}>
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Peer Learning</h3>
                            <p className="text-gray-600 mb-4">
                                Join study groups, collaborate with classmates, and enhance your learning through peer interaction.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">Study Groups</span>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Collaborate</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600">
                            Get started in three simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center fade-in">
                            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                                1
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1513258496099-48168024aec0"
                                alt="Student Registration"
                                className="w-full h-48 object-cover rounded-xl shadow-lg mb-6"
                            />
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sign Up</h3>
                            <p className="text-gray-600">
                                Create your account with student ID or email. Quick and secure registration process.
                            </p>
                        </div>

                        <div className="text-center fade-in" style={{ animationDelay: '0.1s' }}>
                            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                                2
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
                                alt="Platform Features"
                                className="w-full h-48 object-cover rounded-xl shadow-lg mb-6"
                            />
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Explore Features</h3>
                            <p className="text-gray-600">
                                Access all platform features including attendance tracking, events, and study groups.
                            </p>
                        </div>

                        <div className="text-center fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                                3
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1577985043696-8bd54d9f093f"
                                alt="Campus Community"
                                className="w-full h-48 object-cover rounded-xl shadow-lg mb-6"
                            />
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect & Learn</h3>
                            <p className="text-gray-600">
                                Join the campus community, participate in events, and enhance your learning experience.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Campus Experience?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of students and faculty already using EduHub to streamline
                        their campus life and enhance their learning journey.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="group bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            data-testid="cta-get-started"
                        >
                            Start Your Journey
                            <ChevronRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <GraduationCap className="w-8 h-8 text-indigo-400" />
                            <span className="text-2xl font-bold">EduHub</span>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Transforming campus life through intelligent technology
                        </p>
                        <div className="flex justify-center space-x-6">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">University Campus</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;