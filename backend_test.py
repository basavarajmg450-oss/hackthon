import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class CampusManagementAPITester:
    def __init__(self, base_url="https://eduhub-36.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_password = "TestPass123!"
        self.test_user_data = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": "Test User",
            "student_id": f"STU{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "department": "Computer Science",
            "year": 2,
            "role": "student"
        }

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test_name": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_health_check(self):
        """Test API health check"""
        success, response_data, status_code = self.make_request('GET', '', expected_status=200)
        self.log_result("API Health Check", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        return success

    def test_user_registration(self):
        """Test user registration"""
        success, response_data, status_code = self.make_request(
            'POST', 'auth/register', self.test_user_data, expected_status=200
        )
        
        if success and response_data.get('access_token'):
            self.token = response_data['access_token']
            self.user_id = response_data.get('user', {}).get('id')
            
        self.log_result("User Registration", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        return success

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, response_data, status_code = self.make_request(
            'POST', 'auth/login', login_data, expected_status=200
        )
        
        if success and response_data.get('access_token'):
            self.token = response_data['access_token']
            self.user_id = response_data.get('user', {}).get('id')
            
        self.log_result("User Login", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        return success

    def test_get_user_info(self):
        """Test getting current user info"""
        success, response_data, status_code = self.make_request('GET', 'users/me')
        self.log_result("Get User Info", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response_data, status_code = self.make_request('GET', 'dashboard/stats')
        
        # Check if response has expected fields
        if success and response_data:
            expected_fields = ['attendance_records', 'registered_events', 'study_groups', 'total_courses']
            has_all_fields = all(field in response_data for field in expected_fields)
            if not has_all_fields:
                success = False
                
        self.log_result("Dashboard Statistics", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        return success

    def test_courses_crud(self):
        """Test courses CRUD operations"""
        # Get courses
        success, response_data, status_code = self.make_request('GET', 'courses')
        self.log_result("Get Courses", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        
        # Create course (if user has permission)
        course_data = {
            "name": "Test Course",
            "code": "TEST101",
            "department": "Computer Science",
            "credits": 3,
            "description": "A test course for API testing",
            "schedule": [{"day": "Monday", "time": "09:00-10:30", "room": "A101"}]
        }
        
        create_success, create_response, create_status = self.make_request(
            'POST', 'courses', course_data, expected_status=200
        )
        self.log_result("Create Course", create_success, 
                       f"Status: {create_status}" if not create_success else "", create_response)
        
        return success

    def test_attendance_system(self):
        """Test attendance marking system"""
        # First get courses to mark attendance for
        courses_success, courses_data, _ = self.make_request('GET', 'courses')
        
        if not courses_success or not courses_data:
            self.log_result("Attendance System - Get Courses", False, "No courses available for attendance")
            return False
        
        # Use first course or create a dummy course ID
        course_id = courses_data[0]['id'] if courses_data else str(uuid.uuid4())
        
        # Test different attendance methods
        methods = ['qr_code', 'manual', 'geolocation', 'facial_recognition']
        
        for method in methods:
            attendance_data = {
                "class_id": course_id,
                "method": method,
                "location": {"lat": 40.7128, "lng": -74.0060} if method == 'geolocation' else None
            }
            
            success, response_data, status_code = self.make_request(
                'POST', 'attendance', attendance_data, expected_status=200
            )
            
            self.log_result(f"Mark Attendance - {method}", success, 
                           f"Status: {status_code}" if not success else "", response_data)
            
            # Only test one method to avoid duplicate attendance error
            if success:
                break
        
        # Get attendance records
        success, response_data, status_code = self.make_request('GET', 'attendance/my')
        self.log_result("Get My Attendance", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        
        return success

    def test_events_system(self):
        """Test events management system"""
        # Get events
        success, response_data, status_code = self.make_request('GET', 'events')
        self.log_result("Get Events", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        
        # Create event
        event_data = {
            "title": "Test Event",
            "description": "A test event for API testing",
            "date": (datetime.now() + timedelta(days=7)).isoformat(),
            "location": "Test Hall",
            "category": "academic",
            "max_participants": 50
        }
        
        create_success, create_response, create_status = self.make_request(
            'POST', 'events', event_data, expected_status=200
        )
        self.log_result("Create Event", create_success, 
                       f"Status: {create_status}" if not create_success else "", create_response)
        
        # Register for event if created successfully
        if create_success and create_response.get('id'):
            event_id = create_response['id']
            register_success, register_response, register_status = self.make_request(
                'POST', f'events/{event_id}/register', expected_status=200
            )
            self.log_result("Register for Event", register_success, 
                           f"Status: {register_status}" if not register_success else "", register_response)
        
        return success

    def test_study_groups_system(self):
        """Test study groups system"""
        # Get study groups
        success, response_data, status_code = self.make_request('GET', 'study-groups')
        self.log_result("Get Study Groups", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        
        # Create study group
        group_data = {
            "name": "Test Study Group",
            "description": "A test study group for API testing",
            "max_members": 10,
            "meeting_link": "https://zoom.us/j/test123",
            "schedule": {"day": "Monday", "time": "14:00"}
        }
        
        create_success, create_response, create_status = self.make_request(
            'POST', 'study-groups', group_data, expected_status=200
        )
        self.log_result("Create Study Group", create_success, 
                       f"Status: {create_status}" if not create_success else "", create_response)
        
        # Join study group if created successfully
        if create_success and create_response.get('id'):
            group_id = create_response['id']
            # Since creator is automatically added, test with a different user would be needed
            # For now, just test the endpoint
            join_success, join_response, join_status = self.make_request(
                'POST', f'study-groups/{group_id}/join', expected_status=400  # Expect 400 since already a member
            )
            # This should fail with "Already a member" which is expected behavior
            self.log_result("Join Study Group (Expected Failure)", join_status == 400, 
                           f"Status: {join_status}" if join_status != 400 else "Already a member (expected)", join_response)
        
        return success

    def test_ai_chat_system(self):
        """Test AI Campus Helper chat system"""
        # Test chat functionality
        chat_data = {
            "message": "Hello, can you help me with course information?",
            "session_id": f"test_session_{datetime.now().strftime('%H%M%S')}"
        }
        
        success, response_data, status_code = self.make_request(
            'POST', 'chat', chat_data, expected_status=200
        )
        
        # Check if response has expected fields
        if success and response_data:
            has_response = 'response' in response_data
            has_session_id = 'session_id' in response_data
            if not (has_response and has_session_id):
                success = False
                
        self.log_result("AI Chat System", success, 
                       f"Status: {status_code}" if not success else "", response_data)
        
        # Test chat history
        history_success, history_data, history_status = self.make_request('GET', 'chat/history')
        self.log_result("Get Chat History", history_success, 
                       f"Status: {history_status}" if not history_success else "", history_data)
        
        return success and history_success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Campus Management Platform API Tests")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("API Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Get User Info", self.test_get_user_info),
            ("Dashboard Statistics", self.test_dashboard_stats),
            ("Courses System", self.test_courses_crud),
            ("Attendance System", self.test_attendance_system),
            ("Events System", self.test_events_system),
            ("Study Groups System", self.test_study_groups_system),
            ("AI Chat System", self.test_ai_chat_system),
        ]
        
        for test_name, test_func in tests:
            print(f"\n📋 Running: {test_name}")
            try:
                test_func()
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        return self.tests_passed, self.tests_run, self.test_results

def main():
    """Main test execution"""
    tester = CampusManagementAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())