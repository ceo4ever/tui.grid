tui.util.defineNamespace("fedoc.content", {});
fedoc.content["view_layout_resizeHandler.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview ResizeHandler for the Header\n * @author NHN Ent. FE Development Team\n */\n'use strict';\n\nvar View = require('../../base/view');\nvar attrNameConst = require('../../common/constMap').attrName;\nvar classNameConst = require('../../common/classNameConst');\nvar CELL_BORDER_WIDTH = require('../../common/constMap').dimension.CELL_BORDER_WIDTH;\n\n/**\n * Reside Handler class\n * @module view/layout/resizeHandler\n * @extends module:base/view\n */\nvar ResizeHandler = View.extend(/**@lends module:view/layout/resizeHandler.prototype */{\n    /**\n     * @constructs\n     * @param {Object} options - Options\n     */\n    initialize: function(options) {\n        this.setOwnProperties({\n            dimensionModel: options.dimensionModel,\n            columnModel: options.columnModel,\n            whichSide: options.whichSide || 'R',\n\n            isResizing: false,\n            $target: null,\n            differenceLeft: 0,\n            initialWidth: 0,\n            initialOffsetLeft: 0,\n            initialLeft: 0\n        });\n\n        this.listenTo(this.dimensionModel, 'change:which columnWidthChanged', this._refreshHandlerPosition);\n    },\n\n    className: classNameConst.COLUMN_RESIZE_CONTAINER,\n\n    events: function() {\n        var eventHash = {};\n\n        eventHash['mousedown .' + classNameConst.COLUMN_RESIZE_HANDLE] = '_onMouseDown';\n        eventHash['dblclick .' + classNameConst.COLUMN_RESIZE_HANDLE] = '_onDblClick';\n\n        return eventHash;\n    },\n\n    template: _.template(\n        '&lt;div ' +\n        attrNameConst.COLUMN_INDEX + '=\"&lt;%=columnIndex%>\" ' +\n        attrNameConst.COLUMN_NAME + '=\"&lt;%=columnName%>\" ' +\n        'class=\"' + classNameConst.COLUMN_RESIZE_HANDLE + ' &lt;%=lastClass%>\" ' +\n        'style=\"&lt;%=height%>\" ' +\n        'title=\"마우스 드래그를 통해 컬럼의 넓이를 변경할 수 있고,더블클릭을 통해 넓이를 초기화할 수 있습니다.\">' +\n        '&lt;/div>'\n    ),\n\n    /**\n     * Return an object that contains an array of column width and an array of column model.\n     * @returns {{widthList: (Array|*), modelList: (Array|*)}} Column Data\n     * @private\n     */\n    _getColumnData: function() {\n        var columnModel = this.columnModel;\n        var dimensionModel = this.dimensionModel;\n        var columnWidthList = dimensionModel.getColumnWidthList(this.whichSide);\n        var columnModelList = columnModel.getVisibleColumnModelList(this.whichSide, true);\n\n        return {\n            widthList: columnWidthList,\n            modelList: columnModelList\n        };\n    },\n\n    /**\n     * Returns the HTML string of all handler.\n     * @returns {String}\n     * @private\n     */\n    _getResizeHandlerMarkup: function() {\n        var columnData = this._getColumnData();\n        var columnModelList = columnData.modelList;\n        var headerHeight = this.dimensionModel.get('headerHeight');\n        var length = columnModelList.length;\n        var resizeHandleMarkupList = _.map(columnModelList, function(columnModel, index) {\n            return this.template({\n                lastClass: (index + 1 === length) ? classNameConst.COLUMN_RESIZE_HANDLE_LAST : '',\n                columnIndex: index,\n                columnName: columnModel.columnName,\n                height: headerHeight\n            });\n        }, this);\n\n        return resizeHandleMarkupList.join('');\n    },\n\n    /**\n     * Render\n     * @returns {module:view/layout/resizeHandler} This object\n     */\n    render: function() {\n        var headerHeight = this.dimensionModel.get('headerHeight'),\n            htmlStr = this._getResizeHandlerMarkup();\n\n        this.$el.empty().show().html(htmlStr).css({\n            marginTop: -headerHeight,\n            height: headerHeight\n        });\n        this._refreshHandlerPosition();\n\n        return this;\n    },\n\n    /**\n     * Refresh the position of every handler.\n     * @private\n     */\n    _refreshHandlerPosition: function() {\n        var columnData = this._getColumnData();\n        var columnWidthList = columnData.widthList;\n        var $resizeHandleList = this.$el.find('.' + classNameConst.COLUMN_RESIZE_HANDLE);\n        var curPos = 0;\n\n        tui.util.forEachArray($resizeHandleList, function(item, index) {\n            var $handler = $resizeHandleList.eq(index);\n            var handlerWidthHalf = Math.ceil($handler.width() / 2);\n\n            curPos += columnWidthList[index] + CELL_BORDER_WIDTH;\n            $handler.css('left', curPos - handlerWidthHalf);\n        });\n    },\n\n    /**\n     * Returns whether resizing is in progress or not.\n     * @returns {boolean}\n     * @private\n     */\n    _isResizing: function() {\n        return !!this.isResizing;\n    },\n\n    /**\n     * Event handler for the 'mousedown' event\n     * @param {MouseEvent} mouseEvent - mouse event\n     * @private\n     */\n    _onMouseDown: function(mouseEvent) {\n        this._startResizing($(mouseEvent.target));\n    },\n\n    /**\n     * Event handler for the 'dblclick' event\n     * @param {MouseEvent} mouseEvent - mouse event\n     * @private\n     */\n    _onDblClick: function(mouseEvent) {\n        var $target = $(mouseEvent.target);\n        var index = parseInt($target.attr(attrNameConst.COLUMN_INDEX), 10);\n\n        this.dimensionModel.restoreColumnWidth(this._getHandlerColumnIndex(index));\n        this._refreshHandlerPosition();\n    },\n\n    /**\n     * Event handler for the 'mouseup' event\n     * @private\n     */\n    _onMouseUp: function() {\n        this._stopResizing();\n    },\n\n    /**\n     * Event handler for the 'mousemove' event\n     * @param {MouseEvent} mouseEvent - mouse event\n     * @private\n     */\n    _onMouseMove: function(mouseEvent) {\n        var left, width, index;\n\n        if (this._isResizing()) {\n            mouseEvent.preventDefault();\n\n            left = mouseEvent.pageX - this.initialOffsetLeft;\n            width = this._calculateWidth(mouseEvent.pageX);\n            index = parseInt(this.$target.attr(attrNameConst.COLUMN_INDEX), 10);\n\n            this.$target.css('left', left);\n            this.dimensionModel.setColumnWidth(this._getHandlerColumnIndex(index), width);\n            this._refreshHandlerPosition();\n        }\n    },\n\n    /**\n     * Returns the width of the column based on given mouse position and the initial offset.\n     * @param {number} pageX - mouse x position\n     * @returns {number}\n     * @private\n     */\n    _calculateWidth: function(pageX) {\n        var difference = pageX - this.initialOffsetLeft - this.initialLeft;\n        return this.initialWidth + difference;\n    },\n\n    /**\n     * Find the real index (based on visibility) of the column using index value of the handler and returns it.\n     * @param {number} index - index value of the handler\n     * @returns {number}\n     * @private\n     */\n    _getHandlerColumnIndex: function(index) {\n        return (this.whichSide === 'R') ? (index + this.columnModel.getVisibleColumnFixCount(true)) : index;\n    },\n\n    /**\n     * Start resizing\n     * @param {jQuery} $target - target element\n     * @private\n     */\n    _startResizing: function($target) {\n        var columnData = this._getColumnData();\n        var columnWidthList = columnData.widthList;\n\n        this.isResizing = true;\n        this.$target = $target;\n        this.initialLeft = parseInt($target.css('left').replace('px', ''), 10);\n        this.initialOffsetLeft = this.$el.offset().left;\n        this.initialWidth = columnWidthList[$target.attr(attrNameConst.COLUMN_INDEX)];\n        $('body').css('cursor', 'col-resize');\n        $(document)\n            .bind('mousemove', $.proxy(this._onMouseMove, this))\n            .bind('mouseup', $.proxy(this._onMouseUp, this));\n\n        // for IE8 and under\n        if ($target[0].setCapture) {\n            $target[0].setCapture();\n        }\n    },\n\n    /**\n     * Stop resizing\n     * @private\n     */\n    _stopResizing: function() {\n        // for IE8 and under\n        if (this.$target &amp;&amp; this.$target[0].releaseCapture) {\n            this.$target[0].releaseCapture();\n        }\n\n        this.isResizing = false;\n        this.$target = null;\n        this.initialLeft = 0;\n        this.initialOffsetLeft = 0;\n        this.initialWidth = 0;\n\n        $('body').css('cursor', 'default');\n        $(document)\n            .unbind('mousemove', $.proxy(this._onMouseMove, this))\n            .unbind('mouseup', $.proxy(this._onMouseUp, this));\n    },\n\n    /**\n     * Destroy\n     */\n    destroy: function() {\n        this.stopListening();\n        this._stopResizing();\n        this.remove();\n    }\n});\n\nmodule.exports = ResizeHandler;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"