window.TextUtil = (function(){
    return {
        formatSizeInBytes : function(size) {
            // Convert the size to the most appropriate unit ('n units' where n < magnitudeStep and n >= 1)
            // and round to 1 decimal only if needed (so `1.72` becomes `1.7`, but `1.02` becomes `1`)
            var units = [' bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
                magnitudeStep = 1024,
                orderOfMagnitude = 0,
                maxMagnitude = units.length - 1;

            size = (typeof size === 'number') ? size : parseInt(size, 10);

            if (isNaN(size)) {
                return '';
            }

            while (size >= magnitudeStep && orderOfMagnitude < maxMagnitude) {
                size /= magnitudeStep;
                orderOfMagnitude++;
            }

            size = Math.floor((size * 10)) / 10; //Reduce to 1 decimal place only if required.
            return size + units[orderOfMagnitude];
        },
        abbreviateText: function(text, maxLength, opt_replacement) {
            //Abbreviate the text by removing characters from the middle and replacing them with a single instance of the replacement,
            // so that the total width of the new string is <= to `maxLength`
            if (typeof text !== 'string') {
                //trying to abbreviate a non-string is undefined
                return undefined;
            }
            if (isNaN(maxLength) || maxLength < 0 || text.length <= maxLength  ) {
                //if maxLength is not a number or less than zero, or if the text is shorter than the maxLength, return the original text
                return text;
            }

            var replacement = (typeof opt_replacement === 'string') ? opt_replacement : '…',
                removedCharCount = text.length - maxLength + replacement.length,
                textCenter = Math.round(text.length/2);

            return text.substring(0, textCenter - Math.ceil(removedCharCount/2)) + replacement +
                text.substring(textCenter + Math.floor(removedCharCount/2), text.length);
        }
    };
})();
