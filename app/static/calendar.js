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
            '@class': 'day.style'
        };
        directive['#week'+i+' td'] = week;
    }
    directive['#calendar-title'] = 'cal-title';

    directive['#prev-month@data-year'] = 'year';
    directive['#prev-month@data-month'] = 'month';
    directive['#next-month@data-year'] = 'year';
    directive['#next-month@data-month'] = 'month';

    $p('#cal').render(data, directive);

    // today
    var today = $('.today');
    if (today.length !== 0) {
        var today_heart = feather.icons.heart.toSvg({
            color: 'red',
            fill: 'red'
        });
        today.css('background-image', 'url(\'data:image/svg+xml;utf8,' + today_heart + '\')');
        today.addClass('animated infinite pulse');
    }

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

}
