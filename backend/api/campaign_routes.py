from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional
from pydantic import BaseModel
from auth.jwt_handler import JWTHandler
from services.ai_service import AIService

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

class CampaignCreate(BaseModel):
    name: str
    theme: str
    target_audience: str

class CampaignResponse(BaseModel):
    id: str
    name: str
    slogan: str
    design_suggestions: dict

@router.post("/create", response_model=CampaignResponse)
async def create_campaign(
    campaign: CampaignCreate,
    tenant_id: str = Header(...)
):
    """
    Creates a new campaign with AI-generated slogan and design suggestions.
    """
    # Step 1: AI Slogan Generation
    slogan = AIService.generate_slogan(campaign.name, campaign.target_audience)
    
    # Step 2: AI Design Suggestions
    design = AIService.suggest_design_elements(campaign.theme)
    
    # Step 3: Save to DB (Placeholder)
    campaign_id = "camp_" + campaign.name.lower().replace(" ", "_")
    
    return {
        "id": campaign_id,
        "name": campaign.name,
        "slogan": slogan,
        "design_suggestions": design
    }

@router.get("/list")
async def list_campaigns(tenant_id: str = Header(...)):
    """
    Lists all campaigns for a specific tenant.
    """
    # Placeholder for DB query
    return {"tenant": tenant_id, "campaigns": []}
