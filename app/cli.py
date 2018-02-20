from app import app, db
from app.models import User, Note
from click_help_colors import HelpColorsGroup
from datetime import datetime
from random import randint
import click


@app.cli.group(cls=HelpColorsGroup,
               help_headers_color='yellow',
               help_options_color='green')
def app():
    """App operation"""
    pass


@app.command()
@click.argument('username')
@click.option('--avatar', default=None, help="Set user's avatar")
@click.option('--favorite_color', default=None, help="Set user's favorite color")
@click.password_option(help="Set user's password")
def adduser(username, avatar, favorite_color ,password):
    """Add a user to app"""
    u = User(username=username, avatar=avatar, favorite_color=favorite_color)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()


@app.command()
@click.argument('username')
def deluser(username):
    """Delete a user"""
    u = User.query.filter_by(username=username).first()
    if not u:
        click.secho("No such a user: `{}'!".format(username), err=True, fg='red')
    elif click.confirm("Do you want to delete a user: `{}'?".format(u.username)):
        db.session.delete(u)
        db.session.commit() \


@app.command()
def fake_notes():
    """Add some fake notes"""
    year, month = 2018, 1
    u1 = User.query.all()[0]
    u2 = User.query.all()[1]
    for i in range(20):
        fake_date = datetime(year, month, randint(1, 31), randint(1, 24), randint(0, 59))
        note = Note(content='这是一条测试的内容！', timestamp=fake_date)
        note.author = u1 if randint(0, 1) else u2
        db.session.add(note)

    db.session.commit()


