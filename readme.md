#Avatar Picker
Recently in Stash we added [Project Avatars](https://confluence.atlassian.com/display/STASH/Stash+2.1+release+notes#Stash2.1releasenotes-ProjectAvatars). We wanted to have a really slick user experience for uploading, translating and cropping images to be used as avatars, so we built the **Avatar Picker**.

![Project Avatars](http://monosnap.com/image/quxJjJ3z90cpqC7tAVMGOFC4a.png)

Our goal was to do as much as on the client side as possible, which in the case of modern browsers, is quite a lot. One of the decisions that allowed this to happen was to drop IE8 support for this feature, and to use a fallback in IE9 which allowed most of the functionality to be done client side and only using the server where absolutely necessary. 

A key architectural decision was to build this feature out of a number of smaller components, which would allow us to combine them in different ways depending on browser support and to be extensible in the future (for example we could add an AJAX file upload component which utilises the existing drag and drop component to allow drag and drop attachments to pull request comments) 

The component that binds all the other components together is **ImageUploadAndCrop**. Generally you will be dealing directly with it rather than with the other components. This is the point of configuration and the attachment points for handlers for the workflow of selecting an image. In Stash we have another component, the **AvatarPickerDialog** that provides the avatar specific configuration, triggers a dialog containing an **ImageUploadAndCrop** and handles the cropped avatar. The returned dataURI by is added to a form POST which is sent to the server. On the server the dataURI is converted to an image file and saved to file system. 

Lets take a look at some of the other components in more detail. 

>You can check out the source for these components at [https://bitbucket.org/atlassianlabs/avatar-picker/src](https://bitbucket.org/atlassianlabs/avatar-picker/src) and there is a working demo hosted at [http://atlassianlabs.bitbucket.org/avatar-picker](http://atlassianlabs.bitbucket.org/avatar-picker)

##DragDropFileTarget and UploadInterceptor
These take care of the "adding a file" aspect of choosing an avatar. When a user drops a file onto the target, or selects a file from their filesystem, these intercept those events and pass the selection on to one of the **ClientFileHandlers** for processing. 

![inital](http://monosnap.com/image/KL8Gf6w6yyMPPpCFrPR0S79jX.png)![drag drop](http://monosnap.com/image/Rqz6ufY5OImsYMZsOad6ZEoUH.png)

##ClientFileHandler, ClientFileReader, ClientIframeUploader
**ClientFileHandler** is the base component, it takes a collection of [Files](https://developer.mozilla.org/en-US/docs/DOM/File), filters them by any supplied criteria (file type, size and count) and passes them on to a callback. **ClientFileReader** extends **ClientFileHandler** to use the HTML5 [FileReader](https://developer.mozilla.org/en-US/docs/DOM/FileReader) to read the file data into something that can be used in the browser (by default it's as a [dataURI](http://en.wikipedia.org/wiki/Data_URI_scheme)). **ClientIframeUploader** doesn't extend **ClientFileHandler**, it replaces it with a fallback that uses a hidden iframe to post the selected image to the server and pass the location of the uploaded file to the callback.  
If we wanted to implement the drag and drop attachment uploader mentioned above, we'd be able to create a **ClientFileAJAXUploader** that extended **ClientFileHandler** and turned Files into [FormData](https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/FormData/Using_FormData_Objects#Sending_files_using_a_FormData_object) that could be submitted via AJAX to the server (in modern browsers supporting [XHR2](http://caniuse.com/#feat=xhr2))

##ImageExplorer###
Once we have the image as either a client side dataURI or as a link to image hosted on the remote server, we can make it the source for the **ImageExplorer**, which handles masking, drag panning and zooming the image. 

![ImageExplorer](http://monosnap.com/image/dFtsznWM4qakNqUh8xYwr4EE5.png)

There's a couple neat tricks at work in the **ImageExplorer**. Firstly the mask is done with CSS only (no images). It's done by adding a very large box-shadow with no blur or spread and with an RGBA colour with an alpha channel set to < 1 to create the shadow. The `image-explorer-container` div has `overflow: hidden` so the visible area of the mask and the panned image are always contained within it.  
You can see the code for this below (we use [LESS](http://lesscss.org/) with some mixins that are hopefully self explanatory)

[image-explorer.less:86](https://bitbucket.org/atlassianlabs/avatar-picker/src/master/less/image-explorer.less?at=master#cl-86)

```
.image-explorer-mask {
    .box-shadow(0 0 0 1000px rgba(0,0,0,0.5));
    .centered(@mask-size);

    &.circle-mask {
        .circle(@mask-size);
    }

    &.square-mask {
        .square(@mask-size);
    }

    &.rounded-square-mask {
        .square(@mask-size);
        .border-radius(5px);
    }
}
```

As you can see, this makes it trivial to support different shaped masks and different shadow colours and levels of opacity. 

**ImageExplorer** does some calculations based on the natural image size to dynamically set the slider scale. It has a number of supported scale modes. The upper bound is always 100% of the natural image size which can be overriden by setting the `scaleMax` option. 

* Fill - Initially scale the image and set the slider lower bound to the minimum amount to completely fill the mask. 
* Contain - Initially scale the image and set the slider lower bound to the maximum amount that will completely fit inside the mask (this also takes into account fitting a square image completely inside a circular mask).
* ContainAndFill - This is the default and sets the inital scale to fill, and the lower bound for the slider to contain.

[image-explorer.js:142](https://bitbucket.org/atlassianlabs/avatar-picker/src/master/js/image-explorer.js?at=master#cl-142)  

```
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
```

**Fill vs Contain**  
![Fill](http://monosnap.com/image/2Nkec8ngaBONuOrcw9b91OTvT.png) ![Contain](http://monosnap.com/image/3BvGkNwiF7MgTxRG23KOLM64j.png)

The **ImageExplorer** has localised zooming, so that the zooming works more like Google Maps, whatever is in the centre of the viewport when you zoom in or out, stays in the centre of the viewport (it would otherwise get pushed away from the centre as you zoom in). It calculates the new margins required to keep the same area centred as the image size changes. 

[image-explorer.js:174](https://bitbucket.org/atlassianlabs/avatar-picker/src/master/js/image-explorer.js?at=master#cl-174)

```
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
```        
**Zoomed out and zoomed in**  
![zoomed out](http://monosnap.com/image/3StKce2MoGse8YVMOyhJNwJHo.png) ![zoomed in](http://monosnap.com/image/gZbwiRkJK5NcqF8BC1g7Rejix.png)


##CanvasCropper
Once you're happy with the masked image, the cropping is performed by **CanvasCropper**.  **ImageExplorer** supplies all the information about the masked area of the image and **CanvasCropper** uses this information to draw the masked area into an offscreen canvas element whose dimensions you specify and export it as a dataURI.  
One advantage of this method is that it uses a much of the pixel data from the original image as is available, so even if the size of the canvas is greater than the size of the masked area, it will use all of the original image's pixel data to produce the crop. We use this to produce retina ready images that are 2x their display size and take advantage of high resolution source images.  


##From us to you
We've made the code for the avatar picker available for you to read through and learn from for your own projects. The code is hosted at [https://bitbucket.org/atlassianlabs/avatar-picker/src](https://bitbucket.org/atlassianlabs/avatar-picker/src).  
If you want to play around with a demo of the whole process of selecting an image through to handling the cropped result, you can check out [http://atlassianlabs.bitbucket.org/avatar-picker](http://atlassianlabs.bitbucket.org/avatar-picker).







 
