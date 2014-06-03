window.ImageUploadAndCrop = (function(){

    function ImageUploadAndCrop($container, opts){
        if (!ImageUploadAndCrop.isSupported()) {
            throw new Error("This browser doesn't support ImageUploadAndCrop.");
        }
        this.init.apply(this, arguments);
    }

    ImageUploadAndCrop.isSupported = function() {
        return CanvasCropper.isSupported();
    };

    ImageUploadAndCrop.prototype.defaults = {
        HiDPIMultiplier: 2,  //The canvas crop size is multiplied by this to support HiDPI screens
        dragDropUploadPrompt: 'Drag and drop image here',
        onImageUpload: $.noop,
        onImageUploadError: $.noop,
        onCrop: $.noop,
        outputFormat: 'image/png',
        fallbackUploadOptions: {},
        initialScaleMode: ImageExplorer.scaleModes.containAndFill,
        scaleMax: 1,
        fileSizeLimit: 5 * 1024 * 1024, //5MB
        maxImageDimension: 2000 //In pixels
    };

    ImageUploadAndCrop.prototype.init = function($container, opts){
        this.options = $.extend({}, this.defaults, opts);
        this.$container = $container;

        _.bindAll(this, 'crop', 'resetState', '_onFileProcessed', 'setImageSrc', 'validateImageResolution', '_onFilesError',
            '_onFileError', '_resetFileUploadField', '_onErrorReset');

        this.imageExplorer = new ImageExplorer(this.$container.find('.image-explorer-container'), {
            initialScaleMode: this.options.initialScaleMode,
            scaleMax: this.options.scaleMax,
            onErrorReset: this._onErrorReset
        });

        if (ClientFileReader.isSupported()) {
            this.clientFileReader = new ClientFileReader({
                onRead: this._onFileProcessed,
                onError: this._onFilesError,
                fileTypeFilter: ClientFileReader.typeFilters.imageWeb,
                fileCountLimit: 1,
                fileSizeLimit: this.options.fileSizeLimit
            });

            //drag drop uploading is only possible in browsers that support the fileReaderAPI
            this.dragDropFileTarget = new DragDropFileTarget(this.imageExplorer.get$ImageView(), {
                uploadPrompt: this.options.dragDropUploadPrompt,
                clientFileHandler: this.clientFileReader
            });
        } else {
            //Fallback for older browsers. TODO: Client side filetype filtering?

            this.$container.addClass("filereader-unsupported");

            var fallbackOptions = $.extend({
                onUpload: this._onFileProcessed,
                onError: this._onFileError
            }, this.options.fallbackUploadOptions);

            this.clientFileReader = new ClientFileIframeUploader(fallbackOptions);
        }

        this.uploadIntercepter = new UploadInterceptor(this.$container.find('.image-upload-field'), {
            replacementEl: this.$container.find('.image-upload-field-replacement'),
            clientFileHandler: this.clientFileReader
        });

        var mask = this.imageExplorer.get$Mask();

        this.canvasCroppper = new CanvasCropper(
            mask.width() * this.options.HiDPIMultiplier,
            mask.height() * this.options.HiDPIMultiplier,
            {
                outputFormat: this.options.outputFormat
            }
        );

        this.options.cropButton && $(this.options.cropButton).click(this.crop);
    };

    ImageUploadAndCrop.prototype.crop = function(){
        var cropProperties = this.imageExplorer.getMaskedImageProperties(),
            croppedDataURI = this.canvasCroppper.cropToDataURI(
                this.imageExplorer.get$SourceImage()[0],
                cropProperties.maskedAreaImageX,
                cropProperties.maskedAreaImageY,
                cropProperties.maskedAreaWidth,
                cropProperties.maskedAreaHeight
            );

        _.isFunction(this.options.onCrop) && this.options.onCrop(croppedDataURI);
    };

    ImageUploadAndCrop.prototype.resetState = function(){
        this.imageExplorer.clearError();
        this._resetFileUploadField();
    };

    ImageUploadAndCrop.prototype._onFileProcessed = function(imageSrc){
        if (imageSrc){
            if (!isNaN(this.options.maxImageDimension)) {
                var validatePromise = this.validateImageResolution(imageSrc);

                validatePromise
                    .done(_.bind(function(imageWidth, imageHeight){
                        this.setImageSrc(imageSrc);
                    }, this))
                    .fail(_.bind(function(imageWidth, imageHeight){
                        this._onFileError('The selected image size is ' + imageWidth + 'px * ' + imageHeight + 'px. The maximum allowed image size is ' + this.options.maxImageDimension +
                            'px * ' + this.options.maxImageDimension + 'px');
                    }, this));
            } else {
                // If imageResolutionMax isn't valid, skip the validation and just set the image src.
                this.setImageSrc(imageSrc);
            }
        } else {
            this._onFileError();
        }
    };

    ImageUploadAndCrop.prototype.setImageSrc = function(imageSrc) {
        this.imageExplorer.setImageSrc(imageSrc);
        _.isFunction(this.options.onImageUpload) && this.options.onImageUpload(imageSrc);
        this._resetFileUploadField();
    };

    ImageUploadAndCrop.prototype.validateImageResolution = function(imageSrc){
        var validatePromise = $.Deferred(),
            tmpImage = new Image(),
            self = this;

        tmpImage.onload = function(){
            if (this.naturalWidth > self.options.maxImageDimension ||  this.naturalHeight > self.options.maxImageDimension) {
                validatePromise.reject(this.naturalWidth, this.naturalHeight);
            } else {
                validatePromise.resolve(this.naturalWidth, this.naturalHeight);
            }
        };

        tmpImage.src = imageSrc;

        return validatePromise;
    };

    ImageUploadAndCrop.prototype._onFilesError = function(invalidFiles) {
        // Work out the most appropriate error to display. Because drag and drop uploading can accept multiple files and we can't restrict this,
        // it's not an all or nothing situation, we need to try and find the most correct file and base the error on that.
        // If there was at least 1 valid file, then this wouldn't be called, so we don't need to worry about files rejected because of the fileCountLimit

        if (invalidFiles && invalidFiles.bySize && invalidFiles.bySize.length){
            //Some image files of the correct type were filtered because they were too big. Pick the first one to use as an example.
            var file = _.first(invalidFiles.bySize);
            this._onFileError('File "' + TextUtil.abbreviateText(file.name, 50) + '" is ' + TextUtil.formatSizeInBytes(file.size) +
                ' which is larger than the maximum allowed size of ' + TextUtil.formatSizeInBytes(this.options.fileSizeLimit));
        } else {
            //No files of the correct type were uploaded. The default error message will cover this.
            this._onFileError();
        }
    };

    ImageUploadAndCrop.prototype._onFileError = function(error){
        var title = 'There was an error uploading your image',
            contents = error || 'Please check that your file is a valid image and try again.';

        this.imageExplorer.showError(title, contents);
        this._resetFileUploadField();
        _.isFunction(this.options.onImageUploadError) && this.options.onImageUploadError(error);
    };

    ImageUploadAndCrop.prototype._resetFileUploadField = function(){
        //clear out the fileUpload field so the user could select the same file again to "reset" the imageExplorer
        var form = this.$container.find("#image-upload-and-crop-upload-field").prop('form');
        form && form.reset();
    };

    ImageUploadAndCrop.prototype._onErrorReset = function(imgSrc){
        //If we have a valid image after resetting from the error, notify the calling code.
        if (imgSrc) {
            _.isFunction(this.options.onImageUpload) && this.options.onImageUpload(imgSrc);
        }
    };

    return ImageUploadAndCrop;
})();