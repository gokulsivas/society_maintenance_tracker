from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    RESIDENT = "RESIDENT"


class ComplaintCategory(str, Enum):
    PLUMBING = "PLUMBING"
    ELECTRICAL = "ELECTRICAL"
    CARPENTRY = "CARPENTRY"
    CLEANLINESS = "CLEANLINESS"
    SECURITY = "SECURITY"
    OTHER = "OTHER"


class ComplaintPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ComplaintStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
