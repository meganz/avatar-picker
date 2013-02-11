window.CanvasCropper = (function(){
    function CanvasCropper(width, height){
        if (!CanvasCropper.isSupported()) {
            throw new Error("This browser doesn't support CanvasCropper.");
        }
        return this.init.apply(this, arguments);
    }

    var supportsCanvas = (function() {
        var canvas = document.createElement('canvas');
        return (typeof canvas.getContext === 'function') && canvas.getContext('2d');
    }());

    CanvasCropper.isSupported = function() {
        return supportsCanvas;
    };

    CanvasCropper.prototype.defaults = {
        outputFormat: 'image/png',
        backgroundFillColor: undefined
    };

    CanvasCropper.prototype.init = function(width, height, opts) {
        this.width = width;
        this.height = height || width; //Allow single param for square crop
        this.options = $.extend({}, this.defaults, opts);
        this.canvas = $('<canvas/>')
            .attr('width', this.width)
            .attr('height', this.height)
            [0];
        return this;
    };

    CanvasCropper.prototype.cropToDataURI = function(image, sourceX, sourceY, cropWidth, cropHeight) {
        return this
                .crop(image, sourceX, sourceY, cropWidth, cropHeight)
                .getDataURI(this.options.outputFormat);
    };

    CanvasCropper.prototype.crop = function(image, sourceX, sourceY, cropWidth, cropHeight) {
        var context = this.canvas.getContext('2d'),
            targetX = 0,
            targetY = 0,
            targetWidth = this.width,
            targetHeight = this.height;

        context.clearRect(targetX, targetY, targetWidth, targetHeight);

        if (this.options.backgroundFillColor) {
            context.fillStyle = this.options.backgroundFillColor;
            context.fillRect(targetX, targetY, targetWidth, targetHeight);
        }

        /*
         *** Negative sourceX or sourceY ***
         context.drawImage can't accept negative values for source co-ordinates,
         but what you probably meant is you want to do something like the below

         |-------------------|
         |                   |
         |   CROP AREA       |
         |                   |
         |        |----------|----------------|
         |        |          |                |
         |        |          |   IMAGE        |
         |        |          |                |
         |-------------------|                |
                  |                           |
                  |                           |
                  |                           |
                  |                           |
                  |---------------------------|

         We need to do a couple of things to make that work.
         1. Set the target position to the proportional location of the source position
         2. Set source co-ordinates to 0
         */

        if (sourceX < 0) {
            targetX = Math.round((Math.abs(sourceX) / cropWidth) * targetWidth);
            sourceX = 0;
        }

        if (sourceY < 0) {
            targetY = Math.round((Math.abs(sourceY) / cropHeight) * targetHeight);
            sourceY = 0;
        }

        /*
         *** source co-ordinate + cropSize > image size ***
         context.drawImage can't accept a source co-ordinate and a crop size where their sum
         is greater than the image size. Again, below is probably what you wanted to achieve.


         |---------------------------|
         |                           |
         |       IMAGE               |
         |                           |
         |                           |
         |               |-----------|-------|
         |               |           |       |
         |               |     X     |       |
         |               |           |       |
         |---------------|-----------|       |
                         |                   |
                         |   CROP AREA       |
                         |                   |
                         |-------------------|

         We need to do a couple of things to make that work also.
         1. Work out the size of the actual image area to be cropped (X).
         2. Get the proportional size of the target based on the above
         3. Set the crop size to the actual crop size.
         */

        if (sourceX + cropWidth > image.naturalWidth) {
            var newCropWidth = image.naturalWidth - sourceX;
            targetWidth *= newCropWidth / cropWidth;
            cropWidth = newCropWidth;
        }

        if (sourceY + cropHeight > image.naturalHeight) {
            var newCropHeight = image.naturalHeight - sourceY;
            targetHeight *= newCropHeight / cropHeight;
            cropHeight = newCropHeight;
        }

        context.drawImage(
            image,
            sourceX,
            sourceY,
            cropWidth,
            cropHeight,
            targetX,
            targetY,
            targetWidth,
            targetHeight
        );

        return this;
    };

    CanvasCropper.prototype.getDataURI = function(outputFormat) {
        if (outputFormat) { //TODO: Check if in array of valid mime types
            return this.canvas.toDataURL(outputFormat);
        } else {
            return null;
        }
    };

    return CanvasCropper;
})();
