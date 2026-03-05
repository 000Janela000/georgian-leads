"""
WhatsApp sender via Meta Business API
Sends messages using official Meta WhatsApp Business API
"""

import httpx
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Meta Configuration from environment
META_WHATSAPP_TOKEN = os.getenv("META_WHATSAPP_TOKEN", "")
META_WHATSAPP_PHONE_ID = os.getenv("META_WHATSAPP_PHONE_ID", "")
META_WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("META_WHATSAPP_BUSINESS_ACCOUNT_ID", "")

BASE_URL = os.getenv("META_GRAPH_BASE_URL", "https://graph.facebook.com/v18.0")


async def send_whatsapp_meta(
    to_phone: str,
    body: str,
    template_name: Optional[str] = None
) -> Dict:
    """
    Send WhatsApp message via Meta Business API

    Args:
        to_phone: Recipient phone number in E.164 format (+995XXXXXXXXX for Georgia)
        body: Message text (ignored if using template)
        template_name: Optional template name (requires template setup in Meta Business)

    Returns:
        {
            'status': 'success' | 'error',
            'message': str,
            'message_id': str or None
        }
    """
    if not META_WHATSAPP_TOKEN or not META_WHATSAPP_PHONE_ID:
        logger.error("Meta WhatsApp credentials not configured")
        return {
            'status': 'error',
            'message': 'Meta WhatsApp not configured. Check credentials.',
            'message_id': None
        }

    # Ensure E.164 format
    if not to_phone.startswith('+'):
        to_phone = '+' + to_phone

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{BASE_URL}/{META_WHATSAPP_PHONE_ID}/messages"

            headers = {
                'Authorization': f'Bearer {META_WHATSAPP_TOKEN}',
                'Content-Type': 'application/json'
            }

            if template_name:
                # Send template message
                payload = {
                    'messaging_product': 'whatsapp',
                    'recipient_type': 'individual',
                    'to': to_phone,
                    'type': 'template',
                    'template': {
                        'name': template_name,
                        'language': {
                            'code': 'ka_GE'  # Georgian
                        }
                    }
                }
            else:
                # Send text message
                payload = {
                    'messaging_product': 'whatsapp',
                    'recipient_type': 'individual',
                    'to': to_phone,
                    'type': 'text',
                    'text': {
                        'preview_url': False,
                        'body': body
                    }
                }

            response = await client.post(url, json=payload, headers=headers)

            if 200 <= response.status_code < 300:
                data = response.json()
                message_id = data.get('messages', [{}])[0].get('id')

                logger.info(f"WhatsApp message sent via Meta to {to_phone}")

                return {
                    'status': 'success',
                    'message': f'WhatsApp message sent to {to_phone}',
                    'message_id': message_id
                }
            else:
                error_msg = response.text
                logger.error(f"Meta API error: {response.status_code} - {error_msg}")

                return {
                    'status': 'error',
                    'message': f'Meta API error: {response.status_code}',
                    'message_id': None
                }

    except Exception as e:
        logger.error(f"Failed to send WhatsApp via Meta: {e}")
        return {
            'status': 'error',
            'message': f'Failed to send WhatsApp: {str(e)}',
            'message_id': None
        }


async def send_whatsapp_bulk_meta(
    recipients: list,  # List of {'phone': str, 'name': str}
    body_template: str
) -> Dict:
    """
    Send WhatsApp messages to multiple recipients via Meta API
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

        result = await send_whatsapp_meta(to_phone=phone, body=body)

        if result['status'] == 'success':
            results['successful'] += 1
        else:
            results['failed'] += 1
            results['errors'].append({
                'phone': phone,
                'error': result['message']
            })

    logger.info(f"Bulk WhatsApp (Meta) sent: {results['successful']}/{results['total']} successful")
    return results
