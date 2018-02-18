import os
from flask import Flask
from flask.ext.bcrypt import Bcrypt


app = Flask(__name__)
app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'calendar.db'),
    SECRET_KEY='development key',
))
bcrypt = Bcrypt(app)

