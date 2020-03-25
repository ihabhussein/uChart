Chart = (selector, options) => {
    // let uDate = (uts, format = {}) => new Date(uts * 1000).toLocaleDateString(document.documentElement.lang, format);
    // let jsDate = (d, format = {}) => new Date(d).toLocaleDateString(document.documentElement.lang, format);

    let isObject = x => x && typeof x === 'object' && !Array.isArray(x);

    let merge = (target, ...sources) => {
        sources.forEach(s => {
            for (let k in s) {
                if (isObject(s[k])) {
                    if (!isObject(target[k])) target[k] = {};
                    merge(target[k], s[k]);
                } else {
                    target[k] = s[k];
                };
            };
        });
        return target;
    };

    let limits = (series, min, max, cb = (x => x)) => {
        series.forEach(d => {
            min = Math.min(...d.map(cb), min);
            max = Math.max(...d.map(cb), max);
        });
        return [min, max];
    };

    let canvas = document.querySelector(selector);
    let W = canvas.width = canvas.clientWidth, H = canvas.height = canvas.clientHeight;

    let style = window.getComputedStyle(canvas);
    let em = parseFloat(getComputedStyle(document.documentElement).fontSize);

    let colors = ['orange', 'limegreen', 'steelblue', 'red', 'yellow',];
    let mx = 3 * em, my = 3 * em, xx = 0, yx = 0;

    let ctx = canvas.getContext('2d');
    let moveTo = (x, y) => ctx.moveTo((x - options.xAxis.min) * xx, -(y - options.yAxis.min) * yx);
    let lineTo = (x, y) => ctx.lineTo((x - options.xAxis.min) * xx, -(y - options.yAxis.min) * yx);
    let rect = (x, y, w, h) => {
        ctx.strokeRect((x - options.xAxis.min) * xx, -(y - options.yAxis.min) * yx, w * xx, -h * yx);
        ctx.fillRect((x - options.xAxis.min) * xx, -(y - options.yAxis.min) * yx, w * xx, -h * yx);
    };
    let fillText = (s, x, y) => ctx.fillText(s, (x - options.xAxis.min) * xx, (y - options.yAxis.min) * yx);

    let setup = () => {
        options = merge({
            lines: [], bars: [],
            xAxis: {title: '', min: Infinity, max: -Infinity, ticks: undefined},
            yAxis: {title: '', min: Infinity, max: -Infinity, ticks: undefined},
        }, options);
        let series = [...options.lines.map(d => d.data), ...options.bars.map(d => d.data)];
        [options.xAxis.min, options.xAxis.max] = limits(series, options.xAxis.min, options.xAxis.max, el => el[0]);
        [options.yAxis.min, options.yAxis.max] = limits(series, options.yAxis.min, options.yAxis.max, el => el[1]);

        xx = (W - 2 * mx) / (options.xAxis.max - options.xAxis.min);
        yx = (H - 2 * my) / (options.yAxis.max - options.yAxis.min);

        ctx.translate(mx, H - my);
        ctx.textAlign = 'center';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        ctx.font = style.font;
        ctx.fillStyle = ctx.strokeStyle = style.color;
    };

    let axes = () => {
        ctx.save();
        ctx.beginPath();

        moveTo(options.xAxis.min, options.yAxis.max);
        lineTo(options.xAxis.min, options.yAxis.min);
        lineTo(options.xAxis.max, options.yAxis.min);
        ctx.stroke();

        // x-axis title
        ctx.textBaseline = 'bottom';
        ctx.fillText(options.xAxis.title, W / 2 - mx, my);

        // y-axis title
        ctx.rotate(Math.PI / -2);
        ctx.textBaseline = 'top';
        ctx.fillText(options.yAxis.title, H / 2 - my, -mx);

        ctx.restore();
    };

    let ticks = () => {
        ctx.save();
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        if (options.xAxis.ticks > 0) {
            ctx.textBaseline = 'top';
            for (let x = options.xAxis.min + options.xAxis.ticks; x <= options.xAxis.max; x += options.xAxis.ticks) {
                fillText(x, x, options.yAxis.min);
                moveTo(x, options.yAxis.min);
                lineTo(x, options.yAxis.max);
            }
        };
        if (options.yAxis.ticks > 0) {
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            for (let y = options.yAxis.min + options.yAxis.ticks; y <= options.yAxis.max; y += options.yAxis.ticks) {
                fillText(y, options.xAxis.min, -y);
                moveTo(options.xAxis.min, y);
                lineTo(options.xAxis.max, y);
            }
        };
        ctx.stroke();
        ctx.restore();
    };

    let plotLine = (data, color) => {
        if (data.length === 0) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        moveTo(data[0][0], data[0][1]);
        data.forEach(el => lineTo(el[0], el[1]));
        ctx.stroke();
        ctx.restore();
    };

    let plotBar = (data, color, n = 1, idx = 0, barSep = 1) => {
        let w = options.xAxis.ticks / (n + (barSep? 1: 0));
        let dx = w * (idx - n / 2);
        ctx.save();
        ctx.strokeStyle = style.color;
        ctx.fillStyle = color;
        data.forEach(d => rect(d[0] + dx, 0, w, d[1]));
        ctx.restore();
    };

    setup();
    axes();
    ticks();
    options.bars.forEach((d, idx) => plotBar(d.data, d.color || colors[idx % colors.length], options.bars.length, idx, options.barSep));
    options.lines.forEach((d, idx) => plotLine(d.data, d.color || colors[idx % colors.length]));
};
