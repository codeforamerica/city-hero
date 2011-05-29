process.env.NODE_ENV = 'test';

assert = require('assert');
controllers = require('controllers');

module.exports = {

    'calling create user with a facebook-like user document' : function() {
        var fbUserDoc;
        var getFbUserDoc = function() {
            return {  id: '13304355',
                      name: 'Joe Bloggs',
                      first_name: 'Joe',
                      last_name: 'Bloggs',
                      link: 'http://www.facebook.com/josephbloggs',
                      username: 'jbozey',
                      location: { id: '108363292521622', name: 'Oakland, California' },
                      quotes: '"The philosophers have only interpreted the world in various ways; the point, however, is to change it." - Karl Marx\r\n\r\n"Forward Ever, Backward Never!" - Kwame Nkrumah',
                      work: 
                       [ { employer: [Object],
                           location: [Object],
                           position: [Object],
                           start_date: '2011-01' },
                         { employer: [Object],
                           location: [Object],
                           position: [Object],
                           start_date: '2010-06' } ],
                      education: 
                       [ { school: [Object],
                           year: [Object],
                           type: 'High School' },
                         { school: [Object],
                           year: [Object],
                           concentration: [Object],
                           type: 'College' } ],
                      gender: 'male',
                      timezone: -7,
                      locale: 'en_US',
                      verified: true,
                      updated_time: '2011-05-10T18:58:25+0000',
                      fbAccessToken: '144849692255127|1.AQAOxbrfeg6PQuFl.3600.1305874800.1-13304355|POdvQvsZulM1MrubumgKsIH5_30&expires' }
        }
        
        fbUserDoc = getFbUserDoc();
    }

};
