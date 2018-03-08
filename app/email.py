from flask_mail import Message
from app import app, mail


def send_mail(subject, recipients, html_body, attachments):
    msg = Message(subject, sender=app.config['ADMIN_MAIL'],
                  recipients=recipients, attachments=attachments)
    msg.html = html_body
    mail.send(msg)
