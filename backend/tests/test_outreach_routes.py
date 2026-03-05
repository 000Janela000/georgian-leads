import unittest
from uuid import uuid4
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Company


class OutreachRoutesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def _create_company_without_contacts(self) -> int:
        db = SessionLocal()
        company = Company(
            name_ge="Route Test Company",
            identification_code=f"test-{uuid4().hex[:12]}",
            status="active",
            website_status="not_found",
            lead_status="new",
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        company_id = company.id
        db.close()
        return company_id

    def _delete_company(self, company_id: int) -> None:
        db = SessionLocal()
        db.query(Company).filter(Company.id == company_id).delete()
        db.commit()
        db.close()

    def test_contacted_ids_route_not_shadowed_by_id_route(self):
        response = self.client.get("/api/outreach/contacted-ids")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_bulk_send_skips_missing_contact_info(self):
        company_id = self._create_company_without_contacts()
        try:
            response = self.client.post(
                "/api/outreach/send/bulk",
                json={
                    "channel": "email",
                    "company_ids": [company_id],
                    "custom_body": "Hello {name}",
                    "get_all_leads": False,
                },
            )
            self.assertEqual(response.status_code, 200)
            payload = response.json()
            self.assertEqual(payload.get("total_sent"), 0)
            self.assertGreaterEqual(payload.get("skipped_missing_contact", 0), 1)
        finally:
            self._delete_company(company_id)


if __name__ == "__main__":
    unittest.main()
