(function() {
    var CPGlobal, Color, Colorpicker, positionForEvent, size;
    size = 200;
    positionForEvent = function(e) {
        if (typeof e.pageX === "undefined") {
            if (typeof e.originalEvent === "undefined") {
                return null;
            }
            return e.originalEvent.changedTouches[0];
        } else {
            return e;
        }
    };
    Color = function() {
        function Color(val) {
            this.value = {
                h: 1,
                s: 1,
                b: 1,
                a: 1
            };
            this.setColor(val);
        }
        Color.prototype.setColor = function(val) {
            var that;
            val = val.toLowerCase();
            that = this;
            return $.each(CPGlobal.stringParsers, function(i, parser) {
                var match, space, values;
                match = parser.re.exec(val);
                values = match && parser.parse(match);
                space = parser.space || "rgba";
                if (values) {
                    if (space === "hsla") {
                        that.value = CPGlobal.RGBtoHSB.apply(null, CPGlobal.HSLtoRGB.apply(null, values));
                    } else {
                        that.value = CPGlobal.RGBtoHSB.apply(null, values);
                    }
                    return false;
                }
            });
        };
        Color.prototype.setHue = function(h) {
            return this.value.h = 1 - h;
        };
        Color.prototype.setSaturation = function(s) {
            return this.value.s = s;
        };
        Color.prototype.setLightness = function(b) {
            return this.value.b = 1 - b;
        };
        Color.prototype.setAlpha = function(a) {
            return this.value.a = parseInt((1 - a) * 100, 10) / 100;
        };
        Color.prototype.toRGB = function(h, s, b, a) {
            var B, C, G, R, X;
            if (!h) {
                h = this.value.h;
                s = this.value.s;
                b = this.value.b;
            }
            h *= 360;
            R = void 0;
            G = void 0;
            B = void 0;
            X = void 0;
            C = void 0;
            h = h % 360 / 60;
            C = b * s;
            X = C * (1 - Math.abs(h % 2 - 1));
            R = G = B = b - C;
            h = ~~h;
            R += [ C, X, 0, 0, X, C ][h];
            G += [ X, C, C, X, 0, 0 ][h];
            B += [ 0, 0, X, C, C, X ][h];
            return {
                r: Math.round(R * 255),
                g: Math.round(G * 255),
                b: Math.round(B * 255),
                a: a || this.value.a
            };
        };
        Color.prototype.toHex = function(h, s, b, a) {
            var g, r, rgb;
            rgb = this.toRGB(h, s, b, a);
            r = parseInt(rgb.r, 10) << 16;
            g = parseInt(rgb.g, 10) << 8;
            b = parseInt(rgb.b, 10);
            return "#" + (1 << 24 | r | g | b).toString(16).substr(1);
        };
        Color.prototype.toHSL = function(h, s, b, a) {
            var H, L, S;
            if (!h) {
                h = this.value.h;
                s = this.value.s;
                b = this.value.b;
            }
            H = h;
            L = (2 - s) * b;
            S = s * b;
            if (L > 0 && L <= 1) {
                S /= L;
            } else {
                S /= 2 - L;
            }
            L /= 2;
            if (S > 1) {
                S = 1;
            }
            return {
                h: H,
                s: S,
                l: L,
                a: a || this.value.a
            };
        };
        return Color;
    }();
    Colorpicker = function() {
        function Colorpicker(element, options) {
            var format;
            this.element = $(element);
            format = options.format || this.element.data("color-format") || "hex";
            this.format = CPGlobal.translateFormats[format];
            this.isInput = this.element.is("input");
            this.component = this.element.is(".color") ? this.element.find(".add-on") : false;
            this.picker = $(CPGlobal.template).appendTo("body");
            this.picker.on("mousedown", $.proxy(this.mousedown, this));
            this.picker.on("touchstart", $.proxy(this.mousedown, this));
            if (this.isInput) {
                this.element.on({
                    focus: $.proxy(this.show, this),
                    keyup: $.proxy(this.update, this)
                });
            }
            if (format === "rgba" || format === "hsla") {
                this.picker.addClass("alpha");
                this.alpha = this.picker.find(".colorpicker-alpha")[0].style;
            }
            if (this.component) {
                this.picker.find(".colorpicker-color").hide();
                this.preview = this.element.find("i")[0].style;
            } else {
                this.preview = this.picker.find("div:last")[0].style;
            }
            this.base = this.picker.find("div:first")[0].style;
            this.update();
        }
        Colorpicker.prototype.show = function(e) {
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
            this.place();
            $(window).on("resize", $.proxy(this.place, this));
            if (!this.isInput) {
                if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
            return this.element.trigger({
                type: "show",
                color: this.color
            });
        };
        Colorpicker.prototype.update = function() {
            this.color = new Color(this.isInput ? this.element.prop("value") : this.element.data("color"));
            this.picker.find("i").eq(0).css({
                left: this.color.value.s * size,
                top: size - this.color.value.b * size
            }).end().eq(1).css("top", size * (1 - this.color.value.h)).end().eq(2).css("top", size * (1 - this.color.value.a));
            return this.previewColor();
        };
        Colorpicker.prototype.setValue = function(newColor) {
            this.color = new Color(newColor);
            this.picker.find("i").eq(0).css({
                left: this.color.value.s * size,
                top: size - this.color.value.b * size
            }).end().eq(1).css("top", size * (1 - this.color.value.h)).end().eq(2).css("top", size * (1 - this.color.value.a));
            this.previewColor();
            return this.element.trigger({
                type: "changeColor",
                color: this.color
            });
        };
        Colorpicker.prototype.hide = function() {
            this.picker.hide();
            $(window).off("resize", this.place);
            if (!this.isInput) {
                if (this.component) {
                    this.element.find("input").prop("value", this.format.call(this));
                }
                this.element.data("color", this.format.call(this));
            } else {
                this.element.prop("value", this.format.call(this));
            }
            return this.element.trigger({
                type: "hide",
                color: this.color
            });
        };
        Colorpicker.prototype.place = function() {
            var offset, thing;
            thing = this.component ? this.component : this.element;
            offset = thing.offset();
            return this.picker.css({
                top: offset.top - (thing.height() + this.picker.height()),
                left: offset.left
            });
        };
        Colorpicker.prototype.previewColor = function() {
            try {
                this.preview.backgroundColor = this.format.call(this);
            } catch (e) {
                this.preview.backgroundColor = this.color.toHex();
            }
            this.base.backgroundColor = this.color.toHex(this.color.value.h, 1, 1, 1);
            if (this.alpha) {
                return this.alpha.backgroundColor = this.color.toHex();
            }
        };
        Colorpicker.prototype.pointer = null;
        Colorpicker.prototype.slider = null;
        Colorpicker.prototype.mousedown = function(e) {
            var offset, p, target, zone;
            e.stopPropagation();
            e.preventDefault();
            target = $(e.target);
            zone = target.closest("div");
            if (!zone.is(".colorpicker")) {
                if (zone.is(".colorpicker-saturation")) {
                    this.slider = $.extend({}, CPGlobal.sliders.saturation);
                } else if (zone.is(".colorpicker-hue")) {
                    this.slider = $.extend({}, CPGlobal.sliders.hue);
                } else if (zone.is(".colorpicker-alpha")) {
                    this.slider = $.extend({}, CPGlobal.sliders.alpha);
                } else {
                    return false;
                }
                offset = zone.offset();
                p = positionForEvent(e);
                this.slider.knob = zone.find("i")[0].style;
                this.slider.left = p.pageX - offset.left;
                this.slider.top = p.pageY - offset.top;
                this.pointer = {
                    left: p.pageX,
                    top: p.pageY
                };
                $(this.picker).on({
                    mousemove: $.proxy(this.mousemove, this),
                    mouseup: $.proxy(this.mouseup, this),
                    touchmove: $.proxy(this.mousemove, this),
                    touchend: $.proxy(this.mouseup, this),
                    touchcancel: $.proxy(this.mouseup, this)
                }).trigger("mousemove");
            }
            return false;
        };
        Colorpicker.prototype.mousemove = function(e) {
            var left, p, top, x, y;
            e.stopPropagation();
            e.preventDefault();
            p = positionForEvent(e);
            x = p ? p.pageX : this.pointer.left;
            y = p ? p.pageY : this.pointer.top;
            left = Math.max(0, Math.min(this.slider.maxLeft, this.slider.left + (x - this.pointer.left)));
            top = Math.max(0, Math.min(this.slider.maxTop, this.slider.top + (y - this.pointer.top)));
            this.slider.knob.left = left + "px";
            this.slider.knob.top = top + "px";
            if (this.slider.callLeft) {
                this.color[this.slider.callLeft].call(this.color, left / size);
            }
            if (this.slider.callTop) {
                this.color[this.slider.callTop].call(this.color, top / size);
            }
            this.previewColor();
            this.element.trigger({
                type: "changeColor",
                color: this.color
            });
            return false;
        };
        Colorpicker.prototype.mouseup = function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(this.picker).off({
                mousemove: this.mousemove,
                mouseup: this.mouseup
            });
            return false;
        };
        return Colorpicker;
    }();
    $.fn.colorpicker = function(option) {
        return this.each(function() {
            var $this, data, options;
            $this = $(this);
            data = $this.data("colorpicker");
            options = typeof option === "object" && option;
            if (!data) {
                $this.data("colorpicker", data = new Colorpicker(this, $.extend({}, $.fn.colorpicker.defaults, options)));
            }
            if (typeof option === "string") {
                return data[option]();
            }
        });
    };
    $.fn.colorpicker.defaults = {};
    $.fn.colorpicker.Constructor = Colorpicker;
    CPGlobal = {
        translateFormats: {
            rgb: function() {
                var rgb;
                rgb = this.color.toRGB();
                return "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
            },
            rgba: function() {
                var rgb;
                rgb = this.color.toRGB();
                return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + rgb.a + ")";
            },
            hsl: function() {
                var hsl;
                hsl = this.color.toHSL();
                return "hsl(" + Math.round(hsl.h * 360) + "," + Math.round(hsl.s * 100) + "%," + Math.round(hsl.l * 100) + "%)";
            },
            hsla: function() {
                var hsl;
                hsl = this.color.toHSL();
                return "hsla(" + Math.round(hsl.h * 360) + "," + Math.round(hsl.s * 100) + "%," + Math.round(hsl.l * 100) + "%," + hsl.a + ")";
            },
            hex: function() {
                return this.color.toHex();
            }
        },
        sliders: {
            saturation: {
                maxLeft: size,
                maxTop: size,
                callLeft: "setSaturation",
                callTop: "setLightness"
            },
            hue: {
                maxLeft: 0,
                maxTop: size,
                callLeft: false,
                callTop: "setHue"
            },
            alpha: {
                maxLeft: 0,
                maxTop: size,
                callLeft: false,
                callTop: "setAlpha"
            }
        },
        RGBtoHSB: function(r, g, b, a) {
            var C, H, S, V;
            r /= 255;
            g /= 255;
            b /= 255;
            H = void 0;
            S = void 0;
            V = void 0;
            C = void 0;
            V = Math.max(r, g, b);
            C = V - Math.min(r, g, b);
            H = C === 0 ? null : V === r ? (g - b) / C : V === g ? (b - r) / C + 2 : (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            S = C === 0 ? 0 : C / V;
            return {
                h: H || 1,
                s: S,
                b: V,
                a: a || 1
            };
        },
        HueToRGB: function(p, q, h) {
            if (h < 0) {
                h += 1;
            } else {
                if (h > 1) {
                    h -= 1;
                }
            }
            if (h * 6 < 1) {
                return p + (q - p) * h * 6;
            } else if (h * 2 < 1) {
                return q;
            } else if (h * 3 < 2) {
                return p + (q - p) * (2 / 3 - h) * 6;
            } else {
                return p;
            }
        },
        HSLtoRGB: function(h, s, l, a) {
            var b, g, p, q, r, tb, tg, tr;
            if (s < 0) {
                s = 0;
            }
            q = void 0;
            if (l <= .5) {
                q = l * (1 + s);
            } else {
                q = l + s - l * s;
            }
            p = 2 * l - q;
            tr = h + 1 / 3;
            tg = h;
            tb = h - 1 / 3;
            r = Math.round(CPGlobal.HueToRGB(p, q, tr) * 255);
            g = Math.round(CPGlobal.HueToRGB(p, q, tg) * 255);
            b = Math.round(CPGlobal.HueToRGB(p, q, tb) * 255);
            return [ r, g, b, a || 1 ];
        },
        stringParsers: [ {
            re: /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
            parse: function(execResult) {
                return [ execResult[1], execResult[2], execResult[3], execResult[4] ];
            }
        }, {
            re: /rgba?\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
            parse: function(execResult) {
                return [ 2.55 * execResult[1], 2.55 * execResult[2], 2.55 * execResult[3], execResult[4] ];
            }
        }, {
            re: /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
            parse: function(execResult) {
                return [ parseInt(execResult[1], 16), parseInt(execResult[2], 16), parseInt(execResult[3], 16) ];
            }
        }, {
            re: /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,
            parse: function(execResult) {
                return [ parseInt(execResult[1] + execResult[1], 16), parseInt(execResult[2] + execResult[2], 16), parseInt(execResult[3] + execResult[3], 16) ];
            }
        }, {
            re: /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)/,
            space: "hsla",
            parse: function(execResult) {
                return [ execResult[1] / 360, execResult[2] / 100, execResult[3] / 100, execResult[4] ];
            }
        } ],
        template: '<div class="colorpicker">' + '<div class="colorpicker-saturation"><i><b></b></i></div>' + '<div class="colorpicker-hue"><i></i></div>' + '<div class="colorpicker-alpha"><i></i></div>' + '<div class="colorpicker-color"><div /></div>' + "</div>"
    };
}).call(this);

(function() {
    var _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.LiterallyCanvas = function() {
        function LiterallyCanvas(canvas, backgroundColor) {
            this.canvas = canvas;
            this.backgroundColor = backgroundColor != null ? backgroundColor : "rgb(230, 230, 230)";
            this.$canvas = $(this.canvas);
            this.ctx = this.canvas.getContext("2d");
            $(this.canvas).css("background-color", this.backgroundColor);
            this.shapes = [];
            this.undoStack = [];
            this.redoStack = [];
            this.isDragging = false;
            this.position = {
                x: 0,
                y: 0
            };
            this.scale = 1;
            this.tool = void 0;
            this.primaryColor = "#000";
            this.secondaryColor = "#fff";
            this.repaint();
        }
        LiterallyCanvas.prototype.trigger = function(name, data) {
            return this.canvas.dispatchEvent(new CustomEvent(name, {
                detail: data
            }));
        };
        LiterallyCanvas.prototype.on = function(name, fn) {
            return this.canvas.addEventListener(name, function(e) {
                return fn(e.detail);
            });
        };
        LiterallyCanvas.prototype.clientCoordsToDrawingCoords = function(x, y) {
            return {
                x: (x - this.position.x) / this.scale,
                y: (y - this.position.y) / this.scale
            };
        };
        LiterallyCanvas.prototype.drawingCoordsToClientCoords = function(x, y) {
            return {
                x: x * this.scale + this.position.x,
                y: y * this.scale + this.position.y
            };
        };
        LiterallyCanvas.prototype.begin = function(x, y) {
            var newPos;
            newPos = this.clientCoordsToDrawingCoords(x, y);
            this.tool.begin(newPos.x, newPos.y, this);
            return this.isDragging = true;
        };
        LiterallyCanvas.prototype["continue"] = function(x, y) {
            var newPos;
            newPos = this.clientCoordsToDrawingCoords(x, y);
            if (this.isDragging) {
                return this.tool["continue"](newPos.x, newPos.y, this);
            }
        };
        LiterallyCanvas.prototype.end = function(x, y) {
            var newPos;
            newPos = this.clientCoordsToDrawingCoords(x, y);
            if (this.isDragging) {
                this.tool.end(newPos.x, newPos.y, this);
            }
            return this.isDragging = false;
        };
        LiterallyCanvas.prototype.saveShape = function(shape) {
            return this.execute(new LC.AddShapeAction(this, shape));
        };
        LiterallyCanvas.prototype.pan = function(x, y) {
            this.position.x = this.position.x - x;
            return this.position.y = this.position.y - y;
        };
        LiterallyCanvas.prototype.zoom = function(factor) {
            var oldScale;
            oldScale = this.scale;
            this.scale = this.scale + factor;
            this.scale = Math.max(this.scale, .2);
            this.scale = Math.min(this.scale, 4);
            this.scale = Math.round(this.scale * 100) / 100;
            this.position.x = LC.scalePositionScalar(this.position.x, this.canvas.width, oldScale, this.scale);
            this.position.y = LC.scalePositionScalar(this.position.y, this.canvas.height, oldScale, this.scale);
            return this.repaint();
        };
        LiterallyCanvas.prototype.repaint = function() {
            var _this = this;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.save();
            this.ctx.translate(this.position.x, this.position.y);
            this.ctx.scale(this.scale, this.scale);
            _.each(this.shapes, function(s) {
                return s.draw(_this.ctx);
            });
            if (this.tool) {
                this.tool.drawCurrent(this.ctx);
            }
            return this.ctx.restore();
        };
        LiterallyCanvas.prototype.clear = function() {
            this.execute(new LC.ClearAction(this));
            this.shapes = [];
            return this.repaint();
        };
        LiterallyCanvas.prototype.execute = function(action) {
            this.undoStack.push(action);
            action["do"]();
            return this.redoStack = [];
        };
        LiterallyCanvas.prototype.undo = function() {
            var action;
            if (!this.undoStack.length) {
                return;
            }
            action = this.undoStack.pop();
            action.undo();
            return this.redoStack.push(action);
        };
        LiterallyCanvas.prototype.redo = function() {
            var action;
            if (!this.redoStack.length) {
                return;
            }
            action = this.redoStack.pop();
            this.undoStack.push(action);
            return action["do"]();
        };
        LiterallyCanvas.prototype.getPixel = function(x, y) {
            var p, pixel;
            p = this.drawingCoordsToClientCoords(x, y);
            pixel = this.ctx.getImageData(p.x, p.y, 1, 1).data;
            if (pixel[3]) {
                return "rgb(" + pixel[0] + "," + pixel[1] + "," + pixel[2] + ")";
            } else {
                return null;
            }
        };
        return LiterallyCanvas;
    }();
    LC.ClearAction = function() {
        function ClearAction(lc) {
            this.lc = lc;
            this.oldShapes = this.lc.shapes;
        }
        ClearAction.prototype["do"] = function() {
            this.lc.shapes = [];
            return this.lc.repaint();
        };
        ClearAction.prototype.undo = function() {
            this.lc.shapes = this.oldShapes;
            return this.lc.repaint();
        };
        return ClearAction;
    }();
    LC.AddShapeAction = function() {
        function AddShapeAction(lc, shape) {
            this.lc = lc;
            this.shape = shape;
        }
        AddShapeAction.prototype["do"] = function() {
            this.ix = this.lc.shapes.length;
            this.lc.shapes.push(this.shape);
            return this.lc.repaint();
        };
        AddShapeAction.prototype.undo = function() {
            this.lc.shapes.pop(this.ix);
            return this.lc.repaint();
        };
        return AddShapeAction;
    }();
}).call(this);

(function() {
    var IS_IOS, coordsForEvent, initLiterallyCanvas, position, _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    coordsForEvent = function($el, e) {
        var p, t;
        t = e.originalEvent.changedTouches[0];
        p = $el.position();
        return [ t.clientX - p.left, t.clientY - p.top ];
    };
    position = function(e) {
        var p;
        if (e.offsetX != null) {
            return {
                left: e.offsetX,
                top: e.offsetY
            };
        } else {
            p = $(e.delegateTarget).position();
            return {
                left: e.pageX - p.left,
                top: e.pageY - p.top
            };
        }
    };
    initLiterallyCanvas = function(el, opts) {
        var $c, $el, down, lc, tb, _this = this;
        if (opts == null) {
            opts = {};
        }
        opts = _.extend({
            backgroundColor: "rgb(230, 230, 230)",
            keyboardShortcuts: true,
            toolClasses: [ LC.Pencil, LC.Eraser, LC.Pan, LC.EyeDropper ]
        }, opts);
        $el = $(el);
        $c = $el.find("canvas");
        $c.attr("width", $c.width());
        $c.attr("height", $c.height());
        $el.append($('<div class="toolbar">'));
        lc = new LC.LiterallyCanvas($c.get(0), opts.backgroundColor);
        tb = new LC.Toolbar(lc, $el.find(".toolbar"), opts.toolClasses);
        tb.selectTool(tb.tools[0]);
        $(window).resize(function(e) {
            $c.attr("width", $c.width());
            $c.attr("height", $c.height());
            return lc.repaint();
        });
        down = false;
        $c.mousedown(function(e) {
            var p;
            down = true;
            e.originalEvent.preventDefault();
            document.onselectstart = function() {
                return false;
            };
            p = position(e);
            return lc.begin(p.left, p.top);
        });
        $c.mousemove(function(e) {
            var p;
            e.originalEvent.preventDefault();
            p = position(e);
            if (e.which && !down) {
                lc.begin(p.left, p.top);
                down = true;
            }
            return lc["continue"](p.left, p.top);
        });
        $c.mouseup(function(e) {
            var p;
            e.originalEvent.preventDefault();
            document.onselectstart = function() {
                return true;
            };
            p = position(e);
            lc.end(p.left, p.top);
            return down = false;
        });
        $c.mouseout(function(e) {
            var p;
            p = position(e);
            lc.end(p.left, p.top);
            return down = false;
        });
        $c.bind("touchstart", function(e) {
            e.preventDefault();
            if (e.originalEvent.touches.length === 1) {
                return lc.begin.apply(lc, coordsForEvent($c, e));
            } else {
                return lc["continue"].apply(lc, coordsForEvent($c, e));
            }
        });
        $c.bind("touchmove", function(e) {
            e.preventDefault();
            return lc["continue"].apply(lc, coordsForEvent($c, e));
        });
        $c.bind("touchend", function(e) {
            e.preventDefault();
            if (e.originalEvent.touches.length !== 0) {
                return;
            }
            return lc.end.apply(lc, coordsForEvent($c, e));
        });
        $c.bind("touchcancel", function(e) {
            e.preventDefault();
            if (e.originalEvent.touches.length !== 0) {
                return;
            }
            return lc.end.apply(lc, coordsForEvent($c, e));
        });
        if (opts.keyboardShortcuts) {
            return $(document).keydown(function(e) {
                switch (e.which) {
                  case 37:
                    lc.pan(-10, 0);
                    break;

                  case 38:
                    lc.pan(0, -10);
                    break;

                  case 39:
                    lc.pan(10, 0);
                    break;

                  case 40:
                    lc.pan(0, 10);
                }
                return lc.repaint();
            });
        }
    };
    IS_IOS = /iphone|ipad/i.test(navigator.userAgent);
    $.fn.literallycanvas = function(opts) {
        if (opts == null) {
            opts = {};
        }
        if (IS_IOS) {
            this.bind("touchstart", function(e) {
                var dt, fingers, t1, t2;
                t2 = e.timeStamp;
                t1 = this.data("lastTouch") || t2;
                dt = t2 - t1;
                fingers = e.originalEvent.touches.length;
                this.data("lastTouch", t2);
                if (!dt || dt > 500 || fingers > 1) {
                    return;
                }
                e.preventDefault();
                return this.trigger("click").trigger("click");
            });
        }
        return this.each(function(ix, el) {
            return initLiterallyCanvas(el, opts);
        });
    };
}).call(this);

(function() {
    var dual, mid, refine, _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.bspline = function(points) {
        return dual(dual(refine(points)));
    };
    refine = function(points) {
        var refined;
        refined = [];
        _.each(points, function(point, index, points) {
            refined[index * 2] = point;
            if (points[index + 1]) {
                return refined[index * 2 + 1] = mid(point, points[index + 1]);
            }
        });
        return refined;
    };
    dual = function(points) {
        var dualed;
        points = _.union([ points[0] ], points, [ _.last(points) ]);
        dualed = [];
        _.each(points, function(point, index, points) {
            if (points[index + 1]) {
                return dualed[index] = mid(point, points[index + 1]);
            }
        });
        return dualed;
    };
    mid = function(a, b) {
        return new LC.Point(a.x + (b.x - a.x) / 2, a.y + (b.y - a.y) / 2, a.size + (b.size - a.size) / 2, a.color);
    };
    LC.scalePositionScalar = function(val, viewportSize, oldScale, newScale) {
        var newSize, oldSize;
        oldSize = viewportSize * oldScale;
        newSize = viewportSize * newScale;
        return val + (oldSize - newSize) / 2;
    };
}).call(this);

(function() {
    var __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };
    LC.LinePathShape = function() {
        function LinePathShape(tool) {
            this.tool = tool;
            this.points = [];
        }
        LinePathShape.prototype.addPoint = function(x, y) {
            this.points.push(this.tool.makePoint(x, y));
            return this.smoothedPoints = LC.bspline(LC.bspline(LC.bspline(this.points)));
        };
        LinePathShape.prototype.draw = function(ctx) {
            var fp, lp;
            if (!this.smoothedPoints.length) {
                return;
            }
            fp = this.smoothedPoints[0];
            lp = _.last(this.smoothedPoints);
            _.each([ fp, lp ], function(p) {
                ctx.beginPath();
                ctx.fillStyle = p.color;
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                return ctx.closePath();
            });
            ctx.beginPath();
            ctx.moveTo(fp.x, fp.y);
            _.each(_.rest(this.smoothedPoints), function(p) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                return ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            return ctx.closePath();
        };
        LinePathShape.prototype.drawLatest = function(ctx) {
            var pair;
            pair = _.last(this.points, 2);
            if (!(pair.length > 1)) {
                return;
            }
            ctx.beginPath();
            ctx.strokeStyle = pair[1].color;
            ctx.lineWidth = pair[1].size;
            ctx.moveTo(pair[0].x, pair[0].y);
            ctx.lineTo(pair[1].x, pair[1].y);
            return ctx.stroke();
        };
        return LinePathShape;
    }();
    LC.EraseLinePathShape = function(_super) {
        __extends(EraseLinePathShape, _super);
        function EraseLinePathShape() {
            return EraseLinePathShape.__super__.constructor.apply(this, arguments);
        }
        EraseLinePathShape.prototype.draw = function(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            EraseLinePathShape.__super__.draw.call(this, ctx);
            return ctx.restore();
        };
        EraseLinePathShape.prototype.drawLatest = function(ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            EraseLinePathShape.__super__.drawLatest.call(this, ctx);
            return ctx.restore();
        };
        return EraseLinePathShape;
    }(LC.LinePathShape);
    LC.Point = function() {
        function Point(x, y, size, color) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.color = color;
        }
        Point.prototype.lastPoint = function() {
            return this;
        };
        Point.prototype.draw = function(ctx) {
            return console.log("draw point", this.x, this.y, this.size, this.color);
        };
        return Point;
    }();
}).call(this);

(function() {
    var _ref;
    window.LC = (_ref = window.LC) != null ? _ref : {};
    LC.defaultColors = [ "rgba(255, 0, 0, 0.9)", "rgba(255, 128, 0, 0.9)", "rgba(255, 255, 0, 0.9)", "rgba(128, 255, 0, 0.9)", "rgba(0, 255, 0, 0.9)", "rgba(0, 255, 128, 0.9)", "rgba(0, 128, 255, 0.9)", "rgba(0, 0, 255, 0.9)", "rgba(128, 0, 255, 0.9)", "rgba(255, 0, 128, 0.9)", "rgba(0, 0, 0, 0.9)", "rgba(255, 255, 255, 0.9)" ];
    LC.defaultStrokeColor = "rgba(0, 0, 0, 0.9)";
    LC.defaultFillColor = "rgba(255, 255, 255, 0.9)";
    LC.toolbarHTML = '  <div class="toolbar-row">    <div class="toolbar-row-left">      <div class="color-square stroke-picker">&nbsp;</div>      <div class="tools" data-toggle="buttons-radio"></div>      <div class="tool-options-container"></div>    </div>    <div class="toolbar-row-right">      <div class="action-buttons">        <div class="btn btn-danger clear-button">          <i class="icon-remove icon-white"></i>        </div>        <div class="btn btn-warning undo-button">          <i class="icon-arrow-left icon-white"></i>        </div>        <div class="btn btn-warning redo-button">          <i class="icon-arrow-right icon-white"></i>        </div>        <div class="btn btn-inverse zoom-out-button">          <i class="icon-zoom-out icon-white"></i>        </div>        <div class="btn btn-inverse zoom-in-button">          <i class="icon-zoom-in icon-white"></i>        </div>        <div class="zoom-display badge badge-inverse">1</div>      </div>    </div>    <div class="clearfix"></div>  </div>';
    LC.makeColorPicker = function($el, title, callback) {
        var cp;
        $el.data("color", "rgb(0, 0, 0)");
        cp = $el.colorpicker({
            format: "rgb"
        }).data("colorpicker");
        cp.hide();
        $el.on("changeColor", function(e) {
            return callback(e.color.toRGB());
        });
        $el.click(function(e) {
            if (cp.picker.is(":visible")) {
                return cp.hide();
            } else {
                cp.show();
                return cp.place();
            }
        });
        return cp;
    };
    LC.Toolbar = function() {
        function Toolbar(lc, $el, toolClasses) {
            this.lc = lc;
            this.$el = $el;
            this.toolClasses = toolClasses;
            this.$el.append(LC.toolbarHTML);
            this.initColors();
            this.initButtons();
            this.initTools();
            this.initZoom();
        }
        Toolbar.prototype.initColors = function() {
            var $stroke, cp, _this = this;
            $stroke = this.$el.find(".stroke-picker");
            $stroke.css("background-color", LC.defaultStrokeColor);
            cp = LC.makeColorPicker($stroke, "Foreground color", function(c) {
                var val;
                val = "rgba(" + c.r + ", " + c.g + ", " + c.b + ", 1)";
                $stroke.css("background-color", val);
                return _this.lc.primaryColor = val;
            });
            this.lc.$canvas.mousedown(function() {
                return cp.hide();
            });
            this.lc.$canvas.on("touchstart", function() {
                return cp.hide();
            });
            return this.lc.on("colorChange", function(color) {
                return $stroke.css("background-color", color);
            });
        };
        Toolbar.prototype.initButtons = function() {
            var _this = this;
            this.$el.find(".clear-button").click(function(e) {
                return _this.lc.clear();
            });
            this.$el.find(".undo-button").click(function(e) {
                return _this.lc.undo();
            });
            return this.$el.find(".redo-button").click(function(e) {
                return _this.lc.redo();
            });
        };
        Toolbar.prototype.initTools = function() {
            var ToolClass, _this = this;
            this.tools = function() {
                var _i, _len, _ref1, _results;
                _ref1 = this.toolClasses;
                _results = [];
                for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                    ToolClass = _ref1[_i];
                    _results.push(new ToolClass());
                }
                return _results;
            }.call(this);
            return _.each(this.tools, function(t) {
                var buttonEl, optsEl;
                optsEl = $("<div class='tool-options tool-options-" + t.cssSuffix + "'></div>");
                optsEl.html(t.optionsContents());
                optsEl.hide();
                t.$el = optsEl;
                _this.$el.find(".tool-options-container").append(optsEl);
                buttonEl = $("<div class='btn tool-" + t.cssSuffix + "'></div>");
                buttonEl.html(t.buttonContents());
                _this.$el.find(".tools").append(buttonEl);
                return buttonEl.click(function(e) {
                    return _this.selectTool(t);
                });
            });
        };
        Toolbar.prototype.initZoom = function() {
            var _this = this;
            this.$el.find(".zoom-in-button").click(function(e) {
                _this.lc.zoom(.2);
                return _this.$el.find(".zoom-display").html(_this.lc.scale);
            });
            return this.$el.find(".zoom-out-button").click(function(e) {
                _this.lc.zoom(-.2);
                return _this.$el.find(".zoom-display").html(_this.lc.scale);
            });
        };
        Toolbar.prototype.selectTool = function(t) {
            this.$el.find(".tools .btn").removeClass("active");
            this.$el.find(".tools .tool-" + t.cssSuffix).addClass("active");
            this.lc.tool = t;
            this.$el.find(".tool-options").hide();
            if (t.$el) {
                return t.$el.show();
            }
        };
        return Toolbar;
    }();
}).call(this);

(function() {
    var __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };
    LC.Tool = function() {
        function Tool() {}
        Tool.prototype.title = void 0;
        Tool.prototype.cssSuffix = void 0;
        Tool.prototype.buttonContents = function() {
            return void 0;
        };
        Tool.prototype.optionsContents = function() {
            return void 0;
        };
        Tool.prototype.begin = function(x, y, lc) {};
        Tool.prototype["continue"] = function(x, y, lc) {};
        Tool.prototype.end = function(x, y, lc) {};
        Tool.prototype.drawCurrent = function(ctx) {};
        return Tool;
    }();
    LC.Pencil = function(_super) {
        __extends(Pencil, _super);
        function Pencil() {
            this.isDrawing = false;
            this.strokeWidth = 5;
        }
        Pencil.prototype.title = "Pencil";
        Pencil.prototype.cssSuffix = "pencil";
        Pencil.prototype.buttonContents = function() {
            return '<i class="icon-pencil"></i>';
        };
        Pencil.prototype.optionsContents = function() {
            var $el, brushWidthVal, _this = this;
            $el = $("      <span class='brush-width-min'>1 px</span>      <input type='range' min='1' max='50' step='1' value='" + this.strokeWidth + "'>      <span class='brush-width-max'>50 px</span>      <span class='brush-width-val'>(5 px)</span>    ");
            brushWidthVal = $el.find(".brush-width-val");
            $el.find("input").change(function(e) {
                _this.strokeWidth = e.currentTarget.valueAsNumber;
                return brushWidthVal.html("(" + _this.strokeWidth + " px)");
            });
            return $el;
        };
        Pencil.prototype.begin = function(x, y, lc) {
            this.color = lc.primaryColor;
            this.currentShape = this.makeShape();
            return this.currentShape.addPoint(x, y);
        };
        Pencil.prototype["continue"] = function(x, y, lc) {
            this.currentShape.addPoint(x, y);
            return lc.repaint(this.currentShape);
        };
        Pencil.prototype.end = function(x, y, lc) {
            this.currentShape.addPoint(x, y);
            lc.saveShape(this.currentShape);
            return this.currentShape = void 0;
        };
        Pencil.prototype.drawCurrent = function(ctx) {
            if (this.currentShape) {
                return this.currentShape.draw(ctx);
            }
        };
        Pencil.prototype.makePoint = function(x, y, lc) {
            return new LC.Point(x, y, this.strokeWidth, this.color);
        };
        Pencil.prototype.makeShape = function() {
            return new LC.LinePathShape(this);
        };
        return Pencil;
    }(LC.Tool);
    LC.Eraser = function(_super) {
        __extends(Eraser, _super);
        function Eraser() {
            Eraser.__super__.constructor.apply(this, arguments);
            this.strokeWidth = 10;
        }
        Eraser.prototype.title = "Eraser";
        Eraser.prototype.cssSuffix = "eraser";
        Eraser.prototype.buttonContents = function() {
            return '<i class="icon-edit"></i>';
        };
        Eraser.prototype.makePoint = function(x, y, lc) {
            return new LC.Point(x, y, this.strokeWidth, "#000");
        };
        Eraser.prototype.makeShape = function() {
            return new LC.EraseLinePathShape(this);
        };
        return Eraser;
    }(LC.Pencil);
    LC.Pan = function(_super) {
        __extends(Pan, _super);
        function Pan() {
            return Pan.__super__.constructor.apply(this, arguments);
        }
        Pan.prototype.title = "Pan";
        Pan.prototype.cssSuffix = "pan";
        Pan.prototype.buttonContents = function() {
            return '<i class="icon-move"></i>';
        };
        Pan.prototype.begin = function(x, y, lc) {
            return this.start = {
                x: x,
                y: y
            };
        };
        Pan.prototype["continue"] = function(x, y, lc) {
            lc.pan(this.start.x - x, this.start.y - y);
            return lc.repaint();
        };
        return Pan;
    }(LC.Tool);
    LC.EyeDropper = function(_super) {
        __extends(EyeDropper, _super);
        function EyeDropper() {
            return EyeDropper.__super__.constructor.apply(this, arguments);
        }
        EyeDropper.prototype.title = "Eyedropper";
        EyeDropper.prototype.cssSuffix = "eye-dropper";
        EyeDropper.prototype.buttonContents = function() {
            return '<i class="icon-eye-open"></i>';
        };
        EyeDropper.prototype.readColor = function(x, y, lc) {
            var newColor;
            newColor = lc.getPixel(x, y);
            if (newColor) {
                lc.primaryColor = newColor;
            } else {
                lc.primaryColor = lc.backgroundColor;
            }
            return lc.trigger("colorChange", lc.primaryColor);
        };
        EyeDropper.prototype.begin = function(x, y, lc) {
            return this.readColor(x, y, lc);
        };
        EyeDropper.prototype["continue"] = function(x, y, lc) {
            return this.readColor(x, y, lc);
        };
        return EyeDropper;
    }(LC.Tool);
}).call(this);