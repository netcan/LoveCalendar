drop table if exists users;
drop table if exists notes;
drop table if exists users_notes;

-- 账号
create table users (
    id integer primary key autoincrement,
    name varchar(20) not null unique,
    password varchar(20) not null,
    avatar text
);

-- 记事本
create table notes (
    id integer primary key autoincrement,
    datetime text not null,
    content text not null
);

-- 多对多
create table users_notes (
    id integer primary key autoincrement,
    user_id integer not null,
    note_id integer not null,
    foreign key(user_id) references users(id),
    foreign key(note_id) references notes(id)
);