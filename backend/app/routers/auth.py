from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.core.database import get_session
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_verification_token,
    verify_token,
    get_current_user,
    get_current_active_user
)
from app.models.person import Person, PersonCreate, PersonResponse, PersonUpdate
from app.services.email_service import send_verification_email, send_welcome_email
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Autenticación"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: PersonResponse
    message: str

class RegisterResponse(BaseModel):
    message: str
    user: PersonResponse

class MessageResponse(BaseModel):
    message: str

@router.post("/register", response_model=RegisterResponse)
async def register(
    user_data: PersonCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):

    statement = select(Person).where(Person.email == user_data.email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado"
        )

    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )

    hashed_password = get_password_hash(user_data.password)
    new_user = Person(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        password=hashed_password,
        is_active=settings.AUTO_VERIFY_USERS,
        role_id=2,
        country_id=user_data.country_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    if settings.AUTO_VERIFY_USERS:
        message = "Usuario registrado exitosamente. Ya puedes iniciar sesión."
    else:
        verification_token = create_verification_token(new_user.email)
        background_tasks.add_task(
            send_verification_email,
            new_user.email,
            new_user.first_name,
            verification_token
        )
        message = "Usuario registrado exitosamente. Por favor verifica tu correo electrónico."

    return RegisterResponse(
        message=message,
        user=PersonResponse(
            id=new_user.id,
            first_name=new_user.first_name,
            last_name=new_user.last_name,
            email=new_user.email,
            is_active=new_user.is_active,
            country_id=new_user.country_id,
            role_id=new_user.role_id,
            created_at=new_user.created_at
        )
    )

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    session: Session = Depends(get_session)
):

    statement = select(Person).where(Person.email == login_data.email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )

    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no está activada. Por favor verifica tu correo electrónico."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role_id})

    return LoginResponse(
        token=access_token,
        user=PersonResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            profile_image_url=user.profile_image_url,
            birthday_date=user.birthday_date,
            is_active=user.is_active,
            country_id=user.country_id,
            role_id=user.role_id,
            created_at=user.created_at
        ),
        message="Inicio de sesión exitoso"
    )

@router.get("/verify/{token}", response_model=MessageResponse)
async def verify_email(
    token: str,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):

    payload = verify_token(token)

    if not payload or payload.get("type") != "verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificación inválido o expirado"
        )

    email = payload.get("sub")

    statement = select(Person).where(Person.email == email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if user.is_active:
        return MessageResponse(message="Tu cuenta ya está verificada")

    user.is_active = True
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()

    background_tasks.add_task(send_welcome_email, user.email, user.first_name)

    return MessageResponse(message="¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.")

@router.get("/profile", response_model=PersonResponse)
async def get_profile(
    current_user: Person = Depends(get_current_active_user)
):

    return PersonResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        profile_image_url=current_user.profile_image_url,
        description=current_user.description,
        birthday_date=current_user.birthday_date,
        is_active=current_user.is_active,
        country_id=current_user.country_id,
        role_id=current_user.role_id,
        created_at=current_user.created_at
    )

@router.put("/profile", response_model=PersonResponse)
async def update_profile(
    profile_data: PersonUpdate,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    if profile_data.first_name is not None:
        current_user.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        current_user.last_name = profile_data.last_name
    if profile_data.profile_image_url is not None:
        current_user.profile_image_url = profile_data.profile_image_url
    if profile_data.description is not None:
        current_user.description = profile_data.description
    if profile_data.birthday_date is not None:
        current_user.birthday_date = profile_data.birthday_date
    if profile_data.country_id is not None:
        current_user.country_id = profile_data.country_id

    current_user.updated_at = datetime.utcnow()

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return PersonResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        profile_image_url=current_user.profile_image_url,
        description=current_user.description,
        birthday_date=current_user.birthday_date,
        is_active=current_user.is_active,
        country_id=current_user.country_id,
        role_id=current_user.role_id,
        created_at=current_user.created_at
    )

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    email: EmailStr,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):

    statement = select(Person).where(Person.email == email)
    user = session.exec(statement).first()

    if not user:
        return MessageResponse(message="Si el correo existe, recibirás un email de verificación.")

    if user.is_active:
        return MessageResponse(message="Tu cuenta ya está verificada. Puedes iniciar sesión.")

    verification_token = create_verification_token(user.email)
    background_tasks.add_task(
        send_verification_email,
        user.email,
        user.first_name,
        verification_token
    )

    return MessageResponse(message="Si el correo existe, recibirás un email de verificación.")
