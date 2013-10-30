window.ClientFileIframeUploader = (function(){
    function ClientFileIframeUploader(opts){
        return this.init(opts);
    }

    $.extend(ClientFileIframeUploader.prototype, ClientFileHandler.prototype);

    ClientFileIframeUploader.prototype.defaults = $.extend({}, ClientFileHandler.prototype.defaults, {
        uploadURL: '',
        uploadFieldName: 'file',
        onUpload: $.noop,
        responseHandler: function(iframeBody, uploadPromise){
            //Assumes success response is a HTML document with well formed JSON in the body. Rejects the upload otherwise
            var jsonResponse;

            try {
                jsonResponse = JSON.parse($(iframeBody).html());
            } catch(e) {
                uploadPromise.reject();
            }

            if (jsonResponse) {
                uploadPromise.resolve(jsonResponse);
            } else {
                uploadPromise.reject();
            }
        }
    });

    ClientFileIframeUploader.prototype.states = {
        IN_PROGRESS: 'IN_PROGRESS',
        IDLE: 'IDLE'
    };

    ClientFileIframeUploader.prototype.init = function(opts){
        _.bindAll(this, 'createHiddenIframe', 'onIframeLoad', 'handleFiles', 'setStateInProgress', 'setStateIdle', 'cancelUpload');
        this.options = $.extend({}, this.defaults, opts);
        this.$uploadIframe = this.createHiddenIframe();

        if (this.options.cancelTrigger) {
            this.$cancelTrigger = $(this.options.cancelTrigger);
            this.$cancelTrigger.click(_.bind(function(){
                this.cancelUpload();
            }, this));
        }
        this.state = this.states.IDLE;
        return this;
    };

    ClientFileIframeUploader.prototype.createHiddenIframe = function(){
        return $("<iframe>")
            .attr('name', 'hidden-upload-iframe')
            .hide()
            .appendTo(document.body)
            .on('load', this.onIframeLoad);
    };

    ClientFileIframeUploader.prototype.onIframeLoad = function(e){
        if (this.state === this.states.IN_PROGRESS) {
            this.requestPromise
                .done(this.options.onUpload)
                .fail(this.options.onError);

            //the responseHandler must parse the response and resolve the promise
            this.options.responseHandler(e.target.contentDocument.body, this.requestPromise);
        }
    };

    ClientFileIframeUploader.prototype.handleFiles = function(fileList, fileSourceElem){
        if (this.state === this.states.IN_PROGRESS) {
            //Cancel the existing request first.
            this.cancelUpload();
        }

        if (!this.$fileSourceElem) {
            this.$fileSourceElem = $(fileSourceElem);

            this.$fileSourceElem.attr('name', this.options.uploadFieldName);

            if (!this.$fileSourceElem.prop('form')) {
                this.$fileSourceElem.wrap('<form>');
            }

            var $uploadForm = $(this.$fileSourceElem.prop('form'));

            $uploadForm
                .addClass('hidden-upload-form')
                .attr("action", this.options.uploadURL)
                .attr("method", "post")
                .attr("enctype", "multipart/form-data")
                .attr("encoding", "multipart/form-data")
                .attr("target", this.$uploadIframe.attr('name'));

            this.$spinner = $('<div class="spinner"></div>').insertBefore(this.$fileSourceElem);

            if ($.isPlainObject(this.options.extraData)) {
                _.each(this.options.extraData, function(val, key){
                    $('<input type="hidden">')
                        .attr('name', key)
                        .val(val)
                        .appendTo($uploadForm);
                });
            }
        }

        this.$fileSourceElem.prop('form').submit();

        this.requestPromise = $.Deferred();
        this.requestPromise.always(this.setStateIdle);

        this.setStateInProgress();
    };

    ClientFileIframeUploader.prototype.setStateInProgress = function(){
        this.state = this.states.IN_PROGRESS;
        if (this.$spinner) {
            this.$spinner.spin();
        }
        if (this.$fileSourceElem) {
            this.$fileSourceElem.attr('disabled', 'disabled');
        }
    };

    ClientFileIframeUploader.prototype.setStateIdle = function(){
        this.state = this.states.IDLE;
        if (this.$spinner) {
            this.$spinner.spinStop();
        }
        if (this.$fileSourceElem) {
            this.$fileSourceElem.removeAttr('disabled');
        }
        this.requestPromise = null;
    };

    ClientFileIframeUploader.prototype.cancelUpload = function(){
        //Cancel the upload by removing the iframe.
        this.$uploadIframe.remove();
        this.setStateIdle();
        this.$uploadIframe = this.createHiddenIframe();
    };

    return ClientFileIframeUploader;
})();