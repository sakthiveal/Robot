/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */

//browser detection scripts

var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
var isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
// At least Safari 3+: "[object HTMLElementConstructor]"
var isChrome = !!window.chrome && !isOpera; // Chrome 1+
var isIE = /*@@cc_on!@@*/ false || !!document.documentMode; // At least IE6
var clickHandler = ('ontouchstart' in document.documentElement ? "touchstart" : "click");
clickHandler = 'click';
if (isIE) {
    $("html").addClass("ie" + document.documentMode);
    IEVersion = document.documentMode;
}

if (isSafari) {
    $("html").addClass("safari " + isiPhone());
}


var orientation = 'landscape';

function detectIPadOrientation() {
    if (orientation == 0) {
        orientation = 'portrait';
    } else if (orientation == 90) {
        orientation = 'landscape';
    } else if (orientation == -90) {
        orientation = 'landscape';
    } else if (orientation == 180) {
        orientation = 'portrait';
    }

}

function setOrientation() {
    orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}
setOrientation();
window.onorientationchange = detectIPadOrientation;

function isiPhone() {

    if (navigator.platform.indexOf("iPhone") != -1)
        return 'iphone';
    if (navigator.platform.indexOf("iPod") != -1)
        return 'ipod';
    if (navigator.platform.indexOf("iPad") != -1)
        return 'ipad';
}


(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {

    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            s = decodeURIComponent(s.replace(pluses, ' '));
            return config.json ? JSON.parse(s) : s;
        } catch (e) {}
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function(key, value, options) {

        // Write

        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires,
                    t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }

            return (document.cookie = [
                encode(key), '=', stringifyCookieValue(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie, value);
                break;
            }

            // Prevent storing a cookie that we couldn't decode.
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }

        return result;
    };

    config.defaults = {};

    $.removeCookie = function(key, options) {
        if ($.cookie(key) === undefined) {
            return false;
        }

        // Must not alter options, thus extending a fresh object...
        $.cookie(key, '', $.extend({}, options, {
            expires: -1
        }));
        return !$.cookie(key);
    };

}));


var documentId = $('body').data('id');

$(document).ready(function() {
    licenseId = $.cookie("licenseId");
});

document.addEventListener('touchstart', function(e) {
    storeDocumentData();
}, false);
document.addEventListener('click', function(e) {
    storeDocumentData();
}, false);

$(function() {
    $(document).on('click', '.tick', function() {
        $(this).toggleClass('ticked');
    });
    $('#resetBtn').on('click', function() {
        resetForm();
    });
    documentId = $('body').data('id');
    loadDocumentData();
    $('.jump').keyup(function(e) {
        if ($(this).val().length == $(this).attr('maxlength')) {
            var ntabindex = parseInt($(this).attr('tabindex'));
            ntabindex++;
            $('input[tabindex=' + ntabindex + ']').focus();
        }
    })

});




function loadDocumentData() {

    $('input[type=text]').each(function(i, e) {
        var storedValue = localStorage.getItem(licenseId + 'document' + documentId + '-' + $(e).attr('id'));
        $(e).val(storedValue);
    });
    $('textarea').each(function(i, e) {
        var storedValue = localStorage.getItem(licenseId + 'document' + documentId + '-' + $(e).attr('id'));
        $(e).val(storedValue);
    });
}

function resetForm() {
    $('input[type=text]').each(function(i, e) {
        $(e).val('');
    });
    $('textarea').each(function(i, e) {
        $(e).val('');
    });
    $('input[type=checkbox').each(function(i, e) {
        $(e).prop('checked', false);
    });
}

function storeDocumentData() {

    $('input[type=text]').each(function(i, e) {
        localStorage.setItem(licenseId + 'document' + documentId + '-' + $(e).attr('id'), $(e).val());
    });
    $('textarea').each(function(i, e) {
        localStorage.setItem(licenseId + 'document' + documentId + '-' + $(e).attr('id'), $(e).val());
    });
    $('input[type=checkbox').each(function(i, e) {
        localStorage.setItem(licenseId + 'document' + documentId + '-' + $(e).attr('id'), $(e).prop('checked'));
    });
}

function makeUnselectable(node) {
    var bodyId = $(node).find('body').attr('id');
    var doc = node.getElementById(bodyId);
    makeUnselectableRecursive(doc);
    $.each($('input[type=text],textarea'), function(i, e) {
        $(e).removeAttr('unselectable');
    });
}

function makeUnselectableRecursive(node) {

    if (node.nodeType == 1) {
        node.setAttribute("unselectable", "on");
    }
    var child = node.firstChild;
    while (child) {

        makeUnselectableRecursive(child);
        child = child.nextSibling;
    }
}


//--------------------- code for app_init starts here ---------------------
// block-1
var extLoaded = false;
var intLoaded = false;

var isIE = false;
var urlPath = window.location.pathname;
var arrTemp = urlPath.split('/');
var currentPage = arrTemp[arrTemp.length - 1];
var currentDir = arrTemp[arrTemp.length - 2];

function idrLoad() {
    idrLoaded = true;
    var bounds;
    var heights = new Array(160, 160, 160, 160, 160, 160, 160, 160, 160, 160);

    var objID = "Djuraffaren_1";
    if (currentDir.toLowerCase() == "robot") {
        objID = "Djuraffaren_1";
    } else {
        objID = currentDir + '_' + currentPage.substr(0, currentPage.indexOf('.'));
    }

    var objTag = document.getElementById(objID);
    objTag.addEventListener("load", function() {
        IDRViewer.makeNavBar(10, 3, 1125, 1125, 0, heights, '.jpg', bounds);
        document.getElementById("hide").remove();
    }, false);
}
// block-1

// block-2
// Ensure that we're not replacing any onload events
function addLoadEvent(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            if (oldonload) {
                oldonload();
            }
            func();
        }
    }
}
addLoadEvent(function() {
    var pageNo = currentPage.substr(0, currentPage.indexOf('.'));
    if (currentDir.toLowerCase() == "robot") {
        load1();
    } else if (currentDir == "Djuraffaren") {
        var f2 = [
            ['t3_2', 313],
            ['t4_2', 493]
        ];
        var f3 = [
            ['t2_3', 392],
            ['t3_3', 236],
            ['t4_3', 313],
            ['t7_3', 1404],
            ['t8_3', 596]
        ];
        var f4 = [
            ['t2_4', 392],
            ['t3_4', 236],
            ['t4_4', 313],
            ['t7_4', 1663],
            ['t8_4', 840],
            ['t9_4', 596],
            ['ti_4', 571],
            ['tp_4', 607],
            ['ts_4', 497]
        ];
        var f5 = [
            ['t2_5', 392],
            ['t3_5', 236],
            ['t4_5', 313],
            ['t7_5', 991],
            ['t8_5', 941]
        ];
        var f6 = [
            ['t2_6', 392],
            ['t3_6', 236],
            ['t4_6', 313],
            ['t9_6', 1014],
            ['ta_6', 1288]
        ];
        if (pageNo == 2) {
            load2(f2);
        } else if (pageNo == 3) {
            load2(f3);
        } else if (pageNo == 4) {
            load2(f4);
        } else if (pageNo == 5) {
            load2(f5);
        } else if (pageNo == 6) {
            load2(f6);
        }
    } else if (currentDir == "Honsgarden") {
        load1();
    } else if (currentDir == "Loppis") {
        var f2 = [
            ['t3_2', 313],
            ['t4_2', 493]
        ];
        var f3 = [
            ['t2_3', 392],
            ['t3_3', 236],
            ['t4_3', 313],
            ['t7_3', 641],
            ['t8_3', 740],
            ['t9_3', 596]
        ];

        var f4 = [
            ['t3_4', 392],
            ['t4_4', 236],
            ['t5_4', 313],
            ['t8_4', 754],
            ['t9_4', 596],
            ['ta_4', 831],
            ['tb_4', 585],
            ['tc_4', 585],
            ['td_4', 620],
            ['te_4', 585],
            ['tf_4', 585]
        ];
        var f5 = [
            ['t2_5', 392],
            ['t3_5', 236],
            ['t4_5', 313],
            ['t6_5', 419],
            ['t7_5', 680],
            ['t8_5', 419],
            ['ta_5', 419],
            ['tb_5', 419],
            ['tc_5', 419],
            ['td_5', 419],
            ['te_5', 692],
            ['tf_5', 651],
            ['tg_5', 1725],
            ['tn_5', 356],
            ['tp_5', 356],
            ['tr_5', 356],
            ['tt_5', 356],
            ['tv_5', 356],
            ['tx_5', 356],
            ['tz_5', 356],
            ['t11_5', 356],
            ['t13_5', 356],
            ['t15_5', 356]
        ];
        var f6 = [
            ['t2_6', 392],
            ['t3_6', 236],
            ['t4_6', 313],
            ['t7_6', 1872]
        ];
        if (pageNo == 2) {
            load2(f2);
        } else if (pageNo == 3) {
            load2(f3);
        } else if (pageNo == 4) {
            load2(f4);
        } else if (pageNo == 5) {
            load2(f5);
        } else if (pageNo == 6) {
            load2(f6);
        }
    } else if (currentDir == "Nojesfaltet") {
        load1();
    } else if (currentDir == "Skolan") {
        var f2 = [
            ['t3_2', 313],
            ['t4_2', 493]
        ];
        var f3 = [
            ['t2_3', 392],
            ['t3_3', 236],
            ['t4_3', 313],
            ['t7_3', 641],
            ['t8_3', 1040],
            ['t9_3', 596]
        ];
        var f4 = [
            ['t2_4', 392],
            ['t3_4', 236],
            ['t4_4', 313],
            ['t7_4', 544],
            ['t9_4', 518],
            ['tb_4', 405],
            ['td_4', 413],
            ['te_4', 901],
            ['tf_4', 460],
            ['th_4', 754],
            ['ti_4', 596],
            ['tj_4', 1366]
        ];
        var f5 = [
            ['t2_5', 392],
            ['t3_5', 236],
            ['t4_5', 313],
            ['t6_5', 1195],
            ['t7_5', 1531],
            ['t8_5', 665],
            ['t9_5', 612],
            ['ta_5', 610],
            ['tb_5', 787],
            ['tc_5', 729],
            ['td_5', 766]
        ];
        var f6 = [
            ['t2_6', 392],
            ['t3_6', 236],
            ['t4_6', 313],
            ['t6_6', 1588],
            ['t7_6', 503]
        ];
        if (pageNo == 2) {
            load2(f2);
        } else if (pageNo == 3) {
            load2(f3);
        } else if (pageNo == 4) {
            load2(f4);
        } else if (pageNo == 5) {
            load2(f5);
        } else if (pageNo == 6) {
            load2(f6);
        }
    }

});

function adjustWordSpacing(widths) {
    var i, allLinesDone = false;
    var isDone = [];
    var currentSpacing = [];
    var elements = [];

    // Initialise arrays
    for (i = 0; i < widths.length; i++) {
        elements[i] = document.getElementById(widths[i][0]);
        if (isIE) widths[i][1] = widths[i][1] * 4;
        currentSpacing[i] = Math.floor((widths[i][1] - elements[i].offsetWidth) / elements[i].innerHTML.match(/\s.|&nbsp;./g).length); //min
        if (isIE) currentSpacing[i] = Math.floor(currentSpacing[i] / 4);
        isDone[i] = false;
    }

    while (!allLinesDone) {
        // Add each adjustment to the render queue without forcing a render
        for (i = 0; i < widths.length; i++) {
            if (!isDone[i]) {
                elements[i].style.wordSpacing = currentSpacing[i] + 'px';
            }
        }

        allLinesDone = true;
        // If elements still need to be wider, add 1 to the word spacing
        for (i = 0; i < widths.length; i++) {
            if (!isDone[i] && currentSpacing[i] < 160) {
                if (elements[i].offsetWidth >= widths[i][1]) {
                    isDone[i] = true;
                } else {
                    currentSpacing[i]++;
                    allLinesDone = false;
                }
            }
        }
    }

    for (i = 0; i < widths.length; i++) {
        elements[i].style.wordSpacing = (currentSpacing[i] - 1) + 'px';
    }
}
// block-2

function load1() {}

function load2(val) {
    var timeout = 100;
    if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) timeout = 500;
    setTimeout(function() {
        adjustWordSpacing(val);
    }, timeout);
}

// block-3
if (extLoaded) {
    idrLoad();
} else {
    intLoaded = true;
}

makeUnselectable(document);
// block-3
//------------- code for app_init ends here -------------------------