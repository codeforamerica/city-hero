/**
 * Client JS for home page
 */

(function($) {
    $(document).ready(function() {
        $('slider-move-left').bind('click', function(ev) {
            ev.preventDefault();
            $('#slide-list').animate(
                { marginLeft: '-200px'}, 
                2000, 
                function() { 
                    console.log('complete'); 
                }
            );
        });
    });
})(jQuery);