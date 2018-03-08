from app import app, db, mail
from app.models import User, Note
from datetime import datetime


@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Note': Note,
        'mail': mail,
        'datetime': datetime
    }
