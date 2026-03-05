import unittest
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
import sys
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Company, Outreach, PipelineRun
from app.services.enrichment import enrich_company
from app.services.lead_scoring import compute_score


class LeadsAndPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def _create_company(self, **overrides):
        db = SessionLocal()
        company = Company(
            name_ge=overrides.get("name_ge", "Test Company"),
            identification_code=overrides.get("identification_code", f"c-{uuid4().hex[:12]}"),
            status=overrides.get("status", "active"),
            website_status=overrides.get("website_status", "not_found"),
            revenue_gel=overrides.get("revenue_gel"),
            facebook_url=overrides.get("facebook_url"),
            financial_data_json=overrides.get("financial_data_json"),
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        company_id = company.id
        db.close()
        return company_id

    def _cleanup_company(self, company_id: int):
        db = SessionLocal()
        db.query(Outreach).filter(Outreach.company_id == company_id).delete()
        db.query(Company).filter(Company.id == company_id).delete()
        db.commit()
        db.close()

    def test_contact_status_map_and_leads_filter(self):
        company_recent = self._create_company(name_ge="Recent Contact")
        company_tried = self._create_company(name_ge="Tried Contact")

        db = SessionLocal()
        try:
            db.add(
                Outreach(
                    company_id=company_recent,
                    channel="email",
                    contact_info="a@example.com",
                    message_body="hi",
                    status="sent",
                    sent_at=datetime.utcnow() - timedelta(days=2),
                )
            )
            db.add(
                Outreach(
                    company_id=company_tried,
                    channel="email",
                    contact_info="b@example.com",
                    message_body="hi",
                    status="failed",
                    sent_at=datetime.utcnow() - timedelta(days=2),
                )
            )
            db.commit()
        finally:
            db.close()

        try:
            status_resp = self.client.get("/api/outreach/contact-status-map?days=30")
            self.assertEqual(status_resp.status_code, 200)
            status_map = status_resp.json()
            self.assertEqual(status_map.get(str(company_recent)), "contacted_recently")
            self.assertEqual(status_map.get(str(company_tried)), "tried")

            # Default excludes contacted_recently
            leads_resp = self.client.get("/api/companies/lead-status/no-website?limit=200")
            self.assertEqual(leads_resp.status_code, 200)
            ids = {row["id"] for row in leads_resp.json()}
            self.assertNotIn(company_recent, ids)
            self.assertIn(company_tried, ids)
        finally:
            self._cleanup_company(company_recent)
            self._cleanup_company(company_tried)

    def test_pipeline_start_endpoint_contract(self):
        fake_run = PipelineRun(
            id=9999,
            status="queued",
            progress_pct=0,
            current_step="Queued",
            counters_json={},
            created_at=datetime.utcnow(),
        )
        with patch("app.routers.pipeline.start_pipeline_run", return_value=fake_run):
            resp = self.client.post("/api/pipeline/runs", json={"enrich_limit": 50})
            self.assertEqual(resp.status_code, 200)
            payload = resp.json()
            self.assertEqual(payload["id"], 9999)
            self.assertEqual(payload["status"], "queued")

    def test_score_formula_exact_and_estimated(self):
        exact_company = Company(
            website_status="not_found",
            revenue_gel=600_000,
            facebook_url="https://facebook.com/acme",
            status="active",
        )
        exact_score, exact_type, exact_lane = compute_score(exact_company, "never_contacted")
        self.assertEqual(exact_type, "exact")
        self.assertEqual(exact_lane, "full_website")
        self.assertEqual(exact_score, 170)

        estimated_company = Company(
            website_status="not_found",
            status="active",
            financial_data_json={"category": "III"},
        )
        estimated_score, estimated_type, estimated_lane = compute_score(estimated_company, "tried")
        self.assertEqual(estimated_type, "estimated")
        self.assertEqual(estimated_lane, "landing_page")
        self.assertEqual(estimated_score, 115)


class EnrichmentBehaviorTests(unittest.IsolatedAsyncioTestCase):
    async def test_social_is_skipped_when_website_found(self):
        db = SessionLocal()
        company = Company(
            name_ge="Skip Social",
            identification_code=f"s-{uuid4().hex[:12]}",
            status="active",
            website_status="unknown",
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        company_id = company.id

        try:
            with patch("app.services.enrichment.find_website", return_value={"status": "found", "url": "https://example.ge"}):
                with patch("app.services.enrichment.find_all_social_profiles") as social_mock:
                    result = await enrich_company(company_id, db)
                    self.assertTrue(result["website_found"])
                    social_mock.assert_not_called()
        finally:
            db.query(Outreach).filter(Outreach.company_id == company_id).delete()
            db.query(Company).filter(Company.id == company_id).delete()
            db.commit()
            db.close()


if __name__ == "__main__":
    unittest.main()
