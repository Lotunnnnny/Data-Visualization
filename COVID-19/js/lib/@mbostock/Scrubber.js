
/*
* Downloaded from: https://observablehq.com/@mbostock/scrubber
* Created by: Mike Bostock
* Modified by: Zhuoling Li
*/

function Scrubber(values) {
    format = date => date.toString();
    let delay = 100;
    let autoplay = true;
    let loop = false;
    let alternate = false;

    let form = d3.select('#scroller');
    let b = d3.select('#button');
    let i = d3.select('#controller');
    let o = d3.select('#output');

    let timer = null;
    let direction = 1;
    function start() {
        b.text("Pause");
        timer = delay === null
            ? requestAnimationFrame(tick)
            : setInterval(tick, delay);
    }
    function stop() {
        b.text("Play");
        if (delay === null) cancelAnimationFrame(timer);
        else clearInterval(timer);
        timer = null;
    }
    function tick() {
        if (delay === null) timer = requestAnimationFrame(tick);
        // console.log(i.property("value"));
        if (+i.property("value") >= +values.length-1) {
            if (!loop) return stop();
            if (alternate) direction = -direction;
        }
        i.property("value", +i.property("value") + direction);
        document.querySelector('#controller').dispatchEvent(new CustomEvent("input", {bubbles: true}));
    }
    document.querySelector('#controller').oninput = event => {
        if (event && event.isTrusted && timer) document.querySelector('#button').onclick();
        form.attr('value', values[+i.property("value")]);
        o.text(format(form.attr('value'), +i.property('value'), values));
        controlTime(form.attr('value'));
    };
    document.querySelector('#button').onclick = () => {
        if (timer) return stop();
        direction = alternate && i.property("value") === values.length - 1 ? -1 : 1;
        i.property("value", +i.property("value") + direction);
        document.querySelector('#controller').dispatchEvent(new CustomEvent("input", {bubbles: true}));
        start();
    };
    document.querySelector('#controller').oninput();
    if (autoplay) start();
    else stop();
    return form;
}