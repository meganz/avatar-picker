window.ClientFileReader = (function(){

    var fileReaderSupport = !!(window.File && window.FileList && window.FileReader);

    var _readMethodMap = {
        ArrayBuffer : 'readAsArrayBuffer',
        BinaryString: 'readAsBinaryString',
        DataURL : 'readAsDataURL',
        Text : 'readAsText'
    };

    function ClientFileReader(opts){
        if (!ClientFileReader.isSupported()) {
            throw new Error("ClientFileReader requires FileReaderAPI support");
        }
        return this.init(opts);
    }

    ClientFileReader.isSupported = function() {
        return fileReaderSupport;
    };

    $.extend(ClientFileReader.prototype, ClientFileHandler.prototype);



    ClientFileReader.readMethods = {
        ArrayBuffer : 'ArrayBuffer',
        BinaryString: 'BinaryString',
        DataURL : 'DataURL',
        Text : 'Text'
    };

    ClientFileReader.typeFilters = ClientFileHandler.typeFilters; //Expose this to the calling code

    ClientFileReader.prototype.defaults = $.extend({}, ClientFileHandler.prototype.defaults, {
        readMethod: ClientFileReader.readMethods.DataURL,
        onRead: $.noop
    });

    ClientFileReader.prototype.init = function(opts) {
        _.bindAll(this, 'onSuccess', 'readFile');
        ClientFileHandler.prototype.init.call(this, opts);

        this.options.onSuccess = this.onSuccess; //We don't want this to be optional.
        return this;
    };

    ClientFileReader.prototype.onSuccess = function(files) {
        var readMethod = _.has(_readMethodMap, this.options.readMethod) ? _readMethodMap[this.options.readMethod] : undefined;

        if (readMethod) {
            _.each(files, _.bind(function(file){
                var fileReader = new FileReader();
                fileReader.onload = _.bind(this.readFile, this, file); //pass the file handle to allow callback access to filename, size, etc.
                fileReader[readMethod](file);
            }, this));
        }
    };

    ClientFileReader.prototype.readFile = function(file, fileReaderEvent){
        _.isFunction(this.options.onRead) && this.options.onRead(fileReaderEvent.target.result, file);
    };

    return ClientFileReader;
})();
