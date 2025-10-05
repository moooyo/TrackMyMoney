"""Unified response models"""

from typing import Generic, TypeVar, Optional
from pydantic import BaseModel


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Unified API response format matching backend Go response structure"""

    code: int = 0
    message: str = "success"
    data: Optional[T] = None

    @classmethod
    def success(cls, data: T, message: str = "success") -> "ApiResponse[T]":
        """Create a success response"""
        return cls(code=0, message=message, data=data)

    @classmethod
    def error(cls, code: int, message: str) -> "ApiResponse[None]":
        """Create an error response"""
        return cls(code=code, message=message, data=None)
