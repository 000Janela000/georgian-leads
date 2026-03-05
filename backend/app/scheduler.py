"""
Background job scheduler using APScheduler
Handles periodic scraping, enrichment, and cleanup tasks
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger


def init_scheduler():
    """Initialize background job scheduler"""
    scheduler = BackgroundScheduler()

    # TODO: Add scheduled jobs:
    # - Periodic companyinfo.ge scraping
    # - Batch enrichment
    # - Report generation
    # - Cleanup old outreach records

    return scheduler


def start_scheduler(scheduler):
    """Start the scheduler"""
    scheduler.start()


def stop_scheduler(scheduler):
    """Stop the scheduler"""
    scheduler.shutdown()
