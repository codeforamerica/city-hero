var wayfinder = {}

/**
 * An object that maniplates the interface based on wayfinder commands.
 */
wayfinder.projectPage = {
    hideSideContent : function () {
        var sideContent = $('#sidebar');
//        sideContent.css('visibility', 'hidden');
        sideContent.fadeOut();
    },
    
    showSideContent : function () {
        var sideContent = $('#sidebar');
//        sideContent.css('visibility', 'visible');
        sideContent.fadeIn();
    },
    
    hideTips : function () {
        var tips = $('.wizard-tip');
//        tips.hide();
        tips.fadeOut();
        this.showSideContent();
    },
    
    showTip : function (selector, goesInSide) {
        if (goesInSide) {
            this.hideSideContent();
        }
        
        $(selector).css('display', 'block');
//        $(selector).slideDown();
        $(selector).fadeIn();
    },
    
    addPhotograph : function () {
        this.hideSideContent();
    }
}


/**
 * ==== ADD MEDIA ====
 */

wayfinder.projectPage.toggleMediaTip = function () {
    $('div.project_image').slideToggle(function () {
        if ($('div.project_image').css('display') !== 'none') {
            wayfinder.projectPage.showTip('.project_image-wizard-tip', true);
        } else {
            wayfinder.projectPage.hideTips();
        }
    });
}

$(document).ready(function () {
    $('.project_image_action_cancel').click(wayfinder.projectPage.toggleMediaTip);
});
