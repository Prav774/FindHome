from pydantic import BaseModel


class DemoSeedResponse(BaseModel):
    demo_data: bool
    case_id: int
    person_id: int
