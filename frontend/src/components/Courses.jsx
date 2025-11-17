import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Clock,
    Users,
    Calendar,
    Search,
    Plus,
    User,
    GraduationCap
} from 'lucide-react';
import api from '../lib/axiosConfig';

const Courses = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        code: '',
        department: '',
        credits: 3,
        description: '',
        schedule: []
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();

        try {
            await api.post('/courses', createForm);
            alert('Course created successfully!');
            setShowCreateModal(false);
            setCreateForm({
                name: '',
                code: '',
                department: '',
                credits: 3,
                description: '',
                schedule: []
            });
            fetchCourses();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to create course';
            alert(errorMessage);
        }
    };

    const filteredCourses = courses.filter(course => {
        return course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.department.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const departments = [
        'Computer Science', 'Engineering', 'Business', 'Mathematics',
        'Physics', 'Chemistry', 'Biology', 'Literature', 'History'
    ];

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
        <div className="min-h-screen p-4 lg:p-8" data-testid="courses-page">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Courses
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Browse and manage academic courses offered this semester.
                        </p>
                    </div>

                    {(user.role === 'faculty' || user.role === 'admin') && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 lg:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
                            data-testid="create-course-button"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Course</span>
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses by name, code, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            data-testid="search-courses"
                        />
                    </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="courses-grid">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                                data-testid={`course-card-${course.id}`}
                            >
                                {/* Course Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                                        {course.credits} Credits
                                    </span>
                                </div>

                                {/* Course Info */}
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                                        {course.name}
                                    </h3>
                                    <p className="text-indigo-600 font-semibold text-sm mb-2">
                                        {course.code}
                                    </p>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                                        {course.description || 'No description available.'}
                                    </p>
                                </div>

                                {/* Course Details */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <GraduationCap className="w-4 h-4" />
                                        <span className="text-sm">{course.department}</span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm">
                                            {course.enrolled_students?.length || 0} students enrolled
                                        </span>
                                    </div>

                                    {course.schedule && course.schedule.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm font-medium">Schedule:</span>
                                            </div>
                                            {course.schedule.slice(0, 2).map((slot, index) => (
                                                <div key={index} className="ml-6 text-sm text-gray-600">
                                                    {slot.day} • {slot.time} • {slot.room}
                                                </div>
                                            ))}
                                            {course.schedule.length > 2 && (
                                                <div className="ml-6 text-sm text-gray-500">
                                                    +{course.schedule.length - 2} more slots
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                <div className="border-t border-gray-100 pt-4">
                                    <button
                                        className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors duration-200 border border-indigo-200"
                                        data-testid={`view-course-${course.id}`}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Courses Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? 'No courses match your search criteria.'
                                    : 'No courses are currently available.'
                                }
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="create-course-modal">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-screen overflow-y-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Course</h3>

                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter course name"
                                    data-testid="course-name-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.code}
                                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., CS101"
                                    data-testid="course-code-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department *
                                </label>
                                <select
                                    required
                                    value={createForm.department}
                                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    data-testid="department-select"
                                >
                                    <option value="">Select department</option>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Credits *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="6"
                                    value={createForm.credits}
                                    onChange={(e) => setCreateForm({ ...createForm, credits: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    data-testid="credits-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows="3"
                                    placeholder="Course description (optional)"
                                    data-testid="course-description-input"
                                ></textarea>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
                                    data-testid="cancel-create-course"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                                    data-testid="submit-create-course"
                                >
                                    Create Course
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;