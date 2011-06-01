(function($) {
    $(document).ready(function() {
    
        $('.step-editable').hide();
        
        $('a[href^=#step-]:not(.step-editable)').click(function() {
            var $thisObj = $(this);
            var step = $thisObj.attr('href');
            step = step.split("#")[1]
            
            $('.' + step + '-editable').toggle('slow');;
            return false;
        });
        
    });
})(jQuery);