from fastapi import APIRouter
from .routes.auth import router as auth_router
from .routes.dashboard import router as dashboard_router
from .routes.data import router as data_router
from .routes.ml import router as ml_router
from .routes.analysis import router as analysis_router
from .routes.optimization import router as optimization_router
from .routes.simulation import router as simulation_router
from .routes.notification import router as notification_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(data_router)
api_router.include_router(ml_router)
api_router.include_router(analysis_router)
api_router.include_router(optimization_router)
api_router.include_router(simulation_router)
api_router.include_router(notification_router)
