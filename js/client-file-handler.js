window.ClientFileHandler = (function(){

    function ClientFileHandler(opts){
        return this.init(opts);
    }

    ClientFileHandler.typeFilters = {
        all: /.*/,
        application: /^application\/.*/,
        audio: /^audio\/.*/,
        image: /^image\/.*/,
        imageWeb: /^image\/(jpeg|png|gif)$/,
        text: /^text\/.*/,
        video: /^video\/.*/
    };

    ClientFileHandler.prototype.defaults = {
        fileTypeFilter: ClientFileHandler.typeFilters.all, //specify a regex or use one of the built in typeFilters
        fileCountLimit: Infinity, //How many files can a user upload at once? This will limit it to the first n files,
        fileSizeLimit: 20 * 1024 * 1024, //Maximum file size in bytes (20MB per file),
        onSuccess: $.noop,
        onError: $.noop
    };

    ClientFileHandler.prototype.init = function(opts){
        this.options = $.extend({}, this.defaults, opts);

        if (opts && !opts.fileSizeLimit) {
            this.options.fileSizeLimit = this.defaults.fileSizeLimit;
        }
        if (opts && !opts.fileCountLimit) {
            this.options.fileCountLimit = this.defaults.fileCountLimit;
        }

        _.bindAll(this, 'handleFiles', 'filterFiles');

        return this;
    };

    /**
     * Takes in an array of files, processes them, and fires the onSuccess handler if any are valid, or the onError handler
     * otherwise. These handlers can be specified on the options object passed to the constructor.
     * @param fileList array of objects like { size:Number, type:String }
     * @param fileSourceElem - Unused. Matches IframeUploader interface
     */
    ClientFileHandler.prototype.handleFiles = function(fileList, fileSourceElem){
        //Assumes any number of files > 0 is a success, else it's an error
        var filteredFiles = this.filterFiles(fileList);

        if (filteredFiles.valid.length > 0) {
            //There was at least one valid file
            _.isFunction(this.options.onSuccess) && this.options.onSuccess(filteredFiles.valid);
        } else {
            //there were no valid files added
            _.isFunction(this.options.onError) && this.options.onError(filteredFiles.invalid);
        }
    };

    ClientFileHandler.prototype.filterFiles = function(fileList){
        var fileTypeFilter = _.isRegExp(this.options.fileTypeFilter) ? this.options.fileTypeFilter : this.defaults.fileTypeFilter,
            fileSizeLimit = this.options.fileSizeLimit,
            invalid = {
                byType: [],
                bySize: [],
                byCount: []
            },
            valid = _.filter(fileList, function(file){

                if (!fileTypeFilter.test(file.type)) {
                    invalid.byType.push(file);
                    return false;
                }

                if (file.size > fileSizeLimit) {
                    invalid.bySize.push(file);
                    return false;
                }

                return true;
            });

        if (valid.length > this.options.fileCountLimit) {
            invalid.byCount = valid.slice(this.options.fileCountLimit);
            valid = valid.slice(0, this.options.fileCountLimit);
        }

        return {
            valid: valid,
            invalid: invalid
        };
    };

    return ClientFileHandler;

})();
