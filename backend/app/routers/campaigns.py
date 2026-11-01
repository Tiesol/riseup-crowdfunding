from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from datetime import datetime, date
import math

from app.core.database import get_session
from app.core.security import get_current_active_user, get_current_admin_user
from app.models.person import Person
from app.models.donation import Donation
from app.models.campaign import (
    Campaign,
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignPublic,
    CampaignDetailPublic,
    CampaignPaginatedResponse
)
from app.models.category import Category
from app.models.campaign_observation import CampaignObservation, CampaignObservationResponse

router = APIRouter(prefix="/campaigns", tags=["Campañas"])

ACCENTS, PLAIN = "áéíóúüñ", "aeiouun"

def normalize_sql(column):
    return func.translate(func.lower(column), ACCENTS, PLAIN)

def normalize_text(text: str) -> str:
    return text.lower().translate(str.maketrans(ACCENTS, PLAIN))

@router.get("/public", response_model=CampaignPaginatedResponse)
async def get_public_campaigns(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=9, le=100),
    session: Session = Depends(get_session)
):

    base_where = [
        Campaign.workflow_state_id == 5,
        Campaign.campaign_state_id == 2
    ]

    if category_id:
        base_where.append(Campaign.category_id == category_id)

    # Cada palabra debe aparecer en el título, la descripción o el nombre de la categoría (sin importar tildes)
    for word in normalize_text(search or "").split():
        pattern = f"%{word}%"
        matching_categories = select(Category.id).where(normalize_sql(Category.name).like(pattern))
        base_where.append(
            normalize_sql(Campaign.tittle).like(pattern) |
            normalize_sql(Campaign.description).like(pattern) |
            Campaign.category_id.in_(matching_categories)
        )

    count_statement = select(func.count(Campaign.id)).where(*base_where)
    total = session.exec(count_statement).one()

    offset = (page - 1) * page_size
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    statement = select(Campaign).where(*base_where).offset(offset).limit(page_size)
    campaigns = session.exec(statement).all()

    result = []
    for campaign in campaigns:
        progress = 0.0
        if campaign.goal_amount and campaign.goal_amount > 0:
            progress = float(campaign.current_amount / campaign.goal_amount * 100)

        user = session.get(Person, campaign.user_id)
        category = session.get(Category, campaign.category_id) if campaign.category_id else None

        result.append(CampaignPublic(
            id=campaign.id,
            tittle=campaign.tittle,
            description=campaign.description,
            goal_amount=campaign.goal_amount,
            current_amount=campaign.current_amount,
            expiration_date=campaign.expiration_date,
            main_image_url=campaign.main_image_url,
            view_counting=campaign.view_counting,
            favorites_counting=campaign.favorites_counting,
            user_first_name=user.first_name if user else None,
            user_last_name=user.last_name if user else None,
            user_profile_image_url=user.profile_image_url if user else None,
            category_name=category.name if category else None,
            progress_percentage=round(progress, 2)
        ))

    return CampaignPaginatedResponse(
        items=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/featured", response_model=List[CampaignPublic])
async def get_featured_campaigns(
    limit: int = Query(default=6, le=20),
    session: Session = Depends(get_session)
):

    statement = select(Campaign).where(
        Campaign.workflow_state_id == 5,
        Campaign.campaign_state_id == 2
    ).order_by(Campaign.favorites_counting.desc()).limit(limit)

    campaigns = session.exec(statement).all()

    result = []
    for campaign in campaigns:
        progress = 0.0
        if campaign.goal_amount and campaign.goal_amount > 0:
            progress = float(campaign.current_amount / campaign.goal_amount * 100)

        user = session.get(Person, campaign.user_id)
        category = session.get(Category, campaign.category_id) if campaign.category_id else None

        result.append(CampaignPublic(
            id=campaign.id,
            tittle=campaign.tittle,
            description=campaign.description,
            goal_amount=campaign.goal_amount,
            current_amount=campaign.current_amount,
            expiration_date=campaign.expiration_date,
            main_image_url=campaign.main_image_url,
            view_counting=campaign.view_counting,
            favorites_counting=campaign.favorites_counting,
            user_first_name=user.first_name if user else None,
            user_last_name=user.last_name if user else None,
            user_profile_image_url=user.profile_image_url if user else None,
            category_name=category.name if category else None,
            progress_percentage=round(progress, 2)
        ))

    return result

@router.get("/popular", response_model=List[CampaignPublic])
async def get_popular_campaigns(
    limit: int = Query(default=6, le=20),
    session: Session = Depends(get_session)
):

    statement = select(Campaign).where(
        Campaign.workflow_state_id == 5,
        Campaign.campaign_state_id == 2
    ).order_by(Campaign.view_counting.desc()).limit(limit)

    campaigns = session.exec(statement).all()

    result = []
    for campaign in campaigns:
        progress = 0.0
        if campaign.goal_amount and campaign.goal_amount > 0:
            progress = float(campaign.current_amount / campaign.goal_amount * 100)

        user = session.get(Person, campaign.user_id)
        category = session.get(Category, campaign.category_id) if campaign.category_id else None

        result.append(CampaignPublic(
            id=campaign.id,
            tittle=campaign.tittle,
            description=campaign.description,
            goal_amount=campaign.goal_amount,
            current_amount=campaign.current_amount,
            expiration_date=campaign.expiration_date,
            main_image_url=campaign.main_image_url,
            view_counting=campaign.view_counting,
            favorites_counting=campaign.favorites_counting,
            user_first_name=user.first_name if user else None,
            user_last_name=user.last_name if user else None,
            user_profile_image_url=user.profile_image_url if user else None,
            category_name=category.name if category else None,
            progress_percentage=round(progress, 2)
        ))

    return result

@router.get("/public/{campaign_id}", response_model=CampaignDetailPublic)
async def get_public_campaign_detail(
    campaign_id: int,
    session: Session = Depends(get_session)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.workflow_state_id != 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta campaña no está disponible públicamente"
        )

    campaign.view_counting += 1
    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    user = session.get(Person, campaign.user_id)
    category = session.get(Category, campaign.category_id) if campaign.category_id else None

    progress = 0.0
    if campaign.goal_amount and campaign.goal_amount > 0:
        progress = float(campaign.current_amount / campaign.goal_amount * 100)

    return CampaignDetailPublic(
        id=campaign.id,
        tittle=campaign.tittle,
        description=campaign.description,
        goal_amount=campaign.goal_amount,
        current_amount=campaign.current_amount,
        expiration_date=campaign.expiration_date,
        main_image_url=campaign.main_image_url,
        rich_text=campaign.rich_text,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        view_counting=campaign.view_counting,
        favorites_counting=campaign.favorites_counting,
        workflow_state_id=campaign.workflow_state_id,
        campaign_state_id=campaign.campaign_state_id,
        category_id=campaign.category_id,
        category_name=category.name if category else None,
        user_id=campaign.user_id,
        user_first_name=user.first_name if user else None,
        user_last_name=user.last_name if user else None,
        user_profile_image_url=user.profile_image_url if user else None,
        progress_percentage=round(progress, 2)
    )

@router.get("/my-campaigns", response_model=List[CampaignResponse])
async def get_my_campaigns(
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    statement = select(Campaign).where(Campaign.user_id == current_user.id)
    campaigns = session.exec(statement).all()

    return campaigns

@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    campaign_data: CampaignCreate,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    if campaign_data.expiration_date:
        today = date.today()
        if campaign_data.expiration_date <= today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fecha de expiración debe ser futura"
            )

    new_campaign = Campaign(
        tittle=campaign_data.tittle,
        description=campaign_data.description,
        goal_amount=campaign_data.goal_amount,
        expiration_date=campaign_data.expiration_date,
        main_image_url=campaign_data.main_image_url,
        rich_text=campaign_data.rich_text,
        category_id=campaign_data.category_id,
        user_id=current_user.id,
        workflow_state_id=1,
        campaign_state_id=1,
        current_amount=0,
        view_counting=0,
        favorites_counting=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(new_campaign)
    session.commit()
    session.refresh(new_campaign)

    return new_campaign

@router.get("/{campaign_id}", response_model=CampaignDetailPublic)
async def get_campaign(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id and current_user.role_id != 1:
        if campaign.workflow_state_id != 5:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta campaña"
            )

    user = session.get(Person, campaign.user_id)
    category = session.get(Category, campaign.category_id) if campaign.category_id else None

    progress = 0.0
    if campaign.goal_amount and campaign.goal_amount > 0:
        progress = float(campaign.current_amount / campaign.goal_amount * 100)

    return CampaignDetailPublic(
        id=campaign.id,
        tittle=campaign.tittle,
        description=campaign.description,
        goal_amount=campaign.goal_amount,
        current_amount=campaign.current_amount,
        expiration_date=campaign.expiration_date,
        main_image_url=campaign.main_image_url,
        rich_text=campaign.rich_text,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        view_counting=campaign.view_counting,
        favorites_counting=campaign.favorites_counting,
        workflow_state_id=campaign.workflow_state_id,
        campaign_state_id=campaign.campaign_state_id,
        category_id=campaign.category_id,
        category_name=category.name if category else None,
        user_id=campaign.user_id,
        user_first_name=user.first_name if user else None,
        user_last_name=user.last_name if user else None,
        user_profile_image_url=user.profile_image_url if user else None,
        progress_percentage=round(progress, 2)
    )

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para editar esta campaña"
        )

    if campaign.workflow_state_id not in [1, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes editar una campaña en este estado"
        )

    if campaign_data.tittle is not None:
        campaign.tittle = campaign_data.tittle
    if campaign_data.description is not None:
        campaign.description = campaign_data.description
    if campaign_data.goal_amount is not None:
        campaign.goal_amount = campaign_data.goal_amount
    if campaign_data.expiration_date is not None:
        campaign.expiration_date = campaign_data.expiration_date
    if campaign_data.main_image_url is not None:
        campaign.main_image_url = campaign_data.main_image_url
    if campaign_data.rich_text is not None:
        campaign.rich_text = campaign_data.rich_text
    if campaign_data.category_id is not None:
        campaign.category_id = campaign_data.category_id

    campaign.updated_at = datetime.utcnow()

    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    return campaign

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar esta campaña"
        )

    if campaign.workflow_state_id != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo puedes eliminar campañas en estado borrador"
        )

    session.delete(campaign)
    session.commit()

    return {"message": "Campaña eliminada exitosamente"}

@router.patch("/{campaign_id}/state", response_model=CampaignResponse)
async def change_campaign_state(
    campaign_id: int,
    state_data: dict,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id and current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cambiar el estado de esta campaña"
        )

    if campaign.workflow_state_id != 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo puedes cambiar el estado de campañas publicadas"
        )

    new_state = state_data.get('campaign_state_id')
    if new_state not in [1, 2, 3, 4]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de campaña inválido"
        )

    campaign.campaign_state_id = new_state
    campaign.updated_at = datetime.utcnow()

    session.add(campaign)
    session.commit()
    session.refresh(campaign)

    return campaign

@router.post("/{campaign_id}/submit-for-review")
async def submit_for_review(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para esta acción"
        )

    if campaign.workflow_state_id not in [1, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviar esta campaña a revisión en su estado actual"
        )

    if not campaign.tittle or not campaign.description or not campaign.goal_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La campaña debe tener título, descripción y meta de financiación"
        )

    campaign.workflow_state_id = 2
    campaign.updated_at = datetime.utcnow()

    session.add(campaign)
    session.commit()

    return {"message": "Campaña enviada para revisión exitosamente"}

@router.get("/{campaign_id}/observations", response_model=List[CampaignObservationResponse])
async def get_my_campaign_observations(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver las observaciones de esta campaña"
        )

    statement = select(CampaignObservation).where(
        CampaignObservation.campaign_id == campaign_id
    ).order_by(CampaignObservation.created_at.desc())

    observations = session.exec(statement).all()

    result = []
    for obs in observations:
        admin = session.get(Person, obs.user_id) if obs.user_id else None
        result.append(CampaignObservationResponse(
            id=obs.id,
            observation_text=obs.observation_text,
            user_id=obs.user_id,
            campaign_id=obs.campaign_id,
            created_at=obs.created_at,
            admin_name=f"{admin.first_name} {admin.last_name}" if admin else "Administrador"
        ))

    return result

@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para esta acción"
        )

    if campaign.workflow_state_id != 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La campaña debe estar publicada para iniciar la recaudación"
        )

    if campaign.campaign_state_id not in [1, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes iniciar la campaña en su estado actual"
        )

    campaign.campaign_state_id = 2
    if not campaign.start_date:
        campaign.start_date = datetime.utcnow().date()
    campaign.updated_at = datetime.utcnow()

    session.add(campaign)
    session.commit()

    return {"message": "Campaña de recaudación iniciada exitosamente"}

@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para esta acción"
        )

    if campaign.campaign_state_id != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo puedes pausar una campaña en progreso"
        )

    campaign.campaign_state_id = 3
    campaign.updated_at = datetime.utcnow()

    session.add(campaign)
    session.commit()

    return {"message": "Campaña pausada exitosamente"}

@router.post("/{campaign_id}/finish")
async def finish_campaign(
    campaign_id: int,
    session: Session = Depends(get_session),
    current_user: Person = Depends(get_current_active_user)
):

    campaign = session.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada"
        )

    if campaign.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para esta acción"
        )

    if campaign.campaign_state_id not in [2, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes finalizar la campaña en su estado actual"
        )

    campaign.campaign_state_id = 4
    campaign.end_date = datetime.utcnow().date()
    campaign.updated_at = datetime.utcnow()

    session.add(campaign)
    session.commit()

    return {"message": "Campaña finalizada exitosamente"}

@router.post("/process-expired")
async def process_expired_campaigns(
    session: Session = Depends(get_session)
):

    today = date.today()

    statement = select(Campaign).where(
        Campaign.campaign_state_id == 2,
        Campaign.expiration_date < today
    )
    expired_campaigns = session.exec(statement).all()

    processed = []

    for campaign in expired_campaigns:
        campaign.campaign_state_id = 4
        campaign.end_date = today
        campaign.updated_at = datetime.utcnow()

        if campaign.current_amount < campaign.goal_amount:
            donations_stmt = select(Donation).where(
                Donation.campaign_id == campaign.id,
                Donation.donation_state_id == 2
            )
            donations = session.exec(donations_stmt).all()

            for donation in donations:
                donation.donation_state_id = 4
                session.add(donation)

            processed.append({
                "campaign_id": campaign.id,
                "title": campaign.tittle,
                "donations_refunded": len(donations)
            })
        else:
            processed.append({
                "campaign_id": campaign.id,
                "title": campaign.tittle,
                "donations_refunded": 0,
                "goal_reached": True
            })

        session.add(campaign)

    session.commit()

    return {
        "message": f"Procesadas {len(processed)} campañas expiradas",
        "campaigns": processed
    }
