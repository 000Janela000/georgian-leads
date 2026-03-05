"""
Email sender service using SMTP
Supports Gmail, Outlook, and custom SMTP servers
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# SMTP Configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    from_email: Optional[str] = None,
    reply_to: Optional[str] = None,
    html: bool = False
) -> Dict:
    """
    Send email via SMTP

    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (plain text or HTML)
        from_email: Sender email (defaults to SMTP_USER)
        reply_to: Reply-to address
        html: Whether body is HTML (default: False/plain text)

    Returns:
        {
            'status': 'success' | 'error',
            'message': str,
            'email_id': str or None
        }
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.error("SMTP credentials not configured")
        return {
            'status': 'error',
            'message': 'SMTP not configured. Check .env file.',
            'email_id': None
        }

    from_email = from_email or SMTP_USER

    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email

        if reply_to:
            msg['Reply-To'] = reply_to

        # Attach body
        if html:
            part = MIMEText(body, 'html')
        else:
            part = MIMEText(body, 'plain')
        msg.attach(part)

        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()  # Upgrade connection to TLS
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent successfully to {to_email}")

        return {
            'status': 'success',
            'message': f'Email sent to {to_email}',
            'email_id': f"{to_email}_{subject[:20]}"
        }

    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed")
        return {
            'status': 'error',
            'message': 'SMTP authentication failed. Check credentials.',
            'email_id': None
        }

    except smtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        return {
            'status': 'error',
            'message': f'SMTP error: {str(e)}',
            'email_id': None
        }

    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        return {
            'status': 'error',
            'message': f'Email sending failed: {str(e)}',
            'email_id': None
        }


async def send_bulk_emails(
    recipients: list,  # List of {'email': str, 'name': str}
    subject: str,
    body_template: str,
    from_email: Optional[str] = None
) -> Dict:
    """
    Send emails to multiple recipients
    Supports personalization with {name} placeholder

    Returns:
        {
            'total': int,
            'successful': int,
            'failed': int,
            'errors': list of error messages
        }
    """
    results = {
        'total': len(recipients),
        'successful': 0,
        'failed': 0,
        'errors': []
    }

    for recipient in recipients:
        email = recipient.get('email')
        name = recipient.get('name', '')

        # Personalize body
        body = body_template.replace('{name}', name)

        result = await send_email(
            to_email=email,
            subject=subject,
            body=body,
            from_email=from_email
        )

        if result['status'] == 'success':
            results['successful'] += 1
        else:
            results['failed'] += 1
            results['errors'].append({
                'email': email,
                'error': result['message']
            })

    logger.info(f"Bulk email sent: {results['successful']}/{results['total']} successful")
    return results
