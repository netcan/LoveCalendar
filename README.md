## Intro
A calendar to mark something(About love).

Calendar page:
![calendar.png](screenshots/calendar.png)

Detail page:
![detail.png](screenshots/detail.png)

## How to run
### Clone repo
```sh
$ git clone https://github.com/netcan/LoveCalendar.git
$ cd LoveCalendar
```

### Install python and its dependence
```sh
$ virtualenv flask
$ source flask/bin/activate
(flask) $ pip install -r requirements.txt
```

### Postgresql
To install postgresql:

On MacOX:
```sh
$ brew install postgres
$ brew services start postgresql
```

Then edit the `config.py`, change the `SQLALCHEMY_DATABASE_URI` field to yours. I use `development` for pgsql user name and `lovecalendar` for database name.

```sh
$ createuser development --createdb
$ createdb lovecalendar -U development
```

### Init database
Run command belove:
```sh
$ export FLASK_APP=LoveCalendar.py
$ flask db upgrade
```

### Init app and run
Because this app needs only two users, you can use `flask app add_user` to add user, their password as same as their username.

For testing purpose, you can try `flask app test_users` to add default two users: steve and stevie.

Then you can use `flask app fake_notes` to add some test notes.

To run it by `flask run`.





