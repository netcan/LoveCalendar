from app import db, app
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    avatar = db.Column(db.String(128))
    password = db.Column(db.String(128), nullable=False)
    favorite_color = db.Column(db.CHAR(10), default='#ff0000')
    notes = db.relationship('Note', backref='author', lazy='dynamic')

    def __repr__(self):
        return '<User {}>'.format(self.username)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.UnicodeText, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=lambda tz=app.config['TIMEZONE']: datetime.now(tz))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return '<Post({}) {} {}>'.format(self.author, self.timestamp, self.content)

    def get_timestamp(self):
        return self.timestamp.strftime('%Y-%m-%d %H:%M')
