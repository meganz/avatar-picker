(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['image-upload-and-crop'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return "empty";}

function program3(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "src=\"";
  foundHelper = helpers.imageSrc;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.imageSrc; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1) + "\"";
  return buffer;}

function program5(depth0,data) {
  
  
  return "disabled";}

function program7(depth0,data) {
  
  
  return "disabled";}

function program9(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n            <div class=\"description\">";
  foundHelper = helpers.description;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.description; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1) + "</div>\n        ";
  return buffer;}

function program11(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n            <div class=\"description fallback\">";
  foundHelper = helpers.fallbackDescription;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.fallbackDescription; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1) + "</div>\n        ";
  return buffer;}

function program13(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n            ";
  stack1 = depth0.description;
  stack2 = {};
  stack1 = helpers['if'].call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        ";
  return buffer;}
function program14(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n                <div class=\"description fallback\">";
  foundHelper = helpers.description;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.description; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1) + "</div>\n            ";
  return buffer;}

  buffer += "<div class=\"image-upload-and-crop-container\">\n    <div class=\"image-explorer-container ";
  stack1 = depth0.imageSrc;
  stack2 = {};
  stack1 = helpers.unless.call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n        <div class=\"image-explorer-image-view\">\n            <img class=\"image-explorer-source\" ";
  stack1 = depth0.imageSrc;
  stack2 = {};
  stack1 = helpers['if'].call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "/>\n            <div class=\"image-explorer-mask circle-mask\"></div>\n            <div class=\"image-explorer-drag-delegate\"></div>\n        </div>\n        <div class=\"image-explorer-scale-slider-wrapper\">\n            <input class=\"image-explorer-scale-slider ";
  stack1 = depth0.imageSrc;
  stack2 = {};
  stack1 = helpers.unless.call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\"\n                type=\"range\" min=\"0\" max=\"100\" step=\"1\" value=\"0\" ";
  stack1 = depth0.imageSrc;
  stack2 = {};
  stack1 = helpers.unless.call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "/>\n        </div>\n    </div>\n    <form class=\"aui\">\n        <input type=\"file\" id=\"image-upload-and-crop-upload-field\" class=\"image-upload-field\" accept=\"image/jpeg, image/gif, image/png\"/>\n        <label for=\"image-upload-and-crop-upload-field\" class=\"image-upload-field-replacement aui-button\">Select an image</label>\n        ";
  stack1 = depth0.description;
  stack2 = {};
  stack1 = helpers['if'].call(depth0, stack1, {hash:stack2,inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        ";
  stack1 = depth0.fallbackDescription;
  stack2 = {};
  stack1 = helpers['if'].call(depth0, stack1, {hash:stack2,inverse:self.program(13, program13, data),fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </form>\n</div>\n";
  return buffer;});
})();