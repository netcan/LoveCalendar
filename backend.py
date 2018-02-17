from config import *
from flask import url_for, render_template, jsonify
from datetime import date
import calendar


@app.route("/")
def hello():
    return render_template('index.html')


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
        ret['week' + str(w)] = days[7*w:7*(w+1)]

    ret["cal-title"] = calendar.month_name[month] + ' ' + str(year)
    ret["year"] = year
    ret["month"] = month

    return jsonify(**ret)

