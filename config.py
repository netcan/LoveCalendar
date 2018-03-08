import os, pytz

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = 'development key'
    SQLALCHEMY_DATABASE_URI='sqlite:///' + os.path.join(basedir, 'calendar.db')
    DEBUG = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    TIMEZONE = pytz.timezone('Asia/Shanghai')

    # email server
    MAIL_SERVER = 'your.mailserver.com'
    MAIL_PORT = 25
    MAIL_USERNAME = None
    MAIL_PASSWORD = None

    # administrator mail
    ADMIN_MAIL = MAIL_USERNAME
