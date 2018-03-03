cal_api = '/api/'

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
    $('#login').click(function () {
        var url = cal_api + 'login';
        var username = $('.active.side input.username').val();
        var password = $('.active.side input.password').val();
        if(password) {
            $.post(url, {
                username: username,
                password: password
            }).done(function (data) { // login success
                if(data.status_code == 0) location.reload();
                else alert('Login failed!')
            })
        } else alert('please input password!')

    });

    $('.ui.modal').modal('show');

}

function renderCal(data) {
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
    renderCal.year = parseInt($('#calendar-title').attr('data-year'));
    renderCal.month = parseInt($('#calendar-title').attr('data-month'));
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
        $('.detail.modal .header').text(date);
        date = date.split('-');
        fetchNotes(date[0], date[1], date[2]);
    });
}

function fetchNotes(year, month, day) {
    var url = cal_api + 'notes/' + year + '/' + month + '/' + day;
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
        $('.detail.modal').modal('show');

        // delete note
        $('.delete-note').click(function () {
            $('.dialog.modal .header').text('Delete Note');
            $('.dialog.modal .content').text('Do you want to delete it?');
            var note = $(this);
            showDialog(function () {
                // delete finished
                var del_note_url = cal_api + 'note/' + note.attr('data-note-id') + '/delete';
                $.post(del_note_url).done(function (data) {
                    if(data.status_code == 0) {
                        note.parents('.event').remove();
                        fetchDays(renderCal.year, renderCal.month);
                    }
                });
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
                    showEditor(function () {
                        var content = $('.editor.modal textarea').val();
                        $.post(update_note_url, {
                            content: content
                        }).done(function (data) { // login success
                            if(data.status_code == 0) {
                                $('.detail.modal .feed .note-content[data-note-id='+ note.attr('data-note-id') +']').html(
                                    markdown.toHTML(content)
                                );
                                return true;
                            }
                        })
                    });
                }
            });


        })
    });


}

function logout() {
    $('#logout').click(function () {
        $('.dialog.modal .header').text('Logout');
        $('.dialog.modal .content').text('Do you want to sign out?');
        showDialog(function() {
            var url = cal_api + 'logout';
            $.getJSON(url).done(function (data) {
                if(data.status_code == 0)
                    location.reload();
            });
        });
    });
}

function showDialog(approve) {
    $('.dialog.modal').modal({
        allowMultiple: true,
        blurring  : true,
        closable  : true,
        onApprove : approve
    }).modal('show');
}


function showEditor(approve) {
    $('.editor.modal').modal({
        allowMultiple: true,
        onApprove : approve
    }).modal('show');
}