/**
 * @fileoverview Utility functions
 */

/**
 * Take a number of objects and merge them into one.  In case of conflicts, the
 * attributes in the later objects will take precedence over the earlier ones.
 * This is useful for constructing a complete view context from several smaller
 * ones.
 */
exports.combine = function(/* context1, context2, ... */) {
    var combined_context = {},
        contexts = arguments,
        context_index,
        curr_context,
        key;
    
    for (context_index in contexts) {
        curr_context = contexts[context_index];
        for (key in curr_context) {
            combined_context[key] = curr_context[key];
        }
    }
    
    return combined_context;
}

exports.slugify = function(url) {
    return url.toLowerCase().replace(/[\'\.,\/#?!$%\^&\*;:{}=\-_`~()]/g,"").replace(/ /g,'-');
}