"""
WhatsApp sender via Twilio
Sends messages using Twilio WhatsApp Business API
"""

from twilio.rest import Client
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Twilio Configuration from environment
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+1234567890")

# Initialize Twilio client if credentials available
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {e}")


async def send_whatsapp_twilio(
    to_phone: str,
    body: str,
    media_url: Optional[str] = None
) -> Dict:
    """
    Send WhatsApp message via Twilio

    Args:
        to_phone: Recipient phone number in E.164 format (+995XXXXXXXXX for Georgia)
        body: Message text
        media_url: Optional URL to image/video/document

    Returns:
        {
            'status': 'success' | 'error',
            'message': str,
            'message_sid': str or None
        }
    """
    if not twilio_client:
        logger.error("Twilio client not initialized. Check credentials in .env")
        return {
            'status': 'error',
            'message': 'Twilio not configured. Check credentials.',
            'message_sid': None
        }

    # Format phone number with whatsapp: prefix if not already there
    if not to_phone.startswith('whatsapp:'):
        # Ensure E.164 format
        if not to_phone.startswith('+'):
            to_phone = '+' + to_phone
        to_phone = 'whatsapp:' + to_phone

    try:
        # Send message
        if media_url:
            message = twilio_client.messages.create(
                from_=TWILIO_WHATSAPP_NUMBER,
                to=to_phone,
                body=body,
                media_url=media_url
            )
        else:
            message = twilio_client.messages.create(
                from_=TWILIO_WHATSAPP_NUMBER,
                to=to_phone,
                body=body
            )

        logger.info(f"WhatsApp message sent to {to_phone}")

        return {
            'status': 'success',
            'message': f'WhatsApp message sent to {to_phone}',
            'message_sid': message.sid
        }

    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return {
            'status': 'error',
            'message': f'Failed to send WhatsApp: {str(e)}',
            'message_sid': None
        }


async def send_whatsapp_bulk(
    recipients: list,  # List of {'phone': str, 'name': str}
    body_template: str
) -> Dict:
    """
    Send WhatsApp messages to multiple recipients
    Supports personalization with {name} placeholder

    Returns:
        {
            'total': int,
            'successful': int,
            'failed': int,
            'errors': list
        }
    """
    results = {
        'total': len(recipients),
        'successful': 0,
        'failed': 0,
        'errors': []
    }

    for recipient in recipients:
        phone = recipient.get('phone')
        name = recipient.get('name', '')

        # Personalize message
        body = body_template.replace('{name}', name)

        result = await send_whatsapp_twilio(to_phone=phone, body=body)

        if result['status'] == 'success':
            results['successful'] += 1
        else:
            results['failed'] += 1
            results['errors'].append({
                'phone': phone,
                'error': result['message']
            })

    logger.info(f"Bulk WhatsApp sent: {results['successful']}/{results['total']} successful")
    return results
