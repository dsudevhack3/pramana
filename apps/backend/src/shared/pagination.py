from pydantic import BaseModel


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 25

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PagedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int