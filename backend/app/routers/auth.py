import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.core.dependencies import get_current_user
from backend.app.core.email import send_welcome_email
from backend.app.models.enums import UserRole
from backend.app.models.user import User
from backend.app.schemas.auth import UserRegisterRequest, LoginRequest, TokenResponse
from backend.app.schemas.user import UserRead

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new resident account",
)
def register_resident(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Self-registration for residents. New accounts are always assigned the RESIDENT role."""
    normalized_email = str(payload.email).lower().strip()

    # Check for existing email
    existing_user = db.scalars(
        select(User).where(User.email == normalized_email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    # Create new resident user (role forced to RESIDENT)
    new_user = User(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=hash_password(payload.password),
        role=UserRole.RESIDENT,
        flat_no=payload.flat_no.strip() if payload.flat_no else None,
        phone_number=payload.phone_number.strip() if payload.phone_number else None,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Post-commit welcome email notification (Zero-Rollback Guarantee)
    if new_user.email:
        try:
            send_welcome_email(
                resident_email=new_user.email,
                resident_name=new_user.name,
            )
        except Exception as exc:
            logger.error("Post-commit welcome email failed: %s", type(exc).__name__)

    # Generate JWT access token
    access_token = create_access_token(new_user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(new_user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with email and password",
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate user with email and password to receive a JWT access token."""
    normalized_email = str(payload.email).lower().strip()

    user = db.scalars(select(User).where(User.email == normalized_email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserRead:
    """Retrieve profile data for the authenticated user."""
    return UserRead.model_validate(current_user)
