/**
 * @fileoverview Base class for layers
 * @author NHN Ent. FE Development Team
 */
'use strict';

var View = require('../base/view');

/**
 * Base class for layers
 * @module view/layer
 */
var Layer = View.extend(/**@lends module:view/layer.prototype */{
    /**
     * @constructs
     * @extends module:base/view
     */
    initialize: function() {
        View.prototype.initialize.apply(this, arguments);
        this.setOwnProperties({
            text: '기본 텍스트'
        });
        this.listenTo(this.grid.dimensionModel, 'change', this._resize, this);
    },

    template: _.template('' +
        '<div>' +
        '    <%=text%>' +
        '    <div class="loading_img"></div>' +
        '</div>'),

    /**
     * 랜더링 한다.
     * @param {String} text 레이어에 노출할 text
     * @return {View.Layer.Base} this object
     */
    render: function(text) {
        this.$el.html(this.template({
            text: text || this.text
        })).css('display', 'none');
        return this;
    },

    /**
     * Layer를 노출한다.
     * @param {String} text 레이어에 노출할 text
     */
    show: function(text) {
        this.render(text).$el.css('display', 'block')
            .css('zIndex', 1);
        this._resize();
    },

    /**
     * Layer 를 감춘다.
     */
    hide: function() {
        this.$el.css('display', 'none');
    },

    /**
     * 그리드의 크기에 맞추어 resize 한다.
     * @private
     */
    _resize: function() {
        var headerHeight, bodyHeight;

        if (this.$el.css('display') === 'block') {
            headerHeight = this.grid.dimensionModel.get('headerHeight');
            bodyHeight = this.grid.dimensionModel.get('bodyHeight');

            this.$el.css('marginTop', headerHeight + 'px')
                .css('height', bodyHeight + 'px');
        }
    }
});

module.exports = Layer;