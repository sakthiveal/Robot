var IDRViewer = (function() {
    var IDR = {},
        zoom = 1,
        width = 0,
        height = 0,
        pageHeight,
        curPg = 0,
        pgCount = 0,
        jpedal,
        pgOverlay,
        container,
        mainContainer,
        type,
        sizes = [],
        thumbnailBar,
        sidebar,
        thmbnls = false,
        outline = false,
        selectMode,
        isMobile,
        isIos,
        useTouchEvents,
        isMouseDown = false,
        mouseX,
        mouseY,
        CUR_DEFAULT = 0,
        CUR_GRAB = 1,
        CUR_GRABBING = 2,
        SEL_SELECT = 0,
        SEL_MOVE = 1,
        ZM_DEFAULT = 5,
        ZM_FITWIDTH = 2,
        ZM_FITHEIGHT = 3,
        ZM_FITPAGE = 4,
        ZM_SPECIFIC = 0,
        ZM_ACTUALSIZE = 1,
        zoomType = 3,
        NAV_HEIGHT = 40,
        loadedThumbsArray = [],
        sidebarScrlTop = 0,
        lastScroll = 0,
        firstPageName = "index",
        scrlLeft = 0,
        scrlTop = 0,
        imageType,
        allPagesSameSize = true;

    IDR.makeNavBar = function(pageCount, curPage, w, h, t, heights, imgType) {
        "use strict";
        //type 0 = single pages
        //type 1 = splitspreads
        //type 2 = singlefile

        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        useTouchEvents = isMobile && window.requestAnimationFrame && !(typeof InstallTrigger !== 'undefined');

        container = d("contentContainer");
        mainContainer = d("mainContent");
        sidebar = d('left');
        pgCount = pageCount;
        curPg = curPage;
        width = w;
        height = container.clientHeight - 6; //-padding
        pageHeight = h;
        type = t;
        imageType = imgType;
        var opt, i, rm;

        d('pgCount').innerHTML = "/" + pgCount;

        container.style.width = width + "px";
        container.style.height = height + "px";

        //Populate the goto dropdown with page numbers
        var goBtn = d("goBtn");

        if (type === 0) {
            jpedal = d("jpedal");

            for (i = 1; i <= pgCount; i++) {
                opt = document.createElement('option');
                opt.value = i;
                opt.innerHTML = String(i);
                goBtn.appendChild(opt);
            }
            goBtn.selectedIndex = curPage - 1;
        } else if (type === 1) { //splitspreads
            jpedal = d("container" + curPage);
            d("goBtn").style.width = "65px";

            opt = document.createElement('option');
            opt.value = 1;
            opt.innerHTML = "1";
            goBtn.appendChild(opt);

            var text;
            for (i = 2; i <= pgCount; i += 2) {

                opt = document.createElement('option');
                opt.value = i;
                if (i !== pgCount || pgCount % 2 === 1) {
                    text = String(i + "-" + (i + 1));
                } else {
                    text = String(i);
                }
                opt.innerHTML = text;
                goBtn.appendChild(opt);
            }

            goBtn.selectedIndex = curPage / 2;

        } else if (type === 2) { //singlefile
            jpedal = d("jpedal");
            if (pageCount > 1) {
                scrollEv(null);
            }

            for (i = 1; i <= pgCount; i++) {
                opt = document.createElement('option');
                opt.value = i;
                opt.innerHTML = String(i);
                goBtn.appendChild(opt);

                if (useTouchEvents) {
                    d('page' + i).style.margin = "0 0 10px";
                } else {
                    if (i !== pgCount) {
                        d('page' + i).style.margin = "0 auto 10px";
                    } else {
                        d('page' + i).style.margin = "0 auto";
                    }
                }

                var pageElm = d('page' + i);
                if (pageElm.clientWidth != width) {
                    allPagesSameSize = false;
                }
                sizes[i] = {
                    width: pageElm.clientWidth,
                    height: pageElm.clientHeight
                };
            }
            goBtn.selectedIndex = curPage - 1;
        }

        jpedal.style.transformOrigin = "top left";
        jpedal.style.webkitTransformOrigin = "top left";
        jpedal.style.msTransformOrigin = "top left";
        jpedal.style.mozTransformOrigin = "top left";
        jpedal.style.oTransformOrigin = "top left";
        jpedal.style.margin = "0";


        var zoomBtn = d("zoomBtn");
        if (!useTouchEvents) {
            var zoomParam = getURLParamValue('zoom');
            var zm = parseFloat(zoomParam);
            if (zoomParam == "width") {
                zoomType = ZM_FITWIDTH;
            } else if (zoomParam == "height") {
                zoomType = ZM_FITHEIGHT;
            } else if (zoomParam == "page") {
                zoomType = ZM_FITPAGE;
            } else if (zoomParam == "actual") {
                zoomType = ZM_ACTUALSIZE;
            } else if (!isNaN(zm) && zm > 0) {
                zoomType = ZM_SPECIFIC;
                zoom = zm;
            } else {
                zoomType = ZM_DEFAULT;
            }
            zoomType = ZM_FITHEIGHT;
            d('zoomBtn').selectedIndex = zoomType;

            handleZoom();

            if (!allPagesSameSize) {
                zoomBtn.remove(5);
                zoomBtn.remove(4);
                zoomBtn.remove(3);
                zoomBtn.remove(2);
                mainContainer.scrollLeft = (container.offsetWidth - mainContainer.offsetWidth) / 2;
            }

            window.onresize = handleZoom;
        }

        var fullscreenEnabled = document.fullscreenEnabled || document.msFullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;
        if (!fullscreenEnabled) {
            rm = d('btnFullscreen');
            rm.parentNode.removeChild(rm);
        }

        thumbnailBar = document.getElementById("leftContent");

        loadThumbnailFrames(heights);
        // Initialise loaded array
        for (i = 0; i < pgCount; i++) {
            loadedThumbsArray[i] = false;
        }

        var curThumb = d('thumb' + curPage);
        curThumb.className = "thumbnail currentPageThumbnail";
        thumbnailBar.scrollTop = curThumb.getBoundingClientRect().top - 80;

        thmbnls = false;
        outline = false;
        d('btnOutlines').className = 'inactive navBtn';
        d('btnThumbnails').className = 'inactive navBtn';
        if (getURLParamValue('sidebar') === 'thumbnails') {
            thmbnls = true;
            outline = false;
        } else if (getURLParamValue('sidebar') === 'outlines') {
            thmbnls = true;
            outline = true;
            d('btnThumbnails').className = 'navBtn';
        }

        if (thmbnls) {
            d('main').style.transitionDuration = "0ms";
            sidebar.style.transitionDuration = "0ms";
            sidebar.style.width = "200px";
            sidebar.style.left = "0";

            sidebar.offsetLeft; //force redraw
            d('main').style.transitionDuration = "200ms";
            sidebar.style.transitionDuration = "200ms";
            scrollNext(-1);
        }
        if (outline) {
            d('thumbnailPanel').style.display = "none";
            d('outlinePanel').style.display = "inline";
        }

        selectMode = (getURLParamValue('mode') === 'pan') ? SEL_MOVE : SEL_SELECT;
        this.setSelectMode(selectMode);

        addevnt("fullscreenchange", document, fullscreenUpdate);
        addevnt("MSFullscreenChange", document, fullscreenUpdate);
        addevnt("mozfullscreenchange", document, fullscreenUpdate);
        addevnt("webkitfullscreenchange", document, fullscreenUpdate);

        addevnt("scroll", thumbnailBar, sidebarUpdateEvent);

        if (curPg === 1) {
            d('btnPrev').className = 'inactive navBtn';
        }
        // Last page or last page of splitspread mode
        if (curPg === pgCount || (type === 1 && pgCount % 2 === 1 && curPg + 1 === pgCount)) {
            d('btnNext').className = 'inactive navBtn';
        }

        var bookmarks = document.createElement('script');
        bookmarks.setAttribute('src', '');
        document.head.appendChild(bookmarks);

        if (isMobile) {
            rm = d('zoomBtn');
            rm.parentNode.removeChild(rm);
            rm = d('btnMove');
            rm.parentNode.removeChild(rm);
            rm = d('btnSelect');
            rm.parentNode.removeChild(rm);
        }

        if (useTouchEvents) {
            rm = d('btnZoomIn');
            rm.parentNode.removeChild(rm);
            rm = d('btnZoomOut');
            rm.parentNode.removeChild(rm);

            d('contentContainer').style.width = "100%";
            d('contentContainer').style.height = "100%";
            d('contentContainer').style.padding = "0";

            var screenWidth = window.innerWidth;
            zoom = screenWidth / width;
            defaultZoom = zoom;

            if (isIos) {
                setTimeout(function() {
                    setTransform(0, 0, zoom, false);
                }, 0);
            } else {
                //Make Android use 3d render so that when dragging/zoom starts no lag occurs.
                setTimeout(function() {
                    setTransform(0, 0, zoom, true);
                    jpedal.style.webkitBackfaceVisibility = "hidden";
                }, 0);
            }

            var lastTap,
                lastTouchX,
                lastTouchY,
                touchTimer,
                pythag,
                midX,
                midY,
                count = 0,
                allowSingleTouchDrag,
                eventCounter = 0,
                needsRerender,
                momentumX,
                momentumY,
                startX,
                startY,
                startTime,
                isSingleTouchDrag,
                isSingleTouchDragging,
                startEvent,
                isMomentumScrolling,
                stopMomentumScrolling,
                lastScrlX,
                lastScrlY,
                tempScrlX,
                tempScrlY,
                then,
                tempThen,
                poll,
                defaultZoom;

            var round = function(toRound) {
                return Math.round(toRound * 2) / 2;
            };

            var applyMomentum = function() {
                isMomentumScrolling = true;
                eventCounter++;

                if (!stopMomentumScrolling && (momentumX < -0.5 || momentumX > 0.5 || momentumY < -0.5 || momentumY > 0.5)) {
                    scrlLeft -= momentumX;
                    scrlTop -= momentumY;

                    momentumX = momentumX * 0.95;
                    momentumY = momentumY * 0.95;

                    checkBounds();

                    setTransform(round(scrlLeft), round(scrlTop), zoom, true);

                    window.requestAnimationFrame(applyMomentum, jpedal);

                } else {
                    isMomentumScrolling = false;
                    if (!stopMomentumScrolling) {
                        //Don't rerender if we were forced to stop scrolling (user scrolled again)
                        var currentEvent = eventCounter;
                        setTimeout(function() {
                            //Make sure no other events have occurred since we started the timer
                            if (eventCounter === currentEvent) {
                                forceRerender();
                            }
                        }, 200);
                    }
                    stopMomentumScrolling = false;
                }
            };

            var touchStart = function(event) {
                eventCounter++;
                startEvent = eventCounter;
                if (isMomentumScrolling) {
                    stopMomentumScrolling = true;
                }

                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
                startTime = Date.now();

                if (event.touches.length === 2) {
                    var x1 = event.touches[0].clientX;
                    var x2 = event.touches[1].clientX;
                    var y1 = event.touches[0].clientY;
                    var y2 = event.touches[1].clientY;

                    pythag = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));

                    midX = x1 - ((x1 - x2) / 2); //note duplicate in pinch zoom
                    midY = y1 - ((y1 - y2) / 2); //note duplicate in pinch zoom
                }

                if (event.touches.length == 1) {
                    var now = new Date().getTime();
                    lastTap = lastTap || now + 1;
                    var timeDiff = now - lastTap;
                    var xDiff = Math.abs(lastTouchX - event.touches[0].clientX);
                    var yDiff = Math.abs(lastTouchY - event.touches[0].clientY);
                    if (timeDiff < 500 && timeDiff > 0 && xDiff < 50 && yDiff < 50) {
                        //Double tap

                        var scale;
                        if (zoom > defaultZoom) {
                            scale = defaultZoom / zoom; //Default zoom
                        } else {
                            scale = (defaultZoom * 2) / zoom; //Default zoom * 2
                        }

                        var centerX = window.innerWidth / 2;
                        var centerY = NAV_HEIGHT + ((window.innerHeight - NAV_HEIGHT) / 2);
                        scrlLeft = scrlLeft + (centerX - lastTouchX);
                        scrlTop = scrlTop + (centerY - lastTouchY);

                        var x = -scrlLeft + centerX;
                        scrlLeft = scrlLeft - (((x * scale) - x));
                        var y = -scrlTop + centerY;
                        scrlTop = scrlTop - (((y * scale) - y));
                        zoom = zoom * scale;
                        checkBounds();

                        jpedal.style.transitionDuration = "200ms";
                        setTransform(scrlLeft, scrlTop, zoom, false);

                        setTimeout(function() {
                            jpedal.style.transitionDuration = "";
                        }, 200);
                        lastTap = 0;

                    } else {
                        lastTap = now;
                    }

                    lastTouchX = event.touches[0].clientX;
                    lastTouchY = event.touches[0].clientY;

                    allowSingleTouchDrag = true;
                } else {
                    touchTimer = null;
                }

                lastScrlX = scrlLeft;
                lastScrlY = scrlTop;
                tempScrlX = lastScrlX;
                tempScrlY = lastScrlY;
                tempThen = Date.now();
                then = Date.now();

                if (!poll) {
                    poll = setInterval(
                        function() {
                            lastScrlX = tempScrlX;
                            lastScrlY = tempScrlY;
                            tempScrlX = scrlLeft;
                            tempScrlY = scrlTop;
                            then = tempThen;
                            tempThen = Date.now();
                        }, 200);
                }
            };

            var forceRerender = function() {
                needsRerender = false;

                sidebar.style.zIndex = "5";
                jpedal.style.webkitBackfaceVisibility = "";
                requestAnimationFrame(function() {
                    setTransform(round(scrlLeft), round(scrlTop), zoom, false);
                }, jpedal);


                if (!isIos) {
                    var currentEvent = eventCounter;
                    //Switch back to 3d render so that when dragging starts no lag occurs.
                    setTimeout(function() {
                        jpedal.style.webkitBackfaceVisibility = "hidden";
                        if (eventCounter === currentEvent) {
                            //Only switch if other events have not occurred
                            setTransform(round(scrlLeft), round(scrlTop), zoom, true);
                            if (thmbnls) {
                                sidebar.style.zIndex = "10";
                            }
                        }
                    }, 200);
                }
            };

            var touchEnd = function(event) {
                clearInterval(poll);
                poll = null;
                eventCounter++;
                if (needsRerender) {
                    // Force re-render so not blurry after zoom
                    var currentEvent = eventCounter;

                    setTimeout(function() {
                        //Make sure no other events have occurred since we started the timer
                        if (eventCounter === currentEvent) {
                            forceRerender();
                        }
                    }, 200);
                }

                if (isSingleTouchDrag) {
                    isSingleTouchDrag = false;
                    isSingleTouchDragging = false;

                    var timeTaken = Date.now() - then;
                    var diffX = lastScrlX - scrlLeft;
                    var diffY = lastScrlY - scrlTop;
                    momentumX = diffX / (timeTaken / 16);
                    momentumY = diffY / (timeTaken / 16);

                    if (Math.abs(momentumX) < 0.5) {
                        momentumX = 0;
                    }
                    if (Math.abs(momentumY) < 0.5) {
                        momentumY = 0;
                    }

                    if (momentumX !== 0 || momentumY !== 0) {
                        window.requestAnimationFrame(applyMomentum, jpedal);
                    }

                }

            };
            var touchCancel = function(event) {
                touchEnd(null);
            };

            var checkBounds = function() {
                if (scrlLeft > 0) {
                    scrlLeft = 0;
                    momentumX = 0;
                }
                if (scrlTop > 0) {
                    scrlTop = 0;
                    momentumY = 0;
                }
                var pgWidth = width * zoom;
                if (scrlLeft + pgWidth < window.innerWidth) {
                    if (pgWidth > window.innerWidth) {
                        scrlLeft = window.innerWidth - pgWidth;
                    } else {
                        scrlLeft = 0;
                    }
                    momentumX = 0;
                }
                var pgHeight = pageHeight * zoom;
                if (NAV_HEIGHT + scrlTop + pgHeight < window.innerHeight) {
                    if (pgHeight > window.innerHeight - NAV_HEIGHT) {
                        scrlTop = window.innerHeight - pgHeight - NAV_HEIGHT;
                    } else {
                        scrlTop = 0;
                    }
                    momentumY = 0;
                }
            };

            var touchMove = function(event) {
                eventCounter++;
                event.preventDefault();
                event.stopPropagation();
                lastTap = 0; //For double tap

                isSingleTouchDrag = false;
                if (event.touches.length === 1) {
                    if (allowSingleTouchDrag) {
                        if (isIos) {
                            needsRerender = true;
                        }

                        isSingleTouchDrag = true;

                        var tapX = event.touches[0].clientX;
                        var tapY = event.touches[0].clientY;

                        var diffX = tapX - lastTouchX;
                        var diffY = tapY - lastTouchY;
                        scrlLeft = scrlLeft + diffX;
                        scrlTop = scrlTop + diffY;
                        lastTouchX = tapX;
                        lastTouchY = tapY;

                        checkBounds();

                        requestAnimationFrame(function() {
                            setTransform(round(scrlLeft), round(scrlTop), zoom, true);
                        }, jpedal);
                    }
                }


                if (event.touches.length === 2) {
                    allowSingleTouchDrag = false;
                    // 2 fingers moving therefore we get 2 touchMove events so only process 1
                    count = (count + 1) % 2;
                    if (count === 1) {
                        needsRerender = true; //Mark as needing a rerender in the future

                        var x1 = event.touches[0].clientX;
                        var x2 = event.touches[1].clientX;
                        var y1 = event.touches[0].clientY;
                        var y2 = event.touches[1].clientY;

                        var diff = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));

                        var scale = diff / pythag;

                        if (scale < 1 && width * zoom * scale < window.innerWidth) {
                            scale = 1;
                            zoom = defaultZoom;
                        }
                        if (zoom * scale > 4) {
                            scale = 1;
                        }

                        zoom = zoom * scale;

                        var newMidX = x1 - ((x1 - x2) / 2); //note duplicate in 2touch start
                        var newMidY = y1 - ((y1 - y2) / 2); //note duplicate in 2touch start

                        scrlLeft = scrlLeft + newMidX - midX;
                        scrlTop = scrlTop + newMidY - midY;

                        var x = -scrlLeft + newMidX;
                        scrlLeft = scrlLeft - (((x * scale) - x));
                        var y = -scrlTop + newMidY;
                        scrlTop = scrlTop - (((y * scale) - y));

                        checkBounds();

                        midX = newMidX;
                        midY = newMidY;

                        requestAnimationFrame(function() {
                            setTransform(round(scrlLeft), round(scrlTop), zoom, true);
                        }, jpedal);
                        pythag = diff;
                    }
                }
            };
            var orientationChange = function() {
                //setTimeout required because android does not give correct values for width immediately
                setTimeout(function() {
                    defaultZoom = window.innerWidth / width;

                    if (zoom <= defaultZoom) {
                        zoom = defaultZoom;
                    }

                    checkBounds();
                    setTransform(scrlLeft, scrlTop, zoom, false);
                }, 300);
            };

            mainContainer.addEventListener("touchstart", touchStart);
            mainContainer.addEventListener("touchend", touchEnd);
            mainContainer.addEventListener("touchcancel", touchCancel);
            mainContainer.addEventListener("touchmove", touchMove);
            window.onorientationchange = orientationChange;


            var SidebarTouchEvents = (function() {

                var Events = {},
                    isCloseDrag = false,
                    xStart,
                    yStart;

                Events.touchStart = function(event) {
                    if (event.touches.length === 1) {
                        xStart = event.touches[0].clientX;
                        yStart = event.touches[0].clientY;
                        isCloseDrag = true;
                    } else {
                        isCloseDrag = false;
                    }
                };

                Events.touchMove = function(event) {
                    if (isCloseDrag) {
                        var xDiff = xStart - event.touches[0].clientX;
                        var yDiff = Math.abs(yStart - event.touches[0].clientY);
                        if (yDiff > 50) {
                            isCloseDrag = false;
                        } else if (xDiff > 100) {
                            isCloseDrag = false;
                            IDRViewer.toggleThumbnails();
                        }
                    }
                };

                return Events;
            })();

            sidebar.addEventListener("touchstart", SidebarTouchEvents.touchStart);
            sidebar.addEventListener("touchmove", SidebarTouchEvents.touchMove);

        }
    };

    IDR.setBookmarks = function(bookmarks) {
        d('leftContent').style.top = "40px";
        d('leftNav').style.display = "block";
        d('outlinePanel').innerHTML = bookmarks;
        if (outline) {
            d('btnThumbnails').className = 'navBtn';
        } else {
            d('btnOutlines').className = 'navBtn';
        }
    };

    IDR.setFirstPageName = function(name) {
        "use strict";
        firstPageName = name;
    };

    var getURLParamValue = function(param) {
        "use strict";
        var url = document.URL;
        var jumIdx = url.toString().indexOf('?');
        var params = (jumIdx != -1) ? url.substr(jumIdx + 1).split("&") : "";
        for (var i = 0; i < params.length; i++) {
            params[i] = params[i].split('=');
            if (params[i][0] == param) {
                return params[i][1];
            }
        }
        return "";
    };

    IDR.toggleOutlines = function(isOutlines) {
        "use strict";
        if (outline && !isOutlines) {
            d('thumbnailPanel').style.display = "inline";
            d('outlinePanel').style.display = "none";
            thumbnailBar.scrollTop = d('thumb' + curPg).getBoundingClientRect().top - 80;
            outline = !outline;
            d('btnThumbnails').className = 'inactive navBtn';
            d('btnOutlines').className = 'navBtn';
        } else if (isOutlines && d('btnOutlines').className != 'inactive navBtn') {
            d('thumbnailPanel').style.display = "none";
            d('outlinePanel').style.display = "inline";
            outline = !outline;
            d('btnThumbnails').className = 'navBtn';
            d('btnOutlines').className = 'inactive navBtn';
        }
    };


    // Load the frames for all the thumbnails
    var loadThumbnailFrames = function(heights) {
        "use strict";
        var thumbHeight;
        var repeat = 0;
        var heightsIndex = 0;

        for (var page = 1; page <= pgCount; page++) {

            if (heights[heightsIndex] < 0 && repeat <= 0) {
                repeat = Math.abs(heights[heightsIndex]) - 1;
                heightsIndex++;
            } else if (repeat > 0) {
                repeat--;
            } else {
                thumbHeight = heights[heightsIndex];
                heightsIndex++;
            }

            var div = document.createElement("div");
            div.style.height = thumbHeight + "px";
            div.className = "thumbnail";
            div.id = "thumb" + page;
            div.setAttribute('onclick', 'IDRViewer.goToPage(' + page + ');');
            div.setAttribute('title', 'Page ' + page);
            div.innerHTML = '<img src=""/>';
            thumbnailBar.children[0].appendChild(div);
        }
    };

    var loadThumbnailAt = function(page) {
        "use strict";
        if (!loadedThumbsArray[page]) {
            thumbnailBar.children[0].children[page].children[0].setAttribute("src", ""); // added by sathish to stop loading thumbnail images
            loadedThumbsArray[page] = true;
        }
    };

    var sidebarUpdateEvent = function(evt) {
        "use strict";
        var scrollTop = thumbnailBar.scrollTop;
        lastScroll = sidebarScrlTop;
        sidebarScrlTop = scrollTop;

        setTimeout(function() {
            scrollNext(scrollTop);
        }, 500);
    };

    // Load the viewable thumbnails
    // If -1 is passed as a param, it will load any unloaded viewable thumbnails (allows for reuse when first loading thumbs )
    var scrollNext = function(scrollTop) {
        "use strict";
        if (scrollTop != sidebarScrlTop && scrollTop != -1)
            return;

        // load thumbs in view
        for (var thumbIndex = 0; thumbIndex < pgCount; thumbIndex++) {
            if (!loadedThumbsArray[thumbIndex]) {
                var curThumb = thumbnailBar.children[0].children[thumbIndex];
                // Bails out of the loop when the next thumbnail is below the viewable area
                if (curThumb.offsetTop > thumbnailBar.scrollTop + thumbnailBar.clientHeight) {
                    break;
                }
                if ((curThumb.offsetTop + curThumb.clientHeight) > thumbnailBar.scrollTop) {
                    loadThumbnailAt(thumbIndex);
                }
            }
        }
    };

    IDR.setSelectMode = function(type) {
        "use strict";
        //0 Text selectin (SEL_SELECT)
        //1 Panning (SEL_MOVE)
        if (isMobile)
            return;

        selectMode = type;
        if (type == SEL_SELECT) {
            d('btnSelect').className = 'inactive navBtn';
            d('btnMove').className = 'navBtn';
            container.style.cursor = getCursor(CUR_DEFAULT);
            container.onmousedown = function(e) {};
            document.body.onmouseup = function(e) {};
            document.body.onmousemove = function(e) {};
        } else {
            d('btnSelect').className = 'navBtn';
            d('btnMove').className = 'inactive navBtn';
            if (window.getSelection) {
                if (window.getSelection().empty) { // Chrome
                    window.getSelection().empty();
                } else if (window.getSelection().removeAllRanges) { // Firefox
                    window.getSelection().removeAllRanges();
                }
            } else if (document.selection) { // IE?
                document.selection.empty();
            }

            container.style.cursor = getCursor(CUR_GRAB);

            container.onmousedown = function(e) {
                e = e || window.event;
                container.style.cursor = getCursor(CUR_GRABBING);
                mouseX = e.clientX;
                mouseY = e.clientY;
                isMouseDown = true;
                return false;
            };
            document.body.onmouseup = function(e) {
                container.style.cursor = getCursor(CUR_GRAB);
                isMouseDown = false;
            };
            document.body.onmousemove = function(e) {
                if (isMouseDown) {
                    e = e || window.event;
                    mainContainer.scrollLeft = mainContainer.scrollLeft + mouseX - e.clientX;
                    mainContainer.scrollTop = mainContainer.scrollTop + mouseY - e.clientY;
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    return false;
                }
            };
        }
    };

    var getCursor = function(type) {
        "use strict";
        //0 Default (CUR_DEFAULT)
        //1 Open grab (CUR_GRAB)
        //2 Close grab (CUR_GRABBING)

        //Courtesy of http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        var isFirefox = typeof InstallTrigger !== 'undefined';
        var isChrome = !!window.chrome && !isOpera;

        if (isFirefox) {
            if (type == CUR_DEFAULT) return "";
            else if (type == CUR_GRAB) return "-moz-grab";
            else return "-moz-grabbing"; //CUR_GRABBING
        } else if (isChrome) {
            if (type == CUR_DEFAULT) return "";
            else if (type == CUR_GRAB) return "-webkit-grab";
            else return "-webkit-grabbing"; //CUR_GRABBING
        } else { //CUR_DEFAULT
            if (type == CUR_DEFAULT) return "";
            else return "all-scroll"; //CUR_GRABBING
        }
    };

    var getWidth = function() {
        "use strict";
        var w = 0;
        if (self.innerHeight) {
            w = self.innerWidth;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            w = document.documentElement.clientWidth;
        } else if (document.body) {
            w = document.body.clientWidth;
        }
        return w;
    };

    var setTransform = function(x, y, scale, hardwareAccelerate) {
        "use strict";
        var transform;
        if (hardwareAccelerate) {
            transform = "translate3d(" + x + "px, " + y + "px, 0) scale(" + scale + ")";
        } else {
            transform = "translateX(" + x + "px) translateY(" + y + "px) scale(" + scale + ")";
        }

        //   transform = "translateX(" + 155 + "px) translateY(" + y + "px) scale(" + 0.620333 + ")"; 
        jpedal.style.transform = transform;
        jpedal.style.webkitTransform = transform;
        jpedal.style.msTransform = transform;
        jpedal.style.MozTransform = transform;
        jpedal.style.OTransform = transform;
        //pgOverlay = d("pgOverlay");
        //pgOverlay.style.height = "100%";

        if (isiPhone() === 'ipad') {

            if (orientation == 'landscape') {
                transform = "translateX(" + 155 + "px) translateY(" + y + "px) scale(" + 0.620333 + ")";
                jpedal.style.transform = transform;
                jpedal.style.webkitTransform = transform;
                jpedal.style.msTransform = transform;
                jpedal.style.MozTransform = transform;
                jpedal.style.OTransform = transform;
                pgOverlay = d("pgOverlay");
                pgOverlay.style.height = "100%";

                pgOverlay = d("pgOverlay");
                pgOverlay.style.height = "0%";
            }
        }

        if (type === 2) {
            scrollEv();
        }
    };

    var orientation = 'landscape';

    function detectIPadOrientation() {
        if (orientation == 0) {
            alert('Portrait Mode, Home Button bottom');
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
    var updateZoom = function() {
        window.onorientationchange = detectIPadOrientation;
        "use strict";
        var scrollX = mainContainer.scrollLeft;
        var scrollY = mainContainer.scrollTop;
        var curHeight = container.offsetHeight;

        //Will occur when pressing zoom in/out buttons.
        if (zoomType === ZM_SPECIFIC) {
            d('zoomBtn').selectedIndex = ZM_SPECIFIC;
        }

        if (zoom > 4) {
            zoom = 4;
        } else if (zoom < 0.25) {
            zoom = 0.25;
        }

        // if (isiPhone() === 'ipad') {
        //     zoom = 0.6499;
        //     if (orientation == 'landscape') {
        //         zoom = 0.587;
        //     }

        // }

        if (isIE) { //isIE is set true within a conditional IE lt 9 in HTML file
            jpedal.style.zoom = zoom;
        }
        setTransform(0, 0, zoom, false);

        container.style.width = width * zoom + "px";
        container.style.height = height * zoom + "px";

        var percent = Math.floor(zoom * 100);
        if (!isMobile) {
            d("zoomBtn").options[0].innerHTML = percent + "%";
        }

        if (type == 2) {
            var jpedalZoom = Math.floor((100 / percent) * 100);
            jpedal.style.width = jpedalZoom + "%";
        }

        var scaledBy = container.offsetHeight / curHeight;
        mainContainer.scrollTop = scrollY * scaledBy;
    };

    IDR.zoomIn = function() {
        "use strict";
        zoomType = ZM_SPECIFIC;
        zoom = zoom * 1.2;
        updateZoom();
    };

    // Called when zoomBtn dropdown used
    IDR.zoomUpdate = function() {
        "use strict";
        zoomType = d("zoomBtn").selectedIndex;

        if (zoomType != ZM_SPECIFIC) {
            handleZoom();
        }
    };

    var handleZoom = function() {
        "use strict";

        var winWidth, winHeight, hScale, wScale, pgHeight;

        var fitWidthBehavior = function() {
            winWidth = mainContainer.clientWidth;
            if (type == 2) {
                width = sizes[curPg].width;
            }
            zoom = (winWidth - 6) / width;
        };

        switch (zoomType) {
            case ZM_DEFAULT:
                if (width > getWidth() && allPagesSameSize) {
                    fitWidthBehavior();
                } else {
                    zoom = 1;
                }
                break;
            case ZM_FITWIDTH:
                fitWidthBehavior();
                break;
            case ZM_FITHEIGHT:
                winHeight = mainContainer.clientHeight;
                hScale = (winHeight - 6) / height;

                if (type == 2) {
                    pgHeight = sizes[curPg].height;
                    hScale = (winHeight - 6) / pgHeight;
                }
                zoom = hScale;
                break;
            case ZM_FITPAGE:
                winWidth = mainContainer.clientWidth;
                winHeight = mainContainer.clientHeight;
                if (type == 2) {
                    width = sizes[curPg].width;
                    pgHeight = sizes[curPg].height;
                }
                wScale = (winWidth - 6) / width;
                hScale = (winHeight - 6) / height; //-6 because clientHeight doesn't take into account margins
                if (type == 2) {
                    hScale = (winHeight - 6) / pgHeight;
                }

                if (wScale > hScale) {
                    zoom = hScale;
                } else {
                    zoom = wScale;
                }
                break;
            case ZM_ACTUALSIZE:
                zoom = 1;
                break;
        }

        updateZoom();
    };

    IDR.zoomOut = function() {
        "use strict";
        zoomType = ZM_SPECIFIC;
        zoom = zoom / 1.2;
        updateZoom();
    };

    IDR.goToPage = function(pg) {
        "use strict";
        var i;
        if (pg === 0) {
            if (type === 0 || type === 2) {
                pg = d("goBtn").selectedIndex + 1;
            } else {
                pg = (d("goBtn").selectedIndex * 2) + 1;
            }
        }
        if (pg != curPg) {
            var paramArr = [];
            if (zoomType != ZM_DEFAULT) {
                var zoomValue;
                switch (zoomType) {
                    case ZM_FITWIDTH:
                        zoomValue = "width";
                        break;
                    case ZM_FITHEIGHT:
                        zoomValue = "height";
                        break;
                    case ZM_FITPAGE:
                        zoomValue = "page";
                        break;
                    case ZM_SPECIFIC:
                        zoomValue = zoom;
                        break;
                    case ZM_ACTUALSIZE:
                        zoomValue = "actual";
                        break;
                }
                paramArr[paramArr.length] = "zoom=" + zoomValue;
            }
            if (thmbnls && !outline) paramArr[paramArr.length] = "sidebar=thumbnails";
            if (thmbnls && outline) paramArr[paramArr.length] = "sidebar=outlines";
            if (selectMode == SEL_MOVE) paramArr[paramArr.length] = "mode=pan";

            var params = "?";
            for (i = 0; i < paramArr.length; i++) {
                if (i > 0) params = params + "&";
                params = params + paramArr[i];
            }
            if (params.length == 1) params = "";

            var link;
            if (type === 0) {
                link = getPageHref(pg, pgCount);
                window.open(link + ".html" + params, "_self");
            } else if (type == 1) {
                link = getMagazinePageHref(pg, pgCount);
                window.open(link + ".html" + params, "_self");
            } else if (type == 2) {

                if (useTouchEvents) {
                    jpedal.style.transitionDuration = "200ms";

                    scrlTop = scrlTop - d('page' + pg).getBoundingClientRect().top + NAV_HEIGHT;

                    setTransform(scrlLeft, scrlTop, zoom, false);

                    setTimeout(function() {
                        jpedal.style.transitionDuration = "";
                        IDR.updateCurrentPage();
                    }, 200);
                } else {
                    mainContainer.scrollTop = mainContainer.scrollTop + d('page' + pg).getBoundingClientRect().top - 45;
                    IDR.updateCurrentPage();
                }
            }
        }
    };

    IDR.updateCurrentPage = function() {
        "use strict";
        if (d('page1').getBoundingClientRect().top > 0) {
            curPg = 1;
            d('goBtn').selectedIndex = curPg - 1;
        } else {
            for (var i = 1; i <= pgCount; i++) {
                var bounds = d('page' + i).getBoundingClientRect();
                var y = bounds.top;
                var height = bounds.bottom - bounds.top;

                if (y <= height * 0.25 && y > -height * 0.5) {
                    curPg = i;
                    d('goBtn').selectedIndex = curPg - 1;
                    break;
                }
            }
        }

        var btnPrev = d('btnPrev');
        var btnNext = d('btnNext');
        if (curPg === 1) {
            btnPrev.className = 'inactive navBtn';
        } else {
            btnPrev.className = 'navBtn';
        }

        if (curPg === pgCount) {
            btnNext.className = 'inactive navBtn';
        } else {
            btnNext.className = 'navBtn';
        }

        var curThumb = d('thumb' + curPg);
        if (curThumb.className != "thumbnail currentPageThumbnail") {

            for (i = 1; i <= pgCount; i++) {
                d('thumb' + i).className = "thumbnail";
            }

            curThumb.className = "thumbnail currentPageThumbnail";
            thumbnailBar.scrollTop = thumbnailBar.scrollTop + curThumb.getBoundingClientRect().top - 80;
        }
    };

    var getPageHref = function(page, count) {
        "use strict";
        var iWithLeadingZeros = page.toString();
        var leadingZerosNeeded = count.toString().length - iWithLeadingZeros.length;

        if (page === 1) {
            iWithLeadingZeros = firstPageName;
        } else {
            for (var n = 0; n < leadingZerosNeeded; n++) {
                iWithLeadingZeros = "0" + iWithLeadingZeros;
            }
        }
        return iWithLeadingZeros;
    };

    var getMagazinePageHref = function(page, count) {
        "use strict";
        if (page > count) page = count;
        if (page === 1)
            return getPageHref(page, count);
        else if (page % 2 === 0) {
            if (page === count)
                return getPageHref(page, count);
            else
                return getPageHref(page, count) + "-" + getPageHref(page + 1, count);
        } else {
            return getPageHref(page - 1, count) + "-" + getPageHref(page, count);
        }
    };

    IDR.next = function() {
        "use strict";
        if (type == 1) {
            if (curPg + 1 < pgCount) this.goToPage(curPg + 2);
        } else {
            if (curPg < pgCount) this.goToPage(curPg + 1);
        }
    };

    IDR.prev = function() {
        "use strict";
        if (curPg > 1) this.goToPage(curPg - 1);
    };

    var addevnt = function(evnt, elem, func) {
        "use strict";
        if (elem.addEventListener) // W3C DOM
            elem.addEventListener(evnt, func, false);
        else if (elem.attachEvent) { // IE DOM
            var r = elem.attachEvent("on" + evnt, func);
            return r;
        }
    };

    var d = function(id) {
        return document.getElementById(id);
    };


    IDR.toggleThumbnails = function() {
        "use strict";
        if (thmbnls) {
            sidebar.style.width = "0";
            sidebar.style.left = "-20px";
        } else {
            scrollNext(-1);
            sidebar.style.width = "200px";
            sidebar.style.left = "0";
            sidebarUpdateEvent();
        }
        thmbnls = !thmbnls;
    };

    var fullscreenUpdate = function() {
        "use strict";
        if (!document.fullscreenElement && !document.msFullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
            d('btnFullscreen').className = "navBtn closed";
        } else {
            d('btnFullscreen').className = "navBtn open";
        }
    };

    IDR.toggleFullScreen = function() {
        "use strict";
        if (!document.fullscreenElement && !document.msFullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
            if (document.body.requestFullscreen) {
                document.body.requestFullscreen();
            } else if (document.body.msRequestFullscreen) {
                document.body.msRequestFullscreen();
            } else if (document.body.mozRequestFullScreen) {
                document.body.mozRequestFullScreen();
            } else if (document.body.webkitRequestFullscreen) {
                document.body.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    };

    IDR.addToolBarHyperlink = function(img, link) {
        "use strict";
        var imgNode = new Image();
        imgNode.src = img;

        var linkNode = document.createElement('a');
        linkNode.href = link;
        linkNode.className = "customNavLink";
        linkNode.appendChild(imgNode);
        linkNode.setAttribute("target", "_blank");

        d('mainNav').insertBefore(linkNode, d('btnPrev'));
    };

    return IDR;
}());

if (intLoaded) {
    idrLoad();
} else {
    extLoaded = true;
}

// app insights
var appInsights = window.appInsights || function (config) {
    function i(config) {
        t[config] = function () {
            var i = arguments;
            t.queue.push(function () { t[config].apply(t, i) })
        }
    }
    var t = { config: config },
        u = document,
        e = window,
        o = "script",
        s = "AuthenticatedUserContext",
        h = "start",
        c = "stop",
        l = "Track",
        a = l + "Event",
        v = l + "Page",
        y = u.createElement(o),
        r, f;
    y.src = config.url || "https://az416426.vo.msecnd.net/scripts/a/ai.0.js";
    u.getElementsByTagName(o)[0].parentNode.appendChild(y);
    try { t.cookie = u.cookie } catch (p) { }
    for (t.queue = [], t.version = "1.0", r = ["Event", "Exception", "Metric", "PageView", "Trace", "Dependency"]; r.length;) i("track" + r.pop());
    return i("set" + s), i("clear" + s), i(h + a), i(c + a), i(h + v), i(c + v), i("flush"), config.disableExceptionTracking || (r = "onerror", i("_" + r), f = e[r], e[r] = function (config, i, u, e, o) {
        var s = f && f(config, i, u, e, o);
        return s !== !0 && t["_" + r](config, i, u, e, o), s
    }), t
}({ instrumentationKey: "9a69127d-b9d0-434e-a186-174054e9e30a" });
window.appInsights = appInsights;
appInsights.trackPageView();

setTimeout(function () { // delay for allowing highlight buttons to load completely
    var inputs = document.querySelectorAll('input[type=button]');
    for (var i = 0; i < inputs.length; i++) {
        $(inputs[i]).on('click', function (evt) {
            var title = (evt.currentTarget.title == '') ? 'Reset' : evt.currentTarget.title;
            var evntname = "Sprakskrinet Robot_" + title,
                url = window.location.href;
            var evt = "Name: " + evntname + "; URL: " + url;
            appInsights.trackEvent(evt);
        });
    }
});

function TrackInsightsTextBoxes(txt) {
    var title = txt.name;
    var evntname = "Sprakskrinet Robot_TextBox_" + title,
    url = window.location.href;
    var evt = "Name: " + evntname + "; URL: " + url;
    appInsights.trackEvent(evt);
}
