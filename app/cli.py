from app import app, db
from app.models import User
from click_help_colors import HelpColorsGroup
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
@click.password_option(help="Set user's password")
def adduser(username, avatar, password):
    """Add a user to app"""
    u = User(username=username, avatar=avatar)
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




