from config import app, bcrypt
import click
from flask import url_for, render_template, jsonify, g, session, request
from datetime import date
import sqlite3
import calendar


# 连接数据库部分
def get_db():
    if not hasattr(g, 'db'):
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
    return g.db


# 命令行部分
@app.cli.command()
@click.argument('username')
@click.option('--avatar', default=None, help="Set user's avatar")
@click.password_option(help="Set user's password")
def adduser(username, avatar, password):
    """Add a user to app"""
    db = get_db()
    sql = "insert into users (avatar, name, password) values (?, ?, ?)"
    db.execute(sql, [avatar, username, bcrypt.generate_password_hash(password)])
    db.commit()


@app.cli.command()
@click.argument('username')
def deluser(username):
    """Delete a user"""
    db = get_db()
    sql = "delete from users where name = ?"
    db.execute(sql, [username])
    db.commit()


# 路由逻辑部分
@app.route("/")
def index():
    return render_template('index.html')


@app.route("/api/login", methods=['POST'])
def login():
    ret = {}
    if session.get('username'):
        ret['username'] = session['username']
        return jsonify(**ret)

    if request.form['username'] and request.form['password']:
        db = get_db()
        sql = "select password from users where name = ?"
        password = db.execute(sql, [request.form['username']]).fetchall()
        if len(password) == 0 or password[0]['password'] != request.form['password']:
            return 'login failed', 403

        ret['username'] = session['username'] = request.form['username']
        return jsonify(**ret)

    return 'login failed', 403


@app.route("/api/logout")
def logout():
    session.pop('username', None)
    return 'logout success'


@app.route("/api/cal/")
@app.route("/api/cal/<int:year>/<int:month>")
def cal(year=None, month=None):
    """
    返回当前月份的天数
    """
    today = date.today()
    if year is None or not (1 <= month <= 12):
        year = today.year
        month = today.month

    cal = calendar.Calendar(firstweekday=6)

    monthdates = cal.monthdatescalendar(year, month)
    next_monthdates = cal.monthdatescalendar(year if month + 1 <= 12 else year + 1,
                                             month + 1 if month + 1 <= 12 else 12)
    while len(monthdates) < 6:
        for w in next_monthdates:
            if w in monthdates:
                continue
            monthdates.append(w)

    days = []
    for w in monthdates:
        for d in w:
            day = {
                'day': d.day,
                'style': 'day'
            }
            if today.day == d.day and today.year == d.year and today.month == d.month:
                day['style'] = 'today'
            elif d.month != month:
                day['style'] = 'other-day'

            days.append(day)

    ret = {}
    for w in range(6):
        ret['week' + str(w)] = days[7 * w:7 * (w + 1)]

    ret["cal-title"] = calendar.month_name[month] + ' ' + str(year)
    ret["year"] = year
    ret["month"] = month

    return jsonify(**ret)
