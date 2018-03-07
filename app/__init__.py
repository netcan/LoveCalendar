from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
app.config.from_envvar('CALENDAR_SETTINGS', silent=True)
db = SQLAlchemy(app)
migrate = Migrate(app, db)


from app import routes, models, cli
