/**
 * Client JS for home page
 */

(function($) {
    $(document).ready(function() {
        $('#slide-list li').first().addClass('carousel-active');
        
        // Add homepage project carousel
        var sliding = false;
        $('.slider-move').bind('click', function(ev) {
            // Kill the default click event
            ev.preventDefault();
            
            // Only proceed if the carousel is not currently sliding
            if(sliding === false) {
                sliding = true;
                
                // Figure out which direction we should go
                var dir = ($(ev.target).hasClass('totheleft')) ? 'left' : 'right';

                // What is our current left-most image?
                var cur_image = $('#slide-list li.carousel-active');
                
                // What is the next image we want to go to?
                var next_image = (dir === 'left') ? $('#slide-list .carousel-active').next() : $('#slide-list .carousel-active').prev();

                // Only slide if there is an image to slide to
                if(next_image.length) {
                    // delta is the number of pixels to slide - this should be abstracted out to the 
                    console.log(cur_image.outerWidth(true));
                    var delta = 240;
                    var move_to = parseInt($('#slide-list').css('marginLeft'));
                    move_to = (dir === 'left') ? move_to - delta : move_to + delta;
                    console.log(move_to);
                
                    $('#slide-list').animate(
                        { marginLeft: move_to+'px'}, 
                        500, 
                        function() { 
                            cur_image.removeClass('carousel-active');
                            next_image.addClass('carousel-active');
                            sliding = false;
                        }
                    );
                }
            }
        });
    });
})(jQuery);