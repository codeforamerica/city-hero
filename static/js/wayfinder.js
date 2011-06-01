/**
 * An object that maniplates the interface based on wayfinder commands.
 */
var projectPage = {
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
    
    showTip : function () {
        this.hideSideContent()
    },
    
    addPhotograph : function () {
        this.hideSideContent();
    }
}
