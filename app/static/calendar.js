cal_api = '/api/'

function bindKeys() {
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
    for (var w = 0; w < 6; ++w) {
        var week = data['week' + w];
        console.log(week);
        var week_days = '';
        for (var d = 0; d < week.length; ++d) {
            var day = week[d];
            var dh = "<td class='" + day.style + "'>" + day.day + "</td>";
            switch (day.style) {
                case 'half-love':
                    var heart = feather.icons.heart.toSvg({
                        color: data.mark_color
                    });
                    break;
            }

            week_days += dh;
        }
        $('#week' + w).html(week_days);
    }
    $('#calendar-title').text(data['cal-title']);
    $('#prev-month').attr('data-year', data.year).attr('data-month', data.month);
    $('#next-month').attr('data-year', data.year).attr('data-month', data.month);


    // today
    var today = $('.today');
    if (today.length !== 0) {
        var heart = feather.icons.heart.toSvg({
            color: 'red',
            fill: 'red'
        });
        today.css('background-image', 'url(\'data:image/svg+xml;utf8,' + heart + '\')');
        today.addClass('animated infinite pulse');
    }

    // half love
    $('.half-love').each(function () {
        $(this).css('background-image', 'url(\'data:image/svg+xml;utf8,' + heart + '\')');
    });
    // full love
    $('.full-love').each(function () {
        var heart = feather.icons.heart.toSvg({
            color: 'red',
            fill: 'red'
        });
        $(this).css('background-image', 'url(\'data:image/svg+xml;utf8,' + heart + '\')');
        $(this).addClass('animated infinite pulse');
    });


}

function sidebar() {
    $(document).ready(function () {
        $('#menu').click(function () {
            $('.ui.sidebar').sidebar('toggle');
        });
    });
    logout();
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
