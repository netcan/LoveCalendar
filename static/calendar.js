cal_api = '/api/'
function fetchDays(year, month) {
    for(var i = 0; i < 6; ++i)
        document.getElementById('week' + i).innerHTML = '<td></td>';

    var xmlhttp = new XMLHttpRequest();
    var url = cal_api + 'cal/';
    if(typeof year !== 'undefined') {
        url += year + '/' + month;
        console.log(url);
    }
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200)
            renderCal(JSON.parse(this.responseText));
    };


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
    if (typeof document.getElementsByClassName('today')[0] !== 'undefined') {
        var today_heart = feather.icons.heart.toSvg({
            color: 'red',
            fill: 'red'
        });
        document.getElementsByClassName('today')[0].style.backgroundImage =
            'url(\'data:image/svg+xml;utf8,' + today_heart + '\')';
        document.getElementsByClassName('today')[0].className += ' animated infinite pulse';
    }

    // 绑定切换按钮
    document.getElementById('prev-month').onclick = function (ev) {
        var year = this.getAttribute('data-year');
        var month = this.getAttribute('data-month');
        if(month - 1 >= 1) fetchDays(year, month - 1);
        else fetchDays(year - 1, 12);
    }
    document.getElementById('next-month').onclick = function (ev) {
        var year = parseInt(this.getAttribute('data-year'));
        var month = parseInt(this.getAttribute('data-month'));
        if(month + 1 <= 12) fetchDays(year, month + 1);
        else fetchDays(year + 1, 1);
    }

}
