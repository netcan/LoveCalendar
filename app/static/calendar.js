cal_api = '/api/';

function fetchDays(year, month) {

    var url = cal_api + 'cal/';
    if(typeof year !== 'undefined') url += year + '/' + month;

    $.getJSON(url).done(function (data) {
        renderCal(data);
    });
}

function login() {
    $('#change_user').click(function () {
        $('.shape').shape('flip over');
    });
    var url = cal_api + 'login';
    $('#login').api({
        url: url,
        method: 'post',
        beforeSend: function (settings) {
            console.log(settings);
            var username = $('.active.side input.username').val();
            var password = $('.active.side input.password').val();
            if(! password) {
                alert('please input password!');
                return false;
            }
            settings.data = {
                username: username,
                password: password
            };
            return settings;
        },
        onSuccess: function(data) {
            if(data.status_code == 0) location.reload();
            else alert('Login failed!')
        }

    });

}

function renderCal(data) {
    renderCal.year = parseInt(data.year);
    renderCal.month = parseInt(data.month);
    console.log(data);

    if (typeof renderCal.compiled === 'undefined') {
        var directive = {
            '#calendar-title': 'cal-title',
            '#calendar-title@data-year': 'year',
            '#calendar-title@data-month': 'month'
        };
        for (var i = 0; i < 6; ++i) {
            var week = {};
            week['day<-week' + i] = {
                '.': 'day.day',
                '@class': function (d) {
                    switch (d.item.style) {
                        case 'full-love markday':
                            return d.item.style + ' animated infinite pulse';
                        default:
                            return d.item.style;
                    }
                },
                '@style': function (d) {
                    switch (d.item.style) {
                        case 'today':
                            var heart = feather.icons.heart.toSvg();
                            return 'background-image: url(\'data:image/svg+xml;utf8,' + heart + '\')';
                        case 'half-love markday':
                            var heart = feather.icons.heart.toSvg({
                                color: d.item['mark_color']
                            });
                            return 'background-image: url(\'data:image/svg+xml;utf8,' + heart + '\')';
                        case 'full-love markday':
                            var heart = feather.icons.heart.toSvg({
                                color: 'red',
                                fill: 'red'
                            });
                            return 'background-image: url(\'data:image/svg+xml;utf8,' + heart + '\')';
                    }
                },
                '@data-date': function (d) {
                    return d.item.year + '-' + d.item.month + '-' + d.item.day;
                }
            };
            directive['#week' + i + ' td'] = week;
        }

        renderCal.compiled = $p('#cal').compile(directive);
    }

    $p('#cal').render(data, renderCal.compiled);


    // 绑定按钮事件
    $('#prev-month').click(function () {
        if(renderCal.month - 1 >= 1) fetchDays(renderCal.year, renderCal.month - 1);
        else fetchDays(renderCal.year - 1, 12);
    });
    $('#next-month').click(function () {
        if(renderCal.month + 1 <= 12) fetchDays(renderCal.year, renderCal.month + 1);
        else fetchDays(renderCal.year + 1, 1);
    });
    $('#menu').click(function () {
        $('.ui.sidebar').sidebar('toggle');
    });
    $('.markday').click(function () {
        var date = $(this).attr('data-date');
        date = date.split('-');
        fetchNotes(date[0], date[1], date[2]);
    });
}

function fetchNotes(year, month, day) {
    // show note list
    var url = cal_api + 'notes';
    if (typeof year !== 'undefined')
        url += '/' + year + '/' + month + '/' + day;

    if (typeof fetchNotes.compiled === 'undefined') {
        var directive = {
            '.event': {
                'note<-notes': {
                    '.avatar@src': 'note.avatar',
                    '.name': 'note.author',
                    '.date': 'note.timestamp',
                    '.meta@style': function (d) {
                        return d.item.editable?'':'display:none';
                    },
                    '.delete-note@data-note-id': 'note.id',
                    '.edit-note@data-note-id': 'note.id',
                    '.note-content@data-note-id': 'note.id',
                    '.note-content@data-content': 'note.content',
                    '.note-content': function (d) {
                        return markdown.toHTML(d.item.content);
                    }
                }
            }
        };
        fetchNotes.compiled = $p('.detail.modal .feed').compile(directive);
    }

    $.getJSON(url).done(function (data) {
        $p('.detail.modal .feed').render(data, fetchNotes.compiled);
        $('.note-content a').attr('target', '_blank');

        $('.detail.modal .header').text(data.year + '-' + data.month + '-' + data.day);

        $('.detail.modal').modal({
            onApprove: function () {
                addNote(year, month, day);
                return false;
            }
        }).modal('show');

        // type mode
        if(! localStorage.getItem('typeit-mode'))
            localStorage.setItem('typeit-mode', 'off');
        if (localStorage.getItem('typeit-mode') === 'on') {
            $('#typeit').checkbox('check');
            typing(true);
        } else { // off
            $('.note-content').readmore({
                speed: 500
            });
        }

        $('#typeit').checkbox({
            onChecked: function () {
                localStorage.setItem('typeit-mode', 'on');
                typing(true);
            },
            onUnchecked: function () {
                localStorage.setItem('typeit-mode', 'off');
                typing(false);
            }
        });





        // delete note
        $('.delete-note').click(function () {
            $('.dialog.modal .header').text('Delete Note');
            $('.dialog.modal .content').text('Do you want to delete it?');
            showDialog();
            var note = $(this);
            var del_note_url = cal_api + 'note/' + note.attr('data-note-id') + '/delete';

            $('.dialog.modal .positive.button').api({
                url: del_note_url,
                method: 'post',
                onSuccess: function (data) {
                    if(data.status_code == 0) {
                        // delete finished
                        note.parents('.event').remove();
                        fetchDays(renderCal.year, renderCal.month);
                        $('.dialog.modal').modal('hide');
                    }
                }
            });

        });

        // edit note
        $('.edit-note').click(function () {
            var note = $(this);
            var get_note_url = cal_api + 'note/' + note.attr('data-note-id');
            var update_note_url = cal_api + 'note/' + note.attr('data-note-id') + '/update';
            $.getJSON(get_note_url).done(function (data) {
                if(data.status_code == 0) {
                    $('.editor.modal textarea').val(data.note.content);
                    $('.editor.modal .approve.button').text('Update');
                    showEditor();

                    $('.editor.modal .positive.button').api({
                        url: update_note_url,
                        method: 'post',
                        beforeSend: function (settings) {
                            var content = $('.editor.modal textarea').val();
                            if(! content) {
                                alert('please input content!');
                                return false;
                            }
                            settings.data = {
                                content: content
                            };
                            return settings;
                        },
                        onSuccess: function (data) {
                            var content = $('.editor.modal textarea').val();
                            if(data.status_code == 0) { // edit success
                                $('.detail.modal .feed .note-content[data-note-id='+ note.attr('data-note-id') +']').html(
                                    markdown.toHTML(content)
                                );
                                $('.note-content a').attr('target', '_blank');
                                $('.editor.modal').modal('hide');
                            }
                        }

                    });
                }
            });


        })
    });



}

function addNote(year, month, day) {
    $('.editor.modal textarea').val(localStorage.getItem('new-note'));
    $('.editor.modal .approve.button').text('Biu');
    var autosave = setInterval(function () {
        localStorage.setItem('new-note', $('.editor.modal textarea').val());
    }, 2000);
    var stop_autosave = function () {
        clearInterval(autosave);
    };
    showEditor(stop_autosave, stop_autosave);

    var new_note_url = cal_api + 'note/new';
    if(typeof year !== 'undefined')
        new_note_url = cal_api + 'note/' + year + '/' + month + '/' + day + '/new';

    // new note
    $('.editor.modal .positive.button').api({
        url: new_note_url,
        method: 'post',
        beforeSend: function (settings) {
            var content = $('.editor.modal textarea').val();
            if(! content) {
                alert('please input content!');
                return false;
            }
            settings.data = {
                content: content
            };
            return settings;
        },
        onSuccess: function (data) {
            if(data.status_code == 0) { // add success
                stop_autosave();
                fetchDays(renderCal.year, renderCal.month);
                fetchNotes(year, month, day);
                localStorage.removeItem('new-note');
                $('.editor.modal').modal('hide');
            }
        }

    });
}

function sidebar() {
    // write note(add note)
    $('#write-note').click(function () {
        addNote();
    });

    // logout
    $('#logout').click(function () {
        $('.dialog.modal .header').text('Logout');
        $('.dialog.modal .content').text('Do you want to sign out?');
        showDialog();

        var url = cal_api + 'logout';
        $('.dialog.modal .positive.button').api({
            url: url,
            onSuccess: function (data) {
                if(data.status_code == 0)
                    location.reload();
            }
        });

    });
}

function showDialog() {
    $('.dialog.modal').modal({
        allowMultiple: true,
        blurring  : true,
        closable  : true,
        onApprove : function () {
            return false;
        }
    }).modal('show');
}


function showEditor(deny, hide) {
    $('.editor.modal').modal({
        allowMultiple: true,
        onApprove : function () {
            return false;
        },
        onDeny: deny,
        onHidden: hide
    }).modal('show');
}

function typing(enable) {
    if(enable) { // on
        $('.note-content').readmore('destroy');
        $('.note-content').each(function (idx, elem) {
            var strings = $(elem).attr('data-content').replace(/\n\n/g, '\n\n\n\n').split('\n\n');
            $(elem).html('');

            new TypeIt(elem, {
                strings: strings,
                speed: 180
            });
        })
    } else { // off
        $('.note-content').each(function (idx, elem) {
            $(elem).html(markdown.toHTML(
                $(elem).attr('data-content')
            ));
        });
        $('.note-content').readmore({
            speed: 500
        });
    }

}