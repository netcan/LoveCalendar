import os
from flask import Flask


app = Flask(__name__)
app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'calendar.db'),
    SECRET_KEY='development key',
))

