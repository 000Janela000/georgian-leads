"""
Template management service
Seeds and manages message templates
"""

from sqlalchemy.orm import Session
from app.models import Template


KA_EMAIL_TEMPLATE = {
    'name': 'ka - Web Development Offer (Email)',
    'language': 'ka',
    'channel': 'email',
    'subject': 'ვებ-გვერდის განვითარება - თქვენი ბიზნესისთვის',
    'body': '''გამარჯობა,

ვარ [სახელი], პროფესიონალი ვებ-განვითარების სპეციალისტი.

შევამჩნიე, რომ [კომპანიის სახელი] არის დიდი შესაძლებლობის მქონე ბიზნეს, რომელსაც დღეს პრესენტაციის საჭიროება აქვს ონლაინ სამყაროში.

გთავაზობთ აქ წარმოდგენილი სერვისებს:

✓ თანამედროვე, მობილურზე ადაპტირებული ვებ-გვერდი
✓ პროფესიონალური დიზაინი, რომელიც თქვენი ბიზნესის ღირებულებას წარმოადგენს
✓ SEO ოპტიმიზაცია - მოძებნება Google-ში
✓ ისწრაფოს სერვერი, უსაფრთხო კოდი
✓ სწრაფი მიწოდება - ჩვეულებრივ 2-4 კვირაში მზადაა

თუ გაინტერესებთ ან გაქვთ კითხვები, გამოგე დიმე. ჯერ დაკვირვების უფასოდ გავაკეთებ.

პატივისცემით,
[სახელი]
[ტელეფონი]
[იმეილი]''',
    'is_default': True
}

KA_WHATSAPP_TEMPLATE = {
    'name': 'ka - Web Development Offer (WhatsApp)',
    'language': 'ka',
    'channel': 'whatsapp',
    'subject': None,
    'body': '''გამარჯობა! 👋

ვარ [სახელი], ვებ-დეველოპერი.

შევამჩნიე [კომპანიის სახელი] - აღმოჩნდა რომ ონლაინ აღარ ხართ.

გთავაზობთ მაღალი ხარისხის ვებ-გვერდის დამზადებას:
✓ მომზადებული, თანამედროვე დიზაინი
✓ სწრაფი, უსაფრთხო
✓ Google-ში ძებნა (SEO)
✓ 2-4 კვირაში მზადაა

დაინტერესებთ? 😊

პატივი''',
    'is_default': True
}

ENGLISH_EMAIL_TEMPLATE = {
    'name': 'en - Web Development Offer (Email)',
    'language': 'en',
    'channel': 'email',
    'subject': 'Professional Website Development for [Company Name]',
    'body': '''Hello,

I'm [Name], a professional web developer specializing in building modern websites for local businesses.

I noticed that [Company Name] doesn't currently have a professional online presence. In today's market, a strong website is essential for growth and credibility.

I offer:

✓ Modern, mobile-responsive website design
✓ Professional branding and UI/UX
✓ SEO optimization (Google ranking)
✓ Fast, secure, and reliable hosting
✓ Quick turnaround - usually ready in 2-4 weeks

Your website would help you:
- Reach more customers online
- Build trust and credibility
- Showcase your products/services 24/7
- Generate leads directly from the web

I'd love to discuss your vision. Let's set up a quick call to explore what's possible for your business.

Best regards,
[Name]
[Phone]
[Email]''',
    'is_default': True
}

ENGLISH_WHATSAPP_TEMPLATE = {
    'name': 'en - Web Development Offer (WhatsApp)',
    'language': 'en',
    'channel': 'whatsapp',
    'subject': None,
    'body': '''Hey there! 👋

I'm [Name], a web developer.

I noticed [Company Name] could really benefit from having an online presence. Most of your competitors have websites - let's change that!

I build modern, fast websites that help businesses like yours:
✓ Professional design that impresses clients
✓ Works great on phones too
✓ Shows up in Google search
✓ Usually ready in 2-4 weeks

Interested in learning more? 😊

Talk soon!
[Name]''',
    'is_default': True
}


def seed_default_templates(db: Session):
    """Seed default message templates into database"""
    templates_data = [
        KA_EMAIL_TEMPLATE,
        KA_WHATSAPP_TEMPLATE,
        ENGLISH_EMAIL_TEMPLATE,
        ENGLISH_WHATSAPP_TEMPLATE,
    ]

    for template_data in templates_data:
        existing = db.query(Template).filter(
            Template.name == template_data['name']
        ).first()

        if not existing:
            template = Template(**template_data)
            db.add(template)

    db.commit()
    return len(templates_data)
