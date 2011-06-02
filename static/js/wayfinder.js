var wayfinder = {}

/**
 * An object that maniplates the interface based on wayfinder commands.
 */
wayfinder.projectPage = {
    hideSideContent : function () {
        var sideContent = $('#sidebar');
        sideContent.css('visibility', 'hidden');
    },
    
    showSideContent : function () {
        var sideContent = $('#sidebar');
        sideContent.css('visibility', 'visible');
    },
    
    hideTips : function () {
        var tips = $('.wizard-tip');
        tips.hide();
        this.showSideContent();
    },
    
    showTip : function (selector, goesInSide) {
        if (goesInSide) {
            this.hideSideContent();
        }
        
        $(selector).css('display', 'block');
        $(selector).slideDown({duration:'slow'});
    },
    
    addPhotograph : function () {
        this.hideSideContent();
    }
}


/**
 * ==== ADD MEDIA ====
 */

wayfinder.projectPage.showMediaTip = function () {
    this.showTip('.project_image-wizard-tip', false);
    
}
