from flask import render_template, session, request, jsonify
from datetime import datetime, date, timedelta
from app import app, db
from app.models import User, Note
from app.email import send_mail
from functools import wraps
from markdown import markdown
import calendar, humanize, threading, time


def format_time(time):
    return time.strftime('%Y-%m-%d %H:%M')


def relative_time(timestamp, now_time=datetime.now(app.config['TIMEZONE'])):
    delta_time = now_time.replace(tzinfo=None) - timestamp
    return format_time(timestamp) \
        if delta_time >= timedelta(days=1) else \
        humanize.naturaltime(delta_time)


def notification(other_email, note, action, body):
    def inner():
        with app.app_context():
            send_mail('【LoveCalendar消息通知】 {}{}'.format(note.author.username, action), [other_email],
                      body.format(note.author.username,
                                  format_time(note.timestamp), markdown(note.content))
                      )
    threading.Thread(target=inner).start()


def login_required(func):
    """ 登陆检查装饰器 """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # 未进行登陆
        if not session.get('user_id'):
            return jsonify(status_code=1)
        return func(*args, **kwargs)
    return wrapper


@app.route("/")
@app.route("/index")
def index():
    """ 主页面 """
    if session.get('user_id'):
        u = User.query.get(session['user_id'])
        return render_template("index.html", u=u)
    else:
        users = User.query.all()[:2]
        return render_template("login.html", users=users)


@app.route("/api/login", methods=['POST'])
def login():
    """
    登陆
    status_code: 0表示成功，1表示失败
    """
    ret = {'status_code': 1}
    if session.get('user_id'):
        ret['status_code'] = 0
        return jsonify(**ret)

    username = request.form.get('username', None)
    password = request.form.get('password', None)
    if username and password:
        u = User.query.filter_by(username=username).first()
        if u and u.check_password(password):
            session['user_id'] = u.id
            ret['status_code'] = 0

    return jsonify(**ret)


@app.route("/api/logout")
def logout():
    """ 注销 """
    session.pop('user_id', None)
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
    startTime = monthdates[0][0]
    endTime = monthdates[-1][-1] + timedelta(days=1)
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
                daily_user.add((n.author.id, n.author.favorite_color))
                noteidx += 1

            if len(daily_user) == 1:
                day['style'] = 'half-love markday'
                day['mark_color'] = daily_user.pop()[1]
            elif len(daily_user) == 2:
                day['style'] = 'full-love markday'

            days.append(day)

    ret['week5'] = []
    for w in range(len(monthdates)):
        ret['week' + str(w)] = days[7 * w:7 * (w + 1)]

    ret["cal-title"] = calendar.month_name[month] + ' ' + str(year)
    ret["year"] = year
    ret["month"] = month

    return jsonify(**ret)


@app.route("/api/notes/<int:year>/<int:month>/<int:day>", methods=["GET"])
@app.route("/api/notes")
@login_required
def get_notes(year=None, month=None, day=None):
    """ 获取当天的记录 """
    ret = {'status_code': 0,
           'notes': []}
    now = datetime.now(app.config['TIMEZONE'])
    try:
        notes_day = datetime(now.year, now.month, now.day)
        if year and month and day:
            notes_day = datetime(year, month, day)
        notes = Note.query.filter_by(deleted=False)\
            .filter(Note.timestamp.between(notes_day, notes_day + timedelta(days=1) - timedelta(seconds=1))) \
            .order_by(Note.timestamp, Note.create_at)\
            .all()
        ret['notes'] = [{
            'id': note.id,
            'author': note.author.username,
            'avatar': note.author.avatar,
            'content': note.content,
            'timestamp': relative_time(note.create_at, now),
            'editable': note.author.id == session.get('user_id')
        } for note in notes]
        ret['year'], ret['month'], ret['day'] = \
            notes_day.year, notes_day.month, notes_day. day
    except ValueError:
        pass

    return jsonify(**ret)


@app.route("/api/note/<int:id>/delete", methods=['POST'])
@login_required
def del_note(id):
    """ 删除指定id的note记录 """
    note = Note.query.get(id)
    if note.author.id == session.get('user_id'):
        db.session.delete(note)
        db.session.commit()

        other = User.query.filter(User.id != session.get('user_id')).first()
        if other.email:
            notification(other.email, note, '删除了一条动态', '{}删除了{}的动态：<p>{}')

        return jsonify(status_code=0)

    return jsonify(status_code=1)


@app.route("/api/note/<int:id>/update", methods=['POST'])
@login_required
def update_note(id):
    """ 根据id更新note """
    note = Note.query.get(id)
    content = request.form.get('content', None)
    if not content or not note or note.author.id != session.get('user_id'):
        return jsonify(status_code=1)
    note.content = content
    note.last_updated = datetime.now(app.config['TIMEZONE'])
    db.session.commit()

    other = User.query.filter(User.id != session.get('user_id')).first()
    if other.email:
        notification(other.email, note, '更新了一条动态', '{}更新了{}的动态：<p>{}')

    return jsonify(status_code=0)


@app.route("/api/note/<int:year>/<int:month>/<int:day>/new", methods=["POST"])
@app.route("/api/note/new", methods=['POST'])
@login_required
def add_note(year=None, month=None, day=None):
    create_at = datetime.now(app.config['TIMEZONE'])
    timestamp = create_at
    if year and month and day:
        if date(year, month, day) > create_at.date():
            return jsonify(status_code=1)
        # 补签
        if date(year, month, day) < create_at.date():
            timestamp = datetime(year, month, day, 23, 59, 59)

    content = request.form.get('content', None)
    if not content:
        return jsonify(status_code=1)
    author = User.query.get(session.get('user_id'))
    note = Note(content=content, author=author, timestamp=timestamp, create_at=create_at)
    db.session.add(note)
    db.session.commit()

    other = User.query.filter(User.id != session.get('user_id')).first()
    if other.email:
        notification(other.email, note, '添加了一条动态', '{}于{}添加了动态：<p>{}')

    return jsonify(status_code=0)


@app.route("/api/note/<int:id>", methods=['GET'])
@login_required
def get_note(id):
    """ 根据id获取note """
    note = Note.query.get(id)
    if not note:
        return jsonify(status_code=1)
    ret = {
        'status_code': 0,
        'note': {
            'content': note.content,
        }
    }
    return jsonify(**ret)
