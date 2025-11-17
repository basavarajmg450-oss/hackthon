import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    BookOpen,
    Clock,
    Video,
    User,
    Calendar
} from 'lucide-react';
import api from '../lib/axiosConfig';

const StudyGroups = ({ user }) => {
    const [studyGroups, setStudyGroups] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joining, setJoining] = useState({});
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        course_id: '',
        max_members: 10,
        meeting_link: '',
        schedule: { day: '', time: '' }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [groupsResponse, coursesResponse] = await Promise.all([
                api.get('/study-groups'),
                api.get('/courses')
            ]);

            setStudyGroups(groupsResponse.data);
            setCourses(coursesResponse.data);
        } catch (error) {
            console.error('Error fetching study groups data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async (groupId) => {
        setJoining({ ...joining, [groupId]: true });

        try {
            await api.post(`/study-groups/${groupId}/join`);
            alert('Successfully joined the study group!');
            fetchData(); // Refresh groups to update membership
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to join study group';
            alert(errorMessage);
        } finally {
            setJoining({ ...joining, [groupId]: false });
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();

        try {
            const groupData = {
                ...createForm,
                schedule: createForm.schedule.day && createForm.schedule.time ? createForm.schedule : null
            };

            await api.post('/study-groups', groupData);
            alert('Study group created successfully!');
            setShowCreateModal(false);
            setCreateForm({
                name: '',
                description: '',
                course_id: '',
                max_members: 10,
                meeting_link: '',
                schedule: { day: '', time: '' }
            });
            fetchData();
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to create study group';
            alert(errorMessage);
        }
    };

    const filteredGroups = studyGroups.filter(group => {
        return group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const days = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
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
        <div className="min-h-screen p-4 lg:p-8" data-testid="study-groups-page">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Study Groups
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Join collaborative learning groups and study together.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 lg:mt-0 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
                        data-testid="create-group-button"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Group</span>
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search study groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            data-testid="search-groups"
                        />
                    </div>
                </div>

                {/* Study Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="study-groups-grid">
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => {
                            const isMember = group.members?.includes(user.id);
                            const isFull = group.members?.length >= group.max_members;
                            const course = courses.find(c => c.id === group.course_id);

                            return (
                                <div
                                    key={group.id}
                                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                                    data-testid={`study-group-card-${group.id}`}
                                >
                                    {/* Group Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isMember
                                                ? 'bg-green-100 text-green-700'
                                                : isFull
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {isMember ? 'Member' : isFull ? 'Full' : 'Open'}
                                        </span>
                                    </div>

                                    {/* Group Info */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {group.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {group.description}
                                    </p>

                                    {/* Group Details */}
                                    <div className="space-y-2 mb-6">
                                        {course && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <BookOpen className="w-4 h-4" />
                                                <span className="text-sm">{course.name}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm">
                                                {group.members?.length || 0} / {group.max_members} members
                                            </span>
                                        </div>

                                        {group.schedule && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {group.schedule.day} at {group.schedule.time}
                                                </span>
                                            </div>
                                        )}

                                        {group.meeting_link && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Video className="w-4 h-4" />
                                                <span className="text-sm">Online meetings available</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    {isMember ? (
                                        <div className="text-center">
                                            <div className="bg-green-100 text-green-700 py-3 rounded-lg font-semibold">
                                                You're a member
                                            </div>
                                            {group.meeting_link && (
                                                <a
                                                    href={group.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    <span>Join Meeting</span>
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleJoinGroup(group.id)}
                                            disabled={isFull || joining[group.id]}
                                            className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${isFull
                                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            data-testid={`join-group-${group.id}`}
                                        >
                                            {joining[group.id] ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                                    <span>Joining...</span>
                                                </div>
                                            ) : isFull ? (
                                                'Group Full'
                                            ) : (
                                                'Join Group'
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Study Groups Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? 'No groups match your search criteria.'
                                    : 'Be the first to create a study group!'
                                }
                            </p>
                            {searchTerm ? (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Clear Search
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                                >
                                    Create First Group
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="create-group-modal">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-screen overflow-y-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Create Study Group</h3>

                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Group Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter group name"
                                    data-testid="group-name-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows="3"
                                    placeholder="Describe your study group"
                                    data-testid="group-description-input"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Related Course (Optional)
                                </label>
                                <select
                                    value={createForm.course_id}
                                    onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    data-testid="course-select"
                                >
                                    <option value="">Select a course (optional)</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>
                                            {course.name} ({course.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Members
                                </label>
                                <input
                                    type="number"
                                    min="2"
                                    max="50"
                                    value={createForm.max_members}
                                    onChange={(e) => setCreateForm({ ...createForm, max_members: parseInt(e.target.value) })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    data-testid="max-members-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meeting Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={createForm.meeting_link}
                                    onChange={(e) => setCreateForm({ ...createForm, meeting_link: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="https://zoom.us/j/..."
                                    data-testid="meeting-link-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Regular Meeting Time (Optional)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={createForm.schedule.day}
                                        onChange={(e) => setCreateForm({
                                            ...createForm,
                                            schedule: { ...createForm.schedule, day: e.target.value }
                                        })}
                                        className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        data-testid="schedule-day-select"
                                    >
                                        <option value="">Select day</option>
                                        {days.map((day) => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="time"
                                        value={createForm.schedule.time}
                                        onChange={(e) => setCreateForm({
                                            ...createForm,
                                            schedule: { ...createForm.schedule, time: e.target.value }
                                        })}
                                        className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        data-testid="schedule-time-input"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
                                    data-testid="cancel-create-group"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                                    data-testid="submit-create-group"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyGroups;
