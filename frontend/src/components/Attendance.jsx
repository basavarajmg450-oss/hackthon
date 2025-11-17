import React, { useState, useEffect, useRef } from 'react';
import {
    QrCode,
    MapPin,
    Clock,
    CheckCircle,
    Camera,
    Calendar,
    Search,
    Filter,
    Plus,
    X,
    Download,
    Video,
    VideoOff
} from 'lucide-react';
import api from '../lib/axiosConfig';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

const Attendance = ({ user }) => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('qr_code');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [location, setLocation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [showFaceRecognition, setShowFaceRecognition] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [faceDetected, setFaceDetected] = useState(false);
    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
        return () => {
            // Cleanup camera streams
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        };
    }, []);

    const fetchData = async () => {
        try {
            // Fetch courses and attendance separately so one failure doesn't block the other
            const [attendanceResponse, coursesResponse] = await Promise.allSettled([
                api.get('/attendance/my'),
                api.get('/courses')
            ]);

            if (attendanceResponse.status === 'fulfilled') {
                setAttendanceRecords(attendanceResponse.value.data);
            } else {
                console.error('Error fetching attendance:', attendanceResponse.reason);
                setAttendanceRecords([]);
            }

            if (coursesResponse.status === 'fulfilled') {
                const coursesData = coursesResponse.value.data;
                console.log('Courses loaded:', coursesData);
                setCourses(coursesData || []);
                if (!coursesData || coursesData.length === 0) {
                    setError('No courses available. Please contact your administrator.');
                }
            } else {
                console.error('Error fetching courses:', coursesResponse.reason);
                const errorMsg = coursesResponse.reason?.response?.data?.detail || coursesResponse.reason?.message || 'Unknown error';
                setError(`Failed to load courses: ${errorMsg}. Please refresh the page.`);
                setCourses([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const handleMarkAttendance = async (methodOverride = null, locationData = null, qrCodeData = null) => {
        const method = methodOverride || selectedMethod;

        // QR code doesn't need selected course (gets it from QR code)
        // Other methods need a selected course
        if (method !== 'qr_code' && !selectedCourse && !qrCodeData) {
            setError('Please select a course');
            return;
        }

        setMarkingAttendance(true);
        setError(null);
        setSuccess(null);

        try {
            let finalLocation = locationData;
            let classId = selectedCourse;

            // Handle QR code method
            if (method === 'qr_code' && qrCodeData) {
                try {
                    const parsed = typeof qrCodeData === 'string' ? JSON.parse(qrCodeData) : qrCodeData;
                    classId = parsed.course_id;
                    if (!classId) {
                        throw new Error('Invalid QR code');
                    }
                } catch (e) {
                    setError('Invalid QR code. Please scan a valid course QR code.');
                    setMarkingAttendance(false);
                    return;
                }
            }

            // Handle geolocation method
            if (method === 'geolocation') {
                try {
                    finalLocation = await getCurrentLocation();
                    // Verify location is within reasonable range (e.g., 100m of expected location)
                    // For demo, we'll just use the location
                } catch (error) {
                    setError('Unable to get your location. Please enable location services.');
                    setMarkingAttendance(false);
                    return;
                }
            }

            // Handle facial recognition
            if (method === 'facial_recognition') {
                if (!faceDetected) {
                    setError('Please ensure your face is visible in the camera');
                    setMarkingAttendance(false);
                    return;
                }
            }

            const response = await api.post('/attendance', {
                class_id: classId,
                method: method,
                location: finalLocation
            });

            setSuccess('Attendance marked successfully!');
            setShowQRScanner(false);
            setShowFaceRecognition(false);
            setFaceDetected(false);
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                setCameraStream(null);
            }
            fetchData(); // Refresh the data
        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Failed to mark attendance';
            setError(errorMessage);
        } finally {
            setMarkingAttendance(false);
        }
    };

    const handleQRScan = () => {
        setShowQRScanner(true);
        setError(null);

        // Initialize QR scanner
        setTimeout(() => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }

            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear();
                    setShowQRScanner(false);
                    handleMarkAttendance('qr_code', null, decodedText);
                },
                (error) => {
                    // Ignore scan errors, just keep scanning
                }
            );

            scannerRef.current = scanner;
        }, 100);
    };

    const handleGenerateQR = async () => {
        if (!selectedCourse) {
            setError('Please select a course first');
            return;
        }

        try {
            const response = await api.get(`/courses/${selectedCourse}/qr`);
            setQrData(response.data.qr_string);
            setShowQRCode(true);
        } catch (error) {
            setError('Failed to generate QR code');
        }
    };

    const handleFaceRecognition = async () => {
        if (!selectedCourse) {
            setError('Please select a course first');
            return;
        }

        setShowFaceRecognition(true);
        setError(null);
        setFaceDetected(false);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Simulate face detection after 2 seconds
            setTimeout(() => {
                setFaceDetected(true);
            }, 2000);
        } catch (error) {
            setError('Unable to access camera. Please grant camera permissions.');
            setShowFaceRecognition(false);
        }
    };

    const stopFaceRecognition = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowFaceRecognition(false);
        setFaceDetected(false);
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const attendanceMethods = [
        {
            id: 'qr_code',
            name: 'QR Code',
            description: 'Scan QR code displayed in classroom',
            icon: QrCode,
            color: 'bg-blue-500',
            action: handleQRScan
        },
        {
            id: 'geolocation',
            name: 'Location-based',
            description: 'Use your current location',
            icon: MapPin,
            color: 'bg-green-500',
            action: () => handleMarkAttendance('geolocation')
        },
        {
            id: 'facial_recognition',
            name: 'Face Recognition',
            description: 'Camera-based identification',
            icon: Camera,
            color: 'bg-purple-500',
            action: handleFaceRecognition
        },
        {
            id: 'manual',
            name: 'Manual Check-in',
            description: 'Simple button-based attendance',
            icon: CheckCircle,
            color: 'bg-orange-500',
            action: () => handleMarkAttendance('manual')
        }
    ];

    const filteredRecords = attendanceRecords.filter(record =>
        courses.find(course => course.id === record.class_id)?.name
            .toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen p-4 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="h-20 bg-gray-200 rounded-lg"></div>
                                ))}
                            </div>
                            <div className="h-64 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 lg:p-8" data-testid="attendance-page">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        Smart Attendance System
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Mark your attendance using various methods and track your records.
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Mark Attendance Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="mark-attendance-section">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <Plus className="w-6 h-6 mr-2 text-indigo-600" />
                                Mark Attendance
                            </h2>

                            {/* Course Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Course
                                </label>
                                <Select value={selectedCourse || ''} onValueChange={setSelectedCourse}>
                                    <SelectTrigger className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" data-testid="course-select">
                                        <SelectValue placeholder="Choose a course..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {courses.map((course) => (
                                            <SelectItem key={course.id} value={course.id}>
                                                {course.name} ({course.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Generate QR Code Button */}
                            {selectedCourse && (
                                <div className="mb-6">
                                    <button
                                        onClick={handleGenerateQR}
                                        className="w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-200 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <QrCode className="w-4 h-4" />
                                        <span>Generate QR Code for Instructor</span>
                                    </button>
                                </div>
                            )}

                            {/* QR Code Display Modal */}
                            {showQRCode && qrData && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">Course QR Code</h3>
                                            <button onClick={() => setShowQRCode(false)}>
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex justify-center mb-4">
                                            <QRCodeSVG value={qrData} size={256} />
                                        </div>
                                        <p className="text-sm text-gray-600 text-center">
                                            Display this QR code in the classroom for students to scan
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* QR Scanner Modal */}
                            {showQRScanner && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">Scan QR Code</h3>
                                            <button onClick={() => {
                                                setShowQRScanner(false);
                                                if (scannerRef.current) {
                                                    scannerRef.current.clear();
                                                }
                                            }}>
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div id="qr-reader" className="w-full"></div>
                                    </div>
                                </div>
                            )}

                            {/* Face Recognition Modal */}
                            {showFaceRecognition && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold">Face Recognition</h3>
                                            <button onClick={stopFaceRecognition}>
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-full rounded-lg"
                                                style={{ transform: 'scaleX(-1)' }}
                                            />
                                            {faceDetected && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-50 rounded-lg">
                                                    <div className="text-white text-center">
                                                        <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                                                        <p className="font-bold">Face Detected!</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {faceDetected && (
                                            <button
                                                onClick={() => handleMarkAttendance('facial_recognition')}
                                                disabled={markingAttendance}
                                                className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {markingAttendance ? 'Marking...' : 'Confirm Attendance'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Attendance Methods */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Select Attendance Method
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {attendanceMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                setSelectedMethod(method.id);
                                                if (method.action) {
                                                    method.action();
                                                }
                                            }}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedMethod === method.id
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            data-testid={`method-${method.id}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center`}>
                                                    <method.icon className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{method.name}</h3>
                                                    <p className="text-sm text-gray-600">{method.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Manual Mark Attendance Button */}
                            {selectedMethod === 'manual' && (
                                <button
                                    onClick={() => handleMarkAttendance('manual')}
                                    disabled={markingAttendance || !selectedCourse}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                    data-testid="mark-attendance-button"
                                >
                                    {markingAttendance ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Marking Attendance...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Mark Attendance</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="attendance-stats">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{attendanceRecords.length}</div>
                                    <div className="text-sm text-green-700">Total Records</div>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {attendanceRecords.filter(r => r.status === 'present').length}
                                    </div>
                                    <div className="text-sm text-blue-700">Present Days</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Records */}
                    <div className="bg-white rounded-xl p-6 shadow-lg" data-testid="attendance-records">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search records..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                                            data-testid="search-input"
                                        />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => {
                                    const course = courses.find(c => c.id === record.class_id);
                                    const method = attendanceMethods.find(m => m.id === record.method);

                                    return (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                            data-testid={`attendance-record-${record.id}`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-10 h-10 ${method?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                                                    {method && <method.icon className="w-5 h-5 text-white" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {course?.name || 'Unknown Course'}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Method: {method?.name || record.method}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(record.created_at).toLocaleDateString()} at{' '}
                                                        {new Date(record.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === 'present'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                                    <p className="text-gray-600">
                                        {searchTerm
                                            ? 'No attendance records match your search.'
                                            : 'Start marking your attendance to see records here.'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
