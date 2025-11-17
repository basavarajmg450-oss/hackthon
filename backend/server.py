
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
try:
    from motor.motor_asyncio import AsyncIOMotorClient  # type: ignore
except Exception:
    AsyncIOMotorClient = None  # type: ignore
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from passlib.context import CryptContext
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
    EMERGENT_AVAILABLE = True
except Exception:
    LlmChat = None  # type: ignore
    UserMessage = None  # type: ignore
    EMERGENT_AVAILABLE = False
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
MEMORY_DB = os.environ.get('MEMORY_DB', '1') == '1'
client = AsyncIOMotorClient(mongo_url) if (mongo_url and not MEMORY_DB and AsyncIOMotorClient) else None
db = client[os.environ['DB_NAME']] if client else None

# In-memory fallback (dev convenience only)
users_memory: list[dict] = []
attendance_memory: list[dict] = []
courses_memory: list[dict] = []

# Initialize sample courses for development
def init_sample_courses():
    """Initialize sample courses for testing"""
    if not courses_memory:
        sample_courses = [
            {
                "id": str(uuid.uuid4()),
                "name": "Introduction to Computer Science",
                "code": "CS101",
                "instructor_id": "system",
                "department": "Computer Science",
                "credits": 3,
                "description": "Fundamental concepts of computer science including programming, algorithms, and data structures.",
                "schedule": [{"day": "Monday", "time": "09:00-10:30", "room": "A101"}, {"day": "Wednesday", "time": "09:00-10:30", "room": "A101"}],
                "enrolled_students": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Data Structures and Algorithms",
                "code": "CS201",
                "instructor_id": "system",
                "department": "Computer Science",
                "credits": 4,
                "description": "Advanced data structures, algorithm design, and complexity analysis.",
                "schedule": [{"day": "Tuesday", "time": "11:00-12:30", "room": "B205"}, {"day": "Thursday", "time": "11:00-12:30", "room": "B205"}],
                "enrolled_students": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Database Management Systems",
                "code": "CS301",
                "instructor_id": "system",
                "department": "Computer Science",
                "credits": 3,
                "description": "Design and implementation of database systems, SQL, and data modeling.",
                "schedule": [{"day": "Monday", "time": "14:00-15:30", "room": "C301"}, {"day": "Wednesday", "time": "14:00-15:30", "room": "C301"}],
                "enrolled_students": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Web Development",
                "code": "CS401",
                "instructor_id": "system",
                "department": "Computer Science",
                "credits": 3,
                "description": "Modern web development using React, Node.js, and full-stack frameworks.",
                "schedule": [{"day": "Tuesday", "time": "14:00-16:00", "room": "D401"}, {"day": "Friday", "time": "14:00-16:00", "room": "D401"}],
                "enrolled_students": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        courses_memory.extend(sample_courses)

# Initialize sample courses on startup
init_sample_courses()

# Create the main app without a prefix
app = FastAPI(title="Campus Management Platform API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-this-in-dev")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        if MEMORY_DB or not db:
            user = next((u for u in users_memory if u["id"] == user_id), None)
        else:
            user = await db.users.find_one({"id": user_id}, {"_id": 0})

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

def parse_from_mongo(data):
    """Convert ISO strings back to datetime objects from MongoDB"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, str) and key in ['created_at', 'updated_at', 'timestamp', 'date', 'check_in_time', 'check_out_time']:
                try:
                    data[key] = datetime.fromisoformat(value)
                except:
                    pass
            elif isinstance(value, dict):
                data[key] = parse_from_mongo(value)
            elif isinstance(value, list):
                data[key] = [parse_from_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    student_id: Optional[str] = None
    full_name: str
    role: str = Field(default="student")  # student, faculty, admin
    password_hash: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    profile_image: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class UserCreate(BaseModel):
    email: EmailStr
    student_id: Optional[str] = None
    full_name: str
    password: str
    role: str = Field(default="student")
    department: Optional[str] = None
    year: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AttendanceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    class_id: str
    method: str  # qr_code, facial_recognition, manual, geolocation
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    location: Optional[Dict] = None  # {lat: float, lng: float}
    status: str = Field(default="present")  # present, absent, late
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceCreate(BaseModel):
    class_id: str
    method: str
    location: Optional[Dict] = None

class Course(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    instructor_id: str
    department: str
    credits: int
    description: Optional[str] = None
    schedule: List[Dict] = []  # [{"day": "Monday", "time": "09:00-10:30", "room": "A101"}]
    enrolled_students: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CourseCreate(BaseModel):
    name: str
    code: str
    department: str
    credits: int
    description: Optional[str] = None
    schedule: List[Dict] = []

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    organizer_id: str
    date: datetime
    location: str
    category: str  # academic, cultural, sports, workshop
    max_participants: Optional[int] = None
    registered_users: List[str] = []
    is_active: bool = Field(default=True)
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime
    location: str
    category: str
    max_participants: Optional[int] = None
    image_url: Optional[str] = None

class StudyGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    creator_id: str
    course_id: Optional[str] = None
    members: List[str] = []
    max_members: int = Field(default=10)
    is_active: bool = Field(default=True)
    meeting_link: Optional[str] = None
    schedule: Optional[Dict] = None  # {"day": "Monday", "time": "14:00"}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudyGroupCreate(BaseModel):
    name: str
    description: str
    course_id: Optional[str] = None
    max_members: int = Field(default=10)
    meeting_link: Optional[str] = None
    schedule: Optional[Dict] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

# Authentication Routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Hash password
    password_hash = get_password_hash(user_data.password)

    # Create user object
    user_data.email = user_data.email.lower()
    user = User(
        **user_data.model_dump(exclude={'password'}),
        password_hash=password_hash
    )

    if MEMORY_DB or not db:
        # In-memory register
        if any(u["email"] == user.email for u in users_memory):
            raise HTTPException(status_code=400, detail="Email already registered")
        users_memory.append(user.model_dump())
    else:
        # MongoDB register
        existing_user = await db.users.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_dict = prepare_for_mongo(user.model_dump())
        await db.users.insert_one(user_dict)

    # Create access token
    access_token = create_access_token(data={"sub": user.id})

    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    logging.info(f"Login attempt for email: {login_data.email}")
    try:
        login_data.email = login_data.email.lower()
        if MEMORY_DB or not db:
            user = next((u for u in users_memory if u["email"] == login_data.email), None)
        else:
            user = await db.users.find_one({"email": login_data.email}, {"_id": 0})

        if not user or not verify_password(login_data.password, user["password_hash"]):
            logging.warning(f"Invalid login attempt for email: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        logging.info(f"Successful login for email: {login_data.email}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error during login for email {login_data.email}: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# User Routes
@api_router.get("/users/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

# Course Routes
@api_router.get("/courses", response_model=List[Course])
async def get_courses():
    if MEMORY_DB or not db:
        # For in-memory, courses are already in the right format, just ensure created_at is datetime
        result = []
        for course in courses_memory:
            course_copy = course.copy()
            if isinstance(course_copy.get("created_at"), str):
                try:
                    course_copy["created_at"] = datetime.fromisoformat(course_copy["created_at"].replace('Z', '+00:00'))
                except:
                    pass
            result.append(parse_from_mongo(course_copy))
        return result
    else:
        courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
        return [parse_from_mongo(course) for course in courses]

@api_router.post("/courses", response_model=Course)
async def create_course(course_data: CourseCreate, current_user: dict = Depends(get_current_user)):
    course = Course(**course_data.model_dump(), instructor_id=current_user["id"])
    course_dict = prepare_for_mongo(course.model_dump())
    
    if MEMORY_DB or not db:
        courses_memory.append(course_dict)
    else:
        await db.courses.insert_one(course_dict)
    
    return course

@api_router.get("/courses/{course_id}/qr")
async def get_course_qr(course_id: str):
    """Generate QR code data for a course"""
    if MEMORY_DB or not db:
        course = next((c for c in courses_memory if c["id"] == course_id), None)
    else:
        course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # QR code contains course ID and timestamp for validation
    qr_data = {
        "course_id": course_id,
        "course_code": course.get("code", ""),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return {"qr_data": qr_data, "qr_string": json.dumps(qr_data)}

# Attendance Routes
@api_router.post("/attendance", response_model=AttendanceRecord)
async def mark_attendance(attendance_data: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    # Check if already marked for today
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    if MEMORY_DB or not db:
        # In-memory check
        existing = None
        for a in attendance_memory:
            if a["user_id"] == current_user["id"] and a["class_id"] == attendance_data.class_id:
                try:
                    created_at = a.get("created_at")
                    if isinstance(created_at, str):
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    elif isinstance(created_at, datetime):
                        pass
                    else:
                        continue
                    if today_start <= created_at <= today_end:
                        existing = a
                        break
                except:
                    continue
        if existing:
            raise HTTPException(status_code=400, detail="Attendance already marked for today")
    else:
        existing = await db.attendance.find_one({
            "user_id": current_user["id"],
            "class_id": attendance_data.class_id,
            "created_at": {
                "$gte": today_start.isoformat(),
                "$lt": today_end.isoformat()
            }
        })
        if existing:
            raise HTTPException(status_code=400, detail="Attendance already marked for today")
    
    attendance = AttendanceRecord(
        user_id=current_user["id"],
        **attendance_data.model_dump(),
        check_in_time=datetime.now(timezone.utc)
    )
    
    attendance_dict = prepare_for_mongo(attendance.model_dump())
    
    if MEMORY_DB or not db:
        attendance_memory.append(attendance_dict)
    else:
        await db.attendance.insert_one(attendance_dict)
    
    return attendance

@api_router.get("/attendance/my", response_model=List[AttendanceRecord])
async def get_my_attendance(current_user: dict = Depends(get_current_user)):
    if MEMORY_DB or not db:
        records = [a for a in attendance_memory if a["user_id"] == current_user["id"]]
        return [parse_from_mongo(record) for record in records]
    else:
        attendance_records = await db.attendance.find(
            {"user_id": current_user["id"]}, {"_id": 0}
        ).to_list(1000)
        return [parse_from_mongo(record) for record in attendance_records]

# Event Routes
@api_router.get("/events", response_model=List[Event])
async def get_events():
    if MEMORY_DB or not db:
        return []
    events = await db.events.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return [parse_from_mongo(event) for event in events]

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    if not db:
        raise HTTPException(status_code=503, detail="Events store not configured")
    event = Event(**event_data.model_dump(), organizer_id=current_user["id"])
    event_dict = prepare_for_mongo(event.model_dump())
    await db.events.insert_one(event_dict)
    return event

@api_router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, current_user: dict = Depends(get_current_user)):
    if not db:
        raise HTTPException(status_code=503, detail="Events store not configured")
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user["id"] in event.get("registered_users", []):
        raise HTTPException(status_code=400, detail="Already registered for this event")
    
    if event.get("max_participants") and len(event.get("registered_users", [])) >= event["max_participants"]:
        raise HTTPException(status_code=400, detail="Event is full")
    
    await db.events.update_one(
        {"id": event_id},
        {"$push": {"registered_users": current_user["id"]}}
    )
    
    return {"message": "Successfully registered for event"}

# Study Group Routes
@api_router.get("/study-groups", response_model=List[StudyGroup])
async def get_study_groups():
    if MEMORY_DB or not db:
        return []
    groups = await db.study_groups.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return [parse_from_mongo(group) for group in groups]

@api_router.post("/study-groups", response_model=StudyGroup)
async def create_study_group(group_data: StudyGroupCreate, current_user: dict = Depends(get_current_user)):
    if not db:
        raise HTTPException(status_code=503, detail="Study groups store not configured")
    group = StudyGroup(
        **group_data.model_dump(),
        creator_id=current_user["id"],
        members=[current_user["id"]]
    )
    group_dict = prepare_for_mongo(group.model_dump())
    await db.study_groups.insert_one(group_dict)
    return group

@api_router.post("/study-groups/{group_id}/join")
async def join_study_group(group_id: str, current_user: dict = Depends(get_current_user)):
    if not db:
        raise HTTPException(status_code=503, detail="Study groups store not configured")
    group = await db.study_groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    
    if current_user["id"] in group.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member of this group")
    
    if len(group.get("members", [])) >= group.get("max_members", 10):
        raise HTTPException(status_code=400, detail="Study group is full")
    
    await db.study_groups.update_one(
        {"id": group_id},
        {"$push": {"members": current_user["id"]}}
    )
    
    return {"message": "Successfully joined study group"}

# Campus Helper Bot Routes
@api_router.post("/chat")
async def chat_with_bot(chat_request: ChatRequest, current_user: dict = Depends(get_current_user)):
    session_id = chat_request.session_id or str(uuid.uuid4())
    
    # Mock responses for development when Emergent is not available
    def get_mock_response(message: str) -> str:
        message_lower = message.lower().strip()
        if message_lower in ['hi', 'hello', 'hey', 'hlo']:
            return "Hello! I'm your campus assistant. How can I help you today? I can assist with course information, campus navigation, events, study groups, and more!"
        elif 'course' in message_lower:
            return "I can help you with course information! You can view all available courses in the Courses section. Would you like to know about a specific course?"
        elif 'event' in message_lower:
            return "You can find upcoming campus events in the Events section. Would you like to know about any specific event?"
        elif 'attendance' in message_lower:
            return "You can mark your attendance in the Attendance section. Attendance can be marked using QR codes, facial recognition, or geolocation."
        elif 'study group' in message_lower or 'study' in message_lower:
            return "Study groups are a great way to collaborate! You can join or create study groups in the Study Groups section."
        else:
            return f"Thanks for your message: '{message}'. I'm a campus assistant bot. In development mode, I provide basic responses. For full AI capabilities, please configure the EMERGENT_LLM_KEY. How else can I help you with campus life?"
    
    # Check if Emergent is available and API key is set
    if not EMERGENT_AVAILABLE or not EMERGENT_LLM_KEY:
        response = get_mock_response(chat_request.message)
        return {
            "response": response,
            "session_id": session_id
        }

    try:
        system_message = """You are a helpful campus assistant bot for a university management platform. 
        You can help with:
        1. Course information and schedules
        2. Campus navigation and facilities
        3. Academic support and FAQ
        4. Event information
        5. Study group recommendations
        6. General campus life questions
        
        Provide helpful, accurate, and friendly responses. Keep responses concise but informative."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-2.5-pro")
        user_message = UserMessage(text=chat_request.message)
        response = await chat.send_message(user_message)
        
        if db:
            chat_record = ChatMessage(
                user_id=current_user["id"],
                session_id=session_id,
                message=chat_request.message,
                response=response
            )
            chat_dict = prepare_for_mongo(chat_record.model_dump())
            await db.chat_history.insert_one(chat_dict)
        return {"response": response, "session_id": session_id}
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        # Fallback to mock response on error
        response = get_mock_response(chat_request.message)
        return {"response": response, "session_id": session_id}

@api_router.get("/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    if not db:
        return []
    history = await db.chat_history.find(
        {"user_id": current_user["id"]}, {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    return [parse_from_mongo(record) for record in history]

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if MEMORY_DB or not db:
        # In-memory stats
        attendance_count = len([a for a in attendance_memory if a["user_id"] == current_user["id"]])
        total_courses = len(courses_memory)
        # For events and study groups, return 0 in memory mode
        return {
            "attendance_records": attendance_count,
            "registered_events": 0,
            "study_groups": 0,
            "total_courses": total_courses
        }
    else:
        # MongoDB stats
        attendance_count = await db.attendance.count_documents({"user_id": current_user["id"]})
        registered_events = await db.events.count_documents({
            "registered_users": {"$in": [current_user["id"]]}
        })
        study_groups = await db.study_groups.count_documents({
            "members": {"$in": [current_user["id"]]}
        })
        total_courses = await db.courses.count_documents({})
        
        return {
            "attendance_records": attendance_count,
            "registered_events": registered_events,
            "study_groups": study_groups,
            "total_courses": total_courses
        }

# Root route
@api_router.get("/")
async def root():
    return {"message": "Campus Management Platform API", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()
