from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .data import router as data_router
from .ml import router as ml_router
from .analysis import router as analysis_router
from .optimization import router as optimization_router
from .simulation import router as simulation_router
from .notification import router as notification_router

__all__ = [
    "auth_router",
    "dashboard_router",
    "data_router",
    "ml_router",
    "analysis_router",
    "optimization_router",
    "simulation_router",
    "notification_router"
]
