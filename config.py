import os, pytz

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = 'development key'
    SQLALCHEMY_DATABASE_URI='sqlite:///' + os.path.join(basedir, 'calendar.db')
    DEBUG = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    TIMEZONE = pytz.timezone('Asia/Shanghai')
