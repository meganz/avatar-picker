window.UploadInterceptor = (function(){

    function UploadInterceptor(el, opts){
        return this.init.apply(this, arguments);
    }

    UploadInterceptor.prototype.defaults = {
        replacementEl: undefined,
        clientFileHandler: null
    };

    UploadInterceptor.prototype.init = function(el, opts) {
        _.bindAll(this, 'onSelectFile', 'onReplacementClick');

        this.$el = $(el);
        this.options = $.extend({}, this.defaults, opts);

        this.$el.on('change', this.onSelectFile);

        if (this.options.replacementEl) {
            this.$replacement = $(this.options.replacementEl);
            this.$el.hide();

            // IE marks a file input as compromised if has a click triggered programmatically
            // and this prevents you from later submitting it's form via Javascript.
            // The work around is to use a label as the replacementEl with the `for` set to the file input,
            // but it requires that the click handler below not be bound. So regardless of whether you want
            // to use the workaround or not, the handler should not be bound in IE.
            if ($.browser && $.browser.msie) {
                if (!this.$replacement.is('label')) {
                    // Workaround is not being used, fallback to showing the regular file element and hide the replacement
                    this.$replacement.hide();
                    this.$el.show();
                }
            } else {
                this.$replacement.on('click', this.onReplacementClick);
            }
        }
    };

    UploadInterceptor.prototype.onSelectFile = function(e){
        if ($(e.target).val() && this.options.clientFileHandler) {
            this.options.clientFileHandler.handleFiles(e.target.files, this.$el);
        }
    };

    UploadInterceptor.prototype.onReplacementClick = function(e){
        e.preventDefault();
        this.$el.click();
    };

    UploadInterceptor.prototype.destroy = function(){
        this.$el.off('change', this.onSelectFile);
        this.$replacement.off('click', this.onReplacementClick);
    };

    return UploadInterceptor;
})();