from flask import render_template, session, request, jsonify
from datetime import date, timedelta
from app import app, db
from app.models import User, Note
from functools import wraps
import calendar


def login_required(func):
    """ 登陆检查装饰器 """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # 未进行登陆
        if not session.get('username'):
            return jsonify(status_code=1)
        return func(*args, **kwargs)
    return wrapper


@app.route("/")
@app.route("/index")
def index():
    """ 主页面 """
    if session.get('username'):
        u = User.query.filter_by(username=session['username']).first()
        return render_template("index.html", u=u)
    else:
        users = User.query.all()
        return render_template("login.html", users=users)


@app.route("/api/login", methods=['POST'])
def login():
    """
    登陆
    status_code: 0表示成功，1表示失败
    """
    ret = {'status_code': 1}
    if session.get('username'):
        ret['status_code'] = 0
        return jsonify(**ret)

    username = request.form.get('username', None)
    password = request.form.get('password', None)
    if username and password:
        u = User.query.filter_by(username=username).first()
        if u and u.check_password(password):
            session['username'] = username
            ret['status_code'] = 0

    return jsonify(**ret)


@app.route("/api/logout")
def logout():
    """ 注销 """
    session.pop('username', None)
    ret = {'status_code': 0}
    return jsonify(**ret)


@app.route("/api/cal/")
@app.route("/api/cal/<int:year>/<int:month>")
@login_required
def cal(year=None, month=None):
    """ 返回当前月份的日历 """
    ret = {'status_code': 0}

    today = date.today()
    if year is None or not (1 <= month <= 12):
        year = today.year
        month = today.month

    cal = calendar.Calendar(firstweekday=6)

    # monthdates记录了该月的所有日期
    monthdates = cal.monthdatescalendar(year, month)
    next_monthdates = cal.monthdatescalendar(year if month + 1 <= 12 else year + 1,
                                             month + 1 if month + 1 <= 12 else 12)
    while len(monthdates) < 6:
        for w in next_monthdates:
            if w in monthdates:
                continue
            monthdates.append(w)
    # 获取当月的所有记录
    startTime = monthdates[0][0]
    endTime = monthdates[5][-1] + timedelta(days=1)
    notes = Note.query.filter_by(deleted=False) \
        .filter(Note.timestamp.between(startTime, endTime)) \
        .order_by(Note.timestamp)\
        .all()
    noteidx = 0

    days = []
    for w in monthdates:
        for d in w:
            day = {
                'year': d.year,
                'month': d.month,
                'day': d.day,
                'style': 'day',
                'notes': []
            }
            if today == d:
                day['style'] = 'today'
            elif d.month != month:
                day['style'] = 'other-day'

            daily_user = set()
            while noteidx < len(notes) and notes[noteidx].timestamp.date() == d:
                n = notes[noteidx]
                daily_user.add((n.author.username, n.author.favorite_color))
                noteidx += 1

            if len(daily_user) == 1:
                day['style'] = 'half-love markday'
                day['mark_color'] = daily_user.pop()[1]
            elif len(daily_user) == 2:
                day['style'] = 'full-love markday'

            days.append(day)

    for w in range(6):
        ret['week' + str(w)] = days[7 * w:7 * (w + 1)]

    ret["cal-title"] = calendar.month_name[month] + ' ' + str(year)
    ret["year"] = year
    ret["month"] = month

    return jsonify(**ret)


@app.route("/api/note/<int:year>/<int:month>/<int:day>")
@login_required
def get_notes(year, month, day):
    """ 获取当天的记录 """
    ret = {'status_code': 0,
           'notes': []}
    try:
        notes_day = date(year, month, day)
        notes = Note.query.filter_by(deleted=False)\
            .filter(Note.timestamp.between(notes_day, notes_day + timedelta(days=1))) \
            .order_by(Note.timestamp)\
            .all()
        ret['notes'] = [{
            'id': note.id,
            'author': note.author.username,
            'avatar': note.author.avatar,
            'content': note.content,
            'timestamp': note.get_timestamp()
        } for note in notes]
    except ValueError:
        pass

    return jsonify(**ret)


@app.route("/api/note/<int:id>/delete", methods=['POST'])
@login_required
def del_note(id):
    """ 删除指定id的note记录 """
    ret = {'status_code': 0}
    note = Note.query.get(id)
    db.session.delete(note)
    db.session.commit()
    return jsonify(**ret)


