from app import app, db
from app.models import User, Note
from datetime import datetime


@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Note': Note,
        'datetime': datetime
    }
