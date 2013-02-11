window.ImageExplorer = (function(){

    function ImageExplorer($container, opts){
        this.init.apply(this, arguments);
    }

    ImageExplorer.scaleModes = {
        fill: 'fill',
        contain: 'contain',
        containAndFill: 'containAndFill'
    };

    ImageExplorer.zoomModes = {
        localZoom: 'localZoom', //Keep the area under the mask centered so you zoom further in on the same location.
        imageZoom: 'imageZoom' //Keep the image centered in its current location, so unless the image is centered under the mask, the area under the mask will change.
    };

    ImageExplorer.prototype.defaults = {
        initialScaleMode: ImageExplorer.scaleModes.containAndFill,
        zoomMode: ImageExplorer.zoomModes.localZoom,
        emptyClass: 'empty',
        scaleMax: 1 //Maximum image size is 100% (is overridden by whatever the initial scale is calculated to be)
    };

    ImageExplorer.prototype.init = function($container, opts){
        this.$container      = $container;
        this.$imageView      = this.$container.find('.image-explorer-image-view');
        this.$sourceImage    = this.$container.find('.image-explorer-source');
        this.$mask           = this.$container.find('.image-explorer-mask');
        this.$dragDelegate   = this.$container.find('.image-explorer-drag-delegate');
        this.$scaleSlider    = this.$container.find('.image-explorer-scale-slider');
        this.options         = $.extend({}, this.defaults, opts);
        this.imageProperties = {};

        _.bindAll(this);

        this.toggleEmpty(true); //assume the explorer is empty initially and override below if otherwise

        if (this.$sourceImage[0].naturalWidth) {
            //The image has already loaded (most likely because the src was specified in the html),
            //so remove the empty class and call initImage passing through a fake event object with the target
            this.toggleEmpty(false);

            this.initImage({
                target:this.$sourceImage[0]
            });
        }

        this.$sourceImage.on('load', this.initImage);

        this.initDragDelegate();
        this.initScaleSlider();
    };

    ImageExplorer.prototype.getImageSrc = function(){
        return (this.$sourceImage) ? this.$sourceImage.attr('src') : undefined;
    };

    ImageExplorer.prototype.setImageSrc = function(src){
        if (this.$sourceImage) {
            this.$sourceImage.attr('src', '').attr('src', src); //Force image to reset if the user uploads the same image
        }
    };

    ImageExplorer.prototype.initImage = function(e){
        var image = e.target;
        this.imageProperties.naturalWidth = image.naturalWidth;
        this.imageProperties.naturalHeight = image.naturalHeight;

        this._removeError();
        this.toggleEmpty(false);
        this.setInitialScale();
    };

    ImageExplorer.prototype.initDragDelegate = function(){
        var imageOffset;

        this.$dragDelegate.draggable({
            start: _.bind(function(){
                imageOffset = this.$sourceImage.offset();
            }, this),
            drag: _.bind(function(e, ui){
                this.$sourceImage.offset({
                    top: imageOffset.top + ui.position.top - ui.originalPosition.top,
                    left: imageOffset.left + ui.position.left - ui.originalPosition.left
                });
            }, this),
            revert: true,
            revertDuration: 0
        });
    };

    ImageExplorer.prototype.initScaleSlider = function(){
        this.$scaleSlider.on('change', _.bind(function(e){
            this.updateImageScale(this.sliderValToScale(e.target.value));
        }, this));
    };

    ImageExplorer.prototype.setInitialScale = function(){
        var maskWidth = this.$mask.width(),
            maskHeight =this.$mask.height(),
            naturalWidth = this.imageProperties.naturalWidth,
            naturalHeight = this.imageProperties.naturalHeight,
            initialScale = 1;

        this.minScale = 1;

        switch(this.options.initialScaleMode) {
            case ImageExplorer.scaleModes.fill:
                //sets the scale of the image to the smallest size possible that completely fills the mask.
                this.minScale = initialScale = this.getFillScale(naturalWidth, naturalHeight, maskWidth, maskHeight);
            break;

            case ImageExplorer.scaleModes.contain:
                //Sets the scale of the image so that the entire image is visible inside the mask.
                if (this.$mask.hasClass('circle-mask')) {
                    this.minScale = initialScale = this.getCircularContainedScale(naturalWidth, naturalHeight, maskWidth / 2);
                } else {
                    this.minScale = initialScale = this.getContainedScale(naturalWidth, naturalHeight, maskWidth, maskHeight);
                }
            break;

            case ImageExplorer.scaleModes.containAndFill:
                //Set the min scale so that the lower bound is the same as scaleModes.contain, but the initial scale is scaleModes.fill
                if (this.$mask.hasClass('circle-mask')) {
                    this.minScale = this.getCircularContainedScale(naturalWidth, naturalHeight, maskWidth / 2);
                } else {
                    this.minScale = this.getContainedScale(naturalWidth, naturalHeight, maskWidth, maskHeight);
                }

                initialScale = this.getFillScale(naturalWidth, naturalHeight, maskWidth, maskHeight);
            break;
        }

        this.maxScale = Math.max(initialScale, this.options.scaleMax);
        this.resetScaleSlider(this.scaleToSliderVal(initialScale));
        //Always use ImageExplorer.zoomModes.imageZoom when setting the initial scale to center the image.
        this.updateImageScale(initialScale, ImageExplorer.zoomModes.imageZoom);
        this.resetImagePosition();
    };

    ImageExplorer.prototype.getFillScale = function(imageWidth, imageHeight, constraintWidth, constraintHeight){
        var widthRatio = constraintWidth / imageWidth,
            heightRatio = constraintHeight / imageHeight;
        return Math.max(widthRatio, heightRatio);
    };

    ImageExplorer.prototype.getContainedScale = function(imageWidth, imageHeight, constraintWidth, constraintHeight){
        var widthRatio = constraintWidth / imageWidth,
            heightRatio = constraintHeight / imageHeight;
        return Math.min(widthRatio, heightRatio);
    };

    ImageExplorer.prototype.getCircularContainedScale = function(imageWidth, imageHeight, constraintRadius){
        var theta = Math.atan(imageHeight / imageWidth),
            scaledWidth = Math.cos(theta) * constraintRadius * 2;
            //Math.cos(theta) * constraintRadius gives the width from the centre of the circle to one edge so we need to double it.
        return scaledWidth / imageWidth;
    };

    ImageExplorer.prototype.sliderValToScale = function(sliderValue) {
        var sliderValAsUnitInterval = sliderValue / (this.$scaleSlider.attr('max') - this.$scaleSlider.attr('min'));
        //http://math.stackexchange.com/questions/2489/is-there-a-name-for-0-1 (was tempted to use sliderValAsWombatNumber)
        return this.minScale + (sliderValAsUnitInterval * (this.maxScale - this.minScale));
    };

    ImageExplorer.prototype.scaleToSliderVal = function(scale) {
        //Slider represents the range between maxScale and minScale, normalised as a percent (the HTML slider range is 0-100).
        var sliderValAsUnitInterval = (scale - this.minScale) / (this.maxScale - this.minScale);

        return sliderValAsUnitInterval * (this.$scaleSlider.attr('max') - this.$scaleSlider.attr('min'));
    };

    ImageExplorer.prototype.updateImageScale = function(newScale, zoomMode){
        var newWidth = Math.round(newScale * this.imageProperties.naturalWidth),
            newHeight = Math.round(newScale * this.imageProperties.naturalHeight),
            newMarginLeft,
            newMarginTop;

        zoomMode = zoomMode || this.options.zoomMode;

        switch (zoomMode) {
            case ImageExplorer.zoomModes.imageZoom:
                newMarginLeft = -1 * newWidth / 2;
                newMarginTop = -1 * newHeight / 2;
            break;

            case ImageExplorer.zoomModes.localZoom:
                var oldWidth = this.$sourceImage.width(),
                    oldHeight = this.$sourceImage.height(),
                    oldMarginLeft = parseInt(this.$sourceImage.css('margin-left'), 10),
                    oldMarginTop = parseInt(this.$sourceImage.css('margin-top'), 10),
                    sourceImagePosition = this.$sourceImage.position(), //Position top & left only. Doesn't take into account margins
                    imageViewCenterX = this.$imageView.width() / 2,
                    imageViewCenterY = this.$imageView.height() / 2,
                    //Which pixel is currently in the center of the mask? (assumes the mask is centered in the $imageView)
                    oldImageFocusX = imageViewCenterX - sourceImagePosition.left - oldMarginLeft,
                    oldImageFocusY = imageViewCenterY - sourceImagePosition.top - oldMarginTop,
                    //Where will that pixel be once the image is resized?
                    newImageFocusX = (oldImageFocusX / oldWidth) * newWidth,
                    newImageFocusY = (oldImageFocusY / oldHeight) * newHeight;

                //How many pixels do we need to shift the image to put the new focused pixel in the center of the mask?
                newMarginLeft = imageViewCenterX - sourceImagePosition.left - newImageFocusX;
                newMarginTop = imageViewCenterY - sourceImagePosition.top - newImageFocusY;
            break;
        }

        this.$sourceImage
            .width(newWidth)
            .height(newHeight)
            .css({
                'margin-left': Math.round(newMarginLeft) +'px',
                'margin-top': Math.round(newMarginTop) +'px'
            });
    };


    ImageExplorer.prototype.resetImagePosition = function(){
        this.$sourceImage.css({
            top: '50%',
            left: '50%'
        });
    };

    ImageExplorer.prototype.resetScaleSlider = function(initialValue){
        this.$scaleSlider
                .val(initialValue)
                .removeClass('disabled')
                .removeAttr('disabled');

        fdSlider.updateSlider(this.$scaleSlider.attr('id')); //fdSlider adds an id if the element didn't already have one.
    };

    ImageExplorer.prototype.toggleEmpty = function(toggle) {
        this.$container.toggleClass(this.options.emptyClass, toggle);
    };

    ImageExplorer.prototype.get$ImageView = function(){
        return this.$imageView;
    };

    ImageExplorer.prototype.get$SourceImage = function(){
        return this.$sourceImage;
    };

    ImageExplorer.prototype.get$Mask = function(){
        return this.$mask;
    };

    ImageExplorer.prototype.get$DragDelegate = function(){
        return this.$dragDelegate;
    };

    ImageExplorer.prototype.getMaskedImageProperties = function(){
        var currentScaleX = this.$sourceImage.width() / this.imageProperties.naturalWidth,
            currentScaleY = this.$sourceImage.height() / this.imageProperties.naturalHeight,
            maskPosition = this.$mask.position(),
            imagePosition = this.$sourceImage.position();

            maskPosition.top += parseInt(this.$mask.css('margin-top'), 10);
            maskPosition.left += parseInt(this.$mask.css('margin-left'), 10);

            imagePosition.top += parseInt(this.$sourceImage.css('margin-top'), 10);
            imagePosition.left += parseInt(this.$sourceImage.css('margin-left'), 10);

        return {
            maskedAreaImageX : Math.round((maskPosition.left - imagePosition.left) / currentScaleX),
            maskedAreaImageY : Math.round((maskPosition.top - imagePosition.top) / currentScaleY),
            maskedAreaWidth  : Math.round(this.$mask.width() / currentScaleX),
            maskedAreaHeight : Math.round(this.$mask.height() / currentScaleY)
        };
    };

    ImageExplorer.prototype.showError = function(title, contents) {
        this._removeError();
        this.toggleEmpty(true);
        this.$container.addClass('error');

        var $errorMessage = $(Handlebars.templates['aui-message']({
                type: 'error',
                title: title,
                contents: contents || '',
                closeable: true
            }));

        $errorMessage.appendTo(this.$imageView).css({
            'margin-top': -1 * $errorMessage.outerHeight() / 2
        });

        $errorMessage.on('messageClose', this._resetFromError);

        AJS.messages.setup();
    };

    ImageExplorer.prototype.clearError = function() {
        this._removeError();
        this._resetFromError();
    };

    ImageExplorer.prototype.hasValidImage = function(){
        return !!(this.getImageSrc() && this.$sourceImage.prop('naturalWidth'));
    };

    ImageExplorer.prototype._resetFromError = function(){
        // When the error is closed/removed, if there was a valid img in the explorer, show that,
        // otherwise keep displaying the 'empty' view
        // Might also need to do something in the caller (e.g. ImageUploadAndCrop) so fire an optional callback.
        var hasValidImage = this.hasValidImage();
        this.toggleEmpty(!hasValidImage);
        this.$container.removeClass('error');
        _.isFunction(this.options.onErrorReset) && this.options.onErrorReset(hasValidImage ? this.getImageSrc() : undefined);
    };

    ImageExplorer.prototype._removeError = function(){
        this.$imageView.find('.aui-message.error').remove();
    };

    return ImageExplorer;
})();