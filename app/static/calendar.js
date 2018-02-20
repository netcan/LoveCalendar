cal_api = '/api/'

function fetchDays(year, month) {
    for(var i = 0; i < 6; ++i)
        $('#week'+i).html('<td></td>')

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
                console.log(data);
                if(data.status_code == 0)
                    location.reload();
                else
                    alert('Login failed!')
            })
        } else
            alert('please input password!')

    });

    $('.ui.modal').modal('show');

}

function renderCal(data) {
    console.log(data);
    var directive = {};
    for(var i = 0; i < 6; ++i) {
        week = {};
        week['day<-week'+i] =  {
            '.': 'day.day',
            '@class': function (d) {
                switch(d.item.style) {
                    case 'full-love':
                        return d.item.style + ' animated infinite pulse';
                    default:
                        return d.item.style;
                }
            },
            '@style': function (d) {
                switch(d.item.style) {
                    case 'half-love':
                        var heart = feather.icons.heart.toSvg({
                            color: d.item['mark_color']
                        });
                        return 'background-image: url(\'data:image/svg+xml;utf8,' + heart + '\')';
                    case 'full-love':
                        var heart = feather.icons.heart.toSvg({
                            color: 'red',
                            fill: 'red'
                        });
                        return 'background-image: url(\'data:image/svg+xml;utf8,' + heart + '\')';
                }
            },
            '@data-html': function (d) {
                html = '';
                notes = d.item.notes;
                if (notes.length > 0) {
                    html += '<div class="ui  feed">';
                    for(var i = 0; i < notes.length; ++i) {
                        note = notes[i];
                        html +=
                            '  <div class="event">\n' +
                            '    <div class="label">\n' +
                            '      <img src="' + note.avatar + '">\n' +
                            '    </div>\n' +
                            '    <div class="content">\n' +
                            '      <div class="summary">\n' +
                            '        <a>' + note.author + '</a> 添加了动态' +
                            '        <div class="date">\n' +
                                        note.timestamp +
                            '        </div>\n' +
                            '      </div>\n' +
                            '      <div class="extra text">\n' +
                                        note.content.substring(0, 30) + '...' +
                            '      </div>\n' +
                            '    </div>\n' +
                            '  </div>'
                    }
                    html += '</div>';
                }
                return html;
            }
        };
        directive['#week'+i+' td'] = week;
    }
    directive['#calendar-title'] = 'cal-title';

    directive['#prev-month@data-year'] = 'year';
    directive['#prev-month@data-month'] = 'month';
    directive['#next-month@data-year'] = 'year';
    directive['#next-month@data-month'] = 'month';

    $p('#cal').render(data, directive);


    // 绑定切换按钮
    $('#prev-month').click(function () {
        var year = $(this).attr('data-year');
        var month = $(this).attr('data-month');
        if(month - 1 >= 1) fetchDays(year, month - 1);
        else fetchDays(year - 1, 12);
    });
    $('#next-month').click(function () {
        var year = parseInt($(this).attr('data-year'));
        var month = parseInt($(this).attr('data-month'));
        if(month + 1 <= 12) fetchDays(year, month + 1);
        else fetchDays(year + 1, 1);
    });
    $('#menu').click(function () {
        $('.ui.sidebar').sidebar('toggle');
    });
    $('.half-love').popup();
    $('.full-love').popup();
}

function logout() {
    $('#logout').click(function () {
        $('.logout.modal').modal({
            blurring: true,
            closable  : true,
            onDeny    : function(){
                return true;
            },
            onApprove : function() {
                var url = cal_api + 'logout';
                $.getJSON(url).done(function (data) {
                    if(data.status_code == 0)
                        location.reload();
                });
            }
        }).modal('show');
    });
}
