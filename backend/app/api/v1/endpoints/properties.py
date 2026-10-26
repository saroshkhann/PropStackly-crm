from typing import Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc

from app.api.deps import get_db, get_tenant_context, require_manager, TenantContext
from app.models.property import Property
from app.services.storage import save_property_image
from app.schemas.property import (
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    PropertyImageUploadResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter()


def _format_property(p: Property) -> dict:
    return {
        "id": p.id,
        "agency_id": p.agency_id,
        "title": p.title,
        "slug": p.slug,
        "type": p.type,
        "city": p.city,
        "location": p.location,
        "society": p.society,
        "price_pkr": p.price_pkr,
        "area_size": p.area_size,
        "bedrooms": p.bedrooms,
        "bathrooms": p.bathrooms,
        "status": p.status,
        "featured": p.featured,
        "image_url": p.image_url,
        "description": p.description,
        "assigned_agent_id": p.assigned_agent_id,
        "assigned_agent_name": p.assigned_agent.full_name if p.assigned_agent else None,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


@router.get("", response_model=PaginatedResponse[PropertyResponse])
def get_properties(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    society: Optional[str] = None,
    status: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|price_pkr|title)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Property)
        .options(joinedload(Property.assigned_agent))
        .filter(Property.agency_id == tenant.agency_id)
    )

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Property.title.ilike(search_fmt),
                Property.location.ilike(search_fmt),
                Property.society.ilike(search_fmt),
            )
        )

    if type and type != "all":
        query = query.filter(Property.type == type)

    if society and society != "all":
        query = query.filter(Property.society == society)

    if status and status != "all":
        query = query.filter(Property.status == status)

    if min_price is not None:
        query = query.filter(Property.price_pkr >= min_price)

    if max_price is not None:
        query = query.filter(Property.price_pkr <= max_price)

    total = query.count()

    col = getattr(Property, sort_by)
    query = query.order_by(desc(col) if order == "desc" else asc(col))

    offset = (page - 1) * size
    props = query.offset(offset).limit(size).all()
    pages = math.ceil(total / size) if size > 0 else 1

    items = [_format_property(p) for p in props]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("/upload-image", response_model=PropertyImageUploadResponse)
async def upload_property_image(
    file: UploadFile = File(...),
    tenant: TenantContext = Depends(require_manager),
):
    url, filename, size_bytes = await save_property_image(file)
    return PropertyImageUploadResponse(
        url=url,
        filename=filename,
        size_bytes=size_bytes,
    )


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    data: PropertyCreate,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    if not tenant.is_subscription_active:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Your 3-day free trial has concluded. Please activate your agency plan to add properties.",
        )
    slug = data.slug or data.title.lower().replace(" ", "-").replace("/", "-")
    prop = Property(
        agency_id=tenant.agency_id,
        title=data.title,
        slug=slug,
        type=data.type,
        city=data.city,
        location=data.location,
        society=data.society,
        price_pkr=data.price_pkr,
        area_size=data.area_size,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        status=data.status,
        featured=data.featured,
        image_url=data.image_url,
        description=data.description,
        assigned_agent_id=data.assigned_agent_id,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)

    return _format_property(prop)


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    prop = (
        db.query(Property)
        .options(joinedload(Property.assigned_agent))
        .filter(Property.id == property_id, Property.agency_id == tenant.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    return _format_property(prop)


@router.patch("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: str,
    data: PropertyUpdate,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    prop = (
        db.query(Property)
        .filter(Property.id == property_id, Property.agency_id == tenant.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prop, key, value)

    db.commit()
    db.refresh(prop)

    return _format_property(prop)


@router.delete("/{property_id}", response_model=MessageResponse)
def delete_property(
    property_id: str,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    prop = (
        db.query(Property)
        .filter(Property.id == property_id, Property.agency_id == tenant.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    db.delete(prop)
    db.commit()
    return MessageResponse(message="Property deleted successfully")
