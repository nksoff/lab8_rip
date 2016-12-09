var cache = (function () {
    var isSupported = function (storageName) {
        try {
            return (storageName in window && window[storageName]);
        }
        catch (e) {
            return false;
        }
    };

    var ls = 'localStorage';
    if (isSupported(ls)) {
        var storage = window[ls];
        return {
            get: function (key) {
                var res = storage.getItem(key);

                try {
                    return JSON.parse(res);
                }
                catch (e) {
                    return res || undefined;
                }
            },
            set: function (key, val) {
                if (val === undefined) {
                    storage.remove(key);
                    return;
                }

                if (typeof val !== 'string') {
                    val = JSON.stringify(val);
                }

                return storage.setItem(key, val);
            }
        };
    }

    var local = {};
    return {
        get: function (key) {
            return local[key];
        },
        set: function (key, val) {
            local[key] = val;
        }
    }
})();

$(function () {
    var stepsPerGraph = 1000;
    var stepsOscilloscope = 100;
    var timeOscilloscope = 300;

    var $function = $('.function');
    var cacheFunctionKey = 'function';

    var $range = $('.range');
    var cacheRangeKey = 'range';

    var currentRange = cache.get(cacheRangeKey);

    if (!currentRange) {
        currentRange = '-100,100';
    }

    $range.jRange({
        from: -100,
        to: 100,
        step: 1,
        scale: [-100, -75, -50, -25, 0, 25, 50, 75, 100],
        format: '%s',
        width: 'auto',
        showLabels: true,
        isRange: true,
        onstatechange: function (val) {
            cache.set(cacheRangeKey, val);
        }
    }).jRange('setValue', currentRange);

    var getCurrentRange = function () {
        var res = $range.val().split(',');
        return {from: parseFloat(res[0]), to: parseFloat(res[1])};
    };

    var currentFunction = cache.get(cacheFunctionKey);

    if (!currentFunction) {
        currentFunction = 'Math.sin(x)';
    }

    $function.val(currentFunction)
        .keyup(function () {
            cache.set(cacheFunctionKey, $(this).val());
            $(this).trigger('check');
        }).on('check', function () {
        var isError = false;
        var func = $(this).val();

        try {
            var range = getCurrentRange();
            var x = range.from;

            isError = isNaN(eval(func));
        }
        catch (e) {
            isError = true;
        }

        $(this).toggleClass('error', isError);
    }).trigger('check');


    var $buttonGo = $('.button-go');
    var $buttonStart = $('.button-start');
    var $buttonStop = $('.button-stop');

    var $graph = $('.graph');

    var countGraphData = function (func, from, to) {
        var data = [];
        var step = Math.abs(to - from) / stepsPerGraph;

        try {
            for (var x = from; x < to; x += step) {
                data.push([x, eval(func)]);
            }
        }
        catch (e) {
            return [];
        }
        return data;
    };

    var renderGraph = function (fun, from, to) {
        $.plot($graph, [
            {
                data: countGraphData(fun, from, to),
                label: fun,
                color: '#4068B2'
            }]
        );
    };

    $buttonGo.click(function (e) {
        e.preventDefault();

        var range = getCurrentRange();
        var functionVal = $function.val();

        renderGraph(functionVal, range.from, range.to);
    });

    var latestInterval = null;

    $buttonStart.click(function (e) {
        e.preventDefault();

        if (latestInterval) {
            clearInterval(latestInterval);
        }

        var range = getCurrentRange();
        var from = range.from;
        var to = range.to;

        var functionVal = $function.val();
        var dx = Math.max(0.1, Math.abs(to - from) / stepsOscilloscope);

        var next = function () {
            renderGraph(functionVal, from, to);
            from += dx;
            to += dx;
        };

        latestInterval = setInterval(next, timeOscilloscope);
    });

    $buttonStop.click(function (e) {
        e.preventDefault();

        if (!latestInterval) {
            return;
        }

        clearInterval(latestInterval);
        latestInterval = null;
    });
});