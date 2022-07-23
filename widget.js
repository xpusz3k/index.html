(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.XPayStationWidget = f() } })(function () {
  var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)s(r[o]); return s })({
    1: [function (require, module, exports) {
      module.exports = function (css, customDocument) {
        var doc = customDocument || document;
        if (doc.createStyleSheet) {
          var sheet = doc.createStyleSheet()
          sheet.cssText = css;
          return sheet.ownerNode;
        } else {
          var head = doc.getElementsByTagName('head')[0],
            style = doc.createElement('style');

          style.type = 'text/css';

          if (style.styleSheet) {
            style.styleSheet.cssText = css;
          } else {
            style.appendChild(doc.createTextNode(css));
          }

          head.appendChild(style);
          return style;
        }
      };

      module.exports.byUrl = function (url) {
        if (document.createStyleSheet) {
          return document.createStyleSheet(url).ownerNode;
        } else {
          var head = document.getElementsByTagName('head')[0],
            link = document.createElement('link');

          link.rel = 'stylesheet';
          link.href = url;

          head.appendChild(link);
          return link;
        }
      };

    }, {}], 2: [function (require, module, exports) {
      module.exports = require('cssify');
    }, { "cssify": 1 }], 3: [function (require, module, exports) {
      (function (global) {
        var Helpers = require('./helpers');
        var Exception = require('./exception');
        var LightBox = require('./lightbox');
        var ChildWindow = require('./childwindow');
        var Device = require('./device');

        module.exports = (function () {
          function ready(fn) {
            if (document.readyState !== 'loading') {
              fn();
            } else {
              document.addEventListener('DOMContentLoaded', fn);
            }
          }

          function App() {
            this.config = Object.assign({}, DEFAULT_CONFIG);
            this.eventObject = Helpers.addEventObject(this);
            this.isInitiated = false;
            this.postMessage = null;
            this.childWindow = null;
          }

          App.eventTypes = {
            INIT: 'init',
            OPEN: 'open',
            OPEN_WINDOW: 'open-window',
            OPEN_LIGHTBOX: 'open-lightbox',
            LOAD: 'load',
            CLOSE: 'close',
            CLOSE_WINDOW: 'close-window',
            CLOSE_LIGHTBOX: 'close-lightbox',
            STATUS: 'status',
            STATUS_INVOICE: 'status-invoice',
            STATUS_DELIVERING: 'status-delivering',
            STATUS_TROUBLED: 'status-troubled',
            STATUS_DONE: 'status-done',
            USER_COUNTRY: 'user-country'
          };

          var DEFAULT_CONFIG = {
            access_token: null,
            access_data: null,
            sandbox: false,
            lightbox: {},
            childWindow: {},
            host: 'secure.xsolla.com',
            iframeOnly: false
          };
          var SANDBOX_PAYSTATION_URL = 'https://sandbox-secure.xsolla.com/paystation2/?';
          var EVENT_NAMESPACE = '.xpaystation-widget';
          var ATTR_PREFIX = 'data-xpaystation-widget-open';

          /** Private Members **/
          App.prototype.config = {};
          App.prototype.isInitiated = false;
          App.prototype.eventObject = Helpers.addEventObject(this);

          App.prototype.getPaymentUrl = function () {
            if (this.config.payment_url) {
              return this.config.payment_url;
            }

            const query = {};
            if (this.config.access_token) {
              query.access_token = this.config.access_token;
            } else {
              query.access_data = JSON.stringify(this.config.access_data);
            }

            const urlWithoutQueryParams = this.config.sandbox ?
              SANDBOX_PAYSTATION_URL :
              'https://' + this.config.host + '/paystation2/?';
            return urlWithoutQueryParams + Helpers.param(query);
          };

          App.prototype.checkConfig = function () {
            if (Helpers.isEmpty(this.config.access_token) && Helpers.isEmpty(this.config.access_data) && Helpers.isEmpty(this.config.payment_url)) {
              this.throwError('No access token or access data or payment URL given');
            }

            if (!Helpers.isEmpty(this.config.access_data) && typeof this.config.access_data !== 'object') {
              this.throwError('Invalid access data format');
            }

            if (Helpers.isEmpty(this.config.host)) {
              this.throwError('Invalid host');
            }
          };

          App.prototype.checkApp = function () {
            if (this.isInitiated === undefined) {
              this.throwError('Initialize widget before opening');
            }
          };

          App.prototype.throwError = function (message) {
            throw new Exception(message);
          };

          App.prototype.triggerEvent = function (eventName, data) {
            if (arguments.length === 1) {
              [].forEach.call(arguments, (function (eventName) {
                var event = document.createEvent('HTMLEvents');
                event.initEvent(eventName, true, false);
                document.dispatchEvent(event);
              }).bind(this));
            } else {
              this.eventObject.trigger(eventName, data);
            }
          };

          App.prototype.triggerCustomEvent = function (eventName, data) {
            try {
              var event = new CustomEvent(eventName, { detail: data }); // Not working in IE
            } catch (e) {
              var event = document.createEvent('CustomEvent');
              event.initCustomEvent(eventName, true, true, data);
            }
            document.dispatchEvent(event);
          };

          /**
           * Initialize widget with options
           * @param options
           */
          App.prototype.init = function (options) {
            function initialize(options) {
              this.isInitiated = true;
              this.config = Object.assign({}, DEFAULT_CONFIG, options);

              var bodyElement = global.document.body;
              var clickEventName = 'click' + EVENT_NAMESPACE;

              var handleClickEvent = (function (event) {
                var targetElement = document.querySelector('[' + ATTR_PREFIX + ']');
                if (event.sourceEvent.target === targetElement) {
                  this.open.call(this, targetElement);
                }
              }).bind(this);

              bodyElement.removeEventListener(clickEventName, handleClickEvent);

              var clickEvent = document.createEvent('Event');
              clickEvent.initEvent(clickEventName, false, true);

              bodyElement.addEventListener('click', (function (event) {
                clickEvent.sourceEvent = event;
                bodyElement.dispatchEvent(clickEvent);
              }).bind(this), false);

              bodyElement.addEventListener(clickEventName, handleClickEvent);
              this.triggerEvent(App.eventTypes.INIT);
            }
            ready(initialize.bind(this, options));
          }

          /**
           * Open payment interface (PayStation)
           */
          App.prototype.open = function () {
            this.checkConfig();
            this.checkApp();

            var triggerSplitStatus = (function (data) {
              switch (((data || {}).paymentInfo || {}).status) {
                case 'invoice':
                  this.triggerEvent(App.eventTypes.STATUS_INVOICE, data);
                  break;
                case 'delivering':
                  this.triggerEvent(App.eventTypes.STATUS_DELIVERING, data);
                  break;
                case 'troubled':
                  this.triggerEvent(App.eventTypes.STATUS_TROUBLED, data);
                  break;
                case 'done':
                  this.triggerEvent(App.eventTypes.STATUS_DONE, data);
                  break;
              }
            }).bind(this);

            var url = this.getPaymentUrl();
            var that = this;

            function handleStatus(event) {
              var statusData = event.detail;
              that.triggerEvent(App.eventTypes.STATUS, statusData);
              triggerSplitStatus(statusData);
            }

            function handleUserLocale(event) {
              var userCountry = {
                user_country: event.detail.user_country
              };
              that.triggerCustomEvent(App.eventTypes.USER_COUNTRY, userCountry);
            }

            this.postMessage = null;
            if ((new Device).isMobile() && !this.config.iframeOnly) {
              var childWindow = new ChildWindow;
              childWindow.on('open', function handleOpen() {
                that.postMessage = childWindow.getPostMessage();
                that.triggerEvent(App.eventTypes.OPEN);
                that.triggerEvent(App.eventTypes.OPEN_WINDOW);
                childWindow.off('open', handleOpen);
              });
              childWindow.on('load', function handleLoad() {
                that.triggerEvent(App.eventTypes.LOAD);
                childWindow.off('load', handleLoad);
              });
              childWindow.on('close', function handleClose() {
                that.triggerEvent(App.eventTypes.CLOSE);
                that.triggerEvent(App.eventTypes.CLOSE_WINDOW);
                childWindow.off('status', handleStatus);
                childWindow.off(App.eventTypes.USER_COUNTRY, handleUserLocale);
                childWindow.off('close', handleClose);
              });
              childWindow.on('status', handleStatus);
              childWindow.on(App.eventTypes.USER_COUNTRY, handleUserLocale);
              childWindow.open(url, this.config.childWindow);
              that.childWindow = childWindow;
            } else {
              var lightBox = new LightBox((new Device).isMobile() && this.config.iframeOnly);
              lightBox.on('open', function handleOpen() {
                that.postMessage = lightBox.getPostMessage();
                that.triggerEvent(App.eventTypes.OPEN);
                that.triggerEvent(App.eventTypes.OPEN_LIGHTBOX);
                lightBox.off('open', handleOpen);
              });
              lightBox.on('load', function handleLoad() {
                that.triggerEvent(App.eventTypes.LOAD);
                lightBox.off('load', handleLoad);
              });
              lightBox.on('close', function handleClose() {
                that.triggerEvent(App.eventTypes.CLOSE);
                that.triggerEvent(App.eventTypes.CLOSE_LIGHTBOX);
                lightBox.off('status', handleStatus);
                lightBox.off(App.eventTypes.USER_COUNTRY, handleUserLocale);
                lightBox.off('close', handleClose);
              });
              lightBox.on('status', handleStatus);
              lightBox.on(App.eventTypes.USER_COUNTRY, handleUserLocale);
              lightBox.openFrame(url, this.config.lightbox);
              that.childWindow = lightBox;
            }
          };


          /**
           * Close payment interface (PayStation)
           */
          App.prototype.close = function () {
            this.childWindow.close();
          };

          /**
           * Attach an event handler function for one or more events to the widget
           * @param event One or more space-separated event types (init, open, load, close, status, status-invoice, status-delivering, status-troubled, status-done)
           * @param handler A function to execute when the event is triggered
           */
          App.prototype.on = function (event, handler, options) {
            if (typeof handler !== 'function') {
              return;
            }

            const handlerDecorator = function (event) {
              handler(event, event.detail);
            }

            this.eventObject.on(event, handlerDecorator, options);
          };

          /**
           * Remove an event handler
           * @param event One or more space-separated event types
           * @param handler A handler function previously attached for the event(s)
           */
          App.prototype.off = function (event, handler, options) {
            this.eventObject.off(event, handler, options);
          };

          /**
           * Send a message directly to PayStation
           * @param command
           * @param data
           */
          App.prototype.sendMessage = function (command, data) {
            if (this.postMessage) {
              this.postMessage.send.apply(this.postMessage, arguments);
            }
          };

          /**
           * Attach an event handler function for message event from PayStation
           * @param command
           * @param handler
           */
          App.prototype.onMessage = function (command, handler) {
            if (this.postMessage) {
              this.postMessage.on.apply(this.postMessage, arguments);
            }
          };

          return App;
        })();

      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

    }, { "./childwindow": 4, "./device": 5, "./exception": 6, "./helpers": 7, "./lightbox": 8 }], 4: [function (require, module, exports) {
      (function (global) {
        var version = require('./version');
        var Helpers = require('./helpers');
        var PostMessage = require('./postmessage');

        module.exports = (function () {
          function ChildWindow() {
            this.eventObject = Helpers.addEventObject(this, wrapEventInNamespace);
            this.message = null;
          }

          function wrapEventInNamespace(eventName) {
            return ChildWindow._NAMESPACE + '_' + eventName;
          }

          var DEFAULT_OPTIONS = {
            target: '_blank'
          };

          /** Private Members **/
          ChildWindow.prototype.eventObject = null;
          ChildWindow.prototype.childWindow = null;

          ChildWindow.prototype.triggerEvent = function (event, data) {
            this.eventObject.trigger(event, data);
          };

          /** Public Members **/
          ChildWindow.prototype.open = function (url, options) {
            options = Object.assign({}, DEFAULT_OPTIONS, options);

            if (this.childWindow && !this.childWindow.closed) {
              this.childWindow.location.href = url;
            }

            var that = this;
            var addHandlers = function () {
              that.on('close', function handleClose() {
                if (timer) {
                  global.clearTimeout(timer);
                }
                if (that.childWindow) {
                  that.childWindow.close();
                }

                that.off('close', handleClose)
              });

              // Cross-window communication
              that.message = new PostMessage(that.childWindow);
              that.message.on('dimensions widget-detection', function handleWidgetDetection() {
                that.triggerEvent('load');
                that.message.off('dimensions widget-detection', handleWidgetDetection);
              });
              that.message.on('widget-detection', function handleWidgetDetection() {
                that.message.send('widget-detected', { version: version, childWindowOptions: options });
                that.message.off('widget-detection', handleWidgetDetection);
              });
              that.message.on('status', function (event) {
                that.triggerEvent('status', event.detail);
              });
              that.on('close', function handleClose() {
                that.message.off();
                that.off('close', handleClose);
              });
              that.message.on('user-country', function (event) {
                that.triggerEvent('user-country', event.detail);
              });
            };

            switch (options.target) {
              case '_self':
                this.childWindow = global.window;
                addHandlers();
                this.childWindow.location.href = url;
                break;
              case '_parent':
                this.childWindow = global.window.parent;
                addHandlers();
                this.childWindow.location.href = url;
                break;
              case '_blank':
              default:
                this.childWindow = global.window.open(url);
                this.childWindow.focus();
                addHandlers();

                var checkWindow = (function () {
                  if (this.childWindow) {
                    if (this.childWindow.closed) {
                      this.triggerEvent('close');
                    } else {
                      timer = global.setTimeout(checkWindow, 100);
                    }
                  }
                }).bind(this);
                var timer = global.setTimeout(checkWindow, 100);
                break;
            }

            this.triggerEvent('open');
          };

          ChildWindow.prototype.close = function () {
            this.triggerEvent('close');
          };

          ChildWindow.prototype.on = function (event, handler, options) {
            if (typeof handler !== 'function') {
              return;
            }

            this.eventObject.on(event, handler, options);
          };

          ChildWindow.prototype.off = function (event, handler, options) {
            this.eventObject.off(event, handler, options);
          };

          ChildWindow.prototype.getPostMessage = function () {
            return this.message;
          };

          ChildWindow._NAMESPACE = 'CHILD_WINDOW';

          return ChildWindow;
        })();

      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

    }, { "./helpers": 7, "./postmessage": 10, "./version": 14 }], 5: [function (require, module, exports) {
      var bowser = require('bowser');

      module.exports = (function () {
        function Device() {
        }

        /**
         * Mobile devices
         * @returns {boolean}
         */
        Device.prototype.isMobile = function () {
          return bowser.mobile || bowser.tablet;
        };

        return Device;
      })();

    }, { "bowser": "bowser" }], 6: [function (require, module, exports) {
      module.exports = function (message) {
        this.message = message;
        this.name = "XsollaPayStationWidgetException";
        this.toString = (function () {
          return this.name + ': ' + this.message;
        }).bind(this);
      };

    }, {}], 7: [function (require, module, exports) {
      function isEmpty(value) {
        return value === null || value === undefined;
      }

      function uniq(list) {
        return list.filter(function (x, i, a) {
          return a.indexOf(x) == i
        });
      }

      function zipObject(props, values) {
        var index = -1,
          length = props ? props.length : 0,
          result = {};

        if (length && !values && !Array.isArray(props[0])) {
          values = [];
        }
        while (++index < length) {
          var key = props[index];
          if (values) {
            result[key] = values[index];
          } else if (key) {
            result[key[0]] = key[1];
          }
        }
        return result;
      }

      function param(a) {
        var s = [];

        var add = function (k, v) {
          v = typeof v === 'function' ? v() : v;
          v = v === null ? '' : v === undefined ? '' : v;
          s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
        };

        var buildParams = function (prefix, obj) {
          var i, len, key;

          if (prefix) {
            if (Array.isArray(obj)) {
              for (i = 0, len = obj.length; i < len; i++) {
                buildParams(
                  prefix + '[' + (typeof obj[i] === 'object' && obj[i] ? i : '') + ']',
                  obj[i]
                );
              }
            } else if (String(obj) === '[object Object]') {
              for (key in obj) {
                buildParams(prefix + '[' + key + ']', obj[key]);
              }
            } else {
              add(prefix, obj);
            }
          } else if (Array.isArray(obj)) {
            for (i = 0, len = obj.length; i < len; i++) {
              add(obj[i].name, obj[i].value);
            }
          } else {
            for (key in obj) {
              buildParams(key, obj[key]);
            }
          }
          return s;
        };

        return buildParams('', a).join('&');
      };


      function once(f) {
        return function () {
          f(arguments);
          f = function () { };
        }
      }

      function addEventObject(context, wrapEventInNamespace) {
        var dummyWrapper = function (event) { return event };
        var wrapEventInNamespace = wrapEventInNamespace || dummyWrapper;
        var eventsList = [];

        function isStringContainedSpace(str) {
          return / /.test(str)
        }

        return {
          trigger: (function (eventName, data) {
            var eventInNamespace = wrapEventInNamespace(eventName);
            try {
              var event = new CustomEvent(eventInNamespace, { detail: data }); // Not working in IE
            } catch (e) {
              var event = document.createEvent('CustomEvent');
              event.initCustomEvent(eventInNamespace, true, true, data);
            }
            document.dispatchEvent(event);
          }).bind(context),
          on: (function (eventName, handle, options) {

            function addEvent(eventName, handle, options) {
              var eventInNamespace = wrapEventInNamespace(eventName);
              document.addEventListener(eventInNamespace, handle, options);
              eventsList.push({ name: eventInNamespace, handle: handle, options: options });
            }

            if (isStringContainedSpace(eventName)) {
              var events = eventName.split(' ');
              events.forEach(function (parsedEventName) {
                addEvent(parsedEventName, handle, options)
              })
            } else {
              addEvent(eventName, handle, options);
            }

          }).bind(context),

          off: (function (eventName, handle, options) {
            const offAllEvents = !eventName && !handle && !options;

            if (offAllEvents) {
              eventsList.forEach(function (event) {
                document.removeEventListener(event.name, event.handle, event.options);
              });
              return;
            }

            function removeEvent(eventName, handle, options) {
              var eventInNamespace = wrapEventInNamespace(eventName);
              document.removeEventListener(eventInNamespace, handle, options);
              eventsList = eventsList.filter(function (event) {
                return event.name !== eventInNamespace;
              });
            }

            if (isStringContainedSpace(eventName)) {
              var events = eventName.split(' ');
              events.forEach(function (parsedEventName) {
                removeEvent(parsedEventName, handle, options)
              })
            } else {
              removeEvent(eventName, handle, options);
            }

          }).bind(context)
        };
      }

      module.exports = {
        addEventObject: addEventObject,
        isEmpty: isEmpty,
        uniq: uniq,
        zipObject: zipObject,
        param: param,
        once: once,
      }

    }, {}], 8: [function (require, module, exports) {
      (function (global) {
        var version = require('./version');
        var Helpers = require('./helpers');
        var PostMessage = require('./postmessage');

        module.exports = (function () {
          function LightBox(isMobile) {
            require('./styles/lightbox.scss');
            this.eventObject = Helpers.addEventObject(this, wrapEventInNamespace);
            this.options = isMobile ? DEFAULT_OPTIONS_MOBILE : DEFAULT_OPTIONS;
            this.message = null;
          }

          var CLASS_PREFIX = 'xpaystation-widget-lightbox';
          var COMMON_OPTIONS = {
            zIndex: 1000,
            overlayOpacity: '.6',
            overlayBackground: '#000000',
            contentBackground: '#ffffff',
            closeByKeyboard: true,
            closeByClick: true,
            modal: false,
            spinner: 'xsolla',
            spinnerColor: null,
            spinnerUrl: null,
            spinnerRotationPeriod: 0
          };
          var DEFAULT_OPTIONS = Object.assign({}, COMMON_OPTIONS, {
            width: null,
            height: '100%',
            contentMargin: '10px'
          });
          var DEFAULT_OPTIONS_MOBILE = Object.assign({}, COMMON_OPTIONS, {
            width: '100%',
            height: '100%',
            contentMargin: '0px'
          });

          var SPINNERS = {
            xsolla: require('./spinners/xsolla.svg'),
            round: require('./spinners/round.svg'),
            none: ' '
          };

          var MIN_PS_DIMENSIONS = {
            height: 500,
            width: 600
          };

          var handleKeyupEventName = wrapEventInNamespace('keyup');
          var handleResizeEventName = wrapEventInNamespace('resize');

          var handleGlobalKeyup = function (event) {

            var clickEvent = document.createEvent('Event');
            clickEvent.initEvent(handleKeyupEventName, false, true);
            clickEvent.sourceEvent = event;

            document.body.dispatchEvent(clickEvent);
          }

          var handleSpecificKeyup = function (event) {
            if (event.sourceEvent.which == 27) {
              this.closeFrame();
            }
          }

          var handleGlobalResize = function () {
            var resizeEvent = document.createEvent('Event');
            resizeEvent.initEvent(handleResizeEventName, false, true);

            window.dispatchEvent(resizeEvent);
          }

          function wrapEventInNamespace(eventName) {
            return LightBox._NAMESPACE + '_' + eventName;
          }

          /** Private Members **/
          LightBox.prototype.triggerEvent = function () {
            this.eventObject.trigger.apply(this.eventObject, arguments);
          };

          LightBox.prototype.measureScrollbar = function () { // thx walsh: https://davidwalsh.name/detect-scrollbar-width
            var scrollDiv = document.createElement("div");
            scrollDiv.classList.add("scrollbar-measure");
            scrollDiv.setAttribute("style",
              "position: absolute;" +
              "top: -9999px" +
              "width: 50px" +
              "height: 50px" +
              "overflow: scroll"
            );

            document.body.appendChild(scrollDiv);

            var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
            document.body.removeChild(scrollDiv);

            return scrollbarWidth;
          };

          /** Public Members **/
          LightBox.prototype.openFrame = function (url, options) {
            this.options = Object.assign({}, this.options, options);
            var HandleBoundSpecificKeyup = handleSpecificKeyup.bind(this);
            options = this.options;

            var spinner = options.spinner === 'custom' && !!options.spinnerUrl ?
              '<img class="spinner-custom" src="' + encodeURI(options.spinnerUrl) + '" />' : SPINNERS[options.spinner] || Object.values(SPINNERS)[0];

            var template = function (settings) {
              var host = document.createElement('div');
              host.className = settings.prefix;

              var overlay = document.createElement('div');
              overlay.className = settings.prefix + '-overlay';

              var content = document.createElement('div');
              content.className = settings.prefix + '-content' + ' ' + settings.prefix + '-content__hidden';

              var iframe = document.createElement('iframe');
              iframe.className = settings.prefix + '-content-iframe';
              iframe.src = settings.url;
              iframe.frameBorder = '0';
              iframe.allowFullscreen = true;

              var spinner = document.createElement('div');
              spinner.className = settings.prefix + '-spinner';
              spinner.innerHTML = settings.spinner;

              content.appendChild(iframe);

              host.appendChild(overlay);
              host.appendChild(content);
              host.appendChild(spinner);

              return host;
            };

            var bodyElement = global.document.body;
            var lightBoxElement = template({
              prefix: CLASS_PREFIX,
              url: url,
              spinner: spinner
            });
            var lightBoxOverlayElement = lightBoxElement.querySelector('.' + CLASS_PREFIX + '-overlay');
            var lightBoxContentElement = lightBoxElement.querySelector('.' + CLASS_PREFIX + '-content');
            var lightBoxIframeElement = lightBoxContentElement.querySelector('.' + CLASS_PREFIX + '-content-iframe');
            var lightBoxSpinnerElement = lightBoxElement.querySelector('.' + CLASS_PREFIX + '-spinner');

            var psDimensions = {
              width: withDefaultPXUnit(MIN_PS_DIMENSIONS.width),
              height: withDefaultPXUnit(MIN_PS_DIMENSIONS.height)
            };

            function withDefaultPXUnit(value) {
              var isStringWithoutUnit = typeof value === 'string' && String(parseFloat(value)).length === value.length;
              if (isStringWithoutUnit) {
                return value + 'px';
              }
              return typeof value === 'number' ? value + 'px' : value
            }

            lightBoxElement.style.zIndex = options.zIndex;

            lightBoxOverlayElement.style.opacity = options.overlayOpacity;
            lightBoxOverlayElement.style.backgroundColor = options.overlayBackground;

            lightBoxContentElement.style.backgroundColor = options.contentBackground;
            lightBoxContentElement.style.margin = withDefaultPXUnit(options.contentMargin);
            lightBoxContentElement.style.width = options.width ? withDefaultPXUnit(options.width) : 'auto';
            lightBoxContentElement.style.height = options.height ? withDefaultPXUnit(options.height) : 'auto';

            if (options.spinnerColor) {
              lightBoxSpinnerElement.querySelector('path').style.fill = options.spinnerColor;
            }

            if (options.spinner === 'custom') {
              var spinnerCustom = lightBoxSpinnerElement.querySelector('.spinner-custom');
              spinnerCustom.style['-webkit-animation-duration'] = options.spinnerRotationPeriod + 's;';
              spinnerCustom.style['animation-duration'] = options.spinnerRotationPeriod + 's;';
            }

            if (options.closeByClick) {
              lightBoxOverlayElement.addEventListener('click', (function () {
                this.closeFrame();
              }).bind(this));
            }

            bodyElement.appendChild(lightBoxElement);

            if (options.closeByKeyboard) {

              bodyElement.addEventListener(handleKeyupEventName, HandleBoundSpecificKeyup);

              bodyElement.addEventListener('keyup', handleGlobalKeyup, false);
            }

            var showContent = Helpers.once((function () {
              hideSpinner(options);
              lightBoxContentElement.classList.remove(CLASS_PREFIX + '-content__hidden');
              this.triggerEvent('load');
            }).bind(this));

            var lightBoxResize = function () {
              var width = options.width ? options.width : psDimensions.width;
              var height = options.height ? options.height : psDimensions.height;

              lightBoxContentElement.style.left = '0px';
              lightBoxContentElement.style.top = '0px';
              lightBoxContentElement.style.borderRadius = '8px';
              lightBoxContentElement.style.width = withDefaultPXUnit(width);
              lightBoxContentElement.style.height = withDefaultPXUnit(height);

              var containerWidth = lightBoxElement.clientWidth,
                containerHeight = lightBoxElement.clientHeight;

              var contentWidth = outerWidth(lightBoxContentElement),
                contentHeight = outerHeight(lightBoxContentElement);

              var horMargin = contentWidth - lightBoxContentElement.offsetWidth,
                vertMargin = contentHeight - lightBoxContentElement.offsetHeight;

              var horDiff = containerWidth - contentWidth,
                vertDiff = containerHeight - contentHeight;

              if (horDiff < 0) {
                lightBoxContentElement.style.width = containerWidth - horMargin + 'px';
              } else {
                lightBoxContentElement.style.left = Math.round(horDiff / 2) + 'px';
              }

              if (vertDiff < 0) {
                lightBoxContentElement.style.height = containerHeight - vertMargin + 'px';
              } else {
                lightBoxContentElement.style.top = Math.round(vertDiff / 2) + 'px';
              }
            };

            if (options.width && options.height) {
              lightBoxResize = Helpers.once(lightBoxResize.bind(this));
            }

            function outerWidth(el) {
              var width = el.offsetWidth;
              var style = getComputedStyle(el);

              width += parseInt(style.marginLeft) + parseInt(style.marginRight);
              return width;
            }

            function outerHeight(el) {
              var height = el.offsetHeight;
              var style = getComputedStyle(el);

              height += parseInt(style.marginTop) + parseInt(style.marginBottom);
              return height;
            }

            var bodyStyles;
            var hideScrollbar = (function () {
              bodyStyles = Helpers.zipObject(['overflow', 'paddingRight'].map(function (key) {
                return [key, getComputedStyle(bodyElement)[key]];
              }));

              var bodyPad = parseInt((getComputedStyle(bodyElement)['paddingRight'] || 0), 10);
              bodyElement.style.overflow = 'hidden';
              bodyElement.style.paddingRight = withDefaultPXUnit(bodyPad + this.measureScrollbar());
            }).bind(this);

            var resetScrollbar = function () {
              if (bodyStyles) {
                Object.keys(bodyStyles).forEach(function (key) {
                  bodyElement.style[key] = bodyStyles[key];
                })
              }
            };

            var showSpinner = function () {
              lightBoxSpinnerElement.style.display = 'block';
            };

            var hideSpinner = function () {
              lightBoxSpinnerElement.style.display = 'none';
            };

            var loadTimer;
            lightBoxIframeElement.addEventListener('load', function handleLoad(event) {
              var timeout = !(options.width && options.height) ? (options.resizeTimeout || 30000) : 1000; // 30000 if psDimensions will not arrive and custom timeout is not provided
              loadTimer = global.setTimeout(function () {
                lightBoxResize();
                showContent();
              }, timeout);
              lightBoxIframeElement.removeEventListener('load', handleLoad);

            });

            var iframeWindow = lightBoxIframeElement.contentWindow || lightBoxIframeElement;

            // Cross-window communication
            this.message = new PostMessage(iframeWindow);
            if (options.width && options.height) {
              this.message.on('dimensions', (function () {
                lightBoxResize();
                showContent();
              }));
            } else {
              this.message.on('dimensions', (function (event) {
                var data = event.detail;
                if (data.dimensions) {
                  psDimensions = Helpers.zipObject(['width', 'height'].map(function (dim) {
                    return [dim, Math.max(MIN_PS_DIMENSIONS[dim] || 0, data.dimensions[dim] || 0) + 'px'];
                  }));

                  lightBoxResize();
                }
                showContent();
              }));
            }
            this.message.on('widget-detection', (function () {
              this.message.send('widget-detected', { version: version, lightBoxOptions: options });
            }).bind(this));
            this.message.on('widget-close', (function () {
              this.closeFrame();
            }).bind(this));
            this.message.on('status', (function (event) {
              this.triggerEvent('status', event.detail);
            }).bind(this));
            this.message.on('user-country', (function (event) {
              this.triggerEvent('user-country', event.detail);
            }).bind(this));

            // Resize
            window.addEventListener(handleResizeEventName, lightBoxResize);
            window.addEventListener('resize', handleGlobalResize);

            // Clean up after close
            var that = this;
            this.on('close', function handleClose(event) {
              that.message.off();
              bodyElement.removeEventListener(handleKeyupEventName, HandleBoundSpecificKeyup)
              bodyElement.removeEventListener('keyup', handleGlobalKeyup);

              window.removeEventListener('resize', handleGlobalResize)

              window.removeEventListener(handleResizeEventName, lightBoxResize);
              lightBoxElement.parentNode.removeChild(lightBoxElement);
              resetScrollbar();
              that.off('close', handleClose);
            });

            showSpinner();
            hideScrollbar();
            this.triggerEvent('open');
          };

          LightBox.prototype.closeFrame = function () {
            if (!this.options.modal) {
              this.triggerEvent('close');
            }
          };

          LightBox.prototype.close = function () {
            this.closeFrame();
          };

          LightBox.prototype.on = function () {
            this.eventObject.on.apply(this.eventObject, arguments);
          };

          LightBox.prototype.off = function () {
            this.eventObject.off.apply(this.eventObject, arguments);
          };

          LightBox.prototype.getPostMessage = function () {
            return this.message;
          };

          LightBox._NAMESPACE = '.xpaystation-widget-lightbox';

          return LightBox;
        })();

      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

    }, { "./helpers": 7, "./postmessage": 10, "./spinners/round.svg": 11, "./spinners/xsolla.svg": 12, "./styles/lightbox.scss": 13, "./version": 14 }], 9: [function (require, module, exports) {
      function objectAssign() {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign Polyfill
        Object.assign || Object.defineProperty(Object, "assign", { enumerable: !1, configurable: !0, writable: !0, value: function (e, r) { "use strict"; if (null == e) throw new TypeError("Cannot convert first argument to object"); for (var t = Object(e), n = 1; n < arguments.length; n++) { var o = arguments[n]; if (null != o) for (var a = Object.keys(Object(o)), c = 0, b = a.length; c < b; c++) { var i = a[c], l = Object.getOwnPropertyDescriptor(o, i); void 0 !== l && l.enumerable && (t[i] = o[i]) } } return t } });
      }

      function arrayForEach() {
        Array.prototype.forEach || (Array.prototype.forEach = function (r, o) { var t, n; if (null == this) throw new TypeError(" this is null or not defined"); var e = Object(this), i = e.length >>> 0; if ("function" != typeof r) throw new TypeError(r + " is not a function"); for (arguments.length > 1 && (t = o), n = 0; n < i;) { var f; n in e && (f = e[n], r.call(t, f, n, e)), n++ } });
      }

      function applyPolyfills() {
        objectAssign();
        arrayForEach();
      }

      module.exports = {
        applyPolyfills: applyPolyfills
      }

    }, {}], 10: [function (require, module, exports) {
      (function (global) {
        var Helpers = require('./helpers');

        module.exports = (function () {
          function wrapEventInNamespace(eventName) {
            return PostMessage._NAMESPACE + '_' + eventName;
          }

          function PostMessage(window) {
            this.eventObject = Helpers.addEventObject(this, wrapEventInNamespace);
            this.linkedWindow = window;

            global.window.addEventListener && global.window.addEventListener("message", (function (event) {
              if (event.source !== this.linkedWindow) {
                return;
              }

              var message = {};
              if (typeof event.data === 'string' && global.JSON !== undefined) {
                try {
                  message = global.JSON.parse(event.data);
                } catch (e) {
                }
              }

              if (message.command) {
                this.eventObject.trigger(message.command, message.data);
              }
            }).bind(this));
          }

          /** Private Members **/
          PostMessage.prototype.eventObject = null;
          PostMessage.prototype.linkedWindow = null;

          /** Public Members **/
          PostMessage.prototype.send = function (command, data, targetOrigin) {
            if (data === undefined) {
              data = {};
            }

            if (targetOrigin === undefined) {
              targetOrigin = '*';
            }

            if (!this.linkedWindow || this.linkedWindow.postMessage === undefined || global.window.JSON === undefined) {
              return false;
            }

            try {
              this.linkedWindow.postMessage(global.JSON.stringify({ data: data, command: command }), targetOrigin);
            } catch (e) {
            }

            return true;
          };

          PostMessage.prototype.on = function (event, handle, options) {
            this.eventObject.on(event, handle, options);
          };

          PostMessage.prototype.off = function (event, handle, options) {
            this.eventObject.off(event, handle, options);
          };

          PostMessage._NAMESPACE = 'POST_MESSAGE';


          return PostMessage;
        })();

      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

    }, { "./helpers": 7 }], 11: [function (require, module, exports) {
      module.exports = "<svg width=\"47px\" height=\"47px\" class=\"spinner-round\"><path d=\"M4.7852728,10.4210875 C2.94111664,13.0552197 1.63777109,16.0946106 1.03753956,19.3768556 L5.16638971,19.3768556 C5.6429615,17.187554 6.50125243,15.139164 7.66768899,13.305305 L5.95572428,11.5922705 L4.7852728,10.4210875 L4.7852728,10.4210875 Z M10.4693048,4.74565615 C13.1274873,2.8908061 16.1965976,1.58674648 19.5100161,1 L19.5100161,4.99523934 C17.2710923,5.48797782 15.1803193,6.3808529 13.3166907,7.59482153 L11.6337339,5.91081293 L10.4693048,4.74565615 L10.4693048,4.74565615 Z M42.2426309,36.5388386 C44.1112782,33.8575016 45.4206461,30.7581504 46,27.4117269 L41.9441211,27.4117269 C41.4527945,29.6618926 40.5583692,31.762911 39.3404412,33.6349356 L41.0332347,35.3287869 L42.2425306,36.5388386 L42.2426309,36.5388386 Z M36.5707441,42.2264227 C33.9167773,44.0867967 30.8509793,45.3972842 27.5398693,45.9911616 L27.5398693,41.7960549 C29.7376402,41.3202901 31.7936841,40.4593536 33.6336246,39.287568 L35.3554258,41.0104453 L36.5707441,42.2265231 L36.5707441,42.2264227 Z M4.71179965,36.4731535 C2.86744274,33.8069823 1.57463637,30.7309322 1,27.4118273 L5.16889904,27.4118273 C5.64828128,29.6073559 6.51159087,31.661069 7.68465205,33.4984432 L5.95572428,35.2284515 L4.71179965,36.4731535 L4.71179965,36.4731535 Z M10.3640133,42.180423 C13.0462854,44.0745435 16.1527345,45.40552 19.5101165,46 L19.5101165,41.7821947 C17.2817319,41.2916658 15.2000928,40.4048169 13.3430889,39.1995862 L11.6337339,40.9100094 L10.3640133,42.1805235 L10.3640133,42.180423 Z M42.1688567,10.3557038 C44.0373031,13.0048008 45.357411,16.0674929 45.9626612,19.3768556 L41.9469316,19.3768556 C41.4585158,17.1328164 40.5692095,15.0369202 39.3580065,13.1684109 L41.0335358,11.4918346 L42.168957,10.3557038 L42.1688567,10.3557038 Z M36.4651516,4.69995782 C33.8355754,2.87865336 30.8071162,1.59488179 27.5400701,1.00883836 L27.5400701,4.98117831 C29.7484805,5.45915272 31.8137587,6.3260149 33.6604242,7.50643794 L35.3555262,5.8102766 L36.4651516,4.69995782 L36.4651516,4.69995782 Z\" fill=\"#CCCCCC\"></path></svg>";

    }, {}], 12: [function (require, module, exports) {
      module.exports = "<svg class=\"spinner-xsolla\" width=\"56\" height=\"55\"><path class=\"spinner-xsolla-x\" d=\"M21.03 5.042l-2.112-2.156-3.657 3.695-3.657-3.695-2.112 2.156 3.659 3.673-3.659 3.696 2.112 2.157 3.657-3.697 3.657 3.697 2.112-2.157-3.648-3.696 3.648-3.673z\" fill=\"#F2542D\"></path><path class=\"spinner-xsolla-s\" d=\"M41.232 6.896l2.941-2.974-2.134-2.132-2.92 2.973-.005-.008-2.134 2.135.005.008-.005.005 3.792 3.82-2.915 2.947 2.112 2.156 5.06-5.111-3.798-3.816.001-.001z\" fill=\"#FCCA20\"></path><path class=\"spinner-xsolla-o\" d=\"M48.066 29.159c-1.536 0-2.761 1.263-2.761 2.79 0 1.524 1.226 2.765 2.761 2.765 1.509 0 2.736-1.242 2.736-2.765 0-1.526-1.227-2.79-2.736-2.79m0 8.593c-3.179 0-5.771-2.594-5.771-5.804 0-3.213 2.592-5.808 5.771-5.808 3.155 0 5.745 2.594 5.745 5.808 0 3.21-2.589 5.804-5.745 5.804\" fill=\"#8C3EA4\"></path><path class=\"spinner-xsolla-l\" d=\"M24.389 42.323h2.99v10.437h-2.99v-10.437zm4.334 0h2.989v10.437h-2.989v-10.437z\" fill=\"#B5DC20\"></path><path class=\"spinner-xsolla-a\" d=\"M7.796 31.898l1.404 2.457h-2.835l1.431-2.457h-.001zm-.001-5.757l-6.363 11.102h12.703l-6.341-11.102z\" fill=\"#66CCDA\"></path></svg>";

    }, {}], 13: [function (require, module, exports) {
      module.exports = require('sassify')('.xpaystation-widget-lightbox{position:fixed;top:0;left:0;bottom:0;right:0;width:100%;height:100%;-webkit-animation:xpaystation-widget-lightbox-fadein 0.15s;animation:xpaystation-widget-lightbox-fadein 0.15s}.xpaystation-widget-lightbox-overlay{position:absolute;top:0;left:0;bottom:0;right:0;z-index:1}.xpaystation-widget-lightbox-content{position:relative;top:0;left:0;z-index:3}.xpaystation-widget-lightbox-content__hidden{visibility:hidden;z-index:-1}.xpaystation-widget-lightbox-content-iframe{width:100%;height:100%;border:0;background:transparent}.xpaystation-widget-lightbox-spinner{position:absolute;top:50%;left:50%;display:none;z-index:2;pointer-events:none}.xpaystation-widget-lightbox-spinner .spinner-xsolla{width:56px;height:55px;margin-top:-28px;margin-left:-26px}.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-x,.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-s,.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-o,.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-l,.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-a{-webkit-animation:xpaystation-widget-lightbox-bouncedelay 1s infinite ease-in-out;-webkit-animation-fill-mode:both;animation:xpaystation-widget-lightbox-bouncedelay 1s infinite ease-in-out;animation-fill-mode:both}.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-x{-webkit-animation-delay:0s;animation-delay:0s}.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-s{-webkit-animation-delay:.2s;animation-delay:.2s}.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-o{-webkit-animation-delay:.4s;animation-delay:.4s}.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-l{-webkit-animation-delay:.6s;animation-delay:.6s}.xpaystation-widget-lightbox-spinner .spinner-xsolla .spinner-xsolla-a{-webkit-animation-delay:.8s;animation-delay:.8s}.xpaystation-widget-lightbox-spinner .spinner-round{margin-top:-23px;margin-left:-23px;-webkit-animation:xpaystation-widget-lightbox-spin 3s infinite linear;animation:xpaystation-widget-lightbox-spin 3s infinite linear}.xpaystation-widget-lightbox-spinner .spinner-custom{-webkit-animation:xpaystation-widget-lightbox-spin infinite linear;animation:xpaystation-widget-lightbox-spin infinite linear}@-webkit-keyframes xpaystation-widget-lightbox-bouncedelay{0%,80%,100%{opacity:0}40%{opacity:1}}@keyframes xpaystation-widget-lightbox-bouncedelay{0%,80%,100%{opacity:0}40%{opacity:1}}@-webkit-keyframes xpaystation-widget-lightbox-fadein{from{opacity:0}to{opacity:1}}@keyframes xpaystation-widget-lightbox-fadein{from{opacity:0}to{opacity:1}}@-webkit-keyframes xpaystation-widget-lightbox-spin{from{-webkit-transform:rotate(0deg)}to{-webkit-transform:rotate(360deg)}}@keyframes xpaystation-widget-lightbox-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}  /*# sourceMappingURL=data:application/json;base64,ewoJInZlcnNpb24iOiAzLAoJImZpbGUiOiAibGlnaHRib3guc2NzcyIsCgkic291cmNlcyI6IFsKCQkibGlnaHRib3guc2NzcyIKCV0sCgkic291cmNlc0NvbnRlbnQiOiBbCgkJIiRsaWdodGJveC1wcmVmaXg6ICd4cGF5c3RhdGlvbi13aWRnZXQtbGlnaHRib3gnO1xuJGxpZ2h0Ym94LWNsYXNzOiAnLicgKyAkbGlnaHRib3gtcHJlZml4O1xuXG4jeyRsaWdodGJveC1jbGFzc30ge1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHRvcDogMDtcbiAgbGVmdDogMDtcbiAgYm90dG9tOiAwO1xuICByaWdodDogMDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgLXdlYmtpdC1hbmltYXRpb246ICN7JGxpZ2h0Ym94LXByZWZpeH0tZmFkZWluIC4xNXM7XG4gIGFuaW1hdGlvbjogI3skbGlnaHRib3gtcHJlZml4fS1mYWRlaW4gLjE1cztcbn1cblxuI3skbGlnaHRib3gtY2xhc3N9LW92ZXJsYXkge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDowO1xuICBsZWZ0OiAwO1xuICBib3R0b206IDA7XG4gIHJpZ2h0OiAwO1xuICB6LWluZGV4OiAxO1xufVxuXG4jeyRsaWdodGJveC1jbGFzc30tY29udGVudCB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICB6LWluZGV4OiAzO1xufVxuXG4jeyRsaWdodGJveC1jbGFzc30tY29udGVudF9faGlkZGVuIHtcbiAgdmlzaWJpbGl0eTogaGlkZGVuO1xuICB6LWluZGV4OiAtMTtcbn1cblxuI3skbGlnaHRib3gtY2xhc3N9LWNvbnRlbnQtaWZyYW1lIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbn1cblxuI3skbGlnaHRib3gtY2xhc3N9LXNwaW5uZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIGRpc3BsYXk6IG5vbmU7XG4gIHotaW5kZXg6IDI7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuXG4gIC5zcGlubmVyLXhzb2xsYSB7XG4gICAgd2lkdGg6IDU2cHg7XG4gICAgaGVpZ2h0OiA1NXB4O1xuICAgIG1hcmdpbjoge1xuICAgICAgdG9wOiAtMjhweDtcbiAgICAgIGxlZnQ6IC0yNnB4O1xuICAgIH1cblxuICAgIC5zcGlubmVyLXhzb2xsYS14LCAuc3Bpbm5lci14c29sbGEtcywgLnNwaW5uZXIteHNvbGxhLW8sIC5zcGlubmVyLXhzb2xsYS1sLCAuc3Bpbm5lci14c29sbGEtYSB7XG4gICAgICAtd2Via2l0LWFuaW1hdGlvbjogI3skbGlnaHRib3gtcHJlZml4fS1ib3VuY2VkZWxheSAxcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcbiAgICAgIC13ZWJraXQtYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcbiAgICAgIGFuaW1hdGlvbjogI3skbGlnaHRib3gtcHJlZml4fS1ib3VuY2VkZWxheSAxcyBpbmZpbml0ZSBlYXNlLWluLW91dDtcbiAgICAgIGFuaW1hdGlvbi1maWxsLW1vZGU6IGJvdGg7XG4gICAgfVxuXG4gICAgLnNwaW5uZXIteHNvbGxhLXgge1xuICAgICAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IDBzO1xuICAgICAgYW5pbWF0aW9uLWRlbGF5OiAwcztcbiAgICB9XG5cbiAgICAuc3Bpbm5lci14c29sbGEtcyB7XG4gICAgICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLjJzO1xuICAgICAgYW5pbWF0aW9uLWRlbGF5OiAuMnM7XG4gICAgfVxuXG4gICAgLnNwaW5uZXIteHNvbGxhLW8ge1xuICAgICAgLXdlYmtpdC1hbmltYXRpb24tZGVsYXk6IC40cztcbiAgICAgIGFuaW1hdGlvbi1kZWxheTogLjRzO1xuICAgIH1cblxuICAgIC5zcGlubmVyLXhzb2xsYS1sIHtcbiAgICAgIC13ZWJraXQtYW5pbWF0aW9uLWRlbGF5OiAuNnM7XG4gICAgICBhbmltYXRpb24tZGVsYXk6IC42cztcbiAgICB9XG5cbiAgICAuc3Bpbm5lci14c29sbGEtYSB7XG4gICAgICAtd2Via2l0LWFuaW1hdGlvbi1kZWxheTogLjhzO1xuICAgICAgYW5pbWF0aW9uLWRlbGF5OiAuOHM7XG4gICAgfVxuICB9XG5cbiAgLnNwaW5uZXItcm91bmQge1xuICAgIG1hcmdpbjoge1xuICAgICAgdG9wOiAtMjNweDtcbiAgICAgIGxlZnQ6IC0yM3B4O1xuICAgIH1cbiAgICAtd2Via2l0LWFuaW1hdGlvbjogI3skbGlnaHRib3gtcHJlZml4fS1zcGluIDNzIGluZmluaXRlIGxpbmVhcjtcbiAgICBhbmltYXRpb246ICN7JGxpZ2h0Ym94LXByZWZpeH0tc3BpbiAzcyBpbmZpbml0ZSBsaW5lYXI7XG4gIH1cblxuICAuc3Bpbm5lci1jdXN0b20ge1xuICAgIC13ZWJraXQtYW5pbWF0aW9uOiAjeyRsaWdodGJveC1wcmVmaXh9LXNwaW4gaW5maW5pdGUgbGluZWFyO1xuICAgIGFuaW1hdGlvbjogI3skbGlnaHRib3gtcHJlZml4fS1zcGluIGluZmluaXRlIGxpbmVhcjtcbiAgfVxufVxuXG5ALXdlYmtpdC1rZXlmcmFtZXMgI3skbGlnaHRib3gtcHJlZml4fS1ib3VuY2VkZWxheSB7XG4gIDAlLCA4MCUsIDEwMCUgeyBvcGFjaXR5OiAwOyB9XG4gIDQwJSB7IG9wYWNpdHk6IDEgfVxufVxuXG5Aa2V5ZnJhbWVzICN7JGxpZ2h0Ym94LXByZWZpeH0tYm91bmNlZGVsYXkge1xuICAwJSwgODAlLCAxMDAlIHsgb3BhY2l0eTogMDsgfVxuICA0MCUgeyBvcGFjaXR5OiAxOyB9XG59XG5cbkAtd2Via2l0LWtleWZyYW1lcyAjeyRsaWdodGJveC1wcmVmaXh9LWZhZGVpbiB7XG4gIGZyb20geyBvcGFjaXR5OiAwOyB9XG4gIHRvIHsgb3BhY2l0eTogMTsgfVxufVxuXG5Aa2V5ZnJhbWVzICN7JGxpZ2h0Ym94LXByZWZpeH0tZmFkZWluIHtcbiAgZnJvbSB7IG9wYWNpdHk6IDA7IH1cbiAgdG8geyBvcGFjaXR5OiAxOyB9XG59XG5cbkAtd2Via2l0LWtleWZyYW1lcyAjeyRsaWdodGJveC1wcmVmaXh9LXNwaW4ge1xuICBmcm9tIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsgfVxuICB0byB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgfVxufVxuXG5Aa2V5ZnJhbWVzICN7JGxpZ2h0Ym94LXByZWZpeH0tc3BpbiB7XG4gIGZyb20geyB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsgfVxuICB0byB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH1cbn1cbiIKCV0sCgkibWFwcGluZ3MiOiAiQUFHQSxBQUFBLDRCQUE0QixBQUE1QixDQUNFLFFBQVEsQ0FBRSxLQUFNLENBQ2hCLEdBQUcsQ0FBRSxDQUFFLENBQ1AsSUFBSSxDQUFFLENBQUUsQ0FDUixNQUFNLENBQUUsQ0FBRSxDQUNWLEtBQUssQ0FBRSxDQUFFLENBQ1QsS0FBSyxDQUFFLElBQUssQ0FDWixNQUFNLENBQUUsSUFBSyxDQUNiLGlCQUFpQixDQUFFLGtDQUEwQixDQUFRLEtBQUksQ0FDekQsU0FBUyxDQUFFLGtDQUEwQixDQUFRLEtBQUksQ0FDbEQsQUFFRCxBQUFBLG9DQUFvQyxBQUFwQyxDQUNFLFFBQVEsQ0FBRSxRQUFTLENBQ25CLEdBQUcsQ0FBQyxDQUFFLENBQ04sSUFBSSxDQUFFLENBQUUsQ0FDUixNQUFNLENBQUUsQ0FBRSxDQUNWLEtBQUssQ0FBRSxDQUFFLENBQ1QsT0FBTyxDQUFFLENBQUUsQ0FDWixBQUVELEFBQUEsb0NBQW9DLEFBQXBDLENBQ0UsUUFBUSxDQUFFLFFBQVMsQ0FDbkIsR0FBRyxDQUFFLENBQUUsQ0FDUCxJQUFJLENBQUUsQ0FBRSxDQUNSLE9BQU8sQ0FBRSxDQUFFLENBQ1osQUFFRCxBQUFBLDRDQUE0QyxBQUE1QyxDQUNFLFVBQVUsQ0FBRSxNQUFPLENBQ25CLE9BQU8sQ0FBRSxFQUFHLENBQ2IsQUFFRCxBQUFBLDJDQUEyQyxBQUEzQyxDQUNFLEtBQUssQ0FBRSxJQUFLLENBQ1osTUFBTSxDQUFFLElBQUssQ0FDYixNQUFNLENBQUUsQ0FBRSxDQUNWLFVBQVUsQ0FBRSxXQUFZLENBQ3pCLEFBRUQsQUFBQSxvQ0FBb0MsQUFBcEMsQ0FDRSxRQUFRLENBQUUsUUFBUyxDQUNuQixHQUFHLENBQUUsR0FBSSxDQUNULElBQUksQ0FBRSxHQUFJLENBQ1YsT0FBTyxDQUFFLElBQUssQ0FDZCxPQUFPLENBQUUsQ0FBRSxDQUNYLGNBQWMsQ0FBRSxJQUFLLENBd0R0QixBQTlERCxBQVFFLG9DQVJrQyxDQVFsQyxlQUFlLEFBQUMsQ0FDZCxLQUFLLENBQUUsSUFBSyxDQUNaLE1BQU0sQ0FBRSxJQUFLLENBQ2IsTUFBTSxBQUFDLENBQUMsQUFDTixHQUFHLENBQUUsS0FBTSxDQURiLE1BQU0sQUFBQyxDQUFDLEFBRU4sSUFBSSxDQUFFLEtBQU0sQ0FrQ2YsQUEvQ0gsQUFnQkksb0NBaEJnQyxDQVFsQyxlQUFlLENBUWIsaUJBQWlCLENBaEJyQixBQWdCdUIsb0NBaEJhLENBUWxDLGVBQWUsQ0FRTSxpQkFBaUIsQ0FoQnhDLEFBZ0IwQyxvQ0FoQk4sQ0FRbEMsZUFBZSxDQVF5QixpQkFBaUIsQ0FoQjNELEFBZ0I2RCxvQ0FoQnpCLENBUWxDLGVBQWUsQ0FRNEMsaUJBQWlCLENBaEI5RSxBQWdCZ0Ysb0NBaEI1QyxDQVFsQyxlQUFlLENBUStELGlCQUFpQixBQUFDLENBQzVGLGlCQUFpQixDQUFFLHVDQUErQixDQUFhLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUN0RiwyQkFBMkIsQ0FBRSxJQUFLLENBQ2xDLFNBQVMsQ0FBRSx1Q0FBK0IsQ0FBYSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FDOUUsbUJBQW1CLENBQUUsSUFBSyxDQUMzQixBQXJCTCxBQXVCSSxvQ0F2QmdDLENBUWxDLGVBQWUsQ0FlYixpQkFBaUIsQUFBQyxDQUNoQix1QkFBdUIsQ0FBRSxFQUFHLENBQzVCLGVBQWUsQ0FBRSxFQUFHLENBQ3JCLEFBMUJMLEFBNEJJLG9DQTVCZ0MsQ0FRbEMsZUFBZSxDQW9CYixpQkFBaUIsQUFBQyxDQUNoQix1QkFBdUIsQ0FBRSxHQUFJLENBQzdCLGVBQWUsQ0FBRSxHQUFJLENBQ3RCLEFBL0JMLEFBaUNJLG9DQWpDZ0MsQ0FRbEMsZUFBZSxDQXlCYixpQkFBaUIsQUFBQyxDQUNoQix1QkFBdUIsQ0FBRSxHQUFJLENBQzdCLGVBQWUsQ0FBRSxHQUFJLENBQ3RCLEFBcENMLEFBc0NJLG9DQXRDZ0MsQ0FRbEMsZUFBZSxDQThCYixpQkFBaUIsQUFBQyxDQUNoQix1QkFBdUIsQ0FBRSxHQUFJLENBQzdCLGVBQWUsQ0FBRSxHQUFJLENBQ3RCLEFBekNMLEFBMkNJLG9DQTNDZ0MsQ0FRbEMsZUFBZSxDQW1DYixpQkFBaUIsQUFBQyxDQUNoQix1QkFBdUIsQ0FBRSxHQUFJLENBQzdCLGVBQWUsQ0FBRSxHQUFJLENBQ3RCLEFBOUNMLEFBaURFLG9DQWpEa0MsQ0FpRGxDLGNBQWMsQUFBQyxDQUNiLE1BQU0sQUFBQyxDQUFDLEFBQ04sR0FBRyxDQUFFLEtBQU0sQ0FEYixNQUFNLEFBQUMsQ0FBQyxBQUVOLElBQUksQ0FBRSxLQUFNLENBRWQsaUJBQWlCLENBQUUsZ0NBQXdCLENBQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQ25FLFNBQVMsQ0FBRSxnQ0FBd0IsQ0FBTSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDNUQsQUF4REgsQUEwREUsb0NBMURrQyxDQTBEbEMsZUFBZSxBQUFDLENBQ2QsaUJBQWlCLENBQUUsZ0NBQXdCLENBQU0sUUFBUSxDQUFDLE1BQU0sQ0FDaEUsU0FBUyxDQUFFLGdDQUF3QixDQUFNLFFBQVEsQ0FBQyxNQUFNLENBQ3pELEFBR0gsa0JBQWtCLENBQWxCLHVDQUFrQixDQUNoQixBQUFBLEVBQUUsQ0FBRSxBQUFBLEdBQUcsQ0FBRSxBQUFBLElBQUksQ0FBRyxPQUFPLENBQUUsQ0FBRSxDQUMzQixBQUFBLEdBQUcsQ0FBRyxPQUFPLENBQUUsQ0FBRyxFQUdwQixVQUFVLENBQVYsdUNBQVUsQ0FDUixBQUFBLEVBQUUsQ0FBRSxBQUFBLEdBQUcsQ0FBRSxBQUFBLElBQUksQ0FBRyxPQUFPLENBQUUsQ0FBRSxDQUMzQixBQUFBLEdBQUcsQ0FBRyxPQUFPLENBQUUsQ0FBRSxFQUduQixrQkFBa0IsQ0FBbEIsa0NBQWtCLENBQ2hCLEFBQUEsSUFBSSxDQUFHLE9BQU8sQ0FBRSxDQUFFLENBQ2xCLEFBQUEsRUFBRSxDQUFHLE9BQU8sQ0FBRSxDQUFFLEVBR2xCLFVBQVUsQ0FBVixrQ0FBVSxDQUNSLEFBQUEsSUFBSSxDQUFHLE9BQU8sQ0FBRSxDQUFFLENBQ2xCLEFBQUEsRUFBRSxDQUFHLE9BQU8sQ0FBRSxDQUFFLEVBR2xCLGtCQUFrQixDQUFsQixnQ0FBa0IsQ0FDaEIsQUFBQSxJQUFJLENBQUcsaUJBQWlCLENBQUUsWUFBTSxDQUNoQyxBQUFBLEVBQUUsQ0FBRyxpQkFBaUIsQ0FBRSxjQUFNLEVBR2hDLFVBQVUsQ0FBVixnQ0FBVSxDQUNSLEFBQUEsSUFBSSxDQUFHLFNBQVMsQ0FBRSxZQUFNLENBQ3hCLEFBQUEsRUFBRSxDQUFHLFNBQVMsQ0FBRSxjQUFNIiwKCSJuYW1lcyI6IFtdCn0= */');;
    }, { "sassify": 2 }], 14: [function (require, module, exports) {
      module.exports = '1.2.7';

    }, {}], "bowser": [function (require, module, exports) {
      /*!
       * Bowser - a browser detector
       * https://github.com/ded/bowser
       * MIT License | (c) Dustin Diaz 2015
       */

      !function (root, name, definition) {
        if (typeof module != 'undefined' && module.exports) module.exports = definition()
        else if (typeof define == 'function' && define.amd) define(name, definition)
        else root[name] = definition()
      }(this, 'bowser', function () {
        /**
          * See useragents.js for examples of navigator.userAgent
          */

        var t = true

        function detect(ua) {

          function getFirstMatch(regex) {
            var match = ua.match(regex);
            return (match && match.length > 1 && match[1]) || '';
          }

          function getSecondMatch(regex) {
            var match = ua.match(regex);
            return (match && match.length > 1 && match[2]) || '';
          }

          var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
            , likeAndroid = /like android/i.test(ua)
            , android = !likeAndroid && /android/i.test(ua)
            , nexusMobile = /nexus\s*[0-6]\s*/i.test(ua)
            , nexusTablet = !nexusMobile && /nexus\s*[0-9]+/i.test(ua)
            , chromeos = /CrOS/.test(ua)
            , silk = /silk/i.test(ua)
            , sailfish = /sailfish/i.test(ua)
            , tizen = /tizen/i.test(ua)
            , webos = /(web|hpw)(o|0)s/i.test(ua)
            , windowsphone = /windows phone/i.test(ua)
            , samsungBrowser = /SamsungBrowser/i.test(ua)
            , windows = !windowsphone && /windows/i.test(ua)
            , mac = !iosdevice && !silk && /macintosh/i.test(ua)
            , linux = !android && !sailfish && !tizen && !webos && /linux/i.test(ua)
            , edgeVersion = getSecondMatch(/edg([ea]|ios)\/(\d+(\.\d+)?)/i)
            , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
            , tablet = /tablet/i.test(ua) && !/tablet pc/i.test(ua)
            , mobile = !tablet && /[^-]mobi/i.test(ua)
            , xbox = /xbox/i.test(ua)
            , result

          if (/opera/i.test(ua)) {
            //  an old Opera
            result = {
              name: 'Opera'
              , opera: t
              , version: versionIdentifier || getFirstMatch(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)
            }
          } else if (/opr\/|opios/i.test(ua)) {
            // a new Opera
            result = {
              name: 'Opera'
              , opera: t
              , version: getFirstMatch(/(?:opr|opios)[\s\/](\d+(\.\d+)?)/i) || versionIdentifier
            }
          }
          else if (/SamsungBrowser/i.test(ua)) {
            result = {
              name: 'Samsung Internet for Android'
              , samsungBrowser: t
              , version: versionIdentifier || getFirstMatch(/(?:SamsungBrowser)[\s\/](\d+(\.\d+)?)/i)
            }
          }
          else if (/Whale/i.test(ua)) {
            result = {
              name: 'NAVER Whale browser'
              , whale: t
              , version: getFirstMatch(/(?:whale)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/MZBrowser/i.test(ua)) {
            result = {
              name: 'MZ Browser'
              , mzbrowser: t
              , version: getFirstMatch(/(?:MZBrowser)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/coast/i.test(ua)) {
            result = {
              name: 'Opera Coast'
              , coast: t
              , version: versionIdentifier || getFirstMatch(/(?:coast)[\s\/](\d+(\.\d+)?)/i)
            }
          }
          else if (/focus/i.test(ua)) {
            result = {
              name: 'Focus'
              , focus: t
              , version: getFirstMatch(/(?:focus)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/yabrowser/i.test(ua)) {
            result = {
              name: 'Yandex Browser'
              , yandexbrowser: t
              , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
            }
          }
          else if (/ucbrowser/i.test(ua)) {
            result = {
              name: 'UC Browser'
              , ucbrowser: t
              , version: getFirstMatch(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/mxios/i.test(ua)) {
            result = {
              name: 'Maxthon'
              , maxthon: t
              , version: getFirstMatch(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/epiphany/i.test(ua)) {
            result = {
              name: 'Epiphany'
              , epiphany: t
              , version: getFirstMatch(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/puffin/i.test(ua)) {
            result = {
              name: 'Puffin'
              , puffin: t
              , version: getFirstMatch(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)
            }
          }
          else if (/sleipnir/i.test(ua)) {
            result = {
              name: 'Sleipnir'
              , sleipnir: t
              , version: getFirstMatch(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (/k-meleon/i.test(ua)) {
            result = {
              name: 'K-Meleon'
              , kMeleon: t
              , version: getFirstMatch(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)
            }
          }
          else if (windowsphone) {
            result = {
              name: 'Windows Phone'
              , osname: 'Windows Phone'
              , windowsphone: t
            }
            if (edgeVersion) {
              result.msedge = t
              result.version = edgeVersion
            }
            else {
              result.msie = t
              result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i)
            }
          }
          else if (/msie|trident/i.test(ua)) {
            result = {
              name: 'Internet Explorer'
              , msie: t
              , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
            }
          } else if (chromeos) {
            result = {
              name: 'Chrome'
              , osname: 'Chrome OS'
              , chromeos: t
              , chromeBook: t
              , chrome: t
              , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
            }
          } else if (/edg([ea]|ios)/i.test(ua)) {
            result = {
              name: 'Microsoft Edge'
              , msedge: t
              , version: edgeVersion
            }
          }
          else if (/vivaldi/i.test(ua)) {
            result = {
              name: 'Vivaldi'
              , vivaldi: t
              , version: getFirstMatch(/vivaldi\/(\d+(\.\d+)?)/i) || versionIdentifier
            }
          }
          else if (sailfish) {
            result = {
              name: 'Sailfish'
              , osname: 'Sailfish OS'
              , sailfish: t
              , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
            }
          }
          else if (/seamonkey\//i.test(ua)) {
            result = {
              name: 'SeaMonkey'
              , seamonkey: t
              , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
            }
          }
          else if (/firefox|iceweasel|fxios/i.test(ua)) {
            result = {
              name: 'Firefox'
              , firefox: t
              , version: getFirstMatch(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)
            }
            if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
              result.firefoxos = t
              result.osname = 'Firefox OS'
            }
          }
          else if (silk) {
            result = {
              name: 'Amazon Silk'
              , silk: t
              , version: getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
            }
          }
          else if (/phantom/i.test(ua)) {
            result = {
              name: 'PhantomJS'
              , phantom: t
              , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
            }
          }
          else if (/slimerjs/i.test(ua)) {
            result = {
              name: 'SlimerJS'
              , slimer: t
              , version: getFirstMatch(/slimerjs\/(\d+(\.\d+)?)/i)
            }
          }
          else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
            result = {
              name: 'BlackBerry'
              , osname: 'BlackBerry OS'
              , blackberry: t
              , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
            }
          }
          else if (webos) {
            result = {
              name: 'WebOS'
              , osname: 'WebOS'
              , webos: t
              , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
            };
            /touchpad\//i.test(ua) && (result.touchpad = t)
          }
          else if (/bada/i.test(ua)) {
            result = {
              name: 'Bada'
              , osname: 'Bada'
              , bada: t
              , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
            };
          }
          else if (tizen) {
            result = {
              name: 'Tizen'
              , osname: 'Tizen'
              , tizen: t
              , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
            };
          }
          else if (/qupzilla/i.test(ua)) {
            result = {
              name: 'QupZilla'
              , qupzilla: t
              , version: getFirstMatch(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i) || versionIdentifier
            }
          }
          else if (/chromium/i.test(ua)) {
            result = {
              name: 'Chromium'
              , chromium: t
              , version: getFirstMatch(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i) || versionIdentifier
            }
          }
          else if (/chrome|crios|crmo/i.test(ua)) {
            result = {
              name: 'Chrome'
              , chrome: t
              , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
            }
          }
          else if (android) {
            result = {
              name: 'Android'
              , version: versionIdentifier
            }
          }
          else if (/safari|applewebkit/i.test(ua)) {
            result = {
              name: 'Safari'
              , safari: t
            }
            if (versionIdentifier) {
              result.version = versionIdentifier
            }
          }
          else if (iosdevice) {
            result = {
              name: iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
            }
            // WTF: version is not part of user agent in web apps
            if (versionIdentifier) {
              result.version = versionIdentifier
            }
          }
          else if (/googlebot/i.test(ua)) {
            result = {
              name: 'Googlebot'
              , googlebot: t
              , version: getFirstMatch(/googlebot\/(\d+(\.\d+))/i) || versionIdentifier
            }
          }
          else {
            result = {
              name: getFirstMatch(/^(.*)\/(.*) /),
              version: getSecondMatch(/^(.*)\/(.*) /)
            };
          }

          // set webkit or gecko flag for browsers based on these engines
          if (!result.msedge && /(apple)?webkit/i.test(ua)) {
            if (/(apple)?webkit\/537\.36/i.test(ua)) {
              result.name = result.name || "Blink"
              result.blink = t
            } else {
              result.name = result.name || "Webkit"
              result.webkit = t
            }
            if (!result.version && versionIdentifier) {
              result.version = versionIdentifier
            }
          } else if (!result.opera && /gecko\//i.test(ua)) {
            result.name = result.name || "Gecko"
            result.gecko = t
            result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i)
          }

          // set OS flags for platforms that have multiple browsers
          if (!result.windowsphone && (android || result.silk)) {
            result.android = t
            result.osname = 'Android'
          } else if (!result.windowsphone && iosdevice) {
            result[iosdevice] = t
            result.ios = t
            result.osname = 'iOS'
          } else if (mac) {
            result.mac = t
            result.osname = 'macOS'
          } else if (xbox) {
            result.xbox = t
            result.osname = 'Xbox'
          } else if (windows) {
            result.windows = t
            result.osname = 'Windows'
          } else if (linux) {
            result.linux = t
            result.osname = 'Linux'
          }

          function getWindowsVersion(s) {
            switch (s) {
              case 'NT': return 'NT'
              case 'XP': return 'XP'
              case 'NT 5.0': return '2000'
              case 'NT 5.1': return 'XP'
              case 'NT 5.2': return '2003'
              case 'NT 6.0': return 'Vista'
              case 'NT 6.1': return '7'
              case 'NT 6.2': return '8'
              case 'NT 6.3': return '8.1'
              case 'NT 10.0': return '10'
              default: return undefined
            }
          }

          // OS version extraction
          var osVersion = '';
          if (result.windows) {
            osVersion = getWindowsVersion(getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i))
          } else if (result.windowsphone) {
            osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
          } else if (result.mac) {
            osVersion = getFirstMatch(/Mac OS X (\d+([_\.\s]\d+)*)/i);
            osVersion = osVersion.replace(/[_\s]/g, '.');
          } else if (iosdevice) {
            osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
            osVersion = osVersion.replace(/[_\s]/g, '.');
          } else if (android) {
            osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
          } else if (result.webos) {
            osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
          } else if (result.blackberry) {
            osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
          } else if (result.bada) {
            osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
          } else if (result.tizen) {
            osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
          }
          if (osVersion) {
            result.osversion = osVersion;
          }

          // device type extraction
          var osMajorVersion = !result.windows && osVersion.split('.')[0];
          if (
            tablet
            || nexusTablet
            || iosdevice == 'ipad'
            || (android && (osMajorVersion == 3 || (osMajorVersion >= 4 && !mobile)))
            || result.silk
          ) {
            result.tablet = t
          } else if (
            mobile
            || iosdevice == 'iphone'
            || iosdevice == 'ipod'
            || android
            || nexusMobile
            || result.blackberry
            || result.webos
            || result.bada
          ) {
            result.mobile = t
          }

          // Graded Browser Support
          // http://developer.yahoo.com/yui/articles/gbs
          if (result.msedge ||
            (result.msie && result.version >= 10) ||
            (result.yandexbrowser && result.version >= 15) ||
            (result.vivaldi && result.version >= 1.0) ||
            (result.chrome && result.version >= 20) ||
            (result.samsungBrowser && result.version >= 4) ||
            (result.whale && compareVersions([result.version, '1.0']) === 1) ||
            (result.mzbrowser && compareVersions([result.version, '6.0']) === 1) ||
            (result.focus && compareVersions([result.version, '1.0']) === 1) ||
            (result.firefox && result.version >= 20.0) ||
            (result.safari && result.version >= 6) ||
            (result.opera && result.version >= 10.0) ||
            (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
            (result.blackberry && result.version >= 10.1)
            || (result.chromium && result.version >= 20)
          ) {
            result.a = t;
          }
          else if ((result.msie && result.version < 10) ||
            (result.chrome && result.version < 20) ||
            (result.firefox && result.version < 20.0) ||
            (result.safari && result.version < 6) ||
            (result.opera && result.version < 10.0) ||
            (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
            || (result.chromium && result.version < 20)
          ) {
            result.c = t
          } else result.x = t

          return result
        }

        var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent || '' : '')

        bowser.test = function (browserList) {
          for (var i = 0; i < browserList.length; ++i) {
            var browserItem = browserList[i];
            if (typeof browserItem === 'string') {
              if (browserItem in bowser) {
                return true;
              }
            }
          }
          return false;
        }

        /**
         * Get version precisions count
         *
         * @example
         *   getVersionPrecision("1.10.3") // 3
         *
         * @param  {string} version
         * @return {number}
         */
        function getVersionPrecision(version) {
          return version.split(".").length;
        }

        /**
         * Array::map polyfill
         *
         * @param  {Array} arr
         * @param  {Function} iterator
         * @return {Array}
         */
        function map(arr, iterator) {
          var result = [], i;
          if (Array.prototype.map) {
            return Array.prototype.map.call(arr, iterator);
          }
          for (i = 0; i < arr.length; i++) {
            result.push(iterator(arr[i]));
          }
          return result;
        }

        /**
         * Calculate browser version weight
         *
         * @example
         *   compareVersions(['1.10.2.1',  '1.8.2.1.90'])    // 1
         *   compareVersions(['1.010.2.1', '1.09.2.1.90']);  // 1
         *   compareVersions(['1.10.2.1',  '1.10.2.1']);     // 0
         *   compareVersions(['1.10.2.1',  '1.0800.2']);     // -1
         *
         * @param  {Array<String>} versions versions to compare
         * @return {Number} comparison result
         */
        function compareVersions(versions) {
          // 1) get common precision for both versions, for example for "10.0" and "9" it should be 2
          var precision = Math.max(getVersionPrecision(versions[0]), getVersionPrecision(versions[1]));
          var chunks = map(versions, function (version) {
            var delta = precision - getVersionPrecision(version);

            // 2) "9" -> "9.0" (for precision = 2)
            version = version + new Array(delta + 1).join(".0");

            // 3) "9.0" -> ["000000000"", "000000009"]
            return map(version.split("."), function (chunk) {
              return new Array(20 - chunk.length).join("0") + chunk;
            }).reverse();
          });

          // iterate in reverse order by reversed chunks array
          while (--precision >= 0) {
            // 4) compare: "000000009" > "000000010" = false (but "9" > "10" = true)
            if (chunks[0][precision] > chunks[1][precision]) {
              return 1;
            }
            else if (chunks[0][precision] === chunks[1][precision]) {
              if (precision === 0) {
                // all version chunks are same
                return 0;
              }
            }
            else {
              return -1;
            }
          }
        }

        /**
         * Check if browser is unsupported
         *
         * @example
         *   bowser.isUnsupportedBrowser({
         *     msie: "10",
         *     firefox: "23",
         *     chrome: "29",
         *     safari: "5.1",
         *     opera: "16",
         *     phantom: "534"
         *   });
         *
         * @param  {Object}  minVersions map of minimal version to browser
         * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
         * @param  {String}  [ua] user agent string
         * @return {Boolean}
         */
        function isUnsupportedBrowser(minVersions, strictMode, ua) {
          var _bowser = bowser;

          // make strictMode param optional with ua param usage
          if (typeof strictMode === 'string') {
            ua = strictMode;
            strictMode = void (0);
          }

          if (strictMode === void (0)) {
            strictMode = false;
          }
          if (ua) {
            _bowser = detect(ua);
          }

          var version = "" + _bowser.version;
          for (var browser in minVersions) {
            if (minVersions.hasOwnProperty(browser)) {
              if (_bowser[browser]) {
                if (typeof minVersions[browser] !== 'string') {
                  throw new Error('Browser version in the minVersion map should be a string: ' + browser + ': ' + String(minVersions));
                }

                // browser version and min supported version.
                return compareVersions([version, minVersions[browser]]) < 0;
              }
            }
          }

          return strictMode; // not found
        }

        /**
         * Check if browser is supported
         *
         * @param  {Object} minVersions map of minimal version to browser
         * @param  {Boolean} [strictMode = false] flag to return false if browser wasn't found in map
         * @param  {String}  [ua] user agent string
         * @return {Boolean}
         */
        function check(minVersions, strictMode, ua) {
          return !isUnsupportedBrowser(minVersions, strictMode, ua);
        }

        bowser.isUnsupportedBrowser = isUnsupportedBrowser;
        bowser.compareVersions = compareVersions;
        bowser.check = check;

        /*
         * Set our detect method to the main bowser object so we can
         * reuse it to test other user agents.
         * This is needed to implement future tests.
         */
        bowser._detect = detect;

        /*
         * Set our detect public method to the main bowser object
         * This is needed to implement bowser in server side
         */
        bowser.detect = detect;
        return bowser
      });

    }, {}], "main": [function (require, module, exports) {
      var Helpers = require('./helpers')
      var App = require('./app');
      var polyfills = require('./polyfills');

      polyfills.applyPolyfills();

      var instance;

      module.exports = (function () {
        var getInstance = function () {
          if (!instance) {
            instance = new App();
          }
          return instance;
        };

        return Object.assign(Helpers.zipObject(['init', 'open', 'close', 'on', 'off', 'sendMessage', 'onMessage'].map(function (methodName) {
          var app = getInstance();
          return [methodName, function () {
            return app[methodName].apply(app, arguments);
          }];
        })), {
          eventTypes: App.eventTypes,
        });
      })();

    }, { "./app": 3, "./helpers": 7, "./polyfills": 9 }]
  }, {}, ["main"])("main")
});

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY3NzaWZ5L2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvc2Fzc2lmeS9saWIvc2Fzc2lmeS1icm93c2VyLmpzIiwic3JjL2FwcC5qcyIsInNyYy9jaGlsZHdpbmRvdy5qcyIsInNyYy9kZXZpY2UuanMiLCJzcmMvZXhjZXB0aW9uLmpzIiwic3JjL2hlbHBlcnMuanMiLCJzcmMvbGlnaHRib3guanMiLCJzcmMvcG9seWZpbGxzLmpzIiwic3JjL3Bvc3RtZXNzYWdlLmpzIiwic3JjL3NwaW5uZXJzL3JvdW5kLnN2ZyIsInNyYy9zcGlubmVycy94c29sbGEuc3ZnIiwic3JjL3N0eWxlcy9saWdodGJveC5zY3NzIiwic3JjL3ZlcnNpb24uanMiLCJib3dlcl9jb21wb25lbnRzL2Jvd3Nlci9zcmMvYm93c2VyLmpzIiwic3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2pUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0F